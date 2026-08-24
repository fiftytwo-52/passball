/* ================= Audio (feedback layer only) ================= */

let audioCtx;

export function unlockAudio() {
    try { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { /* optional */ }
}

function tone(freq, dur, type = 'sine', vol = .05, delay = 0) {
    try {
        audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
        const t0 = audioCtx.currentTime + delay;
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + .012);
        g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
        o.connect(g).connect(audioCtx.destination);
        o.start(t0); o.stop(t0 + dur + .02);
    } catch (_) { /* optional */ }
}

export const sfx = {
    pass: () => { tone(300, .09, 'triangle', .04); tone(430, .12, 'triangle', .03, .06); },
    intercept: () => { tone(150, .16, 'sawtooth', .06); tone(92, .22, 'sawtooth', .05, .08); },
    goal: () => { tone(392, .18, 'triangle', .06); tone(523, .22, 'triangle', .06, .12); tone(659, .32, 'triangle', .05, .25); },
    save: () => { tone(220, .14, 'sine', .05); tone(160, .2, 'sine', .04, .1); },
    whistle: () => { tone(880, .12, 'square', .03); tone(880, .22, 'square', .03, .18); },
    lock: () => tone(520, .07, 'triangle', .03),
    lost: () => { tone(200, .2, 'square', .04); tone(140, .28, 'square', .035, .1); }
};
