# Passball Sticker Pack — Placement Guide

8 die-cut style stickers with **transparent backgrounds** (no rectangles).
Drop them onto pages as-is — no editing needed.

## What's in the pack

| File | Sticker | Best for |
|---|---|---|
| `sticker-ball.png` | Soccer ball with motion swooshes | OG images, About hero, Tutorial |
| `sticker-trophy.png` | Gold trophy with sparkles | OG images, About ("three ways to play") |
| `sticker-shield.png` | Blue shield with padlock | Privacy page hero |
| `sticker-mail.png` | Envelope with chat bubble | Contact page hero |
| `sticker-whistle.png` | Referee whistle | Tutorial / rules sections, About |
| `sticker-goal.png` | Ball hitting the goal net | OG images, About, Tutorial shooting section |
| `sticker-boots.png` | Pair of boots kicking a ball | About, Tutorial movement section |
| `sticker-vs.png` | Red/yellow "VS" burst badge | OG images, PvP / match-mode sections |

All are PNG with alpha transparency, longest side ~1300–1900px — plenty sharp
for web use. Serve scaled-down via `width`/`height` attributes (see below).

---

## Step 1 — Put the files in the project

Copy all 8 PNGs into the site's public folder:

```
passball/
└── public/
    └── stickers/
        ├── sticker-ball.png
        ├── sticker-trophy.png
        ├── sticker-shield.png
        ├── sticker-mail.png
        ├── sticker-whistle.png
        ├── sticker-goal.png
        ├── sticker-boots.png
        └── sticker-vs.png
```

In Astro, anything under `public/` is served as-is, so the URL for a
sticker is simply `/stickers/sticker-ball.png`.

> Keep the originals in this zip as your masters. If you ever need a
> different size, resize from these — never from a screenshot of the page.

---

## Step 2 — Add stickers to pages

The info pages (`about`, `contact`, `privacy`, `tutorial`) all share the same
hero structure:

```html
<header class="info-hero">
    <span class="info-eyebrow">…</span>
    <h1>…</h1>
    <p class="lead">…</p>
</header>
```

### Option A — Floating sticker in the hero (recommended)

Add one `<img>` inside `.info-hero` and absolutely position it. Add this CSS
once (e.g. in `src/styles/info.css`):

```css
.info-hero { position: relative; }

.hero-sticker {
    position: absolute;
    width: 120px;
    height: auto;
    pointer-events: none;          /* never blocks clicks */
    user-select: none;
    filter: drop-shadow(0 10px 24px rgba(0, 0, 0, .25));
}

@media (max-width: 640px) {
    .hero-sticker { width: 84px; } /* smaller on phones */
}
```

Then per page:

**About** (`src/pages/about.astro`) — ball, top-right of the hero:

```html
<header class="info-hero">
    <img class="hero-sticker" style="top: 8px; right: 4%; transform: rotate(8deg);"
         src="/stickers/sticker-ball.png" alt="" width="240" height="240" />
    <span class="info-eyebrow">About the game</span>
    <h1>…</h1>
    …
</header>
```

**Privacy** (`src/pages/privacy.astro`) — shield:

```html
<img class="hero-sticker" style="top: 8px; right: 4%; transform: rotate(-6deg);"
     src="/stickers/sticker-shield.png" alt="" width="240" height="240" />
```

**Contact** (`src/pages/contact.astro`) — mail:

```html
<img class="hero-sticker" style="top: 8px; right: 4%; transform: rotate(6deg);"
     src="/stickers/sticker-mail.png" alt="" width="240" height="240" />
```

**Tutorial** (`src/pages/tutorial.astro`) — whistle:

```html
<img class="hero-sticker" style="top: 8px; right: 4%; transform: rotate(-8deg);"
     src="/stickers/sticker-whistle.png" alt="" width="240" height="240" />
```

> `alt=""` is intentional: these are decorative. Screen readers skip them and
> the heading text still carries the meaning. Only give a sticker a real `alt`
> if it conveys information the text doesn't.

### Option B — Stickers beside section headings

For the About page's "Three ways to play" or Tutorial steps, put a small
sticker inline before a heading:

```html
<h2>
    <img src="/stickers/sticker-trophy.png" alt="" width="44" height="44"
         style="vertical-align: -10px; margin-right: 10px;" />
    Three ways to play
</h2>
```

Suggested pairings:

| Page / section | Sticker |
|---|---|
| About — "Three ways to play" | `sticker-trophy.png` |
| About — "What makes it different" | `sticker-boots.png` |
| Tutorial — shooting / penalties step | `sticker-goal.png` |
| Tutorial — movement / passing step | `sticker-boots.png` |
| Tutorial — rules / fouls step | `sticker-whistle.png` |
| Any PvP / versus section | `sticker-vs.png` |

### Sizing tips

- Hero sticker: `width: 120px` desktop / `84px` mobile (CSS above handles it).
- Inline with headings: `40–48px`.
- Always set `width` **and** `height` attributes — it reserves space before the
  image loads and prevents layout shift.
- Add `loading="lazy"` to any sticker below the fold.

---

## Step 3 — OG images (link previews)

OG images must be flat files — you can't layer HTML. The workflow:

1. Render a 1200×630 background (your brand color, a pitch screenshot, …).
2. Composite stickers on top with a script.
3. Save to `public/og/`, reference with `og:image` meta tags.

### Example script

Save as `tools/make_og.py` in the project (needs Pillow: `pip install pillow`):

```python
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

def og_base():
    """Dark pitch-green gradient background."""
    base = Image.new("RGB", (W, H), (18, 60, 38))
    d = ImageDraw.Draw(base)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)],
               fill=(int(18 + 14*t), int(60 + 26*t), int(38 + 16*t))))
    return base.convert("RGBA")

def place(base, sticker_path, box):
    """Paste a transparent sticker scaled into `box` (x, y, w, h)."""
    st = Image.open(sticker_path).convert("RGBA")
    st.thumbnail((box[2], box[3]), Image.LANCZOS)
    base.alpha_composite(st, (box[0], box[1]))

def save(base, name):
    base.convert("RGB").save(f"public/og/{name}", quality=90)
    print("wrote public/og/" + name)

# --- Home / default share image ---
img = og_base()
place(img, "public/stickers/sticker-ball.png",   (840, 120, 320, 320))
place(img, "public/stickers/sticker-vs.png",     (120, 380, 200, 200))
d = ImageDraw.Draw(img)
d.text((120, 120), "GUESS & PASS", font=ImageFont.truetype("arial.ttf", 110), fill="white")
d.text((120, 250), "Real-time 6-a-side football.\nYou call the plays.", font=ImageFont.truetype("arial.ttf", 48), fill=(220, 235, 225))
save(img, "og-home.jpg")

# --- About ---
img = og_base()
place(img, "public/stickers/sticker-trophy.png", (860, 140, 280, 280))
place(img, "public/stickers/sticker-boots.png",  (120, 400, 180, 180))
d = ImageDraw.Draw(img)
d.text((120, 120), "ABOUT", font=ImageFont.truetype("arial.ttf", 110), fill="white")
d.text((120, 250), "Football for people who\nlove the planning.", font=ImageFont.truetype("arial.ttf", 48), fill=(220, 235, 225))
save(img, "og-about.jpg")

# --- Tutorial ---
img = og_base()
place(img, "public/stickers/sticker-whistle.png", (880, 150, 260, 260))
place(img, "public/stickers/sticker-goal.png",    (120, 400, 200, 160))
d = ImageDraw.Draw(img)
d.text((120, 120), "HOW TO PLAY", font=ImageFont.truetype("arial.ttf", 100), fill="white")
d.text((120, 250), "Draw passes. Time runs.\nBeat the keeper.", font=ImageFont.truetype("arial.ttf", 48), fill=(220, 235, 225))
save(img, "og-tutorial.jpg")
```

Run it: `python3 tools/make_og.py`

> Use any TTF you have for the headline font — the script uses `arial.ttf` as
> a placeholder. Your site's display face (Anton) works if installed locally.

### Add the meta tags

In each page's `<head>` (use your real domain):

```html
<!-- index.astro -->
<meta property="og:image" content="https://example.com/og/og-home.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- about.astro -->
<meta property="og:image" content="https://example.com/og/og-about.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- tutorial.astro -->
<meta property="og:image" content="https://example.com/og/og-tutorial.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

Then validate with a card validator (X/Twitter card validator, Facebook
Sharing Debugger) — they re-scrape the URL and show you the preview.

### Sticker pairings for OG images

| OG image | Stickers |
|---|---|
| Home | `sticker-ball.png` (large, right) + `sticker-vs.png` (small, corner) |
| About | `sticker-trophy.png` + `sticker-boots.png` |
| Tutorial | `sticker-whistle.png` + `sticker-goal.png` |
| Privacy | `sticker-shield.png` |
| Contact | `sticker-mail.png` |

Keep text in the left 2/3 and stickers in the right 1/3 — chat apps crop
previews on narrow screens, and the right side survives best.

---

## Quick checklist

- [ ] PNGs copied to `public/stickers/`
- [ ] `.hero-sticker` CSS added once
- [ ] One hero sticker per info page (About / Privacy / Contact / Tutorial)
- [ ] `width` + `height` on every `<img>`, `alt=""` for decorative ones
- [ ] OG images rendered to `public/og/` and `og:image` tags added
- [ ] Link preview tested in a card validator
