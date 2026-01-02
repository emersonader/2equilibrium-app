import { useState, useCallback, useMemo } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { useSubscription } from './useSubscription';
import * as progressService from '@/services/progressService';
import quizzesData from '@/data/content/quizzes.json';
import type { Quiz, QuizQuestion } from '@/data/schema/types';

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string | number | null>;
  isComplete: boolean;
  score: number | null;
  passed: boolean | null;
  missedTopics: string[];
}

const PASSING_SCORE = 70;

/**
 * Hook for quiz functionality
 */
export function useQuiz(chapterId: string) {
  const { quizAttempts, quizScores, submitQuiz, loadQuizAttempts } = useProgressStore();
  const { canRetryQuizImmediately, tier } = useSubscription();

  // Get quiz data
  const quiz = useMemo(() => {
    return quizzesData.quizzes.find((q) => q.chapterId === chapterId) as Quiz | undefined;
  }, [chapterId]);

  // Quiz state
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    isComplete: false,
    score: null,
    passed: null,
    missedTopics: [],
  });

  // Get attempts for this chapter
  const attempts = quizAttempts[chapterId] || [];
  const bestScore = quizScores[chapterId];
  const hasPassed = bestScore !== undefined && bestScore >= PASSING_SCORE;

  // Check if user can retry
  const checkCanRetry = useCallback(async (): Promise<{
    canRetry: boolean;
    waitTime: number | null;
  }> => {
    // Lifetime users can always retry
    if (canRetryQuizImmediately()) {
      return { canRetry: true, waitTime: null };
    }

    // Check with backend for retry status
    const result = await progressService.canRetryQuiz(chapterId);
    return result;
  }, [chapterId, canRetryQuizImmediately]);

  // Get current question
  const currentQuestion = useMemo(() => {
    if (!quiz) return null;
    return quiz.questions[state.currentQuestionIndex] as QuizQuestion;
  }, [quiz, state.currentQuestionIndex]);

  // Answer a question
  const answerQuestion = useCallback(
    (questionId: string, answer: string | number) => {
      setState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: answer,
        },
      }));
    },
    []
  );

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (!quiz) return;

    setState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= quiz.questions.length) {
        return prev; // Don't go past the end
      }
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
      };
    });
  }, [quiz]);

  // Move to previous question
  const previousQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  }, []);

  // Calculate score and complete quiz
  const completeQuiz = useCallback(async () => {
    if (!quiz) throw new Error('Quiz not found');

    // Calculate score
    let correctCount = 0;
    const missedTopics: string[] = [];

    quiz.questions.forEach((question) => {
      const userAnswer = state.answers[question.id];
      const q = question as QuizQuestion;

      // Reflection questions always count as correct
      if (q.type === 'reflection') {
        correctCount++;
        return;
      }

      // Check if answer is correct
      if (userAnswer === q.correctAnswer) {
        correctCount++;
      } else {
        // Track missed topic for review
        if (q.topicTag && !missedTopics.includes(q.topicTag)) {
          missedTopics.push(q.topicTag);
        }
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= PASSING_SCORE;

    // Submit to backend
    await submitQuiz(chapterId, score, passed, missedTopics);

    // Update local state
    setState((prev) => ({
      ...prev,
      isComplete: true,
      score,
      passed,
      missedTopics,
    }));

    return { score, passed, missedTopics };
  }, [quiz, state.answers, chapterId, submitQuiz]);

  // Reset quiz for retry
  const resetQuiz = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      answers: {},
      isComplete: false,
      score: null,
      passed: null,
      missedTopics: [],
    });
  }, []);

  // Progress info
  const progress = useMemo(() => {
    if (!quiz) return { current: 0, total: 0, percent: 0 };
    const answered = Object.keys(state.answers).length;
    return {
      current: state.currentQuestionIndex + 1,
      total: quiz.questions.length,
      answered,
      percent: (answered / quiz.questions.length) * 100,
    };
  }, [quiz, state.currentQuestionIndex, state.answers]);

  // Check if all questions are answered
  const allAnswered = useMemo(() => {
    if (!quiz) return false;
    return quiz.questions.every((q) => state.answers[q.id] !== undefined);
  }, [quiz, state.answers]);

  return {
    quiz,
    state,
    currentQuestion,
    progress,
    allAnswered,
    attempts,
    bestScore,
    hasPassed,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    resetQuiz,
    checkCanRetry,
    loadQuizAttempts: () => loadQuizAttempts(chapterId),
  };
}

/**
 * Get review content for missed topics
 */
export function getReviewContent(missedTopics: string[]) {
  // Topic to lesson content mapping
  const topicReviewMapping: Record<
    string,
    {
      lessonDay: number;
      reviewTitle: string;
      keyPoints: string[];
    }
  > = {
    goal_setting: {
      lessonDay: 1,
      reviewTitle: 'Setting Your Wellness Intention',
      keyPoints: ['Know your "why"', 'Set achievable goals', 'Visualize success'],
    },
    hydration_benefits: {
      lessonDay: 2,
      reviewTitle: 'The Hydration Ritual',
      keyPoints: ['8 glasses daily', 'Drink before meals', 'Water aids metabolism'],
    },
    body_signals: {
      lessonDay: 3,
      reviewTitle: "Understanding Your Body's Signals",
      keyPoints: ['Listen to hunger cues', 'Distinguish thirst from hunger', 'Honor your body'],
    },
    environment_design: {
      lessonDay: 4,
      reviewTitle: 'Creating Your Sanctuary',
      keyPoints: ['Remove temptations', 'Stock nourishing foods', 'Create a supportive space'],
    },
    support_system: {
      lessonDay: 5,
      reviewTitle: 'Your Support Circle',
      keyPoints: ['Share your goals', 'Find accountability', 'Celebrate together'],
    },
    '70_30_rule': {
      lessonDay: 6,
      reviewTitle: 'The 70/30 Harmony',
      keyPoints: ['70% nourishment', '30% movement', 'Balance is key'],
    },
    fiber_types: {
      lessonDay: 7,
      reviewTitle: 'Fiber: Your Digestive Ally',
      keyPoints: ['Soluble vs insoluble', 'Fruits, vegetables, whole grains', '25-30g daily'],
    },
    protein_sources: {
      lessonDay: 8,
      reviewTitle: 'The Power of Protein',
      keyPoints: ['Animal and plant sources', 'Essential for repair', 'Include at every meal'],
    },
    carbohydrate_types: {
      lessonDay: 9,
      reviewTitle: 'Carbohydrates Decoded',
      keyPoints: ['Simple vs complex', 'Choose whole grains', 'Glycemic index matters'],
    },
    fat_categories: {
      lessonDay: 10,
      reviewTitle: 'Understanding Fats',
      keyPoints: ['Healthy unsaturated fats', 'Limit saturated fats', 'Avoid trans fats'],
    },
    // Add more topic mappings as needed
  };

  return missedTopics.map((topic) => ({
    topic,
    ...topicReviewMapping[topic],
  }));
}

export default useQuiz;
