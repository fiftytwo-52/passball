/* ============================================================================
   src/scripts/rules.js — the pure real-time rulebook (§2, §5, §7, §10).

   Nothing in this module touches three.js, the DOM, or `window`. It is
   positions in, outcomes out, so it can be reasoned about — and tested —
   without a canvas.

   `npm run verify` (tools/verify-4.mjs) imports *this* file directly through
   Node, so the property tests cannot drift from the code the page runs: there
   is no second copy of the algorithm to keep in sync.

   Coordinate system: the canonical normalised pitch, x, y ∈ [0, 100].
   `you` attack y = 100, `cpu` attack y = 0, and both goals are centred on
   x = 50 (see GOAL in the engine).
   ========================================================================= */

export const RULES = {
    /* --- §2 movement ---------------------------------------------------- */
    PLAYER_SPEED: 26,          // outfield run speed, units / s
    DIVE_SPEED: 30,            // keeper dive speed — a shade above PLAYER_SPEED
    BALL_SPEED: 34,            // ground pass speed — MUST beat PLAYER_SPEED
    SHOT_SPEED: 40,            // shot speed — a shade above BALL_SPEED
    DRILL_SPEED: 22,           // off-ball drift / shape speed

    /* --- §7 race radii -------------------------------------------------- */
    CATCH_RADIUS: 3,           // interception / control radius
    KEEPER_REACH: 6,           // open-play save reach
    PENALTY_KEEPER_REACH: 12,  // shootout save reach (a reach / tolerance test)

    /* --- §2 pitch and match --------------------------------------------- */
    GOAL_X: 50,                // both goals are centred on this column
    GOAL_HALF_WIDTH: 12.5,     // half the mouth → mouth ≈ 25 units (feel-tuned)
    SHOT_RANGE: 30,            // max distance from goal to attempt a shot
    HALVES: 2,
    HALF_LENGTH: 120,          // seconds per half (2:00)
    PENALTY_SPOT: 10.5,        // penalty spot, units off the goal line
    KEEPER_LINE: 4,            // how far off their line a keeper stands

    /* --- §2 squads ------------------------------------------------------ */
    KEEPERS_PER_TEAM: 1,
    OUTFIELD_PER_TEAM: 5,
    ATTACK_CONTROLS: 4,        // carrier + receiver + 2 runners
    DEFENCE_CONTROLS: 2,       // interceptor + marker

    /* --- §10 shootout --------------------------------------------------- */
    SHOOTOUT_KICKS: 5          // per side, then sudden death
};

/** Regulation length in seconds (two halves). */
export const MATCH_LENGTH = RULES.HALVES * RULES.HALF_LENGTH;

/* ============================================================================
   Small geometry / maths helpers. Pure; no state.
   ========================================================================= */

export function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
}

/** Unit vector, or (0,0) for a degenerate input. */
export function norm(x, y) {
    const l = Math.hypot(x, y);
    return l < 1e-9 ? { x: 0, y: 0 } : { x: x / l, y: y / l };
}

/** Where a ball launched from `from` along `dir` at `speed` is after `t`. */
export function ballAt(from, dir, speed, t) {
    return { x: from.x + dir.x * speed * t, y: from.y + dir.y * speed * t };
}

/** Seconds for a ball to travel a straight leg at `speed`. */
export function flightTime(from, to, speed = RULES.BALL_SPEED) {
    return dist(from.x, from.y, to.x, to.y) / Math.max(1e-9, speed);
}

/** Drop a point onto the segment A→B, returning the clamped foot + distance. */
export function projectOnSegment(P, A, B) {
    const dx = B.x - A.x, dy = B.y - A.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 < 1e-9 ? 0 : clamp(((P.x - A.x) * dx + (P.y - A.y) * dy) / l2, 0, 1);
    const fx = A.x + dx * t, fy = A.y + dy * t;
    return { t, x: fx, y: fy, dist: Math.hypot(P.x - fx, P.y - fy) };
}

/**
 * Closest approach between two points moving at constant velocity, starting
 * from A0 / B0 and running for at most `span` seconds. `vA` and `vB` are
 * velocities (units/s). Returns the offset `s ∈ [0, span]` of the closest
 * moment and the distance `d` there — offsets rather than absolute times, so
 * the caller can chain windows without re-basing positions.
 */
export function closestApproach(A0, vA, B0, vB, span) {
    const rx = A0.x - B0.x, ry = A0.y - B0.y;
    const vx = vA.x - vB.x, vy = vA.y - vB.y;
    const vv = vx * vx + vy * vy;
    let s = vv < 1e-12 ? 0 : -(rx * vx + ry * vy) / vv;
    s = clamp(s, 0, Math.max(0, span));
    return { s, d: Math.hypot(rx + vx * s, ry + vy * s) };
}

/* ============================================================================
   §7 — interception: a real-time race, no dice.
   ========================================================================= */

/**
 * The instant a defender starting at `P` can be within `radius` of a ball
 * travelling `from` → `to`. The defender runs straight at the ball (pure
 * pursuit), which is exactly what "drag the interceptor at the pass line"
 * means, and the answer is the smallest root of

 *     |D + U·V·t|² = (s·t + r)²

 * where D = from − P, U = unit direction, V = ball speed, s = the defender's
 * speed and r = radius. Returns Infinity when the race is unwinnable (most
 * often because the ball is already moving away faster than the defender can
 * follow), and 0 when the defender is already inside the radius.
 */
export function interceptionTime(P, from, to, opts = {}) {
    const speed = opts.playerSpeed ?? RULES.PLAYER_SPEED;
    const radius = opts.radius ?? RULES.CATCH_RADIUS;
    const ballSpeed = opts.ballSpeed ?? RULES.BALL_SPEED;
    const flight = opts.flight ?? flightTime(from, to, ballSpeed);

    const dir = norm(to.x - from.x, to.y - from.y);
    if (dir.x === 0 && dir.y === 0) return Infinity;

    const dx = from.x - P.x, dy = from.y - P.y;
    if (dx * dx + dy * dy <= radius * radius) return 0;

    /* Rearranged into at² + bt + c = 0. `a` is positive because the whole
       mechanic rests on BALL_SPEED > PLAYER_SPEED. */
    const a = ballSpeed * ballSpeed - speed * speed;
    const b = 2 * (ballSpeed * (dx * dir.x + dy * dir.y) - speed * radius);
    const c = dx * dx + dy * dy - radius * radius;

    if (a <= 1e-9) return 0; // ball cannot outrun the defender: they get there

    const disc = b * b - 4 * a * c;
    if (disc < 0) return Infinity;

    const root = Math.sqrt(disc);
    const t1 = (-b - root) / (2 * a);
    const t2 = (-b + root) / (2 * a);
    const t = t1 >= 0 ? t1 : t2 >= 0 ? t2 : Infinity;
    if (!Number.isFinite(t)) return Infinity;
    return t <= flight ? t : Infinity;
}

/**
 * Resolve a pass as a race. `defenders` is a list of `{ x, y, speed? }`;
 * the earliest defender to reach the lane inside the catch radius wins.
 *
 * Returns `{ outcome: 'INTERCEPTION' | 'COMPLETE', t, at, interceptor, flight }`.
 */
export function resolvePassRace(input) {
    const from = input.from;
    const to = input.to;
    const ballSpeed = input.ballSpeed ?? RULES.BALL_SPEED;
    const playerSpeed = input.playerSpeed ?? RULES.PLAYER_SPEED;
    const radius = input.radius ?? RULES.CATCH_RADIUS;
    const defenders = input.defenders ?? [];

    const flight = flightTime(from, to, ballSpeed);
    const dir = norm(to.x - from.x, to.y - from.y);

    let best = Infinity;
    let who = -1;
    for (let i = 0; i < defenders.length; i++) {
        const d = defenders[i];
        const t = interceptionTime(d, from, to, {
            playerSpeed: d.speed ?? playerSpeed,
            radius,
            ballSpeed,
            flight
        });
        if (t < best) {
            best = t;
            who = i;
        }
    }

    if (who >= 0 && best <= flight) {
        const at = ballAt(from, dir, ballSpeed, best);
        return { outcome: 'INTERCEPTION', t: best, at, interceptor: who, flight };
    }

    /* No reset on a completed pass — the receiver simply becomes the carrier. */
    return {
        outcome: 'COMPLETE',
        t: flight,
        at: { x: to.x, y: to.y },
        interceptor: -1,
        flight
    };
}

/* ============================================================================
   §5 / §7 — shooting and saving.
   ========================================================================= */

/** A shot is on target only if it is aimed inside the mouth. */
export function isOnTarget(x, goalX = RULES.GOAL_X, halfWidth = RULES.GOAL_HALF_WIDTH) {
    return Math.abs(x - goalX) <= halfWidth + 1e-9;
}

/**
 * Resolve a shot against a diving keeper.
 *
 * The ball runs at SHOT_SPEED from `from` to `target` (a point on the goal
 * line); the keeper runs at DIVE_SPEED from `keeper` toward `keeperTarget`
 * and stops when it gets there. The shot is saved if, at any point up to the
 * moment the ball reaches the line, the keeper is within `reach` of the ball.
 *
 * Returns `{ outcome: 'SAVED' | 'GOAL' | 'OFF_TARGET', t, minDist, flight }`.
 */
export function shotOutcome(input) {
    const from = input.from;
    const target = input.target;
    const goalX = input.goalX ?? RULES.GOAL_X;
    const halfWidth = input.goalHalfWidth ?? RULES.GOAL_HALF_WIDTH;
    const shotSpeed = input.shotSpeed ?? RULES.SHOT_SPEED;
    const diveSpeed = input.diveSpeed ?? RULES.DIVE_SPEED;
    const reach = input.reach ?? RULES.KEEPER_REACH;
    const keeper = input.keeper;
    const keeperTarget = input.keeperTarget ?? keeper;

    const flight = flightTime(from, target, shotSpeed);
    const dirB = norm(target.x - from.x, target.y - from.y);
    const vB = { x: dirB.x * shotSpeed, y: dirB.y * shotSpeed };

    if (!isOnTarget(target.x, goalX, halfWidth)) {
        return { outcome: 'OFF_TARGET', t: flight, minDist: Infinity, flight };
    }

    const dirK = norm(keeperTarget.x - keeper.x, keeperTarget.y - keeper.y);
    const vK = { x: dirK.x * diveSpeed, y: dirK.y * diveSpeed };
    const travel = dist(keeper.x, keeper.y, keeperTarget.x, keeperTarget.y);
    const tStop = clamp(travel / Math.max(1e-9, diveSpeed), 0, flight);

    /* Regime 1: keeper still diving, window [0, tStop]. Regime 2: keeper parked
       on the target, window [tStop, flight]. The smaller of the two minimum
       distances is the closest the keeper ever gets to the ball. */
    const diving = closestApproach(from, vB, keeper, vK, tStop);
    const ballStop = { x: from.x + vB.x * tStop, y: from.y + vB.y * tStop };
    const keepStop = { x: keeper.x + vK.x * tStop, y: keeper.y + vK.y * tStop };
    const parked = closestApproach(ballStop, vB, keepStop, { x: 0, y: 0 }, flight - tStop);

    const best = diving.d <= parked.d ? diving : parked;
    const bestT = diving.d <= parked.d ? diving.s : tStop + parked.s;
    const saved = best.d <= reach + 1e-9;
    return {
        outcome: saved ? 'SAVED' : 'GOAL',
        t: bestT,
        minDist: best.d,
        flight
    };
}

/**
 * The keeper's no-input dive: go toward the shot's side, but no further than a
 * single reach. Used when the human gives no instruction during the window.
 */
export function defaultDiveTarget(keeper, target, reach = RULES.KEEPER_REACH) {
    const dx = target.x - keeper.x;
    const step = (dx === 0 ? 1 : Math.sign(dx)) * Math.min(Math.abs(dx) || reach, reach);
    return { x: keeper.x + step, y: keeper.y };
}

/* ============================================================================
   §10 — the penalty shootout.
   ========================================================================= */

/**
 * One kick. Aiming outside the mouth is an automatic miss; otherwise the dive
 * point is compared against the shot target with a reach / tolerance test —
 * deliberately not an exact-pixel match.
 */
export function penaltyKickOutcome(input) {
    const shotTarget = input.shotTarget;
    const divePoint = input.divePoint;
    const reach = input.reach ?? RULES.PENALTY_KEEPER_REACH;
    const goalX = input.goalX ?? RULES.GOAL_X;
    const halfWidth = input.goalHalfWidth ?? RULES.GOAL_HALF_WIDTH;

    if (!isOnTarget(shotTarget.x, goalX, halfWidth)) {
        return { outcome: 'MISS', dist: Infinity, onTarget: false };
    }
    const d = dist(shotTarget.x, shotTarget.y, divePoint.x, divePoint.y);
    return {
        outcome: d <= reach + 1e-9 ? 'SAVED' : 'GOAL',
        dist: d,
        onTarget: true
    };
}

/**
 * Has the shootout been settled? Within the first `kicks` per side this also
 * catches an early clinch (one side can no longer catch up); after that it is
 * sudden death until a round ends unequal.
 */
export function shootoutDecided(you, cpu, takenYou, takenCpu, kicks = RULES.SHOOTOUT_KICKS) {
    const remYou = Math.max(0, kicks - takenYou);
    const remCpu = Math.max(0, kicks - takenCpu);
    if (you > cpu + remCpu) return true;
    if (cpu > you + remYou) return true;
    if (takenYou >= kicks && takenCpu >= kicks) return you !== cpu;
    return false;
}

/** `m:ss` countdown text for the match clock. Pure, so the HUD just prints it. */
export function formatClock(seconds) {
    const s = Math.max(0, Math.ceil(seconds - 1e-6));
    const m = Math.floor(s / 60);
    return m + ':' + String(s - m * 60).padStart(2, '0');
}

/* ============================================================================
   Deterministic RNG, used only for spawn/flavour — never inside resolution.
   ========================================================================= */

export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ============================================================================
   The property suite. Everything above is data + pure functions, so this runs
   identically in the browser (on load, silently) and in Node (via npm run
   verify, loudly).
   ========================================================================= */

export function runVerification(log = true) {
    const results = [];

    const check = (name, fn) => {
        let pass = true;
        let detail = null;
        try {
            const out = fn();
            if (out !== true) {
                pass = false;
                detail = out === undefined ? 'assertion failed' : out;
            }
        } catch (err) {
            pass = false;
            detail = String((err && err.message) || err);
        }
        results.push({ name, pass, detail });
    };

    const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
    const D = (a, b) => dist(a.x, a.y, b.x, b.y);

    /* --- §2 the inequality the whole game rests on ---------------------- */
    check('BALL_SPEED > PLAYER_SPEED (passes outrun defenders)', () => {
        return RULES.BALL_SPEED > RULES.PLAYER_SPEED || 'ball is not faster than a player';
    });

    check('SHOT_SPEED > BALL_SPEED (shots outrun passes)', () => {
        return RULES.SHOT_SPEED > RULES.BALL_SPEED || 'shot is not faster than a pass';
    });

    check('DIVE_SPEED slightly exceeds PLAYER_SPEED', () => {
        return (
            (RULES.DIVE_SPEED > RULES.PLAYER_SPEED && RULES.DIVE_SPEED < RULES.SHOT_SPEED) ||
            'keeper dive speed is out of range'
        );
    });

    check('Squad is 1 GK + 5 outfield, 4 attacking controls', () => {
        return (
            (RULES.KEEPERS_PER_TEAM === 1 &&
                RULES.OUTFIELD_PER_TEAM === 5 &&
                RULES.ATTACK_CONTROLS === 4 &&
                RULES.DEFENCE_CONTROLS === 2) ||
            'squad or control counts drifted from the spec'
        );
    });

    check('Goal mouth is 24–26 units, centred on x = 50', () => {
        const mouth = RULES.GOAL_HALF_WIDTH * 2;
        return (mouth >= 24 && mouth <= 26 && RULES.GOAL_X === 50) || 'mouth is ' + mouth;
    });

    check('Two 2:00 halves (match = 240 s)', () => {
        return (
            (RULES.HALVES === 2 && RULES.HALF_LENGTH === 120 && MATCH_LENGTH === 240) ||
            'match length drifted'
        );
    });

    check('formatClock renders a countdown m:ss and floors at 0:00', () => {
        return (
            (formatClock(120) === '2:00' &&
                formatClock(65) === '1:05' &&
                formatClock(7) === '0:07' &&
                formatClock(-3) === '0:00' &&
                formatClock(0.4) === '0:01') || 'clock text is wrong'
        );
    });

    /* --- §7 interception ------------------------------------------------ */
    /* A straight pass up the middle: carrier (50,20) → receiver (50,80). */
    const LANE = { from: { x: 50, y: 20 }, to: { x: 50, y: 80 } };

    check('A defender standing in the lane intercepts the pass', () => {
        const r = resolvePassRace({ ...LANE, defenders: [{ x: 50, y: 50 }] });
        return (
            (r.outcome === 'INTERCEPTION' && r.t > 0 && r.t < r.flight && r.interceptor === 0) ||
            'got ' + r.outcome + ' at t=' + r.t
        );
    });

    check('A defender near the lane intercepts sooner than one far off it', () => {
        const a = resolvePassRace({ ...LANE, defenders: [{ x: 50, y: 50 }] });
        const b = resolvePassRace({ ...LANE, defenders: [{ x: 16, y: 50 }] });
        return (
            (a.outcome === 'INTERCEPTION' && a.t < b.t) ||
            'near=' + a.t + ' far=' + b.t
        );
    });

    check('An open pass (no defender) always completes', () => {
        const r = resolvePassRace({ ...LANE, defenders: [] });
        return (
            (r.outcome === 'COMPLETE' && near(r.at.x, 50) && near(r.at.y, 80) &&
                near(r.t, r.flight)) || 'open pass did not complete cleanly'
        );
    });

    check('A defender behind the ball cannot chase it down', () => {
        const r = resolvePassRace({ ...LANE, defenders: [{ x: 50, y: 8 }] });
        return r.outcome === 'COMPLETE' || 'a trailing defender intercepted';
    });

    check('A larger CATCH_RADIUS never delays the interception', () => {
        const tight = resolvePassRace({
            ...LANE,
            defenders: [{ x: 66, y: 44 }],
            radius: RULES.CATCH_RADIUS
        });
        const loose = resolvePassRace({
            ...LANE,
            defenders: [{ x: 66, y: 44 }],
            radius: RULES.CATCH_RADIUS * 3
        });
        return loose.t <= tight.t + 1e-9 || 'radius made the race slower';
    });

    check('Resolution is deterministic (same input, same outcome)', () => {
        const input = { ...LANE, defenders: [{ x: 58, y: 40 }, { x: 44, y: 62 }] };
        const a = resolvePassRace(input);
        const b = resolvePassRace(input);
        return (
            (a.outcome === b.outcome && near(a.t, b.t) && near(a.at.x, b.at.x)) ||
            'resolution is not reproducible'
        );
    });

    check('A completed pass is the only way to reach the receiver', () => {
        const r = resolvePassRace({
            ...LANE,
            defenders: [{ x: 50, y: 50 }, { x: 50, y: 60 }, { x: 50, y: 70 }]
        });
        return (
            (r.outcome === 'INTERCEPTION' && r.interceptor === 0) ||
            'the earliest defender did not win the race'
        );
    });

    /* --- §7 save race --------------------------------------------------- */
    const SHOT = { from: { x: 50, y: 30 }, target: { x: 61, y: 0 } };

    check('A keeper sitting on the shot line saves it', () => {
        const r = shotOutcome({
            ...SHOT,
            keeper: { x: 61, y: 1 },
            keeperTarget: { x: 61, y: 0 }
        });
        return r.outcome === 'SAVED' || 'keeper on the line conceded: ' + r.outcome;
    });

    check('A keeper diving the other way concedes', () => {
        const r = shotOutcome({
            ...SHOT,
            keeper: { x: 50, y: RULES.KEEPER_LINE },
            keeperTarget: { x: 39, y: 0 }
        });
        return r.outcome === 'GOAL' || 'a wrong-way dive saved the shot';
    });

    check('A shot wide of the mouth is off target', () => {
        const r = shotOutcome({
            ...SHOT,
            target: { x: 50 + RULES.GOAL_HALF_WIDTH + 4, y: 0 },
            keeper: { x: 50, y: 2 },
            keeperTarget: { x: 50, y: 0 }
        });
        return r.outcome === 'OFF_TARGET' || 'a shot outside the posts counted as on target';
    });

    check('SHOT_SPEED beats a keeper who is not on the line', () => {
        const offLine = { keeper: { x: 30, y: RULES.KEEPER_LINE }, keeperTarget: { x: 61, y: 0 } };
        const fast = shotOutcome({ ...SHOT, ...offLine });
        const slow = shotOutcome({ ...SHOT, ...offLine, shotSpeed: RULES.SHOT_SPEED / 2 });
        return (
            (fast.outcome === 'GOAL' && slow.outcome === 'SAVED') ||
            'fast=' + fast.outcome + ' slow=' + slow.outcome
        );
    });

    check('A bigger KEEPER_REACH turns the same shot into a save', () => {
        const input = {
            ...SHOT,
            keeper: { x: 30, y: RULES.KEEPER_LINE },
            keeperTarget: { x: 61, y: 0 }
        };
        const short = shotOutcome(input);
        const long = shotOutcome({ ...input, reach: RULES.KEEPER_REACH * 4 });
        return (
            (short.outcome === 'GOAL' && long.outcome === 'SAVED') ||
            'short=' + short.outcome + ' long=' + long.outcome
        );
    });

    check('The default dive goes toward the shot and stays within one reach', () => {
        const keeper = { x: 50, y: RULES.KEEPER_LINE };
        const right = defaultDiveTarget(keeper, { x: 62, y: 0 });
        const left = defaultDiveTarget(keeper, { x: 38, y: 0 });
        return (
            (right.x > keeper.x &&
                left.x < keeper.x &&
                Math.abs(right.x - keeper.x) <= RULES.KEEPER_REACH + 1e-9 &&
                Math.abs(left.x - keeper.x) <= RULES.KEEPER_REACH + 1e-9) ||
            'default dive drifted off the shot side'
        );
    });

    /* --- §10 penalties -------------------------------------------------- */
    check('A penalty dive inside the reach saves, outside it scores', () => {
        const target = { x: 58, y: 0 };
        const inside = penaltyKickOutcome({
            shotTarget: target,
            divePoint: { x: target.x - RULES.PENALTY_KEEPER_REACH + 1, y: 0 }
        });
        const outside = penaltyKickOutcome({
            shotTarget: target,
            divePoint: { x: target.x - RULES.PENALTY_KEEPER_REACH - 1, y: 0 }
        });
        return (
            (inside.outcome === 'SAVED' && outside.outcome === 'GOAL') ||
            'inside=' + inside.outcome + ' outside=' + outside.outcome
        );
    });

    check('The penalty reach test is inclusive at exactly the reach', () => {
        const r = penaltyKickOutcome({
            shotTarget: { x: 55, y: 0 },
            divePoint: { x: 55 - RULES.PENALTY_KEEPER_REACH, y: 0 }
        });
        return r.outcome === 'SAVED' || 'the boundary dive was not a save';
    });

    check('A penalty aimed outside the mouth is a miss', () => {
        const r = penaltyKickOutcome({
            shotTarget: { x: RULES.GOAL_X + RULES.GOAL_HALF_WIDTH + 3, y: 0 },
            divePoint: { x: RULES.GOAL_X, y: 0 }
        });
        return r.outcome === 'MISS' || 'an off-target penalty was not a miss';
    });

    check('Shootout: level after five each goes to sudden death', () => {
        return (
            shootoutDecided(3, 3, 5, 5) === false || 'a level shootout was called early'
        );
    });

    check('Shootout: five each with a leader is settled', () => {
        return (
            (shootoutDecided(4, 3, 5, 5) === true && shootoutDecided(3, 4, 5, 5) === true) ||
            'a decided shootout was not settled'
        );
    });

    check('Shootout: an early clinch ends it before five each', () => {
        /* 2-0 after two kicks each: the trailing side can still take three. */
        const notYet = shootoutDecided(2, 0, 2, 2);
        /* 4-0 after five kickers against four: only one kick left to answer. */
        const clinched = shootoutDecided(4, 0, 5, 4);
        return (
            (notYet === false && clinched === true) ||
            'early clinch handled wrongly: ' + notYet + '/' + clinched
        );
    });

    check('Shootout: sudden death ends when a round breaks level', () => {
        return (
            (shootoutDecided(6, 5, 6, 6) === true && shootoutDecided(6, 6, 6, 6) === false) ||
            'sudden death handled wrongly'
        );
    });

    /* --- corpus sanity -------------------------------------------------- */
    check('4000 synthetic plays stay inside the rules (no NaN, legal outcomes)', () => {
        const rng = mulberry32(20240913);
        let interceptions = 0;
        for (let i = 0; i < 4000; i++) {
            const from = { x: 6 + rng() * 88, y: 6 + rng() * 88 };
            const to = { x: 6 + rng() * 88, y: 6 + rng() * 88 };
            if (D(from, to) < 6) continue;
            const defenders = [];
            const n = Math.floor(rng() * 4);
            for (let k = 0; k < n; k++) defenders.push({ x: rng() * 100, y: rng() * 100 });

            const r = resolvePassRace({ from, to, defenders });
            if (r.outcome !== 'COMPLETE' && r.outcome !== 'INTERCEPTION') {
                return 'illegal outcome ' + r.outcome;
            }
            if (!Number.isFinite(r.t) || !Number.isFinite(r.at.x) || !Number.isFinite(r.at.y)) {
                return 'non-finite result at play ' + i;
            }
            if (r.outcome === 'INTERCEPTION') {
                interceptions++;
                const d = defenders[r.interceptor];
                /* kinematics: the defender could still have got there... */
                if (D(r.at, d) > RULES.PLAYER_SPEED * r.t + RULES.CATCH_RADIUS + 1e-6) {
                    return 'defender could not have reached the ball at play ' + i;
                }
                /* ...and the ball really was there, on its own path. */
                if (D(r.at, from) > RULES.BALL_SPEED * r.t + 1e-6) {
                    return 'ball was not on its own path at play ' + i;
                }
                if (r.t > r.flight + 1e-9) return 'interception after the flight at play ' + i;
            }
        }
        if (interceptions < 100) return 'only ' + interceptions + ' interceptions in 4000 plays';
        return true;
    });

    const allPass = results.every(r => r.pass);

    if (log) {
        for (const r of results) {
            const mark = r.pass ? 'PASS' : 'FAIL';
            console.log(mark.padEnd(6) + r.name + (r.pass ? '' : '  → ' + JSON.stringify(r.detail)));
        }
        console.log((allPass ? 'ALL PASS ' : 'FAILURES ') + results.length + ' properties');
    }

    const report = { allPass, results, properties: results.length };
    if (log !== false && typeof window !== 'undefined') {
        window.__GAP_VERIFY_RESULTS = report;
    }
    return report;
}
