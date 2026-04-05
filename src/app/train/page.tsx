'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ChevronRight, Loader2, PlayCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrainingStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { generateTrainingGroup } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const difficulties = [
  { value: 'L1', label: 'L1', desc: '初级' },
  { value: 'L2', label: 'L2', desc: '中级' },
  { value: 'L3', label: 'L3', desc: '高级' },
  { value: 'L4', label: 'L4', desc: '竞赛' },
];

const topics = [
  { value: 'technology', label: '科技' },
  { value: 'culture', label: '文化' },
  { value: 'society', label: '社会' },
  { value: 'environment', label: '环境' },
  { value: 'education', label: '教育' },
];

export default function TrainPage() {
  const router = useRouter();
  const { currentGroup, startGroup, resetGroup, trainingHistory } = useTrainingStore();
  const { token } = useAuthStore();

  const [difficulty, setDifficulty] = useState('L2');
  const [topic, setTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInProgress = currentGroup?.status === 'in_progress';

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const group = await generateTrainingGroup(token ?? '', difficulty, topic ?? undefined);
      startGroup(group);
      router.push(`/read/${group.group_id}-0`);
    } catch {
      setError('生成文章失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  function handleResume() {
    if (!currentGroup) return;
    const idx = currentGroup.sessions.filter((s) => s.status === 'completed').length;
    router.push(`/read/${currentGroup.group_id}-${idx}`);
  }

  function handleReset() {
    resetGroup();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">开始训练</h1>
        <p className="mt-1 text-sm text-slate-500">每次训练包含 4 篇文章，系统会自动计时并分析错误</p>
      </header>

      {hasInProgress && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <RotateCcw className="h-4 w-4" />
              有未完成的训练
            </CardTitle>
            <CardDescription className="text-amber-700">
              上次训练进行到第{' '}
              {(currentGroup?.sessions.filter((s) => s.status === 'completed').length ?? 0) + 1}{' '}
              篇，可继续或重置
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm" onClick={handleResume} className="bg-amber-600 hover:bg-amber-700">
              继续训练
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset} className="border-amber-300 text-amber-700 hover:bg-amber-100">
              重置
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F]">难度选择</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {difficulties.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={cn(
                  'rounded-lg border-2 px-3 py-4 text-center transition-colors',
                  difficulty === d.value
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                )}
              >
                <p className="text-lg font-bold">{d.label}</p>
                <p className="text-xs text-slate-500">{d.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F]">主题选择（可选）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTopic(topic === t.value ? null : t.value)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-colors',
                  topic === t.value
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {topic === null && <p className="mt-2 text-xs text-slate-400">不选则随机主题</p>}
        </CardContent>
      </Card>

      <Card className="border-slate-100 bg-slate-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <BookOpen className="h-4 w-4 text-sky-500 shrink-0" />
            <span>训练包含 4 篇文章，每篇 3-4 道题，系统计时并在完成后提供 AI 诊断分析</span>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <Button
        size="lg"
        className="w-full bg-[#1E3A5F] hover:bg-[#16304f]"
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            生成文章中...
          </>
        ) : (
          <>
            <PlayCircle className="mr-2 h-5 w-5" />
            开始训练
          </>
        )}
      </Button>

      {/* Training History */}
      {trainingHistory.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-3">训练记录</h2>
          <div className="space-y-2">
            {trainingHistory.map((g) => {
              const date = new Date(g.start_time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
              const durationMin = Math.round(((g.end_time || g.start_time) - g.start_time) / 60000);
              return (
                <Link key={g.group_id} href={`/analysis/${g.group_id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer border-slate-100">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{date} · {g.difficulty}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{g.articles.length} 篇文章 · {durationMin} 分钟</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
