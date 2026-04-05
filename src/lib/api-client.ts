import { createMockTrainingGroup } from './mock-data';
import type { TrainingGroup, DiagnosisResult, TrainingQuestion, QuestionAttempt } from '@/types/training';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateTrainingGroup(
  difficulty = 'L2',
  topic?: string,
): Promise<TrainingGroup> {
  if (!API_BASE) {
    await sleep(1500 + Math.random() * 1000);
    return createMockTrainingGroup(difficulty);
  }

  const response = await fetch(`${API_BASE}/api/training/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty, topic }),
  });

  if (!response.ok) {
    console.warn('API unavailable, using mock data');
    await sleep(500);
    return createMockTrainingGroup(difficulty);
  }

  return response.json() as Promise<TrainingGroup>;
}

export interface AttemptPayload {
  group_id: string;
  article_id: string;
  question_attempts: QuestionAttempt[];
}

export interface AttemptResponse {
  attempt_id: string;
  status: 'pending' | 'ready' | 'error';
}

export interface DiagnosisResponse {
  attempt_id: string;
  status: 'pending' | 'ready' | 'error';
  results?: Record<string, DiagnosisResult>;
}

function buildMockDiagnosis(questions: TrainingQuestion[], attempts: QuestionAttempt[]): Record<string, DiagnosisResult> {
  const results: Record<string, DiagnosisResult> = {};
  for (const attempt of attempts) {
    if (!attempt.is_correct) {
      const question = questions.find((q) => q.question_id === attempt.question_id);
      results[attempt.question_id] = {
        error_category: question?.question_type === 'vocabulary' ? '词义理解错误' : '细节定位错误',
        evidence_sentence: question?.explanation ?? '请仔细阅读原文相关段落。',
        fix_suggestion: '建议回顾原文对应段落，注意关键词和上下文语义。',
        similar_distractor: attempt.user_answer,
      };
    }
  }
  return results;
}

export async function submitAttempt(
  payload: AttemptPayload,
  questions: TrainingQuestion[],
): Promise<DiagnosisResponse> {
  if (!API_BASE) {
    await sleep(800);
    const results = buildMockDiagnosis(questions, payload.question_attempts);
    return { attempt_id: `mock_${Date.now()}`, status: 'ready', results };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    const results = buildMockDiagnosis(questions, payload.question_attempts);
    return { attempt_id: `mock_${Date.now()}`, status: 'ready', results };
  }

  if (!response.ok) {
    const results = buildMockDiagnosis(questions, payload.question_attempts);
    return { attempt_id: `mock_${Date.now()}`, status: 'ready', results };
  }

  const data = (await response.json()) as AttemptResponse;
  return pollDiagnosis(data.attempt_id, questions, payload.question_attempts);
}

export async function pollDiagnosis(
  attemptId: string,
  questions: TrainingQuestion[],
  attempts: QuestionAttempt[],
  maxRetries = 30,
): Promise<DiagnosisResponse> {
  let backoff = 2000;
  for (let i = 0; i < maxRetries; i++) {
    await sleep(backoff);
    try {
      const response = await fetch(`${API_BASE}/api/result/${attemptId}`);
      if (!response.ok) {
        backoff = Math.min(backoff * 1.5, 10000);
        continue;
      }
      const data = (await response.json()) as DiagnosisResponse;
      if (data.status === 'ready') return data;
      if (data.status === 'error') break;
      backoff = 2000;
    } catch {
      backoff = Math.min(backoff * 1.5, 10000);
    }
  }
  const results = buildMockDiagnosis(questions, attempts);
  return { attempt_id: attemptId, status: 'ready', results };
}
