import { describe, it, expect, beforeEach } from 'vitest';
import { useRecordStore } from '../recordStore';
import type { LeaderboardEntry, WrongNote, SessionHistory } from '../../types';

// Firebase 동기화 mock (네트워크 호출 방지)
vi.mock('../../lib/syncService', () => ({
  saveUserRecord: vi.fn().mockResolvedValue(undefined),
  loadUserRecord: vi.fn().mockResolvedValue(null),
  saveGlobalLeaderboardEntry: vi.fn().mockResolvedValue(undefined),
  loadGlobalLeaderboard: vi.fn().mockResolvedValue([]),
}));

const makeEntry = (percent: number, timeSeconds = 60): LeaderboardEntry => ({
  id: `${percent}-${timeSeconds}-${Math.random()}`,
  nickname: '테스터',
  score: percent,
  total: 100,
  percent,
  timeSeconds,
  mode: 'random',
  date: new Date().toISOString(),
});

const makeNote = (questionId: string, selectedAnswer: number, correctAnswer: number | number[]): WrongNote => ({
  questionId,
  selectedAnswer,
  correctAnswer,
  date: new Date().toISOString(),
});

const makeHistory = (score: number, total: number): SessionHistory => ({
  id: `${Math.random()}`,
  mode: 'random',
  score,
  total,
  timeSeconds: 60,
  date: new Date().toISOString(),
});

beforeEach(() => {
  // 매 테스트 전 스토어 초기화
  useRecordStore.setState({
    leaderboard: [],
    wrongNotes: [],
    history: [],
    syncStatus: 'idle',
  });
});

describe('recordStore - addLeaderboardEntry', () => {
  it('첫 항목이 추가된다', () => {
    useRecordStore.getState().addLeaderboardEntry(makeEntry(80));
    expect(useRecordStore.getState().leaderboard).toHaveLength(1);
  });

  it('percent 내림차순으로 정렬된다', () => {
    useRecordStore.getState().addLeaderboardEntry(makeEntry(70));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(90));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(80));
    const lb = useRecordStore.getState().leaderboard;
    expect(lb[0].percent).toBe(90);
    expect(lb[1].percent).toBe(80);
    expect(lb[2].percent).toBe(70);
  });

  it('같은 percent면 시간 오름차순 (빠를수록 상위)', () => {
    useRecordStore.getState().addLeaderboardEntry(makeEntry(80, 120));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(80, 60));
    const lb = useRecordStore.getState().leaderboard;
    expect(lb[0].timeSeconds).toBe(60);
  });

  it('최대 3개까지만 저장된다', () => {
    useRecordStore.getState().addLeaderboardEntry(makeEntry(60));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(70));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(80));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(90));
    expect(useRecordStore.getState().leaderboard).toHaveLength(3);
  });

  it('4번째 낮은 점수 항목은 밀려난다', () => {
    useRecordStore.getState().addLeaderboardEntry(makeEntry(90));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(80));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(70));
    useRecordStore.getState().addLeaderboardEntry(makeEntry(50)); // 최하위 → 제외
    const lb = useRecordStore.getState().leaderboard;
    expect(lb.every((e) => e.percent >= 70)).toBe(true);
  });
});

describe('recordStore - addWrongNotes', () => {
  it('새로운 오답이 추가된다', () => {
    useRecordStore.getState().addWrongNotes([makeNote('q1', 2, 3)]);
    expect(useRecordStore.getState().wrongNotes).toHaveLength(1);
  });

  it('중복 questionId는 추가되지 않는다', () => {
    useRecordStore.getState().addWrongNotes([makeNote('q1', 2, 3)]);
    useRecordStore.getState().addWrongNotes([makeNote('q1', 1, 3)]);
    expect(useRecordStore.getState().wrongNotes).toHaveLength(1);
  });

  it('정답 맞춘 문제는 오답노트에서 자동 삭제', () => {
    useRecordStore.getState().addWrongNotes([makeNote('q1', 2, 3)]);
    expect(useRecordStore.getState().wrongNotes).toHaveLength(1);

    // q1을 이번에는 정답(3)으로 제출
    useRecordStore.getState().addWrongNotes([makeNote('q1', 3, 3)]);
    expect(useRecordStore.getState().wrongNotes).toHaveLength(0);
  });

  it('복수 정답 문제에서 정답 선택 시 삭제', () => {
    useRecordStore.getState().addWrongNotes([makeNote('q_multi', 1, [2, 3])]);
    expect(useRecordStore.getState().wrongNotes).toHaveLength(1);

    // 복수 정답 중 하나를 선택 → 정답 → 삭제
    useRecordStore.getState().addWrongNotes([makeNote('q_multi', 2, [2, 3])]);
    expect(useRecordStore.getState().wrongNotes).toHaveLength(0);
  });
});

describe('recordStore - removeWrongNote', () => {
  it('특정 questionId를 삭제한다', () => {
    useRecordStore.getState().addWrongNotes([makeNote('q1', 2, 3), makeNote('q2', 1, 2)]);
    useRecordStore.getState().removeWrongNote('q1');
    const notes = useRecordStore.getState().wrongNotes;
    expect(notes).toHaveLength(1);
    expect(notes[0].questionId).toBe('q2');
  });
});

describe('recordStore - clearWrongNotes', () => {
  it('모든 오답노트를 삭제한다', () => {
    useRecordStore.getState().addWrongNotes([makeNote('q1', 2, 3), makeNote('q2', 1, 2)]);
    useRecordStore.getState().clearWrongNotes();
    expect(useRecordStore.getState().wrongNotes).toHaveLength(0);
  });
});

describe('recordStore - addHistory', () => {
  it('히스토리가 추가된다', () => {
    useRecordStore.getState().addHistory(makeHistory(8, 10));
    expect(useRecordStore.getState().history).toHaveLength(1);
  });

  it('최신 항목이 앞에 온다', () => {
    useRecordStore.getState().addHistory({ ...makeHistory(7, 10), id: 'old' });
    useRecordStore.getState().addHistory({ ...makeHistory(9, 10), id: 'new' });
    expect(useRecordStore.getState().history[0].id).toBe('new');
  });

  it('최대 50개까지만 저장된다', () => {
    for (let i = 0; i < 55; i++) {
      useRecordStore.getState().addHistory(makeHistory(i, 100));
    }
    expect(useRecordStore.getState().history).toHaveLength(50);
  });
});

describe('recordStore - clearHistory', () => {
  it('히스토리를 전부 삭제한다', () => {
    useRecordStore.getState().addHistory(makeHistory(8, 10));
    useRecordStore.getState().clearHistory();
    expect(useRecordStore.getState().history).toHaveLength(0);
  });
});
