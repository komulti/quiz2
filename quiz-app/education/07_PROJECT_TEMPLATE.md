# 새 프로젝트 시작 템플릿

> Day 1부터 배포까지의 완전한 체크리스트와 템플릿.

---

## 추천 기술 스택 (2025년 기준)

### 모바일 웹앱 (이 프로젝트 스택)

| 분류 | 기술 | 이유 |
|------|------|------|
| 프레임워크 | React 19 + TypeScript | 생태계, AI 코드 생성 호환성 |
| 빌드 도구 | Vite 7 | 빠른 HMR, 간단한 설정 |
| 스타일링 | Tailwind CSS v3 | 유틸리티 클래스, 빠른 UI 개발 |
| 상태관리 | Zustand 5 | 간단, persist 미들웨어 내장 |
| 라우팅 | React Router v7 | HashRouter(정적 호스팅 호환) |
| DB/동기화 | Firebase Firestore | 무료 티어, 실시간 동기화 |
| PWA | vite-plugin-pwa | 오프라인, 앱 설치 |
| 배포 | GitHub Pages + Actions | 무료, 자동 CI/CD |

### 대안 스택

| 상황 | 대안 |
|------|------|
| SEO 필요 | Next.js + Vercel |
| 빠른 프로토타입 | Vite + Preact (가벼움) |
| 복잡한 백엔드 | Supabase (PostgreSQL + Auth) |
| 풀스택 | T3 Stack (Next.js + tRPC + Prisma) |

---

## Day 1 체크리스트

### 1단계: 프로젝트 생성 (10분)

```bash
# 터미널에서 직접 실행
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# 필수 패키지
npm install react-router-dom zustand

# Tailwind CSS (Vite 플러그인)
npm install tailwindcss @tailwindcss/vite
```

### 2단계: CLAUDE.md 작성 (5분)

```markdown
# [프로젝트 이름]

## 프로젝트 개요
[한줄 설명]

## 기술 스택
- React 19 + TypeScript + Vite 7
- Tailwind CSS v3
- Zustand 5
- React Router v7 (HashRouter)

## 프로젝트 구조
- src/pages/ : 페이지 컴포넌트
- src/components/ : 공통 컴포넌트
- src/store/ : Zustand 스토어
- src/types/ : TypeScript 타입
- src/lib/ : 유틸리티, 외부 서비스

## 핵심 규칙
- 모바일 퍼스트 (max-width: 480px)
- 한국어 UI
- [프로젝트 특화 규칙]

## 빌드
- npm run dev (개발)
- npm run build (빌드)
```

### 3단계: 기본 설정 (Claude에게 요청)

```
"프로젝트 기본 설정을 해줘:
 1. vite.config.ts에 Tailwind 플러그인 추가
 2. src/index.css에 Tailwind 기본 import
 3. HashRouter로 App.tsx 라우팅 설정
 4. 기본 페이지 2개 생성 (MainPage, AboutPage)
 5. 간단한 BottomNav 컴포넌트"
```

### 4단계: Git 초기화 (5분)

```bash
git init
git add .
git commit -m "Initial commit: Vite + React + TypeScript + Tailwind"
```

---

## 페이지 추가 템플릿

### Claude에게 새 페이지를 요청하는 패턴

```
"[페이지이름]Page를 만들어줘:
 - 경로: /[path]
 - 레이아웃: [헤더 + 본문 + 하단Nav]
 - 주요 기능:
   1. [기능 1 설명]
   2. [기능 2 설명]
 - 사용할 스토어: [storeA, storeB]
 - 참고: [기존페이지]Page와 비슷한 스타일로"
```

**실제 예시**:
```
"WrongNotePage를 만들어줘:
 - 경로: /wrong-notes
 - 레이아웃: 헤더(제목+전체삭제) + 과목탭 + 문제목록 + BottomNav
 - 주요 기능:
   1. 과목별 탭 필터 (전체/국어/수학/영어/사회/과학/한국사/도덕)
   2. 각 오답을 펼치면 문제 이미지 + 해설 표시
   3. 개별 삭제(×) + 전체 삭제(확인 모달)
   4. '오답 N개 풀기' 버튼 → 퀴즈 시작
 - 사용할 스토어: recordStore(wrongNotes), dataStore(questions), quizStore(startQuiz)
 - 참고: StatsPage와 비슷한 헤더 스타일로"
```

---

## 컴포넌트 추가 템플릿

```
"[컴포넌트이름] 공통 컴포넌트를 만들어줘:
 - Props:
   - [prop1]: [타입] — [설명]
   - [prop2]: [타입] — [설명]
 - 동작: [설명]
 - 스타일: [설명]
 - 사용처: [어디서 사용할지]"
```

**실제 예시**:
```
"ConfirmModal 컴포넌트를 만들어줘:
 - Props:
   - message: string — 메인 텍스트
   - subMessage?: string — 보조 텍스트
   - onConfirm: () => void — 확인 콜백
   - onCancel: () => void — 취소 콜백
 - 동작: 반투명 배경 위에 흰색 카드, 확인/취소 버튼
 - 스타일: backdrop blur, 빨간 확인 버튼
 - 사용처: 오답노트 전체 삭제, 퀴즈 중도 포기, 히스토리 삭제"
```

---

## GitHub Pages + PWA 배포 설정

### 1단계: vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/my-repo/',  // GitHub repo 이름
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '앱 이름',
        short_name: '앱',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2}'],
      },
    }),
  ],
});
```

### 2단계: GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: my-app/package-lock.json
      - run: cd my-app && npm ci
      - run: cd my-app && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: my-app/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 3단계: GitHub 설정
1. 저장소 Settings → Pages → Source: "GitHub Actions"
2. push to main → 자동 배포

---

## Firebase 설정 템플릿

### 1단계: Firebase 프로젝트 생성
1. https://console.firebase.google.com 접속
2. 프로젝트 생성
3. Firestore Database 활성화
4. 웹 앱 등록 → 설정 값 복사

### 2단계: 환경 변수 (.env)
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### 3단계: Claude에게 요청
```
"Firebase Firestore로 사용자 데이터 동기화를 추가해줘:
 - lib/firebase.ts: 초기화 (.env에서 설정 읽기)
 - lib/syncService.ts: CRUD 함수 (8초 timeout)
 - recordStore.ts에 디바운스 자동 동기화 연결
 - .env는 이미 설정되어 있어"
```

---

## 프로젝트 진행 타임라인 (권장)

```
Week 1: 기반 + 핵심 기능
  Day 1: 프로젝트 생성 + CLAUDE.md + 기본 설정
  Day 2: 타입 정의 + 스토어 + 메인 페이지
  Day 3: 핵심 페이지 (설정 → 퀴즈 → 결과)
  Day 4-5: UX (애니메이션 + 효과음 + 모바일 최적화)

Week 2: 확장 + 배포
  Day 6-7: 데이터 확장 + 추가 페이지
  Day 8-9: 클라우드 동기화 + PWA
  Day 10: 배포 + CI/CD
  Day 11+: 버그 수정 + 폴리싱
```

**핵심**: 각 Day가 끝나면 **동작하는 상태**여야 한다. 절대 미완성 상태로 넘기지 않는다.
