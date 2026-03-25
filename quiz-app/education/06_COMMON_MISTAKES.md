# 흔한 실수와 예방법

> 이 프로젝트를 만들면서 실제로 겪었던 문제들과 해결법.
> 다음 프로젝트에서 같은 실수를 반복하지 않기 위한 가이드.

---

## 1. CSS Stacking Context 함정

### 문제
QuizPage에서 이미지 확대 모달(`position: fixed`)이 브라우저 전체 폭이 아닌
앱 컨테이너(480px) 폭에 갇힘. WrongNotePage에서는 정상 동작.

### 원인
```css
/* index.css */
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }  /* ← 문제! */
}
.slide-in { animation: slideInRight 0.25s ease-out both; }  /* ← both가 유지 */
```

**CSS 명세**: `transform`이 적용된 요소는 `position: fixed` 자식의 **containing block**이 된다.

`animation-fill-mode: both`는 애니메이션 종료 후에도 `to` 상태를 유지한다.
→ `transform: translateX(0)`이 영구적으로 남아있음
→ 이 요소 안의 `position: fixed` 모달은 viewport가 아닌 이 요소 기준으로 위치 계산
→ 480px 컨테이너에 갇힘

### 해결
```css
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { opacity: 1; }  /* transform 제거 */
}
.slide-in { animation: slideInRight 0.25s ease-out backwards; }  /* both → backwards */
```

### 교훈
- `position: fixed` 모달을 사용할 때, 조상 요소에 `transform`, `filter`, `perspective`가 있는지 확인
- `animation-fill-mode: both`/`forwards`는 transform을 영구 유지하므로 주의
- `backwards`는 시작 전 상태만 적용하고 종료 후에는 원래 CSS로 복귀

### 예방법
```
Claude에게: "position: fixed 모달을 추가할 건데,
조상 요소에 transform을 적용하는 CSS가 있는지 확인해줘"
```

---

## 2. Zustand + Firebase 레이스 컨디션

### 문제
국어 퀴즈를 풀고 StatsPage로 이동하면 국어 숙련도가 업데이트되지 않음.

### 원인
```
시간순서:
1. 국어 퀴즈 완료 → recordStore.addHistory(session) 호출
2. scheduleSave 디바운스 시작 (1.5초 대기)
3. 사용자가 StatsPage로 이동 (0.5초 후)
4. StatsPage useEffect → loadFromCloud(nickname) 호출
5. Firebase에서 "이전" 데이터 로드 (아직 1.5초 안 지남)
6. 로컬 state가 클라우드의 "이전" 데이터로 덮어씌워짐!
7. 방금 플레이한 국어 세션이 사라짐
```

### 해결
```typescript
// StatsPage.tsx, WrongNotePage.tsx에서
// loadFromCloud 호출을 완전히 제거

// Before (문제):
useEffect(() => {
  if (nickname && syncStatus !== 'syncing') loadFromCloud(nickname);
}, []);

// After (수정):
// App.tsx에서 앱 시작 시 1번만 loadFromCloud 호출
// 개별 페이지에서는 호출하지 않음
```

### 교훈
- 클라우드 동기화는 **한 곳에서만** 관리 (App.tsx)
- 디바운스 + 페이지 전환 = 타이밍 충돌의 온상
- 로컬 변경 → 클라우드 저장 완료 **전에** 클라우드 로드하면 로컬 데이터 손실

### 예방법
```
1. 동기화 로직은 앱 최상위(App.tsx)에서만 실행
2. 개별 페이지에서 loadFromCloud 호출 금지
3. 디바운스 시간(1.5초) 동안 다른 동기화 작업 차단
```

---

## 3. iOS Safari 입력 줌 문제

### 문제
iPhone에서 이름 입력 필드를 탭하면 화면이 자동으로 확대됨.

### 원인
iOS Safari는 `font-size < 16px`인 input에 포커스하면 자동 줌을 적용한다.
Tailwind의 `text-sm`은 `14px` → 줌 트리거.

### 해결
```tsx
// 입력 필드의 font-size를 16px 이상으로
<input className="text-base ..." />  // text-base = 16px
// 또는
<input style={{ fontSize: '16px' }} />
```

### 교훈
- iOS Safari에서 input은 항상 `font-size >= 16px`
- Tailwind `text-sm`(14px), `text-xs`(12px) 사용 금지 (input에서)
- 디자인적으로 작은 폰트가 필요하면 포커스 시에만 16px로 변경

---

## 4. iPhone에서 이름이 자동 채워지지 않음

### 문제
SetupPage에서 연결 해제 후 다시 접속하면 이전 이름이 입력 필드에 나타나지 않음.

### 원인
```tsx
// React useState 초기화는 컴포넌트 마운트 시 1번만 실행됨
const [playerName, setPlayerName] = useState(
  localStorage.getItem('playerName') ?? ''
);
// 모달이 열릴 때 다시 실행되지 않음!
```

### 해결
```tsx
// useState로 초기값 + useEffect로 모달 열릴 때 갱신
const [playerName, setPlayerName] = useState(() =>
  localStorage.getItem('playerName') ?? localStorage.getItem('lastPlayerName') ?? ''
);

useEffect(() => {
  if (showNameModal) {
    const saved = localStorage.getItem('playerName')
      ?? localStorage.getItem('lastPlayerName') ?? '';
    if (saved) setPlayerName(saved);
  }
}, [showNameModal]);
```

### 교훈
- `useState` 초기화는 **마운트 시 1번만** 실행
- 모달처럼 열고 닫는 UI에서 최신 값이 필요하면 `useEffect` 필수
- 연결 해제 시 `lastPlayerName`으로 백업 저장

---

## 5. GitHub Pages 라우팅 404

### 문제
BrowserRouter 사용 시 `https://komulti.github.io/quiz2/wrong-notes` 직접 접속하면 404.

### 원인
GitHub Pages는 SPA 라우팅을 지원하지 않는다.
`/quiz2/wrong-notes`라는 실제 파일이 없으므로 404 반환.

### 해결
```tsx
// HashRouter 사용
<HashRouter>
  <Routes>
    <Route path="/wrong-notes" element={<WrongNotePage />} />
  </Routes>
</HashRouter>
// URL: https://komulti.github.io/quiz2/#/wrong-notes
```

### 교훈
- GitHub Pages, Netlify(설정 없이), S3 정적 호스팅 → HashRouter
- Vercel, Netlify(설정 있으면), 자체 서버 → BrowserRouter
- `vite.config.ts`의 `base` 설정도 함께 맞춰야 함

---

## 6. PWA 서비스워커 캐시 문제

### 문제
코드 업데이트 후 배포했는데 사용자에게 이전 버전이 계속 보임.

### 원인
서비스워커가 이전 버전을 캐시하고 있어서 새 버전을 로드하지 않음.

### 해결
```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',  // 자동 업데이트
  workbox: {
    // 정적 자산은 빌드 시 해시가 바뀌므로 자동 갱신
    globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2}'],
    // 데이터 파일은 CacheFirst + 유효기간
    runtimeCaching: [{
      urlPattern: /^\/quiz2\/data\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'data-cache',
        expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 }
      }
    }]
  }
})
```

### 교훈
- `registerType: 'autoUpdate'`로 자동 갱신 활성화
- 자주 바뀌는 데이터: `NetworkFirst`
- 거의 안 바뀌는 이미지: `CacheFirst` + 유효기간
- 디버깅: Chrome DevTools → Application → Service Workers → "Update on reload" 체크

---

## 7. Claude에게 지시할 때 흔한 실수

### 실수 1: 한 번에 너무 많이 요청
```
# Bad
"메인 페이지, 설정 페이지, 퀴즈 페이지를 만들고
 애니메이션도 추가하고 Firebase도 연결해줘"

# Good
"메인 페이지를 만들어줘. 7개 과목 카드가 2열 그리드로 배치되고,
 각 카드에 과목 이름과 아이콘이 표시되게"
```

### 실수 2: 되돌리기를 두려워함
```
# 마음에 안 드는 변경이 있으면 즉시 되돌리기
"하단 내비게이션바에 대한 수정을 원래대로 복구해줘"
→ Claude가 git diff 확인 후 원복

# 여러 번 바꿔보는 것은 자연스러운 과정이다
```

### 실수 3: 원인 분석 없이 수정 요청
```
# Bad
"국어 숙련도가 안 바뀌어. 고쳐줘"
→ 증상만 보고 잘못된 수정을 할 수 있음

# Good
"국어 퀴즈를 풀고 StatsPage로 가면 국어 숙련도가 0이야.
 원인을 분석하고 수정해줘"
→ 체계적으로 원인 파악 후 정확한 수정
```

### 실수 4: CLAUDE.md를 업데이트하지 않음
```
프로젝트가 한국사 단일 과목에서 7과목으로 확장되었는데
CLAUDE.md에는 아직 "한국사 기출문제" 라고 적혀있다면
→ Claude가 잘못된 맥락으로 작업할 수 있음
```

### 실수 5: 커밋을 너무 늦게 함
```
# Bad
3시간 작업 후 한꺼번에 커밋
→ 되돌리기 어려움, 큰 diff

# Good
의미있는 변경마다 커밋
→ "/commit" 한 마디면 Claude가 적절한 메시지로 커밋
```

---

## 예방 체크리스트

### 새 기능 추가 시
- [ ] `position: fixed/absolute` 사용한다면 조상 요소의 transform 확인
- [ ] 상태 관리에 동기화가 있다면 타이밍 충돌 시나리오 검토
- [ ] iOS Safari에서 input font-size >= 16px 확인
- [ ] GitHub Pages 라우팅 호환성 (HashRouter) 확인
- [ ] PWA 캐시 전략이 적절한지 확인

### Claude에게 요청 시
- [ ] 한 번에 하나의 기능/수정만 요청
- [ ] "원인을 분석하고" 수정하라고 명시
- [ ] 수정 후 검증 방법을 함께 요청
- [ ] 마음에 안 들면 즉시 "원래대로 복구"
- [ ] 의미있는 단위마다 "/commit"
