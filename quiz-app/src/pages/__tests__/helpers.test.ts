import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── ResultPage의 getGrade ────────────────────────────
function getGrade(percent: number) {
  if (percent >= 90) return { label: 'A+', emoji: '🏆' };
  if (percent >= 80) return { label: 'A',  emoji: '🥇' };
  if (percent >= 70) return { label: 'B',  emoji: '🥈' };
  if (percent >= 60) return { label: 'C',  emoji: '🥉' };
  return               { label: 'F',  emoji: '💪' };
}

describe('getGrade', () => {
  it('100% → A+', () => expect(getGrade(100).label).toBe('A+'));
  it('90% → A+', ()  => expect(getGrade(90).label).toBe('A+'));
  it('89% → A', ()   => expect(getGrade(89).label).toBe('A'));
  it('80% → A', ()   => expect(getGrade(80).label).toBe('A'));
  it('79% → B', ()   => expect(getGrade(79).label).toBe('B'));
  it('70% → B', ()   => expect(getGrade(70).label).toBe('B'));
  it('69% → C', ()   => expect(getGrade(69).label).toBe('C'));
  it('60% → C', ()   => expect(getGrade(60).label).toBe('C'));
  it('59% → F', ()   => expect(getGrade(59).label).toBe('F'));
  it('0% → F', ()    => expect(getGrade(0).label).toBe('F'));
});

// ── StatsPage의 getLevel ─────────────────────────────
const LEVELS = [
  { min: 0,    max: 49,       label: '입문자' },
  { min: 50,   max: 149,      label: '학습자' },
  { min: 150,  max: 299,      label: '중급자' },
  { min: 300,  max: 499,      label: '고수' },
  { min: 500,  max: 999,      label: '실력자' },
  { min: 1000, max: Infinity, label: '합격왕' },
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

describe('getLevel', () => {
  it('0 → 입문자 (Lv1)', () => {
    const r = getLevel(0);
    expect(r.level.label).toBe('입문자');
    expect(r.lv).toBe(1);
  });
  it('49 → 입문자', () => expect(getLevel(49).level.label).toBe('입문자'));
  it('50 → 학습자', () => expect(getLevel(50).level.label).toBe('학습자'));
  it('300 → 고수', ()  => expect(getLevel(300).level.label).toBe('고수'));
  it('1000 → 합격왕', () => expect(getLevel(1000).level.label).toBe('합격왕'));
  it('합격왕은 progress 100', () => expect(getLevel(9999).progress).toBe(100));
  it('progress 0~100 범위', () => {
    for (const n of [0, 25, 50, 149, 150, 499, 999]) {
      const p = getLevel(n).progress;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });
});

// ── StatsPage의 calcStreak ───────────────────────────
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

describe('calcStreak', () => {
  let today: string;
  let yesterday: string;
  let twoDaysAgo: string;
  let threeDaysAgo: string;

  beforeEach(() => {
    const now = Date.now();
    today       = new Date(now).toISOString().slice(0, 10);
    yesterday   = new Date(now - 86400000).toISOString().slice(0, 10);
    twoDaysAgo  = new Date(now - 86400000 * 2).toISOString().slice(0, 10);
    threeDaysAgo= new Date(now - 86400000 * 3).toISOString().slice(0, 10);
  });

  it('빈 배열 → 0', () => {
    expect(calcStreak([])).toBe(0);
  });

  it('오늘만 있으면 → 1', () => {
    expect(calcStreak([`${today}T10:00:00.000Z`])).toBe(1);
  });

  it('어제만 있으면 → 1', () => {
    expect(calcStreak([`${yesterday}T10:00:00.000Z`])).toBe(1);
  });

  it('오늘 + 어제 → 2', () => {
    expect(calcStreak([
      `${today}T10:00:00.000Z`,
      `${yesterday}T10:00:00.000Z`,
    ])).toBe(2);
  });

  it('오늘 + 어제 + 그저께 → 3', () => {
    expect(calcStreak([
      `${today}T10:00:00.000Z`,
      `${yesterday}T10:00:00.000Z`,
      `${twoDaysAgo}T10:00:00.000Z`,
    ])).toBe(3);
  });

  it('오늘 있고 중간에 빈 날 → 연속 끊김', () => {
    expect(calcStreak([
      `${today}T10:00:00.000Z`,
      `${threeDaysAgo}T10:00:00.000Z`,
    ])).toBe(1);
  });

  it('같은 날 여러 번 → 중복 제거해서 1', () => {
    expect(calcStreak([
      `${today}T09:00:00.000Z`,
      `${today}T15:00:00.000Z`,
      `${today}T21:00:00.000Z`,
    ])).toBe(1);
  });

  it('옛날 기록만 있으면 → 0', () => {
    expect(calcStreak(['2020-01-01T00:00:00.000Z'])).toBe(0);
  });
});

// ── StatsPage의 getProficiency ───────────────────────
const PROF_LEVELS = ['입문', '기초', '중급', '고급', '달인'];
function getProficiency(sessions: { score: number; total: number }[]) {
  if (sessions.length === 0) return { xp: 0, profLv: 0, profLabel: '입문', pct: 0 };
  const xp = sessions.reduce((acc, h) => acc + h.total + Math.round((h.score / h.total) * h.total), 0);
  const thresholds = [0, 30, 100, 250, 500];
  let profLv = thresholds.filter((t) => xp >= t).length - 1;
  profLv = Math.min(profLv, 4);
  const nextThreshold = thresholds[profLv + 1] ?? thresholds[4];
  const prevThreshold = thresholds[profLv];
  const pct = profLv === 4 ? 100 : Math.min(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100);
  return { xp, profLv, profLabel: PROF_LEVELS[profLv], pct };
}

describe('getProficiency', () => {
  it('세션 없으면 xp=0, 입문', () => {
    const r = getProficiency([]);
    expect(r.xp).toBe(0);
    expect(r.profLabel).toBe('입문');
  });

  it('만점 10문제 → xp 20', () => {
    const r = getProficiency([{ score: 10, total: 10 }]);
    expect(r.xp).toBe(20);
    expect(r.profLabel).toBe('입문');
  });

  it('xp >= 30 → 기초', () => {
    // score/total=1이면 xp = total*2, 15문제 만점 → xp 30
    const r = getProficiency([{ score: 15, total: 15 }]);
    expect(r.xp).toBe(30);
    expect(r.profLabel).toBe('기초');
  });

  it('xp >= 100 → 중급', () => {
    const r = getProficiency([{ score: 50, total: 50 }]);
    expect(r.xp).toBe(100);
    expect(r.profLabel).toBe('중급');
  });

  it('pct는 0~100 사이', () => {
    for (const session of [
      [{ score: 5, total: 10 }],
      [{ score: 50, total: 100 }],
      [{ score: 200, total: 400 }],
    ]) {
      const { pct } = getProficiency(session);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});

// ── WrongNotePage의 getSubjectLabel, matchesTab ──────
function getSubjectLabel(questionId: string): { text: string } {
  if (questionId.startsWith('kl_'))  return { text: '국어' };
  if (questionId.startsWith('ss_'))  return { text: '사회' };
  if (questionId.startsWith('sci_')) return { text: '과학' };
  if (questionId.startsWith('eth_')) return { text: '도덕' };
  if (questionId.startsWith('en_'))  return { text: '영어' };
  if (questionId.startsWith('math_'))return { text: '수학' };
  return { text: '한국사' };
}

type TabSubject = 'all' | 'korean_history' | 'korean_language' | 'social_studies' | 'science' | 'ethics' | 'english' | 'math';

function matchesTab(questionId: string, tab: TabSubject): boolean {
  if (tab === 'all') return true;
  if (tab === 'korean_history') return !questionId.startsWith('kl_') && !questionId.startsWith('ss_') && !questionId.startsWith('sci_') && !questionId.startsWith('eth_') && !questionId.startsWith('en_') && !questionId.startsWith('math_');
  if (tab === 'korean_language') return questionId.startsWith('kl_');
  if (tab === 'social_studies')  return questionId.startsWith('ss_');
  if (tab === 'science')         return questionId.startsWith('sci_');
  if (tab === 'ethics')          return questionId.startsWith('eth_');
  if (tab === 'english')         return questionId.startsWith('en_');
  if (tab === 'math')            return questionId.startsWith('math_');
  return true;
}

describe('getSubjectLabel', () => {
  it('kl_ → 국어',   () => expect(getSubjectLabel('kl_2024_1_1').text).toBe('국어'));
  it('ss_ → 사회',   () => expect(getSubjectLabel('ss_2024_1_1').text).toBe('사회'));
  it('sci_ → 과학',  () => expect(getSubjectLabel('sci_2024_1_1').text).toBe('과학'));
  it('eth_ → 도덕',  () => expect(getSubjectLabel('eth_2024_1_1').text).toBe('도덕'));
  it('en_ → 영어',   () => expect(getSubjectLabel('en_2024_1_1').text).toBe('영어'));
  it('math_ → 수학', () => expect(getSubjectLabel('math_2024_1_1').text).toBe('수학'));
  it('prefix 없음 → 한국사', () => expect(getSubjectLabel('kh_2024_1_1').text).toBe('한국사'));
});

describe('matchesTab', () => {
  it('all 탭은 모든 문제 통과', () => {
    expect(matchesTab('kl_1', 'all')).toBe(true);
    expect(matchesTab('math_1', 'all')).toBe(true);
    expect(matchesTab('kh_1', 'all')).toBe(true);
  });

  it('korean_language 탭은 kl_ 만', () => {
    expect(matchesTab('kl_1', 'korean_language')).toBe(true);
    expect(matchesTab('ss_1', 'korean_language')).toBe(false);
    expect(matchesTab('kh_1', 'korean_language')).toBe(false);
  });

  it('korean_history 탭은 prefix 없는 것만', () => {
    expect(matchesTab('kh_2024_1_1', 'korean_history')).toBe(true);
    expect(matchesTab('kl_1', 'korean_history')).toBe(false);
    expect(matchesTab('math_1', 'korean_history')).toBe(false);
  });

  it('math 탭은 math_ 만', () => {
    expect(matchesTab('math_1', 'math')).toBe(true);
    expect(matchesTab('kl_1', 'math')).toBe(false);
  });
});
