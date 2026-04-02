'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock3, Flag, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTrainingStore } from '@/lib/store';
import { createMockTrainingGroup } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { ParagraphTiming, TrainingQuestion } from '@/types/training';

const MIN_SPEED_SCORE = 200;
const BASE_SPEED_SCORE = 500;
const SPEED_PENALTY_PER_MINUTE = 5;
const PARAGRAPH_INTERSECTION_THRESHOLD = 0.3; // fraction of paragraph visible to count as "reading"

interface ReadPageProps {
  params: Promise<{ id: string }>;
}

function useStopwatch(startEpoch: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startEpoch) return;
    const id = setInterval(() => setElapsed(Date.now() - startEpoch), 1000);
    return () => clearInterval(id);
  }, [startEpoch]);
  const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
  return `${mm}:${ss}`;
}

function OptionButton({ label, text, selected, onClick }: {
  label: string; text: string; selected: boolean; onClick: () => void;
}) {
  const cls = selected
    ? 'border-sky-400 bg-sky-50 text-sky-700'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors', cls)}
    >
      <span className="mr-2 font-semibold">{label}.</span>
      {text}
    </button>
  );
}

export default function ReadPage({ params }: ReadPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const lastDash = id.lastIndexOf('-');
  const groupId = id.slice(0, lastDash);
  const articleIndex = parseInt(id.slice(lastDash + 1), 10);

  const store = useTrainingStore();
  const group = store.currentGroup;
  const elapsed = useStopwatch(store.groupStartTime);

  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({});
  const [paragraphTimings, setParagraphTimings] = useState<ParagraphTiming[]>([]);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const paragraphEnterTimes = useRef<Record<number, number>>({});
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Bootstrap: if no group in store, load mock; also hydrate localAnswers from persisted store
  useEffect(() => {
    if (!store.currentGroup) {
      const mock = createMockTrainingGroup();
      store.startGroup({ ...mock, group_id: groupId });
    }
    const saved = useTrainingStore.getState().answers;
    setLocalAnswers(Object.fromEntries(
      Object.entries(saved).map(([k, v]) => [k, v.answer])
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read ?q param on mount to jump to a specific question
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    if (qParam !== null) {
      const idx = parseInt(qParam, 10);
      if (!isNaN(idx)) setQuestionIndex(idx);
    }
  }, []);

  // Set article index in store
  useEffect(() => {
    if (!isNaN(articleIndex)) store.setCurrentArticle(articleIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleIndex]);

  // Track question start time when question index changes
  useEffect(() => {
    const article = group?.articles[articleIndex];
    if (!article) return;
    const q = article.questions[questionIndex];
    if (!q || questionStartTimes[q.question_id]) return;
    setQuestionStartTimes((prev) => ({ ...prev, [q.question_id]: Date.now() }));
  }, [questionIndex, group, articleIndex, questionStartTimes]);

  // IntersectionObserver for paragraph timing
  useEffect(() => {
    const refs = paragraphRefs.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        entries.forEach((entry) => {
          const idx = parseInt(entry.target.getAttribute('data-para-idx') ?? '0', 10);
          if (entry.isIntersecting) {
            paragraphEnterTimes.current[idx] = now;
          } else if (paragraphEnterTimes.current[idx]) {
            const duration = now - paragraphEnterTimes.current[idx];
            setParagraphTimings((prev) => {
              const existing = prev.findIndex((p) => p.paragraph_index === idx);
              const timing: ParagraphTiming = {
                paragraph_index: idx,
                enter_time: paragraphEnterTimes.current[idx],
                exit_time: now,
                duration: existing >= 0 ? prev[existing].duration + duration : duration,
              };
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = timing;
                return updated;
              }
              return [...prev, timing];
            });
            delete paragraphEnterTimes.current[idx];
          }
        });
      },
      { threshold: PARAGRAPH_INTERSECTION_THRESHOLD },
    );

    refs.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [group, articleIndex]);

  const article = group?.articles[articleIndex];
  const questions: TrainingQuestion[] = article?.questions ?? [];
  const currentQuestion = questions[questionIndex];
  const allAnswered = questions.length > 0 && questions.every((q) => localAnswers[q.question_id]);
  const isLastArticle = articleIndex === (group?.articles.length ?? 1) - 1;

  const paragraphs = article ? article.content.split('\n\n').filter(Boolean) : [];

  function selectAnswer(qId: string, answer: string) {
    const start = questionStartTimes[qId] ?? Date.now();
    const timeSpent = Date.now() - start;
    setLocalAnswers((prev) => ({ ...prev, [qId]: answer }));
    store.recordAnswer(qId, answer, timeSpent, start);
  }

  function finalizeTimings(): ParagraphTiming[] {
    const now = Date.now();
    const extra: ParagraphTiming[] = [];
    Object.entries(paragraphEnterTimes.current).forEach(([idx, enter]) => {
      const pIdx = parseInt(idx, 10);
      extra.push({ paragraph_index: pIdx, enter_time: enter, exit_time: now, duration: now - enter });
    });
    return [...paragraphTimings, ...extra];
  }

  function handleNext() {
    const timings = finalizeTimings();
    store.completeCurrentArticle(timings);
    router.push(`/read/${groupId}-${articleIndex + 1}`);
  }

  function handleFinish() {
    const timings = finalizeTimings();
    store.completeCurrentArticle(timings);
    store.completeGroup();

    const totalQ = group?.articles.flatMap((a) => a.questions).length ?? 0;
    const storeAnswers = store.answers;
    const correctCount = group?.articles.flatMap((a) => a.questions).filter((q) => {
      const recorded = storeAnswers[q.question_id];
      return recorded ? recorded.answer === q.correct_answer : localAnswers[q.question_id] === q.correct_answer;
    }).length ?? 0;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const now = Date.now();
    const elapsed = now - (store.groupStartTime ?? now);
    const speed = Math.max(MIN_SPEED_SCORE, BASE_SPEED_SCORE - Math.floor(elapsed / 60000) * SPEED_PENALTY_PER_MINUTE);
    store.setPowerScore({
      total: Math.round((accuracy * 3 + speed) / 4),
      accuracy,
      speed,
      vocabulary: Math.round(accuracy * 0.9),
      grammar: Math.round(accuracy * 0.85),
      inference: Math.round(accuracy * 0.95),
      endurance: Math.min(100, Math.round(speed / 5)),
      updated_at: new Date().toISOString(),
    });

    router.push(`/analysis/${groupId}`);
  }

  if (!article) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-slate-500">加载中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/train" className="text-slate-500 hover:text-slate-900" aria-label="返回训练选择">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs text-slate-400">文章 {articleIndex + 1} / {group?.articles.length ?? 4}</p>
            <h1 className="text-base font-semibold text-slate-900 line-clamp-1">{article.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Clock3 className="h-4 w-4 text-sky-500" />
          <span className="font-mono">{elapsed}</span>
          <span className="text-slate-300">|</span>
          <Flag className="h-4 w-4" />
          <span>{article.difficulty}</span>
        </div>
      </header>

      {/* Progress */}
      <Progress value={((articleIndex) / (group?.articles.length ?? 4)) * 100} className="h-1.5" />

      <section className="grid gap-4 lg:grid-cols-5">
        {/* Article */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1E3A5F]">{article.title}</CardTitle>
            <p className="text-xs text-slate-400">{article.word_count} words · {article.genre}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {paragraphs.map((para, idx) => (
              <p
                key={idx}
                ref={(el) => { paragraphRefs.current[idx] = el; }}
                data-para-idx={idx}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800"
              >
                {para}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Questions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1E3A5F]">答题区</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {Object.keys(localAnswers).filter((k) => questions.some((q) => q.question_id === k)).length} / {questions.length} 已作答
                </span>
                <button
                  type="button"
                  onClick={() => setShowAnswerSheet(true)}
                  title="答题卡"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 transition-colors"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Question navigation pills */}
            <div className="flex gap-1.5 flex-wrap mt-1">
              {questions.map((q, i) => (
                <button
                  key={q.question_id}
                  type="button"
                  onClick={() => setQuestionIndex(i)}
                  className={cn(
                    'h-7 w-7 rounded-full text-xs font-medium transition-colors',
                    i === questionIndex
                      ? 'bg-sky-500 text-white'
                      : localAnswers[q.question_id]
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </CardHeader>

          {currentQuestion && (
            <CardContent className="space-y-3">
              <Progress
                value={(Object.keys(localAnswers).filter((k) => questions.some((q) => q.question_id === k)).length / questions.length) * 100}
              />
              <div className="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-800">
                <span className="mr-1 text-sky-600">Q{questionIndex + 1}.</span>
                {currentQuestion.question_text}
              </div>
              <div className="space-y-2">
                {Object.entries(currentQuestion.options).map(([label, text]) => (
                  <OptionButton
                    key={label}
                    label={label}
                    text={text}
                    selected={localAnswers[currentQuestion.question_id] === label}
                    onClick={() => selectAnswer(currentQuestion.question_id, label)}
                  />
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={questionIndex === 0}
                  onClick={() => setQuestionIndex((i) => i - 1)}
                >
                  上一题
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={questionIndex === questions.length - 1}
                  onClick={() => setQuestionIndex((i) => i + 1)}
                >
                  下一题
                </Button>
              </div>

              {!isLastArticle ? (
                <Button
                  className="w-full bg-sky-600 hover:bg-sky-700"
                  disabled={!allAnswered}
                  onClick={handleNext}
                >
                  下一篇
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="w-full bg-[#1E3A5F] hover:bg-[#16304f]"
                  disabled={!allAnswered}
                  onClick={handleFinish}
                >
                  完成训练 →分析
                </Button>
              )}

              {!allAnswered && (
                <p className="text-center text-xs text-slate-400">请完成所有题目后继续</p>
              )}
            </CardContent>
          )}
        </Card>
      </section>

      {/* Answer Sheet Overlay */}
      {showAnswerSheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAnswerSheet(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1E3A5F]">答题卡</h2>
              <button type="button" onClick={() => setShowAnswerSheet(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {group?.articles.map((art, aIdx) => (
              <div key={art.article_id} className="mb-4">
                <p className="text-xs text-slate-500 mb-2 font-medium">文章 {aIdx + 1} · {art.title}</p>
                <div className="flex flex-wrap gap-2">
                  {art.questions.map((q, qIdx) => {
                    const answered = !!(localAnswers[q.question_id] || store.answers[q.question_id]);
                    const isCurrent = aIdx === articleIndex && qIdx === questionIndex;
                    return (
                      <button
                        key={q.question_id}
                        type="button"
                        onClick={() => {
                          if (aIdx === articleIndex) {
                            setQuestionIndex(qIdx);
                            setShowAnswerSheet(false);
                          } else {
                            setShowAnswerSheet(false);
                            router.push(`/read/${groupId}-${aIdx}?q=${qIdx}`);
                          }
                        }}
                        className={cn(
                          'h-9 w-9 rounded-full text-sm font-semibold transition-all',
                          isCurrent
                            ? 'ring-2 ring-sky-500 ring-offset-1 bg-sky-500 text-white'
                            : answered
                            ? 'bg-sky-500 text-white'
                            : 'bg-white border-2 border-slate-300 text-slate-500',
                        )}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-400 mt-2 text-center">提示：可跨文章跳题，最终提交前须完成所有题目</p>
          </div>
        </div>
      )}
    </main>
  );
}
