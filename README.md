# ⚽ Guess & Pass

A single-file, dependency-free football passing duel: **3D low-poly players standing on a 2D top-view pitch**.
Every few seconds a pass lane opens, both sides secretly commit a direction, and the ball tells the truth.

Open [`index.html`](index.html) in any modern browser. No build step, no bundler, no install.

---

## 🎮 The Core Loop

Each play runs the same four-state machine (canonical **§3**):

1. **SETUP** (0.55 s) — formations take shape, the carrier is marked, the lane is drawn.
2. **DECISION** (3.0 s) — you pick your pass; the CPU secretly picks its break direction.
   The window is keyed off a real-clock timestamp, so slow-motion never steals your time.
3. **RESOLVE** — the ball travels and the canonical **§4** resolution decides
   `COMPLETE` / `INTERCEPTION` / `GOAL` / `SAVE`.
4. **RESULT** (1.05 s) — outcome flash, banner, log entry, then the next play.

First to **3 goals** wins. Hard cap of **24 plays**. You always attack the bottom goal; the CPU always attacks the top goal.

---

## ✨ Features

- **True 3D characters, undistorted 2D pitch.** Humanoids are WebGL meshes; the pitch is a Canvas2D-drawn
  texture. A tilted orthographic camera plus a `1/cos(TILT)` depth stretch means the 2D artwork projects
  **1:1 on screen** while the players remain genuinely three-dimensional.
- **Canonical resolution algorithm.** [`resolvePass()`](index.html:803) is pure — no DOM, no Three.js, no globals —
  and carries the frozen §4 constants unchanged.
- **Property verification on load.** [`runVerification()`](index.html:848) asserts the four monotonic
  properties of §4 (better guess ⇒ higher interception, longer pass ⇒ higher interception, more/closer
  defenders ⇒ higher interception, zero geometry ⇒ zero chance) plus a 4000-play validity sweep.
  Results land in `window.__GAP_VERIFY_RESULTS`.
- **Pointer Events only.** One code path for mouse, touch and pen, with gesture disambiguation
  (defender guess / carrier aim / teammate reposition / empty-pitch reposition) and a tap fallback.
- **Deterministic.** Every random draw routes through a seeded `mulberry32` PRNG.
- **Weighted CPU.** Difficulty is a 0–1 blend against the naive coin-flip baseline: COIN-FLIP / SHARP / RUTHLESS.
- **Feel.** Camera-trauma shake, outcome flash, banner, slow-motion applied to presentation only,
  and a Web Audio synth for kick / pass / good / bad / goal / save / whistle.
- **Accessible HUD.** Anchors-and-containers layout, `clamp()` type, ≥46 px tap targets,
  `env(safe-area-inset-*)`, a screen stack with initial focus per screen and `Escape` to go back,
  and event-driven DOM updates instead of per-frame polling.

---

## 🎹 Controls

| Action | Pointer | Keyboard |
| --- | --- | --- |
| Aim a pass | Drag from the carrier, release to commit | — |
| Pick a precise target | Tap a teammate, tap again to confirm | — |
| Move a teammate / runner | Drag that player | — |
| Guess as a defender | Drag the defender in the direction you expect | — |
| **Lock in** | Button | <kbd>Enter</kbd> / <kbd>Space</kbd> |
| Pause | Button | <kbd>Esc</kbd> |
| Mute | Button | <kbd>M</kbd> |
| Restart | Button | <kbd>R</kbd> |
| Help | Button | <kbd>H</kbd> |

---

## 🗂 Project Structure

```
index.html                  ← the whole game (the deliverable)
football-guess-game-design.md   ← mechanics + algorithm spec (§3 loop, §4 resolution)
step-by-step-build-prompt.md    ← phased build plan
guess-and-pass-2d.html          ← Canvas2D-only reference prototype (useful for §4 comparison)
js/ css/                        ← original Three.js module build (superseded, kept for reference)
legacy-3d/                      ← frozen snapshot of the first 3D build
```

The live page is [`index.html`](index.html) alone. The `js/` and `css/` module tree belongs to the earlier,
now-superseded 3D implementation and is not loaded by the current build.

---

## 🚀 Run It

```bash
# option 1 — just open the file
xdg-open index.html      # macOS: open index.html

# option 2 — serve it locally
python3 -m http.server 8080
# then visit http://localhost:8080
```

Three.js r0.149.0 is loaded as a UMD bundle from jsDelivr, so the page also works straight off `file://`.
If the CDN is unreachable the page reports it in the on-screen error box instead of failing silently.

---

## ⚙️ Tuning

All tunables live in the single `T` object at the top of the inline script
([`T`](index.html:670)). The §4 block is canonical and must not be redesigned:

| Constant | Value | Meaning |
| --- | --- | --- |
| `R_cover` | `14` | Base defensive reach |
| `lengthGain` | `0.9` | Reach growth per unit of pass length |
| `baseGuess` | `0.35` | Chance with an unset/wrong guess |
| `guessGain` | `0.65` | Extra chance from perfect guess alignment |
| `alignThreshold` | `0.0` | Alignment offset before guessing helps |
| `shootRange` | `30` | Distance to goal that counts as a shot |
| `keeperReach` | `20` | Keeper's coverage radius |
| `baseGoal` | `0.8` | Base scoring chance |
| `keeperStop` | `0.7` | Keeper's ability to deny a covered shot |

Presentation-only values (`setupTime`, `resultTime`, `slowScale`, `playerSpeed`, `driftSpeed`) are free to change.

---

## 🧪 Verifying §4

The checks run automatically on load and print a console table. To run them on demand:

```js
window.__GAP.runVerification()          // { allPass, results }
window.__GAP_VERIFY_RESULTS             // results of the boot-time run
window.__GAP.resolvePass(input, rng)    // call the pure resolver directly
window.__GAP.T                          // live tunables
```

The same module is runnable headlessly in Node — the extraction used during development:

```bash
# pull §0 tunables through the end of runVerification(), then execute it
sed -n '666,927p' index.html > /tmp/gap4.js
```

---

## 🗺 Roadmap

- [x] Canonical §3 four-state loop with a real-clock decision window
- [x] Canonical §4 hybrid geometric + guess-bonus resolution
- [x] Seeded determinism
- [x] Pointer Events controls (drag / swipe / tap)
- [x] Weighted CPU with a difficulty blend
- [x] Headless §4 property verification
- [ ] Replay of a match from its seed
- [ ] Persisted difficulty and mute preferences

---

## 📐 Design Docs

- [`football-guess-game-design.md`](football-guess-game-design.md) — the mechanics and algorithm spec,
  including the CANONICAL §3 loop and §4 resolution algorithm.
- [`step-by-step-build-prompt.md`](step-by-step-build-prompt.md) — the phased build plan.

> **What must never change:** the §3 state machine and its timings, and the §4 resolution algorithm
> and its constants. Everything else is presentation and may be tuned freely.
