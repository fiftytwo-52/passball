# ⚽ Guess & Pass

A real-time football duel: **3D low-poly players on a 2D top-view pitch**, seven a side, no dice.
You drag a pass and it travels; the defender you aimed past either gets there in time or does not.
The ball tells the truth because the ball is the truth.

Built with **Astro**. The rulebook is a pure ES module and the engine is a self-contained script bundled by
Vite; Three.js r0.149.0 is compiled in from `node_modules`, so there is **no CDN in the script path** and no
network dependency at runtime.

---

## 🎮 The Core Loop

Regulation is **one continuous simulation**, not a sequence of turns ([`REALTIME-SPEC.md`](REALTIME-SPEC.md) **§3**):

1. **Continuous play.** A single `requestAnimationFrame` loop advances every entity every frame. Nothing
   pauses to ask permission; possession is whatever the last resolution left it as.
2. **You attack by dragging.** Drag from the ball-carrier toward a teammate and release to fire the ball at
   `BALL_SPEED`. The ball is a live object in flight — not a probability roll.
3. **The race resolves it.** Every frame, the path the ball travelled is tested against every defender — not a
   proximity aura, an actual **touch** (`TOUCH_R`, a body's width). The ball is cut out **mid-flight at that
   exact point**, possession flips in place, with no whistle and no reset. A ball that merely passes close to a
   defender runs on; if nobody ever reaches it, the pass completes.
4. **Two halves of 2:00.** The match clock counts each half down. The current play always finishes; half-time
   swaps ends, and full time ends regulation.
5. **Sent off level? Go to penalties.** A manual **Go to Penalties** button appears at full time when the
   scores are level, and the game swaps to the §10 shootout.

There is no play cap and no "first to N" — a match runs its two halves, and a draw is settled from the spot.

---

## ✨ Features

- **True 3D characters, undistorted 2D pitch.** Humanoids are WebGL meshes; the pitch is a Canvas2D-drawn
  texture. A tilted orthographic camera plus a `1/cos(TILT)` depth stretch means the 2D artwork projects
  **1:1 on screen** while the players remain genuinely three-dimensional. That surface is tiled outward as an
  outfield — the identical greens, mown cuts and blades, phase-locked at the halfway line — so grass fills the
  frame at every viewport and it is the markings, not a colour change, that say where the pitch is.
- **A pure rulebook with no second copy.** [`src/scripts/rules.js`](src/scripts/rules.js:17) is positions in,
  outcomes out — no Three.js, no DOM, no `window`. The page imports it and [`tools/verify-4.mjs`](tools/verify-4.mjs)
  imports *the same file*, so the tests cannot drift from the shipped algorithm.
- **`BALL_SPEED > PLAYER_SPEED`, always.** That single inequality ([`RULES`](src/scripts/rules.js:21)),
  asserted by the suite, is what makes interception and shot-saving genuine **races** rather than coin flips:
  a defender cuts a pass out only by arriving on the ball's path in time.
- **Closed-form race model, live contact rule.** The suite reasons about the race analytically — a quadratic in
  `t` solved by [`interceptionTime()`](src/scripts/rules.js:122) — and the CPU scores its pass options with the
  same function. The running match then asks its own contact question every frame: the segment the ball travelled
  is tested against each defender for a genuine touch, so a ball that only whistles past a man runs on.
- **Property verification, in the page and in Node.** [`runVerification()`](src/scripts/rules.js:342) asserts the
  28 properties of the rulebook — the speed inequalities, the squad shape, goal-mouth geometry, the race
  monotonicities, keeper reach, the shootout clinch maths — plus a 4000-play validity corpus. It runs headlessly
  via `npm run verify` and reports into the menu card in the page.
- **A real shootout.** Triggered only by the manual button, on a dedicated zoomed penalty view, with its own
  `AIM → CHECK_ON_TARGET → DIVE → RESOLVE → NEXT_KICKER` state machine. Six outfield players each, alternating,
  then sudden death. Off target is an automatic miss; on target it is a **reach test** — inside
  `PENALTY_KEEPER_REACH` of the aim point is a save, outside is a goal.
- **Pointer Events only.** One code path for mouse, touch and pen, with gesture disambiguation
  (drag-to-pass, tap a receiver, tap a runner, double-tap to shoot, dive the keeper) and a double-tap detector.
- **Deterministic.** Every random draw routes through a seeded `mulberry32` PRNG.
- **Weighted CPU.** Difficulty is a 0–1 blend against the naive baseline: COIN-FLIP / SHARP / RUTHLESS.
- **Feel.** Camera-trauma shake, an outcome banner, tuned restarts, and a Web Audio synth for
  kick / pass / good / bad / goal / save / whistle.
- **Accessible HUD.** Anchors-and-containers layout, `clamp()` type, ≥44 px tap targets on coarse pointers,
  `env(safe-area-inset-*)`, a screen stack with initial focus per screen and `Escape` to go back, and
  **event-driven DOM updates instead of per-frame polling** — the clock is written only when the displayed
  second changes, the drain bar only when it moves, and the strip only when it changes.
- **Nothing is ever drawn on the ground.** The top dock, the penalty strip and the bottom dock are flow
  siblings of the stage, not overlays on it, so at every viewport size the chrome can only ever push the pitch
  smaller. The turf carries the players and the ball and nothing else.
- **One design system.** Every surface — HUD, screens, buttons, the pitch palette — reads from the tokens in
  [`DESIGN.md`](DESIGN.md) (Vercel / Geist): a black-and-white duet on a near-white canvas, 1px hairlines,
  6 px app squares versus 100 px marketing pills, and colour permitted only as small accent marks and the
  hero mesh gradient.

---

## 🎹 Controls

Attack and defence swap automatically with possession — you always control **the ball-carrier, the intended
receiver, two runners** (4), and when defending the **interceptor and the marker** (2), plus your goalkeeper.

Every gesture on the ball is a **freehand stroke**: the line drawn on the turf is kept point for point and
shown back while you draw. **Line length is power**, and a **long, bent line goes in the air** — over the
defenders' heads, where nothing outfield can cut it out.

| Action | Pointer | Keyboard |
| --- | --- | --- |
| **Pass** | Drag a line from the ball-carrier; **release** to commit. The ball travels to the point the line ends on, at the power the line earned | — |
| **Set the shot angle** | Drag a line towards the goal — where it crosses the byline is where it will go. Then press **SHOOT** | <kbd>S</kbd> / <kbd>Space</kbd> |
| **Carrier's own run** | Drag a **second** line from the carrier: once the ball has gone, he follows it | — |
| **Redraw** | Drag a **third** line — it clears both the pass and the run and starts again | — |
| **Nominate the receiver** | Tap the teammate | — |
| **Send a runner** | Drag a line from a teammate (up to two) | — |
| **Intercept** (defending) | Drag the interceptor along the line you expect the pass to take | — |
| **Mark** (defending) | Drag the marker anywhere | — |
| **Dive** (keeper) | Drag or tap the dive point as the shot leaves | — |
| **Penalty aim** | Draw the aim line, then draw the dive line | — |
| Pause | Button | <kbd>Esc</kbd> |
| Mute | Button | <kbd>M</kbd> |
| Restart | Button | <kbd>R</kbd> |
| Help | Button | <kbd>H</kbd> |

---

## 🗂 Project Structure

```
src/
  pages/index.astro           ← the page: HUD, match clock, shootout strip, screens
  scripts/rules.js            ← the pure rulebook (no DOM, no Three.js) — imported by page AND tests
  scripts/game-source.js      ← the engine: WebGL scene, continuous sim, shootout machine
  styles/tokens.css           ← DESIGN.md transcribed into CSS custom properties
  styles/game.css             ← game chrome built on those tokens
  styles/global.css           ← page layer: responsive type, HUD stacking, focus, motion
tools/
  publish.mjs                 ← validates the out/ artifact and reports what will ship
  verify-4.mjs                ← imports rules.js and runs its property suite in Node
public/
  _headers                    ← Cloudflare response headers (CSP + caching)
out/                          ← the build artifact (git-ignored); this is what deploys

REALTIME-SPEC.md                ← the authoritative design doc (canonical §1–§10)
DESIGN.md                       ← the design system every UI surface is built from
football-guess-game-design.md   ← the superseded turn-based spec, kept for history
```

Only `src/` and `public/` are authored. `out/` is **generated** and is the single deployable artifact — nothing
is mirrored to the repo root, because a second copy of the same site is one more thing that can drift out of
date. `astro build` cleans `out/` on every run, so the artifact is always a complete, fresh site.

---

## 🚀 Run It

```bash
npm install
npm run dev            # http://localhost:4321 — HMR, no build step
```

To produce and inspect the deployable artifact:

```bash
npm run build          # astro build + validate out/
npm run preview        # serve the built site
```

`npm run build` writes a self-contained site to `out/` and then checks that both the page and `_headers` made
it in. Serving that artifact directly works with any static server:

```bash
python3 -m http.server 8080 --directory out
```

---

## ⚙️ Tuning

All tunables live in the single `RULES` object at the top of the rulebook
([`RULES`](src/scripts/rules.js:17)). They are canonical: the property suite asserts the relationships between
them, and the running engine reads the same object, so changing one without re-running `npm run verify` is how
the sim and its guarantees fall out of step.

| Constant | Value | Meaning |
| --- | --- | --- |
| `SPEED_SCALE` | `0.7` | One dial over the five speeds below — ratios, and so every race verdict, are untouched |
| `PLAYER_SPEED` | `26 × 0.7 = 18.2` | Outfield run speed, units / s |
| `DIVE_SPEED` | `30 × 0.7 = 21` | Keeper dive speed — a shade above `PLAYER_SPEED` |
| `BALL_SPEED` | `34 × 0.7 = 23.8` | Ground pass speed — **must** beat `PLAYER_SPEED` |
| `SHOT_SPEED` | `40 × 0.7 = 28` | Shot speed — a shade above `BALL_SPEED` |
| `DRILL_SPEED` | `22 × 0.7 = 15.4` | Off-ball drift / shape speed |
| `CATCH_RADIUS` | `3` | Collection / control radius (claiming a pass or a loose ball) |
| `KEEPER_REACH` | `6` | Open-play save reach |
| `PENALTY_KEEPER_REACH` | `12` | Shootout save reach (the reach / tolerance test) |
| `GOAL_HALF_WIDTH` | `12.5` | Half the mouth → mouth ≈ 25 units, centred on x = 50 |
| `SHOT_RANGE` | `30` | Max distance from goal to attempt a shot |
| `HALF_LENGTH` | `120` | Seconds per half (2:00) |
| `PENALTY_SPOT` | `10.5` | Penalty spot, units off the goal line |
| `KEEPER_LINE` | `4` | How far off their line a keeper stands |
| `SHOOTOUT_KICKS` | `5` | Per side, then sudden death |

Two engine-side dials in [`game-source.js`](src/scripts/game-source.js) are deliberately **not** in the rulebook,
because neither is something a property test can be written against:

- `RUN_SCALE` (`0.92`) — a single multiplier applied at the one place a body is actually stepped
  ([`moveToward()`](src/scripts/game-source.js:862)). It scales every mover on the board together, so the
  rulebook's speed *ratios* — and therefore every race verdict — are untouched. The ball is intentionally left
  alone: a slower ball would start losing races the rulebook says it wins, which is a rule change, not a feel one.
- `TOUCH_R` (`0.95`) and `KEEPER_TOUCH_R` (`1.6`) — contact geometry. This decides whether a defender's feet
  actually reached the ball, and no property test should be written against how wide a player looks. Turn it up
  and defenders start intercepting from further away again.

The stroke that drives power and height also lives in the engine
([`§12.d`](src/scripts/game-source.js:100)): `STROKE_MAX` (`96`, the cap on points a gesture keeps), `STROKE_MIN`
(`10`) and `POWER_LEN` (`46`) set the **length → power** ramp, while `AIR_LEN` (`34`) and `AIR_CURVE` (`1.22`) set
the **length *and* bend → air ball** test. A stroke that is merely long, or merely bent, stays on the deck.

Presentation-only values (camera zoom and pan, shake decay, banner timing, the synth's voices) are free to
change. The 3D palette is the `COL` object ([`COL`](src/scripts/game-source.js:72)); the matching CSS colours
are [`CSS`](src/scripts/game-source.js:77) and the `--x-*` custom properties in
[`game.css`](src/styles/game.css:1). Change them together or the 3D players and the DOM chrome will disagree.

---

## 🧪 Verifying the rulebook

`rules.js` keeps the resolution logic as pure functions of position, so every claim the spec makes about the
races is testable without a canvas. In the browser — press **RUN RULEBOOK TESTS** on the menu, which renders the
verdict inline — or from the console:

```js
window.__GAP.runVerification()        // { allPass, results, properties }
window.__GAP_VERIFY_RESULTS           // the report from the most recent run
window.__GAP.RULES                    // live tunables
window.__GAP.play                     // carrier, receiver, runners, flight
window.__GAP.shootout                 // the shootout state machine
window.__GAP.api                      // drive the match directly (beginMatch, shoot, setHalfTime…)
```

Headlessly, from the same module the page bundles:

```bash
npm run verify
```

```
  Guess & Pass — real-time rulebook (§2, §5, §7, §10)
  ────────────────────────────────────────────────────────────────────────
  PASS   BALL_SPEED > PLAYER_SPEED (passes outrun defenders)
  PASS   SHOT_SPEED > BALL_SPEED (shots outrun passes)
  PASS   DIVE_SPEED slightly exceeds PLAYER_SPEED
  PASS   Squad is 1 GK + 5 outfield, 4 attacking controls
  PASS   Goal mouth is 24–26 units, centred on x = 50
  PASS   Two 2:00 halves (match = 240 s)
  PASS   formatClock renders a countdown m:ss and floors at 0:00
  PASS   A defender standing in the lane intercepts the pass
  PASS   A defender near the lane intercepts sooner than one far off it
  PASS   An open pass (no defender) always completes
  PASS   A defender behind the ball cannot chase it down
  PASS   A larger CATCH_RADIUS never delays the interception
  PASS   Resolution is deterministic (same input, same outcome)
  PASS   A completed pass is the only way to reach the receiver
  PASS   A keeper sitting on the shot line saves it
  PASS   A keeper diving the other way concedes
  PASS   A shot wide of the mouth is off target
  PASS   SHOT_SPEED beats a keeper who is not on the line
  PASS   A bigger KEEPER_REACH turns the same shot into a save
  PASS   The default dive goes toward the shot and stays within one reach
  PASS   A penalty dive inside the reach saves, outside it scores
  PASS   The penalty reach test is inclusive at exactly the reach
  PASS   A penalty aimed outside the mouth is a miss
  PASS   Shootout: level after five each goes to sudden death
  PASS   Shootout: five each with a leader is settled
  PASS   Shootout: an early clinch ends it before five each
  PASS   Shootout: sudden death ends when a round breaks level
  PASS   4000 synthetic plays stay inside the rules (no NaN, legal outcomes)
  ────────────────────────────────────────────────────────────────────────
  ALL PASS 28 properties
         ball 34 > player 26 · shot 40 · halves 2 × 120s
```

The interception properties are genuine kinematics checks, not calls into the resolver round-trip: each outcome
is re-verified by asserting the defender **could not** have reached the ball's path in the time it took, and
that the ball's own path was legal. [`tools/verify-4.mjs`](tools/verify-4.mjs) exits non-zero on failure, so it
can gate a deploy.

---

## ☁️ Deploy

Live at **https://passball.pages.dev** — Cloudflare Pages, direct upload:

```bash
npm run deploy
# ≡ npm run build && npx wrangler pages deploy out --project-name passball
```

[`wrangler.toml`](wrangler.toml) points `pages_build_output_dir` at `out`, which is self-contained.
[`public/_headers`](public/_headers) is the source of the response headers and is copied into `out` by
`astro build`; it sets a strict CSP (first-party scripts, Google Fonts as the only external origin) and
long-lived caching for the content-hashed `/assets/*`.

---

## 🗺 Roadmap

- [x] Continuous real-time simulation — no turns, no decision window
- [x] §7 proximity-race resolution: interception, shots and saves resolved by geometry, not dice
- [x] Two 2:00 halves with a countdown match clock and a half-time end swap
- [x] Goal / save / interception restarts (centre kickoff, goal kick, in-place possession flip)
- [x] §10 penalty shootout with its own state machine and zoomed penalty view
- [x] Seeded determinism
- [x] Pointer Events controls (drag-to-pass, tap, double-tap-to-shoot, keeper dive)
- [x] Weighted CPU with a difficulty blend
- [x] Headless 28-property rulebook verification against the same module the page bundles
- [x] Astro build with the engine bundled from `node_modules` — no runtime CDN
- [x] DESIGN.md design system applied to every UI surface
- [ ] Replay of a match from its seed
- [ ] Persisted difficulty and mute preferences

---

## 📐 Design Docs

- [`REALTIME-SPEC.md`](REALTIME-SPEC.md) — **the authoritative build spec**: the nine assumptions, the
  constants, the lifecycle, the controls, the §7 race resolution, the HUD and the §10 shootout.
- [`football-guess-game-design.md`](football-guess-game-design.md) — the original turn-based decision-window
  spec. **Superseded**; kept as a record of the dice-era design.
- [`DESIGN.md`](DESIGN.md) — the visual system: colour, type, spacing, radius, elevation, components.

> **What must never change:** the `RULES` constants and the relationships the suite asserts about them
> (`BALL_SPEED > PLAYER_SPEED`, `SHOT_SPEED > BALL_SPEED`, mouth width, half length), and the purity of
> `rules.js` — no DOM, no Three.js. Everything else is presentation and may be tuned freely.
