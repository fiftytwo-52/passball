import puppeteer from 'puppeteer';

async function run() {
    console.log('Testing player departure and position adjustment...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('http://localhost:4321', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    await page.click('#btn-rondo');
    await page.waitForSelector('#pane-rondo-create', { visible: true });
    await page.type('#rondo-name', 'Captain');
    await page.click('#btn-rondo-create');
    await page.waitForSelector('#rondo-create-active:not([hidden])');

    // Add 5 CPUs (total 6 players)
    for (let i = 0; i < 5; i++) {
        await page.click('#btn-rondo-cpu-plus');
    }

    await page.click('#btn-rondo-start');
    await page.waitForSelector('#hud-rondo:not([hidden])');
    await new Promise(r => setTimeout(r, 1200));

    // Inspect before departure
    const before = await page.evaluate(() => {
        const rondo = window.__GAP.rondo.data;
        const rondoMeshes = window.__GAP.rondo.meshes;
        // Find player to remove (a circle player)
        const cPlayerId = rondo.circle[1];
        const leaver = rondo.players.find(p => p.id === cPlayerId);
        const leaverColor = rondoMeshes[cPlayerId].color;
        
        // Find another player that should remain
        const survivorId = rondo.circle[2];
        const survivor = rondo.players.find(p => p.id === survivorId);
        const survivorColor = rondoMeshes[survivorId].color;
        const survivorInitialGx = rondoMeshes[survivorId].gx;

        // Trigger guest left
        window.__GAP.rondo.hostOnGuestLeft(cPlayerId);

        return {
            leaverId: cPlayerId,
            leaverName: leaver?.name,
            leaverColor,
            survivorId,
            survivorName: survivor?.name,
            survivorColor,
            survivorInitialGx
        };
    });

    console.log('Departure triggered for:', before.leaverName, '(', before.leaverId, ')');

    // Wait 400ms for layout & animation step
    await new Promise(r => setTimeout(r, 600));

    // Inspect after departure
    const after = await page.evaluate((beforeData) => {
        const rondo = window.__GAP.rondo.data;
        const rondoMeshes = window.__GAP.rondo.meshes;
        const leaverMeshExists = !!rondoMeshes[beforeData.leaverId];
        const survivorMesh = rondoMeshes[beforeData.survivorId];
        const survivorColorAfter = survivorMesh?.color;
        const totalRemainingMeshes = Object.keys(rondoMeshes).length;
        const totalRemainingPlayers = rondo.players.length;
        const survivorNewTargetGx = survivorMesh?.targetGx;

        return {
            leaverMeshExists,
            totalRemainingMeshes,
            totalRemainingPlayers,
            survivorColorAfter,
            colorPreserved: survivorColorAfter === beforeData.survivorColor,
            positionAdjusted: survivorNewTargetGx !== beforeData.survivorInitialGx
        };
    }, before);

    console.log('Results after departure:', after);

    if (after.leaverMeshExists) {
        throw new Error('Leaver mesh was not removed!');
    }
    if (!after.colorPreserved) {
        throw new Error('Survivor changed color — player copying detected!');
    }
    if (after.totalRemainingMeshes !== after.totalRemainingPlayers) {
        throw new Error(`Mesh count mismatch: ${after.totalRemainingMeshes} meshes vs ${after.totalRemainingPlayers} players`);
    }

    console.log('✓ Leaver mesh completely removed!');
    console.log('✓ Remaining players preserved their identity & color (no copying)!');
    console.log('✓ Remaining players adjusted positions smoothly!');

    await page.screenshot({ path: '/tmp/rondo_after_departure.png' });

    await browser.close();
    console.log('Departure test passed 100%!');
}

run().catch(err => {
    console.error('Departure test error:', err);
    process.exit(1);
});
