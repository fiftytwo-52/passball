# ⚽ Guess & Pass 3D

> **Read the lane. Commit the pass. Break the pattern.**

A fast, psychological 3D football duel built with **Three.js** — stripped down to football's
most tense moment: *the pass*. Every play freezes time, both sides commit in secret, and the
battle is pure mind-game.

🌐 **Play it:** serve the folder and open `index.html` — works on desktop and mobile.

---

## 🎮 The Core Loop

```
── KICKOFF ──────────────────────────────────────────────
   Ball on the center spot. Play FREEZES for 10 seconds.

── ATTACKING (you have the ball) ───────────────────────
   👆 TAP   a teammate  →  he receives the pass (gold ring + line)
   👉 SWIPE a teammate  →  he sprints to the drawn spot

── DEFENDING (opponent has the ball) ───────────────────
   👆 TAP   an opponent →  guess who will receive (red ring)
   👉 SWIPE your players →  collapse on the danger zone
   🧤 SWIPE your keeper →  command the dive ◀ STAY ▶

── TIME'S UP ───────────────────────────────────────────
   Everything resolves at once. Ball flies along the line,
   every player sprints, keeper dives…
   · Defender touches the ball  → possession flips 🔄
   · Correct read               → reach burst to win it back
   · Receiver deep near goal    → SHOT vs the diving keeper 🥅
```

**First to 3 goals wins** · 24-play limit tiebreaker.

---

## ✨ Features

| | |
|---|---|
| 🧊 **Frozen decision windows** | Simultaneous hidden commits — pure reading of your opponent |
| 🏃 **Living pitch** | Everyone moves with purpose; ball & players share equal speed |
| ✋ **Tap vs Swipe** | One finger, two meanings — pick a receiver or draw a run |
| 🧠 **Weighted CPU** | Attacks open lanes, reads your habits, guesses dives — no coin flips |
| 🧤 **Keeper dives** | Physically commanded left/right/stay; correct dive = save |
| 📱 **Mobile-first UI** | Clean HUD that scales from phone to desktop, safe-area aware |
| 🔊 **Juice** | Camera shake, SFX, outcome banners — layered feedback on every event |

---

## 🗂 Project Structure

```
passball/
├── index.html            ← app shell (menu · tutorial · HUD)
├── css/
│   └── style.css         ← one responsive layout for all screens
└── js/                   ← ES modules
    ├── main.js           ← bootstrap + render loop
    ├── config.js         ← every tunable in one place
    ├── state.js          ← central game state
    ├── world.js          ← Three.js scene, camera, pitch, goals
    ├── entities.js       ← humanoid players, ball, formations
    ├── input.js          ← tap/swipe pointer handling
    ├── ai.js             ← CPU attack · defense · reads · dives
    ├── game.js           ← decision → resolve → outcome flow
    ├── hud.js            ← DOM HUD helpers
    └── audio.js          ← synthesized SFX
```

---

## 🚀 Run It

ES modules need an HTTP server (opening the file directly won't work):

```bash
# option 1
npx serve

# option 2
python3 -m http.server 8000
```

Then open `http://localhost:3000` (or `:8000`).

---

## ⚙️ Tuning

Every gameplay number lives in [`js/config.js`](js/config.js):

```js
window: 10.0        // decision window length (seconds)
playerSpeed: 11     // shared by every player AND the ball
contactRadius: 1.9  // interception touch distance
shootZ: 24          // distance that turns a reception into a shot
keeperReach: 4.2    // lateral coverage of a committed dive
```

---

## 🗺 Roadmap

- [x] **Phase 1** — vs Computer (controls · CPU · feel · playtest)
- [ ] **Phase 2** — Online PvP
  - [ ] WebSocket match rooms with synced decision windows
  - [ ] Matchmaking queue · 100-player capacity cap
  - [ ] Emoji chat
  - [ ] Reconnection & disconnect handling

---

## 📐 Design Docs

- [`football-guess-game-design.md`](football-guess-game-design.md) — mechanics & resolution spec
- [`step-by-step-build-prompt.md`](step-by-step-build-prompt.md) — phased build plan
- [`guess-and-pass-2d.html`](guess-and-pass-2d.html) — the original 2D prototype, kept for reference

---

*Built with Three.js · no build step · no dependencies beyond the CDN*
