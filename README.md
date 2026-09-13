# ⚽ Guess & Pass

A football passing duel: **3D low-poly players standing on a 2D top-view pitch**.
Every few seconds a pass lane opens, both sides secretly commit a direction, and the ball tells the truth.

Built with **Astro**. The game engine is a self-contained, pure-JS module bundled by Vite; Three.js r0.149.0
is compiled in from `node_modules`, so there is **no CDN in the script path** and no network dependency at runtime.

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
- **Canonical resolution algorithm.** [`resolvePass()`](src/scripts/game-source.js:176) is pure — no DOM, no
  Three.js, no globals — and carries the frozen §4 constants unchanged.
- **Property verification, in the page and in Node.** [`runVerification()`](src/scripts/game-source.js:220)
  asserts the monotonic properties of §4 (better guess ⇒ higher interception, longer pass ⇒ higher interception,
  more/closer defenders ⇒ higher interception, zero geometry ⇒ zero chance) plus a 4000-play validity sweep.
  It runs on load and reports into the menu card; `npm run verify` runs the same checks headlessly in CI.
- **Pointer Events only.** One code path for mouse, touch and pen, with gesture disambiguation
  (defender guess / carrier aim / teammate reposition / empty-pitch reposition) and a tap fallback.
- **Deterministic.** Every random draw routes through a seeded `mulberry32` PRNG.
- **Weighted CPU.** Difficulty is a 0–1 blend against the naive coin-flip baseline: COIN-FLIP / SHARP / RUTHLESS.
- **Feel.** Camera-trauma shake, outcome flash, banner, slow-motion applied to presentation only,
  and a Web Audio synth for kick / pass / good / bad / goal / save / whistle.
- **Accessible HUD.** Anchors-and-containers layout, `clamp()` type, ≥44 px tap targets,
  `env(safe-area-inset-*)`, a screen stack with initial focus per screen and `Escape` to go back,
  and event-driven DOM updates instead of per-frame polling.
- **One design system.** Every surface — HUD, screens, buttons, the pitch palette — reads from the tokens in
  [`DESIGN.md`](DESIGN.md) (Vercel / Geist): a black-and-white duet on a near-white canvas, 1px hairlines,
  6 px app squares versus 100 px marketing pills, and colour permitted only as small accent marks and the
  hero mesh gradient.

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
src/
  pages/index.astro           ← the page: HUD, screens, and the engine's DOM contract
  scripts/game-source.js      ← the entire game engine (pure §4 module + WebGL scene)
  styles/tokens.css           ← DESIGN.md transcribed into CSS custom properties
  styles/game.css             ← game chrome built on those tokens
  styles/global.css           ← page layer: responsive type, HUD stacking, focus, motion
tools/
  publish.mjs                 ← validates the out/ artifact and reports what will ship
  verify-4.mjs                ← runs the §4 property tests headlessly in Node
public/
  _headers                    ← Cloudflare response headers (CSP + caching)
out/                          ← the build artifact (git-ignored); this is what deploys

football-guess-game-design.md  ← mechanics + algorithm spec (§3 loop, §4 resolution)
DESIGN.md                      ← the design system every UI surface is built from
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

All tunables live in the single `T` object at the top of the engine
([`T`](src/scripts/game-source.js:35)). The §4 block is canonical and must not be redesigned:

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
The 3D palette is the `COL` object ([`COL`](src/scripts/game-source.js:68)); the matching CSS colours are
[`CSS`](src/scripts/game-source.js:73) and the `--x-*` custom properties in
[`game.css`](src/styles/game.css:18). Change them together or the 3D players and the DOM chrome will disagree.

---

## 🧪 Verifying §4

In the browser — either press **RUN §4 VERIFICATION TESTS** on the menu, which renders the verdict inline, or:

```js
window.__GAP.runVerification()          // { allPass, results }
window.__GAP_VERIFY_RESULTS             // results of the most recent run
window.__GAP.resolvePass(input, rng)    // call the pure resolver directly
window.__GAP.T                          // live tunables
window.__GAP.api                        // drive the state machine directly
```

Headlessly, from the same source file the page bundles:

```bash
npm run verify
```

```
  Guess & Pass — §4 resolution algorithm
  ────────────────────────────────────────────────────────────────────────
  PASS   better guess ⇒ higher pIntercept
  PASS   longer pass ⇒ higher pIntercept
  PASS   more defenders ⇒ higher pIntercept
  PASS   closer defender ⇒ higher pIntercept
  PASS   geo = 0 ⇒ pd = 0 (guess cannot help)
  PASS   4000 random plays: valid outcomes, bounded pIntercept
  ────────────────────────────────────────────────────────────────────────
  ALL PASS 6 properties
```

[`tools/verify-4.mjs`](tools/verify-4.mjs) slices the pure region out of
[`game-source.js`](src/scripts/game-source.js) between stable structural markers and evaluates it in a
`node:vm` sandbox — it never duplicates the algorithm, so the tests cannot drift from the shipped code.
It exits non-zero on failure, so it can gate a deploy.

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

- [x] Canonical §3 four-state loop with a real-clock decision window
- [x] Canonical §4 hybrid geometric + guess-bonus resolution
- [x] Seeded determinism
- [x] Pointer Events controls (drag / swipe / tap)
- [x] Weighted CPU with a difficulty blend
- [x] Headless §4 property verification
- [x] Astro build with the single-file engine extracted verbatim
- [x] DESIGN.md design system applied to every UI surface
- [ ] Replay of a match from its seed
- [ ] Persisted difficulty and mute preferences

---

## 📐 Design Docs

- [`football-guess-game-design.md`](football-guess-game-design.md) — the mechanics and algorithm spec,
  including the CANONICAL §3 loop and §4 resolution algorithm.
- [`DESIGN.md`](DESIGN.md) — the visual system: colour, type, spacing, radius, elevation, components.

> **What must never change:** the §3 state machine and its timings, and the §4 resolution algorithm
> and its constants. Everything else is presentation and may be tuned freely.
