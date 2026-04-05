# ReadWise AI Frontend

> 智能英语阅读训练平台 — AI-Powered English Reading Training for High School Students

[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

---

## 项目简介

ReadWise AI 是一个面向高中生的 AI 驱动英语阅读训练平台。系统通过 AI 生成个性化训练文章与题目、实时分析错误原因、基于遗忘曲线（SM-2）安排复习计划，并追踪用户战力值成长曲线，帮助学生精准提升高考英语阅读能力。

### 核心功能

| 功能模块 | 说明 |
|---------|------|
| **AI 生成训练** | 按难度和主题生成 4 篇英语阅读文章及配套题目 |
| **实时答题追踪** | 记录每题答题时间、段落阅读时长、整体训练耗时 |
| **AI 错误诊断** | 训练完成后，对每道错题进行 AI 错因分析（错误类型、证据句、修复建议） |
| **长难句解析** | 自动提取文章长难句，提供 AI 翻译、主干拆解、提问功能 |
| **错题本** | 自动保存错题，支持筛选、搜索和查看诊断详情 |
| **遗忘曲线复习** | 基于 SM-2 算法计划错题复习，用户评分后自动调整下次复习时间 |
| **战力值追踪** | 综合正确率、速度、词汇力等维度计算战力值，持久化历史记录 |
| **AI 助手问答** | 在分析页和首页随时向 AI 提问，支持单词解释、句子翻译、语法分析 |

---

## 技术架构

### 技术栈

- **框架**: [Next.js 16](https://nextjs.org) (App Router)
- **UI 库**: [React 19](https://react.dev)
- **语言**: [TypeScript 5](https://www.typescriptlang.org)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com)
- **状态管理**: [Zustand 5](https://zustand-demo.pmnd.rs) (with localStorage persistence)
- **图标**: [Lucide React](https://lucide.dev)

### 目录结构

```
src/
├── app/                        # Next.js App Router 页面
│   ├── page.tsx                # 首页 (/)
│   ├── layout.tsx              # 根布局（导航栏）
│   ├── login/page.tsx          # 登录/注册 (/login)
│   ├── dashboard/page.tsx      # 战力仪表盘 (/dashboard)
│   ├── train/page.tsx          # 训练选择 (/train)
│   ├── read/[id]/page.tsx      # 阅读答题 (/read/[groupId]-[articleIndex])
│   ├── analysis/[groupId]/page.tsx  # 错误分析报告 (/analysis/[groupId])
│   ├── review/page.tsx         # 今日复习 (/review)
│   ├── profile/page.tsx        # 个人主页 (/profile)
│   └── settings/page.tsx       # 设置 (/settings)
│
├── components/
│   ├── home/
│   │   ├── mode-card.tsx       # 训练模式卡片
│   │   └── power-orb.tsx       # 战力值圆形仪表
│   ├── layout/
│   │   └── app-nav.tsx         # 底部导航栏
│   └── ui/                     # 基础 UI 组件
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── progress.tsx
│       └── skeleton.tsx
│
├── lib/
│   ├── api-client.ts           # 后端 API 全量封装（含 Mock 回退）
│   ├── auth-store.ts           # 认证状态（Zustand + localStorage）
│   ├── store.ts                # 训练会话状态（Zustand + localStorage）
│   ├── mock-data.ts            # 本地 Mock 训练数据
│   └── utils.ts                # Tailwind 工具函数 cn()
│
└── types/
    ├── home.ts                 # 首页数据类型
    ├── reading.ts              # 阅读页数据类型
    └── training.ts             # 训练核心类型（TrainingGroup, Article, Question等）
```

---

## 页面说明

### `/` 首页
- 展示用户名、战力值圆形仪表
- 今日推荐：从 API 获取待复习题目数量，引导用户复习
- 继续上次未完成训练的快捷入口
- 四种训练模式卡片（速读/精读/猜词/模考），均跳转至 `/train`
- 右下角 AI 助手悬浮球，支持实时问答（接入后端 QA API）

### `/login` 登录与注册
- 双 Tab（登录 / 注册）切换
- 注册需邀请码验证
- 支持管理员隐藏入口（5 次快速点击 Logo）

### `/train` 训练选择
- 难度选择（L1 初级 / L2 中级 / L3 高级 / L4 竞赛）
- 主题选择（科技/文化/社会/环境/教育，可选）
- 提交后调用后端 `training_set` API 生成文章（含轮询等待）
- 展示历史训练记录，可跳转查看分析报告

### `/read/[groupId]-[articleIndex]` 阅读答题
- 左栏：文章内容（段落级 IntersectionObserver 计时）
- 右栏：答题区（题目导航、选项高亮、进度条）
- 支持答题卡全览（跨文章跳题）
- 完成最后一篇后跳转分析页，期间自动计算战力分数

### `/analysis/[groupId]` 错误分析报告
- 页面加载后自动向后端提交各错题诊断请求（`attempt` API）
- 同步保存训练记录、错题、战力值到长期记忆 API
- 长难句 AI 解析（翻译/主干拆解）直接调用后端 QA API
- AI 助手聊天框接入后端，支持实时问答

### `/review` 今日复习
- 从后端获取基于 SM-2 算法的待复习错题
- 答题后展示正误与错因解析
- 用户评分（0–5 级），系统自动更新下次复习时间

### `/dashboard` 战力仪表盘
- 实时从后端获取战力历史记录（`/api/memory/power`）
- 展示总战力、各维度子分（词汇力/语法力/推断力/速读力/持久力）
- 战力趋势折线图（基于历史记录）

### `/profile` 个人主页
- 展示用户信息（考区/年级/学校/注册日期）
- 调用 `/api/users/stats` 获取统计数据（错题数/待复习数/战力值）

### `/settings` 设置
- 修改用户名、考区、年级、学校
- 修改密码（成功后自动退出重新登录）
- 退出登录

---

## API 对接说明

所有后端请求封装在 `src/lib/api-client.ts`。当环境变量 `NEXT_PUBLIC_API_URL` 未设置时，所有 API 函数自动回退到 **Mock 数据模式**，方便本地开发与演示。

### 环境变量

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### API 模块对应关系

| 前端函数 | 后端接口 | 说明 |
|---------|---------|------|
| `loginUser()` | `POST /api/auth/login` | 用户登录 |
| `registerUser()` | `POST /api/auth/register` | 用户注册 |
| `verifyInvite()` | `POST /api/auth/verify-invite` | 验证邀请码 |
| `getMe()` | `GET /api/users/me` | 获取当前用户 |
| `updateMe()` | `PUT /api/users/me` | 更新用户信息 |
| `changePassword()` | `PUT /api/users/password` | 修改密码 |
| `getUserStats()` | `GET /api/users/stats` | 获取用户统计 |
| `generateTrainingGroup()` | `POST /api/attempt` (training_set) → `GET /api/result/{id}` | 生成训练组（轮询） |
| `submitAttemptDiagnosis()` | `POST /api/attempt` (attempt) → `GET /api/result/{id}` | 单题错误诊断（轮询） |
| `submitQA()` | `POST /api/attempt` (qa) → `GET /api/result/{id}` | AI 问答（轮询） |
| `getTrainingRecords()` | `GET /api/memory/training` | 训练记录列表 |
| `addTrainingRecord()` | `POST /api/memory/training` | 保存训练记录 |
| `getMistakes()` | `GET /api/memory/mistakes` | 错题列表 |
| `getDueMistakes()` | `GET /api/memory/mistakes/due` | 待复习错题 |
| `addMistake()` | `POST /api/memory/mistakes` | 添加错题 |
| `updateMistake()` | `PUT /api/memory/mistakes/{id}` | 更新错题 |
| `deleteMistake()` | `DELETE /api/memory/mistakes/{id}` | 删除错题 |
| `getCurveOverview()` | `GET /api/memory/curve` | 遗忘曲线概览 |
| `getDueCurveItems()` | `GET /api/memory/curve/due` | 待复习 SM-2 条目 |
| `submitReview()` | `POST /api/memory/curve/{id}/review` | 提交复习评分 |
| `getPowerHistory()` | `GET /api/memory/power` | 战力值历史 |
| `addPowerRecord()` | `POST /api/memory/power` | 记录战力值 |
| `getSessions()` | `GET /api/sessions` | 会话列表 |
| `deleteSession()` | `DELETE /api/sessions/{id}` | 删除会话 |

### 训练生成流程

```
用户点击"开始训练"
    ↓
POST /api/attempt { request_type: "training_set", session_id: "session_xxx", user_level: "L2" }
    ↓ 返回 { request_id, session_id, status: "processing" }
    ↓ 轮询 GET /api/result/{request_id}（每 3 秒，最多 2 分钟）
    ↓ status === "completed"
    ↓ 解析 results["dyn_c1~dyn_c4"] → 每项的 .article 字段为文章对象
    ↓ 解析 results["dyn_q1~dyn_q4"] → 每项的 .questions 字段为题目数组
    ↓ 文章字段使用 difficulty_actual / genre_actual（非 difficulty / genre）
    ↓
创建 TrainingGroup，存入 Zustand，跳转 /read/{session_id}-0
```

### 错题诊断流程

```
用户完成训练，跳转 /analysis/{groupId}
    ↓
对每道错题并发提交：
POST /api/attempt { request_type: "attempt", session_id, paragraph, question_text,
                    options, user_answer, correct_answer, time_spent }
    ↓ 轮询 GET /api/result/{request_id}
    ↓ status === "completed"
    ↓ 读取 results.sub_001.diagnosis → { error_category, explanation（错因说明）,
        evidence_sentence（原文证据）, suggestion（学习建议）, confidence }
    ↓ 读取 results.sub_001.similar_question → 同类练习题（可选展示）
    ↓
同步到 Zustand store.recordDiagnosis()，实时显示在错误分析卡片
```

### AI 问答响应解析

`submitQA()` 根据 `query_type` 解析不同的响应字段（均来自 `results.sub_001`）：

| query_type | 响应字段 | 展示逻辑 |
|-----------|---------|---------|
| `word` | `basic_meaning.translation`, `context_meaning`, `usage_notes` | 词义 + 语境含义 + 用法说明 |
| `sentence` | `translation`, `main_clause`, `structure_analysis`, `key_grammar_points` | 译文 + 主干 + 结构分析 |
| `grammar` | `grammar_point`, `explanation`, `examples` | 语法点 + 解释 + 例句 |
| `translate` | `translation`, `notes` | 译文 + 注释 |
| `free` | `answer` | 自由回答文本 |

### 重要：`session_id` 为必填字段

`/api/attempt` 的所有请求类型（`attempt`、`qa`、`training_set`）均要求 Body 中包含 `session_id` 字段（不可省略，缺失返回 HTTP 422）。传空字符串 `""` 时服务端自动生成随机 ID。

---

## 本地开发

### 环境要求

- Node.js >= 20
- npm >= 9

### 快速启动

```bash
# 克隆仓库
git clone https://github.com/HechaoYannet/readwiseAI-frontend.git
cd readwiseAI-frontend

# 安装依赖
npm install

# 启动开发服务器（Mock 模式，无需后端）
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

**Mock 模式说明**：未设置 `NEXT_PUBLIC_API_URL` 时，所有 API 调用均使用本地 Mock 数据，包括 4 篇预置训练文章、AI 诊断模拟等，可完整体验训练→分析→复习全流程。

### 连接后端

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

重启开发服务器即可切换为真实 API 模式。

### 可用脚本

```bash
npm run dev      # 开发模式（http://localhost:3000）
npm run build    # 生产构建
npm run start    # 启动生产服务器
npm run lint     # ESLint 检查
```

---

## 状态管理

项目使用 **Zustand** 管理两个持久化 Store：

### `useAuthStore` (`readwise-auth`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | `string \| null` | JWT 访问令牌 |
| `user` | `UserProfile \| null` | 用户基本信息 |
| `stats` | `UserStats \| null` | 用户统计数据 |

### `useTrainingStore` (`readwise-training`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `currentGroup` | `TrainingGroup \| null` | 当前训练组 |
| `currentArticleIndex` | `number` | 当前文章索引 |
| `answers` | `Record<string, AnswerRecord>` | 所有答题记录（含计时） |
| `diagnosisResults` | `Record<string, DiagnosisResult>` | AI 错因诊断结果 |
| `powerScore` | `PowerScore \| null` | 本次战力值 |
| `trainingHistory` | `TrainingGroup[]` | 历史训练组（最近 20 条） |

两个 Store 均通过 Zustand `persist` 中间件同步至 `localStorage`，支持页面刷新后恢复状态。

---

## 路由与导航

底部导航栏（`src/components/layout/app-nav.tsx`）固定显示 5 个入口：

| 图标 | 路由 | 说明 |
|------|------|------|
| 🏠 | `/` | 首页 |
| 📖 | `/train` | 开始训练 |
| ⚡ | `/dashboard` | 战力仪表盘 |
| 👤 | `/profile` | 个人主页 |
| ⚙️ | `/settings` | 设置 |

导航栏在 `/login` 路由自动隐藏。

---

## 设计规范

### 颜色体系

| 用途 | 颜色 | 代码 |
|------|------|------|
| 主色 | 深蓝 | `#1E3A5F` |
| 操作色 | 天蓝 | `sky-500` |
| 成功 | 翠绿 | `emerald-500` |
| 错误 | 红色 | `red-500` |
| 警告 | 琥珀 | `amber-500` |
| 背景 | 石板灰 | `slate-50 ~ slate-200` |

### UI 规范

- 圆角：`rounded-lg` (8px) / `rounded-xl` (12px)
- 卡片阴影：`shadow-sm`
- 动画：`transition-colors` / `transition-all`
- 移动优先：最大宽度 `max-w-2xl`（列表页）/ `max-w-7xl`（双栏页）

---

## 贡献

1. Fork 本仓库
2. 创建功能分支 `git checkout -b feature/your-feature`
3. 提交更改 `git commit -m 'feat: add your feature'`
4. 推送分支 `git push origin feature/your-feature`
5. 发起 Pull Request

---

## License

MIT © ReadWise AI Team
