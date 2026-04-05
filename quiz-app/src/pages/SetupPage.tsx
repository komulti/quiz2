import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import { useQuizStore } from '../store/quizStore';
import { useRecordStore } from '../store/recordStore';
import type { Question, QuizMode, QuizSettings, Subject } from '../types';
import BottomNav from '../components/BottomNav';

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const YEAR_MAX_SESSION: Record<number, number> = { 2026: 1 };
const BASE_COUNTS = [10, 25, 50, 100, 200];

const LEVELS = [
  { min: 0,    max: 49,       label: '입문자', icon: '🌱', bg: 'bg-gray-100',    text: 'text-gray-600'   },
  { min: 50,   max: 149,      label: '학습자', icon: '📖', bg: 'bg-green-100',   text: 'text-green-700'  },
  { min: 150,  max: 299,      label: '중급자', icon: '✏️', bg: 'bg-blue-100',    text: 'text-blue-700'   },
  { min: 300,  max: 499,      label: '고수',   icon: '🎯', bg: 'bg-purple-100',  text: 'text-purple-700' },
  { min: 500,  max: 999,      label: '실력자', icon: '🏆', bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  { min: 1000, max: Infinity, label: '합격왕', icon: '👑', bg: 'bg-orange-100',  text: 'text-orange-600' },
];
function getLevel(total: number) {
  return LEVELS.find((l) => total >= l.min && total <= l.max) ?? LEVELS[0];
}

const SUBJECT_LABELS: Record<Subject, { name: string; icon: string }> = {
  korean_history: { name: '한국사', icon: '📚' },
  korean_language: { name: '국어', icon: '✏️' },
  social_studies: { name: '사회', icon: '🌍' },
  science: { name: '과학', icon: '🔬' },
  ethics: { name: '도덕', icon: '🧭' },
  english: { name: '영어', icon: '🔤' },
  math: { name: '수학', icon: '📐' },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subject = (searchParams.get('subject') as Subject | null) ?? 'korean_history';

  const { questions: allQuestionsBySubject } = useDataStore();
  const allQuestions = allQuestionsBySubject[subject] ?? [];
  const { startQuiz } = useQuizStore();
  const { wrongNotes, loadFromCloud, syncStatus, disconnectCloud, history } = useRecordStore();
  const totalQuestions = history.reduce((s, h) => s + h.total, 0);
  const level = getLevel(totalQuestions);

  const [mode, setMode] = useState<QuizMode>('random');
  const [year, setYear] = useState(2026);
  const [session, setSession] = useState(1);
  const [count, setCount] = useState(10);
  const [playerName, setPlayerName] = useState(() =>
    localStorage.getItem('playerName') ?? localStorage.getItem('lastPlayerName') ?? ''
  );
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    if (syncStatus !== 'synced') setShowNameModal(true);
  }, []);

  useEffect(() => {
    if (showNameModal) {
      const saved = localStorage.getItem('playerName') ?? localStorage.getItem('lastPlayerName') ?? '';
      if (saved) setPlayerName(saved);
    }
  }, [showNameModal]);

  const SUBJECT_PREFIX: Record<Subject, string> = {
    korean_history: 'kh_',
    korean_language: 'kl_',
    social_studies: 'ss_',
    science: 'sci_',
    ethics: 'eth_',
    english: 'en_',
    math: 'math_',
  };
  const prefix = SUBJECT_PREFIX[subject];
  const subjectWrongNotes = wrongNotes.filter((n) =>
    subject === 'korean_history'
      ? !n.questionId.startsWith('kl_') && !n.questionId.startsWith('ss_') && !n.questionId.startsWith('sci_') && !n.questionId.startsWith('eth_') && !n.questionId.startsWith('en_') && !n.questionId.startsWith('math_')
      : n.questionId.startsWith(prefix)
  );
  const wrongCount = subjectWrongNotes.length;

  const maxCount = allQuestions.length;
  const ALL_COUNTS = [...BASE_COUNTS, maxCount < 400 ? maxCount : 400];

  const yearlyCount = subject === 'math' ? 20 : 25;
  const getAvailableCounts = () => {
    if (mode === 'yearly') return [yearlyCount];
    if (mode === 'wrong') {
      const filtered = ALL_COUNTS.filter((c) => c <= wrongCount);
      if (wrongCount > 0 && !filtered.includes(wrongCount)) filtered.push(wrongCount);
      return filtered.length > 0 ? filtered : [wrongCount];
    }
    return ALL_COUNTS.filter((c) => c <= maxCount);
  };

  const availableCounts = getAvailableCounts();
  const effectiveCount =
    availableCounts.includes(count) ? count : availableCounts[availableCounts.length - 1] ?? 0;

  const handleNameModalSubmit = async () => {
    const trimmed = playerName.trim();
    if (!trimmed || syncStatus === 'syncing') return;
    localStorage.setItem('playerName', trimmed);
    await loadFromCloud(trimmed);
    setShowNameModal(false);
    window.scrollTo(0, 0);
  };

  const handleStart = async () => {
    if (syncStatus !== 'synced') {
      setShowNameModal(true);
      return;
    }
    let pool: Question[] = [];
    const settings: QuizSettings = { count: effectiveCount, subject };

    if (mode === 'random') {
      pool = shuffle(allQuestions).slice(0, effectiveCount);
    } else if (mode === 'yearly') {
      pool = allQuestions.filter(
        (q) => q.year === year && q.session === session
      );
      settings.year = year;
      settings.session = session;
    } else if (mode === 'wrong') {
      const wrongIds = new Set(subjectWrongNotes.map((n) => n.questionId));
      pool = shuffle(allQuestions.filter((q) => wrongIds.has(q.id))).slice(
        0,
        effectiveCount
      );
    }

    if (pool.length === 0) return;
    const trimmed = playerName.trim();
    if (trimmed) {
      settings.playerName = trimmed;
      const prev = localStorage.getItem('playerName')?.trim();
      localStorage.setItem('playerName', trimmed);
      // 닉네임이 바뀌었으면 해당 닉네임의 클라우드 데이터 로드
      if (prev !== trimmed) await loadFromCloud(trimmed);
    }
    startQuiz(pool, mode, settings);
    navigate('/quiz');
  };

  const subjectLabel = SUBJECT_LABELS[subject];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 이름 입력 팝업 */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex justify-center mb-1">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-blue-500">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8H4v2H2v2h2v2h2v-2h2v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-1">시작 전 이름을 입력해주세요</h2>
            <p className="text-sm text-gray-500 text-center mb-5">이름을 등록하면 기록이 저장됩니다</p>
            <input
              type="text"
              autoFocus
              placeholder="이름 입력 (최대 12자)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameModalSubmit(); }}
              maxLength={12}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-base focus:outline-none focus:border-blue-500 mb-3"
            />
            <button
              onClick={handleNameModalSubmit}
              disabled={!playerName.trim() || syncStatus === 'syncing'}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {syncStatus === 'syncing' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95A5.469 5.469 0 0 1 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11A2.98 2.98 0 0 1 22 15c0 1.65-1.35 3-3 3zm-5.55-8h-2.9v3H8l4 4 4-4h-2.55V10z"/>
                </svg>
              )}
              동기화하고 시작하기
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 rounded-xl text-gray-400 text-sm hover:text-gray-600 transition-colors mt-1"
            >
              ← 메인으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-800"
        >
          ←
        </button>
        <span className="text-lg">{subjectLabel.icon}</span>
        <h1 className="text-lg font-bold text-gray-800">{subjectLabel.name} 퀴즈 설정</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* 이름 입력 */}
        {!showNameModal && <div className="bg-white rounded-2xl shadow-sm p-5">
          {syncStatus === 'synced' ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide shrink-0">이름</span>
                <span className="text-xl font-bold text-blue-600 tracking-widest truncate">{playerName || '—'}</span>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text}`}>
                  {level.icon} {level.label}
                </span>
              </div>
              <button
                onClick={() => { disconnectCloud(); setShowNameModal(true); }}
                className="shrink-0 px-3 py-2 rounded-xl border-2 border-red-500 bg-white text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white active:scale-95 transition-all flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                동기화 중지
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                이름 (선택)
              </h2>
              <div className="flex gap-2 min-w-0">
                <input
                  type="text"
                  placeholder="이름을 입력하면 기록이 저장됨"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key !== 'Enter') return;
                    const trimmed = playerName.trim();
                    if (!trimmed || syncStatus === 'syncing') return;
                    localStorage.setItem('playerName', trimmed);
                    await loadFromCloud(trimmed);
                  }}
                  maxLength={12}
                  className="min-w-0 w-0 flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-base focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={async () => {
                    const trimmed = playerName.trim();
                    if (!trimmed) return;
                    localStorage.setItem('playerName', trimmed);
                    await loadFromCloud(trimmed);
                  }}
                  disabled={!playerName.trim() || syncStatus === 'syncing'}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {syncStatus === 'syncing' ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95A5.469 5.469 0 0 1 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11A2.98 2.98 0 0 1 22 15c0 1.65-1.35 3-3 3zm-5.55-8h-2.9v3H8l4 4 4-4h-2.55V10z"/>
                    </svg>
                  )}
                  동기화
                </button>
              </div>
            </>
          )}
        </div>}

        {/* 모드 선택 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            출제 모드
          </h2>
          <div className="space-y-3">
            {[
              {
                value: 'random',
                label: '랜덤 모드',
                desc: `전체 ${maxCount}문제에서 무작위 출제`,
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 fill-current">
                    <path d="M342.5-257.5Q360-275 360-300t-17.5-42.5Q325-360 300-360t-42.5 17.5Q240-325 240-300t17.5 42.5Q275-240 300-240t42.5-17.5Zm0-360Q360-635 360-660t-17.5-42.5Q325-720 300-720t-42.5 17.5Q240-685 240-660t17.5 42.5Q275-600 300-600t42.5-17.5Zm180 180Q540-455 540-480t-17.5-42.5Q505-540 480-540t-42.5 17.5Q420-505 420-480t17.5 42.5Q455-420 480-420t42.5-17.5Zm180 180Q720-275 720-300t-17.5-42.5Q685-360 660-360t-42.5 17.5Q600-325 600-300t17.5 42.5Q635-240 660-240t42.5-17.5Zm0-360Q720-635 720-660t-17.5-42.5Q685-720 660-720t-42.5 17.5Q600-685 600-660t17.5 42.5Q635-600 660-600t42.5-17.5ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                  </svg>
                ),
              },
              {
                value: 'yearly',
                label: '년도별 모드',
                desc: '특정 연도/회차 문제 출제',
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
                  </svg>
                ),
              },
              {
                value: 'wrong',
                label: '오답 노트 모드',
                desc: `틀린 문제만 출제 (${wrongCount}문제)`,
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 fill-current">
                    <path d="M280-280h84l240-238-86-86-238 238v86Zm352-266 42-44q6-6 6-14t-6-14l-56-56q-6-6-14-6t-14 6l-44 42 86 86ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm301.5-598.5Q510-807 510-820t-8.5-21.5Q493-850 480-850t-21.5 8.5Q450-833 450-820t8.5 21.5Q467-790 480-790t21.5-8.5ZM200-200v-560 560Z" />
                  </svg>
                ),
                disabled: wrongCount === 0,
              },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => !opt.disabled && setMode(opt.value as QuizMode)}
                disabled={opt.disabled}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  mode === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : opt.disabled
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <span className={mode === opt.value ? 'text-blue-600' : 'text-gray-400'}>{opt.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
                <div className="ml-auto">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mode === opt.value ? 'border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    {mode === opt.value && (
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 년도/회차 선택 (yearly 모드) */}
        {mode === 'yearly' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              연도 및 회차
            </h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">연도</label>
                <select
                  value={year}
                  onChange={(e) => { const y = Number(e.target.value); setYear(y); if (YEAR_MAX_SESSION[y]) setSession(1); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">회차</label>
                <select
                  value={session}
                  onChange={(e) => setSession(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1회</option>
                  <option value={2} disabled={!!YEAR_MAX_SESSION[year]}>2회</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 문제 수 선택 */}
        {mode !== 'yearly' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              문제 수
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {(mode === 'wrong' ? availableCounts : ALL_COUNTS).map((c) => {
                const disabled = !availableCounts.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => !disabled && setCount(c)}
                    disabled={disabled}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      effectiveCount === c
                        ? 'bg-blue-600 text-white shadow-md'
                        : disabled
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 시작 버튼 */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={handleStart}
          disabled={effectiveCount === 0}
          className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          퀴즈 시작 →
        </button>
      </div>
      {!showNameModal && <BottomNav />}
    </div>
  );
}
