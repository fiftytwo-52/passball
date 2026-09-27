/**
 * tactik — rondo roster limits, clean departures and the confirm sheet.
 *
 * Three things this covers, one per block:
 *   1. LIMITS    the lobby caps at 10 players and refuses to start below 4.
 *   2. DEPARTURE a leaver is removed completely (mesh, name, colour, score) and
 *                the survivors re-seat themselves without anybody being turned
 *                into a copy of the player who left.
 *   3. CONFIRM   every action that ends a game — restart, quit to menu, leave
 *                the rondo — asks first, cancels cleanly, and really does the
 *                thing when confirmed.
 *
 * Run the dev server first:  npm run dev
 *   node tools/test-rondo-leave-confirm.mjs
 */
import puppeteer from 'puppeteer';

const URL = 'http://localhost:4321';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let failures = 0;
function check(ok, label, detail) {
    if (ok) {
        console.log('  ✓ ' + label);
    } else {
        failures++;
        console.log('  ✗ ' + label + (detail !== undefined ? ` — got ${JSON.stringify(detail)}` : ''));
    }
}

async function freshPage(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    page.on('pageerror', err => console.log('  [PAGE ERROR]', err.message));
    page.on('console', msg => {
        const t = msg.text();
        if (/Uncaught|TypeError|is not a function/.test(t)) console.log('  [BROWSER]', t);
    });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await sleep(1200);
    return page;
}

/** Click by selector, hidden or not — the DOM is the contract, not the paint. */
const click = (page, sel) => page.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) throw new Error('missing element ' + s);
    el.click();
}, sel);

const read = (page, fn, arg) => page.evaluate(fn, arg);

/** Open a rondo room with `cpus` computer players and start the game. */
async function startRondo(page, cpus) {
    await click(page, '#btn-rondo');
    await page.waitForSelector('#pane-rondo-create', { visible: true });
    await page.type('#rondo-name', 'Captain');
    await click(page, '#btn-rondo-create');
    await page.waitForSelector('#rondo-create-active:not([hidden])');
    for (let i = 0; i < cpus; i++) await click(page, '#btn-rondo-cpu-plus');
    await click(page, '#btn-rondo-start');
    await page.waitForSelector('#hud-rondo:not([hidden])');
    await sleep(1200);
}

/* ------------------------------------------------------------------ 1. limits */

async function testLimits(browser) {
    console.log('\n1. Roster limits — 10 max, 4 min');
    const page = await freshPage(browser);
    await click(page, '#btn-rondo');
    await page.waitForSelector('#pane-rondo-create', { visible: true });
    await page.type('#rondo-name', 'Captain');
    await click(page, '#btn-rondo-create');
    await page.waitForSelector('#rondo-create-active:not([hidden])');

    for (let i = 0; i < 15; i++) await click(page, '#btn-rondo-cpu-plus');
    let s = await read(page, () => ({
        cpus: document.getElementById('rondo-cpu-count').textContent.trim(),
        count: document.getElementById('rondo-player-count').textContent.trim(),
        startDisabled: document.getElementById('btn-rondo-start').disabled,
    }));
    check(s.cpus === '9', 'the stepper stops at 9 computers (1 human + 9 = 10)', s.cpus);
    check(s.count === '(10/10)', 'the roster reads (10/10) at the cap', s.count);
    check(s.startDisabled === false, 'START RONDO is live at 10 players');

    // Down to two computers: three players is below the minimum.
    for (let i = 0; i < 7; i++) await click(page, '#btn-rondo-cpu-minus');
    s = await read(page, () => ({
        cpus: document.getElementById('rondo-cpu-count').textContent.trim(),
        count: document.getElementById('rondo-player-count').textContent.trim(),
        hint: document.getElementById('rondo-roster-hint').textContent.trim(),
        startDisabled: document.getElementById('btn-rondo-start').disabled,
    }));
    check(s.cpus === '2' && s.count === '(3/10)', 'the roster counts down with the stepper', s);
    check(s.hint === 'Need at least 4 players to start (3/4).', '3 players is below the minimum and says so', s.hint);
    check(s.startDisabled === true, 'START RONDO is dead at 3 players');

    await click(page, '#btn-rondo-cpu-plus');
    s = await read(page, () => ({
        count: document.getElementById('rondo-player-count').textContent.trim(),
        hint: document.getElementById('rondo-roster-hint').textContent.trim(),
        startDisabled: document.getElementById('btn-rondo-start').disabled,
    }));
    check(s.count === '(4/10)' && s.startDisabled === false, '4 players is the minimum that can start', s);
    check(/Ready/.test(s.hint), 'the hint switches to Ready at 4 players', s.hint);

    await page.close();
}

/* --------------------------------------------------------------- 2. departure */

/** Snapshot every seat's identity, then pull one player out of the game.
 *  Runs inside the page, so it takes its own `{ leaverKind }` argument. */
function departScript(arg) {
    const data = window.__GAP.rondo.data;
    const meshes = window.__GAP.rondo.meshes;
    const leaverId = arg.leaverKind === 'middle' ? data.middle : data.circle[1];
    const before = {
        leaverId, leaverKind: arg.leaverKind,
        circle: [...data.circle], middle: data.middle, players: data.players.length,
        seats: {},
    };
    for (const p of data.players) {
        const m = meshes[p.id];
        before.seats[p.id] = {
            name: p.name,
            color: m ? m.color : null,
            gx: m ? m.gx : null,
            gy: m ? m.gy : null,
            kit: m && m.kitMat ? m.kitMat.color.getHex() : null,
            label: !!(m && m.label),
        };
    }
    before.leaverName = before.seats[leaverId] ? before.seats[leaverId].name : null;
    before.leaverColor = before.seats[leaverId] ? before.seats[leaverId].color : null;
    window.__GAP.rondo.hostOnGuestLeft(leaverId);
    return before;
}

function inspectLeaver(before) {
    const data = window.__GAP.rondo.data;
    const meshes = window.__GAP.rondo.meshes;
    const out = {
        meshCount: Object.keys(meshes).length,
        players: data.players.length,
        missing: [], kept: [], walked: [],
        leaverMesh: !!meshes[before.leaverId],
        leaverColorStillOnPitch: Object.keys(meshes).some(id => meshes[id].color === before.leaverColor),
        leaverScore: data.scores[before.leaverId] === undefined,
        circle: [...data.circle],
        middle: data.middle,
        overlayShown: !!(document.getElementById('rondo-over') && !document.getElementById('rondo-over').hidden),
        ballName: document.getElementById('rondo-ball-name').textContent.trim(),
        midName: document.getElementById('rondo-middle-name').textContent.trim(),
        meshNames: data.players.map(p => p.name),
    };
    for (const id of Object.keys(before.seats)) {
        if (id === before.leaverId) continue;
        const m = meshes[id];
        const was = before.seats[id];
        if (!m) { out.missing.push(id); continue; }
        out.kept.push({
            id,
            nameKept: data.players.some(p => p.id === id && p.name === was.name),
            colorKept: m.color === was.color,
            labelKept: !!m.label,
        });
        out.walked.push(m.homeGx !== undefined ? Math.hypot(m.gx - m.homeGx, m.gy - m.homeGy) : 0);
    }

    /* How evenly the ring is spaced, worst gap over best gap. The starting ring
       is spaced for the players who began the game; the ring after a departure
       must be spaced for the players who are left, or somebody is standing in a
       seat that belongs to nobody. */
    const ringGaps = (ids, pos) => {
        const gaps = [];
        for (let i = 0; i < ids.length; i++) {
            const a = pos(ids[i]);
            const b = pos(ids[(i + 1) % ids.length]);
            if (a && b) gaps.push(Math.hypot(a.gx - b.gx, a.gy - b.gy));
        }
        return gaps.length > 2 ? Math.max(...gaps) / Math.min(...gaps) : 1;
    };
    out.gapRatioAfter = ringGaps(out.circle, id => meshes[id] && { gx: meshes[id].homeGx, gy: meshes[id].homeGy });
    out.gapRatioBefore = ringGaps(before.circle, id => before.seats[id] && { gx: before.seats[id].gx, gy: before.seats[id].gy });
    out.homesChanged = out.circle.filter(id => {
        const was = before.seats[id], m = meshes[id];
        return !!(was && m && (m.homeGx !== was.gx || m.homeGy !== was.gy));
    }).length;
    return out;
}

async function testDeparture(browser) {
    console.log('\n2. Departure — the leaver goes completely, the circle re-seats');
    const page = await freshPage(browser);
    await startRondo(page, 5);   // 1 human + 5 computers = 6 on the pitch

    // --- a circle player leaves -------------------------------------------
    const before = await read(page, departScript, { leaverKind: 'circle' });
    await sleep(1000);
    const after = await read(page, inspectLeaver, before);

    check(after.leaverMesh === false, 'the leaver\'s mesh is gone from the scene');
    check(after.meshCount === after.players && after.players === before.players - 1,
        'one mesh per surviving player, one fewer than before', { meshes: after.meshCount, players: after.players });
    check(after.missing.length === 0, 'no survivor lost their mesh');
    check(after.kept.every(k => k.nameKept && k.colorKept && k.labelKept),
        'every survivor kept their own name, kit colour and name tag', after.kept);
    check(after.leaverColorStillOnPitch === false, 'nobody was recoloured into the leaver\'s kit (no copy)',
        after.leaverColorStillOnPitch);
    check(after.leaverScore, 'the leaver\'s score line went with them');
    check(after.homesChanged >= 1, 'survivors moved house to close the gap the leaver left', after.homesChanged);
    check(after.gapRatioAfter < 1.1 && after.gapRatioAfter < after.gapRatioBefore,
        'the circle is evenly re-spaced for one fewer player',
        { before: after.gapRatioBefore.toFixed(2), after: after.gapRatioAfter.toFixed(2) });
    check(after.walked.every(d => d < 30), 'the survivors walked towards the new seats', after.walked);
    check(!after.circle.includes(before.leaverId), 'the leaver is out of the circle list');
    check(after.overlayShown === false, 'the rondo is still running (6 → 5 players)');
    check(after.ballName !== '–' && after.midName !== '–',
        'the HUD still names a real ball carrier and middle', { ball: after.ballName, middle: after.midName });

    // --- the middle leaves -------------------------------------------------
    const beforeMid = await read(page, departScript, { leaverKind: 'middle' });
    await sleep(900);
    const afterMid = await read(page, (b) => {
        const data = window.__GAP.rondo.data;
        const meshes = window.__GAP.rondo.meshes;
        const promoted = meshes[data.middle];
        return {
            leaverMesh: !!meshes[b.leaverId],
            meshCount: Object.keys(meshes).length,
            players: data.players.length,
            newMiddle: data.middle,
            isLeaver: data.middle === b.leaverId,
            wasFirstCircle: b.circle.filter(id => id !== b.leaverId)[0] === data.middle,
            identityKept: promoted ? promoted.color === b.seats[data.middle].color : false,
            shirtIsMiddleKit: promoted && promoted.kitMat ? promoted.kitMat.color.getHex() === 0xff2d87 : false,
            stillInCircle: data.circle.includes(data.middle),
            overlayShown: !!(document.getElementById('rondo-over') && !document.getElementById('rondo-over').hidden),
        };
    }, beforeMid);

    check(afterMid.leaverMesh === false, 'the departed middle\'s mesh is gone');
    check(afterMid.meshCount === afterMid.players && afterMid.players === beforeMid.players - 1,
        'the pitch holds exactly the surviving players', { meshes: afterMid.meshCount, players: afterMid.players });
    check(afterMid.wasFirstCircle, 'the first circle player stepped into the middle');
    check(afterMid.isLeaver === false && afterMid.stillInCircle === false,
        'the middle seat is filled by a survivor, not by a ghost');
    check(afterMid.identityKept, 'the promoted player kept their own kit colour — not the leaver\'s', afterMid.identityKept);
    check(afterMid.shirtIsMiddleKit, 'the promoted player\'s shirt turned magenta (the middle kit)');
    check(afterMid.overlayShown === false, 'the rondo is still running (5 → 4 players)');

    // --- one more leaves: below the minimum, so the rondo ends -------------
    const beforeEnd = await read(page, departScript, { leaverKind: 'circle' });
    await sleep(900);
    const ended = await read(page, (b) => {
        const data = window.__GAP.rondo.data;
        const meshes = window.__GAP.rondo.meshes;
        return {
            phase: data.phase,
            meshCount: Object.keys(meshes).length,
            players: data.players.length,
            leaverMesh: !!meshes[b.leaverId],
            overlayShown: !!(document.getElementById('rondo-over') && !document.getElementById('rondo-over').hidden),
            standingsRows: document.querySelectorAll('.rondo-standing-row').length,
        };
    }, beforeEnd);

    check(ended.phase === 'over', 'dropping below 4 players ends the rondo');
    check(ended.overlayShown && ended.standingsRows === ended.players,
        'the full-time card lists exactly the survivors', ended);
    check(ended.leaverMesh === false && ended.meshCount === ended.players,
        'no ghost is left standing behind the full-time card', { meshes: ended.meshCount, players: ended.players });

    await page.close();
}

/* ---------------------------------------------------------------- 3. confirm */

async function readPrompt(page) {
    return read(page, () => {
        const over = document.getElementById('confirm-over');
        return {
            open: window.__GAP.confirm.open,
            visible: !!over && !over.hidden,
            title: over ? document.getElementById('confirm-title').textContent : '',
            ok: over ? document.getElementById('btn-confirm-ok').textContent : '',
            cancel: over ? document.getElementById('btn-confirm-cancel').textContent : '',
        };
    });
}

async function testConfirmations(browser) {
    console.log('\n3. Confirm sheet — restart, quit, leave');
    const page = await freshPage(browser);

    // A match with a score worth losing. Start it the way a player does, so the
    // menu screen is really off the stack (nothing may sit on top of the board).
    await click(page, '#btn-start');
    await sleep(700);
    await read(page, () => {
        window.__GAP.state.humanScore = 3;
        window.__GAP.state.cpuScore = 2;
    });
    check((await read(page, () => window.__GAP.state.phase)) !== 'idle', 'a match is running to lose');
    check(await read(page, () => document.getElementById('screen-menu').hidden) === true,
        'starting a match takes the menu off the board');

    // (a) RESTART from the pause card.
    await click(page, '#btn-restart');
    await sleep(250);
    let p = await readPrompt(page);
    check(p.open && p.visible, 'pressing RESTART opens the confirm sheet');
    check(/Restart the match\?/.test(p.title), 'the sheet asks the right question', p.title);
    check(p.ok === 'RESTART' && p.cancel === 'CANCEL', 'the sheet offers RESTART / CANCEL', p);

    // Escape cancels — and must not restart anything.
    await page.keyboard.press('Escape');
    await sleep(250);
    let state = await read(page, () => ({
        open: window.__GAP.confirm.open,
        visible: !document.getElementById('confirm-over').hidden,
        human: window.__GAP.state.humanScore,
        cpu: window.__GAP.state.cpuScore,
    }));
    check(!state.open && !state.visible, 'Escape closes the sheet without answering');
    check(state.human === 3 && state.cpu === 2, 'the match survived the cancelled restart', state);

    // (b) The CANCEL button, reached through the keyboard shortcut.
    await page.keyboard.press('r');
    await sleep(250);
    check(await read(page, () => window.__GAP.confirm.open), 'the R shortcut asks before restarting');
    await click(page, '#btn-confirm-cancel');
    await sleep(250);
    state = await read(page, () => ({ open: window.__GAP.confirm.open, human: window.__GAP.state.humanScore }));
    check(!state.open && state.human === 3, 'CANCEL leaves the match exactly as it was', state);

    // (c) Confirming really restarts: the score resets.
    await page.keyboard.press('r');
    await sleep(250);
    await click(page, '#btn-confirm-ok');
    await sleep(500);
    state = await read(page, () => ({
        open: window.__GAP.confirm.open,
        human: window.__GAP.state.humanScore,
        cpu: window.__GAP.state.cpuScore,
    }));
    check(!state.open && state.human === 0 && state.cpu === 0, 'confirming RESTART starts a fresh match', state);

    // (d) The pause sheet's own rows ask too.
    await click(page, '#btn-menu-open');
    await sleep(250);
    await click(page, '#btn-menu-restart');
    await sleep(250);
    p = await readPrompt(page);
    check(p.open && /Restart the match\?/.test(p.title), 'the menu sheet\'s RESTART row asks as well', p);
    await click(page, '#btn-confirm-cancel');
    await sleep(250);

    await click(page, '#btn-menu-open');
    await sleep(250);
    await click(page, '#btn-menu-quit');
    await sleep(250);
    p = await readPrompt(page);
    check(p.open && /Quit to the menu\?/.test(p.title), 'the menu sheet\'s QUIT row asks too', p);
    await click(page, '#btn-confirm-cancel');
    await sleep(250);
    state = await read(page, () => ({
        phase: window.__GAP.state.phase,
        menuHidden: document.getElementById('screen-menu').hidden,
    }));
    check(state.phase !== 'idle' && state.menuHidden === true, 'cancelling QUIT keeps the player in the match', state);

    // Quitting for real lands on the menu.
    await click(page, '#btn-menu-open');
    await sleep(250);
    await click(page, '#btn-menu-quit');
    await sleep(250);
    await click(page, '#btn-confirm-ok');
    await sleep(500);
    state = await read(page, () => ({
        phase: window.__GAP.state.phase,
        menuHidden: document.getElementById('screen-menu').hidden,
    }));
    check(state.phase === 'idle' && state.menuHidden === false, 'confirming QUIT lands on the main menu', state);

    // (e) Leaving a rondo in progress.
    await startRondo(page, 3);
    const inGame = await read(page, () => ({
        phase: window.__GAP.state.phase,
        players: window.__GAP.rondo.data.players.length,
    }));
    check(inGame.phase === 'rondo' && inGame.players === 4, 'a 4-player rondo is live', inGame);

    await click(page, '#btn-rondo-quit');
    await sleep(250);
    p = await readPrompt(page);
    check(p.open && /Leave the rondo\?/.test(p.title), 'LEAVE asks first', p);
    await click(page, '#btn-confirm-cancel');
    await sleep(250);
    state = await read(page, () => ({
        open: window.__GAP.confirm.open,
        phase: window.__GAP.state.phase,
        live: !!window.__GAP.rondo.data,
    }));
    check(!state.open && state.phase === 'rondo' && state.live,
        'cancelling LEAVE keeps the player in the rondo', state);

    await click(page, '#btn-rondo-quit');
    await sleep(250);
    await click(page, '#btn-confirm-ok');
    await sleep(600);
    state = await read(page, () => ({
        open: window.__GAP.confirm.open,
        phase: window.__GAP.state.phase,
        live: !!window.__GAP.rondo.data,
        menuShown: !document.getElementById('screen-menu').hidden,
    }));
    check(!state.open && state.phase === 'idle' && !state.live, 'confirming LEAVE tears the rondo down', state);
    check(state.menuShown, 'leaving a rondo puts the player back on the menu');

    // (f) The pause card, reached from a live rondo, must not strand the room.
    await startRondo(page, 3);
    await page.keyboard.press('Escape');
    await sleep(350);
    check(await read(page, () => !document.getElementById('screen-pause').hidden), 'Escape pauses a live rondo');

    await click(page, '#btn-restart');
    await sleep(250);
    p = await readPrompt(page);
    check(p.open && /Restart the match\?/.test(p.title), 'RESTART from a rondo asks first', p);
    await click(page, '#btn-confirm-cancel');
    await sleep(250);
    state = await read(page, () => ({ phase: window.__GAP.state.phase, live: !!window.__GAP.rondo.data }));
    check(state.phase === 'rondo' && state.live, 'cancelling leaves the rondo running', state);

    // Confirming the restart rebuilds the circle: same seats, fresh scores.
    await read(page, () => {
        const d = window.__GAP.rondo.data;
        d.scores[d.players[0].id].passes = 7;
    });
    await click(page, '#btn-restart');
    await sleep(250);
    await click(page, '#btn-confirm-ok');
    await sleep(1000);
    state = await read(page, () => {
        const d = window.__GAP.rondo.data;
        return {
            phase: window.__GAP.state.phase,
            players: d ? d.players.length : 0,
            topPasses: d ? Math.max(...Object.values(d.scores).map(s => s.passes)) : -1,
            meshes: window.__GAP.rondo.meshes ? Object.keys(window.__GAP.rondo.meshes).length : 0,
        };
    });
    check(state.phase === 'rondo' && state.players === 4 && state.meshes === 4,
        'confirming RESTART rebuilds the rondo with the same seats', state);
    check(state.topPasses === 0, 'the restarted rondo starts from zero — nothing carried over', state.topPasses);

    // Quitting from the pause card tears the room down properly.
    await page.keyboard.press('Escape');
    await sleep(350);
    await click(page, '#btn-quit');
    await sleep(250);
    p = await readPrompt(page);
    check(p.open && /Quit to the menu\?/.test(p.title), 'QUIT from a rondo asks first', p);
    await click(page, '#btn-confirm-ok');
    await sleep(700);
    state = await read(page, () => ({
        phase: window.__GAP.state.phase,
        live: !!window.__GAP.rondo.data,
        hudHidden: document.getElementById('hud-rondo').hidden,
        menuShown: !document.getElementById('screen-menu').hidden,
    }));
    check(!state.live && state.phase === 'idle' && state.hudHidden, 'quitting a rondo stands the circle down', state);
    check(state.menuShown, 'quitting a rondo puts the player back on the menu');

    await page.close();
}

async function run() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        await testLimits(browser);
        await testDeparture(browser);
        await testConfirmations(browser);
    } finally {
        await browser.close();
    }
    if (failures) {
        console.log(`\n${failures} check(s) failed.`);
        process.exit(1);
    }
    console.log('\nAll roster-limit, departure and confirm checks passed.');
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});


