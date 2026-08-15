import React from 'react';
import { Brain, Zap, Folder, Users, LogOut, ArrowUpRight, FileText } from 'lucide-react';
import {
  MotionNavigationMenu,
  MotionNavigationMenuContent,
  MotionNavigationMenuItem,
  MotionNavigationMenuLink,
  MotionNavigationMenuList,
  MotionNavigationMenuTrigger
} from './ui/motion-navigation-menu';
import { Customer, Project } from '../types';
import { useLang } from '../i18n';

interface NavbarProps {
  aiTrainingCount?: number;
  onOpenAiTraining?: () => void;
  projects?: Project[];
  onOpenProjects?: () => void;
  customers?: Customer[];
  onOpenCustomers?: () => void;
  onSelectCustomer?: (customer: Customer) => void;
  onLoadExample: (presetKey: string) => void;
  onLogout?: () => void;
  currentUser?: { name: string; companyLabel: string } | null;
}

export const JalalVisualsLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = () => null;

const EXAMPLE_KEYS = ['ecommerce', 'saas', 'fitness'] as const;
const EXAMPLE_TITLES: Record<(typeof EXAMPLE_KEYS)[number], string> = {
  ecommerce: 'Naturhud',
  saas: 'TaskFlow',
  fitness: 'FitPulse'
};

const countBadge =
  'font-mono text-[12.5px] font-medium text-muted bg-sunken border border-line rounded px-1.5 min-w-[22px] text-center tabular-nums';

/** Panelrække med titel og undertekst. */
const PanelRow: React.FC<{ title: string; desc: string; onClick: () => void }> = ({
  title,
  desc,
  onClick
}) => (
  <MotionNavigationMenuLink onClick={onClick}>
    <span className="flex items-center justify-between gap-3 text-[15px] font-semibold text-ink">
      {title}
      <ArrowUpRight
        className="w-3.5 h-3.5 text-muted opacity-0 group-hover/link:opacity-100 transition-opacity"
        strokeWidth={2}
        aria-hidden="true"
      />
    </span>
    <span className="text-[13.5px] text-muted leading-snug line-clamp-1">{desc}</span>
  </MotionNavigationMenuLink>
);

/** Sidste række i et panel: åbner det fulde kartotek. */
const PanelFooter: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <div className="mt-1 pt-1 border-t border-line">
    <MotionNavigationMenuLink onClick={onClick} className="flex-row items-center gap-2">
      <span className="text-[14.5px] font-semibold text-ink">{label}</span>
    </MotionNavigationMenuLink>
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({
  aiTrainingCount = 0,
  onOpenAiTraining,
  projects = [],
  onOpenProjects,
  customers = [],
  onOpenCustomers,
  onSelectCustomer,
  onLoadExample,
  onLogout
}) => {
  const { t } = useLang();
  const recentCustomers = customers.slice(0, 5);
  const recentProjects = projects.slice(0, 5);

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1400px] mx-auto h-[68px] flex items-center justify-between gap-4">

        <div className="flex items-center gap-2.5 min-w-0">
          <span className="rec-dot shrink-0" aria-hidden="true" />
          <span className="font-display text-[19px] text-ink whitespace-nowrap">{t.nav.appName}</span>
        </div>

        <div className="flex items-center gap-2">
          <MotionNavigationMenu className="hidden md:flex">
            <MotionNavigationMenuList>

              {/* Kunder */}
              <MotionNavigationMenuItem value="kunder">
                <MotionNavigationMenuTrigger>
                  <Users className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  {t.nav.customers}
                  <span className={countBadge}>{customers.length}</span>
                </MotionNavigationMenuTrigger>
                <MotionNavigationMenuContent className="w-[340px]">
                  {recentCustomers.length === 0 ? (
                    <p className="px-2.5 py-3 text-[14.5px] text-muted">
                      {t.nav.customersEmpty}
                    </p>
                  ) : (
                    recentCustomers.map((c) => (
                      <PanelRow
                        key={c.id}
                        title={c.name || c.companyName}
                        desc={c.productName || c.companyName || t.nav.savedCustomerInfo}
                        onClick={() => onSelectCustomer?.(c)}
                      />
                    ))
                  )}
                  <PanelFooter label={t.nav.openCustomerIndex} onClick={() => onOpenCustomers?.()} />
                </MotionNavigationMenuContent>
              </MotionNavigationMenuItem>

              {/* Projekter */}
              <MotionNavigationMenuItem value="projekter">
                <MotionNavigationMenuTrigger>
                  <Folder className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  {t.nav.projects}
                  <span className={countBadge}>{projects.length}</span>
                </MotionNavigationMenuTrigger>
                <MotionNavigationMenuContent className="w-[340px]">
                  {recentProjects.length === 0 ? (
                    <p className="px-2.5 py-3 text-[14.5px] text-muted">
                      {t.nav.projectsEmpty}
                    </p>
                  ) : (
                    recentProjects.map((p) => (
                      <PanelRow
                        key={p.id}
                        title={p.name}
                        desc={`${t.nav.scripts(p.scripts?.length || 0)}${p.description ? ` · ${p.description}` : ''}`}
                        onClick={() => onOpenProjects?.()}
                      />
                    ))
                  )}
                  <PanelFooter label={t.nav.openAllProjects} onClick={() => onOpenProjects?.()} />
                </MotionNavigationMenuContent>
              </MotionNavigationMenuItem>

              {/* Eksempler */}
              <MotionNavigationMenuItem value="eksempler">
                <MotionNavigationMenuTrigger>
                  <Zap className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  {t.nav.examples}
                </MotionNavigationMenuTrigger>
                <MotionNavigationMenuContent className="w-[320px]">
                  {EXAMPLE_KEYS.map((key) => (
                    <PanelRow
                      key={key}
                      title={EXAMPLE_TITLES[key]}
                      desc={t.nav.exampleDescs[key]}
                      onClick={() => onLoadExample(key)}
                    />
                  ))}
                  <p className="px-2.5 pt-2 pb-1 text-[13.5px] text-muted border-t border-line mt-1">
                    <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                    {t.nav.examplesFooter}
                  </p>
                </MotionNavigationMenuContent>
              </MotionNavigationMenuItem>

            </MotionNavigationMenuList>
          </MotionNavigationMenu>

          {onOpenAiTraining && (
            <button
              type="button"
              onClick={onOpenAiTraining}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-control)] text-[15px] font-semibold text-ink bg-surface border border-line-strong hover:bg-sunken transition-colors cursor-pointer"
              title={t.nav.aiTrainingTitle}
            >
              <Brain className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">{t.nav.aiTraining}</span>
              <span className={countBadge}>{aiTrainingCount}</span>
            </button>
          )}

          {/* Kompakt fallback under md, hvor menuen er skjult */}
          <div className="flex md:hidden items-center gap-2">
            {onOpenCustomers && (
              <button
                type="button"
                onClick={onOpenCustomers}
                className="p-2.5 rounded-[var(--radius-control)] bg-surface border border-line-strong hover:bg-sunken transition-colors cursor-pointer"
                aria-label={t.nav.customers}
              >
                <Users className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              </button>
            )}
            {onOpenProjects && (
              <button
                type="button"
                onClick={onOpenProjects}
                className="p-2.5 rounded-[var(--radius-control)] bg-surface border border-line-strong hover:bg-sunken transition-colors cursor-pointer"
                aria-label={t.nav.projects}
              >
                <Folder className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              </button>
            )}
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-2.5 rounded-[var(--radius-control)] bg-surface border border-line-strong hover:bg-sunken transition-colors cursor-pointer"
              title={t.nav.logout}
              aria-label={t.nav.logout}
            >
              <LogOut className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
