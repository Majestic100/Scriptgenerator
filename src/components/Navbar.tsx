import React from 'react';
import { Brain, Zap, Folder } from 'lucide-react';

interface NavbarProps {
  aiTrainingCount?: number;
  onOpenAiTraining?: () => void;
  projectsCount?: number;
  onOpenProjects?: () => void;
  onLoadExample: (presetKey: string) => void;
}

export const JalalVisualsLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = () => {
  return null;
};

export const Navbar: React.FC<NavbarProps> = ({
  aiTrainingCount = 0,
  onOpenAiTraining,
  projectsCount = 0,
  onOpenProjects,
  onLoadExample,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-ink text-white px-4 sm:px-6 lg:px-10 py-3 shadow-md">
      <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-3">

        {/* Brand: filmslate med REC-indikator */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="rec-dot rec-blink shrink-0" aria-hidden="true" />
          <span className="font-display text-sm sm:text-base uppercase tracking-wide text-white whitespace-nowrap">
            Jalal Visuals
          </span>
          <span className="hidden lg:inline eyebrow text-white/40">
            Metascript · Meta Ads
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset dropdown */}
          <div className="relative group hidden md:block">
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/15 rounded-md transition-colors cursor-pointer">
              <Zap className="w-3.5 h-3.5 text-white/50" />
              <span>Hurtige eksempler</span>
            </button>
            <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1 eyebrow text-slate-400">
                Skabeloner
              </div>
              <button
                onClick={() => onLoadExample('ecommerce')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">Naturhud (Skincare)</span>
                <span className="font-mono text-[10px] bg-red-50 text-rec px-1.5 py-0.5 rounded font-semibold">UGC</span>
              </button>
              <button
                onClick={() => onLoadExample('saas')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">TaskFlow (SaaS)</span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold">VS</span>
              </button>
              <button
                onClick={() => onLoadExample('fitness')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">FitPulse (Træning)</span>
                <span className="font-mono text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-semibold">PAS</span>
              </button>
            </div>
          </div>

          {/* Projects Button */}
          {onOpenProjects && (
            <button
              onClick={onOpenProjects}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/15 transition-all cursor-pointer"
              title="Åbn projekter"
            >
              <Folder className="w-4 h-4 text-white/60" />
              <span className="hidden sm:inline">Projekter</span>
              <span className="bg-white/15 text-white font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {projectsCount}
              </span>
            </button>
          )}

          {/* AI Training Button */}
          {onOpenAiTraining && (
            <button
              onClick={onOpenAiTraining}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-rec hover:bg-[#c81e22] text-white transition-all relative cursor-pointer"
              title="AI Træning & Guldstandarder"
            >
              <Brain className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">AI Træning</span>
              <span className="bg-white/25 text-white font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {aiTrainingCount}
              </span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
