#!/usr/bin/env python3
"""문제 PDF → 각 문제 영역 PNG 이미지 저장 (data/images/)"""

import re
import unicodedata
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
PDF_DIR = BASE_DIR / "data/pdfs"
IMAGE_DIR = BASE_DIR / "data/images"

DPI = 300
SCALE = DPI / 72          # 4.1667
COL_DIV = 215             # 좌/우 열 구분 x 기준 (좌 x0≈57, 우 x0≈374)

# PDF 좌표계 기준 열 경계 (여백 포함)
LEFT_RECT = (45, 0, 370, 1032)
RIGHT_RECT = (365, 0, 685, 1032)

MARGIN_TOP = 8            # 문제 시작 y 위 여백 (PDF pt)
FOOTER_Y = 960            # 푸터 시작 y (제외)
HEADER_Y = 60             # 헤더 끝 y (제외)


def parse_exam_key(filename: str) -> str | None:
    nfc = unicodedata.normalize("NFC", filename)
    match = re.search(r"(\d{4})년도 제([12])회", nfc)
    if match:
        return f"{match.group(1)}_{match.group(2)}"
    return None


def get_pdf_files() -> list[Path]:
    """macOS NFD 파일명 대응: *.pdf 전체 탐색 후 패턴 필터"""
    result = []
    for f in sorted(PDF_DIR.glob("*.pdf")):
        if parse_exam_key(f.name):
            result.append(f)
    return sorted(result, key=lambda f: parse_exam_key(f.name) or "")


def find_question_positions(doc):
    """문서 전체에서 문제 번호별 (page_idx, col, y0) 반환"""
    positions = {}  # {q_num: (page_idx, col, y0)}

    for page_idx, page in enumerate(doc):
        for block in page.get_text("blocks"):
            x0, y0, x1, y1, text, *_ = block
            if y0 < HEADER_Y or y0 > FOOTER_Y:
                continue
            m = re.match(r"^(\d+)\.\s", text.strip())
            if m:
                q_num = int(m.group(1))
                if 1 <= q_num <= 25:
                    col = "left" if x0 < COL_DIV else "right"
                    positions[q_num] = (page_idx, col, y0)

    return positions


def get_col_max_y(page, col: str) -> float:
    """해당 열의 마지막 콘텐츠 블록 y1 반환"""
    x_min = LEFT_RECT[0] if col == "left" else RIGHT_RECT[0]
    x_max = LEFT_RECT[2] if col == "left" else RIGHT_RECT[2]
    max_y = HEADER_Y

    for block in page.get_text("blocks"):
        x0, y0, x1, y1, *_ = block
        if x0 >= x_min - 30 and x1 <= x_max + 30 and HEADER_Y < y0 < FOOTER_Y:
            if y1 > max_y:
                max_y = y1

    return min(max_y + 15, FOOTER_Y)


def crop_and_save(page, col: str, y_start: float, y_end: float, out_path: Path):
    """지정 영역을 300 DPI 로 렌더링하여 PNG 저장"""
    x0 = LEFT_RECT[0] if col == "left" else RIGHT_RECT[0]
    x1 = LEFT_RECT[2] if col == "left" else RIGHT_RECT[2]

    clip = fitz.Rect(
        x0,
        max(0.0, y_start - MARGIN_TOP),
        x1,
        min(page.rect.height, y_end),
    )
    pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), clip=clip)
    pix.save(str(out_path))


def process_pdf(pdf_path: Path, exam_key: str) -> int:
    doc = fitz.open(str(pdf_path))
    positions = find_question_positions(doc)

    saved = 0

    for page_idx, page in enumerate(doc):
        # 이 페이지에 있는 문제들
        page_qs = {n: info for n, info in positions.items() if info[0] == page_idx}

        for col in ("left", "right"):
            col_qs = sorted(
                [(n, info[2]) for n, info in page_qs.items() if info[1] == col],
                key=lambda x: x[1],
            )
            if not col_qs:
                continue

            col_end_y = get_col_max_y(page, col)

            for i, (q_num, y_start) in enumerate(col_qs):
                if i + 1 < len(col_qs):
                    y_end = col_qs[i + 1][1] - 4
                else:
                    y_end = col_end_y

                out_path = IMAGE_DIR / f"{exam_key}_{q_num:02d}.png"
                crop_and_save(page, col, y_start, y_end, out_path)
                saved += 1

    return saved


def main() -> int:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files = get_pdf_files()
    if not pdf_files:
        print("오류: PDF 파일을 찾을 수 없습니다.")
        return 0

    total = 0
    for pdf_path in pdf_files:
        exam_key = parse_exam_key(pdf_path.name)
        if not exam_key:
            print(f"  건너뜀: {pdf_path.name}")
            continue

        count = process_pdf(pdf_path, exam_key)
        status = "✓" if count == 25 else "⚠"
        print(f"  {status} {exam_key}: {count}개 이미지 저장")
        if count != 25:
            print(f"    경고: 예상 25개, 실제 {count}개")
        total += count

    print(f"\n총 {total}/400개 이미지 저장 → {IMAGE_DIR}")
    return total


if __name__ == "__main__":
    main()
