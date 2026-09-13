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
    const SETUP_TIME = 1.15;      // kick-off / restart rearrange, seconds
    const ASSEMBLE_SPEED = 15;    // how fast the shape walks out for a restart.
    // A jog, not a sprint: "everyone explodes into position" was a large part of
    // why the board read as too fast.
    const ARC_PASS = 1.0, ARC_SHOT = 0.5;
    /* --- §12.b ball motion: a struck ball rolls, it does not snap to a spot ---
       Presentation only. The rulebook still decides *who* wins a ball (§7);
       these numbers decide how the ball looks getting there, and not one of them
       is read by a property test.

       A pass is a decelerating ground ball, but it has one hard constraint that
       is about the rules and not at all about the look: IT MUST STAY FASTER THAN
       A RUNNING MAN FOR ITS WHOLE FLIGHT. The previous profile did not. It faded
       to PASS_SLOW·BALL_SPEED by the time it resolved and AVERAGED
       PASS_PACE·BALL_SPEED — 0.78 × 23.8 = 18.6 against a run of 18.2. On paper
       the ball had won by 0.4 units/s; on the board the whole second half of
       every pass was the slowest thing on the pitch and the receiver simply
       overtook it. From above, that reads as "the players are faster than the
       ball", which is exactly what it was.

       So the ball is now kicked harder than it needs to be and dies into the
       receiver instead of crawling to him: v0 = PASS_PACE·BALL_SPEED = 26.7, and
       still PASS_SLOW·v0 = 19.2 when it arrives — faster than a 18.2 run all the
       way down, and only just beatable in the final stride. `dec` is solved
       backwards from that single requirement, so the arrival fraction is exactly
       PASS_SLOW at every distance.

       PASS_REACH is how much of the aimed distance the ball covers before it
       resolves, and it is 1.0 — the whole of it — because the aimed distance IS
       the drawn line. Anything less puts the ball down short of the spot the
       player drew: 0.94 hides the error at 18 units (1.1 short) but not at 92,
       where it strands the ball 5.5 units away, well outside CATCH_RADIUS, and
       the line and the ball visibly disagree again. Landing exactly on the point
       is also the SAFE choice rather than a reckless one, because resolution
       picks the NEAREST body: a receiver standing on the drawn spot is at
       distance 0 and no defender can be nearer than that. */
    const BALL_CARRY = 1.15;      // how far ahead of the boot the ball is carried
    const PASS_SLOW = 0.72;       // speed at resolution, as a fraction of the kick
    const PASS_PACE = 1.12;       // kick speed, as a multiple of BALL_SPEED
    const PASS_REACH = 1.0;       // and it has covered this much ground by then
    const BALL_ROLL_STOP = 14.0;  // turf friction for a loose ball, u/s²
    const BALL_ROLL_ARC = 0.06;   // a rolled ball is on the deck, not in the air
    /* --- and how it is *drawn*, which is the half nobody could see ------------
       The ball is a 0.42-unit sphere on a board 100 units wide, and it was also
       rendered pure white with emissive blown to full, so every pixel of it was
       clipping at white and it had no shading at all: a flat white dot on a dark
       pitch that has white lines painted across it is genuinely hard to find.
       It is now plain Lambert white, scaled up a touch, wearing a dark rim so it
       cannot vanish against the paint, with a beacon ring on the turf under it.
       All three are light-independent on purpose — see the material's comment. */
    const BALL_VIS = 1.16;        // drawn this much larger than it is, to be findable
    const BALL_PING = 1.25;       // seconds per beacon ring
    const LANE_OFFSET = [-30, -14, 14, 30];
    const LANE_DEPTH = [0.55, 0.82, 0.62, 0.34];
    const TAP_SLOP = 6;           // game units a pointer must travel to be a drag
    const DOUBLE_TAP_MS = 340;    // §5 — double-tap to shoot
    const SO_ZOOM = 2.6, SO_PAN_Y = 92;   // §10 penalty view: one end, magnified
    /* --- §11.b the coached opening --------------------------------------- */
    const TUTOR_DELAY = 1.6;      // seconds of open play before step 1 speaks
    const TUTOR_STEP_MS = 20000;  // a step may never hold the match up for longer

    /* ==========================================================================
       § 0.b PALETTE — re-skinned to the DESIGN.md (Vercel / Geist) accent family.
       The canvas UI is an ink-on-near-white duet; the pitch is that same duet
       inverted (an ink board with near-white hairline markings), and the only
       colour on it is the restrained Geist accent set: cyan, link blue, violet,
       magenta and the gradient's amber. Purely presentational — no mechanic
       reads these values.
       ========================================================================== */
    const COL = {
        /* Pulled up to full saturation and pushed apart on the colour wheel —
           mint against hot magenta are near-opposite hues, so the two kits stay
           separable even for the ~1 in 12 players with red-green colour vision
           deficiency and even at the smallest zoom the board is ever drawn at.
           The two keepers are deliberately *not* tints of their own team: a
           keeper has to read as "the keeper" first and a shirt second. */
        you: 0x2bf7c0, cpu: 0xff2d87,        /* electric mint / hot magenta */
        gkYou: 0x1f6bff, gkCpu: 0xffc300,    /* keeper blue / keeper amber  */
        aim: 0xffc300, ghost: 0xfafafa        /* selection amber / canvas    */
    };
    const CSS = {
        you: '#2bf7c0', cpu: '#ff2d87', lime: '#ffc300',
        goal: '#2bf7c0', bad: '#ff2d87', warn: '#ffc300'
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
        paused: false,
        phaseT: 0,            // seconds in the current dead-ball beat
        /* §11.b — the coached opening. `tutor` is the step the player is being
           asked for (1–4), `tutorTargets` the players that step refers to,
           `tutorClock` the watchdog, and `tutorDone` latches the walkthrough so
           it can never arm twice in a match. */
        tutor: 0,
        tutorTargets: null,
        tutorClock: 0,
        tutorDone: false
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
    /* Real metres per canonical unit. This pitch is anamorphic: the logic grid
       is a 100 × 100 square stretched onto 68 × 105 m, so one x unit is 0.68 m
       while one y unit is 1.05 m. Every width along the goal line therefore has
       to be multiplied by these, never treated as if a unit were a metre. */
    /* metres per canonical unit — the grid is 100 units over each axis */
    const M_X = PITCH_M.x / 100;                    // 0.68 m per game-x unit
    const M_Y = PITCH_M.y / 100;                    // 1.05 m per game-y unit
    /* The mouth, in real metres. §2 puts it at 2 × GOAL_HALF_WIDTH on the
       canonical grid and one canonical x unit is M_X metres, so the mouth is
       25 × 0.68 = 17 m — NOT 25 m. Reading a canonical unit as a metre is what
       made the frames (and the area beside them) far too big. */
    const GOAL_HALF_M = GOAL_HALF_WIDTH * M_X;      // 8.5 m
    const PITCH = {
        w: 100,
        h: 100,
        goalW: GOAL_HALF_WIDTH * 2,                 // 25 canonical units
        /* Everything below is authored in real metres, so the painted artwork
           and the 3D furniture finally agree with each other and the rulebook. */
        boxW: 40.32, boxD: 16.5,                    // penalty area
        /* The goal area — the "small D" — is *exactly* the mouth wide: the posts
           stand on the area's side lines. That is what "the size of the post
           should be the same as the small D area" asks for. */
        sixW: GOAL_HALF_M * 2,                      // 17 m — the mouth itself
        sixD: 5.5
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

    /* 3 units of slack on the halfway line — deliberately wider than the ±2.5
       restart jitter, so nothing that gets clamped into a half can be nudged
       back out of it afterwards. */
    const HALF_SLACK = 3;
    /** A team's own half as a hard y-band, and the clamp that enforces it.
        Symmetric about the halfway line, so both directions read identically:
        the side that attacks +y is the side that defends −y. */
    const ownHalf = (team, y) => (attackSide(team) > 0
        ? Math.min(y, 50 - HALF_SLACK)
        : Math.max(y, 50 + HALF_SLACK));

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

        /* both penalty areas + goal areas. The small box is exactly as wide as
           the goal mouth — 2 × GOAL_HALF_M metres, centred on x = 50 — so the
           3D frame standing on it is precisely as wide as the area it sits in. */
        const sw = GOAL_HALF_M, bw = PITCH.boxW / 2, bd = PITCH.boxD, sd = PITCH.sixD;
        rect(-bw, GL - bd, bw, GL); rect(-sw, GL - sd, sw, GL);
        rect(-bw, -GL, bw, -(GL - bd)); rect(-sw, -GL, sw, -(GL - sd));

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
           goal's true width — the same 17 m the 3D frame spans and the same
           17 m the goal area beside it is drawn at, so all three agree. */
        function net(side) {
            const gw = GOAL_HALF_M * 2, depth = 2;      // metres — the mouth itself
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
        /* PITCH.goalW is the rulebook's mouth on the canonical grid (x axis);
           KX is the world-x compression, so worldZ/worldX-space gets exactly
           the width the geometry tests use — 25 × 0.648 ≈ 16.2 world units, the
           same span as the goal area painted at its foot. */
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
    /* `flatShading` keeps the low-poly facets readable (a smooth-shaded 4-unit
       stick figure just smears into a silhouette from directly overhead) and the
       emissive lift means the kits still read on the darkest turf bands at the
       far end of the pitch, where the lighting falls away. */
    const MAT = {
        you: new THREE.MeshLambertMaterial({ color: COL.you, emissive: COL.you, emissiveIntensity: 0.26, flatShading: true }),
        cpu: new THREE.MeshLambertMaterial({ color: COL.cpu, emissive: COL.cpu, emissiveIntensity: 0.26, flatShading: true }),
        gkYou: new THREE.MeshLambertMaterial({ color: COL.gkYou, emissive: COL.gkYou, emissiveIntensity: 0.26, flatShading: true }),
        gkCpu: new THREE.MeshLambertMaterial({ color: COL.gkCpu, emissive: COL.gkCpu, emissiveIntensity: 0.26, flatShading: true })
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
        /* shorts and cap take a darkened cut of the team hue rather than a shared
           neutral, so each player reads as a whole kit — shirt, shorts and cap —
           and not just a coloured torso floating over a dark pitch */
        const shorts = new THREE.MeshLambertMaterial({
            color: kitMat.color.clone().multiplyScalar(0.36)
        });
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
            color: team === 'you' ? COL.you : COL.cpu,
            transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
        }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        const shadow = makeBlobShadow(1.15);
        scene.add(mesh, ring, shadow);

        const p = {
            id: team + num, team, role, num,
            label: role === 'keeper' ? (team === 'you' ? 'YOU-GK' : 'CPU-GK') : (team === 'you' ? 'YOU' : 'CPU') + '-' + num,
            x: 50, y: 50, tx: 50, ty: 50, dest: null, ax: 50, ay: 50,
            queued: null,        // §17.b — where this player will run at execution
            mesh, ring, shadow,
            yaw: team === 'you' ? Math.PI : 0, walk: 0, px: 50, py: 50,
            hasBall: false, selected: false, controlled: false, held: false,
            duty: null,          // 'interceptor' | 'marker' for the human's two
            dive: null,          // keeper only: where this dive is going
            /* a shade under the base speed, so a defender has to get a head start
               rather than being able to simply outrun the player in possession */
            speed: PLAYER_SPEED * 0.9
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

    /* --- body separation ----------------------------------------------------
       Nothing in the engine used to stop two players occupying the exact same
       coordinate. A human player and a CPU player converging on the same spot
       therefore ended up drawn on top of one another, and from above that read
       as the ball being stuck: the ball sat under a stack of two bodies, and any
       drag on the spot was resolved to whichever of the two happened to be
       nearest — sometimes the CPU player, whose drag does nothing.

       Every frame, any pair closer than SEPARATE_R is pushed apart along the
       line between them, half each, at a speed rather than instantly, so a
       defender pressing the carrier reads as a shoulder-to-shoulder challenge
       instead of a teleport. The keeper's dive is exempt: a save must never be
       nudged off the line it is flying to. Exactly-coincident pairs get a
       deterministic axis (no RNG) so the split is reproducible. */
    const SEPARATE_R = CATCH_RADIUS * 1.15;
    const SEPARATE_SPEED = PLAYER_SPEED;

    function separatePlayers(dt) {
        const maxPush = SEPARATE_SPEED * dt;
        for (let i = 0; i < allPlayers.length; i++) {
            for (let j = i + 1; j < allPlayers.length; j++) {
                const a = allPlayers[i], b = allPlayers[j];
                const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
                if (d >= SEPARATE_R) continue;
                if (d < 1e-4) {
                    /* dead centre: split along a fixed axis derived from the pair */
                    const ang = (i * 7 + j * 13) * 2.399963229728653;
                    const px = Math.cos(ang) * maxPush * 0.5, py = Math.sin(ang) * maxPush * 0.5;
                    if (!a.dive) { a.x = clamp(a.x - px, 3, 97); a.y = clamp(a.y - py, 3, 97); }
                    if (!b.dive) { b.x = clamp(b.x + px, 3, 97); b.y = clamp(b.y + py, 3, 97); }
                    continue;
                }
                const push = Math.min((SEPARATE_R - d) * 0.5, maxPush);
                const ux = dx / d, uy = dy / d;
                if (!a.dive) { a.x = clamp(a.x - ux * push, 3, 97); a.y = clamp(a.y - uy * push, 3, 97); }
                if (!b.dive) { b.x = clamp(b.x + ux * push, 3, 97); b.y = clamp(b.y + uy * push, 3, 97); }
            }
        }
    }

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
        /* Snap onto the target so a player settles exactly on it rather than
           oscillating — but never for a degenerate (zero-distance) target, which
           would teleport the player onto whatever it was already sharing a point
           with and undo the separation pass. */
        if (d < 0.06) {
            if (d > 1e-6) { p.x = tx; p.y = ty; }
            return true;
        }
        const step = Math.min(speed * dt, d);
        p.x = clamp(p.x + dx / d * step, 3, 97);
        p.y = clamp(p.y + dy / d * step, 3, 97);
        return false;
    }

    /* --- ball ---
       One moving object, four modes. `held` rides the carrier; `pass` and `shot`
       are the two flights the §7 races run against; `loose` is a dead ball
       waiting for whoever is nearest. */
    /* Plain white Lambert, and deliberately nothing more. This material used to
       carry `emissive: 0xffffff` at full intensity, which is why the ball could
       not be made to read: the lights total about 2.1× irradiance (hemisphere
       0.85 + key 0.9 + rim 0.35), so `color × irradiance` already clips at 1.0
       on every pixel the ball has. A full-strength emissive term then pushed an
       already-white surface further past white and flattened away the last of
       its shading — the ball rendered as a uniform blown-out disc, not a sphere.
       Worse, the blink was driving that emissive value: it was modulating a
       channel that was pinned at the ceiling, so it changed literally no pixel.
       With the emissive gone the ball gets its lit side and its shaded side
       back, and the blink moved to geometry and to unlit materials, which is
       where it can actually be seen. */
    const ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry(.42, 16, 14),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    /* The rim: a dark annulus in the ball's own equatorial plane, just outside
       its silhouette, so the ball keeps a hard edge whether it is crossing the
       dark turf or running straight over a white painted line — the one place a
       white ball on this board disappears completely. MeshBasic, so no light
       touches it. */
    const ballRim = new THREE.Mesh(
        new THREE.RingGeometry(.44, .62, 28),
        new THREE.MeshBasicMaterial({
            color: 0x06120b, transparent: true, opacity: .5,
            side: THREE.DoubleSide, depthWrite: false
        })
    );
    ballRim.rotation.x = -Math.PI / 2;
    ballMesh.add(ballRim);
    /* The beacon: a ring flat on the grass that swells outward from under the
       ball and fades, forever. Drawn on the deck rather than on the ball, so it
       marks the ball's position even while the ball itself is in the air mid-
       pass, and MeshBasic, so its visibility has nothing to do with how the
       pitch is lit. */
    const ballPing = new THREE.Mesh(
        new THREE.RingGeometry(.62, .86, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0,
            side: THREE.DoubleSide, depthWrite: false
        })
    );
    ballPing.rotation.x = -Math.PI / 2;
    ballPing.position.y = 0.07;
    scene.add(ballPing);
    /* The possession mark: a three-sided cone flipped apex-down, so from this
       tilted top view it reads as a flat triangle hanging over the carrier with
       its point at their head. A cone rather than a flat triangle because a flat
       one would be squashed to a sliver by the camera tilt; this one keeps its
       shape from anywhere on the board. 'YXZ' so the yaw is applied last, in
       world terms, and spinning the mark to the carrier's facing cannot tip the
       flip over — the flip and the spin are on the same object. */
    const carrierMark = new THREE.Mesh(
        new THREE.ConeGeometry(1.0, 0.85, 3),
        new THREE.MeshBasicMaterial({ color: COL.you, transparent: true, opacity: .95 })
    );
    carrierMark.rotation.order = 'YXZ';
    carrierMark.visible = false;
    scene.add(carrierMark);
    const ballShadow = makeBlobShadow(0.6);
    scene.add(ballMesh, ballShadow);
    const ball = {
        x: 50, y: 50, h: 0.42,
        mode: 'held',            // held | pass | shot | loose
        holder: null,
        from: null, dir: null, target: null,
        speed: BALL_SPEED, t: 0, total: 0, travel: 0,
        s0: BALL_SPEED, s: 0, dec: 0, roll: false,  /* §12.b rolling-ball state */
        arc: ARC_PASS, alive: false,
        passTarget: null, lastTouch: null
    };

    function launchBall(from, to, speed, opts) {
        const o = opts || {};
        const d = Math.max(1e-6, dist(from, to));
        /* Direction without leaning on unit()'s zero-length behaviour: a
           degenerate ball (to === from) goes straight up the board instead of
           becoming NaN and taking the whole pitch with it. */
        const dx = to.x - from.x, dy = to.y - from.y;
        const dl = Math.hypot(dx, dy);
        ball.from = { x: from.x, y: from.y };
        ball.dir = dl > 1e-6 ? { x: dx / dl, y: dy / dl } : { x: 0, y: 1 };
        ball.speed = speed;
        ball.roll = o.roll === true;
        ball.s0 = speed;
        ball.s = speed;
        ball.t = 0;
        ball.travel = 0;
        ball.target = { x: to.x, y: to.y };
        /* A shot is a strike and keeps its constant speed — the keeper's dive is
           modelled off that speed in shoot()/cpuKeeperDive(), so slowing shots
           here would break the save, not just the look.

           A pass is rolled, and the roll is derived backwards from the single
           requirement that is about the rules rather than the look: THE BALL HAS
           TO BE FASTER THAN A RUNNING MAN UNTIL THE MOMENT IT RESOLVES. So the
           KICK speed is fixed first — PASS_PACE·BALL_SPEED, 26.7, a shade under
           SHOT_SPEED, which is what a firmly struck pass actually is — and `dec`
           is then chosen so that the ball is still moving at PASS_SLOW of that
           kick when it reaches PASS_REACH of the aimed distance. Total time is
           the mean of the two speeds. Pass the `speed` argument in and it is
           ignored for a roll: the profile is the profile. */
        if (ball.roll) {
            const v0 = BALL_SPEED * PASS_PACE;
            const avg = v0 * (1 + PASS_SLOW) * 0.5;
            ball.s0 = ball.s = ball.speed = v0;
            ball.total = PASS_REACH * d / Math.max(1e-6, avg);
            ball.dec = v0 * (1 - PASS_SLOW) / Math.max(1e-6, ball.total);
            ball.arc = BALL_ROLL_ARC;
        } else {
            ball.total = d / Math.max(1e-6, speed);
            ball.dec = 0;
            ball.arc = o.arc === undefined ? ARC_PASS : o.arc;
        }
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
        /* .62, down from .9 — the guide lines are meant to be read, not looked
           at. On the ink board they were competing with the players for the eye
           at exactly the moment the eye needs to be on the ball. */
        const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .62 }));
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

    /* --- §8.b the stacked moves (§17.b) -------------------------------------
       A ring per queued run, plus one line for the queued ball. These show the
       human *their own* plan only: the CPU's stacked runs are deliberately not
       drawn, so the window is a decision and not a read-out of the answer. */
    const queueRings = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(() => mkRing(COL.aim, 0.55, 0.95));
    const queueLine = groundLine(COL.aim, 2);

    function hideQueueMarkers() {
        queueRings.forEach(m => { m.visible = false; });
        queueLine.visible = false;
    }

    /** Drop every stacked move. Called whenever a window opens or closes. */
    function clearIntents() {
        allPlayers.forEach(p => { p.queued = null; });
        hideQueueMarkers();
    }

    /** Draw the stack: a ring where each of the human's players will end up, and
        the line of the queued ball when the human is the side in possession. */
    function drawQueueMarkers() {
        if (SO.active || !PLAN || PLAN.armed) { hideQueueMarkers(); return; }
        let n = 0;
        allPlayers.forEach(p => {
            if (p.team !== 'you' || !p.queued || !queueRings[n]) return;
            const m = queueRings[n++];
            m.visible = true;
            m.position.set(worldX(p.queued.x), 0.09, worldZ(p.queued.y));
        });
        for (let i = n; i < queueRings.length; i++) queueRings[i].visible = false;

        const c = PLAY && PLAY.carrier;
        const move = PLAN.atk === 'you' ? (PLAN.shot.you || PLAN.pass.you) : null;
        if (c && move && move.x !== undefined) {
            /* §12.c — the preview line ends on the ball's actual destination, and
               the ball's destination is this bare point. It used to be previewed
               at the receiver's queued run while the ball itself went even
               further, to that receiver's live position: three places at once.
               One point, one line, one ball. */
            queueLine.visible = true;
            queueLine.setEnds(c, move);
        } else {
            queueLine.visible = false;
        }
    }

    /* --- base rings under every player, plus the selection highlight ---------
       Every player keeps a faint ring in their own kit colour, so the two teams
       can be counted at a glance (six mint discs vs six magenta discs) instead of
       having to read the shirts. The human's controlled players swap that for the
       bright selection amber, which is a colour neither team uses. */
    function teamRingHex(p) {
        if (p.role === 'keeper') return p.team === 'you' ? COL.gkYou : COL.gkCpu;
        return p.team === 'you' ? COL.you : COL.cpu;
    }
    function refreshRings() {
        allPlayers.forEach(p => {
            p.ring.material.color.setHex(p.controlled ? COL.aim : teamRingHex(p));
            p.ring.material.opacity = p.controlled ? (p.hasBall ? 0.95 : 0.6) : 0.3;
            p.ring.scale.setScalar(p.hasBall ? 1.1 : p.controlled ? 1 : 0.82);
        });
    }

    /* ==========================================================================
       § 9. POSSESSION + FORMATION — everything is derived from the carrier and
       the goal being attacked, so both directions read identically.
       ========================================================================== */
    let PLAY = null;

    /** The spot an attacking teammate holds — from the ball *back towards its own
        half*. `home` is therefore the attacking side's own goal, not the one it
        is attacking: lining attackers up along the direction of the attack is
        what crowded both teams into one half and left the human's half empty. */
    function attackingSpot(from, home, i) {
        const off = LANE_OFFSET[i % LANE_OFFSET.length];
        const t = LANE_DEPTH[i % LANE_DEPTH.length];
        return {
            x: clamp(lerp(from.x, home.x, t) + off * 0.55, 8, 92),
            y: clamp(lerp(from.y, home.y, t), 6, 94)
        };
    }

    /* FIVE distinct defender slots, not three. The old table was `i % 3`, so with
       five outfielders defenders 0 & 3 shared a spot and 1 & 4 shared another —
       two players were drawn exactly on top of each other, which is why a
       defending team never read as six players: you could only ever see three
       distinct outfielders plus the keeper. Every slot below differs from every
       other in BOTH depth and width, and the deepest sits at 0.68 so it stays
       clear of the keeper's line (the previous deepest slot landed on top of the
       keeper — a fourth instance of the same stacking bug). */
    const DEF_SPREAD = [-24, -12, 12, 24, 0];
    const DEF_DEPTH = [0.34, 0.52, 0.52, 0.34, 0.68];

    /** The spot a defender holds, between the ball and the goal they defend. */
    function defendingSpot(from, own, i) {
        const k = i % DEF_DEPTH.length;
        return {
            x: clamp(lerp(50, from.x, 0.55) + DEF_SPREAD[k], 8, 92),
            y: clamp(lerp(from.y, own.y, DEF_DEPTH[k]), 6, 94)
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
        /* §17.b — every possession change is the start of a new passage, and every
           passage begins with a decision window. setCarrier() is the single writer
           of state.possession, so this is the one hook the whole model needs.
           openPlan() itself refuses to open during the assemble beat, a shootout
           or a half whose clock has run out. */
        openPlan();
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
            /* The CPU is the defending side here, so hand it its own two
               ball-side defenders — it defends too. */
            cpuDefendDuties();
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
        hideQueueMarkers();
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

    /* The camera is fixed. It used to take a fresh random offset every frame
       whenever an event kicked it, which from a directly-overhead board read as
       the whole pitch trembling — besides being the exact "shake driving the
       follow target" trap the camera guidance warns about. Nothing moves the
       ground now; feedback lives in the banner, the log and the audio. This
       stays as a named no-op so the call sites still read as intent. */
    function shake(_amount) { /* deliberately does nothing */ }
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
        shoot: el('btn-shoot'),
        plan: el('plan-panel'), planState: el('plan-state'),
        planClock: el('plan-clock'), planBar: el('plan-bar'),
        done: el('btn-done'),
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
        /* §17.b — the copy depends on whether the board is frozen. While the
           window is open the human is stacking; once it closes, moves are running. */
        const planning = !!(PLAN && !PLAN.armed && state.phase === 'play');
        ui.instruction.textContent = planning
            ? (attacking
                ? 'Your ball — stack every move now: drag the carrier onto a team-mate or into space, drag your runners, then press MOVES DONE.'
                : 'Their ball — stack your moves now: drag the interceptor and the marker to close the lane, set your keeper, then press MOVES DONE.')
            : (attacking
                ? 'Decisions are running — you attack the TOP goal.'
                : 'Decisions are running — you defend the BOTTOM goal.');
    });
    bus.on('log', d => pushLog(d.text, d.cls));
    /* §17.b — the stacked-move markers are redrawn only when the stack changes */
    bus.on('plan-markers', drawQueueMarkers);
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

    /* --- §11.b THE COACHED OPENING -------------------------------------------
       The first kick-off is the only place the game stops to teach, and it
       teaches by doing: each step below is checked against what actually
       happened on the pitch, never against a button press. The old restart put
       *both* teams in the half being attacked, which left the human's own half
       empty — that is precisely why the board felt like "the wrong way round".
       §17.b — the steps are now phrased in the vocabulary of the decision
       window, because that is the first thing the player has to understand: the
       board is frozen, every drag *stacks* a move, and nothing happens until
       MOVES DONE. Step 1 completes on the release (which is beginExecution's
       pass), and steps 2–4 are the same three drags as before. */
    const TUTOR_STEPS = [
        'Board frozen — drag the carrier onto a team-mate, then press MOVES DONE.',
        'Now drag the player who will run onto the ball.',
        'Now drag the passer, so they move on after playing it.',
        'Drag a runner towards the goal to commit somebody to the attack.'
    ];

    /* Four slots for the coached opening. `dy` is measured *behind* the ball, so
       every one of these lands in the side's own half, and all four take a
       different x — six players, six separate places on the board at kick-off. */
    const RESTART_SHAPE = [
        { dx: -17, dy: 9 }, { dx: 17, dy: 9 },
        { dx: -9, dy: 23 }, { dx: 9, dy: 27 }
    ];

    /** Where the coached slots go for a restart at `pos`. All four sit behind
        the ball, between it and the goal the side is attacking *from*, so the
        human's own half is populated and both ends of the pitch are in use. */
    function tutorPlan(team, pos) {
        const back = -attackSide(team);
        const of = (dx, dy) => ({
            x: clamp(pos.x + dx, 10, 90),
            y: clamp(pos.y + back * dy, 8, 92)
        });
        return {
            striker: of(RESTART_SHAPE[0].dx, RESTART_SHAPE[0].dy),
            runner: of(RESTART_SHAPE[1].dx, RESTART_SHAPE[1].dy),
            passer: of(RESTART_SHAPE[2].dx, RESTART_SHAPE[2].dy),
            mover: of(RESTART_SHAPE[3].dx, RESTART_SHAPE[3].dy),
            goal: goalFor(team)
        };
    }

    /** Put both teams back in shape around a restart for `team` with the ball. */
    function arrangeRestart(team, pos) {
        const atk = team, def = other(atk), home = ownGoal(atk);
        const outfield = teamOutfield(atk);
        const carrier = outfield[0];
        const rng = mulberry32(hashSeed(state.seed, state.half, Math.floor(state.halfT)));
        const centred = Math.abs(pos.y - 50) < 2;

        /* ownHalf() is the shared, symmetric clamp (HALF_SLACK, see §1). Only the
           player taking the kick-off stands on the line itself; everybody else is
           unambiguously in their own half. */
        const place = (p, spot, jitter) => {
            const s = { x: spot.x, y: ownHalf(p.team, spot.y) };
            p.ax = s.x; p.ay = s.y;
            p.dest = null; p.selected = false; p.held = false;
            p.x = clamp(s.x + (jitter ? randRange(rng, -2.5, 2.5) : 0), 6, 94);
            p.y = clamp(s.y + (jitter ? randRange(rng, -2.5, 2.5) : 0), 5, 95);
            p.px = p.x; p.py = p.y;
        };

        if (centred && !state.tutorDone) {
            /* the coached kick-off: the carrier stands on the spot and the other
               four take the walkthrough's fixed slots */
            const plan = tutorPlan(atk, pos);
            place(carrier, pos, false);
            const rest = outfield.filter(p => p !== carrier);
            place(rest[0], plan.striker, false);
            place(rest[1], plan.passer, false);
            place(rest[2], plan.mover, false);
            place(rest[3], plan.runner, false);
            state.tutorTargets = { passer: null, goal: plan.goal };
            state.tutor = 1;
            state.tutorClock = 0;
        } else {
            /* Generic restart. The kicking side lines up behind the ball, in its
               own half, so neither end is ever left empty. */
            place(carrier, pos, false);
            outfield.filter(p => p !== carrier).forEach((p, i) => {
                place(p, attackingSpot(pos, home, i), true);
            });
        }

        /* the defending side fills the half between the ball and their own goal */
        teamOutfield(def).forEach((p, i) => {
            place(p, defendingSpot(pos, ownGoal(def), i), true);
        });

        [keeperOf('you'), keeperOf('cpu')].forEach(k => {
            const line = keeperHome(k.team);
            k.ax = line.x; k.ay = line.y;
            k.x = line.x; k.y = line.y; k.px = k.x; k.py = k.y;
            k.dest = null; k.held = false; k.dive = null;
        });

        /* §17.b — the phase flips to `restart` BEFORE the carrier is handed over,
           so setCarrier()'s openPlan() hook cannot fire during the assemble beat.
           The decision window is opened by update() once the shape has walked out. */
        state.phase = 'restart';
        state.phaseT = 0;
        PLAN = null;
        clearIntents();
        setCarrier(carrier);
        hideOverlays();
    }

    /* --- the walkthrough machine -------------------------------------------- */
    /** Done, for good, for this match. Step 4 or the watchdog calls it. */
    function finishTutor() {
        state.tutorTargets = null;
        state.tutor = 0;
        state.tutorDone = true;
        bus.emit('role');
    }

    /** Step 1 completes the instant the human releases a pass. */
    function tutorOnPass(from) {
        const t = state.tutorTargets;
        if (!t || state.tutor !== 1) return;
        if (from.team !== 'you' || from !== PLAY.carrier) return;
        t.passer = from;
        state.tutor = 2;
        state.tutorClock = 0;
    }

    /** Steps 2–4 are all "the human dragged somebody"; which somebody differs. */
    function tutorOnSend(player, dest) {
        const t = state.tutorTargets;
        if (!t || player.team !== 'you') return;
        if (state.tutor === 2) { state.tutor = 3; state.tutorClock = 0; return; }
        if (state.tutor === 3) {
            if (player === t.passer) { state.tutor = 4; state.tutorClock = 0; }
            return;
        }
        if (state.tutor === 4) {
            const d = dest || player;
            if (dist(d, t.goal) < SHOT_RANGE || dist(player, t.goal) < SHOT_RANGE) finishTutor();
        }
    }

    /** Runs every live frame: says the current step, and never lets it stick. */
    function tutorTick(dt) {
        const t = state.tutorTargets;
        if (!t) return;
        if (state.phase !== 'play') return;         // the shape is still walking out
        state.tutorClock += dt;
        if (state.tutorClock < TUTOR_DELAY) return;
        const step = TUTOR_STEPS[state.tutor - 1];
        if (step && ui.instruction.textContent !== step) ui.instruction.textContent = step;
        if (state.tutorClock > TUTOR_DELAY + TUTOR_STEP_MS / 1000) finishTutor();
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
        state.phase = 'play';
        /* a fresh match always opens with the coached kick-off */
        state.tutor = 0; state.tutorTargets = null; state.tutorClock = 0;
        state.tutorDone = false;
        endShootout(true);
        ui.log.innerHTML = '';
        bus.emit('score'); bus.emit('half');
        Sfx.unlock(); Sfx.whistle();
        hideOverlays();
        kickoff('you');
        log('You defend the bottom goal and attack the top one — two ' +
            formatClock(HALF_LENGTH) + ' halves.', '');
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
        /* the window belongs to live play only — drop it and its stacked moves,
           or the next match opens with a stale clock and a board full of rings */
        PLAN = null;
        clearIntents();
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

        /* --- a pass is not contestable until it has actually been played ------
           `ball.travel` is how far the ball has covered since it left the boot.
           While that is still inside CATCH_RADIUS the ball has not gone
           anywhere: it is still exactly where the passer was standing, and a
           defender standing over the passer is not reading a pass — they are
           just standing where the ball started.

           Without this guard the cut-out fired on the very first frame of every
           pass made under pressure. launchBall() puts the ball at the boot, the
           next frame advances it by speed·dt (a few tenths of a unit), and so
           the ball was still inside the control radius of the defender who was
           already standing there — an "interception" of a ball that had never
           been played. A marked player could not complete a pass at all: the
           ball bounced between the two of them on the same spot, frame after
           frame. From above, that is precisely what "the AI never passes once
           it wins the ball" looks like — the CPU wins the ball in a tussle,
           holds it, releases it, and loses it again inside a single frame,
           every single time.

           It also had the engine contradicting its own rulebook. cpuChoosePass()
           scores every option with resolvePassRace(), and that race gives a
           defender time to *move* into the lane — it has no concept of a
           defender who is already on top of the ball. So the CPU kept choosing
           the pass its own model called safe and the engine kept killing it at
           t = 0. A defender genuinely in the lane still wins the ball: the
           moment the ball has cleared the boot, the normal race applies. */
        if (ball.mode !== 'pass' || ball.travel >= CATCH_RADIUS) {
            /* outfielders of the defending side may cut any ball in flight */
            for (const p of teamOutfield(def)) {
                if (dist(p, ball) <= CATCH_RADIUS) return cutOut(p, atk);
            }
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

        /* §17.b — a pass is only *completed* if the nearest body to the ball when
           it arrives is a team-mate. Testing `passTarget` alone was fine while
           moves resolved one at a time, but with simultaneous moves a defender can
           arrive on the same frame: a pass no one claims cleanly has to be a
           genuine fifty-fifty, so the ball goes loose and the nearest player in
           each kit races for it. Whoever wins that race gets the next window. */
        let best = null, bd = Infinity;
        for (const p of allPlayers) {
            const d = dist(p, ball);
            if (d < bd) { bd = d; best = p; }
        }
        if (best && best.team === state.possession) {
            setCarrier(best);
            Sfx.good();
            return;
        }
        /* (a pass into space is resolved by the loose-ball race below) */
        /* Nobody claimed it: the ball is simply loose, and the nearest player
           in either kit wins the race for it. */
        ball.mode = 'loose';
        ball.alive = true;
    }

    function stepBall(dt) {
        if (ball.mode === 'held' && ball.holder) {
            /* §12.b — the ball rides at the carrier's boot, in front of the
               direction they are ACTUALLY travelling, and it never drives
               itself. The old version pinned it at a fixed offset towards the
               goal, so a player standing still had a ball sliding goalwards out
               of their feet and a player jogging sideways had one sliding
               through their back: the game dribbling on the player's behalf.
               Reading the carrier's own last step means the ball only moves when
               the player moves, which is what carrying is. A stationary carrier
               has no step to read, so the ball just rests ahead of their facing
               and waits to be kicked. */
            const h = ball.holder;
            const px = Number.isFinite(h.px) ? h.px : h.x;
            const py = Number.isFinite(h.py) ? h.py : h.y;
            let bx = h.x - px, by = h.y - py;
            const step = Math.hypot(bx, by);
            if (step > 1e-4) { bx /= step; by /= step; }
            else {
                /* never moved: face the goal being attacked (the carrier spawns
                   facing it) rather than produce a zero-length offset */
                const g = PLAY ? PLAY.goal : GOAL.you;
                const gl = Math.max(1e-6, Math.hypot(g.x - h.x, g.y - h.y));
                bx = (g.x - h.x) / gl; by = (g.y - h.y) / gl;
            }
            ball.x = clamp(h.x + bx * BALL_CARRY, 2, 98);
            ball.y = clamp(h.y + by * BALL_CARRY, 2, 98);
            ball.h = 0.42;
            ball.s = 0;
        } else if (ball.mode === 'pass' || ball.mode === 'shot') {
            if (!ball.alive) return;
            ball.t = Math.min(ball.total, ball.t + dt);
            if (ball.roll) {
                /* Linear friction, v(t) = v0 − dec·t, and the distance is the
                   exact integral of it, (v0 + v)·t/2. No Euler drift, so the ball
                   arrives where the passer aimed instead of a metre short, and
                   it is still moving when it gets there. */
                ball.s = Math.max(0, ball.s0 - ball.dec * ball.t);
                ball.travel = (ball.s0 + ball.s) * 0.5 * ball.t;
            } else {
                ball.s = ball.speed;
                ball.travel = ball.speed * ball.t;
            }
            ball.x = ball.from.x + ball.dir.x * ball.travel;
            ball.y = ball.from.y + ball.dir.y * ball.travel;
            const frac = ball.total > 0 ? clamp(ball.t / ball.total, 0, 1) : 1;
            ball.h = 0.42 + Math.sin(Math.PI * frac) * ball.arc;

            contestFlight();
            if (ball.t >= ball.total && ball.mode !== 'held') resolveArrival();
        } else if (ball.mode === 'loose') {
            /* §12.b — and the loose ball keeps rolling. It used to sit on the
               spot, which made a won tackle or an unclaimed pass look like the
               ball had been switched off mid-air. Now it carries the speed it
               arrived with and keeps going along the same line until friction
               kills it, which is the whole reason a loose ball is worth chasing:
               the player has to get to where the ball IS, and it is still going
               somewhere. The chase in simPlayers already reads ball.x/ball.y
               live, so nobody had to be taught about this — they simply start
               running at a moving target.

               It is set loose with the speed it was travelling at (ball.s), and
               comes to rest rather than stopping dead, so `alive` is only turned
               off once it genuinely has none left. */
            if (ball.alive) {
                /* §12.b — a loose ball is slowed by TURF, not by the pass
                   profile. It has been handled — cut out, spilled — and it should
                   trickle and die. Carrying the pass's much gentler `dec` meant a
                   cut-out ball kept rolling for another 30-odd units and straight
                   out of the passage, which is the opposite of a ball worth
                   chasing. */
                const dec = BALL_ROLL_STOP;
                const s = Math.max(0, ball.s - dec * dt);
                ball.travel += (ball.s + s) * 0.5 * dt;
                ball.s = s;
                ball.x = clamp(ball.from.x + ball.dir.x * ball.travel, 2, 98);
                ball.y = clamp(ball.from.y + ball.dir.y * ball.travel, 2, 98);
                if (s <= 0.01 && ball.travel > 0) ball.alive = false;
            }
            /* The CLOSEST player inside the control radius takes it. This used
               to be "the first player in allPlayers order", which is not the same
               thing: with two bodies on the spot — exactly the case where a
               player and a defender arrive together — the ball changed hands
               between them on alternating frames, and every handover wipes every
               player's destination (setCarrier), so neither of them could ever
               complete a step away from the pile. The ball looked welded to the
               spot.

               Nearest-wins is deterministic and frame-order independent; an exact
               tie resolves on the same fixed ordering every frame, so the ball
               cannot ping-pong. */
            let best = null, bd = Infinity;
            for (const p of allPlayers) {
                const d = dist(p, ball);
                if (d > CATCH_RADIUS) continue;
                if (d < bd - 1e-9 || (d < bd + 1e-9 && best && p.team === 'you' && best.team !== 'you')) {
                    best = p; bd = d;
                }
            }
            if (best) { setCarrier(best); return; }
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
    function moveCarrier(_dt) {
        /* The carrier does NOT walk itself towards goal. It used to, and from
           above it read as the ball dribbling away on its own — the board moving
           a player nobody had told to move, and usually in the one direction
           that made the goals feel swapped. Possession now only advances by a
           pass, by the human dragging the carrier, or by the CPU's own choice. */
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

        /* 2. the CPU holds its shape. The human's outfielders never move by
              themselves: every step they take is a step the player asked for.
              That is both what the walkthrough teaches — "then drag a player" —
              and what stops the board looking like it is playing itself.

              A defender's shape is keyed to the goal it is ACTUALLY defending —
              ownGoal(p.team) — and never to PLAY.own, which is the own goal of
              whichever side is attacking. Handing a defender the attacker's own
              goal is precisely what used to march the whole CPU team down into
              the human's half the moment the human won the ball: the reference
              point was the human's own goal, so every defender lerped towards it
              and the CPU ended up crowding the end it was supposed to be
              attacking.

              Every defending target is then clamped into the defending team's own
              half, so the CPU presses up to the halfway line and no further: it
              defends its own goal and its own post. Only the attacking branch is
              allowed to cross the line. */
        teamOutfield('cpu').forEach((p, i) => {
            if (p.dest) return;
            if (atk === 'cpu' && p === PLAY.carrier) return;

            /* --- CPU in possession: free to advance, shape along its attack --- */
            if (atk === 'cpu') {
                const s = attackingSpot(PLAY.carrier, PLAY.goal, i);
                moveToward(p, s.x, s.y, DRILL_SPEED, dt);
                return;
            }

            /* --- CPU defending: hold the half in front of its own goal --- */
            const mine = ownGoal(p.team);
            if (p.duty === 'interceptor') {
                const to = PLAY.threat || PLAY.carrier;
                const s = interceptTarget(p, PLAY.carrier, to);
                moveToward(p, s.x, ownHalf(p.team, s.y), PLAYER_SPEED * 0.9, dt);
                return;
            }
            if (p.duty === 'marker') {
                const c = PLAY.carrier;
                /* stand goal-side of the carrier, where "goal" means the one
                   being defended — so the marker drops off towards its own end
                   rather than being pulled towards the human's */
                const s = {
                    x: clamp(c.x - (mine.x - c.x) * 0.12, 6, 94),
                    y: clamp(lerp(c.y, mine.y, 0.12), 6, 94)
                };
                moveToward(p, s.x, ownHalf(p.team, s.y), PLAYER_SPEED * 0.88, dt);
                return;
            }
            const s = defendingSpot(PLAY.carrier, mine, i);
            moveToward(p, s.x, ownHalf(p.team, s.y), DRILL_SPEED, dt);
        });

        moveCarrier(dt);

        /* 3. a loose ball is a race for the nearest player in each kit. The
              chaser is clamped to its own half while it is the defending side,
              so a ball spilling back towards the human's end cannot drag a CPU
              player over the line with it: the CPU contests the ball in front of
              its own goal and leaves the human's half alone. */
        if (ball.mode === 'loose') {
            ['you', 'cpu'].forEach(team => {
                const near = allPlayers
                    .filter(p => p.team === team)
                    .sort((a, b) => dist(a, ball) - dist(b, ball))[0];
                if (!near || near.dest) return;
                const chaseY = team === def ? ownHalf(team, ball.y) : ball.y;
                moveToward(near, ball.x, chaseY, PLAYER_SPEED, dt);
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

    /**
     * The same thing for the mirror case, and the second half of "they should
     * defend their post". cpuAssignDuties() only ever ran out of cpuThink(),
     * which returns immediately unless the CPU is holding the ball — so the
     * instant the human won possession every CPU outfielder was stripped of its
     * duty and the whole team just posed in a shape with nobody actually
     * defending it. Now, while the human attacks, the CPU's two closest
     * outfielders press and mark, and those targets are clamped to the CPU's own
     * half in simPlayers(), so it defends its own goal without ever walking into
     * the human's.
     */
    function cpuDefendDuties() {
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
    function cpuChoosePass(rng, spots) {
        const from = { x: PLAY.carrier.x, y: PLAY.carrier.y };
        const cands = teamOutfield('cpu').filter(p => p !== PLAY.carrier);
        /* The defending keeper is a defender too — it is the one body that can
           take a pass out of the air for free inside its own reach. Guarded,
           because this is on the hot path of a live frame: an undefined keeper
           here would throw out of cpuThink(), and frame() re-arms itself at the
           *top* of the callback, so the throw would skip simPlayers(), stepBall()
           and the render — the match would appear to lock up the instant the CPU
           tried to pass. */
        const gk = keeperOf('you');
        const defenders = defenderInputs('you').concat(gk ? [{ x: gk.x, y: gk.y, speed: PLAYER_SPEED }] : []);
        const scored = cands.map(m => {
            /* Score the race to the SPOT the mate is being sent to whenever the
               planner knows it, because that is where the ball is actually going
               and therefore the race that will really be run. Falls back to his
               current feet for the safety-net pass in cpuThink(), which has no
               plan to read. */
            const s = spots ? spots.get(m) : null;
            const to = s ? { x: s.x, y: s.y } : { x: m.x, y: m.y };
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
        /* §17.b — the CPU's choices are made inside the decision window now
           (planForCpu) and fired by beginExecution(). This is only a safety net
           for a possession that somehow arrived without a window: it must never
           fire a second, unplanned pass on top of a queued one. */
        if (!PLAN || PLAN.armed) return;
        if (ball.mode !== 'held' || ball.holder !== PLAY.carrier) return;
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
        /* §12.b/c — every pass is a rolled ball. It leaves the boot firm, flat on
           the deck, and keeps more than a running pace the whole way, so it beats
           the receiver to the spot and arrives as something he steps onto rather
           than something he overtakes. The CPU's pass, the human's pass and
           autoPass() all come through here, so there is exactly one kind of pass
           in the game.

           `to` is a POINT, always — the spot on the turf that was drawn. The
           ball is never played to a player's live position. */
        launchBall({ x: from.x, y: from.y }, { x: to.x, y: to.y },
            speed || BALL_SPEED,
            { mode: 'pass', passTarget: to.team ? to : null, arc: ARC_PASS, roll: true });
        /* only a real body can be the receiver; a pass into space has none */
        if (PLAY && to.team) PLAY.receiver = to;
        tutorOnPass(from);
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
    /* Who defends this kick, and which body does it with. Every phase asks the
       same question — the keeper standing on the line belongs to the *defending*
       side, which is the opponent's whenever the human is the shooter. Deriving
       it in one place is what keeps the human out of the opponent's goalkeeper. */
    const soDefTeam = () => other(SO.turn);
    const soDefKeeper = () => keeperOf(soDefTeam());
    /* §10 timings. Every one of them is a countdown to zero, because soUpdate
       opens with `SO.t -= dt`. */
    const SO_FLIGHT = 0.55;        // ball in flight
    const SO_KICK_BEAT = 0.75;     // the keeper sets off before the strike
    const SO_DIVE_WINDOW = 4.5;    // the human's time to draw a dive
    const SO_RESULT_PAUSE = 1.2;   // the banner, before the next kicker
    const SO_AIM_WINDOW = 10;      // the human's time to draw the aim
    const SO_CPU_BEAT = 1.0;       // the CPU's routine before it strikes

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
        /* §17.b — penalties are their own machine: no decision window survives it */
        PLAN = null;
        clearIntents();
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
        /* Only the human's own bodies ever carry the "controlled" ring: the
           kicker on your own kick, your keeper on the CPU's. The ring is a
           promise that a drag will move that player, so painting it on the
           opposing goalkeeper while you are the shooter reads as if you are
           holding their keeper. */
        if (kicker) { kicker.controlled = turn === 'you'; setPlayerPos(kicker, spot.x, spot.y); }
        if (k) { k.controlled = defTeam === 'you'; setPlayerPos(k, 50, keeperY); }
        ball.mode = 'held'; ball.holder = kicker; ball.alive = false;
        if (kicker) { ball.x = spot.x; ball.y = spot.y; ball.h = 0.42; }

        bus.emit('role');
        soHudState();
        /* Every phase runs on the same countdown, so the kick gets one too. The
           human's aim phase used to be started with no clock at all (SO.t was
           left at 0 and only the CPU's branch tested the timeout), which meant a
           tap that never became a drag had nothing to expire it: the shootout
           stopped on the first kick and never resumed. */
        SO.t = turn === 'cpu' ? SO_CPU_BEAT : SO_AIM_WINDOW;
        if (turn === 'cpu') log('CPU steps up…', '');
        else log('Your kick — drag from the spot and release.', '');
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
        /* Guarded on the phase as well as the aim: committing twice would re-roll
           the keeper's read, and a stray release from the gesture that started
           the kick could reach here while the dive is already playing. */
        if (!SO.aim || SO.phase !== 'aim') return;
        const goal = soGoal();
        const off = !isOnTarget(SO.aim.x, goal.x, GOAL_HALF_WIDTH);
        if (off) {
            /* §10 — off target is an automatic miss, keeper or no keeper */
            SO.result = { outcome: 'MISS', dist: Infinity, onTarget: false };
        }
        SO.phase = 'dive';
        SO.t = 0;
        const k = soDefKeeper();
        if (soDefTeam() === 'cpu') {
            /* the CPU's keeper reads the kick with probability = difficulty,
               and carries a committed dive to the wrong side when it does not */
            const read = Math.random() < 0.22 + 0.78 * state.difficulty;
            const side = Math.random() < 0.5 ? -1 : 1;
            const target = read
                ? { x: SO.aim.x, y: k.y }
                : { x: clamp(SO.aim.x + side * (GOAL_HALF_WIDTH * 1.35), 4, 96), y: k.y };
            if (k) k.dive = target;
            SO.dive = target;
            /* a beat for the keeper to set off, then the strike itself */
            SO.t = off ? SO_KICK_BEAT * 0.6 : SO_KICK_BEAT;
            setPenaltyView(true);
        } else {
            log(off ? 'Off target — the keeper dives anyway.' : 'Draw your dive — anywhere along the line.', '');
            SO.t = SO_DIVE_WINDOW;   // no dive? default to the shot's side
        }
    }

    function soCommitDive(point) {
        if (SO.phase !== 'dive') return;
        SO.dive = point;
        const k = soDefKeeper();
        if (k) k.dive = point;
        soStrike();
    }

    /** The kick itself: the ball travels to the goal, and only then is the
        outcome read. Resolving the moment the dive was drawn skipped the flight
        entirely — the ball sat on the spot while the banner appeared. */
    function soStrike() {
        if (SO.phase !== 'dive') return;
        SO.phase = 'flight';
        SO.t = SO_FLIGHT;                 // a countdown, like every other phase
        SO.from = { x: ball.x, y: ball.y };
        SO.to = { x: SO.aim ? SO.aim.x : soGoal().x, y: soGoal().y };
        SO.after = () => soResolve();
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
        SO.t = SO_RESULT_PAUSE;           // a beat to read the banner, then on

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
        if (SO.phase === 'aim' && SO.t <= 0) {
            if (SO.turn === 'cpu') {
                const rng = mulberry32(hashSeed(state.seed, 7, SO.takenYou + SO.takenCpu));
                const spread = GOAL_HALF_WIDTH * (0.55 + 0.5 * state.difficulty);
                /* miss the target occasionally, more often on the lower settings */
                const wild = rng() < 0.18 * (1 - state.difficulty);
                const aim = wild
                    ? clamp(soGoal().x + (rng() < .5 ? -1 : 1) * (GOAL_HALF_WIDTH + randRange(rng, 1, 9)), 2, 98)
                    : clamp(soGoal().x + randRange(rng, -spread, spread), 2, 98);
                soSetAim({ x: aim, y: soGoal().y });
                soCommitAim();
            } else {
                /* §7 — no aim given: take the percentage ball, straight down the
                   middle, and let the keeper's read decide it. */
                soSetAim({ x: soGoal().x, y: soGoal().y });
                soCommitAim();
            }
        } else if (SO.phase === 'dive') {
            if (SO.t <= 0) {
                const k = soDefKeeper();
                if (k && k.dive) {
                    /* The keeper is already committed — the CPU's own read, or the
                       dive the human just drew. Strike without touching it: the
                       old fallback re-derived the dive here, which handed the CPU
                       keeper a second, better guess on every kick the human took
                       and quietly turned an honest read into a free save. */
                    soStrike();
                } else {
                    /* §7 — no input means the default dive, to the shot's side */
                    soCommitDive(k ? defaultDiveTarget(k, SO.aim, KEEPER_REACH)
                        : { x: SO.aim.x, y: soGoal().y });
                }
            }
        } else if (SO.phase === 'flight') {
            const f = clamp(1 - SO.t / SO_FLIGHT, 0, 1);
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
            if (SO.t <= 0) soNext();
        }
        /* the keeper's dive always plays out */
        const k = soDefKeeper();
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
            if (d > r) return;
            /* Never let an opponent standing on top of one of your players
               swallow the gesture: while the human is on the ball, a tap on a
               stack resolves to the human's player, not to the defender pressed
               against them (the CPU player is not draggable, so picking it makes
               the touch look dead). */
            const own = p.team === 'you';
            const bestOwn = best && best.team === 'you';
            if (bestOwn && !own) return;
            if (d < bd || (!bestOwn && own)) { bd = d; best = p; }
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
        /* §17.b — a gesture only means anything while the decision window is open.
           Everything it can do now *stacks* a move instead of making one, so the
           board stays frozen until both sides have finished deciding. */
        if (state.phase !== 'play' || !PLAN || PLAN.armed) { drag.kind = null; return; }

        const p = pickPlayer(pt);
        if (humanAttacking() && p === PLAY.carrier) {
            drag.kind = 'aim'; drag.player = p;
        } else if (p && p.team === 'you' && p.role === 'keeper') {
            /* the human's keeper: a pre-dive, or a dive during a shot */
            drag.kind = 'keeper'; drag.player = p;
        } else if (p && p.team === 'you') {
            drag.kind = 'move'; drag.player = p; p.selected = true;
        } else if (humanAttacking() && !p) {
            /* a bare tap on the turf nobody is standing on. There is no gesture
               left that this can mean while stacking except the goal, so it
               reaches for the goal — out of range it stays silent. */
            drag.kind = 'tap-shot';
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
            /* §12.c — the line IS the ball's destination. It used to snap its end
               onto whichever teammate the drag pointed at, so the shot you drew
               and the pass you got were two different things: the line finished
               on the player while the ball was led to that player's run. Now the
               drag draws a point on the turf and the ball goes to that point. The
               marker still lights up to say a teammate is in the lane, but the
               line never leaves your finger. */
            const tgt = aimPoint(drag.x0, drag.y0, drag.x, drag.y);
            const mate = mateInDirection(drag.x0, drag.y0, drag.x, drag.y);
            aimLine.visible = true;
            aimLine.material.color.setHex(mate ? COL.aim : COL.ghost);
            aimLine.material.opacity = mate ? .85 : .3;
            aimLine.setEnds({ x: drag.x0, y: drag.y0 }, tgt);
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
            aimLine.material.opacity = .85;
            aimLine.setEnds(soSpot(), t);
            shotLine.visible = true;
            shotLine.setEnds(soSpot(), t);
        } else if (drag.kind === 'so-dive' && drag.moved > TAP_SLOP * 0.5) {
            /* The dive belongs to the keeper on the line — the defending side's,
               which is *your* keeper exactly because the shootout only opens this
               gesture when the CPU is the kicker. Taken from soDefKeeper() rather
               than hard-coded to 'you' so the two can never drift apart. */
            const k = soDefKeeper();
            if (k) {
                const t = { x: clamp(pt.x, 4, 96), y: k.y };
                diveLine.visible = true;
                diveLine.setEnds(k, t);
                diveMarker.visible = true;
                diveMarker.position.set(worldX(t.x), 0.09, worldZ(t.y));
            }
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

    /** §5/§17.b — a double-tap on the goal mouth, inside range, stacks a shot. */
    function tryShootAt() {
        if (!humanAttacking()) return false;
        const c = PLAY.carrier;
        if (!c) return false;
        if (dist(c, PLAY.goal) > SHOT_RANGE) {
            log('Shooting only works inside ' + SHOT_RANGE + ' units of the goal.', '');
            return false;
        }
        return queueShot();
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
                /* §12.c — the ball goes to the POINT that was drawn, full stop.
                   This line used to read `mate || aimPoint(...)`: the moment the
                   drag pointed anywhere near a teammate the drawn point was
                   thrown away and the teammate OBJECT was queued instead, and
                   beginExecution() then resolved the ball to wherever that player
                   had run to. The line ended on the man, the ball went somewhere
                   else, and the two never agreed. A mate in the lane is now only
                   a hint that lights the line up — it does not retarget it. */
                const target = aimPoint(drag.x0, drag.y0, pt.x, pt.y);
                const mate = mateInDirection(drag.x0, drag.y0, pt.x, pt.y);
                if (queuePass(target) && !mate) log('Queued: played into space.', '');
            } else {
                /* a tap on the carrier: is this the second half of a double-tap? */
                const now = performance.now();
                const near = Math.hypot(pt.x - lastTap.x, pt.y - lastTap.y) < 9;
                if (now - lastTap.t < DOUBLE_TAP_MS && near) {
                    /* §17.b — stacks the shot; the ball leaves the boot on execute */
                    tryShootAt();
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
                /* §17.b — a run is *stacked*, never started: the ring appears where
                   this player will end up, and the step itself waits for the
                   window to close so it fires alongside everybody else's. */
                setIntent(player, dest);
                log(player.label + ' set to run.', '');
                tutorOnSend(player, dest);
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
        } else if (kind === 'tap-shot') {
            const c = PLAY && PLAY.carrier;
            if (c && moved <= TAP_SLOP && dist(c, PLAY.goal) <= SHOT_RANGE) tryShootAt();
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
            const k = soDefKeeper();
            if (k && moved > TAP_SLOP * 0.5) {
                soCommitDive({ x: clamp(pt.x, 4, 96), y: k.y });
            }
        }
        refreshRings();
    }

    function updateCursor() {
        /* In the shootout only the two human gestures are "active": drawing your
           own kick, and drawing your keeper's dive against the CPU's. While the
           opponent's keeper is setting off there is nothing to drag, so the
           crosshair would be a promise the input cannot keep. */
        const active = SO.active
            ? (SO.phase === 'aim' && SO.turn === 'you') || (SO.phase === 'dive' && SO.turn === 'cpu')
            : !!(state.phase === 'play' && PLAN && !PLAN.armed);
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
        if (e.key === 's' || e.key === 'S') shootFromButton();
        /* §17.b — Space is the PC shoot key, and Enter closes the decision window
           the same way the MOVES DONE button does. */
        if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); shootFromButton(); }
        if (e.key === 'Enter') { e.preventDefault(); humanDone(); }
    });

    /* ==========================================================================
       § 17.b SIMULTANEOUS PLANNING — the decision window.
       The match now runs in two beats. A *decision window* opens the moment a
       side wins the ball; for PLAN_WINDOW seconds the board is frozen and the
       match clock stops for both sides, while each side stacks up every move it
       means to make — a pass, a run for each player, a keeper dive, a shot.
       Nothing resolves one at a time. The window closes when the human presses
       MOVES DONE (or when it expires), and both sides' stacked moves fire
       together. A side that says nothing auto-plays, so the match never stalls.
       ========================================================================== */
    const PLAN_WINDOW = 10;       // seconds each side has to set every move
    const PLAN_CPU_BEAT = 0.9;    // the CPU quietly "clicks Done" about here

    let PLAN = null;

    function newPlan() {
        return {
            atk: state.possession, def: other(state.possession),
            t: PLAN_WINDOW, cpuT: 0, cpuPlanned: false, armed: false,
            pass: { you: null, cpu: null },
            shot: { you: null, cpu: null }
        };
    }

    /** Open a fresh decision window for whoever just won the ball. */
    function openPlan() {
        /* A plan only belongs to live, undecided play: never during the assemble
           beat, a shootout, or a half whose clock has already run out. */
        if (state.phase !== 'play' || SO.active || state.pendingHalf) {
            PLAN = null;
            clearIntents();
            return;
        }
        PLAN = newPlan();
        clearIntents();
        /* A dive lives for exactly one execution, so both keepers start clean —
           this is what keeps a queued dive from leaking into the next window. */
        [keeperOf('you'), keeperOf('cpu')].forEach(k => { if (k) { k.dive = null; k.held = false; } });
        bus.emit('role');
        bus.emit('plan-markers');
    }

    /** Stack a run. Nothing moves until the window closes. */
    function setIntent(p, dest) {
        if (!p || !dest) return;
        p.queued = { x: clamp(dest.x, 5, 95), y: clamp(dest.y, 5, 95) };
        bus.emit('plan-markers');
    }

    /** Stack the pass. `to` is always a POINT on the turf — the spot the drag
        drew — and that is where the ball will go, whatever the intended
        receiver does next. Aim ahead of a runner to lead him; aim at his feet
        to hit him. The nearest body at arrival decides who really gets it. */
    function queuePass(to) {
        if (!PLAN || PLAN.armed || !to) return false;
        const team = state.possession;
        /* copied to a fresh bare point on purpose: storing the player object here
           is what used to let the ball be led to that player's live position
           instead of travelling to the point that was drawn */
        PLAN.pass[team] = { x: to.x, y: to.y };
        PLAN.shot[team] = null;
        /* the carrier is told to stay put, so a queued pass is a pass and not
           also a sprint — the ball leaves his boot, not his boot and his legs */
        const c = PLAY && PLAY.carrier;
        if (c) setIntent(c, { x: c.x, y: c.y });
        if (team === 'you') log('Queued: pass to ' + (to.label || 'space') + '.', '');
        return true;
    }

    /** Stack a shot. The button, Space and S, and the double-tap all land here. */
    function queueShot() {
        if (!PLAN || PLAN.armed || !PLAY || PLAY.atk !== 'you') return false;
        const c = PLAY.carrier;
        if (!c) return false;
        if (ball.mode !== 'held' || ball.holder !== c) return false;
        if (dist(c, PLAY.goal) > SHOT_RANGE) {
            log('Shooting only works inside ' + SHOT_RANGE + ' units of the goal.', '');
            return false;
        }
        PLAN.shot.you = { x: clamp(PLAY.goal.x, 0, 100), y: PLAY.goal.y };
        PLAN.pass.you = null;
        setIntent(c, { x: c.x, y: c.y });
        log('Queued: shot at goal.', '');
        return true;
    }

    /** The CPU's half of the window: read the board once, then stack its moves. */
    function planForCpu() {
        if (!PLAN || PLAN.cpuPlanned) return;
        PLAN.cpuPlanned = true;
        const rng = mulberry32(hashSeed(state.seed, state.half, Math.floor(state.halfT * 60) + 7));

        /* --- the CPU is the side in possession: choose the ball's destination --- */
        if (state.possession === 'cpu') {
            cpuAssignDuties();
            PLAY.threat = cpuThreat();
            const c = PLAY.carrier;
            const mates = teamOutfield('cpu').filter(m => m !== c);
            /* §12.c — settle WHERE everybody is going FIRST, then aim the ball at
               that spot. The pass is struck from the carrier's feet and the
               receiver breaks at the same instant, so a ball aimed at his boots
               is aimed at a place he is leaving: it lands at his marker's feet and
               the only thing waiting at the end of it is a defender running the
               other way. Leading the receiver here is not a nicety, it is the
               difference between a pass and a turnover. */
            const spots = new Map();
            mates.forEach((m, i) => spots.set(m, attackingSpot(c, PLAY.goal, i)));

            if (dist(c, PLAY.goal) <= SHOT_RANGE && rng() < 0.25 + 0.5 * state.difficulty) {
                PLAN.shot.cpu = {
                    x: clamp(PLAY.goal.x + randRange(rng, -GOAL_HALF_WIDTH * 0.85, GOAL_HALF_WIDTH * 0.85), 0, 100),
                    y: PLAY.goal.y
                };
            } else {
                /* §12.c — the ball is aimed at the chosen receiver's DESTINATION,
                   never at the receiver himself. Handing the plan the live player
                   object is what let the ball follow him; and because the carrier
                   was then also given that same object as a run, it is what made
                   the CPU look like it was dribbling the length of the pitch
                   single-handed. */
                const target = cpuChoosePass(rng, spots);
                const s = target ? spots.get(target) : null;
                PLAN.pass.cpu = s
                    ? { x: s.x, y: s.y }
                    : { x: PLAY.goal.x, y: PLAY.goal.y };
            }
            mates.forEach(m => setIntent(m, spots.get(m)));
            /* the carrier is told to stand exactly where he is: he holds the
               ball, he does not carry it upfield on his own */
            setIntent(c, { x: c.x, y: c.y });
            return;
        }

        /* --- the CPU is defending: hold the half in front of its own goal and
               press the carrier. Both keepers are deliberately left alone: shoot()
               reads the real flight at execution time, which is a better keeper
               than any guess made from here would be. --- */
        cpuDefendDuties();
        PLAY.threat = cpuThreat();
        const mine = ownGoal('cpu');
        teamOutfield('cpu').forEach((p, i) => {
            if (p.duty === 'interceptor') {
                const to = PLAY.threat || PLAY.carrier;
                const s = interceptTarget(p, PLAY.carrier, to);
                setIntent(p, { x: s.x, y: ownHalf('cpu', s.y) });
            } else if (p.duty === 'marker') {
                const c = PLAY.carrier;
                setIntent(p, {
                    x: clamp(c.x - (mine.x - c.x) * 0.12, 6, 94),
                    y: ownHalf('cpu', clamp(lerp(c.y, mine.y, 0.12), 6, 94))
                });
            } else {
                const s = defendingSpot(PLAY.carrier, mine, i);
                setIntent(p, { x: s.x, y: ownHalf('cpu', s.y) });
            }
        });
    }

    /** Called every frame the window is open. */
    function planUpdate(dt) {
        if (!PLAN || PLAN.armed) return;
        if (!PLAN.cpuPlanned) {
            PLAN.cpuT += dt;
            if (PLAN.cpuT >= PLAN_CPU_BEAT) planForCpu();
        }
        PLAN.t -= dt;
        if (PLAN.t <= 0) {
            PLAN.t = 0;
            if (!PLAN.cpuPlanned) planForCpu();
            aiPlanForHuman();
            beginExecution();
        }
    }

    /** MOVES DONE — the human's half of the window is closed and the board runs. */
    function humanDone() {
        if (!PLAN || PLAN.armed) return;
        /* the CPU has to be ready too, and then a silent human side gets its own
           automatic plan — done in that order, so the auto-plan can read where
           the CPU's ball is going before it reacts to it */
        if (!PLAN.cpuPlanned) planForCpu();
        aiPlanForHuman();
        beginExecution();
    }

    /** "If the player makes no move, their player will pass the ball randomly."
        A real pass to somebody, chosen without any help from the geometry. */
    function autoPass() {
        if (!PLAY || !PLAY.carrier) return;
        const c = PLAY.carrier;
        const mates = teamOutfield(c.team).filter(m => m !== c);
        const rng = mulberry32(hashSeed(state.seed, state.half, Math.floor(state.halfT * 60) + 31));
        const options = mates.concat([{
            x: clamp(c.x + (rng() - 0.5) * 44, 8, 92),
            y: clamp(c.y + attackSide(c.team) * (12 + rng() * 26), 8, 92)
        }]);
        const pick = options[Math.floor(rng() * options.length)];
        if (pick) passTo(c, pick, BALL_SPEED);
    }

    /** True when the human has said nothing at all this window — no pass, no
        shot, no run. That is the case the "no instruction" rule covers. */
    function humanPlanEmpty() {
        if (!PLAN) return false;
        if (PLAN.pass.you || PLAN.shot.you) return false;
        return !allPlayers.some(p => p.team === 'you' && p.queued);
    }

    /** The human's side, left to itself, still has to play football — standing
        still is not an option, because the other side is about to move. It is
        shaped like the CPU's own plan so both teams look like the same sport:
        attacking, the ball goes somewhere random (autoPass's job the moment the
        window closes) while the rest of the team makes attacking runs; defending,
        one body goes for the ball, one sits on the carrier, the rest hold a shape
        in front of goal. It only ever fires on a side that said nothing, so
        anything the human actually stacked always wins. */
    function aiPlanForHuman() {
        if (!PLAN || PLAN.armed || !humanPlanEmpty()) return;
        const c = PLAY && PLAY.carrier;

        if (state.possession === 'you') {
            if (c) {
                teamOutfield('you').filter(m => m !== c).forEach((m, i) => {
                    setIntent(m, attackingSpot(c, PLAY.goal, i));
                });
            }
            return;
        }

        /* Defending. Both keepers are left out on purpose: shoot() reads the real
           flight when the ball is actually struck, which beats guessing from here. */
        const mine = ownGoal('you');
        const bound = c ? (c.queued || c) : { x: 50, y: 50 };
        teamOutfield('you').forEach((p, i) => {
            if (c && i === 0) {
                const s = interceptTarget(p, c, bound);
                setIntent(p, { x: s.x, y: ownHalf('you', s.y) });
            } else if (c && i === 1) {
                setIntent(p, {
                    x: clamp(c.x - (mine.x - c.x) * 0.12, 6, 94),
                    y: ownHalf('you', clamp(lerp(c.y, mine.y, 0.12), 6, 94))
                });
            } else {
                const s = defendingSpot(c || bound, mine, i);
                setIntent(p, { x: s.x, y: ownHalf('you', s.y) });
            }
        });
    }

    /** Both sides are ready: every stacked move fires together. */
    function beginExecution() {
        if (!PLAN) return;
        const plan = PLAN;
        plan.armed = true;
        hideQueueMarkers();
        /* runs are handed from the plan to the body all in one pass, so no side
           gets a head start on the other */
        /* Read the carrier once, and guard it. This loop is on the live frame
           path: a throw here would skip simPlayers(), stepBall() and the render
           for good, because frame() re-arms itself at the top of its callback. */
        const carrier = PLAY ? PLAY.carrier : null;
        allPlayers.forEach(p => {
            /* §12.c — THE CARRIER NEVER RUNS. Possession only advances by a pass
               or a shot, so giving the man on the ball a destination is exactly
               what produced a solo run the length of the pitch. Enforced here as
               well as in the two planners, because this is the last stop before a
               body actually moves and one forgotten call must not be enough to
               bring dribbling back. */
            if (p.queued && p !== carrier) { p.dest = p.queued; p.speed = PLAYER_SPEED; }
            p.queued = null;
        });
        const c = carrier;
        if (c) {
            const shot = plan.shot[plan.atk];
            const pass = plan.pass[plan.atk];
            if (shot && dist(c, PLAY.goal) <= SHOT_RANGE) {
                shoot(c, shot);
            } else if (pass && pass.x !== undefined) {
                /* §12.c — the ball is played to the POINT that was drawn and to
                   nothing else. This used to resolve to `pass.queued` — the
                   intended receiver's planned run — so the ball silently left
                   the drawn line and chased the man. Read the bare point. */
                passTo(c, { x: pass.x, y: pass.y }, BALL_SPEED);
            } else {
                autoPass();
            }
        }
        bus.emit('role');
    }

    /* ==========================================================================
       § 18. UPDATE + RENDER
       ========================================================================== */
    function update(dt) {
        if (state.phase === 'restart') {
            state.phaseT += dt;
            /* walk into shape at a jog, and leave anyone the human has already
               sent somewhere alone */
            allPlayers.forEach(p => { if (!p.dest) moveToward(p, p.ax, p.ay, ASSEMBLE_SPEED, dt); });
            stepBall(dt);
            if (state.phaseT >= SETUP_TIME) {
                state.phase = 'play';
                state.phaseT = 0;
                /* §17.b — the restart is the first planning window of the passage */
                openPlan();
            }
        } else if (state.phase === 'play') {
            /* §17.b — while a decision window is open the board is frozen: the
               match clock stops for BOTH sides, nobody takes a step, and the only
               thing that moves is the planning countdown. */
            const planning = !!(PLAN && !PLAN.armed);
            if (!planning) {
                if (state.pendingHalf) {
                    /* §3 — the whistle waits for the ball to become dead */
                    if (ball.mode === 'held' || ball.mode === 'loose') endHalf();
                } else {
                    state.halfT += dt;
                    if (state.halfT >= HALF_LENGTH) {
                        state.halfT = HALF_LENGTH;
                        state.pendingHalf = true;
                    }
                }
            }
            if (PLAY) {
                if (planning) planUpdate(dt);
                else { cpuThink(dt); simPlayers(dt); }
            }
            stepBall(dt);
        } else if (state.phase === 'shootout') {
            soUpdate(dt);
            ballMesh.position.set(worldX(ball.x), ball.h, worldZ(ball.y));
            ballShadow.position.set(worldX(ball.x), 0.04, worldZ(ball.y));
        }

        /* No two bodies may occupy the same point — resolve any overlap once per
           frame, after everyone has moved and before they are drawn. Skipped in
           the shootout, whose kicker and keeper are placed deliberately and must
           not be nudged off their marks. */
        if (!SO.active) separatePlayers(dt);

        allPlayers.forEach(p => { animatePlayer(p, dt); syncToMesh(p); });
        updateCursor();
        updateOverlayVisibility();
        tutorTick(dt);
    }

    /** Keep the guides honest without redrawing them every frame. */
    function updateOverlayVisibility() {
        if (SO.active) {
            [...allPlayers].forEach(p => refreshRings());
            return;
        }
        if (!PLAY) return;
        /* §17.b — the human's keeper dive line lives in two places now: while the
           decision window is open it shows the dive that has been *stacked*, and
           it still shows the live dive once a shot is in flight. */
        if (drag.kind) return;
        const planning = !!(PLAN && !PLAN.armed);
        const liveShot = ball.mode === 'shot' && PLAY.def === 'cpu';
        const k = (planning || liveShot) ? keeperOf('you') : null;
        if (k && k.dive) {
            diveLine.visible = true;
            diveLine.setEnds(k, k.dive);
            diveMarker.visible = true;
            diveMarker.position.set(worldX(k.dive.x), 0.09, worldZ(k.dive.y));
        } else {
            diveLine.visible = false;
            diveMarker.visible = false;
        }
    }

    /* --- the shoot button ---------------------------------------------------
       §17.b — the button no longer fires a shot, it *stacks* one. It is enabled
       exactly when a shot is legal and still unclaimed: the human is attacking,
       the ball is at their feet inside SHOT_RANGE, and the decision window is
       open. The ball actually leaves the boot when both sides execute. */
    let lastShootOn = null;
    function canShootNow() {
        if (SO.active || state.paused) return false;
        if (state.phase !== 'play' || !PLAN || PLAN.armed) return false;
        if (PLAN.shot.you) return false;
        if (!topScreen() && PLAY && PLAY.atk === 'you' && PLAY.carrier) {
            return ball.mode === 'held' && ball.holder === PLAY.carrier
                && dist(PLAY.carrier, PLAY.goal) <= SHOT_RANGE;
        }
        return false;
    }

    function refreshShootButton() {
        if (!ui.shoot) return;
        const on = canShootNow();
        if (on === lastShootOn) return;
        lastShootOn = on;
        ui.shoot.disabled = !on;
        ui.shoot.classList.toggle('ready', on);
    }

    /** §5 — the button stacks a straight shot at the middle of the goal the
        human attacks, the same call the double-tap makes. Space and S do too. */
    function shootFromButton() {
        if (!canShootNow()) return;
        queueShot();
        refreshShootButton();
    }

    /* --- the plan panel -----------------------------------------------------
       The countdown and the MOVES DONE button sit in the bottom dock beside the
       log. Like the match clock this is change-guarded: nothing is written to
       the DOM unless the tenth-of-a-second bucket actually moved. */
    let lastPlanSec = -1, lastPlanBar = -1, lastPlanState = '', lastPlanShow = null;
    function refreshPlanHud() {
        if (!ui.plan || !ui.planClock) return;
        const show = !!(PLAN && !PLAN.armed && state.phase === 'play' && !SO.active);
        if (lastPlanShow !== show) {
            lastPlanShow = show;
            ui.plan.hidden = !show;
            if (ui.done) ui.done.hidden = !show;
        }
        if (ui.done) ui.done.disabled = !show;
        if (!show) { lastPlanSec = -1; lastPlanBar = -1; lastPlanState = ''; return; }

        const secs = Math.max(0, Math.ceil(PLAN.t - 1e-6));
        if (secs !== lastPlanSec) {
            lastPlanSec = secs;
            ui.planClock.textContent = String(secs);
            ui.plan.classList.toggle('low', secs <= 3);
        }
        const k = clamp(PLAN.t / PLAN_WINDOW, 0, 1);
        if (Math.abs(k - lastPlanBar) > 0.004) {
            lastPlanBar = k;
            ui.planBar.style.transform = 'scaleX(' + k.toFixed(3) + ')';
        }
        const label = PLAN.cpuPlanned ? 'CPU READY · YOUR MOVE' : 'PLANNING';
        if (label !== lastPlanState) {
            lastPlanState = label;
            ui.planState.textContent = label;
        }
    }

    function updateHud() {
        refreshShootButton();
        refreshPlanHud();
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
    /* A mobile URL bar sliding in and out fires resize several times a second,
       and each one rebuilt the projection. Only act when the box changed. */
    const viewBox = { w: 0, h: 0 };
    function resizeIfChanged() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w === viewBox.w && h === viewBox.h) return;
        viewBox.w = w; viewBox.h = h;
        fitView();
    }
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeIfChanged);

    /** Where the camera sits this frame. Fixed: the ground never moves. */
    function placeCamera() {
        const pz = worldZ(view.panY);
        camera.position.set(0, 130 * Math.cos(TILT), pz + 130 * Math.sin(TILT));
        camera.rotation.z = 0;
        camera.lookAt(0, 0, pz);
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
    /* §12.b — the ball has to be findable. It is a 0.42-unit sphere on a board
       100 units wide, and the one thing every eye is tracking, so it is the one
       thing allowed to move on its own between two frames. Driven off wall time
       rather than update(), so it keeps beating while a decision window is open
       and the world underneath it is frozen — a dead-still ball in a paused
       window is the last thing anyone needs. */
    let blinkT = 0;
    function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!state.paused && !topScreen() && state.phase !== 'idle') update(dt);
        /* Two things pulse, and neither of them is the ball's brightness — that
           has no room left to move (see the ball's material). A small breath in
           size with the rim tightening as it swells, and the beacon ring, which
           is the part that actually pulls the eye: it swells out from under the
           ball and fades, on a loop, so there is always something moving on the
           turf at the ball's feet and its position on the board is unambiguous
           even when it is still. */
        blinkT += dt;
        const beat = 0.5 + 0.5 * Math.sin(blinkT * 4.2);
        ballMesh.scale.setScalar(BALL_VIS * (1 + beat * 0.12));
        ballRim.material.opacity = 0.42 + beat * 0.3;
        const cyc = (blinkT % BALL_PING) / BALL_PING;
        ballPing.position.set(worldX(ball.x), 0.07, worldZ(ball.y));
        ballPing.scale.setScalar(0.7 + cyc * 2.2);
        ballPing.material.opacity = Math.pow(1 - cyc, 1.7) * 0.42;
        /* And the carrier wears the triangle. Possession is the thing a viewer
           has to know at a glance — it is what decides whose decision window is
           open — and at this zoom "which of the twelve has it" is genuinely not
           obvious from the ball alone, because the ball is the smaller object of
           the two and it sits at their feet. The mark hangs over the head, in the
           team's own colour, bobbing on the same beat as everything else so the
           eye reads it and the ball as one signal. */
        const holder = (!SO.active && ball.mode === 'held') ? ball.holder : null;
        carrierMark.visible = !!holder;
        if (holder) {
            carrierMark.position.set(
                worldX(holder.x),
                4.55 + Math.sin(blinkT * 4.2) * 0.22,
                worldZ(holder.y)
            );
            carrierMark.rotation.set(Math.PI, holder.yaw, 0);
            carrierMark.material.color.setHex(teamRingHex(holder));
            carrierMark.material.opacity = 0.68 + beat * 0.32;
        }
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
    if (ui.shoot) ui.shoot.addEventListener('click', shootFromButton);
    /* §17.b — the human's half of the decision window */
    if (ui.done) ui.done.addEventListener('click', humanDone);
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
        get plan() { return PLAN; },
        get shootout() { return SO; },
        get ball() { return ball; },
        api: {
            beginMatch, kickoff, goalKick, beginShootout, soSetupKick,
            passTo, shoot, pauseGame, resumeGame, toggleMute,
            humanDone, openPlan, beginExecution, queuePass, queueShot,
            setDifficulty: d => { state.difficulty = clamp(d, 0, 1); },
            /** Pin the clock, for testing full time without playing 2:00. */
            setHalfTime: t => { state.halfT = clamp(t, 0, HALF_LENGTH); },
            drainHalf: () => { state.halfT = HALF_LENGTH; state.pendingHalf = true; }
        }
    };
})();
