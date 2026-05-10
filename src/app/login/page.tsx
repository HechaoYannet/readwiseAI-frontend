'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenText, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { loginUser, registerUser, verifyInvite } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

type Tab = 'login' | 'register';

const EXAM_REGIONS = ['全国I卷', '全国II卷', '全国乙卷', '全国甲卷', '北京卷', '上海卷', '浙江卷', '天津卷', '江苏卷', '广东卷'];
const GRADES = ['高一', '高二', '高三'];

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, token, user } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    router.replace(user?.role === 'admin' ? '/admin' : '/');
  }, [token, user?.role, router]);

  const [tab, setTab] = useState<Tab>('login');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [examRegion, setExamRegion] = useState(EXAM_REGIONS[0]);
  const [grade, setGrade] = useState('高三');
  const [school, setSchool] = useState('');

  async function handleVerifyInvite() {
    if (!inviteCode.trim()) return;
    setInviteLoading(true);
    setInviteValid(null);
    try {
      const res = await verifyInvite(inviteCode.trim());
      setInviteValid(res.valid);
    } catch {
      setInviteValid(false);
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!loginId.trim()) { setError('请输入用户名'); return; }
    if (!loginPwd) { setError('请输入密码'); return; }
    setLoading(true);
    try {
      const res = await loginUser(loginId.trim(), loginPwd);
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        username: res.username,
        role: res.role ?? 'user',
        exam_region: '',
        grade: '',
        school: '',
        status: 'active',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
      router.replace((res.role ?? 'user') === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inviteCode.trim()) { setError('请输入邀请码'); return; }
    if (inviteValid === false) { setError('邀请码无效'); return; }
    if (!username.trim()) { setError('请输入用户名'); return; }
    if (regPwd.length < 8 || regPwd.length > 20) { setError('密码须为 8-20 位'); return; }
    if (regPwd !== regConfirmPwd) { setError('两次密码输入不一致'); return; }
    if (!school.trim()) { setError('请输入学校名称'); return; }
    setLoading(true);
    try {
      const res = await registerUser({
        invite_code: inviteCode.trim(),
        username: username.trim(),
        password: regPwd,
        confirm_password: regConfirmPwd,
        exam_region: examRegion,
        grade,
        school: school.trim(),
      });
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        username: res.username,
        role: res.role ?? 'user',
        exam_region: examRegion,
        grade,
        school: school.trim(),
        status: 'active',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
      setSuccess('注册成功，正在进入…');
      router.replace((res.role ?? 'user') === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-slate-50 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A5F] shadow-lg">
          <BookOpenText className="h-8 w-8 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#1E3A5F]">ReadWise AI</span>
        <span className="text-xs text-slate-400">智能英语阅读训练平台</span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex border-b border-slate-100">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={cn(
                'flex-1 py-3.5 text-sm font-semibold transition-colors',
                tab === t
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {t === 'login' ? '登录' : '注册账号'}
            </button>
          ))}
        </div>

        <div className="px-8 py-7">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-id" className="block text-sm font-medium text-slate-700">
                  用户名
                </label>
                <Input
                  id="login-id"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="请输入用户名"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="login-pwd" className="block text-sm font-medium text-slate-700">
                  密码
                </label>
                <div className="relative">
                  <Input
                    id="login-pwd"
                    type={showPwd ? 'text' : 'password'}
                    value={loginPwd}
                    onChange={(e) => setLoginPwd(e.target.value)}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPwd ? '隐藏密码' : '显示密码'}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="invite-code" className="block text-sm font-medium text-slate-700">
                  邀请码 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteValid(null); }}
                    placeholder="XXXXXXXX"
                    aria-describedby="invite-code-hint"
                    className={cn(
                      'flex-1 font-mono tracking-wider',
                      inviteValid === true && 'border-emerald-400 ring-2 ring-emerald-400/20',
                      inviteValid === false && 'border-red-400 ring-2 ring-red-400/20',
                    )}
                    maxLength={16}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyInvite}
                    disabled={inviteLoading || !inviteCode.trim()}
                    className="shrink-0 px-3"
                  >
                    {inviteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '验证'}
                  </Button>
                </div>
                {inviteValid === true && <p className="text-xs text-emerald-600">✓ 邀请码有效</p>}
                {inviteValid === false && <p className="text-xs text-red-500">✗ 邀请码无效或已使用</p>}
                <p id="invite-code-hint" className="sr-only text-xs text-slate-400">输入将自动转为大写</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-username" className="block text-sm font-medium text-slate-700">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-pwd" className="block text-sm font-medium text-slate-700">
                  密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="reg-pwd"
                    type={showPwd ? 'text' : 'password'}
                    value={regPwd}
                    onChange={(e) => setRegPwd(e.target.value)}
                    placeholder="8-20 位"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPwd ? '隐藏密码' : '显示密码'}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-confirm-pwd" className="block text-sm font-medium text-slate-700">
                  确认密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="reg-confirm-pwd"
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={regConfirmPwd}
                    onChange={(e) => setRegConfirmPwd(e.target.value)}
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    className={cn(
                      'pr-10',
                      regConfirmPwd && regPwd !== regConfirmPwd && 'border-red-400',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPwd ? '隐藏密码' : '显示密码'}
                  >
                    {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {regConfirmPwd && regPwd !== regConfirmPwd && (
                  <p className="text-xs text-red-500">两次密码不一致</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="exam-region" className="block text-sm font-medium text-slate-700">
                  考试地区
                </label>
                <select
                  id="exam-region"
                  value={examRegion}
                  onChange={(e) => setExamRegion(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                >
                  {EXAM_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="grade" className="block text-sm font-medium text-slate-700">
                    年级
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="school" className="block text-sm font-medium text-slate-700">
                    学校
                  </label>
                  <Input
                    id="school"
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="学校名称"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                注册并登录
              </Button>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">© 2026 ReadWise AI · 仅限受邀用户使用</p>
    </div>
  );
}
