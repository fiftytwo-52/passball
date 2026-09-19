/**
 * Guess & Pass — the engine.  Real-time seven-a-side football.
 *
 * There are no turns and no dice. The pitch is one continuous simulation: a
 * `requestAnimationFrame` loop moves every player and the ball, and every
 * single frame asks the §7 questions — "has a defender actually got to the
 * ball yet?", "has the keeper got a hand to it before the line?". What
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
    clamp, flightTime, projectOnSegment,
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
       PORTRAIT GATE — touch/mobile devices play portrait-only.
       ----------------------------------------------------------------------
       Desktop/PC is exempt entirely: a resized narrow desktop window must
       never trigger this, so detection is NOT viewport width. A device
       counts as mobile only when touch is its primary input (a coarse
       pointer with no fine pointer — touch laptops keep their mouse, so
       they stay exempt) or when it reports a mobile touch surface
       (navigator.maxTouchPoints > 0) AND a phone/tablet user-agent token.
       Either signal alone over-triggers (coarse covers big touch screens
       poorly; UA tokens miss hybrids), so the pair is AND/OR'd
       conservatively: coarse-primary alone is enough, otherwise both the
       touch surface and the UA token must agree.

       While the gate is up, `rotateHold` freezes the simulation exactly
       like a pause — update(dt) is never called, so no match time, plan
       countdown, or move advances — but it is NOT the pause screen: it
       sits above every screen (menus included), pushes nothing onto the
       screen stack, and resumes by simply clearing the flag. The OS-level
       portrait lock (screen.orientation.lock, PWA/fullscreen only) is
       attempted as a best-effort extra; the overlay is the fallback that
       works in a plain mobile browser tab.
       ---------------------------------------------------------------------- */
    const rotateGate = document.getElementById('rotate-gate');
    let rotateHold = false;
    function isTouchDevice() {
        try {
            const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
            /* A coarse primary pointer with no fine pointer is a phone or a
               tablet: touch-first with no mouse to fall back on. A touch
               laptop reports BOTH (touchscreen + trackpad/mouse), so it
               stays desktop-exempt here. */
            if (coarse && !fine) return true;
            const touchPoints = (navigator.maxTouchPoints || 0) > 0;
            const ua = (navigator.userAgent || '') + ' ' + (navigator.vendor || '');
            const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet|Touch/i.test(ua) ||
                (navigator.userAgentData && navigator.userAgentData.mobile === true);
            /* Touch surface + mobile UA together: catches tablets whose
               pointer query reports hybrid capabilities. Neither signal
               alone is trusted — a desktop touchscreen has touch points
               but no mobile UA, and a UA string alone can be spoofed. */
            if (touchPoints && mobileUA) return true;
        } catch (e) { /* matchMedia unavailable (old browser): stay desktop. */ }
        return false;
    }
    function isLandscapeShape() {
        const w = window.innerWidth || 0, h = window.innerHeight || 0;
        return w > 0 && h > 0 && w > h;
    }
    function syncRotateGate() {
        if (!rotateGate) return;
        /* Desktop/PC: skip everything — no detection, no prompt, no lock. */
        const want = isTouchDevice() && isLandscapeShape();
        if (want === rotateHold) { rotateGate.hidden = !want; return; }
        rotateHold = want;
        rotateGate.hidden = !want;
        if (want) tryRequestPortraitLock();
    }
    function tryRequestPortraitLock() {
        /* PWA/TWA + fullscreen only: plain mobile tabs reject this, which is
           exactly why the overlay above is the real gate and this is just a
           best-effort extra so an installed app never rotates at all. */
        try {
            const orient = window.screen && window.screen.orientation;
            if (orient && typeof orient.lock === 'function') {
                const p = orient.lock('portrait');
                if (p && typeof p.catch === 'function') p.catch(() => { });
            }
        } catch (e) { /* NotAllowedError outside fullscreen/install: ignore. */ }
    }
    /* ----------------------------------------------------------------------
       § 0.a RULEBOOK ALIASES — the tunables live in ./rules.js. Nothing here
       may be tuned independently of the property tests.
       ---------------------------------------------------------------------- */
    const {
        PLAYER_SPEED, BALL_SPEED, SHOT_SPEED, DIVE_SPEED, DRILL_SPEED,
        CATCH_RADIUS, KEEPER_REACH,
        /* HALF_LENGTH is deliberately NOT aliased here: the half length is a
           player setting now, and the engine reads the runtime `halfLength`
           (see the HALF_LENGTH_STEPS block in §17.b). rules.js keeps its own
           constant for the property tests. */
        GOAL_HALF_WIDTH, SHOT_RANGE, PENALTY_SPOT, KEEPER_LINE
    } = RULES;

    /* ----------------------------------------------------------------------
       § 0.b THE CONTACT RULE — a ball in flight is interrupted by a TOUCH, and
       "touch" is a distance you can see.

       The rulebook's CATCH_RADIUS (3) is a *collection* radius: how far a man's
       control reaches when he is going to collect a ball — the receiver
       claiming a pass that arrives, the nearest body claiming a loose ball, and
       the model the CPU uses to score its own pass options. It was never a
       tackle, and it was being used as one: an interception also fired on it,
       so any ball that merely *passed* within three units of a defender — a
       full body-width clear on either side of him — was taken off the passer.
       The ball the player drew never arrived, and the defender who "read" it
       never had to go anywhere near it.

       Interruption is now a different and much smaller question, and it is
       asked geometrically: the ball has to actually reach the defender's feet.
       TOUCH_R is that contact radius. A player's drawn body is ~1.4 units wide
       and the ball ~0.45 across, so a man who is genuinely on the ball's line
       is comfortably inside it and a man who is merely in the neighbourhood is
       not. The keepers get a little more of it, because they have hands.
       Against a SHOT the reach is the keeper's arms, and the engine now passes
       its own KEEPER_SAVE_REACH (§0.d) into `shotOutcome()` rather than letting
       it default to the rulebook's KEEPER_REACH. rules.js is untouched, so the
       property test that pins the rulebook's number still reads the rulebook.

       These live here rather than in ./rules.js for one reason: everything in
       the rulebook is pinned by a property test, and no test should be written
       against how wide a defender looks. They are the engine's own contact
       geometry, and they are the only numbers that decide a cut.
       ---------------------------------------------------------------------- */
    const TOUCH_R = 0.95;
    const KEEPER_TOUCH_R = 1.0;

    /* ----------------------------------------------------------------------
       THE KEEPER'S SWEEP — the one time he leaves his line for a dead ball.

       Presentation-plus: these decide WHERE a keeper stands, never a verdict,
       so no property test reads them (exactly like TOUCH_R above). Before this
       he lived on his line and nothing else, so a ball rolled into his own half
       with nobody near it sat there until an outfielder walked back for it.
       ---------------------------------------------------------------------- */
    const KEEPER_CHASE_DIST = 18;   // a loose ball nearer than this to his home line
    const KEEPER_SWEEP_R = 8;       // ...with no team-mate within this of it...
    /* §12.h — ...and this far off his line, and never further. Was 26, which is
       most of the way to the penalty spot: on top of a 12-unit "a ball this close
       to him is his regardless", the keeper spent whole possessions standing in
       the middle of his own box collecting everything that came near it, which is
       half of "the goalkeeper is still too good". A keeper comes off his line for
       a ball he can actually reach and then goes back. */
    const KEEPER_SWEEP_MAX = 8;     // ...is his to come and collect, this far off his line
    const KEEPER_CLEAR_R = 3.5;     // a ball this close to him is his regardless

    /* ----------------------------------------------------------------------
       § 0.d THE KEEPER'S READ — the engine's own model of a save.

       "The goalkeeper is still too good" was not a save-race problem, it was a
       coverage one, and it is worth the arithmetic because it is not obvious.
       `shotOutcome()` (rules.js) wraps the rulebook's KEEPER_REACH (6) of arms
       around the spot the keeper DIVES TO, and he then travels up to another
       reach to get there — about two reaches of ground in total. The keeper
       stands on x = 50 (keeperHome) and the mouth is GOAL_HALF_WIDTH = 12.5 to
       either side of him, so from his own line he already covers a 12.5-wide
       mouth almost to both posts. He was then handed the shot's TRUE side to
       dive to (defaultDiveTarget), which is the one thing a keeper never knows,
       and between the two there was no shot on the pitch he could not reach.

       So the read is a coin flip instead of a solve, and the ground he commits
       to is short. A read that goes the right way still saves everything from
       the middle of the goal out to the post he moved for; a read that goes the
       wrong way is beaten, which is what "if the attacker shoots the opposite
       way to the dive, that should go in" has always asked for. The shot that
       beats him on the correct side too is the far post — he has committed
       inside it, and it is open behind him.

       These are presentation tunables of exactly the kind §0.b describes: they
       move a body and set his arms, never a verdict. `verify-4.mjs` imports
       rules.js alone, so RULES.KEEPER_REACH, defaultDiveTarget() and the penalty
       shootout — where the human DRAWS the dive — are all untouched.
       ---------------------------------------------------------------------- */
    const KEEPER_READ_CHANCE = 0.35; // base chance he dives the way the shot is going
    const KEEPER_STEP = 2.2;         // ground he commits to, one way, off his line

    /* --- §0.d the dive is a LUNGE, not a slide across the mouth --------------
       "Decrease the keeper's diving length." Two numbers carried it, and both
       were long enough that the mouth had no corner left in it.

       KEEPER_DIVE_MAX caps how far from his standing position ANY dive may go —
       the engine's own read above, and the point the human DRAWS for his own
       keeper, which until now was clamped only by the width of the pitch: a
       drag could send him 40 units sideways and he would arrive, because the
       dive is the one motion §8 exempts from the shape rules. It is a body
       throwing itself at a ball now, and a body has a length.

       KEEPER_SAVE_REACH is the other half: the arms. `shotOutcome()` wraps this
       around the point he dives to, so the ground he covers is the dive plus the
       reach either side of it — 2.2 + 2.6 from his line for the uncommanded
       read, against a mouth that is 12.5 wide from the centre to each post. The
       far post is genuinely open, which is what a save being a read means.

       Presentation-plus, exactly as §0.b describes: rules.js still owns
       KEEPER_REACH = 6 and `verify-4.mjs` still reads the rulebook, because the
       property tests call shotOutcome() without a `reach` and get the rulebook's
       own number. Only the match passes these. */
    const KEEPER_DIVE_MAX = 4.0;     // furthest a dive may travel, from his feet
    const KEEPER_SAVE_REACH = 2.6;   // his arms around the point he dives to

    /* --- §0.d AND THE PASS AT HIS GOAL --------------------------------------
       A shot is a race the keeper commits to the instant it is struck, above.
       A PASS whose line runs into his own mouth is the other ball he must go
       for, and it is the one neither keeper ever moved for: the human's held
       his line, and the CPU's was deliberately excluded from the sweep by
       `ball.mode !== 'pass'` — so a ball played into the net was awarded with
       the keeper standing wherever the passer left him. From above, that is
       the keeper who "cannot even reach" a pass aimed at his goal.

       He now READS the passer's line after a short reaction and slides along
       his line to the point it will cross, capped to the mouth he defends.
       Nothing here awards a save: the KEEPER_TOUCH_R contact (§0.b) still
       decides whether his gloves actually reached the ball, so a ball struck
       firm into a corner still beats him. The mouth keeps its corners because
       he works from the centre of it and cannot cover a 12.5-unit post from
       close range in the time a hard pass gives him.
       ---------------------------------------------------------------------- */
    const KEEPER_REACT_DELAY = 0.18; // seconds before he reads a struck ball

    /* --- §0.d and the REFLEX — track the shot, then lunge at it -------------
       The dive set at the strike is a commitment made on a guess. A keeper with
       NO commitment — the human's, whom nobody guesses for — now runs with the
       ball: he reads the shot's line, takes up KEEPER_TRACK_GAIN of the ground
       to where it will cross, and once the ball is within KEEPER_REFLEX_DIST of
       his line he lunges at the true crossing point, capped by the same
       KEEPER_DIVE_MAX every dive answers to. Whether he is allowed the lunge at
       all is rolled ONCE per flight at the strike (KEEPER_REFLEX_CHANCE) and
       stashed on the ball — never re-rolled frame by frame — so a flight has
       one character: sometimes he dives, sometimes he only tracks. No save is
       awarded here: shotOutcome()'s race still decides from his live target. */
    const KEEPER_REFLEX_DIST = 9;      // how close the ball must be before he lunges
    const KEEPER_REFLEX_CHANCE = 0.55; // one roll per flight: is he allowed the lunge
    const KEEPER_TRACK_GAIN = 0.5;     // how much of the crossing point he runs to

    /* ----------------------------------------------------------------------
       § 0.c THE PACE DIAL — one number, under every body on the board.

       "Decrease the speed of players slightly." Nothing in ./rules.js may be
       touched: PLAYER_SPEED (18.2), BALL_SPEED (23.8) and the whole §7 race
       table are pinned by the 28 property tests, and every one of those tests
       decides a verdict from a RATIO between a speed and an unscaled radius.
       Scaling PLAYER_SPEED alone would move those ratios and could flip a
       threshold test; scaling a number the tests never see cannot.

       So the dial is applied at the ONE place a body is actually stepped —
       moveToward(), below — and nowhere else. Every caller is slowed together
       and identically: a stacked run, a shape jog, a chase for a loose ball,
       a keeper sliding across his line, a dive, the assemble walk. The ball is
       NOT slowed, because the ball is not a player and the complaint was never
       about the ball: passes and shots still race the runners at exactly the
       speeds the rulebook describes, so a pass is now a fraction SLOWER to be
       overtaken and a shot is unchanged.

       Because the scale divides BOTH sides of every player-versus-player race
       and neither side of a player-versus-ball race, what changes is only the
       absolute pace of the bodies — which is precisely what was asked for.

       It has now been wound down twice: 1 → 0.92, and 0.92 → 0.85. Both times
       the asking was the same "slightly", and both times what the eye was
       really missing was the CONTRAST with the ball — a contrast is a ratio,
       so it has been answered from the body's side and from the ball's side at
       once (see the stroke pace span below). At 0.85 a man runs at 15.47
       against a rulebook 18.2, while the slowest pass in the game still
       arrives at 16.31 — so the §12.b guarantee that the ball is quicker than a
       running man for the whole of its flight is now kept with margin instead
       of by a hair, which it was at the unscaled pace. Nothing in ./rules.js
       has moved, so all 28 property tests still read the rulebook the engine is
       actually playing by. */
    const RUN_SCALE = 0.85;

    /* --- §0.c keeper dial — the keeper runs on his own scale on top of the
       pace dial. At 0.8 his dive reads ≈14.3 against an outfielder's 15.47:
       a step slower than the men he races, which is what "the keeper is too
       fast" asked for. It multiplies every keeper-only speed (dive, sweep,
       slide, shootout dive), and the §7 save race gets RUN_SCALE ×
       KEEPER_SCALE so the race he is judged by is the race he runs. The
       rulebook is untouched: DIVE_SPEED stays 21.0 in rules.js. --- */
    const KEEPER_SCALE = 0.8;

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
       receiver instead of crawling to him: v0 = PASS_PACE·BALL_SPEED = 30.0, and
       still PASS_SLOW·v0 = 21.6 when it arrives — faster than a 18.2 run all the
       way down, and only beatable in the final stride. `dec` is solved
       backwards from that single requirement, and the arrival fraction is
       PASS_SLOW for a ball into feet, falling to PASS_SLOW_FAR over
       PASS_DECAY_DIST, so a ball played a long way visibly runs out of steam on
       the way instead of arriving as hard as it left.

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
    const PASS_SLOW = 0.72;       // a SHORT pass resolves at this fraction of its kick
    /* §12.b — and the ball keeps losing pace the further it is asked to go. A
       ball into feet dies to PASS_SLOW of its kick; a ball played the far
       reference distance dies to PASS_SLOW_FAR of it, so striking it harder does
       not rescue a long ball from running out of steam — it only makes it faster
       on the way there. PASS_DECAY_DIST is the aiming distance (canonical units)
       at which the far fraction is reached, and both ends are read through
       passArrivalFrac() below, so every rolled ball solves its flight from the
       same two numbers. Even the far end still arrives at nearly half again a
       running man's pace (PASS_SLOW_FAR · PASS_PACE · BALL_SPEED ≈ 26.4 against
       18.2), so the §12.b guarantee holds at every distance. */
    const PASS_SLOW_FAR = 0.55;   // ...and a LONG pass resolves at this fraction of its kick
    const PASS_DECAY_DIST = 60;   // aiming distance (u) at which the far fraction is reached
    /* §12.b — "increase ball speed." The rulebook's BALL_SPEED (23.8) is pinned by
       the 28 property tests and may not move, so the whole of the increase lives
       here, in the one number that turns it into a kick: v0 = PASS_PACE·BALL_SPEED.
       1.12 → 1.26 is a quarter of a chord more on every ball that leaves a boot,
       and the arrival fraction is a RATIO of that kick (PASS_SLOW…PASS_SLOW_FAR,
       below), so the ball is quicker than a running man by a wider margin than
       before — the §12.b
       guarantee gets stronger, never weaker. Nothing in ./rules.js has moved. */
    const PASS_PACE = 1.26;       // kick speed, as a multiple of BALL_SPEED
    const PASS_REACH = 1.0;       // and it has covered this much ground by then
    /* §12.d — the two ends of the stroke's power dial. `pace` maps the drawn
       length across this span (see launchBall), so a nudge into feet and a
       line drawn the full length of the pitch are the same roll profile struck
       at two different paces — and this span is what "the ball moves faster the
       longer the line" actually means. Both ends have now been lifted: the floor
       from 0.85 to 0.92, so even a nudge into feet is a struck ball rather than a
       rolled one, and the ceiling from 1.45 to 1.60, so a full-length line is a
       genuine clearance. The roll still dies to a fraction of whatever it was
       struck at (passArrivalFrac, below), so the floor is still the slowest ball
       in the game and the profile still protects the "quicker than a runner"
       rule at every power level. */
    const PACE_MIN = 0.92;        // a flick into feet
    const PACE_MAX = 1.60;        // a full-length line, struck as hard as he can
    const BALL_ROLL_STOP = 11.5;  // turf friction for a loose ball, u/s²
    const BALL_ROLL_ARC = 0.06;   // a rolled ball is on the deck, not in the air

    /* ----------------------------------------------------------------------
       § 12.j THE REBOUND — a shot that does not go in is still a live ball.

       Everything that was not a goal used to end with the ball in a keeper's
       hands. `resolveArrival()` sent a shot that missed straight to
       `goalKick(other(possession))`, which hands the ball to the defending
       keeper WHEREVER HE HAPPENS TO BE STANDING — so a shot that flew a metre
       wide, a shot that cannoned back off the post and a shot that ran out of
       play were all the same event, and in all three the keeper collected a ball
       he had never gone anywhere near. It is the one moment in a football match
       where everybody sprints, and it was being resolved by an award.

       So nothing collects a ball it has not reached. A shot that misses spills,
       and from that instant it is an ordinary loose ball under the §12.b rules:
       it rolls, it decelerates, the nearest body of each kit races for it (and
       the keeper is a body — he has to come and get it), and whoever arrives
       inside CATCH_RADIUS wins it. What is added here is only the geometry of
       what the ball hits on the way.

       Four surfaces, and every one of them is presentation-plus of the §0.b
       kind: they decide WHERE the ball goes, never who wins it.

         · the posts        — solved as a real circle, so the ball comes off the
                              woodwork along the normal it struck it at;
         · the netting      — the mouth is closed behind the line, so a loose
                              ball cannot trickle through the back of the goal;
         · the hoardings    — a few units past each byline, in the run-off;
         · the touchlines   — the same, down the two sides.

       Every one of them keeps a fraction of the pace and the rest is left in the
       bounce, so a rebound dies out instead of pinballing. OUT_PAD is how far
       into the run-off both the ball and the men chasing it may go: it is the
       same number for both, so a ball that leaves the pitch is always a ball
       somebody can be standing on.
       ---------------------------------------------------------------------- */
    const POST_R = 0.62;          // the post, as a radius on the canonical grid
    const OUT_PAD = 3.0;          // how far past a line the ball (and a man) may go
    const BOUNCE_POST = 0.52;     // pace kept off the woodwork
    const BOUNCE_NET = 0.28;      // pace kept off the back of the net
    const BOUNCE_BOARD = 0.40;    // pace kept off the hoardings and the touchlines
    const REBOUND_FLOOR = 7.0;    // and a rebound always comes back with THIS much
    const SPILL_DAMP = 0.62;      // pace a missed shot keeps as it spills into play
    /* §12.j — and the scramble. One man per kit used to go for a loose ball, which
       on a rebound reads as two players jogging at it while twelve stand and
       watch. The SECOND man of each kit goes too, provided he is genuinely in the
       race; and a keeper only ever races for a ball at his own end, because he is
       the one body on the pitch that must not be caught out of position. */
    const CHASE_SECOND = 26;      // the second man joins the race inside this
    const KEEPER_RACE_DIST = 14;  // and a keeper races only this far from his goal
    /* §12.b — how much of the kick a rolled pass has left when it resolves, and
       the mean speed that follows from it. Both are functions of the AIMED
       DISTANCE `d` in canonical units: the further the ball has to travel, the
       lower the fraction it dies to, which is the whole of "it loses its speed
       over distance". Each ball is still struck at the same speed for its power,
       so a long ball is quicker off the boot and slower into the target — it
       decelerates over more ground.

       These two functions are the ONLY place the profile's two ends are worked
       out. They are read by the roll in launchBall() and by the lead pass in
       leadSpot() — two places that have to agree, because a lead worked out from
       one average and a ball flown at another is a lead that is wrong by the
       difference. */
    function passArrivalFrac(d) {
        return PASS_SLOW + (PASS_SLOW_FAR - PASS_SLOW)
            * clamp(d / Math.max(1e-6, PASS_DECAY_DIST), 0, 1);
    }
    function passMeanSpeed(v0, d) {
        return v0 * (1 + passArrivalFrac(d)) * 0.5;
    }
    /* --- §12.d THE STROKE — the freehand line is the input, and its own two
       properties are the mechanic. Nothing else sets power, and nothing else
       decides whether the ball clears an outstretched leg:

         LENGTH is power.  A long stroke is a full-blooded kick, a short one is a
         nudge into feet. `pace` only rescales the SAME roll profile — v0 and the
         flight time are both multiplied by it — so a hard stroke is still the
         same shape of pass, just arriving sooner, and the "faster than a running
         man" guarantee that the whole profile exists to protect is preserved at
         every power level.

         LENGTH *and* CURVE is lift.  A long stroke that is also bent — path
         length ÷ straight-line chord — is a chip, and an outfielder CANNOT cut a
         ball in the air: `contestFlight` skips the outfield cut entirely for
         `ball.air`. The keeper is deliberately NOT exempt — pulling a chip out
         of the air inside his own reach is a catch, not a disruption. */
    const STROKE_MAX = 96;        // points kept per freehand stroke
    const STROKE_MIN = 10;        // shorter than this is a flick, and a flick is not a strike
    const POWER_LEN = 46;         // stroke length (canonical units) that reads as a full kick
    const AIR_LEN = 34;           // length at which a long stroke goes over the top
    const AIR_CURVE = 1.22;       // path ÷ chord that counts as a deliberate curve
    /* §12.d — and the SHOT rides the same dial. A shot used to be struck at
       exactly SHOT_SPEED whatever the gesture, so the one action where power
       reads most clearly was the one action the length of the line could not
       touch: a flick and a full-blooded swing left the boot at the same pace.
       `power` now travels on the plan beside the aim point, and a full-length
       line is struck SHOT_POWER_GAIN harder. A bare press — the SHOOT button,
       Space, S, a double-tap with no line — carries no power at all and is
       struck at exactly the rulebook speed, so nothing that was balanced
       against SHOT_SPEED has moved. Speed is also the ONLY thing this touches:
       launchBall() runs a shot down its drawn direction whatever speed it is
       given, so the line stays the line and the strike only decides how long
       the ball takes to travel it. */
    const SHOT_POWER_GAIN = 0.22;
    /* §12.h — AND A SHOT IS STRUCK HARDER THAN THE RULEBOOK, TOO. A bare press
       leaves the boot at SHOT_SPEED × STRIKE_GAIN = 44.8, and a full-length drawn
       line at 44.8 × 1.22 = 54.66 — about one and a half times the fastest pass in
       the game (30.0), which is what "extremely fast" has to mean on a board this
       size. Nothing in ./rules.js moves: SHOT_SPEED stays the rulebook number the
       28 property tests pin (`shot 28`), and stays the number the engine falls
       back on wherever a shot has no pace of its own. This is a strike multiplier
       applied at the boot, in shoot(), and nowhere else. */
    const STRIKE_GAIN = 1.6;
    /* --- §12.f THE BALL TRAVELS THE LINE THAT WAS DRAWN ---------------------
       A drawn pass goes straight down the drawn line, and two separate things
       used to pull it off that line.

         1. THE ANCHOR. The stroke was drawn from wherever the finger came down —
            the carrier's chest, usually — while the ball is struck from
            `ball.from`, which is wherever the BALL was sitting. Those are two
            different points a BALL_CARRY (1.15 units) apart, and the ball left
            along the line through the second one. So the line drawn on the grass
            and the line the ball took were parallel rather than the same line,
            which is exactly the "the ball did not follow my line" report.
            `ballPoint()` hands the gesture the ball's OWN position, so the stroke
            is anchored to the ball and the two cannot disagree.

         2. THE LIFT. A chip is a lie about height, not a trajectory. It used to
            be given a real arc of 2.1 units on a sine across the flight, and a
            sine is a BOW: the ball rose away from the drawn line and came back to
            it, so the line was only true at its two ends. The lift is now a flat
            hop of AIR_ARC with the flight time interpolated linearly, which keeps
            the ball on the drawn line on every frame in between. A chip is also
            struck from the SAME rolled profile as a ground pass — only 8% harder,
            via CHIP_GAIN — because the roll is what makes the ball, the flight
            time and the strike point all read the same distance. */
    const AIR_ARC = 0.30;         // the chip's whole lift: a visual "over the top"
    const CHIP_GAIN = 1.08;       // a chip is struck this much harder than a ground pass
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
    /* Six attacking lanes, one per outfielder. Slot `i` sits LANE_OFFSETS[i]
       across the pitch, LANE_DEPTHS[i] of the way back towards the side's own
       goal. Both tuples were four long, so with a fifth and sixth attacker the
       index wrapped and two men were sent to the same station — the same stacking
       bug the defender table below had. */
    const LANE_OFFSET = [-30, -14, 14, 30, -22, 22];
    const LANE_DEPTH = [0.55, 0.82, 0.62, 0.34, 0.40, 0.74];
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
        matchMode: 'quick',   // quick | shootout (for context-aware RESTART)
        pendingHalf: false,   // clock expired; wait for the ball to die
        difficulty: 0.75,     // CPU reading of the game, 0.35 Low, 0.75 Mid, 1.25 Hard, 1.85 Extreme
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
        tutorDone: false,
        firstHalfStoppage: 0
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
    /* the ground grew +10 m per side (76 × 113 → 96 × 133) so a phone in
       portrait keeps the whole touchline on screen with room to breathe.
       Every marking below is authored against PITCH_M, so the pitch stays
       dead centre of the bigger plane — only the run-off grows. */
    const GROUND_M = { x: 96, y: 133 };             // playing area + run-off
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
    /** Own-goal law: scoring is decided only by the net the ball entered. */
    const scorerForEnteredGoal = goal => (goal === GOAL.cpu ? 'cpu' : 'you');
    const targetEntersGoal = (target, goal) => !!target
        && isOnTarget(target.x, goal.x, GOAL_HALF_WIDTH)
        && (goal.y === 0 ? target.y <= 0 : target.y >= 100);
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
       screen-right is game-x compressed by KX — so a metre is UPM screen units
       in BOTH directions (MX × KX = UPM across, MY = UPM along). The ground plane
       is 96 m × 133 m, which is ±45.7 across and ±66.5 along once it is on
       screen; half a unit of slack keeps the plane's own edge from ever landing
       exactly on the canvas edge. (Reading the metres as game-x units and
       compressing by KX alone — the old reqHW — asked for only ±25.1 across,
       which is what let the touchlines run off the sides of a phone.) */
    /* §12.k — reqHW and reqHH frame the active match surface closely.
       In mobile portrait, reqHW fills the phone screen right to the touchlines
       so the playable pitch is maximally wide and tall without being cropped.
       reqHH is the other half of that bargain. Whenever the frame is wider than
       about 0.61 (which is every phone in portrait) the contain fit takes
       `hh = reqHH` outright, so the visible height is exactly 2 × reqHH units:
       the pitch claims 100 of them and the apron gets whatever is left. The only
       depth the ground owes behind a goal line is enough to show the net standing
       on it (≈ 3.6m). At 6.5m of hoarding reqHH was paying for air, and on a
       phone every unit of that air came straight off the pitch's height. */
    const reqHW = (PITCH_M.x / 2 + 0.6) * UPM;                   // ≈ 32.95 (touchlines at ~98% of width)
    const reqHH = (PITCH_M.y / 2 + 4) * UPM;                     // ≈ 53.81 (clear of the net behind each goal line)
    /* §10 — the shootout magnifies one end, so the view carries a zoom and a
       pan (in game-y units) on top of the contain fit. */
    const view = { hw: reqHW, hh: reqHH, zoom: 1, panY: 50 };

    let renderer;
    try {
        /* alpha:true, with a transparent clear colour below: the ground covers
           the canvas — the pitch plane, and the outfield behind it — so nothing
           is meant to show through. The page's own turf (#app / #stage in
           game.css, the recipe the main menu paints) is now only the floor of
           last resort for a frame the ground has not painted yet. */
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
        fail('WebGL is unavailable in this browser: ' + e.message);
        return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    /* Fully transparent clear. The grass fills the frame now — the pitch
       plane, and behind it the outfield from makeOutfieldTexture() — so the
       clear colour is only ever reached outside the ground, i.e. nowhere a
       camera fit can see. Left transparent (rather than filled with turf green)
       so that an early frame falls back to the page's own turf instead of to a
       flat colour. */
    renderer.setClearColor(0x0e2413, 0);

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

        /* No daylight fall-off. This border used to carry a 30% wash of
           rgba(2,16,8) so that the plane's outer 16–23 m settled into the darker
           backdrop it met there. The grass now continues past it (see
           makeOutfieldTexture), so the wash has nothing left to settle into and
           reads as a black rim drawn around the field. The wear pass below is
           the shading that stays: a scuffed goalmouth is turf, not a vignette,
           and it sits well inside the field. */

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
        circle(0, SPOT, 9.15, Math.PI / 2 - a, Math.PI / 2 + a);
        circle(0, -SPOT, 9.15, Math.PI * 1.5 - a, Math.PI * 1.5 + a);

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
            /* the netting starts just behind the line — the same offset the 3D
               frame carries — so the goal line, the posts and the net read as
               three layers instead of printing on top of each other */
            const back = 0.5;
            const yIn = side < 0 ? -GL - back : GL + back;
            const yOut = side < 0 ? -GL - back - depth : GL + back + depth;
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

        /* No edge feather. The border is painted like any other metre of
           run-off, which is all it needs to be: the outfield carries this
           texture's own base green, its 13.3 m cuts at this texture's mown
           phase, its blade strokes at the same density and its two lights, so
           the two surfaces are one. Erasing the border to alpha 0 would only
           undo that — destination-out leaves the colour multiplied by that
           alpha, and a transparent plane multiplies it again when it is drawn,
           which turns the fade into a soft black band. That band is a second
           dark ring around the field, and the fix for it is to not need a fade
           at all. */

        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
        return tex;
    }

    /* --- the outfield: the pitch's own grass, carried across the whole screen --
       The pitch plane is only 96 × 133 m of the world, and everything outside it
       used to be the renderer's clear colour — the page's CSS turf, which is a
       darker, diagonally-banded backdrop that reads as a different surface. This
       plane lays the pitch's surface over the rest of the canvas instead, so the
       frame is grass edge to edge and it is the markings, not a colour change,
       that say where the pitch is.

       It is drawn from the pitch's recipe — the same base green, the same mown
       cut in the same lighter green, the same blade strokes at the same alpha and
       the same blades per square metre — and lit by the same hemisphere + key
       lights, so the two surfaces do not merely abut; they are one surface.

       Three details are what make them agree instead of nearly agree:
         • The cut. A mown cut is GROUND_M.y / 10 = 13.3 m and the tile is ten of
           them (133 m), so the pattern closes on itself every repeat — ten is
           even, which is what lets the light/dark parity survive the wrap. Bands
           are lit by the pitch's rule, "cut k, counted from the halfway line, is
           lighter when k is even", and the plane carries an even number of tiles
           centred on the world origin, so cut 0 sits on the tile's own edge and
           the mowing runs straight through the plane's boundary instead of
           stepping half a cut at it.
         • The scale. 2048 px over 133 m is 15.4 px per metre against the pitch's
           15 — 2.6% out, which is invisible at 16% alpha — and a power of two, so
           mipmaps and RepeatWrapping are safe on every renderer.
         • The seam. Any blade stroke crossing an edge is stamped again on the far
           side, so the tile is genuinely seamless and not merely close.
       No wear, no markings and no fall-off here: the only thing that separates
       the painted field from the plain grass around it is the paint on it — the
       lines, the arcs, the nets and the goalmouth scuff. */
    const OUTFIELD_TILE_M = GROUND_M.y;                     // 133 m — ten mown cuts
    const OUTFIELD_TILES = 8;                               // even, so a tile edge lands on m = 0
    const OUTFIELD_M = OUTFIELD_TILE_M * OUTFIELD_TILES;    // 1064 m — ±532 m of grass

    function makeOutfieldTexture(px) {
        const M = px / OUTFIELD_TILE_M;          // pixels per metre (~15.4)
        const U = M * PITCH_M.y / 100;           // pixels per canonical game unit
        const c = document.createElement('canvas');
        c.width = px; c.height = px;
        const g = c.getContext('2d');

        /* turf — the pitch's two greens, unmixed */
        g.fillStyle = '#1e4726';
        g.fillRect(0, 0, px, px);
        g.fillStyle = '#245229';
        const band = GROUND_M.y / 10;             // 13.3 m — the pitch's cut width
        const cuts = OUTFIELD_TILE_M / band;      // 10 — even, so the wrap keeps parity
        /* the cut the tile's -m edge sits on, measured in cuts from the halfway
           line; the loop then lights the same cuts the pitch lights, so a band
           that is lighter on the field is lighter the whole way up the screen */
        const firstCut = -Math.round(OUTFIELD_M / 2 / band);
        for (let j = 0; j < cuts; j++) {
            if ((firstCut + j) % 2 !== 0) continue;
            /* three.js flips a canvas texture's Y, so canvas row 0 is the tile's
               +m edge and cut j is measured up from the bottom of the canvas */
            g.fillRect(0, px - (j + 1) * band * M, px, band * M + 0.5);
        }

        /* blades — same strokes, same weight, same density as the pitch's (4600
           of them over 96 × 133 m). A stroke that runs off an edge is drawn again
           on the far side, which is the whole of the seamlessness. */
        const seg = (x0, y0, x1, y1) => {
            g.beginPath();
            g.moveTo(x0, y0);
            g.lineTo(x1, y1);
            g.stroke();
        };
        g.save();
        g.globalAlpha = .16;
        g.lineWidth = 1;
        const blades = Math.round(4600 * OUTFIELD_TILE_M / GROUND_M.x);   // ≈ 6373
        for (let i = 0; i < blades; i++) {
            const x = Math.random() * px, y = Math.random() * px;
            const x2 = x + (Math.random() - .5) * 1.8 * U;
            const y2 = y - (1.2 + Math.random() * 3.4) * U;
            g.strokeStyle = Math.random() < .52 ? '#2f6234' : '#173a1e';
            const xs = [0], ys = [0];
            if (Math.min(x, x2) < 0) xs.push(px);
            if (Math.max(x, x2) > px) xs.push(-px);
            if (Math.min(y, y2) < 0) ys.push(px);
            if (Math.max(y, y2) > px) ys.push(-px);
            for (const ox of xs) for (const oy of ys) seg(x + ox, y + oy, x2 + ox, y2 + oy);
        }
        g.restore();

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        /* one repeat per tile: the plane is an even number of 133 m tiles, so the
           world origin — the halfway line, and the pitch texture's own phase — is
           a tile boundary and the two surfaces share one mown pattern */
        tex.repeat.set(OUTFIELD_TILES, OUTFIELD_TILES);
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
        return tex;
    }

    /* the ground: a plane carrying the 2D top-view artwork. Its dimensions are
       the run-off figure in metres converted to world units, so the plane and the
       texture share one scale and the pitch is a true 105 × 68 m. */
    const pitchPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(GROUND_M.x * UPM, GROUND_M.y * UPM * ZSTRETCH),
        /* 15 px per metre of ground held constant: 15 × 133 = 1995. Opaque — the
           artwork is painted right out to the plane's border and the outfield
           carries it on from there, so there is no fade left to blend and no
           transparent pass to sort. */
        new THREE.MeshLambertMaterial({ map: makePitchTexture(1995) })
    );
    pitchPlane.rotation.x = -Math.PI / 2;
    pitchPlane.position.y = 0;
    scene.add(pitchPlane);

    /* the outfield: the same grass, filling the rest of the frame. Sized in whole
       tiles so the mown phase stays anchored to the world origin, and set a hair
       under the pitch plane so the pitch's artwork always wins the depth test and
       this surface is only ever seen beyond the plane's border. */
    const outfield = new THREE.Mesh(
        new THREE.PlaneGeometry(OUTFIELD_M * UPM, OUTFIELD_M * UPM * ZSTRETCH),
        new THREE.MeshLambertMaterial({ map: makeOutfieldTexture(2048) })
    );
    outfield.rotation.x = -Math.PI / 2;
    outfield.position.y = -0.06;
    scene.add(outfield);

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
        /* the frame stands a touch BEHIND the painted goal line, so the line,
           the posts and the netting are three separate layers on the eye */
        const off = 0.5;
        const zLine = worldZ(gy + (gy >= 50 ? off : -off));
        const zBack = worldZ(gy + (gy >= 50 ? off + depth : -(off + depth)));
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
            dive: null,          // keeper only: active in-flight dive target
            queuedDive: null,    // keeper only: user-queued dive target waiting for shot
            /* Standardized base speed for all players */
            speed: PLAYER_SPEED
        };
        mesh.position.set(worldX(p.x), 0, worldZ(p.y));
        allPlayers.push(p);
        playersById[p.id] = p;
        return p;
    }

    /* §2 — 6 outfield + 1 keeper per team (seven a side). The keeper is always
       the *last* number, so the engine can reach both of them by id (`you7`,
       `cpu7`) without ever looking them up by role. Everything downstream —
       teamOutfield(), the planners, the shootout rotation — is written over
       arrays, so the squad size lives in exactly these five lines. */
    for (let i = 1; i <= 6; i++) spawnPlayer('you', 'outfield', i);
    spawnPlayer('you', 'keeper', 7);
    for (let i = 1; i <= 6; i++) spawnPlayer('cpu', 'outfield', i);
    spawnPlayer('cpu', 'keeper', 7);

    const teamPlayers = team => allPlayers.filter(p => p.team === team);
    const teamOutfield = team => allPlayers.filter(p => p.team === team && p.role === 'outfield');
    const keeperOf = team => playersById[team + '7'];

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
                    if (!a.dive) { a.x = clamp(a.x - px, -OUT_PAD, 100 + OUT_PAD); a.y = clamp(a.y - py, -OUT_PAD, 100 + OUT_PAD); }
                    if (!b.dive) { b.x = clamp(b.x + px, -OUT_PAD, 100 + OUT_PAD); b.y = clamp(b.y + py, -OUT_PAD, 100 + OUT_PAD); }
                    continue;
                }
                const push = Math.min((SEPARATE_R - d) * 0.5, maxPush);
                const ux = dx / d, uy = dy / d;
                /* §12.j — the same bounds moveToward() allows: a man chasing a
                   ball into the run-off must not be snapped back onto the pitch
                   by a separation shove. */
                if (!a.dive) { a.x = clamp(a.x - ux * push, -OUT_PAD, 100 + OUT_PAD); a.y = clamp(a.y - uy * push, -OUT_PAD, 100 + OUT_PAD); }
                if (!b.dive) { b.x = clamp(b.x + ux * push, -OUT_PAD, 100 + OUT_PAD); b.y = clamp(b.y + uy * push, -OUT_PAD, 100 + OUT_PAD); }
            }
        }
    }

    function syncToMesh(p) {
        p.mesh.position.set(worldX(p.x), p.mesh.position.y, worldZ(p.y));
        p.ring.position.set(worldX(p.x), 0.06, worldZ(p.y));
        p.shadow.position.set(worldX(p.x), 0.03, worldZ(p.y));
    }

    /** Facing + run cycle (legs/arms swing, slight bob), and the keeper's dive.

       The dive is a POSE, not a second animation system: it is lerped in and out
       of exactly the run pose below, by one eased weight (`p.diveAmt`). It rides
       the same `k.dive` target the keeper is already running at, so there is
       nothing new to keep in sync — the body reaches for the ball it was told to
       go and get, and the reach stays honest because the arms end up where the
       ball is. A dive that has finished, or was never ordered, eases back to the
       run pose and leaves no trace: juice returns to rest. */
    function animatePlayer(p, dt) {
        const dx = p.x - p.px, dy = p.y - p.py;
        p.px = p.x; p.py = p.y;
        const sp = Math.hypot(dx, dy) / Math.max(dt, 1e-3);
        const f = clamp(sp / PLAYER_SPEED, 0, 1);
        /* The gait is EASED towards the current pace instead of being read
           straight off it. Read straight off it, a hard start or a hard stop
           snapped the limbs to full swing and back inside one frame, and a body
           shoved by the separation pass flickered as its speed spiked. Ramping
           the cycle in and out makes a player accelerate into a run and settle
           out of one, which is most of what "smooth" means for a run. */
        const g0 = p.gait || 0;
        p.gait = g0 + (f - g0) * Math.min(1, dt * 10);
        const g = p.gait;
        p.walk += sp * dt * 0.22;
        const s = Math.sin(p.walk * 6) * .85 * g;
        const L = p.mesh.userData.limbs;

        /* --- the dive weight, and the direction it was ORDERED in -----------
           `k.dive` is re-writable for the whole flight, and once he has arrived
           it is still set — so reading it fresh every frame would let a keeper
           who is already there take a new heading off his own approach vector
           and flicker mid-dive. The direction is captured once, when the dive
           begins, and held for as long as the weight is up. */
        const diveAmt0 = p.diveAmt || 0;
        if (p.dive) {
            if (p.diveRef !== p.dive) {
                p.diveRef = p.dive;
                const vx = p.dive.x - (p.x - dx);
                const vy = p.dive.y - (p.y - dy);
                const vl = Math.hypot(vx, vy);
                if (vl > 1e-4) { p.diveDx = vx / vl; p.diveDy = vy / vl; }
                else { p.diveDx = 0; p.diveDy = attackSide(p.team); }
            }
            p.diveAmt = diveAmt0 + (1 - diveAmt0) * Math.min(1, dt * 9);
        } else {
            p.diveRef = null;
            p.diveAmt = diveAmt0 * Math.max(0, 1 - dt * 7);
        }
        const da = p.diveAmt;
        const ddx = p.diveDx !== undefined ? p.diveDx : 0;
        const ddy = p.diveDy !== undefined ? p.diveDy : attackSide(p.team);

        /* and the facing follows the run from the first step, not from 0.6 u/s:
           a player setting off used to walk sideways-on for several frames
           before the yaw gate opened, then swivel late. A DIVING keeper is the
           exception: he is squared back up to his own goal line while the dive
           is up, because the roll below is applied about his local z and a body
           turned side-on would somersault instead of dive. */
        if (sp > .25 || da > .35) {
            const target = da > .35 ? (p.team === 'you' ? Math.PI : 0) : Math.atan2(dx, -dy);
            let d = target - p.yaw;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            p.yaw += d * Math.min(1, dt * 9);
        }
        p.mesh.rotation.y = p.yaw;

        /* --- blend the run pose into the dive pose --------------------------
           Every channel is the run value plus `da` of the way to a dive value,
           so the two poses cannot fight: at da = 0 this is byte-for-byte the old
           run cycle, and at da = 1 it is a body laid out flat with both arms
           reaching toward the ball it was sent for. */
        const runY = Math.abs(Math.sin(p.walk * 6)) * .13 * g;
        if (da <= 1e-4) {
            L.legL.rotation.x = s; L.legR.rotation.x = -s;
            L.armL.rotation.x = -s * .8; L.armR.rotation.x = s * .8;
            L.sleeveL.rotation.x = -s * .8; L.sleeveR.rotation.x = s * .8;
            p.mesh.position.y = runY;
            p.mesh.rotation.z = 0;
        } else {
            /* How much of the dive is to the keeper's LEFT or RIGHT. The body
               rolls only as far as the dive is actually lateral — a dive down
               the middle stays upright and reaches straight down the pitch —
               and `lat` is the honest ball-side component of the dive vector,
               nothing invented and nothing random. */
            const lat = clamp(Math.abs(ddx), 0, 1);
            const dir = ddx >= 0 ? 1 : -1;
            const l = da;
            L.legL.rotation.x = s * (1 - l) + (-.34 - .24 * lat) * l;
            L.legR.rotation.x = -s * (1 - l) + (.58 + .24 * lat) * l;
            L.armL.rotation.x = -s * .8 * (1 - l) + (-2.52 - .26 * lat) * l;
            L.armR.rotation.x = s * .8 * (1 - l) + (-2.34 + .16 * lat) * l;
            /* the forearms straighten as he reaches, and tuck back as the dive
               is picked up again */
            L.sleeveL.rotation.x = -s * .8 * (1 - l) + (-.5 * (1 - da)) * l;
            L.sleeveR.rotation.x = s * .8 * (1 - l) + (-.5 * (1 - da)) * l;
            /* up off the ground at the top of the dive, back down as it decays */
            p.mesh.position.y = runY * (1 - l) + 0.62 * Math.sin(Math.PI * clamp(da, 0, 1)) * l;
            /* the two kits are modelled facing opposite ways, so the same world
               direction is the opposite sign of roll for each of them. The head
               must lead the dive: diving right (dir=1) rolls right, diving left
               (dir=-1) rolls left. */
            const rollSign = p.team === 'you' ? 1.15 : -1.15;
            p.mesh.rotation.z = dir * lat * rollSign * da;
        }
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
        /* §0.c — the pace dial, applied at the single point where a body is
           actually stepped. Every caller passes a speed the rulebook owns; this
           is the one place allowed to shave it, so no two movers can drift
           apart and no rulebook number has to be edited to slow the board. */
        const step = Math.min(speed * RUN_SCALE * dt, d);
        /* §12.j — the backstop is the RUN-OFF, not the painted pitch. It used to
           be 3…97, which is inside the touchline: a ball that had run out of play
           sat at a spot no body was allowed to stand on, so the only way it could
           ever come back was for somebody to be awarded it. Every station this
           engine computes is clamped well inside the lines by its own caller, so
           the only movers this widening reaches are the two it is for — a man
           chasing a loose ball, and a keeper coming out for one. */
        p.x = clamp(p.x + dx / d * step, -OUT_PAD, 100 + OUT_PAD);
        p.y = clamp(p.y + dy / d * step, -OUT_PAD, 100 + OUT_PAD);
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
        arc: ARC_PASS, air: false, alive: false,   // §12.d `air` = uncuttable in flight
        passTarget: null, lastTouch: null,
        /* §12.b — the carry direction is EASED, never snapped (see stepBall).
           A persistent unit vector, settled by the collapse guard on the first
           frame the ball is held, so it is always a real direction by the time
           anybody reads it. */
        cdx: 0, cdy: 0
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
        /* §12.d — an air ball is a different thing in flight, not a different
           kick: a man cannot get his feet to it, so nothing outfield can cut it. */
        ball.air = o.air === true;
        ball.s0 = speed;
        ball.s = speed;
        ball.t = 0;
        ball.travel = 0;
        ball.target = { x: to.x, y: to.y };
        /* A shot is a strike and keeps its constant speed — and §12.h strikes it
           at SHOT_SPEED × STRIKE_GAIN in shoot(), so it now leaves the boot well
           clear of any pass in the game. It must stay constant through the flight:
           shotOutcome() races the keeper against one straight line at one pace, so
           a shot that slowed here would break the save, not just the look.

           A pass is rolled, and the roll is derived backwards from the single
           requirement that is about the rules rather than the look: THE BALL HAS
           TO BE FASTER THAN A RUNNING MAN UNTIL THE MOMENT IT RESOLVES. So the
           KICK speed is fixed first — PASS_PACE·BALL_SPEED, 30.0, a firmly struck
           pass — and `dec` is then chosen so that the ball has died to the
           distance's own fraction of that kick by the time it reaches PASS_REACH
           of the aimed distance — PASS_SLOW into feet, falling to PASS_SLOW_FAR
           over PASS_DECAY_DIST, so the further a ball is sent the more of its
           pace it has lost when it gets there. Total time is the mean of the two
           speeds. Pass the `speed` argument in and it is ignored for a roll: the
           profile is the profile. */
        if (ball.roll) {
            /* §12.d — `pace` is the stroke's length, mapped across PACE_MIN…PACE_MAX
               of a standard kick. It multiplies BOTH the launch speed and the mean
               speed the flight time is solved from, which is the only way to add
               power without changing the arrival fraction: `pace` scales both
               ends of the roll and `dec` together, so a harder-struck ball still
               dies to the SAME distance-determined fraction — the rule about
               being quicker than a runner holds at every power level, and power
               buys speed on the way there rather than a slower death. The span is
               what makes the ball answer the drawn line: a short flick is the
               floor, and a line drawn the full length of the pitch is the ceiling
               — a good half again as quick.
               §12.f — a chip rides this same profile, only CHIP_GAIN harder, so
               a lofted ball is still a ball that arrives on the drawn point. */
            const base = o.pace === undefined
                ? 1
                : PACE_MIN + (PACE_MAX - PACE_MIN) * clamp(o.pace, 0, 1);
            const pace = base * (ball.air ? CHIP_GAIN : 1);
            const v0 = BALL_SPEED * PASS_PACE * pace;
            ball.s0 = ball.s = ball.speed = v0;
            /* §12.b — the flight time is the aimed distance over the roll's own
               MEAN speed (the kick and the arrival speed, averaged), and `dec` is
               solved from the same two ends. Distance enters twice — through the
               fraction it dies to and through the mean the time is solved from —
               which is what makes a long ball both slower at the end AND slower
               on average, while still covering exactly the drawn distance. */
            const r = passArrivalFrac(d);
            ball.total = PASS_REACH * d / Math.max(1e-6, passMeanSpeed(v0, d));
            ball.dec = v0 * (1 - r) / Math.max(1e-6, ball.total);
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

    /* --- §8.b the run paths --------------------------------------------------
       Every queued run keeps its line on the grass: the straight move the
       player will actually take, drawn from where he stands to where he is
       going. One pooled LineSegments object carries them all — RUN_PATH_MAX
       segments, a preallocated dynamic buffer, one draw call for any number of
       runs — and it is rebuilt from the SAME queued points the rings above sit
       on, so a path and its ring can never disagree about where a man was
       sent. Nothing here is allocated mid-gesture. */
    const RUN_PATH_MAX = 16;
    const runPathsGeo = new THREE.BufferGeometry();
    const runPathsAttr = new THREE.BufferAttribute(new Float32Array(RUN_PATH_MAX * 6), 3);
    runPathsAttr.setUsage(THREE.DynamicDrawUsage);
    runPathsGeo.setAttribute('position', runPathsAttr);
    runPathsGeo.setDrawRange(0, 0);
    const runPaths = new THREE.LineSegments(runPathsGeo,
        new THREE.LineBasicMaterial({ color: COL.aim, transparent: true, opacity: .5 }));
    runPaths.frustumCulled = false;
    runPaths.visible = false;
    scene.add(runPaths);

    /* --- §8.c the freehand stroke (§12.d) -----------------------------------
       groundLine() can only ever draw two points, and a second point is exactly
       what a curve is not. A stroke is an arbitrary polyline across the turf:
       the gesture's own path, kept and shown back to the player point for point,
       so the line on the grass IS the line under the finger. The buffer is
       preallocated at STROKE_MAX — the cap on how many points a gesture keeps —
       and only the used prefix is drawn, so nothing is allocated mid-drag.
       frustumCulled is off because the bounds are rewritten while the line is
       being drawn, and a stroke that blinked out for a frame because its cached
       bounds were stale would be the most confusing thing on the screen. */
    function freeLine(color) {
        const n = STROKE_MAX;
        const geo = new THREE.BufferGeometry();
        const arr = new Float32Array(n * 3);
        const attr = new THREE.BufferAttribute(arr, 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', attr);
        geo.setDrawRange(0, 0);
        const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .95 }));
        m.frustumCulled = false;
        m.visible = false;
        scene.add(m);
        /* y is fixed: every one of these lines is painted on the turf, at the
           same height the other guides use */
        m.setPoints = pts => {
            const used = Math.min(n, pts.length);
            for (let i = 0; i < used; i++) {
                arr[i * 3] = worldX(pts[i].x);
                arr[i * 3 + 1] = .1;
                arr[i * 3 + 2] = worldZ(pts[i].y);
            }
            geo.setDrawRange(0, used);
            attr.needsUpdate = true;
            geo.computeBoundingSphere();
        };
        return m;
    }
    /* the three strokes a window can show: the one under your finger, the pass
       you have already drawn, and the carrier's own run */
    const strokeLine = freeLine(COL.aim);
    const passCurve = freeLine(COL.aim);
    const moveCurve = freeLine(COL.ghost);

    /* --- §8.d the drawn plan ------------------------------------------------
       §12.d gives the man on the ball TWO lines, drawn one after the other: the
       first is the ball (the point you are passing to, or the angle you will
       shoot along), the second is his own run once the ball has gone. A third
       line means he has changed his mind, so it wipes both and starts again.

       `slot` is which line the NEXT stroke will be. All of this lives and dies
       with the window: clearIntents() resets it, so a new possession, a spilled
       pass and a closed window each start from a clean sheet. */
    const AIM = { slot: 1, pass: null, move: null };

    function aimReset() {
        AIM.slot = 1; AIM.pass = null; AIM.move = null;
        strokeLine.visible = false;
        passCurve.visible = false;
        moveCurve.visible = false;
    }

    /* --- the two properties of a stroke, and the two mechanics they drive --- */
    function pathLength(pts) {
        let l = 0;
        for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        return l;
    }
    function pathChord(pts) {
        if (pts.length < 2) return 0;
        const a = pts[0], b = pts[pts.length - 1];
        return Math.hypot(b.x - a.x, b.y - a.y);
    }
    /** §12.d — length is power: a nudge into feet at 0, a full kick at POWER_LEN. */
    function strokePower(len) {
        return clamp((len - STROKE_MIN) / Math.max(1, POWER_LEN - STROKE_MIN), 0, 1);
    }
    /** §12.d — air is length AND curve, because that is what was asked for: a
        stroke that is merely long, or merely bent, stays on the deck. */
    function strokeIsAir(len, chord) {
        if (len < AIR_LEN) return false;
        return chord < 1e-3 || len / chord >= AIR_CURVE;
    }
    /** Build the finished stroke that a gesture hands to the plan. */
    function readStroke(pts) {
        const len = pathLength(pts);
        const chord = pathChord(pts);
        return {
            pts, len, chord,
            end: pts[pts.length - 1],
            power: strokePower(len),
            air: strokeIsAir(len, chord)
        };
    }

    /* --- §8.e SHOT LINE — where a drawn angle crosses the goal line --------
       The angle the player draws is the angle the ball is struck along, so the
       shot target is simply where that ray meets the byline the goal stands on.
       That is what makes "fire along the drawn angle" mean something: draw at
       the near post and it goes to the near post; draw across the face and it
       misses the far side. A ray drawn the WRONG WAY, or one so square that it
       would cross the byline off the pitch, has no goal-line answer and hands
       back null — the caller then falls back to the middle of the goal. */
    function shotTargetFor(from, end) {
        const goal = PLAY ? PLAY.goal : null;
        if (!goal || !from || !end) return null;
        const dy = end.y - from.y;
        if (Math.abs(dy) < 0.5) return null;      // drawn square across the pitch
        const t = (goal.y - from.y) / dy;
        if (!(t > 0)) return null;                // drawn away from the goal
        const x = from.x + (end.x - from.x) * t;
        if (!Number.isFinite(x) || x < -8 || x > 108) return null;
        /* §12.f — the UNCLAMPED crossing. Clamping the byline point into the turf
           used to pull a near-corner strike back off the ray the player drew; the
           ball now meets the byline exactly where the line crosses it, and a line
           that crosses outside the frame is honestly wide. */
        return { x, y: goal.y };
    }

    /* The longest drawn line still read as an aim, and how many SHOT_RANGEs of
       the drawn direction may be carried out to the byline. Both are deliberate:
       a line the width of the board is a pass, not an aim, and a line that only
       meets the byline two hundred units from the boot is a pass as well. */
    const DRAWN_RAY_MAX = SHOT_RANGE * 4;
    const SHOT_RAY_STRETCH = 2;

    /** §12.f/§12.g — the shot the player has drawn, under EVERY condition. The
        ray is taken from the BALL's own position, which is where shoot() strikes
        it from, so the angle that was drawn and the angle the ball leaves along
        are the same angle.

        shotTargetFor() above is the STRICT reading: it hands back null the moment
        the drawn angle has no answer on the goal line — square across the pitch,
        drawn backwards, or crossing a byline off the frame. That null is
        load-bearing in onUp(), where "no goal-line answer" is exactly what makes
        a drag a PASS, so it must stay strict. But the explicit shot path must not
        substitute a line the player never drew, and it used to: a null made
        queueShot() fall back to a keeper-aware post — a line that appeared on the
        grass by itself, and a ball that left along something nobody drew.

        This is the other reading, used ONLY by queueShot() and beginExecution():
        aim strictly when the line has a goal-line answer, and when it has none,
        strike the drawn END POINT itself. Either way the ball flies down the
        drawn ray — the fallback is the end of the line, never a point beside it.
        Null is returned only when there is no line at all, which is the one case
        the keeper-aware post is still allowed to answer. */
    function drawnShotRay() {
        if (!AIM.pass) return null;
        const from = ballPoint(), end = AIM.pass.end;
        const strict = shotTargetFor(from, end);
        if (strict) return strict;
        const goal = PLAY ? PLAY.goal : null;
        if (!goal || !from || !end) return null;
        const dx = end.x - from.x, dy = end.y - from.y;
        const len = Math.hypot(dx, dy);
        /* a press with no line behind it, or a line the width of the board:
           neither is an aim, and both leave the old fallback in place */
        if (len < 1e-6 || len > DRAWN_RAY_MAX) return null;
        /* The drawn direction, carried out to the byline and then no further than
           SHOT_RAY_STRETCH × SHOT_RANGE — a square or backwards line needs the
           stretch, and the cap stops it becoming an aim at a corner flag. Past
           the cap the drawn END is the answer, because that point is on the line
           by definition. */
        const gy = goal.y - from.y;
        if (Math.abs(dy) > 1e-6) {
            const k = gy / dy;
            if (k > 0 && k <= SHOT_RAY_STRETCH) {
                const x = from.x + dx * k;
                if (Number.isFinite(x)) return { x, y: goal.y };
            }
        }
        return { x: end.x, y: end.y };
    }

    function hideQueueMarkers() {
        queueRings.forEach(m => { m.visible = false; });
        queueLine.visible = false;
        runPaths.visible = false;
    }

    /** Drop every stacked move, and every line that was drawn for them. Called
        whenever a window opens, closes, or a ball spills loose. */
    function clearIntents() {
        allPlayers.forEach(p => { p.queued = null; });
        hideQueueMarkers();
        aimReset();
    }

    /** Draw the stack: a ring where each of the human's players will end up, and
        the line of the queued ball when the human is the side in possession. */
    function drawQueueMarkers() {
        if (SO.active || !PLAN || PLAN.armed) { hideQueueMarkers(); return; }
        let n = 0, rn = 0;
        allPlayers.forEach(p => {
            if (p.team !== 'you' || !p.queued || !queueRings[n]) return;
            const m = queueRings[n++];
            m.visible = true;
            m.position.set(worldX(p.queued.x), 0.09, worldZ(p.queued.y));
            /* §8.b — and the run's path, replacing the freehand stroke on
               release: the straight move he will take, written into the
               shared buffer beside the ring that marks its end. */
            if (rn < RUN_PATH_MAX) {
                const o = rn++ * 6;
                runPathsAttr.array[o] = worldX(p.x);
                runPathsAttr.array[o + 1] = .1;
                runPathsAttr.array[o + 2] = worldZ(p.y);
                runPathsAttr.array[o + 3] = worldX(p.queued.x);
                runPathsAttr.array[o + 4] = .1;
                runPathsAttr.array[o + 5] = worldZ(p.queued.y);
            }
        });
        for (let i = n; i < queueRings.length; i++) queueRings[i].visible = false;
        runPathsGeo.setDrawRange(0, rn * 2);
        runPathsAttr.needsUpdate = true;
        runPaths.visible = rn > 0;

        const c = PLAY && PLAY.carrier;
        const move = PLAN.atk === 'you' ? (PLAN.shot.you || PLAN.pass.you) : null;
        if (c && move && move.x !== undefined) {
            /* §12.c — the preview line ends on the ball's actual destination, and
               the ball's destination is this bare point. It used to be previewed
               at the receiver's queued run while the ball itself went even
               further, to that receiver's live position: three places at once.
               One point, one line, one ball.
               §12.f — and it STARTS on the ball, because that is where the ball
               will be struck from. A preview drawn from the carrier's feet would
               promise a line the ball is not going to take. */
            queueLine.visible = true;
            queueLine.setEnds(ballPoint(), move);
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

    /** §12.c — where a receiver will actually BE when the pass to `dest` arrives.

        The ball is quicker than a man — that is the whole point of §12.b — so a
        ball aimed at a runner's DESTINATION always beats him to it, and it ends
        up sitting at a spot the receiver has not reached yet. That is harmless
        when the aim is a line the human drew, because he drew it and he can see
        where it goes, and
        it is exactly what "the ball rolls and the player runs onto it" means.
        It is not harmless for the CPU, which picks a spot and then has to live
        with it: the ball would land in the gap with only the defender who read
        the lane anywhere near it.

        So the CPU aims where the receiver will be at the moment of arrival.
        Two rounds of the arithmetic, because the flight time depends on where the
        ball is aimed and the aim depends on the flight time — one correction
        brings the error to well under a tenth of a unit, far inside
        CATCH_RADIUS. The run is capped at the distance to his destination, so
        this leads a man to the spot he was sent to and never beyond it. */
    function leadSpot(from, mate, dest) {
        /* §12.f — the flight time is measured from where the ball will actually
           be STRUCK FROM, which is the ball's own position, not the carrier's
           centre. passTo() launches from kickFrom(from) too, so the lead the CPU
           computes and the ball it gets are worked out from the same point. */
        const o = kickFrom(from);
        let aim = { x: dest.x, y: dest.y };
        for (let k = 0; k < 2; k++) {
            /* §12.b — the flight time comes from the roll's OWN mean speed, read
               from the same function `launchBall` builds the roll from, so a lead
               and the ball it is waiting for cannot disagree. A long ball's mean
               is lower, so the receiver is led further: he has longer to run
               before it arrives. */
            const dd = Math.max(1e-6, dist(o, aim));
            const t = dd / Math.max(1e-6, passMeanSpeed(BALL_SPEED * PASS_PACE, dd));
            const run = Math.min(PLAYER_SPEED * t, dist(mate, dest));
            const d = unit(dest.x - mate.x, dest.y - mate.y);
            aim = { x: mate.x + d.x * run, y: mate.y + d.y * run };
        }
        return { x: clamp(aim.x, 4, 96), y: clamp(aim.y, 4, 96) };
    }

    /* SIX distinct defender slots, not three. The old table was `i % 3`, so with
       five outfielders defenders 0 & 3 shared a spot and 1 & 4 shared another —
       two players were drawn exactly on top of each other, which is why a
       defending team never read as its full complement: you could only ever see
       three distinct outfielders plus the keeper. Every slot below differs from
       every other in BOTH depth and width, and the deepest sits at 0.68 so it
       stays clear of the keeper's line (an earlier deepest slot landed on top of
       the keeper — a fourth instance of the same stacking bug). The sixth slot
       arrived with the seventh player: six outfielders, six stations, and no two
       of them ever sharing one. */
    const DEF_SPREAD = [-24, -12, 12, 24, 0, -36];
    const DEF_DEPTH = [0.34, 0.52, 0.52, 0.34, 0.68, 0.28];

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

    /** §0.d — a ball in flight that is heading into this keeper's own mouth.

        Returns the x at which the ball's line will cross the keeper's working
        line (his standing y), or null when the ball is no threat to his goal:
        not a pass in flight, moving away from his end, or passing wide of a
        post. It reads the BALL's own line — `from` and `dir`, which a rolled
        pass keeps for the whole of its travel — so it is the same line the
        player sees drawn on the grass and not a guess at where the ball is
        going. Used by updateKeeper() to send him across, and by the claim in
        contestFlight() to let him go for a ball chipped over his line. */
    function keeperThreatX(k) {
        if (!k || !ball.alive || ball.mode !== 'pass') return null;
        const from = ball.from, dir = ball.dir;
        if (!from || !dir || Math.abs(dir.y) < 1e-6) return null;
        const home = keeperHome(k.team);
        const t = (home.y - from.y) / dir.y;   // when it reaches his line
        if (t <= 0) return null;               // behind him, or moving away
        const x = from.x + dir.x * t;
        const gx = ownGoal(k.team).x;
        if (Math.abs(x - gx) > GOAL_HALF_WIDTH) return null;   // wide of the mouth
        return x;
    }

    /** Where a defender must be to meet a pass at the earliest possible moment.
       §12.b — the race is run with the contact radius, not the rulebook's
       collection radius, so the point he is sent to is a point where he can
       actually TOUCH the ball rather than one where he can be near it. A
       smaller radius can make the race unwinnable where it used to be nominally
       winnable, and the midpoint fallback below is a perfectly good place for a
       defender whose job is to get in the way. */
    function interceptTarget(P, from, to) {
        const t = interceptionTime(P, from, to, { radius: TOUCH_R });
        if (!Number.isFinite(t)) {
            /* Unwinnable on the ground: fall back to the midpoint of the lane,
               which is still a useful "get in the way" position. */
            return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
        }
        return pointAlong(from, to, BALL_SPEED, t);
    }

    /** §12.e — where a defender presses when it CANNOT read the human's plan.

       This is the whole of the "the AI must not know my moves" change, in one
       function. The defending side used to aim at `PLAY.threat` — and
       `cpuThreat()` was "the receiver closest to the goal being attacked",
       which, whenever the HUMAN was in possession, was one of the HUMAN's own
       players. The CPU was pressing a man only the human had chosen to send,
       because the human had told it so: the plan leaked straight out through
       the defender's target and the AI looked psychic. `threat` is gone and
       there is nothing to read in its place.

       What is left is honest geometry and nothing else. `mine` is the defender's
       own goal — the one he is defending, which is the one piece of information
       a defender genuinely has from watching the ball. A body standing still on
       the ball gives `from === to`, which is degenerate: interceptionTime()
       cannot solve a race to where the ball already is, and the old code leaned
       on its midpoint fallback. Stepping the target a little way from the
       carrier towards the defender's own goal does the same job without relying
       on the fallback, and it has the right shape: stand between the man and
       the goal you are defending. */
    function pressPoint(from, mine) {
        if (!from) return mine;
        return { x: lerp(from.x, mine.x, 0.08), y: lerp(from.y, mine.y, 0.08) };
    }

    /** §12.f — where the ball actually is, which is where a kick is struck from.
        A carried ball rides at BALL_CARRY in front of the carrier's boot (see
        stepBall), so this is NOT the carrier's position: it is a body-width ahead
        of him, in the direction he is travelling. Every gesture that draws a line
        for the ball is anchored HERE, so the line on the grass and the line the
        ball travels are the same line. */
    function ballPoint() {
        if (ball.mode === 'held' && ball.holder) return { x: ball.x, y: ball.y };
        if (PLAY && PLAY.carrier) return { x: PLAY.carrier.x, y: PLAY.carrier.y };
        return { x: ball.x, y: ball.y };
    }

    /** §12.f — the committed stroke, with every point pulled back onto the ball's
        own line. The extra offset of up to BALL_CARRY is why a finished pass used
        to sit visibly a little off the line it was drawn as; the tail beyond the
        drawn distance is re-aimed at the same point along the ball's own ray, so
        the destination is exactly the drawn one and the path is exactly straight. */
    function anchored(stroke, from) {
        if (!stroke) return null;
        if (from.x === stroke.pts[0].x && from.y === stroke.pts[0].y) return stroke;
        const dx = stroke.end.x - from.x, dy = stroke.end.y - from.y;
        const d = Math.hypot(dx, dy);
        const pts = stroke.pts.slice();
        if (d > 1e-6) {
            for (let i = 0; i < pts.length; i++) {
                const t = Math.max(0, (pts[i].x - from.x) * dx + (pts[i].y - from.y) * dy) / (d * d);
                pts[i] = { x: from.x + dx * t, y: from.y + dy * t };
            }
        } else {
            for (let i = 0; i < pts.length; i++) pts[i] = { x: from.x, y: from.y };
        }
        /* pts[0] is on the ball by construction; the last is the drawn point */
        pts[0] = { x: from.x, y: from.y };
        pts[pts.length - 1] = { x: stroke.end.x, y: stroke.end.y };
        return {
            pts, end: stroke.end,
            len: pathLength(pts), chord: Math.hypot(stroke.end.x - from.x, stroke.end.y - from.y),
            power: stroke.power, air: stroke.air
        };
    }

    /** §12.f — where a kick of any kind is struck FROM. If the ball is in this
        man's possession the answer is the ball's own live position; otherwise it
        is the man himself. Everything that launches a ball for a player — passTo
        and shoot() — goes through here, so no kick can ever again leave the boot
        instead of the ball and slide a body-width off the line the player drew.

        (There is deliberately no second re-anchoring pass over a committed
        stroke: it is anchored once, at commit, by anchored(), and struck from
        here. A straight line between those two points IS the drawn ray.) */
    function kickFrom(from) {
        if (!from) return { x: ball.x, y: ball.y };
        if (ball.mode === 'held' && ball.holder === from) return { x: ball.x, y: ball.y };
        return { x: from.x, y: from.y };
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
        ball.air = false;      // §12.d — a ball in hand is never an air ball
        ball.lastTouch = p;

        const atk = p.team, def = other(atk);
        PLAY = {
            atk, def,
            goal: goalFor(atk),
            own: ownGoal(atk),
            carrier: p,
            receiver: null,
            keeper: keeperOf(def),
            cpuThink: 0.9 + Math.random() * 0.7
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
        /* §12.d — the two drawn strokes belong to the window, so they come off
           the turf with it. Without this a pass line drawn in the last window
           would still be painted under the next passage's players. */
        aimReset();
    }

    /** §0.d — the keeper's dive guide, redrawn every frame from his committed
        state. While the finger is down the gesture owns the line; after release
        the line stays and tracks his body, so the instruction the player gave
        his keeper stays legible for the whole window — and shortens as he
        dives into the point. It clears with the commitment itself: openPlan()
        and kickoff() wipe the keeper's dive state, hideOverlays() wipes the
        objects, and the line comes off with them. The board still never
        announces the CPU's instruction, and the shootout keeps its own flow. */
    function drawDiveGuide() {
        if (SO.active || drag.kind === 'keeper') return;
        const k = keeperOf('you');
        const d = k ? (k.queuedDive || k.dive) : null;
        if (!d) {
            diveLine.visible = false;
            diveMarker.visible = false;
            return;
        }
        diveLine.setEnds(k, d);
        diveLine.visible = true;
        diveMarker.position.set(worldX(d.x), 0.09, worldZ(d.y));
        diveMarker.visible = true;
    }

    /* ==========================================================================
       § 9.b FEEL — audio, shake, banner (rides on top; never inside the rulebook)
       ========================================================================== */
    const Sfx = (() => {
        let ctx = null, master = null, muted = false;
        let bgm = null;
        function initBgm() {
            if (bgm) return bgm;
            try {
                bgm = new Audio('/background-audio.mp3');
                bgm.loop = true;
                bgm.volume = 0.3;
            } catch (_e) {
                bgm = null;
            }
            return bgm;
        }
        function syncBgm(screenName) {
            const audio = initBgm();
            if (!audio) return;
            const currentScreen = screenName !== undefined ? screenName : (typeof topScreen === 'function' ? topScreen() : 'menu');
            const shouldPlay = !muted && (currentScreen === 'menu' || currentScreen === 'pause');
            if (shouldPlay) {
                const p = audio.play();
                if (p && p.catch) p.catch(() => { });
            } else {
                audio.pause();
            }
        }
        /** §9.b — the boot preload: resolve once the background track is fully
            loaded. The menu used to open to silence and start the track half
            way through, because the multi-megabyte file was the slowest thing
            on first load; the boot veil (see the end of boot) waits on this.
            An error — a missing track — also resolves: a broken file must
            never trap the player on a loading screen. */
        function preloadBgm(onReady) {
            const audio = initBgm();
            if (!audio) { if (onReady) onReady(); return; }
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                if (onReady) onReady();
                syncBgm(); /* the menu is up behind the veil: start it if policy allows */
            };
            audio.addEventListener('canplaythrough', finish, { once: true });
            audio.addEventListener('error', finish, { once: true });
            audio.load();
        }
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
            syncBgm();
        }
        if (typeof window !== 'undefined') {
            ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(evt => {
                window.addEventListener(evt, () => unlock(), { passive: true, once: false });
            });
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
            syncBgm,
            preloadBgm,
            get muted() { return muted; },
            toggle() { muted = !muted; syncBgm(); return muted; },
            kick() { tone(150, .12, 'triangle', .4); tone(90, .16, 'sine', .3, .01); },
            pass() { tone(420, .07, 'triangle', .18); },
            good() { tone(660, .09, 'sine', .22); tone(880, .1, 'sine', .18, .07); },
            bad() { tone(190, .18, 'sawtooth', .22); tone(120, .22, 'square', .16, .04); },
            goal() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .26, i * .09)); },
            /* the same event from the other side of the scoreboard: a falling
               groan where the fanfare rises */
            concede() { [392, 311, 247, 185].forEach((f, i) => tone(f, .26, 'sawtooth', .2, i * .1)); },
            save() { tone(300, .12, 'square', .18); tone(220, .2, 'square', .14, .1); },
            /* §12.j — the woodwork. A hard, short, tuned knock: the one sound in
               the game that has to be recognisable before the eye has found the
               ball, because the ball is about to be somewhere nobody expected. */
            post() { tone(880, .07, 'square', .3); tone(1320, .05, 'square', .16, .01); tone(330, .18, 'triangle', .2, .02); },
            /* and the hoardings / the netting — a dull thud, deliberately quiet:
               it happens often and it must never compete with the woodwork. */
            bounce() { tone(140, .09, 'sine', .12); },
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
    const app = el('app');
    /* Every HUD write goes through these two. The engine has to survive markup
       that changes shape — a read-out that was deleted must never be able to
       throw inside the frame loop — so a missing node is simply a no-op. */
    const setText = (node, text) => {
        if (node && node.textContent !== text) node.textContent = text;
    };
    const FIRE = { goal: 0 };
    const ui = {
        hudTop: el('hud-top'), hudBottom: el('hud-bottom'), pens: el('hud-pens'),
        /* #role-strip is the stage-anchored home of the role + possession pair;
           #role-badge / #possession-chip keep their ids inside it. */
        roleStrip: el('role-strip'),
        role: el('role-badge'), poss: el('possession-chip'),
        /* #score-you / #score-cpu are bare text nodes now — the engine owns the
           whole element, so there is no inner <strong> to reach for. */
        scoreYou: el('score-you'),
        scoreCpu: el('score-cpu'),
        halfLabel: el('half-label'), clock: el('clock'), clockBar: el('clock-bar'), clockExtra: el('clock-extra'),
        instruction: el('instruction'),
        mute: el('btn-mute'), pause: el('btn-pause'), help: el('btn-help'),
        shoot: el('btn-shoot'),
        plan: el('plan-panel'), planState: el('plan-state'),
        planClock: el('plan-clock'), planBar: el('plan-bar'),
        done: el('btn-done'),
        difficulty: el('difficulty'), planWin: el('plan-window'),
        /* the same three settings live on the start card as well as in the
           sheet — one id per control per surface, and the sync functions
           keep both sets of pills pressed in step */
        difficultyStart: el('difficulty-start'), planWinStart: el('plan-window-start'),
        halfLen: el('half-length'), halfLenStart: el('half-length-start'),
        soundStart: el('sound-start'),
        menuOpen: el('btn-menu-open'), menuClose: el('btn-menu-close'),
        menuRestart: el('btn-menu-restart'), menuQuit: el('btn-menu-quit'),
        sheet: el('menu-sheet'), scrim: el('sheet-scrim'),
        goalFx: el('goal-fx'), goalWord: el('goal-fx-word'),
        soTitle: el('so-title'), soYou: el('so-you'), soCpu: el('so-cpu'),
        soScore: el('so-score'), soTurn: el('so-turn')
    };

    let lastClock = -1, lastBar = -1;

    /* The match log is no longer shown — the board IS the log, and a scrolling
       list of sentences was the one thing on the HUD competing with it. What
       happened is still emitted on the bus as a debug hook and kept in a tiny
       in-memory ring, so nothing that used to read the log had to be deleted. */
    const LOG = { lines: [], max: 5 };
    function pushLog(text, cls) {
        LOG.lines.push({ text, cls });
        while (LOG.lines.length > LOG.max) LOG.lines.shift();
    }
    const log = (text, cls) => bus.emit('log', { text, cls });

    /* --- §18.b the goal celebration ------------------------------------------
       Two pieces, both fired from scoreGoal(), neither of them touching a rule:
         · a DOM word bursting out of the middle of the pitch in the scoring
           side's own colour (the motion itself lives in the stylesheet);
         · a ring flat on the turf, swelling out of the goalmouth that was just
           scored in, driven from frame() off wall time so it keeps expanding
           even while kickoff() is resetting the world underneath it.
       Re-armed with the remove → force-reflow → add dance, because an animation
       that is already sitting on the node will not replay on its own. */
    const goalBurst = new THREE.Mesh(
        new THREE.RingGeometry(.72, 1.0, 40),
        new THREE.MeshBasicMaterial({
            color: COL.you, transparent: true, opacity: 0,
            side: THREE.DoubleSide, depthWrite: false
        })
    );
    goalBurst.rotation.x = -Math.PI / 2;
    goalBurst.position.y = 0.075;
    goalBurst.material.opacity = 0;
    scene.add(goalBurst);

    function fireGoalFx(team) {
        FIRE.goal = 0;
        goalBurst.material.color.set(team === 'you' ? COL.you : COL.cpu);
        if (!ui.goalFx) return;
        ui.goalFx.style.setProperty('--goal-fx', team === 'you' ? CSS.you : CSS.cpu);
        setText(ui.goalWord, 'GOAL');
        ui.goalFx.classList.remove('show');
        void ui.goalFx.offsetWidth;
        ui.goalFx.classList.add('show');
        window.clearTimeout(fireGoalFx._t);
        fireGoalFx._t = window.setTimeout(() => {
            if (ui.goalFx) ui.goalFx.classList.remove('show');
        }, 1700);
    }

    bus.on('score', () => {
        setText(ui.scoreYou, state.humanScore);
        setText(ui.scoreCpu, state.cpuScore);
    });
    let lastRole = '', lastPoss = '';
    bus.on('role', () => {
        if (SO.active) return;
        const attacking = state.possession === 'you';
        /* §16.a — the role is a two-word badge, not a sentence. The possession
           chip keeps its colour, which is the part the eye actually reads. */
        const role = attacking ? 'ATTACK' : 'DEFEND';
        if (role !== lastRole) { lastRole = role; setText(ui.role, role); }
        if (ui.role) ui.role.className = attacking ? 'attack' : 'defend';
        if (state.possession !== lastPoss) {
            lastPoss = state.possession;
            if (ui.poss) {
                ui.poss.className = 'chip ' + state.possession;
                ui.poss.innerHTML = '<i class="dot"></i>' +
                    (state.possession === 'you' ? 'YOU · BALL' : 'CPU · BALL');
            }
        }
        /* §17.b — one short line, and the only thing it has to say is what the
           human is being asked to do with their thumb right now. The tutorial
           screen is where the long-form explanation lives. */
        const planning = !!(PLAN && !PLAN.armed && state.phase === 'play');
        setText(ui.instruction, planning
            ? (attacking
                ? 'Stack your moves, then MOVES DONE.'
                : 'Close the lane, then MOVES DONE.')
            : (attacking
                ? 'Running — you attack the top goal.'
                : 'Running — you defend the bottom goal.'));
    });
    bus.on('log', d => pushLog(d.text, d.cls));
    /* §17.b — the stacked-move markers are redrawn only when the stack changes */
    bus.on('plan-markers', drawQueueMarkers);
    bus.on('half', () => {
        setText(ui.halfLabel, SO.active ? 'PENALTIES'
            : (state.phase === 'over' ? 'FULL TIME' : 'HALF ' + state.half));
    });

    /* --- screen stack (game-ui-ux: push/pop, focus handed to the top screen) --- */
    const SCREENS = {
        menu: el('screen-menu'), tutorial: el('screen-tutorial'),
        pause: el('screen-pause'), over: el('screen-over'), halftime: el('screen-halftime')
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
        /* The role strip shares the top-centre band with the shootout strip, so it
           stands down for the whole of a shootout: the penalties read-out takes
           the band over and the regulation roles would only be stale copy. */
        ui.roleStrip.hidden = !(show && !SO.active);
        if (name === null) {
            const val = ui.pause && ui.pause.querySelector('.sheet-val');
            if (val) setText(val, '❙❙');
        }
        /* A screen takes the whole viewport, so the floating sheet can never
           legitimately be open underneath one. */
        if (sheetOpen) setMenuOpen(false);
        Sfx.syncBgm(name);
        fitView();
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
        'Board frozen — draw a line out of the carrier to play the ball, then press MOVES DONE.',
        'Now draw a line from the player who will run onto the ball.',
        'Now draw the carrier a second line — his own run once the ball has gone.',
        'Draw a runner towards the goal to commit somebody to the attack.'
    ];

    /* Six slots for the coached opening. `dy` is measured *behind* the ball, so
       every one of these lands in the side's own half, and all six take a
       different x — seven players, seven separate places on the board at
       kick-off. The first four are the slots the walkthrough names and always
       were; 4 and 5 exist so a sixth outfielder has somewhere to stand instead
       of being handed `undefined`. */
    const RESTART_SHAPE = [
        { dx: -17, dy: 9 }, { dx: 17, dy: 9 },
        { dx: -9, dy: 23 }, { dx: 9, dy: 27 },
        { dx: -26, dy: 15 }, { dx: 26, dy: 15 }
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
            /* every coached slot beyond the four the walkthrough names, in order,
               so the fixed spots never move and the extra outfielder joins the
               line rather than being asked to stand on `undefined` */
            extra: RESTART_SHAPE.slice(4).map(s => of(s.dx, s.dy)),
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
            /* the coached kick-off: the carrier stands on the spot, the next four
               take the walkthrough's fixed slots, and anybody left over walks into
               the extra coached places. The leftovers are placed with a loop and a
               fallback rather than four literal indexes, because `rest[4]` on a
               side with five outfielders was a crash waiting for the squad to
               grow — an exception thrown out of arrangeRestart() would have taken
               the kick-off with it. */
            const plan = tutorPlan(atk, pos);
            place(carrier, pos, false);
            const rest = outfield.filter(p => p !== carrier);
            place(rest[0], plan.striker, false);
            place(rest[1], plan.passer, false);
            place(rest[2], plan.mover, false);
            place(rest[3], plan.runner, false);
            rest.slice(4).forEach((p, i) => {
                place(p, plan.extra[i] || attackingSpot(pos, home, i), true);
            });
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
            k.dest = null; k.held = false; k.dive = null; k.queuedDive = null;
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
        /* §12.d — step 1 is "draw the ball's line", and a stroke committed to AIM
           IS that line. It used to wait for a completed pass, which no longer
           happens at draw time (the ball is struck when the window closes), and
           which would also miss a player who drew a shot angle instead. Either
           line advances the step. */
        if (state.tutor === 1 && (AIM.pass || AIM.move)) {
            state.tutor = 2;
            state.tutorClock = 0;
            return;
        }
        const step = TUTOR_STEPS[state.tutor - 1];
        if (step) setText(ui.instruction, step);
        if (state.tutorClock > TUTOR_DELAY + TUTOR_STEP_MS / 1000) finishTutor();
    }

    /** §3 — centre kick-off, to the conceding side. */
    function kickoff(team) {
        arrangeRestart(team, { x: 50, y: 50 });
        log((team === 'you' ? 'Your' : 'CPU') + ' kick-off from the centre spot.', '');
    }

    /** §3 — a goal kick is taken IN PLACE. The keeper already has the ball; the
       clock never stops for it and NOBODY is repositioned.

       This used to call arrangeRestart(), which hard-writes x/y/px/py for all
       fourteen players, resets both keepers onto their lines and drops the phase
       back to 'restart'. So every save — and every shot that went wide — snapped
       the whole board back into formation, throwing away the picture the player
       had just built and the ground they had just won. A restart SHAPE belongs
       to a kick-off and to half-time; a keeper picking the ball up is a
       possession change, and setCarrier() already knows how to resolve one: it
       hands the ball over exactly where it is and opens the decision window, so
       play resumes from where the save happened instead of from the centre. */
    function goalKick(team) {
        const k = keeperOf(team);
        if (!k) return kickoff(team);
        ball.mode = 'held'; ball.alive = false;
        ball.holder = k;
        ball.x = k.x; ball.y = k.y;
        setCarrier(k);
        log((team === 'you' ? 'Your' : 'CPU') + ' keeper plays on from where he stands.', '');
    }

    function beginMatch() {
        state.humanScore = 0; state.cpuScore = 0;
        state.half = 1; state.halfT = 0; state.pendingHalf = false;
        state.seed = (Math.random() * 1e9) | 0;
        state.phase = 'play';
        state.matchMode = 'quick';
        /* a fresh match always opens with the coached kick-off */
        state.tutor = 0; state.tutorTargets = null; state.tutorClock = 0;
        state.tutorDone = false;
        /* §3 — weighted random stoppage time for the first half:
           +1s 40%, +2s 30%, +3s 18%, +4s 8%, +5s 4% */
        state.firstHalfStoppage = weightedPick(
            [1, 2, 3, 4, 5],
            [40, 30, 18, 8, 4],
            Math.random
        ).item;
        endShootout(true);
        bus.emit('score'); bus.emit('half');
        Sfx.unlock(); Sfx.whistle();
        hideOverlays();
        kickoff('you');
        log('You defend the bottom goal and attack the top one — two ' +
            formatClock(halfLength) + ' halves.', '');
    }

    /** §3 — half and full time. The ball is always dead before the whistle. */
    function endHalf() {
        state.pendingHalf = false;
        if (state.half === 1) {
            /* Half time pushes the halftime screen — the match pauses until
               the player clicks CONTINUE TO SECOND HALF. */
            if (sheetOpen) setMenuOpen(false);
            bus.emit('half');
            Sfx.whistle();
            log('Half time. ' + state.humanScore + '–' + state.cpuScore + '.', '');
            /* populate the halftime card */
            setText(el('half-score-you'), String(state.humanScore));
            setText(el('half-score-cpu'), String(state.cpuScore));
            /* hide the stoppage badge now that the half is over */
            const extraEl = el('clock-extra');
            if (extraEl) extraEl.hidden = true;
            pushScreen('halftime', { focus: '#btn-half-continue' });
        } else {
            finishMatch();
        }
    }

    function finishMatch() {
        const level = state.humanScore === state.cpuScore;
        const won = state.humanScore > state.cpuScore;
        /* the window belongs to live play only — drop it and its stacked moves,
           or the next match opens with a stale clock and a board full of rings */
        PLAN = null;
        clearIntents();
        /* the sheet can be open over live play, and the shootout pushes no
           screen to force it shut — close it here for whichever way full
           time goes */
        if (sheetOpen) setMenuOpen(false);
        Sfx.whistle();
        /* §0/§10 — level at full time goes straight to the spot: the over
           screen's "GO TO PENALTIES" hop added nothing but a click. */
        if (level) {
            banner('FULL TIME', CSS.warn);
            log('Full time: ' + state.humanScore + '–' + state.cpuScore + '. Straight to penalties.', '');
            /* the spot is settling THIS match, so PLAY AGAIN replays the match */
            beginShootout(true);
            return;
        }
        state.phase = 'over';
        bus.emit('half');
        /* the pens button is unreachable now — level never reaches this
           screen — but pin it hidden whatever the markup says */
        const pens = el('btn-pens');
        if (pens) pens.hidden = true;
        el('over-title').textContent = (won ? 'YOU WIN ' : 'CPU WINS ') + state.humanScore + '–' + state.cpuScore;
        el('over-detail').textContent = 'Full time after two ' + formatClock(halfLength) + ' halves.';
        el('screen-over').querySelector('.eyebrow').textContent = 'Full time';
        log(won ? 'Full time: you win!' : 'Full time: CPU wins.', won ? 'good' : 'bad');
        pushScreen('over', { focus: '#btn-again' });
    }

    /* ==========================================================================
       § 12. THE BALL — one continuous §7 race, checked every single frame
       ========================================================================== */
    const defenderInputs = team => teamOutfield(team).map(p => ({ x: p.x, y: p.y, speed: p.speed }));

    /** §12.b — how close the ball's LAST STEP came to a point.

        A frame is not a moment. A rolled pass covers ~0.45 units in a 60 Hz
        frame and as much as 1.3 when dt hits its 0.05 ceiling, and against a
        contact radius of ~1 unit that is more than enough for the ball to pass
        straight through a defender's feet between two consecutive samples: off
        the line on one side before the frame, off it on the other side after,
        and never within the radius at either sample. So the question is asked
        of the whole segment the ball travelled — where it was when the frame
        began to where it is now — which is exactly "did the ball reach him?"
        and is frame-rate independent. */
    function ballPathDist(P, fromX, fromY) {
        const A = {
            x: Number.isFinite(fromX) ? fromX : ball.x,
            y: Number.isFinite(fromY) ? fromY : ball.y
        };
        /* projectOnSegment() clamps to the segment, so a ball rolling AWAY from
           a defender is measured against the part of the step it was actually
           alongside, never against an imaginary continuation behind it. */
        return projectOnSegment(P, A, ball).dist;
    }

    /** A defender's cut is checked against the ball's path, and it is a TOUCH. */
    function contestFlight(fromX, fromY) {
        const atk = state.possession, def = other(atk);

        /* --- a pass is not contestable until it has actually been played ------
           `ball.travel` is how far the ball has covered since it left the boot.
           While that is still inside TOUCH_R the ball has not gone anywhere: it
           is still exactly where the passer was standing, and a defender
           standing over the passer is not reading a pass — they are just
           standing where the ball started.

           Without this guard the cut-out fired on the very first frame of every
           pass made under pressure. launchBall() puts the ball at the boot, the
           next frame advances it by speed·dt (a few tenths of a unit), and so
           the ball was still inside the contact radius of the defender who was
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
           moment the ball has cleared the boot, the normal race applies.

           §12.b — and now the cut itself is a touch. The old test here was
           `dist(p, ball) <= CATCH_RADIUS`, three full units of aura that took
           the ball off the passer for passing NEAR a defender. A pass that only
           whistles past somebody now runs on, which is what the drawn line
           promised; a defender who wants it has to get his feet to it, and the
           loose-ball rule is what collects it for him if he does not. */
        if (!ball.air && (ball.mode !== 'pass' || ball.travel >= TOUCH_R)) {
            /* outfielders of the defending side may cut any ball in flight, but
               only by reaching it */
            for (const p of teamOutfield(def)) {
                if (ballPathDist(p, fromX, fromY) <= TOUCH_R) return cutOut(p, atk);
            }
        }
        /* the defending keeper: a hand's reach against a pass, and — against a
           shot — the rulebook's own save race, NOT a circle around him.

           He used to be a symmetric aura: `ballPathDist(k) <= KEEPER_REACH`,
           measured around his LIVE position and blind to what he was doing. Since
           he is 12.5 units from the centre of a 25-unit mouth at the moment of
           the strike, that circle already covers half the goal before he moves,
           and because a diving keeper is driven straight onto the ball it grew
           again as he went. Nothing about the dive could ever be wrong: he
           collected everything.

           So the save is now the race the rulebook describes and a property test
           pins — ball at the speed it was ACTUALLY struck, against the keeper
           running to the point he is actually diving at, `reach` as the margin.
           The dive is the input, not a decoration: a keeper going the other way
           is a GOAL, and that is true because `shotOutcome()` says so with the
           same geometry the tests read.

           It is also evaluated every frame against his live position, so he
           saves a ball he can still get to and cannot retroactively catch one
           that has gone past him — and `ball.total === flight` for a struck ball,
           so the `ball.t >= r.t` gate lands the catch exactly when it reaches
           him instead of snapping the ball to his chest from mid-air. */
        const k = keeperOf(def);
        if (k) {
            if (ball.mode === 'shot') {
                const shotDist = ball.from ? Math.hypot(ball.from.x - PLAY.goal.x, ball.from.y - PLAY.goal.y) : 30;
                const shotSpeed = Number.isFinite(ball.speed) ? ball.speed : SHOT_SPEED;

                // Difficulty modifier applies exclusively to CPU opponent keeper
                let keeperReach = KEEPER_SAVE_REACH;
                let keeperDiveSpeed = DIVE_SPEED * RUN_SCALE;
                if (def === 'cpu') {
                    const isHard = state.difficulty >= 1.0;
                    const isExtreme = state.difficulty >= 1.5;
                    const diffMul = isExtreme ? 1.2 : (isHard ? 1.1 : 1.0);
                    keeperReach *= diffMul;
                    keeperDiveSpeed *= (KEEPER_SCALE * diffMul);
                } else {
                    keeperDiveSpeed *= KEEPER_SCALE;
                }

                // Balance save probability dynamically based on shot distance and speed:
                // Long-range slow shots have high catch probability; fast/close-range shots have lower catch probability
                const distFactor = clamp((shotDist - 10) / 28, 0.78, 1.35);
                const speedFactor = clamp(SHOT_SPEED / Math.max(14, shotSpeed), 0.72, 1.28);
                const dynReach = keeperReach * distFactor * speedFactor;

                const r = shotOutcome({
                    from: { x: ball.from.x, y: ball.from.y },
                    target: ball.target,
                    keeper: ball.keeperFrom || { x: k.x, y: k.y },
                    keeperTarget: k.dive || { x: k.x, y: k.y },
                    goalX: PLAY.goal.x,
                    goalHalfWidth: GOAL_HALF_WIDTH,
                    shotSpeed: shotSpeed,
                    reach: dynReach,
                    diveSpeed: keeperDiveSpeed
                });
                if (r.outcome === 'SAVED' && ball.t >= r.t - 1e-6) return keeperContact(k, atk);
            } else if ((!ball.air || keeperThreatX(k) !== null) &&
                (ball.mode !== 'pass' || ball.travel >= TOUCH_R) &&
                ballPathDist(k, fromX, fromY) <= KEEPER_TOUCH_R) {
                /* §0.d — a keeper goes for a ball at his OWN MOUTH whether it is
                   on the deck or chipped over his line: he has hands, which is
                   exactly why §0.b gives a keeper more contact than an
                   outfielder's feet. A chip anywhere else on the pitch is still
                   uncuttable, as §12.f says. keeperThreatX() is what scopes that
                   to a ball actually heading into his net. */
                return caughtByKeeper(k, atk);
            }
        }
    }

    /** §3 — an interception never resets: possession flips exactly here. */
    function cutOut(p, atk) {
        ball.mode = 'held'; ball.alive = false;
        ball.x = p.x; ball.y = p.y;
        if (p.team !== atk) {
            /* No banner here: the bottom-centre band belongs to the guide line
               now, and an interception is legible from the possession mark
               flipping and the log line below — the sound and the shake carry
               the tactile part. */
            Sfx.bad(); shake(.28);
            log(logName(p) + ' cuts it out.', p.team === 'you' ? 'good' : 'bad');
        }
        setCarrier(p);
    }

    /** §3 — the save is a goal kick, and the clock never stops for it.
       The keeper keeps the ball exactly where he caught it, and goalKick() now
       resolves that in place — no formation reset, no repositioning of anybody. */
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

    /** §12.h — what the keeper's body does with a saved ball is decided by his
        posture at the moment of contact, not by the ball's height: ARC_SHOT
        caps a struck ball below the humanoid's waist in open play, so there is
        no "head-height" save to tell apart. The honest proxy is the dive
        itself — a keeper who has left his feet has thrown
        his legs at the ball and can only parry it back into play; one who is
        set on his feet gets his body behind it and catches. The rulebook's
        verdict is untouched either way: this only chooses what happens AFTER
        the save. */
    function keeperContact(k, atk) {
        const dove = !!k.dive;
        if (!dove) return caughtByKeeper(k, atk);
        /* legs on it — a parried ball belongs to nobody. Bounce it back into
           the pitch off a normal pointing away from the goal he defends, as
           firm as a ball coming off the woodwork, and let the chase decide
           who picks it up. */
        const own = ownGoal(k.team);
        const ny = Math.sign(50 - own.y) || 1;
        ball.x = k.x; ball.y = k.y;
        reboundBall(0, ny, BOUNCE_POST);
        spillLoose();
        Sfx.save(); shake(.3);
        banner('PARRIED', CSS.warn);
        log(k.team === 'you' ? 'Your keeper parries it away!' : 'CPU keeper parries it away!',
            k.team === 'you' ? 'good' : 'bad');
    }

    function scoreGoal(team) {
        if (team === 'you') state.humanScore++; else state.cpuScore++;
        bus.emit('score');
        /* §18.b — celebrate before the reset: fireGoalFx() is DOM and wall-time
           driven, so it carries on while kickoff() rebuilds the board. Nothing
           here touches a rule, a position or the clock. */
        fireGoalFx(team);
        /* §9.b — one event, two feelings: your goal is a fanfare, the CPU's
           is a groan */
        if (team === 'you') Sfx.goal(); else Sfx.concede();
        shake(.7);
        banner('GOAL', team === 'you' ? CSS.you : CSS.cpu);
        log(team === 'you' ? 'GOAL! ' + state.humanScore + '–' + state.cpuScore : 'CPU score. ' + state.humanScore + '–' + state.cpuScore,
            team === 'you' ? 'good' : 'bad');
        kickoff(other(team));
    }

    /* ==========================================================================
       § 12.j THE REBOUND — see the constants block above for why this exists.
       Everything here moves the ball; nothing here awards it to anybody.
       ========================================================================== */

    /** Re-launch the live ball from where it is, along the line it would leave a
        surface with normal `n`, keeping `keep` of the pace it arrived with.
        The reflection is the textbook one, d′ = d − 2(d·n)n, and the ball is
        re-based on its new origin so the §12.b roll integrator picks it up from
        this frame with no discontinuity. It always comes off as a LOOSE ball:
        a rebound belongs to nobody until somebody runs to it. */
    function reboundBall(nx, ny, keep) {
        const dir = ball.dir || { x: 0, y: 1 };
        const dot = dir.x * nx + dir.y * ny;
        let dx = dir.x - 2 * dot * nx, dy = dir.y - 2 * dot * ny;
        const dl = Math.hypot(dx, dy);
        if (dl < 1e-6) { dx = nx; dy = ny; }
        else { dx /= dl; dy /= dl; }
        ball.from = { x: ball.x, y: ball.y };
        ball.dir = { x: dx, y: dy };
        ball.travel = 0;
        ball.t = 0;
        ball.s = Math.max(REBOUND_FLOOR, (Number.isFinite(ball.s) ? ball.s : BALL_SPEED) * keep);
        ball.mode = 'loose';
        ball.alive = true;
        ball.air = false;
        ball.h = 0.42;
        ball.holder = null;
        ball.passTarget = null;
    }

    /** §12.j — has the ball left the playing area, and off what? Asked of the
        live position every frame a ball is loose, and it answers by bouncing it.
        Order matters: the netting is tested before the hoardings, because the
        mouth sits in front of them and a ball rolling into the back of the goal
        has to stop at the net rather than carry on through the frame. */
    function bounceOffBoards() {
        const inMouth = Math.abs(ball.x - GOAL.you.x) <= GOAL_HALF_WIDTH + POST_R;
        /* the two goal lines, between the posts: scoring detection first */
        if (ball.y <= 0 && inMouth && ball.dir && ball.dir.y < 0) {
            const post = postStruck(GOAL.cpu);
            if (post) {
                ball.x = post.x; ball.y = post.y;
                reboundBall(post.nx, post.ny, BOUNCE_POST);
                spillLoose();
                Sfx.post(); shake(.34);
                banner('POST', CSS.warn);
                return true;
            }
            if (isOnTarget(ball.x, GOAL.cpu.x, GOAL_HALF_WIDTH)) {
                ball.alive = false;
                scoreGoal(scorerForEnteredGoal(GOAL.cpu));
                return true;
            }
            ball.y = 0.1; reboundBall(0, 1, BOUNCE_NET); Sfx.bounce(); return true;
        }
        if (ball.y >= 100 && inMouth && ball.dir && ball.dir.y > 0) {
            const post = postStruck(GOAL.you);
            if (post) {
                ball.x = post.x; ball.y = post.y;
                reboundBall(post.nx, post.ny, BOUNCE_POST);
                spillLoose();
                Sfx.post(); shake(.34);
                banner('POST', CSS.warn);
                return true;
            }
            if (isOnTarget(ball.x, GOAL.you.x, GOAL_HALF_WIDTH)) {
                ball.alive = false;
                scoreGoal(scorerForEnteredGoal(GOAL.you));
                return true;
            }
            ball.y = 99.9; reboundBall(0, -1, BOUNCE_NET); Sfx.bounce(); return true;
        }
        /* the bylines — ball bounces at the painted goal line, not the run-off */
        if (ball.y <= 0) { ball.y = 0.1; reboundBall(0, 1, BOUNCE_BOARD); Sfx.bounce(); return true; }
        if (ball.y >= 100) { ball.y = 99.9; reboundBall(0, -1, BOUNCE_BOARD); Sfx.bounce(); return true; }
        /* the touchlines — ball bounces at the painted sideline */
        if (ball.x <= 0) { ball.x = 0.1; reboundBall(1, 0, BOUNCE_BOARD); Sfx.bounce(); return true; }
        if (ball.x >= 100) { ball.x = 99.9; reboundBall(-1, 0, BOUNCE_BOARD); Sfx.bounce(); return true; }
        return false;
    }

    /** §12.j — did this shot strike a post, and along what normal?

        The posts stand at the two ends of the mouth, on the goal line. A shot is
        only ever tested against the one it is nearer, and the test is the real
        one: solve |from + dir·t − C| = POST_R for the first root on the flight,
        which is the moment the ball's surface meets the woodwork. That root is
        also WHERE it hits, so the normal is (impact − C) / POST_R and the ball
        comes off the post the way it actually struck it — flush on the inside
        face and it goes back across the mouth, a clip on the outside and it goes
        away. Returns null when the line never touches the circle, which is every
        shot that goes cleanly in or cleanly wide. */
    function postStruck(goal) {
        if (!ball.from || !ball.dir) return null;
        const side = ball.target.x >= goal.x ? 1 : -1;
        const C = { x: goal.x + side * GOAL_HALF_WIDTH, y: goal.y };
        const fx = ball.from.x - C.x, fy = ball.from.y - C.y;
        const b = fx * ball.dir.x + fy * ball.dir.y;
        const c = fx * fx + fy * fy - POST_R * POST_R;
        const disc = b * b - c;
        if (disc < 0) return null;
        const t = -b - Math.sqrt(disc);
        /* the root has to lie on the flight that was actually flown — a post
           "behind" the strike, or one the ball stopped short of, is not a hit */
        if (t < 0 || t > ball.travel + POST_R) return null;
        const ix = ball.from.x + ball.dir.x * t, iy = ball.from.y + ball.dir.y * t;
        return { x: ix, y: iy, nx: (ix - C.x) / POST_R, ny: (iy - C.y) / POST_R };
    }

    /** §12.j — the ball is live, it is nobody's, and the race for it starts on
        the very next frame. Shared by every way a shot can fail to be a goal, and
        by the pass nobody was there to collect. */
    function spillLoose() {
        ball.mode = 'loose';
        ball.alive = true;
        ball.air = false;
        /* §12.d — the flight is over, and with it the arc: a spilled shot was
           up to ARC_SHOT high at the end of its travel, and the loose-ball
           integrator never touches `h`, so without this the ball would roll
           around at chest height waiting for somebody to collect it. */
        ball.h = 0.42;
        ball.holder = null;
        ball.passTarget = null;
        /* every stacked move belonged to a passage that is over: left standing,
           each runner would keep serving a plan that no longer means anything and
           the shape loop would skip him, which is the frozen board this avoids */
        allPlayers.forEach(p => { p.dest = null; });
        clearIntents();
    }

    /** What happens when the ball finishes its travel without being cut out. */
    function resolveArrival() {
        /* §12.d — the flight is over, so the ball is on the deck again from here
           on. A chip only escapes the outfield cut while it is actually flying;
           the loose ball that spills out of one is an ordinary loose ball. */
        ball.air = false;
        const goal = goalFor(state.possession);

        if (ball.mode === 'shot') {
            /* §12.j — THE WOODWORK IS FIRST. A ball on the post is neither in nor
               out, and `isOnTarget()` cannot tell you which: the post stands ON
               the edge of the mouth, so a shot aimed at x = goal ± GOAL_HALF_WIDTH
               reads as on target and used to be given as a goal. */
            const post = postStruck(goal);
            if (post) {
                ball.x = post.x; ball.y = post.y;
                reboundBall(post.nx, post.ny, BOUNCE_POST);
                spillLoose();
                Sfx.post(); shake(.34);
                banner('POST', CSS.warn);
                log('Off the post — and it is still live.', '');
                return;
            }
            /* A shot only ever answers ON the goal line. drawnShotRay() can hand
               back the drawn END of a line that has no byline answer, and a ball
               that stopped in the middle of the pitch is not a goal — it is a
               loose ball like any other. */
            if (targetEntersGoal(ball.target, goal)) {
                ball.alive = false;
                return scoreGoal(scorerForEnteredGoal(goal));
            }
            const atLine = !!ball.target && (goal.y === 0 ? ball.target.y <= 0 : ball.target.y >= 100);
            /* Wide, over, or short of the line. The ball keeps the line it was
               struck on and carries into the run-off, where the hoardings send it
               back; nobody is awarded anything, and the keeper who wants it has
               to leave his line and go and get it like everybody else. */
            ball.s = Math.max(REBOUND_FLOOR, (Number.isFinite(ball.s) ? ball.s : SHOT_SPEED) * SPILL_DAMP);
            ball.from = { x: ball.x, y: ball.y };
            ball.travel = 0;
            ball.t = 0;
            spillLoose();
            Sfx.bad();
            banner(atLine ? 'WIDE' : 'MISCUED', CSS.bad);
            log(atLine ? 'Shot wide — the ball is still in play.' : 'Shot never reached the line.',
                state.possession === 'you' ? 'bad' : 'good');
            return;
        }

        /* §26 — PASS INTO GOAL: a pass whose target is at the goal line and
           between the posts is awarded as a goal, exactly like a shot. The
           woodwork is checked first so a pass that clips the post rebounds
           instead of being given. */
        if (ball.mode === 'pass') {
            const passGoal = goalFor(state.possession);
            const post = postStruck(passGoal);
            if (post) {
                ball.x = post.x; ball.y = post.y;
                reboundBall(post.nx, post.ny, BOUNCE_POST);
                spillLoose();
                Sfx.post(); shake(.34);
                banner('POST', CSS.warn);
                log('Pass struck the post — ball is live.', '');
                return;
            }
            if (targetEntersGoal(ball.target, passGoal)) {
                ball.alive = false;
                return scoreGoal(scorerForEnteredGoal(passGoal));
            }
        }

        ball.alive = false;
        /* §17.b — a pass is only *completed* if a team-mate is actually ON the
           ball when it arrives.

           This test used to have no radius in it at all. `best` was the nearest
           body in the whole squad and the only question asked of it was which
           shirt it wore — so a ball played into empty space resolved to whichever
           team-mate happened to be closest to the spot, forty units away,
           standing still, having made no attempt to get it, and setCarrier() put
           it in his hands. On the board the ball teleported from the point it had
           been drawn to, across the pitch, onto a player who never moved. That is
           the worst thing the engine can do to the picture the player is reading,
           because it makes the aim line meaningless: nothing you draw can be
           trusted.

           A claim now has to be a real claim — the nearest team-mate has to be
           inside CATCH_RADIUS, the same radius he would have needed to collect
           the ball on the ground — and the fallback is the loose ball: the ball
           is where it is, it keeps rolling with the pace it arrived with until
           friction kills it, and somebody has to come and get it. There is no
           third option in which the ball is awarded to the nearest shirt.

           It also keeps the engine honest about §12.b. The ball is quicker than a
           man, so a pass played ahead of a runner gets there first; a receiver
           who has not arrived yet is simply not inside CATCH_RADIUS of it, and he
           has to finish the run before he can have it. */
        let best = null, bd = Infinity;
        for (const p of allPlayers) {
            if (p.team !== state.possession) continue;
            const d = dist(p, ball);
            if (d < bd) { bd = d; best = p; }
        }
        if (best && bd <= CATCH_RADIUS) {
            setCarrier(best);
            Sfx.good();
            return;
        }
        /* Nobody is on it. The ball is loose, exactly where the roll left it, and
           the nearest player in each kit has to run to it to win it.

           The passage that produced the pass is over — the ball never reached the
           point it was drawn to — so every stacked move is dropped here too. Left
           standing, those runs were what froze the board on a loose ball: each
           runner was still locked onto a destination from a plan that no longer
           meant anything, and the race for the ball was skipped for anyone who
           had one. The match does NOT stop: the chase starts on the very next
           frame, and the decision window only opens when somebody actually wins
           the ball (setCarrier → openPlan). That is the pause the player sees —
           after the ball, not instead of going to get it. */
        spillLoose();
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
            const sx = h.x - px, sy = h.y - py;
            const step = Math.hypot(sx, sy);
            let bx, by;                      /* where the ball WANTS to be held */
            if (step > 1e-4) { bx = sx / step; by = sy / step; }
            else {
                /* never moved: face the goal being attacked (the carrier spawns
                   facing it) rather than produce a zero-length offset */
                const g = PLAY ? PLAY.goal : GOAL.you;
                const gl = Math.max(1e-6, Math.hypot(g.x - h.x, g.y - h.y));
                bx = (g.x - h.x) / gl; by = (g.y - h.y) / gl;
            }
            /* §12.b — and the carry direction is EASED, not snapped.
               Reading the step direction straight off the last frame meant the
               ball flicked from one side of the player to the other the instant
               they reversed or cut: a one-frame jump of more than two ball
               widths, which reads as the ball glitching rather than being
               carried, and it is the same class of error as the old fixed goal
               offset — the ball whose position the player cannot predict. The
               direction is now a vector on the ball, turned towards the step at
               a finite rate (faster while running, slower when settling), so
               control is a thing the player can feel. A TRUE reversal still
               collapses the vector to nothing on the way through, and the
               collapse guard re-seeds it from the step, because a carried ball
               must never slide THROUGH the body it is in front of. */
            const turn = Math.min(1, dt * (step > 1e-4 ? 9 : 3));
            ball.cdx += (bx - ball.cdx) * turn;
            ball.cdy += (by - ball.cdy) * turn;
            const cl = Math.hypot(ball.cdx, ball.cdy);
            if (cl < 1e-4) { ball.cdx = bx; ball.cdy = by; }
            else { ball.cdx /= cl; ball.cdy /= cl; }
            ball.x = clamp(h.x + ball.cdx * BALL_CARRY, 2, 98);
            ball.y = clamp(h.y + ball.cdy * BALL_CARRY, 2, 98);
            ball.h = 0.42;
            ball.s = 0;
        } else if (ball.mode === 'pass' || ball.mode === 'shot') {
            if (!ball.alive) return;
            /* where the ball was when the last frame ended — the §12.b cut is
               asked of the path between there and here, not of one instant */
            const fromX = ball.x, fromY = ball.y;
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
            /* §12.f — the lift is LINEAR in the flight, never a sine across it. A
               sine is a bow: the ball climbs away from the drawn line and comes
               back down onto it, so the line on the grass is only true at its two
               ends. Rising and falling straight, underneath a flat line, keeps the
               ball on the drawn line for every frame in between. `arc` is a lie
               about height and nothing else; at 0 — every rolled ball — the ball
               never leaves the deck. */
            ball.h = 0.42 + frac * ball.arc;

            /* Check boundary bounce during flight: if a pass or wide shot crosses the pitch line,
               it immediately rebounds back into the pitch instead of flying into run-off. */
            const goal = PLAY ? PLAY.goal : (state.possession === 'you' ? GOAL.cpu : GOAL.you);
            const inMouth = Math.abs(ball.x - goal.x) <= GOAL_HALF_WIDTH + POST_R;
            const atGoalLine = (ball.y <= 0 && ball.dir && ball.dir.y < 0) || (ball.y >= 100 && ball.dir && ball.dir.y > 0);
            const isGoalMouthEntry = (ball.mode === 'shot' || ball.mode === 'pass') && inMouth && atGoalLine;

            if (isGoalMouthEntry) {
                const post = postStruck(goal);
                if (post) {
                    ball.x = post.x; ball.y = post.y;
                    reboundBall(post.nx, post.ny, BOUNCE_POST);
                    spillLoose();
                    Sfx.post(); shake(.34);
                    banner('POST', CSS.warn);
                    return;
                }
                if (isOnTarget(ball.x, goal.x, GOAL_HALF_WIDTH)) {
                    ball.alive = false;
                    scoreGoal(scorerForEnteredGoal(goal));
                    return;
                }
            }

            if (!isGoalMouthEntry && (ball.x <= 0 || ball.x >= 100 || ball.y <= 0 || ball.y >= 100)) {
                bounceOffBoards();
                spillLoose();
                return;
            }

            contestFlight(fromX, fromY);
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
                /* §12.j — NOT clamped. The clamp used to be `clamp(…, 2, 98)`,
                   which stops a ball dead on a line instead of letting it leave
                   the pitch, and a ball parked on a line is a ball that has to be
                   given to somebody. It runs where the line takes it now and
                   bounceOffBoards() is what turns it round. */
                ball.x = ball.from.x + ball.dir.x * ball.travel;
                ball.y = ball.from.y + ball.dir.y * ball.travel;
                bounceOffBoards();
                if (ball.s <= 0.01 && ball.travel > 0) ball.alive = false;
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
        /* A keeper who is ON the ball is a carrier, not a shot-stopper. Sliding
           him back towards his line while he holds it would drag the ball with
           him, and the carrier is the one body nothing in this engine is allowed
           to move on its own — possession only advances by a pass or a shot. */
        if (ball.mode === 'held' && ball.holder === k) return;
        const home = keeperHome(k.team);
        if (k.dive) {
            moveToward(k, k.dive.x, k.dive.y, DIVE_SPEED * KEEPER_SCALE, dt);
            return;
        }
        /* --- §0.d the ball coming at his goal -------------------------------
           A pass whose line runs into his own mouth is the one ball a keeper
           must go for, and it is the ball neither keeper used to move for at
           all — the human's held his line, and the CPU's was excluded from the
           sweep below by `ball.mode !== 'pass'`. So a ball played into the net
           was resolved with the keeper standing where the passer left him.

           He reads the line once he has had KEEPER_REACT_DELAY to react, then
           slides ALONG HIS LINE to the point it will cross, at his own burst
           speed, capped to the mouth he defends. This moves a body and nothing
           else: whether the ball actually reached his gloves is still the
           KEEPER_TOUCH_R geometry in contestFlight(), so a ball struck firm
           into a corner still beats him and the mouth keeps its corners. He is
           never sent outside the mouth, so a pass that is going wide leaves him
           where he was. */
        if (k.team !== state.possession && ball.mode === 'pass' && ball.t >= KEEPER_REACT_DELAY) {
            /* only the keeper who is actually DEFENDING this ball — the one
               contestFlight() lets claim it, keeperOf(other(possession)). A
               keeper whose own team is in possession has nothing to stop: his
               side's pass cannot be his to collect while it is a pass. */
            const tx = keeperThreatX(k);
            if (tx !== null) {
                const gx = ownGoal(k.team).x;
                moveToward(k, clamp(tx, gx - GOAL_HALF_WIDTH, gx + GOAL_HALF_WIDTH),
                    home.y, DIVE_SPEED * KEEPER_SCALE, dt);
                return;
            }
        }
        /* --- §0.d the reflex: track the shot, then lunge at it ---------------
           A keeper with no committed dive — the human's, or a CPU keeper whose
           guess has not been handed to him — runs with the ball instead of
           standing on his spot: he reads the shot's line and takes up HALF the
           ground to where it will cross (a corner must still outrun him), and
           when the ball is close to his line he lunges at the true crossing
           point, from his own feet, so no read can send him past his length.
           The lunge is allowed only when the strike-time roll said so; a dive
           already on him (drawn or committed) is never overwritten here, and
           the CPU's committed guess is never re-read — his coin flip and the
           open far post stay exactly as §0.d designed. No save is awarded by
           any of this: shotOutcome()'s race still runs against his live dive
           target, so a firm shot into a corner still beats him. */
        if (ball.mode === 'shot' && ball.alive && k.team !== state.possession && !k.dive) {
            const t = (ball.from && ball.dir && Math.abs(ball.dir.y) > 1e-6)
                ? (home.y - ball.from.y) / ball.dir.y : -1;
            if (t > 0) {
                const crossX = ball.from.x + ball.dir.x * t;
                const gx = ownGoal(k.team).x;
                if (Math.abs(ball.y - home.y) <= KEEPER_REFLEX_DIST && ball.keeperReflex) {
                    /* the lunge — committed like any dive, and moved onto now */
                    k.dive = { x: clamp(clampDiveX(crossX, k.x), 8, 92), y: k.y };
                    moveToward(k, k.dive.x, k.dive.y, DIVE_SPEED * KEEPER_SCALE, dt);
                    return;
                }
                /* the run: part of the way to the crossing point, on his line */
                moveToward(k, k.x + (clamp(crossX, gx - GOAL_HALF_WIDTH, gx + GOAL_HALF_WIDTH) - k.x) * KEEPER_TRACK_GAIN,
                    home.y, DIVE_SPEED * KEEPER_SCALE, dt);
                return;
            }
        }
        /* the human's keeper is the player's alone: no sweep of his own half and
           no drift with the ball's x — the goal threat above is the ONE ball he
           reads without being told to. He holds his line unless a dive is drawn
           for him, and walks back to it once the dive is spent. */
        if (k.team !== 'cpu') {
            if (dist(k.x, k.y, home.x, home.y) > 0.5) {
                moveToward(k, home.x, home.y, DRILL_SPEED * 1.5 * KEEPER_SCALE, dt);
            }
            return;
        }
        /* --- and the sweep --------------------------------------------------
           He comes off his line for a dead ball that is HIS to deal with, and
           only for that. Three things have to hold: the ball is nearer his own
           goal than the halfway line, no team-mate is anywhere near it, and the
           run never follows it past KEEPER_SWEEP_MAX. If an outfielder is near
           it, the keeper stays home — the chase in simPlayers() owns a ball the
           outfield is contesting, and a keeper leaving his line while somebody
           else is favourite is the worst of both.

           The target y is clamped on his OWN side of his line, so he comes out
           for it and never follows it into his own net. */
        const own = ownGoal(k.team);
        if (ball.alive && ball.mode !== 'pass' && ball.mode !== 'shot' &&
            Math.abs(ball.y - own.y) < 50) {
            let mate = false;
            for (const p of teamOutfield(k.team)) {
                if (dist(p, ball) <= KEEPER_SWEEP_R) { mate = true; break; }
            }
            const fromHome = dist(home.x, home.y, ball.x, ball.y);
            if (!mate && (fromHome <= KEEPER_CHASE_DIST || dist(k, ball) <= KEEPER_CLEAR_R)) {
                const dyHome = home.y - own.y;      // points OFF his own line
                const dyBall = ball.y - own.y;      // same sign when the ball is off it
                let ty = k.y;
                if (dyHome !== 0 && dyBall * dyHome > 0) {
                    ty = own.y + Math.sign(dyBall) *
                        Math.min(Math.abs(dyBall), KEEPER_SWEEP_MAX);
                }
                moveToward(k, clamp(ball.x, 6, 94), ty, DRILL_SPEED * 1.6 * KEEPER_SCALE, dt);
                return;
            }
        }
        moveToward(k, keeperSlideX(), home.y, DRILL_SPEED * 1.5 * KEEPER_SCALE, dt);
    }

    function simPlayers(dt) {
        const atk = PLAY.atk, def = PLAY.def;

        /* 1. anyone the human has sent somewhere runs there at full pace */
        allPlayers.forEach(p => {
            if (p.dest && moveToward(p, p.dest.x, p.dest.y, p.speed, dt)) p.dest = null;
        });

        /* 1.b a loose ball is a RACE, and the racers are chosen before anybody
               else is told to move.

               Two rules used to drive the same body: the shape loop pulled the
               nearest man back towards his station and the chase pushed him at
               the ball, on the same frame, in opposite directions — and the
               chase then skipped him entirely if he had a destination. A loose
               ball could therefore sit there with nobody committed to it, which
               is exactly the frozen board this is fixing. So the chaser of each
               kit is picked first, the shape loop is told to keep its hands off
               them, and they go at the ball at full pace. Nothing here opens a
               window: the pause comes when the ball is actually won. */
        const loose = ball.mode === 'loose';
        const chasers = [];
        if (loose) {
            ['you', 'cpu'].forEach(team => {
                const near = allPlayers
                    .filter(p => p.team === team)
                    /* §12.j — a keeper races only for a ball at HIS end. Without
                       this he is simply another body in the list, and the nearest
                       body to a rebound at the far end can be the keeper who has
                       nothing to do with it. */
                    .filter(p => p.role !== 'keeper' || dist(ball, ownGoal(team)) <= KEEPER_RACE_DIST)
                    .sort((a, b) => dist(a, ball) - dist(b, ball));
                if (near[0]) chasers.push(near[0]);
                /* §12.j — and the second man, if he is actually in the race */
                if (near[1] && dist(near[1], ball) <= CHASE_SECOND) chasers.push(near[1]);
            });
        }
        const chasing = p => chasers.indexOf(p) >= 0;

        /* 2. BOTH sides hold a shape.

              This used to be the CPU's loop alone, under a comment that said the
              human's outfielders "never move by themselves: every step they take
              is a step the player asked for". That is what left the human's side
              standing in a block the moment a dragged run finished: the player
              had spent his instruction, the man had arrived, and he then stood
              there for the rest of the passage while every other body on the
              board moved around him. An off-ball player now walks towards the
              station his own duty calls for — the same stations the two planners
              use, so a man who was sent on a run and a man who was left alone end
              up working the same shape instead of two different ones.

              It must never outrank the player, though, so holdShape() refuses
              three things in order: a stacked run (p.dest), a man sent to win a
              loose ball (a chaser, picked in 1.b), and whoever is actually
              holding the ball (moveCarrier drives him). Drag anybody and your
              instruction wins; leave them and they work the shape.

              A defender's shape is keyed to the goal it is ACTUALLY defending —
              ownGoal(p.team) — and never to PLAY.own, which is the own goal of
              whichever side is attacking. Handing a defender the attacker's own
              goal is precisely what used to march the whole CPU team down into
              the human's half the moment the human won the ball: the reference
              point was the human's own goal, so every defender lerped towards it
              and the CPU ended up crowding the end it was supposed to be
              attacking.

              Every defending target is then clamped into the defending team's own
              half, so a side presses up to the halfway line and no further: it
              defends its own goal and its own post. Only the attacking branch is
              allowed to cross the line. */
        /* Whoever is on the ball is exempt — and that only means something while
           there IS a carrier: with the ball loose it would exempt a man who no
           longer has anything to do with the play. */
        const holder = (!loose && ball.mode === 'held') ? ball.holder : null;

        const holdShape = (p, i) => {
            if (p.dest) return;        // the human's stacked run outranks the shape
            if (chasing(p)) return;    // a man sent for the ball holds shape for nobody
            if (p === holder) return;  // moveCarrier() drives the man on the ball

            /* With the ball loose there IS no carrier, only a body that used to
               have it — so the whole shape keys off the live ball instead of the
               stale man. Without this a side marks and presses a player who no
               longer has anything to do with where the ball is going, which is
               the shape equivalent of the ball teleporting. */
            const anchor = loose ? ball : (PLAY.carrier || ball);
            const mine = ownGoal(p.team);

            /* --- in possession: free to advance, shape along the attack --- */
            if (atk === p.team) {
                const s = attackingSpot(anchor, PLAY.goal, i);
                moveToward(p, s.x, s.y, DRILL_SPEED, dt);
                return;
            }

            /* --- defending: hold the half in front of the own goal --- */
            const isCpu = p.team === 'cpu';
            const isHard = isCpu && state.difficulty >= 1.0;
            const isExtreme = isCpu && state.difficulty >= 1.5;
            const c = PLAY.carrier;
            if (p.duty === 'interceptor' && c) {
                /* with the ball loose there is no lane to intercept: the ball
                   IS the objective, and it is still moving */
                if (loose) {
                    const interceptSpeed = isCpu ? (PLAYER_SPEED * (isExtreme ? 1.05 : (isHard ? 0.98 : 0.9))) : (PLAYER_SPEED * 0.88);
                    moveToward(p, ball.x, ownHalf(p.team, ball.y), interceptSpeed, dt);
                    return;
                }
                /* §12.e — press the MAN, not a guess at his receiver. This is
                   the live, every-frame read that mattered most: even with the
                   planner fixed, a single `PLAY.threat` here meant the shape was
                   re-reading the human's intention sixty times a second. */
                const s = interceptTarget(p, c, pressPoint(c, mine));
                const interceptSpeed = isCpu ? (PLAYER_SPEED * (isExtreme ? 1.05 : (isHard ? 0.98 : 0.9))) : (PLAYER_SPEED * 0.88);
                moveToward(p, s.x, ownHalf(p.team, s.y), interceptSpeed, dt);
                return;
            }
            if (p.duty === 'marker' && c) {
                /* stand goal-side of the carrier, where "goal" means the one
                   being defended — so the marker drops off towards its own end
                   rather than being pulled towards the other one */
                const markTight = isCpu ? (isExtreme ? 0.04 : (isHard ? 0.08 : 0.12)) : 0.18;
                const s = {
                    x: clamp(c.x - (mine.x - c.x) * markTight, 6, 94),
                    y: clamp(lerp(c.y, mine.y, markTight), 6, 94)
                };
                const markSpeed = isCpu ? (PLAYER_SPEED * (isExtreme ? 1.0 : (isHard ? 0.94 : 0.88))) : (PLAYER_SPEED * 0.85);
                moveToward(p, s.x, ownHalf(p.team, s.y), markSpeed, dt);
                return;
            }
            const s = defendingSpot(anchor, mine, i);
            moveToward(p, s.x, ownHalf(p.team, s.y), DRILL_SPEED, dt);
        };

        /* one function, both kits — so neither side can be the one that stands
           still while the other plays around it */
        teamOutfield('you').forEach((p, i) => holdShape(p, i));
        teamOutfield('cpu').forEach((p, i) => holdShape(p, i));

        moveCarrier(dt);

        /* 3. and the race itself — the runners picked in 1.b, at full pace, at
              the ball's live position, so they are chasing a ball that is still
              rolling rather than one that stopped dead for them. The chaser is
              clamped to its own half while it is the defending side, so a ball
              spilling back towards the human's end cannot drag a CPU player over
              the line with it: the CPU contests the ball in front of its own
              goal and leaves the human's half alone. */
        chasers.forEach(p => {
            const chaseY = p.team === def ? ownHalf(p.team, ball.y) : ball.y;
            const chaseSpeed = (p.team === 'you' && !p.dest) ? PLAYER_SPEED * 0.92 : PLAYER_SPEED;
            moveToward(p, ball.x, chaseY, chaseSpeed, dt);
        });

        /* a keeper who is running for a loose ball keeps his own line out of it */
        [keeperOf(atk), keeperOf(def)].forEach(k => { if (k && !chasing(k)) updateKeeper(k, dt); });
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

    /* §12.e — cpuThreat() used to live here: "the most dangerous receiver, the
       one closest to the goal it is attacking", read through state.possession,
       which is the side IN POSSESSION — so while the human held the ball it
       named a HUMAN player. Every defender pressed that man and the AI read as
       though it were inside the human's head. It is deleted rather than
       repaired: there is no honest version of "which of your players are you
       about to use", and a defender does not get to know. */

    /** Score each pass with the very race the player will face. */
    function cpuChoosePass(rng, spots) {
        const from = { x: PLAY.carrier.x, y: PLAY.carrier.y };
        const cands = teamOutfield('cpu').filter(p => p !== PLAY.carrier);
        const gk = keeperOf('you');
        const defenders = defenderInputs('you').concat(gk ? [{ x: gk.x, y: gk.y, speed: PLAYER_SPEED }] : []);
        const isHard = state.difficulty >= 1.0;
        const isExtreme = state.difficulty >= 1.5;

        const scored = cands.map(m => {
            const s = spots ? spots.get(m) : null;
            const to = s ? leadSpot(from, m, s) : { x: m.x, y: m.y };
            const race = resolvePassRace({ from, to, defenders, radius: TOUCH_R });
            const groundSafe = race.outcome === 'COMPLETE' ? 1.0 : 0.15;

            // Hard and Extreme AI evaluates aerial / chipped balls over defender blocks
            let safe = groundSafe;
            if (isHard && groundSafe < 0.7 && dist(to, PLAY.goal) < dist(from, PLAY.goal) + 10) {
                m._preferAir = true;
                safe = 0.92;
            } else {
                m._preferAir = false;
            }

            const progress = clamp((dist(from, PLAY.goal) - dist(to, PLAY.goal)) / 50, -0.2, 1.2);
            const shot = dist(to, PLAY.goal) <= SHOT_RANGE ? 0.65 : (dist(to, PLAY.goal) <= SHOT_RANGE * 1.3 ? 0.35 : 0);
            const v = 0.45 * safe + 0.35 * progress + shot + 0.1;
            return isExtreme ? v * v : (isHard ? Math.pow(v, 1.5) : lerp(0.3, v, state.difficulty));
        });

        if (!isHard && rng() > 0.15 + 0.85 * state.difficulty) {
            return cands[Math.floor(rng() * cands.length)] || cands[0];
        }
        return weightedPick(cands, scored, rng).item || cands[0];
    }

    function cpuThink(dt) {
        if (state.possession !== 'cpu') return;
        if (!PLAN || PLAN.armed) return;
        if (ball.mode !== 'held' || ball.holder !== PLAY.carrier) return;
        cpuAssignDuties();
        PLAY.cpuThink -= dt;
        if (PLAY.cpuThink > 0) return;

        const c = PLAY.carrier;
        const rng = mulberry32(hashSeed(state.seed, state.half, Math.floor(state.halfT * 60)));

        const toGoal = dist(c, PLAY.goal);
        const isHard = state.difficulty >= 1.0;
        const isExtreme = state.difficulty >= 1.5;
        const pwr = isExtreme ? 1.0 : (isHard ? 0.92 : 0.7);

        if (toGoal <= SHOT_RANGE &&
            (isHard || rng() < (0.5 + 0.5 * state.difficulty) * (1 - 0.5 * (toGoal / SHOT_RANGE)))) {
            shoot(c, cpuShotAim(isExtreme ? 0.18 : (isHard ? 0.32 : 0.85)), pwr);
            return;
        }

        const target = cpuChoosePass(rng);
        if (!target) return;
        passTo(c, target, BALL_SPEED, { air: isHard && target._preferAir === true, pace: isExtreme ? 1.0 : (isHard ? 0.9 : 0.65) });
    }

    /* ==========================================================================
       § 15. ACTIONS — the three things a human can do, and the two the CPU does.
       ========================================================================== */
    function passTo(from, to, speed, opts) {
        const o = opts || {};
        /* §12.d — the stroke rides through here: `pace` is its length and `air`
           is whether it was long and bent enough to be chipped. Everything else
           that calls a pass (the CPU, autoPass, the shootout) passes neither, and
           gets exactly the ball it always got: standard pace, on the deck. */
        const air = o.air === true;
        ball.lastTouch = from;
        /* §12.b/c — every pass is a rolled ball. It leaves the boot firm, flat on
           the deck, and keeps more than a running pace the whole way, so it beats
           the receiver to the spot and arrives as something he steps onto rather
           than something he overtakes. The CPU's pass, the human's pass and
           autoPass() all come through here, so there is exactly one kind of pass
           in the game.

           `to` is a POINT, always — the spot on the turf that was drawn. The
           ball is never played to a player's live position.

           §12.f — THE STRIKE ORIGIN IS THE BALL, NOT THE BOOT. A carried ball
           rides BALL_CARRY ahead of the carrier, so launching from `from` — a
           body — put the entire flight on a line PARALLEL to the drawn one,
           offset by a body-width. That parallel offset is the whole of the "the
           ball did not go where I drew" report, and it applies to every pass
           from every pass of the ball. Reading the ball's own live position
           makes the drawn line and the flight line share their origin as well as
           their destination. `from` is still the man: it stays the last touch and
           the tutor still reads it.

           §12.f — a chip is a ball over a leg, not a lob, so it stays a ROLL:
           the same CHIP_GAIN-scaled profile, the same arrival fraction, the same
           flight time for the same distance. That is what keeps the drawn
           distance, the strike speed and the moment of arrival describing one
           thing, and it is why `roll` is no longer keyed to `air`. */
        launchBall(kickFrom(from), { x: to.x, y: to.y },
            speed || BALL_SPEED,
            {
                mode: 'pass', passTarget: to.team ? to : null,
                arc: air ? AIR_ARC : ARC_PASS, roll: true, air, pace: o.pace
            });
        /* only a real body can be the receiver; a pass into space has none */
        if (PLAY && to.team) PLAY.receiver = to;
        tutorOnPass(from);
        Sfx.kick();
    }

    /** §5 / §12.h — a shot is only legal inside SHOT_RANGE. It is struck at
        SHOT_SPEED × STRIKE_GAIN, and a shot drawn along a long line is struck up
        to SHOT_POWER_GAIN harder on top of that: the LENGTH OF THE LINE IS THE
        POWER OF THE STRIKE, exactly as it is for a pass. `power` is absent for the
        CPU and for a bare press, and both then keep the flat struck speed. */
    function shoot(from, target, power) {
        if (!PLAY) return false;
        if (dist(from, PLAY.goal) > SHOT_RANGE) {
            log('Too far out to shoot — get inside ' + SHOT_RANGE + '.', '');
            Sfx.bad();
            return false;
        }
        ball.lastTouch = from;
        /* §12.f/§12.g — the shot is struck from the same place the drawn angle
           was measured: the ball's own position. drawnShotRay() projects the
           player's ray from ballPoint(), so launching from the carrier's feet put
           the whole shot on a line parallel to the one held on the grass — a
           body-width of error at the near post, which is the difference between
           the post and the goal. */
        const struck = SHOT_SPEED * STRIKE_GAIN
            * (1 + SHOT_POWER_GAIN * clamp(power === undefined ? 0 : power, 0, 1));
        launchBall(kickFrom(from), target, struck, { mode: 'shot', arc: ARC_SHOT });
        /* §7 — the keeper's dive is set the instant the shot leaves the boot,
           and stays re-writable for the whole flight. A dive the human already
           gave him during the window is NEVER overwritten: that instruction is
           the whole point of the defending phase — the player picked the side,
           and the shot either goes where his keeper is or it does not. */
        const k = keeperOf(other(state.possession));
        if (k) {
            ball.keeperFrom = { x: k.x, y: k.y };
            /* §0.d — one reflex roll per flight, here, beside the CPU's guess.
               A dive the human already drew (queuedDive below) outranks it;
               a keeper who lost this roll still tracks, but never lunges. */
            ball.keeperReflex = Math.random() < KEEPER_REFLEX_CHANCE;
            if (k.queuedDive) {
                k.dive = k.queuedDive;
            } else if (k.team === 'cpu' && !k.held && !k.dive) {
                /* §0.d — the CPU's uncommanded keeper dives on a GUESS. The
                    human's own keeper never guesses: he holds his ground and
                    the shot either finds him or it does not — his dive is the
                    player's to draw, and nobody else's.

                   Everything that made him unbeatable ran through this branch. He
                   was handed the shot's true side (defaultDiveTarget) and then
                   `shotOutcome()` wrapped the rulebook's full KEEPER_REACH around
                   the spot he dove to, from a seat on x = 50 that is already only
                   12.5 from either post. That is a wall, not a save model, and it is
                   also why the computer's keeper read as better than the player's:
                   the human's own dive is a point he DRAWS, so it is only ever as
                   good as his read, while this one was always as good as the truth.

                   Now the side is a coin flip (KEEPER_READ_CHANCE) and the ground is
                   short (KEEPER_STEP), so a keeper who guessed wrong is beaten —
                   including by the ball passing him on the far side — and a keeper
                   who guessed right still has to be beaten at the far post. A dive
                   the human drew during the window is never overwritten (`!k.dive`),
                   which keeps his read the one that decides his own keeper. */
                const gx = PLAY.goal.x;
                const trueSide = target.x === gx ? 1 : Math.sign(target.x - gx);
                const isHard = state.difficulty >= 1.0;
                const isExtreme = state.difficulty >= 1.5;
                const diveChance = clamp(0.2 + 0.35 * state.difficulty + (isExtreme ? 0.38 : (isHard ? 0.18 : 0)), 0, 0.96);
                const readSide = Math.random() < diveChance ? trueSide : -trueSide;
                const diveStep = isExtreme ? KEEPER_STEP * 1.3 : (isHard ? KEEPER_STEP * 1.15 : KEEPER_STEP);
                applyAutoDive(k, { x: gx + readSide * diveStep, y: k.y });
            }
        }
        Sfx.kick(); shake(.12);
        log((from.team === 'you' ? 'You shoot' : 'CPU shoots') + '!', '');
        return true;
    }

    /** §0.d — an uncommanded keeper's dive, from the engine's own model.

        `defaultDiveTarget()` (rules.js) is the honest SHAPE of a dive — go
        toward the shot's side, no further than a single reach — and the shootout
        keeps it, because there the human draws the dive and penaltyKickOutcome()
        reads a committed point. In open play nothing is drawn, and a keeper who
        is handed the shot's side for free is not making a save, he is reading
        the striker's mind. So this sets the same kind of point, from a side the
        caller has already gambled on, and parks him on his own line (y = k.y):
        the dive is lateral, which is what the fair version of §12.h always was.

        One dive per window is enough — openPlan() clears both keepers' dives at
        the top of every window, so nothing here can leak into the next one. */
    /** KEEPER_DIVE_MAX made real: a dive is lateral and short, measured from
        the keeper's own feet. Every site that commits one clamps through
        here, so no read, no guess and no drawn instruction can send a keeper
        across the goal. */
    function clampDiveX(x, fromX) {
        return clamp(x, fromX - KEEPER_DIVE_MAX, fromX + KEEPER_DIVE_MAX);
    }

    function applyAutoDive(k, target) {
        if (!k) return;
        k.dive = { x: clamp(clampDiveX(target.x, k.x), 8, 92), y: k.y };
    }

    /** §12.i — where the CPU aims a shot it has decided to take.

        Two things are wrong with aiming at the middle of the goal. The keeper
        lives there — 12.5 units from each post, and a shot down the centre never
        makes him move — and the middle is the one place his arms cover without a
        step. So the aim is biased into the half of the mouth the keeper is NOT
        standing in, and then jittered across it. `spread` is the jitter as a
        fraction of a half-width: 0.85 is the full band, 0.55 keeps it nearer the
        post it has chosen (and still always inside the mouth).

        The keeper is read LIVE, at the instant the plan is made. That is the
        point of the whole change: §0.d makes him commit to a side on a coin flip
        when the ball is struck, so a plan that aimed down the middle threw the
        guess away instead of punishing a wrong one. */
    function cpuShotAim(spread) {
        const gx = PLAY.goal.x;
        const k = keeperOf('you');
        const away = (k && k.x > gx) ? -1 : 1;
        const isHard = state.difficulty >= 1.0;
        const isExtreme = state.difficulty >= 1.5;
        const cornerBias = isExtreme ? 0.88 : (isHard ? 0.82 : 0.75);
        const mid = clamp(gx + away * GOAL_HALF_WIDTH * cornerBias, 2, 98);
        const effSpread = spread !== undefined
            ? spread * (isExtreme ? 0.2 : (isHard ? 0.35 : 0.5))
            : (isExtreme ? 0.15 : (isHard ? 0.25 : 0.4));
        return {
            x: clamp(mid + (Math.random() - 0.5) * 2 * GOAL_HALF_WIDTH * effSpread, 0, 100),
            y: PLAY.goal.y
        };
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
        from: null, to: null,
        /* true when the spot settles a level quick match, false when the player
           picked PENALTY SHOOTOUT from the menu. Read by PLAY AGAIN only. */
        fromMatch: false
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
    const SO_KICK_BEAT = 0.75;     // the keeper sets, then the strike; the dive breaks on it
    const SO_DIVE_WINDOW = 4.5;    // the human's time to draw a dive
    const SO_RESULT_PAUSE = 1.2;   // the banner, before the next kicker
    const SO_AIM_WINDOW = 10;      // the human's time to draw the aim
    const SO_CPU_BEAT = 1.0;       // the CPU's routine before it strikes

    function setPenaltyView(on) {
        view.zoom = on ? SO_ZOOM : 1;
        view.panY = on ? SO_PAN_Y : 50;
        fitView();
    }

    /* `fromMatch` says WHY the spot is being used, and it is the only thing that
       decides what PLAY AGAIN does at the end. A shootout opened from the menu is
       a mode in its own right, so replaying it replays the shootout. A shootout
       that came out of a level quick match is a *tiebreak* — the evening's fixture
       is the match, not the shootout — so replaying it replays the match. */
    function beginShootout(fromMatch) {
        while (topScreen()) popScreen();
        SO.active = true;
        SO.you = 0; SO.cpu = 0;
        SO.takenYou = 0; SO.takenCpu = 0;
        SO.result = null;
        SO.fromMatch = !!fromMatch;
        state.phase = 'shootout';
        state.matchMode = SO.fromMatch ? 'quick' : 'shootout';
        /* §17.b — penalties are their own machine: no decision window survives it */
        PLAN = null;
        clearIntents();
        setPenaltyView(true);
        /* §8 — the HUD has swapped modes: the readouts are the shootout's now, so
           the regulation log and instruction line would only be stale copy. */
        ui.pens.hidden = false;
        ui.roleStrip.hidden = true;
        setText(ui.instruction, 'Draw your aim, then the dive.');
        bus.emit('half');
        soHudState();
        soSetupKick(Math.random() < 0.5 ? 'you' : 'cpu');
        log('Penalties. Five kicks each, then sudden death.', '');
    }

    function endShootout(silent) {
        SO.active = false;
        /* Restore visibility of all players after shootout */
        allPlayers.forEach(p => { if (p.mesh) p.mesh.visible = true; });
        if (!silent) return;
        /* the shootout's readouts are tear-down too, so leaving penalties never
           leaves a stale dots row behind in the regulation HUD */
        ui.pens.hidden = true;
        setPenaltyView(false);
        if (ui.pens) ui.pens.hidden = true;
        /* Hand the top-centre band back to the role strip — but never over a
           screen, so it mirrors #hud-top, the same show/hide gate. */
        ui.roleStrip.hidden = ui.hudTop.hidden;
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
        const keeperY = goal.y;  // Set keeper on the goal line
        allPlayers.forEach(p => {
            p.controlled = false;
            p.dest = null;
            p.dive = null;
            p.queuedDive = null;
            p.held = false;
            /* Hide all players except the kicker and keeper during shootout */
            const isKicker = p === kicker;
            const isKeeper = p === k;
            if (p.mesh) p.mesh.visible = (isKicker || isKeeper);
        });
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
            /* the CPU's keeper reads the kick with probability scaled by difficulty */
            const isHard = state.difficulty >= 1.0;
            const isExtreme = state.difficulty >= 1.5;
            const readChance = clamp(0.22 + 0.45 * state.difficulty + (isExtreme ? 0.34 : (isHard ? 0.16 : 0)), 0, 0.97);
            const read = Math.random() < readChance;
            const side = Math.random() < 0.5 ? -1 : 1;
            /* The guess is capped at KEEPER_DIVE_MAX from where the keeper
               stands — even a perfect read cannot send him beyond his reach. */
            const kx = k ? k.x : 50;
            const target = read
                ? { x: clampDiveX(SO.aim.x, kx), y: k.y }
                : { x: clamp(clampDiveX(SO.aim.x + side * (GOAL_HALF_WIDTH * 1.35), kx), 4, 96), y: k.y };
            /* Held as a QUEUED dive, not a live one. The keeper has made his
               read, but he does not break for the corner until the ball is
               actually struck (soStrike). Setting k.dive here launched him
               during the beat below, so he was airborne BEFORE the kick — a
               keeper who dives before the shot. */
            if (k) k.queuedDive = target;
            SO.dive = target;
            /* a beat for the keeper to set, then the strike — the dive breaks on it */
            SO.t = off ? SO_KICK_BEAT * 0.6 : SO_KICK_BEAT;
            setPenaltyView(true);
        } else {
            log(off ? 'Off target — the keeper dives anyway.' : 'Draw your dive — anywhere along the line.', '');
            SO.t = SO_DIVE_WINDOW;   // no dive? default to the shot's side
        }
    }

    function soCommitDive(point) {
        if (SO.phase !== 'dive') return;
        const k = soDefKeeper();
        /* The drawn dive is capped at KEEPER_DIVE_MAX from the keeper's spot —
           a drag to the far corner is pulled back to the furthest he can go. */
        if (k && point) point = { x: clamp(clampDiveX(point.x, k.x), 4, 96), y: k.y };
        SO.dive = point;
        /* Queued, exactly like the CPU's read: the drawn dive is committed the
           moment it is drawn, but the keeper only sets off when the strike
           fires. */
        if (k) k.queuedDive = point;
        soStrike();
    }

    /** The kick itself: the ball travels to the goal, and only then is the
        outcome read. Resolving the moment the dive was drawn skipped the flight
        entirely — the ball sat on the spot while the banner appeared. */
    function soStrike() {
        if (SO.phase !== 'dive') return;
        SO.phase = 'flight';
        SO.t = SO_FLIGHT;                 // a countdown, like every other phase
        /* NOW the dive breaks. The keeper's committed point was held as
           `queuedDive` for the whole pre-strike beat; promoting it to the live
           `dive` on the exact frame the ball leaves is what makes him react to
           the kick instead of guessing before it. */
        const k = soDefKeeper();
        if (k && k.queuedDive) { k.dive = k.queuedDive; k.queuedDive = null; }
        SO.from = { x: ball.x, y: ball.y };
        SO.to = { x: SO.aim ? SO.aim.x : soGoal().x, y: soGoal().y };
        SO.after = () => soResolve();
    }

    function soResolve() {
        if (!SO.result) {
            SO.result = penaltyKickOutcome({
                shotTarget: SO.aim,
                divePoint: SO.dive || { x: soGoal().x, y: soGoal().y },
                /* a keeper who never left his line only stops what is within
                   arm's reach — the full penalty reach belongs to the dive */
                reach: SO.dive ? RULES.PENALTY_KEEPER_REACH : KEEPER_SAVE_REACH,
                goalX: soGoal().x,
                goalHalfWidth: GOAL_HALF_WIDTH
            });
        }
        SO.phase = 'result';
        SO.t = SO_RESULT_PAUSE;           // a beat to read the banner, then on

        const kicker = SO.turn;
        if (SO.result.outcome === 'GOAL') {
            if (kicker === 'you') SO.you++; else SO.cpu++;
            if (kicker === 'you') Sfx.goal(); else Sfx.concede();
            shake(.5);
            banner('GOAL', kicker === 'you' ? CSS.you : CSS.cpu);
        } else if (SO.result.outcome === 'SAVED') {
            /* posture picks the word, exactly as in open play: a keeper who
               dove throws his legs at it and parries; one who stood his
               ground gets his body behind it and catches */
            const k = soDefKeeper();
            Sfx.save(); shake(.25);
            banner(k && k.dive ? 'PARRIED' : 'SAVED', CSS.warn);
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
                const isExtreme = state.difficulty >= 1.5;
                const isHard = state.difficulty >= 1.0;
                const spread = GOAL_HALF_WIDTH * (isExtreme ? 0.88 : (isHard ? 0.78 : (0.55 + 0.5 * state.difficulty)));
                /* miss the target occasionally, more often on the lower settings */
                const wild = rng() < 0.18 * Math.max(0, 1 - state.difficulty);
                const aim = wild
                    ? clamp(soGoal().x + (rng() < .5 ? -1 : 1) * (GOAL_HALF_WIDTH + randRange(rng, 1, 9)), 2, 98)
                    : (isExtreme
                        ? clamp(soGoal().x + (rng() < .5 ? -1 : 1) * randRange(rng, spread * 0.85, spread), 2, 98)
                        : clamp(soGoal().x + randRange(rng, -spread, spread), 2, 98));
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
                if (k && (k.dive || k.queuedDive)) {
                    /* The keeper is already committed — the CPU's own read, or the
                       dive the human just drew. Strike without touching it: the
                       old fallback re-derived the dive here, which handed the CPU
                       keeper a second, better guess on every kick the human took
                       and quietly turned an honest read into a free save. The
                       commitment now lives in `queuedDive` until the strike, so it
                       is checked here too — falling through would re-roll it. */
                    soStrike();
                } else if (soDefTeam() === 'cpu') {
                    /* §7 — no input means the default dive, to the shot's side */
                    soCommitDive(k ? defaultDiveTarget(k, SO.aim, KEEPER_REACH)
                        : { x: SO.aim.x, y: soGoal().y });
                } else {
                    /* the human's keeper holds his line: no dive unless the
                       player drew one, and the strike fires on his feet */
                    soStrike();
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
        if (k && k.dive) moveToward(k, k.dive.x, k.dive.y, DIVE_SPEED * KEEPER_SCALE, dt);
    }

    /* ==========================================================================
       § 17. INPUT — Pointer Events: one code path for mouse, touch and pen
       ========================================================================== */
    /* §12.d — `path` is the gesture's own polyline, and it exists only while the
       man on the ball is being drawn for: it is what the freehand stroke is
       rendered from, and what readStroke() measures at the moment of release to
       decide the power of the pass and whether the ball goes in the air. */
    const drag = { kind: null, player: null, x0: 0, y0: 0, x: 0, y: 0, moved: 0, id: null, path: null };
    let lastTap = { t: 0, x: 0, y: 0 };

    /* ==========================================================================
       HUD-AWARE VIEWPORT INSETS
       --------------------------------------------------------------------------
       Nothing the HUD docks — the score capsule, the menu button, the shootout
       strip, the action buttons, the guide line — may sit on the playable turf.
       Everything visible is measured, classified to the edge it hugs, and the
       camera fit (and every pointer conversion) is then computed against
       whatever box is left in the middle. No offset is pinned in pixels: the
       reservation is whatever the real boxes currently measure, so it holds at
       any device dimension.
       ========================================================================== */
    const INSET_GUTTER = 6;        // px of clear turf between a dock and the board
    const insets = { t: 0, r: 0, b: 0, l: 0 };
    let needFit = false;           // set when the HUD boxes move; frame() re-fits

    /* The WebGL buffer only ever has a different shape from the CSS box while
       the rotate-to-landscape gate is up — and while that gate is up the whole
       HUD is behind a full-screen overlay, so it does not need to be dodged. The
       gate itself is therefore the entire test.

       This used to be `w > h * 1.25 && (isTouchDevice() || isLandscapeShape())`,
       and since isLandscapeShape() is just `w > h` it was true for EVERY
       desktop landscape window: viewFrame() then returned zero insets and the
       whole "nothing may sit on the pitch" guarantee switched itself off on PC,
       which is exactly the machine the guide card was overhanging the turf on. */
    let land = false;
    function landscapeCanvas() {
        land = rotateHold;
        return land;
    }

    /* Which edge is this box docked to?

       A box spanning most of the width is a bar: top or bottom, by which half of
       the screen its centre falls in. A box spanning a good part of the height —
       or hanging in the vertical middle, where neither band is anywhere near it —
       is railed to a side; the desktop in-match guide card is the only one of
       those. Every other box is a corner chip, and this match's corner chips (the
       menu button, the two action buttons, the outcome banner) are all furniture
       of the top and bottom bands, so that is where they dock.

       That last rule is load-bearing, and it is why this no longer simply takes
       the nearest edge. The menu button is a 44px square sitting `--hud-pad` from
       the top and `--hud-pad` from the right of a top bar that is taller than it
       is, so the button's own box is two or three pixels nearer the RIGHT edge
       than the top one. Read as "nearest edge" it docked 'r', reserved 45% of the
       screen width as a right-hand rail, and squeezed the whole board into the
       left half of a phone, at a bit over half its width. A corner chip sits in
       the top (or bottom) band already, so reserving that band is all it needs. */
    function dockOf(r, w, h) {
        const wFrac = r.width / Math.max(1, w);
        const hFrac = r.height / Math.max(1, h);
        const cy = r.top + r.height / 2;
        if (wFrac >= 0.5) return cy < h / 2 ? 't' : 'b';
        const gT = Math.max(0, r.top), gB = Math.max(0, h - r.bottom);
        const gL = Math.max(0, r.left), gR = Math.max(0, w - r.right);
        if (hFrac >= 0.4 || (gT > h * 0.25 && gB > h * 0.25)) return gL < gR ? 'l' : 'r';
        return cy < h / 2 ? 't' : 'b';
    }

    /* The top bar and the bottom bar are full-bleed boxes: their own rect covers
       the whole board even though their contents do not. They contribute the
       union of their children instead of themselves. */
    const LAYOUT_CONTAINERS = ['#hud-top', '#hud-bottom'];
    const CARD_SELECTORS = [
        '#hud-top', '#hud-bottom', '#hud-pens', '#btn-menu-open',
        '#instruction', '#banner', '.hud-actions', '.hud-capsule'
    ];

    /* Things that are painted OVER the middle of the board, or that only exist
       as an overlay on top of it. Reserving turf for them would be wrong twice
       over: #plan-panel is the decision ring drawn at the pitch centre (its box
       IS the play area, so measuring it would cap an inset at 45% of the screen
       and gut the board), #menu-sheet and its scrim are a dropdown over the
       pitch that would shove the camera every time it opened, and #goal-fx is
       the goal flash. None of them is docked to an edge. */
    const NEVER_MEASURE = '#plan-panel, #menu-sheet, .sheet-scrim, #goal-fx';

    function measureHudInsets(w, h) {
        const t = { t: 0, r: 0, b: 0, l: 0 };
        const seen = new Set();
        const add = box => {
            if (!box || box.width < 1 || box.height < 1) return;
            const side = dockOf(box, w, h);
            const d = side === 't'
                ? Math.max(0, box.bottom)
                : side === 'b'
                    ? Math.max(0, h - box.top)
                    : side === 'l'
                        ? Math.max(0, box.right)
                        : Math.max(0, w - box.left);
            if (d > t[side]) t[side] = d;
        };

        CARD_SELECTORS.forEach(sel => {
            document.querySelectorAll(sel).forEach(node => {
                if (node.hidden || node.getAttribute('aria-hidden') === 'true') return;
                if (node.closest(NEVER_MEASURE)) return;
                const cs = getComputedStyle(node);
                if (cs.display === 'none' || cs.visibility === 'hidden') return;
                if (LAYOUT_CONTAINERS.indexOf(sel) >= 0) {
                    Array.from(node.children).forEach(ch => {
                        if (seen.has(ch)) return;
                        seen.add(ch);
                        add(ch.getBoundingClientRect());
                    });
                    return;
                }
                if (seen.has(node)) return;
                seen.add(node);
                const r = node.getBoundingClientRect();
                if (r.width >= w - 0.5 && r.height >= h - 0.5) return;   // a full bleed, not a dock
                add(r);
            });
        });

        /* every other control the match puts on the stage — the menu sheet's own
           buttons included, since that sheet is a dropdown over the board */
        document.querySelectorAll('#stage button, #stage input, #stage .segmented').forEach(node => {
            if (seen.has(node) || node.hidden) return;
            /* a control inside the sheet follows the sheet, not the pitch — the
               `closest` test is what keeps the dropdown's own buttons from
               reserving turf while the dropdown is open */
            if (node.closest(NEVER_MEASURE)) return;
            seen.add(node);
            const cs = getComputedStyle(node);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
            add(node.getBoundingClientRect());
        });

        /* The board has to stay usable however tall the docked furniture gets:
           no single edge may eat more than 45% of its own axis. */
        const capped = {};
        ['t', 'r', 'b', 'l'].forEach(side => {
            const axis = (side === 't' || side === 'b') ? h : w;
            capped[side] = Math.min(t[side], axis * 0.45);
        });
        const next = {
            t: capped.t ? capped.t + INSET_GUTTER : 0,
            b: capped.b ? capped.b + INSET_GUTTER : 0,
            l: capped.l ? capped.l + INSET_GUTTER : 0,
            r: capped.r ? capped.r + INSET_GUTTER : 0
        };
        if (next.t !== insets.t || next.b !== insets.b
            || next.l !== insets.l || next.r !== insets.r) needFit = true;
        insets.t = next.t; insets.b = next.b; insets.l = next.l; insets.r = next.r;
    }

    /* The box the board is actually painted into: the canvas minus the docks.
       One derivation, shared by the camera fit and by both pointer conversions,
       so a tap can never disagree with what is drawn. */
    function viewFrame(r) {
        const w = r.width, h = r.height;
        if (landscapeCanvas()) return { l: 0, t: 0, r: 0, b: 0, availW: w, availH: h };
        const l = Math.min(w * 0.45, insets.l), t = Math.min(h * 0.45, insets.t);
        const rr = Math.min(w * 0.45, insets.r), b = Math.min(h * 0.45, insets.b);
        return { l, t, r: rr, b, availW: Math.max(1, w - l - rr), availH: Math.max(1, h - t - b) };
    }

    function canvasPoint(e) {
        const r = canvas.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        const F = viewFrame(r);
        /* One game unit of y is availH / (2 * view.hh) pixels — the same
           conversion fitView() writes into the projection — so a tap and the
           artwork agree by construction. view.hw is in screen units, where x is
           already compressed by KX; divide it back out to land on the canonical
           0…100 grid. `panY` is where the frame's centre sits in game-y. */
        const scale = (2 * view.hh) / F.availH;
        const gx = 50 + (px - (F.l + F.availW / 2)) * scale / KX;
        const gy = view.panY - (py - (F.t + F.availH / 2)) * scale;
        return { x: gx, y: gy, px, py, rect: r, frame: F };
    }
    const screenRadius = rect => Math.max(18, rect.height * 0.055 * view.zoom);

    function pickPlayer(pt) {
        let best = null, bd = Infinity;
        const r = screenRadius(pt.rect);
        const F = pt.frame || viewFrame(pt.rect);
        const scale = (2 * view.hh) / F.availH;
        const cx = F.l + F.availW / 2, cy = F.t + F.availH / 2;
        allPlayers.forEach(p => {
            const a = {
                x: cx + ((p.x - 50) * KX) / scale,
                y: cy - ((p.y - view.panY) / (2 * view.hh)) * F.availH
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
        if (rotateHold || topScreen() || state.paused) return;
        if (e.button !== undefined && e.button !== 0) return;
        const pt = canvasPoint(e);
        drag.x0 = pt.x; drag.y0 = pt.y; drag.x = pt.x; drag.y = pt.y; drag.moved = 0; drag.id = e.pointerId;
        drag.path = null;
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
            /* §12.d — the man on the ball gets TWO lines, drawn one after the
               other: the first is the ball (the point you are passing to, or the
               angle you will shoot along), the second is his own run once the
               ball has gone. A third line means he has changed his mind, so it
               wipes both and starts again.
               "Which line is this?" is asked HERE, at the start of the gesture,
               because that is the only moment the answer is known before the
               stroke itself changes it. */
            drag.kind = 'aim'; drag.player = p;
            if (AIM.pass && AIM.move) aimReset();   // third line: wipe both
            AIM.slot = AIM.pass ? 2 : 1;
            /* §12.f — the stroke starts ON THE BALL, not under the finger. The
               finger supplies the DIRECTION; the ball supplies the ORIGIN, so the
               line drawn on the grass and the line of flight are anchored at the
               same end. Seeding this with the touch point is what made a stroke
               drawn from the carrier's chest ride a body-width off his own ball. */
            drag.path = [ballPoint()];
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
            /* §12.d — the drawing IS the plan. The stroke under the finger is kept
               point for point (a 0.8-unit gap filter, capped at STROKE_MAX) and
               handed straight back to a freehand line, so what the player sees on
               the grass is exactly the path they drew: not a chord, and not a
               snap onto whichever teammate the drag went near. The colour says
               what the line will DO — slot 1 glows amber when the drawn angle is
               on target or a mate is in the lane, dims to grey when it is neither
               (a shot that is going to miss), and slot 2, the carrier's own run,
               is drawn faint because it is a plan and not a ball. aimLine stays
               hidden for the whole gesture: two lines for one gesture would read
               as two different instructions. */
            const path = drag.path;
            if (path) {
                const last = path[path.length - 1];
                if (Math.hypot(drag.x - last.x, drag.y - last.y) >= 0.8 && path.length < STROKE_MAX) {
                    path.push({ x: drag.x, y: drag.y });
                }
                const mate = AIM.slot === 2 ? null : mateInDirection(drag.x0, drag.y0, drag.x, drag.y);
                // Store the locked receiver candidate during the drag
                drag.lockedReceiver = mate;
                const line = AIM.slot === 2 ? moveCurve : strokeLine;
                if (AIM.slot === 2) {
                    line.material.color.setHex(COL.ghost);
                    line.material.opacity = .45;
                } else {
                    const t = shotTargetFor(ballPoint(), { x: drag.x, y: drag.y });
                    const hit = t && isOnTarget(t.x, PLAY.goal.x, GOAL_HALF_WIDTH);
                    line.material.color.setHex(hit || mate ? COL.aim : (t ? COL.bad : COL.ghost));
                    line.material.opacity = .95;
                }
                line.setPoints(path);
                line.visible = true;
                runnerMarker.visible = !!mate;
                if (mate) runnerMarker.position.set(worldX(mate.x), 0.09, worldZ(mate.y));
            }
            aimLine.visible = false;
        } else if (drag.kind === 'move' && drag.moved > TAP_SLOP) {
            runnerMarker.visible = true;
            runnerMarker.position.set(worldX(clamp(pt.x, 5, 95)), 0.09, worldZ(clamp(pt.y, 5, 95)));
        } else if (drag.kind === 'keeper' && drag.moved > TAP_SLOP) {
            const isLiveShot = ball.mode === 'shot';
            const target = { x: clamp(clampDiveX(pt.x, drag.player.x), 8, 92), y: drag.player.y };
            drag.player.held = true;
            if (isLiveShot) {
                drag.player.dive = target;
            } else {
                drag.player.queuedDive = target;
                drag.player.dive = null;
            }
            diveLine.setEnds(drag.player, target);
            diveLine.visible = true;
            diveMarker.position.set(worldX(target.x), 0.09, worldZ(target.y));
            diveMarker.visible = true;
        } else if (drag.kind === 'so-aim' && drag.moved > TAP_SLOP * 0.5) {
            /* no aim guide: the shot is the player's read, drawn blind */
            aimLine.visible = false;
            shotLine.visible = false;
        } else if (drag.kind === 'so-dive' && drag.moved > TAP_SLOP * 0.5) {
            /* The dive belongs to the keeper on the line — the defending side's,
               which is *your* keeper exactly because the shootout only opens this
               gesture when the CPU is the kicker. Taken from soDefKeeper() rather
               than hard-coded to 'you' so the two can never drift apart. */
            const k = soDefKeeper();
            if (k) {
                const target = { x: clamp(clampDiveX(pt.x, k.x), 4, 96), y: k.y };
                diveLine.setEnds(k, target);
                diveLine.visible = true;
                diveMarker.position.set(worldX(target.x), 0.09, worldZ(target.y));
                diveMarker.visible = true;
            }
        }
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
        const lockedReceiver = drag.lockedReceiver;
        drag.kind = null; drag.player = null; drag.id = null; drag.lockedReceiver = null;

        if (kind === 'aim') {
            /* §12.d — release commits the line, and WHICH line it is was decided
               back at pointerdown, so a stroke that grew long enough to become a
               shot cannot change its meaning halfway through the gesture. Slot 1
               is the ball: if the drawn angle crosses the goal line it is a shot,
               and it is HELD for the SHOOT button or the double-tap so that the
               ball leaves along the angle that was drawn; if it crosses nothing,
               it is a pass to the point the line ends on, struck with the power
               and the air the stroke earned. Slot 2 is the carrier's own run,
               kept for beginExecution() to fire the moment the ball has gone. */
            const pts = drag.path || [];
            drag.path = null;
            aimLine.visible = false;
            runnerMarker.visible = false;
            if (moved > TAP_SLOP && pts.length > 1) {
                const stroke = readStroke(pts);
                if (AIM.slot === 2) {
                    AIM.move = stroke;
                    moveCurve.setPoints(stroke.pts);
                    moveCurve.visible = true;
                    log('Run drawn: the carrier follows it once the ball is away.', '');
                } else {
                    /* §12.f — the committed stroke is re-seated on the ball's own
                       position and re-aimed at the point the finger stopped on. A
                       stroke is drawn from a body and the ball is struck from a
                       ball, and `anchored` collapses the BALL_CARRY between the
                       two: every point is projected onto the ball→finger ray, so
                       the line the player keeps on the grass IS the ball's line,
                       from its first point to its last. Everything downstream —
                       the shot ray, the queued pass point, the preview — reads
                       this ONE object, which is what makes one line mean one
                       thing. */
                    const shot = anchored(stroke, ballPoint());
                    /* §12.f — and the END of the stroke is the finger's RELEASE
                       point, not merely the last sample the 0.8-unit gap filter
                       happened to keep. A flick that lifts and lands a couple of
                       units further on dribbles the ball short of the spot the
                       line visibly ended on; so the released point is written in
                       and the stroke is re-read from it, which re-derives the
                       length (and through it the power and the air) from the line
                       the player can actually see. */
                    shot.pts[shot.pts.length - 1] = { x: pt.x, y: pt.y };
                    const landed = readStroke(shot.pts);
                    AIM.pass = landed;
                    passCurve.setPoints(landed.pts);
                    passCurve.visible = true;
                    strokeLine.visible = false;
                    const t = shotTargetFor(ballPoint(), landed.end);

                    // If a teammate was locked during the pass, assign them as receiver and set run intent
                    if (lockedReceiver && PLAY) {
                        PLAY.receiver = lockedReceiver;
                        lockedReceiver.duty = 'receiver';
                        // Queue the locked receiver to run to the pass target
                        setIntent(lockedReceiver, landed.end);
                    }

                    /* §12.f — THE DRAWN LINE IS ALWAYS THE QUEUED BALL.
                       This is the whole of the "passing to my own half instead of
                       the forward line I drew" report. An angle that had a
                       goal-line answer used to queue NOTHING: it was "held" for
                       the SHOOT button and the double-tap, and if the player
                       closed the window with MOVES DONE instead, the plan held no
                       pass at all and beginExecution() fell through to
                       autoPass() — a random delivery that could point at the
                       passer's OWN half while the forward line he had just drawn
                       sat on the grass meaning nothing. Straight up the pitch is
                       exactly where the goal is, so almost every forward line has
                       a goal-line answer and almost every forward pass was being
                       thrown away. The queue therefore happens FIRST and
                       unconditionally; SHOOT and the double-tap re-queue the shot
                       on top of it and null the pass again (queueShot), which is
                       what makes an angle an upgrade of a pass into a shot rather
                       than the replacement of one. */
                    const queued = queuePass(landed.end, landed, t ? true : false);
                    if (t) {
                        log(isOnTarget(t.x, PLAY.goal.x, GOAL_HALF_WIDTH)
                            ? 'Angle set: the ball goes down the drawn line — SHOOT to strike it.'
                            : 'Angle set: the ball goes down the drawn line, heading wide of goal.', '');
                    } else if (queued) {
                        const receiverMsg = lockedReceiver ? ' to ' + lockedReceiver.label : ' to space';
                        log('Queued: pass of power ' + Math.round(landed.power * 100) + '%'
                            + (landed.air ? ', in the air' : '') + receiverMsg + '.', '');
                    } else {
                        log('Draw a line towards a teammate or the goal.', '');
                    }
                }
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
                /* the straight pooled path replaces the freehand stroke the same
                   instant it is queued, so a run is never drawn twice. */
                moveCurve.visible = false;
                log(player.label + ' set to run.', '');
                tutorOnSend(player, dest);
            }
            player.selected = false;
            runnerMarker.visible = false;
        } else if (kind === 'keeper') {
            const isLiveShot = ball.mode === 'shot';
            if (moved > TAP_SLOP) {
                const target = { x: clamp(clampDiveX(pt.x, player.x), 8, 92), y: player.y };
                player.held = true;
                if (isLiveShot) {
                    player.dive = target;
                } else {
                    player.queuedDive = target;
                    player.dive = null;
                }
                log('Keeper set to ' + (target.x < 50 ? 'their left' : 'their right') + '.', '');
            } else {
                player.held = false;
                player.queuedDive = null;
                if (!isLiveShot) {
                    player.dive = null;
                }
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
            if (rotateHold) return;
            if (topScreen() && topScreen() !== 'menu' && topScreen() !== 'over') popScreen();
            else if (!topScreen() && state.phase !== 'idle' && state.phase !== 'over') pauseGame();
            return;
        }
        if (rotateHold || topScreen()) return;
        if (e.key === 'm' || e.key === 'M') toggleMute();
        if (e.key === 'r' || e.key === 'R') { if (state.phase !== 'idle') beginMatch(); }
        if (e.key === 'h' || e.key === 'H') pushScreen('tutorial', { focus: '#btn-tut-close' });
        if (e.key === 'a' || e.key === 'A') { e.preventDefault(); humanDone(); }
        if (e.key === 's' || e.key === 'S') { e.preventDefault(); shootFromButton(); }
        /* §17.b — Space is the PC shoot key, and Enter closes the decision window
           the same way the MOVES DONE button does. */
        if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); shootFromButton(); }
        if (e.key === 'Enter') { e.preventDefault(); humanDone(); }
    });

    /* ==========================================================================
       § 17.b SIMULTANEOUS PLANNING — the decision window.
       The match now runs in two beats. A *decision window* opens the moment a
       side wins the ball; for a few seconds the board is frozen and the match
       clock stops for both sides, while each side stacks up every move it means
       to make — a pass, a run for each player, a keeper dive, a shot. Nothing
       resolves one at a time. The window closes when the human presses MOVES DONE
       (or when it expires), and both sides' stacked moves fire together. A side
       that says nothing auto-plays, so the match never stalls.
       ========================================================================== */
    /* §17.b — how long the window stays open is the player's choice: 3, 5, 10 or
       20 seconds, 10 by default. The match clock is STOPPED while a window runs,
       so this budget is thinking time and nothing else — changing it can never
       change the length of a match. rules.js keeps its own PLAN_WINDOW for the
       rulebook's property tests; the engine reads `planWindow`. */
    const PLAN_WINDOW_STEPS = [3, 5, 10, 20];
    const PLAN_WINDOW_DEFAULT = 10;
    let planWindow = PLAN_WINDOW_DEFAULT;
    const PLAN_CPU_BEAT = 0.9;    // the CPU quietly "clicks Done" about here

    /* §3 — the half length is the player's choice too: 1, 2 or 3 minutes a
       half, 2 by default. rules.js keeps its own HALF_LENGTH = 120 for the
       rulebook's property tests (the verify summary reads the rulebook, not
       the engine); the engine reads `halfLength`. */
    const HALF_LENGTH_STEPS = [60, 120, 180];
    const HALF_LENGTH_DEFAULT = 120;
    let halfLength = HALF_LENGTH_DEFAULT;

    /** §3 — set the half length and re-sync both surfaces' pills. A running
        clock is never rewound or stretched: the new length applies from the
        next match, and a half already past a newly shorter length simply
        ends on its next tick. */
    function setHalfLength(secs) {
        const n = Math.round(Number(secs));
        halfLength = HALF_LENGTH_STEPS.indexOf(n) >= 0 ? n : HALF_LENGTH_DEFAULT;
        [ui.halfLen, ui.halfLenStart].forEach(group => {
            if (!group) return;
            Array.from(group.querySelectorAll('button[data-half]')).forEach(b =>
                b.setAttribute('aria-pressed', String(Number(b.dataset.half) === halfLength)));
        });
    }

    /** §17.b — set the decision-window budget and re-sync the HUD. The window is
        an input to two things only: the `t` a fresh plan starts with, and the
        fraction the ring is drawn from — so both are handled here and nowhere
        else. A window already running is capped to the new budget (never pushed
        out) or the ring would sit full and the countdown would look stuck. */
    function setPlanWindow(secs) {
        const n = Math.round(Number(secs));
        planWindow = PLAN_WINDOW_STEPS.indexOf(n) >= 0 ? n : PLAN_WINDOW_DEFAULT;
        if (PLAN && !PLAN.armed && PLAN.t > planWindow) PLAN.t = planWindow;
        lastPlanBar = -1;
        [ui.planWin, ui.planWinStart].forEach(group => {
            if (!group) return;
            Array.from(group.querySelectorAll('button[data-lock]')).forEach(b =>
                b.setAttribute('aria-pressed', String(Number(b.dataset.lock) === planWindow)));
        });
        refreshPlanHud();
    }

    let PLAN = null;

    function newPlan() {
        return {
            atk: state.possession, def: other(state.possession),
            t: planWindow, cpuT: 0, cpuPlanned: false, armed: false,
            pass: { you: null, cpu: null },
            shot: { you: null, cpu: null },
            /* §12.d — the second line the human can draw: where the man on the
               ball runs once the ball has gone. It is a plan like any other, so
               it rides in the plan, is wiped with it, and is read by nobody but
               beginExecution(). The CPU never looks at it. */
            move: { you: null, cpu: null }
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
        [keeperOf('you'), keeperOf('cpu')].forEach(k => { if (k) { k.dive = null; k.queuedDive = null; k.held = false; } });
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
    function queuePass(to, stroke, silent) {
        if (!PLAN || PLAN.armed || !to) return false;
        const team = state.possession;
        /* copied to a fresh bare point on purpose: storing the player object here
           is what used to let the ball be led to that player's live position
           instead of travelling to the point that was drawn. The stroke rides
           along as two bare numbers — the length-derived pace and the air flag —
           so the ball that is struck in beginExecution carries the properties the
           gesture earned without the plan holding on to a single live object. */
        PLAN.pass[team] = {
            x: to.x, y: to.y,
            power: stroke ? stroke.power : 0,
            air: stroke ? stroke.air === true : false
        };
        PLAN.shot[team] = null;
        /* the carrier is told to stay put, so a queued pass is a pass and not
           also a sprint — the ball leaves his boot, not his boot and his legs.
           Unless he drew himself a run, which is the one case where he IS going
           somewhere: that is the pass-and-move, and it is honoured in
           beginExecution() the moment the ball is away. */
        const c = PLAY && PLAY.carrier;
        if (c && !AIM.move) setIntent(c, { x: c.x, y: c.y });
        if (team === 'you' && !silent) log('Queued: pass to ' + (to.label || 'space') + '.', '');
        return true;
    }

    /** Stack a shot. The button, Space and S, and the double-tap all land here.
        §12.d — the shot leaves along the angle that was DRAWN. The drag sets the
        line and this fires on it: where that line crosses the byline is the
        target, so a line drawn at the near post goes to the near post and a line
        drawn across the face misses the far side. The target itself comes from
        drawnShotRay(), which ALWAYS answers with a point ON the drawn line —
        where it meets the byline, or its own end when it has no byline answer —
        so this call can no longer invent a line of its own. Only a gesture with
        no line at all (a bare button press, Space, S) falls back to the post the
        keeper is furthest from. Dead centre used to be that default and it was
        the worst answer available: keeperHome() parks the keeper on x = 50, so a
        bare button press flew straight at him and the save-test geometry did the
        rest (the test is the distance from the keeper's dive target to the ball's
        flight path, and the flight path passed through him). */
    function queueShot() {
        if (!PLAN || PLAN.armed || !PLAY || PLAY.atk !== 'you') return false;
        const c = PLAY.carrier;
        if (!c) return false;
        if (ball.mode !== 'held' || ball.holder !== c) return false;
        if (dist(c, PLAY.goal) > SHOT_RANGE) {
            log('Shooting only works inside ' + SHOT_RANGE + ' units of the goal.', '');
            return false;
        }
        const drawn = drawnShotRay();
        const keeper = keeperOf('cpu');
        const side = (keeper && keeper.x > PLAY.goal.x) ? -1 : 1;
        /* §12.d — the strike carries the length of the line that is still held on
           the grass, so SHOOT and the double-tap both fire a ball as hard as the
           gesture that set the angle earned. The fallback is a shot with NO line
           — a bare button press, Space, S — and a line that was never drawn has
           no power to carry, so that one is struck at exactly SHOT_SPEED. */
        PLAN.shot.you = drawn
            ? { x: drawn.x, y: drawn.y, power: AIM.pass ? AIM.pass.power : 0 }
            : { x: clamp(PLAY.goal.x + side * GOAL_HALF_WIDTH * 0.72, 2, 98), y: PLAY.goal.y, power: 0 };
        PLAN.pass.you = null;
        setIntent(c, { x: c.x, y: c.y });
        log(drawn
            ? (isOnTarget(drawn.x, PLAY.goal.x, GOAL_HALF_WIDTH)
                ? 'Queued: shot along the drawn angle.'
                : 'Queued: shot along the drawn angle — it is heading wide.')
            : 'Queued: shot at goal.', '');
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
            const c = PLAY.carrier;
            const mates = teamOutfield('cpu').filter(m => m !== c);
            const spots = new Map();

            const isHard = state.difficulty >= 1.0;
            const isExtreme = state.difficulty >= 1.5;

            if (isHard) {
                // Coordinated Attacking System for Hard & Extreme:
                // Assign dynamic tactical forward runs: striker box penetration, wing width, playmaker pockets
                const goalY = PLAY.goal.y;
                const carrierY = c.y;
                const sortedByX = mates.slice().sort((a, b) => a.x - b.x);
                const leftWinger = sortedByX[0];
                const rightWinger = sortedByX[sortedByX.length - 1];
                const central = sortedByX.slice(1, -1).sort((a, b) => dist(a, PLAY.goal) - dist(b, PLAY.goal));
                const striker = central[0] || mates[0];
                const amf = central[1] || mates[1];
                const channelRunner = central[2] || mates[2];
                const anchor = central[3] || mates[3];

                const fwdT = isExtreme ? 0.86 : 0.74;

                if (striker) {
                    spots.set(striker, {
                        x: clamp(PLAY.goal.x + (rng() - 0.5) * (isExtreme ? 16 : 24), 22, 78),
                        y: clamp(lerp(carrierY, goalY, fwdT), 8, 92)
                    });
                }
                if (leftWinger) {
                    spots.set(leftWinger, {
                        x: clamp(Math.min(c.x - 24, 14 + rng() * 8), 8, 30),
                        y: clamp(lerp(carrierY, goalY, isExtreme ? 0.78 : 0.66), 10, 90)
                    });
                }
                if (rightWinger) {
                    spots.set(rightWinger, {
                        x: clamp(Math.max(c.x + 24, 86 - rng() * 8), 70, 92),
                        y: clamp(lerp(carrierY, goalY, isExtreme ? 0.78 : 0.66), 10, 90)
                    });
                }
                if (amf) {
                    spots.set(amf, {
                        x: clamp(50 + (rng() - 0.5) * 20, 26, 74),
                        y: clamp(lerp(carrierY, goalY, isExtreme ? 0.56 : 0.46), 12, 88)
                    });
                }
                if (channelRunner) {
                    spots.set(channelRunner, {
                        x: clamp(c.x + (rng() < 0.5 ? -18 : 18), 15, 85),
                        y: clamp(lerp(carrierY, goalY, isExtreme ? 0.68 : 0.56), 10, 90)
                    });
                }
                if (anchor) {
                    spots.set(anchor, {
                        x: clamp(lerp(c.x, 50, 0.4) + (rng() - 0.5) * 16, 18, 82),
                        y: clamp(lerp(carrierY, ownGoal('cpu').y, 0.32), 8, 92)
                    });
                }
                mates.forEach((m, i) => {
                    if (!spots.has(m)) spots.set(m, attackingSpot(c, PLAY.goal, i));
                });
            } else {
                mates.forEach((m, i) => spots.set(m, attackingSpot(c, PLAY.goal, i)));
            }

            const inRange = dist(c, PLAY.goal) <= SHOT_RANGE;
            const quality = inRange ? 1 - 0.5 * (dist(c, PLAY.goal) / SHOT_RANGE) : 0;
            const shotPwr = isExtreme ? 1.0 : (isHard ? 0.92 : 0.7);
            const aimSpread = isExtreme ? 0.18 : (isHard ? 0.32 : 0.55);

            const shootProb = isExtreme ? 0.98 : (isHard ? 0.85 : (0.55 + 0.45 * state.difficulty) * quality);
            /* The CPU attacks GOAL.cpu, so the goal it must NOT shoot into is
               ownGoal('cpu') — the human's goal it is defending. Getting this
               backwards rejected every on-target CPU shot, so the CPU never
               pulled the trigger. */
            const cpuOwnGoal = ownGoal('cpu');
            const safeCpuTarget = target => !targetEntersGoal(target, cpuOwnGoal);
            if (inRange && (isHard || rng() < shootProb)) {
                const aim = cpuShotAim(aimSpread);
                if (safeCpuTarget(aim)) PLAN.shot.cpu = { ...aim, power: shotPwr };
            } else {
                const target = cpuChoosePass(rng, spots);
                if (target) {
                    const shotAim = cpuShotAim(aimSpread);
                    const lane = resolvePassRace({
                        from: { x: c.x, y: c.y },
                        to: shotAim,
                        defenders: defenderInputs('you'),
                        radius: TOUCH_R
                    });
                    if (inRange && lane.outcome === 'COMPLETE' && safeCpuTarget(shotAim)) {
                        PLAN.shot.cpu = { ...shotAim, power: shotPwr };
                    } else {
                        const s = leadSpot(c, target, spots.get(target));
                        const race = resolvePassRace({
                            from: { x: c.x, y: c.y },
                            to: s,
                            defenders: defenderInputs('you'),
                            radius: TOUCH_R
                        });
                        const useAir = isHard && (target._preferAir || race.outcome !== 'COMPLETE');
                        const passPwr = isExtreme ? 1.0 : (isHard ? 0.9 : 0.65);
                        if (safeCpuTarget(s)) {
                            PLAN.pass.cpu = {
                                x: s.x,
                                y: s.y,
                                air: useAir,
                                power: passPwr
                            };
                        }
                    }
                } else {
                    const aim = cpuShotAim(aimSpread);
                    if (safeCpuTarget(aim)) PLAN.shot.cpu = { ...aim, power: shotPwr };
                }
            }
            mates.forEach(m => setIntent(m, spots.get(m)));
            setIntent(c, { x: c.x, y: c.y });
            return;
        }

        /* --- the CPU is defending: hold the half in front of its own goal and press --- */
        cpuDefendDuties();
        const mine = ownGoal('cpu');
        const isHard = state.difficulty >= 1.0;
        const isExtreme = state.difficulty >= 1.5;
        const markTight = isExtreme ? 0.04 : (isHard ? 0.08 : 0.12);

        teamOutfield('cpu').forEach((p, i) => {
            if (p.duty === 'interceptor') {
                const s = interceptTarget(p, PLAY.carrier, pressPoint(PLAY.carrier, mine));
                setIntent(p, { x: s.x, y: ownHalf('cpu', s.y) });
            } else if (p.duty === 'marker') {
                const c = PLAY.carrier;
                setIntent(p, {
                    x: clamp(c.x - (mine.x - c.x) * markTight, 6, 94),
                    y: ownHalf('cpu', clamp(lerp(c.y, mine.y, markTight), 6, 94))
                });
            } else if (isHard && i === 2) {
                // Dual press / cutoff on Hard & Extreme
                const c = PLAY.carrier;
                const cutX = clamp(c.x + (mine.x > 50 ? -14 : 14), 10, 90);
                const cutY = ownHalf('cpu', clamp(lerp(c.y, mine.y, isExtreme ? 0.18 : 0.25), 6, 94));
                setIntent(p, { x: cutX, y: cutY });
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
        if (rotateHold || !PLAN || PLAN.armed) return;
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
        const side = attackSide(c.team);
        const mates = teamOutfield(c.team).filter(m => m !== c);
        const rng = mulberry32(hashSeed(state.seed, state.half, Math.floor(state.halfT * 60) + 31));
        /* §12.c — THE AUTOMATIC BALL GOES FORWARD.
           The pool used to be EVERY team-mate plus one space spot, and a defender
           standing behind the carrier is a team-mate: the "no instruction"
           delivery could leave the boot aimed at the passer's own half, which is
           the second half of the "passing the wrong way" report — the ball moved
           backwards on a window the player had said nothing in. The mates are now
           filtered to the ones who are AHEAD in the direction of the attack, and
           a forward patch of turf beyond the carrier is always on the list, so
           the ball travels upfield whatever the shape happens to look like. */
        const ahead = mates.filter(m => (m.y - c.y) * side > 0.5);
        const spot = {
            x: clamp(c.x + (rng() - 0.5) * 44, 8, 92),
            y: clamp(c.y + side * (12 + rng() * 26), 8, 94)
        };
        const options = ahead.length ? ahead.concat([spot]) : [spot];
        const pick = options[Math.floor(rng() * options.length)];
        if (pick) {
            const jitterX = (rng() - 0.5) * 8;
            const jitterY = (rng() - 0.5) * 6;
            passTo(c, { x: clamp(pick.x + jitterX, 6, 94), y: clamp(pick.y + jitterY, 6, 94) }, BALL_SPEED * 0.92);
        }
    }

    /** True when the human has said nothing at all this window — no pass, no
        shot, no run. That is the case the "no instruction" rule covers. */
    function humanPlanEmpty() {
        if (!PLAN) return false;
        if (PLAN.pass.you || PLAN.shot.you) return false;
        /* §12.d — a drawn line is a spoken instruction, even though it is not a
           queued run. Both lines count: the ball is one, and the carrier's own
           run is the other, so a human who has drawn either must not be handed
           the automatic plan on top of it. */
        if (AIM.pass || AIM.move) return false;
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
        /* §12.e — the human's own defence is planned by the same geometry, under
           the same blindfold, and for the same reason. `bound` used to be
           `c.queued` — the CPU's stacked run, read straight out of the plan the
           CPU had just written. That is the exact mirror image of the leak this
           change exists to close, just running the other way, and it made the
           human's shape look like it knew where the CPU was going. All that is
           left is the carrier and the ball. */
        const bound = c || ball;
        teamOutfield('you').forEach((p, i) => {
            if (c && i === 0) {
                const s = interceptTarget(p, c, pressPoint(c, mine));
                // Looser unguided human teammate intent
                setIntent(p, { x: clamp(s.x + (i % 2 === 0 ? 3 : -3), 6, 94), y: ownHalf('you', s.y) });
            } else if (c && i === 1) {
                setIntent(p, {
                    x: clamp(c.x - (mine.x - c.x) * 0.18, 6, 94),
                    y: ownHalf('you', clamp(lerp(c.y, mine.y, 0.18), 6, 94))
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
            let shot = plan.shot[plan.atk];
            const pass = plan.pass[plan.atk];
            /* §12.f — the human's shot is re-read off the LIVE ball here, one
               frame before it is struck. The window is long, the board is not
               perfectly still (a carried ball eases along with its carrier), and
               a target solved when the line was drawn can be a body-width stale
               by the time the boot swings — stale meaning the ball leaves on a
               line parallel to the one on the grass. Solving the same ray again
               from where the ball actually is keeps the strike on the drawn line
               under every condition. It can only run when a line was drawn, so
               the bare-button shot keeps exactly the aim it was given. */
            if (shot && plan.atk === 'you' && AIM.pass) {
                const live = drawnShotRay();
                /* the strike's power is carried across the re-derivation: the
                   live ray answers with the angle, never with the length, and
                   the length is half of what the plan was holding. */
                if (live) shot = { x: live.x, y: live.y, power: shot.power };
            }
            if (shot && dist(c, PLAY.goal) <= SHOT_RANGE) {
                shoot(c, shot, shot.power);
            } else if (pass && plan.atk === 'you' && AIM.pass) {
                /* §12.f — THE DRAWN LINE WINS OVER THE DICE. `pass` is the bare
                   point queuePass() stored, and on the human's side that point IS
                   the end of the stroke — but the stroke also rides in AIM.pass
                   for the whole window, and it is the authority on what was
                   drawn. Reading it here, one branch ahead of the random
                   delivery, is what makes it impossible for a human window to end
                   in a ball struck at a spot the player never drew: whatever the
                   plan is holding, if a line is on the grass the ball follows it.
                   The power and the air come off the stroke for the same reason
                   they do below — a long line is a hard pass, a bent one is over
                   the top. */
                passTo(c, { x: AIM.pass.end.x, y: AIM.pass.end.y }, BALL_SPEED,
                    { pace: AIM.pass.power, air: AIM.pass.air === true });
            } else if (pass && pass.x !== undefined) {
                /* §12.c — the ball is played to the POINT that was drawn and to
                   nothing else. This used to resolve to `pass.queued` — the
                   intended receiver's planned run — so the ball silently left
                   the drawn line and chased the man. Read the bare point.
                   §12.d — the stroke carries the pace and the air: a long line is
                   a hard pass, and a long bent line is a ball over the top that
                   the outfielders cannot cut out. Only a rolled ball is left to
                   the default pace, because a chip's whole point is its flight. */
                passTo(c, { x: pass.x, y: pass.y }, BALL_SPEED,
                    { pace: pass.power, air: pass.air === true });
            } else {
                autoPass();
            }
            /* §12.d — THE CARRIER'S OWN RUN, fired after the kick and never
               before it. The loop above deliberately refuses to move the carrier,
               which is what keeps a solo dribble out of the game; but the human
               drew a run for him, so he goes — once the ball has left his boot.
               That is a pass-and-move, and it is the only way the man on the ball
               is ever allowed to travel. The stroke's last point is the
               destination, clamped inside the turf. */
            const run = plan.move ? plan.move[plan.atk] : null;
            const end = run && run.pts && run.pts.length ? run.pts[run.pts.length - 1] : null;
            if (end) {
                c.dest = { x: clamp(end.x, 5, 95), y: clamp(end.y, 5, 95) };
                c.speed = PLAYER_SPEED;
            }
        }
        /* the drawn lines are spent: the ball is moving and the window is over */
        aimReset();
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
                    /* §3 — the whistle waits for the ball to become dead, but enforce
                       a hard timeout to prevent match continuing 20-30 seconds past time.
                       If pendingHalf has been active for more than 2 seconds or the ball
                       is in a clearly resolvable state, force the half to end. */
                    if (!state.pendingHalfT) state.pendingHalfT = 0;
                    state.pendingHalfT += dt;

                    if (ball.mode === 'held' || ball.mode === 'loose' || state.pendingHalfT >= 2.0) {
                        state.pendingHalfT = 0;
                        endHalf();
                    }
                } else {
                    state.halfT += dt;
                    /* First half uses regulation + stoppage (max 5s); second half is just regulation */
                    const limit = state.half === 1
                        ? halfLength + state.firstHalfStoppage
                        : halfLength;
                    if (state.halfT >= limit) {
                        state.halfT = limit;
                        state.pendingHalf = true;
                        state.pendingHalfT = 0;
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
        /* the keeper's dive is never previewed — not the stacked one while the
           window is open, not the live one once the shot is in flight. Where
           he is going is the player's instruction, and the board does not
           announce it. */
        diveLine.visible = false;
        diveMarker.visible = false;
    }

    /* --- the shoot button ---------------------------------------------------
       §17.b — the button no longer fires a shot, it *stacks* one. It is enabled
       exactly when a shot is legal and still unclaimed: the human is attacking,
       the ball is at their feet inside SHOT_RANGE, and the decision window is
       open. The ball actually leaves the boot when both sides execute. */
    let lastShootOn = null;
    function canShootNow() {
        if (rotateHold || SO.active || state.paused) return false;
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

    /* --- the decision ring ---------------------------------------------------
       §17.b — the countdown is the arc of the centre circle now, and the MOVES
       DONE button is the only other thing the thumb needs. There is no number on
       screen: the arc emptying IS the read-out, and #plan-clock / #plan-state
       carry the same information to a screen reader. Like the match clock this is
       change-guarded, so nothing is written to the DOM unless the bucket moved. */
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
            setText(ui.planClock, String(secs));
            /* "low" has to mean something on every budget: a quarter of the
               window, capped at the old three seconds, so a 3s window is not
               painted red from the instant it opens and a 20s window still warns
               at the same point it always did. */
            ui.plan.classList.toggle('low', secs <= Math.min(3, Math.ceil(planWindow / 4)));
        }
        /* The ring is an SVG circle with pathLength="1" and stroke-dasharray:1,
           so the dash offset is the fraction of the circle that is NOT drawn:
           0 is a full ring, 1 is an empty one. It empties as the window closes —
           over whichever budget the player chose. */
        const k = clamp(PLAN.t / Math.max(1e-6, planWindow), 0, 1);
        if (Math.abs(k - lastPlanBar) > 0.004) {
            lastPlanBar = k;
            if (ui.planBar) ui.planBar.style.strokeDashoffset = (1 - k).toFixed(4);
        }
        const label = PLAN.cpuPlanned ? 'CPU READY · YOUR MOVE' : 'PLANNING';
        if (label !== lastPlanState) {
            lastPlanState = label;
            setText(ui.planState, label);
        }
    }

    function updateHud() {
        refreshShootButton();
        refreshPlanHud();
        if (SO.active) return;
        if (ui.clockExtra) {
            if (state.half === 1 && state.halfT > halfLength) {
                const extra = Math.ceil(state.halfT - halfLength);
                setText(ui.clockExtra, '+' + extra);
                ui.clockExtra.style.display = 'block';
            } else {
                ui.clockExtra.style.display = 'none';
            }
        }
        const left = Math.max(0, halfLength - state.halfT);
        const secs = Math.ceil(left - 1e-6);
        if (secs !== lastClock) {
            lastClock = secs;
            setText(ui.clock, formatClock(secs));
            /* the last 15 seconds are the only time the clock is allowed to go
               warm; the class lives on the clock wrap's parent — the whole
               top-right corner — so the numerals and the fill warm together */
            const corner = ui.clock && ui.clock.parentElement && ui.clock.parentElement.parentElement;
            if (corner) corner.classList.toggle('low', secs <= 15);
        }
        const k = clamp(left / halfLength, 0, 1);
        if (Math.abs(k - lastBar) > 0.004) {
            lastBar = k;
            if (ui.clockBar) ui.clockBar.style.transform = 'scaleX(' + k.toFixed(3) + ')';
        }
    }

    /* --- the contain-fit camera, with the §10 zoom/pan on top ---------------
       CONTENT IS CONTAINED IN THE INSET BOX, NOT THE FULL CANVAS. The docks are
       measured off the DOM (measureHudInsets) and the board is fitted into what
       is left, so a goalpost can never end up under the score capsule however
       the viewport is shaped. With no docks this reduces to a plain contain fit
       of the canvas. */
    function fitView() {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        const F = viewFrame({ width: w, height: h });
        const availW = F.availW, availH = F.availH;
        const aspect = availW / availH;
        let hw, hh;
        if (aspect >= reqHW / reqHH) { hh = reqHH; hw = reqHH * aspect; }
        else { hw = reqHW; hh = reqHW / aspect; }
        view.hw = hw / view.zoom;
        view.hh = hh / view.zoom;
        /* Invariant: the projection is isotropic at (2 * view.hh) / availH
           camera units per pixel, whichever way the fit above went. */
        const scale = (2 * view.hh) / availH;
        const cx = F.l + availW / 2;      // frame centre, in px
        const cy = F.t + availH / 2;

        camera.left = -cx * scale;
        camera.right = camera.left + w * scale;
        camera.top = cy * scale;
        camera.bottom = camera.top - h * scale;

        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);

        /* §17.b — the decision ring is supposed to sit ON the painted centre
           circle, so its diameter is not a design constant — it is whatever the
           camera fit currently makes that circle. The circle is painted at 9.15m
           (makePitchTexture), which is 9.15 / M_Y game units of radius, and one
           game unit of y is availH / (2 * view.hh) pixels (the same conversion
           canvasPoint() uses to turn a tap into a board position). Written to
           --ring-d on #app, the ring's positioned ancestor, so it survives the
           zoom setPenaltyView() applies. */
        if (app) {
            const ringPx = (9.15 / M_Y) * availH / view.hh;
            app.style.setProperty('--ring-d', ringPx.toFixed(2) + 'px');
            app.style.setProperty('--ring-cx', cx.toFixed(2) + 'px');
            app.style.setProperty('--ring-cy', cy.toFixed(2) + 'px');
        }
    }
    window.addEventListener('resize', () => { syncRotateGate(); syncInsets(true); });
    window.addEventListener('orientationchange', () => {
        syncRotateGate();
        setTimeout(() => { syncRotateGate(); syncInsets(true); }, 120);
    });
    /* A mobile URL bar sliding in and out fires resize several times a second,
       and each one rebuilt the projection. Only act when the box changed. */
    const viewBox = { w: 0, h: 0 };
    function resizeIfChanged() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w === viewBox.w && h === viewBox.h) return;
        viewBox.w = w; viewBox.h = h;
        syncInsets(true);
    }
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { syncRotateGate(); resizeIfChanged(); });

    /* The reserved region is re-derived from the live DOM, never assumed. The
       docks change size with the copy inside them — the clock's numerals, the
       +N stoppage tag, the shootout strip, the outcome banner, the guide line
       rewording itself — and they appear and disappear without the viewport
       moving at all, which is why this runs off the render loop (syncInsets()
       in frame()) and not only off resize. Reads only, no writes, so the
       browser has no invalidated layout of its own to flush; a new projection
       is built only when one of the four numbers actually moved. */
    function syncInsets(force) {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        const wasLand = land;
        landscapeCanvas();
        measureHudInsets(w, h);
        if (!needFit && !force && land === wasLand) return;
        needFit = false;
        fitView();
    }

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
        /* The docks are re-measured before anything is written this frame, so
           the camera always fits a board the HUD cannot be standing on. */
        syncInsets(false);
        /* The portrait gate freezes the world exactly like a pause: while a
           touch device is held sideways no match time, plan countdown, or
           move advances, and resuming is just clearing the flag — nothing
           stored, nothing replayed. `last` is still refreshed above, so no
           backlog of wall time leaks into the first portrait frame. */
        if (!rotateHold && !state.paused && !topScreen() && state.phase !== 'idle') update(dt);
        drawDiveGuide();
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
        /* §18.b — the goal burst. It expands off wall time (like the beacon and
           for the same reason) so it carries on through kickoff(), which is
           already moving every player and resetting the ball underneath it. It
           grows out of the middle of the pitch, where the camera is looking and
           where the DOM word is bursting, and it is the side's colour, so the
           celebration says who scored before the scoreline is read. */
        if (FIRE.goal > 0) {
            FIRE.goal += dt;
            const gp = Math.min(1, FIRE.goal / 1.15);
            goalBurst.position.set(0, 0.075, 0);
            goalBurst.scale.set(1 + gp * 15, 1 + gp * 15, 1);
            goalBurst.material.opacity = Math.pow(1 - gp, 1.5) * 0.9;
            if (gp >= 1) FIRE.goal = 0;
        } else if (goalBurst.material.opacity !== 0) {
            goalBurst.material.opacity = 0;
        }
        /* And the carrier wears the triangle. Possession is the thing a viewer
           has to know at a glance — it is what decides whose decision window is
           open — and at this zoom "which of the fourteen has it" is genuinely not
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
    /* One sync for every surface that shows Sound. The sheet row prints its own
       ON/OFF in a value slot; the start card draws it as a two-pill segmented
       row. Both are decided by Sfx.muted, never by which control was touched, so
       the two can never disagree. */
    function syncSound() {
        const m = Sfx.muted;
        const val = ui.mute && ui.mute.querySelector('.sheet-val');
        if (val) setText(val, m ? 'OFF' : 'ON');
        if (ui.mute) ui.mute.setAttribute('aria-pressed', String(m));
        if (ui.soundStart) {
            Array.from(ui.soundStart.querySelectorAll('button[data-sound]')).forEach(b =>
                b.setAttribute('aria-pressed', String((b.dataset.sound === 'off') === m)));
        }
    }
    function toggleMute() {
        Sfx.toggle();
        syncSound();
        if (!Sfx.muted) Sfx.unlock();
    }
    /* the start card's Sound pills are the same toggle, just drawn as a pair */
    if (ui.soundStart) {
        ui.soundStart.addEventListener('click', e => {
            const b = e.target.closest('button[data-sound]');
            if (!b) return;
            const wantMuted = b.dataset.sound === 'off';
            if (wantMuted !== Sfx.muted) toggleMute();
        });
    }

    /* --- the floating menu (game-ui-ux: an overlay over the board) -----------
       A dropdown rather than a screen: it is a sheet with its own scrim, so the
       board stays visible underneath and closing it cannot desync the screen
       stack. `open` is the single source of truth for what is showing. */
    let sheetOpen = false;
    function setMenuOpen(open) {
        if (!ui.sheet) return;
        sheetOpen = !!open;
        ui.sheet.hidden = !sheetOpen;
        if (ui.scrim) ui.scrim.hidden = !sheetOpen;
        if (ui.menuOpen) ui.menuOpen.setAttribute('aria-expanded', String(sheetOpen));
        if (sheetOpen && ui.menuClose) requestAnimationFrame(() => ui.menuClose.focus());
        else if (!sheetOpen && ui.menuOpen && ui.menuOpen.focus) ui.menuOpen.focus();
    }

    el('btn-start').addEventListener('click', () => { popScreen(); beginMatch(); });
    el('btn-penalty').addEventListener('click', () => { popScreen(); beginShootout(); });
    el('btn-tutorial').addEventListener('click', () => pushScreen('tutorial', { focus: '#btn-tut-close' }));
    el('btn-tut-close').addEventListener('click', () => popScreen());
    /* Every row of the sheet does its one thing and then gets out of the way —
       the board is the game, and the menu is a detour from it. */
    if (ui.help) ui.help.addEventListener('click', () => {
        setMenuOpen(false);
        pushScreen('tutorial', { focus: '#btn-tut-close' });
    });
    if (ui.shoot) ui.shoot.addEventListener('click', shootFromButton);
    /* §17.b — the human's half of the decision window */
    if (ui.done) ui.done.addEventListener('click', humanDone);
    if (ui.pause) ui.pause.addEventListener('click', () => { setMenuOpen(false); pauseGame(); });
    if (ui.mute) ui.mute.addEventListener('click', toggleMute);
    if (ui.menuOpen) ui.menuOpen.addEventListener('click', () => setMenuOpen(!sheetOpen));
    if (ui.menuClose) ui.menuClose.addEventListener('click', () => setMenuOpen(false));
    if (ui.scrim) ui.scrim.addEventListener('click', () => setMenuOpen(false));
    if (ui.menuRestart) ui.menuRestart.addEventListener('click', () => {
        setMenuOpen(false);
        state.paused = false;
        while (topScreen()) popScreen();
        beginMatch();
    });
    if (ui.menuQuit) ui.menuQuit.addEventListener('click', () => {
        setMenuOpen(false);
        state.paused = false;
        while (topScreen()) popScreen();
        state.phase = 'idle';
        pushScreen('menu', { focus: '#btn-start' });
    });
    /* Escape closes the sheet before anything else gets a look at it. Capture
       phase, so a menu that is open swallows the key rather than letting the
       pause handler underneath it fire on the same press. */
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && sheetOpen) {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(false);
        }
    }, true);
    el('btn-resume').addEventListener('click', resumeGame);
    el('btn-restart').addEventListener('click', () => { state.paused = false; while (topScreen()) popScreen(); beginMatch(); });
    el('btn-quit').addEventListener('click', () => { state.paused = false; while (topScreen()) popScreen(); state.phase = 'idle'; pushScreen('menu', { focus: '#btn-start' }); });
    el('btn-again').addEventListener('click', () => {
        popScreen();
        if (state.matchMode === 'shootout') {
            beginShootout();
        } else {
            beginMatch();
        }
    });
    el('btn-menu').addEventListener('click', () => { while (topScreen()) popScreen(); state.phase = 'idle'; pushScreen('menu', { focus: '#btn-start' }); });
    /* Halftime continue button — pops the halftime screen and starts the second half */
    const halfContinueBtn = el('btn-half-continue');
    if (halfContinueBtn) halfContinueBtn.addEventListener('click', () => {
        popScreen();
        state.half = 2; state.halfT = 0; state.pendingHalf = false;
        bus.emit('half');
        Sfx.whistle();
        kickoff('cpu');
        log('Second half — CPU kicks off.', '');
    });
    const pensBtn = el('btn-pens');
    /* the over screen's own route to the spot — it belongs to a finished match,
       so it is the tiebreak path too */
    if (pensBtn) pensBtn.addEventListener('click', () => beginShootout(true));
    const verifyBtn = el('btn-verify');
    if (verifyBtn) verifyBtn.addEventListener('click', () => {
        const r = runVerification(true);
        banner(r.allPass ? 'RULEBOOK OK' : 'RULEBOOK FAILED', r.allPass ? CSS.goal : CSS.bad);
    });
    /* one shared sync for both surfaces: the pressed pill is decided by the
       value, never by which button was clicked */
    function syncDifficulty() {
        [ui.difficulty, ui.difficultyStart].forEach(group => {
            if (!group) return;
            Array.from(group.querySelectorAll('button[data-diff]')).forEach(x =>
                x.setAttribute('aria-pressed', String(parseFloat(x.dataset.diff) === state.difficulty)));
        });
    }
    [ui.difficulty, ui.difficultyStart].forEach(group => {
        if (!group) return;
        group.addEventListener('click', e => {
            const b = e.target.closest('button[data-diff]');
            if (!b) return;
            state.difficulty = parseFloat(b.dataset.diff);
            if (PLAY) { PLAY.cpuThink = 0.6; cpuAssignDuties(); }
            syncDifficulty();
        });
    });
    /* The window budget is a setting, not a phase: no screen is pushed and the
       match is never interrupted. setPlanWindow() owns the aria-pressed sync, so
       there is one place that decides what "selected" looks like. */
    [ui.planWin, ui.planWinStart].forEach(group => {
        if (!group) return;
        group.addEventListener('click', e => {
            const b = e.target.closest('button[data-lock]');
            if (b) setPlanWindow(parseFloat(b.dataset.lock));
        });
    });
    /* the half length is a setting like the other two: no screen is pushed,
       nothing running is interrupted, and setHalfLength() owns the sync */
    [ui.halfLen, ui.halfLenStart].forEach(group => {
        if (!group) return;
        group.addEventListener('click', e => {
            const b = e.target.closest('button[data-half]');
            if (b) setHalfLength(parseFloat(b.dataset.half));
        });
    });

    /* first user gesture unlocks Web Audio */
    ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, () => Sfx.unlock(), { once: true, passive: true }));

    /* --- boot --- */
    syncRotateGate();
    if (window.matchMedia) {
        /* A touch laptop docking/undocking a mouse flips its primary pointer,
           which can promote or demote it across the touch-device line without
           any resize firing — re-check so it never gets (or keeps) the gate
           wrongly. Desktop without touch never matches, so this is a no-op
           there. */
        try {
            const pointerQuery = window.matchMedia('(pointer: coarse)');
            if (pointerQuery && typeof pointerQuery.addEventListener === 'function') {
                pointerQuery.addEventListener('change', syncRotateGate);
            } else if (pointerQuery && typeof pointerQuery.addListener === 'function') {
                pointerQuery.addListener(syncRotateGate);
            }
        } catch (e) { /* old browser: the resize/orientation hooks still cover rotation. */ }
    }
    fitView();
    /* the settings pills start pressed from their markup, but state is the
       truth — sync every surface from it before the first frame */
    syncDifficulty();
    syncSound();
    setHalfLength(HALF_LENGTH_DEFAULT);
    allPlayers.forEach(p => { syncToMesh(p); refreshRings(); });
    setCarrier(teamOutfield('you')[0]);
    state.phase = 'idle';
    bus.emit('score'); bus.emit('half'); bus.emit('role');
    pushScreen('menu', { focus: '#btn-start' });
    requestAnimationFrame(frame);

    /* --- the boot veil -------------------------------------------------------
       The shell mounts under #loading-veil (see index.astro) so the player
       never lands on a menu whose music is still arriving — and, because a
       browser refuses to start sound without a user gesture, the veil is ALSO
       the gesture that lets the music begin. Three phases:

       LOADING — ball and shimmer bar, until the track reports canplaythrough
       (or errors) AND a 0.9 s dwell has passed; the dwell is what stops a
       cached track turning the veil into a sub-frame flash.

       READY — the loading chrome swaps for TAP TO KICK OFF, and the first tap
       (or Enter/Space) is handed to Sfx.unlock(): the gesture that resumes the
       audio clock and starts the track, so the menu is revealed already
       singing instead of starting it half-way through.

       and the lift itself — with a grace: a player who never taps is still
       never trapped, because after 15 s the veil lifts on its own and the
       track simply waits for their next gesture, exactly as before. */
    const bootVeil = document.getElementById('loading-veil');
    if (bootVeil) {
        let veilLifted = false, audioReady = false, dwellDone = false;
        const onPointer = () => onEnter();
        const onKey = e => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                onEnter();
            }
        };
        function onEnter() {
            if (veilLifted) return;
            veilLifted = true;
            window.removeEventListener('pointerdown', onPointer);
            window.removeEventListener('keydown', onKey);
            Sfx.unlock(); /* the gesture: resumes Web Audio and starts the track */
            bootVeil.classList.add('is-lifted');
            setTimeout(() => bootVeil.remove(), 700);
        }
        function showGate() {
            if (veilLifted || !audioReady || !dwellDone) return;
            bootVeil.classList.add('is-ready');
            window.addEventListener('pointerdown', onPointer, { passive: true });
            window.addEventListener('keydown', onKey);
        }
        Sfx.preloadBgm(() => { audioReady = true; showGate(); });
        setTimeout(() => { dwellDone = true; showGate(); }, 900);
        setTimeout(onEnter, 15000); /* never trap: lift without sound if untapped */
    }

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
        get rotateHold() { return rotateHold; },
        orientation: { isTouchDevice, isLandscapeShape, syncRotateGate },
        api: {
            beginMatch, kickoff, goalKick, beginShootout, soSetupKick,
            passTo, shoot, pauseGame, resumeGame, toggleMute,
            humanDone, openPlan, beginExecution, queuePass, queueShot,
            setDifficulty: d => { state.difficulty = clamp(d, 0, 2); },
            setPlanWindow, setHalfLength,
            get planWindow() { return planWindow; },
            /** Pin the clock, for testing full time without playing the half out. */
            setHalfTime: t => { state.halfT = clamp(t, 0, halfLength); },
            drainHalf: () => { state.halfT = halfLength; state.pendingHalf = true; }
        }
    };
})();
