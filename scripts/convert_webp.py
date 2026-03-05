#!/usr/bin/env python3
"""PNG → WebP 일괄 변환 스크립트 (최대 800px, 품질 85)"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow가 필요합니다: pip install Pillow")

SRC_DIR  = Path(__file__).parent.parent / 'quiz-app' / 'public' / 'data' / 'images'
MAX_WIDTH = 800
QUALITY   = 85

def convert(png_path: Path) -> None:
    webp_path = png_path.with_suffix('.webp')
    if webp_path.exists():
        return  # 이미 변환됨

    with Image.open(png_path) as img:
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            new_h = int(img.height * ratio)
            img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
        img.save(webp_path, 'WEBP', quality=QUALITY, method=6)
    print(f'  {png_path.name} → {webp_path.name}')

def main() -> None:
    pngs = sorted(SRC_DIR.glob('*.png'))
    if not pngs:
        sys.exit(f'PNG 파일을 찾을 수 없습니다: {SRC_DIR}')

    print(f'변환 대상: {len(pngs)}개')
    for p in pngs:
        convert(p)
    print('완료')

if __name__ == '__main__':
    main()
