#!/usr/bin/env python3
"""도덕 정답표 PDF → data/eth_answers.json"""

import re
import json
import unicodedata
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
PDF_PATH = BASE_DIR / "data/pdfs/ethics/도덕 정답표.pdf"
OUTPUT_PATH = BASE_DIR / "data/eth_answers.json"

CIRCLE_MAP = {"①": 1, "②": 2, "③": 3, "④": 4}
CUSTOM_CIRCLE_MAP = {"\u085a": 1, "\u085b": 2, "\u085c": 3, "\u085d": 4}

HARDCODED_ANSWERS: dict[str, list[int]] = {
    "2020_1": [2, 1, 2, 3, 3, 4, 3, 4, 1, 4, 1, 1, 3, 4, 2, 1, 3, 4, 3, 1, 4, 4, 2, 2, 2],
}


def _decode_custom_digit(c: str) -> int:
    return ord(c) - 0x11


def _decode_custom_qnum(text: str) -> int | None:
    if len(text) == 1:
        n = _decode_custom_digit(text)
        return n if 1 <= n <= 9 else None
    if len(text) == 2:
        tens = _decode_custom_digit(text[0])
        ones = _decode_custom_digit(text[1])
        n = tens * 10 + ones
        return n if 1 <= n <= 25 else None
    return None


def uses_custom_font(page) -> bool:
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span["font"] == "*#":
                    return True
    return False


def parse_page_key(text: str) -> str | None:
    m = re.search(r"(\d{4})년도 제([12])회", unicodedata.normalize("NFC", text))
    return f"{m.group(1)}_{m.group(2)}" if m else None


def parse_answers_standard(text: str) -> list:
    answers: dict[int, int] = {}
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"^\d+$", line):
            q_num = int(line)
            if 1 <= q_num <= 25 and i + 1 < len(lines):
                nums = [CIRCLE_MAP[c] for c in lines[i + 1] if c in CIRCLE_MAP]
                if nums:
                    answers[q_num] = nums[0] if len(nums) == 1 else nums
                i += 2
                continue
        i += 1
    return [answers.get(n) for n in range(1, 26)]


def parse_answers_custom(page) -> list:
    entries: list[tuple[str, int]] = []
    for block in page.get_text("rawdict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span.get("font") != "*#":
                    continue
                size = span["size"]
                text = "".join(ch["c"] for ch in span.get("chars", []))
                if not text:
                    continue
                if 15 <= size <= 18:
                    q_num = _decode_custom_qnum(text)
                    if q_num is not None:
                        entries.append(("q", q_num))
                elif 19 <= size <= 22:
                    ans = CUSTOM_CIRCLE_MAP.get(text)
                    if ans is not None:
                        entries.append(("a", ans))

    answers: dict[int, int] = {}
    i = 0
    while i < len(entries):
        if entries[i][0] == "q" and i + 1 < len(entries) and entries[i + 1][0] == "a":
            answers[entries[i][1]] = entries[i + 1][1]
            i += 2
        else:
            i += 1
    return [answers.get(n) for n in range(1, 26)]


def main():
    pdf_path = None
    target_nfc = unicodedata.normalize("NFC", PDF_PATH.name)
    for f in PDF_PATH.parent.iterdir():
        if unicodedata.normalize("NFC", f.name) == target_nfc:
            pdf_path = f
            break

    if pdf_path is None:
        print(f"오류: 정답표 PDF를 찾을 수 없음 ({PDF_PATH})")
        return {}

    doc = fitz.open(str(pdf_path))
    result: dict[str, list] = {}

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = unicodedata.normalize("NFC", page.get_text())
        key = parse_page_key(text)
        if not key:
            print(f"  경고: {page_idx + 1}페이지 시험 정보 없음")
            continue

        if key in HARDCODED_ANSWERS:
            answers_list = HARDCODED_ANSWERS[key]
        elif uses_custom_font(page):
            answers_list = parse_answers_custom(page)
        else:
            answers_list = parse_answers_standard(text)

        none_count = sum(1 for a in answers_list if a is None)
        if none_count > 0:
            print(f"  경고: {key} - {none_count}개 정답 누락")

        result[key] = answers_list
        print(f"  {key}: {25 - none_count}/25개 정답 추출")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n총 {len(result)}개 시험 정답 저장 → {OUTPUT_PATH}")
    return result


if __name__ == "__main__":
    main()
