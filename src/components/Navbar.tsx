import React from 'react';
import { Sparkles, Brain, Zap, Folder } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 px-4 sm:px-6 lg:px-10 py-3.5 transition-all shadow-xs">
      <div className="max-w-[1536px] mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset dropdown */}
          <div className="relative group hidden md:block">
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors shadow-xs cursor-pointer">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Hurtige Eksempler</span>
            </button>
            <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Skabeloner (1-klik)
              </div>
              <button
                onClick={() => onLoadExample('ecommerce')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">Naturhud (Skincare)</span>
                <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold">UGC</span>
              </button>
              <button
                onClick={() => onLoadExample('saas')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">TaskFlow (SaaS)</span>
                <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-bold">VS</span>
              </button>
              <button
                onClick={() => onLoadExample('fitness')}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">FitPulse (Træning)</span>
                <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold">PAS</span>
              </button>
            </div>
          </div>

          {/* Projects Button */}
          {onOpenProjects && (
            <button
              onClick={onOpenProjects}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold bg-red-50 hover:bg-red-100 text-[#E52328] border border-red-200 transition-all shadow-xs cursor-pointer"
              title="Åbn projekter"
            >
              <Folder className="w-4 h-4 text-[#E52328]" />
              <span className="hidden sm:inline">Projekter</span>
              <span className="bg-[#E52328] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {projectsCount}
              </span>
            </button>
          )}

          {/* AI Training Button */}
          {onOpenAiTraining && (
            <button
              onClick={onOpenAiTraining}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#181E2B] hover:bg-slate-800 text-white transition-all shadow-xs relative cursor-pointer"
              title="AI Træning & Guldstandarder"
            >
              <Brain className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">AI Træning</span>
              <span className="bg-[#E52328] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {aiTrainingCount}
              </span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

