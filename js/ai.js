/* ================= CPU opponent choices (weighted, blind to your secrets) ================= */

import { clamp, rand } from './config.js';
import { dist2d } from './config.js';
import { state } from './state.js';
import { outfield, holdBall } from './entities.js';

/** CPU attack: pick the most dangerous open receiver + send a runner. */
export function cpuAttackChoices() {
    const aOut = outfield('cpu');
    // keep continuity: an existing CPU carrier (from a completed pass) stays on the ball
    const carrier = state.carrier && state.carrier.team === 'cpu' ? state.carrier : aOut[0];
    state.carrier = carrier;
    holdBall(carrier);
    const defenders = outfield('you');
    let best = 1, bestScore = -1e9;
    for (let i = 1; i < aOut.length; i++) {
        const r = aOut[i];
        const pressure = defenders.reduce((s, d) => s + clamp(1 - dist2d(d, r) / 22, 0, 1), 0);
        const score = r.z * .9 - Math.abs(r.x) * .25 - pressure * 14 + rand(0, 6);
        if (score > bestScore) { bestScore = score; best = i; }
    }
    state.selected = best;
    const target = aOut[best];
    target.tx = clamp(target.x + rand(-6, 6), -18, 18);
    target.tz = clamp(target.z + rand(6, 12), -40, 38);
}

/** CPU defense positioning during the window (its read happens at resolve). */
export function cpuDefendChoices() {
    const defenders = outfield('cpu');
    const aOut = outfield('you');
    let bestIdx = 1, bestScore = -1e9;
    for (let i = 1; i < aOut.length; i++) {
        const r = aOut[i];
        const score = r.z * .8 - dist2d(r, state.carrier) * .3 + rand(0, 5);
        if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    const suspect = aOut[bestIdx];
    defenders.forEach((d, i) => {
        if (i === 0) return; // nearest marker tracks its anchor man automatically
        if (i <= 2) { d.tx = clamp(suspect.x + rand(-5, 5), -18, 18); d.tz = clamp(suspect.z + rand(2, 8), -40, 40); }
    });
}

/** CPU's hidden guess of who will receive (weighted, blind to the real choice). */
export function cpuGuessReceiver(aOut) {
    let best = 1, bestScore = -1e9;
    for (let i = 1; i < aOut.length; i++) {
        const r = aOut[i];
        const score = r.z * .7 - Math.abs(r.x) * .2 + rand(0, 8);
        if (score > bestScore) { bestScore = score; best = i; }
    }
    return Math.random() < .75 ? best : 1 + Math.floor(Math.random() * (aOut.length - 1));
}

/** Keeper dive guess weighted by shot placement. */
export function cpuDiveGuess(shotX) {
    const r = Math.random();
    if (shotX < -2) return r < .62 ? -1 : (r < .85 ? 0 : 1);
    if (shotX > 2) return r < .62 ? 1 : (r < .85 ? 0 : -1);
    return r < .5 ? 0 : (r < .78 ? -1 : 1);
}
