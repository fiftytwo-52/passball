#!/usr/bin/env node
/* ============================================================================
   tools/verify-4.mjs — run the real-time rulebook property tests headlessly.
   ----------------------------------------------------------------------------
   The rulebook now lives in its own module, src/scripts/rules.js, which is
   pure by construction: no three.js, no DOM, no `window`. So this harness does
   not slice anything out of a browser bundle any more — it simply imports the
   exact file the page imports.

   That removes the failure mode the old socket-wrench slicing had: there is no
   way for the tests to be measuring a second copy of the algorithm, because
   there is no second copy. The page calls resolvePassRace()/shotOutcome() from
   this module; so does this script.

   Usage:
     npm run verify
     node tools/verify-4.mjs
   Exits non-zero if any property fails.
   ========================================================================= */

import { RULES, runVerification } from '../src/scripts/rules.js';

const pad = (s, n) => String(s) + ' '.repeat(Math.max(1, n - String(s).length));

console.log('');
console.log('  Guess & Pass — real-time rulebook (§2, §5, §7, §10)');
console.log('  ' + '─'.repeat(72));

const result = runVerification(false);

if (!result || !Array.isArray(result.results)) {
    console.error('verify-4: runVerification() did not return a result set.');
    process.exit(2);
}

for (const r of result.results) {
    const mark = r.pass ? 'PASS' : 'FAIL';
    console.log('  ' + pad(mark, 7) + pad(r.name, 58) + (r.pass ? '' : JSON.stringify(r.detail)));
}

console.log('  ' + '─'.repeat(72));
console.log('  ' + pad(result.allPass ? 'ALL PASS' : 'FAILURES', 7) + result.results.length + ' properties');
console.log(
    '  ' +
    pad('', 7) +
    'ball ' +
    RULES.BALL_SPEED +
    ' > player ' +
    RULES.PLAYER_SPEED +
    ' · shot ' +
    RULES.SHOT_SPEED +
    ' · halves ' +
    RULES.HALVES +
    ' × ' +
    RULES.HALF_LENGTH +
    's'
);
console.log('');

process.exit(result.allPass ? 0 : 1);
