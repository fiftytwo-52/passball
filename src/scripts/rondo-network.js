/**
 * Passball Rondo Network Module
 * Online keep-away for 4–7 players. Star topology over PeerJS: one host holds
 * a data channel to every guest, and the host is the authority for the lobby
 * roster and every turn. Guests never talk to each other.
 */
import { Peer } from 'peerjs';

const RONDO_PREFIX = 'passball-v1-rondo-';
const PEER_CONFIG = {
    debug: 0,
};

export const RONDO_MIN_PLAYERS = 4;
export const RONDO_MAX_PLAYERS = 7;

/** Generate a clean 4-letter room code. */
export function rondoRoomCode() {
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    return code;
}

function uid() {
    return 'p' + Math.random().toString(36).slice(2, 10);
}

export class RondoNet extends EventTarget {
    constructor() {
        super();
        this.peer = null;
        this.isHost = false;
        this.roomCode = null;
        this.myId = uid();
        this.myName = '';
        this.hostConn = null;          // guest side: the single uplink
        this.guests = new Map();       // host side: id -> { id, name, conn }
        this.connected = false;
        this._seen = new Set();        // dedupe connection ids
    }

    emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail }));
    }

    on(name, fn) {
        this.addEventListener(name, (e) => fn(e.detail));
    }

    cleanup() {
        try { if (this.hostConn) this.hostConn.close(); } catch (e) {}
        for (const g of this.guests.values()) {
            try { g.conn.close(); } catch (e) {}
        }
        this.guests.clear();
        try { if (this.peer) this.peer.destroy(); } catch (e) {}
        this.peer = null;
        this.hostConn = null;
        this.isHost = false;
        this.connected = false;
        this.roomCode = null;
        this._seen.clear();
    }

    /* ------------------------------------------------------------------ */
    /* Host                                                                */
    /* ------------------------------------------------------------------ */

    /** Open a rondo room. Resolves with the room code once the peer is live. */
    hostRoom(name) {
        this.cleanup();
        this.isHost = true;
        this.myName = (name || 'Host').slice(0, 16) || 'Host';
        const code = rondoRoomCode();
        this.roomCode = code;

        return new Promise((resolve, reject) => {
            const peer = new Peer(RONDO_PREFIX + code, PEER_CONFIG);
            this.peer = peer;

            peer.on('open', () => {
                this.connected = true;
                this.emit('status', `Room ${code} open — waiting for players (${RONDO_MIN_PLAYERS}–${RONDO_MAX_PLAYERS}).`);
                this.emit('lobby', this.roster());
                resolve(code);
            });

            peer.on('connection', (conn) => this._onGuestConn(conn));
            peer.on('error', (err) => {
                if (err && err.type === 'unavailable-id') {
                    // Code collision: try once more with a fresh code.
                    this.cleanup();
                    this.hostRoom(name).then(resolve, reject);
                    return;
                }
                this.emit('error', (err && err.message) || 'Could not open a rondo room.');
                reject(err);
            });
        });
    }

    _onGuestConn(conn) {
        const key = conn.peer;
        if (this._seen.has(key)) { try { conn.close(); } catch (e) {} return; }
        this._seen.add(key);

        conn.on('open', () => {
            // Wait for the JOIN message carrying the player's name.
        });

        conn.on('data', (data) => {
            if (!data || typeof data !== 'object') return;
            if (data.type === 'RONDO_JOIN') {
                this._admitGuest(conn, String(data.name || 'Player').slice(0, 16) || 'Player', String(data.id || ''));
            } else if (data.type === 'RONDO_PASS' || data.type === 'RONDO_GUESS' || data.type === 'RONDO_LEAVE') {
                const guest = this._guestByConn(conn);
                this.emit('guestmsg', { from: guest ? guest.id : null, msg: data });
            }
        });

        conn.on('close', () => this._dropGuest(conn));
        conn.on('error', () => this._dropGuest(conn));

        // If the room is already full, turn the guest away politely.
        if (this.guests.size >= RONDO_MAX_PLAYERS - 1) {
            conn.on('open', () => {
                try { conn.send({ type: 'RONDO_FULL' }); } catch (e) {}
                setTimeout(() => { try { conn.close(); } catch (e) {} }, 200);
            });
        }
    }

    _admitGuest(conn, name, id) {
        if (this.guests.size >= RONDO_MAX_PLAYERS - 1) {
            try { conn.send({ type: 'RONDO_FULL' }); } catch (e) {}
            setTimeout(() => { try { conn.close(); } catch (e) {} }, 200);
            return;
        }
        // One seat per connection; re-join on the same socket replaces the name.
        const existing = this._guestByConn(conn);
        const pid = (existing && existing.id) || (id || uid());
        // Name clash: keep both, the roster shows them apart by seat number.
        this.guests.set(pid, { id: pid, name, conn });
        try {
            conn.send({ type: 'RONDO_WELCOME', id: pid, players: this.roster(), code: this.roomCode });
        } catch (e) {}
        this.emit('lobby', this.roster());
        this.emit('status', `${name} joined (${this.roster().length}/${RONDO_MAX_PLAYERS}).`);
    }

    _guestByConn(conn) {
        for (const g of this.guests.values()) if (g.conn === conn) return g;
        return null;
    }

    _dropGuest(conn) {
        const g = this._guestByConn(conn);
        if (!g) return;
        this.guests.delete(g.id);
        this.emit('guestleft', { id: g.id, name: g.name });
        this.emit('lobby', this.roster());
        this.emit('status', `${g.name} left (${this.roster().length}/${RONDO_MAX_PLAYERS}).`);
    }

    roster() {
        const list = [{ id: this.myId, name: this.myName, host: true }];
        for (const g of this.guests.values()) list.push({ id: g.id, name: g.name, host: false });
        return list;
    }

    /** Host -> every guest. */
    broadcast(msg) {
        const raw = JSON.stringify(msg);
        for (const g of this.guests.values()) {
            try { g.conn.send(JSON.parse(raw)); } catch (e) {}
        }
    }

    /** Host -> one guest. */
    sendTo(id, msg) {
        const g = this.guests.get(id);
        if (!g) return;
        try { g.conn.send(JSON.parse(JSON.stringify(msg))); } catch (e) {}
    }

    /* ------------------------------------------------------------------ */
    /* Guest                                                               */
    /* ------------------------------------------------------------------ */

    /** Join a rondo room by code. Resolves once the host welcomes us. */
    joinRoom(code, name) {
        this.cleanup();
        this.isHost = false;
        this.myName = (name || 'Player').slice(0, 16) || 'Player';
        this.roomCode = String(code || '').toUpperCase().trim();

        return new Promise((resolve, reject) => {
            const peer = new Peer(undefined, PEER_CONFIG);
            this.peer = peer;
            let settled = false;

            const fail = (msg) => {
                if (settled) return;
                settled = true;
                this.cleanup();
                reject(new Error(msg));
            };

            peer.on('open', () => {
                const conn = peer.connect(RONDO_PREFIX + this.roomCode, { reliable: true });
                this.hostConn = conn;

                conn.on('open', () => {
                    try {
                        conn.send({ type: 'RONDO_JOIN', id: this.myId, name: this.myName });
                    } catch (e) { fail('Could not reach the room.'); }
                });

                conn.on('data', (data) => {
                    if (!data || typeof data !== 'object') return;
                    if (data.type === 'RONDO_WELCOME') {
                        if (settled) return;
                        settled = true;
                        if (data.id) this.myId = data.id;
                        this.connected = true;
                        this.emit('status', `Joined room ${this.roomCode}.`);
                        this.emit('lobby', data.players || []);
                        resolve(data);
                    } else if (data.type === 'RONDO_FULL') {
                        fail('That room is full (7 players).');
                    } else if (data.type === 'RONDO_HOSTMSG') {
                        this.emit('hostmsg', data.msg);
                    }
                });

                conn.on('close', () => {
                    if (!settled) fail('Room not found. Check the code.');
                    else this.emit('disconnected', {});
                });
                conn.on('error', () => {
                    if (!settled) fail('Room not found. Check the code.');
                });
            });

            peer.on('error', (err) => {
                if (!settled) fail((err && err.message) || 'Could not join the room.');
            });

            setTimeout(() => { if (!settled) fail('Join timed out. Check the code.'); }, 12000);
        });
    }

    /** Guest -> host. */
    sendToHost(msg) {
        if (!this.hostConn) return;
        try { this.hostConn.send(JSON.parse(JSON.stringify(msg))); } catch (e) {}
    }

    /** Host wraps a game message for guests; guests never call this. */
    hostSend(msg) {
        this.broadcast({ type: 'RONDO_HOSTMSG', msg });
    }
}
