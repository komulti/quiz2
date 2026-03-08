import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useDataStore } from './store/dataStore';
import { useRecordStore } from './store/recordStore';
import MainPage from './pages/MainPage';
import SetupPage from './pages/SetupPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import WrongNotePage from './pages/WrongNotePage';
import StatsPage from './pages/StatsPage';

export default function App() {
  const { loadAll, loaded, error } = useDataStore();
  const { loadFromCloud } = useRecordStore();

  useEffect(() => {
    loadAll();
    // 저장된 닉네임이 있으면 클라우드에서 자동 로드
    const nickname = localStorage.getItem('playerName')?.trim();
    if (nickname) loadFromCloud(nickname);
  }, [loadAll, loadFromCloud]);

  if (error) {
    return (
      <div className="app-container flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">데이터 로딩 실패</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">문제 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/wrong-notes" element={<WrongNotePage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
