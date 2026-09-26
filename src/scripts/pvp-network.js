/**
 * Passball P2P Network Module
 * Serverless real-time multiplayer using WebRTC DataChannels (via PeerJS).
 */
import { Peer } from 'peerjs';

export const EMOJIS = ['⚽', '🔥', '👏', '😱', '😂', '🧤'];

const ROOM_PREFIX = 'passball-v1-room-';
const OPEN_SLOT_PREFIX = 'passball-v1-open-';
/* The public ring the online list is drawn from: one PeerJS id per seat, so a
   waiting lobby is discoverable without any server of our own. */
const OPEN_SLOTS_COUNT = 10;
/* How long one sweep of the ring may take. Every seat is probed in parallel, so
   this is the whole budget, not a per-seat one. */
const OPEN_SCAN_TIMEOUT = 6000;
/* The kick-off countdown that precedes a matchmade game. */
export const START_COUNTDOWN_SECONDS = 5;

/* There are no accounts on the public ring, so a waiting lobby is announced
   under a friendly handle instead of a peer id. The handle is derived from the
   seat, never random: the same lobby reads the same to everybody scanning it. */
export const PLAYER_NAMES = [
    'CoolDog', 'SexyCat', 'SwiftFox', 'BraveOwl', 'NeonWolf', 'TinyBear',
    'IronPanda', 'LuckyDuck', 'WildHorse', 'SlickSeal', 'GrimLion', 'HappyGoat',
    'RocketBee', 'SilentMoth', 'TurboSnail', 'ZeroFalcon', 'CosmicBat', 'RoyalToad'
];

export function slotPlayerName(slot) {
    const i = Math.max(1, Math.round(Number(slot) || 1)) - 1;
    return PLAYER_NAMES[i % PLAYER_NAMES.length];
}

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
        /* Every seat opened by a list scan, so the ones that were not picked can
           be released the moment one of them is. */
        this.scanConns = [];
        /* The public seat this side is waiting on while the Quick Match tab is
           open. Entering the tab *is* opening a room: there is no separate host
           step. Kept on its own peer so list scans never tear it down. */
        this.openHostPeer = null;
        this.openHostSlot = null;
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

    /** Release every seat a scan left open (the others were only discovered). */
    closeScanConnections() {
        (this.scanConns || []).forEach(entry => {
            try { entry.conn.close(); } catch (e) {}
        });
        this.scanConns = [];
    }

    /** Reset any existing connection */
    cleanup() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
        this.closeScanConnections();
        this.releaseOpenSeat();
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

    /** Give up the public seat claimed for the Quick Match tab, if any. */
    releaseOpenSeat() {
        if (this.openHostPeer) {
            try { this.openHostPeer.destroy(); } catch (e) {}
            this.openHostPeer = null;
        }
        this.openHostSlot = null;
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
        /* A host may hold several unanswered connections at once — a scan opens
           one data channel per lobby it finds. The socket that completes the
           handshake is the only one that ever becomes `this.conn`, so a stray
           probe can neither steal the host's `send()` target nor make the host
           claim a match it has not got. */
        if (!isHost || !this.connected) this.conn = conn;
        if (!isHost || !this.role) this.role = isHost ? 'host' : 'guest';

        const sendGuestAuth = () => {
            if (!isHost) {
                this.rawSend({
                    type: 'AUTH',
                    password: this.guestPassword || ''
                });
                this.emit('status', 'Verifying room access...');
            }
        };

        // If the data channel is already open (e.g. probed while scanning),
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
                /* This is the connection that counts: adopt it explicitly, in
                   case a later probe arrived while the handshake was in flight. */
                this.conn = conn;
                this.role = 'host';
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

            /* The kick-off handshake. Both humans are asked to press START
               MATCH; the host turns "both ready" into the countdown packet so
               the two clocks are driven by the same decision. Kept outside the
               if/else chain above because it is a protocol message, not
               gameplay data. */
            if (data.type === 'START_REQUEST') {
                this.emit('start-request', data);
            } else if (data.type === 'START_COUNTDOWN') {
                this.emit('start-countdown', data);
            }
        });

        conn.on('close', () => {
            const wasLive = this.connected && this.conn === conn;
            if (this.conn === conn) this.connected = false;
            /* A scan leaves one unanswered connection per lobby it probed; those
               closing is silence, not an opponent walking out of a match. */
            if (!wasLive) return;
            this.emit('status', 'Opponent disconnected');
            this.emit('disconnected');
        });

        conn.on('error', (err) => {
            this.emit('error', err.message || 'Connection error');
        });
    }

    /** An inbound seat on a peer this side is hosting: only the handshake decides. */
    acceptHostConnection(conn) {
        if (this.connected) {
            /* The match is already on: there is no second seat to give away. */
            try { conn.close(); } catch (e) {}
            return;
        }
        this.emit('status', 'Opponent joining, checking authentication...');
        this.setupConnection(conn, true);
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

            this.peer.on('connection', (conn) => this.acceptHostConnection(conn));

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
     * Sweep the public ring. Every seat is probed at once, so one sweep is one
     * round trip instead of ten; each live seat becomes an entry in the online
     * list:
     *   { slot, label: 'Lobby #3', name: 'SwiftFox', conn }
     * The socket the probe opened is kept on the entry, so whoever the player
     * picks can be matched on that same data channel. The rest are released by
     * joinOpenPlayer()/closeScanConnections(). Resolves with [] when nobody is
     * hosting — the honest answer, not an error.
     */
    async scanOpenPlayers(onProgress, timeout = OPEN_SCAN_TIMEOUT, excludeSlot = null) {
        /* The scan runs on its own probe peer and never touches this.peer or
           the claimed open seat: entering the Quick Match tab means this side
           is *also* waiting on a seat, and the sweep must not tear that down. */
        this.closeScanConnections();
        this.emit('status', 'Scanning public lobbies...');
        if (onProgress) onProgress('Scanning public lobbies...');

        const found = [];
        const probePeer = new Peer(undefined, PEER_CONFIG);
        this.scanConns = found;

        return new Promise((resolve) => {
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                if (!found.length) {
                    try { probePeer.destroy(); } catch (e) {}
                }
                found.sort((a, b) => a.slot - b.slot);
                if (onProgress) {
                    onProgress(found.length
                        ? `${found.length} player(s) online.`
                        : 'No players online right now.');
                }
                resolve(found);
            };
            const timer = setTimeout(finish, timeout);

            probePeer.on('open', () => {
                for (let slot = 1; slot <= OPEN_SLOTS_COUNT; slot++) {
                    /* Never list our own waiting seat back to ourselves. */
                    if (excludeSlot && slot === excludeSlot) continue;
                    const seat = slot;
                    const conn = probePeer.connect(OPEN_SLOT_PREFIX + seat, { reliable: true });
                    conn.on('open', () => {
                        /* The sweep is over: this one opened a moment too late to
                           be offered, so it must not be left hanging either. */
                        if (done) { try { conn.close(); } catch (e) {} return; }
                        found.push({
                            slot: seat,
                            label: `Lobby #${seat}`,
                            name: slotPlayerName(seat),
                            conn
                        });
                    });
                    /* An empty seat never opens; PeerJS reports it as a
                       connection error. That is simply "nobody is here". */
                    conn.on('error', () => {});
                }
            });

            probePeer.on('error', (err) => {
                clearTimeout(timer);
                this.emit('error', err.message || 'Unable to scan for players');
                finish();
            });
        });
    }

    /** Take one of the lobbies a scan found as this side's opponent. */
    joinOpenPlayer(entry) {
        if (!entry || !entry.conn || !entry.conn.open) {
            return Promise.reject(new Error('That player is not available any more. Refresh the list.'));
        }
        /* Challenging someone else means we stop waiting on our own seat: it
           goes back into the ring for the next player. */
        this.releaseOpenSeat();
        /* Only the seat that was picked stays open: the others were discovery. */
        (this.scanConns || []).forEach(other => {
            if (other === entry) return;
            try { other.conn.close(); } catch (e) {}
        });
        this.scanConns = [entry];
        this.roomCode = entry.label;
        this.guestPassword = '';
        this.emit('status', `Connecting to ${entry.name}...`);

        return new Promise((resolve, reject) => {
            let settled = false;
            const settle = (fn, arg) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                this.off('connected', onConn);
                this.off('error', onErr);
                fn(arg);
            };
            const timer = setTimeout(
                () => settle(reject, new Error(`${entry.name} did not answer.`)), 10000);
            const onConn = () => settle(resolve, entry.label);
            const onErr = err => settle(reject, typeof err === 'string' ? new Error(err) : err);

            this.on('connected', onConn);
            this.on('error', onErr);
            /* The socket is already open, so the AUTH handshake goes out at once
               and the host answers on this same channel. */
            this.setupConnection(entry.conn, false);
        });
    }

    /**
     * Claim a public seat for the Quick Match tab. Entering the tab *is*
     * opening a room, so this runs the moment the tab opens and returns at
     * once with the claimed seat — { slot, label, name } — instead of waiting
     * for a challenger. The seat stays claimed (and listed to everyone else)
     * until releaseOpenSeat() runs: a challenger who connects triggers the
     * usual 'connected' handshake on the host side. Returns null when every
     * seat in the ring is taken.
     */
    async claimOpenSeat(onProgress) {
        this.releaseOpenSeat();

        for (let slot = 1; slot <= OPEN_SLOTS_COUNT; slot++) {
            if (onProgress) onProgress(`Joining the open lobby as ${slotPlayerName(slot)}...`);
            const hostPeer = new Peer(OPEN_SLOT_PREFIX + slot, PEER_CONFIG);
            /* Attached before the seat is claimed: a challenger can knock the
               moment the seat appears in somebody's sweep. */
            hostPeer.on('connection', conn => this.acceptHostConnection(conn));

            const claimed = await new Promise((resolve) => {
                let settled = false;
                const settle = ok => { if (settled) return; settled = true; resolve(ok); };
                const timer = setTimeout(() => settle(false), 4000);
                hostPeer.on('open', () => { clearTimeout(timer); settle(true); });
                hostPeer.on('error', () => { clearTimeout(timer); settle(false); });
            });

            if (!claimed) {
                try { hostPeer.destroy(); } catch (e) {}
                continue;
            }

            this.openHostPeer = hostPeer;
            this.openHostSlot = slot;
            this.roomCode = `OPEN-${slot}`;
            this.roomPassword = '';
            hostPeer.on('error', err => this.emit('error', err.message || 'Lobby error'));
            this.emit('status', `You are listed as ${slotPlayerName(slot)} — waiting for an opponent...`);
            return { slot, label: `Lobby #${slot}`, name: slotPlayerName(slot) };
        }

        this.emit('status', 'Every public lobby is taken right now.');
        return null;
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

    /**
     * The guest's half of the kick-off handshake: "I have pressed START MATCH".
     * `auto` marks a matchmade game — the challenger picked this lobby off the
     * online list, so the host may accept on its own behalf instead of waiting
     * for a second click. `settings` are the dials the challenger picked; the
     * host applies them before it broadcasts the countdown, so both sides run
     * the same clock.
     */
    sendStartRequest({ auto = false, settings = null } = {}) {
        this.send({ type: 'START_REQUEST', auto: auto === true, settings });
    }

    /** The host's half: the one decision both countdowns are driven from. */
    sendStartCountdown({ seconds = START_COUNTDOWN_SECONDS, settings = null } = {}) {
        this.send({ type: 'START_COUNTDOWN', seconds, settings });
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
