'use client';

import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Loader2,
  MapPin,
  School,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { getMe, getUserStats } from '@/lib/api-client';
import type { UserStats } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

function StatItem({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <span className="w-20 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value || '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, setUser, setStats } = useAuthStore();
  const [stats, setLocalStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    async function fetchData() {
      if (!token) return;
      setLoading(true);
      try {
        const [profile, userStats] = await Promise.all([
          getMe(token),
          getUserStats(token),
        ]);
        if (cancelled) return;
        setUser(profile);
        setStats(userStats);
        setLocalStats(userStats);
      } catch {
        // silently fall back to cached data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => { cancelled = true; };
  }, [token, router, setUser, setStats]);

  if (!token) return null;

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return iso; }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">我的主页</h1>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <UserRound className="h-5 w-5 text-sky-500" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !user ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载中…
            </div>
          ) : user ? (
            <div>
              {/* Avatar / name row */}
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-2xl font-bold text-white shadow">
                  {user.username.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-slate-800">{user.username}</p>
                    {user.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <ShieldCheck className="h-3 w-3" /> 管理员
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    状态：{user.status === 'active' ? '✓ 正常' : user.status}
                  </p>
                </div>
              </div>
              <InfoRow icon={MapPin} label="考试地区" value={user.exam_region} />
              <InfoRow icon={GraduationCap} label="年级" value={user.grade} />
              <InfoRow icon={School} label="学校" value={user.school} />
              <InfoRow icon={CalendarDays} label="注册时间" value={formatDate(user.created_at)} />
              <InfoRow icon={CalendarDays} label="最近登录" value={formatDate(user.last_login_at)} />
            </div>
          ) : (
            <p className="py-4 text-sm text-slate-400">暂无用户信息</p>
          )}
        </CardContent>
      </Card>

      {/* Stats card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            学习统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !stats ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载中…
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatItem
                label="战力值"
                value={stats.latest_power}
                icon={Zap}
                color="bg-sky-500"
              />
              <StatItem
                label="错题数"
                value={stats.mistake_count}
                icon={BookOpen}
                color="bg-red-400"
              />
              <StatItem
                label="待复习"
                value={stats.due_for_review}
                icon={CalendarDays}
                color="bg-amber-500"
              />
              <StatItem
                label="训练次数"
                value={stats.power_records}
                icon={TrendingUp}
                color="bg-emerald-500"
              />
            </div>
          ) : (
            <p className="py-4 text-sm text-slate-400">暂无统计数据</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
