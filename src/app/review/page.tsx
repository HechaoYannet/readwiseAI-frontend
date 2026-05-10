'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/auth-store';
import { getDueMistakes, submitReview, updateMistake } from '@/lib/api-client';
import type { MistakeRecord } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const QUALITY_LABELS: { value: 0 | 1 | 2 | 3 | 4 | 5; label: string; color: string }[] = [
  { value: 0, label: '完全不记得', color: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' },
  { value: 1, label: '印象模糊', color: 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { value: 2, label: '看答案后想起', color: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { value: 3, label: '勉强答对', color: 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  { value: 4, label: '答对但有犹豫', color: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { value: 5, label: '完全掌握', color: 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100' },
];

export default function ReviewPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [nextReviewInfo, setNextReviewInfo] = useState<string | null>(null);

  const loadDueMistakes = useCallback(async () => {
    if (!token) { router.replace('/login'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getDueMistakes(token, 20);
      setMistakes(data.mistakes);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    void loadDueMistakes();
  }, [loadDueMistakes]);

  if (!token) return null;

  const currentMistake = mistakes[currentIndex];
  const totalCount = mistakes.length;
  const isFinished = reviewedCount >= totalCount && totalCount > 0;

  function handleSelectAnswer(option: string) {
    if (showResult) return;
    setSelectedAnswer(option);
  }

  async function handleSubmitAnswer() {
    if (!selectedAnswer || !currentMistake || showResult) return;
    setShowResult(true);
  }

  async function handleRate(quality: 0 | 1 | 2 | 3 | 4 | 5) {
    if (!currentMistake || submitting) return;
    setSubmitting(true);
    try {
      const result = await submitReview(token!, currentMistake.mistake_id, quality);
      setNextReviewInfo(`下次复习：${new Date(result.next_review_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}（${result.interval_days} 天后）`);

      await updateMistake(token!, currentMistake.mistake_id, {
        review_count: (currentMistake.review_count ?? 0) + 1,
        next_review_at: result.next_review_at,
      });

      setTimeout(() => {
        setReviewedCount((c) => c + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setNextReviewInfo(null);
        setCurrentIndex((i) => i + 1);
        setSubmitting(false);
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        <p className="text-sm text-slate-500">加载待复习题目...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
        <XCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <Button onClick={() => void loadDueMistakes()}>重试</Button>
      </main>
    );
  }

  if (totalCount === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <h1 className="text-xl font-bold text-[#1E3A5F]">今日复习完成！</h1>
        <p className="text-sm text-slate-500 text-center">暂无待复习题目，继续训练积累更多错题吧</p>
        <Button onClick={() => router.push('/train')} className="bg-[#1E3A5F] hover:bg-[#16304f]">
          <BookOpen className="mr-2 h-4 w-4" />
          开始训练
        </Button>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <h1 className="text-xl font-bold text-[#1E3A5F]">今日复习完成！</h1>
        <p className="text-sm text-slate-500">共复习 {reviewedCount} 道题，系统已根据记忆质量更新复习计划</p>
        <Button onClick={() => router.push('/')} className="bg-[#1E3A5F] hover:bg-[#16304f]">返回首页</Button>
      </main>
    );
  }

  if (!currentMistake) return null;

  const isCorrect = selectedAnswer === currentMistake.correct_answer;
  const progressValue = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">今日复习</h1>
          <p className="text-xs text-slate-400 mt-0.5">基于遗忘曲线（SM-2）排序</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">{reviewedCount} / {totalCount}</p>
          <p className="text-xs text-slate-400">已复习</p>
        </div>
      </header>

      <Progress value={progressValue} />

      {currentMistake.article_excerpt && (
        <Card className="border-slate-100 bg-slate-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-slate-400 mb-1">原文片段</p>
            <p className="text-sm text-slate-700 leading-relaxed italic">&ldquo;{currentMistake.article_excerpt}&rdquo;</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {currentMistake.difficulty && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                {currentMistake.difficulty}
              </span>
            )}
            {currentMistake.question_type && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {currentMistake.question_type}
              </span>
            )}
            {currentMistake.review_count !== undefined && (
              <span className="text-xs text-slate-400">第 {(currentMistake.review_count ?? 0) + 1} 次复习</span>
            )}
          </div>
          <CardTitle className="text-base text-slate-800 mt-2 leading-relaxed">
            {currentMistake.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.entries(currentMistake.options) as [string, string][]).map(([label, text]) => {
            let cls = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
            if (showResult) {
              if (label === currentMistake.correct_answer) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
              else if (label === selectedAnswer) cls = 'border-red-400 bg-red-50 text-red-700';
            } else if (label === selectedAnswer) {
              cls = 'border-sky-400 bg-sky-50 text-sky-700';
            }
            return (
              <button
                key={label}
                type="button"
                disabled={showResult}
                onClick={() => handleSelectAnswer(label)}
                className={cn('w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors', cls)}
              >
                <span className="mr-2 font-semibold">{label}.</span>{text}
                {showResult && label === currentMistake.correct_answer && <span className="ml-2 text-emerald-600">✓</span>}
                {showResult && label === selectedAnswer && label !== currentMistake.correct_answer && <span className="ml-2 text-red-500">✗</span>}
              </button>
            );
          })}

          {!showResult && (
            <Button
              className="w-full mt-2 bg-sky-600 hover:bg-sky-700"
              disabled={!selectedAnswer}
              onClick={handleSubmitAnswer}
            >
              确认答案
            </Button>
          )}
        </CardContent>
      </Card>

      {showResult && (
        <Card className={cn('border', isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
          <CardHeader className="pb-2">
            <CardTitle className={cn('flex items-center gap-2 text-base', isCorrect ? 'text-emerald-700' : 'text-red-700')}>
              {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {isCorrect ? '回答正确！' : '回答错误'}
            </CardTitle>
            {!isCorrect && currentMistake.error_category && (
              <CardDescription className="text-red-600">错误类型：{currentMistake.error_category}</CardDescription>
            )}
          </CardHeader>
          {currentMistake.explanation && (
            <CardContent className="pt-0">
              <p className="text-sm text-slate-700">{currentMistake.explanation}</p>
            </CardContent>
          )}
        </Card>
      )}

      {showResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700">这道题你的记忆程度如何？</CardTitle>
            <CardDescription className="text-xs">根据你的评分，系统会调整下次复习时间</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUALITY_LABELS.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRate(value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    color,
                    submitting && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {value} – {label}
                </button>
              ))}
            </div>
            {nextReviewInfo && (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                <RotateCcw className="h-3.5 w-3.5" />
                {nextReviewInfo}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

