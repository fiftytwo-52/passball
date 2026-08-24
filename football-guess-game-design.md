# Guess & Pass — Mechanics & Algorithm Spec

> **Status:** source-of-truth spec (v1, reconstructed from the step-by-step build prompt).
> The core mechanics and the pass-resolution algorithm defined here must not be redesigned by
> later build steps — they are only *built on top of*. Phase 1 (Steps 1–4) refines controls,
> the CPU, and feel; Phase 2 (Steps 5–10) adds online play. Neither phase changes Section 4.

## 1. Concept

Guess & Pass is a fast, duel-style football (soccer) game. It strips football down to its most
psychological moment: the pass. On every play the team **in possession** commits to a pass while
the **defending** team simultaneously *guesses* where that pass is going. Reading your opponent
is the whole game — hence "Guess & Pass."

The game is played in short **plays**. Each play has a fixed **3-second decision window** in
which both sides lock in their choices at the same time, then the play **resolves**
deterministically-plus-a-roll using the algorithm in Section 4. There is no free-running
dribbling; the tension lives entirely in the simultaneous commit.

A single human plays a full team against a CPU opponent (Phase 1). Because possession alternates,
the human both **attacks** (choosing passes, positioning a runner) and **defends** (guessing the
opponent's pass direction) over the course of a match. In Phase 2 the CPU is swapped for a second
human over the network, with identical rules and timing.

## 2. The pitch and the pieces

The pitch uses a normalized coordinate space, `x ∈ [0,100]` (left→right) and `y ∈ [0,100]`
(own goal→opponent goal), independent of screen size. The renderer maps this to the canvas so the
same logic works on any screen. The view is **top-down**, portrait-friendly.

- **Attacking direction:** the team in possession always attacks toward `y = 100` (the far goal).
  When possession flips, the coordinate frame is conceptually mirrored so "forward" is always
  toward the opponent's goal for whoever has the ball. (Implementation keeps a fixed frame and
  tracks which goal each side attacks.)
- **Ball carrier:** the attacker's player who currently holds the ball. The ball is always at the
  carrier's feet between plays.
- **Receivers (2–3):** the carrier's teammates, positioned up-field. Each is a candidate pass
  target. One of them is the **runner**.
- **The runner:** a single off-ball attacker the attacking side may reposition during the decision
  window to open a better receiving angle. Repositioning the runner is one of the two attacking
  inputs (the other is choosing the pass target).
- **Defenders (2–3):** the defending team's outfield players. Each can be committed to a
  **guess direction** during the decision window — a unit vector indicating the lane that
  defender expects the pass to travel, which is where they'll break toward at resolve.
- **Goalkeeper:** one per team, tied to its goal, used only when a completed pass becomes a shot.
- **Goals:** centered on `y = 0` (defended by whoever is out of possession's keeper) and
  `y = 100`, each a horizontal mouth spanning a fixed width around `x = 50`.

## 3. Game flow: the decision-window / resolve loop

A **match** is a sequence of **possessions**; a possession is a sequence of **plays**. This loop
is the heartbeat of the game and must stay identical across single-player and (Phase 2) networked
play — the same 3-second window and the same resolve step, kept in sync between both sides.

Each play runs through four states:

1. **SETUP** — positions are drawn; the ball carrier, receivers, runner, defenders, and keeper are
   placed. The upcoming attacker and defender are identified (human or CPU).
2. **DECISION (3.0 s)** — a countdown runs. Both sides act *simultaneously and hidden from each
   other's final intent*:
   - **Attacker** selects a **pass target** (one receiver) and optionally **repositions the
     runner** to a new spot on the pitch.
   - **Defender** sets a **guess direction** on one or more defenders (the committed lane).
   - Either side may lock in early; unset choices are auto-filled at expiry (attacker: nearest
     safe receiver; defender: current defender facing).
3. **RESOLVE** — the runner finishes moving to its commitment, then Section 4 runs once, producing
   exactly one outcome: **COMPLETE**, **INTERCEPTION**, **GOAL**, or **SAVE**. Outcome hooks fire
   here (`onPass`, `onIntercept`, `onGoal`, `onSave`) so audio-visual feedback can attach without
   touching resolution logic.
4. **RESULT** — the outcome is applied to match state (below), a short message is logged, and the
   loop returns to SETUP for the next play (or ends the match).

**Applying outcomes:**

- **COMPLETE:** the target receiver becomes the new ball carrier; possession is retained; play
  advances up-field. New play begins.
- **INTERCEPTION:** possession flips at the interception point; roles swap (attacker⇄defender);
  the intercepting side attacks the opposite goal. New play begins.
- **GOAL:** scoring side +1; ball returns to a kickoff with possession to the **conceding** side.
- **SAVE:** possession flips to the defending side (keeper's team) at the keeper; roles swap.

A completed pass whose target lies within **shooting range** of the attacked goal is resolved as a
**shot** instead of a plain completion (Section 4.4) — this is how goals happen.

**Match end:** first side to **3 goals** wins, with a hard cap of **24 plays** as a tiebreaker
(higher score, then possession count) so a match always terminates. These numbers are tunable
constants, not core mechanics.

## 4. Resolution algorithm — hybrid geometric + guess-bonus (CANONICAL)

This is the heart of the game and the part later steps must not redesign. A pass outcome is
decided by combining a **geometric** interception model (can a defender physically get to the
passing lane?) with a **guess bonus** (did the defender commit toward the correct lane?). All
constants below are named tunables; the *structure* is what's fixed.

### 4.1 Inputs

- `C` — ball-carrier position (pass origin), `T` — chosen receiver/runner position (pass target).
- Pass segment `S = C → T`; `laneLen = |T − C|` (normalized units).
- For each defender `d`: position `Pd`, committed guess unit vector `gd` (zero vector if unset).
- Tunable constants (defaults): `R_cover = 14`, `lengthGain = 0.9`, `baseGuess = 0.35`,
  `guessGain = 0.65`, `alignThreshold = 0.0`, keeper constants in 4.4.

### 4.2 Per-defender interception chance

For each defender `d`:

1. **Closest lane point.** Project `Pd` onto segment `S`, clamped to the segment, giving point
   `Q` and perpendicular distance `dist = |Pd − Q|`.
2. **Effective reach grows with pass length** (longer passes hang longer, giving defenders time to
   close): `R_eff = R_cover * (1 + lengthGain * laneLen / 100)`.
3. **Geometric coverage:** `geo = clamp(1 − dist / R_eff, 0, 1)`. A defender sitting on the lane
   gives `geo ≈ 1`; one far away gives `0`.
4. **Guess alignment.** Ideal break direction is `u = normalize(Q − Pd)` (toward the lane). With a
   committed guess `gd`, alignment `a = dot(normalize(gd), u) ∈ [−1, 1]`; if `gd` is unset,
   `a = 0`. Map to a factor `guessFactor = clamp((a − alignThreshold + 1) / 2, 0, 1)` — pointing
   the right way ≈ 1, the wrong way ≈ 0.
5. **Combine:** `pd = geo * (baseGuess + guessGain * guessFactor)`, clamped to `[0, 1]`.
   - A correct guess scales interception up toward `geo * (baseGuess + guessGain)`.
   - A wrong guess pulls it down toward `geo * baseGuess`.
   - No geometry (`geo = 0`) ⇒ no interception regardless of guess — you can't intercept a lane
     you can't reach.

### 4.3 Combined interception probability

Defenders are independent chances: `pIntercept = 1 − Πd (1 − pd)`, clamped to `[0, 0.95]` (a
sliver of completion always survives). Then draw `r ∈ [0,1)`:

- `r < pIntercept` → **INTERCEPTION** at point `Q` of the most-covering defender.
- otherwise the pass **completes** to `T`; go to 4.4.

This gives the three intended monotonic properties, which the verification tests assert:
correct guess ⇒ higher `pIntercept`; longer pass ⇒ higher `pIntercept`; more/closer defenders on
the lane ⇒ higher `pIntercept`.

### 4.4 Completed pass → shot resolution (goal vs save)

If the target `T` is within `shootRange = 30` of the attacked goal center `G`, the completion is a
**shot** resolved against the keeper:

1. `distFactor = clamp(1 − |T − G| / shootRange, 0, 1)` — closer is better.
2. `angleFactor = clamp(1 − |Tx − 50| / 50, 0.3, 1)` — central is better than tight angles.
3. `keeperCover = clamp(1 − keeperDist / keeperReach, 0, 1)` where `keeperDist` is the keeper's
   distance to the shot line and `keeperReach = 20`.
4. `pGoal = clamp(baseGoal * (0.5 + 0.5*distFactor) * angleFactor − keeperCover * keeperStop,
   0.03, 0.97)` with `baseGoal = 0.8`, `keeperStop = 0.7`.
5. Draw `r`: `r < pGoal` → **GOAL**, else **SAVE**.

If `T` is outside shooting range, the completion is a plain **COMPLETE** (Section 3).

## 5. Opponent (CPU) — Phase 1 baseline vs. target

The resolution algorithm is neutral; the CPU only supplies **choices** (which pass; which guess
direction). Two quality bars matter for the build:

- **Baseline (this prototype):** deliberately naive — the CPU picks a pass target essentially at
  random among receivers and sets defender guesses in a near-random direction. This is the
  "coin-flip" opponent the build prompt calls out, and it exists so Step 2 has something concrete
  to beat.
- **Target (build Step 2):** the CPU's choices become *weighted* — pass choice favors open lanes,
  reachable receivers, and up-field progress; defensive guesses weight likely receivers, the
  tightest passing lanes, and field position. Crucially, **Step 2 changes only these weightings,
  never Section 4.**

## 6. Controls

### 6.1 Baseline (this prototype — replaced in Step 1)

- **Attacking, choose pass:** click/tap a receiver to select it as the pass target (it highlights).
- **Attacking, position runner:** click/tap an empty pitch location to send the runner there.
- **Defending, set guess:** *click-then-click* — first click selects a defender, second click sets
  that defender's committed guess direction (from the defender toward the second point).
- Lock-in button, or auto-resolve at the end of the 3-second window.

### 6.2 Target (build Step 1)

Replace the click-then-click scheme with real **drag/swipe gestures** unified across mouse and
touch: drag from a defender to set its guess direction; drag the runner to reposition it; drag
from the carrier toward a receiver to choose/So aim the pass — all still inside the same 3-second
window. Pointer Events are used so one code path serves mouse and touch.

## 7. Feedback & feel

The baseline keeps feedback minimal but exposes the outcome hooks (`onPass`, `onIntercept`,
`onGoal`, `onSave`) and a `screenShake(trauma)` entry point so **Step 3** can layer sound,
camera shake, and slow-motion on interceptions/goals without modifying game logic — feedback rides
*on top of* the simulation, never inside it.

## 8. HUD

Score (both sides), current role (ATTACK / DEFEND), the 3-second decision countdown, a possession
indicator, and a short rolling message log of outcomes. Layout is anchor-based and scales to phone,
tablet, and desktop; touch targets are sized for fingers (refined in Step 3).

## 9. Roadmap traceability

| Build step | Touches | Must not touch |
|---|---|---|
| 1 Swipe controls | §6.2 input layer | §4 resolution |
| 2 CPU quality | §5 choice weighting | §4 resolution |
| 3 Feel & feedback | §7 hooks, §8 HUD | §3 loop timing, §4 |
| 4 Playtest | — | everything (freeze & play) |
| 5–10 Online | §3 loop kept in sync over network | §4 resolution, §3 timing |
