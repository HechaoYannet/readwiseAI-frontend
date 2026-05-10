'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenText, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { loginUser, registerUser, verifyInvite } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

type Tab = 'login' | 'register';

const EXAM_REGIONS = ['全国I卷', '全国II卷', '全国乙卷', '全国甲卷', '北京卷', '上海卷', '浙江卷', '天津卷', '江苏卷', '广东卷'];
const GRADES = ['高一', '高二', '高三'];

// Admin login: click the logo 5 times within 3 seconds
const ADMIN_CLICK_COUNT = 5;
const ADMIN_CLICK_WINDOW_MS = 3000;

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, token } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (token) router.replace('/');
  }, [token, router]);

  const [tab, setTab] = useState<Tab>('login');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Login form state ──────────────────────────────────────────────────────
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');

  // ── Register form state ──────────────────────────────────────────────────
  const [inviteCode, setInviteCode] = useState('');
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [examRegion, setExamRegion] = useState(EXAM_REGIONS[0]);
  const [grade, setGrade] = useState('高三');
  const [school, setSchool] = useState('');

  // ── Hidden admin login ───────────────────────────────────────────────────
  const logoClickTimesRef = useRef<number[]>([]);
  const [adminMode, setAdminMode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminPwd, setShowAdminPwd] = useState(false);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    logoClickTimesRef.current = [
      ...logoClickTimesRef.current.filter((t) => now - t < ADMIN_CLICK_WINDOW_MS),
      now,
    ];
    if (logoClickTimesRef.current.length >= ADMIN_CLICK_COUNT) {
      logoClickTimesRef.current = [];
      setAdminMode((v) => !v);
      setError(null);
    }
  }, []);

  // ── Verify invite code ────────────────────────────────────────────────────
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

  // ── Login submit ──────────────────────────────────────────────────────────
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
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  // ── Admin login submit ────────────────────────────────────────────────────
  async function handleAdminLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!adminCode.trim()) { setError('请输入管理员口令'); return; }
    setLoading(true);
    try {
      const res = await loginUser('admin', adminCode.trim());
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        username: res.username,
        role: 'admin',
        exam_region: '',
        grade: '',
        school: '',
        status: 'active',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '口令错误');
    } finally {
      setLoading(false);
    }
  }

  // ── Register submit ───────────────────────────────────────────────────────
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
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-slate-50 px-4 py-10">
      {/* Logo — click 5× quickly to reveal admin login */}
      <button
        type="button"
        onClick={handleLogoClick}
        aria-label="ReadWise AI Logo"
        className="mb-8 flex flex-col items-center gap-2 select-none focus:outline-none"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A5F] shadow-lg">
          <BookOpenText className="h-8 w-8 text-white" />
        </div>
        <span className="text-xl font-bold text-[#1E3A5F] tracking-tight">ReadWise AI</span>
        <span className="text-xs text-slate-400">智能英语阅读训练平台</span>
      </button>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">

        {/* Admin mode banner */}
        {adminMode && (
          <div className="flex items-center gap-2 rounded-t-2xl bg-amber-50 border-b border-amber-200 px-6 py-3">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-700">管理员入口</span>
            <button
              type="button"
              onClick={() => { setAdminMode(false); setError(null); }}
              className="ml-auto text-amber-500 hover:text-amber-700 text-xs"
            >
              关闭
            </button>
          </div>
        )}

        {/* Tabs (only when not in admin mode) */}
        {!adminMode && (
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
        )}

        <div className="px-8 py-7">
          {/* Error / Success messages */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* ── Admin login form ── */}
          {adminMode ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="admin-code" className="block text-sm font-medium text-slate-700">
                  管理员口令
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="admin-code"
                    type={showAdminPwd ? 'text' : 'password'}
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="请输入管理员口令"
                    className="pl-9 pr-10"
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showAdminPwd ? '隐藏' : '显示'}
                  >
                    {showAdminPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                管理员登录
              </Button>
            </form>
          ) : tab === 'login' ? (
            /* ── User login form ── */
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
            /* ── Register form ── */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Invite code */}
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
                <p id="invite-code-hint" className="text-xs text-slate-400 sr-only">输入将自动转为大写</p>
              </div>

              {/* Username */}
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

              {/* Password */}
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

              {/* Confirm Password */}
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

              {/* Exam region */}
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

              {/* Grade + School */}
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
