interface Props {
  pct: number;
  isRunning: boolean;
}

export default function ProgressBar({ pct, isRunning }: Props) {
  const safePct = Math.max(0, Math.min(100, pct));

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
      <div className="relative overflow-hidden rounded-full h-2.5 bg-zinc-900/80 border border-white/[0.08]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-lime-500 transition-[width] duration-700 ease-out"
          style={{ width: `${safePct}%` }}
        />
        {isRunning && safePct > 0 && (
          <div
            className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-[progress-shimmer_1.8s_linear_infinite]"
            style={{ left: `calc(${safePct}% - 6rem)` }}
          />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>{isRunning ? 'pipeline active' : safePct === 100 ? 'complete' : 'idle'}</span>
        <span className="tabular-nums">{safePct}%</span>
      </div>
    </div>
  );
}
