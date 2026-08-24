/* ================= Bootstrap + main loop ================= */

import { T, COL, clamp, easeOutCubic } from './config.js';
import { state } from './state.js';
import {
    THREE, renderer, scene, camera, camState,
    updateCamera, marker, drawBannerSprite, hideBannerSprite
} from './world.js';
import { players, ballMesh, ball, syncMesh, animatePlayer, outfield, atkDir } from './entities.js';
import { ui, updateDiveChip } from './hud.js';
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

/* ---------- edge SHOT (attacking) / DIVE (defending) buttons ---------- */
const edgeWrap = document.getElementById('edge');
const edgeL = document.getElementById('edgeL');
const edgeR = document.getElementById('edgeR');

function setEdgeCall(v) {
    if (state.role === 'attack') state.shotCall = v;
    else { state.diveChoice = v; updateDiveChip(v); }
    sfx.lock();
    refreshEdgeSel();
}
function refreshEdgeSel() {
    const cur = state.role === 'attack' ? state.shotCall : state.diveChoice;
    edgeL.classList.toggle('sel', cur === -1);
    edgeR.classList.toggle('sel', cur === 1);
}
edgeL.addEventListener('click', () => setEdgeCall(-1));
edgeR.addEventListener('click', () => setEdgeCall(1));

/** Show edge buttons when attacking deep enough to shoot, or whenever defending. */
function updateEdgeButtons() {
    let show = false, label = 'SHOT';
    if (state.mode === 'decision' && !state.locked) {
        if (state.role === 'defend') { show = true; label = 'DIVE'; }
        else {
            const t = outfield(state.possession)[state.selected];
            if (t && t.tz * atkDir() >= T.shootZ - 10) { show = true; label = 'SHOT'; }
        }
    }
    edgeWrap.hidden = !show;
    if (show) {
        edgeL.textContent = '◀ ' + label;
        edgeR.textContent = label + ' ▶';
        refreshEdgeSel();
    }
}

/* ---------- main loop ---------- */
let last = performance.now();

function tick(now) {
    requestAnimationFrame(tick);
    try {
        tickBody(now);
    } catch (err) {
        // never let one bad frame blank the whole game — always keep rendering
        console.error(err);
        showErr(err && err.message || String(err));
        try { renderer.render(scene, camera); } catch (_) { }
    }
}

let errTimer;
function showErr(msg) {
    let box = document.getElementById('errbox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'errbox';
        document.body.appendChild(box);
    }
    box.textContent = '⚠ ' + msg;
    box.style.display = 'block';
    clearTimeout(errTimer);
    errTimer = setTimeout(() => { box.style.display = 'none'; }, 4000);
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
    updateEdgeButtons();

    // sync visuals
    players.forEach(p => { syncMesh(p); animatePlayer(p, rawDt); });
    ballMesh.position.set(ball.x, .35, ball.z);
    // rolling rotation: spin axis is perpendicular to travel direction
    const bsp = Math.hypot(ball.vx || 0, ball.vz || 0);
    if (bsp > .2) {
        const axis = new THREE.Vector3(ball.vz, 0, -ball.vx).normalize();
        ballMesh.rotateOnWorldAxis(axis, (bsp * rawDt) / .32);
    }

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
