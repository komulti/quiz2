import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../store/recordStore';
import { formatTime } from '../hooks/useTimer';
import ConfirmModal from '../components/ConfirmModal';
import BottomNav from '../components/BottomNav';
import type { Subject } from '../types/index';

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

/* ── 과목 메타 ─────────────────────────────────── */
const SUBJECT_INFO: { label: string; prefix: string; color: string; subject: Subject }[] = [
  { label: '국어',  prefix: 'kl_',   color: 'bg-green-500',  subject: 'korean_language' },
  { label: '수학',  prefix: 'math_', color: 'bg-orange-500', subject: 'math' },
  { label: '영어',  prefix: 'en_',   color: 'bg-sky-500',    subject: 'english' },
  { label: '사회',  prefix: 'ss_',   color: 'bg-yellow-500', subject: 'social_studies' },
  { label: '과학',  prefix: 'sci_',  color: 'bg-purple-500', subject: 'science' },
  { label: '한국사',prefix: '',      color: 'bg-blue-500',   subject: 'korean_history' },
  { label: '도덕',  prefix: 'eth_',  color: 'bg-rose-500',   subject: 'ethics' },
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
    if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}

const MODE_LABEL: Record<string, string> = { random: '랜덤', yearly: '년도별', wrong: '오답' };

/* ── 레벨 시스템 ───────────────────────────────── */
const LEVELS = [
  { min: 0,    max: 49,   label: '입문자',  icon: '🌱', color: 'text-gray-500',   bar: 'bg-gray-400'   },
  { min: 50,   max: 149,  label: '학습자',  icon: '📖', color: 'text-green-600',  bar: 'bg-green-500'  },
  { min: 150,  max: 299,  label: '중급자',  icon: '✏️', color: 'text-blue-600',   bar: 'bg-blue-500'   },
  { min: 300,  max: 499,  label: '고수',    icon: '🎯', color: 'text-purple-600', bar: 'bg-purple-500' },
  { min: 500,  max: 999,  label: '실력자',  icon: '🏆', color: 'text-yellow-600', bar: 'bg-yellow-500' },
  { min: 1000, max: Infinity, label: '합격왕', icon: '👑', color: 'text-orange-500', bar: 'bg-orange-500' },
];

function getLevel(total: number) {
  const lv = LEVELS.findIndex((l) => total >= l.min && total <= l.max);
  const level = LEVELS[lv];
  const next = LEVELS[lv + 1];
  const progress = next
    ? ((total - level.min) / (next.min - level.min)) * 100
    : 100;
  return { level, lv: lv + 1, next, progress: Math.min(progress, 100) };
}

/* ── 뱃지/업적 ──────────────────────────────────── */
interface BadgeDef {
  id: string; icon: string; name: string; desc: string;
  check: (ctx: BadgeCtx) => boolean;
}
interface BadgeCtx {
  history: { score: number; total: number; mode: string; subject?: string; timeSeconds: number; date: string }[];
  wrongNotes: { questionId: string }[];
  streak: number;
  totalQ: number;
  avgPct: number;
}
const BADGES: BadgeDef[] = [
  { id: 'first',     icon: '🎯', name: '첫 걸음',    desc: '첫 퀴즈 완료',           check: (c) => c.history.length >= 1 },
  { id: 'perfect',   icon: '💯', name: '첫 만점',    desc: '100% 정답률 달성',        check: (c) => c.history.some((h) => h.score === h.total && h.total >= 5) },
  { id: 'streak3',   icon: '🔥', name: '3일 연속',   desc: '3일 연속 학습',           check: (c) => c.streak >= 3 },
  { id: 'streak7',   icon: '🌟', name: '7일 연속',   desc: '7일 연속 학습',           check: (c) => c.streak >= 7 },
  { id: 'q100',      icon: '📚', name: '100문제',    desc: '총 100문제 풀기',          check: (c) => c.totalQ >= 100 },
  { id: 'q500',      icon: '🎖️', name: '500문제',   desc: '총 500문제 풀기',          check: (c) => c.totalQ >= 500 },
  { id: 'wrongmode', icon: '📝', name: '오답 정복',  desc: '오답노트 모드로 풀기',     check: (c) => c.history.some((h) => h.mode === 'wrong') },
  { id: 'allsubj',   icon: '🎓', name: '전과목 도전',desc: '모든 과목 1회 이상 풀기',  check: (c) => {
    const subjects = ['korean_language','math','english','social_studies','science','korean_history','ethics'];
    return subjects.every((s) => c.history.some((h) => h.subject === s));
  }},
  { id: 'speed',     icon: '⚡', name: '스피드',     desc: '25문제 5분 이내 완료',     check: (c) => c.history.some((h) => h.total >= 25 && h.timeSeconds <= 300) },
  { id: 'top',       icon: '🏅', name: '상위권',     desc: '평균 정답률 90% 이상',     check: (c) => c.avgPct >= 90 && c.history.length >= 5 },
];

/* ── 과목별 숙련도 ──────────────────────────────── */
const PROF_LEVELS = ['입문', '기초', '중급', '고급', '달인'];
const PROF_COLORS = ['bg-gray-300', 'bg-green-400', 'bg-blue-400', 'bg-purple-500', 'bg-yellow-500'];
function getProficiency(sessions: { score: number; total: number }[]) {
  if (sessions.length === 0) return { xp: 0, profLv: 0, profLabel: '입문', color: PROF_COLORS[0], pct: 0 };
  const xp = sessions.reduce((acc, h) => acc + h.total + Math.round((h.score / h.total) * h.total), 0);
  const thresholds = [0, 30, 100, 250, 500];
  let profLv = thresholds.filter((t) => xp >= t).length - 1;
  profLv = Math.min(profLv, 4);
  const nextThreshold = thresholds[profLv + 1] ?? thresholds[4];
  const prevThreshold = thresholds[profLv];
  const pct = profLv === 4 ? 100 : Math.min(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100);
  return { xp, profLv, profLabel: PROF_LEVELS[profLv], color: PROF_COLORS[profLv], pct };
}

/* ── 레이더 차트 (SVG) ────────────────────────── */
const RADAR_LABELS = ['국어','수학','영어','사회','과학','한국사','도덕'];
const N = RADAR_LABELS.length;
const CX = 120, CY = 120, R = 90;

function polarToXY(angle: number, r: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function RadarChart({ values }: { values: number[] }) {
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = 360 / N;

  const dataPoints = values.map((v, i) => polarToXY(i * angleStep, v * R));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[260px] mx-auto">
      {/* 배경 레벨 */}
      {levels.map((lv) => {
        const pts = Array.from({ length: N }, (_, i) => polarToXY(i * angleStep, lv * R));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={lv} d={d} fill="none" stroke="#e5e7eb" strokeWidth="1" />;
      })}
      {/* 축 */}
      {Array.from({ length: N }, (_, i) => {
        const pt = polarToXY(i * angleStep, R);
        return <line key={i} x1={CX} y1={CY} x2={pt.x.toFixed(1)} y2={pt.y.toFixed(1)} stroke="#e5e7eb" strokeWidth="1" />;
      })}
      {/* 데이터 */}
      <path d={dataPath} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
      ))}
      {/* 라벨 */}
      {Array.from({ length: N }, (_, i) => {
        const pt = polarToXY(i * angleStep, R + 18);
        return (
          <text key={i} x={pt.x.toFixed(1)} y={pt.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#6b7280" fontWeight="600">
            {RADAR_LABELS[i]}
          </text>
        );
      })}
      {/* 중심 % 표시 */}
      <circle cx={CX} cy={CY} r="22" fill="#eff6ff" />
      <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
        fontSize="16" fill="#111827" fontWeight="700">
        {(() => { const active = values.filter((v) => v > 0); return active.length === 0 ? 0 : Math.round(active.reduce((a, b) => a + b, 0) / active.length * 100); })()}%
      </text>
    </svg>
  );
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { history, wrongNotes, clearHistory, loadFromCloud, syncStatus } = useRecordStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const nickname = localStorage.getItem('playerName')?.trim();

  useEffect(() => {
    if (nickname && syncStatus !== 'syncing') {
      loadFromCloud(nickname);
    }
  }, []);

  const totalSessions = history.length;
  const totalQuestions = history.reduce((s, h) => s + h.total, 0);
  const avgPercent = totalSessions > 0
    ? Math.round(history.reduce((s, h) => s + (h.score / h.total) * 100, 0) / totalSessions)
    : 0;

  const animTotalSessions = useCountUp(totalSessions);
  const animAvgPercent = useCountUp(avgPercent);
  const animTotalQuestions = useCountUp(totalQuestions);
  const streak = calcStreak(history.map((h) => h.date));

  /* ── 레벨 ── */
  const { level, lv, next, progress } = getLevel(totalQuestions);
  const animProgress = useCountUp(progress);

  /* ── 뱃지 ── */
  const badgeCtx: BadgeCtx = { history, wrongNotes, streak, totalQ: totalQuestions, avgPct: avgPercent };
  const earnedBadges = BADGES.filter((b) => b.check(badgeCtx));
  const lockedBadges = BADGES.filter((b) => !b.check(badgeCtx));

  /* ── 과목별 숙련도 ── */
  const proficiency = SUBJECT_INFO.map((s) => ({
    ...s,
    ...getProficiency(history.filter((h) => h.subject === s.subject)),
  }));
  const animPct = [
    useCountUp(proficiency[0]?.pct ?? 0),
    useCountUp(proficiency[1]?.pct ?? 0),
    useCountUp(proficiency[2]?.pct ?? 0),
    useCountUp(proficiency[3]?.pct ?? 0),
    useCountUp(proficiency[4]?.pct ?? 0),
    useCountUp(proficiency[5]?.pct ?? 0),
    useCountUp(proficiency[6]?.pct ?? 0),
  ];

  /* 과목별 오답 집계 */
  const wrongBySubject = SUBJECT_INFO.map((s) => ({
    ...s,
    count: wrongNotes.filter((n) => getSubjectPrefix(n.questionId) === s.prefix).length,
  }));
  const maxWrong = Math.max(...wrongBySubject.map((s) => s.count), 1);

  /* ── 기능 1: 과목별 정답률 레이더 ─────────────── */
  const subjectAccuracy = SUBJECT_INFO.map((s) => {
    const sessions = history.filter((h) => h.subject === s.subject);
    if (sessions.length === 0) return 0;
    return sessions.reduce((acc, h) => acc + h.score / h.total, 0) / sessions.length;
  });
  const hasRadarData = subjectAccuracy.some((v) => v > 0);

  /* ── 기능 2: 시간대별 학습 패턴 ───────────────── */
  const timeSlots = [
    { label: '새벽\n0-5시',  range: [0, 5],  color: 'bg-indigo-400', count: 0 },
    { label: '아침\n6-11시', range: [6, 11], color: 'bg-yellow-400', count: 0 },
    { label: '낮\n12-17시',  range: [12, 17],color: 'bg-orange-400', count: 0 },
    { label: '저녁\n18-23시',range: [18, 23],color: 'bg-blue-400',   count: 0 },
  ];
  history.forEach((h) => {
    const hour = new Date(h.date).getHours();
    const slot = timeSlots.find((s) => hour >= s.range[0] && hour <= s.range[1]);
    if (slot) slot.count++;
  });
  const maxSlot = Math.max(...timeSlots.map((s) => s.count), 1);

  /* ── 기능 3: 최고 기록 vs 최근 기록 ──────────── */
  const bestPct = history.length > 0 ? Math.max(...history.map((h) => Math.round(h.score / h.total * 100))) : 0;
  const recentPct = history.length > 0 ? Math.round(history[0].score / history[0].total * 100) : 0;
  const diff = recentPct - bestPct;

  /* 최근 7개 기록 */
  const recent = history.slice(0, 7);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {showClearConfirm && (
        <ConfirmModal
          icon="📊"
          message="학습 기록을 전부 삭제할까요?"
          subMessage="삭제된 기록은 복구할 수 없습니다"
          onConfirm={() => { clearHistory(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">←</button>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gray-800">
              <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
            </svg>
            학습 통계
          </h1>
          {nickname && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-600">
              {nickname}
            </span>
          )}
        </div>
        {history.length > 0 && (
          <button onClick={() => setShowClearConfirm(true)} className="text-sm text-red-400 hover:text-red-600">
            전체 삭제
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* 핵심 지표 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '총 퀴즈', value: animTotalSessions, unit: '회' },
            { label: '평균 정답률', value: animAvgPercent, unit: '%' },
            { label: '풀이 문항', value: animTotalQuestions, unit: '문제' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{item.value}<span className="text-sm font-normal text-gray-400">{item.unit}</span></p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── 레벨 시스템 ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">⚔️ 나의 레벨</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border-2 border-gray-100">
              <span className="text-3xl">{level.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-lg font-black ${level.color}`}>{level.label}</span>
                <span className="text-xs text-gray-400">Lv.{lv}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${animProgress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {next ? `${totalQuestions}문제 / 다음 레벨까지 ${next.min - totalQuestions}문제` : `${totalQuestions}문제 — 최고 레벨 달성! 👑`}
              </p>
            </div>
          </div>
        </div>

        {/* ── 뱃지/업적 ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500">🎖️ 업적</h2>
            <span className="text-xs text-gray-400 font-semibold">{earnedBadges.length}/{BADGES.length} 달성</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[...earnedBadges, ...lockedBadges].map((b) => {
              const earned = earnedBadges.includes(b);
              return (
                <div key={b.id} className="flex flex-col items-center gap-1 relative group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${earned ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-100 grayscale opacity-40'}`}>
                    {b.icon}
                  </div>
                  <span className={`text-[9px] text-center leading-tight font-medium ${earned ? 'text-gray-700' : 'text-gray-300'}`}>{b.name}</span>
                  {/* 툴팁 */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                    {b.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 과목별 숙련도 ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">📈 과목별 숙련도</h2>
          <div className="space-y-3">
            {proficiency.map((s, i) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-10 shrink-0">{s.label}</span>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${animPct[i]}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-bold w-8 text-right ${s.profLv >= 3 ? 'text-purple-500' : s.profLv >= 2 ? 'text-blue-500' : s.profLv >= 1 ? 'text-green-500' : 'text-gray-400'}`}>
                  {s.profLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 연속 학습 스트릭 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-3xl">🔥</div>
          <div>
            <p className="text-sm text-gray-500">연속 학습일</p>
            <p className="text-3xl font-bold text-orange-500">{streak}<span className="text-base font-normal text-gray-400"> 일</span></p>
          </div>
          {streak >= 3 && (
            <div className="ml-auto text-sm font-semibold text-orange-400">
              {streak >= 7 ? '🏆 일주일 달성!' : streak >= 5 ? '💪 5일 연속!' : '👍 유지 중!'}
            </div>
          )}
        </div>

        {/* ── 기능 1: 과목별 정답률 레이더 차트 ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-1">🕸️ 과목별 정답률</h2>
          <p className="text-xs text-gray-400 mb-4">각 과목에서 푼 문제의 평균 정답률</p>
          {!hasRadarData ? (
            <p className="text-center text-gray-400 text-sm py-6">과목별로 퀴즈를 풀면 차트가 나타납니다</p>
          ) : (
            <>
              <RadarChart values={subjectAccuracy} />
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {SUBJECT_INFO.map((s, i) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-bold text-blue-600">{Math.round(subjectAccuracy[i] * 100)}%</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 과목별 오답 현황 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500">📌 과목별 오답 현황</h2>
            {wrongNotes.length > 0 && (
              <button
                onClick={() => navigate('/wrong-notes')}
                className="text-xs text-blue-500 font-semibold bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 active:scale-95 transition-all"
              >
                오답노트 →
              </button>
            )}
          </div>
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
                      <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${(s.count / maxWrong) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">{s.count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ── 기능 2: 시간대별 학습 패턴 ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-1">🕐 시간대별 학습 패턴</h2>
          <p className="text-xs text-gray-400 mb-4">언제 공부를 가장 많이 하나요?</p>
          {totalSessions === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">기록이 없습니다</p>
          ) : (
            <div className="flex justify-around gap-2">
              {timeSlots.map((slot) => {
                const heightPct = (slot.count / maxSlot) * 100;
                const isBest = slot.count === maxSlot && slot.count > 0;
                return (
                  <div key={slot.label} className="flex flex-col items-center gap-2 flex-1">
                    {/* 바 영역 — 고정 높이, 내부에서 높이 비율로 성장 */}
                    <div className="w-full bg-gray-100 rounded-xl overflow-hidden flex flex-col justify-end relative" style={{ height: 96 }}>
                      <div
                        className={`w-full rounded-xl transition-all ${isBest ? slot.color : 'bg-gray-300'}`}
                        style={{ height: `${Math.max(heightPct, slot.count > 0 ? 8 : 0)}%` }}
                      />
                      {slot.count > 0 && (
                        <span className="absolute top-2 left-0 right-0 text-center text-xs font-bold text-gray-600">
                          {slot.count}회
                        </span>
                      )}
                    </div>
                    {/* 라벨 — 고정 영역 */}
                    <div className="text-center">
                      <span className="text-xs text-gray-400 whitespace-pre-line leading-tight">{slot.label}</span>
                      {isBest && <p className="text-xs font-bold text-yellow-500 mt-0.5">⭐ 최다</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 기능 3: 최고 기록 vs 최근 기록 ── */}
        {history.length >= 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 mb-4">🏅 최고 기록 vs 최근 기록</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center bg-yellow-50 rounded-2xl py-4">
                <p className="text-xs text-yellow-600 font-semibold mb-1">🏆 최고</p>
                <p className="text-3xl font-black text-yellow-500">{bestPct}<span className="text-base font-normal text-gray-400">%</span></p>
              </div>
              <div className="flex flex-col items-center gap-1">
                {diff === 0 ? (
                  <span className="text-sm font-bold text-gray-400">= 동일</span>
                ) : diff > 0 ? (
                  <>
                    <span className="text-lg">📈</span>
                    <span className="text-sm font-bold text-green-500">+{diff}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">📉</span>
                    <span className="text-sm font-bold text-red-400">{diff}%</span>
                  </>
                )}
              </div>
              <div className="flex-1 text-center bg-blue-50 rounded-2xl py-4">
                <p className="text-xs text-blue-600 font-semibold mb-1">🕐 최근</p>
                <p className="text-3xl font-black text-blue-500">{recentPct}<span className="text-base font-normal text-gray-400">%</span></p>
              </div>
            </div>
          </div>
        )}

        {/* 최근 퀴즈 기록 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">📈 최근 퀴즈 기록</h2>
          {recent.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">퀴즈 기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {recent.map((h) => {
                const pct = Math.round((h.score / h.total) * 100);
                const color = pct >= 90 ? 'text-yellow-500' : pct >= 70 ? 'text-green-500' : pct >= 60 ? 'text-blue-500' : 'text-gray-400';
                return (
                  <div key={h.id} className="flex items-center gap-3 py-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{MODE_LABEL[h.mode] ?? h.mode}</span>
                        <span className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-xs text-gray-300">{formatTime(h.timeSeconds)}</span>
                      </div>
                      <div className="mt-1.5 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-yellow-400' : pct >= 70 ? 'bg-green-400' : pct >= 60 ? 'bg-blue-400' : 'bg-gray-300'}`}
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
      <BottomNav />
    </div>
  );
}
