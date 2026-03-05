import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';
import { useRecordStore } from '../store/recordStore';
import { useTimer, formatTime } from '../hooks/useTimer';
import QuestionImage from '../components/QuestionImage';
import ConfirmModal from '../components/ConfirmModal';

const CIRCLE = ['①', '②', '③', '④'];

export default function QuizPage() {
  const navigate = useNavigate();
  const {
    questions,
    currentIndex,
    isFinished,
    currentAnswer,
    settings,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  } = useQuizStore();

  const { addWrongNotes, removeWrongNote } = useRecordStore();
  const { elapsed } = useTimer(!isFinished && questions.length > 0);

  // 슬라이드 애니메이션 키
  const [slideKey, setSlideKey] = useState(0);
  const [feedbackAnim, setFeedbackAnim] = useState<'correct' | 'wrong' | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (questions.length === 0) navigate('/');
  }, [questions.length, navigate]);

  useEffect(() => {
    if (isFinished) navigate('/result');
  }, [isFinished, navigate]);

  // 정답 제출 후 애니메이션 + 즉시 오답노트 저장
  useEffect(() => {
    if (!currentAnswer) return;
    setFeedbackAnim(currentAnswer.isCorrect ? 'correct' : 'wrong');
    const id = setTimeout(() => setFeedbackAnim(null), 450);

    if (currentAnswer.isCorrect) {
      removeWrongNote(currentAnswer.questionId);
    } else {
      addWrongNotes([{
        questionId: currentAnswer.questionId,
        selectedAnswer: currentAnswer.selected,
        correctAnswer: currentAnswer.correctAnswer,
        date: new Date().toISOString(),
        playerName: settings.playerName,
      }]);
    }

    return () => clearTimeout(id);
  }, [currentAnswer]); // eslint-disable-line

  const handleNext = useCallback(() => {
    setSlideKey((k) => k + 1);
    nextQuestion();
  }, [nextQuestion]);

  const handleExit = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const question = questions[currentIndex] ?? null;

  // 키보드 네비게이션
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question) return;
      if (['1', '2', '3', '4'].includes(e.key) && !currentAnswer) {
        submitAnswer(question.id, Number(e.key));
      }
      if ((e.key === 'Enter' || e.key === ' ') && currentAnswer) {
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentAnswer, question, submitAnswer, handleNext]); // eslint-disable-line

  if (questions.length === 0) return null;
  if (!question) return null;

  const total = questions.length;
  const progress = ((currentIndex + (currentAnswer ? 1 : 0)) / total) * 100;

  // 다음 문제 이미지 프리로드
  const nextQ = questions[currentIndex + 1];
  if (nextQ) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = `${import.meta.env.BASE_URL}data/${nextQ.image}`;
  }

  const getButtonClass = (optNum: number) => {
    const base =
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-left transition-colors min-h-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

    if (!currentAnswer) {
      return `${base} border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-95`;
    }

    const answer = question.answer;
    const isCorrectOption = Array.isArray(answer)
      ? answer.includes(optNum)
      : answer === optNum;
    const isSelected = currentAnswer.selected === optNum;

    if (isCorrectOption) {
      return `${base} border-green-500 bg-green-500 text-white ${isSelected ? 'animate-bounce-once' : ''}`;
    }
    if (isSelected) {
      return `${base} border-red-500 bg-red-500 text-white animate-shake`;
    }
    return `${base} border-gray-200 bg-gray-50 text-gray-400`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExit}
              className="text-gray-400 hover:text-gray-600 p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="퀴즈 종료"
            >
              ✕
            </button>
            <span className="text-sm font-bold text-gray-700">
              {currentIndex + 1}
              <span className="text-gray-400"> / {total}</span>
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {question.year}년 {question.session}회 {question.number}번
          </span>
          <span className="text-sm font-mono font-semibold text-gray-600">
            {formatTime(elapsed)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 문제 영역 (슬라이드 in) */}
      <div key={slideKey} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 slide-in">
        {/* 이미지 카드 */}
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <QuestionImage
            src={question.image}
            alt={`${question.year}년 ${question.session}회 ${question.number}번 문제`}
          />
        </div>

        {/* 선택지 */}
        <div className="space-y-2" role="group" aria-label="선택지">
          {question.options.map((opt) => (
            <button
              key={opt.number}
              onClick={() => !currentAnswer && submitAnswer(question.id, opt.number)}
              disabled={!!currentAnswer}
              aria-label={`${CIRCLE[opt.number - 1]} ${opt.text || `선택지 ${opt.number}`}`}
              aria-pressed={currentAnswer?.selected === opt.number}
              className={getButtonClass(opt.number)}
            >
              <span className="text-lg w-7 flex-shrink-0 text-center select-none">
                {CIRCLE[opt.number - 1]}
              </span>
              <span className="flex-1 text-sm leading-snug">
                {opt.text || `선택지 ${opt.number}`}
              </span>
              {currentAnswer && (() => {
                const answer = question.answer;
                const isCorrectOption = Array.isArray(answer)
                  ? answer.includes(opt.number)
                  : answer === opt.number;
                const isSelected = currentAnswer.selected === opt.number;
                if (isCorrectOption) return <span className="text-lg">✓</span>;
                if (isSelected) return <span className="text-lg">✗</span>;
                return null;
              })()}
            </button>
          ))}
        </div>

        {/* 피드백 배너 */}
        {currentAnswer && (
          <div
            className={`rounded-xl p-3 text-center font-semibold animate-countup ${
              currentAnswer.isCorrect
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span className="text-xl mr-1">
              {currentAnswer.isCorrect ? '✅' : '❌'}
            </span>
            {currentAnswer.isCorrect ? '정답!' : '오답!'}
            {!currentAnswer.isCorrect && (
              <p className="text-sm font-normal mt-0.5 text-gray-600">
                정답:{' '}
                {Array.isArray(currentAnswer.correctAnswer)
                  ? currentAnswer.correctAnswer.map((n) => CIRCLE[n - 1]).join(', ')
                  : CIRCLE[currentAnswer.correctAnswer - 1]}
              </p>
            )}
          </div>
        )}

        {/* 키보드 힌트 */}
        {!currentAnswer && (
          <p className="text-center text-xs text-gray-300 select-none">
            키보드 1 · 2 · 3 · 4 로 선택
          </p>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
        {currentAnswer ? (
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={currentIndex + 1 < total ? '다음 문제' : '결과 보기'}
          >
            {currentIndex + 1 < total ? '다음 문제 →' : '결과 보기 →'}
          </button>
        ) : (
          <div className="py-4 text-center text-gray-400 text-sm select-none">
            선택지를 선택하세요
          </div>
        )}
      </div>

      {/* 숨겨진 피드백 용 dummy (eslint) */}
      <span className="sr-only">{feedbackAnim}</span>

      {showExitModal && (
        <ConfirmModal
          message="퀴즈를 그만할까요?"
          subMessage="지금까지의 기록은 저장되지 않습니다"
          confirmLabel="그만하기"
          cancelLabel="계속 풀기"
          onConfirm={() => { resetQuiz(); navigate('/'); }}
          onCancel={() => setShowExitModal(false)}
        />
      )}
    </div>
  );
}
