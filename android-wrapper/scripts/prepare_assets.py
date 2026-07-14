from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
WRAPPER = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "logo.png"
ASSETS = WRAPPER / "assets"
WWW = WRAPPER / "www"

LIGHT = (248, 250, 248, 255)
DARK = (7, 19, 13, 255)
GREEN = (23, 99, 63, 255)


def open_logo() -> Image.Image:
    image = Image.open(SOURCE).convert("RGBA")
    alpha_box = image.getbbox()
    if alpha_box:
        image = image.crop(alpha_box)
    return image


def contain(image: Image.Image, size: int) -> Image.Image:
    copy = image.copy()
    copy.thumbnail((size, size), Image.Resampling.LANCZOS)
    return copy


def centered_canvas(canvas_size: int, background, image: Image.Image, image_size: int) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), background)
    logo = contain(image, image_size)
    x = (canvas_size - logo.width) // 2
    y = (canvas_size - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    return canvas


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)


def main() -> None:
    logo = open_logo()
    ASSETS.mkdir(parents=True, exist_ok=True)
    WWW.mkdir(parents=True, exist_ok=True)

    save_png(centered_canvas(1024, LIGHT, logo, 760), ASSETS / "icon-only.png")
    save_png(centered_canvas(1024, (0, 0, 0, 0), logo, 690), ASSETS / "icon-foreground.png")
    save_png(Image.new("RGBA", (1024, 1024), GREEN), ASSETS / "icon-background.png")
    save_png(centered_canvas(2732, LIGHT, logo, 940), ASSETS / "splash.png")
    save_png(centered_canvas(2732, DARK, logo, 940), ASSETS / "splash-dark.png")
    save_png(centered_canvas(256, LIGHT, logo, 190), WWW / "app-logo.png")


if __name__ == "__main__":
    main()
