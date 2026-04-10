import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';
import { useRecordStore } from '../store/recordStore';
import { useDataStore } from '../store/dataStore';
import { formatTime } from '../hooks/useTimer';
import CircleProgress from '../components/CircleProgress';
import QuestionImage from '../components/QuestionImage';
import type { LeaderboardEntry, SessionHistory } from '../types';

const CIRCLE = ['①', '②', '③', '④'];

const SUBJECT_LABEL: Record<string, string> = {
  korean_history: '한국사',
  korean_language: '국어',
  math: '수학',
  english: '영어',
  social_studies: '사회',
  science: '과학',
  ethics: '도덕',
};

function getGrade(percent: number) {
  if (percent >= 90) return { label: 'A+', emoji: '🏆', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' };
  if (percent >= 80) return { label: 'A',  emoji: '🥇', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' };
  if (percent >= 70) return { label: 'B',  emoji: '🥈', color: 'text-green-600',  bg: 'bg-green-50 border-green-200' };
  if (percent >= 60) return { label: 'C',  emoji: '🥉', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' };
  return                     { label: 'F',  emoji: '💪', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' };
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { questions, answers, startTime, mode, settings, startQuiz, resetQuiz } = useQuizStore();
  const { addLeaderboardEntry, addHistory } = useRecordStore();
  const { questions: questionsBySubject } = useDataStore();
  const allQuestions = [...questionsBySubject.korean_history, ...questionsBySubject.korean_language, ...questionsBySubject.social_studies, ...questionsBySubject.science, ...questionsBySubject.ethics, ...questionsBySubject.english, ...questionsBySubject.math];

  const [nickname, setNickname] = useState(() => settings.playerName ?? localStorage.getItem('playerName') ?? '');
  const [saved, setSaved] = useState(false);
  const [openWrong, setOpenWrong] = useState<string | null>(null);
  const savedRef = useRef(false);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const total = questions.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const grade = getGrade(percent);
  const wrongAnswers = answers.filter((a) => !a.isCorrect);

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/');
      return;
    }
    if (savedRef.current) return;
    savedRef.current = true;

    const session: SessionHistory = {
      id: Date.now().toString(),
      mode,
      score: correctCount,
      total: questions.length,
      timeSeconds: elapsed,
      date: new Date().toISOString(),
      subject: settings.subject,
    };
    addHistory(session);

    // 이름이 있으면 자동 리더보드 등록
    const name = settings.playerName?.trim();
    if (name) {
      const entry: LeaderboardEntry = {
        id: Date.now().toString(),
        nickname: name,
        score: correctCount,
        total: questions.length,
        percent,
        timeSeconds: elapsed,
        mode,
        date: new Date().toISOString(),
        subject: settings.subject,
      };
      addLeaderboardEntry(entry);
      setSaved(true);
    }
  }, [questions.length, navigate, addHistory, addLeaderboardEntry, mode, correctCount, elapsed, percent, settings.playerName]);

  if (questions.length === 0) return null;

  const handleSaveLeaderboard = () => {
    if (!nickname.trim() || saved) return;
    const entry: LeaderboardEntry = {
      id: Date.now().toString(),
      nickname: nickname.trim(),
      score: correctCount,
      total,
      percent,
      timeSeconds: elapsed,
      mode,
      date: new Date().toISOString(),
      subject: settings.subject,
    };
    addLeaderboardEntry(entry);
    setSaved(true);
  };

  const handleRetry = () => {
    startQuiz(questions, mode, settings);
    navigate('/quiz');
  };

  const handleWrongOnly = () => {
    const wrongIds = new Set(wrongAnswers.map((a) => a.questionId));
    const wrongQs = allQuestions.filter((q) => wrongIds.has(q.id));
    if (wrongQs.length === 0) return;
    startQuiz(wrongQs, 'wrong', { count: wrongQs.length, subject: settings.subject });
    navigate('/quiz');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 점수 카드 */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-6 pt-10 pb-8">
        <div className="text-center">
          {settings.subject && (
            <p className="text-white text-2xl font-black mb-1 tracking-wide">{SUBJECT_LABEL[settings.subject]}</p>
          )}
          <p className="text-blue-200 text-sm mb-4">퀴즈 완료!</p>
          <div className="flex items-center justify-center gap-6">
            <CircleProgress
              percent={percent}
              size={110}
              strokeWidth={9}
              color="#fff"
              trackColor="rgba(255,255,255,0.2)"
              textColor="#fff"
            />
            <div className="text-left">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border mb-2 ${grade.bg}`}>
                <span className="text-xl">{grade.emoji}</span>
                <span className={`text-2xl font-bold ${grade.color}`}>{grade.label}</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-bold text-white">{correctCount}</span>
                <span className="text-xl text-blue-300 pb-1">/ {total}</span>
              </div>
              <p className="text-blue-200 text-sm mt-1">{formatTime(elapsed)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 리더보드 등록 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">🏆 리더보드 등록</h2>
          {saved ? (
            <p className="text-center text-green-600 font-medium py-2">
              <span className="font-bold">{nickname}</span> 으로 저장 완료! ✓
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="text"
                placeholder="닉네임 입력"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveLeaderboard()}
                maxLength={10}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSaveLeaderboard}
                disabled={!nickname.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                저장
              </button>
            </div>
          )}
        </div>

        {/* 틀린 문제 */}
        {wrongAnswers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              ❌ 틀린 문제 ({wrongAnswers.length}개)
            </h2>
            <div className="space-y-2">
              {wrongAnswers.map((a) => {
                const q = questions.find((q) => q.id === a.questionId);
                if (!q) return null;
                const isOpen = openWrong === a.questionId;
                return (
                  <div key={a.questionId} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenWrong(isOpen ? null : a.questionId)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <span className="text-sm font-semibold text-gray-700">
                          {q.year}년 {q.session}회 {q.number}번
                        </span>
                        <div className="flex gap-2 mt-0.5 text-xs">
                          <span className="text-red-500">
                            내 답: {CIRCLE[a.selected - 1]}
                          </span>
                          <span className="text-green-600">
                            정답:{' '}
                            {Array.isArray(a.correctAnswer)
                              ? a.correctAnswer.map((n) => CIRCLE[n - 1]).join(', ')
                              : CIRCLE[a.correctAnswer - 1]}
                          </span>
                        </div>
                      </div>
                      <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2">
                        <QuestionImage src={q.image} alt={`${q.id} 문제`} />
                        {q.explanation && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                            <span className="font-semibold text-blue-600">💡 해설</span>
                            <p className="mt-1">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleRetry}
            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            다시 풀기
          </button>
          {wrongAnswers.length > 0 && (
            <button
              onClick={handleWrongOnly}
              className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 active:scale-95 transition-all"
            >
              오답만 풀기
            </button>
          )}
        </div>
        <button
          onClick={() => { resetQuiz(); navigate('/'); }}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
        >
          메인으로
        </button>
      </div>
    </div>
  );
}
