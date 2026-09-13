#!/usr/bin/env node
/* ============================================================================
   tools/verify-4.mjs — run the canonical §4 property tests headlessly.
   ----------------------------------------------------------------------------
   The game ships as an Astro page, so the algorithm lives inside a browser
   bundle. Rather than duplicate it (which would let the two copies drift), this
   slices the *pure* region out of src/scripts/game-source.js — everything from
   the §0 tunables down to just before the §4 match state — and evaluates it in
   Node.

   The slice is deliberately bounded by stable structural markers that tests
   already depend on (`const T = {` and the `§ 4. MATCH STATE` banner), so the
   verification cannot silently test a different set of constants than the ones
   the page runs with.

   Usage:
     npm run verify
     node tools/verify-4.mjs
   Exits non-zero if any property fails.
   ========================================================================= */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = join(ROOT, 'src', 'scripts', 'game-source.js');

const source = readFileSync(ENGINE, 'utf8');
const lines = source.split('\n');

/** Index of the first line matching `re`, or -1. */
function findLine(re, from = 0) {
    return lines.findIndex((line, i) => i >= from && re.test(line));
}

const start = findLine(/^\s*const T = \{$/);
if (start < 0) {
    console.error('verify-4: could not locate the §0 tunables block in ' + ENGINE);
    process.exit(2);
}

/* The §4 banner is a three-line block comment; find its title line, then walk
   back to the opening `/*` so the slice never ends mid-comment. */
let end = findLine(/§ 4\. MATCH STATE/, start);
if (end < 0) {
    console.error('verify-4: could not locate the §4 banner that bounds the pure region');
    process.exit(2);
}
while (end > start && !/^\s*\/\*/.test(lines[end])) end--;
if (end <= start) {
    console.error('verify-4: could not find the start of the §4 banner comment');
    process.exit(2);
}

/* Everything from §0 through the end of §3 is pure: tunables, geometry
   helpers, the seeded RNG, the resolver, and the verification suite itself. */
const extracted = lines.slice(start, end).join('\n');

/* §0 defines the canonical constants and the §4 corpus is frozen; anything the
   pure region expects to exist but does not define is a genuine failure, not
   something to paper over — so the sandbox is bare. */
const sandbox = {
    console,
    Math,
    Date,
    JSON,
    Number,
    Object,
    Array,
    String,
    Boolean,
    isNaN,
    parseFloat,
    parseInt
};
sandbox.globalThis = sandbox;

const harness = [
    '"use strict";',
    extracted,
    'const __result = runVerification(false);',
    'globalThis.__gapVerify = __result;'
].join('\n');

const context = vm.createContext(sandbox);

try {
    new vm.Script(harness, { filename: 'gap-4.js' }).runInContext(context);
} catch (err) {
    console.error('verify-4: the extracted §4 region failed to evaluate.');
    console.error(err && err.stack ? err.stack : err);
    process.exit(2);
}

const result = sandbox.__gapVerify;
if (!result || !Array.isArray(result.results)) {
    console.error('verify-4: runVerification() did not return a result set.');
    process.exit(2);
}

const pad = (s, n) => String(s) + ' '.repeat(Math.max(1, n - String(s).length));

console.log('');
console.log('  Guess & Pass — §4 resolution algorithm');
console.log('  ' + '─'.repeat(72));
for (const r of result.results) {
    const mark = r.pass ? 'PASS' : 'FAIL';
    console.log('  ' + pad(mark, 7) + pad(r.name, 52) + (r.pass ? '' : JSON.stringify(r.detail)));
}
console.log('  ' + '─'.repeat(72));
console.log('  ' + pad(result.allPass ? 'ALL PASS' : 'FAILURES', 7) + result.results.length + ' properties');
console.log('');

process.exit(result.allPass ? 0 : 1);
