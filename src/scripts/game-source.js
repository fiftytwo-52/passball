/**
 * Guess & Pass — the engine.  Real-time 6-a-side football.
 *
 * There are no turns and no dice. The pitch is one continuous simulation: a
 * `requestAnimationFrame` loop moves every player and the ball, and every
 * single frame asks the §7 questions — "is a defender inside CATCH_RADIUS of
 * the ball yet?", "has the keeper got a hand to it before the line?". What
 * happens is whatever the geometry says happens.
 *
 * The *rulebook* — speeds, radii, the interception race, the save reach, the
 * penalty reach test, the shootout tiebreak — lives in ./rules.js and is
 * imported here rather than re-implemented, so `npm run verify` exercises the
 * exact code this file runs. This file is the presentation: the 3D humanoids on
 * the 2D top-view pitch, the movement, the input, the HUD.
 *
 * Layout of this file:
 *   §0  palette + aliases into the rulebook      §8  possession + movement
 *   §1  presentation maths                       §9  CPU
 *   §4  match state + event bus                  §10 feel (audio / shake / banner)
 *   §5  pitch geometry                           §11 HUD (event-driven DOM)
 *   §6  three.js scene                           §12 lifecycle (halves, restarts)
 *   §7  players                                  §13 input · §14 update · §15 wiring
 */
import * as THREE from 'three';
import {
    RULES, MATCH_LENGTH,
    clamp, flightTime,
    resolvePassRace, interceptionTime,
    isOnTarget, shotOutcome, defaultDiveTarget,
    penaltyKickOutcome, shootoutDecided, formatClock,
    mulberry32, runVerification
} from './rules.js';

(function () {
    'use strict';

    const errBox = document.getElementById('err');
    function fail(msg) {
        if (errBox) {
            errBox.style.display = 'block';
            errBox.textContent = 'Error: ' + msg;
        }
        console.error(msg);
    }
    /* ----------------------------------------------------------------------
       § 0.a RULEBOOK ALIASES — the tunables live in ./rules.js. Nothing here
       may be tuned independently of the property tests.
       ---------------------------------------------------------------------- */
    const {
        PLAYER_SPEED, BALL_SPEED, SHOT_SPEED, DIVE_SPEED, DRILL_SPEED,
        CATCH_RADIUS, KEEPER_REACH,
        GOAL_HALF_WIDTH, SHOT_RANGE, HALF_LENGTH, PENALTY_SPOT, KEEPER_LINE
    } = RULES;

    /* --- presentation / feel: safe to tune, changes no mechanic --- */
    const SETUP_TIME = 0.85;      // kick-off / restart rearrange, seconds
    const ARC_PASS = 1.0, ARC_SHOT = 0.5;
    const LANE_OFFSET = [-30, -14, 14, 30];
    const LANE_DEPTH = [0.55, 0.82, 0.62, 0.34];
    const TAP_SLOP = 6;           // game units a pointer must travel to be a drag
    const DOUBLE_TAP_MS = 340;    // §5 — double-tap to shoot
    const SO_ZOOM = 2.6, SO_PAN_Y = 92;   // §10 penalty view: one end, magnified

    /* ==========================================================================
       § 0.b PALETTE — re-skinned to the DESIGN.md (Vercel / Geist) accent family.
       The canvas UI is an ink-on-near-white duet; the pitch is that same duet
       inverted (an ink board with near-white hairline markings), and the only
       colour on it is the restrained Geist accent set: cyan, link blue, violet,
       magenta and the gradient's amber. Purely presentational — no mechanic
       reads these values.
       ========================================================================== */
    const COL = {
        you: 0x50e3c2, cpu: 0xeb367f,        /* Geist cyan / Geist magenta   */
        gkYou: 0x0070f3, gkCpu: 0x7928ca,    /* Geist link blue / Geist violet */
        aim: 0xf5a623, ghost: 0xfafafa        /* gradient amber / Geist canvas */
    };
    const CSS = {
        you: '#50e3c2', cpu: '#eb367f', lime: '#f5a623',
        goal: '#50e3c2', bad: '#eb367f', warn: '#f5a623'
    };

    /* ==========================================================================
       § 1. PRESENTATION MATH + SEEDED RNG
       `clamp` comes from the rulebook. `mulberry32` too. Everything else here is
       about moving meshes around, and reads no mechanic.
       ========================================================================== */
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const lerp = (a, b, t) => a + (b - a) * t;
    /** Unit vector that keeps its own length, for callers that want both. */
    function unit(x, y) {
        const l = Math.hypot(x, y);
        return l < 1e-9 ? { x: 0, y: 0, l: 0 } : { x: x / l, y: y / l, l };
    }
    /** Where a ball sent `from → to` is after `t` seconds at `speed`. */
    function pointAlong(from, to, speed, t) {
        const d = unit(to.x - from.x, to.y - from.y);
        return { x: from.x + d.x * speed * t, y: from.y + d.y * speed * t };
    }
    function hashSeed(a, b, c) {
        let h = 2166136261 ^ (a >>> 0);
        [b, c || 0].forEach(v => { h ^= (v >>> 0); h = Math.imul(h, 16777619); });
        return h >>> 0;
    }
    function weightedPick(list, weights, rng) {
        let total = 0;
        for (let i = 0; i < weights.length; i++) total += Math.max(0, weights[i]);
        if (total <= 1e-9) return { item: list[Math.floor(rng() * list.length)], index: -1 };
        let r = rng() * total;
        for (let i = 0; i < list.length; i++) {
            r -= Math.max(0, weights[i]);
            if (r <= 0) return { item: list[i], index: i };
        }
        return { item: list[list.length - 1], index: list.length - 1 };
    }
    const randRange = (rng, a, b) => a + (b - a) * rng();

    /* ==========================================================================
       § 4. MATCH STATE + EVENT BUS  (canonical §3 lifecycle)
       ========================================================================== */
    const state = {
        phase: 'idle',        // idle | restart | play | halftime | over | shootout
        possession: 'you',    // who has the ball right now
        humanScore: 0, cpuScore: 0,
        half: 1,              // 1 | 2
        halfT: 0,             // seconds elapsed in this half
        pendingHalf: false,   // clock expired; wait for the ball to die
        difficulty: 0.6,      // CPU reading of the game, 0 silly … 1 ruthless
        seed: 0,
        trauma: 0,
        paused: false,
        phaseT: 0,            // seconds in the current dead-ball beat
        reduceMotion: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    };

    /* Tiny event bus so the HUD is event-driven, not polled. */
    const bus = {
        map: {},
        on(evt, fn) { (this.map[evt] = this.map[evt] || []).push(fn); },
        emit(evt, data) { (this.map[evt] || []).forEach(fn => fn(data)); }
    };

    /* ==========================================================================
       § 5. PITCH GEOMETRY  (game space is 100 × 100; goals at y = 0 and y = 100)

       The *logic* grid stays the canonical normalized 100 × 100 square — every
       clamp, formation offset and §7 constant is dimensioned on it and must not
       move. The *artwork* is a real football pitch: 105 m along the playing
       direction (game-y) and 68 m across it (game-x). Presenting one on the other
       is purely a matter of scale:

         KX   squashes game-x into world-x so 100 game-x units cover the same
              68 m that 100 game-y units cover down the length. A pass that is
              circular in game space therefore draws as a genuine football
              ellipse — which is what the viewer expects to see.

       nothing in the rulebook may reference any of these.
       ========================================================================== */
    const PITCH_M = { x: 68, y: 105 };              // metres across / along
    const GROUND_M = { x: 76, y: 113 };             // playing area + 4 m run-off
    const MX = 100 / PITCH_M.x;                     // game-x units per metre
    const MY = 100 / PITCH_M.y;                     // game-y units per metre
    const KX = PITCH_M.x / PITCH_M.y;               // world-x compression (~0.648)
    const UPM = 100 / PITCH_M.y;                    // world units per metre (~0.952)
    const PITCH = {
        w: 100,
        h: 100,
        /* The mouth the 3D frames must span. §2 puts it at 2 × GOAL_HALF_WIDTH
           on the canonical grid, so the rulebook — not a metre conversion —
           decides how wide a goal is. */
        goalW: GOAL_HALF_WIDTH * 2,
        boxW: 40.32 * MX,
        boxD: 16.5 * MY,
        sixW: 18.32 * MX,
        sixD: 5.5 * MY
    };
    const GOAL = {
        you: { x: 50, y: 100 },  // the goal the human attacks (CPU's goal)
        cpu: { x: 50, y: 0 }     // the goal the CPU attacks (human's goal)
    };
    const goalFor = team => (team === 'you' ? GOAL.you : GOAL.cpu);
    const other = team => (team === 'you' ? 'cpu' : 'you');
    /** A team's own goal — the one goalFor() does *not* return. */
    const ownGoal = team => goalFor(other(team));
    /** The half a team attacks (+) or defends (−), as a y coordinate. */
    const attackSide = team => (team === 'you' ? 1 : -1);

    /* ==========================================================================
       § 6. THREE.JS SCENE — 3D characters, 2D top-view ground
       ========================================================================== */
    const canvas = document.getElementById('scene');
    const TILT = THREE.MathUtils.degToRad(34);      // camera tilt off vertical
    const ZSTRETCH = 1 / Math.cos(TILT);            // stretches the ground plane's depth so
    // the top-view artwork lands on screen undistorted
    /* Visible half-extents in screen units. Screen-up is 1:1 with game-y, and
       screen-right is game-x compressed by KX, so these are simply the ground's
       half-metres: 113/2 along, 76/2 × KX across. Half a unit of slack keeps the
       plane's own edge from ever landing exactly on the canvas edge. */
    const reqHW = GROUND_M.x * KX / 2 + 0.5;        // ≈ 36.5
    const reqHH = GROUND_M.y / 2 + 0.5;             // ≈ 57.0
    /* §10 — the shootout magnifies one end, so the view carries a zoom and a
       pan (in game-y units) on top of the contain fit. */
    const view = { hw: reqHW, hh: reqHH, zoom: 1, panY: 50 };

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch (e) {
        fail('WebGL is unavailable in this browser: ' + e.message);
        return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    /* Surround colour. Matched to the pitch texture's base turf, so the area
       beyond the touchline reads as the same grass under the same light and the
       plane's edges disappear into it. */
    renderer.setClearColor(0x0e2413, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -400, 400);
    camera.position.set(0, 130 * Math.cos(TILT), 130 * Math.sin(TILT));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    /* --- lights (no shadow maps: blob shadows are cheaper and crisper from above) --- */
    scene.add(new THREE.HemisphereLight(0xbfe9ff, 0x10251f, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(-40, 80, -30);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fd7ff, 0.35);
    rim.position.set(50, 30, 60);
    scene.add(rim);

    /* --- coordinate helpers -------------------------------------------------
       The camera is tilted 34° off vertical and the plane is pre-stretched by
       exactly 1/cos(34°), so the two factors cancel and screen-up equals game-y
       one-for-one. Across the pitch they do not: X is squashed by KX so that a
       100 × 100 logic grid paints as a 105 × 68 m pitch. */
    const worldX = gx => (gx - 50) * KX;
    const worldZ = gy => (50 - gy) * ZSTRETCH;     // gameY 100 → screen-up

    /* --- the 2D top-view pitch, drawn with Canvas2D and used as a plane texture ---
       Authored in real metres. The canvas is rectangular — 113 m along the playing
       direction by 76 m across it — and matches the ground plane's screen aspect
       exactly, so one canvas pixel is the same distance on both axes and every
       radius drawn below comes out circular. m = 0 is the halfway line; +m points
       at the goal the human attacks, which is the top of the image. */
    function makePitchTexture(px) {
        const M = px / GROUND_M.y;                // pixels per metre
        const cw = Math.round(GROUND_M.x * M);    // 76 m across
        const ch = px;                            // 113 m along
        const X = m => cw / 2 + m * M;
        const Y = m => ch / 2 - m * M;
        const U = M * PITCH_M.y / 100;            // pixels per canonical game unit
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        const g = c.getContext('2d');

        const W = PITCH_M.x / 2;                  // 34   — touchline
        const GL = PITCH_M.y / 2;                 // 52.5 — goal line

        /* turf — a base green, then the mown cut in a lighter one. These values
           are deliberately darker than the finished pitch: the plane is shaded
           by the scene's hemisphere + key light, which add roughly a third more
           brightness on top of whatever is painted here. */
        g.fillStyle = '#1e4726';
        g.fillRect(0, 0, cw, ch);
        g.fillStyle = '#245229';
        const band = GROUND_M.y / 10;             // ten cuts of 11.3 m
        for (let i = 0; i < 10; i++) {
            if (i % 2) continue;
            g.fillRect(0, Y(GROUND_M.y / 2 - i * band), cw, band * M);
        }

        /* blades — thousands of short, jittered strokes. The mown bands on their
           own read as flat vinyl from directly above; this pass is what makes the
           surface look cut rather than printed. */
        g.save();
        g.globalAlpha = .16;
        for (let i = 0; i < 4600; i++) {
            const x = Math.random() * cw, y = Math.random() * ch;
            g.strokeStyle = Math.random() < .52 ? '#2f6234' : '#173a1e';
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x + (Math.random() - .5) * 1.8 * U, y - (1.2 + Math.random() * 3.4) * U);
            g.stroke();
        }
        g.restore();

        /* daylight fall-off — shade gathering along the touchlines. Kept shallow:
           from a top-down camera a strong vignette reads as a spotlight. */
        [0, 1].forEach(axis => {
            const len = axis ? cw : ch;
            const edge = g.createLinearGradient(0, 0, axis ? len : 0, axis ? 0 : len);
            edge.addColorStop(0, 'rgba(2,16,8,.30)');
            edge.addColorStop(.17, 'rgba(2,16,8,0)');
            edge.addColorStop(.83, 'rgba(2,16,8,0)');
            edge.addColorStop(1, 'rgba(2,16,8,.30)');
            g.fillStyle = edge;
            g.fillRect(0, 0, cw, ch);
        });

        /* worn goalmouths — a hint of scuffed, yellower grass where the play
           actually happens, which is what separates a pitch from a pattern. */
        [GL - 5.5, 5.5 - GL].forEach(cz => {
            const wear = g.createRadialGradient(X(0), Y(cz), 0, X(0), Y(cz), 20 * M);
            wear.addColorStop(0, 'rgba(150,168,96,.12)');
            wear.addColorStop(.55, 'rgba(150,168,96,.05)');
            wear.addColorStop(1, 'rgba(150,168,96,0)');
            g.fillStyle = wear;
            g.fillRect(0, 0, cw, ch);
        });

        /* markings — paint on grass, so a hair off pure white rather than the
           hairline grey a dark board called for */
        g.strokeStyle = 'rgba(255,255,255,.75)';
        g.fillStyle = 'rgba(255,255,255,.75)';
        g.lineWidth = Math.max(2, 0.26 * M);
        g.lineCap = 'round';
        const rect = (x0, y0, x1, y1) => {
            g.beginPath();
            g.rect(X(x0), Y(y1), (x1 - x0) * M, (y1 - y0) * M);
            g.stroke();
        };
        const line = (x0, y0, x1, y1) => {
            g.beginPath(); g.moveTo(X(x0), Y(y0)); g.lineTo(X(x1), Y(y1)); g.stroke();
        };
        const spot = (cx, cy) => {
            g.beginPath(); g.arc(X(cx), Y(cy), 0.45 * M, 0, Math.PI * 2); g.fill();
        };
        const circle = (cx, cy, r, a0, a1) => {
            g.beginPath(); g.arc(X(cx), Y(cy), r * M, a0 === undefined ? 0 : a0, a1 === undefined ? Math.PI * 2 : a1);
            g.stroke();
        };

        rect(-W, -GL, W, GL);                   // touchlines
        line(-W, 0, W, 0);                      // halfway
        circle(0, 0, 9.15);                     // centre circle
        spot(0, 0);                             // centre spot

        /* both penalty areas + six-yard boxes */
        rect(-20.16, GL - 16.5, 20.16, GL); rect(-9.16, GL - 5.5, 9.16, GL);
        rect(-20.16, -GL, 20.16, -(GL - 16.5)); rect(-9.16, -GL, 9.16, -(GL - 5.5));

        /* penalty spots + the "D" — the arc bulges back toward halfway, and only
           the part outside the penalty area is drawn */
        const SPOT = GL - 11, a = Math.acos(5.5 / 9.15);
        spot(0, SPOT); spot(0, -SPOT);
        circle(0, SPOT, 9.15, a - Math.PI / 2, Math.PI * 1.5 - a);
        circle(0, -SPOT, 9.15, a - Math.PI * 1.5, Math.PI / 2 - a);

        /* corner arcs — canvas angles run clockwise from +x, and canvas +y is
           toward halfway, so each quarter opens inward */
        [[W, GL, Math.PI / 2, Math.PI], [W, -GL, Math.PI, Math.PI * 1.5],
        [-W, -GL, Math.PI * 1.5, Math.PI * 2], [-W, GL, 0, Math.PI / 2]]
            .forEach(([cx, cy, a0, a1]) => circle(cx, cy, 1, a0, a1));

        /* goal nets (behind the goal lines, outside the pitch). Painted at the
           rulebook's mouth width so the 2D net and the 3D frame agree. */
        function net(side) {
            const gw = PITCH.goalW * MX, depth = 2;     // metres
            const x0 = -gw / 2, x1 = gw / 2;
            const yIn = side < 0 ? -GL : GL, yOut = side < 0 ? -GL - depth : GL + depth;
            g.save();
            g.strokeStyle = 'rgba(255,255,255,.30)';
            g.lineWidth = Math.max(1, 0.06 * M);
            for (let i = 0; i <= 12; i++) line(x0 + (x1 - x0) * i / 12, yIn, x0 + (x1 - x0) * i / 12, yOut);
            for (let i = 0; i <= 5; i++) line(x0, yIn + (yOut - yIn) * i / 5, x1, yIn + (yOut - yIn) * i / 5);
            g.restore();
            g.strokeStyle = 'rgba(255,255,255,.85)';
            g.lineWidth = Math.max(3, 0.35 * M);
            line(x0, yIn, x1, yIn);
        }
        net(+1);   // CPU's goal (gameY 100, image top)
        net(-1);   // human's goal (gameY 0, image bottom)

        /* No ownership tint and no painted end labels. The half the player
           defends is already unambiguous — they attack up the screen, the kits
           and the goal frames carry the colour, and the goal banners are drawn
           in the HUD docks rather than printed on the turf. Anything else
           painted here only made the grass look less like grass. */

        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
        return tex;
    }

    /* the ground: a plane carrying the 2D top-view artwork. Its dimensions are
       the run-off figure in metres converted to world units, so the plane and the
       texture share one scale and the pitch is a true 105 × 68 m. */
    const pitchPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(GROUND_M.x * UPM, GROUND_M.y * UPM * ZSTRETCH),
        new THREE.MeshLambertMaterial({ map: makePitchTexture(1695) })
    );
    pitchPlane.rotation.x = -Math.PI / 2;
    pitchPlane.position.y = 0;
    scene.add(pitchPlane);

    /* the surround, painted in the renderer's own clear colour so the plane's
       edge cannot show a seam — the ground simply fades into the void */
    const apron = new THREE.Mesh(
        new THREE.PlaneGeometry(1200, 1200 * ZSTRETCH),
        new THREE.MeshBasicMaterial({ color: 0x0e2413 })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.06;
    scene.add(apron);

    /* --- 3D goal frames (the ground is 2D; the furniture is real 3D) --- */
    function makeGoal(gy) {
        const grp = new THREE.Group();
        const white = new THREE.MeshLambertMaterial({ color: 0xf2f7f4 });
        /* PITCH.goalW is the rulebook's mouth on the canonical grid; MX converts
           it to metres and KX back to world-x, so the frame spans exactly the
           width the geometry tests use. */
        const gw = PITCH.goalW * MX * KX;
        const half = gw / 2, H = 3.0, depth = 2.2;
        const post = (x, z) => {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, H, 10), white);
            m.position.set(x, H / 2, z);
            grp.add(m);
        };
        const bar = (x, y, z, w, rotY) => {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, w, 8), white);
            m.rotation.z = Math.PI / 2;
            if (rotY) m.rotation.y = rotY;
            m.position.set(x, y, z);
            grp.add(m);
        };
        const zLine = worldZ(gy), zBack = worldZ(gy + (gy >= 50 ? depth : -depth));
        post(-half, zLine); post(half, zLine); post(-half, zBack); post(half, zBack);
        bar(0, H, zLine, gw + 0.34);
        bar(0, H * .62, zBack, gw + 0.34);
        /* side struts */
        [-1, 1].forEach(s => {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, Math.hypot(depth * ZSTRETCH, H * .38), 6), white);
            m.position.set(s * half, H * .81, (zLine + zBack) / 2);
            m.rotation.x = Math.atan2(depth * ZSTRETCH, H * .38);
            grp.add(m);
        });
        scene.add(grp);
        return grp;
    }
    makeGoal(100);  // CPU's goal — the human attacks it
    makeGoal(0);    // human's goal — the human defends it

    /* --- blob shadow texture --- */
    const blobTex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const rad = g.createRadialGradient(64, 64, 2, 64, 64, 62);
        rad.addColorStop(0, 'rgba(0,0,0,.45)');
        rad.addColorStop(.55, 'rgba(0,0,0,.22)');
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rad; g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    })();

    /* ==========================================================================
       § 7. PLAYERS — low-poly 3D humanoids (reused construction pattern)
       ========================================================================== */
    const skinTones = [0xf1c9a5, 0xdba579, 0x8d5524, 0xc68642, 0xa9713f];
    const MAT = {
        you: new THREE.MeshLambertMaterial({ color: COL.you }),
        cpu: new THREE.MeshLambertMaterial({ color: COL.cpu }),
        gkYou: new THREE.MeshLambertMaterial({ color: COL.gkYou }),
        gkCpu: new THREE.MeshLambertMaterial({ color: COL.gkCpu })
    };
    const limbGeoCache = {};
    function limbGeo(r, h) {
        const k = r + ':' + h;
        if (!limbGeoCache[k]) {
            const geo = new THREE.CylinderGeometry(r, r * .84, h, 8);
            geo.translate(0, -h / 2, 0);
            limbGeoCache[k] = geo;
        }
        return limbGeoCache[k];
    }

    /** Low-poly humanoid, ~4 units tall, feet at local y = 0. */
    function makeHuman(kitMat, role) {
        const g = new THREE.Group();
        const skin = new THREE.MeshLambertMaterial({ color: skinTones[Math.floor(Math.random() * skinTones.length)] });
        const shorts = new THREE.MeshLambertMaterial({ color: 0x11241e });
        const keeperKit = role === 'keeper';

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(.52, .63, 1.5, 12), kitMat);
        torso.position.y = 2.42;
        const hips = new THREE.Mesh(new THREE.CylinderGeometry(.5, .42, .52, 12), shorts);
        hips.position.y = 1.45;
        const head = new THREE.Mesh(new THREE.SphereGeometry(.46, 14, 12), skin);
        head.position.y = 3.55;
        const cap = new THREE.Mesh(new THREE.SphereGeometry(.47, 12, 8, 0, Math.PI * 2, 0, Math.PI * .45), shorts);
        cap.position.y = 3.58;

        const legL = new THREE.Mesh(limbGeo(.2, 1.22), skin); legL.position.set(-.24, 1.22, 0);
        const legR = new THREE.Mesh(limbGeo(.2, 1.22), skin); legR.position.set(.24, 1.22, 0);

        const armL = new THREE.Mesh(limbGeo(.15, 1.3), skin); armL.position.set(-.72, 3.0, 0);
        const armR = new THREE.Mesh(limbGeo(.15, 1.3), skin); armR.position.set(.72, 3.0, 0);
        const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(.22, .2, .62, 8), kitMat);
        sleeveL.position.set(-.72, 2.72, 0);
        const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(.22, .2, .62, 8), kitMat);
        sleeveR.position.set(.72, 2.72, 0);

        g.add(torso, hips, head, cap, legL, legR, armL, armR, sleeveL, sleeveR);
        g.userData.limbs = { legL, legR, armL, armR, sleeveL, sleeveR, torso, head };
        return g;
    }

    function makeBlobShadow(scale) {
        const m = new THREE.Mesh(
            new THREE.CircleGeometry(scale, 22),
            new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.03;
        return m;
    }

    const ringGeo = new THREE.RingGeometry(1.55, 2.0, 34);
    const allPlayers = [];
    let playersById = {};

    function spawnPlayer(team, role, num) {
        const kit = role === 'keeper' ? (team === 'you' ? MAT.gkYou : MAT.gkCpu) : (team === 'you' ? MAT.you : MAT.cpu);
        const mesh = makeHuman(kit, role);
        const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
            color: COL.aim, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
        }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        const shadow = makeBlobShadow(1.15);
        scene.add(mesh, ring, shadow);

        const p = {
            id: team + num, team, role, num,
            label: role === 'keeper' ? (team === 'you' ? 'YOU-GK' : 'CPU-GK') : (team === 'you' ? 'YOU' : 'CPU') + '-' + num,
            x: 50, y: 50, tx: 50, ty: 50, dest: null, ax: 50, ay: 50,
            mesh, ring, shadow,
            yaw: team === 'you' ? Math.PI : 0, walk: 0, px: 50, py: 50,
            hasBall: false, selected: false, controlled: false, held: false,
            duty: null,          // 'interceptor' | 'marker' for the human's two
            dive: null,          // keeper only: where this dive is going
            speed: PLAYER_SPEED
        };
        mesh.position.set(worldX(p.x), 0, worldZ(p.y));
        allPlayers.push(p);
        playersById[p.id] = p;
        return p;
    }

    /* §2 — 5 outfield + 1 keeper per team. The keeper is always num 6, so the
       engine can reach both of them by id (`you6`, `cpu6`). */
    for (let i = 1; i <= 5; i++) spawnPlayer('you', 'outfield', i);
    spawnPlayer('you', 'keeper', 6);
    for (let i = 1; i <= 5; i++) spawnPlayer('cpu', 'outfield', i);
    spawnPlayer('cpu', 'keeper', 6);

    const teamPlayers = team => allPlayers.filter(p => p.team === team);
    const teamOutfield = team => allPlayers.filter(p => p.team === team && p.role === 'outfield');
    const keeperOf = team => playersById[team + '6'];

    function syncToMesh(p) {
        p.mesh.position.set(worldX(p.x), p.mesh.position.y, worldZ(p.y));
        p.ring.position.set(worldX(p.x), 0.06, worldZ(p.y));
        p.shadow.position.set(worldX(p.x), 0.03, worldZ(p.y));
    }

    /** Facing + run cycle (legs/arms swing, slight bob). */
    function animatePlayer(p, dt) {
        const dx = p.x - p.px, dy = p.y - p.py;
        p.px = p.x; p.py = p.y;
        const sp = Math.hypot(dx, dy) / Math.max(dt, 1e-3);
        const f = clamp(sp / PLAYER_SPEED, 0, 1);
        p.walk += sp * dt * 0.22;
        const s = Math.sin(p.walk * 6) * .85 * f;
        const L = p.mesh.userData.limbs;
        L.legL.rotation.x = s; L.legR.rotation.x = -s;
        L.armL.rotation.x = -s * .8; L.armR.rotation.x = s * .8;
        L.sleeveL.rotation.x = -s * .8; L.sleeveR.rotation.x = s * .8;
        p.mesh.position.y = Math.abs(Math.sin(p.walk * 6)) * .13 * f;
        if (sp > .6) {
            /* world facing: game +y is screen-up (= world −z), so yaw = atan2(dx, −dy) */
            const target = Math.atan2(dx, -dy);
            let d = target - p.yaw;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            p.yaw += d * Math.min(1, dt * 9);
        }
        p.mesh.rotation.y = p.yaw;
    }

    function moveToward(p, tx, ty, speed, dt) {
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
        if (d < 0.06) { p.x = tx; p.y = ty; return true; }
        const step = Math.min(speed * dt, d);
        p.x = clamp(p.x + dx / d * step, 3, 97);
        p.y = clamp(p.y + dy / d * step, 3, 97);
        return false;
    }

    /* --- ball ---
       One moving object, four modes. `held` rides the carrier; `pass` and `shot`
       are the two flights the §7 races run against; `loose` is a dead ball
       waiting for whoever is nearest. */
    const ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry(.42, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    const ballShadow = makeBlobShadow(0.6);
    scene.add(ballMesh, ballShadow);
    const ball = {
        x: 50, y: 50, h: 0.42,
        mode: 'held',            // held | pass | shot | loose
        holder: null,
        from: null, dir: null, target: null,
        speed: BALL_SPEED, t: 0, total: 0, travel: 0,
        arc: ARC_PASS, alive: false,
        passTarget: null, lastTouch: null
    };

    function launchBall(from, to, speed, opts) {
        const o = opts || {};
        ball.from = { x: from.x, y: from.y };
        ball.dir = unit(to.x - from.x, to.y - from.y);
        ball.speed = speed;
        ball.t = 0;
        ball.travel = 0;
        ball.total = dist(from, to) / Math.max(1e-6, speed);
        ball.target = { x: to.x, y: to.y };
        ball.arc = o.arc === undefined ? ARC_PASS : o.arc;
        ball.mode = o.mode || 'pass';
        ball.holder = null;
        ball.alive = true;
        ball.passTarget = o.passTarget || null;
        ball.x = from.x; ball.y = from.y; ball.h = 0.42;
    }

    /* ==========================================================================
       § 8. OVERLAYS — every piece of guidance is drawn on the turf *for* the
       player, never as text. Rings mark who you control; lines preview a pass,
       a shot and a dive.
       ========================================================================== */
    function groundLine(color, width) {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .9 }));
        m.visible = false;
        scene.add(m);
        m.setEnds = (a, b) => {
            m.geometry.setFromPoints([
                new THREE.Vector3(worldX(a.x), .1, worldZ(a.y)),
                new THREE.Vector3(worldX(b.x), .1, worldZ(b.y))
            ]);
            m.geometry.computeBoundingSphere();
        };
        return m;
    }
    const aimLine = groundLine(COL.aim, 2);       // pass preview
    const diveLine = groundLine(COL.gkYou, 2);    // keeper dive preview
    const shotLine = groundLine(COL.ghost, 2);    // shot preview

    /** Free-standing ring marker, used for a destination or a dive point. */
    function mkRing(color, inner, outer) {
        const m = new THREE.Mesh(
            new THREE.RingGeometry(inner, outer, 26),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.08;
        m.visible = false;
        scene.add(m);
        return m;
    }
    const runnerMarker = mkRing(COL.aim, 0.9, 1.25);
    const diveMarker = mkRing(COL.gkYou, 1.0, 1.5);

    /* --- selection rings on the human's players --- */
    function refreshRings() {
        allPlayers.forEach(p => {
            const show = p.controlled;
            p.ring.material.opacity = show ? (p.hasBall ? 0.95 : 0.55) : 0;
            p.ring.material.color.setHex(p.team === 'you' ? COL.aim : COL.cpu);
            p.ring.scale.setScalar(p.hasBall ? 1.1 : 1);
        });
    }

    /* ==========================================================================
       § 9. POSSESSION + FORMATION — everything is derived from the carrier and
       the goal being attacked, so both directions read identically.
       ========================================================================== */
    let PLAY = null;

    /** The spot an attacking teammate holds, from the ball toward the goal. */
    function attackingSpot(from, goal, i) {
        const off = LANE_OFFSET[i % LANE_OFFSET.length];
        const t = LANE_DEPTH[i % LANE_DEPTH.length];
        return {
            x: clamp(lerp(from.x, goal.x, t) + off * 0.55, 8, 92),
            y: clamp(lerp(from.y, goal.y, t), 6, 94)
        };
    }

    /** The spot an auto-drifting defender holds, between ball and own goal. */
    function defendingSpot(from, own, i) {
        const t = [0.42, 0.60, 0.78][i % 3];
        const ox = [-17, 0, 17][i % 3];
        return {
            x: clamp(lerp(50, from.x, 0.62) + ox, 8, 92),
            y: clamp(lerp(from.y, own.y, t), 6, 94)
        };
    }

    /** Where a keeper stands with the ball somewhere else. §2: on their line. */
    function keeperHome(team) {
        const own = ownGoal(team);
        return { x: 50, y: own.y + attackSide(team) * KEEPER_LINE };
    }
    const keeperSlideX = () => clamp(50 + (ball.x - 50) * 0.35, 40, 60);

    /** Where a defender must be to meet a pass at the earliest possible moment. */
    function interceptTarget(P, from, to) {
        const t = interceptionTime(P, from, to);
        if (!Number.isFinite(t)) {
            /* Unwinnable on the ground: fall back to the midpoint of the lane,
               which is still a useful "get in the way" position. */
            return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
        }
        return pointAlong(from, to, BALL_SPEED, t);
    }

    /** Rebuild the play context around whoever now has the ball. */
    function setCarrier(p) {
        state.possession = p.team;
        allPlayers.forEach(x => { x.hasBall = false; x.dest = null; });
        p.hasBall = true;
        ball.mode = 'held';
        ball.holder = p;
        ball.alive = false;
        ball.passTarget = null;
        ball.lastTouch = p;

        const atk = p.team, def = other(atk);
        PLAY = {
            atk, def,
            goal: goalFor(atk),
            own: ownGoal(atk),
            carrier: p,
            receiver: null,
            keeper: keeperOf(def),
            cpuThink: 0.9 + Math.random() * 0.7,
            threat: null
        };
        assignControls();
        bus.emit('role');
    }

    /**
     * §4/§6 — who the human is actually holding. Attacking: the carrier is the
     * gesture, the other four are draggable runners. Defending: the two
     * outfielders nearest the ball are the interceptor and the marker; everyone
     * else holds shape for them.
     */
    function assignControls() {
        allPlayers.forEach(p => { p.controlled = false; p.duty = null; });
        if (!PLAY) return;
        const atk = PLAY.atk;
        if (atk === 'you') {
            PLAY.carrier.controlled = true;
            const mates = teamOutfield('you').filter(p => p !== PLAY.carrier);
            mates.forEach(m => { m.controlled = true; });
            const sorted = mates.slice().sort((a, b) => dist(a, PLAY.goal) - dist(b, PLAY.goal));
            PLAY.receiver = sorted[0];
            if (PLAY.receiver) PLAY.receiver.duty = 'receiver';
        } else {
            const near = teamOutfield('you').slice().sort((a, b) => dist(a, ball) - dist(b, ball));
            if (near[0]) { near[0].controlled = true; near[0].duty = 'interceptor'; }
            if (near[1]) { near[1].controlled = true; near[1].duty = 'marker'; }
            const k = keeperOf('you');
            if (k) k.controlled = true;
        }
        refreshRings();
    }

    function hideOverlays() {
        aimLine.visible = false;
        diveLine.visible = false;
        shotLine.visible = false;
        runnerMarker.visible = false;
        diveMarker.visible = false;
    }

    /* ==========================================================================
       § 9.b FEEL — audio, shake, banner (rides on top; never inside the rulebook)
       ========================================================================== */
    const Sfx = (() => {
        let ctx = null, master = null, muted = false;
        function ensure() {
            if (ctx) return ctx;
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0.35;
            master.connect(ctx.destination);
            return ctx;
        }
        function unlock() {
            const c = ensure();
            if (c && c.state === 'suspended') c.resume();
        }
        function tone(freq, dur, type, vol, when) {
            const c = ensure();
            if (!c || muted) return;
            const t0 = c.currentTime + (when || 0);
            const o = c.createOscillator(), g = c.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol === undefined ? 0.3 : vol, t0 + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(master);
            o.start(t0); o.stop(t0 + dur + 0.03);
        }
        return {
            unlock,
            get muted() { return muted; },
            toggle() { muted = !muted; return muted; },
            kick() { tone(150, .12, 'triangle', .4); tone(90, .16, 'sine', .3, .01); },
            pass() { tone(420, .07, 'triangle', .18); },
            good() { tone(660, .09, 'sine', .22); tone(880, .1, 'sine', .18, .07); },
            bad() { tone(190, .18, 'sawtooth', .22); tone(120, .22, 'square', .16, .04); },
            goal() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .26, i * .09)); },
            save() { tone(300, .12, 'square', .18); tone(220, .2, 'square', .14, .1); },
            whistle() { tone(1750, .16, 'square', .12); setTimeout(() => tone(1750, .18, 'square', .12), 170); }
        };
    })();

    function shake(amount) { state.trauma = clamp(state.trauma + amount, 0, 1); }
    /* Every piece of transient feedback lives in the HUD docks or on the
       renderer itself. Nothing is drawn over the ground: the turf carries the
       ball and the players and nothing else. */
    const bannerEl = document.getElementById('banner');
    function banner(text, color) {
        bannerEl.textContent = text;
        bannerEl.style.color = color;
        bannerEl.classList.add('show');
        clearTimeout(banner._t);
        banner._t = setTimeout(() => bannerEl.classList.remove('show'), 1100);
    }

    /* ==========================================================================
       § 10. HUD — event-driven DOM overlay + screen stack
       The HUD is a set of flow siblings of the stage, so it can only ever shrink
       the pitch, never cover it (game-ui-ux: anchors + containers).
       ========================================================================== */
    const el = id => document.getElementById(id);
    const ui = {
        hudTop: el('hud-top'), hudBottom: el('hud-bottom'), pens: el('hud-pens'),
        role: el('role-badge'), poss: el('possession-chip'),
        scoreYou: el('score-you').querySelector('strong'),
        scoreCpu: el('score-cpu').querySelector('strong'),
        halfLabel: el('half-label'), clock: el('clock'), clockBar: el('clock-bar'),
        log: el('log'), instruction: el('instruction'),
        mute: el('btn-mute'), pause: el('btn-pause'), help: el('btn-help'),
        difficulty: el('difficulty'),
        soTitle: el('so-title'), soYou: el('so-you'), soCpu: el('so-cpu'),
        soScore: el('so-score'), soTurn: el('so-turn')
    };

    let lastClock = -1, lastBar = -1;

    function pushLog(text, cls) {
        const li = document.createElement('li');
        li.textContent = text;
        if (cls) li.className = cls;
        ui.log.prepend(li);
        while (ui.log.children.length > 5) ui.log.lastChild.remove();
    }
    const log = (text, cls) => bus.emit('log', { text, cls });

    bus.on('score', () => {
        ui.scoreYou.textContent = state.humanScore;
        ui.scoreCpu.textContent = state.cpuScore;
    });
    bus.on('role', () => {
        if (SO.active) return;
        const attacking = state.possession === 'you';
        ui.role.textContent = attacking ? 'ATTACK' : 'DEFEND';
        ui.role.className = attacking ? 'attack' : 'defend';
        ui.poss.className = 'chip ' + state.possession;
        ui.poss.innerHTML = '<i class="dot"></i>' + (state.possession === 'you' ? 'YOU · BALL' : 'CPU · BALL');
        ui.instruction.textContent = attacking
            ? 'Drag from the ball-carrier toward a teammate and release to pass · double-tap the goal mouth to shoot.'
            : 'Drag your interceptor and marker to close the lane · drag your keeper to set the dive.';
    });
    bus.on('log', d => pushLog(d.text, d.cls));
    bus.on('half', () => {
        ui.halfLabel.textContent = SO.active ? 'PENALTIES'
            : (state.phase === 'over' ? 'FULL TIME' : 'HALF ' + state.half);
    });

    /* --- screen stack (game-ui-ux: push/pop, focus handed to the top screen) --- */
    const SCREENS = {
        menu: el('screen-menu'), tutorial: el('screen-tutorial'),
        pause: el('screen-pause'), over: el('screen-over')
    };
    const stack = [];
    let focusMemory = [];
    function topScreen() { return stack.length ? stack[stack.length - 1] : null; }
    function pushScreen(name, opts) {
        if (topScreen() === name) return;
        const node = SCREENS[name];
        if (!node) return;
        focusMemory.push(document.activeElement);
        stack.push(name);
        node.hidden = false;
        const first = (opts && opts.focus) ? node.querySelector(opts.focus) : node.querySelector('.btn');
        if (first) requestAnimationFrame(() => first.focus());
        bus.emit('screen', name);
    }
    function popScreen() {
        const name = stack.pop();
        if (!name) return;
        SCREENS[name].hidden = true;
        const prev = focusMemory.pop();
        if (prev && prev.focus) prev.focus();
        bus.emit('screen', topScreen());
        return name;
    }
    bus.on('screen', name => {
        const show = name === null || name === 'pause';
        ui.hudTop.hidden = !show;
        ui.hudBottom.hidden = !show;
        ui.pens.hidden = !(show && SO.active);
        if (name === null) ui.pause.textContent = '❙❙';
    });

    /* ==========================================================================
       § 11. LIFECYCLE (canonical §3)
       Only two hard resets exist: a GOAL (centre kick-off to the conceding side)
       and a SAVE (the saving side restarts from their own penalty spot). An
       interception never resets — possession flips where the ball was cut out.
       ========================================================================== */

    /** Put both teams back in shape around a restart for `team` with the ball. */
    function arrangeRestart(team, pos) {
        const atk = team, def = other(atk), goal = goalFor(atk), own = ownGoal(def);
        const carrier = teamOutfield(atk)[0];
        const rng = mulberry32(hashSeed(state.seed, state.half, Math.floor(state.halfT)));

        const place = (p, spot, dropBack) => {
            p.ax = spot.x; p.ay = spot.y;
            p.dest = null; p.selected = false; p.held = false;
            const back = unit(own.y - spot.y, 0);
            p.x = clamp(spot.x + (dropBack ? randRange(rng, -6, 6) : 0), 6, 94);
            p.y = clamp(spot.y + back.y * (dropBack ? 11 : 0) + (dropBack ? randRange(rng, -4, 4) : 0), 5, 95);
            p.px = p.x; p.py = p.y;
        };

        place(carrier, pos, true);
        teamOutfield(atk).filter(p => p !== carrier).forEach((p, i) => {
            place(p, attackingSpot(pos, goal, i), true);
        });
        teamOutfield(def).forEach((p, i) => {
            place(p, defendingSpot(pos, own, i), true);
        });
        [keeperOf('you'), keeperOf('cpu')].forEach(k => {
            const home = keeperHome(k.team);
            k.ax = home.x; k.ay = home.y;
            k.x = home.x; k.y = home.y; k.px = k.x; k.py = k.y;
            k.dest = null; k.held = false; k.dive = null;
        });

        setCarrier(carrier);
        state.phase = 'restart';
        state.phaseT = 0;
        hideOverlays();
    }

    /** §3 — centre kick-off, to the conceding side. */
    function kickoff(team) {
        arrangeRestart(team, { x: 50, y: 50 });
        log((team === 'you' ? 'Your' : 'CPU') + ' kick-off from the centre spot.', '');
    }

    /** §3 — a save is a goal kick from the saving side's own penalty spot. */
    function goalKick(team) {
        const own = ownGoal(team);
        const spot = { x: 50 + (Math.random() - .5) * 8, y: own.y + attackSide(team) * PENALTY_SPOT };
        arrangeRestart(team, spot);
        log((team === 'you' ? 'Your' : 'CPU') + ' keeper restarts from the penalty spot.', '');
    }

    function beginMatch() {
        state.humanScore = 0; state.cpuScore = 0;
        state.half = 1; state.halfT = 0; state.pendingHalf = false;
        state.seed = (Math.random() * 1e9) | 0;
        state.trauma = 0;
        state.phase = 'play';
        endShootout(true);
        ui.log.innerHTML = '';
        bus.emit('score'); bus.emit('half');
        Sfx.unlock(); Sfx.whistle();
        hideOverlays();
        kickoff(Math.random() < 0.5 ? 'you' : 'cpu');
        log('Two 2:00 halves — ' + formatClock(HALF_LENGTH) + ' each. You attack the top goal.', '');
    }

    /** §3 — half and full time. The ball is always dead before the whistle. */
    function endHalf() {
        state.pendingHalf = false;
        if (state.half === 1) {
            state.half = 2;
            state.halfT = 0;
            bus.emit('half');
            Sfx.whistle();
            banner('HALF TIME', CSS.warn);
            log('Half time. ' + state.humanScore + '–' + state.cpuScore + '.', '');
            kickoff(other(state.possession));
        } else {
            finishMatch();
        }
    }

    function finishMatch() {
        state.phase = 'over';
        bus.emit('half');
        Sfx.whistle();
        const level = state.humanScore === state.cpuScore;
        const won = state.humanScore > state.cpuScore;
        el('over-title').textContent = level
            ? 'LEVEL ' + state.humanScore + '–' + state.cpuScore
            : (won ? 'YOU WIN ' : 'CPU WINS ') + state.humanScore + '–' + state.cpuScore;
        el('over-detail').textContent = level
            ? 'Full time. Settle it from the spot.'
            : 'Full time after two ' + formatClock(HALF_LENGTH) + ' halves.';
        /* §0/§10 — the shootout is a manual choice, and only when level. */
        const pens = el('btn-pens');
        if (pens) pens.hidden = !level;
        el('screen-over').querySelector('.eyebrow').textContent = level ? 'Level at full time' : 'Full time';
        log(level ? 'Full time: level. Go to penalties?' : (won ? 'Full time: you win!' : 'Full time: CPU wins.'), won ? 'good' : 'bad');
        pushScreen('over', { focus: level ? '#btn-pens' : '#btn-again' });
    }

    /* ==========================================================================
       § 12. THE BALL — one continuous §7 race, checked every single frame
       ========================================================================== */
    const defenderInputs = team => teamOutfield(team).map(p => ({ x: p.x, y: p.y, speed: p.speed }));

    /** A defender's cut is checked against the ball's live position. */
    function contestFlight() {
        const atk = state.possession, def = other(atk);

        /* outfielders of the defending side may cut any ball in flight */
        for (const p of teamOutfield(def)) {
            if (dist(p, ball) <= CATCH_RADIUS) return cutOut(p, atk);
        }
        /* the defending keeper: a full reach against a shot, a normal catch
           radius against a pass */
        const k = keeperOf(def);
        if (k) {
            const r = ball.mode === 'shot' ? KEEPER_REACH : CATCH_RADIUS;
            if (dist(k, ball) <= r) return caughtByKeeper(k, atk);
        }
    }

    /** §3 — an interception never resets: possession flips exactly here. */
    function cutOut(p, atk) {
        ball.mode = 'held'; ball.alive = false;
        ball.x = p.x; ball.y = p.y;
        if (p.team !== atk) {
            Sfx.bad(); shake(.28);
            banner('INTERCEPTED', CSS.bad);
            log(logName(p) + ' cuts it out.', p.team === 'you' ? 'good' : 'bad');
        }
        setCarrier(p);
    }

    /** §3 — the save is a goal kick, and the clock never stops for it. */
    function caughtByKeeper(k, atk) {
        const wasShot = ball.mode === 'shot';
        ball.mode = 'held'; ball.alive = false;
        ball.x = k.x; ball.y = k.y;
        if (wasShot || k.team !== atk) {
            Sfx.save(); shake(.22);
            banner('SAVED', CSS.warn);
            log(k.team === 'you' ? 'Your keeper saves it!' : 'CPU keeper saves it!', k.team === 'you' ? 'good' : 'bad');
        }
        goalKick(k.team);
    }

    function scoreGoal(team) {
        if (team === 'you') state.humanScore++; else state.cpuScore++;
        bus.emit('score');
        Sfx.goal(); shake(.7);
        banner('GOAL', team === 'you' ? CSS.you : CSS.cpu);
        log(team === 'you' ? 'GOAL! ' + state.humanScore + '–' + state.cpuScore : 'CPU score. ' + state.humanScore + '–' + state.cpuScore,
            team === 'you' ? 'good' : 'bad');
        kickoff(other(team));
    }

    /** What happens when the ball finishes its travel without being cut out. */
    function resolveArrival() {
        ball.alive = false;
        const goal = goalFor(state.possession);

        if (ball.mode === 'shot') {
            if (isOnTarget(ball.target.x, goal.x, GOAL_HALF_WIDTH)) return scoreGoal(state.possession);
            Sfx.bad(); banner('WIDE', CSS.bad);
            log('Shot wide — goal kick.', state.possession === 'you' ? 'bad' : 'good');
            return goalKick(other(state.possession));
        }

        const recv = ball.passTarget;
        if (recv && recv.team === state.possession) {
            setCarrier(recv);
            Sfx.good();
            return;
        }
        /* Nobody claimed it: the ball is simply loose, and the nearest player
           in either kit wins the race for it. */
        ball.mode = 'loose';
        ball.alive = true;
    }

    function stepBall(dt) {
        if (ball.mode === 'held' && ball.holder) {
            const h = ball.holder;
            const g = PLAY ? PLAY.goal : GOAL.you;
            const d = unit(g.x - h.x, g.y - h.y);
            ball.x = h.x + d.x * 0.95;
            ball.y = h.y + d.y * 0.95;
            ball.h = 0.42;
        } else if (ball.mode === 'pass' || ball.mode === 'shot') {
            if (!ball.alive) return;
            ball.t = Math.min(ball.total, ball.t + dt);
            ball.travel = ball.speed * ball.t;
            ball.x = ball.from.x + ball.dir.x * ball.travel;
            ball.y = ball.from.y + ball.dir.y * ball.travel;
            const frac = ball.total > 0 ? clamp(ball.t / ball.total, 0, 1) : 1;
            ball.h = 0.42 + Math.sin(Math.PI * frac) * ball.arc;

            contestFlight();
            if (ball.t >= ball.total && ball.mode !== 'held') resolveArrival();
        } else if (ball.mode === 'loose') {
            /* the loose ball sits still; whoever reaches it takes it */
            for (const p of allPlayers) {
                if (dist(p, ball) <= CATCH_RADIUS) { setCarrier(p); return; }
            }
        }
        ballMesh.position.set(worldX(ball.x), ball.h, worldZ(ball.y));
        ballShadow.position.set(worldX(ball.x), 0.04, worldZ(ball.y));
        const s = 1 - clamp(ball.h / 4, 0, .6);
        ballShadow.scale.setScalar(s);
        ballShadow.material.opacity = 0.75 * s;
    }

    const logName = p => p.label;

    /* ==========================================================================
       § 13. PLAYER MOVEMENT — human-controlled players hold, everyone else holds
       shape. There is no turn, so all of this runs every frame.
       ========================================================================== */
    function moveCarrier(dt) {
        const c = PLAY.carrier;
        if (c.dest) return;                       // never while it is being passed
        if (dist(c, PLAY.goal) > SHOT_RANGE * 0.94) {
            const d = unit(PLAY.goal.x - c.x, PLAY.goal.y - c.y);
            moveToward(c, c.x + d.x * 3, c.y + d.y * 3, DRILL_SPEED, dt);
        }
    }

    function updateKeeper(k, dt) {
        if (!k) return;
        const home = keeperHome(k.team);
        if (k.dive) {
            moveToward(k, k.dive.x, k.dive.y, DIVE_SPEED, dt);
            return;
        }
        moveToward(k, keeperSlideX(), home.y, DRILL_SPEED * 1.5, dt);
    }

    function simPlayers(dt) {
        const atk = PLAY.atk, def = PLAY.def;

        /* 1. anyone the human has sent somewhere runs there at full pace */
        allPlayers.forEach(p => {
            if (p.dest && moveToward(p, p.dest.x, p.dest.y, p.speed, dt)) p.dest = null;
        });

        /* 2. attacking shape — the receiver and runners push into the final third */
        teamOutfield(atk).forEach((p, i) => {
            if (p === PLAY.carrier || p.dest) return;
            if (p.team === 'you' && p.controlled) return;   // the human's runners hold
            const s = attackingSpot(PLAY.carrier, PLAY.goal, i);
            moveToward(p, s.x, s.y, DRILL_SPEED, dt);
        });
        moveCarrier(dt);

        /* 3. defending shape — the human's two hold, the rest drop between the
              ball and their own goal */
        teamOutfield(def).forEach((p, i) => {
            if (p.dest) return;
            if (p.team === 'you' && p.controlled) return;
            if (p.team === 'cpu') {
                const role = p.duty;
                if (role === 'interceptor') {
                    const to = PLAY.threat || PLAY.carrier;
                    const s = interceptTarget(p, PLAY.carrier, to);
                    moveToward(p, s.x, s.y, PLAYER_SPEED * 0.94, dt);
                    return;
                }
                if (role === 'marker') {
                    const c = PLAY.carrier;
                    const s = { x: clamp(c.x - (PLAY.goal.x - c.x) * 0.12, 6, 94), y: clamp(lerp(c.y, PLAY.goal.y, 0.12), 6, 94) };
                    moveToward(p, s.x, s.y, PLAYER_SPEED * 0.92, dt);
                    return;
                }
            }
            const s = defendingSpot(PLAY.carrier, PLAY.own, i);
            moveToward(p, s.x, s.y, DRILL_SPEED, dt);
        });

        /* 4. a loose ball is a race for the nearest player in each kit */
        if (ball.mode === 'loose') {
            ['you', 'cpu'].forEach(team => {
                const near = allPlayers
                    .filter(p => p.team === team)
                    .sort((a, b) => dist(a, ball) - dist(b, ball))[0];
                if (near && !near.dest) moveToward(near, ball.x, ball.y, PLAYER_SPEED, dt);
            });
        }

        updateKeeper(keeperOf(atk), dt);
        updateKeeper(keeperOf(def), dt);
    }

    /* ==========================================================================
       § 14. CPU — it reads the same geometry the tests do. `resolvePassRace`
       scores its pass options, `interceptionTime` places its interceptor and
       `shotOutcome` tells its keeper which way to go.
       ========================================================================== */
    function cpuAssignDuties() {
        const dfs = teamOutfield('cpu').slice().sort((a, b) => dist(a, ball) - dist(b, ball));
        dfs.forEach((p, i) => { p.duty = i === 0 ? 'interceptor' : (i === 1 ? 'marker' : null); });
    }

    /** The most dangerous receiver: the one closest to the goal it is attacking. */
    function cpuThreat() {
        const mates = teamOutfield(state.possession).filter(p => p !== PLAY.carrier);
        if (!mates.length) return PLAY.carrier;
        return mates.slice().sort((a, b) => dist(a, PLAY.goal) - dist(b, PLAY.goal))[0];
    }

    /** Score each pass with the very race the player will face. */
    function cpuChoosePass(rng) {
        const from = { x: PLAY.carrier.x, y: PLAY.carrier.y };
        const cands = teamOutfield('cpu').filter(p => p !== PLAY.carrier);
        const defenders = defenderInputs('you').concat([{ x: keeperOf('you').x, y: keeperOf('you').y, speed: PLAYER_SPEED }]);
        const scored = cands.map(m => {
            const to = { x: m.x, y: m.y };
            const race = resolvePassRace({ from, to, defenders });
            const safe = race.outcome === 'COMPLETE' ? 1 : 0.15;
            const progress = clamp((dist(from, PLAY.goal) - dist(to, PLAY.goal)) / 60, 0, 1);
            const shot = dist(to, PLAY.goal) <= SHOT_RANGE ? 0.45 : 0;
            const v = 0.5 * safe + 0.32 * progress + shot + 0.06;
            /* blend toward the deliberately naive baseline as difficulty → 0 */
            return lerp(0.3, v, state.difficulty);
        });
        if (rng() > 0.15 + 0.85 * state.difficulty) return cands[Math.floor(rng() * cands.length)] || cands[0];
        return weightedPick(cands, scored, rng).item || cands[0];
    }

    function cpuThink(dt) {
        if (state.possession !== 'cpu') return;
        cpuAssignDuties();
        PLAY.threat = cpuThreat();
        PLAY.cpuThink -= dt;
        if (PLAY.cpuThink > 0) return;

        const c = PLAY.carrier;
        const rng = mulberry32(hashSeed(state.seed, state.half, Math.floor(state.halfT * 60)));

        /* §5 — inside range it may go for goal instead */
        const toGoal = dist(c, PLAY.goal);
        if (toGoal <= SHOT_RANGE && rng() < 0.25 + 0.5 * state.difficulty) {
            const aim = clamp(PLAY.goal.x + randRange(rng, -GOAL_HALF_WIDTH * 0.85, GOAL_HALF_WIDTH * 0.85), 0, 100);
            shoot(c, { x: aim, y: PLAY.goal.y });
            return;
        }

        const target = cpuChoosePass(rng);
        if (!target) return;
        passTo(c, target);
    }

    /* ==========================================================================
       § 15. ACTIONS — the three things a human can do, and the two the CPU does.
       ========================================================================== */
    function passTo(from, to, speed) {
        ball.lastTouch = from;
        launchBall({ x: from.x, y: from.y }, { x: to.x, y: to.y },
            speed || BALL_SPEED, { mode: 'pass', passTarget: to, arc: ARC_PASS });
        if (PLAY) PLAY.receiver = to;
        Sfx.kick();
    }

    /** §5 — a shot is only legal inside SHOT_RANGE, and it flies at SHOT_SPEED. */
    function shoot(from, target) {
        if (!PLAY) return false;
        if (dist(from, PLAY.goal) > SHOT_RANGE) {
            log('Too far out to shoot — get inside ' + SHOT_RANGE + '.', '');
            Sfx.bad();
            return false;
        }
        ball.lastTouch = from;
        launchBall({ x: from.x, y: from.y }, target, SHOT_SPEED, { mode: 'shot', arc: ARC_SHOT });
        /* §7 — the keeper's dive is set the instant the shot leaves the boot,
           and stays re-writable for the whole flight. */
        const k = keeperOf(other(state.possession));
        if (k && !k.held) {
            k.dive = k.team === 'cpu'
                ? cpuKeeperDive(k, target)
                : defaultDiveTarget(k, target, KEEPER_REACH);
        }
        Sfx.kick(); shake(.12);
        log((from.team === 'you' ? 'You shoot' : 'CPU shoots') + '!', '');
        return true;
    }

    /**
     * §7 — a keeper with no instruction dives toward the shot's side. The CPU's
     * keeper is allowed to *read* it, and it reads with `shotOutcome`, so its
     * eyesight is the same geometry the property tests cover.
     */
    function cpuKeeperDive(k, target) {
        const home = keeperHome(k.team);
        const guessed = defaultDiveTarget(k, target, KEEPER_REACH);
        if (Math.random() > 0.2 + 0.75 * state.difficulty) return guessed;
        const committed = { x: clamp(target.x, 8, 92), y: home.y };
        const read = shotOutcome({
            from: { x: ball.from.x, y: ball.from.y },
            target,
            keeper: { x: k.x, y: k.y },
            keeperTarget: committed,
            goalX: PLAY.goal.x,
            goalHalfWidth: GOAL_HALF_WIDTH
        });
        const blind = shotOutcome({
            from: { x: ball.from.x, y: ball.from.y },
            target,
            keeper: { x: k.x, y: k.y },
            keeperTarget: guessed,
            goalX: PLAY.goal.x,
            goalHalfWidth: GOAL_HALF_WIDTH
        });
        return read.outcome === 'SAVED' || blind.outcome !== 'SAVED' ? committed : guessed;
    }

    /* ==========================================================================
       § 16. PENALTY SHOOTOUT (§10)
       A different mode with its own state machine:
         AIM → CHECK_ON_TARGET → DIVE → RESOLVE → NEXT_KICKER
       ========================================================================== */
    const SO = {
        active: false,
        phase: 'aim',            // aim | dive | flight | result
        turn: 'you',             // whose kick it is
        you: 0, cpu: 0,
        takenYou: 0, takenCpu: 0,
        aim: null, dive: null,
        result: null,
        t: 0,
        from: null, to: null
    };

    const soGoal = () => GOAL.you;                       // one end, always
    const soSpot = () => ({ x: 50, y: soGoal().y - PENALTY_SPOT });
    const soKeeper = () => {
        const k = keeperOf(other(SO.turn));
        const home = keeperHomeSnapshot(k);
        return home;
    };
    /** The keeper stands on the line for a kick, not at their open-play post. */
    function keeperHomeSnapshot(k) {
        const g = soGoal();
        return { x: k.x, y: g.y + (g.y === 0 ? KEEPER_LINE : -KEEPER_LINE) * -1 };
    }

    function setPenaltyView(on) {
        view.zoom = on ? SO_ZOOM : 1;
        view.panY = on ? SO_PAN_Y : 50;
        fitView();
    }

    function beginShootout() {
        while (topScreen()) popScreen();
        SO.active = true;
        SO.you = 0; SO.cpu = 0;
        SO.takenYou = 0; SO.takenCpu = 0;
        SO.result = null;
        state.phase = 'shootout';
        setPenaltyView(true);
        /* §8 — the HUD has swapped modes: the readouts are the shootout's now, so
           the regulation log and instruction line would only be stale copy. */
        ui.pens.hidden = false;
        ui.log.innerHTML = '';
        ui.instruction.textContent = 'Draw the aim line, then draw the dive line. Within reach it is saved.';
        bus.emit('half');
        soHudState();
        soSetupKick(Math.random() < 0.5 ? 'you' : 'cpu');
        log('Penalties. Five kicks each, then sudden death.', '');
    }

    function endShootout(silent) {
        SO.active = false;
        if (!silent) return;
        setPenaltyView(false);
        if (ui.pens) ui.pens.hidden = true;
    }

    function soSetupKick(turn) {
        SO.turn = turn;
        SO.phase = 'aim';
        SO.aim = null;
        SO.dive = null;
        SO.result = null;
        SO.t = 0;
        hideOverlays();

        /* place the kicker and the keeper on the line */
        const spot = soSpot();
        const goal = soGoal();
        const kicker = soKickerOf(turn);
        const defTeam = other(turn);
        const k = keeperOf(defTeam);
        const keeperY = goal.y - PENALTY_LINE();
        allPlayers.forEach(p => { p.controlled = false; p.dest = null; p.dive = null; p.held = false; });
        if (kicker) { kicker.controlled = true; setPlayerPos(kicker, spot.x, spot.y); }
        if (k) { k.controlled = true; setPlayerPos(k, 50, keeperY); }
        ball.mode = 'held'; ball.holder = kicker; ball.alive = false;
        if (kicker) { ball.x = spot.x; ball.y = spot.y; ball.h = 0.42; }

        bus.emit('role');
        soHudState();
        if (turn === 'cpu') {
            SO.t = 1.0;   // the CPU's routine
            log('CPU steps up…', '');
        } else {
            log('Your kick — drag from the spot and release.', '');
        }
    }
    /* §10 — the keeper works from the goal line, KEEPER_LINE out from it. */
    function PENALTY_LINE() { return SO_KEEPER_LINE; }
    const SO_KEEPER_LINE = 4;

    /** The shootout's kickers: the five outfield players, in shirt order. */
    function soKickerOf(team) {
        const roster = teamOutfield(team);
        if (!roster.length) return null;
        const taken = team === 'you' ? SO.takenYou : SO.takenCpu;
        const kicks = RULES.SHOOTOUT_KICKS;
        return roster[taken % roster.length] || roster[roster.length - 1];
    }

    function setPlayerPos(p, x, y) {
        p.x = x; p.y = y; p.px = x; p.py = y;
        p.ax = x; p.ay = y; p.tx = x; p.ty = y;
        syncToMesh(p);
    }

    function soSetAim(target) {
        if (SO.phase !== 'aim') return;
        SO.aim = target;
    }

    /** CHECK_ON_TARGET then DIVE. */
    function soCommitAim() {
        if (!SO.aim) return;
        const goal = soGoal();
        if (!isOnTarget(SO.aim.x, goal.x, GOAL_HALF_WIDTH)) {
            /* §10 — off target is an automatic miss */
            SO.result = { outcome: 'MISS', dist: Infinity, onTarget: false };
            soFly({ x: SO.aim.x, y: goal.y }, () => soResolve());
            return;
        }
        SO.phase = 'dive';
        SO.t = 0;
        const defTeam = other(SO.turn);
        const k = keeperOf(defTeam);
        if (defTeam === 'cpu') {
            /* the CPU's keeper reads the kick with probability = difficulty */
            const read = Math.random() < 0.22 + 0.78 * state.difficulty;
            const side = Math.random() < 0.5 ? -1 : 1;
            const target = read
                ? { x: SO.aim.x, y: k.y }
                : { x: clamp(SO.aim.x + side * (GOAL_HALF_WIDTH * 1.35), 4, 96), y: k.y };
            k.dive = target;
            SO.dive = target;
            SO.t = 0.75;
            setPenaltyView(true);
        } else {
            log('Draw your dive — anywhere along the line.', '');
            SO.t = 4.5;   // no dive? default to the shot's side
        }
    }

    function soCommitDive(point) {
        if (SO.phase !== 'dive') return;
        SO.dive = point;
        const k = keeperOf(other(SO.turn));
        if (k) k.dive = point;
        soResolve();
    }

    function soFly(to, after) {
        SO.phase = 'flight';
        SO.t = 0;
        SO.from = { x: ball.x, y: ball.y };
        SO.to = to;
        SO.after = after;
    }

    function soResolve() {
        if (!SO.result) {
            SO.result = penaltyKickOutcome({
                shotTarget: SO.aim,
                divePoint: SO.dive || { x: SO.aim.x, y: 0 },
                goalX: soGoal().x,
                goalHalfWidth: GOAL_HALF_WIDTH
            });
        }
        SO.phase = 'result';
        SO.t = 0;

        const kicker = SO.turn;
        if (SO.result.outcome === 'GOAL') {
            if (kicker === 'you') SO.you++; else SO.cpu++;
            Sfx.goal(); shake(.5);
            banner('GOAL', kicker === 'you' ? CSS.you : CSS.cpu);
        } else if (SO.result.outcome === 'SAVED') {
            Sfx.save(); shake(.25);
            banner('SAVED', CSS.warn);
        } else {
            Sfx.bad();
            banner('MISS', CSS.bad);
        }
        if (kicker === 'you') SO.takenYou++; else SO.takenCpu++;
        log((kicker === 'you' ? 'You' : 'CPU') + ': ' + SO.result.outcome + ' — ' + SO.you + '–' + SO.cpu,
            (SO.result.outcome === 'GOAL') === (kicker === 'you') ? 'good' : 'bad');
        soHudState();
    }

    function soHudState() {
        if (!ui.soScore) return;
        ui.soScore.textContent = SO.you + ' – ' + SO.cpu;
        ui.soTurn.textContent = SO.turn === 'you' ? 'YOUR KICK' : 'CPU KICK';
        const dots = (n, taken) => {
            let s = '';
            for (let i = 0; i < Math.max(RULES.SHOOTOUT_KICKS, taken); i++) {
                s += '<i class="dot' + (i < taken ? ' taken' : '') + (i < n ? ' scored' : '') + '"></i>';
            }
            return s;
        };
        ui.soYou.innerHTML = dots(SO.you, SO.takenYou);
        ui.soCpu.innerHTML = dots(SO.cpu, SO.takenCpu);
        ui.soTitle.textContent = (SO.takenYou + SO.takenCpu) >= RULES.SHOOTOUT_KICKS * 2 ? 'SUDDEN DEATH' : 'PENALTIES';
    }

    function soNext() {
        if (shootoutDecided(SO.you, SO.cpu, SO.takenYou, SO.takenCpu)) return soFinished();
        soSetupKick(other(SO.turn));
    }

    function soFinished() {
        SO.active = false;
        state.phase = 'over';
        setPenaltyView(false);
        const won = SO.you > SO.cpu;
        el('over-title').textContent = (won ? 'YOU WIN ' : 'CPU WINS ') + SO.you + '–' + SO.cpu + ' ON PENALTIES';
        el('over-detail').textContent = 'Settled from the spot after ' + SO.takenYou + ' kicks each.';
        const pens = el('btn-pens');
        if (pens) pens.hidden = true;
        bus.emit('half');
        Sfx.whistle();
        pushScreen('over', { focus: '#btn-again' });
    }

    function soUpdate(dt) {
        SO.t -= dt;
        if (SO.phase === 'aim') {
            if (SO.turn === 'cpu' && SO.t <= 0) {
                const rng = mulberry32(hashSeed(state.seed, 7, SO.takenYou + SO.takenCpu));
                const spread = GOAL_HALF_WIDTH * (0.55 + 0.5 * state.difficulty);
                /* miss the target occasionally, more often on the lower settings */
                const wild = rng() < 0.18 * (1 - state.difficulty);
                const aim = wild
                    ? clamp(soGoal().x + (rng() < .5 ? -1 : 1) * (GOAL_HALF_WIDTH + randRange(rng, 1, 9)), 2, 98)
                    : clamp(soGoal().x + randRange(rng, -spread, spread), 2, 98);
                soSetAim({ x: aim, y: soGoal().y });
                soCommitAim();
            }
        } else if (SO.phase === 'dive') {
            if (SO.t <= 0) {
                /* the human never dived — §7 says no input means the default dive */
                const k = keeperOf(other(SO.turn));
                soCommitDive(k ? defaultDiveTarget(k, SO.aim, KEEPER_REACH) : { x: SO.aim.x, y: 0 });
            }
        } else if (SO.phase === 'flight') {
            const f = clamp(SO.t / 0.55, 0, 1);
            if (SO.from) {
                ball.x = lerp(SO.from.x, SO.to.x, f);
                ball.y = lerp(SO.from.y, SO.to.y, f);
                ball.h = 0.42 + Math.sin(Math.PI * f) * ARC_SHOT;
            }
            if (f >= 1) {
                const cb = SO.after; SO.after = null;
                if (cb) cb();
            }
        } else if (SO.phase === 'result') {
            if (SO.t >= 1.2) soNext();
        }
        /* the keeper's dive always plays out */
        const k = keeperOf(other(SO.turn));
        if (k && k.dive) moveToward(k, k.dive.x, k.dive.y, DIVE_SPEED, dt);
    }

    /* ==========================================================================
       § 17. INPUT — Pointer Events: one code path for mouse, touch and pen
       ========================================================================== */
    const drag = { kind: null, player: null, x0: 0, y0: 0, x: 0, y: 0, moved: 0, id: null };
    let lastTap = { t: 0, x: 0, y: 0 };

    function canvasPoint(e) {
        const r = canvas.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        /* view.hw is in screen units, where x is already compressed by KX —
           divide it back out to land on the canonical 0…100 grid. `panY` is
           where the screen centre sits in game-y (the §10 zoom moves it). */
        const gx = 50 + ((px / r.width) * 2 - 1) * view.hw / KX;
        const gy = view.panY + (1 - (py / r.height) * 2) * view.hh;
        return { x: gx, y: gy, px, py, rect: r };
    }
    const screenRadius = rect => Math.max(18, rect.height * 0.055 * view.zoom);

    function pickPlayer(pt) {
        let best = null, bd = Infinity;
        const r = screenRadius(pt.rect);
        allPlayers.forEach(p => {
            const a = {
                x: ((p.x - 50) * KX + view.hw) / (2 * view.hw) * pt.rect.width,
                y: (1 - (p.y - view.panY + view.hh) / (2 * view.hh)) * pt.rect.height
            };
            const d = Math.hypot(a.x - pt.px, a.y - pt.py);
            if (d <= r && d < bd) { bd = d; best = p; }
        });
        return best;
    }

    const humanAttacking = () => PLAY && PLAY.atk === 'you';
    const humanDefending = () => PLAY && PLAY.atk === 'cpu';

    function onDown(e) {
        if (topScreen() || state.paused) return;
        if (e.button !== undefined && e.button !== 0) return;
        const pt = canvasPoint(e);
        drag.x0 = pt.x; drag.y0 = pt.y; drag.x = pt.x; drag.y = pt.y; drag.moved = 0; drag.id = e.pointerId;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
        canvas.classList.add('grabbing');

        /* --- §10 shootout gestures --- */
        if (SO.active) {
            if (SO.phase === 'aim' && SO.turn === 'you') drag.kind = 'so-aim';
            else if (SO.phase === 'dive' && SO.turn === 'cpu') drag.kind = 'so-dive';
            else drag.kind = null;
            return;
        }
        if (state.phase !== 'play' && state.phase !== 'restart') { drag.kind = null; return; }

        const p = pickPlayer(pt);
        if (humanAttacking() && p === PLAY.carrier) {
            drag.kind = 'aim'; drag.player = p;
        } else if (p && p.team === 'you' && p.role === 'keeper') {
            /* the human's keeper: a pre-dive, or a dive during a shot */
            drag.kind = 'keeper'; drag.player = p;
        } else if (p && p.team === 'you') {
            drag.kind = 'move'; drag.player = p; p.selected = true;
        } else if (humanAttacking() && !p && PLAY.receiver) {
            /* tap a teammate or an empty spot to nominate a receiver */
            drag.kind = 'pick'; drag.player = PLAY.receiver;
        } else {
            drag.kind = null;
        }
        refreshRings();
    }

    function onMove(e) {
        if (!drag.kind) return;
        const pt = canvasPoint(e);
        drag.x = pt.x; drag.y = pt.y;
        drag.moved = Math.hypot(pt.x - drag.x0, pt.y - drag.y0);

        if (drag.kind === 'aim' && drag.moved > TAP_SLOP) {
            const tgt = aimPoint(drag.x0, drag.y0, drag.x, drag.y);
            const mate = mateInDirection(drag.x0, drag.y0, drag.x, drag.y);
            aimLine.visible = true;
            aimLine.material.color.setHex(mate ? COL.aim : COL.ghost);
            aimLine.material.opacity = mate ? 1 : .45;
            aimLine.setEnds({ x: drag.x0, y: drag.y0 }, mate ? { x: mate.x, y: mate.y } : tgt);
            runnerMarker.visible = !!mate;
            if (mate) runnerMarker.position.set(worldX(mate.x), 0.09, worldZ(mate.y));
        } else if (drag.kind === 'move' && drag.moved > TAP_SLOP) {
            runnerMarker.visible = true;
            runnerMarker.position.set(worldX(clamp(pt.x, 5, 95)), 0.09, worldZ(clamp(pt.y, 5, 95)));
        } else if (drag.kind === 'keeper' && drag.moved > TAP_SLOP) {
            drag.player.held = true;
            drag.player.dive = { x: clamp(pt.x, 8, 92), y: drag.player.y };
            diveMarker.visible = true;
            diveMarker.position.set(worldX(clamp(pt.x, 8, 92)), 0.09, worldZ(drag.player.y));
            diveLine.visible = true;
            diveLine.setEnds(drag.player, { x: clamp(pt.x, 8, 92), y: drag.player.y });
        } else if (drag.kind === 'so-aim' && drag.moved > TAP_SLOP * 0.5) {
            const t = { x: clamp(pt.x, 0, 100), y: soGoal().y };
            aimLine.visible = true;
            aimLine.material.color.setHex(isOnTarget(t.x, soGoal().x, GOAL_HALF_WIDTH) ? COL.aim : COL.bad);
            aimLine.material.opacity = 1;
            aimLine.setEnds(soSpot(), t);
            shotLine.visible = true;
            shotLine.setEnds(soSpot(), t);
        } else if (drag.kind === 'so-dive' && drag.moved > TAP_SLOP * 0.5) {
            const t = { x: clamp(pt.x, 4, 96), y: keeperOf('you').y };
            diveLine.visible = true;
            diveLine.setEnds(keeperOf('you'), t);
            diveMarker.visible = true;
            diveMarker.position.set(worldX(t.x), 0.09, worldZ(t.y));
        }
    }

    /** Where a pass aimed in this direction would land. */
    function aimPoint(x0, y0, x, y) {
        const d = unit(x - x0, y - y0);
        const reach = Math.max(18, Math.hypot(x - x0, y - y0));
        return { x: clamp(x0 + d.x * reach, 4, 96), y: clamp(y0 + d.y * reach, 4, 96) };
    }

    /** §4 — the teammate the drag is pointing at, if any. */
    function mateInDirection(x0, y0, x, y) {
        if (!PLAY) return null;
        const d = unit(x - x0, y - y0);
        if (!d.l) return null;
        let best = null, bs = 0.2;
        teamOutfield(PLAY.atk).forEach(m => {
            if (m === PLAY.carrier) return;
            const to = unit(m.x - x0, m.y - y0);
            if (!to.l || to.l > 70) return;
            const dot = to.x * d.x + to.y * d.y;
            const score = dot - to.l / 400;
            if (dot > 0 && score > bs) { bs = score; best = m; }
        });
        return best;
    }

    /** §5 — a double-tap on the goal mouth, inside range, is a shot. */
    function tryShootAt(x, y) {
        if (!humanAttacking()) return false;
        const c = PLAY.carrier;
        if (!c) return false;
        if (dist(c, PLAY.goal) > SHOT_RANGE) return false;
        return shoot(c, { x: clamp(x, 0, 100), y: PLAY.goal.y });
    }

    function onUp(e) {
        if (!drag.kind) { drag.id = null; return; }
        const pt = canvasPoint(e);
        canvas.classList.remove('grabbing');
        const moved = Math.hypot(pt.x - drag.x0, pt.y - drag.y0);
        const kind = drag.kind, player = drag.player;
        drag.kind = null; drag.player = null; drag.id = null;

        if (kind === 'aim') {
            aimLine.visible = false;
            runnerMarker.visible = false;
            if (moved > TAP_SLOP) {
                const mate = mateInDirection(drag.x0, drag.y0, pt.x, pt.y);
                const target = mate ? { x: mate.x, y: mate.y } : aimPoint(drag.x0, drag.y0, pt.x, pt.y);
                passTo(player, target, BALL_SPEED);
                if (!mate) {
                    log('Played into space.', '');
                }
            } else {
                /* a tap on the carrier: is this the second half of a double-tap? */
                const now = performance.now();
                const near = Math.hypot(pt.x - lastTap.x, pt.y - lastTap.y) < 9;
                if (now - lastTap.t < DOUBLE_TAP_MS && near) {
                    const shot = tryShootAt(pt.x, pt.y);
                    if (!shot) log('Shooting only works inside ' + SHOT_RANGE + ' units of the goal.', '');
                    lastTap = { t: 0, x: 0, y: 0 };
                } else {
                    lastTap = { t: now, x: pt.x, y: pt.y };
                    /* a first tap nominates the nearest teammate as the receiver */
                    if (PLAY && humanAttacking()) {
                        const near = teamOutfield('you')
                            .filter(m => m !== PLAY.carrier)
                            .sort((a, b) => dist(a, { x: pt.x, y: pt.y }) - dist(b, { x: pt.x, y: pt.y }))[0];
                        if (near) { PLAY.receiver = near; PLAY.receiver.duty = 'receiver'; }
                    }
                }
            }
        } else if (kind === 'move') {
            if (moved > TAP_SLOP) {
                const dest = { x: clamp(pt.x, 5, 95), y: clamp(pt.y, 5, 95) };
                player.dest = dest;
                player.speed = PLAYER_SPEED;
                log(player.label + ' sent wide.', '');
            }
            player.selected = false;
            runnerMarker.visible = false;
        } else if (kind === 'keeper') {
            if (moved > TAP_SLOP) {
                player.held = true;
                player.dive = { x: clamp(pt.x, 8, 92), y: player.y };
                log('Keeper set to ' + (player.dive.x < 50 ? 'their left' : 'their right') + '.', '');
            } else {
                player.held = false;
                player.dive = null;
            }
            diveLine.visible = false;
            diveMarker.visible = false;
        } else if (kind === 'pick') {
            log('Receiver: ' + (PLAY.receiver ? PLAY.receiver.label : '—') + '.', '');
        } else if (kind === 'so-aim') {
            aimLine.visible = false;
            shotLine.visible = false;
            if (moved > TAP_SLOP * 0.5) {
                soSetAim({ x: clamp(pt.x, 0, 100), y: soGoal().y });
                soCommitAim();
            }
        } else if (kind === 'so-dive') {
            diveLine.visible = false;
            diveMarker.visible = false;
            if (moved > TAP_SLOP * 0.5) {
                soCommitDive({ x: clamp(pt.x, 4, 96), y: keeperOf('you').y });
            }
        }
        refreshRings();
    }

    function updateCursor() {
        const active = SO.active ? (SO.phase === 'aim' || SO.phase === 'dive')
            : (state.phase === 'play' || state.phase === 'restart');
        canvas.style.cursor = drag.kind ? 'grabbing' : (active ? 'crosshair' : 'default');
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    /* --- keyboard --- */
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            e.preventDefault();
            if (topScreen() && topScreen() !== 'menu' && topScreen() !== 'over') popScreen();
            else if (!topScreen() && state.phase !== 'idle' && state.phase !== 'over') pauseGame();
            return;
        }
        if (topScreen()) return;
        if (e.key === 'm' || e.key === 'M') toggleMute();
        if (e.key === 'r' || e.key === 'R') { if (state.phase !== 'idle') beginMatch(); }
        if (e.key === 'h' || e.key === 'H') pushScreen('tutorial', { focus: '#btn-tut-close' });
    });

    /* ==========================================================================
       § 18. UPDATE + RENDER
       ========================================================================== */
    function update(dt) {
        if (state.phase === 'restart') {
            state.phaseT += dt;
            allPlayers.forEach(p => moveToward(p, p.ax, p.ay, 46, dt));
            stepBall(dt);
            if (state.phaseT >= SETUP_TIME) { state.phase = 'play'; state.phaseT = 0; }
        } else if (state.phase === 'play') {
            if (state.pendingHalf) {
                /* §3/§3 — the whistle waits for the ball to become dead */
                if (ball.mode === 'held' || ball.mode === 'loose') endHalf();
            } else {
                state.halfT += dt;
                if (state.halfT >= HALF_LENGTH) {
                    state.halfT = HALF_LENGTH;
                    state.pendingHalf = true;
                }
            }
            if (PLAY) {
                cpuThink(dt);
                simPlayers(dt);
            }
            stepBall(dt);
        } else if (state.phase === 'shootout') {
            soUpdate(dt);
            ballMesh.position.set(worldX(ball.x), ball.h, worldZ(ball.y));
            ballShadow.position.set(worldX(ball.x), 0.04, worldZ(ball.y));
        }

        allPlayers.forEach(p => { animatePlayer(p, dt); syncToMesh(p); });
        updateCursor();
        updateOverlayVisibility();
    }

    /** Keep the guides honest without redrawing them every frame. */
    function updateOverlayVisibility() {
        if (SO.active) {
            [...allPlayers].forEach(p => refreshRings());
            return;
        }
        if (!PLAY) return;
        /* the human's keeper shows a dive line whenever a shot is live */
        if (ball.mode === 'shot' && PLAY.def === 'cpu') {
            const k = keeperOf('you');
            if (k && k.dive && !drag.kind) {
                diveLine.visible = true;
                diveLine.setEnds(k, k.dive);
                diveMarker.visible = true;
                diveMarker.position.set(worldX(k.dive.x), 0.09, worldZ(k.dive.y));
            }
        } else if (!drag.kind) {
            diveLine.visible = false;
            diveMarker.visible = false;
        }
    }

    function updateHud() {
        if (SO.active) return;
        const left = Math.max(0, HALF_LENGTH - state.halfT);
        const secs = Math.ceil(left - 1e-6);
        if (secs !== lastClock) {
            lastClock = secs;
            ui.clock.textContent = formatClock(secs);
            /* the last 15 seconds are the only time the clock is allowed to go
               warm; the class lives on the panel so both the fill and the
               numerals can respond to it */
            ui.clock.parentElement.parentElement.classList.toggle('low', secs <= 15);
        }
        const k = clamp(left / HALF_LENGTH, 0, 1);
        if (Math.abs(k - lastBar) > 0.004) {
            ui.clockBar.style.transform = 'scaleX(' + k.toFixed(3) + ')';
            lastBar = k;
        }
    }

    /* --- the contain-fit camera, with the §10 zoom/pan on top --- */
    function fitView() {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        const aspect = w / h;
        let hw, hh;
        if (aspect >= reqHW / reqHH) { hh = reqHH; hw = reqHH * aspect; }
        else { hw = reqHW; hh = reqHW / aspect; }
        view.hw = hw / view.zoom;
        view.hh = hh / view.zoom;
        camera.left = -view.hw; camera.right = view.hw;
        camera.top = view.hh; camera.bottom = -view.hh;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', fitView);
    window.addEventListener('orientationchange', () => setTimeout(fitView, 120));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitView);

    /** Where the camera sits this frame: the pan, plus the shake. */
    function placeCamera() {
        const t2 = state.trauma * state.trauma;
        const amp = state.reduceMotion ? 0 : 2.4 * t2;
        const sx = (Math.random() * 2 - 1) * amp;
        const sy = (Math.random() * 2 - 1) * amp;
        const pz = worldZ(view.panY);
        camera.position.set(sx, 130 * Math.cos(TILT) + sy * Math.sin(TILT), pz + 130 * Math.sin(TILT) - sy * Math.cos(TILT));
        camera.rotation.z = 0;
        camera.lookAt(sx, sy * Math.sin(TILT), pz - sy * Math.cos(TILT));
    }

    /* --- pause handling --- */
    function pauseGame() {
        if (state.phase === 'idle' || state.phase === 'over') return;
        state.paused = true;
        pushScreen('pause', { focus: '#btn-resume' });
    }
    function resumeGame() {
        if (!state.paused) { popScreen(); return; }
        state.paused = false;
        popScreen();
    }

    let last = performance.now();
    function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!state.paused && !topScreen() && state.phase !== 'idle') update(dt);
        state.trauma = Math.max(0, state.trauma - dt * 1.5);
        updateHud();
        placeCamera();
        renderer.render(scene, camera);
    }

    /* ==========================================================================
       § 19. WIRING
       ========================================================================== */
    function toggleMute() {
        const m = Sfx.toggle();
        ui.mute.textContent = m ? '🔇' : '♪';
        ui.mute.setAttribute('aria-pressed', String(m));
        if (!m) Sfx.unlock();
    }

    el('btn-start').addEventListener('click', () => { popScreen(); beginMatch(); });
    el('btn-tutorial').addEventListener('click', () => pushScreen('tutorial', { focus: '#btn-tut-close' }));
    el('btn-tut-close').addEventListener('click', () => popScreen());
    el('btn-help').addEventListener('click', () => pushScreen('tutorial', { focus: '#btn-tut-close' }));
    el('btn-pause').addEventListener('click', () => pauseGame());
    el('btn-mute').addEventListener('click', toggleMute);
    el('btn-resume').addEventListener('click', resumeGame);
    el('btn-restart').addEventListener('click', () => { state.paused = false; while (topScreen()) popScreen(); beginMatch(); });
    el('btn-quit').addEventListener('click', () => { state.paused = false; while (topScreen()) popScreen(); state.phase = 'idle'; pushScreen('menu', { focus: '#btn-start' }); });
    el('btn-again').addEventListener('click', () => { popScreen(); beginMatch(); });
    el('btn-menu').addEventListener('click', () => { while (topScreen()) popScreen(); state.phase = 'idle'; pushScreen('menu', { focus: '#btn-start' }); });
    const pensBtn = el('btn-pens');
    if (pensBtn) pensBtn.addEventListener('click', () => beginShootout());
    const verifyBtn = el('btn-verify');
    if (verifyBtn) verifyBtn.addEventListener('click', () => {
        const r = runVerification(true);
        banner(r.allPass ? 'RULEBOOK OK' : 'RULEBOOK FAILED', r.allPass ? CSS.goal : CSS.bad);
    });
    if (ui.difficulty) {
        ui.difficulty.addEventListener('click', e => {
            const b = e.target.closest('button[data-diff]');
            if (!b) return;
            state.difficulty = parseFloat(b.dataset.diff);
            if (PLAY) { PLAY.cpuThink = 0.6; cpuAssignDuties(); }
            Array.from(ui.difficulty.querySelectorAll('button')).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        });
    }

    /* first user gesture unlocks Web Audio */
    ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, () => Sfx.unlock(), { once: true, passive: true }));

    /* --- boot --- */
    fitView();
    allPlayers.forEach(p => { syncToMesh(p); refreshRings(); });
    setCarrier(teamOutfield('you')[0]);
    state.phase = 'idle';
    bus.emit('score'); bus.emit('half'); bus.emit('role');
    pushScreen('menu', { focus: '#btn-start' });
    requestAnimationFrame(frame);

    /* --- the rulebook's own suite: always available, reported on load --- */
    const verify = runVerification(false);
    console.log('[Guess & Pass] rulebook verification: ' + (verify.allPass ? 'ALL PASS' : 'FAILURES — see __GAP_VERIFY_RESULTS'));
    if (!verify.allPass) banner('RULEBOOK FAILED', CSS.bad);

    /* debug surface for the console / unit-test harnesses */
    window.__GAP = {
        RULES, state, runVerification,
        get play() { return PLAY; },
        get shootout() { return SO; },
        get ball() { return ball; },
        api: {
            beginMatch, kickoff, goalKick, beginShootout, soSetupKick,
            passTo, shoot, pauseGame, resumeGame, toggleMute,
            setDifficulty: d => { state.difficulty = clamp(d, 0, 1); },
            /** Pin the clock, for testing full time without playing 2:00. */
            setHalfTime: t => { state.halfT = clamp(t, 0, HALF_LENGTH); },
            drainHalf: () => { state.halfT = HALF_LENGTH; state.pendingHalf = true; }
        }
    };
})();
