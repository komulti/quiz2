# 서브에이전트 활용 가이드

> 서브에이전트는 Claude Code의 가장 강력한 기능 중 하나다.
> 복잡한 탐색과 분석을 병렬로 수행해 시간을 크게 절약한다.

---

## 서브에이전트란?

메인 Claude와 별개로 실행되는 **독립적인 Claude 인스턴스**.
각 에이전트는 자신만의 도구를 사용하고, 결과를 메인에게 보고한다.

```
메인 Claude
  ├── Agent 1 (Explore) → 코드 탐색 결과 반환
  ├── Agent 2 (Explore) → 코드 탐색 결과 반환  ← 병렬 실행
  └── Agent 3 (Plan)    → 구현 계획 반환
```

---

## 에이전트 유형

### 1. Explore (탐색 에이전트)

**용도**: 코드베이스 탐색, 파일 검색, 패턴 분석

**사용 가능한 도구**: Glob, Grep, Read, Bash (읽기 전용)

**사용 시점**:
- 프로젝트 구조를 파악할 때
- 특정 패턴이 어디에 쓰이는지 찾을 때
- 버그의 원인을 추적할 때

```
# 사용 예
"src/store/ 디렉토리의 모든 Zustand 스토어 구조를 분석해줘.
 각 스토어의 state shape, 주요 메서드, persist 설정을 정리해줘."
```

**thoroughness 레벨**:
- `quick`: 기본 검색 (파일 1-2개 확인)
- `medium`: 중간 탐색 (관련 파일 5-10개)
- `very thorough`: 깊은 분석 (전체 관련 코드 추적)

### 2. Plan (설계 에이전트)

**용도**: 구현 전략 설계, 아키텍처 결정

**사용 가능한 도구**: Glob, Grep, Read, Bash (읽기 전용)

**사용 시점**:
- 복잡한 기능의 구현 방법을 결정할 때
- 여러 접근 방식의 트레이드오프를 비교할 때
- 영향 범위가 큰 변경을 계획할 때

```
# 사용 예
"Firebase Firestore로 사용자 데이터 동기화를 구현하려고 합니다.
 현재 recordStore.ts는 LocalStorage persist를 사용 중입니다.
 디바운스 자동 저장 + 충돌 해결 전략을 포함한 구현 계획을 세워주세요."
```

### 3. General-Purpose (범용 에이전트)

**용도**: 복잡한 다단계 작업, 코드 작성 포함

**사용 가능한 도구**: 모든 도구 (Edit, Write, Bash 포함)

**사용 시점**:
- 독립적인 코드 작성 작업
- 여러 파일에 걸친 검색 + 수정
- 테스트 실행이 필요한 검증

```
# 사용 예
"quiz-app 디렉토리에서 npm run build를 실행하고,
 에러가 있으면 분석해서 수정해줘."
```

---

## 병렬 에이전트 활용

### 핵심 규칙
> **독립적인 작업은 병렬로, 의존적인 작업은 순차적으로**

### 패턴 1: 병렬 탐색 (3개 Explore)

**상황**: 프로젝트를 처음 파악할 때

```
Agent 1: "src/pages/ 디렉토리의 모든 페이지 컴포넌트 분석"
Agent 2: "src/store/ 디렉토리의 모든 스토어 구조 분석"
Agent 3: "src/components/ 디렉토리의 모든 공통 컴포넌트 분석"
```

**효과**: 3배 빠른 코드베이스 이해

### 패턴 2: 탐색 → 설계 (Explore + Plan)

**상황**: 버그 수정 계획 수립

```
Step 1 (병렬):
  Explore Agent 1: "QuestionImage 컴포넌트의 모달 로직 분석"
  Explore Agent 2: "index.css의 .slide-in 애니메이션 분석"

Step 2 (순차):
  Plan Agent: "위 분석 결과를 바탕으로 이미지 모달 버그 수정 계획 수립"
```

### 패턴 3: 독립 작업 병렬화 (General-Purpose)

**상황**: 여러 파일을 동시에 수정

```
Agent 1: "WrongNotePage.tsx에서 과목별 탭 필터 추가"
Agent 2: "StatsPage.tsx에서 과목별 숙련도 차트 추가"
```

> **주의**: 같은 파일을 동시에 수정하면 충돌 발생. 반드시 다른 파일이어야 함.

---

## 이 프로젝트에서의 실제 활용 사례

### 사례 1: 이미지 모달 버그 디버깅

**문제**: QuizPage에서 이미지 확대가 480px에 갇힘

**에이전트 구성**:
```
Explore Agent (very thorough):
  "QuizPage의 이미지 모달이 viewport 대신 앱 컨테이너에
   갇히는 원인을 분석해줘.
   - QuestionImage 컴포넌트의 position: fixed 모달
   - index.css의 .slide-in 애니메이션
   - CSS stacking context 관련 이슈
   - WrongNotePage에서는 정상 동작하는 이유"
```

**결과**: transform이 containing block을 생성하는 CSS 명세 발견 → 2줄 수정으로 해결

### 사례 2: 프로젝트 전체 구조 파악

**상황**: 교육 자료 작성을 위해 전체 아키텍처 이해 필요

**에이전트 구성**:
```
Explore Agent (very thorough):
  "quiz2 프로젝트 전체 구조를 분석해줘.
   - 모든 파일과 디렉토리
   - 각 컴포넌트의 역할
   - 스토어 간 데이터 흐름
   - 설정 파일 (vite, tailwind, pwa)
   - 배포 파이프라인"
```

**결과**: 15개 섹션으로 정리된 완전한 아키텍처 문서

### 사례 3: 과목 확장 영향 분석

**상황**: 한국사 단일 과목에서 7과목으로 확장

**에이전트 구성** (가상):
```
Explore Agent 1: "dataStore가 현재 단일 과목 JSON만 로드하는 방식 분석"
Explore Agent 2: "QuizPage와 SetupPage에서 과목 관련 코드 분석"
Explore Agent 3: "WrongNotePage와 StatsPage에서 과목 필터링이 필요한 부분 분석"
```

---

## 에이전트 사용 팁

### 1. 프롬프트에 맥락을 충분히 제공

```
# Bad
"버그 원인 찾아줘"

# Good
"QuizPage의 이미지 확대 모달이 viewport 전체가 아닌
 480px 컨테이너에 갇히는 버그의 원인을 찾아줘.
 - QuestionImage.tsx의 position: fixed 모달이 관련됨
 - WrongNotePage에서는 동일한 컴포넌트가 정상 동작
 - 차이점: QuizPage는 .slide-in CSS 클래스로 감싸져 있음"
```

### 2. 결과 형식을 미리 지정

```
"각 스토어에 대해 다음을 정리해줘:
 1. State 인터페이스 (주요 필드)
 2. 핵심 메서드 (이름 + 한줄 설명)
 3. Persist 설정 (키 이름, 저장소)
 4. 다른 스토어와의 관계"
```

### 3. 에이전트 수를 최소화

```
# Bad: 불필요하게 많은 에이전트
Agent 1: "App.tsx 읽어줘"
Agent 2: "MainPage.tsx 읽어줘"
Agent 3: "SetupPage.tsx 읽어줘"

# Good: 하나로 충분
Agent 1: "App.tsx, MainPage.tsx, SetupPage.tsx를 읽고
          라우팅 + 페이지 전환 흐름을 정리해줘"
```

### 4. 에이전트 결과를 신뢰하되 검증

에이전트가 반환한 결과는 대부분 정확하지만:
- 파일 경로는 `Read`로 직접 확인
- 함수 존재 여부는 `Grep`으로 확인
- 빌드 가능 여부는 `Bash`로 확인

### 5. Background vs Foreground

```
# Foreground (기본): 결과를 기다려야 다음 단계로 갈 때
"프로젝트 구조를 분석해줘" → 결과를 보고 계획 수립

# Background: 독립적인 작업을 병렬로 할 때
"테스트를 실행해줘" → 다른 파일 편집을 계속
```

---

## 에이전트를 사용하면 안 되는 경우

| 상황 | 대신 사용할 도구 |
|------|----------------|
| 특정 파일 읽기 | `Read` |
| 파일 이름으로 검색 | `Glob` |
| 코드에서 문자열 검색 | `Grep` |
| 1-2개 파일만 확인 | `Read` 직접 호출 |
| 간단한 bash 명령 | `Bash` 직접 호출 |

**규칙**: 3번 이내의 도구 호출로 해결되면 에이전트를 쓸 필요 없다.
