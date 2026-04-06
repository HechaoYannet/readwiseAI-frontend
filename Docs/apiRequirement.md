# 后端 API 需求文档

> 本文档基于前端源码（`src/lib/api-client.ts`、`src/types/training.ts`、`src/lib/store.ts`）及 `DesignRoof.md` 整理，列出所有功能所依赖的后端接口，供后端开发者参考实现。

---

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_API_URL` | 后端服务根地址（如 `https://api.example.com`）。前端所有接口请求均以此为前缀。未配置时前端自动使用本地 Mock 数据。 |

---

## 接口状态总览

| # | 端点 | 方法 | 功能 | 当前状态 |
|---|------|------|------|---------|
| 1 | `/api/training/generate` | POST | 生成一组训练（4篇文章 + 题目） | **前端已接入，待后端实现** |
| 2 | `/api/attempt` | POST | 提交答题记录，发起 AI 诊断 | **前端已定义，待接入 & 后端实现** |
| 3 | `/api/result/{attempt_id}` | GET | 轮询获取诊断结果 | **前端已定义，待接入 & 后端实现** |
| 4 | `/api/auth/login` | POST | 用户登录 / 游客模式 | **前端预留，待实现** |
| 5 | `/api/training/submit` | POST | 提交整组训练记录（含计时） | **前端预留，待实现** |
| 6 | `/api/user/power` | GET | 获取用户战力值 | **前端预留，待实现** |
| 7 | `/api/user/history` | GET | 获取历史训练记录 | **前端预留，待实现** |
| 8 | `/api/qa` | POST | 主动学习（查词/翻译/语法/长难句/自由提问） | **前端预留，待实现** |

---

## 一、训练组生成接口（核心，已接入）

### `POST /api/training/generate`

**触发时机**：用户在 `/train` 页面选择难度后点击「开始训练」。

#### 请求体

```json
{
  "difficulty": "L2",
  "topic": "technology"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `difficulty` | string | ✅ | 难度等级：`L1` / `L2` / `L3` / `L4` |
| `topic` | string | 否 | 主题偏好（如 `technology`、`environment`）；不传则随机 |

#### 响应体

```json
{
  "group_id": "tg_20260101_001",
  "user_id": "user_abc",
  "difficulty": "L2",
  "start_time": 1704067200000,
  "end_time": 0,
  "total_duration": 0,
  "articles": [
    {
      "article_id": "art_001",
      "title": "The Future of AI",
      "content": "段落1内容\n\n段落2内容\n\n段落3内容\n\n段落4内容",
      "word_count": 342,
      "difficulty": "L2",
      "genre": "argumentative",
      "questions": [
        {
          "question_id": "q_001_1",
          "question_text": "What is the main idea of the first paragraph?",
          "options": {
            "A": "...",
            "B": "...",
            "C": "...",
            "D": "..."
          },
          "correct_answer": "B",
          "question_type": "main_idea",
          "explanation": "答案解析（可选）"
        }
      ]
    }
  ],
  "sessions": [],
  "status": "in_progress"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `group_id` | string | 训练组唯一 ID |
| `user_id` | string | 用户 ID（游客可为固定占位值） |
| `difficulty` | string | 难度等级 |
| `start_time` | number | 时间戳（毫秒） |
| `end_time` | number | 初始为 `0`，完成后由后端填写 |
| `total_duration` | number | 初始为 `0` |
| `articles` | TrainingArticle[] | 4 篇文章数组（见下方子结构） |
| `sessions` | ArticleSession[] | 初始为空数组 `[]` |
| `status` | string | `in_progress` |

#### TrainingArticle 子结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `article_id` | string | 文章唯一 ID |
| `title` | string | 文章标题 |
| `content` | string | 文章正文，**段落间以 `\n\n` 分隔** |
| `word_count` | number | 单词数 |
| `difficulty` | string | 文章难度 |
| `genre` | string | 文体类型（`argumentative` / `expository` / `narrative` 等） |
| `questions` | TrainingQuestion[] | 题目列表（每篇 3–4 道） |

#### TrainingQuestion 子结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `question_id` | string | 题目唯一 ID |
| `question_text` | string | 题目内容 |
| `options` | object | `{ A: string, B: string, C: string, D: string }` |
| `correct_answer` | string | 正确答案，值为 `A` / `B` / `C` / `D` |
| `question_type` | string | `main_idea` / `detail` / `inference` / `vocabulary` |
| `explanation` | string | 答案解析（可选，用于分析页展示） |

#### 错误响应

| HTTP 状态码 | 说明 |
|------------|------|
| `400` | 请求参数无效（如 difficulty 值非法） |
| `500` | 服务内部错误（如 LLM 调用失败） |
| `503` | 服务暂时不可用 |

> 前端在收到非 2xx 响应时会自动 fallback 到本地 Mock 数据。

---

## 二、答题诊断接口（前端已定义，待接入）

### `POST /api/attempt`

**触发时机**：用户完成一篇文章所有题目后（计划在「完成本篇」时批量提交）。

#### 请求体

```json
{
  "group_id": "tg_20260101_001",
  "article_id": "art_001",
  "question_attempts": [
    {
      "question_id": "q_001_1",
      "user_answer": "A",
      "is_correct": false,
      "time_spent": 45000,
      "start_time": 1704067200000,
      "submit_time": 1704067245000
    },
    {
      "question_id": "q_001_2",
      "user_answer": "C",
      "is_correct": true,
      "time_spent": 30000,
      "start_time": 1704067245000,
      "submit_time": 1704067275000
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `group_id` | string | ✅ | 训练组 ID |
| `article_id` | string | ✅ | 文章 ID |
| `question_attempts` | QuestionAttempt[] | ✅ | 该篇所有题目的答题记录 |

#### QuestionAttempt 子结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `question_id` | string | 题目 ID |
| `user_answer` | string | 用户所选答案（`A` / `B` / `C` / `D`） |
| `is_correct` | boolean | 是否正确 |
| `time_spent` | number | 答题用时（毫秒） |
| `start_time` | number | 开始答题时间戳（毫秒） |
| `submit_time` | number | 提交时间戳（毫秒） |

#### 响应体（立即返回，异步处理）

```json
{
  "attempt_id": "att_xyz789",
  "status": "pending"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `attempt_id` | string | 本次提交的唯一 ID，用于后续轮询 |
| `status` | string | `pending`（处理中）/ `ready`（已完成）/ `error`（失败） |

---

## 三、诊断结果轮询接口（前端已定义，待接入）

### `GET /api/result/{attempt_id}`

**触发时机**：提交 `/api/attempt` 后，前端每 2 秒轮询一次，最多 30 次（60 秒超时）。  
**退避策略**：发生网络错误时，间隔乘以 1.5，最长不超过 10 秒。

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `attempt_id` | string | 由 `/api/attempt` 返回的 `attempt_id` |

#### 响应体（处理中）

```json
{
  "attempt_id": "att_xyz789",
  "status": "pending"
}
```

#### 响应体（诊断完成）

```json
{
  "attempt_id": "att_xyz789",
  "status": "ready",
  "results": {
    "q_001_1": {
      "error_category": "词义理解错误",
      "evidence_sentence": "The technology was first introduced in 2015.",
      "fix_suggestion": "建议回顾原文对应段落，注意关键词和上下文语义。",
      "similar_distractor": "A"
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `attempt_id` | string | 对应的提交 ID |
| `status` | string | `pending` / `ready` / `error` |
| `results` | Record\<question_id, DiagnosisResult\> | 仅错误题目会出现在 `results` 中；正确题无需返回 |

#### DiagnosisResult 子结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `error_category` | string | 错因分类，如 `词义理解错误`、`细节定位错误`、`推断失误` 等 |
| `evidence_sentence` | string | 原文中的关键证据句 |
| `fix_suggestion` | string | 针对该题的修复建议 |
| `similar_distractor` | string | 用户选择的干扰项（可选，用于展示） |

---

## 四、用户登录接口（预留）

### `POST /api/auth/login`

**触发时机**：用户进入应用时登录，或游客模式下自动获取临时身份。

#### 请求体

```json
{
  "username": "student_01",
  "password": "password123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | ✅ | 用户名 |
| `password` | string | ✅ | 密码（内测期可简化验证） |

#### 响应体

```json
{
  "user_id": "user_abc123",
  "username": "student_01",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expires_at": 1706745600000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户唯一 ID，后续所有接口携带 |
| `username` | string | 用户名 |
| `token` | string | JWT 或会话令牌，前端存入 localStorage |
| `expires_at` | number | 令牌过期时间戳（毫秒） |

> **内测期**：支持「游客模式」，请求体可传 `{ "guest": true }`，后端返回临时 `user_id` 即可。

---

## 五、整组训练记录提交接口（预留）

### `POST /api/training/submit`

**触发时机**：用户完成全部 4 篇文章，点击「查看分析」前自动触发。

#### 请求体

```json
{
  "user_id": "user_abc123",
  "group_id": "tg_20260101_001",
  "total_duration": 1423000,
  "articles": [
    {
      "article_id": "art_001",
      "start_time": 1704067200000,
      "end_time": 1704067560000,
      "reading_duration": 360000,
      "paragraph_timestamps": [
        {
          "paragraph_index": 0,
          "enter_time": 1704067200000,
          "exit_time": 1704067245000,
          "duration": 45000
        }
      ],
      "question_attempts": [
        {
          "question_id": "q_001_1",
          "user_answer": "A",
          "is_correct": false,
          "time_spent": 45000,
          "start_time": 1704067510000,
          "submit_time": 1704067555000
        }
      ],
      "status": "completed"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户 ID |
| `group_id` | string | 训练组 ID |
| `total_duration` | number | 整组总用时（毫秒） |
| `articles` | ArticleSession[] | 每篇文章的完整会话数据（见子结构） |

#### ArticleSession 子结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `article_id` | string | 文章 ID |
| `start_time` | number | 开始阅读时间戳（毫秒） |
| `end_time` | number | 完成时间戳（毫秒） |
| `reading_duration` | number | 阅读用时（毫秒） |
| `paragraph_timestamps` | ParagraphTiming[] | 每段的滑动窗口计时数据 |
| `question_attempts` | QuestionAttempt[] | 每题答题记录 |
| `status` | string | `completed` |

#### ParagraphTiming 子结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `paragraph_index` | number | 段落索引（从 0 开始） |
| `enter_time` | number | 进入段落时间戳（毫秒） |
| `exit_time` | number | 离开段落时间戳（毫秒） |
| `duration` | number | 停留时长（毫秒） |

#### 响应体

```json
{
  "status": "ok",
  "power_update": {
    "total": 374,
    "accuracy": 80,
    "speed": 72,
    "vocabulary": 78,
    "grammar": 65,
    "inference": 82,
    "endurance": 71,
    "updated_at": "2026-01-15T10:30:00Z"
  }
}
```

---

## 六、战力值接口（预留）

### `GET /api/user/power`

**触发时机**：用户进入战力仪表盘页面，或完成训练后刷新战力值。

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户 ID |

**示例**：`GET /api/user/power?user_id=user_abc123`

#### 响应体

```json
{
  "total": 374,
  "accuracy": 80,
  "speed": 72,
  "vocabulary": 78,
  "grammar": 65,
  "inference": 82,
  "endurance": 71,
  "updated_at": "2026-01-15T10:30:00Z",
  "history": [
    { "date": "2026-01-14", "total": 342 },
    { "date": "2026-01-15", "total": 374 }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | number | 综合战力值（0–1000） |
| `accuracy` | number | 正确率维度得分（0–100） |
| `speed` | number | 速度维度得分（0–100） |
| `vocabulary` | number | 词汇维度得分（可选） |
| `grammar` | number | 语法维度得分（可选） |
| `inference` | number | 推断维度得分（可选） |
| `endurance` | number | 耐力维度得分（可选） |
| `updated_at` | string | ISO 8601 时间字符串 |
| `history` | array | 历史趋势（可选，按日期排序） |

> **降级方案**：后端未实现时，前端使用本地 `calculatePower()` 函数基于当次训练结果计算简化版战力值（accuracy × 0.7 + speed × 0.3），存入 localStorage。

---

## 七、历史训练记录接口（预留）

### `GET /api/user/history`

**触发时机**：用户进入历史记录页面。

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户 ID |
| `limit` | number | 返回条数，默认 20 |
| `offset` | number | 分页偏移，默认 0 |

#### 响应体

```json
{
  "total": 35,
  "records": [
    {
      "group_id": "tg_20260101_001",
      "difficulty": "L2",
      "start_time": 1704067200000,
      "end_time": 1704068623000,
      "total_duration": 1423000,
      "status": "completed",
      "accuracy": 75,
      "power_gained": 32
    }
  ]
}
```

> **降级方案**：后端未实现时，前端使用 Zustand store 中的 `trainingHistory`（最多保留 20 条）作为本地历史。

---

## 八、主动学习接口（预留）

### `POST /api/qa`

**触发时机**：用户在分析页进行以下操作时触发：
- 选中单词 → 点击「翻译」
- 选中句子 → 点击「翻译」或「提问」
- 点击长难句 → 点击「拆解主干」
- 底部输入框自由提问

#### 请求体

```json
{
  "user_id": "user_abc123",
  "group_id": "tg_20260101_001",
  "query_type": "word",
  "content": "perpetuate",
  "context": "AI systems may perpetuate existing inequalities."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | ✅ | 用户 ID |
| `group_id` | string | ✅ | 当前训练组 ID |
| `query_type` | string | ✅ | 见下方枚举 |
| `content` | string | ✅ | 查询内容（单词/句子/问题） |
| `context` | string | 否 | 上下文句子，用于消歧 |

#### query_type 枚举

| 值 | 说明 | 触发方式 |
|----|------|---------|
| `word` | 划词翻译 | 选中单词 → 弹窗「翻译」 |
| `translate` | 划句翻译 | 选中句子 → 弹窗「翻译」 |
| `sentence` | 长难句拆解 | 点击高亮长难句 → 「拆解主干」 |
| `grammar` | 语法讲解 | 点击语法标签 |
| `custom` | 用户自由提问 | 底部输入框 → Send |

#### 响应体

```json
{
  "answer": "**perpetuate** 意为「使（某事物）持续存在」。\n\n在本句中，意指 AI 系统可能会让现有的不平等现象持续下去。",
  "examples": [
    "These policies perpetuate social inequality.",
    "The myth has been perpetuated for centuries."
  ],
  "related_knowledge": [
    "同根词：perpetual（永久的）, perpetually（永久地）",
    "近义词：sustain, maintain, prolong"
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `answer` | string | 回答内容（支持 Markdown） |
| `examples` | string[] | 示例句（可选） |
| `related_knowledge` | string[] | 相关知识点（可选） |

> **降级方案**：后端未实现时，前端显示 Stub 提示「功能开发中，敬请期待」，UI 结构不变，后端就绪后动态启用无需修改前端。

---

## 附录 A：通用约定

### 认证方式（登录功能实现后）

所有需要身份验证的请求须在 Header 中携带：

```
Authorization: Bearer <token>
```

### 统一错误响应格式

```json
{
  "error": "invalid_difficulty",
  "message": "difficulty 必须为 L1、L2、L3 或 L4 之一",
  "code": 400
}
```

### 时间戳

所有时间字段均使用 **Unix 毫秒时间戳**（`number` 类型），除 `updated_at` 等日志类字段使用 ISO 8601 字符串。

---

## 附录 B：前端 Fallback 策略汇总

| 接口 | 后端未就绪时的前端行为 |
|------|----------------------|
| `/api/training/generate` | 使用 `createMockTrainingGroup()` 返回本地 Mock 文章 |
| `/api/attempt` | 使用 `buildMockDiagnosis()` 根据题型生成本地伪诊断 |
| `/api/result/{id}` | 重试超时后返回本地伪诊断 |
| `/api/auth/login` | 使用 localStorage 中的 `readwise_user_id` 或生成临时 ID |
| `/api/training/submit` | 训练记录仅存 Zustand + localStorage（最多 20 条） |
| `/api/user/power` | 前端本地计算：`accuracy×0.7 + speed×0.3` |
| `/api/user/history` | 使用 Zustand `trainingHistory` 列表 |
| `/api/qa` | 显示「功能开发中，敬请期待」Stub UI |
