# CLAUDE.md 작성 가이드

> CLAUDE.md는 Claude Code에게 프로젝트의 맥락과 규칙을 알려주는 핵심 파일이다.
> 잘 작성된 CLAUDE.md 하나가 수십 번의 반복 설명을 대체한다.

---

## CLAUDE.md란?

- 프로젝트 루트에 위치하는 마크다운 파일
- Claude Code가 **매 대화 시작 시 자동으로 읽는** 지시문
- 프로젝트 규칙, 컨벤션, 주의사항을 담는다
- Git에 커밋하면 팀원도 동일한 Claude 경험을 얻는다

---

## 단계별 CLAUDE.md 발전 과정

### Day 1: 최소 시작

```markdown
# 퀴즈 앱

## 기술 스택
- React 19 + TypeScript + Vite
- Tailwind CSS
- Zustand (상태관리)

## 규칙
- 모바일 퍼스트 (max-width: 480px)
- 한국어 UI
```

**왜 이것만?** Day 1에는 프로젝트 구조도, 컨벤션도 아직 없다. 기술 스택과 최소 규칙만 적는다.

---

### Day 3: 구조가 잡힌 후

```markdown
# 검정고시 퀴즈 챌린지

## 기술 스택
- React 19 + TypeScript + Vite
- Tailwind CSS v3
- Zustand 5 (상태관리)
- React Router v7 (HashRouter)

## 프로젝트 구조
- quiz-app/src/pages/ : 페이지 컴포넌트
- quiz-app/src/components/ : 공통 컴포넌트
- quiz-app/src/store/ : Zustand 스토어
- quiz-app/src/types/ : TypeScript 타입
- quiz-app/public/data/ : 문제 JSON + 이미지

## 핵심 규칙
- 모바일 퍼스트 (max-width: 480px)
- 한국어 UI
- 이미지 포함 문제는 반드시 이미지 표시
- 선택지 순서는 원본 그대로 유지
```

**추가된 것**: 프로젝트 구조, 더 구체적인 규칙

---

### Day 7: 주의사항이 쌓인 후

```markdown
# 검정고시 퀴즈 챌린지

## 프로젝트 개요
고졸 검정고시 7과목 기출문제 기반 4지선다 퀴즈 웹앱.

## 기술 스택
- React 19 + Vite 7
- Tailwind CSS v3
- Zustand 5 (상태 관리)
- React Router v7 (HashRouter - GitHub Pages 호환)
- Firebase (클라우드 동기화)

## 프로젝트 구조
- quiz-app/src/pages/ : 8개 페이지
- quiz-app/src/components/ : BottomNav, CircleProgress, ConfirmModal, QuestionImage
- quiz-app/src/store/ : quizStore, recordStore, dataStore
- quiz-app/src/lib/ : firebase.ts, syncService.ts
- quiz-app/public/data/ : questions/*.json + images/*.webp

## 핵심 규칙
- 이미지가 포함된 문제는 반드시 이미지를 캡처하여 표시할 것
- 선택지 순서는 원본 그대로 유지 (기출문제 원형 보존)
- 2019년 제1회 22번은 복수 정답 (②, ③)
- 모바일 퍼스트 반응형 디자인

## 빌드 & 배포
- npm run build는 /quiz-app/ 디렉토리에서 실행
- base: '/quiz2/' (GitHub Pages)
- 배포: GitHub Actions → GitHub Pages
```

**추가된 것**: 빌드 정보, 복수 정답 같은 엣지 케이스, Firebase 관련

---

## 효과적인 CLAUDE.md 작성 패턴

### 1. "해야 할 것" vs "하지 말 것" 모두 적기

```markdown
## 규칙
- 해설은 JSON 정답 기준으로 작성 (O)
- 해설에 '(JSON 기준)' 같은 메타 문구 절대 넣지 말 것 (X를 방지)
```

### 2. "왜"를 함께 적기

```markdown
## HashRouter를 사용하는 이유
- GitHub Pages는 SPA 라우팅을 지원하지 않음
- BrowserRouter 사용 시 새로고침하면 404
- HashRouter로 #/ 경로 사용
```

### 3. 엣지 케이스를 명시

```markdown
## 주의사항
- 2019년 제1회 22번은 복수 정답 (②, ③)
- 수학은 회차당 20문제 (다른 과목은 25문제)
- 과목별 ID prefix: kl_(국어), math_(수학), en_(영어), ss_(사회), sci_(과학), eth_(도덕)
```

### 4. 빌드/배포 명령어를 명확히

```markdown
## 빌드
- 작업 디렉토리: /quiz-app/
- 개발: npm run dev
- 빌드: npm run build
- 배포 URL: https://komulti.github.io/quiz2/
```

---

## 이 프로젝트의 실제 CLAUDE.md 분석

### 현재 파일 (`/quiz2/CLAUDE.md`)

```markdown
# 검정고시 퀴즈 챌린지

## 프로젝트 개요
고졸 검정고시 한국사 기출문제(2018~2025, 총 400문제) 기반 4지선다 퀴즈 웹앱.

## 기술 스택
- React 18 + Vite
- Tailwind CSS
- Zustand (상태 관리)
- LocalStorage (데이터 저장)
- Python (데이터 전처리 스크립트)

## 프로젝트 구조
- `data/pdfs/` : 원본 PDF 16개 + 정답표 PDF 1개
- `data/questions/` : 추출된 JSON 데이터
- `data/images/` : PDF에서 캡처한 문제 이미지
- `scripts/` : PDF 파싱, 이미지 추출 Python 스크립트
- `src/` : React 앱 소스코드

## 핵심 규칙
- 이미지가 포함된 문제는 반드시 이미지를 캡처하여 표시할 것
- 선택지 순서는 원본 그대로 유지 (기출문제 원형 보존)
- 2019년 제1회 22번은 복수 정답 (②, ③)
- 모바일 퍼스트 반응형 디자인
```

### 개선할 수 있는 점

1. **기술 스택이 오래됨**: React 18이라고 적혀있지만 실제로는 React 19
2. **누락된 정보**: Firebase, PWA, GitHub Pages 배포, 7과목 확장
3. **src/ 경로가 부정확**: 실제로는 `quiz-app/src/`
4. **빌드 명령어 없음**: 어디서 어떻게 빌드하는지

### 이상적인 최종 CLAUDE.md

```markdown
# 검정고시 퀴즈 챌린지

## 프로젝트 개요
고졸 검정고시 7과목 기출문제(2018~2025) 기반 4지선다 퀴즈 웹앱.
총 2,720+ 문제 | 3가지 모드 | 클라우드 동기화 | PWA 오프라인 지원

## 기술 스택
- React 19 + TypeScript + Vite 7
- Tailwind CSS v3
- Zustand 5 (상태 관리, LocalStorage persist)
- React Router v7 (HashRouter - GitHub Pages 호환)
- Firebase Firestore (클라우드 동기화)
- vite-plugin-pwa (서비스 워커, 오프라인)
- Python (데이터 전처리: PyMuPDF, Pillow)

## 프로젝트 구조
- `quiz-app/`            : React 앱 (여기서 npm 명령어 실행)
- `quiz-app/src/pages/`  : 8개 페이지 (Main, Setup, Quiz, Result, Leaderboard, WrongNote, Stats, LogoPreview)
- `quiz-app/src/store/`  : Zustand 스토어 3개 (quiz, record, data)
- `quiz-app/src/components/` : BottomNav, CircleProgress, ConfirmModal, QuestionImage
- `quiz-app/src/lib/`    : Firebase 초기화 + 동기화 서비스
- `quiz-app/public/data/` : 7개 과목 JSON + 이미지(PNG/WebP)
- `scripts/`             : Python PDF 파싱/이미지 추출 스크립트 32개
- `.github/workflows/`   : GitHub Actions 자동 배포

## 핵심 규칙
- 이미지가 포함된 문제는 반드시 이미지를 캡처하여 표시할 것
- 선택지 순서는 원본 그대로 유지 (기출문제 원형 보존)
- 2019년 제1회 22번은 복수 정답 (②, ③)
- 모바일 퍼스트 반응형 디자인 (max-width: 480px)
- 과목 ID prefix: kl_(국어), math_(수학), en_(영어), ss_(사회), sci_(과학), eth_(도덕), prefix 없음(한국사)
- 수학은 회차당 20문제, 나머지 과목은 25문제

## 빌드 & 배포
- 작업 디렉토리: quiz-app/
- 개발: npm run dev
- 빌드: npm run build (TypeScript 체크 + Vite 빌드)
- 배포: push to main → GitHub Actions → GitHub Pages
- URL: https://komulti.github.io/quiz2/
- base path: /quiz2/
```

---

## CLAUDE.md vs Memory vs 계획 파일

| | CLAUDE.md | Memory (MEMORY.md) | 계획 파일 |
|---|-----------|-------------------|-----------|
| **용도** | 프로젝트 규칙/구조 | 사용자 선호/피드백 | 특정 작업 설계 |
| **수명** | 프로젝트 전체 | 대화 간 유지 | 작업 완료까지 |
| **Git** | 커밋함 | 커밋 안 함 | 커밋 안 함 |
| **읽는 시점** | 매 대화 시작 | 매 대화 시작 | 해당 작업 중 |
| **예시** | "HashRouter 사용" | "git push는 수동" | "QuizPage 슬라이드 애니메이션 계획" |

---

## 흔한 실수

### 1. 너무 길게 쓰기
CLAUDE.md가 500줄이면 Claude도 핵심을 놓친다. **50줄 이내**가 이상적.

### 2. 코드를 직접 넣기
```markdown
# Bad
## 컴포넌트 코드
\`\`\`tsx
export function QuizPage() { ... 200줄 ... }
\`\`\`

# Good
## 핵심 규칙
- QuizPage는 slide-in 애니메이션 사용 (index.css)
- 복수 정답 지원 (Array.isArray 체크)
```

### 3. 변하는 정보 넣기
```markdown
# Bad
## 현재 진행 상황
- StatsPage 작업 중
- 버그 3개 남음

# Good (이건 Memory나 Task에)
```

### 4. 업데이트를 안 하기
프로젝트가 발전하면 CLAUDE.md도 함께 업데이트해야 한다.
React 18 → 19로 업그레이드했으면 CLAUDE.md도 수정.
