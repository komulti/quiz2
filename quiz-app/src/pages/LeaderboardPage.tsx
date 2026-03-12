import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../hooks/useTimer';
import { loadGlobalLeaderboard } from '../lib/syncService';
import type { LeaderboardEntry } from '../types';

const MODE_LABEL: Record<string, string> = {
  random: '랜덤',
  yearly: '년도별',
  wrong: '오답',
};

const SUBJECT_LABEL: Record<string, string> = {
  korean_history: '한국사',
  korean_language: '국어',
  math: '수학',
  english: '영어',
  social_studies: '사회',
  science: '과학',
  ethics: '도덕',
};

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadGlobalLeaderboard()
      .then((data) => { setEntries(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">←</button>
        <h1 className="text-lg font-bold text-gray-800">🏆 리더보드 TOP 10</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3 animate-pulse">⏳</p>
            <p>불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3">❌</p>
            <p>불러오기 실패</p>
            <p className="text-sm mt-1">인터넷 연결을 확인해주세요</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏆</p>
            <p>아직 기록이 없습니다</p>
            <p className="text-sm mt-1">퀴즈를 풀고 닉네임을 등록해보세요!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 ${
                  idx === 0 ? 'border-2 border-yellow-400' : ''
                }`}
              >
                <span
                  className={`text-3xl font-bold w-10 text-center ${
                    idx === 0
                      ? 'text-yellow-500'
                      : idx === 1
                      ? 'text-gray-400'
                      : idx === 2
                      ? 'text-orange-400'
                      : 'text-gray-300'
                  }`}
                >
                  {idx < 3 ? RANK_EMOJI[idx] : idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{entry.nickname}</p>
                  <p className="text-xs text-gray-400">
                    {entry.subject ? `${SUBJECT_LABEL[entry.subject]} · ` : ''}
                    {MODE_LABEL[entry.mode] ?? entry.mode} · {entry.score}/{entry.total} · {formatTime(entry.timeSeconds)}
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
