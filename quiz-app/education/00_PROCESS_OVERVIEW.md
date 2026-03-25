# 바이럴코딩 전체 프로세스 가이드

> Claude Code를 활용해 "고졸 검정고시 퀴즈 챌린지"를 처음부터 완성하기까지의 이상적인 프로세스

---

## 전체 로드맵 (6단계)

```
Stage 1: 기반 구축        → 프로젝트 초기화, CLAUDE.md 작성, 데이터 파이프라인
Stage 2: 핵심 기능        → 퀴즈 플로우 (설정→풀기→결과), 상태관리
Stage 3: 사용자 경험      → 애니메이션, 효과음, 모바일 최적화
Stage 4: 데이터 확장      → 7과목 확장, 이미지 최적화(WebP)
Stage 5: 클라우드 + PWA   → Firebase 동기화, 오프라인 지원, 서비스워커
Stage 6: 배포 + 폴리싱    → GitHub Pages, CI/CD, 버그 수정, UX 개선
```

---

## Stage 1: 기반 구축 (Day 1)

### 1-1. 프로젝트 생성
```bash
# 터미널에서 직접 실행
npm create vite@latest quiz-app -- --template react-ts
cd quiz-app
npm install
npm install react-router-dom zustand tailwindcss @tailwindcss/vite
```

### 1-2. CLAUDE.md 초기 작성
> **핵심 원칙**: CLAUDE.md는 프로젝트와 함께 성장한다. Day 1에 완벽할 필요 없다.

```markdown
# 퀴즈 앱

## 기술 스택
- React 19 + TypeScript + Vite
- Tailwind CSS
- Zustand (상태관리)
- React Router (HashRouter)

## 핵심 규칙
- 모바일 퍼스트 (max-width: 480px)
- 한국어 UI
```

### 1-3. 데이터 파이프라인 (Python 스크립트)
```
Claude Code에게 요청:
"PDF에서 시험 문제를 추출하는 Python 스크립트를 만들어줘.
 - data/pdfs/ 폴더에 PDF 파일 16개가 있어
 - 각 PDF에서 문제 번호, 선택지, 정답을 추출
 - 문제 이미지도 캡처해서 저장
 - JSON 형식으로 data/questions/ 에 저장"
```

**사용 도구**: Claude Code의 Bash 도구로 Python 스크립트 실행 + 결과 확인

### 1-4. 이 단계에서의 Claude Code 활용

| 작업 | 도구/기능 | 설명 |
|------|----------|------|
| 프로젝트 구조 파악 | `Explore` 에이전트 | 생성된 Vite 템플릿 탐색 |
| 설정 파일 수정 | `Edit` 도구 | vite.config.ts, tailwind.config.js |
| Python 스크립트 작성 | `Write` 도구 | scripts/*.py |
| 스크립트 실행 | `Bash` 도구 | python scripts/run_all.py |
| 결과 검증 | `Read` 도구 | JSON 데이터 확인 |

---

## Stage 2: 핵심 기능 (Day 2-3)

### 2-1. 타입 정의 먼저
```
"퀴즈 앱의 TypeScript 타입을 정의해줘:
 - Question: id, year, session, number, text, image, options, answer
 - UserAnswer: questionId, selected, isCorrect
 - QuizMode: random | yearly | wrong
 - LeaderboardEntry, WrongNote, SessionHistory"
```

### 2-2. 상태 관리 (Zustand 스토어)
```
순서: dataStore → quizStore → recordStore
이유: 데이터 로드 → 퀴즈 로직 → 결과 저장 순서
```

**Claude Code에게 요청하는 순서**:
1. `dataStore.ts` — "7개 과목 JSON을 병렬 fetch하는 Zustand 스토어"
2. `quizStore.ts` — "문제 풀기 상태 관리 (startQuiz, submitAnswer, nextQuestion)"
3. `recordStore.ts` — "점수 기록 + 오답노트 + 히스토리 (LocalStorage persist)"

### 2-3. 페이지 구현 순서

```
1. MainPage     → 랜딩 페이지 (가장 먼저 보이는 화면)
2. SetupPage    → 퀴즈 설정 (모드 선택, 문제 수)
3. QuizPage     → 핵심 퀴즈 화면 (가장 복잡)
4. ResultPage   → 결과 화면
5. WrongNotePage → 오답노트
6. StatsPage    → 학습 통계 (가장 나중에)
7. LeaderboardPage → 리더보드
```

> **팁**: 한 번에 한 페이지씩. 각 페이지가 동작하는 것을 확인하고 다음으로 넘어간다.

### 2-4. 이 단계에서의 Claude Code 활용

| 작업 | 도구/기능 | 설명 |
|------|----------|------|
| 타입 정의 | `Write` | src/types/index.ts 생성 |
| 스토어 작성 | `Write` | 각 store 파일 생성 |
| 페이지 작성 | `Write` + `Edit` | 페이지 컴포넌트 |
| 라우팅 설정 | `Edit` | App.tsx에 Route 추가 |
| 동작 확인 | `Bash` | npm run dev |
| plan 모드 | `/plan` 명령어 | QuizPage 같은 복잡한 페이지 설계 |

---

## Stage 3: 사용자 경험 (Day 4-5)

### 3-1. 애니메이션 추가
```
"QuizPage에 문제 전환 애니메이션을 추가해줘:
 - 새 문제: 오른쪽에서 슬라이드 인
 - 정답: 바운스 효과 + 축하 오버레이
 - 오답: 흔들림 효과 + 약올리기 오버레이"
```

### 3-2. 효과음
```
"Web Audio API로 정답/오답 효과음을 만들어줘:
 - 정답: 밝은 아르페지오 (C5→E5→G5→C6)
 - 오답: 낮은 톤 3연타"
```

### 3-3. 모바일 최적화
- 터치 이벤트 최적화 (`-webkit-tap-highlight-color: transparent`)
- iOS Safari 입력 줌 방지 (`font-size: 16px` 이상)
- 이미지 확대 모달 (핀치줌 + 드래그)

### 3-4. 이 단계에서 흔히 겪는 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| 모달이 컨테이너에 갇힘 | CSS transform이 containing block 생성 | animation fill-mode 수정 |
| iOS 입력 시 화면 줌 | font-size < 16px | 최소 16px 보장 |
| 터치 이벤트 씹힘 | passive listener | `{ passive: false }` |

---

## Stage 4: 데이터 확장 (Day 6-7)

### 4-1. 7과목으로 확장
```
"한국사 외에 국어, 수학, 영어, 사회, 과학, 도덕 과목을 추가해줘:
 - 과목별 JSON 파일 생성
 - dataStore에서 7개 파일 병렬 로드
 - 과목별 ID prefix: kl_, math_, en_, ss_, sci_, eth_
 - SetupPage에 과목 선택 UI 추가"
```

### 4-2. 이미지 최적화
```
"PNG 이미지를 WebP로 변환하는 스크립트를 만들어줘.
 quality 85로, 원본 PNG도 유지 (fallback)"
```

**결과**: `<picture>` 요소로 WebP 우선, PNG fallback

---

## Stage 5: 클라우드 + PWA (Day 8-10)

### 5-1. Firebase 연동
```
"Firebase Firestore로 사용자 데이터 클라우드 동기화를 추가해줘:
 - 닉네임 기반 사용자 식별
 - leaderboard, wrongNotes, history 동기화
 - 1.5초 디바운스로 자동 저장
 - 전체 리더보드 (상위 10명)"
```

### 5-2. PWA 설정
```
"vite-plugin-pwa를 설정해줘:
 - 오프라인 접속 지원
 - 모든 이미지 프리캐시
 - 앱 매니페스트 (아이콘, 테마 색상)"
```

### 5-3. 이 단계에서의 핵심 포인트
- **레이스 컨디션 주의**: 클라우드 로드와 로컬 저장의 타이밍 충돌
- **디바운스 패턴**: 연속 변경을 묶어서 한 번만 네트워크 요청
- **서비스 워커 캐시 전략**: CacheFirst (이미지) vs NetworkFirst (API)

---

## Stage 6: 배포 + 폴리싱 (Day 11+)

### 6-1. GitHub Actions CI/CD
```
".github/workflows/deploy.yml을 만들어줘:
 - main 브랜치 push 시 자동 배포
 - Node 20, npm ci, npm run build
 - GitHub Pages로 배포"
```

### 6-2. 최종 점검 체크리스트
- [ ] 모든 과목 퀴즈 동작 확인
- [ ] 오답노트 저장/삭제/풀기
- [ ] 클라우드 동기화 (로그인/로그아웃)
- [ ] PWA 설치 + 오프라인 동작
- [ ] iOS Safari + Android Chrome 테스트
- [ ] 로딩/에러 화면 확인

---

## 핵심 원칙 요약

### 1. 점진적 발전
```
동작하는 최소 버전 → 기능 추가 → 개선 → 반복
절대로 한 번에 모든 것을 만들려 하지 마라
```

### 2. CLAUDE.md는 살아있는 문서
```
Day 1: 기본 스택 + 규칙 3줄
Day 3: 파일 구조 + 컨벤션 추가
Day 7: 핵심 규칙 + 주의사항 추가
Day 10: 최종 정리
```

### 3. 한 번에 하나의 일
```
Bad:  "메인 페이지, 설정 페이지, 퀴즈 페이지를 한꺼번에 만들어줘"
Good: "메인 페이지를 만들어줘. 과목 카드 7개가 2열 그리드로 배치되고..."
```

### 4. 버그 수정 시 원인 설명 요청
```
Bad:  "이거 안 돼. 고쳐줘"
Good: "이미지 확대 모달이 480px에 갇혀. 원인이 뭔지 분석하고 수정해줘"
```

### 5. 되돌리기를 두려워하지 마라
```
"원래대로 복구해줘" — 이 한마디면 된다
Git이 있으니 언제든 돌아갈 수 있다
```
