import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';
import BottomNav from '../components/BottomNav';
import { useDataStore } from '../store/dataStore';
import { useQuizStore } from '../store/quizStore';
import ConfirmModal from '../components/ConfirmModal';
import QuestionImage from '../components/QuestionImage';

const CIRCLE = ['①', '②', '③', '④'];

type TabSubject = 'all' | 'korean_history' | 'korean_language' | 'social_studies' | 'science' | 'ethics' | 'english' | 'math';

const TABS: { id: TabSubject; label: string; prefix: string | null }[] = [
  { id: 'all',             label: '전체',  prefix: null },
  { id: 'korean_language', label: '국어',  prefix: 'kl_' },
  { id: 'math',            label: '수학',  prefix: 'math_' },
  { id: 'english',         label: '영어',  prefix: 'en_' },
  { id: 'social_studies',  label: '사회',  prefix: 'ss_' },
  { id: 'science',         label: '과학',  prefix: 'sci_' },
  { id: 'korean_history',  label: '한국사', prefix: 'kh_' },
  { id: 'ethics',          label: '도덕',  prefix: 'eth_' },
];

function getSubjectLabel(questionId: string): { text: string; color: string } {
  if (questionId.startsWith('kl_'))  return { text: '국어',  color: 'bg-green-100 text-green-700' };
  if (questionId.startsWith('ss_'))  return { text: '사회',  color: 'bg-yellow-100 text-yellow-700' };
  if (questionId.startsWith('sci_')) return { text: '과학',  color: 'bg-purple-100 text-purple-700' };
  if (questionId.startsWith('eth_')) return { text: '도덕',  color: 'bg-rose-100 text-rose-700' };
  if (questionId.startsWith('en_'))   return { text: '영어',  color: 'bg-sky-100 text-sky-700' };
  if (questionId.startsWith('math_')) return { text: '수학',  color: 'bg-orange-100 text-orange-700' };
  return { text: '한국사', color: 'bg-blue-100 text-blue-700' };
}

function matchesTab(questionId: string, tab: TabSubject): boolean {
  if (tab === 'all') return true;
  if (tab === 'korean_history') return !questionId.startsWith('kl_') && !questionId.startsWith('ss_') && !questionId.startsWith('sci_') && !questionId.startsWith('eth_') && !questionId.startsWith('en_') && !questionId.startsWith('math_');
  if (tab === 'korean_language') return questionId.startsWith('kl_');
  if (tab === 'social_studies') return questionId.startsWith('ss_');
  if (tab === 'science') return questionId.startsWith('sci_');
  if (tab === 'ethics') return questionId.startsWith('eth_');
  if (tab === 'english') return questionId.startsWith('en_');
  if (tab === 'math') return questionId.startsWith('math_');
  return true;
}

export default function WrongNotePage() {
  const navigate = useNavigate();
  const { wrongNotes, removeWrongNote, clearWrongNotes, loadFromCloud, syncStatus } = useRecordStore();
  const { questions: questionsBySubject } = useDataStore();
  const allQuestions = [...questionsBySubject.korean_history, ...questionsBySubject.korean_language, ...questionsBySubject.social_studies, ...questionsBySubject.science, ...questionsBySubject.ethics, ...questionsBySubject.english, ...questionsBySubject.math];
  const { startQuiz } = useQuizStore();

  const [openId, setOpenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabSubject>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const nickname = localStorage.getItem('playerName')?.trim();
    if (nickname && syncStatus !== 'syncing') {
      loadFromCloud(nickname);
    }
  }, []);

  const wrongWithQuestion = wrongNotes
    .map((note) => ({
      note,
      question: allQuestions.find((q) => q.id === note.questionId),
    }))
    .filter((item) => item.question !== undefined);

  const filtered = wrongWithQuestion.filter(({ note }) => matchesTab(note.questionId, activeTab)).reverse();

  const handleStartWrong = () => {
    const pool = allQuestions.filter((q) =>
      filtered.some(({ note }) => note.questionId === q.id)
    );
    if (pool.length === 0) return;
    startQuiz(pool, 'wrong', { count: pool.length });
    navigate('/quiz');
  };

  const tabCount = (tab: TabSubject) =>
    wrongWithQuestion.filter(({ note }) => matchesTab(note.questionId, tab)).length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {showClearConfirm && (
        <ConfirmModal
          message="오답노트를 전부 삭제할까요?"
          subMessage="삭제된 기록은 복구할 수 없습니다"
          onConfirm={() => { clearWrongNotes(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">←</button>
          <h1 className="text-lg font-bold text-gray-800">📝 오답노트</h1>
        </div>
        {wrongNotes.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-sm text-red-400 hover:text-red-600"
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* 과목 탭 */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const count = tabCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setOpenId(null); }}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="px-4 pt-4">
          <button
            onClick={handleStartWrong}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 active:scale-95 transition-all"
          >
            오답 {filtered.length}개 풀기 →
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>오답노트가 비어있습니다</p>
            <p className="text-sm mt-1">퀴즈를 풀면 틀린 문제가 자동 저장됩니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(({ note, question: q }) => {
              if (!q) return null;
              const isOpen = openId === note.questionId;
              return (
                <div key={note.questionId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => setOpenId(isOpen ? null : note.questionId)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const subj = getSubjectLabel(note.questionId);
                          return (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subj.color}`}>
                              {subj.text}
                            </span>
                          );
                        })()}
                        <p className="text-sm font-semibold text-gray-700">
                          {q.year}년 {q.session}회 {q.number}번
                        </p>
                        {note.playerName && (
                          <span className="text-xs bg-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                            {note.playerName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs pl-1">
                        <span className="text-red-500">
                          내 답: {CIRCLE[note.selectedAnswer - 1]}
                        </span>
                        <span className="text-green-600">
                          정답:{' '}
                          {Array.isArray(note.correctAnswer)
                            ? note.correctAnswer.map((n) => CIRCLE[n - 1]).join(', ')
                            : CIRCLE[note.correctAnswer - 1]}
                        </span>
                      </div>
                    </button>
                    {note.date && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(note.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).replace(/(\d+년 \d+월 \d+일) (.+)/, '$1($2)')}
                      </span>
                    )}
                    <button
                      onClick={() => removeWrongNote(note.questionId)}
                      className="text-gray-300 hover:text-red-400 px-2 py-1 text-lg"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                    <button
                      onClick={() => setOpenId(isOpen ? null : note.questionId)}
                      className="text-gray-400 px-1"
                    >
                      {isOpen ? '▲' : '▼'}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-3">
                      {q.passageImage && (() => {
                        const isPassage = /pass_(22_23|24_25)\./.test(q.passageImage!);
                        return isPassage ? (
                          <div className="bg-blue-50 rounded-2xl shadow-sm p-3 border border-blue-100">
                            <p className="text-xs text-blue-500 font-semibold mb-2 select-none">📄 지문</p>
                            <QuestionImage
                              src={q.passageImage!}
                              alt={`${q.year}년 ${q.session}회 지문`}
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-2xl shadow-sm p-3 border border-gray-100">
                            <QuestionImage
                              src={q.passageImage!}
                              alt={`${q.year}년 ${q.session}회 지시문`}
                            />
                          </div>
                        );
                      })()}
                      <QuestionImage src={q.image} alt={`${q.id} 문제`} />
                      {q.explanation && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                          <p className="text-xs font-bold text-blue-600 mb-1.5">📖 해설</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
