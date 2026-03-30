import Link from "next/link";

interface PowerOrbProps {
  score: number;
  maxScore?: number;
}

export default function PowerOrb({ score, maxScore = 500 }: PowerOrbProps) {
  const clampedScore = Math.min(maxScore, Math.max(0, score));
  const percentage = (clampedScore / maxScore) * 100;
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Link
      href="/dashboard"
      aria-label="查看战力值仪表盘"
      className="group relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <svg className="absolute h-14 w-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="24" className="fill-none stroke-slate-200" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r="24"
          className="fill-none stroke-sky-500 transition-all duration-300"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="z-10 text-xs font-semibold text-slate-700 group-hover:text-slate-900">{clampedScore}</span>
    </Link>
  );
}

