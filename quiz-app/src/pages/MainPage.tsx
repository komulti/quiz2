import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';
import type { SyncStatus } from '../store/recordStore';

export default function MainPage() {
  const navigate = useNavigate();
  const { leaderboard, wrongNotes, syncStatus } = useRecordStore();
  const nickname = localStorage.getItem('playerName')?.trim();

  const syncLabel: Record<SyncStatus, string> = {
    idle:    '',
    syncing: '☁️ 동기화 중...',
    synced:  '☁️ 동기화됨',
    error:   '⚠️ 동기화 실패',
  };
  const syncColor: Record<SyncStatus, string> = {
    idle:    '',
    syncing: 'text-blue-300',
    synced:  'text-green-300',
    error:   'text-red-300',
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-600 to-blue-800">
      {/* 헤더 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="text-center mb-10">
          <p className="text-blue-200 text-sm font-medium tracking-widest mb-2">고졸 검정고시</p>
          <h1 className="text-4xl font-bold text-white mb-2">퀴즈 챌린지</h1>
          <p className="text-blue-200 text-sm">기출문제로 합격을 준비하세요</p>
          {nickname && syncStatus !== 'idle' && (
            <p className={`text-xs mt-2 ${syncColor[syncStatus]}`}>
              {syncLabel[syncStatus]}
              {syncStatus === 'synced' && <span className="ml-1 opacity-70">({nickname})</span>}
            </p>
          )}
        </div>

        {/* 카테고리 카드 */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-3">
          {[
            { subject: 'korean_language', period: '1교시', name: '국어',  icon: '✏️', color: 'bg-green-100',  count: '400문제' },
            { subject: 'math',            period: '2교시', name: '수학',  icon: '📐', color: 'bg-orange-100', count: '320문제' },
            { subject: 'english',         period: '3교시', name: '영어',  icon: '🔤', color: 'bg-sky-100',    count: '400문제' },
            { subject: 'social_studies',  period: '4교시', name: '사회',  icon: '🌍', color: 'bg-yellow-100', count: '400문제' },
            { subject: 'science',         period: '5교시', name: '과학',  icon: '🔬', color: 'bg-purple-100', count: '400문제' },
            { subject: 'korean_history',  period: '6교시', name: '한국사', icon: '📚', color: 'bg-blue-100',   count: '400문제' },
            { subject: 'ethics',          period: '7교시', name: '도덕',  icon: '🧭', color: 'bg-rose-100',   count: '400문제' },
          ].map((item) => (
            <button
              key={item.subject}
              onClick={() => navigate(`/setup?subject=${item.subject}`)}
              className="bg-white rounded-2xl shadow-lg p-3 text-left hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3"
            >
              <div className={`w-11 h-11 shrink-0 ${item.color} rounded-xl flex items-center justify-center text-2xl`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium leading-none mb-1">{item.period}</p>
                <h2 className="text-sm font-bold text-gray-800 leading-tight">{item.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{item.count}</p>
              </div>
            </button>
          ))}
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
          <button
            onClick={() => navigate('/stats')}
            className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-blue-600 transition-all group"
          >
            <span className="text-2xl transition-transform duration-200 group-hover:scale-125 group-active:scale-95">📊</span>
            <span className="text-xs">통계</span>
          </button>
        </div>
      </div>
    </div>
  );
}
