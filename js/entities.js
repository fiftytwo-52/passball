/* ================= Entities: humanoid players, ball, formations, movement ================= */

import { T, COL, clamp, dist2d, rand } from './config.js';
import { state } from './state.js';
import { THREE, scene, setBallRef } from './world.js';

/* ---- team materials ---- */
const youMat = new THREE.MeshLambertMaterial({ color: COL.you });
const cpuMat = new THREE.MeshLambertMaterial({ color: COL.cpu });
const gkYouMat = new THREE.MeshLambertMaterial({ color: 0x9fd7ff });
const gkCpuMat = new THREE.MeshLambertMaterial({ color: 0xffd28a });

/** Low-poly humanoid: head, torso, shorts, swinging arms & legs. */
const skinTones = [0xf1c9a5, 0xdba579, 0x8d5524, 0xc68642];
function makeHuman(kitMat) {
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: skinTones[Math.floor(Math.random() * skinTones.length)] });
    const shorts = new THREE.MeshLambertMaterial({ color: 0x12261f });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(.34, .42, 1.0, 10), kitMat);
    torso.position.y = 1.45;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.30, 12, 10), skin);
    head.position.y = 2.22;
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(.37, .30, .38, 10), shorts);
    hips.position.y = .86;
    const limb = r => { const geo = new THREE.CylinderGeometry(r, r * .82, .8, 8); geo.translate(0, -.4, 0); return geo; };
    const legL = new THREE.Mesh(limb(.15), skin); legL.position.set(-.18, .74, 0);
    const legR = new THREE.Mesh(limb(.15), skin); legR.position.set(.18, .74, 0);
    const armL = new THREE.Mesh(limb(.11), kitMat); armL.position.set(-.53, 1.88, 0);
    const armR = new THREE.Mesh(limb(.11), kitMat); armR.position.set(.53, 1.88, 0);
    g.add(torso, head, hips, legL, legR, armL, armR);
    g.userData.limbs = { legL, legR, armL, armR };
    return g;
}

export const players = [];   // {mesh,ring,x,z,tx,tz,team,role,idx,anchor,yaw,walk,px,pz,diveX}
const ringGeo = new THREE.RingGeometry(1.5, 1.95, 32);

function addPlayer(team, role, idx, x, z) {
    const isGK = role === 'keeper';
    const mesh = makeHuman(isGK ? (team === 'you' ? gkYouMat : gkCpuMat) : (team === 'you' ? youMat : cpuMat));
    mesh.position.set(x, 0, z);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: COL.aim, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, .06, z);
    scene.add(mesh, ring);
    const p = { mesh, ring, x, z, tx: x, tz: z, team, role, idx, anchor: { x, z }, diveX: null, yaw: 0, walk: 0, px: x, pz: z };
    mesh.traverse(o => { o.userData.root = mesh; });
    players.push(p);
    return p;
}

// 5 outfield + keeper per side
for (let i = 0; i < 5; i++) addPlayer('you', 'outfield', i, 0, 0);
addPlayer('you', 'keeper', 5, 0, 0);
for (let i = 0; i < 5; i++) addPlayer('cpu', 'outfield', i, 0, 0);
addPlayer('cpu', 'keeper', 5, 0, 0);

/* ---- ball ---- */
export const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(.32, 14, 10),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
);
scene.add(ballMesh);
export const ball = { x: 0, z: 0, state: 'held', vx: 0, vz: 0, tx: 0, tz: 0, holder: null, dist: 0 };
setBallRef(ball);

/* ---- helpers ---- */
export const teamPlayers = team => players.filter(p => p.team === team);
export const outfield = team => teamPlayers(team).filter(p => p.role === 'outfield');

export function syncMesh(p) {
    p.mesh.position.set(p.x, p.mesh.position.y, p.z);
    p.ring.position.set(p.x, .06, p.z);
}

/** Facing + run-cycle animation (legs/arms swing, slight bob). */
export function animatePlayer(p, dt) {
    const dx = p.x - p.px, dz = p.z - p.pz;
    p.px = p.x; p.pz = p.z;
    const sp = Math.hypot(dx, dz) / Math.max(dt, .001);
    const f = clamp(sp / T.playerSpeed, 0, 1);
    p.walk += sp * dt * 1.7;
    const s = Math.sin(p.walk * 6) * .8 * f;
    const L = p.mesh.userData.limbs;
    L.legL.rotation.x = s; L.legR.rotation.x = -s;
    L.armL.rotation.x = -s * .75; L.armR.rotation.x = s * .75;
    p.mesh.position.y = Math.abs(Math.sin(p.walk * 6)) * .09 * f;
    if (sp > .4) {
        const targetYaw = Math.atan2(dx, dz);
        let d = targetYaw - p.yaw;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        p.yaw += d * Math.min(1, dt * 10);
        p.mesh.rotation.y = p.yaw;
    }
}

export function moveToward(p, tx, tz, speed, dt) {
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < .05) return;
    const step = Math.min(speed * dt, d);
    p.x += dx / d * step; p.z += dz / d * step;
    p.x = clamp(p.x, -T.pitchW / 2 + 1, T.pitchW / 2 - 1);
    p.z = clamp(p.z, -T.pitchL / 2 + 1, T.pitchL / 2 - 1);
}

/* ---- formations ---- */
export function attackSpots() {
    return {
        carrier: { x: 0, z: -26 },
        mates: [{ x: -13, z: -8 }, { x: 13, z: -6 }, { x: 0, z: 6 }, { x: -8, z: 18 }]
    };
}
/** Center-kickoff shape: kicker stands ON the center spot, rest packed in the own half. */
function kickoffSpots() {
    return {
        carrier: { x: 0, z: -1.4 },
        mates: [{ x: -12, z: -12 }, { x: 12, z: -10 }, { x: 0, z: -22 }, { x: -7, z: -30 }]
    };
}
function defendSpots() {
    return {
        line: [{ x: -11, z: 2 }, { x: 11, z: 4 }, { x: 0, z: 14 }, { x: -15, z: 24 }, { x: 15, z: 24 }],
        keeper: { x: 0, z: 41 }
    };
}
export function place(p, x, z) { p.x = p.tx = x; p.z = p.tz = z; p.diveX = null; syncMesh(p); }
export function holdBall(p) { ball.state = 'held'; ball.holder = p; ball.x = p.x; ball.z = p.z; }
export function updateAnchors() { players.forEach(p => { p.anchor.x = p.x; p.anchor.z = p.z; }); }

/** Attack direction of the possessing team in world z: YOU always attack +z, CPU always -z. */
export const atkDir = () => state.possession === 'you' ? 1 : -1;

export function setupPlay(kickoffPos = false) {
    const atk = kickoffPos ? kickoffSpots() : attackSpots(), def = defendSpots();
    const d = atkDir();
    const attackTeam = state.possession, defendTeam = state.possession === 'you' ? 'cpu' : 'you';
    const aOut = outfield(attackTeam), dOut = outfield(defendTeam);
    state.carrier = aOut[0];
    aOut.forEach((p, i) => {
        const s = i === 0 ? atk.carrier : atk.mates[i - 1];
        place(p, s.x, s.z * d);
    });
    dOut.forEach((p, i) => place(p, def.line[i].x, def.line[i].z * d));
    // keepers guard FIXED goals: yours at -44, CPU's at +44 — they never swap
    place(teamPlayers(attackTeam).find(p => p.role === 'keeper'), 0, -41 * d);
    place(teamPlayers(defendTeam).find(p => p.role === 'keeper'), 0, 41 * d);
    state.selected = 1;
    holdBall(state.carrier);
    if (kickoffPos) { ball.x = 0; ball.z = 0; }   // ball sits exactly on the center spot
    updateAnchors();
}

/** Autonomous drift: nobody ever stands still during the decision window. */
export function drift(dt, now) {
    players.forEach(p => {
        if (state.drag && state.drag.player === p) return;
        if (p.role === 'keeper') return;
        if (state.mode !== 'decision') return;
        let ax = p.anchor.x, az = p.anchor.z;
        if (p.team !== state.possession && p.role === 'outfield') {
            let near = null, nd = 1e9;
            outfield(state.possession).forEach(o => { const d = dist2d(o, p); if (d < nd) { nd = d; near = o; } });
            if (near && nd < 26) { ax = ax * .55 + near.x * .45; az = az * .55 + near.z * .45; }
        }
        ax += Math.sin(now * .0009 + p.idx * 2.1 + (p.team === 'you' ? 0 : 3)) * 2.2;
        az += Math.cos(now * .0007 + p.idx * 1.7) * 1.6;
        moveToward(p, ax, az, T.playerSpeed * .45, dt);
    });
}
