#!/usr/bin/env node
/* ============================================================================
   tools/publish.mjs — validate the deployable artifact.
   ----------------------------------------------------------------------------
   `npm run build` is `astro build && node tools/publish.mjs`.

   Astro builds the whole site into `out/`, and that directory is the single
   source of truth: it is exactly what `wrangler pages deploy out` uploads, and
   it is self-contained because `_headers` lives in Astro's publicDir
   (`public/_headers`) and is copied in verbatim by the build.

   Nothing is mirrored to the repo root. A second copy of the same page is one
   more thing to keep in sync, and the old mirror left a stale `index.html` and
   `assets/` sitting at the root after every deploy.

   So this step is small on purpose: it proves the artifact is complete and
   prints what is about to ship. It exits non-zero when the build looks broken,
   so it — and `npm run verify` — can gate a deploy.
   ========================================================================= */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');

function fail(message) {
    console.error('publish: ' + message);
    process.exit(1);
}

if (!existsSync(OUT) || !statSync(OUT).isDirectory()) {
    fail('no ./out directory — run `npm run build:only` (or `astro build`) first.');
}

if (!existsSync(join(OUT, 'index.html'))) {
    fail('./out/index.html is missing — the Astro build did not emit a page.');
}

if (!existsSync(join(OUT, '_headers'))) {
    fail('./out/_headers is missing — is public/_headers still in the repo?');
}

/* --- report ---------------------------------------------------------------- */
function walk(dir, depth = 0, limit = 3) {
    if (depth > limit) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            return [relative(OUT, full) + '/', ...walk(full, depth + 1, limit)];
        }
        return [relative(OUT, full)];
    });
}

console.log('publish: ./out is ready to upload');
console.log('  ' + walk(OUT).join('\n  '));
console.log('');
console.log('  Deploy it with:');
console.log('    npm run deploy');
console.log('    # ≡ npm run build && npx wrangler pages deploy out --project-name passball');
console.log('');
