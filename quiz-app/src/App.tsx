import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useDataStore } from './store/dataStore';
import { useRecordStore } from './store/recordStore';
import MainPage from './pages/MainPage';
import SetupPage from './pages/SetupPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import WrongNotePage from './pages/WrongNotePage';
import StatsPage from './pages/StatsPage';
import LogoPreviewPage from './pages/LogoPreviewPage';

function LoadingScreen() {
  return (
    <div className="app-container flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div style={{ width: 22, height: 22, flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect width="100" height="100" rx="22" fill="#be185d"/>
              <polygon points="50,25 80,40 50,55 20,40" fill="white"/>
              <path d="M65 47 L65 65 Q65 72 50 76 Q35 72 35 65 L35 47" fill="white" opacity="0.85"/>
              <line x1="80" y1="40" x2="80" y2="58" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="80" cy="61" r="4" fill="#fbbf24"/>
              <polygon points="50,36 51.5,41 56.5,41 52.5,44 54,49 50,46 46,49 47.5,44 43.5,41 48.5,41" fill="#be185d" opacity="0.5"/>
            </svg>
          </div>
          <p className="text-blue-200 text-sm font-medium tracking-widest">고졸 검정고시</p>
        </div>
        <h1 className="text-4xl font-bold text-white">퀴즈 챌린지</h1>
      </div>
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-6" />
      <p className="text-blue-200 text-sm">잠시만 기다려 주세요...</p>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="app-container flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800 px-8">
      <svg viewBox="0 0 24 24" className="w-16 h-16 fill-current text-white mb-6">
        <path d="M3.27 3L2 4.27l4.22 4.22C3.67 10.07 2 12.85 2 16h2c0-2.34 1.04-4.43 2.68-5.88l1.46 1.46C6.83 12.69 6 14.27 6 16h2c0-1.46.63-2.76 1.63-3.67l7.29 7.29c-.65.24-1.27.55-1.95.7V22h4v-1.68c1.72-.45 3.2-1.47 4.24-2.83L21.73 21 23 19.73 3.27 3zM12 4c2.76 0 5.25 1.12 7.07 2.93l1.41-1.41C18.35 3.52 15.35 2 12 2c-3.35 0-6.35 1.52-8.48 3.52l1.41 1.41C6.75 5.12 9.24 4 12 4zm0 4c1.59 0 3.03.64 4.08 1.67l1.42-1.42C16.05 7.01 14.12 6 12 6c-2.12 0-4.05 1.01-5.5 2.25l1.42 1.42C8.97 8.64 10.41 8 12 8z" />
      </svg>
      <p className="text-white text-xl font-bold mb-3">인터넷 연결을 확인해 주세요</p>
      <p className="text-blue-200 text-sm text-center mb-10 leading-relaxed">
        데이터를 불러오지 못했습니다.<br />연결 상태를 확인한 후 다시 시도해 주세요.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-white text-blue-600 font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform"
      >
        다시 시도
      </button>
    </div>
  );
}

function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // 10분마다 새 버전 체크 (설치된 PWA에서도 감지되도록)
      setInterval(() => { r?.update(); }, 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-lg">
      <span className="text-sm font-medium">새로운 업데이트가 있습니다!</span>
      <button
        onClick={() => { updateServiceWorker(true); setTimeout(() => window.location.reload(), 500); }}
        className="ml-4 bg-white text-blue-600 text-sm font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-transform"
      >
        업데이트
      </button>
    </div>
  );
}

function SyncBanner() {
  const syncStatus = useRecordStore((s) => s.syncStatus);
  const [show, setShow] = useState(false);
  const prevRef = useRef(syncStatus);

  useEffect(() => {
    if (prevRef.current !== 'synced' && syncStatus === 'synced') {
      setShow(true);
      const t = setTimeout(() => setShow(false), 1400);
      return () => clearTimeout(t);
    }
    prevRef.current = syncStatus;
  }, [syncStatus]);

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div className="sync3-banner bg-green-500 text-white py-4 px-6 flex items-center justify-center gap-3 shadow-lg">
        <span className="text-2xl">☁️</span>
        <span className="text-lg font-black tracking-wide">동기화됨</span>
      </div>
    </div>
  );
}

export default function App() {
  const { loadAll, loaded, error } = useDataStore();
  const { loadFromCloud } = useRecordStore();

  useEffect(() => {
    loadAll();
    // 저장된 닉네임이 있으면 클라우드에서 자동 로드
    const nickname = localStorage.getItem('playerName')?.trim();
    if (nickname) loadFromCloud(nickname);
  }, [loadAll, loadFromCloud]);

  return (
    <>
      <UpdateBanner />
      {error ? <ErrorScreen /> : !loaded ? <LoadingScreen /> : (
        <HashRouter>
          <SyncBanner />
          <div className="app-container">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/wrong-notes" element={<WrongNotePage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/logo-preview" element={<LogoPreviewPage />} />
            </Routes>
          </div>
        </HashRouter>
      )}
    </>
  );
}
