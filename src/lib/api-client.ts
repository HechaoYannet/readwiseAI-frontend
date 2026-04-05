import { createMockTrainingGroup } from './mock-data';
import type { TrainingGroup, DiagnosisResult, TrainingQuestion, QuestionAttempt } from '@/types/training';
import type { UserProfile, UserStats } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// ────────────────────────────────────────────────────────────────────────────
// Auth helpers
// ────────────────────────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function extractApiError(res: Response, fallback: string): Promise<never> {
  try {
    const body = await res.json() as { detail?: string; message?: string };
    throw new Error(body.detail ?? body.message ?? fallback);
  } catch (e) {
    if (e instanceof Error && e.message !== fallback) throw e;
    throw new Error(fallback);
  }
}

export interface LoginResponse {
  user_id: string;
  username: string;
  access_token: string;
  token_type: string;
  role?: 'user' | 'admin';
}

export interface RegisterPayload {
  invite_code: string;
  username: string;
  password: string;
  confirm_password: string;
  exam_region: string;
  grade: string;
  school: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateMePayload {
  username?: string;
  exam_region?: string;
  grade?: string;
  school?: string;
}

// ── Verify invite code ───────────────────────────────────────────────────────

export async function verifyInvite(inviteCode: string): Promise<{ valid: boolean; message: string }> {
  if (!API_BASE) {
    // Mock: accept any 8-char alphanumeric code
    const valid = /^[A-Z0-9]{6,12}$/i.test(inviteCode);
    return { valid, message: valid ? '邀请码有效' : '邀请码无效' };
  }
  const res = await fetch(`${API_BASE}/api/auth/verify-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invite_code: inviteCode }),
  });
  if (!res.ok) throw new Error('邀请码验证失败');
  return res.json() as Promise<{ valid: boolean; message: string }>;
}

// ── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(payload: RegisterPayload): Promise<LoginResponse> {
  if (!API_BASE) {
    await sleep(800);
    return {
      user_id: `mock_${Date.now()}`,
      username: payload.username,
      access_token: `mock_token_${Date.now()}`,
      token_type: 'bearer',
      role: 'user',
    };
  }
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await extractApiError(res, '注册失败，请重试');
  }
  return res.json() as Promise<LoginResponse>;
}

// ── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(loginId: string, password: string): Promise<LoginResponse> {
  if (!API_BASE) {
    await sleep(600);
    if (loginId === 'admin' && password === 'admin') {
      return {
        user_id: 'admin_001',
        username: '管理员',
        access_token: `mock_admin_token_${Date.now()}`,
        token_type: 'bearer',
        role: 'admin',
      };
    }
    if (password.length >= 6) {
      return {
        user_id: `mock_${Date.now()}`,
        username: loginId,
        access_token: `mock_token_${Date.now()}`,
        token_type: 'bearer',
        role: 'user',
      };
    }
    throw new Error('用户名或密码错误');
  }
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: loginId, password }),
  });
  if (!res.ok) {
    await extractApiError(res, '用户名或密码错误');
  }
  return res.json() as Promise<LoginResponse>;
}

// ── Refresh token ────────────────────────────────────────────────────────────

export async function refreshToken(token: string): Promise<{ access_token: string; token_type: string }> {
  if (!API_BASE) {
    return { access_token: `mock_token_${Date.now()}`, token_type: 'bearer' };
  }
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Token 刷新失败');
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

// ── Get current user ─────────────────────────────────────────────────────────

export async function getMe(token: string): Promise<UserProfile> {
  if (!API_BASE) {
    await sleep(300);
    return {
      id: 'mock_001',
      username: '张三',
      exam_region: '全国I卷',
      grade: '高三',
      school: '示范高中',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
  }
  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('获取用户信息失败');
  return res.json() as Promise<UserProfile>;
}

// ── Update user profile ──────────────────────────────────────────────────────

export async function updateMe(token: string, payload: UpdateMePayload): Promise<UserProfile> {
  if (!API_BASE) {
    await sleep(500);
    return {
      id: 'mock_001',
      username: payload.username ?? '张三',
      exam_region: payload.exam_region ?? '全国I卷',
      grade: payload.grade ?? '高三',
      school: payload.school ?? '示范高中',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
  }
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await extractApiError(res, '更新失败，请重试');
  }
  return res.json() as Promise<UserProfile>;
}

// ── Change password ──────────────────────────────────────────────────────────

export async function changePassword(token: string, payload: ChangePasswordPayload): Promise<{ message: string }> {
  if (!API_BASE) {
    await sleep(500);
    if (payload.old_password.length < 6) throw new Error('旧密码错误');
    return { message: '密码修改成功，请重新登录' };
  }
  const res = await fetch(`${API_BASE}/api/users/password`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await extractApiError(res, '密码修改失败');
  }
  return res.json() as Promise<{ message: string }>;
}

// ── Get user stats ────────────────────────────────────────────────────────────

export async function getUserStats(token: string): Promise<UserStats> {
  if (!API_BASE) {
    await sleep(300);
    return {
      user_id: 'mock_001',
      mistake_count: 15,
      due_for_review: 3,
      latest_power: 85.5,
      power_records: 12,
    };
  }
  const res = await fetch(`${API_BASE}/api/users/stats`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('获取统计失败');
  return res.json() as Promise<UserStats>;
}

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
