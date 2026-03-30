import { Bell, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">设置</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <UserRound className="h-5 w-5 text-sky-500" />
            账户与学习偏好
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>用户名：林同学（mock）</p>
          <p>目标：全国 I 卷阅读 85+（mock）</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <Bell className="h-5 w-5 text-amber-500" />
            通知
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">周中 5 分钟微复习提醒：已开启（mock）</CardContent>
      </Card>
    </main>
  );
}

