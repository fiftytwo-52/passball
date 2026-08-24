/* ================= Three.js world: renderer, camera, pitch, goals ================= */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { T, COL, clamp } from './config.js';
import { state } from './state.js';

export { THREE };

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
document.getElementById('scene').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07130f);
scene.fog = new THREE.Fog(0x07130f, 120, 260);

/* ---- top-down follow camera (attack direction +z is up-screen) ---- */
export const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 400);
export const camState = {
    pos: new THREE.Vector3(0, 62, -6),
    look: new THREE.Vector3(0, 0, 0),
    trauma: 0
};

/** TOP-DOWN view riding above the ball; zooms IN attacking, OUT defending. */
export function updateCamera(dt) {
    // FIXED TV-style camera on YOUR side (-z): your goal bottom, CPU's top.
    // Dragging blank space pans YOUR view only — never flips sides.
    const attacking = state.role === 'attack';
    const cx = clamp((ball ? ball.x * .35 : 0) + state.pan.x, -16, 16);
    const bz = clamp((ball ? ball.z : 0) + state.pan.z, -42, 34);
    const height = attacking ? 44 : 62;
    const desired = new THREE.Vector3(cx, height, bz - 6);
    const desiredLook = new THREE.Vector3(cx, 0, bz + 6);
    const k = 1 - Math.pow(.002, dt);
    camState.pos.lerp(desired, k);
    camState.look.lerp(desiredLook, k);
}

/* ---- lights ---- */
scene.add(new THREE.HemisphereLight(0xeafff2, 0x0c2018, 1.05));
const sun = new THREE.DirectionalLight(0xfff6df, 1.15);
sun.position.set(30, 60, -20);
scene.add(sun);

/* ---- pitch with painted markings ---- */
function makePitchTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 1024;
    const g = c.getContext('2d');
    for (let i = 0; i < 12; i++) {
        g.fillStyle = i % 2 ? '#1b4a3d' : '#173f35';
        g.fillRect(0, i * c.height / 12, c.width, c.height / 12);
    }
    g.strokeStyle = 'rgba(240,255,245,.75)';
    g.lineWidth = 4;
    const m = 18;
    g.strokeRect(m, m, c.width - m * 2, c.height - m * 2);
    g.beginPath(); g.moveTo(m, c.height / 2); g.lineTo(c.width - m, c.height / 2); g.stroke();
    g.beginPath(); g.arc(c.width / 2, c.height / 2, 74, 0, Math.PI * 2); g.stroke();
    const bw = c.width * .58, bh = c.height * .17;
    g.strokeRect((c.width - bw) / 2, m, bw, bh);
    g.strokeRect((c.width - bw) / 2, c.height - m - bh, bw, bh);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
}
const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(T.pitchW + 4, T.pitchL + 4),
    new THREE.MeshLambertMaterial({ map: makePitchTexture() })
);
pitch.rotation.x = -Math.PI / 2;
scene.add(pitch);

const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 280),
    new THREE.MeshLambertMaterial({ color: 0x0d2b23 })
);
apron.rotation.x = -Math.PI / 2;
apron.position.y = -.05;
scene.add(apron);

/* ---- goals (both ends) ---- */
function addGoal(z) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xf4fff8 });
    const post = new THREE.CylinderGeometry(.22, .22, T.goalH, 10);
    const left = new THREE.Mesh(post, mat), right = new THREE.Mesh(post, mat);
    left.position.set(-T.goalHalf, T.goalH / 2, z);
    right.position.set(T.goalHalf, T.goalH / 2, z);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, T.goalHalf * 2, 10), mat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, T.goalH, z);
    const net = new THREE.Mesh(
        new THREE.PlaneGeometry(T.goalHalf * 2, T.goalH),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .16, side: THREE.DoubleSide })
    );
    net.position.set(0, T.goalH / 2, z + (z > 0 ? 1.6 : -1.6));
    scene.add(left, right, bar, net);
}
addGoal(T.pitchL / 2);
addGoal(-T.pitchL / 2);

/* ---- drag marker ---- */
export const marker = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.7, 28),
    new THREE.MeshBasicMaterial({ color: COL.aim, transparent: true, opacity: .9, side: THREE.DoubleSide })
);
marker.rotation.x = -Math.PI / 2;
marker.visible = false;
scene.add(marker);

/* ---- live pass line ---- */
export const passLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({ color: COL.aim, dashSize: 1.3, gapSize: .9, transparent: true, opacity: .95 })
);
passLine.visible = false;
scene.add(passLine);

/* live swipe "drawing" line */
export const swipeLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: .9, gapSize: .6, transparent: true, opacity: .85 })
);
swipeLine.visible = false;
scene.add(swipeLine);

/* ---- outcome banner sprite ---- */
const bannerCanvas = document.createElement('canvas');
bannerCanvas.width = 1024; bannerCanvas.height = 256;
const bannerTex = new THREE.CanvasTexture(bannerCanvas);
const bannerSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bannerTex, transparent: true, depthTest: false }));
bannerSprite.scale.set(46, 11.5, 1);
bannerSprite.position.set(0, 16, 6);
bannerSprite.visible = false;
scene.add(bannerSprite);

export function drawBannerSprite(text, hex, alpha, scale) {
    const g = bannerCanvas.getContext('2d');
    g.clearRect(0, 0, 1024, 256);
    g.font = '900 150px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 18; g.strokeStyle = 'rgba(8,21,19,.9)';
    g.strokeText(text, 512, 132);
    g.fillStyle = '#' + hex.toString(16).padStart(6, '0');
    g.fillText(text, 512, 132);
    bannerTex.needsUpdate = true;
    bannerSprite.material.opacity = alpha;
    bannerSprite.scale.set(24 * scale, 6 * scale, 1);
    bannerSprite.visible = true;
}
export function hideBannerSprite() { bannerSprite.visible = false; }

/* ball reference is injected by entities.js to avoid a circular import */
export let ball = null;
export function setBallRef(b) { ball = b; }

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
