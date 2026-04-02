import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrainingGroup, PowerScore, DiagnosisResult, ParagraphTiming, ArticleSession } from '@/types/training';

interface AnswerRecord {
  answer: string;
  timeSpent: number;
  startTime: number;
}

interface TrainingStore {
  currentGroup: TrainingGroup | null;
  currentArticleIndex: number;
  groupStartTime: number | null;
  answers: Record<string, AnswerRecord>;
  diagnosisResults: Record<string, DiagnosisResult>;
  powerScore: PowerScore | null;

  startGroup: (group: TrainingGroup) => void;
  setCurrentArticle: (index: number) => void;
  recordAnswer: (questionId: string, answer: string, timeSpent: number, startTime: number) => void;
  recordDiagnosis: (questionId: string, result: DiagnosisResult) => void;
  completeCurrentArticle: (paragraphTimings: ParagraphTiming[]) => void;
  completeGroup: () => void;
  resetGroup: () => void;
  setPowerScore: (score: PowerScore) => void;
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      currentGroup: null,
      currentArticleIndex: 0,
      groupStartTime: null,
      answers: {},
      diagnosisResults: {},
      powerScore: null,

      startGroup: (group) =>
        set({
          currentGroup: group,
          currentArticleIndex: 0,
          groupStartTime: Date.now(),
          answers: {},
          diagnosisResults: {},
        }),

      setCurrentArticle: (index) => set({ currentArticleIndex: index }),

      recordAnswer: (questionId, answer, timeSpent, startTime) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: { answer, timeSpent, startTime },
          },
        })),

      recordDiagnosis: (questionId, result) =>
        set((state) => ({
          diagnosisResults: {
            ...state.diagnosisResults,
            [questionId]: result,
          },
        })),

      completeCurrentArticle: (paragraphTimings) => {
        const state = get();
        if (!state.currentGroup) return;

        const article = state.currentGroup.articles[state.currentArticleIndex];
        if (!article) return;

        const questionAttempts = article.questions.map((q) => {
          const rec = state.answers[q.question_id];
          const userAnswer = rec?.answer ?? '';
          return {
            question_id: q.question_id,
            user_answer: userAnswer,
            is_correct: userAnswer === q.correct_answer,
            time_spent: rec?.timeSpent ?? 0,
            start_time: rec?.startTime ?? 0,
            submit_time: Date.now(),
          };
        });

        const sessionStart = state.groupStartTime ?? Date.now();
        const sessionEnd = Date.now();
        const session: ArticleSession = {
          article_id: article.article_id,
          start_time: sessionStart,
          end_time: sessionEnd,
          reading_duration: sessionEnd - sessionStart,
          paragraph_timestamps: paragraphTimings,
          question_attempts: questionAttempts,
          status: 'completed',
        };

        const existingSessions = state.currentGroup.sessions.filter(
          (s) => s.article_id !== article.article_id,
        );

        set((s) => ({
          currentGroup: s.currentGroup
            ? { ...s.currentGroup, sessions: [...existingSessions, session] }
            : null,
        }));
      },

      completeGroup: () =>
        set((state) => ({
          currentGroup: state.currentGroup
            ? { ...state.currentGroup, status: 'completed', end_time: Date.now() }
            : null,
        })),

      resetGroup: () =>
        set({
          currentGroup: null,
          currentArticleIndex: 0,
          groupStartTime: null,
          answers: {},
          diagnosisResults: {},
        }),

      setPowerScore: (score) => set({ powerScore: score }),
    }),
    {
      name: 'readwise-training',
      partialize: (state) => ({
        currentGroup: state.currentGroup,
        currentArticleIndex: state.currentArticleIndex,
        groupStartTime: state.groupStartTime,
        answers: state.answers,
        diagnosisResults: state.diagnosisResults,
        powerScore: state.powerScore,
      }),
    },
  ),
);
