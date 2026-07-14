from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

GREEN = "#106B41"
GREEN_DARK = "#0B3F29"
GOLD = "#D3A43A"
WHITE = "#FFFFFF"
LIGHT = "#F8FAF8"


def font(size: int, bold: bool = True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def centered(draw: ImageDraw.ImageDraw, text: str, y: int, typeface, fill: str):
    box = draw.textbbox((0, 0), text, font=typeface)
    width = box[2] - box[0]
    draw.text(((1024 - width) / 2, y), text, font=typeface, fill=fill)


def make_icon(background: str, transparent: bool = False) -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0) if transparent else background)
    draw = ImageDraw.Draw(image)
    if transparent:
        draw.rounded_rectangle((162, 162, 862, 862), radius=190, fill=GREEN)
    else:
        draw.rounded_rectangle((96, 96, 928, 928), radius=224, fill=GREEN_DARK)
        draw.rounded_rectangle((126, 126, 898, 898), radius=205, fill=GREEN)
    draw.ellipse((412, 180, 612, 380), fill=GOLD)
    centered(draw, "MR", 380, font(240), WHITE)
    centered(draw, "RESULTS", 680, font(64), "#DDF1E6")
    return image


def save(image: Image.Image, name: str):
    image.save(ASSETS / name, "PNG", optimize=True)


def main():
    save(make_icon(LIGHT), "icon.png")
    save(make_icon(LIGHT, transparent=True), "adaptive-icon.png")

    splash = Image.new("RGBA", (1024, 1024), LIGHT)
    splash.alpha_composite(make_icon(LIGHT).resize((540, 540), Image.Resampling.LANCZOS), (242, 210))
    save(splash, "splash-icon.png")

    favicon = make_icon(LIGHT).resize((256, 256), Image.Resampling.LANCZOS)
    save(favicon, "favicon.png")

    notification = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    draw = ImageDraw.Draw(notification)
    draw.rounded_rectangle((10, 10, 86, 86), radius=20, fill=WHITE)
    box = draw.textbbox((0, 0), "MR", font=font(26))
    draw.text(((96 - (box[2] - box[0])) / 2, 31), "MR", font=font(26), fill="#000000")
    save(notification, "notification-icon.png")


if __name__ == "__main__":
    main()
