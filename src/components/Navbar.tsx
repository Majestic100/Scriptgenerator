import React from 'react';
import { Brain, Zap, Folder, Users, LogOut } from 'lucide-react';

interface NavbarProps {
  aiTrainingCount?: number;
  onOpenAiTraining?: () => void;
  projectsCount?: number;
  onOpenProjects?: () => void;
  customersCount?: number;
  onOpenCustomers?: () => void;
  onLoadExample: (presetKey: string) => void;
  onLogout?: () => void;
  currentUser?: { name: string; companyLabel: string } | null;
}

export const JalalVisualsLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = () => {
  return null;
};

export const Navbar: React.FC<NavbarProps> = ({
  aiTrainingCount = 0,
  onOpenAiTraining,
  projectsCount = 0,
  onOpenProjects,
  customersCount = 0,
  onOpenCustomers,
  onLoadExample,
  onLogout,
  currentUser,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-ink px-4 sm:px-6 lg:px-10 py-3 shadow-xs">
      <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="rec-dot shrink-0" aria-hidden="true" />
          <span className="font-display text-lg sm:text-xl uppercase tracking-wide text-ink whitespace-nowrap">
            Script Generator
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset dropdown */}
          <div className="relative group hidden md:block">
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer">
              <Zap className="w-4 h-4 text-slate-400" />
              <span>Eksempler</span>
            </button>
            <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1 eyebrow text-slate-400">
                Skabeloner
              </div>
              <button
                onClick={() => onLoadExample('ecommerce')}
                className="w-full text-left px-3 py-2 text-base text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">Naturhud (Skincare)</span>
                <span className="font-mono text-sm bg-red-50 text-rec px-1.5 py-0.5 rounded font-semibold">UGC</span>
              </button>
              <button
                onClick={() => onLoadExample('saas')}
                className="w-full text-left px-3 py-2 text-base text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">TaskFlow (SaaS)</span>
                <span className="font-mono text-sm bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold">VS</span>
              </button>
              <button
                onClick={() => onLoadExample('fitness')}
                className="w-full text-left px-3 py-2 text-base text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium">FitPulse (Træning)</span>
                <span className="font-mono text-sm bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-semibold">PAS</span>
              </button>
            </div>
          </div>

          {/* Customers Button */}
          {onOpenCustomers && (
            <button
              onClick={onOpenCustomers}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-base font-bold bg-white hover:bg-slate-50 text-ink border border-slate-300 transition-all cursor-pointer"
              title="Åbn kundekartotek"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Kunder</span>
              <span className="bg-slate-100 text-slate-700 font-mono text-sm font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {customersCount}
              </span>
            </button>
          )}

          {/* Projects Button */}
          {onOpenProjects && (
            <button
              onClick={onOpenProjects}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-base font-bold bg-white hover:bg-slate-50 text-ink border border-slate-300 transition-all cursor-pointer"
              title="Åbn projekter"
            >
              <Folder className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Projekter</span>
              <span className="bg-slate-100 text-slate-700 font-mono text-sm font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {projectsCount}
              </span>
            </button>
          )}

          {/* AI Training Button */}
          {onOpenAiTraining && (
            <button
              onClick={onOpenAiTraining}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-base font-bold bg-rec hover:bg-[#c81e22] text-white transition-all relative cursor-pointer"
              title="AI Træning: dine stjernemarkerede guldstandarder"
            >
              <Brain className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">AI Træning</span>
              <span className="bg-white/25 text-white font-mono text-sm font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {aiTrainingCount}
              </span>
            </button>
          )}

          {/* Log ud */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 transition-all cursor-pointer"
              title="Log ud"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
