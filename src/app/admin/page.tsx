'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Copy,
  Cpu,
  KeyRound,
  Loader2,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SquarePen,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  adminCreateInvite,
  adminDeleteUser,
  adminDeleteUserSession,
  adminGetLlmConfig,
  adminGetUserSessionHistory,
  adminListInvites,
  adminListUserSessions,
  adminListUsers,
  adminRevokeInvite,
  adminUpdateLlmConfig,
  adminUpdateUser,
  getMe,
  type AdminInvite,
  type AdminLLMConfig,
  type AdminSessionSummary,
  type AdminUser,
  type ConversationMessage,
} from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

type ToastState = {
  kind: 'success' | 'error';
  message: string;
} | null;

const USER_STATUS_OPTIONS: Array<'active' | 'disabled'> = ['active', 'disabled'];
const USER_ROLE_OPTIONS: Array<'user' | 'admin'> = ['user', 'admin'];
const LLM_PROVIDER_OPTIONS: Array<'openai' | 'deepseek' | 'stub'> = ['openai', 'deepseek', 'stub'];

export default function AdminPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const storedUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [sessions, setSessions] = useState<AdminSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionHistory, setSessionHistory] = useState<ConversationMessage[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [llmConfig, setLlmConfig] = useState<AdminLLMConfig | null>(null);

  const [inviteMaxUses, setInviteMaxUses] = useState('1');
  const [inviteNote, setInviteNote] = useState('');
  const [inviteExpiresAt, setInviteExpiresAt] = useState('');

  const [llmProvider, setLlmProvider] = useState<'openai' | 'deepseek' | 'stub'>('openai');
  const [llmModel, setLlmModel] = useState('');
  const [llmTemperature, setLlmTemperature] = useState('0.7');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [editingUser, setEditingUser] = useState({
    username: '',
    exam_region: '',
    grade: '',
    school: '',
  });

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const visibleUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      if (userStatusFilter !== 'all' && user.status !== userStatusFilter) return false;
      if (!keyword) return true;
      return [user.username, user.id, user.school, user.exam_region]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword));
    });
  }, [userSearch, userStatusFilter, users]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.session_id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  useEffect(() => {
    if (!selectedUser) return;
    setEditingUser({
      username: selectedUser.username ?? '',
      exam_region: selectedUser.exam_region ?? '',
      grade: selectedUser.grade ?? '',
      school: selectedUser.school ?? '',
    });
  }, [selectedUser]);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    const activeToken: string = token;

    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await getMe(activeToken);
        if (cancelled) return;
        if (me.role !== 'admin') {
          router.replace('/');
          return;
        }
        setUser(me);
        await loadAdminData(activeToken, me.id);
      } catch {
        if (cancelled) return;
        logout();
        router.replace('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap().catch(() => {
      if (!cancelled) {
        logout();
        router.replace('/login');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [logout, router, setUser, token]);

  async function loadAdminData(activeToken: string, preferredUserId?: string) {
    const [usersRes, invitesRes, llmRes] = await Promise.all([
      adminListUsers(activeToken, undefined, 200),
      adminListInvites(activeToken, 100),
      adminGetLlmConfig(activeToken),
    ]);

    setUsers(usersRes.users);
    setInvites(invitesRes.invites);
    setLlmConfig(llmRes);
    setLlmProvider(llmRes.provider);
    setLlmModel(llmRes.model);
    setLlmTemperature(String(llmRes.temperature));
    setLlmBaseUrl(llmRes.base_url);

    const nextUserId = preferredUserId && usersRes.users.some((user) => user.id === preferredUserId)
      ? preferredUserId
      : usersRes.users[0]?.id ?? '';
    setSelectedUserId(nextUserId);

    if (nextUserId) {
      const sessionsRes = await adminListUserSessions(activeToken, nextUserId, 50);
      setSessions(sessionsRes.sessions);
      const nextSessionId = sessionsRes.sessions[0]?.session_id ?? '';
      setSelectedSessionId(nextSessionId);
      if (nextSessionId) {
        const historyRes = await adminGetUserSessionHistory(activeToken, nextUserId, nextSessionId, 80);
        setSessionHistory(historyRes.history);
      } else {
        setSessionHistory([]);
      }
    } else {
      setSessions([]);
      setSelectedSessionId('');
      setSessionHistory([]);
    }
  }

  async function reloadAll() {
    if (!token) return;
    setRefreshing(true);
    setToast(null);
    try {
      await loadAdminData(token, selectedUserId);
      setToast({kind: 'success', message: '后台数据已刷新'});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '刷新失败'});
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSelectUser(userId: string) {
    if (!token) return;
    setSelectedUserId(userId);
    setSelectedSessionId('');
    setSessionHistory([]);
    try {
      const sessionsRes = await adminListUserSessions(token, userId, 50);
      setSessions(sessionsRes.sessions);
      const nextSessionId = sessionsRes.sessions[0]?.session_id ?? '';
      setSelectedSessionId(nextSessionId);
      if (nextSessionId) {
        const historyRes = await adminGetUserSessionHistory(token, userId, nextSessionId, 80);
        setSessionHistory(historyRes.history);
      } else {
        setSessionHistory([]);
      }
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '加载用户会话失败'});
    }
  }

  async function handleSelectSession(sessionId: string) {
    if (!token || !selectedUserId) return;
    setSelectedSessionId(sessionId);
    try {
      const historyRes = await adminGetUserSessionHistory(token, selectedUserId, sessionId, 80);
      setSessionHistory(historyRes.history);
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '加载会话历史失败'});
    }
  }

  async function handleQuickUserPatch(userId: string, payload: Parameters<typeof adminUpdateUser>[2]) {
    if (!token) return;
    setToast(null);
    try {
      const updated = await adminUpdateUser(token, userId, payload);
      setUsers((current) => current.map((user) => user.id === userId ? updated : user));
      if (storedUser?.id === userId && payload.role) {
        setUser(updated);
      }
      setToast({kind: 'success', message: '用户已更新'});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '用户更新失败'});
    }
  }

  async function handleSaveUserProfile() {
    if (!token || !selectedUser) return;
    try {
      const updated = await adminUpdateUser(token, selectedUser.id, {
        username: editingUser.username.trim(),
        exam_region: editingUser.exam_region.trim(),
        grade: editingUser.grade.trim(),
        school: editingUser.school.trim(),
      });
      setUsers((current) => current.map((user) => user.id === selectedUser.id ? updated : user));
      if (storedUser?.id === selectedUser.id) {
        setUser(updated);
      }
      setToast({kind: 'success', message: '用户资料已保存'});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '保存用户资料失败'});
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!token) return;
    const confirmed = window.confirm('删除用户会同时清理其工作会话，是否继续？');
    if (!confirmed) return;
    try {
      await adminDeleteUser(token, userId);
      const nextUsers = users.filter((user) => user.id !== userId);
      setUsers(nextUsers);
      if (selectedUserId === userId) {
        const nextUserId = nextUsers[0]?.id ?? '';
        setSelectedUserId(nextUserId);
        if (nextUserId) {
          await handleSelectUser(nextUserId);
        } else {
          setSessions([]);
          setSelectedSessionId('');
          setSessionHistory([]);
        }
      }
      setToast({kind: 'success', message: '用户已删除'});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '删除用户失败'});
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!token || !selectedUserId) return;
    const confirmed = window.confirm('删除该会话后无法恢复，是否继续？');
    if (!confirmed) return;
    try {
      await adminDeleteUserSession(token, selectedUserId, sessionId);
      const nextSessions = sessions.filter((session) => session.session_id !== sessionId);
      setSessions(nextSessions);
      const nextSessionId = nextSessions[0]?.session_id ?? '';
      setSelectedSessionId(nextSessionId);
      if (nextSessionId) {
        const historyRes = await adminGetUserSessionHistory(token, selectedUserId, nextSessionId, 80);
        setSessionHistory(historyRes.history);
      } else {
        setSessionHistory([]);
      }
      setToast({kind: 'success', message: '会话已删除'});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '删除会话失败'});
    }
  }

  async function handleCreateInvite() {
    if (!token) return;
    const maxUses = Number(inviteMaxUses);
    if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000) {
      setToast({kind: 'error', message: '邀请码使用次数必须在 1 到 1000 之间'});
      return;
    }
    try {
      const invite = await adminCreateInvite(token, {
        max_uses: maxUses,
        note: inviteNote.trim(),
        expires_at: inviteExpiresAt.trim() || undefined,
      });
      setInvites((current) => [invite, ...current]);
      setInviteMaxUses('1');
      setInviteNote('');
      setInviteExpiresAt('');
      setToast({kind: 'success', message: `邀请码 ${invite.code} 已创建`});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '创建邀请码失败'});
    }
  }

  async function handleRevokeInvite(code: string) {
    if (!token) return;
    try {
      const updated = await adminRevokeInvite(token, code);
      setInvites((current) => current.map((invite) => invite.code === code ? updated : invite));
      setToast({kind: 'success', message: `邀请码 ${code} 已撤销`});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : '撤销邀请码失败'});
    }
  }

  async function handleCopyInvite(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setToast({kind: 'success', message: `邀请码 ${code} 已复制`});
    } catch {
      setToast({kind: 'error', message: '复制失败，请手动复制邀请码'});
    }
  }

  async function handleSaveLlmConfig() {
    if (!token) return;
    const temperature = Number(llmTemperature);
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      setToast({kind: 'error', message: 'temperature 必须在 0 到 2 之间'});
      return;
    }
    try {
      const updated = await adminUpdateLlmConfig(token, {
        provider: llmProvider,
        model: llmModel.trim() || undefined,
        temperature,
        base_url: llmBaseUrl.trim() || undefined,
        api_key: llmApiKey.trim() || undefined,
      });
      setLlmConfig(updated);
      setLlmApiKey('');
      setToast({kind: 'success', message: 'AI 配置已更新并刷新生效'});
    } catch (error) {
      setToast({kind: 'error', message: error instanceof Error ? error.message : 'AI 配置更新失败'});
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_48%,#e2e8f0_100%)] px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 text-sm text-slate-600 shadow-lg backdrop-blur">
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          正在加载管理员后台
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_42%,#e2e8f0_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-6 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.18),transparent_35%,rgba(148,163,184,0.14))]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                受限管理员控制台
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">ReadWise Admin Console</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  统一管理用户、训练会话、邀请码与 AI provider。敏感密钥只允许写入，不在前端回显。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div className="text-slate-400">当前管理员</div>
                <div className="font-semibold">{storedUser?.username ?? 'admin'}</div>
              </div>
              <Button
                onClick={reloadAll}
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                刷新后台
              </Button>
            </div>
          </div>
        </section>

        {toast && (
          <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            toast.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {toast.message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>用户总数</CardDescription>
              <CardTitle className="flex items-center justify-between text-3xl">
                {users.length}
                <Users className="h-5 w-5 text-sky-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>管理员</CardDescription>
              <CardTitle className="flex items-center justify-between text-3xl">
                {users.filter((user) => user.role === 'admin').length}
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>可用邀请码</CardDescription>
              <CardTitle className="flex items-center justify-between text-3xl">
                {invites.filter((invite) => invite.is_valid && !invite.revoked).length}
                <KeyRound className="h-5 w-5 text-amber-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>AI Provider</CardDescription>
              <CardTitle className="flex items-center justify-between text-lg">
                {llmConfig?.provider ?? '—'}
                <Cpu className="h-5 w-5 text-violet-500" />
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-sky-500" />
                用户管理
              </CardTitle>
              <CardDescription>支持角色切换、启停账号和删除用户。当前管理员不能删除或禁用自己。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="搜索用户名、ID、学校、考区"
                      className="pl-9"
                    />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-slate-500">状态筛选</span>
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value as 'all' | 'active' | 'disabled')}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                      >
                        <option value="all">全部</option>
                        <option value="active">active</option>
                        <option value="disabled">disabled</option>
                      </select>
                    </label>
                    <div className="space-y-1 text-sm">
                      <span className="text-slate-500">结果</span>
                      <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                        {visibleUsers.length} / {users.length}
                      </div>
                    </div>
                  </div>
                </div>

                {visibleUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      user.id === selectedUserId
                        ? 'border-sky-300 bg-sky-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{user.username}</div>
                        <div className="mt-1 text-xs text-slate-500">{user.id}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{user.exam_region || '未填写考区'}</span>
                      <span>{user.role}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                {selectedUser ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">{selectedUser.username}</div>
                      <div className="mt-1 text-sm text-slate-500">{selectedUser.id}</div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-3">
                        <div className="text-xs text-slate-400">年级 / 学校</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">{selectedUser.grade || '未填写'} / {selectedUser.school || '未填写'}</div>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <div className="text-xs text-slate-400">最近登录</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">{selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString('zh-CN') : '—'}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <SquarePen className="h-4 w-4 text-sky-500" />
                        编辑用户资料
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 text-sm">
                          <span className="text-slate-600">用户名</span>
                          <Input
                            value={editingUser.username}
                            onChange={(e) => setEditingUser((current) => ({...current, username: e.target.value}))}
                          />
                        </label>
                        <label className="space-y-1.5 text-sm">
                          <span className="text-slate-600">考区</span>
                          <Input
                            value={editingUser.exam_region}
                            onChange={(e) => setEditingUser((current) => ({...current, exam_region: e.target.value}))}
                          />
                        </label>
                        <label className="space-y-1.5 text-sm">
                          <span className="text-slate-600">年级</span>
                          <Input
                            value={editingUser.grade}
                            onChange={(e) => setEditingUser((current) => ({...current, grade: e.target.value}))}
                          />
                        </label>
                        <label className="space-y-1.5 text-sm">
                          <span className="text-slate-600">学校</span>
                          <Input
                            value={editingUser.school}
                            onChange={(e) => setEditingUser((current) => ({...current, school: e.target.value}))}
                          />
                        </label>
                      </div>
                      <Button className="mt-3 w-full" onClick={handleSaveUserProfile}>
                        <SquarePen className="mr-2 h-4 w-4" />
                        保存用户资料
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-sm">
                        <span className="text-slate-600">状态</span>
                        <select
                          value={selectedUser.status}
                          onChange={(e) => handleQuickUserPatch(selectedUser.id, {status: e.target.value as 'active' | 'disabled'})}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                        >
                          {USER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="text-slate-600">角色</span>
                        <select
                          value={selectedUser.role}
                          onChange={(e) => handleQuickUserPatch(selectedUser.id, {role: e.target.value as 'user' | 'admin'})}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                        >
                          {USER_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        onClick={() => handleQuickUserPatch(selectedUser.id, {
                          status: selectedUser.status === 'active' ? 'disabled' : 'active',
                        })}
                      >
                        {selectedUser.status === 'active' ? '禁用账号' : '启用账号'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteUser(selectedUser.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除用户
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                    暂无可管理用户
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-violet-500" />
                AI 配置
              </CardTitle>
              <CardDescription>切换 OpenAI / DeepSeek / Stub。密钥只显示是否存在，不回显原文。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="text-slate-600">Provider</span>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value as 'openai' | 'deepseek' | 'stub')}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                  >
                    {LLM_PROVIDER_OPTIONS.map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-slate-600">Model</span>
                  <Input value={llmModel} onChange={(e) => setLlmModel(e.target.value)} placeholder="gpt-4o-mini" />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="text-slate-600">Temperature</span>
                  <Input value={llmTemperature} onChange={(e) => setLlmTemperature(e.target.value)} placeholder="0.7" />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-slate-600">Base URL</span>
                  <Input value={llmBaseUrl} onChange={(e) => setLlmBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
                </label>
              </div>

              <label className="space-y-1.5 text-sm">
                <span className="text-slate-600">新 API Key</span>
                <Input
                  type="password"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  placeholder={llmConfig?.has_api_key ? '已存在密钥，如需轮换请填写新值' : '输入新的 API Key'}
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>当前密钥状态</span>
                  <span className={llmConfig?.has_api_key ? 'text-emerald-600' : 'text-amber-600'}>
                    {llmConfig?.has_api_key ? '已配置' : '未配置'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>密钥来源</span>
                  <span>{llmConfig?.api_key_source ?? 'unset'}</span>
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveLlmConfig}>
                <Cpu className="mr-2 h-4 w-4" />
                保存并切换 AI 配置
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                邀请码管理
              </CardTitle>
              <CardDescription>支持批次备注、最大使用次数和过期时间。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1.5 text-sm">
                  <span className="text-slate-600">可用次数</span>
                  <Input value={inviteMaxUses} onChange={(e) => setInviteMaxUses(e.target.value)} />
                </label>
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="text-slate-600">备注</span>
                  <Input value={inviteNote} onChange={(e) => setInviteNote(e.target.value)} placeholder="例如：五月首批测试" />
                </label>
              </div>
              <label className="space-y-1.5 text-sm">
                <span className="text-slate-600">过期时间</span>
                <Input
                  value={inviteExpiresAt}
                  onChange={(e) => setInviteExpiresAt(e.target.value)}
                  placeholder="2026-06-01T12:00:00+08:00"
                />
              </label>
              <Button onClick={handleCreateInvite} className="w-full">
                <KeyRound className="mr-2 h-4 w-4" />
                创建邀请码
              </Button>

              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.code} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-base font-semibold tracking-widest text-slate-900">{invite.code}</div>
                        <div className="mt-1 text-xs text-slate-500">{invite.note || '无备注'}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        invite.is_valid && !invite.revoked
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {invite.is_valid && !invite.revoked ? '有效' : '不可用'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>使用量：{invite.used_count} / {invite.max_uses}</div>
                      <div>创建者：{invite.created_by}</div>
                      <div>创建时间：{new Date(invite.created_at).toLocaleString('zh-CN')}</div>
                      <div>过期时间：{invite.expires_at ? new Date(invite.expires_at).toLocaleString('zh-CN') : '未设置'}</div>
                    </div>
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyInvite(invite.code)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          复制
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={invite.revoked}
                          onClick={() => handleRevokeInvite(invite.code)}
                        >
                          撤销邀请码
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-500" />
                对话与训练会话
              </CardTitle>
              <CardDescription>按用户查看工作会话、消息历史并支持删除异常会话。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-3">
                {sessions.length > 0 ? sessions.map((session) => (
                  <button
                    key={session.session_id}
                    type="button"
                    onClick={() => handleSelectSession(session.session_id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      session.session_id === selectedSessionId
                        ? 'border-cyan-300 bg-cyan-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{session.session_id}</div>
                      <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {session.session_type}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      消息 {session.message_count} · 文章 {session.article_count} · Agent {session.agent_info_count}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      更新于 {new Date(session.updated_at).toLocaleString('zh-CN')}
                    </div>
                  </button>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    该用户暂无工作会话
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                {selectedSession ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{selectedSession.session_id}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {selectedUser?.username ?? '未知用户'} · {selectedSession.session_type}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteSession(selectedSession.session_id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除会话
                      </Button>
                    </div>

                    <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-white p-3">
                      {sessionHistory.length > 0 ? sessionHistory.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`rounded-2xl px-4 py-3 text-sm ${
                            message.role === 'assistant'
                              ? 'border border-sky-100 bg-sky-50 text-slate-700'
                              : 'border border-slate-200 bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {message.role}
                          </div>
                          <div className="whitespace-pre-wrap break-words leading-6">{message.content}</div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                          该会话暂无消息历史
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-center">
                    <ShieldAlert className="h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">选择一个会话后，这里会显示完整对话历史。</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
