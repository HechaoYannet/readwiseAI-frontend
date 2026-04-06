# 🎯 ReadWise AI 前端开发规范

> 本文档用于指导 Copilot/Codeium/Cursor 等 AI 编程助手生成代码
> 
> **项目名称**：ReadWise AI - 智能英语阅读训练平台
> 
> **技术栈**：Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui

---

## 📋 一、项目定位与设计理念

### 1.1 产品定位
- **目标用户**：高中生（备考全国I卷英语）
- **核心场景**：周末2小时集中训练 + 周中5分钟微复习
- **设计关键词**：科学、量化、专注、高效、低认知负担

### 1.2 视觉风格指南

| 属性 | 规范 |
|------|------|
| **主色调** | 深蓝 (#1E3A5F) + 青色 (#0EA5E9) — 信任感 + 活力 |
| **辅助色** | 琥珀色 (#F59E0B) 用于强调/警告，翠绿 (#10B981) 用于正确/成功 |
| **背景** | 浅灰 (#F8FAFC) 主背景，白色卡片 (#FFFFFF) |
| **字体** | Inter (系统默认降级为 SF Pro / Roboto) |
| **圆角** | 卡片 12px，按钮 8px，极小元素 4px |
| **阴影** | 轻微阴影 `shadow-sm`，hover时 `shadow-md` |
| **动画** | 200-300ms 缓动过渡，避免过度动效 |

### 1.3 响应式断点
```
移动端: < 640px (优先保证阅读体验)
平板: 640px - 1024px (双栏布局)
桌面: > 1024px (最大宽度 1280px，居中)
```

---

## 🧩 二、页面清单与功能要求

### 2.1 页面路由结构
```
/                → 首页（训练模式选择）
/read/[id]       → 阅读+答题主界面
/dashboard       → 战力值仪表盘
/review          → 今日复习清单
/settings        → 设置（可选，后期）
```

### 2.2 各页面详细要求

---

## 📄 页面1：首页（训练模式选择）

### 设计要求
- **欢迎区域**：显示"你好，[用户名]" + 今日推荐（基于遗忘曲线）
- **四个模式卡片**：速读 / 精读 / 猜词 / 模考
- **战力值悬浮球**：右上角圆形进度条，点击跳转仪表盘
- **最近训练**：显示最近3篇文章的标题+正确率

### 模式卡片规范
```typescript
interface ModeCard {
  title: string;        // "速读训练"
  icon: ReactNode;      // 闪电/放大镜/灯泡/试卷图标
  description: string;  // "限时阅读，提升信息抓取速度"
  duration: string;     // "≈ 5分钟"
  color: string;        // 卡片渐变/边框色
  action: () => void;   // 跳转
}
```

### 布局（桌面端）
```
┌─────────────────────────────────────────────┐
│  [Logo]              [战力值悬浮球]  [设置]  │
├─────────────────────────────────────────────┤
│  ┌─ 今日推荐 ──────────────────────────┐    │
│  │ 基于遗忘曲线，建议复习 X 个知识点      │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────┐│
│  │ 速读    │ │ 精读    │ │ 猜词    │ │模考 ││
│  │ 5min    │ │ 15min   │ │ 8min    │ │35min││
│  └─────────┘ └─────────┘ └─────────┘ └─────┘│
│                                               │
│  ┌─ 最近训练 ──────────────────────────┐    │
│  │ • 2024全国I卷C篇          正确率 75% │    │
│  │ • 华师一附中模拟          正确率 60% │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 📖 页面2：阅读+答题主界面 `/read/[id]`

### 设计要求
- **三栏布局**（桌面端）：
  - 左侧：文章区域（60%宽度）
  - 右侧：答题区域（40%宽度）
  - 移动端：上下堆叠
- **阅读模式切换**（速读模式特有）：
  - 每段倒计时（15-20秒）
  - 倒计时结束自动滚动到下一段
  - 学生可手动跳过
- **交互功能**：
  - 长按/点击单词 → 弹出查词窗口（调用后端API）
  - 长难句高亮（黄色背景） → 点击展开语法拆解
  - 猜词模式：特定词替换为`[____]`，hover显示线索

### 文章渲染规范
```typescript
interface ArticleDisplay {
  content: string;        // Markdown格式（含标注）
  currentParagraph: number;
  totalParagraphs: number;
  onParagraphComplete: (timeSpent: number) => void;
  mode: 'speed' | 'intensive' | 'guess' | 'exam';
}
```

### 答题区规范
```typescript
interface QuestionPanel {
  questions: Question[];      // 当前文章的题目
  currentIndex: number;
  onAnswer: (answer: string, timeSpent: number) => void;
  onSubmit: () => void;       // 全部答完提交
}
```

### 状态管理要求
- 阅读进度本地存储（刷新后恢复）
- 每道题的用时自动记录（从题目出现到选择的时间）
- 提交后显示 Loading 状态（等待后端诊断）

---

## 📊 页面3：战力值仪表盘 `/dashboard`

### 设计要求
- **战力值总分**：大号数字 + 环形进度条（0-500分）
- **五维雷达图**：词汇力 / 语法力 / 推断力 / 速读力 / 耐力
- **趋势折线图**：最近7天/30天总分变化
- **弱点分析卡片**：
  - 按错因分类统计（G1/V1/V2/L1/L2/T1/T2）
  - 显示最薄弱的2个维度
  - 推荐训练模式
- **错题本入口**：跳转到错题列表

### 图表库选择
- 推荐使用 **Recharts**（轻量、React原生）
- 雷达图配置：五边形，填充透明度0.2，边框主色
- 折线图：平滑曲线，数据点标记

### 数据刷新策略
- 每次进入页面自动拉取最新数据
- 提交答案后自动更新（无需刷新页面）

---

## 🔄 页面4：今日复习清单 `/review`

### 设计要求
- **基于遗忘曲线排序**：记忆强度最低的优先
- **卡片式复习**：
  - 展示原题（或同类变形）
  - 学生选择答案
  - 即时反馈（对/错）
  - 点击"查看解析"展开错因
- **进度追踪**：今日完成 X/5 个复习点
- **复习完成后**：显示"今日复习完成，战力值 +X"

### 复习卡片规范
```typescript
interface ReviewCard {
  id: string;
  originalQuestion: string;
  options: string[];
  correctAnswer: string;
  userLastAnswer?: string;
  strength: number;        // 记忆强度 0-1
  errorCategory: string;   // 错因类型
}
```

---

## 🎨 三、组件复用规范（shadcn/ui）

### 3.1 优先使用的 shadcn/ui 组件
| 组件 | 用途 | 导入路径 |
|------|------|---------|
| Button | 所有按钮 | `@/components/ui/button` |
| Card | 模式卡片、文章卡片 | `@/components/ui/card` |
| Progress | 战力值环形/线性进度 | `@/components/ui/progress` |
| Tabs | 仪表盘切换（维度/历史） | `@/components/ui/tabs` |
| Dialog | 错因诊断弹窗 | `@/components/ui/dialog` |
| Popover | 查词弹窗 | `@/components/ui/popover` |
| Skeleton | 加载骨架屏 | `@/components/ui/skeleton` |
| Toast | 提交成功/失败提示 | `@/components/ui/toast` |

### 3.2 自定义组件要求
- **命名规范**：PascalCase（如 `ArticleRenderer.tsx`）
- **Props接口**：必须定义 TypeScript interface
- **默认导出**：组件使用默认导出
- **样式**：优先 TailwindCSS，避免 `.css` 文件（除非全局样式）

---

## 🔌 四、API 集成规范

### 4.1 后端 API 接口（假定）
```typescript
// API 客户端配置 (src/lib/api.ts)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 接口列表
GET    /api/articles?mode=speed&limit=10     // 获取文章列表
GET    /api/articles/:id                     // 获取单篇文章+题目
POST   /api/attempt                          // 提交答案
GET    /api/user/power                       // 获取战力值
GET    /api/user/history?limit=20            // 获取错题本
GET    /api/review/today                     // 获取今日复习清单
POST   /api/review/:id/answer                // 提交复习答案
```

### 4.2 请求封装要求
```typescript
// 示例：统一的 fetch 封装
async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // 自动添加 baseURL
  // 自动处理错误（401/500等）
  // 自动显示 Toast 提示
  // 支持 AbortController 取消请求
}
```

### 4.3 数据缓存策略
- **战力值**：每次进入页面刷新（不缓存）
- **文章内容**：本地缓存 5 分钟（避免重复请求）
- **错题本**：提交答案后主动失效缓存

---

## 📱 五、用户体验细节

### 5.1 加载状态
- **页面切换**：使用 Next.js 的 `loading.tsx` 骨架屏
- **提交答案**：Button 显示 Loading 图标 + 禁用点击
- **查词弹窗**：骨架屏 + 0.5秒内无响应显示"查询中..."

### 5.2 错误处理
- **网络错误**：Toast 提示"网络连接失败，请重试"
- **LLM超时**：显示"诊断中，请稍候..."（5秒后降级到规则诊断）
- **404**：显示"文章不存在" + 返回首页按钮

### 5.3 无障碍（可选）
- 按钮有 `aria-label`
- 图片有 `alt` 属性
- 键盘可导航（Tab聚焦）

---

## 🧪 六、测试要求（Copilot 生成时）

### 6.1 单元测试（Jest）
每个自定义 Hook 需要生成测试：
```typescript
// useTimer.test.ts
// 测试计时器开始/暂停/重置
```

### 6.2 组件测试（React Testing Library）
```typescript
// QuestionCard.test.tsx
// 测试选项点击、答案提交
```

---

## 📦 七、项目初始化后的下一步

### 7.1 立即安装的依赖
```bash
npm install recharts          # 图表库
npm install @radix-ui/react-dialog @radix-ui/react-popover  # shadcn依赖
npm install clsx tailwind-merge  # 类名合并
npm install lucide-react      # 图标库
npm install zustand           # 轻量状态管理（可选）
```

### 7.2 需要创建的目录结构
```
src/
├── app/
│   ├── (auth)/              # 未来扩展
│   ├── read/
│   ├── dashboard/
│   ├── review/
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn 组件
│   ├── reading/
│   ├── quiz/
│   ├── dashboard/
│   └── review/
├── hooks/
├── lib/
│   └── api.ts
├── types/
└── store/                   # Zustand store（可选）
```

### 7.3 全局样式配置 (globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    @apply w-2;
  }
}
```

---

## 🚀 八、给 Copilot 的生成指令模板

### 示例：生成首页
```
请生成 Next.js 14 页面 src/app/page.tsx：

功能要求：
1. 顶部导航栏（Logo + 战力值悬浮球 + 设置图标）
2. 四个训练模式卡片（速读/精读/猜词/模考），卡片有 icon、描述、预估时长
3. 今日推荐区域（基于遗忘曲线）
4. 最近训练列表（3条记录，显示标题+正确率）

技术要求：
- 使用 TailwindCSS 样式
- 使用 shadcn/ui 的 Card、Button 组件
- 战力值悬浮球使用 Progress 环形进度（数据先 mock）
- 响应式：移动端卡片垂直排列，桌面端网格布局
- 添加必要的 loading 状态（骨架屏）

交互要求：
- 点击模式卡片跳转到 /read/[id]（id 先 mock）
- 点击战力球跳转到 /dashboard
```

---

## 📝 九、代码规范（Copilot 遵循）

### 9.1 TypeScript 规则
- 禁止使用 `any`（特殊情况用 `unknown`）
- 所有函数参数和返回值必须有类型
- Props 使用 `interface` 而非 `type`

### 9.2 React 规则
- 客户端组件必须写 `'use client'`（如果需要交互）
- Hook 以 `use` 开头
- 事件处理函数以 `handle` 开头（如 `handleSubmit`）

### 9.3 样式规则
- 优先使用 Tailwind 工具类
- 复杂样式抽取为 `@layer components`（globals.css）
- 避免内联 `style`（除非动态计算值）

---

## ✅ 十、验收标准

Copilot 生成的代码应满足：
1. ✅ `npm run dev` 无报错启动
2. ✅ 所有页面可访问（即使数据 mock）
3. ✅ 移动端布局不崩（使用 Chrome DevTools 测试）
4. ✅ 明暗主题？暂不需要，但保持颜色对比度
5. ✅ 代码中无硬编码敏感信息（API key 等）

---

**请 Copilot 按照以上规范生成代码，优先完成：**
1. 首页 (`page.tsx`)
2. 阅读界面框架 (`read/[id]/page.tsx`)
3. 共享组件（Button、Card 等 shadcn 初始化）

**开始生成前，请确认已运行：**
```bash
npx shadcn-ui@latest init  # 初始化 shadcn/ui
```