/* ================= Input: TAP vs SWIPE (unified pointer, mouse + touch) =================

   ATTACK — TAP a teammate: he receives the pass · SWIPE a teammate: he runs there
   DEFEND — TAP an opponent: guess the receiver · SWIPE your defender: send him that way
======================================================================================== */

import { THREE } from './world.js';
import { renderer, camera, marker, swipeLine } from './world.js';
import { T, clamp } from './config.js';
import { state } from './state.js';
import { players, outfield } from './entities.js';
import { sfx } from './audio.js';
import { setInstruction, updateDiveChip } from './hud.js';

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function groundPoint(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const pt = new THREE.Vector3();
    return ray.ray.intersectPlane(groundPlane, pt) ? pt : null;
}

function pickPlayer(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const meshes = players.map(p => p.mesh);
    const hit = ray.intersectObjects(meshes, true)[0];
    return hit ? players.find(p => p.mesh === hit.object.userData.root) : null;
}

function setRunTarget(player, e) {
    const g = groundPoint(e);
    if (!g) return;
    player.tx = clamp(g.x, -T.pitchW / 2 + 1, T.pitchW / 2 - 1);
    player.tz = clamp(g.z, -T.pitchL / 2 + 1, T.pitchL / 2 - 1);
    sfx.lock();
}

renderer.domElement.addEventListener('pointerdown', e => {
    if (state.mode !== 'decision' || state.locked) return;
    const p = pickPlayer(e);
    if (!p) return;
    if (state.role === 'attack') {
        if (p.team !== 'you' || p.role !== 'outfield') return;
        state.drag = { kind: 'mate', player: p, sx: e.clientX, sy: e.clientY };
    } else if (p.team === 'you') {
        // SWIPE your keeper to command his dive (left / stay / right)
        const kind = p.role === 'keeper' ? 'keeper' : 'move';
        state.drag = { kind, player: p, sx: e.clientX, sy: e.clientY };
        renderer.domElement.setPointerCapture(e.pointerId);
        marker.visible = kind === 'move';
        marker.position.set(p.x, .07, p.z);
    } else {
        state.drag = { kind: 'guessTap', player: p, sx: e.clientX, sy: e.clientY };
    }
});

renderer.domElement.addEventListener('pointermove', e => {
    if (!state.drag) return;
    const g = groundPoint(e);
    if (g && state.drag.kind === 'move') marker.position.set(clamp(g.x, -T.pitchW / 2, T.pitchW / 2), .07, clamp(g.z, -T.pitchL / 2, T.pitchL / 2));
    // live "drawing" line while swiping any player
    if (g && state.drag.kind !== 'guessTap') {
        swipeLine.geometry.setFromPoints([
            new THREE.Vector3(state.drag.player.x, .5, state.drag.player.z),
            new THREE.Vector3(clamp(g.x, -T.pitchW / 2, T.pitchW / 2), .5, clamp(g.z, -T.pitchL / 2, T.pitchL / 2))
        ]);
        swipeLine.computeLineDistances();
        swipeLine.visible = true;
    }
});

renderer.domElement.addEventListener('pointerup', e => {
    if (!state.drag) return;
    const d = state.drag; state.drag = null; marker.visible = false; swipeLine.visible = false;
    const moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 10;

    if (d.kind === 'mate') {
        if (!moved) {                                       // TAP → receiver
            if (d.player !== state.carrier) {
                state.selected = outfield('you').indexOf(d.player);
                sfx.lock();
                setInstruction('Receiver locked (gold ring + line). SWIPE teammates for runs, or LOCK IN.');
            }
        } else setRunTarget(d.player, e);                   // SWIPE → run target
    } else if (d.kind === 'keeper') {
        // horizontal swipe direction commands the dive
        const dx = e.clientX - d.sx;
        state.diveChoice = !moved || Math.abs(dx) < 12 ? 0 : (dx < 0 ? -1 : 1);
        updateDiveChip(state.diveChoice);
        sfx.lock();
    } else if (d.kind === 'move') {
        if (moved) setRunTarget(d.player, e);
    } else if (d.kind === 'guessTap') {
        if (!moved) {                                       // TAP opponent → guess receiver
            const idx = outfield(state.possession).indexOf(d.player);
            if (idx >= 0) {
                state.guessIdx = idx;
                sfx.lock();
                setInstruction(`Guess locked on their #${idx} (red ring). SWIPE your defenders too, then LOCK IN.`);
            }
        }
    }
});
