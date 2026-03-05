import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeaderboardEntry, WrongNote, SessionHistory } from '../types';

const MAX_LEADERBOARD = 100;
const MAX_WRONG_NOTES = 400;
const MAX_HISTORY = 50;

interface RecordState {
  leaderboard: LeaderboardEntry[];
  wrongNotes: WrongNote[];
  history: SessionHistory[];

  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  addWrongNotes: (notes: WrongNote[]) => void;
  removeWrongNote: (questionId: string) => void;
  clearWrongNotes: () => void;
  addHistory: (session: SessionHistory) => void;
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      leaderboard: [],
      wrongNotes: [],
      history: [],

      addLeaderboardEntry: (entry) =>
        set((state) => ({
          leaderboard: [entry, ...state.leaderboard]
            .sort((a, b) => b.percent - a.percent || a.timeSeconds - b.timeSeconds)
            .slice(0, MAX_LEADERBOARD),
        })),

      addWrongNotes: (notes) =>
        set((state) => {
          const existingIds = new Set(state.wrongNotes.map((n) => n.questionId));
          const newNotes = notes.filter((n) => !existingIds.has(n.questionId));
          // 기존 오답 중 이번에 맞춘 문제는 제거
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
        }),

      removeWrongNote: (questionId) =>
        set((state) => ({
          wrongNotes: state.wrongNotes.filter((n) => n.questionId !== questionId),
        })),

      clearWrongNotes: () => set({ wrongNotes: [] }),

      addHistory: (session) =>
        set((state) => ({
          history: [session, ...state.history].slice(0, MAX_HISTORY),
        })),
    }),
    {
      name: 'quiz-records',
    }
  )
);
