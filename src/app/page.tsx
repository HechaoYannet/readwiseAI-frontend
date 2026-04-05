'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpenCheck, Gauge, Lightbulb, MessageCircle, Settings, Timer, Zap, ChevronRight } from 'lucide-react';
import ModeCardItem from '@/components/home/mode-card';
import PowerOrb from '@/components/home/power-orb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrainingStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { getUserStats, submitQA } from '@/lib/api-client';
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

export default function Home() {
  const { currentGroup, powerScore } = useTrainingStore();
  const { token, user, stats, setStats } = useAuthStore();
  const router = useRouter();
  const hasInProgress = currentGroup?.status === 'in_progress';
  const score = powerScore?.total ?? stats?.latest_power ?? 0;

  const completedIdx = currentGroup?.sessions.filter((s) => s.status === 'completed').length ?? 0;

  const [showAiChat, setShowAiChat] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  // Refresh user stats on mount
  useEffect(() => {
    if (!token) return;
    getUserStats(token).then(setStats).catch(() => {});
  }, [token, setStats]);

  if (!token) return null;

  async function handleAiSend() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setAiLoading(true);
    try {
      const reply = await submitQA(token!, {
        request_type: 'qa',
        query_type: 'free',
        content: userMsg,
        session_id: '',
      });
      setAiMessages((prev) => [...prev, { role: 'bot', text: reply }]);
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
          <div className="w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between bg-[#1E3A5F] px-4 py-3">
              <span className="text-sm font-semibold text-white">AI 问答助手</span>
              <button type="button" onClick={() => setShowAiChat(false)} className="text-white/70 hover:text-white text-xs">✕</button>
            </div>
            <div className="flex-1 max-h-48 overflow-y-auto p-3 space-y-2 bg-slate-50">
              {aiMessages.length === 0 && (
                <p className="text-xs text-slate-400">有什么关于英语学习的问题？</p>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs',
                  m.role === 'user' ? 'bg-sky-100 text-sky-800 ml-6' : 'bg-white border border-slate-200 text-slate-700'
                )}>
                  {m.text}
                </div>
              ))}
            </div>
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
                disabled={aiLoading}
                className="rounded-lg bg-sky-500 px-2 py-1.5 text-white text-xs hover:bg-sky-600 disabled:opacity-50"
              >
                {aiLoading ? '...' : '发送'}
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
