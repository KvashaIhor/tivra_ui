import { ExternalLink, Copy, Rocket } from 'lucide-react';
import { SaaSSpec } from '@/lib/types';

interface Props {
  url: string;
  spec?: SaaSSpec;
}

export default function LiveCard({ url, spec }: Props) {
  return (
    <div 
      className="card glass-md border-emerald-500/25 p-6 animate-fade-in-long"
      role="region"
      aria-label="Live deployment status"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Rocket size={12} className="text-white" />
        </div>
        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
          Tivra Build Live
        </span>
      </div>

      {spec && (
        <div className="mb-4 pb-4 border-b border-white/10">
          <div className="text-sm font-semibold text-white">{spec.name}</div>
          <div className="text-xs text-white/60 mt-1">
            {spec.template} · {spec.entities.join(', ')}
          </div>
        </div>
      )}

      <div className="text-xs text-white/70 font-mono break-all mb-4 leading-relaxed">
        {url}
      </div>

      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${spec?.name || 'app'}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-glow text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 outline-none"
        >
          Open App <ExternalLink size={12} aria-hidden="true" />
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="px-4 py-2.5 rounded-lg border border-white/20 hover:border-white/40 text-white/70 hover:text-white text-xs transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 outline-none"
          aria-label="Copy deployment URL"
          title="Copy URL"
        >
          <Copy size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
