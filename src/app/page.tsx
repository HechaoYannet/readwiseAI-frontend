'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { BookOpenCheck, Gauge, Lightbulb, MessageCircle, Settings, Timer, Zap, ChevronRight, Send, History } from 'lucide-react';
import ModeCardItem from '@/components/home/mode-card';
import PowerOrb from '@/components/home/power-orb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrainingStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { getUserStats, submitQA, getSessions, getSessionHistory } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { ModeCard } from '@/types/home';

const modeCards: ModeCard[] = [
  {
    title: '速读训练',
    icon: <Zap className="h-5 w-5" />,
    description: '限时阅读，提升信息抓取速度',
    duration: '约 5 分钟',
    color: 'bg-gradient-to-br from-sky-50 to-cyan-50',
    href: '/train',
  },
  {
    title: '精读训练',
    icon: <BookOpenCheck className="h-5 w-5" />,
    description: '拆解长难句，强化语法理解',
    duration: '约 15 分钟',
    color: 'bg-gradient-to-br from-blue-50 to-slate-50',
    href: '/train',
  },
  {
    title: '猜词训练',
    icon: <Lightbulb className="h-5 w-5" />,
    description: '语境推断，提升词义判断能力',
    duration: '约 8 分钟',
    color: 'bg-gradient-to-br from-amber-50 to-orange-50',
    href: '/train',
  },
  {
    title: '模考冲刺',
    icon: <Timer className="h-5 w-5" />,
    description: '全真节奏，检验稳定输出',
    duration: '约 35 分钟',
    color: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    href: '/train',
  },
];

/** Renders AI response with basic Markdown support */
function MarkdownMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px] text-slate-800">{children}</code>
        ),
        ul: ({ children }) => <ul className="ml-3 list-disc space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="ml-3 list-decimal space-y-0.5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function Home() {
  const { currentGroup, powerScore, homeChatSessionId, setHomeChatSessionId } = useTrainingStore();
  const { token, user, stats, setStats } = useAuthStore();
  const router = useRouter();
  const hasInProgress = currentGroup?.status === 'in_progress';
  const score = powerScore?.total ?? stats?.latest_power ?? 0;

  const completedIdx = currentGroup?.sessions.filter((s) => s.status === 'completed').length ?? 0;

  const [showAiChat, setShowAiChat] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  // Refresh user stats on mount
  useEffect(() => {
    if (!token) return;
    getUserStats(token).then(setStats).catch(() => {});
  }, [token, setStats]);

  // Track whether chat init has been run for the current chat open
  const chatInitDoneRef = useRef(false);

  // Initialize home chat: get or create a persistent chatting session
  useEffect(() => {
    if (!token || !showAiChat) return;
    if (chatInitDoneRef.current) return;
    chatInitDoneRef.current = true;

    const storedSessionId = homeChatSessionId;
    const currentMessages = aiMessages;

    const initSession = async () => {
      // Use stored session or fetch the most recent chatting session
      let sessionId = storedSessionId;
      if (!sessionId) {
        try {
          const list = await getSessions(token, 'chatting');
          if (list.session_ids.length > 0) {
            sessionId = list.session_ids[0];
          }
        } catch {
          // ignore
        }
        if (!sessionId) {
          // Create a new session ID (will be registered on first message)
          sessionId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        }
        setHomeChatSessionId(sessionId);
      }

      // Load conversation history only if no messages loaded yet
      if (currentMessages.length === 0 && sessionId) {
        setLoadingHistory(true);
        try {
          const hist = await getSessionHistory(token, sessionId, 40);
          if (hist.history.length > 0) {
            setAiMessages(
              hist.history.map((m) => ({
                role: m.role === 'assistant' ? 'bot' : 'user',
                text: m.content,
              })),
            );
          }
        } catch {
          // ignore
        } finally {
          setLoadingHistory(false);
        }
      }

      // Fetch all chatting session IDs for session manager
      try {
        const list = await getSessions(token, 'chatting');
        setSessionIds(list.session_ids);
      } catch {
        // ignore
      }
    };

    void initSession();
  }, [token, showAiChat]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset init flag when chat is closed so it re-initializes on next open
  useEffect(() => {
    if (!showAiChat) chatInitDoneRef.current = false;
  }, [showAiChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  if (!token) return null;

  async function switchSession(sessionId: string) {
    if (!token) return;
    setHomeChatSessionId(sessionId);
    setAiMessages([]);
    setShowSessions(false);
    setLoadingHistory(true);
    try {
      const hist = await getSessionHistory(token, sessionId, 40);
      if (hist.history.length > 0) {
        setAiMessages(
          hist.history.map((m) => ({
            role: m.role === 'assistant' ? 'bot' : 'user',
            text: m.content,
          })),
        );
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }

  function startNewSession() {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setHomeChatSessionId(sessionId);
    setAiMessages([]);
    setShowSessions(false);
  }

  async function handleAiSend() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setAiLoading(true);

    // Ensure we have a session ID
    const sessionId = homeChatSessionId ?? `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!homeChatSessionId) setHomeChatSessionId(sessionId);

    try {
      const reply = await submitQA(token!, {
        request_type: 'qa',
        query_type: 'free',
        content: userMsg,
        session_id: sessionId,
      });
      setAiMessages((prev) => [...prev, { role: 'bot', text: reply }]);
      // Refresh session list after first message
      if (sessionIds.length === 0 || !sessionIds.includes(sessionId)) {
        getSessions(token!, 'chatting').then((l) => setSessionIds(l.session_ids)).catch(() => {});
      }
    } catch {
      setAiMessages((prev) => [...prev, { role: 'bot', text: '请求失败，请重试' }]);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">ReadWise AI</p>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">你好，{user?.username ?? '同学'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <PowerOrb score={score} />
          <Link
            href="/settings"
            aria-label="打开设置"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {hasInProgress && currentGroup && (
        <Link
          href={`/read/${currentGroup.group_id}-${completedIdx}`}
          className="block rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">继续上次训练</p>
              <p className="text-sm text-amber-600 mt-0.5">
                第 {completedIdx + 1} / {currentGroup.articles.length} 篇
                · {currentGroup.difficulty}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-amber-600" />
          </div>
        </Link>
      )}

      <Card className="border-sky-100 bg-gradient-to-r from-sky-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <Gauge className="h-5 w-5 text-sky-500" />
            今日推荐
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {stats?.due_for_review && stats.due_for_review > 0 ? (
            <>
              基于遗忘曲线，建议优先复习{' '}
              <span className="font-semibold text-slate-900">{stats.due_for_review}</span> 道错题。
              {' '}
              <Link href="/review" className="text-sky-600 underline hover:text-sky-700">立即复习</Link>
            </>
          ) : (
            <>
              今日暂无待复习题目，开始训练积累更多错题吧。
            </>
          )}
        </CardContent>
      </Card>

      <section aria-label="训练模式" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modeCards.map((item) => (
          <ModeCardItem key={item.title} item={item} />
        ))}
      </section>

      {/* AI Chat Floating Ball */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        {showAiChat && (
          <div
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            style={{ width: 'min(20rem, calc(100vw - 2rem))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#1E3A5F] px-4 py-3">
              <span className="text-sm font-semibold text-white">AI 问答助手</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSessions((v) => !v)}
                  title="会话管理"
                  className="text-white/70 hover:text-white"
                >
                  <History className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setShowAiChat(false)} className="text-white/70 hover:text-white text-xs">✕</button>
              </div>
            </div>

            {/* Session manager */}
            {showSessions && (
              <div className="border-b border-slate-100 bg-slate-50 p-2 space-y-1 max-h-36 overflow-y-auto">
                <button
                  type="button"
                  onClick={startNewSession}
                  className="w-full rounded px-2 py-1 text-left text-xs text-sky-600 hover:bg-sky-50 font-medium"
                >
                  + 新建会话
                </button>
                {sessionIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void switchSession(id)}
                    className={cn(
                      'w-full truncate rounded px-2 py-1 text-left text-xs transition-colors',
                      id === homeChatSessionId
                        ? 'bg-sky-100 text-sky-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {id}
                  </button>
                ))}
                {sessionIds.length === 0 && (
                  <p className="px-2 py-1 text-xs text-slate-400">暂无历史会话</p>
                )}
              </div>
            )}

            {/* Messages */}
            <div
              className="overflow-y-auto p-3 space-y-2 bg-slate-50"
              style={{ minHeight: '6rem', maxHeight: '40vh' }}
            >
              {loadingHistory ? (
                <p className="text-xs text-slate-400 text-center py-2">加载历史记录...</p>
              ) : aiMessages.length === 0 ? (
                <p className="text-xs text-slate-400">有什么关于英语学习的问题？</p>
              ) : null}
              {aiMessages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-xs',
                    m.role === 'user' ? 'bg-sky-100 text-sky-800 ml-6' : 'bg-white border border-slate-200 text-slate-700',
                  )}
                >
                  {m.role === 'bot' ? <MarkdownMessage text={m.text} /> : m.text}
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-2 border-t border-slate-100">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !aiLoading) void handleAiSend(); }}
                placeholder="输入问题..."
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-sky-400"
                disabled={aiLoading}
              />
              <button
                type="button"
                onClick={() => void handleAiSend()}
                disabled={aiLoading || !aiInput.trim()}
                className="rounded-lg bg-sky-500 px-2 py-1.5 text-white hover:bg-sky-600 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowAiChat((v) => !v)}
          className="h-12 w-12 rounded-full bg-[#1E3A5F] text-white shadow-lg hover:bg-[#16304f] flex items-center justify-center transition-transform hover:scale-105"
          aria-label="AI 问答助手"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </main>
  );
}
