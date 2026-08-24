# Build Prompt — Guess & Pass, Step by Step

I have two reference files: football-guess-game-design.md (mechanics/algorithm spec) and guess-and-pass.html (working single-player prototype). Use them as the source of truth — don't redesign the core mechanics, build on top of them. Work through the steps below **in order**, one at a time. After each step, show me the result before moving to the next one.

## Phase 1 — Finish the vs-Computer mode first

**Step 1: Swipe controls.**
Replace the current click-then-click defender direction system with real drag/swipe gestures that work on both mouse (desktop) and touch (mobile), for both defensive direction-setting and attacking-runner positioning, still inside the same 3-second decision window.

**Step 2: Improve the CPU opponent.**
Right now the CPU's pass choice and defensive guessing are close to random. Make the CPU's guess weighted by realistic factors (distance to likely receivers, passing lanes, field position) so it's a genuine opponent rather than a coin flip, without changing the underlying hybrid geometric+guess-bonus resolution algorithm.

**Step 3: Feel and feedback pass.**
Add sound effects for pass, interception, goal, and save. Add small camera shake or slow-motion on interceptions and goals. Clean up the HUD for mobile screen sizes and touch target sizes.

**Step 4: Playtest checkpoint.**
Once steps 1–3 are done, stop and let me play a full match before touching anything multiplayer-related. I want to confirm the core loop is actually fun before we add networking complexity.

## Phase 2 — Add online play (only after I approve Phase 1)

**Step 5: Server foundation.**
Set up a lightweight backend (e.g. Node.js + WebSockets, or a service like Colyseus) that can host live match rooms. Each room runs the exact same decision-window/resolve-loop timing as the prototype, kept in sync between both connected players.

**Step 6: Matchmaking queue with a hard capacity limit.**
Build a matchmaking system with these rules:
- Maximum of **100 players connected/queued at once**, system-wide.
- When a player clicks "Find Match," they're added to a queue.
- The system automatically pairs any two available players in the queue at random as soon as both are free.
- If the 100-player cap is reached, new players seeing a "server full, please wait" state instead of connecting, and are let in as slots free up.
- If a queued player waits too long with no opponent available, show them a status update (not a hard error).

**Step 7: Match handoff.**
Once two players are paired, move them both into a live match room using the same game engine and rules built in Phase 1, just with the CPU's decisions now coming from the second human's real input instead of AI logic.

**Step 8: Emoji chat.**
Add a small emoji picker and chat log, visible only inside PvP matches, as in the original spec.

**Step 9: Reconnection & disconnect handling.**
Decide and implement what happens if a player's connection drops mid-match (e.g. short grace period to reconnect, otherwise the match ends and the remaining player is returned to matchmaking).

**Step 10: Load test the 100-player cap.**
Before calling this done, simulate close to 100 concurrent connections to confirm the queue, pairing, and cap-enforcement logic all hold up under real concurrent load, not just two testers.

Go step by step — don't jump ahead to Phase 2 work until I've explicitly said Phase 1 is approved.
