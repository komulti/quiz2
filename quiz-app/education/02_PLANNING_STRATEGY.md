# 계획 수립 전략

> 복잡한 기능을 구현하기 전에 plan 모드로 설계하면 시행착오를 크게 줄일 수 있다.

---

## Plan 모드란?

Claude Code에서 `/plan` 명령어를 입력하면 활성화되는 **읽기 전용 설계 모드**.

```
사용자: /plan
Claude: (plan 모드 진입 - 코드 수정 불가, 분석만 가능)

사용자: "QuizPage에 문제 전환 애니메이션을 추가하고 싶어"
Claude: (코드 분석 → 계획 파일 작성 → 사용자 승인 요청)

사용자: (승인)
Claude: (plan 모드 종료 → 구현 시작)
```

---

## Plan 모드의 5단계 워크플로우

### Phase 1: 초기 이해 (Explore)
- `Explore` 에이전트를 최대 3개 병렬 실행
- 관련 코드, 패턴, 유틸리티 탐색
- 기존에 재사용 가능한 것이 있는지 확인

### Phase 2: 설계 (Plan)
- `Plan` 에이전트로 구현 전략 수립
- 대안 비교, 트레이드오프 분석

### Phase 3: 검토 (Review)
- 핵심 파일을 직접 읽어 설계 검증
- 사용자에게 불명확한 부분 질문

### Phase 4: 최종 계획 (Write)
- `.claude/plans/*.md` 파일에 계획 작성
- Context, 수정 파일, 구현 상세, 검증 방법 포함

### Phase 5: 승인 (Exit)
- `ExitPlanMode` 호출 → 사용자 승인 요청

---

## 언제 plan 모드를 사용하는가?

### 사용해야 하는 경우

| 상황 | 예시 |
|------|------|
| 여러 파일에 걸친 변경 | 7과목 확장 (store, page, component 모두 수정) |
| 근본 원인 파악이 필요한 버그 | 이미지 모달이 480px에 갇히는 문제 |
| 아키텍처 결정 | Firebase vs Supabase 선택 |
| 삭제/리팩토링 | 레이스 컨디션 해결을 위한 동기화 로직 변경 |

### 사용하지 않아도 되는 경우

| 상황 | 예시 |
|------|------|
| 단일 파일 수정 | 아이콘 SVG 교체 |
| 명확한 1줄 수정 | 오타 수정, 색상 변경 |
| CSS만 변경 | 폰트 크기 조정 |
| 텍스트 변경 | 버튼 라벨 수정 |

---

## 이 프로젝트의 실제 계획 사례

### 사례 1: 이미지 확대 모달 버그 수정

**문제**: QuizPage에서 이미지 확대 모달이 브라우저 전체 폭을 채우지 못함

**계획 파일 구조** (`.claude/plans/snuggly-swimming-lynx.md`):

```markdown
# 계획: QuizPage 이미지 확대 모달 전체 화면 고정 버그 수정

## Context
오답노트 탭에서는 정상 동작하지만 QuizPage에서는 480px에 갇힘.

## 근본 원인 (CSS stacking context)
- `.slide-in` 클래스의 `animation: slideInRight 0.25s ease-out both`
- `fill-mode: both` → transform이 종료 후에도 유지
- CSS 명세: transform이 적용된 요소는 fixed 자식의 containing block이 됨
- 결과: 모달이 viewport가 아닌 .slide-in 기준으로 위치 계산

## 수정 대상
- `quiz-app/src/index.css` (2줄)

## 구현 상세
- `to` 상태에서 `transform: translateX(0)` 제거
- `both` → `backwards` 변경
- 시각적 변화 없음

## 검증
- 랜덤/년도별/오답 모드 → 이미지 탭 → 전체 폭 확인
```

**핵심**: Context(왜 이게 문제인지) → 원인(근본 원인) → 해결(최소 변경) → 검증(어떻게 확인)

---

### 사례 2: 7과목 확장 (가상)

만약 처음부터 계획했다면:

```markdown
# 계획: 한국사 단일 과목 → 7과목 확장

## Context
한국사만 있던 퀴즈를 국어/수학/영어/사회/과학/도덕으로 확장한다.

## 영향 범위
1. dataStore.ts — questions를 단일 배열에서 과목별 Record로 변경
2. types/index.ts — Subject 타입 추가, Question에 subject 필드
3. SetupPage.tsx — 과목 선택 UI 추가
4. MainPage.tsx — 과목별 카드 표시
5. WrongNotePage.tsx — 과목별 탭 필터
6. StatsPage.tsx — 과목별 숙련도, 레이더 차트
7. public/data/questions/ — 7개 JSON 파일
8. vite.config.ts — PWA 캐시 패턴 업데이트

## 구현 순서
1. 타입 정의 (types/index.ts)
2. 데이터 레이어 (dataStore.ts)
3. 설정 페이지 (SetupPage.tsx)
4. 메인 페이지 (MainPage.tsx)
5. 기존 페이지 호환성 (QuizPage, ResultPage)
6. 분석 페이지 (WrongNotePage, StatsPage)

## 과목 ID 체계
- 한국사: kh_2018_1_1 (prefix 없는 레거시도 지원)
- 국어: kl_2018_1_1
- 수학: math_2018_1_1
- 영어: en_2018_1_1
- 사회: ss_2018_1_1
- 과학: sci_2018_1_1
- 도덕: eth_2018_1_1
```

---

## 계획 파일 작성 템플릿

```markdown
# 계획: [작업 제목]

## Context
[왜 이 변경이 필요한지, 무엇이 문제인지]

## 수정 대상 파일
- `path/to/file1.ts` (설명)
- `path/to/file2.tsx` (설명)

## 구현 상세
[코드 변경 사항, before/after]

## 주의사항
[엣지 케이스, 호환성, 부작용]

## 검증
[테스트 방법, 확인할 시나리오]
```

---

## 큰 기능을 작은 단위로 분해하는 방법

### 원칙: 각 단위가 독립적으로 동작해야 한다

```
Bad: "퀴즈 앱을 만들어줘"

Good:
1. "타입 정의를 만들어줘 (Question, UserAnswer, QuizMode)"
   → 독립적으로 완성 가능

2. "dataStore를 만들어줘 (JSON fetch + 메모리 캐시)"
   → 타입에만 의존

3. "quizStore를 만들어줘 (startQuiz, submitAnswer, nextQuestion)"
   → 타입 + dataStore에 의존

4. "QuizPage를 만들어줘"
   → 모든 스토어에 의존 → 가장 마지막
```

### 의존성 그래프로 순서 결정

```
types (의존 없음)
  ↓
dataStore (types)
  ↓
quizStore (types)
  ↓
recordStore (types)
  ↓
MainPage (dataStore)
SetupPage (dataStore, quizStore)
QuizPage (quizStore, recordStore)
ResultPage (recordStore, quizStore)
```

**규칙**: 화살표 방향의 역순으로 구현하면 된다. 의존이 없는 것부터 시작.

---

## Plan 모드 활용 팁

### 1. Explore 에이전트를 병렬로
```
# 3개 에이전트를 동시에 보내면 탐색 시간 1/3
Agent 1: "src/store/ 디렉토리의 모든 스토어 구조 파악"
Agent 2: "src/pages/QuizPage.tsx의 상태 흐름 분석"
Agent 3: "src/index.css의 애니메이션 클래스 목록"
```

### 2. Plan 에이전트에게 충분한 맥락 제공
```
# Bad
"이미지 모달 수정 계획 세워줘"

# Good
"QuizPage의 이미지 모달이 480px에 갇히는 문제의 수정 계획을 세워줘.
 - QuestionImage 컴포넌트는 position: fixed 모달 사용
 - QuizPage는 .slide-in CSS 클래스로 감싸져 있음
 - WrongNotePage에서는 정상 동작
 - index.css의 slideInRight 애니메이션이 transform을 유지하는 것이 원인으로 추정"
```

### 3. 계획이 너무 커지면 분할
```
# 하나의 계획이 100줄이 넘으면 분할 신호
"이 계획을 Phase 1(데이터 레이어)과 Phase 2(UI)로 나눠서 각각 계획해줘"
```
