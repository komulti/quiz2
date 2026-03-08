import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeaderboardEntry, WrongNote, SessionHistory } from '../types';
import { loadUserRecord, saveUserRecord } from '../lib/syncService';

const MAX_LEADERBOARD = 100;
const MAX_WRONG_NOTES = 400;
const MAX_HISTORY = 50;

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface RecordState {
  leaderboard: LeaderboardEntry[];
  wrongNotes:  WrongNote[];
  history:     SessionHistory[];
  syncStatus:  SyncStatus;

  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  addWrongNotes:       (notes: WrongNote[]) => void;
  removeWrongNote:     (questionId: string) => void;
  clearWrongNotes:     () => void;
  addHistory:          (session: SessionHistory) => void;
  loadFromCloud:       (nickname: string) => Promise<void>;
}

// 디바운스 타이머 (연속 변경을 묶어서 1번만 저장)
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(
  get: () => RecordState,
  setSyncStatus: (s: SyncStatus) => void,
) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const nickname = localStorage.getItem('playerName')?.trim();
    if (!nickname) return;
    setSyncStatus('syncing');
    const { leaderboard, wrongNotes, history } = get();
    await saveUserRecord(nickname, { leaderboard, wrongNotes, history });
    setSyncStatus('synced');
  }, 1500);
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => {
      const sync = () =>
        scheduleSave(get, (s) => set({ syncStatus: s }));

      return {
        leaderboard: [],
        wrongNotes:  [],
        history:     [],
        syncStatus:  'idle',

        addLeaderboardEntry: (entry) => {
          set((state) => ({
            leaderboard: [entry, ...state.leaderboard]
              .sort((a, b) => b.percent - a.percent || a.timeSeconds - b.timeSeconds)
              .slice(0, MAX_LEADERBOARD),
          }));
          sync();
        },

        addWrongNotes: (notes) => {
          set((state) => {
            const existingIds = new Set(state.wrongNotes.map((n) => n.questionId));
            const newNotes = notes.filter((n) => !existingIds.has(n.questionId));
            const correctIds = new Set(
              notes.filter((n) => {
                const answer = n.correctAnswer;
                return Array.isArray(answer)
                  ? answer.includes(n.selectedAnswer)
                  : answer === n.selectedAnswer;
              }).map((n) => n.questionId)
            );
            const updated = [
              ...state.wrongNotes.filter((n) => !correctIds.has(n.questionId)),
              ...newNotes,
            ].slice(-MAX_WRONG_NOTES);
            return { wrongNotes: updated };
          });
          sync();
        },

        removeWrongNote: (questionId) => {
          set((state) => ({
            wrongNotes: state.wrongNotes.filter((n) => n.questionId !== questionId),
          }));
          sync();
        },

        clearWrongNotes: () => {
          set({ wrongNotes: [] });
          sync();
        },

        addHistory: (session) => {
          set((state) => ({
            history: [session, ...state.history].slice(0, MAX_HISTORY),
          }));
          sync();
        },

        loadFromCloud: async (nickname) => {
          set({ syncStatus: 'syncing' });
          const record = await loadUserRecord(nickname);
          if (record) {
            set({ ...record, syncStatus: 'synced' });
          } else {
            // 클라우드에 데이터 없음 → 현재 로컬 데이터를 클라우드에 업로드
            const { leaderboard, wrongNotes, history } = get();
            await saveUserRecord(nickname, { leaderboard, wrongNotes, history });
            set({ syncStatus: 'synced' });
          }
        },
      };
    },
    { name: 'quiz-records' }
  )
);
