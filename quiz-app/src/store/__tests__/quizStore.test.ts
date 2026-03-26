import { describe, it, expect, beforeEach } from 'vitest';
import { useQuizStore } from '../quizStore';
import type { Question } from '../../types';

// 테스트용 더미 문제
const makeQuestion = (id: string, answer: number | number[]): Question => ({
  id,
  year: 2024,
  session: 1,
  number: 1,
  text: '테스트 문제',
  image: 'test.png',
  options: [
    { number: 1, text: '선택지1' },
    { number: 2, text: '선택지2' },
    { number: 3, text: '선택지3' },
    { number: 4, text: '선택지4' },
  ],
  answer,
  multipleAnswers: Array.isArray(answer),
});

const Q1 = makeQuestion('q1', 3);
const Q2 = makeQuestion('q2', 1);
const Q3 = makeQuestion('q3', 2);
const Q_MULTI = makeQuestion('q_multi', [2, 3]); // 복수 정답

// 각 테스트 전 스토어 초기화
beforeEach(() => {
  useQuizStore.getState().resetQuiz();
});

describe('quizStore - startQuiz', () => {
  it('문제 풀을 올바르게 초기화한다', () => {
    useQuizStore.getState().startQuiz([Q1, Q2, Q3], 'random', { count: 3 });
    const s = useQuizStore.getState();
    expect(s.questions).toHaveLength(3);
    expect(s.currentIndex).toBe(0);
    expect(s.answers).toHaveLength(0);
    expect(s.isFinished).toBe(false);
    expect(s.mode).toBe('random');
  });

  it('startTime이 설정된다', () => {
    const before = Date.now();
    useQuizStore.getState().startQuiz([Q1], 'yearly', { count: 1 });
    expect(useQuizStore.getState().startTime).toBeGreaterThanOrEqual(before);
  });
});

describe('quizStore - submitAnswer', () => {
  beforeEach(() => {
    useQuizStore.getState().startQuiz([Q1, Q2, Q3], 'random', { count: 3 });
  });

  it('정답을 선택하면 isCorrect = true', () => {
    useQuizStore.getState().submitAnswer('q1', 3); // Q1 정답은 3
    expect(useQuizStore.getState().currentAnswer?.isCorrect).toBe(true);
  });

  it('오답을 선택하면 isCorrect = false', () => {
    useQuizStore.getState().submitAnswer('q1', 1); // Q1 정답은 3, 1 선택
    expect(useQuizStore.getState().currentAnswer?.isCorrect).toBe(false);
  });

  it('정답 제출 시 answers 배열에 추가된다', () => {
    useQuizStore.getState().submitAnswer('q1', 3);
    expect(useQuizStore.getState().answers).toHaveLength(1);
    expect(useQuizStore.getState().answers[0].questionId).toBe('q1');
    expect(useQuizStore.getState().answers[0].selected).toBe(3);
  });

  it('잘못된 questionId는 무시된다', () => {
    useQuizStore.getState().submitAnswer('wrong_id', 3);
    expect(useQuizStore.getState().answers).toHaveLength(0);
    expect(useQuizStore.getState().currentAnswer).toBeNull();
  });
});

describe('quizStore - 복수 정답', () => {
  beforeEach(() => {
    useQuizStore.getState().startQuiz([Q_MULTI], 'random', { count: 1 });
  });

  it('복수 정답 중 하나를 선택하면 정답', () => {
    useQuizStore.getState().submitAnswer('q_multi', 2);
    expect(useQuizStore.getState().currentAnswer?.isCorrect).toBe(true);
  });

  it('복수 정답 중 다른 하나를 선택해도 정답', () => {
    useQuizStore.getState().submitAnswer('q_multi', 3);
    expect(useQuizStore.getState().currentAnswer?.isCorrect).toBe(true);
  });

  it('복수 정답에 포함되지 않은 선택은 오답', () => {
    useQuizStore.getState().submitAnswer('q_multi', 1);
    expect(useQuizStore.getState().currentAnswer?.isCorrect).toBe(false);
  });
});

describe('quizStore - nextQuestion', () => {
  beforeEach(() => {
    useQuizStore.getState().startQuiz([Q1, Q2, Q3], 'random', { count: 3 });
  });

  it('다음 문제로 이동한다', () => {
    useQuizStore.getState().nextQuestion();
    expect(useQuizStore.getState().currentIndex).toBe(1);
  });

  it('마지막 문제에서 nextQuestion 호출 시 isFinished = true', () => {
    useQuizStore.getState().nextQuestion(); // index 1
    useQuizStore.getState().nextQuestion(); // index 2
    useQuizStore.getState().nextQuestion(); // 마지막 → 완료
    expect(useQuizStore.getState().isFinished).toBe(true);
  });

  it('nextQuestion 호출 시 currentAnswer가 초기화된다', () => {
    useQuizStore.getState().submitAnswer('q1', 3);
    useQuizStore.getState().nextQuestion();
    expect(useQuizStore.getState().currentAnswer).toBeNull();
  });
});

describe('quizStore - resetQuiz', () => {
  it('퀴즈를 초기 상태로 리셋한다', () => {
    useQuizStore.getState().startQuiz([Q1, Q2], 'random', { count: 2 });
    useQuizStore.getState().submitAnswer('q1', 3);
    useQuizStore.getState().resetQuiz();

    const s = useQuizStore.getState();
    expect(s.questions).toHaveLength(0);
    expect(s.currentIndex).toBe(0);
    expect(s.answers).toHaveLength(0);
    expect(s.isFinished).toBe(false);
    expect(s.currentAnswer).toBeNull();
  });
});
