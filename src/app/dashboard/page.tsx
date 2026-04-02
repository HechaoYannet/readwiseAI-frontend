'use client';

import Link from 'next/link';
import { Gauge, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTrainingStore } from '@/lib/store';

const subScoreLabels: Record<string, string> = {
  vocabulary: '词汇力',
  grammar: '语法力',
  inference: '推断力',
  speed: '速读力',
  endurance: '持久力',
};

const trendData = [
  { day: '周一', score: 320 },
  { day: '周二', score: 338 },
  { day: '周三', score: 345 },
  { day: '周四', score: 355 },
  { day: '周五', score: 362 },
  { day: '周六', score: 370 },
  { day: '今天', score: 0 },
];

export default function DashboardPage() {
  const { powerScore, currentGroup } = useTrainingStore();

  const total = powerScore?.total ?? 368;
  const maxScore = 500;

  const subScores = {
    vocabulary: powerScore?.vocabulary ?? 72,
    grammar: powerScore?.grammar ?? 68,
    inference: powerScore?.inference ?? 76,
    speed: powerScore?.speed ?? 80,
    endurance: powerScore?.endurance ?? 65,
  };

  const todayScore = powerScore?.total != null ? powerScore.total : trendData[trendData.length - 1].score;
  const displayTrend = trendData.map((d, i) =>
    i === trendData.length - 1 ? { ...d, score: todayScore } : d,
  );

  const recentGroups = currentGroup ? [currentGroup] : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">战力值仪表盘</h1>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
              <Gauge className="h-5 w-5 text-sky-500" />
              当前战力
            </CardTitle>
            <CardDescription>总分 {total} / {maxScore}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(total / maxScore) * 100} />
            <div className="space-y-2">
              {Object.entries(subScores).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-slate-500">{subScoreLabels[key]}</span>
                  <Progress value={val} className="flex-1 h-2" />
                  <span className="w-8 text-right text-slate-700 font-medium">{val}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              7 天趋势
            </CardTitle>
            <CardDescription>近期战力变化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {displayTrend.map((d) => (
                <div key={d.day} className="flex items-center gap-3 text-sm">
                  <span className="w-10 shrink-0 text-slate-400">{d.day}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all"
                      style={{ width: `${(d.score / maxScore) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-600 font-medium">{d.score || '-'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {recentGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1E3A5F]">最近训练</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentGroups.map((g) => {
              const totalQ = g.articles.flatMap((a) => a.questions).length;
              const sessions = g.sessions ?? [];
              const correct = sessions.flatMap((s) => s.question_attempts).filter((a) => a.is_correct).length;
              const acc = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
              return (
                <div key={g.group_id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">训练组 · {g.difficulty}</p>
                    <p className="text-xs text-slate-400">{new Date(g.start_time).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">正确率 {acc}%</p>
                    <p className="text-xs text-slate-400">{g.status === 'completed' ? '已完成' : '进行中'}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Link href="/train">
        <div className="w-full rounded-xl border border-sky-200 bg-sky-50 p-4 text-center text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer">
          开始新训练 →
        </div>
      </Link>
    </main>
  );
}
