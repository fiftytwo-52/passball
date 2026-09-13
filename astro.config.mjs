import { defineConfig } from 'astro/config';

/**
 * Passball — Astro configuration.
 *
 * `output: 'static'` emits a plain HTML/CSS/JS bundle (no SSR runtime), which is
 * exactly what Cloudflare Pages wants for a direct upload.
 *
 * `outDir` is deliberately `out/` rather than Astro's default `dist/`, so the
 * directory named in wrangler.toml, in the deploy script and in the docs is the
 * one the build actually writes. Astro cleans it on every build, which means the
 * artifact is always a fresh, complete site — there is no second copy of it
 * anywhere to fall out of date.
 *
 * `public/_headers` is the source of the Cloudflare response headers; the build
 * copies it into the output root, where Pages expects to find it.
 */
export default defineConfig({
    site: 'https://passball.pages.dev',
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
