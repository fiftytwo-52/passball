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
        // forward progress toward -z, open lane, safe distance from touchlines
        const edgeRisk = Math.max(0, Math.abs(r.x) - 12) * 2;
        const score = -r.z * .9 - Math.abs(r.x) * .25 - pressure * 14 - edgeRisk + rand(0, 6);
        if (score > bestScore) { bestScore = score; best = i; }
    }
    state.selected = best;
    const target = aOut[best];
    target.tx = clamp(target.x + rand(-6, 6), -15, 15);
    target.tz = clamp(target.z - rand(6, 12), -38, 38);
    target.runSet = true;

    // send the two closest other mates on supporting runs so the CPU keeps shape
    const supporters = aOut.filter((p, i) => i !== 0 && i !== best)
        .sort((a, b) => dist2d(a, carrier) - dist2d(b, carrier)).slice(0, 2);
    supporters.forEach((p, i) => {
        p.tx = clamp(carrier.x + (i === 0 ? -10 : 10) + rand(-3, 3), -15, 15);
        p.tz = clamp(carrier.z - rand(4, 10), -38, 38);
        p.runSet = true;
    });
}

/** CPU defense positioning during the window (its read happens at resolve). */
export function cpuDefendChoices() {
    const defenders = outfield('cpu');
    const aOut = outfield('you');
    let bestIdx = 1, bestScore = -1e9;
    for (let i = 1; i < aOut.length; i++) {
        const r = aOut[i];
        const score = -r.z * .8 - dist2d(r, state.carrier) * .3 + rand(0, 5); // CPU attacks -z
        if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    const suspect = aOut[bestIdx];
    // every CPU defender picks up a marking assignment — none ball-watches
    const unmarked = aOut.filter((_, i) => i !== 0); // carrier is marked by the sweepers below
    defenders.forEach((d, i) => {
        if (i <= 1) {
            // first two converge on the most dangerous receiver
            d.tx = clamp(suspect.x + rand(-5, 5), -16, 16);
            d.tz = clamp(suspect.z + rand(2, 8), -40, 40);
        } else {
            const mark = unmarked[(i - 2) % unmarked.length];
            d.tx = clamp(mark.x + rand(-3, 3), -16, 16);
            d.tz = clamp(mark.z + rand(2, 6), -40, 40);
        }
        d.runSet = true;
    });
}

/** CPU's hidden guess of who will receive (weighted, blind to the real choice). */
export function cpuGuessReceiver(aOut) {
    let best = 1, bestScore = -1e9;
    for (let i = 1; i < aOut.length; i++) {
        const r = aOut[i];
        const score = -r.z * .7 - Math.abs(r.x) * .2 + rand(0, 8); // CPU attacks -z
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
