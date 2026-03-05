#!/usr/bin/env python3
"""문제 PDF + answers.json → data/questions/korean_history.json"""

import re
import json
import unicodedata
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
PDF_DIR = BASE_DIR / "data/pdfs"
ANSWERS_PATH = BASE_DIR / "data/answers.json"
OUTPUT_PATH = BASE_DIR / "data/questions/korean_history.json"

COL_DIV = 215       # 좌/우 열 구분 x 기준
HEADER_Y = 60
FOOTER_Y = 965

CIRCLE_MAP = {"①": 1, "②": 2, "③": 3, "④": 4}
CIRCLES = list(CIRCLE_MAP.keys())


def parse_exam_key(filename: str) -> str | None:
    nfc = unicodedata.normalize("NFC", filename)
    m = re.search(r"(\d{4})년도 제([12])회", nfc)
    return f"{m.group(1)}_{m.group(2)}" if m else None


def get_pdf_files() -> list[Path]:
    result = []
    for f in sorted(PDF_DIR.glob("*.pdf")):
        if parse_exam_key(f.name):
            result.append(f)
    return sorted(result, key=lambda f: parse_exam_key(f.name) or "")


# ── 선택지 파싱 ────────────────────────────────────────────────────────────────

def _extract_option_texts(lines: list[str]) -> list[str]:
    """줄 목록에서 ①②③④ 기반 선택지 추출 (4개 반환, 실패 시 빈 문자열)"""
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

    result = [" ".join(options[i]).strip() for i in range(1, 5)]
    return result


def parse_options(text_blocks: list[str]) -> list[str]:
    """여러 텍스트 블록에서 선택지 파싱"""
    all_lines = []
    pure_circles_block = None   # "①\n②\n③\n④" 형태 블록 인덱스
    pure_circles_texts = None   # 직후 텍스트 블록

    for i, block in enumerate(text_blocks):
        blines = [l.strip() for l in block.split("\n") if l.strip()]
        # 원문자만 있는 블록 감지
        if all(l in CIRCLES for l in blines) and len(blines) == 4:
            pure_circles_block = i
            # 직후에 4줄짜리 텍스트 블록이 있으면 결합
            for j in range(i + 1, len(text_blocks)):
                nlines = [l.strip() for l in text_blocks[j].split("\n") if l.strip()]
                if len(nlines) == 4:
                    pure_circles_texts = nlines
                    break
            break

    if pure_circles_block is not None and pure_circles_texts:
        return pure_circles_texts  # ① 첫줄, ② 둘줄 ... 순서

    # 일반 파싱: 모든 블록 통합
    for block in text_blocks:
        all_lines.extend(block.split("\n"))

    result = _extract_option_texts(all_lines)

    # 4개 중 하나라도 있으면 반환
    if any(r for r in result):
        return result

    return ["", "", "", ""]


# ── 문제 데이터 추출 ───────────────────────────────────────────────────────────

def extract_questions_from_pdf(doc) -> dict[int, dict]:
    """PDF 에서 문제별 {q_num: {text, option_blocks}} 반환"""

    # (page_idx, col, y0, y1, text) 블록 수집
    col_blocks: dict[tuple, list] = {}

    for page_idx, page in enumerate(doc):
        for b in page.get_text("blocks"):
            x0, y0, x1, y1, text, *_ = b
            if y0 < HEADER_Y or y0 > FOOTER_Y:
                continue
            col = "left" if x0 < COL_DIV else "right"
            key = (page_idx, col)
            col_blocks.setdefault(key, []).append((y0, y1, text))

    for key in col_blocks:
        col_blocks[key].sort()

    # 문제 번호 위치 찾기
    q_pos: dict[int, tuple] = {}  # {q_num: (page_idx, col, y0)}
    for (page_idx, col), blocks in col_blocks.items():
        for y0, y1, text in blocks:
            m = re.match(r"^(\d+)\.\s", text.strip())
            if m:
                q_num = int(m.group(1))
                if 1 <= q_num <= 25:
                    q_pos[q_num] = (page_idx, col, y0)

    # 각 문제의 y 범위 내 블록 수집
    questions: dict[int, dict] = {}

    for q_num in range(1, 26):
        if q_num not in q_pos:
            continue

        page_idx, col, y_start = q_pos[q_num]

        # 같은 열·페이지에서 다음 문제의 y
        y_end = FOOTER_Y
        for nq in range(q_num + 1, 26):
            if nq in q_pos:
                np, nc, ny = q_pos[nq]
                if np == page_idx and nc == col:
                    y_end = ny
                    break

        key = (page_idx, col)
        region_texts = [
            text
            for y0, y1, text in col_blocks.get(key, [])
            if y_start - 2 <= y0 < y_end - 2
        ]

        # 첫 번째 블록 = 문제 번호 줄
        q_text_raw = region_texts[0].strip() if region_texts else ""
        q_text = re.sub(r"^\d+\.\s*", "", q_text_raw)

        # 나머지 블록: 첫 번째 원문자 등장 이전 = 지문, 이후 = 선택지
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

        # 지문을 q_text 에 추가
        if passage_blocks:
            passage = " ".join(b.strip() for b in passage_blocks if b.strip())
            q_text = q_text + "\n" + passage if q_text else passage

        questions[q_num] = {
            "text": q_text.strip(),
            "option_blocks": option_blocks,
        }

    return questions


# ── 메인 ──────────────────────────────────────────────────────────────────────

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
                "id": f"{exam_key}_{q_num:02d}",
                "year": int(year),
                "session": int(session),
                "number": q_num,
                "text": q_text,
                "image": f"images/{exam_key}_{q_num:02d}.png",
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
