'use client';

import { use, useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrainingStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { createMockTrainingGroup } from '@/lib/mock-data';
import { addTrainingRecord, addMistake, addPowerRecord, submitQA, submitAttemptDiagnosis } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const LONG_SENTENCE_MIN_WORDS = 15;
const LONG_SENTENCE_MAX_COUNT = 3;

interface AnalysisPageProps {
  params: Promise<{ groupId: string }>;
}

function extractLongSentences(content: string): string[] {
  return content
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.split(' ').length > LONG_SENTENCE_MIN_WORDS)
    .slice(0, LONG_SENTENCE_MAX_COUNT);
}

function LongSentenceItem({ sentence, onAsk, token, sessionId }: {
  sentence: string;
  onAsk: (t: string) => void;
  token: string | null;
  sessionId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<string | null>(null);

  async function handleTranslate() {
    if (translation) { setExpanded(true); return; }
    setTranslating(true);
    setExpanded(true);
    try {
      const result = await submitQA(token ?? '', {
        request_type: 'qa',
        query_type: 'translate',
        content: sentence,
        session_id: sessionId,
      });
      setTranslation(result);
    } catch {
      setTranslation('翻译失败，请重试');
    } finally {
      setTranslating(false);
    }
  }

  async function handleParse() {
    if (parsed) { setExpanded(true); return; }
    setParsing(true);
    setExpanded(true);
    try {
      const result = await submitQA(token ?? '', {
        request_type: 'qa',
        query_type: 'sentence',
        content: sentence,
        session_id: sessionId,
      });
      setParsed(result);
    } catch {
      setParsed('解析失败，请重试');
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2">
      <p className="text-xs text-slate-700 leading-relaxed italic">&ldquo;{sentence}&rdquo;</p>
      {expanded && (
        <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
          {(translating || parsing) && <Loader2 className="h-4 w-4 animate-spin text-sky-500" />}
          {translation && <p><span className="font-medium text-slate-500">译文：</span>{translation}</p>}
          {parsed && <p><span className="font-medium text-slate-500">分析：</span>{parsed}</p>}
        </div>
      )}
      <div className="flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={handleParse}
          className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          {parsing ? <Loader2 className="h-3 w-3 animate-spin" /> : (expanded && parsed ? '收起' : '拆解主干')}
        </button>
        <button
          type="button"
          onClick={handleTranslate}
          className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : '翻译'}
        </button>
        <button
          type="button"
          onClick={() => onAsk(sentence)}
          className="rounded border border-sky-200 px-2 py-0.5 text-xs text-sky-600 hover:bg-sky-50"
        >
          提问
        </button>
      </div>
    </div>
  );
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { groupId } = use(params);
  const store = useTrainingStore();
  const { token } = useAuthStore();

  const [articleTab, setArticleTab] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const mockGroup = useMemo(() => {
    const mock = createMockTrainingGroup();
    return { ...mock, group_id: groupId, status: 'completed' as const };
  }, [groupId]);

  const historicalGroup = useMemo(
    () => store.trainingHistory?.find((g) => g.group_id === groupId),
    [store.trainingHistory, groupId],
  );
  const group = useMemo(
    () => (store.currentGroup?.group_id === groupId ? store.currentGroup : historicalGroup) ?? mockGroup,
    [store.currentGroup, historicalGroup, mockGroup, groupId],
  );

  const article = group.articles[articleTab];
  const paragraphs = article.content.split('\n\n').filter(Boolean);

  const allAnswers = store.answers;
  const allDiagnosis = store.diagnosisResults;

  function getUserAnswer(qId: string) {
    return allAnswers[qId]?.answer ?? '';
  }

  function isCorrect(qId: string, correct: string) {
    return getUserAnswer(qId) === correct;
  }

  const totalQuestions = group.articles.flatMap((a) => a.questions).length;
  const correctCount = group.articles.flatMap((a) => a.questions).filter((q) =>
    isCorrect(q.question_id, q.correct_answer),
  ).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const durationMs = (group.end_time || group.start_time + 900000) - group.start_time;
  const durationMin = Math.round(durationMs / 60000);

  const powerScore = store.powerScore;
  const powerDelta = powerScore ? `+${Math.max(0, Math.round((powerScore.total - 300) / 10))}` : '+?';

  // Save training data to Memory API (runs once when group is completed)
  const hasSavedRef = useRef(false);
  useEffect(() => {
    if (hasSavedRef.current || !token || group.status !== 'completed') return;
    hasSavedRef.current = true;

    const groupSnapshot = group;
    const answersSnapshot = store.answers;
    const powerSnapshot = store.powerScore;

    const totalQ = groupSnapshot.articles.flatMap((a) => a.questions).length;
    const correctC = groupSnapshot.articles.flatMap((a) => a.questions).filter((q) => {
      const ans = answersSnapshot[q.question_id]?.answer;
      return ans === q.correct_answer;
    }).length;
    const acc = totalQ > 0 ? Math.round((correctC / totalQ) * 100) : 0;
    const durMs = (groupSnapshot.end_time || groupSnapshot.start_time + 900000) - groupSnapshot.start_time;

    const doSave = async () => {
      try {
        await addTrainingRecord(token, {
          session_id: groupSnapshot.group_id,
          article_count: groupSnapshot.articles.length,
          question_count: totalQ,
          correct_count: correctC,
          total_time_seconds: Math.round(durMs / 1000),
          difficulty: groupSnapshot.difficulty,
          score: acc,
        });

        setDiagnosisLoading(true);
        for (const art of groupSnapshot.articles) {
          const artAnswers = art.questions.map((q) => ({
            question_id: q.question_id,
            user_answer: answersSnapshot[q.question_id]?.answer ?? '',
            is_correct: answersSnapshot[q.question_id]?.answer === q.correct_answer,
            time_spent: answersSnapshot[q.question_id]?.timeSpent ?? 0,
            start_time: answersSnapshot[q.question_id]?.startTime ?? 0,
            submit_time: Date.now(),
          }));

          const wrongAnswers = artAnswers.filter((a) => !a.is_correct && a.user_answer);
          if (wrongAnswers.length === 0) continue;

          const diagnosisMap = await submitAttemptDiagnosis(token, groupSnapshot.group_id, art, artAnswers);
          for (const [qId, diag] of Object.entries(diagnosisMap)) {
            store.recordDiagnosis(qId, diag);
          }

          for (const attempt of wrongAnswers) {
            const question = art.questions.find((q) => q.question_id === attempt.question_id);
            if (!question) continue;
            const mistakeId = `mis_${groupSnapshot.group_id}_${attempt.question_id}`;
            try {
              await addMistake(token, {
                mistake_id: mistakeId,
                question_text: question.question_text,
                options: question.options,
                correct_answer: question.correct_answer,
                user_answer: attempt.user_answer,
                article_excerpt: art.content.slice(0, 200),
                error_category: diagnosisMap[attempt.question_id]?.error_category,
                explanation: diagnosisMap[attempt.question_id]?.evidence_sentence,
                question_type: question.question_type,
                difficulty: art.difficulty,
              });
            } catch {
              // Non-critical
            }
          }
        }
        setDiagnosisLoading(false);

        if (powerSnapshot) {
          await addPowerRecord(
            token,
            powerSnapshot.total,
            `完成训练，正确率 ${acc}%，难度 ${groupSnapshot.difficulty}`,
          );
        }
      } catch {
        setDiagnosisLoading(false);
      }
    };

    void doSave();
  }, [token, group.status, group.group_id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const reply = await submitQA(token ?? '', {
        request_type: 'qa',
        query_type: 'free',
        content: userMsg,
        session_id: group.group_id,
      });
      setChatMessages((prev) => [...prev, { role: 'bot', text: reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'bot', text: '请求失败，请重试' }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleTextSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }
    const text = sel.toString().trim();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelection({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 45,
    });
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const wrongQuestions = article.questions.filter(
    (q) => !isCorrect(q.question_id, q.correct_answer) && getUserAnswer(q.question_id),
  );

  const longSentences = extractLongSentences(article.content);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs text-slate-500">训练完成！</p>
            <h1 className="text-lg font-bold text-[#1E3A5F]">错误分析报告</h1>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-slate-600">
          <div className="text-center">
            <p className="font-bold text-slate-900">{durationMin} 分钟</p>
            <p className="text-xs text-slate-400">用时</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-emerald-600">{accuracy}%</p>
            <p className="text-xs text-slate-400">正确率</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-sky-600">{powerDelta}</p>
            <p className="text-xs text-slate-400">战力</p>
          </div>
        </div>
      </header>

      {diagnosisLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在获取 AI 错因分析，请稍候...
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: article + error analysis + long sentence analysis */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#1E3A5F]">{article.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto" onMouseUp={handleTextSelection}>
              {paragraphs.map((para, i) => (
                <p key={i} className="text-sm leading-7 text-slate-700">{para}</p>
              ))}
            </CardContent>
          </Card>

          {/* Error analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#1E3A5F]">
                错误分析 ({wrongQuestions.length} 题)
                {diagnosisLoading && <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-sky-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wrongQuestions.length === 0 ? (
                <p className="text-sm text-emerald-600 font-medium">本篇全部答对！🎉</p>
              ) : (
                wrongQuestions.map((q) => {
                  const diag = allDiagnosis[q.question_id];
                  const userAns = getUserAnswer(q.question_id);
                  return (
                    <div key={q.question_id} className="rounded-lg border border-red-100 bg-red-50 p-3 space-y-2">
                      <p className="text-sm font-medium text-slate-800">{q.question_text}</p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">
                          你的答案：{userAns} · {q.options[userAns as keyof typeof q.options]}
                        </span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">
                          正确答案：{q.correct_answer} · {q.options[q.correct_answer as keyof typeof q.options]}
                        </span>
                      </div>
                      {diag ? (
                        <div className="space-y-1 text-xs text-slate-600 border-t border-red-100 pt-2">
                          <p><span className="font-semibold">错误类型：</span>{diag.error_category}</p>
                          <p><span className="font-semibold">证据句：</span>{diag.evidence_sentence}</p>
                          <p><span className="font-semibold">修复建议：</span>{diag.fix_suggestion}</p>
                        </div>
                      ) : diagnosisLoading ? (
                        <p className="text-xs text-slate-400">AI 分析中...</p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Long Sentence Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#1E3A5F]">长难句分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {longSentences.length === 0 ? (
                <p className="text-sm text-slate-400">本篇无长难句</p>
              ) : (
                longSentences.map((sentence, i) => (
                  <LongSentenceItem
                    key={i}
                    sentence={sentence}
                    token={token}
                    sessionId={group.group_id}
                    onAsk={(text) => {
                      setChatInput(`请分析这个句子：${text}`);
                      setTimeout(() => chatInputRef.current?.focus(), 100);
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: question review + AI chat */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Article tabs */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#1E3A5F]">文章导航</CardTitle>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setArticleTab((t) => Math.max(0, t - 1))}
                    disabled={articleTab === 0}
                    className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleTab((t) => Math.min(group.articles.length - 1, t + 1))}
                    disabled={articleTab === group.articles.length - 1}
                    className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mt-1">
                {group.articles.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setArticleTab(i)}
                    className={cn(
                      'flex-1 rounded py-1 text-xs font-medium transition-colors',
                      i === articleTab
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </CardHeader>

            {/* All questions for this article */}
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {article.questions.map((q, i) => {
                const userAns = getUserAnswer(q.question_id);
                const correct = isCorrect(q.question_id, q.correct_answer);
                return (
                  <div key={q.question_id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700">
                      <span className="mr-1 text-sky-600">Q{i + 1}.</span>
                      {q.question_text}
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(q.options).map(([label, text]) => {
                        const isCorrectOption = label === q.correct_answer;
                        const isUserWrongChoice = label === userAns && !correct;
                        const isUserCorrectChoice = label === userAns && correct;
                        let cls = 'border-slate-200 bg-white text-slate-600';
                        if (isCorrectOption) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                        else if (isUserWrongChoice) cls = 'border-red-400 bg-red-50 text-red-700';
                        return (
                          <div key={label} className={cn('w-full rounded-lg border px-3 py-2 text-xs', cls)}>
                            <span className="mr-1.5 font-semibold">{label}.</span>
                            {text}
                            {isCorrectOption && <span className="ml-1.5 text-emerald-600">✓</span>}
                            {isUserWrongChoice && <span className="ml-1.5 text-red-500">✗ 你选的</span>}
                            {isUserCorrectChoice && <span className="ml-1.5 text-emerald-600">✓ 你选的</span>}
                          </div>
                        );
                      })}
                    </div>
                    {!userAns && (
                      <p className="text-xs text-slate-400">未作答</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Chat */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[#1E3A5F]">
                <MessageCircle className="h-4 w-4 text-sky-500" />
                AI 助手
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="rounded-lg bg-slate-50 p-3 min-h-24 max-h-40 overflow-y-auto space-y-2 text-sm">
                {chatMessages.length === 0 && (
                  <p className="text-slate-400 text-xs">输入问题，AI 助手将帮助分析错误原因、解释单词、翻译句子...</p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={cn('rounded px-2 py-1 text-xs', m.role === 'user' ? 'bg-sky-100 text-sky-800 ml-4' : 'bg-white border border-slate-200 text-slate-700')}>
                    {m.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI 思考中...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !chatLoading) void handleChat(); }}
                  placeholder="提问..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                  disabled={chatLoading}
                />
                <Button size="sm" onClick={() => void handleChat()} className="shrink-0" disabled={chatLoading}>
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Link href="/dashboard">
            <Button className="w-full bg-[#1E3A5F] hover:bg-[#16304f]">查看仪表盘</Button>
          </Link>
        </div>
      </div>

      {/* Text selection tooltip */}
      {selection && (
        <div
          className="fixed z-50 flex gap-1 rounded-lg bg-slate-800 p-1 shadow-xl text-white text-xs"
          style={{ left: `${selection.x}px`, top: `${selection.y}px`, transform: 'translateX(-50%)' }}
        >
          <button
            type="button"
            className="px-2 py-1 rounded hover:bg-slate-700"
            onClick={() => {
              const text = selection.text;
              setSelection(null);
              setChatInput(`翻译：${text}`);
              setTimeout(() => void handleChat(), 100);
            }}
          >
            翻译
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded hover:bg-slate-700"
            onClick={() => {
              setChatInput(`请分析这段文字：${selection.text}`);
              setSelection(null);
              setTimeout(() => chatInputRef.current?.focus(), 100);
            }}
          >
            提问
          </button>
        </div>
      )}
    </main>
  );
}

