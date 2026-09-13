# Guess & Pass — 2D Real-Time Build Spec (combined)

**This is the single authoritative document.** It folds together the original design, the
real-time mechanics rewrite, and the match-length / penalty-shootout rules into one spec.
It **supersedes** [`football-guess-game-design.md`](football-guess-game-design.md), whose
turn-based decision-window loop (§3) and hybrid geometric + guess-bonus resolution (§4) are
no longer the game.

---

## 0. Assumptions made — confirm or correct

1. **6 players per team = 1 GK + 5 outfield.** Attacking uses carrier + receiver + 2 runners
   (4 controlled), leaving exactly 1 auto. Defending uses interceptor + marker (2 controlled),
   leaving 3 auto.
2. **The conceding team kicks off** after a goal.
3. **The marker** (2nd controlled defender) repositions freely; it only contests if the ball
   reaches its spot.
4. The keeper's dive on open-play shots gets a **reaction window equal to the shot's flight
   time**, with a default dive direction if no input.
5. "Drag the ball-carrier to aim" is **one single gesture that fires on release**.
6. The penalty save is a **reach / tolerance** comparison (`PENALTY_KEEPER_REACH`), not an
   exact pixel match.
7. Shootout order = **5 outfield players per side, alternating**; sudden death after 10 kicks.
8. **"Go to Penalties" is a manual button** at full time when the scores are level.
9. **Not covered at all:** out of bounds, throw-ins / corners, fouls, offside, half-time
   end-switching.

---

## 1. Concept

Continuous **real-time 6-a-side top-down football**. No turns, no hidden decision windows.
`BALL_SPEED > PLAYER_SPEED` always — that single inequality is what makes interception and
shot-save genuine "beat it there" races. Two **2-minute halves**. A draw is settled by a
**penalty shootout** with its own turn-based flow.

## 2. Teams, pitch and constants

- 12 players total (2 × [1 GK + 5 outfield]).
- Pitch stays normalized: `x, y ∈ [0, 100]` (the existing 100×100 logic grid over the
  anamorphic 105×68 m presentation).
- `GOAL_HALF_WIDTH ≈ 12.5` → mouth ≈ 25 units, centred on `x = 50` at `y = 0` and `y = 100`.
- `BALL_SPEED` (= 34) **>** `PLAYER_SPEED` (= 26).
- `SHOT_SPEED` (= 40) is a little faster than `BALL_SPEED`.
- `HALF_LENGTH = 120 s` (2:00).

| constant | value | meaning |
|---|---|---|
| `PLAYER_SPEED` | 26 | outfield run speed, logic units / s |
| `DIVE_SPEED` | 30 | keeper dive speed (slightly above `PLAYER_SPEED`) |
| `BALL_SPEED` | 34 | ground pass speed — must beat `PLAYER_SPEED` |
| `SHOT_SPEED` | 40 | shot speed |
| `CATCH_RADIUS` | 3.0 | interception / control radius |
| `SHOT_RANGE` | 30 | max distance from goal to attempt a shot |
| `KEEPER_REACH` | 6.0 | open-play save reach |
| `PENALTY_KEEPER_REACH` | 12.0 | shootout save reach (tolerance) |
| `GOAL_HALF_WIDTH` | 12.5 | half the goal mouth |
| `HALF_LENGTH` | 120 | seconds per half |
| `DRILL_SPEED` | 22 | off-ball drift / shape speed |

## 3. Match lifecycle

- **New match** → both teams in their own half, ball at `(50, 50)`, **random kickoff team**.
- Only **two hard resets**:
  - **GOAL** → centre kickoff to the **conceding** team.
  - **SAVE** → the saving team's carrier restarts from around their **own penalty spot**
    (a goal kick) and immediately becomes the attacking side. No whistle, no pause.
- **INTERCEPTION never resets.** Possession flips at the exact point of the interception and
  the intercepting side drops straight into §4 mid-flow.
- **Half / full time:** the current play finishes. After the 2nd half, level scores →
  show **"Go to Penalties"**.

## 4. Attacking sequence

- **Drag from the current carrier toward a teammate and release** to fire the pass at
  `BALL_SPEED`.
- **Tap** the intended receiver.
- **Tap up to two runners** to send them on runs.
- Everyone else **auto-drifts** toward the attacking third.
- When the ball reaches its target, that player becomes the new carrier and the sequence loops.

## 5. Shooting

- Only inside `SHOT_RANGE` (= 30) of the opponent goal.
- **Double-tap a point along the goal mouth** to shoot at `SHOT_SPEED`.
- Outside range, a double-tap does nothing.

## 6. Defending

- **Interceptor** — drag live toward the guessed pass line.
- **Marker** — free reposition.
- **Goalkeeper** — drag / tap the dive point when the opponent shoots.
- **3 auto-drift outfielders** holding shape.

## 7. Resolution — real-time race, no dice

- Ball: `B(t) = C + dir · BALL_SPEED · t`.
- Interceptor: `Pd(t)` moves at `PLAYER_SPEED`.
- **Interception fires the instant `|Pd(t) − B(t)| ≤ CATCH_RADIUS` while the ball is in
  flight.** The pass completes if the ball reaches its target without ever coming within
  `CATCH_RADIUS`.
- **Save:** the keeper moves toward the dragged / tapped dive target at `DIVE_SPEED`; the
  shot is **saved if the keeper comes within `KEEPER_REACH` of the ball before it crosses the
  goal line**, else **GOAL**. No input during the window → **default dive toward the shot's
  side**.

These are implemented as **pure functions** (`src/scripts/rules.js`) that take positions and
return outcomes — no canvas, no `THREE`, no `window`. That is what `npm run verify` tests.

## 8. HUD

- Score for both sides, **ATTACK / DEFEND** role, short rolling log.
- **Running match clock** counting down each 2-minute half with a **"HALF 1" / "HALF 2"**
  label, plus a half-time marker.
- If it goes to penalties, the HUD **swaps into a shootout-specific view**: kicker order,
  separate shootout score, whose turn.
- Hard rendering constraint (carried from the earlier build): **nothing but the players and
  the ball may appear over the ground.** The docks are flow siblings of the canvas stage, so
  chrome can only ever shrink the pitch, never cover it.

## 9. Implementation notes

- Regulation is a **single continuous `requestAnimationFrame` simulation** that updates every
  entity every frame and runs the §7 proximity checks every frame.
- The **penalty shootout is a different mode** with its own small state machine:
  `AIM → CHECK_ON_TARGET → DIVE → RESOLVE → NEXT_KICKER`.
- Resolution logic stays **pure and decoupled from rendering**, testable independently of the
  canvas.

## 10. Penalty shootout

- Triggered **only** by the manual button at full time with a level score.
- Camera zooms to a dedicated **penalty view**: ball on the spot, kicker, opposing keeper.
- Teams alternate through their **5 outfield players**; **sudden death after 10 kicks** until
  a round ends unequal.
- Per kick: draw the aim line → **off-target = automatic MISS** → the defending side draws the
  dive line (CPU auto-draws for the non-human side) → **SAVED if the dive point is within
  `PENALTY_KEEPER_REACH` of the shot target, else GOAL** → advance.
