/* ================= Central game state ================= */

export const state = {
    mode: 'menu',            // menu | decision | resolve | result | end
    role: 'attack',          // human role this play
    possession: 'you',
    score: [0, 0],
    play: 1,
    remaining: 10.0,
    locked: false,
    selected: 0,             // index among attacking team's outfield (the receiver)
    userSelected: false,     // has the human explicitly tapped a receiver this play?
    carrier: null,
    diveChoice: 0,           // human keeper command: -1 / 0 / +1
    guessIdx: null,          // human's guessed receiver index (defending)
    drag: null,
    pan: { x: 0, z: 0 },     // camera pan offset from dragging blank space
    shotCall: null,          // -1 left corner · +1 right corner · null none
    banner: null,
    bannerAge: 0,
    resolveCtx: null
};
