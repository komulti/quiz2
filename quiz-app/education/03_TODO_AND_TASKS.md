# 투두리스트 & 작업 관리

> Claude Code의 Task 시스템으로 복잡한 작업을 체계적으로 추적한다.

---

## Claude Code의 Task 시스템

### 사용 가능한 도구

| 도구 | 용도 |
|------|------|
| `TaskCreate` | 새 작업 생성 |
| `TaskUpdate` | 상태 변경 (in_progress, completed, blocked) |
| `TaskGet` | 특정 작업 상세 조회 |
| `TaskList` | 전체 작업 목록 확인 |
| `TaskOutput` | 작업 결과물 기록 |

### 상태 흐름

```
pending → in_progress → completed
                      → blocked (장애물 발생 시)
```

---

## 작업 분해 패턴

### 패턴 1: 기능 단위 분해

```
대작업: "퀴즈 풀기 페이지 만들기"

분해:
□ QuizPage 기본 레이아웃 (헤더 + 본문 + 하단 버튼)
□ 문제 표시 (이미지 + 선택지 4개)
□ 답안 제출 로직 (정답/오답 판정)
□ 정답/오답 피드백 UI (색상 + 아이콘)
□ 다음 문제로 넘기기
□ 타이머 구현
□ 진행률 바
□ 퀴즈 종료 → 결과 페이지 이동
```

### 패턴 2: 레이어 단위 분해

```
대작업: "클라우드 동기화 추가"

분해:
□ Firebase 초기화 (lib/firebase.ts)
□ Firestore CRUD 함수 (lib/syncService.ts)
□ recordStore에 sync 로직 연결
□ 디바운스 자동 저장 (1.5초)
□ 로그인/로그아웃 UI (SetupPage)
□ 동기화 배너 (App.tsx)
□ 에러 핸들링
```

### 패턴 3: 버그 수정 분해

```
대작업: "국어 숙련도가 업데이트 안 됨"

분해:
□ 문제 재현 확인
□ StatsPage 숙련도 계산 로직 분석
□ recordStore history 데이터 확인
□ 근본 원인 파악 (loadFromCloud 레이스 컨디션)
□ 수정 구현
□ 수정 검증
```

---

## 이 프로젝트의 실전 투두리스트 예시

### Stage 1: 프로젝트 초기화

```
☑ Vite + React + TypeScript 프로젝트 생성
☑ Tailwind CSS 설정
☑ React Router 설정 (HashRouter)
☑ Zustand 설치
☑ Python 스크립트로 PDF → JSON 변환
☑ 문제 이미지 추출 (PNG)
☑ CLAUDE.md 초기 작성
```

### Stage 2: 핵심 기능

```
☑ types/index.ts — 타입 정의
☑ dataStore.ts — JSON 데이터 로드
☑ quizStore.ts — 퀴즈 세션 상태
☑ recordStore.ts — 기록 저장 (LocalStorage)
☑ MainPage — 랜딩 (과목 카드 + 통계 위젯)
☑ SetupPage — 설정 (모드 선택 + 문제 수)
☑ QuizPage — 퀴즈 (문제 표시 + 답안 제출 + 피드백)
☑ ResultPage — 결과 (점수 + 오답 목록)
☑ BottomNav — 하단 내비게이션
☑ App.tsx — 라우팅 설정
```

### Stage 3: UX 개선

```
☑ slide-in/out 문제 전환 애니메이션
☑ bounce-once 정답 애니메이션
☑ shake 오답 애니메이션
☑ correct-overlay 정답 축하 효과
☑ taunt-overlay 오답 약올리기 효과
☑ Web Audio API 효과음 (정답/오답)
☑ 키보드 단축키 (1-4 답안, Enter 다음)
☑ QuestionImage 핀치줌 + 드래그
☑ CircleProgress 원형 프로그레스 바
☑ ConfirmModal 확인 다이얼로그
```

### Stage 4: 데이터 확장

```
☑ 국어 (kl_) 400문제 추가
☑ 수학 (math_) 320문제 추가
☑ 영어 (en_) 400문제 추가
☑ 사회 (ss_) 400문제 추가
☑ 과학 (sci_) 400문제 추가
☑ 도덕 (eth_) 400문제 추가
☑ dataStore 7과목 병렬 로드
☑ SetupPage 과목 선택 UI
☑ PNG → WebP 변환 스크립트
☑ <picture> 요소로 WebP 우선 로드
```

### Stage 5: 클라우드 + PWA

```
☑ Firebase 프로젝트 설정
☑ lib/firebase.ts — Firestore 초기화
☑ lib/syncService.ts — CRUD + timeout
☑ recordStore — 디바운스 자동 동기화
☑ SetupPage — 닉네임 입력 + 클라우드 연결
☑ SyncBanner — 동기화 완료 알림
☑ LeaderboardPage — 전체 리더보드
☑ vite-plugin-pwa 설정
☑ 매니페스트 + 아이콘 생성
☑ 서비스 워커 캐시 전략
```

### Stage 6: 배포 + 폴리싱

```
☑ .github/workflows/deploy.yml
☑ vite.config.ts base path 설정
☑ LoadingScreen (앱 시작 로딩)
☑ ErrorScreen (네트워크 오류)
☑ iOS 이름 입력 자동 채우기 수정
☑ 아이콘 변경 (note_alt, casino)
☑ 레이스 컨디션 수정 (loadFromCloud)
☑ CSS stacking context 버그 수정
☑ WrongNotePage 과목별 탭 필터
☑ StatsPage 숙련도 + 레이더 차트 + 뱃지
```

---

## 효과적인 작업 분해 팁

### 1. "완료 기준"을 명확히

```
# Bad
□ 퀴즈 페이지 만들기

# Good
□ QuizPage: 문제 이미지가 표시되고, 4개 선택지를 탭하면
  정답/오답이 색상으로 구분되며, "다음" 버튼이 나타남
```

### 2. 한 작업은 30분 이내

```
# Bad (너무 큼)
□ 전체 퀴즈 플로우 완성

# Good (적절한 크기)
□ QuizPage 선택지 버튼 4개 표시
□ 답안 제출 시 정답/오답 색상 변경
□ "다음 문제" 버튼 + 전환 애니메이션
```

### 3. 의존성 순서대로

```
# 1번이 완료되어야 2번 가능, 2번이 완료되어야 3번 가능
□ 1. types/index.ts (의존 없음)
□ 2. quizStore.ts (types에 의존)
□ 3. QuizPage.tsx (quizStore에 의존)
```

### 4. Claude에게 Task 사용을 명시적으로 요청

```
"QuizPage 구현을 시작해줘. TaskCreate로 작업을 분해하고
 각 작업이 완료될 때마다 TaskUpdate로 표시해줘"
```

---

## Memory vs Task의 구분

| | Memory | Task |
|---|--------|------|
| **수명** | 영구 (대화 간 유지) | 현재 대화만 |
| **용도** | 사용자 선호, 프로젝트 맥락 | 진행 중인 작업 추적 |
| **예시** | "git push는 사용자가 직접" | "□ QuizPage 타이머 구현" |

**규칙**: 이번 대화에서만 필요하면 Task, 다음 대화에서도 필요하면 Memory
