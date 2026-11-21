"""Export approved artwork without cropping garments. Offline maintenance only.

Requires Pillow (python3 -m pip install Pillow). The deployed site needs no Python.
See README.md for example arguments. Source files are never modified.
"""
import argparse
from pathlib import Path
from PIL import Image, ImageOps

DESTINATION = Path(__file__).resolve().parents[1] / 'imagens' / 'vitrine'


def export(source: Path, name: str, dimensions: tuple[int, int]) -> None:
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        if image.width < dimensions[0] or image.height < dimensions[1]:
            raise ValueError(f'{name}: source must be at least {dimensions[0]} × {dimensions[1]} px')
        if abs(image.width / image.height - dimensions[0] / dimensions[1]) > 0.005:
            raise ValueError(f'{name}: source must have aspect ratio {dimensions[0]}:{dimensions[1]}; no automatic cropping is performed')
        for width in sorted({480, 960, *([1536] if name in ('hero', 'hero-menino') else []), dimensions[0]}):
            height = round(width * dimensions[1] / dimensions[0])
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            suffix = '' if width == dimensions[0] else f'-{width}'
            resized.save(DESTINATION / f'{name}{suffix}.webp', quality=88, method=6)
        if name == 'hero':
            image.resize(dimensions, Image.Resampling.LANCZOS).save(DESTINATION / 'hero.jpg', quality=90, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('batizado', 'primeira-comunhao', 'festas', 'times', 'hero', 'hero-mobile'):
        parser.add_argument(f'--{name}', type=Path, required=True)
    parser.add_argument('--hero-menino', type=Path)
    parser.add_argument('--hero-menino-mobile', type=Path)
    args = parser.parse_args()
    DESTINATION.mkdir(parents=True, exist_ok=True)
    for name, source in vars(args).items():
        if source is None:
            continue
        name = name.replace('_', '-')
        dimensions = (1980, 792) if name in ('hero', 'hero-menino') else (1448, 1086) if name in ('hero-mobile', 'hero-menino-mobile') else (1536, 1024)
        export(source, name, dimensions)
        print(f'{name}: {dimensions[0]} × {dimensions[1]} + 480/960 px')


if __name__ == '__main__':
    main()
