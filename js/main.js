/* ================= Bootstrap + main loop ================= */

import { T, COL, clamp, easeOutCubic } from './config.js';
import { state } from './state.js';
import {
    renderer, scene, camera, camState,
    updateCamera, marker, drawBannerSprite, hideBannerSprite
} from './world.js';
import { players, ballMesh, ball, syncMesh, animatePlayer } from './entities.js';
import { ui, showBanner } from './hud.js';
import { unlockAudio, sfx } from './audio.js';
import { startDecision, beginResolve, stepResolve, restartMatch, updatePassLine } from './game.js';

/* ---------- menu / tutorial / buttons ---------- */
ui.menu.querySelector('#btn-vs-cpu').addEventListener('click', () => {
    ui.menu.style.display = 'none';
    ui.hud.classList.add('on');
    unlockAudio();
    restartMatch();
});
document.getElementById('btn-tutorial').addEventListener('click', () => { ui.tutorial.hidden = false; });
document.getElementById('btn-tutorial-close').addEventListener('click', () => { ui.tutorial.hidden = true; });

ui.restart.addEventListener('click', restartMatch);

/* ---------- main loop ---------- */
let last = performance.now();

function tick(now) {
    requestAnimationFrame(tick);
    try {
        tickBody(now);
    } catch (err) {
        // never let one bad frame freeze the whole game
        console.error(err);
    }
}

function tickBody(now) {
    const rawDt = Math.min((now - last) / 1000, .08);
    last = now;

    // dynamic top-down follow camera + shake (visual only)
    updateCamera(rawDt);
    camState.trauma = Math.max(0, camState.trauma - rawDt * 2.2);
    const sh = camState.trauma * camState.trauma;
    camera.position.set(
        camState.pos.x + Math.sin(now * .027) * 2.4 * sh,
        camState.pos.y + Math.sin(now * .021) * 1.6 * sh,
        camState.pos.z + Math.cos(now * .019) * 1.8 * sh
    );
    camera.lookAt(camState.look);

    // decision countdown
    if (state.mode === 'decision' && !state.locked) {
        state.remaining -= rawDt;
        if (state.remaining <= 0) { state.remaining = 0; beginResolve(); }
        ui.timer.textContent = Math.max(0, state.remaining).toFixed(1);
        ui.timer.classList.toggle('urgent', state.remaining < 3);
        // game is FROZEN during the window — commands are planned, nothing moves until resolve
    }
    if (state.mode === 'resolve') stepResolve(rawDt);

    // sync visuals
    players.forEach(p => { syncMesh(p); animatePlayer(p, rawDt); });
    ballMesh.position.set(ball.x, .35, ball.z);

    // ring highlights: gold = selected receiver · red = your guessed receiver
    players.forEach(p => {
        const isSel = state.mode === 'decision' && state.role === 'attack' &&
            p.team === state.possession && outfieldAt(state.selected) === p;
        const isGuess = state.mode === 'decision' && state.role === 'defend' && state.guessIdx != null &&
            outfieldAt(state.guessIdx) === p;
        const isCarrier = p === state.carrier && state.mode === 'decision';
        p.ring.material.opacity = isSel ? .85 : isGuess ? .9 : isCarrier ? .5 : 0;
        p.ring.material.color.setHex(isGuess ? COL.cpu : COL.aim);
    });
    updatePassLine();

    // banner lifecycle
    if (state.banner) {
        state.bannerAge += rawDt;
        const t = state.bannerAge;
        const inScale = easeOutCubic(clamp(t / .16, 0, 1));
        const outT = clamp((t - .95) / .35, 0, 1);
        drawBannerSprite(state.banner.text, state.banner.hex, 1 - outT, inScale * (1 + .08 * (1 - outT)));
        if (t > 1.3) { state.banner = null; hideBannerSprite(); }
    }

    renderer.render(scene, camera);
}

function outfieldAt(i) {
    return players.filter(p => p.team === state.possession && p.role === 'outfield')[i];
}

requestAnimationFrame(tick);
