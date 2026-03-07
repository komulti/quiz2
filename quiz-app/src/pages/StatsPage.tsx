import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';
import { formatTime } from '../hooks/useTimer';

const SUBJECT_INFO: { label: string; prefix: string; color: string }[] = [
  { label: '국어',  prefix: 'kl_',    color: 'bg-green-500' },
  { label: '수학',  prefix: 'math_',  color: 'bg-orange-500' },
  { label: '영어',  prefix: 'en_',    color: 'bg-sky-500' },
  { label: '사회',  prefix: 'ss_',    color: 'bg-yellow-500' },
  { label: '과학',  prefix: 'sci_',   color: 'bg-purple-500' },
  { label: '한국사', prefix: '',       color: 'bg-blue-500' },
  { label: '도덕',  prefix: 'eth_',   color: 'bg-rose-500' },
];

function getSubjectPrefix(questionId: string): string {
  if (questionId.startsWith('kl_'))   return 'kl_';
  if (questionId.startsWith('math_')) return 'math_';
  if (questionId.startsWith('en_'))   return 'en_';
  if (questionId.startsWith('ss_'))   return 'ss_';
  if (questionId.startsWith('sci_'))  return 'sci_';
  if (questionId.startsWith('eth_'))  return 'eth_';
  return '';
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

const MODE_LABEL: Record<string, string> = {
  random: '랜덤',
  yearly: '년도별',
  wrong:  '오답',
};

export default function StatsPage() {
  const navigate = useNavigate();
  const { history, wrongNotes } = useRecordStore();

  const totalSessions = history.length;
  const totalQuestions = history.reduce((s, h) => s + h.total, 0);
  const avgPercent =
    totalSessions > 0
      ? Math.round(history.reduce((s, h) => s + (h.score / h.total) * 100, 0) / totalSessions)
      : 0;
  const streak = calcStreak(history.map((h) => h.date));

  // 과목별 오답 집계
  const wrongBySubject = SUBJECT_INFO.map((s) => ({
    ...s,
    count: wrongNotes.filter((n) => getSubjectPrefix(n.questionId) === s.prefix).length,
  }));
  const maxWrong = Math.max(...wrongBySubject.map((s) => s.count), 1);

  // 최근 7개 기록
  const recent = history.slice(0, 7);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">←</button>
        <h1 className="text-lg font-bold text-gray-800">📊 학습 통계</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* 핵심 지표 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '총 퀴즈', value: totalSessions, unit: '회' },
            { label: '평균 정답률', value: avgPercent, unit: '%' },
            { label: '풀이 문항', value: totalQuestions, unit: '문제' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{item.value}<span className="text-sm font-normal text-gray-400">{item.unit}</span></p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* 연속 학습 스트릭 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-3xl">
            🔥
          </div>
          <div>
            <p className="text-sm text-gray-500">연속 학습일</p>
            <p className="text-3xl font-bold text-orange-500">
              {streak}<span className="text-base font-normal text-gray-400"> 일</span>
            </p>
          </div>
          {streak >= 3 && (
            <div className="ml-auto text-sm font-semibold text-orange-400">
              {streak >= 7 ? '🏆 일주일 달성!' : streak >= 5 ? '💪 5일 연속!' : '👍 유지 중!'}
            </div>
          )}
        </div>

        {/* 과목별 오답 현황 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">📌 과목별 오답 현황</h2>
          {wrongNotes.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">오답 기록이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {wrongBySubject
                .filter((s) => s.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-10 shrink-0">{s.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${s.color}`}
                        style={{ width: `${(s.count / maxWrong) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">{s.count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 최근 퀴즈 기록 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">📈 최근 퀴즈 기록</h2>
          {recent.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">퀴즈 기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {recent.map((h) => {
                const pct = Math.round((h.score / h.total) * 100);
                const color =
                  pct >= 90 ? 'text-yellow-500' :
                  pct >= 70 ? 'text-green-500' :
                  pct >= 60 ? 'text-blue-500' : 'text-gray-400';
                return (
                  <div key={h.id} className="flex items-center gap-3 py-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {MODE_LABEL[h.mode] ?? h.mode}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(h.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-300">{formatTime(h.timeSeconds)}</span>
                      </div>
                      <div className="mt-1.5 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90 ? 'bg-yellow-400' :
                            pct >= 70 ? 'bg-green-400' :
                            pct >= 60 ? 'bg-blue-400' : 'bg-gray-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${color} w-14 text-right`}>
                      {h.score}<span className="text-xs font-normal text-gray-400">/{h.total}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
