# API 调用摘要（api_used.md）

本文档记录前端所有 API 调用位置、用途和关键参数，方便排查错误和快速定位。

---

## 认证 API（Auth）

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/auth/verify-invite` | POST | `lib/api-client.ts → verifyInvite()` | 注册前验证邀请码有效性 |
| `/api/auth/register` | POST | `lib/api-client.ts → registerUser()` | 用户注册，返回 access_token |
| `/api/auth/login` | POST | `lib/api-client.ts → loginUser()` | 用户登录，返回 access_token |
| `/api/auth/refresh` | POST | `lib/api-client.ts → refreshToken()` | 刷新 JWT Token |

**调用页面：** `app/login/page.tsx`

---

## 用户 API（Users）

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/users/me` | GET | `lib/api-client.ts → getMe()` | 获取当前用户信息 |
| `/api/users/me` | PUT | `lib/api-client.ts → updateMe()` | 更新用户信息（用户名/地区/年级/学校） |
| `/api/users/password` | PUT | `lib/api-client.ts → changePassword()` | 修改密码 |
| `/api/users/stats` | GET | `lib/api-client.ts → getUserStats()` | 获取用户统计（错题数、待复习、战力值等） |

**调用页面：** `app/page.tsx`（stats）、`app/settings/page.tsx`（profile）、`app/profile/page.tsx`

---

## Attempt API（提交答题/生成内容）

所有内容生成和 AI 分析均通过此接口提交，服务端异步处理，需配合 Result API 轮询。

### POST `/api/attempt`

| request_type | 用途 | 关键字段 | 调用位置 |
|-------------|------|---------|---------|
| `training_set` | 生成完整训练题组（4篇文章+题目） | `session_id`, `user_level`, `topic` | `lib/api-client.ts → generateTrainingGroup()` |
| `attempt` | 提交单题答案，触发错因诊断 | `session_id`, `paragraph`, `question_text`, `options`, `user_answer`, `correct_answer`, `time_spent` | `lib/api-client.ts → submitAttemptDiagnosis()` |
| `qa` (word) | 查询单词词义 | `session_id`, `content`(单词), `context_sentence` | `lib/api-client.ts → submitQA()` |
| `qa` (sentence) | 长难句拆解分析 | `session_id`, `content`(英文句子) | `lib/api-client.ts → submitQA()` |
| `qa` (translate) | 翻译英文内容 | `session_id`, `content`(英文文本) | `lib/api-client.ts → submitQA()` |
| `qa` (grammar) | 语法解释 | `session_id`, `content`(语法问题描述) | `lib/api-client.ts → submitQA()` |
| `qa` (free) | 自由问答（支持工具调用） | `session_id`, `content`(任意问题) | `lib/api-client.ts → submitQA()` |

**⚠️ 关键注意：**
- `session_id` 必须提供，缺失则服务端返回 HTTP 422 错误
- 传空字符串 `""` 时服务端自动生成随机 ID，但该 ID 无法追踪（无法继续同一会话），**仅适合一次性查询**
- 同一训练会话必须使用同一 `session_id`（等同于 `group.group_id`，由 `generateTrainingGroup()` 通过后端返回的 `initResp.session_id` 确定）
- 主页聊天使用 `homeChatSessionId`（持久化存储，保证会话连续性），由客户端生成后在第一条消息发送时注册到服务端

---

## Result API（轮询结果）

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/result/{request_id}` | GET | `lib/api-client.ts → pollResult()` | 轮询异步任务结果（每 2~3 秒一次） |

**轮询策略：**
- `generateTrainingGroup`: 最多轮询 40 次，每次间隔 3000ms
- `submitAttemptDiagnosis`: 最多轮询 20 次，每次间隔 2500ms
- `submitQA`: 最多轮询 20 次，每次间隔 2000ms

---

## Memory API（长期记忆）

### 7.1 训练记录

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/memory/training` | GET | `lib/api-client.ts → getTrainingRecords()` | 获取训练记录列表 |
| `/api/memory/training` | POST | `lib/api-client.ts → addTrainingRecord()` | 保存训练记录（训练完成时调用） |

**调用时机：** `app/analysis/[groupId]/page.tsx`，仅在 `isCurrentGroup === true`（当前训练组）且未曾保存（`savedGroupIds` 不含该 `groupId`）时调用一次。

### 7.2 错题本

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/memory/mistakes` | GET | `lib/api-client.ts → getMistakes()` | 获取错题列表（支持过滤） |
| `/api/memory/mistakes/due` | GET | `lib/api-client.ts → getDueMistakes()` | 获取今日待复习错题 |
| `/api/memory/mistakes` | POST | `lib/api-client.ts → addMistake()` | 添加错题（训练完成后对每道错题调用） |
| `/api/memory/mistakes/{id}` | PUT | `lib/api-client.ts → updateMistake()` | 更新错题信息 |
| `/api/memory/mistakes/{id}` | DELETE | `lib/api-client.ts → deleteMistake()` | 删除错题 |

**调用时机：** `app/analysis/[groupId]/page.tsx` → `doSave()`，同上保护条件。

### 7.3 遗忘曲线（SM-2）

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/memory/curve` | GET | `lib/api-client.ts → getCurveOverview()` | 获取遗忘曲线概况 |
| `/api/memory/curve/due` | GET | `lib/api-client.ts → getDueCurveItems()` | 获取待复习条目 |
| `/api/memory/curve/{id}/review` | POST | `lib/api-client.ts → submitReview()` | 提交复习质量评分（0-5） |

**调用页面：** `app/review/page.tsx`

### 7.4 战力值历史

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/memory/power` | GET | `lib/api-client.ts → getPowerHistory()` | 获取战力值历史记录 |
| `/api/memory/power` | POST | `lib/api-client.ts → addPowerRecord()` | 添加战力值记录（训练完成时调用） |

**调用页面：** `app/dashboard/page.tsx`（GET）、`app/analysis/[groupId]/page.tsx`（POST）

---

## Sessions API（工作记忆会话）

| 接口 | 方法 | 位置 | 用途 |
|------|------|------|------|
| `/api/sessions` | GET | `lib/api-client.ts → getSessions()` | 获取会话 ID 列表（支持 training/chatting 类型） |
| `/api/sessions/current` | GET | `lib/api-client.ts → getCurrentSession()` | 获取最近一个会话的完整数据 |
| `/api/sessions/{id}` | DELETE | `lib/api-client.ts → deleteSession()` | 删除会话 |
| `/api/sessions/{id}/history` | GET | `lib/api-client.ts → getSessionHistory()` | 获取会话的对话历史（最多 40 条） |

**调用页面：**
- `app/page.tsx`（主页聊天）：首次打开聊天窗口时，`getSessions('chatting')` 获取历史会话列表，`getSessionHistory()` 加载对话记录
- `app/analysis/[groupId]/page.tsx`（训练分析页）：`getSessionHistory(groupId)` 加载本训练的对话历史

---

## 会话 ID 管理策略

| 场景 | session_id 来源 | 存储位置 |
|------|---------------|---------|
| 训练会话 | `generateTrainingGroup()` 时生成（`initResp.session_id`），与 `group.group_id` 相同 | Zustand persist（`currentGroup.group_id`） |
| 训练分析页 AI 对话 | 复用 `group.group_id` | 同上 |
| 主页 AI 聊天 | 首次从服务端获取，或本地生成 `chat_${timestamp}_xxx` | Zustand persist（`homeChatSessionId`） |

---

## 常见排查要点

1. **历史训练分析页无错误 API 调用**：`analysis/page.tsx` 中通过 `isCurrentGroup`（`store.currentGroup?.group_id === groupId`）和 `store.savedGroupIds.includes(groupId)` 双重保护，仅在当前训练完成时执行一次 `doSave()`。

2. **主页聊天无法继续历史对话**：检查 `homeChatSessionId` 是否在 Zustand persist 中正确存储，以及 `getSessionHistory()` 是否返回历史记录。

3. **训练生成超时**：`generateTrainingGroup()` 最长等待约 120 秒（40次 × 3s），若超时则回退到 mock 数据。

4. **错因诊断 API 失败**：`submitAttemptDiagnosis()` 内置错误回退，单题失败时使用本地 mock 数据补充。
