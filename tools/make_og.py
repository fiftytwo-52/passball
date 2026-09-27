from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630

os.makedirs("public/og", exist_ok=True)

bold_font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
reg_font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

if not os.path.exists(bold_font_path):
    bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not os.path.exists(reg_font_path):
    reg_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

font_title = ImageFont.truetype(bold_font_path, 100)
font_sub = ImageFont.truetype(reg_font_path, 42)
font_badge = ImageFont.truetype(bold_font_path, 22)

def og_base():
    """Dark pitch-green gradient background with subtle pitch lines."""
    base = Image.new("RGB", (W, H), (14, 46, 26))
    d = ImageDraw.Draw(base)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)],
               fill=(int(14 + 18*t), int(46 + 32*t), int(26 + 18*t)))
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # Pitch border
    od.rounded_rectangle([(30, 30), (W - 30, H - 30)], radius=24, outline=(255, 255, 255, 22), width=3)
    # Center line and center circle
    od.line([(W//2, 30), (W//2, H - 30)], fill=(255, 255, 255, 22), width=3)
    od.ellipse([(W//2 - 140, H//2 - 140), (W//2 + 140, H//2 + 140)], outline=(255, 255, 255, 22), width=3)
    return Image.alpha_composite(base.convert("RGBA"), overlay)

def place(base, sticker_path, box, rotate_deg=0):
    """Paste a transparent sticker scaled into box (x, y, w, h)."""
    if not os.path.exists(sticker_path):
        print(f"Warning: {sticker_path} not found")
        return
    st = Image.open(sticker_path).convert("RGBA")
    st.thumbnail((box[2], box[3]), Image.LANCZOS)
    if rotate_deg != 0:
        st = st.rotate(rotate_deg, expand=True, resample=Image.BICUBIC)
    base.alpha_composite(st, (box[0], box[1]))

def draw_badge(img, text, x=100, y=100):
    d = ImageDraw.Draw(img)
    pad_x, pad_y = 16, 7
    bbox = d.textbbox((0, 0), text, font=font_badge)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.rounded_rectangle([(x, y), (x + tw + pad_x*2, y + th + pad_y*2)], radius=14, fill=(80, 227, 194, 45), outline=(80, 227, 194, 180), width=2)
    d.text((x + pad_x, y + pad_y - 2), text, font=font_badge, fill=(80, 227, 194, 255))

def save(base, name):
    base.convert("RGB").save(f"public/og/{name}", quality=92)
    print("wrote public/og/" + name)

# --- Home ---
img = og_base()
draw_badge(img, "REAL-TIME 6-A-SIDE", 100, 100)
d = ImageDraw.Draw(img)
d.text((100, 160), "takTIK", font=font_title, fill="white")
d.text((100, 290), "Simultaneous planning football.\nEvery race won by geometry.", font=font_sub, fill=(220, 238, 226), spacing=12)
place(img, "public/stickers/sticker-ball.png", (720, 90, 380, 380), rotate_deg=6)
place(img, "public/stickers/sticker-vs.png", (610, 310, 220, 220), rotate_deg=-8)
save(img, "og-home.jpg")

# --- About ---
img = og_base()
draw_badge(img, "PHILOSOPHY & DESIGN", 100, 100)
d = ImageDraw.Draw(img)
d.text((100, 160), "ABOUT", font=font_title, fill="white")
d.text((100, 290), "Football for people who\nlove the planning.", font=font_sub, fill=(220, 238, 226), spacing=12)
place(img, "public/stickers/sticker-trophy.png", (740, 90, 360, 360), rotate_deg=8)
place(img, "public/stickers/sticker-boots.png", (610, 320, 220, 220), rotate_deg=-5)
save(img, "og-about.jpg")

# --- Tutorial ---
img = og_base()
draw_badge(img, "HOW TO PLAY", 100, 100)
d = ImageDraw.Draw(img)
d.text((100, 160), "TUTORIAL", font=font_title, fill="white")
d.text((100, 290), "Draw passes. Time runs.\nBeat the keeper.", font=font_sub, fill=(220, 238, 226), spacing=12)
place(img, "public/stickers/sticker-whistle.png", (740, 90, 360, 360), rotate_deg=-8)
place(img, "public/stickers/sticker-goal.png", (600, 310, 240, 200), rotate_deg=4)
save(img, "og-tutorial.jpg")

# --- Privacy ---
img = og_base()
draw_badge(img, "ZERO TRACKING", 100, 100)
d = ImageDraw.Draw(img)
d.text((100, 160), "PRIVACY", font=font_title, fill="white")
d.text((100, 290), "No accounts. No cookies.\nPeer-to-peer multiplayer.", font=font_sub, fill=(220, 238, 226), spacing=12)
place(img, "public/stickers/sticker-shield.png", (720, 110, 380, 380), rotate_deg=-6)
save(img, "og-privacy.jpg")

# --- Contact ---
img = og_base()
draw_badge(img, "SAY HELLO", 100, 100)
d = ImageDraw.Draw(img)
d.text((100, 160), "CONTACT", font=font_title, fill="white")
d.text((100, 290), "Found a bug? Have an idea?\nWe read everything.", font=font_sub, fill=(220, 238, 226), spacing=12)
place(img, "public/stickers/sticker-mail.png", (720, 110, 380, 380), rotate_deg=6)
save(img, "og-contact.jpg")
