'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
  Cpu,
  Circle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface GenStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface AIProgressProps {
  /** Human-readable current task description from backend */
  currentTask: string;
  /** Step list from backend — the single source of truth */
  steps: GenStep[];
  className?: string;
}

// ── Keyframes (injected once) ─────────────────────────────────────────────────

const shimmerStyles = `
@keyframes ai-pulse-glow {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.9; }
}
@keyframes ai-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
@keyframes ai-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ai-node-pulse {
  0%, 100% { box-shadow: 0 0 4px 1px rgba(99, 102, 241, 0.3); }
  50%      { box-shadow: 0 0 12px 3px rgba(99, 102, 241, 0.7); }
}
@keyframes ai-barberpole {
  0%   { background-position: 0% center; }
  100% { background-position: 200% center; }
}
`;

// ── Particle field ────────────────────────────────────────────────────────────

function ParticleField({ count = 10 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2.5 + Math.random() * 3,
      size: 2 + Math.random() * 3,
    })),
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-indigo-400/30"
          style={{
            left: `${p.x}%`,
            bottom: '100%',
            width: p.size,
            height: p.size,
            animation: `ai-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 16; // r=16
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 44, height: 44 }}>
      {/* Background circle */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20" cy="20" r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-200"
        />
        {/* Filled arc */}
        <circle
          cx="20" cy="20" r="16"
          fill="none"
          stroke="url(#ai-ring-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="ai-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <span className="relative text-[11px] font-mono font-bold tabular-nums text-indigo-700">
        {pct}%
      </span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AIProgress({
  currentTask,
  steps,
  className,
}: AIProgressProps) {
  useEffect(() => {
    const styleId = 'ai-progress-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shimmerStyles;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;
  const runningStep = steps.find((s) => s.status === 'running');
  const hasAnySteps = totalCount > 0;

  // If the first step is a planning task (sub_000), move it to a separate group
  const planningSteps = steps.filter((s) => s.id.startsWith('sub_'));
  const execSteps = hasAnySteps
    ? steps.filter((s) => !s.id.startsWith('sub_'))
    : steps;
  const articleSteps = execSteps.filter((s) => s.id.startsWith('dyn_c'));
  const questionSteps = execSteps.filter((s) => s.id.startsWith('dyn_q'));

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-cyan-50/40 p-5 shadow-lg shadow-indigo-200/20',
        className,
      )}
    >
      <ParticleField count={10} />

      {/* ── Header row ── */}
      <div className="relative flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/60">
          <Cpu className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-700 tracking-wide">
            AI 生成中
          </span>
        </div>

        {hasAnySteps ? (
          <ProgressRing completed={completedCount} total={totalCount} />
        ) : null}

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs text-slate-500">
            <Sparkles className="inline h-3 w-3 text-amber-500 mr-1" />
            {hasAnySteps
              ? `${completedCount}/${totalCount} 任务完成`
              : '正在规划...'}
          </span>
          <span className="text-[11px] text-slate-400 truncate">
            {runningStep ? runningStep.description : currentTask}
          </span>
        </div>

        {/* Thinking dots */}
        <span className="ml-auto flex gap-0.5 shrink-0">
          <span className="inline-block h-1 w-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
          <span className="inline-block h-1 w-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
          <span className="inline-block h-1 w-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
        </span>
      </div>

      {/* ── Progress bar (real: completed / total) ── */}
      {hasAnySteps && (
        <div className="relative mb-4">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
            <div
              className="absolute inset-0 h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                background:
                  'repeating-linear-gradient(-45deg, #6366f1, #6366f1 6px, #8b5cf6 6px, #8b5cf6 12px, #a855f7 12px, #a855f7 18px, #06b6d4 18px, #06b6d4 24px)',
                backgroundSize: '200% 100%',
                animation: 'ai-barberpole 2s linear infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Planning step (if present) ── */}
      {planningSteps.length > 0 && (
        <div className="relative mb-3">
          <StepList
            icon={<Circle className="h-3 w-3" />}
            label="规划"
            steps={planningSteps}
          />
        </div>
      )}

      {/* ── Execution steps ── */}
      <div className="relative grid grid-cols-2 gap-4">
        <StepList
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="文章生成"
          steps={articleSteps}
        />
        <StepList
          icon={<Zap className="h-3.5 w-3.5" />}
          label="题目生成"
          steps={questionSteps}
        />
      </div>
    </div>
  );
}

// ── Step list sub-component ───────────────────────────────────────────────────

function StepList({
  icon,
  label,
  steps,
}: {
  icon: React.ReactNode;
  label: string;
  steps: GenStep[];
}) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {icon}
        {label}
        <span className="text-slate-400">
          ({steps.filter((s) => s.status === 'completed').length}/{steps.length})
        </span>
      </div>
      <div className="relative pl-4 space-y-1.5">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-slate-200" />

        {steps.map((step, i) => (
          <div
            key={step.id}
            className="relative flex items-center gap-2 text-[11px]"
            style={{ animation: `ai-fade-in 0.4s ease-out ${i * 0.08}s both` }}
          >
            {/* Timeline node */}
            <div
              className={cn(
                'absolute left-[-4px] h-[11px] w-[11px] rounded-full border-2 transition-all duration-500',
                step.status === 'completed' && 'border-emerald-500 bg-emerald-400',
                step.status === 'running' && 'border-indigo-500 bg-indigo-400',
                step.status === 'failed' && 'border-red-500 bg-red-400',
                step.status === 'pending' && 'border-slate-300 bg-white',
              )}
              style={
                step.status === 'running'
                  ? { animation: 'ai-node-pulse 1.5s ease-in-out infinite' }
                  : undefined
              }
            >
              {step.status === 'completed' && (
                <CheckCircle2 className="absolute -top-[1px] -left-[1px] h-[11px] w-[11px] text-emerald-600" />
              )}
            </div>

            <span
              className={cn(
                'ml-2.5 transition-colors duration-500',
                step.status === 'completed' && 'text-slate-400 line-through decoration-slate-300',
                step.status === 'running' && 'text-indigo-700 font-semibold',
                step.status === 'failed' && 'text-red-600',
                step.status === 'pending' && 'text-slate-500',
              )}
            >
              {step.description}
            </span>

            {step.status === 'running' && (
              <Loader2 className="h-3 w-3 text-indigo-500 animate-spin shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
