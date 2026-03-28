'use client';

import { useState, useRef, useEffect } from 'react';
import ProgressBar from '@/components/ProgressBar';
import ActivityFeed from '@/components/ActivityFeed';
import InsforgeStatusPanel from '@/components/InsforgeStatusPanel';
import LiveCard from '@/components/LiveCard';
import { AgentEvent, BuildCredentials, BuildRequestPayload, BuildState, STEPS } from '@/lib/types';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const ORCHESTRATOR = (process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

const EXAMPLE_PROMPTS = [
  { label: 'Task Board', full: 'Build a project management tool with teams, task boards, and file attachments' },
  { label: 'CRM', full: 'Create a CRM for a sales team with contacts, deal pipeline, and notes' },
  { label: 'SaaS Starter', full: 'Make a SaaS starter with user auth, team invites, and a usage dashboard' },
  { label: 'Invoice App', full: 'Build an invoicing app with clients, line items, PDF export, and payment status tracking' },
  { label: 'Hiring Tracker', full: 'Create a hiring pipeline tracker with job postings, candidates, interview stages, and offer management' },
  { label: 'Knowledge Base', full: 'Build an internal knowledge base with articles, categories, search, and team editing' },
  { label: 'Event Planner', full: 'Make an event planning tool with events, guests, and a schedule' },
  { label: 'Inventory', full: 'Create an inventory management system with products, stock levels, suppliers, and low-stock alerts' },
];

function extractUrlFromMessage(message: string): string | null {
  const match = message.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function isCredentialConfigError(message: string | null): boolean {
  if (!message) return false;
  return (
    message.includes('Missing required configuration')
    || message.includes('InsForge credentials are incomplete')
  );
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [credentials, setCredentials] = useState<BuildCredentials>({});
  const [showCredentials, setShowCredentials] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [state, setState] = useState<BuildState | null>(null);
  const [liveDeployedUrl, setLiveDeployedUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  function getCompletedSteps(): string[] {
    return Array.from(new Set(events.map((e) => e.step)));
  }

  function normalizedCredentials(): BuildCredentials | undefined {
    const cleaned = Object.fromEntries(
      Object.entries(credentials)
        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        .filter(([, v]) => typeof v === 'string' && v.length > 0),
    ) as BuildCredentials;

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  function showToast(message: string): void {
    setToastMessage(message);
    if (isCredentialConfigError(message)) {
      setShowCredentials(true);
    }
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 5000);
  }

  function validateCredentialSet(creds?: BuildCredentials): string | null {
    if (!creds) return null;

    const insforgeKeys: Array<keyof BuildCredentials> = [
      'insforgeBaseUrl',
      'insforgeAnonKey',
      'insforgeAccessToken',
      'insforgeProjectId',
    ];

    const filledInsforge = insforgeKeys.filter((key) => !!creds[key]);
    if (filledInsforge.length > 0 && filledInsforge.length < insforgeKeys.length) {
      return 'InsForge credentials are incomplete. Provide Base URL, Anon Key, Access Token, and Project ID.';
    }

    return null;
  }

  async function preflightOrchestrator(): Promise<string | null> {
    const creds = normalizedCredentials();
    try {
      const response = await fetch(`${ORCHESTRATOR}/api/preflight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: creds }),
      });
      if (!response.ok) {
        try {
          const err = await response.json();
          return err.error ?? 'Orchestrator preflight failed.';
        } catch {
          return 'Orchestrator preflight failed.';
        }
      }
      return null;
    } catch {
      return 'Cannot reach Tivra Orchestrator. Check NEXT_PUBLIC_ORCHESTRATOR_URL, CORS, or backend status.';
    }
  }

  async function startBuild() {
    if (!prompt.trim() || isRunning) return;

    const creds = normalizedCredentials();
    const credentialError = validateCredentialSet(creds);
    if (credentialError) {
      showToast(credentialError);
      return;
    }

    const preflightError = await preflightOrchestrator();
    if (preflightError) {
      showToast(preflightError);
      return;
    }

    try {
      const payload: BuildRequestPayload = {
        prompt,
        credentials: creds,
      };

      const res = await fetch(`${ORCHESTRATOR}/api/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = 'Failed to start build';
        try {
          const err = await res.json();
          message = err.error ?? message;
        } catch {
          // Keep default message when non-JSON errors are returned.
        }
        throw new Error(message);
      }

      const { buildId: id } = (await res.json()) as { buildId: string };
      setIsRunning(true);
      setError(null);
      setEvents([]);
      setState(null);
      setLiveDeployedUrl(null);
      subscribeToStream(id);
    } catch (err) {
      const message = String((err as Error).message);
      setError(message);
      showToast(message);
      setIsRunning(false);
    }
  }

  function subscribeToStream(id: string) {
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`${ORCHESTRATOR}/api/build/${id}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as AgentEvent;
      const eventUrl =
        (typeof event.data?.url === 'string' ? event.data.url : null) ??
        (typeof event.message === 'string' ? extractUrlFromMessage(event.message) : null);
      setEvents((prev) => {
        if (event.step === 'app_deployed') {
          return [
            ...prev,
            event,
            {
              step: 'app_deployed',
              message: eventUrl
                ? `Deployment notification: open app at ${eventUrl}`
                : 'Deployment notification: your app is live.',
              ts: Date.now(),
            },
          ];
        }
        return [...prev, event];
      });

      if (event.step === 'app_deployed' && eventUrl) {
        setLiveDeployedUrl(eventUrl);
      }

      if (event.step === 'app_deployed' || event.step === 'error') {
        es.close();
        setIsRunning(false);
        fetch(`${ORCHESTRATOR}/api/build/${id}`)
          .then((r) => r.json())
          .then((s: BuildState) => setState(s))
          .catch(() => {});
      }
    };

    es.onerror = () => {
      setError('Connection to Tivra Orchestrator lost.');
      setIsRunning(false);
      es.close();
    };
  }

  useEffect(() => () => {
    esRef.current?.close();
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const completedSteps = getCompletedSteps();
  const deployedUrl = liveDeployedUrl ?? state?.deployedUrl ?? null;
  const progressPct = completedSteps.length > 0
    ? Math.round((completedSteps.filter((s) => s !== 'error').length / STEPS.length) * 100)
    : 0;
  const hasActivity = isRunning || events.length > 0;
  const shouldHighlightCredentials = isCredentialConfigError(toastMessage) || isCredentialConfigError(error);

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Decorative gradient backgrounds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large ambient orbs */}
        <div className="absolute -top-40 left-[12%] w-[600px] h-[600px] bg-emerald-500/[0.18] rounded-full blur-[90px]" style={{ animation: 'orb-float 8s ease-in-out infinite' }} />
        <div className="absolute top-1/3 -right-28 w-[480px] h-[480px] bg-teal-500/[0.15] rounded-full blur-[75px]" style={{ animation: 'orb-float-r 10s ease-in-out infinite' }} />
        <div className="absolute -bottom-24 left-[28%] w-[540px] h-[540px] bg-emerald-600/[0.13] rounded-full blur-[90px]" style={{ animation: 'orb-float 12s ease-in-out infinite 2s' }} />
        {/* Medium accent orbs */}
        <div className="absolute top-[60%] left-[5%] w-[340px] h-[340px] bg-lime-500/[0.12] rounded-full blur-[60px]" style={{ animation: 'orb-float-r 7s ease-in-out infinite 1s' }} />
        <div className="absolute top-[18%] right-[18%] w-[300px] h-[300px] bg-teal-400/[0.14] rounded-full blur-[55px]" style={{ animation: 'orb-float-s 9s ease-in-out infinite' }} />
        {/* Small bright accent */}
        <div className="absolute top-[38%] left-[48%] w-[220px] h-[220px] bg-emerald-400/[0.12] rounded-full blur-[45px]" style={{ animation: 'orb-float 6s ease-in-out infinite 3s' }} />
      </div>
      
      {/* Content */}
      <div className="h-screen flex flex-col overflow-hidden relative z-10">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs text-amber-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm animate-slide-in-up">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="flex-none flex items-center gap-3 px-6 h-14 border-b border-white/[0.06]">
        <Image src="/tivra_logo.png" alt="Tivra" width={72} height={20} className="object-contain" />
        <div className="ml-auto flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Building…
            </div>
          )}
          <span className="text-xs text-zinc-700 hidden sm:block">Prompt. Build. Launch.</span>
        </div>
      </header>

      {/* ── Idle: centered hero ───────────────────────────────── */}
      {!hasActivity && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-xl animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-medium text-emerald-300">Agentic SaaS Launch Orchestrator</span>
              </div>
              <h1 className="font-syne font-bold text-5xl text-zinc-100 leading-[1.06] mb-2">
                Launch production-ready SaaS<br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-lime-400 text-transparent bg-clip-text">from a single prompt.</span>
              </h1>
              <p className="text-zinc-400 text-base mb-6 leading-snug max-w-md">
                Tivra orchestrates infrastructure, code generation, and deployment in one execution pipeline.
              </p>

              <div className={`rounded-xl border bg-white/[0.02] p-3 mb-4 transition-all ${
                shouldHighlightCredentials
                  ? 'border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_0_24px_rgba(245,158,11,0.18)]'
                  : 'border-white/[0.08]'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono uppercase tracking-wide text-zinc-400">Provider Credentials</span>
                  <button
                    type="button"
                    onClick={() => setShowCredentials((prev) => !prev)}
                    className="text-[11px] font-mono text-emerald-300 hover:text-emerald-200"
                  >
                    {showCredentials ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showCredentials && (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <input
                      type="password"
                      value={credentials.anthropicApiKey ?? ''}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, anthropicApiKey: e.target.value }))}
                      className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                      placeholder="Anthropic API Key"
                      autoComplete="off"
                    />
                    <input
                      type="text"
                      value={credentials.insforgeBaseUrl ?? ''}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeBaseUrl: e.target.value }))}
                      className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                      placeholder="InsForge Base URL (https://...)"
                      autoComplete="off"
                    />
                    <input
                      type="password"
                      value={credentials.insforgeAnonKey ?? ''}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeAnonKey: e.target.value }))}
                      className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                      placeholder="InsForge Anon Key"
                      autoComplete="off"
                    />
                    <input
                      type="password"
                      value={credentials.insforgeAccessToken ?? ''}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeAccessToken: e.target.value }))}
                      className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                      placeholder="InsForge Access Token"
                      autoComplete="off"
                    />
                    <input
                      type="text"
                      value={credentials.insforgeProjectId ?? ''}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeProjectId: e.target.value }))}
                      className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                      placeholder="InsForge Project ID"
                      autoComplete="off"
                    />
                  </div>
                )}
                <p className="mt-2 text-[10px] text-zinc-500 font-mono">
                  Credentials are sent with this build request only and are not shown in logs.
                </p>
              </div>
            </div>

            <div className="relative rounded-xl glass-md border border-emerald-500/20 hover:border-emerald-500/35 focus-within:border-emerald-500/30 transition-colors duration-300">
              <textarea
                className="w-full bg-transparent rounded-xl px-4 pt-4 pb-14 text-zinc-100 text-sm resize-none h-[110px] placeholder:text-zinc-600 focus:outline-none font-mono transition-all"
                placeholder="Describe your app idea... e.g. a CRM with contacts, pipeline, and notes"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) startBuild();
                }}
              />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-[11px] text-zinc-600 font-mono">⌘↵ to run</span>
                <button
                  onClick={startBuild}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-semibold text-white transition-all hover:shadow-[0_0_16px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start Build <ArrowRight size={12} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mt-4">
              <span className="text-xs text-zinc-500 self-center font-mono font-medium uppercase tracking-wide">Examples:</span>
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPrompt(p.full)}
                  className="text-xs font-mono px-1.5 py-1 hover:text-emerald-300 text-zinc-400 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Active: compact input + pipeline + logs ───────────── */}
      {hasActivity && (
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-4 animate-fade-in">
          {/* Compact prompt row */}
          <div className="flex-none flex gap-3 items-center">
            <div className="flex-1 relative rounded-xl border border-white/[0.08] bg-white/[0.025] focus-within:border-emerald-500/25 transition-colors">
              <textarea
                className="w-full bg-transparent rounded-xl px-4 py-2.5 text-zinc-300 text-xs resize-none h-[42px] placeholder:text-zinc-600 focus:outline-none font-mono leading-relaxed"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isRunning}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) startBuild();
                }}
              />
            </div>
            <button
              onClick={startBuild}
              disabled={isRunning || !prompt.trim()}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white ${
                isRunning
                  ? 'opacity-90 cursor-not-allowed shadow-[0_0_14px_rgba(16,185,129,0.25)]'
                  : 'hover:shadow-[0_0_14px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {isRunning ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                  Building…
                </>
              ) : (
                <>New Build <ArrowRight size={12} /></>
              )}
            </button>
          </div>

          <div className={`flex-none rounded-xl border bg-white/[0.02] p-3 transition-all ${
            shouldHighlightCredentials
              ? 'border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_0_24px_rgba(245,158,11,0.18)]'
              : 'border-white/[0.08]'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wide text-zinc-400">Provider Credentials</span>
              <button
                type="button"
                onClick={() => setShowCredentials((prev) => !prev)}
                className="text-[11px] font-mono text-emerald-300 hover:text-emerald-200"
              >
                {showCredentials ? 'Hide' : 'Show'}
              </button>
            </div>
            {showCredentials && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="password"
                  value={credentials.anthropicApiKey ?? ''}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, anthropicApiKey: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                  placeholder="Anthropic API Key"
                  autoComplete="off"
                  disabled={isRunning}
                />
                <input
                  type="text"
                  value={credentials.insforgeBaseUrl ?? ''}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeBaseUrl: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                  placeholder="InsForge Base URL (https://...)"
                  autoComplete="off"
                  disabled={isRunning}
                />
                <input
                  type="password"
                  value={credentials.insforgeAnonKey ?? ''}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeAnonKey: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                  placeholder="InsForge Anon Key"
                  autoComplete="off"
                  disabled={isRunning}
                />
                <input
                  type="password"
                  value={credentials.insforgeAccessToken ?? ''}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeAccessToken: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                  placeholder="InsForge Access Token"
                  autoComplete="off"
                  disabled={isRunning}
                />
                <input
                  type="text"
                  value={credentials.insforgeProjectId ?? ''}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, insforgeProjectId: e.target.value }))}
                  className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40 md:col-span-2"
                  placeholder="InsForge Project ID"
                  autoComplete="off"
                  disabled={isRunning}
                />
              </div>
            )}
            <p className="mt-2 text-[10px] text-zinc-500 font-mono">
              Credentials are sent with this build request only and are not shown in logs.
            </p>
          </div>

          {error && (
            <div className="flex-none rounded-xl glass-md border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-xs animate-slide-in-up">
              {error}
            </div>
          )}

          {/* Pipeline */}
          <div className="flex-none">
            <ProgressBar pct={progressPct} isRunning={isRunning} />
          </div>

          {deployedUrl && (
            <div className="flex-none rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200 animate-slide-in-up">
              <div className="font-semibold uppercase tracking-wide text-[10px] text-emerald-300 mb-1">Deployment Ready</div>
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline decoration-emerald-400/60 hover:decoration-emerald-300 transition-colors break-all"
              >
                {deployedUrl}
              </a>
            </div>
          )}

          {/* Infra status + terminal log */}
          <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
            {/* Left column */}
            <div className="w-56 shrink-0 flex flex-col gap-3 overflow-y-auto">
              <InsforgeStatusPanel completedSteps={completedSteps} />
              {deployedUrl && (
                <LiveCard url={deployedUrl} spec={state?.spec} />
              )}
            </div>

            {/* Right: terminal */}
            <div className="flex-1 flex flex-col rounded-xl border border-emerald-500/20 bg-emerald-950/10 overflow-hidden min-h-0">
              <div className="flex-none flex items-center gap-2 px-4 py-2.5 border-b border-emerald-500/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-700/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="text-[10px] text-emerald-400/80 font-mono ml-1">build.log</span>
                {deployedUrl && (
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[10px] font-mono text-emerald-300 hover:text-emerald-200 underline decoration-emerald-500/50"
                  >
                    open deployed app
                  </a>
                )}
              </div>
              <ActivityFeed events={events} isRunning={isRunning} />
            </div>
          </div>
        </div>
      )}

      {/* Error shown when idle */}
      {!hasActivity && error && (
        <div className="mx-6 mb-4 flex-none rounded-xl glass-md border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-xs animate-slide-in-up">
          {error}
        </div>
      )}

      {/* Footer attribution */}
      <footer className="flex-none flex items-center justify-center gap-4 h-10 border-t border-white/[0.04] px-6">
        <span className="text-[11px] text-zinc-600 font-mono">Built with the help of</span>
        <Image src="/qoder.svg" alt="Qoder" width={54} height={16} className="object-contain opacity-50 hover:opacity-80 transition-opacity" />
        <span className="text-[11px] text-zinc-700 font-mono">×</span>
        <span className="text-[11px] text-zinc-600 font-mono">Wired with</span>
        <Image src="/insforge.svg" alt="InsForge" width={62} height={16} className="object-contain opacity-50 hover:opacity-80 transition-opacity" />
      </footer>
    </div>
    </div>
  );
}
