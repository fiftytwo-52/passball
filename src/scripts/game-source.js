/**
 * Guess & Pass — the engine.
 *
 * This module is the *verbatim* game core, extracted mechanically from the
 * single-file build so the algorithm could not drift during the move to Astro.
 * Only two things were changed on extraction, both mechanical:
 *
 *   1. Three.js comes from a real ES import (bundled from node_modules by Vite)
 *      instead of a CDN script-tag global.
 *   2. The whole body is wrapped in an IIFE so the original top-level
 *      `return` guard still works.
 *
 * Everything below — the CANONICAL §3 four-state loop, the CANONICAL §4
 * resolution algorithm, the seeded RNG, the CPU model, the feel layer, the HUD
 * wiring and the self-test — is untouched. `window.__GAP` and
 * `window.__GAP_VERIFY_RESULTS` are still published for headless harnesses.
 */
import * as THREE from 'three';

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
       ↓↓↓ MECHANICAL EXTRACTION BEGINS — do not hand-edit below this line ↓↓↓
       ---------------------------------------------------------------------- */
    const T = {
        /* --- §3 loop --- */
        window: 3.0,          // decision window, seconds
        winScore: 3,          // first to 3 goals — the only way a match ends

        /* --- §4 resolution (CANONICAL) --- */
        R_cover: 14,
        lengthGain: 0.9,
        baseGuess: 0.35,
        guessGain: 0.65,
        alignThreshold: 0.0,
        shootRange: 30,
        keeperReach: 20,
        baseGoal: 0.8,
        keeperStop: 0.7,

        /* --- presentation / feel (safe to tune, changes no mechanic) --- */
        setupTime: 0.55,
        resultTime: 1.05,
        slowScale: 0.34,
        playerSpeed: 26,
        driftSpeed: 9
    };

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
       § 1. MATH + SEEDED RNG
       ========================================================================== */
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const len2 = (x, y) => Math.hypot(x, y);
    function norm(x, y) {
        const l = Math.hypot(x, y);
        return l < 1e-9 ? { x: 0, y: 0, l: 0 } : { x: x / l, y: y / l, l };
    }
    /** Project P onto segment A→B (clamped). Returns closest point, param and distance. */
    function projectOnSegment(P, A, B) {
        const abx = B.x - A.x, aby = B.y - A.y;
        const L2 = abx * abx + aby * aby;
        let t = L2 > 1e-9 ? ((P.x - A.x) * abx + (P.y - A.y) * aby) / L2 : 0;
        t = clamp(t, 0, 1);
        const Q = { x: A.x + abx * t, y: A.y + aby * t };
        return { Q, t, dist: Math.hypot(P.x - Q.x, P.y - Q.y) };
    }
    /** Deterministic PRNG — every random draw in the game routes through one of these. */
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
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
       § 2. RESOLUTION ALGORITHM — CANONICAL §4. PURE.
          No DOM, no THREE, no globals: safe to run headless in the tests below.
       ========================================================================== */

    /**
     * §4.2 — per-defender interception chance.
     * NOTE: the pass target is named `G` here, NOT `T`, because `T` is the
     * module-level tunables object holding the CANONICAL §4 constants.
     * @param C pass origin {x,y}      @param G pass target {x,y}
     * @param D defender {id, pos:{x,y}, guess:{x,y}|null}
     */
    function defenderChance(C, G, D) {
        const Pd = D.pos;
        const seg = projectOnSegment(Pd, C, G);
        const laneLen = dist(C, G);

        // Effective reach grows with pass length (longer passes hang longer).
        const R_eff = T.R_cover * (1 + T.lengthGain * laneLen / 100);

        // Geometric coverage.
        const geo = clamp(1 - seg.dist / R_eff, 0, 1);

        // Guess alignment: ideal break direction u = normalize(Q − Pd).
        let a = 0;
        const g = D.guess;
        if (g && (g.x !== 0 || g.y !== 0)) {
            const gl = len2(g.x, g.y);
            const ux = seg.Q.x - Pd.x, uy = seg.Q.y - Pd.y, ul = len2(ux, uy);
            if (gl > 1e-9 && ul > 1e-9) a = (g.x / gl) * (ux / ul) + (g.y / gl) * (uy / ul);
        }
        const guessFactor = clamp((a - T.alignThreshold + 1) / 2, 0, 1);

        // Combine. geo = 0 ⇒ pd = 0 regardless of guess.
        const pd = clamp(geo * (T.baseGuess + T.guessGain * guessFactor), 0, 1);
        return { pd, geo, guessFactor, a, Q: seg.Q, dist: seg.dist, laneLen, R_eff };
    }

    /** §4.3 — combined interception probability for one pass. `G` = pass target. */
    function pInterceptOf(C, G, defenders) {
        let p = 1;
        for (let i = 0; i < defenders.length; i++) p *= (1 - defenderChance(C, G, defenders[i]).pd);
        return clamp(1 - p, 0, 0.95);
    }

    /**
     * CANONICAL §4 — one call, one outcome: COMPLETE | INTERCEPTION | GOAL | SAVE.
     * @param input {C, T, defenders, keeper:{pos}, goal:{x,y}}
     * @param rng   () => [0,1)
     */
    function resolvePass(input, rng) {
        const C = input.C, Tgt = input.T;
        const defenders = input.defenders || [];
        const goal = input.goal || { x: 50, y: 100 };
        const keeper = input.keeper || { pos: { x: goal.x, y: goal.y } };

        /* --- §4.3 combined interception probability --- */
        let pIntercept = 1;
        let best = null;
        for (let i = 0; i < defenders.length; i++) {
            const d = defenders[i];
            const r = defenderChance(C, Tgt, d);
            if (!best || r.pd > best.pd) best = { pd: r.pd, q: r.Q, d: d.id, geo: r.geo };
            pIntercept *= (1 - r.pd);
        }
        pIntercept = clamp(1 - pIntercept, 0, 0.95);

        if (rng() < pIntercept) {
            return {
                type: 'INTERCEPTION', at: { x: best.q.x, y: best.q.y },
                defender: best.d, pIntercept, pGoal: null
            };
        }

        /* --- §4.4 completed pass → shot resolution (goal vs save) --- */
        if (dist(Tgt, goal) <= T.shootRange) {
            const distFactor = clamp(1 - dist(Tgt, goal) / T.shootRange, 0, 1);
            const angleFactor = clamp(1 - Math.abs(Tgt.x - 50) / 50, 0.3, 1);
            const keeperDist = projectOnSegment(keeper.pos, C, Tgt).dist;
            const keeperCover = clamp(1 - keeperDist / T.keeperReach, 0, 1);
            const pGoal = clamp(
                T.baseGoal * (0.5 + 0.5 * distFactor) * angleFactor - keeperCover * T.keeperStop,
                0.03, 0.97
            );
            if (rng() < pGoal) return { type: 'GOAL', at: { x: Tgt.x, y: Tgt.y }, pIntercept, pGoal };
            return { type: 'SAVE', at: { x: Tgt.x, y: Tgt.y }, pIntercept, pGoal };
        }

        return { type: 'COMPLETE', at: { x: Tgt.x, y: Tgt.y }, pIntercept, pGoal: null };
    }

    /* ==========================================================================
       § 3. VERIFICATION TESTS — the four §4 properties, headless.
       ========================================================================== */
    function runVerification(log) {
        const out = [];
        const check = (name, pass, detail) => out.push({ name, pass: !!pass, detail });

        /* (1) Better guess ⇒ higher pIntercept. */
        {
            const C = { x: 50, y: 20 }, Tp = { x: 50, y: 70 };
            const mk = g => ({ id: 'd', pos: { x: 57, y: 45 }, guess: g });
            const on = pInterceptOf(C, Tp, [mk({ x: -1, y: 0 })]);   // breaks into the lane
            const off = pInterceptOf(C, Tp, [mk({ x: 1, y: 0 })]);   // breaks away from the lane
            const none = pInterceptOf(C, Tp, [mk(null)]);            // unset
            check('better guess ⇒ higher pIntercept', on > none && none > off,
                { correct: +on.toFixed(4), unset: +none.toFixed(4), wrong: +off.toFixed(4) });
        }

        /* (2) Longer pass ⇒ higher pIntercept (same defender, same perpendicular offset). */
        {
            const C = { x: 50, y: 20 };
            const d = { id: 'd', pos: { x: 56, y: 30 }, guess: { x: -1, y: 0 } };
            const shortP = pInterceptOf(C, { x: 50, y: 40 }, [d]);
            const longP = pInterceptOf(C, { x: 50, y: 90 }, [d]);
            check('longer pass ⇒ higher pIntercept', longP > shortP,
                { laneLen20: +shortP.toFixed(4), laneLen70: +longP.toFixed(4) });
        }

        /* (3) More / closer defenders ⇒ higher pIntercept. */
        {
            const C = { x: 50, y: 20 }, Tp = { x: 50, y: 80 };
            const g = { x: -1, y: 0 };
            const one = pInterceptOf(C, Tp, [{ id: 'a', pos: { x: 58, y: 40 }, guess: g }]);
            const two = pInterceptOf(C, Tp, [
                { id: 'a', pos: { x: 58, y: 40 }, guess: g },
                { id: 'b', pos: { x: 44, y: 60 }, guess: { x: 1, y: 0 } }]);
            const far = pInterceptOf(C, Tp, [{ id: 'a', pos: { x: 70, y: 40 }, guess: g }]);
            const near = pInterceptOf(C, Tp, [{ id: 'a', pos: { x: 54, y: 40 }, guess: g }]);
            check('more defenders ⇒ higher pIntercept', two > one, { one: +one.toFixed(4), two: +two.toFixed(4) });
            check('closer defender ⇒ higher pIntercept', near > far, { near: +near.toFixed(4), far: +far.toFixed(4) });
        }

        /* (4) No geometry ⇒ pd = 0, even with a perfect guess. */
        {
            const C = { x: 50, y: 20 }, Tp = { x: 50, y: 80 };
            const hopeless = { id: 'x', pos: { x: 96, y: 50 }, guess: { x: -1, y: 0 } };
            const r = defenderChance(C, Tp, hopeless);
            const p = pInterceptOf(C, Tp, [hopeless]);
            check('geo = 0 ⇒ pd = 0 (guess cannot help)', r.geo === 0 && r.pd === 0 && p === 0,
                { geo: r.geo, pd: r.pd, pIntercept: +p.toFixed(4) });
        }

        /* (5) Sanity: whole-pipeline outcomes are always one of the four, and probabilities are bounded. */
        {
            const rng = mulberry32(7);
            const kinds = {};
            let ok = true;
            for (let i = 0; i < 4000; i++) {
                const C = { x: 50, y: randRange(rng, 10, 40) };
                const Tp = { x: randRange(rng, 25, 75), y: randRange(rng, 45, 92) };
                const defenders = [0, 1, 2].map(k => ({
                    id: k, pos: { x: randRange(rng, 20, 80), y: randRange(rng, 40, 96) },
                    guess: rng() < .7 ? norm(rng() - .5, rng() - .5) : null
                }));
                const res = resolvePass({
                    C, T: Tp, defenders, keeper: { pos: { x: 50, y: 95 } }, goal: { x: 50, y: 100 }
                }, rng);
                kinds[res.type] = (kinds[res.type] || 0) + 1;
                if (['COMPLETE', 'INTERCEPTION', 'GOAL', 'SAVE'].indexOf(res.type) < 0) ok = false;
                if (res.pIntercept < 0 || res.pIntercept > 0.95) ok = false;
            }
            check('4000 random plays: valid outcomes, bounded pIntercept', ok && Object.keys(kinds).length >= 3, kinds);
        }

        const allPass = out.every(r => r.pass);
        if (log !== false) {
            console.groupCollapsed('%c§4 verification — ' + (allPass ? 'ALL PASS' : 'FAILURES'),
                'color:' + (allPass ? '#50e3c2' : '#eb367f') + ';font-weight:bold');
            console.table(out.map(r => ({ test: r.name, pass: r.pass, detail: JSON.stringify(r.detail) })));
            console.groupEnd();
            if (typeof window !== 'undefined') window.__GAP_VERIFY_RESULTS = out;
        }
        return { allPass, results: out };
    }

    /* ==========================================================================
       § 4. MATCH STATE  (canonical §3 loop)
       ========================================================================== */
    const state = {
        phase: 'idle',      // idle | setup | decision | resolve | result | over
        possession: 'you',  // 'you' | 'cpu'  (who attacks this play)
        progress: 0.05,     // how far the current possession has advanced, 0(own goal)…1
        kickoff: false,     // true on the first play and after every goal: start at the centre spot
        humanScore: 0, cpuScore: 0,
        plays: 0,
        decisionEndsAt: 0,  // real-clock timestamp — drives the countdown
        remaining: T.window,
        difficulty: 0.6,    // 0 = coin-flip baseline, 1 = fully weighted (§5)
        seed: 0,
        timeScale: 1,       // slow-motion, applied to presentation only
        trauma: 0,
        paused: false,
        humanLocked: false,
        cpuLocked: false,
        humanChoice: null,  // {type:'pass'|'guess', ...}
        cpuChoice: null,
        outcome: null,
        phaseT: 0,
        reduceMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
       clamp, formation offset and §4 constant is dimensioned on it and must not
       move. The *artwork* is a real football pitch: 105 m along the playing
       direction (game-y) and 68 m across it (game-x). Presenting one on the other
       is purely a matter of scale:

         KX   squashes game-x into world-x so 100 game-x units cover the same
              68 m that 100 game-y units cover down the length. A pass that is
              circular in game space therefore draws as a genuine football
              ellipse — which is what the viewer expects to see.

       nothing in § 4 may reference any of these.
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
        /* Markings in real metres, expressed back on the canonical grid. */
        goalW: 7.32 * MX,
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
    /** Carrier y for a given possession progress, in that team's attacking direction. */
    function carrierY(team, progress) {
        return team === 'you' ? 20 + 62 * progress : 80 - 62 * progress;
    }
    /** Inverse: possession progress implied by a world y for a team. */
    function progressFromY(team, y) {
        return clamp((team === 'you' ? (y - 20) / 62 : (80 - y) / 62), 0.03, 0.97);
    }

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
    const view = { hw: reqHW, hh: reqHH };

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
    const gameFromWorldX = x => x / KX + 50;
    const gameFromWorldZ = z => 50 - z / ZSTRETCH;

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

        /* goal nets (behind the goal lines, outside the pitch) */
        function net(side) {
            const gw = 7.32, depth = 2;                 // metres
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
           over the goal itself rather than printed on the turf. Anything else
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
        /* PITCH.goalW is on the canonical grid; KX converts it to world-x, where
           it comes out at exactly 7.32 m. */
        const gw = PITCH.goalW * KX;
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
        /* goalkeepers get long sleeves/trousers so they read at a glance */
        const legMatL = keeperKit ? kitMat : null;

        const armL = new THREE.Mesh(limbGeo(.15, 1.3), skin); armL.position.set(-.72, 3.0, 0);
        const armR = new THREE.Mesh(limbGeo(.15, 1.3), skin); armR.position.set(.72, 3.0, 0);
        const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(.22, .2, .62, 8), kitMat);
        sleeveL.position.set(-.72, 2.72, 0);
        const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(.22, .2, .62, 8), kitMat);
        sleeveR.position.set(.72, 2.72, 0);

        g.add(torso, hips, head, cap, legL, legR, armL, armR, sleeveL, sleeveR);
        g.userData.limbs = { legL, legR, armL, armR, sleeveL, sleeveR, torso, head };
        if (legMatL === null) { /* keep default skin legs */ }
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
            x: 50, y: 50, tx: 50, ty: 50, dest: null,
            mesh, ring, shadow,
            yaw: team === 'you' ? Math.PI : 0, walk: 0, px: 50, py: 50,
            hasBall: false, selected: false, guess: null, speed: T.playerSpeed
        };
        mesh.position.set(worldX(p.x), 0, worldZ(p.y));
        allPlayers.push(p);
        playersById[p.id] = p;
        return p;
    }

    /* 4 outfield + 1 keeper per team */
    for (let i = 1; i <= 4; i++) spawnPlayer('you', 'outfield', i);
    spawnPlayer('you', 'keeper', 5);
    for (let i = 1; i <= 4; i++) spawnPlayer('cpu', 'outfield', i);
    spawnPlayer('cpu', 'keeper', 5);

    const teamPlayers = team => allPlayers.filter(p => p.team === team);
    const teamOutfield = team => allPlayers.filter(p => p.team === team && p.role === 'outfield');

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
        const f = clamp(sp / T.playerSpeed, 0, 1);
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

    /* --- ball --- */
    const ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry(.42, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    const ballShadow = makeBlobShadow(0.6);
    scene.add(ballMesh, ballShadow);
    const ball = {
        x: 50, y: 50, h: 0.42, mode: 'held', holder: null,
        from: null, to: null, t: 0, dur: .5, arc: 1.2, onArrive: null
    };
    function ballAt(px, py, h) { ball.x = px; ball.y = py; ball.h = h; }

    /* --- ground overlays: aim line, target ring, guess arrows, destination marker --- */
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
    const aimLine = groundLine(COL.aim);
    const guessArrows = [];
    for (let i = 0; i < 8; i++) guessArrows.push(groundLine(COL.cpu));
    const runnerMarker = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1.25, 24),
        new THREE.MeshBasicMaterial({ color: COL.aim, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false })
    );
    runnerMarker.rotation.x = -Math.PI / 2;
    runnerMarker.visible = false;
    scene.add(runnerMarker);

    /* --- selection rings on the human's players --- */
    function refreshRings() {
        allPlayers.forEach(p => {
            const show = p.selected || (PLAY && PLAY.carrier === p && p.team === 'you');
            p.ring.material.opacity = show ? 0.9 : 0;
            p.ring.material.color.setHex(p.selected ? COL.aim : COL.aim);
            p.ring.scale.setScalar(p.selected ? 1.08 : 1);
        });
    }

    /* ==========================================================================
       § 8. FORMATIONS — derived from carrier + attacked goal, so both directions work
       ========================================================================== */
    let PLAY = null;

    function layoutAttack(team, carrier, goal, rng) {
        const j = () => randRange(rng, -3, 3);
        const mix = (t, offx, offy) => ({
            x: clamp(lerp(carrier.x, goal.x, t) + offx + j(), 5, 95),
            y: clamp(lerp(carrier.y, goal.y, t) + offy + j(), 5, 95)
        });
        const spots = [
            mix(0.30, -19, 0),
            mix(0.30, 19, 0),
            mix(0.72, 0, 0)     // the runner — the deep threat
        ];
        const mates = teamOutfield(team).filter(p => p !== carrier);
        mates.forEach((p, i) => {
            const s = spots[i % spots.length];
            p.ax = s.x; p.ay = s.y;
            p.x = s.x; p.y = s.y; p.px = s.x; p.py = s.y;
            p.tx = s.x; p.ty = s.y; p.dest = null;
        });
        return { runner: mates[2] || mates[mates.length - 1], mates };
    }

    function layoutDefence(team, carrier, goal, rng) {
        const j = () => randRange(rng, -3.2, 3.2);
        const mix = (t, offx) => ({
            x: clamp(lerp(carrier.x, goal.x, t) + offx + j(), 5, 95),
            y: clamp(lerp(carrier.y, goal.y, t) + j(), 5, 95)
        });
        const spots = [mix(0.42, -15), mix(0.42, 15), mix(0.63, 0), mix(0.84, -9)];
        const dfs = teamOutfield(team);
        dfs.forEach((p, i) => {
            const s = spots[i % spots.length];
            p.ax = s.x; p.ay = s.y;
            p.x = s.x; p.y = s.y; p.px = s.x; p.py = s.y;
            p.tx = s.x; p.ty = s.y; p.dest = null; p.guess = null;
        });
        return dfs;
    }

    /* keepers always guard their own goal */
    function parkKeepers() {
        const ky = playersById['you5'], kc = playersById['cpu5'];
        const set = (p, x, y) => { p.ax = x; p.ay = y; p.tx = x; p.ty = y; p.x = x; p.y = y; p.px = x; p.py = y; p.dest = null; };
        set(ky, clamp(50, 8, 92), 5.5);
        set(kc, clamp(50, 8, 92), 94.5);
    }

    /* ==========================================================================
       § 9. CPU — §5 baseline (random) blended toward the weighted target
       ========================================================================== */
    function cpuGuessSet(defenders, carrier, goal, difficulty, rng) {
        /* weight likely receivers by threat: cheap (near their goal), open, central */
        const attackers = PLAY.mates;
        const w = attackers.map(m => {
            const dg = dist(m, goal);
            const openness = 1 - pInterceptOf(carrier, m, defenders.map(d => ({ id: d.id, pos: d, guess: null })));
            return 0.2 + openness * 0.9 + (dg <= T.shootRange ? 0.8 : 0.1) + clamp(1 - dg / 90, 0, 1) * 0.4;
        });
        const picked = weightedPick(attackers, w, rng).item || attackers[0];

        /* how many defenders bother to commit: more with higher difficulty */
        const count = clamp(Math.round(1 + 3 * difficulty), 1, defenders.length);
        const order = defenders.slice().sort(() => rng() - .5);

        defenders.forEach((d, i) => {
            const commit = order.indexOf(d) < count;
            if (!commit) { d.guess = null; return; }
            if (rng() > 0.25 + 0.75 * difficulty) {
                /* baseline: near-random direction */
                d.guess = norm(randRange(rng, -1, 1), randRange(rng, -1, 1));
                if (!d.guess.l) d.guess = { x: 0, y: 0 };
                return;
            }
            const toLane = norm(picked.x - d.x, picked.y - d.y);
            const toCarrier = norm(carrier.x - d.x, carrier.y - d.y);
            d.guess = norm(toLane.x * 0.78 + toCarrier.x * 0.22, toLane.y * 0.78 + toCarrier.y * 0.22);
        });
    }

    function cpuPassChoice(carrier, goal, defenders, difficulty, rng) {
        const cands = PLAY.mates;
        const scored = cands.map(m => {
            const laneP = pInterceptOf(carrier, m, defenders.map(d => ({ id: d.id, pos: d, guess: null })));
            const openness = 1 - laneP;
            const d = dist(carrier, m);
            const reach = clamp(1 - Math.abs(d - 30) / 42, 0, 1);
            const progress = clamp((dist(carrier, goal) - dist(m, goal)) / 60, 0, 1);
            const shot = dist(m, goal) <= T.shootRange ? 0.5 : 0;
            const v = 0.42 * openness + 0.18 * reach + 0.3 * progress + shot + 0.05;
            /* blend toward the deliberately naive baseline (uniform) as difficulty → 0 */
            return lerp(0.28, v, difficulty);
        });
        if (rng() > 0.15 + 0.85 * difficulty) {
            return cands[Math.floor(rng() * cands.length)];   // baseline coin-flip pass
        }
        return weightedPick(cands, scored, rng).item || cands[0];
    }

    /* ==========================================================================
       § 10. FEEL — audio, shake, flash, banner (rides on top, never inside §4)
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
    /* Every piece of transient feedback lives in the HUD docks or on the renderer
       itself. Nothing is drawn over the ground: the turf carries the ball and the
       players and nothing else. */
    const bannerEl = document.getElementById('banner');
    function banner(text, color) {
        bannerEl.textContent = text;
        bannerEl.style.color = color;
        bannerEl.classList.add('show');
        clearTimeout(banner._t);
        banner._t = setTimeout(() => bannerEl.classList.remove('show'), 1100);
    }

    /* ==========================================================================
       § 11. HUD — event-driven DOM overlay + screen stack
       ========================================================================== */
    const el = id => document.getElementById(id);
    const ui = {
        hudTop: el('hud-top'), hudBottom: el('hud-bottom'),
        role: el('role-badge'), poss: el('possession-chip'),
        scoreYou: el('score-you').querySelector('strong'),
        scoreCpu: el('score-cpu').querySelector('strong'),
        plays: el('plays'), timerNum: el('timer-num'), timerWrap: el('timer-wrap'), timerBar: el('timer-bar'),
        log: el('log'), instruction: el('instruction'),
        lock: el('btn-lock'), mute: el('btn-mute'), pause: el('btn-pause'), help: el('btn-help'),
        difficulty: el('difficulty')
    };

    let lastBarWritten = -1, lastNumWritten = -1;

    function pushLog(text, cls) {
        const li = document.createElement('li');
        li.textContent = text;
        if (cls) li.className = cls;
        ui.log.prepend(li);
        while (ui.log.children.length > 5) ui.log.lastChild.remove();
    }

    bus.on('score', () => {
        ui.scoreYou.textContent = state.humanScore;
        ui.scoreCpu.textContent = state.cpuScore;
    });
    bus.on('plays', () => {
        ui.plays.textContent = 'PLAY ' + (state.plays + 1);
    });
    bus.on('role', () => {
        const attacking = state.possession === 'you';
        ui.role.textContent = attacking ? 'ATTACK' : 'DEFEND';
        ui.role.className = attacking ? 'attack' : 'defend';
        ui.poss.className = 'chip ' + state.possession;
        ui.poss.innerHTML = '<i class="dot"></i>' + (state.possession === 'you' ? 'YOU · BALL' : 'CPU · BALL');
        ui.instruction.textContent = attacking
            ? 'Swipe from the carrier to a teammate to pass · drag a teammate to move your runner · tap a teammate then LOCK IN.'
            : 'Drag a defender outward to commit its guess direction · LOCK IN to commit early.';
        ui.lock.textContent = attacking ? 'PASS ⏎' : 'COMMIT ⏎';
    });
    bus.on('lockstate', () => {
        ui.lock.disabled = state.humanLocked || state.phase !== 'decision';
    });
    bus.on('log', d => pushLog(d.text, d.cls));

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
        if (name === null) ui.pause.textContent = '❙❙';
    });

    /* ==========================================================================
       § 12. PLAY FLOW (canonical §3)
       ========================================================================== */
    function beginMatch() {
        state.humanScore = 0; state.cpuScore = 0; state.plays = 0;
        state.possession = 'you'; state.progress = 0.05; state.kickoff = true;
        state.seed = (Math.random() * 1e9) | 0;
        state.outcome = null; state.phase = 'over';
        state.trauma = 0; state.timeScale = 1;
        ui.log.innerHTML = '';
        pushLog('Kick-off — you attack the CPU goal (top).', 'good');
        bus.emit('score'); bus.emit('plays');
        Sfx.unlock(); Sfx.whistle();
        beginSetup();
    }

    function beginSetup() {
        state.phase = 'setup'; state.phaseT = 0;
        state.humanLocked = false; state.cpuLocked = false;
        state.humanChoice = null; state.cpuChoice = null;
        state.outcome = null; state.remaining = T.window;
        state.timeScale = 1;
        ui.timerWrap.classList.remove('low');
        hideOverlays();

        const atk = state.possession, def = other(atk);
        const goal = goalFor(atk);
        const rng = mulberry32(hashSeed(state.seed, state.plays, 11));

        /* carrier — a kick-off places it on the centre spot; every other play
           resumes wherever the previous one left possession */
        const carrier = teamOutfield(atk)[0];
        let cx, cy;
        if (state.kickoff) {
            state.kickoff = false;
            state.progress = 0.5;
            cx = 50; cy = 50;
        } else {
            cx = clamp(50 + randRange(rng, -6, 6), 12, 88);
            cy = carrierY(atk, state.progress);
        }
        setPos(carrier, cx, cy);
        teamOutfield(atk).forEach(p => { p.hasBall = false; p.guess = null; });
        carrier.hasBall = true;

        const atkLayout = layoutAttack(atk, { x: cx, y: cy }, goal, rng);
        const defenders = layoutDefence(def, { x: cx, y: cy }, goal, rng);
        teamOutfield(atk).forEach(p => { if (p !== carrier) p.role === 'keeper'; });
        parkKeepers();

        PLAY = {
            attacker: atk, defender: def, goal,
            carrier, mates: atkLayout.mates, runner: atkLayout.runner,
            defenders, keeper: playersById[def + '5'],
            target: null, runnerDest: null, rng,
            runnerFrom: null
        };
        PLAY.runnerDest = { x: PLAY.runner.x, y: PLAY.runner.y };
        PLAY.runnerFrom = { x: PLAY.runner.x, y: PLAY.runner.y };

        allPlayers.forEach(p => { p.selected = false; p.speed = T.playerSpeed; });
        ball.mode = 'held'; ball.holder = carrier; ball.onArrive = null;
        refreshRings();

        bus.emit('role'); bus.emit('lockstate'); bus.emit('plays');
        pushLog('Play ' + (state.plays + 1) + ' — ' + (atk === 'you' ? 'you have the ball' : 'CPU has the ball') + '.');
    }

    function setPos(p, x, y) {
        p.x = x; p.y = y; p.px = x; p.py = y; p.tx = x; p.ty = y; p.dest = null;
        p.ax = x; p.ay = y;
        syncToMesh(p);
    }

    function beginDecision() {
        state.phase = 'decision';
        state.remaining = T.window;
        state.decisionEndsAt = (window.performance ? performance.now() : Date.now()) + T.window * 1000;
        state.humanLocked = false; state.cpuLocked = false;
        state.humanChoice = null; state.cpuChoice = null;
        bus.emit('lockstate');
        bus.emit('role');
    }

    /** The human's choice, auto-filled if unset (canonical §3). */
    function humanChoiceNow() {
        if (state.humanChoice) return state.humanChoice;
        if (PLAY.attacker === 'you') {
            /* nearest safe receiver */
            const safe = PLAY.mates.slice().sort((a, b) =>
                pInterceptOf(PLAY.carrier, a, asDefInputs(PLAY.defenders)) -
                pInterceptOf(PLAY.carrier, b, asDefInputs(PLAY.defenders)))[0];
            return { type: 'pass', target: safe, autofilled: true };
        }
        /* defenders keep their current facing */
        PLAY.defenders.forEach(d => {
            if (!d.guess) d.guess = norm(PLAY.carrier.x - d.x, PLAY.carrier.y - d.y);
        });
        return { type: 'guess', autofilled: true };
    }

    function cpuChoiceNow() {
        if (state.cpuChoice) return state.cpuChoice;
        const rng = mulberry32(hashSeed(state.seed, state.plays, PLAY.attacker === 'cpu' ? 31 : 32));
        if (PLAY.attacker === 'cpu') {
            const target = cpuPassChoice(PLAY.carrier, PLAY.goal, PLAY.defenders, state.difficulty, rng);
            /* the CPU also repositions its runner up-field */
            const g = PLAY.goal;
            const rd = {
                x: clamp(lerp(PLAY.runner.x, g.x, 0.4) + randRange(rng, -14, 14), 8, 92),
                y: clamp(lerp(PLAY.runner.y, g.y, 0.45), 8, 92)
            };
            return { type: 'pass', target, runnerDest: rd };
        }
        cpuGuessSet(PLAY.defenders, PLAY.carrier, PLAY.goal, state.difficulty, rng);
        return { type: 'guess' };
    }

    const asDefInputs = dfs => dfs.map(d => ({ id: d.id, pos: d, guess: d.guess }));

    function lockIn(who) {
        if (state.phase !== 'decision') return;
        if (who === 'you') {
            if (state.humanLocked) return;
            state.humanChoice = humanChoiceNow();
            state.humanLocked = true;
        } else {
            if (state.cpuLocked) return;
            state.cpuChoice = cpuChoiceNow();
            state.cpuLocked = true;
            if (state.cpuChoice.type === 'pass' && state.cpuChoice.runnerDest) {
                PLAY.runnerDest = state.cpuChoice.runnerDest;
                PLAY.runner.dest = state.cpuChoice.runnerDest;
            }
        }
        bus.emit('lockstate');
        if (state.humanLocked && state.cpuLocked) beginResolve();
    }

    function beginResolve() {
        /* make sure both sides have committed — hidden from each other until now */
        if (!state.humanLocked) { state.humanChoice = humanChoiceNow(); state.humanLocked = true; }
        if (!state.cpuLocked) { state.cpuChoice = cpuChoiceNow(); state.cpuLocked = true; }
        if (state.humanChoice && state.humanChoice.type === 'pass' && state.humanChoice.target) {
            PLAY.target = state.humanChoice.target;
        }
        if (state.cpuChoice && state.cpuChoice.type === 'pass' && state.cpuChoice.target) {
            PLAY.target = state.cpuChoice.target;
        }
        if (state.humanChoice && state.humanChoice.type === 'guess') humanApplyGuesses();
        if (state.cpuChoice && state.cpuChoice.type === 'guess') { /* already written onto defenders */ }

        /* if this side never picked a target, auto-fill one */
        if (!PLAY.target) {
            PLAY.target = PLAY.mates.slice().sort((a, b) =>
                pInterceptOf(PLAY.carrier, a, asDefInputs(PLAY.defenders)) -
                pInterceptOf(PLAY.carrier, b, asDefInputs(PLAY.defenders)))[0];
        }

        state.phase = 'resolve'; state.phaseT = 0;
        state.pending = true;              // wait for the runner to finish, then §4 runs once
        state.timeScale = state.reduceMotion ? 1 : T.slowScale;
        ui.lock.disabled = true;
        playerGuessArrowRefresh(true);      // reveal the committed lanes
        pushLog((PLAY.attacker === 'you' ? 'You' : 'CPU') + ' plays it to ' + PLAY.target.label + '…');
        Sfx.kick();
    }

    function humanApplyGuesses() {
        /* taps/drags already wrote d.guess; unset ones fall back to facing */
        PLAY.defenders.forEach(d => {
            if (!d.guess) d.guess = norm(PLAY.carrier.x - d.x, PLAY.carrier.y - d.y);
        });
    }

    function executeResolve() {
        state.pending = false;
        const rng = mulberry32(hashSeed(state.seed, state.plays, 77));
        const C = { x: PLAY.carrier.x, y: PLAY.carrier.y };
        const Tp = { x: PLAY.target.x, y: PLAY.target.y };
        const res = resolvePass({
            C, T: Tp,
            defenders: asDefInputs(PLAY.defenders),
            keeper: { pos: { x: PLAY.keeper.x, y: PLAY.keeper.y } },
            goal: PLAY.goal
        }, rng);
        state.outcome = res;
        PLAY.outcome = res;
        PLAY.C = C; PLAY.Tp = Tp;

        /* ball travel (§7 feedback rides on top of the outcome) */
        const laneLen = dist(C, Tp);
        ball.mode = 'fly'; ball.holder = null;
        ball.from = { x: C.x, y: C.y };
        ball.dur = clamp(0.42 + laneLen / 100 * 0.55, 0.42, 1.0) / Math.max(0.15, state.timeScale);
        ball.arc = res.type === 'INTERCEPTION' ? 0.7 : 1.5;
        ball.t = 0;

        if (res.type === 'INTERCEPTION') {
            ball.to = { x: res.at.x, y: res.at.y };
            const d = playersById[res.defender] || PLAY.defenders[0];
            d.dest = { x: res.at.x, y: res.at.y };
            d.speed = T.playerSpeed;
            Sfx.bad(); shake(.32);
            banner('INTERCEPTED', CSS.bad);
            bus.emit('log', { text: 'Intercepted by ' + d.label + '!', cls: 'bad' });
        } else if (res.type === 'GOAL') {
            ball.to = { x: Tp.x, y: Tp.y };
            Sfx.goal(); shake(.75);
            banner('GOAL!', CSS.goal);
            bus.emit('log', { text: 'GOAL for ' + (PLAY.attacker === 'you' ? 'you' : 'CPU') + '!', cls: PLAY.attacker === 'you' ? 'good' : 'bad' });
        } else if (res.type === 'SAVE') {
            ball.to = { x: PLAY.keeper.x, y: PLAY.keeper.y };
            PLAY.keeper.dest = { x: Tp.x, y: Tp.y };
            Sfx.save(); shake(.22);
            banner('SAVED', CSS.warn);
            bus.emit('log', { text: 'Keeper saves it!', cls: PLAY.attacker === 'you' ? 'bad' : 'good' });
        } else {
            ball.to = { x: Tp.x, y: Tp.y };
            Sfx.pass(); Sfx.good(); shake(.08);
            banner('COMPLETE', CSS.you);
            bus.emit('log', { text: 'Completed to ' + PLAY.target.label + '.', cls: PLAY.attacker === 'you' ? 'good' : '' });
        }
        console.debug('[§4]', res.type, 'pIntercept=' + res.pIntercept.toFixed(3),
            res.pGoal !== null && res.pGoal !== undefined ? 'pGoal=' + res.pGoal.toFixed(3) : '');
    }

    function applyOutcome() {
        const res = state.outcome;
        if (!res) return;
        const atk = PLAY.attacker;

        if (res.type === 'COMPLETE') {
            state.possession = atk;
            state.progress = progressFromY(atk, res.at.y);
        } else if (res.type === 'INTERCEPTION') {
            state.possession = other(atk);
            state.progress = progressFromY(state.possession, res.at.y);
        } else if (res.type === 'GOAL') {
            if (atk === 'you') state.humanScore++; else state.cpuScore++;
            bus.emit('score');
            state.possession = other(atk);      // kickoff to the conceding side
            state.progress = 0.05;
            state.kickoff = true;               // …from the centre spot
            Sfx.whistle();
        } else if (res.type === 'SAVE') {
            state.possession = other(atk);
            state.progress = progressFromY(state.possession, PLAY.keeper.y);
        }
    }

    function endOfPlay() {
        state.plays++;
        bus.emit('plays');
        const done = state.humanScore >= T.winScore || state.cpuScore >= T.winScore;
        if (done) return endMatch();
        beginSetup();
    }

    function endMatch() {
        state.phase = 'over';
        const won = state.humanScore > state.cpuScore;
        const draw = state.humanScore === state.cpuScore;
        el('over-title').textContent = draw ? 'DRAW ' + state.humanScore + '–' + state.cpuScore
            : (won ? 'YOU WIN ' : 'CPU WINS ') + state.humanScore + '–' + state.cpuScore;
        el('over-detail').textContent = state.plays + ' plays · first to ' + T.winScore + ' goals.';
        bus.emit('log', { text: draw ? 'Full time: draw.' : (won ? 'Full time: you win!' : 'Full time: CPU wins.'), cls: won ? 'good' : 'bad' });
        pushScreen('over', { focus: '#btn-again' });
    }

    function hideOverlays() {
        guessArrows.forEach(a => a.visible = false);
        aimLine.visible = false;
        runnerMarker.visible = false;
    }

    /* ==========================================================================
       § 13. INPUT — Pointer Events: one code path for mouse, touch and pen
       ========================================================================== */
    const drag = { kind: null, player: null, x0: 0, y0: 0, x: 0, y: 0, moved: 0, id: null };

    function canvasPoint(e) {
        const r = canvas.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        /* view.hw is in screen units, where x is already compressed by KX —
           divide it back out to land on the canonical 0…100 grid */
        const gx = 50 + ((px / r.width) * 2 - 1) * view.hw / KX;
        const gy = 50 + (1 - (py / r.height) * 2) * view.hh;
        return { x: gx, y: gy, px, py, rect: r };
    }
    const screenRadius = rect => Math.max(24, rect.height * 0.055);

    function hitTest(p, pt, rect) {
        const r = screenRadius(rect);
        const a = { x: ((p.x - 50) * KX + view.hw) / (2 * view.hw) * rect.width, y: (1 - (p.y - 50 + view.hh) / (2 * view.hh)) * rect.height };
        return Math.hypot(a.x - pt.px, a.y - pt.py) <= r;
    }
    function pickPlayer(pt) {
        let best = null, bd = Infinity;
        const r = screenRadius(pt.rect);
        allPlayers.forEach(p => {
            const a = {
                x: ((p.x - 50) * KX + view.hw) / (2 * view.hw) * pt.rect.width,
                y: (1 - (p.y - 50 + view.hh) / (2 * view.hh)) * pt.rect.height
            };
            const d = Math.hypot(a.x - pt.px, a.y - pt.py);
            if (d <= r && d < bd) { bd = d; best = p; }
        });
        return best;
    }

    const humanAttacking = () => PLAY && PLAY.attacker === 'you';
    const humanDefending = () => PLAY && PLAY.attacker === 'cpu';

    function onDown(e) {
        if (state.phase !== 'decision' || state.humanLocked || topScreen()) return;
        if (e.button !== undefined && e.button !== 0) return;
        const pt = canvasPoint(e);
        const p = pickPlayer(pt);
        drag.x0 = pt.x; drag.y0 = pt.y; drag.x = pt.x; drag.y = pt.y; drag.moved = 0; drag.id = e.pointerId;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
        canvas.classList.add('grabbing');

        if (humanDefending() && p && p.team === 'you' && p.role === 'outfield') {
            drag.kind = 'guess'; drag.player = p; p.selected = true;
        } else if (humanAttacking() && p === PLAY.carrier) {
            drag.kind = 'aim'; drag.player = p;
        } else if (humanAttacking() && p && p.team === 'you') {
            drag.kind = 'move'; drag.player = p; p.selected = true;
        } else if (humanAttacking() && !p) {
            drag.kind = 'runner'; drag.player = PLAY.runner; PLAY.runner.selected = true;
        } else if (humanDefending() && p && p.team === 'cpu') {
            drag.kind = 'scout'; drag.player = p;
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

        if (drag.kind === 'aim' && drag.moved > 12) {
            const cand = aimCandidate(drag.x0, drag.y0, drag.x, drag.y);
            PLAY.mates.forEach(m => m.selected = (m === cand));
            PLAY.previewTarget = cand;
            drag.player.selected = true;
            updateAimVisual(drag.x0, drag.y0, drag.x, drag.y, cand);
        } else if (drag.kind === 'runner' || (drag.kind === 'move' && drag.moved > 12)) {
            PLAY.previewRunner = { x: clamp(pt.x, 5, 95), y: clamp(pt.y, 5, 95) };
            runnerMarker.visible = true;
            runnerMarker.position.set(worldX(PLAY.previewRunner.x), 0.08, worldZ(PLAY.previewRunner.y));
        } else if (drag.kind === 'guess' && drag.moved > 12) {
            const g = norm(drag.x - drag.x0, drag.y - drag.y0);
            drag.guessPreview = g;
            const len = 14;
            guessArrows[0].visible = true;
            guessArrows[0].setEnds({ x: drag.player.x, y: drag.player.y },
                { x: drag.player.x + g.x * len, y: drag.player.y + g.y * len });
            guessArrows[0].material.color.setHex(drag.player.team === 'you' ? COL.you : COL.cpu);
        }
        updateCursor();
    }

    /** Nearest teammate in the swipe direction. */
    function aimCandidate(x0, y0, x, y) {
        const d = norm(x - x0, y - y0);
        if (!d.l) return null;
        let best = null, bs = 0.15;
        PLAY.mates.forEach(m => {
            const to = norm(m.x - x0, m.y - y0);
            if (!to.l) return;
            const dot = (to.x * d.x + to.y * d.y);
            const score = dot - to.l / 400;
            if (dot > 0 && score > bs) { bs = score; best = m; }
        });
        return best;
    }

    function updateAimVisual(x0, y0, x, y, cand) {
        aimLine.visible = true;
        const end = cand ? { x: cand.x, y: cand.y } : { x, y };
        aimLine.setEnds({ x: x0, y: y0 }, end);
        aimLine.material.color.setHex(cand ? COL.aim : COL.ghost);
        aimLine.material.opacity = cand ? 1 : .45;
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
            PLAY.mates.forEach(m => m.selected = false);
            if (moved < 14) {
                /* tap on the carrier clears the pick */
                if (PLAY.previewTarget) PLAY.target = PLAY.previewTarget;
                PLAY.previewTarget = null;
            } else if (PLAY.previewTarget) {
                /* release commits the pass early — both sides lock together */
                PLAY.target = PLAY.previewTarget;
                PLAY.previewTarget = null;
                state.humanChoice = { type: 'pass', target: PLAY.target };
                lockIn('you');
            } else {
                PLAY.previewTarget = null;
                pushLog('No teammate in that direction — swipe toward one.', '');
            }
        } else if (kind === 'move' || kind === 'runner') {
            if (moved > 12 && PLAY.previewRunner) {
                PLAY.runnerDest = PLAY.previewRunner;
                player.dest = PLAY.previewRunner;
                player.speed = T.playerSpeed;
                pushLog('Runner sent to ' + Math.round(PLAY.runnerDest.x) + ', ' + Math.round(PLAY.runnerDest.y) + '.', '');
            }
            PLAY.previewRunner = null;
            runnerMarker.visible = false;
            player.selected = false;
        } else if (kind === 'guess') {
            if (moved > 12) {
                const g = norm(pt.x - drag.x0, pt.y - drag.y0);
                player.guess = g.l ? { x: g.x, y: g.y } : null;
                pushLog(player.label + ' commits ' + arrowWord(g) + '.', '');
            }
            player.selected = false;
        } else if (kind === 'scout') {
            if (moved < 14) pushLog(player.label + ' — CPU will commit this lane at random.', '');
        }
        guessArrows[0].visible = false;
        refreshRings();
        if (state.phase === 'decision' && !state.humanLocked && PLAY && PLAY.target && !humanAttacking()) { /* nothing */ }
    }

    function arrowWord(g) {
        if (!g || !g.l) return 'nothing';
        const ang = Math.atan2(g.y, g.x) * 180 / Math.PI;
        const dirs = ['right', 'up-right', 'up', 'up-left', 'left', 'down-left', 'down', 'down-right'];
        return dirs[Math.round(((ang + 360) % 360) / 45) % 8];
    }

    function updateCursor() {
        canvas.style.cursor = drag.kind ? 'grabbing' : (state.phase === 'decision' ? 'crosshair' : 'default');
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
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (state.phase === 'decision' && !state.humanLocked) lockIn('you');
        }
        if (e.key === 'm' || e.key === 'M') toggleMute();
        if (e.key === 'r' || e.key === 'R') { if (state.phase !== 'idle') beginMatch(); }
        if (e.key === 'h' || e.key === 'H') pushScreen('tutorial', { focus: '#btn-tut-close' });
    });

    /* ==========================================================================
       § 14. UPDATE + RENDER
       ========================================================================== */
    function updateBall(dt) {
        if (ball.mode === 'held' && ball.holder) {
            const p = ball.holder;
            const toGoal = norm(PLAY ? PLAY.goal.x - p.x : 0, PLAY ? PLAY.goal.y - p.y : 1);
            ballAt(p.x + toGoal.x * 0.95, p.y + toGoal.y * 0.95, 0.42);
        } else if (ball.mode === 'fly' && ball.from && ball.to) {
            ball.t = Math.min(1, ball.t + dt / ball.dur);
            const t = ball.t;
            ballAt(lerp(ball.from.x, ball.to.x, t), lerp(ball.from.y, ball.to.y, t), 0.42 + Math.sin(Math.PI * t) * ball.arc);
            if (ball.t >= 1) {
                ball.mode = 'rest';
                const cb = ball.onArrive; ball.onArrive = null;
                if (cb) cb();
            }
        }
        ballMesh.position.set(worldX(ball.x), ball.h, worldZ(ball.y));
        ballShadow.position.set(worldX(ball.x), 0.04, worldZ(ball.y));
        const s = 1 - clamp(ball.h / 4, 0, .6);
        ballShadow.scale.setScalar(s);
        ballShadow.material.opacity = 0.75 * s;
    }

    function playerGuessArrowRefresh(showHumanToo) {
        let i = 0;
        PLAY.defenders.forEach(d => {
            if (!d.guess || (!showHumanToo && d.team === 'you')) { return; }
            const arrow = guessArrows[++i];
            if (!arrow) return;
            const len = 13;
            arrow.visible = true;
            arrow.material.color.setHex(d.team === 'you' ? COL.you : COL.cpu);
            arrow.material.opacity = showHumanToo ? .95 : .5;
            arrow.setEnds({ x: d.x, y: d.y }, { x: d.x + d.guess.x * len, y: d.y + d.guess.y * len });
        });
        /* hide unused arrows */
        for (let k = i + 1; k < guessArrows.length; k++) guessArrows[k].visible = false;
    }

    function update(dt, now) {
        const rawDt = dt;

        /* --- match phases --- */
        if (state.phase === 'setup') {
            state.phaseT += rawDt;
            allPlayers.forEach(p => moveToward(p, p.ax, p.ay, 46, rawDt));
            if (state.phaseT >= T.setupTime) beginDecision();
        } else if (state.phase === 'decision') {
            /* countdown is driven off the real clock timestamp, never off dt */
            state.remaining = Math.max(0, (state.decisionEndsAt - now) / 1000);
            if (state.remaining <= 0) beginResolve();
        } else if (state.phase === 'resolve') {
            state.phaseT += rawDt;
            if (state.pending) {
                const r = PLAY.runner;
                const arrived = r.dest ? moveToward(r, r.dest.x, r.dest.y, T.playerSpeed, rawDt) : true;
                if (arrived) r.dest = null;
                if (arrived || state.phaseT > 0.75) executeResolve();
            } else if (state.phaseT > ball.dur + 0.12) {
                applyOutcome();
                state.phase = 'result'; state.phaseT = 0;
            }
        } else if (state.phase === 'result') {
            state.phaseT += rawDt;
            if (state.phaseT >= T.resultTime) endOfPlay();
        }

        /* --- presentation clock (slow-motion is applied here only) --- */
        state.timeScale += (1 - state.timeScale) * Math.min(1, rawDt * 2.6);
        const pdt = rawDt * state.timeScale;

        /* --- players --- */
        allPlayers.forEach(p => {
            if (p.dest) {
                if (moveToward(p, p.dest.x, p.dest.y, p.speed, pdt)) p.dest = null;
            } else if (state.phase === 'setup') {
                /* handled above */
            } else {
                moveToward(p, p.ax, p.ay, T.driftSpeed, pdt);
            }
            animatePlayer(p, pdt);
            syncToMesh(p);
        });
        /* keepers shuffle to the ball's y a little — sells the top-down read */
        [playersById['you5'], playersById['cpu5']].forEach(k => {
            if (!k.dest) {
                const base = k.team === 'you' ? 5.5 : 94.5;
                k.tx = clamp(50 + (ball.x - 50) * 0.35, 42, 58);
                k.ty = base;
            }
        });

        if (PLAY) {
            if (state.phase === 'decision') {
                playerGuessArrowRefresh(true);
                if (!PLAY.target) { aimLine.visible = false; }
            }
            /* carrier faces the chosen target while deciding */
            if (PLAY.carrier && PLAY.target && state.phase === 'decision') {
                PLAY.carrier.yaw = Math.atan2(PLAY.target.x - PLAY.carrier.x, -(PLAY.target.y - PLAY.carrier.y));
                if (drag.kind !== 'aim') {
                    aimLine.visible = true;
                    aimLine.material.color.setHex(COL.aim);
                    aimLine.material.opacity = .8;
                    aimLine.setEnds(PLAY.carrier, PLAY.target);
                }
            }
        }

        updateBall(pdt);

        /* --- feel: screen shake --- */
        state.trauma = Math.max(0, state.trauma - rawDt * 1.5);
        const t2 = state.trauma * state.trauma;
        const amp = state.reduceMotion ? 0 : 2.4 * t2;
        const sx = (Math.random() * 2 - 1) * amp;
        const sy = (Math.random() * 2 - 1) * amp;
        /* camera right = world +X, camera up = (0, sinθ, −cosθ) */
        camera.position.x = sx;
        camera.position.y = 130 * Math.cos(TILT) + sy * Math.sin(TILT);
        camera.position.z = 130 * Math.sin(TILT) - sy * Math.cos(TILT);
        camera.rotation.z = 0;
        camera.lookAt(sx, sy * Math.sin(TILT), -sy * Math.cos(TILT));
    }

    function updateHud(now) {
        if (state.phase !== 'decision') return;
        const k = clamp(state.remaining / T.window, 0, 1);
        if (Math.abs(k - lastBarWritten) > 0.004) {
            ui.timerBar.style.transform = 'scaleX(' + k.toFixed(3) + ')';
            lastBarWritten = k;
        }
        const n = Math.ceil(state.remaining * 10) / 10;
        if (n !== lastNumWritten) { ui.timerNum.textContent = n.toFixed(1); lastNumWritten = n; }
        ui.timerWrap.classList.toggle('low', state.remaining <= 1.0);
    }

    function resize() {
        /* The canvas fills the stage, so its box decides the fit. reqHW/reqHH are
           the ground's own half-extents in screen units; the branch below is a
           contain policy, so the whole 105 × 68 m pitch — goals included — is
           visible at every aspect ratio, with slack on whichever axis is spare. */
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        const aspect = w / h;
        let hw, hh;
        if (aspect >= reqHW / reqHH) { hh = reqHH; hw = reqHH * aspect; }
        else { hw = reqHW; hh = reqHW / aspect; }
        view.hw = hw; view.hh = hh;
        camera.left = -hw; camera.right = hw; camera.top = hh; camera.bottom = -hh;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 120));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

    /* --- pause handling keeps the decision clock honest --- */
    let pausedAt = 0;
    function pauseGame() {
        if (state.phase === 'idle' || state.phase === 'over') return;
        state.paused = true;
        pausedAt = performance.now();
        pushScreen('pause', { focus: '#btn-resume' });
    }
    function resumeGame() {
        if (!state.paused) { popScreen(); return; }
        state.paused = false;
        state.decisionEndsAt += performance.now() - pausedAt;
        popScreen();
    }

    let last = performance.now();
    function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!state.paused && !topScreen()) update(dt, now);
        else if (state.paused) { /* frozen, but keep rendering */ }
        updateHud(now);
        renderer.render(scene, camera);
    }

    /* ==========================================================================
       § 15. WIRING
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
    el('btn-lock').addEventListener('click', () => lockIn('you'));
    el('btn-pause').addEventListener('click', () => pauseGame());
    el('btn-mute').addEventListener('click', toggleMute);
    el('btn-resume').addEventListener('click', resumeGame);
    el('btn-restart').addEventListener('click', () => { state.paused = false; while (topScreen()) popScreen(); beginMatch(); });
    el('btn-quit').addEventListener('click', () => { state.paused = false; while (topScreen()) popScreen(); state.phase = 'idle'; pushScreen('menu', { focus: '#btn-start' }); });
    el('btn-again').addEventListener('click', () => { popScreen(); beginMatch(); });
    el('btn-menu').addEventListener('click', () => { while (topScreen()) popScreen(); state.phase = 'idle'; pushScreen('menu', { focus: '#btn-start' }); });
    el('btn-verify').addEventListener('click', () => { const r = runVerification(true); banner(r.allPass ? '§4 ALL PASS' : '§4 TESTS FAILED', r.allPass ? CSS.goal : CSS.bad); });
    ui.difficulty.addEventListener('click', e => {
        const b = e.target.closest('button[data-diff]');
        if (!b) return;
        state.difficulty = parseFloat(b.dataset.diff);
        Array.from(ui.difficulty.querySelectorAll('button')).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });

    /* first user gesture unlocks Web Audio */
    ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, () => Sfx.unlock(), { once: true, passive: true }));

    /* --- boot --- */
    resize();
    parkKeepers();
    allPlayers.forEach(p => syncToMesh(p));
    pushScreen('menu', { focus: '#btn-start' });
    requestAnimationFrame(frame);

    /* --- §3/§4 verification: always available, and reported on load --- */
    const verify = runVerification(false);
    console.log('[Guess & Pass] §4 verification: ' + (verify.allPass ? 'ALL PASS' : 'FAILURES — see __GAP_VERIFY_RESULTS'));
    if (!verify.allPass) banner('§4 TESTS FAILED', CSS.bad);

    /* debug surface for the console / unit-test harnesses */
    window.__GAP = {
        T, state, resolvePass, defenderChance, pInterceptOf, runVerification,
        get play() { return PLAY; },
        api: {
            beginMatch, beginSetup, beginDecision, beginResolve, executeResolve,
            lockIn, pauseGame, resumeGame, toggleMute,
            setDifficulty: d => { state.difficulty = clamp(d, 0, 1); },
            forceOutcome: t => { state.outcome = { type: t, at: { x: 50, y: 90 }, pIntercept: 0, pGoal: null }; }
        }
    };
    /* ----------------------------------------------------------------------
       ↑↑↑ MECHANICAL EXTRACTION ENDS — do not hand-edit above this line ↑↑↑
       ---------------------------------------------------------------------- */
})();
