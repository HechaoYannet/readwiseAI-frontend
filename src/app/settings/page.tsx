'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Save,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { updateMe, changePassword } from '@/lib/api-client';
import type { UpdateMePayload } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const EXAM_REGIONS = ['全国I卷', '全国II卷', '全国乙卷', '全国甲卷', '北京卷', '上海卷', '浙江卷', '天津卷', '江苏卷', '广东卷'];
const GRADES = ['高一', '高二', '高三'];

export default function SettingsPage() {
  const router = useRouter();
  const { token, user, setUser, logout } = useAuthStore();

  // ── Profile edit state ────────────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [examRegion, setExamRegion] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Password change state ─────────────────────────────────────────────────
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (user) {
      setUsername(user.username);
      setExamRegion(user.exam_region || EXAM_REGIONS[0]);
      setGrade(user.grade || GRADES[2]);
      setSchool(user.school || '');
    }
  }, [token, user, router]);

  if (!token) return null;

  // ── Save profile ──────────────────────────────────────────────────────────
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    if (!username.trim()) { setProfileMsg({ type: 'error', text: '用户名不能为空' }); return; }
    setProfileLoading(true);
    try {
      const payload: UpdateMePayload = { username: username.trim(), exam_region: examRegion, grade, school: school.trim() };
      const updated = await updateMe(token!, payload);
      setUser(updated);
      setProfileMsg({ type: 'success', text: '信息已更新' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : '更新失败' });
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (!oldPwd) { setPwdMsg({ type: 'error', text: '请输入旧密码' }); return; }
    if (newPwd.length < 8 || newPwd.length > 20) { setPwdMsg({ type: 'error', text: '新密码须为 8-20 位' }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'error', text: '两次密码不一致' }); return; }
    setPwdLoading(true);
    try {
      await changePassword(token!, { old_password: oldPwd, new_password: newPwd, confirm_password: confirmPwd });
      setPwdMsg({ type: 'success', text: '密码修改成功，请重新登录' });
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => {
        logout();
        router.replace('/login');
      }, 1500);
    } catch (err) {
      setPwdMsg({ type: 'error', text: err instanceof Error ? err.message : '密码修改失败' });
    } finally {
      setPwdLoading(false);
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">设置</h1>

      {/* Quick link to profile */}
      <Link
        href="/profile"
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">
            {user?.username?.slice(0, 1) ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{user?.username ?? '—'}</p>
            <p className="text-xs text-slate-400">查看个人主页</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </Link>

      {/* ── Account / profile edit ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <UserRound className="h-5 w-5 text-sky-500" />
            账户信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileMsg && (
            <div className={cn(
              'mb-4 rounded-lg border px-4 py-3 text-sm',
              profileMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700',
            )}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="s-username" className="block text-sm font-medium text-slate-700">用户名</label>
              <Input
                id="s-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="s-region" className="block text-sm font-medium text-slate-700">考试地区</label>
              <select
                id="s-region"
                value={examRegion}
                onChange={(e) => setExamRegion(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              >
                {EXAM_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="s-grade" className="block text-sm font-medium text-slate-700">年级</label>
                <select
                  id="s-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                >
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="s-school" className="block text-sm font-medium text-slate-700">学校</label>
                <Input
                  id="s-school"
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="学校名称"
                />
              </div>
            </div>
            <Button type="submit" disabled={profileLoading} className="w-full sm:w-auto">
              {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              保存修改
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Change password ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <Lock className="h-5 w-5 text-amber-500" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pwdMsg && (
            <div className={cn(
              'mb-4 rounded-lg border px-4 py-3 text-sm',
              pwdMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700',
            )}>
              {pwdMsg.text}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="old-pwd" className="block text-sm font-medium text-slate-700">旧密码</label>
              <div className="relative">
                <Input
                  id="old-pwd"
                  type={showOld ? 'text' : 'password'}
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="请输入旧密码"
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowOld((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showOld ? '隐藏' : '显示'}>
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-pwd" className="block text-sm font-medium text-slate-700">新密码</label>
              <div className="relative">
                <Input
                  id="new-pwd"
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="8-20 位"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showNew ? '隐藏' : '显示'}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-pwd" className="block text-sm font-medium text-slate-700">确认新密码</label>
              <Input
                id="confirm-pwd"
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="再次输入新密码"
                autoComplete="new-password"
                className={cn(confirmPwd && newPwd !== confirmPwd && 'border-red-400')}
              />
              {confirmPwd && newPwd !== confirmPwd && (
                <p className="text-xs text-red-500">两次密码不一致</p>
              )}
            </div>
            <Button type="submit" variant="outline" disabled={pwdLoading} className="w-full sm:w-auto">
              {pwdLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              修改密码
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Notifications (placeholder) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
            <Bell className="h-5 w-5 text-sky-400" />
            通知与提醒
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          周中 5 分钟微复习提醒：已开启（功能开发中）
        </CardContent>
      </Card>

      {/* ── Logout ── */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <LogOut className="h-4 w-4" />
        退出登录
      </Button>
    </main>
  );
}


