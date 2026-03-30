import { Radar, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">战力值仪表盘</h1>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
              <Radar className="h-5 w-5 text-sky-500" />
              当前战力
            </CardTitle>
            <CardDescription>总分 368 / 500</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(368 / 500) * 100} />
            <p className="text-sm text-slate-600">较上周提升 24 分，继续保持精读训练。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              7 天趋势
            </CardTitle>
            <CardDescription>图表功能后续接入 Recharts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              词汇力 +6，推断力 +4，速读力 +9。
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

