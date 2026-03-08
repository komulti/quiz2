import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';
import { formatTime } from '../hooks/useTimer';

const MODE_LABEL: Record<string, string> = {
  random: '랜덤',
  yearly: '년도별',
  wrong: '오답',
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { leaderboard } = useRecordStore();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">←</button>
        <h1 className="text-lg font-bold text-gray-800">🏆 리더보드</h1>
      </div>

      <div className="mx-4 mt-4 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">☁️</span>
        <p className="text-sm text-blue-500 leading-snug">닉네임별로 저장되는 <span className="font-bold">나만의 기록</span>입니다. 다른 기기에서도 같은 닉네임으로 동기화하면 불러올 수 있어요.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏆</p>
            <p>아직 기록이 없습니다</p>
            <p className="text-sm mt-1">퀴즈를 풀고 닉네임을 등록해보세요!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 ${
                  idx === 0 ? 'border-2 border-yellow-400' : ''
                }`}
              >
                <span
                  className={`text-xl font-bold w-8 text-center ${
                    idx === 0
                      ? 'text-yellow-500'
                      : idx === 1
                      ? 'text-gray-400'
                      : idx === 2
                      ? 'text-orange-400'
                      : 'text-gray-300'
                  }`}
                >
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{entry.nickname}</p>
                  <p className="text-xs text-gray-400">
                    {MODE_LABEL[entry.mode]} · {entry.score}/{entry.total} · {formatTime(entry.timeSeconds)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">{entry.percent}%</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
