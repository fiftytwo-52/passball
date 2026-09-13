import { defineConfig } from 'astro/config';

/**
 * Guess & Pass — Astro configuration.
 *
 * `output: 'static'` emits a plain HTML/CSS/JS bundle (no SSR runtime), which is
 * exactly what Cloudflare Pages wants for a direct upload.
 *
 * `outDir` is deliberately the Vite-era `out/` folder rather than Astro's
 * default `dist/`, and `cleanOutDir` is on so every build starts from an empty
 * directory. `tools/publish.mjs` then lifts `out/*` to the repo root after the
 * build, which keeps the published URLs (`/index.html`, `/assets/...`) flat and
 * independent of Astro's internal build layout.
 */
export default defineConfig({
    site: 'https://guess-and-pass.pages.dev',
    output: 'static',
    outDir: './out',
    build: {
        assets: 'assets',
        inlineStylesheets: 'never'
    },
    vite: {
        build: {
            target: 'es2020'
        }
    }
});
