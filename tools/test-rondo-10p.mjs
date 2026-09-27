import puppeteer from 'puppeteer';

async function run() {
    console.log('Launching Puppeteer browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Rondo') || text.includes('error') || text.includes('Error')) {
            console.log('[BROWSER]', text);
        }
    });

    await page.goto('http://localhost:4321', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    // Open Rondo lobby
    await page.click('#btn-rondo');
    await page.waitForSelector('#pane-rondo-create', { visible: true });

    // Fill name
    await page.type('#rondo-name', 'Captain');

    // Create room
    await page.click('#btn-rondo-create');
    await page.waitForSelector('#rondo-create-active:not([hidden])');

    // Step CPU count up to 9 (1 human + 9 CPUs = 10 players)
    for (let i = 0; i < 15; i++) {
        await page.click('#btn-rondo-cpu-plus');
    }

    const cpuCount = await page.$eval('#rondo-cpu-count', el => el.textContent.trim());
    const totalCountText = await page.$eval('#rondo-player-count', el => el.textContent.trim());
    console.log(`CPU Count: ${cpuCount}, Total Display: ${totalCountText}`);

    if (cpuCount !== '9' || totalCountText !== '(10/10)') {
        throw new Error(`Expected 9 CPUs and (10/10) total players, got cpuCount=${cpuCount} total=${totalCountText}`);
    }
    console.log('✓ Successfully verified max 10 players (1 human + 9 CPUs)!');

    // Verify stepper cannot exceed 10 players
    await page.click('#btn-rondo-cpu-plus');
    const cpuCountAfter = await page.$eval('#rondo-cpu-count', el => el.textContent.trim());
    if (cpuCountAfter !== '9') {
        throw new Error(`Stepper exceeded 9 CPUs (expected 9, got ${cpuCountAfter})`);
    }
    console.log('✓ Successfully verified stepper is capped at max 10 players!');

    // Start Rondo match with 10 players
    await page.click('#btn-rondo-start');
    await page.waitForSelector('#hud-rondo:not([hidden])');
    await new Promise(r => setTimeout(r, 1500));

    const hudStatus = await page.evaluate(() => {
        const turnText = document.getElementById('rondo-turn')?.textContent;
        const ballName = document.getElementById('rondo-ball-name')?.textContent;
        const midName = document.getElementById('rondo-middle-name')?.textContent;
        const clock = document.getElementById('rondo-clock')?.textContent;
        return { turnText, ballName, midName, clock };
    });
    console.log('Rondo active HUD state:', hudStatus);

    await page.screenshot({ path: '/home/fiftytwo/.gemini/antigravity-ide/brain/8facce43-1ccd-4300-914c-1cfaf4adc171/scratch/rondo_10_players_started.png' });
    console.log('Saved screenshot of 10 player rondo to scratch/rondo_10_players_started.png');

    await browser.close();
    console.log('All tests passed successfully!');
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
