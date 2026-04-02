'use client';

import Link from 'next/link';
import { BookOpenCheck, Gauge, Lightbulb, Settings, Timer, Zap, ChevronRight } from 'lucide-react';
import ModeCardItem from '@/components/home/mode-card';
import PowerOrb from '@/components/home/power-orb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrainingStore } from '@/lib/store';
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
  const hasInProgress = currentGroup?.status === 'in_progress';
  const score = powerScore?.total ?? 368;

  const completedIdx = currentGroup?.sessions.filter((s) => s.status === 'completed').length ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">ReadWise AI</p>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">你好，同学</h1>
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
          基于遗忘曲线，建议优先复习{' '}
          <span className="font-semibold text-slate-900">4</span> 个知识点，预计耗时
          <span className="font-semibold text-slate-900"> 18 分钟</span>。
        </CardContent>
      </Card>

      <section aria-label="训练模式" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modeCards.map((item) => (
          <ModeCardItem key={item.title} item={item} />
        ))}
      </section>
    </main>
  );
}
