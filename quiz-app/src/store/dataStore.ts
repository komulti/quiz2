import { create } from 'zustand';
import type { Question, Subject } from '../types';

interface DataState {
  questions: Record<Subject, Question[]>;
  loaded: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
}

const DATA_FILES: Record<Subject, string> = {
  korean_history: 'data/questions/korean_history.json',
  korean_language: 'data/questions/korean_language.json',
  social_studies: 'data/questions/social_studies.json',
  science: 'data/questions/science.json',
};

export const useDataStore = create<DataState>((set, get) => ({
  questions: { korean_history: [], korean_language: [], social_studies: [], science: [] },
  loaded: false,
  error: null,

  loadAll: async () => {
    if (get().loaded) return;
    try {
      const base = import.meta.env.BASE_URL;
      const [kh, kl, ss, sci] = await Promise.all([
        fetch(`${base}${DATA_FILES.korean_history}`).then((r) => {
          if (!r.ok) throw new Error('한국사 데이터 로딩 실패');
          return r.json();
        }),
        fetch(`${base}${DATA_FILES.korean_language}`).then((r) => {
          if (!r.ok) throw new Error('국어 데이터 로딩 실패');
          return r.json();
        }),
        fetch(`${base}${DATA_FILES.social_studies}`).then((r) => {
          if (!r.ok) throw new Error('사회 데이터 로딩 실패');
          return r.json();
        }),
        fetch(`${base}${DATA_FILES.science}`).then((r) => {
          if (!r.ok) throw new Error('과학 데이터 로딩 실패');
          return r.json();
        }),
      ]);
      set({ questions: { korean_history: kh, korean_language: kl, social_studies: ss, science: sci }, loaded: true, error: null });
    } catch (e) {
      set({ error: (e as Error).message, loaded: false });
    }
  },
}));
