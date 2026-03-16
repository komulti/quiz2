import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';

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

export default function MainPage() {
  const navigate = useNavigate();
  const { leaderboard, wrongNotes, syncStatus, disconnectCloud } = useRecordStore();
  const nickname = localStorage.getItem('playerName')?.trim();

  const bestPercent = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.percent)) : 0;
  const animRecords = useCountUp(leaderboard.length);
  const animWrong = useCountUp(wrongNotes.length);
  const animBest = useCountUp(bestPercent);

  type SyncConfig = { icon: string; label: string; pill: string; dot: string };
  const syncConfig: Record<string, SyncConfig> = {
    no_nickname: {
      icon:  '⚠️',
      label: '닉네임 없음 — 기록이 저장되지 않아요',
      pill:  'bg-yellow-400/20 border border-yellow-400/50',
      dot:   'bg-yellow-400',
    },
    idle: {
      icon:  '☁️',
      label: '동기화 대기 중',
      pill:  'bg-white/10 border border-white/20',
      dot:   'bg-gray-400',
    },
    syncing: {
      icon:  '🔄',
      label: '동기화 중...',
      pill:  'bg-blue-400/20 border border-blue-400/50',
      dot:   'bg-blue-400',
    },
    synced: {
      icon:  '✅',
      label: `${nickname} — 동기화됨`,
      pill:  'bg-green-400/20 border border-green-400/50',
      dot:   'bg-green-400',
    },
    error: {
      icon:  '❌',
      label: '동기화 실패 — 인터넷 확인',
      pill:  'bg-red-400/20 border border-red-400/50',
      dot:   'bg-red-400',
    },
  };
  const configKey = !nickname ? 'no_nickname' : syncStatus;
  const cfg = syncConfig[configKey];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-600 to-blue-800">
      {/* 헤더 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="text-center mb-10">
          <p className="text-blue-200 text-sm font-medium tracking-widest mb-2">고졸 검정고시</p>
          <h1 className="text-4xl font-bold text-white mb-2">퀴즈 챌린지</h1>
          <p className="text-blue-200 text-sm">기출문제로 합격을 준비하세요</p>
          <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-white text-xs font-semibold ${cfg.pill}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`} />
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
            {(syncStatus === 'synced' || syncStatus === 'syncing') && (
              <button
                onClick={(e) => { e.stopPropagation(); disconnectCloud(); }}
                className="ml-1 w-4 h-4 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center text-white font-bold leading-none transition-colors"
                title="동기화 중지"
              >
                ×
              </button>
            )}
          </div>
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
            <p className="text-2xl font-bold text-white">{animRecords}</p>
            <p className="text-blue-200 text-xs mt-1">기록</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{animWrong}</p>
            <p className="text-blue-200 text-xs mt-1">오답</p>
          </div>
          {leaderboard.length > 0 && (
            <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {animBest}%
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
            <span className="text-xs">학습통계</span>
          </button>
        </div>
      </div>
    </div>
  );
}
