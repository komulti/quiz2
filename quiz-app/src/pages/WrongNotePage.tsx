import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';
import { useDataStore } from '../store/dataStore';
import { useQuizStore } from '../store/quizStore';

const CIRCLE = ['①', '②', '③', '④'];

export default function WrongNotePage() {
  const navigate = useNavigate();
  const { wrongNotes, removeWrongNote, clearWrongNotes } = useRecordStore();
  const { questions: allQuestions } = useDataStore();
  const { startQuiz } = useQuizStore();

  const [openId, setOpenId] = useState<string | null>(null);

  const wrongWithQuestion = wrongNotes
    .map((note) => ({
      note,
      question: allQuestions.find((q) => q.id === note.questionId),
    }))
    .filter((item) => item.question !== undefined);

  const handleStartWrong = () => {
    const wrongIds = new Set(wrongNotes.map((n) => n.questionId));
    const pool = allQuestions.filter((q) => wrongIds.has(q.id));
    if (pool.length === 0) return;
    startQuiz(pool, 'wrong', { count: pool.length });
    navigate('/quiz');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">←</button>
          <h1 className="text-lg font-bold text-gray-800">📝 오답노트</h1>
        </div>
        {wrongNotes.length > 0 && (
          <button
            onClick={() => {
              if (confirm('오답노트를 전부 삭제할까요?')) clearWrongNotes();
            }}
            className="text-sm text-red-400 hover:text-red-600"
          >
            전체 삭제
          </button>
        )}
      </div>

      {wrongNotes.length > 0 && (
        <div className="px-4 pt-4">
          <button
            onClick={handleStartWrong}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 active:scale-95 transition-all"
          >
            오답 {wrongNotes.length}개 풀기 →
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {wrongWithQuestion.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>오답노트가 비어있습니다</p>
            <p className="text-sm mt-1">퀴즈를 풀면 틀린 문제가 자동 저장됩니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wrongWithQuestion.map(({ note, question: q }) => {
              if (!q) return null;
              const isOpen = openId === note.questionId;
              return (
                <div key={note.questionId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => setOpenId(isOpen ? null : note.questionId)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-700">
                          {q.year}년 {q.session}회 {q.number}번
                        </p>
                        {note.playerName && (
                          <span className="text-xs bg-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                            {note.playerName}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs">
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
                    <div className="px-3 pb-3">
                      <img
                        src={`${import.meta.env.BASE_URL}data/${q.image}`}
                        alt={`${q.id} 문제`}
                        className="w-full rounded-lg object-contain bg-gray-50 border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
