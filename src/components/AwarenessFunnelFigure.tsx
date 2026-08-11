import React from 'react';
import { Brain as BrainIcon, Target as TargetIcon, Sparkles as SparklesIcon } from 'lucide-react';

export interface AwarenessFunnelFigureProps {
  currentStage: string;
  onSelectStage: (stageId: string) => void;
}

interface StageInfo {
  id: string;
  short: string;
  title: string;
  badge: string;
  badgeColor: string;
  level: number;
  desc: string;
  focus: string;
  // SVG coordinates for trapezoid in 540x470 viewBox
  points: string;
  centerY: number;
  dotX: number;
  widthLabel: string;
}

const STAGES_DATA: StageInfo[] = [
  {
    id: 'Unaware',
    short: 'Unaware',
    title: '1. Unaware (Ubevidst)',
    badge: 'Koldest',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    level: 1,
    desc: 'Kender hverken til problemet eller løsningen.',
    focus: 'Væk nysgerrighed, stop scrollen og afslør en uopdaget ulempe/smerte.',
    points: '20,15 440,15 405,95 55,95',
    centerY: 55,
    dotX: 432,
    widthLabel: 'Bredest rækkevidde'
  },
  {
    id: 'Problem Aware',
    short: 'Problem Aware',
    title: '2. Problem Aware (Problembevidst)',
    badge: 'Middel Kold',
    badgeColor: 'bg-rec-soft text-rec border-rec/30',
    level: 2,
    desc: 'Mærker problemet og frustreres i hverdagen.',
    focus: 'Spejl smerten stærkt, skab empati og introducer løsningskategorien.',
    points: '60,105 400,105 370,185 90,185',
    centerY: 145,
    dotX: 392,
    widthLabel: 'Høj smerte'
  },
  {
    id: 'Solution Aware',
    short: 'Solution Aware',
    title: '3. Solution Aware (Løsningsbevidst)',
    badge: 'Middel Varm',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    level: 3,
    desc: 'Kender til løsninger, men søger den bedste mulighed.',
    focus: 'Fremhæv mekanismen og hvorfor dit produkt virker bedre end alternativer.',
    points: '95,195 365,195 340,275 120,275',
    centerY: 235,
    dotX: 358,
    widthLabel: 'Søger løsning'
  },
  {
    id: 'Product Aware',
    short: 'Product Aware',
    title: '4. Product Aware (Produktbevidst)',
    badge: 'Varm',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    level: 4,
    desc: 'Kender dit produkt, men har tvivl eller indvendinger.',
    focus: 'Fjern købsmodstand, vis social proof, kunders anmeldelser & demo.',
    points: '125,285 335,285 310,365 150,365',
    centerY: 325,
    dotX: 325,
    widthLabel: 'Overvejer dig'
  },
  {
    id: 'Most Aware',
    short: 'Most Aware',
    title: '5. Most Aware (Købsklar)',
    badge: 'Hot',
    badgeColor: 'bg-rec-soft text-red-800 border-rec/30',
    level: 5,
    desc: 'Klar til køb, mangler kun et uimodståeligt tilbud.',
    focus: 'Fokusér stærkt på tilbuddet, rabat/bonus, garanti, urgency og CTA.',
    points: '155,375 305,375 285,455 175,455',
    centerY: 415,
    dotX: 298,
    widthLabel: 'Købsklar'
  }
];

export const AwarenessFunnelFigure: React.FC<AwarenessFunnelFigureProps> = ({
  currentStage,
  onSelectStage,
}) => {
  const activeStage = STAGES_DATA.find((s) => s.id === currentStage) || STAGES_DATA[1];

  return (
    <div className="bg-sunken text-ink p-4 sm:p-5 rounded-2xl border border-line shadow-none relative overflow-hidden my-3">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rec-soft/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <BrainIcon className="w-4 h-4 text-rec" />
          <span className="text-base font-black uppercase tracking-wider text-ink">
            AWARENESS FUNNEL (DE 5 BEVIDSTHEDSSTADIER)
          </span>
        </div>

        {/* Current Active Stage Indicator Badge */}
        <div className="flex items-center gap-2 bg-surface border border-rec/30 shadow-none rounded-full px-3 py-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rec"></span>
          </span>
          <span className="text-base font-bold text-ink">
            Aktiv: <span className="text-rec font-extrabold">{activeStage.short}</span>
          </span>
          <span className="text-sm text-muted font-medium">({activeStage.level}/5)</span>
        </div>
      </div>

      {/* Main Content: SVG Funnel on Left + Info Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* SVG Graphic (7 columns) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          <svg
            viewBox="0 0 500 470"
            className="w-full h-auto max-w-[480px] drop-shadow-xs select-none"
          >
            <defs>
              {/* Active Stage Red Gradient */}
              <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E52328" />
                <stop offset="50%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#C81E22" />
              </linearGradient>

              {/* Inactive Soft Color Gradients for Light Theme */}
              <linearGradient id="unawareGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7FA6C9" />
                <stop offset="100%" stopColor="#5E8BB5" />
              </linearGradient>
              <linearGradient id="problemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9AA3B5" />
                <stop offset="100%" stopColor="#7C8699" />
              </linearGradient>
              <linearGradient id="solutionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9A05B" />
                <stop offset="100%" stopColor="#C98A43" />
              </linearGradient>
              <linearGradient id="productGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E2703A" />
                <stop offset="100%" stopColor="#D25A2B" />
              </linearGradient>
              <linearGradient id="mostGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E52328" />
                <stop offset="100%" stopColor="#C81E22" />
              </linearGradient>

              {/* Shadow Filter for Active Layer */}
              <filter id="activeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#E52328" floodOpacity="0.3" />
              </filter>

              {/* Crisp Text Drop Shadow */}
              <filter id="textShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Render 5 Funnel Trapezoids */}
            {STAGES_DATA.map((st, index) => {
              const isSelected = currentStage === st.id;
              const gradIds = ['unawareGrad', 'problemGrad', 'solutionGrad', 'productGrad', 'mostGrad'];
              const fillUrl = isSelected ? 'url(#activeGradient)' : `url(#${gradIds[index]})`;

              return (
                <g
                  key={st.id}
                  onClick={() => onSelectStage(st.id)}
                  className="cursor-pointer group"
                >
                  {/* Trapezoid Shape */}
                  <polygon
                    points={st.points}
                    fill={fillUrl}
                    stroke={isSelected ? '#991B1B' : '#CBD5E1'}
                    strokeWidth={isSelected ? '2.5' : '1'}
                    className="transition-all duration-300 group-hover:opacity-90"
                    filter={isSelected ? 'url(#activeShadow)' : undefined}
                  />

                  {/* Stage Title Text on Trapezoid */}
                  <text
                    x="230"
                    y={st.centerY + 5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize={isSelected ? '15' : '13.5'}
                    fontWeight={isSelected ? '900' : '800'}
                    fontFamily="sans-serif"
                    filter="url(#textShadow)"
                    className="pointer-events-none tracking-wide"
                  >
                    {st.short}
                  </text>

                  {/* Clean Red Pulsing Indicator Dot on Active Layer */}
                  {isSelected && (
                    <g transform={`translate(${st.dotX}, ${st.centerY})`}>
                      {/* Connection Line from trapezoid right edge to dot */}
                      <line
                        x1="-18"
                        y1="0"
                        x2="-6"
                        y2="0"
                        stroke="#E52328"
                        strokeWidth="2"
                        strokeDasharray="3 2"
                      />

                      {/* Animated Ping Outer Ring */}
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill="#E52328"
                        opacity="0.35"
                        className="animate-ping"
                      />

                      {/* White Outer Border Circle */}
                      <circle cx="0" cy="0" r="8" fill="#FFFFFF" stroke="#E52328" strokeWidth="2" />

                      {/* Inner Red Core Dot */}
                      <circle cx="0" cy="0" r="4.5" fill="#E52328" />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Info Card on Right (5 columns) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-[var(--radius-card)] p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rec text-white text-base font-black flex items-center justify-center shadow-none">
                  {activeStage.level}
                </span>
                <span className="font-extrabold text-ink text-lg sm:text-lg">
                  {activeStage.title}
                </span>
              </div>
              <span className={`text-base font-extrabold px-2.5 py-1 rounded-[var(--radius-control)] border ${activeStage.badgeColor}`}>
                {activeStage.badge}
              </span>
            </div>

            <p className="text-muted text-base sm:text-lg leading-relaxed font-medium">
              {activeStage.desc}
            </p>
          </div>

          <div className="bg-sunken border border-line p-3.5 rounded-[var(--radius-card)] text-base space-y-1.5">
            <span className="text-rec font-black block text-sm uppercase tracking-wider flex items-center gap-1.5">
              <TargetIcon className="w-3.5 h-3.5" />
              Strategisk Fokus:
            </span>
            <p className="text-ink italic leading-snug font-medium">
              "{activeStage.focus}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
