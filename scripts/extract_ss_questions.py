#!/usr/bin/env python3
"""사회 문제 PDF + ss_answers.json → data/questions/social_studies.json"""

import re
import json
import unicodedata
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
PDF_DIR = BASE_DIR / "data/pdfs/social_studies"
ANSWERS_PATH = BASE_DIR / "data/ss_answers.json"
OUTPUT_PATH = BASE_DIR / "data/questions/social_studies.json"

COL_DIV = 370
HEADER_Y = 65
FOOTER_Y = 965

Q_X_MAX_LEFT = 70
Q_X_MAX_RIGHT = 380

CIRCLE_MAP = {"①": 1, "②": 2, "③": 3, "④": 4}
CIRCLES = list(CIRCLE_MAP.keys())


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
        for circle in CIRCLES:
            block = block.replace(circle, f"\n{circle}")
        all_lines.extend(block.split("\n"))

    result = _extract_option_texts(all_lines)

    if any(r for r in result):
        return result

    return ["", "", "", ""]


def extract_questions_from_pdf(doc) -> dict[int, dict]:
    """PDF에서 문제별 {q_num: {text, option_blocks}} 반환 (라인 레벨)"""

    # 라인 레벨로 col_lines 구성: (page_idx, col) → [(x0, y0, y1, text), ...]
    col_lines: dict[tuple, list] = {}

    for page_idx, page in enumerate(doc):
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                x0 = line["bbox"][0]
                y0 = line["bbox"][1]
                y1 = line["bbox"][3]
                if y0 < HEADER_Y or y0 > FOOTER_Y:
                    continue
                col = "left" if x0 < COL_DIV else "right"
                line_text = "".join(span["text"] for span in line["spans"])
                if not line_text.strip():
                    continue
                key = (page_idx, col)
                col_lines.setdefault(key, []).append((x0, y0, y1, line_text))

    for key in col_lines:
        col_lines[key].sort(key=lambda b: b[1])  # y0 기준 정렬

    # 문제 위치 탐지 (라인 레벨)
    q_pos: dict[int, tuple] = {}
    for (page_idx, col), lines in col_lines.items():
        x_max = Q_X_MAX_LEFT if col == "left" else Q_X_MAX_RIGHT
        for x0, y0, y1, text in lines:
            m = re.match(r"^(\d+)\.\s", text.strip())
            if m and x0 <= x_max:
                q_num = int(m.group(1))
                if 1 <= q_num <= 25 and q_num not in q_pos:
                    q_pos[q_num] = (page_idx, col, y0)

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

        key = (page_idx, col)
        region_lines = [
            text
            for x0, y0, y1, text in col_lines.get(key, [])
            if y_start - 2 <= y0 < y_end - 2
        ]

        q_text_raw = region_lines[0].strip() if region_lines else ""
        q_text = re.sub(r"^\d+\.\s*", "", q_text_raw)

        rest = region_lines[1:]
        first_circle_idx = next(
            (i for i, b in enumerate(rest) if any(c in b for c in CIRCLES)), None
        )

        if first_circle_idx is not None:
            passage_lines = rest[:first_circle_idx]
            option_lines = rest[first_circle_idx:]
        else:
            passage_lines = rest
            option_lines = []

        if passage_lines:
            passage = " ".join(b.strip() for b in passage_lines if b.strip())
            q_text = q_text + "\n" + passage if q_text else passage

        questions[q_num] = {
            "text": q_text.strip(),
            "option_blocks": option_lines,
        }

    return questions


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

            entry = {
                "id": f"ss_{exam_key}_{q_num:02d}",
                "year": int(year),
                "session": int(session),
                "number": q_num,
                "text": q_text,
                "image": f"images/social_studies/{exam_key}_{q_num:02d}.png",
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
