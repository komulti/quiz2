import { create } from 'zustand';
import type { Question, UserAnswer, QuizMode, QuizSettings } from '../types';

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: UserAnswer[];
  startTime: number;
  isFinished: boolean;
  mode: QuizMode;
  settings: QuizSettings;
  currentAnswer: UserAnswer | null;

  startQuiz: (questions: Question[], mode: QuizMode, settings: QuizSettings) => void;
  submitAnswer: (questionId: string, selected: number) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: [],
  startTime: 0,
  isFinished: false,
  mode: 'random',
  settings: { count: 25 },
  currentAnswer: null,

  startQuiz: (questions, mode, settings) =>
    set({
      questions,
      mode,
      settings,
      currentIndex: 0,
      answers: [],
      startTime: Date.now(),
      isFinished: false,
      currentAnswer: null,
    }),

  submitAnswer: (questionId, selected) => {
    const { questions, currentIndex } = get();
    const question = questions[currentIndex];
    if (!question || question.id !== questionId) return;

    const answer = question.answer;
    const isCorrect = Array.isArray(answer)
      ? answer.includes(selected)
      : answer === selected;

    const userAnswer: UserAnswer = {
      questionId,
      selected,
      isCorrect,
      correctAnswer: answer,
    };

    set((state) => ({
      answers: [...state.answers, userAnswer],
      currentAnswer: userAnswer,
    }));
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex + 1 >= questions.length) {
      set({ isFinished: true, currentAnswer: null });
    } else {
      set({ currentIndex: currentIndex + 1, currentAnswer: null });
    }
  },

  finishQuiz: () => set({ isFinished: true }),

  resetQuiz: () =>
    set({
      questions: [],
      currentIndex: 0,
      answers: [],
      startTime: 0,
      isFinished: false,
      currentAnswer: null,
    }),
}));
