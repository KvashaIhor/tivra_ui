'use client';

import { useEffect, useRef } from 'react';
import { AgentEvent } from '@/lib/types';

import {
  FileText, Database, Shield, HardDrive, GitMerge,
  Zap, Code2, Rocket, AlertCircle, FlaskConical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  events: AgentEvent[];
  isRunning: boolean;
}

const STEP_ICONS: Record<string, LucideIcon> = {
  spec_parsed: FileText,
  db_created: Database,
  auth_created: Shield,
  storage_created: HardDrive,
  migration_done: GitMerge,
  functions_deployed: Zap,
  code_generated: Code2,
  app_deployed: Rocket,
  error: AlertCircle,
  tests_run: FlaskConical,
};

const STEP_COLORS: Record<string, string> = {
  spec_parsed: 'text-emerald-300',
  db_created: 'text-emerald-300',
  auth_created: 'text-emerald-300',
  storage_created: 'text-emerald-300',
  migration_done: 'text-emerald-300',
  functions_deployed: 'text-emerald-300',
  code_generated: 'text-emerald-300',
  app_deployed: 'text-emerald-300',
  error: 'text-emerald-200',
  tests_run: 'text-emerald-300',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

export default function ActivityFeed({ events, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
      {events.length === 0 && !isRunning && (
        <p className="text-emerald-700 text-xs italic font-mono">
          waiting for build to start...
        </p>
      )}
      {events.map((e, i) => {
        const Icon = STEP_ICONS[e.step];
        const color = STEP_COLORS[e.step] ?? 'text-zinc-400';
        return (
          <div key={i} className="flex gap-2 py-0.5 animate-slide-up">
            <span className="text-emerald-800 text-[10px] font-mono shrink-0 pt-px w-14">
              {formatTime(e.ts)}
            </span>
            {Icon && <Icon size={12} className={`${color} shrink-0 mt-0.5`} />}
            <span className={`text-xs font-mono leading-relaxed ${color} break-all`}>
              {e.message}
            </span>
          </div>
        );
      })}
      {isRunning && (
        <div className="flex gap-2 items-center py-1">
          <span className="w-14 shrink-0" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-mono text-emerald-400 animate-blink-bar">▋</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
