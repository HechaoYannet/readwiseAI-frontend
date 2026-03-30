import { CheckCircle2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">今日复习</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <RotateCcw className="h-5 w-5 text-amber-500" />
            复习进度 2 / 5
          </CardTitle>
          <CardDescription>基于遗忘曲线排序，优先处理记忆强度最低的题目。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            The author mainly suggests that students should ______.
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline">A. rely on passive rereading</Button>
            <Button variant="outline">B. focus on retrieval practice</Button>
            <Button variant="outline">C. skip timed training</Button>
            <Button variant="outline">D. memorize every sentence</Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            回答后可查看错因解析（占位）
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

