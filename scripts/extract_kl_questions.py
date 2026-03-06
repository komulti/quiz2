#!/usr/bin/env python3
"""국어 문제 PDF + kl_answers.json → data/questions/korean_language.json"""

import re
import json
import unicodedata
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
PDF_DIR = BASE_DIR / "data/pdfs/korean_language"
ANSWERS_PATH = BASE_DIR / "data/kl_answers.json"
OUTPUT_PATH = BASE_DIR / "data/questions/korean_language.json"

COL_DIV = 365       # 좌/우 열 구분 x 기준
HEADER_Y = 60
FOOTER_Y = 965

# 문제 번호 블록의 최대 x0 (지문 내 번호 목록 필터링용)
Q_X_MAX_LEFT = 70       # 좌열 문제 시작 x0 ≈ 57 (지문 내 항목은 x0 ≈ 74+)
Q_X_MAX_RIGHT = 377     # 우열 문제 시작 x0 ≈ 374 (지문 내 항목은 x0 ≈ 381+)

CIRCLE_MAP = {"①": 1, "②": 2, "③": 3, "④": 4}
CIRCLES = list(CIRCLE_MAP.keys())
GROUP_PATTERN = re.compile(r'\[(\d+)[~～](\d+)\]')


def parse_exam_key(filename: str) -> str | None:
    nfc = unicodedata.normalize("NFC", filename)
    m = re.search(r"(\d{4})년도 제([12])회", nfc)
    return f"{m.group(1)}_{m.group(2)}" if m else None


def get_pdf_files() -> list[Path]:
    result = []
    for f in sorted(PDF_DIR.iterdir()):
        if f.suffix == ".pdf" and parse_exam_key(f.name):
            result.append(f)
    return sorted(result, key=lambda f: parse_exam_key(f.name) or "")


def _extract_option_texts(lines: list[str]) -> list[str]:
    """줄 목록에서 ①②③④ 기반 선택지 추출 (4개 반환)"""
    options = {1: [], 2: [], 3: [], 4: []}
    current = None

    for line in lines:
        line = line.strip()
        if not line:
            continue
        found = False
        for circle, num in CIRCLE_MAP.items():
            if circle in line:
                current = num
                rest = line.replace(circle, "", 1).strip()
                if rest:
                    options[num].append(rest)
                found = True
                break
        if not found and current is not None:
            options[current].append(line)

    return [" ".join(options[i]).strip() for i in range(1, 5)]


def parse_options(text_blocks: list[str]) -> list[str]:
    """여러 텍스트 블록에서 선택지 파싱"""
    all_lines = []

    for block in text_blocks:
        # 같은 블록 내 여러 선택지가 공백으로 붙어있는 경우 분리
        # 예: "①앉다[안따] ②밟다[밥:따] ③훑다[훋따] ④없다[업:따]"
        # 예: "①재산을 늘이다.\n②바지를 다리다."
        for circle in CIRCLES:
            block = block.replace(circle, f"\n{circle}")
        all_lines.extend(block.split("\n"))

    result = _extract_option_texts(all_lines)

    if any(r for r in result):
        return result

    return ["", "", "", ""]


def extract_questions_from_pdf(doc) -> dict[int, dict]:
    """PDF에서 문제별 {q_num: {text, option_blocks}} 반환"""

    col_blocks: dict[tuple, list] = {}

    for page_idx, page in enumerate(doc):
        for b in page.get_text("blocks"):
            x0, y0, x1, y1, text, *_ = b
            if y0 < HEADER_Y or y0 > FOOTER_Y:
                continue
            col = "left" if x0 < COL_DIV else "right"
            key = (page_idx, col)
            col_blocks.setdefault(key, []).append((x0, y0, y1, text))

    for key in col_blocks:
        col_blocks[key].sort(key=lambda b: b[1])  # y0 기준 정렬

    q_pos: dict[int, tuple] = {}
    for (page_idx, col), blocks in col_blocks.items():
        x_max = Q_X_MAX_LEFT if col == "left" else Q_X_MAX_RIGHT
        for x0, y0, y1, text in blocks:
            m = re.match(r"^(\d+)\.\s", text.strip())
            if m and x0 <= x_max:
                q_num = int(m.group(1))
                if 1 <= q_num <= 25 and q_num not in q_pos:
                    q_pos[q_num] = (page_idx, col, y0)

    # (page_idx, col) → 그룹 헤더 y0 목록 (같은 열의 그룹 헤더를 경계로 사용)
    group_header_ys: dict[tuple, list[float]] = {}
    for page_idx_g, page in enumerate(doc):
        for b in page.get_text("blocks"):
            x0, y0, x1, y1, text, *_ = b
            if y0 < HEADER_Y or y0 > FOOTER_Y:
                continue
            if GROUP_PATTERN.search(text):
                col_g = "left" if x0 < COL_DIV else "right"
                group_header_ys.setdefault((page_idx_g, col_g), []).append(y0)

    questions: dict[int, dict] = {}

    for q_num in range(1, 26):
        if q_num not in q_pos:
            continue

        page_idx, col, y_start = q_pos[q_num]

        y_end = FOOTER_Y
        for nq in range(q_num + 1, 26):
            if nq in q_pos:
                np, nc, ny = q_pos[nq]
                if np == page_idx and nc == col:
                    y_end = ny
                    break

        # 같은 열에 그룹 헤더가 y_start 뒤에 있으면 그것도 경계로 사용
        for hy in sorted(group_header_ys.get((page_idx, col), [])):
            if hy > y_start + 10:
                y_end = min(y_end, hy)
                break

        key = (page_idx, col)
        region_texts = [
            text
            for x0, y0, y1, text in col_blocks.get(key, [])
            if y_start - 2 <= y0 < y_end - 2
        ]

        q_text_raw = region_texts[0].strip() if region_texts else ""
        q_text = re.sub(r"^\d+\.\s*", "", q_text_raw)

        rest = region_texts[1:]
        first_circle_idx = next(
            (i for i, b in enumerate(rest) if any(c in b for c in CIRCLES)), None
        )

        if first_circle_idx is not None:
            passage_blocks = rest[:first_circle_idx]
            option_blocks = rest[first_circle_idx:]
        else:
            passage_blocks = rest
            option_blocks = []

        if passage_blocks:
            passage = " ".join(b.strip() for b in passage_blocks if b.strip())
            q_text = q_text + "\n" + passage if q_text else passage

        questions[q_num] = {
            "text": q_text.strip(),
            "option_blocks": option_blocks,
        }

    return questions


def find_groups(doc) -> dict[int, str]:
    """문제번호 → 지문 이미지 파일명 (exam_key 제외) 매핑 반환"""
    q_to_passage: dict[int, str] = {}
    for page_idx, page in enumerate(doc):
        for block in page.get_text("blocks"):
            x0, y0, x1, y1, text, *_ = block
            if y0 < HEADER_Y or y0 > FOOTER_Y:
                continue
            m = GROUP_PATTERN.search(text)
            if m:
                start_q = int(m.group(1))
                end_q = int(m.group(2))
                passage_file = f"pass_{start_q}_{end_q}"
                for q in range(start_q, end_q + 1):
                    if q not in q_to_passage:
                        q_to_passage[q] = passage_file
    return q_to_passage


def main():
    with open(ANSWERS_PATH, "r", encoding="utf-8") as f:
        answers: dict = json.load(f)

    pdf_files = get_pdf_files()
    all_questions = []

    for pdf_path in pdf_files:
        exam_key = parse_exam_key(pdf_path.name)
        if not exam_key:
            continue

        doc = fitz.open(str(pdf_path))
        year, session = exam_key.split("_")
        q_data = extract_questions_from_pdf(doc)
        exam_answers = answers.get(exam_key, [None] * 25)
        q_to_passage = find_groups(doc)

        for q_num in range(1, 26):
            ans_val = exam_answers[q_num - 1] if q_num <= len(exam_answers) else None
            is_multiple = isinstance(ans_val, list)

            if q_num in q_data:
                info = q_data[q_num]
                options_text = parse_options(info["option_blocks"])
                q_text = info["text"]
            else:
                options_text = ["", "", "", ""]
                q_text = f"[추출 실패] {exam_key} {q_num}번"

            passage_file = q_to_passage.get(q_num)
            passage_image = (
                f"images/korean_language/{exam_key}_{passage_file}.png"
                if passage_file else None
            )

            entry = {
                "id": f"kl_{exam_key}_{q_num:02d}",
                "year": int(year),
                "session": int(session),
                "number": q_num,
                "text": q_text,
                "image": f"images/korean_language/{exam_key}_{q_num:02d}.png",
                "passageImage": passage_image,
                "options": [
                    {"number": i + 1, "text": options_text[i]} for i in range(4)
                ],
                "answer": ans_val,
                "multipleAnswers": is_multiple,
            }
            all_questions.append(entry)

        print(f"  {exam_key}: 25개 문제 처리")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    print(f"\n총 {len(all_questions)}/400개 문제 저장 → {OUTPUT_PATH}")
    return all_questions


if __name__ == "__main__":
    main()
