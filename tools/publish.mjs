#!/usr/bin/env node
/* ============================================================================
   tools/publish.mjs — flatten Astro's build output to the repo root.
   ----------------------------------------------------------------------------
   Astro emits a self-contained site into `outDir` (./out). Cloudflare Pages
   serves whatever directory you hand it, so the only question is which one is
   the source of truth.

   We keep the deployable artifact entirely inside `out/` (that is what
   `wrangler pages deploy out` uploads, and it is self-contained once `_headers`
   is copied in). Mirroring the same files to the repo root as well means the
   site still works when served from the repository itself — `python3 -m
   http.server` at the root, an editor preview, or any tool that expects a flat
   static directory — without a second build.

   Root entries are overwritten from `out/`, never merged, so a STALE file from
   a previous build can never survive into the published site.
   ========================================================================= */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');

/* Files/dirs the build owns at the repo root. Anything not on this list is
   left strictly alone — source files, design docs, .git, node_modules. */
const MANAGED = [
    'index.html',
    '404.html',
    'favicon.svg',
    'assets',
    '_headers',
    '_redirects'
];

function fail(message) {
    console.error('publish: ' + message);
    process.exit(1);
}

if (!existsSync(OUT)) {
    fail('no ./out directory — run `npm run build:only` (or `astro build`) first.');
}

if (!statSync(OUT).isDirectory()) {
    fail('./out exists but is not a directory.');
}

if (!existsSync(join(OUT, 'index.html'))) {
    fail('./out/index.html is missing — the Astro build did not emit a page.');
}

/* --- 1. make the out/ artifact self-contained -------------------------------
   `_headers` is authored by hand at the repo root (Cloudflare reads it from the
   upload root), so copy it in rather than letting Astro's publicDir own it. */
const headers = join(ROOT, '_headers');
if (existsSync(headers)) {
    cpSync(headers, join(OUT, '_headers'));
}

/* --- 2. mirror out/ -> repo root ------------------------------------------- */
const copied = [];
let skipped = 0;

for (const name of MANAGED) {
    const src = join(OUT, name);

    if (!existsSync(src)) {
        skipped++;
        continue;
    }

    const dest = join(ROOT, name);

    /* Remove first: a directory copy over an existing directory merges, which
       would let an asset from an earlier build linger forever. */
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });

    const stat = statSync(dest);
    copied.push(name + (stat.isDirectory() ? '/' : ''));
}

if (!copied.length) {
    fail('nothing was published — ./out did not contain any of: ' + MANAGED.join(', '));
}

/* --- 3. report ------------------------------------------------------------- */
function walk(dir, depth = 0, limit = 2) {
    if (depth > limit) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            return [relative(OUT, full) + '/', ...walk(full, depth + 1, limit)];
        }
        return [relative(OUT, full)];
    });
}

console.log('publish: out/ -> repo root');
console.log('  out/ contents: ' + walk(OUT).join(', '));
console.log('  mirrored:      ' + copied.join(', '));
if (skipped) console.log('  not emitted:   ' + skipped + ' optional entr' + (skipped === 1 ? 'y' : 'ies'));
console.log('');
console.log('  Deploy the ./out directory:');
console.log('    npx wrangler pages deploy out --project-name guess-and-pass');
console.log('');
