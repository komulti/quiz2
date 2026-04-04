#!/usr/bin/env python3
"""2026년도 제1회 문제 추가 스크립트 (append-only)

기존 JSON의 explanation 데이터를 보존하면서 2026_1 문제만 추가.
실행: cd scripts && python add_2026_1.py
"""

import json
import shutil
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

BASE_DIR = Path(__file__).parent.parent
EXAM_KEY = "2026_1"
PUBLIC_DIR = BASE_DIR / "quiz-app/public/data"

# ── 과목별 설정 ────────────────────────────────────────────────────────────────

SUBJECTS = [
    {
        "name": "korean_history",
        "pdf_dir": BASE_DIR / "data/pdfs/korean_history",
        "answers_module": "extract_answers",
        "answers_pdf": BASE_DIR / "data/pdfs/korean_history/한국사 정답표.pdf",  # 실제 경로
        "answers_path": BASE_DIR / "data/answers.json",
        "images_module": "extract_images",
        "image_dir": BASE_DIR / "data/images",
        "questions_module": "extract_questions",
        "question_json": BASE_DIR / "data/questions/korean_history.json",
        "id_prefix": "",
        "q_count": 25,
        "has_passage": False,
        "image_path_tpl": "images/{exam_key}_{n:02d}.png",
    },
    {
        "name": "korean_language",
        "pdf_dir": BASE_DIR / "data/pdfs/korean_language",
        "answers_module": "extract_kl_answers",
        "answers_path": BASE_DIR / "data/kl_answers.json",
        "images_module": "extract_kl_images",
        "image_dir": BASE_DIR / "data/images/korean_language",
        "questions_module": "extract_kl_questions",
        "question_json": BASE_DIR / "data/questions/korean_language.json",
        "id_prefix": "kl_",
        "q_count": 25,
        "has_passage": True,
        "image_path_tpl": "images/korean_language/{exam_key}_{n:02d}.png",
        "passage_path_tpl": "images/korean_language/{exam_key}_{passage_file}.png",
    },
    {
        "name": "english",
        "pdf_dir": BASE_DIR / "data/pdfs/english",
        "answers_module": "extract_en_answers",
        "answers_path": BASE_DIR / "data/en_answers.json",
        "images_module": "extract_en_images",
        "image_dir": BASE_DIR / "data/images/english",
        "questions_module": "extract_en_questions",
        "question_json": BASE_DIR / "data/questions/english.json",
        "id_prefix": "en_",
        "q_count": 25,
        "has_passage": True,
        "image_path_tpl": "images/english/{exam_key}_{n:02d}.png",
        "passage_path_tpl": "images/english/{exam_key}_{passage_file}.png",
    },
    {
        "name": "math",
        "pdf_dir": BASE_DIR / "data/pdfs/math",
        "answers_module": "extract_math_answers",
        "answers_path": BASE_DIR / "data/math_answers.json",
        "images_module": "extract_math_images",
        "image_dir": BASE_DIR / "data/images/math",
        "questions_module": "extract_math_questions",
        "question_json": BASE_DIR / "data/questions/math.json",
        "id_prefix": "math_",
        "q_count": 20,
        "has_passage": False,
        "image_path_tpl": "images/math/{exam_key}_{n:02d}.png",
    },
    {
        "name": "science",
        "pdf_dir": BASE_DIR / "data/pdfs/science",
        "answers_module": "extract_sci_answers",
        "answers_path": BASE_DIR / "data/sci_answers.json",
        "images_module": "extract_sci_images",
        "image_dir": BASE_DIR / "data/images/science",
        "questions_module": "extract_sci_questions",
        "question_json": BASE_DIR / "data/questions/science.json",
        "id_prefix": "sci_",
        "q_count": 25,
        "has_passage": False,
        "image_path_tpl": "images/science/{exam_key}_{n:02d}.png",
    },
    {
        "name": "social_studies",
        "pdf_dir": BASE_DIR / "data/pdfs/social_studies",
        "answers_module": "extract_ss_answers",
        "answers_path": BASE_DIR / "data/ss_answers.json",
        "images_module": "extract_ss_images",
        "image_dir": BASE_DIR / "data/images/social_studies",
        "questions_module": "extract_ss_questions",
        "question_json": BASE_DIR / "data/questions/social_studies.json",
        "id_prefix": "ss_",
        "q_count": 25,
        "has_passage": False,
        "image_path_tpl": "images/social_studies/{exam_key}_{n:02d}.png",
    },
    {
        "name": "ethics",
        "pdf_dir": BASE_DIR / "data/pdfs/ethics",
        "answers_module": "extract_eth_answers",
        "answers_path": BASE_DIR / "data/eth_answers.json",
        "images_module": "extract_eth_images",
        "image_dir": BASE_DIR / "data/images/ethics",
        "questions_module": "extract_eth_questions",
        "question_json": BASE_DIR / "data/questions/ethics.json",
        "id_prefix": "eth_",
        "q_count": 25,
        "has_passage": False,
        "image_path_tpl": "images/ethics/{exam_key}_{n:02d}.png",
    },
]


def find_pdf(pdf_dir: Path, exam_key: str) -> Path | None:
    """과목 폴더에서 exam_key에 해당하는 PDF 찾기 (NFC/NFD 대응)"""
    year, session = exam_key.split("_")
    pattern = f"{year}년도 제{session}회"
    for f in pdf_dir.iterdir():
        nfc_name = unicodedata.normalize("NFC", f.name)
        if f.suffix == ".pdf" and pattern in nfc_name:
            return f
    return None


def run_step(label: str, func):
    print(f"\n{'─' * 50}")
    print(f"  {label}")
    print("─" * 50)
    try:
        result = func()
        print(f"  → 완료")
        return True, result
    except Exception as exc:
        import traceback
        print(f"  → 실패: {exc}")
        traceback.print_exc()
        return False, None


# ── Step 1: 정답 추출 ──────────────────────────────────────────────────────────

def step1_extract_answers():
    print("\n" + "=" * 55)
    print("  Step 1: 정답 추출 (정답표 PDF → answers JSON)")
    print("=" * 55)

    for subj in SUBJECTS:
        mod_name = subj["answers_module"]
        try:
            mod = __import__(mod_name)
            # korean_history는 정답표 PDF 경로가 scripts 기준이 아닌 별도 경로를 사용
            # extract_answers.py의 PDF_PATH를 재지정해 main() 호출
            if "answers_pdf" in subj:
                import unicodedata as _uc
                import fitz as _fitz
                pdf_path = None
                target = _uc.normalize("NFC", subj["answers_pdf"].name)
                for f in subj["answers_pdf"].parent.iterdir():
                    if _uc.normalize("NFC", f.name) == target:
                        pdf_path = f
                        break
                if pdf_path is None:
                    print(f"  ⚠ {subj['name']}: 정답표 PDF 없음 ({subj['answers_pdf']})")
                    continue
                # mod의 main 내부 로직을 직접 실행 (PDF_PATH 재지정)
                orig_pdf_path = mod.PDF_PATH
                mod.PDF_PATH = subj["answers_pdf"]
                try:
                    mod.main()
                finally:
                    mod.PDF_PATH = orig_pdf_path
            else:
                mod.main()

            # 추출 결과 확인
            answers = json.loads(subj["answers_path"].read_text(encoding="utf-8"))
            if EXAM_KEY in answers:
                ans_list = answers[EXAM_KEY]
                valid = [a for a in ans_list if a is not None]
                print(f"  ✓ {subj['name']}: {EXAM_KEY} 정답 {len(valid)}/{len(ans_list)}개")
            else:
                print(f"  ⚠ {subj['name']}: {EXAM_KEY} 정답 없음 — 정답표 PDF 확인 필요")
        except Exception as e:
            import traceback
            print(f"  ✗ {subj['name']}: {e}")
            traceback.print_exc()


# ── Step 2: 이미지 추출 ────────────────────────────────────────────────────────

def step2_extract_images():
    print("\n" + "=" * 55)
    print("  Step 2: 이미지 추출 (2026_1 PDF만)")
    print("=" * 55)

    for subj in SUBJECTS:
        pdf_path = find_pdf(subj["pdf_dir"], EXAM_KEY)
        if not pdf_path:
            print(f"  ✗ {subj['name']}: 2026_1 PDF 없음")
            continue

        subj["image_dir"].mkdir(parents=True, exist_ok=True)
        mod_name = subj["images_module"]
        try:
            mod = __import__(mod_name)
            result = mod.process_pdf(pdf_path, EXAM_KEY)
            # process_pdf returns int or tuple(int, int)
            if isinstance(result, tuple):
                q_count, p_count = result
                print(f"  ✓ {subj['name']}: 문제 {q_count}개, 지문 {p_count}개 이미지 저장")
            else:
                print(f"  ✓ {subj['name']}: {result}개 이미지 저장")
        except Exception as e:
            import traceback
            print(f"  ✗ {subj['name']}: {e}")
            traceback.print_exc()


# ── Step 3: 문제 JSON append ───────────────────────────────────────────────────

def step3_append_questions():
    print("\n" + "=" * 55)
    print("  Step 3: 문제 JSON에 2026_1 항목 추가")
    print("=" * 55)

    import fitz

    for subj in SUBJECTS:
        q_json_path = subj["question_json"]
        ans_path = subj["answers_path"]
        prefix = subj["id_prefix"]
        q_count = subj["q_count"]
        first_id = f"{prefix}{EXAM_KEY}_01"

        # 기존 JSON 로드
        existing = json.loads(q_json_path.read_text(encoding="utf-8"))
        existing_ids = {q["id"] for q in existing}

        if first_id in existing_ids:
            print(f"  → {subj['name']}: 이미 {EXAM_KEY} 데이터 존재, 건너뜀")
            continue

        # answers 로드
        answers_all = json.loads(ans_path.read_text(encoding="utf-8"))
        exam_answers = answers_all.get(EXAM_KEY, [None] * q_count)

        # PDF 열기
        pdf_path = find_pdf(subj["pdf_dir"], EXAM_KEY)
        if not pdf_path:
            print(f"  ✗ {subj['name']}: 2026_1 PDF 없음")
            continue

        doc = fitz.open(str(pdf_path))

        # 각 과목의 질문 추출 함수 import
        mod_name = subj["questions_module"]
        try:
            mod = __import__(mod_name)
            q_data = mod.extract_questions_from_pdf(doc)

            # passageImage 지원 과목
            q_to_passage: dict[int, str] = {}
            if subj["has_passage"]:
                q_to_passage = mod.find_groups(doc)

        except Exception as e:
            import traceback
            print(f"  ✗ {subj['name']}: 추출 실패 — {e}")
            traceback.print_exc()
            continue

        # 문제 항목 생성
        new_entries = []
        for q_num in range(1, q_count + 1):
            ans_val = exam_answers[q_num - 1] if q_num <= len(exam_answers) else None
            is_multiple = isinstance(ans_val, list)

            if q_num in q_data:
                info = q_data[q_num]
                options_text = mod.parse_options(info["option_blocks"])
                q_text = info["text"]
            else:
                options_text = ["", "", "", ""]
                q_text = f"[추출 실패] {EXAM_KEY} {q_num}번"

            # 수학 등 PUA 문자 포함 선택지 정리
            clean_fn = getattr(mod, 'clean_option', None)
            if clean_fn:
                options_text = [clean_fn(t) for t in options_text]

            entry: dict = {
                "id": f"{prefix}{EXAM_KEY}_{q_num:02d}",
                "year": 2026,
                "session": 1,
                "number": q_num,
                "text": q_text,
                "image": subj["image_path_tpl"].format(exam_key=EXAM_KEY, n=q_num),
                "options": [
                    {"number": i + 1, "text": options_text[i]} for i in range(4)
                ],
                "answer": ans_val,
                "multipleAnswers": is_multiple,
            }

            if subj["has_passage"]:
                passage_file = q_to_passage.get(q_num)
                entry["passageImage"] = (
                    subj["passage_path_tpl"].format(exam_key=EXAM_KEY, passage_file=passage_file)
                    if passage_file else None
                )

            new_entries.append(entry)

        # 기존 JSON에 append
        existing.extend(new_entries)
        q_json_path.write_text(
            json.dumps(existing, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

        no_ans = sum(1 for e in new_entries if e["answer"] is None)
        status = "✓" if no_ans == 0 else "⚠"
        print(f"  {status} {subj['name']}: {len(new_entries)}개 항목 추가"
              + (f" (정답 누락 {no_ans}개)" if no_ans else ""))


# ── Step 4: quiz-app/public 동기화 ────────────────────────────────────────────

def step3_5_convert_webp():
    """새로 추가된 PNG 이미지를 WebP로 변환 (기존 WebP는 건너뜀)"""
    print("\n" + "=" * 55)
    print("  Step 3.5: PNG → WebP 변환")
    print("=" * 55)

    try:
        from PIL import Image
    except ImportError:
        print("  ⚠ Pillow 미설치 — 건너뜀 (pip install Pillow)")
        return

    img_dir = BASE_DIR / "data/images"
    MAX_WIDTH = 800
    QUALITY = 85
    converted = 0

    for png_path in sorted(img_dir.rglob("*.png")):
        webp_path = png_path.with_suffix(".webp")
        if webp_path.exists():
            continue
        with Image.open(png_path) as img:
            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                new_h = int(img.height * ratio)
                img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
            img.save(webp_path, "WEBP", quality=QUALITY, method=6)
        converted += 1

    print(f"  ✓ {converted}개 WebP 변환 완료")


def step4_sync_public():
    print("\n" + "=" * 55)
    print("  Step 4: quiz-app/public 동기화")
    print("=" * 55)

    # questions JSON 동기화
    q_dst = PUBLIC_DIR / "questions"
    q_dst.mkdir(parents=True, exist_ok=True)
    for subj in SUBJECTS:
        src = subj["question_json"]
        dst = q_dst / src.name
        shutil.copy(src, dst)
        print(f"  ✓ questions/{src.name} 동기화")

    # 이미지 동기화: 2026_1 파일만 복사
    img_src_root = BASE_DIR / "data/images"
    img_dst_root = PUBLIC_DIR / "images"
    img_dst_root.mkdir(parents=True, exist_ok=True)

    total_copied = 0

    # korean_history 이미지 (루트) - PNG + WebP
    for f in sorted(img_src_root.glob(f"{EXAM_KEY}_*")):
        if f.suffix in (".png", ".webp"):
            dst = img_dst_root / f.name
            shutil.copy(f, dst)
            total_copied += 1

    # 과목별 서브폴더 이미지 - PNG + WebP
    subject_dirs = ["korean_language", "english", "math", "science", "social_studies", "ethics"]
    for subdir in subject_dirs:
        src_dir = img_src_root / subdir
        dst_dir = img_dst_root / subdir
        dst_dir.mkdir(parents=True, exist_ok=True)
        if src_dir.exists():
            for f in sorted(src_dir.glob(f"{EXAM_KEY}_*")):
                if f.suffix in (".png", ".webp"):
                    dst = dst_dir / f.name
                    shutil.copy(f, dst)
                    total_copied += 1

    print(f"  ✓ 이미지 {total_copied}개 동기화 → quiz-app/public/data/images/")


# ── 검증 ──────────────────────────────────────────────────────────────────────

def validate():
    print("\n" + "=" * 55)
    print("  검증")
    print("=" * 55)

    all_ok = True
    for subj in SUBJECTS:
        data = json.loads(subj["question_json"].read_text(encoding="utf-8"))
        entries_2026 = [q for q in data if q["year"] == 2026]
        has_exp = sum(1 for q in data if q.get("explanation"))
        no_ans = sum(1 for q in entries_2026 if q["answer"] is None)

        ok = len(entries_2026) == subj["q_count"] and no_ans == 0
        all_ok = all_ok and ok
        status = "✓" if ok else "⚠"
        warnings = []
        if len(entries_2026) != subj["q_count"]:
            warnings.append(f"2026_1 문제 {len(entries_2026)}/{subj['q_count']}개")
        if no_ans:
            warnings.append(f"정답 누락 {no_ans}개")
        warn_str = " — " + ", ".join(warnings) if warnings else ""
        print(f"  {status} {subj['name']}: 전체 {len(data)}문제, 해설 {has_exp}개{warn_str}")

    print()
    print(f"  {'✓ 모든 검증 통과' if all_ok else '⚠ 일부 항목 확인 필요'}")


# ── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    print(f"\n{'=' * 55}")
    print(f"  2026년도 제1회 문제 추가 (append-only)")
    print(f"{'=' * 55}")

    step1_extract_answers()
    step2_extract_images()
    step3_append_questions()
    step3_5_convert_webp()
    step4_sync_public()
    validate()

    print("\n완료!\n")


if __name__ == "__main__":
    main()
