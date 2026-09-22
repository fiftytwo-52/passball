/**
 * Passball P2P Network Module
 * Serverless real-time multiplayer using WebRTC DataChannels (via PeerJS).
 */
import { Peer } from 'peerjs';

export const EMOJIS = ['⚽', '🔥', '👏', '😱', '😂', '🧤'];

const ROOM_PREFIX = 'passball-v1-room-';
const OPEN_SLOT_PREFIX = 'passball-v1-open-';
const OPEN_SLOTS_COUNT = 4;

const PEER_CONFIG = {
    debug: 1,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    }
};

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

        const sendGuestAuth = () => {
            if (!isHost) {
                this.rawSend({
                    type: 'AUTH',
                    password: this.guestPassword || ''
                });
                this.emit('status', 'Verifying room access...');
            }
        };

        // If the data channel is already open (e.g. probed in findOpenMatch),
        // send AUTH immediately rather than waiting for a second 'open' event.
        if (conn.open) {
            sendGuestAuth();
        } else {
            conn.on('open', () => {
                sendGuestAuth();
            });
        }

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
        this.peer = new Peer(peerId, PEER_CONFIG);

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
        this.peer = new Peer(undefined, PEER_CONFIG);

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

    /**
     * Unified Online Matchmaking:
     * 1. Checks open slots for a waiting host.
     * 2. If a host is found, joins immediately as guest.
     * 3. If no host is found, automatically hosts open lobby and waits for an opponent.
     */
    async findOpenMatch(onProgress) {
        this.cleanup();
        this.emit('status', 'Scanning for waiting players...');

        for (let i = 1; i <= OPEN_SLOTS_COUNT; i++) {
            if (onProgress) onProgress(`Checking open lobby #${i}...`);
            const slotId = OPEN_SLOT_PREFIX + i;

            const foundHost = await new Promise((resolve) => {
                const probePeer = new Peer(undefined, PEER_CONFIG);
                let settled = false;

                const timer = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    try { probePeer.destroy(); } catch (e) {}
                    resolve(false);
                }, 1800);

                probePeer.on('open', () => {
                    const conn = probePeer.connect(slotId, { reliable: true });

                    conn.on('open', () => {
                        if (settled) return;
                        settled = true;
                        clearTimeout(timer);
                        this.peer = probePeer;
                        this.roomCode = `OPEN-${i}`;
                        this.setupConnection(conn, false);
                        resolve(true);
                    });

                    conn.on('error', () => {
                        if (settled) return;
                        settled = true;
                        clearTimeout(timer);
                        try { probePeer.destroy(); } catch (e) {}
                        resolve(false);
                    });
                });

                probePeer.on('error', () => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    try { probePeer.destroy(); } catch (e) {}
                    resolve(false);
                });
            });

            if (foundHost) {
                this.emit('status', `Connected to player in Lobby #${i}!`);
                return `Lobby #${i}`;
            }
        }

        // Step 2: No active host found. Automatically host on slot 1 and wait for opponent!
        if (onProgress) onProgress('Waiting for an opponent in lobby...');
        this.emit('status', 'Lobby created. Waiting for opponent to join...');

        return new Promise((resolve, reject) => {
            const slotId = OPEN_SLOT_PREFIX + '1';
            const hostPeer = new Peer(slotId, PEER_CONFIG);
            this.peer = hostPeer;
            this.roomCode = 'OPEN-1';

            hostPeer.on('open', () => {
                if (onProgress) onProgress('Lobby ready. Waiting for opponent to join...');
                this.emit('status', 'Lobby ready. Waiting for opponent to join...');

                hostPeer.on('connection', (conn) => {
                    this.emit('status', 'Opponent joining...');
                    this.setupConnection(conn, true);
                    // Resolve only after AUTH handshake completes (connected event),
                    // not on the PeerJS signaling connection event.
                    const onConn = () => {
                        this.off('connected', onConn);
                        resolve('Lobby #1');
                    };
                    this.on('connected', onConn);
                });
            });

            hostPeer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    // Slot 1 was just claimed by another host, retry to connect to them!
                    resolve(this.findOpenMatch(onProgress));
                } else {
                    this.emit('error', err.message || 'Matchmaking error');
                    reject(err);
                }
            });
        });
    }

    searchOpenRoom(onProgress) {
        return this.findOpenMatch(onProgress);
    }

    hostOpenMatch() {
        return this.findOpenMatch();
    }

    /** Send data packet over WebRTC (only works after AUTH handshake) */
    send(data) {
        if (this.connected && this.conn && this.conn.open) {
            try {
                this.conn.send(data);
            } catch (e) {
                console.warn('Network send error', e);
            }
        }
    }

    /** Send data packet unconditionally (for AUTH handshake before connected) */
    rawSend(data) {
        if (this.conn && this.conn.open) {
            try {
                this.conn.send(data);
            } catch (e) {
                console.warn('Network rawSend error', e);
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
