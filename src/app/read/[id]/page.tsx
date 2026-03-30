'use client';

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Clock3, Flag, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Question } from "@/types/reading";

interface ReadPageProps {
  params: Promise<{ id: string }>;
}

const paragraphList = [
  "In recent years, students have faced an overload of digital information. Efficient reading no longer means reading every word, but selecting meaningful signals with clear intent.",
  "Cognitive science suggests that spaced repetition and retrieval practice are more effective than passive rereading. Learners who revisit mistakes with feedback retain knowledge longer.",
  "For exam preparation, combining timed reading with deliberate review creates a balanced rhythm: speed for confidence, and deep analysis for stable accuracy.",
];

const questionList: Question[] = [
  {
    id: "q1",
    prompt: "What is the main idea of paragraph 1?",
    options: [
      "Digital tools always improve deep understanding.",
      "Efficient reading requires purposeful information filtering.",
      "Students should avoid all online reading materials.",
      "Reading speed is more important than comprehension.",
    ],
  },
  {
    id: "q2",
    prompt: "Which method best improves long-term retention according to paragraph 2?",
    options: ["Silent rereading", "Spaced retrieval with feedback", "Taking notes only", "Memorizing keywords"],
  },
];

export default function ReadPage({ params }: ReadPageProps) {
  const { id } = use(params);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questionList[currentQuestionIndex];
  const answeredCount = useMemo(
    () => questionList.filter((question) => Boolean(answers[question.id])).length,
    [answers]
  );

  function handleAnswerSelect(value: string): void {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: value,
    }));
  }

  function handleNextQuestion(): void {
    setCurrentQuestionIndex((previous) => Math.min(previous + 1, questionList.length - 1));
  }

  function handlePreviousQuestion(): void {
    setCurrentQuestionIndex((previous) => Math.max(previous - 1, 0));
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-600 transition-colors hover:text-slate-900" aria-label="返回首页">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Read Session</p>
            <h1 className="text-lg font-semibold text-slate-900">阅读任务 #{id}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock3 className="h-4 w-4" />
          已用时 06:12
          <span className="mx-1 text-slate-300">|</span>
          <Flag className="h-4 w-4" />
          速读模式
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-[#1E3A5F]">文章阅读区</CardTitle>
            <CardDescription>每段可计时阅读，支持后续接入自动滚动与查词功能。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <PlayCircle className="h-4 w-4 text-sky-500" />
              当前段落：1 / {paragraphList.length}
            </div>
            {paragraphList.map((paragraph, index) => (
              <p
                key={paragraph}
                className={`rounded-lg border p-4 text-sm leading-7 ${
                  index === 0 ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white"
                }`}
              >
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1E3A5F]">答题区</CardTitle>
            <CardDescription>
              第 {currentQuestionIndex + 1} / {questionList.length} 题
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(answeredCount / questionList.length) * 100} />

            <div className="space-y-3 rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">{currentQuestion.prompt}</p>
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "border-sky-400 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handlePreviousQuestion}>
                上一题
              </Button>
              <Button className="flex-1" onClick={handleNextQuestion}>
                下一题
              </Button>
            </div>
            <Button className="w-full" disabled={answeredCount !== questionList.length}>
              提交并诊断
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

