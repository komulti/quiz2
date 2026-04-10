# 고졸 검정고시 퀴즈

고졸 검정고시 기출문제를 기반으로 한 모바일 최적화 퀴즈 웹앱입니다.

## 주요 기능

- **400문항** – 2018~2025년 총 16회차 기출문제
- **3가지 모드** – 랜덤 / 년도·회차별 / 오답만 풀기
- **오답노트** – 틀린 문제 자동 저장 및 재도전
- **리더보드** – 닉네임 등록 후 점수 비교
- **PWA** – 모바일 홈화면 추가 지원 (오프라인 가능)
- **키보드 단축키** – 1·2·3·4 선택, Enter/Space 다음 문제

## 기술 스택

| 영역 | 사용 기술 |
|------|----------|
| 프론트엔드 | React 19 + TypeScript + Vite |
| 라우팅 | React Router v7 (HashRouter) |
| 상태관리 | Zustand + LocalStorage persist |
| 스타일 | Tailwind CSS v3 |
| PWA | vite-plugin-pwa + Workbox |
| 데이터 추출 | Python + PyMuPDF |
| 배포 | GitHub Pages + GitHub Actions |

## 로컬 개발

```bash
# 1. 의존성 설치
cd quiz-app
npm install

# 2. 개발 서버 실행
npm run dev
# → http://localhost:5173

# 3. 빌드
npm run build
```

## 데이터 추출 (선택사항)

PDF에서 이미지/정답/문제텍스트를 추출하려면:

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install pymupdf pillow

# 전체 추출 실행
python3 run_all.py

# WebP 변환 (빌드 전 권장)
python3 convert_webp.py
```

## 배포

`main` 또는 `master` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 후 GitHub Pages에 배포합니다.

**라이브 URL:** `https://komulti.github.io/quiz2/`

수동 배포:

```bash
cd quiz-app
npm run build
# dist/ 폴더를 gh-pages 브랜치에 업로드
```

## 라이선스

MIT License
