#!/usr/bin/env python3
"""영어 문제 PDF → 각 문제 영역 PNG + 공유 지문 PNG 저장 (data/images/english/)"""

import re
import unicodedata
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
PDF_DIR = BASE_DIR / "data/pdfs/english"
IMAGE_DIR = BASE_DIR / "data/images/english"

DPI = 300
SCALE = DPI / 72
COL_DIV = 365

LEFT_RECT = (45, 0, 370, 1032)
RIGHT_RECT = (365, 0, 685, 1032)

MARGIN_TOP = 8
FOOTER_Y = 960
HEADER_Y = 60

Q_X_MAX_LEFT = 70
Q_X_MAX_RIGHT = 377

GROUP_PATTERN = re.compile(r'\[(\d+)[~～](\d+)\]')


def parse_exam_key(filename: str) -> str | None:
    nfc = unicodedata.normalize("NFC", filename)
    match = re.search(r"(\d{4})년도 제([12])회", nfc)
    return f"{match.group(1)}_{match.group(2)}" if match else None


def get_pdf_files() -> list[Path]:
    result = []
    for f in sorted(PDF_DIR.iterdir()):
        if f.suffix == ".pdf" and parse_exam_key(f.name):
            result.append(f)
    return sorted(result, key=lambda f: parse_exam_key(f.name) or "")


def find_question_positions(doc) -> dict[int, tuple]:
    """문서 전체에서 문제 번호별 (page_idx, col, y0) 반환 - dict 레벨 라인 추출로 merged block 처리"""
    positions = {}
    for page_idx, page in enumerate(doc):
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                x0 = line["bbox"][0]
                y0 = line["bbox"][1]
                if y0 < HEADER_Y or y0 > FOOTER_Y:
                    continue
                col = "left" if x0 < COL_DIV else "right"
                x_max = Q_X_MAX_LEFT if col == "left" else Q_X_MAX_RIGHT
                if x0 > x_max:
                    continue
                line_text = "".join(span["text"] for span in line["spans"])
                m = re.match(r"^(\d+)\.([\s]|$)", line_text.lstrip())
                if m:
                    q_num = int(m.group(1))
                    if 1 <= q_num <= 25 and q_num not in positions:
                        positions[q_num] = (page_idx, col, y0)
    return positions


def find_group_headers(doc) -> dict[tuple, dict]:
    """
    [X~Y] 헤더 위치 찾기
    반환: {(start_q, end_q): {'page_idx', 'col', 'y0'}}
    """
    groups = {}
    for page_idx, page in enumerate(doc):
        for block in page.get_text("blocks"):
            x0, y0, x1, y1, text, *_ = block
            if y0 < HEADER_Y or y0 > FOOTER_Y:
                continue
            m = GROUP_PATTERN.search(text)
            if m:
                start_q = int(m.group(1))
                end_q = int(m.group(2))
                col = "left" if x0 < COL_DIV else "right"
                key = (start_q, end_q)
                if key not in groups:
                    groups[key] = {'page_idx': page_idx, 'col': col, 'y0': y0}
    return groups


def get_col_max_y(page, col: str) -> float:
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


def process_pdf(pdf_path: Path, exam_key: str) -> tuple[int, int]:
    doc = fitz.open(str(pdf_path))
    q_pos = find_question_positions(doc)
    group_headers = find_group_headers(doc)

    # 문제번호 → 그룹 매핑
    q_to_group: dict[int, tuple] = {}
    for (start_q, end_q), info in group_headers.items():
        for q in range(start_q, end_q + 1):
            q_to_group[q] = (start_q, end_q)

    # 지문 이미지 추출
    passage_saved = 0
    for (start_q, end_q), info in group_headers.items():
        page_idx = info['page_idx']
        col = info['col']
        header_y = info['y0']
        page = doc[page_idx]

        # 지문 끝 = 같은 열·페이지에서 첫 번째 그룹 문제의 y
        passage_end_y = get_col_max_y(page, col)
        for q in range(start_q, end_q + 1):
            if q in q_pos:
                pi, pc, py = q_pos[q]
                if pi == page_idx and pc == col:
                    passage_end_y = min(passage_end_y, py - 2)
                    break

        out_path = IMAGE_DIR / f"{exam_key}_pass_{start_q}_{end_q}.png"
        crop_and_save(page, col, header_y, passage_end_y, out_path)
        passage_saved += 1

    # (page_idx, col) → 해당 열에 있는 그룹 헤더 y0 목록
    group_header_ys: dict[tuple, list[float]] = {}
    for (start_q, end_q), info in group_headers.items():
        key = (info['page_idx'], info['col'])
        group_header_ys.setdefault(key, []).append(info['y0'])

    # 문제 이미지 추출
    saved = 0
    for page_idx, page in enumerate(doc):
        page_qs = {n: info for n, info in q_pos.items() if info[0] == page_idx}

        for col in ("left", "right"):
            col_qs = sorted(
                [(n, info[2]) for n, info in page_qs.items() if info[1] == col],
                key=lambda x: x[1],
            )
            if not col_qs:
                continue

            col_end_y = get_col_max_y(page, col)
            headers_in_col = sorted(group_header_ys.get((page_idx, col), []))

            for i, (q_num, y_start) in enumerate(col_qs):
                if i + 1 < len(col_qs):
                    y_end = col_qs[i + 1][1] - 4
                else:
                    y_end = col_end_y

                # 같은 열에 그룹 헤더가 y_start 뒤에 있으면 그것도 경계로 사용
                for hy in headers_in_col:
                    if hy > y_start + 10:
                        y_end = min(y_end, hy - 4)
                        break

                out_path = IMAGE_DIR / f"{exam_key}_{q_num:02d}.png"
                crop_and_save(page, col, y_start, y_end, out_path)
                saved += 1

    return saved, passage_saved


def main() -> int:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files = get_pdf_files()
    if not pdf_files:
        print("오류: PDF 파일을 찾을 수 없습니다.")
        return 0

    total_q = 0
    total_p = 0
    for pdf_path in pdf_files:
        exam_key = parse_exam_key(pdf_path.name)
        if not exam_key:
            continue
        q_count, p_count = process_pdf(pdf_path, exam_key)
        status = "✓" if q_count == 25 else "⚠"
        print(f"  {status} {exam_key}: 문제 {q_count}개, 지문 {p_count}개 저장")
        total_q += q_count
        total_p += p_count

    print(f"\n총 문제 {total_q}/400개, 지문 {total_p}개 이미지 저장 → {IMAGE_DIR}")
    return total_q


if __name__ == "__main__":
    main()
