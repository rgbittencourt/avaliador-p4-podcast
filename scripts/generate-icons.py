from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ASSETS = PUBLIC / "assets"
SOURCE = ASSETS / "app-icon-master.png"

ASSETS.mkdir(parents=True, exist_ok=True)
source = Image.open(SOURCE).convert("RGBA")
bbox = source.getchannel("A").getbbox()
if bbox:
    source = source.crop(bbox)


def transparent_icon(size: int, padding: float = 0.08) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    available = int(size * (1 - 2 * padding))
    icon = source.copy()
    icon.thumbnail((available, available), Image.Resampling.LANCZOS)
    x = (size - icon.width) // 2
    y = (size - icon.height) // 2
    canvas.alpha_composite(icon, (x, y))
    return canvas


def maskable_icon(size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), "#155B78")
    icon = transparent_icon(size, 0.18)
    canvas.alpha_composite(icon)
    return canvas


for size in (16, 32, 48, 180, 192, 512):
    transparent_icon(size).save(ASSETS / f"icon-{size}.png", optimize=True)

maskable_icon(192).save(ASSETS / "icon-maskable-192.png", optimize=True)
maskable_icon(512).save(ASSETS / "icon-maskable-512.png", optimize=True)
transparent_icon(180).save(ASSETS / "apple-touch-icon.png", optimize=True)
transparent_icon(64).save(
    PUBLIC / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
)

# Imagem de compartilhamento para redes sociais e mensageiros.
card = Image.new("RGB", (1200, 630), "#F4F8FA")
draw = ImageDraw.Draw(card)
draw.rounded_rectangle((54, 54, 1146, 576), radius=48, fill="#155B78")
mark = transparent_icon(360, 0.06)
card.paste(mark, (95, 135), mark)
font_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
font_regular_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
bold = ImageFont.truetype(font_bold_path, 68)
regular = ImageFont.truetype(font_regular_path, 34)
small = ImageFont.truetype(font_regular_path, 25)
draw.text((485, 165), "Avaliador P4", font=bold, fill="#FFFFFF")
draw.text((485, 250), "Podcast · TEDPRO", font=bold, fill="#37B9D6")
draw.text((488, 360), "Avaliação, feedback e relatórios", font=regular, fill="#FFFFFF")
draw.text((488, 410), "em um só lugar.", font=regular, fill="#FFFFFF")
draw.text((488, 500), "IFSC · Educação Profissional e Tecnológica", font=small, fill="#D8EEF5")
card.save(ASSETS / "social-preview.png", optimize=True)

print("Ícones e imagem social gerados em", ASSETS)
