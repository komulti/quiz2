import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../hooks/useTimer';
import { loadGlobalLeaderboard } from '../lib/syncService';
import type { LeaderboardEntry } from '../types';
import BottomNav from '../components/BottomNav';

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

function EntryRow({ entry, idx }: { entry: LeaderboardEntry; idx: number }) {
  const animPercent = useCountUp(entry.percent);
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 ${
        idx === 0 ? 'border-2 border-yellow-400' : ''
      }`}
    >
      <span
        className={`text-3xl font-bold w-10 text-center ${
          idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-300'
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
        <p className="text-xl font-bold text-blue-600">{animPercent}%</p>
        <p className="text-xs text-gray-400">
          {new Date(entry.date).toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  );
}

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
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gray-800">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.44 4.97A5.99 5.99 0 0 0 11 15.93V18H8v2h8v-2h-3v-2.07a5.99 5.99 0 0 0 3.56-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
          리더보드 TOP 10
        </h1>
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
              <EntryRow key={entry.id} entry={entry} idx={idx} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
