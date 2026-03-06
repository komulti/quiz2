import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';

export default function MainPage() {
  const navigate = useNavigate();
  const { leaderboard, wrongNotes } = useRecordStore();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-600 to-blue-800">
      {/* 헤더 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="text-center mb-10">
          <p className="text-blue-200 text-sm font-medium tracking-widest mb-2">고졸 검정고시</p>
          <h1 className="text-4xl font-bold text-white mb-2">퀴즈 챌린지</h1>
          <p className="text-blue-200 text-sm">기출문제로 합격을 준비하세요</p>
        </div>

        {/* 카테고리 카드 */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate('/setup?subject=korean_language')}
            className="w-full bg-white rounded-2xl shadow-xl p-6 text-left hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">
                ✏️
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium mb-1">1교시</p>
                <h2 className="text-xl font-bold text-gray-800">국어</h2>
                <p className="text-sm text-gray-500 mt-0.5">2018~2025 · 총 400문제</p>
              </div>
              <span className="text-gray-300 text-2xl">›</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/setup?subject=social_studies')}
            className="w-full bg-white rounded-2xl shadow-xl p-6 text-left hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-3xl">
                🌍
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium mb-1">4교시</p>
                <h2 className="text-xl font-bold text-gray-800">사회</h2>
                <p className="text-sm text-gray-500 mt-0.5">2018~2025 · 총 400문제</p>
              </div>
              <span className="text-gray-300 text-2xl">›</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/setup?subject=science')}
            className="w-full bg-white rounded-2xl shadow-xl p-6 text-left hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-3xl">
                🔬
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium mb-1">5교시</p>
                <h2 className="text-xl font-bold text-gray-800">과학</h2>
                <p className="text-sm text-gray-500 mt-0.5">2018~2025 · 총 400문제</p>
              </div>
              <span className="text-gray-300 text-2xl">›</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/setup?subject=korean_history')}
            className="w-full bg-white rounded-2xl shadow-xl p-6 text-left hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">
                📚
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium mb-1">6교시</p>
                <h2 className="text-xl font-bold text-gray-800">한국사</h2>
                <p className="text-sm text-gray-500 mt-0.5">2018~2025 · 총 400문제</p>
              </div>
              <span className="text-gray-300 text-2xl">›</span>
            </div>
          </button>
        </div>

        {/* 통계 */}
        <div className="mt-6 flex gap-4 w-full max-w-sm">
          <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
            <p className="text-blue-200 text-xs mt-1">기록</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{wrongNotes.length}</p>
            <p className="text-blue-200 text-xs mt-1">오답</p>
          </div>
          {leaderboard.length > 0 && (
            <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {Math.max(...leaderboard.map((e) => e.percent))}%
              </p>
              <p className="text-blue-200 text-xs mt-1">최고점</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="bg-white border-t border-gray-100 px-6 py-3 safe-bottom">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-blue-600 transition-all group"
          >
            <span className="text-2xl transition-transform duration-200 group-hover:scale-125 group-active:scale-95">🏆</span>
            <span className="text-xs">리더보드</span>
          </button>
          <button
            onClick={() => navigate('/wrong-notes')}
            className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-blue-600 transition-all group"
          >
            <span className="text-2xl transition-transform duration-200 group-hover:scale-125 group-active:scale-95">📝</span>
            <span className="text-xs">오답노트</span>
          </button>
        </div>
      </div>
    </div>
  );
}
