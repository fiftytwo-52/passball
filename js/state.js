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
    carrier: null,
    diveChoice: 0,           // human keeper command: -1 / 0 / +1
    guessIdx: null,          // human's guessed receiver index (defending)
    drag: null,
    banner: null,
    bannerAge: 0,
    resolveCtx: null
};
