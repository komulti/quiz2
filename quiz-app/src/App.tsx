import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useDataStore } from './store/dataStore';
import MainPage from './pages/MainPage';
import SetupPage from './pages/SetupPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import WrongNotePage from './pages/WrongNotePage';

export default function App() {
  const { loadQuestions, loaded, error } = useDataStore();

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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
        </Routes>
      </div>
    </HashRouter>
  );
}
