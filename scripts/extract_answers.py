#!/usr/bin/env python3
"""정답표 PDF에서 정답 데이터 추출 → data/answers.json"""

import re
import json
import unicodedata
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
PDF_PATH = BASE_DIR / "data/pdfs/한국사 정답표.pdf"
OUTPUT_PATH = BASE_DIR / "data/answers.json"

# ── 표준 폰트 정답 기호 ────────────────────────────────────────────────────────
CIRCLE_MAP = {"①": 1, "②": 2, "③": 3, "④": 4}

# ── 커스텀 폰트(*#) 정답 기호 → 페이지 4+ ─────────────────────────────────────
# 실제 렌더링으로 확인: \u085a=①, \u085b=②, \u085c=③, \u085d=④
CUSTOM_CIRCLE_MAP = {"\u085a": 1, "\u085b": 2, "\u085c": 3, "\u085d": 4}

# ── 벡터 경로(drawings)로만 구성된 페이지 → 직접 확인 후 하드코딩 ────────────────
# 2020_1: 텍스트 추출 불가 (내용이 벡터 paths). 렌더링 이미지로 직접 확인.
HARDCODED_ANSWERS: dict[str, list[int]] = {
    "2020_1": [3, 4, 1, 2, 2, 3, 1, 2, 3, 1, 3, 3, 1, 1, 1, 3, 2, 2, 4, 2, 4, 3, 4, 1, 4],
}


def _decode_custom_digit(c: str) -> int:
    """커스텀 폰트(*# size17) 문자 → 숫자 (0x11 오프셋)"""
    return ord(c) - 0x11


def _decode_custom_qnum(text: str) -> int | None:
    """커스텀 폰트 질문번호 텍스트 → 정수"""
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


# ── 표준 폰트 파싱 ─────────────────────────────────────────────────────────────

def parse_page_key(text: str) -> str | None:
    m = re.search(r"(\d{4})년도 제([12])회", unicodedata.normalize("NFC", text))
    return f"{m.group(1)}_{m.group(2)}" if m else None


def parse_answers_standard(text: str) -> list:
    """표준 폰트 페이지: ①②③④ 텍스트에서 파싱"""
    answers: dict[int, int | list] = {}
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"^\d+$", line):
            q_num = int(line)
            if 1 <= q_num <= 25 and i + 1 < len(lines):
                ans_text = lines[i + 1]
                nums = [CIRCLE_MAP[c] for c in ans_text if c in CIRCLE_MAP]
                if nums:
                    answers[q_num] = nums[0] if len(nums) == 1 else nums
                i += 2
                continue
        i += 1

    return [answers.get(n) for n in range(1, 26)]


# ── 커스텀 폰트 파싱 ───────────────────────────────────────────────────────────

def parse_answers_custom(page) -> list:
    """커스텀 폰트(*#) 페이지: rawdict에서 직접 디코딩"""
    entries: list[tuple[str, int]] = []  # [('q', num) | ('a', val), ...]

    d = page.get_text("rawdict")
    for block in d["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span.get("font") != "*#":
                    continue
                size = span["size"]
                # rawdict span은 chars 리스트로 문자 보유
                text = "".join(ch["c"] for ch in span.get("chars", []))
                if not text:
                    continue

                if 15 <= size <= 18:  # 질문번호 (size≈17)
                    q_num = _decode_custom_qnum(text)
                    if q_num is not None:
                        entries.append(("q", q_num))

                elif 19 <= size <= 22:  # 정답 기호 (size≈20)
                    ans = CUSTOM_CIRCLE_MAP.get(text)
                    if ans is not None:
                        entries.append(("a", ans))

    # q 바로 뒤 a가 해당 문항의 정답
    answers: dict[int, int] = {}
    i = 0
    while i < len(entries):
        if entries[i][0] == "q" and i + 1 < len(entries) and entries[i + 1][0] == "a":
            answers[entries[i][1]] = entries[i + 1][1]
            i += 2
        else:
            i += 1

    return [answers.get(n) for n in range(1, 26)]


# ── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    # macOS NFD 파일명 대응: *.pdf 순회 후 NFC 이름 매칭
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
        text = page.get_text()
        text_nfc = unicodedata.normalize("NFC", text)

        key = parse_page_key(text_nfc)
        if not key:
            print(f"  경고: {page_idx + 1}페이지 시험 정보 없음")
            continue

        if key in HARDCODED_ANSWERS:
            answers_list = HARDCODED_ANSWERS[key]
        elif uses_custom_font(page):
            answers_list = parse_answers_custom(page)
        else:
            answers_list = parse_answers_standard(text_nfc)

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
