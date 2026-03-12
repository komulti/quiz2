export interface QuestionOption {
  number: number;
  text: string;
}

export interface Question {
  id: string;
  year: number;
  session: number;
  number: number;
  text: string;
  image: string;
  passageImage?: string;
  options: QuestionOption[];
  answer: number | number[];
  multipleAnswers: boolean;
  explanation?: string;
}

export interface UserAnswer {
  questionId: string;
  selected: number;
  isCorrect: boolean;
  correctAnswer: number | number[];
}

export type QuizMode = 'random' | 'yearly' | 'wrong';

export type Subject = 'korean_history' | 'korean_language' | 'social_studies' | 'science' | 'ethics' | 'english' | 'math';

export interface QuizSettings {
  year?: number;
  session?: number;
  count: number;
  playerName?: string;
  subject?: Subject;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  total: number;
  percent: number;
  timeSeconds: number;
  mode: QuizMode;
  date: string;
  subject?: Subject;
}

export interface WrongNote {
  questionId: string;
  selectedAnswer: number;
  correctAnswer: number | number[];
  date: string;
  playerName?: string;
}

export interface SessionHistory {
  id: string;
  mode: QuizMode;
  score: number;
  total: number;
  timeSeconds: number;
  date: string;
  subject?: Subject;
}
