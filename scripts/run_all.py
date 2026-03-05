#!/usr/bin/env python3
"""전체 데이터 추출 파이프라인 실행
사용법: cd scripts && python run_all.py
"""

import sys
import json
from pathlib import Path

# scripts 디렉토리를 경로에 추가
sys.path.insert(0, str(Path(__file__).parent))


def run_step(label: str, func):
    print(f"\n{'=' * 55}")
    print(f"  {label}")
    print("=" * 55)
    try:
        result = func()
        print(f"  → 완료")
        return True, result
    except Exception as exc:
        print(f"  → 실패: {exc}")
        import traceback
        traceback.print_exc()
        return False, None


def validate():
    base = Path(__file__).parent.parent

    print(f"\n{'=' * 55}")
    print("  검증 결과")
    print("=" * 55)
    all_ok = True

    # 정답 데이터
    ans_path = base / "data/answers.json"
    if ans_path.exists():
        with open(ans_path, encoding="utf-8") as f:
            ans = json.load(f)
        exam_count = len(ans)
        ok = exam_count == 16
        print(f"  {'✓' if ok else '⚠'} 정답 데이터: {exam_count}/16개 시험")
        all_ok = all_ok and ok

        for key, lst in ans.items():
            valid = [a for a in lst if a is not None]
            if len(valid) != 25:
                print(f"    경고: {key} - {len(valid)}/25개 정답")
    else:
        print("  ✗ data/answers.json 없음")
        all_ok = False

    # 이미지
    img_dir = base / "data/images"
    if img_dir.exists():
        img_count = len(list(img_dir.glob("*.png")))
        ok = img_count == 400
        print(f"  {'✓' if ok else '⚠'} 이미지: {img_count}/400개")
        all_ok = all_ok and ok
    else:
        print("  ✗ data/images/ 없음")
        all_ok = False

    # 문제 JSON
    q_path = base / "data/questions/korean_history.json"
    if q_path.exists():
        with open(q_path, encoding="utf-8") as f:
            qs = json.load(f)
        ok = len(qs) == 400
        print(f"  {'✓' if ok else '⚠'} 문제: {len(qs)}/400개")
        all_ok = all_ok and ok

        no_ans = [q["id"] for q in qs if q["answer"] is None]
        if no_ans:
            print(f"    경고: 정답 없는 문제 {len(no_ans)}개 → {no_ans[:5]}{'...' if len(no_ans)>5 else ''}")

        multi = [q["id"] for q in qs if q["multipleAnswers"]]
        if multi:
            print(f"    복수 정답 문제: {multi}")
    else:
        print("  ✗ data/questions/korean_history.json 없음")
        all_ok = False

    print()
    print(f"  {'✓ 모든 검증 통과' if all_ok else '⚠ 일부 항목 확인 필요'}")


def main():
    from extract_answers import main as step1
    from extract_images import main as step2
    from extract_questions import main as step3

    ok, _ = run_step("1단계: 정답 추출 (extract_answers.py)", step1)
    if not ok:
        sys.exit(1)

    ok, _ = run_step("2단계: 이미지 추출 (extract_images.py)", step2)
    if not ok:
        sys.exit(1)

    ok, _ = run_step("3단계: 문제 텍스트 추출 (extract_questions.py)", step3)
    if not ok:
        sys.exit(1)

    validate()


if __name__ == "__main__":
    main()
