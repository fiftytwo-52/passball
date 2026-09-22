/**
 * Passball P2P Network Module
 * Serverless real-time multiplayer using WebRTC DataChannels (via PeerJS).
 */
import { Peer } from 'peerjs';

export const EMOJIS = ['⚽', '🔥', '👏', '😱', '😂', '🧤'];

const ROOM_PREFIX = 'passball-v1-room-';
const OPEN_SLOT_PREFIX = 'passball-v1-open-';
const OPEN_SLOTS_COUNT = 8;

class PvpNetwork {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.role = null;         // 'host' | 'guest'
        this.roomCode = null;
        this.roomPassword = '';
        this.guestPassword = '';
        this.connected = false;
        this.ping = 0;
        this.pingTimer = null;
        this.listeners = {};
        this.callbacks = {
            onState: null,
            onInput: null,
            onEmoji: null,
            onConnected: null,
            onDisconnected: null,
            onError: null,
            onStatus: null
        };
    }

    get isConnected() {
        return this.connected;
    }

    on(evt, fn) {
        const norm = evt.toLowerCase().replace(/^on/, '');
        if (!this.listeners[norm]) this.listeners[norm] = [];
        this.listeners[norm].push(fn);
        return this;
    }

    off(evt, fn) {
        const norm = evt.toLowerCase().replace(/^on/, '');
        if (!this.listeners[norm]) return;
        this.listeners[norm] = this.listeners[norm].filter(cb => cb !== fn);
    }

    setCallback(evt, fn) {
        this.callbacks[evt] = fn;
    }

    emit(evt, ...args) {
        const norm = evt.toLowerCase().replace(/^on/, '');
        if (this.callbacks[evt]) {
            try { this.callbacks[evt](...args); } catch (e) { console.error(e); }
        }
        const legacyKey = 'on' + norm.charAt(0).toUpperCase() + norm.slice(1);
        if (legacyKey !== evt && this.callbacks[legacyKey]) {
            try { this.callbacks[legacyKey](...args); } catch (e) { console.error(e); }
        }
        if (this.listeners[norm]) {
            this.listeners[norm].forEach(fn => {
                try { fn(...args); } catch (e) { console.error(e); }
            });
        }
    }

    /** Generate a clean 4-digit room code */
    generateRoomCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /** Reset any existing connection */
    cleanup() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        this.role = null;
        this.roomCode = null;
        this.roomPassword = '';
        this.guestPassword = '';
        this.connected = false;
        this.ping = 0;
    }

    disconnect() {
        this.cleanup();
    }

    /** Start latency tracking */
    startPing() {
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
            if (this.connected && this.conn) {
                this.send({ type: 'PING', t: performance.now() });
            }
        }, 1500);
    }

    /** Setup listeners on the WebRTC data channel */
    setupConnection(conn, isHost) {
        this.conn = conn;
        this.role = isHost ? 'host' : 'guest';

        conn.on('open', () => {
            if (!isHost) {
                // Guest sends credentials to host immediately upon channel open
                this.send({
                    type: 'AUTH',
                    password: this.guestPassword || ''
                });
                this.emit('status', 'Verifying room access...');
            }
        });

        conn.on('data', (data) => {
            if (!data) return;

            // Authentication Handshake
            if (isHost && data.type === 'AUTH') {
                const required = this.roomPassword || '';
                const provided = (data.password || '').trim();
                if (required && required !== provided) {
                    try {
                        conn.send({ type: 'AUTH_FAIL', reason: 'Incorrect room password.' });
                    } catch (e) {}
                    setTimeout(() => {
                        try { conn.close(); } catch (e) {}
                    }, 150);
                    this.emit('status', 'Opponent entered incorrect password.');
                    return;
                }

                // Password verified or room has no password
                try {
                    conn.send({ type: 'AUTH_OK' });
                } catch (e) {}
                this.connected = true;
                this.startPing();
                this.emit('status', 'Connected to opponent!');
                this.emit('connected', { role: this.role, roomCode: this.roomCode });
                return;
            }

            if (!isHost && data.type === 'AUTH_OK') {
                this.connected = true;
                this.startPing();
                this.emit('status', 'Connected to opponent!');
                this.emit('connected', { role: this.role, roomCode: this.roomCode });
                return;
            }

            if (!isHost && data.type === 'AUTH_FAIL') {
                this.connected = false;
                const reason = data.reason || 'Incorrect room password.';
                this.emit('error', reason);
                this.emit('status', reason);
                this.cleanup();
                return;
            }

            // Gameplay & Diagnostics Data
            if (data.type === 'PING') {
                this.send({ type: 'PONG', t: data.t });
            } else if (data.type === 'PONG') {
                this.ping = Math.round(performance.now() - data.t);
                this.emit('ping', this.ping);
                this.emit('status', `Ping: ${this.ping} ms`);
            } else if (data.type === 'STATE') {
                this.emit('state', data);
            } else if (data.type === 'INPUT') {
                this.emit('input', data);
            } else if (data.type === 'EMOJI') {
                this.emit('emoji', data.emoji || data);
            }
        });

        conn.on('close', () => {
            this.connected = false;
            this.emit('status', 'Opponent disconnected');
            this.emit('disconnected');
        });

        conn.on('error', (err) => {
            this.emit('error', err.message || 'Connection error');
        });
    }

    /** Create a custom private room with a code and optional password */
    createCustomRoom(code = this.generateRoomCode(), password = '') {
        this.cleanup();
        this.roomCode = code;
        this.roomPassword = (password || '').trim();
        const peerId = ROOM_PREFIX + code;

        this.emit('status', `Creating room ${code}...`);
        this.peer = new Peer(peerId, { debug: 0 });

        return new Promise((resolve, reject) => {
            this.peer.on('open', (id) => {
                this.emit('status', `Room ${code} created. Waiting for opponent...`);
                resolve(code);
            });

            this.peer.on('connection', (conn) => {
                this.emit('status', 'Opponent joining, checking authentication...');
                this.setupConnection(conn, true);
            });

            this.peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    // Code collision, retry with new code
                    resolve(this.createCustomRoom(this.generateRoomCode(), password));
                } else {
                    this.emit('error', err.message || 'Peer initialization error');
                    reject(err);
                }
            });
        });
    }

    /** Join a custom room using code and optional password */
    joinCustomRoom(code, password = '') {
        this.cleanup();
        this.roomCode = (code || '').trim().toUpperCase();
        this.guestPassword = (password || '').trim();
        const targetId = ROOM_PREFIX + this.roomCode;

        this.emit('status', `Connecting to room ${this.roomCode}...`);
        this.peer = new Peer(undefined, { debug: 0 });

        return new Promise((resolve, reject) => {
            let settled = false;
            const timeout = setTimeout(() => {
                if (settled) return;
                settled = true;
                this.cleanup();
                reject(new Error('Connection timed out. Check room code.'));
            }, 10000);

            const onConn = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                this.off('connected', onConn);
                this.off('error', onErr);
                resolve(this.roomCode);
            };

            const onErr = (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                this.off('connected', onConn);
                this.off('error', onErr);
                reject(typeof err === 'string' ? new Error(err) : err);
            };

            this.on('connected', onConn);
            this.on('error', onErr);

            this.peer.on('open', () => {
                const conn = this.peer.connect(targetId, { reliable: true });
                this.setupConnection(conn, false);
            });

            this.peer.on('error', (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                this.off('connected', onConn);
                this.off('error', onErr);
                this.emit('error', err.message || 'Unable to join room');
                reject(err);
            });
        });
    }

    /** Host an open room in a public matchmaking slot */
    async hostOpenRoom() {
        this.cleanup();
        this.emit('onStatus', 'Searching for available open lobby slot...');

        // Try binding to one of the open slots
        for (let i = 1; i <= OPEN_SLOTS_COUNT; i++) {
            const slotId = OPEN_SLOT_PREFIX + i;
            const bound = await new Promise((res) => {
                const testPeer = new Peer(slotId, { debug: 0 });
                testPeer.on('open', () => {
                    this.peer = testPeer;
                    this.roomCode = `OPEN-${i}`;
                    res(true);
                });
                testPeer.on('error', () => {
                    try { testPeer.destroy(); } catch (e) {}
                    res(false);
                });
            });

            if (bound) {
                this.emit('onStatus', `Open room active (Lobby #${i}). Waiting for players...`);
                this.peer.on('connection', (conn) => {
                    this.emit('onStatus', 'Player connected! Starting match...');
                    this.setupConnection(conn, true);
                });
                return `Lobby #${i}`;
            }
        }

        throw new Error('All public lobby slots are currently full. Please create a custom room!');
    }

    /** Search for an existing open room in public matchmaking slots */
    async searchOpenRoom(onProgress) {
        this.cleanup();
        this.emit('onStatus', 'Scanning for open rooms...');

        // Probe slots 1..OPEN_SLOTS_COUNT
        for (let i = 1; i <= OPEN_SLOTS_COUNT; i++) {
            if (onProgress) onProgress(i, OPEN_SLOTS_COUNT);
            const slotId = OPEN_SLOT_PREFIX + i;

            const found = await new Promise((res) => {
                const probePeer = new Peer(undefined, { debug: 0 });
                const timer = setTimeout(() => {
                    try { probePeer.destroy(); } catch (e) {}
                    res(false);
                }, 1400);

                probePeer.on('open', () => {
                    const conn = probePeer.connect(slotId, { reliable: true });
                    conn.on('open', () => {
                        clearTimeout(timer);
                        this.peer = probePeer;
                        this.roomCode = `OPEN-${i}`;
                        this.setupConnection(conn, false);
                        res(true);
                    });
                });

                probePeer.on('error', () => {
                    clearTimeout(timer);
                    try { probePeer.destroy(); } catch (e) {}
                    res(false);
                });
            });

            if (found) {
                this.emit('onStatus', `Matched with open room #${i}!`);
                return `Lobby #${i}`;
            }
        }

        return null; // Not found
    }

    findOpenMatch(onProgress) {
        return this.searchOpenRoom(onProgress);
    }

    hostOpenMatch() {
        return this.hostOpenRoom();
    }

    /** Send data packet over WebRTC */
    send(data) {
        if (this.connected && this.conn && this.conn.open) {
            try {
                this.conn.send(data);
            } catch (e) {
                console.warn('Network send error', e);
            }
        }
    }

    /** Send Emoji Reaction */
    sendEmoji(emoji) {
        this.send({
            type: 'EMOJI',
            emoji,
            sender: this.role
        });
        // Also trigger locally
        this.emit('onEmoji', {
            type: 'EMOJI',
            emoji,
            sender: this.role,
            isLocal: true
        });
    }

    /** Send Player Input */
    sendInput(input) {
        this.send({
            type: 'INPUT',
            ...input,
            sender: this.role
        });
    }

    /** Send Authoritative State (Host only) */
    sendState(state) {
        if (this.role === 'host') {
            this.send({
                type: 'STATE',
                ...state
            });
        }
    }
}

export const pvp = new PvpNetwork();
