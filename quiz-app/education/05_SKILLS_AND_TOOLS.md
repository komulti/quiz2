# 스킬과 도구 활용 가이드

> Claude Code의 내장 도구와 스킬을 올바르게 사용하면 생산성이 크게 향상된다.

---

## 핵심 도구 6가지

### 1. Read — 파일 읽기

**용도**: 파일 내용 확인 (코드 수정 전 필수)

```
# 전체 파일 읽기
Read: src/store/quizStore.ts

# 특정 범위만 읽기 (대용량 파일에 유용)
Read: src/pages/StatsPage.tsx (offset: 100, limit: 50)

# 이미지 파일 읽기 (시각적으로 표시)
Read: public/icon.png

# PDF 읽기 (페이지 범위 지정)
Read: data/pdfs/2024_1.pdf (pages: "1-5")
```

**규칙**: 수정할 파일은 **반드시** 먼저 Read. 안 읽으면 Edit이 실패함.

### 2. Edit — 파일 수정

**용도**: 기존 파일의 특정 부분 교체

```
# 특정 문자열을 다른 문자열로 교체
Edit: src/index.css
  old_string: "animation: slideInRight 0.25s ease-out both;"
  new_string: "animation: slideInRight 0.25s ease-out backwards;"

# 모든 인스턴스 교체 (변수 이름 변경 등)
Edit: src/store/dataStore.ts
  old_string: "korean_history"
  new_string: "한국사"
  replace_all: true
```

**주의**: `old_string`이 파일에서 유일해야 한다. 중복되면 실패.
→ 주변 맥락을 더 포함해서 유일하게 만들기.

### 3. Write — 새 파일 생성

**용도**: 완전히 새로운 파일을 만들 때

```
# 새 컴포넌트 파일 생성
Write: src/components/CircleProgress.tsx
  content: "export function CircleProgress({ percent }: Props) { ... }"
```

**규칙**: 기존 파일 수정은 Edit, 새 파일만 Write.
**주의**: 기존 파일에 Write하면 **전체 덮어쓰기** — 반드시 먼저 Read.

### 4. Glob — 파일 패턴 검색

**용도**: 파일 이름/경로로 검색

```
# 모든 TypeScript 페이지 파일 찾기
Glob: src/pages/**/*.tsx

# 모든 스토어 파일 찾기
Glob: src/store/*.ts

# 모든 CSS 파일 찾기
Glob: **/*.css

# 특정 이름 패턴
Glob: **/Question*.tsx
```

**대안 비교**:
- `Glob` > `Bash: find .` (더 빠르고 안전)
- `Glob` > `Bash: ls` (패턴 매칭 지원)

### 5. Grep — 코드 내용 검색

**용도**: 파일 내용에서 문자열/정규식 검색

```
# 특정 함수 사용처 찾기
Grep: "useRecordStore" (모든 파일에서)

# 특정 파일 타입에서만 검색
Grep: "position: fixed" (glob: "*.css")

# 정규식 사용
Grep: "animation:.*both" (glob: "*.css")

# 파일 목록만 (내용 없이)
Grep: "slide-in" (output_mode: "files_with_matches")

# 맥락과 함께
Grep: "transform" (glob: "*.css", context: 3)
```

**대안 비교**:
- `Grep` > `Bash: grep` (권한 문제 없음)
- `Grep` > `Bash: rg` (일관된 인터페이스)

### 6. Bash — 셸 명령 실행

**용도**: 빌드, 실행, Git 등 시스템 명령

```
# 개발 서버 시작
Bash: cd quiz-app && npm run dev

# 빌드
Bash: cd quiz-app && npm run build

# Git 상태 확인
Bash: git status

# 패키지 설치
Bash: cd quiz-app && npm install zustand

# Python 스크립트 실행
Bash: python scripts/extract_questions.py
```

**주의사항**:
- `cat`, `grep`, `find` 대신 Read, Grep, Glob 사용
- 위험한 명령(`rm -rf`, `git push --force`)은 확인 후 실행
- 장시간 명령은 `run_in_background: true` 사용

---

## 내장 스킬 (Slash Commands)

### /commit — Git 커밋

```
사용자: /commit
Claude: (변경 사항 분석 → 커밋 메시지 작성 → 커밋 실행)
```

**자동으로 하는 것**:
1. `git status` + `git diff` 확인
2. 최근 커밋 스타일 참고
3. 변경 내용에 맞는 커밋 메시지 작성
4. `git add` + `git commit`
5. `git status`로 결과 확인

**주의**: push는 하지 않음 (사용자가 직접)

### /simplify — 코드 품질 검토

```
사용자: /simplify
Claude: (변경된 코드 검토 → 재사용/품질/효율성 개선 → 수정)
```

**확인하는 것**:
- 기존 유틸리티 재사용 가능 여부
- 코드 중복
- 불필요한 복잡성
- 성능 이슈

### /plan — 계획 모드 진입

```
사용자: /plan
Claude: (읽기 전용 모드 → 분석 + 계획 작성 → 승인 후 실행)
```

---

## 도구 선택 플로우차트

```
"파일을 찾고 싶다"
  └── 파일 이름/경로를 안다 → Glob
  └── 파일 내용으로 찾고 싶다 → Grep
  └── 여러 파일을 종합 분석 → Explore 에이전트

"파일을 수정하고 싶다"
  └── 기존 파일의 일부분 → Edit (먼저 Read!)
  └── 새 파일 생성 → Write
  └── 전체 재작성 → Read → Write

"정보를 확인하고 싶다"
  └── 특정 파일 내용 → Read
  └── 프로젝트 구조 → Glob + Read
  └── 종합 분석 → Explore 에이전트

"명령을 실행하고 싶다"
  └── npm, git, python 등 → Bash
  └── 파일 읽기 (cat) → Read (Bash 아님!)
  └── 검색 (grep, find) → Grep, Glob (Bash 아님!)
```

---

## 효율적인 도구 사용 패턴

### 패턴 1: 병렬 도구 호출

```
# 독립적인 파일들을 동시에 읽기
Read: src/store/quizStore.ts     ← 동시 실행
Read: src/store/recordStore.ts   ← 동시 실행
Read: src/store/dataStore.ts     ← 동시 실행

# 독립적인 검색을 동시에
Grep: "useRecordStore"           ← 동시 실행
Grep: "useQuizStore"             ← 동시 실행
```

### 패턴 2: 순차 도구 호출

```
# Read → Edit (의존성 있음)
Step 1: Read: src/index.css      ← 먼저 읽기
Step 2: Edit: src/index.css      ← 읽은 후 수정
```

### 패턴 3: 탐색 → 작업

```
# 먼저 찾고, 그 다음 수정
Step 1: Grep: "slide-in" → 파일 목록 확인
Step 2: Read: src/index.css → 해당 부분 확인
Step 3: Edit: src/index.css → 수정
```

---

## 이 프로젝트에서의 도구 사용 통계 (추정)

| 도구 | 사용 빈도 | 주요 용도 |
|------|----------|----------|
| Read | 매우 높음 | 수정 전 파일 확인, 현재 상태 파악 |
| Edit | 높음 | CSS 수정, 컴포넌트 수정, 스토어 수정 |
| Write | 중간 | 새 컴포넌트 생성, Python 스크립트 |
| Glob | 중간 | 파일 구조 파악, 특정 파일 찾기 |
| Grep | 중간 | 함수 사용처 찾기, 패턴 검색 |
| Bash | 높음 | npm 명령, git, python 실행 |
| Agent | 낮음 | 복잡한 분석, plan 모드 탐색 |

---

## 흔한 실수

### 1. Read 없이 Edit 시도
```
# Error! 파일을 먼저 읽지 않음
Edit: src/App.tsx (old_string: ..., new_string: ...)
→ "This tool will error if you attempt an edit without reading the file."
```

### 2. Bash로 cat 사용
```
# Bad
Bash: cat src/App.tsx

# Good
Read: src/App.tsx
```

### 3. old_string이 유일하지 않음
```
# Error! "return" 이 파일에 여러 번 등장
Edit: src/App.tsx (old_string: "return", new_string: "return null")

# Good: 주변 맥락 포함
Edit: src/App.tsx (old_string: "  if (!loaded) return <LoadingScreen />;", new_string: ...)
```

### 4. Write로 기존 파일 덮어쓰기
```
# Dangerous! 기존 내용 전부 날아감
Write: src/App.tsx (content: "새로운 내용만")

# Safe: Edit으로 필요한 부분만 수정
Edit: src/App.tsx (old_string: ..., new_string: ...)
```
