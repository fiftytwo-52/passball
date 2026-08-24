/* ================= Tunables & shared helpers ================= */

export const T = {
    window: 5.0, winScore: 3, maxPlays: 24,
    pitchW: 42, pitchL: 88,          // world units (x width, z length)
    goalHalf: 6, goalH: 3.4,
    playerSpeed: 11,                 // every player AND the ball share this speed
    ballSpeed: 11,
    contactRadius: 1.9,              // physical interception distance
    shootZ: 24,                      // receiving at z >= this triggers a shot
    keeperReach: 4.2,
    saveSkill: .8
};

export const COL = { you: 0x78e1d0, cpu: 0xff836e, aim: 0xd6f36a, line: 0xffffff };

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist2d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const rand = (a, b) => a + Math.random() * (b - a);
export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
export const cssColor = hex => '#' + hex.toString(16).padStart(6, '0');
