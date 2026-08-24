/* ================= Game flow: decision → resolve → outcome → next play ================= */

import { T, COL, clamp, dist2d, rand, cssColor } from './config.js';
import { state } from './state.js';
import { THREE, camState, passLine, hideBannerSprite } from './world.js';
import {
    players, ball, outfield, teamPlayers, setupPlay, holdBall,
    updateAnchors, moveToward, atkDir
} from './entities.js';
import { sfx } from './audio.js';
import { addLog, showBanner, updatePossessionChip, updateScores, setInstruction, updateDiveChip, ui } from './hud.js';
import { cpuAttackChoices, cpuDefendChoices, cpuGuessReceiver, cpuDiveGuess } from './ai.js';

/* ---------- decision setup ---------- */
export function startDecision() {
    state.mode = 'decision';
    state.remaining = T.window; state.locked = false; state.drag = null;
    state.diveChoice = 0;
    state.guessIdx = null;
    state.shotCall = null;
    ui.role.textContent = state.role === 'attack' ? 'ATTACK' : 'DEFEND';
    ui.role.style.color = state.role === 'attack' ? cssColor(COL.aim) : cssColor(COL.you);
    ui.divechip.hidden = state.role !== 'defend';
    if (state.role === 'defend') updateDiveChip(state.diveChoice);
    if (state.role === 'attack') {
        setInstruction('ATTACK: TAP a teammate — he receives the pass (gold ring + line). SWIPE a teammate — he runs to that spot. If a defender touches the ball mid-pass, you lose it.');
        cpuDefendChoices();
    } else {
        setInstruction('DEFEND: TAP the opponent you think will receive (red ring). SWIPE defenders toward danger. SWIPE YOUR KEEPER left/right to command his dive. A correct read wins you the ball.');
        cpuAttackChoices();
    }
}

/* ---------- resolve: physical simulation ---------- */
export function beginResolve() {
    if (state.mode !== 'decision') return;
    state.mode = 'resolve'; state.locked = true;
    ui.divechip.hidden = true;
    sfx.pass();

    const attackTeam = state.possession, defendTeam = attackTeam === 'you' ? 'cpu' : 'you';
    const d = atkDir();
    const aOut = outfield(attackTeam);
    const target = aOut[state.selected];

    // attackers commit: everyone bursts forward onto the pass (toward the attacked goal)
    aOut.forEach((p, i) => {
        if (i === 0) return; // carrier releases the ball
        if (p !== target && p.tz === p.anchor.z) { p.tx = clamp(p.x + rand(-4, 4), -18, 18); p.tz = clamp(p.z + d * rand(2, 8), -40, 38); }
    });

    // DEFENSIVE READ: a correct guess converges defenders on the receiver (+ reach burst)
    let guessIdx = defendTeam === 'you' ? state.guessIdx : cpuGuessReceiver(aOut);
    let readCorrect = false;
    if (guessIdx != null && aOut[guessIdx]) {
        readCorrect = aOut[guessIdx] === target;
        const gp = aOut[guessIdx];
        outfield(defendTeam).forEach((d, i) => {
            if (i === 0) { d.tx = clamp(gp.tx + rand(-2, 2), -18, 18); d.tz = clamp(gp.tz + rand(-1, 3), -40, 40); }
            else if (i % 2 === 1) { d.tx = clamp(gp.tx + rand(-6, 6), -18, 18); d.tz = clamp(gp.tz + rand(0, 5), -40, 40); }
        });
    }

    // launch the ball along the committed lane (equal-speed rule)
    ball.state = 'flying'; ball.dist = 0;
    ball.tx = target.tx; ball.tz = target.tz;
    const dir = Math.hypot(ball.tx - ball.x, ball.tz - ball.z) || 1;
    ball.vx = (ball.tx - ball.x) / dir * T.ballSpeed;
    ball.vz = (ball.tz - ball.z) / dir * T.ballSpeed;
    state.resolveCtx = { attackTeam, defendTeam, target, shot: null, done: false, readCorrect, readPerfect: false };
}

export function stepResolve(dt) {
    const ctx = state.resolveCtx;
    if (!ctx || ctx.done) return;

    players.forEach(p => {
        if (p.role === 'keeper') return;
        moveToward(p, p.tx, p.tz, T.playerSpeed, dt);
    });

    if (ball.state === 'flying') {
        // slight homing so a moving receiver can meet the equal-speed ball
        const tgt = ctx.target;
        const dx = tgt.x - ball.x, dz = tgt.z - ball.z, d = Math.hypot(dx, dz) || 1;
        ball.vx += (dx / d * T.ballSpeed - ball.vx) * Math.min(1, dt * 2.2);
        ball.vz += (dz / d * T.ballSpeed - ball.vz) * Math.min(1, dt * 2.2);
        const sp = Math.hypot(ball.vx, ball.vz) || 1;
        ball.vx = ball.vx / sp * T.ballSpeed; ball.vz = ball.vz / sp * T.ballSpeed;
        ball.x += ball.vx * dt; ball.z += ball.vz * dt;
        ball.dist += T.ballSpeed * dt;

        // PHYSICAL CONTACT: any defender touching the ball wins it (after it leaves the feet).
        // A correct read grants a reach burst — a big, but not absolute, advantage.
        if (ball.dist > 3) {
            const reach = ctx.readCorrect ? T.contactRadius * 1.8 : T.contactRadius;
            for (const d of outfield(ctx.defendTeam)) {
                if (dist2d(d, ball) < reach) { ctx.readPerfect = ctx.readCorrect; intercept(d, ctx); return; }
            }
        }
        // receiver collects
        if (dist2d(ctx.target, ball) < T.contactRadius) { onReceive(ctx); return; }
        // safety: ball out of play → turnover
        if (Math.abs(ball.z) > T.pitchL / 2 || Math.abs(ball.x) > T.pitchW / 2) {
            ctx.done = true; ball.state = 'held';
            sfx.lost(); showBanner('OUT OF PLAY', COL.cpu);
            addLog(ctx.attackTeam === 'you' ? 'The pass sailed out of play.' : 'CPU sprays the pass out of play.', '');
            flipPossessionTo(outfield(ctx.defendTeam)[0]);
            afterResult();
        }
    }

    if (ctx.shot) stepShot(ctx, dt);
}

/* ---------- outcomes ---------- */
function intercept(defender, ctx) {
    ball.state = 'held'; ctx.done = true;
    const humanLost = ctx.attackTeam === 'you';
    sfx.intercept(); camState.trauma = .55;
    showBanner(humanLost ? 'LOST THE BALL!' : (ctx.readPerfect ? 'PERFECT READ!' : 'BALL WON!'), humanLost ? COL.cpu : COL.you);
    addLog(
        humanLost ? (ctx.readPerfect ? 'CPU read your pass perfectly and cut it out.' : 'Your pass was cut out — CPU takes over.')
            : (ctx.readPerfect ? 'PERFECT READ! You guessed the receiver and won the ball!' : 'You won the ball — your attack begins.'),
        humanLost ? cssColor(COL.cpu) : cssColor(COL.you));
    flipPossessionTo(defender);
    afterResult();
}

function onReceive(ctx) {
    const recv = ctx.target;
    recv.x = ball.x; recv.z = ball.z;
    if (recv.z * atkDir() >= T.shootZ) { beginShot(ctx, recv); return; }
    ball.state = 'held'; ctx.done = true;
    sfx.pass(); camState.trauma = .12; showBanner('COMPLETE', COL.you);
    state.carrier = recv;                 // receiver becomes the carrier
    advanceFormation(recv);
    addLog(ctx.attackTeam === 'you' ? 'Pass completed — the attack advances.' : 'CPU completes the pass.', ctx.attackTeam === 'you' ? cssColor(COL.you) : cssColor(COL.cpu));
    afterResult();
}

function beginShot(ctx, shooter) {
    // aim at the corner called with the edge buttons; random if no call was made
    const corner = state.shotCall != null ? state.shotCall : (Math.random() < .5 ? -1 : 1);
    ctx.shot = {
        phase: 'flying',
        dir: atkDir(),
        shotX: corner * (T.goalHalf - 1.2),
        t: 0
    };
    ball.state = 'shot';
    const keepTeam = ctx.defendTeam;
    const keeper = teamPlayers(keepTeam).find(p => p.role === 'keeper');
    const cmd = keepTeam === 'you' ? state.diveChoice : cpuDiveGuess(ctx.shot.shotX);
    keeper.diveX = cmd * T.keeperReach;
    ctx.shot.keeper = keeper;
    sfx.pass();
}

function stepShot(ctx, dt) {
    const s = ctx.shot;
    const gz = s.dir * T.pitchL / 2;   // the attacked (defending team's) goal — fixed per team
    if (s.phase !== 'flying') return;
    const k = s.keeper;
    k.x += clamp(k.diveX - k.x, -T.playerSpeed * 1.35 * dt, T.playerSpeed * 1.35 * dt);
    const dx = s.shotX - ball.x, dz = gz - ball.z, d = Math.hypot(dx, dz) || 1;
    const sp = T.ballSpeed * 1.5;
    ball.x += dx / d * sp * dt; ball.z += dz / d * sp * dt;
    if (s.dir > 0 ? ball.z >= gz - .6 : ball.z <= gz + .6) {
        const keeperClose = Math.abs(k.x - s.shotX) < T.keeperReach;
        ctx.done = true;
        if (keeperClose && Math.random() < T.saveSkill) {
            ball.state = 'held';
            sfx.save(); camState.trauma = .3; showBanner('SAVED!', 0x9fd7ff);
            addLog(ctx.attackTeam === 'you' ? 'The keeper dives and holds it. Possession lost.' : 'YOUR KEEPER SAVES! You take over.', ctx.attackTeam === 'you' ? cssColor(COL.cpu) : cssColor(COL.you));
            flipPossessionTo(k);
            afterResult();
        } else {
            sfx.goal(); camState.trauma = .85; showBanner('GOAL!', COL.aim);
            state.score[state.possession === 'you' ? 0 : 1]++;
            updateScores();
            addLog(`GOAL — ${state.possession === 'you' ? 'YOU' : 'CPU'} strike${state.possession === 'you' ? '' : 's'} home!`, cssColor(COL.aim));
            kickoff(state.possession === 'you' ? 'cpu' : 'you');
            afterResult();
        }
    }
}

/* ---------- outcome application ---------- */
function flipPossessionTo(winnerPlayer) {
    // ONLY possession changes: teams keep their players, colors and halves — no mirroring.
    state.possession = winnerPlayer.team;
    const newAtk = outfield(state.possession);
    state.carrier = winnerPlayer.role === 'keeper' ? newAtk[0] : winnerPlayer;
    holdBall(state.carrier);
    updateAnchors();
    updatePossessionChip();
}

function kickoff(newPossession) {
    state.possession = newPossession;
    setupPlay(true);
    updatePossessionChip();
}

function advanceFormation(newCarrier) {
    const d = atkDir();
    const atk = outfield(state.possession);
    const shift = clamp(10, -40, 30 * d - newCarrier.z * d) * d;
    atk.forEach(p => {
        if (p === newCarrier) { p.tx = p.x; p.tz = p.z; return; }
        p.tx = clamp(p.x + rand(-5, 5), -18, 18);
        p.tz = clamp(p.z + d * (10 + rand(0, 4)), -40, 40);
    });
    // defense drops toward its own (fixed) goal
    outfield(state.possession === 'you' ? 'cpu' : 'you').forEach(p => {
        p.tx = clamp(p.x + rand(-4, 4), -18, 18);
        p.tz = clamp(p.z + d * 6, -40, 40);
    });
    updateAnchors();
}

function afterResult() {
    state.mode = 'result';
    setTimeout(() => {
        if (state.score[0] >= T.winScore || state.score[1] >= T.winScore || state.play >= T.maxPlays) {
            state.mode = 'end';
            const [a, b] = state.score;
            sfx.whistle();
            showBanner(a === b ? 'DRAW' : a > b ? 'YOU WIN' : 'CPU WINS', a > b ? COL.aim : COL.cpu);
            return;
        }
        nextPlay();
    }, 1250);
}

function nextPlay() {
    state.play++;
    state.role = state.possession === 'you' ? 'attack' : 'defend';
    ui.plays.textContent = 'PLAY ' + state.play;
    startDecision();
}

/* ---------- match control ---------- */
export function restartMatch() {
    state.score = [0, 0]; state.play = 1; state.possession = 'you'; state.role = 'attack';
    state.banner = null; camState.trauma = 0;
    hideBannerSprite();
    updateScores();
    ui.plays.textContent = 'PLAY 1';
    setupPlay(true);
    addLog('Kickoff at the center spot. You have the first possession.', cssColor(COL.aim));
    startDecision();
    updatePossessionChip();
}

/* ---------- live pass line ---------- */
export function updatePassLine() {
    const show = state.mode === 'decision' && state.role === 'attack' && state.carrier;
    passLine.visible = !!show;
    if (!show) return;
    const tgt = outfield(state.possession)[state.selected];
    if (!tgt) { passLine.visible = false; return; }
    passLine.geometry.setFromPoints([
        new THREE.Vector3(state.carrier.x, .5, state.carrier.z),
        new THREE.Vector3(tgt.tx, .5, tgt.tz)
    ]);
    passLine.computeLineDistances();
}
