# 前端技术方案（基于Vercel托管）

> 基于你的确认：4篇文章为一组、正计时+滑动窗口计时、猜词模式由LLM出题（后端未实现先不做）、集中分析+主动学习功能、战力值预留接口、状态管理本地+后端同步预留

---

## 一、Vercel托管下的轮询机制设计

### 1.1 架构约束

| 约束 | 说明 |
|------|------|
| Vercel Serverless Functions | 最大执行时间10秒（Hobby计划）/ 60秒（Pro） |
| 长时间任务 | 不能直接在Serverless中等待后端结果 |
| 推荐模式 | 客户端轮询 + 后端异步处理 |

### 1.2 轮询设计

```
前端提交请求
    ↓
POST /api/attempt (Vercel代理 → 后端)
    ↓
后端返回 { request_id, status: "processing" }
    ↓
前端启动轮询 (每2秒)
    ↓
GET /api/result/{request_id} (Vercel代理 → 后端)
    ↓
├─ status: "processing" → 继续轮询
├─ status: "completed" → 停止轮询，渲染结果
├─ status: "failed" → 停止轮询，显示错误+重试按钮
└─ 超时(60秒) → 停止轮询，显示超时提示
```

### 1.3 轮询参数建议

| 参数 | 值 | 说明 |
|------|-----|------|
| 轮询间隔 | 2秒 | 平衡实时性和请求量 |
| 最大轮询次数 | 30次 | 60秒超时 |
| 失败重试 | 3次 | 网络错误时自动重试 |
| 退避策略 | 指数退避 | 重试间隔翻倍(2s→4s→8s) |

### 1.4 Vercel代理配置

```javascript
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.railway.app/api/:path*"
    }
  ]
}
```

**优点**：前端代码无感知后端地址，解决CORS问题

---

## 二、4篇文章为一组的设计

### 2.1 数据结构

```typescript
// 一篇文章的训练数据
interface ArticleSession {
  article_id: string
  title: string
  content: string
  questions: Question[]           // 该篇文章的题目
  start_time: number               // 开始阅读的时间戳
  end_time: number                 // 完成答题的时间戳
  reading_duration: number         // 总阅读用时(秒)
  paragraph_timestamps: {          // 滑动窗口计时
    paragraph_index: number
    enter_time: number             // 进入该段的时间戳
    exit_time: number              // 离开该段的时间戳
    duration: number               // 该段停留时间(秒)
  }[]
  question_attempts: {             // 每道题的答题记录
    question_id: string
    user_answer: string
    is_correct: boolean
    time_spent: number             // 该题用时(秒)
    start_time: number
    submit_time: number
  }[]
}

// 一组训练(4篇文章)
interface TrainingGroup {
  group_id: string
  user_id: string
  start_time: number               // 整组开始时间
  end_time: number                 // 整组结束时间
  total_duration: number           // 总用时(秒)
  articles: ArticleSession[]       // 4篇文章
  status: "in_progress" | "completed"
}
```

### 2.2 正计时设计

**整组计时**：
- 用户点击"开始训练" → 记录`group_start_time`
- 每完成一篇文章 → 记录`article_end_time`
- 全部完成 → 计算`total_duration`

**展示方式**：
```
训练进度: ████░░░░░░░░░░ 2/4 篇文章
已用时: 00:12:34
预估剩余: 00:08:00
```

### 2.3 滑动窗口计时（段落级）

**目的**：分析学生在哪一段停留过久，诊断阅读瓶颈

**实现**：
```javascript
// 监听滚动事件 + Intersection Observer
const paragraphObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 进入段落 → 记录 enter_time
      startParagraphTimer(paragraphIndex)
    } else {
      // 离开段落 → 记录 exit_time + duration
      endParagraphTimer(paragraphIndex)
    }
  })
})
```

**数据用途**：
- 诊断报告：显示"你在第3段停留了45秒，该段包含一个定语从句"
- 速读训练：段落倒计时提醒

---

## 三、集中分析页设计

### 3.1 页面结构

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  训练完成！                                                                                                   │
│  总用时: 23分45秒  正确率: 68%  战力值变化: +32                                                                │
├───────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│  【左侧：原文 + 错题分析】      │  【右侧：当前文章所有题目】               [上一篇] [下一篇]  文章 1 / 4       │
│                               ├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─ 完整原文 ─────────────────┐│  ┌────┬────┬────┬────┐                                                       │
│  │ [这是完整原文]              ││  │ 1  │ 2  │ 3  │ 4  │   ← 题号滑动列表 (方框+水平滚动)                       │
│  │ The rapid development      ││  └────┴────┴────┴────┘                                                       │
│  │ of AI raises both          ││                                                                             │
│  │ excitement and concern.    ││  ┌─ 第2题 ─────────────────────────────────────────┐                       │
│  │ Many proposals were        ││  │  What does 'reject' mean?                       │                       │
│  │ rejected...                ││  │  ○ A) 接受                                      │                       │
│  └────────────────────────────┘│  │  ● B) 否决  (✅ 正确答案，绿色标注)               │                       │
│                               ││  │  ● C) 修改  (❌ 你的选择，红色标注)               │                       │
│  ┌─ 错题本 & 修复建议 ────────┐│  │  ○ D) 推迟                                      │                       │
│  │                           ││  └───────────────────────────────────────────────┘                       │
│  │  📍 错题2: [题目内容]        ││                                                                             │
│  │     ❌ 你的答案: C           ││  ┌─ 第3题 ─────────────────────────────────────────┐                       │
│  │     ✅ 正确答案: B           ││  │  Which field benefits from AI?                 │                       │
│  │     🔍 错因: 词汇误解         ││  │  ● A) Finance  (❌ 你的选择，红色标注)             │                       │
│  │     📝 证据句: "The proposal  ││  │  ○ B) Agriculture                               │                       │
│  │        was rejected..."      ││  │  ● C) Healthcare (✅ 正确答案，绿色标注)           │                       │
│  │     💡 修复建议: 记住reject含义││  │  ○ D) Transportation                            │                       │
│  │     🔄 同类题: [点击练习]     ││  └───────────────────────────────────────────────┘                       │
│  │                           ││                                                                             │
│  │  📍 错题3: [题目内容]        ││                                                                             │
│  │     ...                   ││                                                                             │
│  └──────────────────────────────┘│                                                                             │
│                               ││                                                                             │
│  ┌─ 长难句分析 (点击展开) ────────┐│                                                                             │
│  │  "The rapid development..."   ││                                                                             │
│  │  [拆解主干] [翻译] [提问]      ││                                                                             │
│  └──────────────────────────────┘│                                                                             │
│                               ││  ┌─────────────────────────────────────────────────┐                       │
│                               ││  │  [询问任何事]                           Send >   │                       │
│                               ││  └─────────────────────────────────────────────────┘                       │
└───────────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘

可动态布局：宽度不够时，可将本文题目内容放在左侧，插入在对应解析前。
```

### 3.2 主动学习功能设计

| 功能 | 触发方式 | 后端调用 | 状态 |
|------|---------|---------|------|
| 长难句拆解 | 点击高亮句子 | `request_type: qa, query_type: sentence` | 预留 |
| 划词翻译 | 选中单词 → 弹窗 | `request_type: qa, query_type: word` | 预留 |
| 划句翻译 | 选中句子 → 弹窗 | `request_type: qa, query_type: translate` | 预留 |
| 语法讲解 | 点击语法标签 | `request_type: qa, query_type: grammar` | 预留 |
| 用户提问 | 输入框提问 | `request_type: qa, query_type: custom` | 预留 |

**前端实现策略**：
- 后端未实现时：显示"功能开发中，敬请期待"
- 后端实现后：动态启用，无需修改UI结构

---

## 四、状态管理设计

### 4.1 存储分层

```
┌─────────────────────────────────────────────────────────────┐
│                    前端状态管理                              │
├─────────────────────────────────────────────────────────────┤
│  localStorage (持久化)                                      │
│  ├── 用户ID: readwise_user_id                               │
│  ├── 训练历史: training_groups (最近7天)                    │
│  ├── 战力值缓存: power_cache (最后一次计算)                  │
│  └── 未完成训练: current_group (断点续传)                   │
├─────────────────────────────────────────────────────────────┤
│  React State / Context (运行时)                             │
│  ├── 当前训练组: currentGroup                               │
│  ├── 当前文章索引: currentArticleIndex                      │
│  ├── 答题状态: answers                                      │
│  └── UI状态: loading, error, modal                          │
├─────────────────────────────────────────────────────────────┤
│  后端同步 (预留)                                            │
│  ├── POST /api/sync (提交训练记录)                          │
│  ├── GET /api/user/power (获取战力值)                       │
│  └── GET /api/user/history (获取历史记录)                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 断点续传

```javascript
// 用户中途刷新/关闭页面后恢复
const resumeTraining = () => {
  const savedGroup = localStorage.getItem('current_training_group')
  if (savedGroup && savedGroup.status === 'in_progress') {
    // 恢复到上次的进度
    return {
      group: savedGroup,
      currentArticleIndex: savedGroup.articles.length  // 已完成的数量
    }
  }
  return null
}
```

### 4.3 战力值（前端计算版本）

后端未实现时，前端计算简化版战力值：

```javascript
// 基于当前训练组计算
const calculatePower = (group: TrainingGroup) => {
  const allQuestions = group.articles.flatMap(a => a.question_attempts)
  const total = allQuestions.length
  const correct = allQuestions.filter(q => q.is_correct).length
  
  // 正确率分 (0-100)
  const accuracyScore = (correct / total) * 100
  
  // 用时得分 (越快越高，基准30秒/题)
  const avgTime = allQuestions.reduce((sum, q) => sum + q.time_spent, 0) / total
  const speedScore = Math.max(0, 100 - (avgTime / 30) * 50)
  
  // 简单加权
  return {
    total: Math.round(accuracyScore * 0.7 + speedScore * 0.3),
    accuracy: accuracyScore,
    speed: speedScore,
    updated_at: new Date().toISOString()
  }
}
```

---

## 五、前端API封装设计

### 5.1 统一API客户端

```javascript
// lib/api/client.js
class ApiClient {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL
    this.pollingInterval = 2000
    this.maxPollingAttempts = 30
  }
  
  // 提交请求（异步，返回request_id）
  async submit(request) {
    const response = await fetch(`${this.baseUrl}/api/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    return response.json()  // { request_id, status: "processing" }
  }
  
  // 轮询获取结果
  async pollResult(requestId, onProgress) {
    for (let i = 0; i < this.maxPollingAttempts; i++) {
      await sleep(this.pollingInterval)
      const result = await this.fetchResult(requestId)
      
      if (result.status === 'completed') {
        return result.results
      }
      if (result.status === 'failed') {
        throw new Error(result.error_log?.join(', ') || '处理失败')
      }
      if (onProgress) {
        onProgress({ attempt: i + 1, status: result.status })
      }
    }
    throw new Error('请求超时，请稍后重试')
  }
  
  // 通用请求方法（同步等待结果）
  async request(request) {
    const { request_id } = await this.submit(request)
    return this.pollResult(request_id)
  }
}
```

### 5.2 各模块调用示例

```javascript
// 错因诊断
const diagnosisResult = await api.request({
  user_id: userId,
  request_type: 'attempt',
  paragraph: '...',
  question_text: '...',
  options: { A: '...', B: '...', C: '...', D: '...' },
  user_answer: 'B',
  correct_answer: 'C',
  time_spent: 45
})

// 语料生成
const article = await api.request({
  user_id: userId,
  request_type: 'corpus',
  difficulty: 'L2',
  genre: 'argumentative',
  topic: 'technology',
  word_count: 350
})

// 问答（查词）
const wordMeaning = await api.request({
  user_id: userId,
  request_type: 'qa',
  query_type: 'word',
  content: 'reject',
  context_sentence: 'The proposal was rejected...'
})
```

---

## 六、UI模块开发顺序

| 阶段 | 模块 | 预估工时 | 依赖 |
|------|------|---------|------|
| **Phase 1** | 基础框架 + 路由 + 状态管理 | 2天 | 无 |
| **Phase 1** | 训练组管理（4篇一组 + 计时） | 2天 | Phase1 |
| **Phase 1** | 文章阅读器（基础版） | 1.5天 | Phase1 |
| **Phase 1** | 答题组件 + 正计时 | 1.5天 | Phase1 |
| **Phase 2** | 错因诊断集成（调用后端） | 1天 | 后端就绪 |
| **Phase 2** | 集中分析页 | 2天 | Phase2错因诊断 |
| **Phase 3** | 语料生成UI | 1天 | 后端就绪 |
| **Phase 3** | 主动学习功能（预留接口） | 1.5天 | 无（mock） |
| **Phase 4** | 战力值仪表盘 | 1.5天 | 无（前端计算） |
| **Phase 4** | 历史记录 + 断点续传 | 1天 | Phase1 |

---

## 七、技术选型确认

| 领域 | 建议 | 备选 |
|------|------|------|
| 轮询 | 原生 `setInterval` + `fetch` | `swr` 或 `react-query` |
| 计时器 | `performance.now()` + `requestAnimationFrame` | `Date.now()` |
| 滚动监听 | `IntersectionObserver` | `scroll` 事件 + 防抖 |
| 状态管理 | `Zustand` + `localStorage` 中间件 | `Context` + `useReducer` |
| UI组件 | `shadcn/ui` | `Tailwind` 手写 |
| 图表 | `Recharts` | `Chart.js` |

---

# 前端API设计（基于补充信息）

---

## 一、核心API接口清单

| 接口 | 方法 | 用途 | 后端状态 |
|------|------|------|---------|
| `/api/auth/login` | POST | 用户登录，获取user信息 | 待实现 |
| `/api/training/generate` | POST | 调用语料专家，生成完整训练组（4篇文章+题目） | 待实现 |
| `/api/attempt` | POST | 提交单题/单篇文章的诊断分析 | 已实现 |
| `/api/result/{request_id}` | GET | 轮询获取诊断结果 | 已实现 |
| `/api/training/submit` | POST | 提交整组训练记录（含计时数据） | 预留 |
| `/api/user/power` | GET | 获取用户战力值 | 预留 |
| `/api/user/history` | GET | 获取历史训练记录 | 预留 |
| `/api/qa` | POST | 主动学习功能（查词/翻译/语法/长难句） | 预留 |

---

## 二、登录与用户信息接口

### 2.1 登录请求

**端点**：`POST /api/auth/login`

**请求体**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `username` | string | 用户名 |
| `password` | string | 密码（内测期可简化） |

**响应体**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户唯一标识 |
| `username` | string | 用户名 |
| `token` | string | 后续请求的认证令牌 |
| `expires_at` | timestamp | 令牌过期时间 |

**前端行为**：
- 内测期可提供「一键登录/游客模式」，自动生成临时user_id
- 将user_id和token存入localStorage
- 后续所有API请求携带token（Header: `Authorization: Bearer {token}`）

---

## 三、训练组生成接口（核心）

### 3.1 请求

**端点**：`POST /api/training/generate`

**请求体**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | ✅ | 用户ID |
| `difficulty` | string | ✅ | L1/L2/L3/L4 |
| `genre` | string | 否 | argumentative/expository/narrative，不传则随机 |
| `topic` | string | 否 | 主题偏好，不传则随机 |
| `article_count` | int | 否 | 文章数量，默认4 |

### 3.2 响应体

```json
{
  "training_group_id": "tg_xxx",
  "articles": [
    {
      "article_id": "art_001",
      "title": "The Future of AI",
      "content": "文章完整内容（Markdown格式）",
      "word_count": 342,
      "difficulty": "L2",
      "genre": "argumentative",
      "questions": [
        {
          "question_id": "q_001",
          "question_text": "What is the main idea of paragraph 2?",
          "options": {
            "A": "...",
            "B": "...",
            "C": "...",
            "D": "..."
          },
          "correct_answer": "C",
          "question_type": "inference",
          "explanation": "答案解析（预留）"
        }
      ]
    }
  ],
  "generated_at": "2026-01-15T10:30:00Z"
}
```

### 3.3 前端行为

| 行为 | 说明 |
|------|------|
| 调用时机 | 用户选择难度后，点击「开始训练」 |
| loading状态 | 显示「生成文章中...」，预计等待3-8秒 |
| 失败处理 | 显示错误提示，提供「重试」按钮 |
| 存储 | 将training_group_id和articles存入localStorage（断点续传） |

---

## 四、诊断接口（已实现）

### 4.1 提交诊断

**端点**：`POST /api/attempt`

**请求体**（补充字段）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户ID |
| `training_group_id` | string | 当前训练组ID |
| `article_id` | string | 当前文章ID |
| `question_id` | string | 当前题目ID |
| `request_type` | string | 固定为 `attempt` |
| `paragraph` | string | 原文段落（证据段落） |
| `question_text` | string | 题目内容 |
| `options` | object | 选项 |
| `user_answer` | string | 学生答案 |
| `correct_answer` | string | 正确答案 |
| `time_spent` | int | 本题用时（秒） |

**响应**：`{ request_id, status: "processing" }`

### 4.2 轮询结果

**端点**：`GET /api/result/{request_id}`

**响应体**（诊断完成时）：
```json
{
  "status": "completed",
  "results": {
    "diagnosis": {
      "error_category": "V1",
      "evidence_sentence": "...",
      "fix_suggestion": "...",
      "similar_distractor": "..."
    }
  }
}
```

### 4.3 前端行为

| 行为 | 说明 |
|------|------|
| 提交时机 | 用户选择答案后自动提交（或点击「下一题」时） |
| 等待诊断 | 显示「分析中...」，轮询间隔2秒 |
| 诊断展示 | 在集中分析页展示，不在答题过程中打断 |
| 批量提交 | 可设计为答完一篇文章后批量提交所有题目 |

---

## 五、主动学习接口（预留）

### 5.1 请求

**端点**：`POST /api/qa`

**请求体**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户ID |
| `training_group_id` | string | 当前训练组ID |
| `query_type` | string | word / sentence / grammar / translate / custom |
| `content` | string | 查询内容（单词/句子/语法点/问题） |
| `context` | string | 上下文（可选，用于消歧） |

**响应体**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `answer` | string | 回答内容 |
| `examples` | array | 示例（可选） |
| `related_knowledge` | array | 相关知识（可选） |

### 5.2 前端行为

| 阶段 | 行为 |
|------|------|
| 后端未实现时 | 显示Mock UI：「功能开发中，敬请期待」 |
| 后端实现后 | 动态启用，无需修改UI结构 |

---

## 六、数据同步与战力值接口（预留）

### 6.1 提交整组训练记录

**端点**：`POST /api/training/submit`

**请求体**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户ID |
| `training_group_id` | string | 训练组ID |
| `total_duration` | int | 整组总用时（秒） |
| `articles` | array | 每篇文章的详细计时和答题数据（结构同前端ArticleSession） |

**响应**：`{ status: "ok", power_update: {...} }`

### 6.2 获取战力值

**端点**：`GET /api/user/power`

**查询参数**：`user_id`

**响应体**：
```json
{
  "total": 342,
  "vocabulary": 78,
  "grammar": 65,
  "inference": 82,
  "speed": 54,
  "endurance": 71,
  "history": [...]  // 历史趋势
}
```

### 6.3 前端行为

| 阶段 | 行为 |
|------|------|
| 后端未实现时 | 前端本地计算简化版战力值，存入localStorage |
| 后端实现后 | 优先请求后端，本地计算作为fallback |

---

## 七、API调用流程图

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. 用户登录 / 游客模式                                          │
│    POST /api/auth/login → 获取 user_id + token                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. 开始训练                                                     │
│    POST /api/training/generate → 获取 training_group_id + 4篇文章│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. 逐题诊断（答题过程中）                                        │
│    POST /api/attempt → request_id                              │
│    GET /api/result/{id} → 轮询诊断结果                          │
│    （结果存入本地，集中分析页展示）                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. 完成整组训练                                                 │
│    POST /api/training/submit → 同步训练记录（预留）              │
│    GET /api/user/power → 获取战力值（预留）                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. 主动学习（集中分析页）                                        │
│    POST /api/qa → 查词/翻译/语法/长难句（预留，先Mock）          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 八、前端API封装要点

| 模块 | 职责 |
|------|------|
| `api/auth.ts` | 登录、游客模式、token管理 |
| `api/training.ts` | 生成训练组、提交训练记录 |
| `api/diagnosis.ts` | 提交诊断、轮询结果 |
| `api/qa.ts` | 主动学习（预留） |
| `api/user.ts` | 战力值、历史记录（预留） |

| 通用能力 | 说明 |
|---------|------|
| 轮询封装 | 统一处理2秒间隔、30次上限、超时重试 |
| 错误处理 | 网络错误、超时、后端错误码的统一处理 |
| Token注入 | 请求拦截器自动添加Authorization头 |
| 请求去重 | 同一request_id的轮询不重复发起 |
