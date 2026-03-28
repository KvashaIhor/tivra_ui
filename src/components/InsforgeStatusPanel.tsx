import { Database, Shield, HardDrive, Zap, CheckCircle2, CircleDashed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STATUS_ITEMS: Array<{ label: string; step: string; Icon: LucideIcon }> = [
  { label: 'Database', step: 'db_created', Icon: Database },
  { label: 'Auth', step: 'auth_created', Icon: Shield },
  { label: 'Storage', step: 'storage_created', Icon: HardDrive },
  { label: 'Functions', step: 'functions_deployed', Icon: Zap },
];

interface Props {
  completedSteps: string[];
}

export default function InsforgeStatusPanel({ completedSteps }: Props) {
  const doneCount = STATUS_ITEMS.filter((item) => completedSteps.includes(item.step)).length;
  const pct = Math.round((doneCount / STATUS_ITEMS.length) * 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-emerald-950/20 to-transparent p-4 shadow-[0_10px_30px_rgba(16,185,129,0.12)]">
      <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(rgba(16,185,129,0.18)_1px,transparent_1px)', backgroundSize: '14px 14px' }} />

      <div className="relative mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold text-emerald-300 uppercase tracking-[-0.02em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Infrastructure
          </div>
          <div className="mt-1 text-[11px] text-emerald-100/70 font-mono">
            {doneCount}/{STATUS_ITEMS.length} services online
          </div>
        </div>
        <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-200 tabular-nums">
          {pct}%
        </div>
      </div>

      <div className="relative mb-3 h-1.5 overflow-hidden rounded-full border border-emerald-500/20 bg-emerald-900/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="relative">
        {STATUS_ITEMS.map(({ label, step, Icon }, index) => {
          const done = completedSteps.includes(step);
          const isLast = index === STATUS_ITEMS.length - 1;
          return (
            <div
              key={step}
              className={`px-1 py-2 transition-all duration-500 ${
                done
                  ? 'bg-emerald-500/8'
                  : 'bg-transparent'
              } ${
                isLast ? '' : 'border-b border-emerald-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center transition-colors">
                  <Icon
                    size={14}
                    className={`shrink-0 transition-colors ${done ? 'text-emerald-300' : 'text-zinc-500'}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-mono font-medium tracking-tight transition-colors ${done ? 'text-emerald-100' : 'text-zinc-500'}`}>
                    {label}
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-900/80 border border-white/5">
                    <div className={`h-full rounded-full transition-all duration-500 ${done ? 'w-full bg-emerald-400/90' : 'w-1/3 bg-zinc-600/70'}`} />
                  </div>
                </div>
                <div className={`text-[10px] font-mono ${done ? 'text-emerald-200' : 'text-zinc-500'}`}>
                  {done ? 'live' : 'pending'}
                </div>
                {done ? (
                  <CheckCircle2 size={14} className="text-emerald-300 shrink-0" />
                ) : (
                  <CircleDashed size={14} className="text-zinc-600 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
