import type {
    TrainingGroup,
    DiagnosisResult,
    TrainingQuestion,
    QuestionAttempt,
    TrainingArticle
} from '@/types/training';
import type {UserProfile, UserStats} from './auth-store';

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    '';

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

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireApiBase(): string {
    if (!API_BASE) {
        throw new Error('前端未配置 API 地址');
    }
    return API_BASE;
}

// ────────────────────────────────────────────────────────────────────────────
// Auth API types
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Memory API types
// ────────────────────────────────────────────────────────────────────────────

export interface TrainingRecord {
    session_id?: string;
    article_count?: number;
    question_count?: number;
    correct_count?: number;
    total_time_seconds?: number;
    difficulty?: string;
    score?: number;
    note?: string;
    recorded_at?: string;
}

export interface TrainingRecordListResponse {
    user_id: string;
    total: number;
    records: TrainingRecord[];
}

export interface MistakeRecord {
    mistake_id: string;
    question_text: string;
    options: { A: string; B: string; C: string; D: string };
    correct_answer: string;
    user_answer: string;
    article_excerpt?: string;
    error_category?: string;
    explanation?: string;
    question_type?: string;
    difficulty?: string;
    review_count?: number;
    next_review_at?: string;
    created_at?: string;
}

export interface MistakeListResponse {
    user_id: string;
    total: number;
    returned: number;
    mistakes: MistakeRecord[];
}

export interface DueMistakesResponse {
    user_id: string;
    due_count: number;
    mistakes: MistakeRecord[];
}

export interface SM2Item {
    item_id: string;
    easiness: number;
    interval_days: number;
    repetitions: number;
    next_review_at: string;
    last_reviewed_at?: string;
}

export interface CurveOverview {
    user_id: string;
    total_items: number;
    due_count: number;
}

export interface DueCurveResponse {
    user_id: string;
    due_count: number;
    items: SM2Item[];
}

export interface ReviewResult {
    message: string;
    item_id: string;
    next_review_at: string;
    interval_days: number;
    repetitions: number;
    easiness: number;
}

export interface PowerRecord {
    score: number;
    reason?: string;
    recorded_at?: string;
}

export interface PowerHistoryResponse {
    user_id: string;
    total_records: number;
    latest_score: number;
    history: PowerRecord[];
}

// ────────────────────────────────────────────────────────────────────────────
// Attempt / Result API types
// ────────────────────────────────────────────────────────────────────────────

export interface AttemptInitResponse {
    request_id: string;
    session_id: string;
    status: 'processing';
    result_url: string;
}

export interface ResultResponse {
    request_id: string;
    status: 'processing' | 'completed' | 'failed' | 'not_found';
    results?: Record<string, unknown>;
    error_log?: string[];
}

export interface DiagnosisResponse {
    attempt_id: string;
    status: 'processing' | 'completed' | 'failed';
    results?: Record<string, DiagnosisResult>;
}

// ────────────────────────────────────────────────────────────────────────────
// Auth API – 3. 认证与注册
// ────────────────────────────────────────────────────────────────────────────

export async function verifyInvite(inviteCode: string): Promise<{ valid: boolean; message: string }> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/auth/verify-invite`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({invite_code: inviteCode}),
    });
    if (!res.ok) throw new Error('邀请码验证失败');
    return res.json() as Promise<{ valid: boolean; message: string }>;
}

export async function registerUser(payload: RegisterPayload): Promise<LoginResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
    });
    if (!res.ok) await extractApiError(res, '注册失败，请重试');
    return res.json() as Promise<LoginResponse>;
}

export async function loginUser(loginId: string, password: string): Promise<LoginResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({login_id: loginId, password}),
    });
    if (!res.ok) await extractApiError(res, '用户名或密码错误');
    return res.json() as Promise<LoginResponse>;
}

export async function refreshToken(token: string): Promise<{ access_token: string; token_type: string }> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/auth/refresh`, {method: 'POST', headers: authHeaders(token)});
    if (!res.ok) await extractApiError(res, 'Token 刷新失败');
    return res.json() as Promise<{ access_token: string; token_type: string }>;
}

// ────────────────────────────────────────────────────────────────────────────
// Users API – 4. 用户管理
// ────────────────────────────────────────────────────────────────────────────

export async function getMe(token: string): Promise<UserProfile> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/users/me`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取用户信息失败');
    return res.json() as Promise<UserProfile>;
}

export async function updateMe(token: string, payload: UpdateMePayload): Promise<UserProfile> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/users/me`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    if (!res.ok) await extractApiError(res, '更新失败，请重试');
    return res.json() as Promise<UserProfile>;
}

export async function changePassword(token: string, payload: ChangePasswordPayload): Promise<{ message: string }> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/users/password`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    if (!res.ok) await extractApiError(res, '密码修改失败');
    return res.json() as Promise<{ message: string }>;
}

export async function getUserStats(token: string): Promise<UserStats> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/users/stats`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取统计失败');
    return res.json() as Promise<UserStats>;
}

// ────────────────────────────────────────────────────────────────────────────
// Attempt API – 5. 提交答题 + Result polling – 6. 轮询结果
// ────────────────────────────────────────────────────────────────────────────

export interface SingleAttemptPayload {
    session_id: string;
    request_type: 'attempt';
    paragraph: string;
    question_text: string;
    options: { A: string; B: string; C: string; D: string };
    user_answer: string;
    correct_answer: string;
    time_spent?: number;
    question_number?: string;
}

export interface QAPayload {
    session_id: string;
    request_type: 'qa';
    query_type: 'word' | 'sentence' | 'grammar' | 'translate' | 'free';
    content: string;
    context_sentence?: string;
}

export interface TrainingSetPayload {
    session_id: string;
    request_type: 'training_set';
    user_level?: string;
}

async function postAttempt(token: string, payload: Record<string, unknown>): Promise<AttemptInitResponse> {
    const res = await fetch(`${API_BASE}/api/attempt`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) await extractApiError(res, '请求失败');
    return res.json() as Promise<AttemptInitResponse>;
}

async function pollResult(token: string, requestId: string, maxRetries = 40, intervalMs = 2500): Promise<ResultResponse> {
    for (let i = 0; i < maxRetries; i++) {
        console.log(`轮询 (attempt ${i + 1}/${maxRetries})...`);
        await sleep(intervalMs);
        try {
            const res = await fetch(`${API_BASE}/api/result/${requestId}`, {headers: authHeaders(token)});
            if (res.status === 403) throw new Error('无权访问该请求结果');
            if (!res.ok) continue;
            const data = await res.json() as ResultResponse;
            if (data.status === 'completed') return data;
            if (data.status === 'failed') return data;
        } catch (e) {
            if (e instanceof Error && e.message === '无权访问该请求结果') throw e;
        }
    }
    console.log("轮询结束")
    return {request_id: requestId, status: 'failed', error_log: ['轮询超时']};
}

// ── Mapping helpers for training_set API response ────────────────────────────

// Maps a raw article object (from dyn_c${i}.article) together with its raw questions
// (from dyn_q${i}.questions) into a TrainingArticle.
function mapApiArticle(
    rawArticle: Record<string, unknown>,
    rawQuestions: Record<string, unknown>[],
    index: number,
    difficulty: string,
): TrainingArticle {
    const title = (rawArticle.title as string | undefined) ?? `Article ${index + 1}`;
    const content = (rawArticle.content as string | undefined) ?? '';
    const wordCount = (rawArticle.word_count as number | undefined) ?? content.split(/\s+/).filter(Boolean).length;
    // API returns difficulty_actual / genre_actual; fall back to difficulty / genre for safety
    const diff =
        (rawArticle.difficulty_actual as string | undefined) ??
        (rawArticle.difficulty as string | undefined) ??
        difficulty;
    const genre =
        (rawArticle.genre_actual as string | undefined) ??
        (rawArticle.genre as string | undefined) ??
        'general';

    const questions: TrainingQuestion[] = rawQuestions.map((q, qi) => ({
        question_id: (q.question_id as string | undefined) ?? `q_${index}_${qi}`,
        question_text: (q.question_text as string | undefined) ?? '',
        options: (q.options as { A: string; B: string; C: string; D: string } | undefined) ?? {
            A: '',
            B: '',
            C: '',
            D: ''
        },
        correct_answer: (q.correct_answer as string | undefined) ?? 'A',
        // API uses "type"; fall back to "question_type" for compatibility
        question_type: (q.type as string | undefined) ?? (q.question_type as string | undefined) ?? 'detail',
        explanation: (q.explanation as string | undefined),
    }));

    return {
        article_id: (rawArticle.article_id as string | undefined) ?? `art_${index}`,
        title,
        content,
        word_count: wordCount,
        difficulty: diff,
        genre,
        questions,
    };
}

// Maps the completed training_set result (results field of GET /api/result) to a TrainingGroup.
// API structure per frontend_follow.md §13.5:
//   results["dyn_c1"] = { article: {...}, validation: {...}, metadata: {...}};
//   results["dyn_q1"] = { questions: [...], metadata: {...} }
function mapTrainingSetResult(results: Record<string, unknown>, difficulty: string, sessionId: string): TrainingGroup {
    const articles: TrainingArticle[] = [];
    for (let i = 1; i <= 4; i++) {
        const articleWrapper = results[`dyn_c${i}`] as Record<string, unknown> | undefined;
        const questionWrapper = results[`dyn_q${i}`] as Record<string, unknown> | undefined;

        // Extract the nested article object
        const rawArticle = (articleWrapper?.article as Record<string, unknown> | undefined) ?? articleWrapper;
        if (!rawArticle) continue;

        // Extract the questions array from the question wrapper
        const rawQuestions =
            (questionWrapper?.questions as Record<string, unknown>[] | undefined) ??
            (rawArticle.questions as Record<string, unknown>[] | undefined) ??
            [];

        articles.push(mapApiArticle(rawArticle, rawQuestions, i - 1, difficulty));
    }

    return {
        group_id: sessionId,
        user_id: '',
        difficulty,
        start_time: Date.now(),
        end_time: 0,
        total_duration: 0,
        articles,
        sessions: [],
        status: 'in_progress',
    };
}

// ── Generate training set (POST /api/attempt with request_type: training_set) ─

export async function generateTrainingGroup(
    token: string,
    difficulty = 'L2',
    topic?: string,
): Promise<TrainingGroup> {
    requireApiBase();

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    //try {
    const initResp: AttemptInitResponse = await postAttempt(token, {
        request_type: 'training_set',
        session_id: sessionId,
        context: "根据用户的英语水平和兴趣生成一套包含4篇文章的训练材料，参考高考真题出一组训练题.",
        user_level: difficulty,
        ...(topic ? {topic} : {}),
    });
    const result = await pollResult(token, initResp.request_id, 100, 3000);
    if (result.status === 'completed' && result.results) {
        return mapTrainingSetResult(result.results, difficulty, initResp.session_id ?? sessionId);
    }
    throw new Error(result.error_log?.join('；') ?? '训练生成失败');
}

// ── Submit single question attempt for diagnosis ──────────────────────────────

export interface AttemptPayload {
    group_id: string;
    article_id: string;
    question_attempts: QuestionAttempt[];
}

export async function submitAttemptDiagnosis(
    token: string,
    sessionId: string,
    article: TrainingArticle,
    attempts: QuestionAttempt[],
): Promise<Record<string, DiagnosisResult>> {
    const questions = article.questions;
    const wrongAttempts = attempts.filter((a) => !a.is_correct);

    requireApiBase();
    if (wrongAttempts.length === 0) return {};

    const diagnosisMap: Record<string, DiagnosisResult> = {};

    await Promise.allSettled(
        wrongAttempts.map(async (attempt, idx) => {
            const question = questions.find((q) => q.question_id === attempt.question_id);
            if (!question) return;

            try {
                const initResp = await postAttempt(token, {
                    request_type: 'attempt',
                    session_id: sessionId,
                    paragraph: article.content,
                    question_text: question.question_text,
                    options: question.options,
                    user_answer: attempt.user_answer,
                    correct_answer: question.correct_answer,
                    time_spent: attempt.time_spent,
                    question_number: `A${idx + 1}`,
                });

                const result = await pollResult(token, initResp.request_id, 20, 2500);
                if (result.status === 'completed' && result.results) {
                    // API response structure per frontend_follow.md §13.1:
                    //   results.sub_001.diagnosis = { error_category, explanation, evidence_sentence, suggestion, confidence }
                    //   results.sub_001.similar_question = { paragraph, question, options, correct_answer, explanation }
                    const sub = result.results.sub_001 as Record<string, unknown> | undefined;
                    const diag = sub?.diagnosis as Record<string, unknown> | undefined;
                    const similarQ = sub?.similar_question as Record<string, unknown> | undefined;
                    if (diag) {
                        diagnosisMap[attempt.question_id] = {
                            error_category: (diag.error_category as string | undefined) ?? '解析错误',
                            evidence_sentence: (diag.evidence_sentence as string | undefined) ?? '',
                            // API field is "suggestion"; "fix_suggestion" kept for type compatibility
                            fix_suggestion: (diag.suggestion as string | undefined) ?? (diag.fix_suggestion as string | undefined) ?? '',
                            similar_distractor: attempt.user_answer,
                            confidence: diag.confidence as number | undefined,
                            similar_question: similarQ && typeof similarQ.question === 'string'
                                ? {
                                    paragraph: (similarQ.paragraph as string | undefined) ?? '',
                                    question: similarQ.question,
                                    options: (similarQ.options as {
                                        A: string;
                                        B: string;
                                        C: string;
                                        D: string
                                    } | undefined) ?? {A: '', B: '', C: '', D: ''},
                                    correct_answer: (similarQ.correct_answer as string | undefined) ?? 'A',
                                    explanation: (similarQ.explanation as string | undefined) ?? '',
                                }
                                : undefined,
                        };
                    }
                }
            } catch {
                return;
            }
        }),
    );
    return diagnosisMap;
}

// Legacy wrapper kept for backward compatibility
export async function submitAttempt(
    payload: AttemptPayload,
    questions: TrainingQuestion[],
): Promise<DiagnosisResponse> {
    void payload;
    void questions;
    throw new Error('submitAttempt 已废弃，请改用 submitAttemptDiagnosis');
}

// ── QA API (POST /api/attempt with request_type: qa) ─────────────────────────

export async function submitQA(
    token: string,
    payload: QAPayload,
): Promise<string> {
    requireApiBase();
    try {
        const initResp = await postAttempt(token, payload as unknown as Record<string, unknown>);
        const result = await pollResult(token, initResp.request_id, 20, 2000);
        if (result.status === 'completed' && result.results) {
            const sub = result.results.sub_001 as Record<string, unknown> | undefined;
            if (!sub) return 'AI 未返回结果，请重试';
            // Parse per query_type per frontend_follow.md §13.4
            switch (payload.query_type) {
                case 'word': {
                    const basicMeaning = sub.basic_meaning as Record<string, unknown> | undefined;
                    const translation = (basicMeaning?.translation as string | undefined) ?? '';
                    const contextMeaning = sub.context_meaning as string | undefined;
                    const usageNotes = sub.usage_notes as string | undefined;
                    const parts = [translation];
                    if (contextMeaning) parts.push(`语境含义：${contextMeaning}`);
                    if (usageNotes) parts.push(`用法说明：${usageNotes}`);
                    return parts.filter(Boolean).join('\n') || '暂无释义';
                }
                case 'sentence': {
                    const translation = sub.translation as string | undefined;
                    const mainClause = sub.main_clause as string | undefined;
                    const structureAnalysis = sub.structure_analysis as string | undefined;
                    const keyPoints = sub.key_grammar_points as string[] | undefined;
                    const parts: string[] = [];
                    if (translation) parts.push(`译文：${translation}`);
                    if (mainClause) parts.push(`主干：${mainClause}`);
                    if (structureAnalysis) parts.push(`结构：${structureAnalysis}`);
                    if (keyPoints?.length) parts.push(`语法要点：${keyPoints.join('、')}`);
                    return parts.filter(Boolean).join('\n') || '暂无分析结果';
                }
                case 'grammar': {
                    const grammarPoint = sub.grammar_point as string | undefined;
                    const explanation = sub.explanation as string | undefined;
                    const examples = sub.examples as string[] | undefined;
                    const parts: string[] = [];
                    if (grammarPoint) parts.push(`语法点：${grammarPoint}`);
                    if (explanation) parts.push(explanation);
                    if (examples?.length) parts.push(`例句：${examples.join('；')}`);
                    return parts.filter(Boolean).join('\n') || '暂无语法解释';
                }
                case 'translate': {
                    const translation = sub.translation as string | undefined;
                    const notes = sub.notes as string | undefined;
                    const parts: string[] = [];
                    if (translation) parts.push(translation);
                    if (notes) parts.push(`注：${notes}`);
                    return parts.filter(Boolean).join('\n') || '暂无翻译结果';
                }
                case 'free':
                default: {
                    return (sub.answer as string | undefined) ?? (sub.content as string | undefined) ?? '暂无回答';
                }
            }
        }
        if (result.status === 'failed') return `AI 分析失败：${result.error_log?.join(', ') ?? '未知错误'}`;
    } catch (e) {
        return `AI 请求出错：${e instanceof Error ? e.message : '未知错误'}`;
    }
    return 'AI 响应超时，请重试';
}

// ────────────────────────────────────────────────────────────────────────────
// Memory API – 7. 长期记忆
// ────────────────────────────────────────────────────────────────────────────

// 7.1 训练记录

export async function getTrainingRecords(token: string, limit = 20): Promise<TrainingRecordListResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/training?limit=${limit}`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取训练记录失败');
    return res.json() as Promise<TrainingRecordListResponse>;
}

export async function addTrainingRecord(token: string, record: TrainingRecord): Promise<{
    message: string;
    record: TrainingRecord
}> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/training`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(record),
    });
    if (!res.ok) await extractApiError(res, '保存训练记录失败');
    return res.json() as Promise<{ message: string; record: TrainingRecord }>;
}

// 7.2 错题本

export interface MistakeFilters {
    keyword?: string;
    error_category?: string;
    question_type?: string;
    difficulty?: string;
    limit?: number;
}

export async function getMistakes(token: string, filters: MistakeFilters = {}): Promise<MistakeListResponse> {
    const apiBase = requireApiBase();
    const params = new URLSearchParams();
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.error_category) params.set('error_category', filters.error_category);
    if (filters.question_type) params.set('question_type', filters.question_type);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.limit) params.set('limit', String(filters.limit));
    const res = await fetch(`${apiBase}/api/memory/mistakes?${params}`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取错题失败');
    return res.json() as Promise<MistakeListResponse>;
}

export async function getDueMistakes(token: string, limit = 10): Promise<DueMistakesResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/mistakes/due?limit=${limit}`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取待复习错题失败');
    return res.json() as Promise<DueMistakesResponse>;
}

export async function addMistake(token: string, mistake: Omit<MistakeRecord, 'review_count' | 'next_review_at' | 'created_at'>): Promise<{
    message: string;
    mistake_id: string
}> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/mistakes`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(mistake),
    });
    if (!res.ok) await extractApiError(res, '记录错题失败');
    return res.json() as Promise<{ message: string; mistake_id: string }>;
}

export async function updateMistake(token: string, mistakeId: string, updates: Partial<MistakeRecord>): Promise<{
    message: string;
    mistake_id: string
}> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/mistakes/${mistakeId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(updates),
    });
    if (!res.ok) await extractApiError(res, '更新错题失败');
    return res.json() as Promise<{ message: string; mistake_id: string }>;
}

export async function deleteMistake(token: string, mistakeId: string): Promise<{ message: string }> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/mistakes/${mistakeId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    });
    if (!res.ok) await extractApiError(res, '删除错题失败');
    return res.json() as Promise<{ message: string }>;
}

// 7.3 遗忘曲线（SM-2）

export async function getCurveOverview(token: string): Promise<CurveOverview> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/curve`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取遗忘曲线概况失败');
    return res.json() as Promise<CurveOverview>;
}

export async function getDueCurveItems(token: string, limit = 10): Promise<DueCurveResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/curve/due?limit=${limit}`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取待复习条目失败');
    return res.json() as Promise<DueCurveResponse>;
}

export async function submitReview(token: string, itemId: string, quality: 0 | 1 | 2 | 3 | 4 | 5): Promise<ReviewResult> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/curve/${itemId}/review`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({quality}),
    });
    if (!res.ok) await extractApiError(res, '提交复习结果失败');
    return res.json() as Promise<ReviewResult>;
}

// 7.4 战力值历史

export async function getPowerHistory(token: string, limit = 30): Promise<PowerHistoryResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/power?limit=${limit}`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取战力值历史失败');
    return res.json() as Promise<PowerHistoryResponse>;
}

export async function addPowerRecord(token: string, score: number, reason?: string): Promise<{
    message: string;
    score: number
}> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/memory/power`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({score, reason}),
    });
    if (!res.ok) await extractApiError(res, '记录战力值失败');
    return res.json() as Promise<{ message: string; score: number }>;
}

// ────────────────────────────────────────────────────────────────────────────
// Sessions API – 8. 工作记忆会话
// ────────────────────────────────────────────────────────────────────────────

export interface SessionListResponse {
    user_id: string;
    session_type: string;
    session_ids: string[];
    count: number;
}

export async function getSessions(token: string, sessionType: 'training' | 'chatting' = 'training'): Promise<SessionListResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/sessions?session_type=${sessionType}`, {headers: authHeaders(token)});
    if (!res.ok) throw new Error('获取会话列表失败');
    return res.json() as Promise<SessionListResponse>;
}

export async function getCurrentSession(token: string, sessionType: 'training' | 'chatting' = 'training'): Promise<Record<string, unknown> | null> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/sessions/current?session_type=${sessionType}`, {headers: authHeaders(token)});
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('获取当前会话失败');
    return res.json() as Promise<Record<string, unknown>>;
}

export async function deleteSession(token: string, sessionId: string): Promise<{ message: string }> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/sessions/${sessionId}`, {method: 'DELETE', headers: authHeaders(token)});
    if (!res.ok) await extractApiError(res, '删除会话失败');
    return res.json() as Promise<{ message: string }>;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface SessionHistoryResponse {
    session_id: string;
    total_messages: number;
    returned: number;
    history: ConversationMessage[];
}

export async function getSessionHistory(token: string, sessionId: string, limit = 40): Promise<SessionHistoryResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/sessions/${sessionId}/history?limit=${limit}`, {headers: authHeaders(token)});
    if (res.status === 404) return {session_id: sessionId, total_messages: 0, returned: 0, history: []};
    if (!res.ok) throw new Error('获取会话历史失败');
    return res.json() as Promise<SessionHistoryResponse>;
}

// ────────────────────────────────────────────────────────────────────────────
// Admin API – 9. 管理后台
// ────────────────────────────────────────────────────────────────────────────

export interface AdminUser extends UserProfile {
    phone?: string;
    email?: string;
}

export interface AdminUsersResponse {
    count: number;
    users: AdminUser[];
}

export interface AdminInvite {
    code: string;
    created_by: string;
    max_uses: number;
    used_count: number;
    used_by: string[];
    expires_at?: string | null;
    created_at: string;
    note: string;
    revoked: boolean;
    is_valid: boolean;
}

export interface AdminInvitesResponse {
    count: number;
    invites: AdminInvite[];
}

export interface AdminSessionSummary {
    session_id: string;
    session_type: 'training' | 'chatting';
    created_at: string;
    updated_at: string;
    article_count: number;
    message_count: number;
    agent_info_count: number;
}

export interface AdminUserSessionsResponse {
    user_id: string;
    count: number;
    sessions: AdminSessionSummary[];
}

export interface AdminLLMConfig {
    provider: 'openai' | 'deepseek' | 'stub';
    model: string;
    temperature: number;
    base_url: string;
    has_api_key: boolean;
    api_key_source: 'environment' | 'unset';
    runtime_overrides: {
        provider: boolean;
        model: boolean;
        temperature: boolean;
        base_url: boolean;
    };
}

export interface AdminUserUpdatePayload {
    username?: string;
    exam_region?: string;
    grade?: string;
    school?: string;
    status?: 'active' | 'disabled';
    role?: 'user' | 'admin';
}

export interface AdminInviteCreatePayload {
    max_uses: number;
    note?: string;
    expires_at?: string;
}

export interface AdminLLMUpdatePayload {
    provider: 'openai' | 'deepseek' | 'stub';
    model?: string;
    temperature?: number;
    base_url?: string;
}

export async function adminListUsers(
    token: string,
    status?: 'active' | 'disabled',
    limit = 100,
): Promise<AdminUsersResponse> {
    const apiBase = requireApiBase();
    const params = new URLSearchParams({limit: String(limit)});
    if (status) params.set('status', status);
    const res = await fetch(`${apiBase}/api/admin/users?${params.toString()}`, {headers: authHeaders(token)});
    if (!res.ok) await extractApiError(res, '获取用户列表失败');
    return res.json() as Promise<AdminUsersResponse>;
}

export async function adminUpdateUser(
    token: string,
    userId: string,
    payload: AdminUserUpdatePayload,
): Promise<AdminUser> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) await extractApiError(res, '更新用户失败');
    return res.json() as Promise<AdminUser>;
}

export async function adminDeleteUser(token: string, userId: string): Promise<{ message: string; user_id: string }> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    });
    if (!res.ok) await extractApiError(res, '删除用户失败');
    return res.json() as Promise<{ message: string; user_id: string }>;
}

export async function adminListUserSessions(token: string, userId: string, limit = 50): Promise<AdminUserSessionsResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/users/${userId}/sessions?limit=${limit}`, {
        headers: authHeaders(token),
    });
    if (!res.ok) await extractApiError(res, '获取会话列表失败');
    return res.json() as Promise<AdminUserSessionsResponse>;
}

export async function adminGetUserSessionHistory(
    token: string,
    userId: string,
    sessionId: string,
    limit = 40,
): Promise<SessionHistoryResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/users/${userId}/sessions/${sessionId}/history?limit=${limit}`, {
        headers: authHeaders(token),
    });
    if (!res.ok) await extractApiError(res, '获取会话历史失败');
    return res.json() as Promise<SessionHistoryResponse>;
}

export async function adminDeleteUserSession(
    token: string,
    userId: string,
    sessionId: string,
): Promise<{ message: string; user_id: string; session_id: string }> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    });
    if (!res.ok) await extractApiError(res, '删除会话失败');
    return res.json() as Promise<{ message: string; user_id: string; session_id: string }>;
}

export async function adminListInvites(token: string, limit = 100): Promise<AdminInvitesResponse> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/invites?limit=${limit}`, {headers: authHeaders(token)});
    if (!res.ok) await extractApiError(res, '获取邀请码失败');
    return res.json() as Promise<AdminInvitesResponse>;
}

export async function adminCreateInvite(token: string, payload: AdminInviteCreatePayload): Promise<AdminInvite> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/invites`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) await extractApiError(res, '创建邀请码失败');
    return res.json() as Promise<AdminInvite>;
}

export async function adminRevokeInvite(token: string, code: string): Promise<AdminInvite> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/invites/${code}/revoke`, {
        method: 'POST',
        headers: authHeaders(token),
    });
    if (!res.ok) await extractApiError(res, '撤销邀请码失败');
    return res.json() as Promise<AdminInvite>;
}

export async function adminGetLlmConfig(token: string): Promise<AdminLLMConfig> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/llm-config`, {headers: authHeaders(token)});
    if (!res.ok) await extractApiError(res, '获取 AI 配置失败');
    return res.json() as Promise<AdminLLMConfig>;
}

export async function adminUpdateLlmConfig(token: string, payload: AdminLLMUpdatePayload): Promise<AdminLLMConfig> {
    const apiBase = requireApiBase();
    const res = await fetch(`${apiBase}/api/admin/llm-config`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
    });
    if (!res.ok) await extractApiError(res, '更新 AI 配置失败');
    return res.json() as Promise<AdminLLMConfig>;
}

// ────────────────────────────────────────────────────────────────────────────
// Legacy exports (kept for backward compatibility)
// ────────────────────────────────────────────────────────────────────────────

export async function pollDiagnosis(
    attemptId: string,
    questions: TrainingQuestion[],
    attempts: QuestionAttempt[],
): Promise<DiagnosisResponse> {
    void attemptId;
    void questions;
    void attempts;
    throw new Error('pollDiagnosis 已废弃，请改用 submitAttemptDiagnosis');
}
