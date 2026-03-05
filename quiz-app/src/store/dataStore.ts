import { create } from 'zustand';
import type { Question } from '../types';

interface DataState {
  questions: Question[];
  loaded: boolean;
  error: string | null;
  loadQuestions: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  questions: [],
  loaded: false,
  error: null,

  loadQuestions: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/questions/korean_history.json`);
      if (!res.ok) throw new Error('데이터 로딩 실패');
      const data: Question[] = await res.json();
      set({ questions: data, loaded: true, error: null });
    } catch (e) {
      set({ error: (e as Error).message, loaded: false });
    }
  },
}));
