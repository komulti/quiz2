import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import { useQuizStore } from '../store/quizStore';
import { useRecordStore } from '../store/recordStore';
import type { Question, QuizMode, QuizSettings, Subject } from '../types';

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const BASE_COUNTS = [10, 25, 50, 100, 200];

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
  const { wrongNotes, loadFromCloud } = useRecordStore();

  const [mode, setMode] = useState<QuizMode>('random');
  const [year, setYear] = useState(2025);
  const [session, setSession] = useState(1);
  const [count, setCount] = useState(10);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') ?? '');

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
    if (mode === 'wrong') return ALL_COUNTS.filter((c) => c <= wrongCount);
    return ALL_COUNTS.filter((c) => c <= maxCount);
  };

  const availableCounts = getAvailableCounts();
  const effectiveCount =
    availableCounts.includes(count) ? count : availableCounts[availableCounts.length - 1] ?? 0;

  const handleStart = async () => {
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
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            이름 (선택)
          </h2>
          <input
            type="text"
            placeholder="이름을 입력하면 오답노트에 표시됩니다"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={12}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 모드 선택 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            출제 모드
          </h2>
          <div className="space-y-3">
            {[
              { value: 'random', label: '랜덤 모드', desc: '전체 400문제에서 무작위 출제', icon: '🎲' },
              { value: 'yearly', label: '년도별 모드', desc: '특정 연도/회차 문제 출제', icon: '📅' },
              {
                value: 'wrong',
                label: '오답 노트 모드',
                desc: `틀린 문제만 출제 (${wrongCount}문제)`,
                icon: '📝',
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
                <span className="text-2xl">{opt.icon}</span>
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
                  onChange={(e) => setYear(Number(e.target.value))}
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
                  <option value={2}>2회</option>
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
              {ALL_COUNTS.map((c) => {
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
    </div>
  );
}
