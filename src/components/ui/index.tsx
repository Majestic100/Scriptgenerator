import React from 'react';

/**
 * Delte primitiver, så hele appen har samme rytme, radius og typografi.
 * Ingen bokse i bokse: et kort pr. sektion, hårfine streger indeni.
 */

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children
}) => (
  <div
    className={`bg-surface border border-line rounded-[var(--radius-card)] shadow-[0_1px_2px_rgb(22_24_29/0.04)] ${className}`}
  >
    {children}
  </div>
);

/** Nummereret hovedsektion med tydelig overskrift. */
export const Section: React.FC<{
  id?: string;
  step: number;
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, step, title, description, aside, children }) => (
  <Card>
    <section id={id} className="scroll-mt-24">
      <header className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-line">
        <div className="flex items-start gap-3.5 min-w-0">
          <span
            aria-hidden="true"
            className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-ink text-white font-mono text-[13px] font-medium flex items-center justify-center"
          >
            {step}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[22px] leading-tight text-ink">{title}</h2>
            {description && <p className="field-hint mt-0.5">{description}</p>}
          </div>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </header>
      <div className="p-6 space-y-6">{children}</div>
    </section>
  </Card>
);

/** Label + kontrol + valgfri hjælpetekst. Label altid over feltet. */
export const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  meta?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, hint, required, meta, htmlFor, children }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && (
          <span className="text-rec ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {meta && <span className="field-hint shrink-0">{meta}</span>}
    </div>
    {children}
    {hint && <p className="field-hint mt-1.5">{hint}</p>}
  </div>
);

/** Foldbart underafsnit. Står åbent som udgangspunkt, så alle felter er synlige uden ekstra klik. */
/**
 * Fast gruppe med overskrift. Kan ikke foldes sammen: alle felter skal stå åbne,
 * så man kan se hele opsætningen uden at klikke sig frem. Rammen og overskriften
 * er bevaret, så grupperingen stadig er tydelig.
 */
export const Disclosure: React.FC<{
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, summary, children }) => {
  return (
    <div className="border border-line rounded-[var(--radius-control)] overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-sunken">
        <span className="font-semibold text-[15.5px] text-ink">{title}</span>
        {summary && <span className="text-[14px] text-muted shrink-0">{summary}</span>}
      </div>
      <div className="p-4 border-t border-line bg-surface">{children}</div>
    </div>
  );
};

/** Valgknap i et gitter. Rød bruges kun til den valgte. */
export const ChoiceButton: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  className?: string;
}> = ({ selected, onClick, title, description, meta, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`text-left p-3 rounded-[var(--radius-control)] border transition-colors cursor-pointer ${
      selected
        ? 'border-rec bg-rec-soft ring-1 ring-rec'
        : 'border-line-strong bg-surface hover:border-ink/35'
    } ${className}`}
  >
    <span className="flex items-start justify-between gap-2">
      <span className="font-semibold text-[15px] text-ink leading-snug">{title}</span>
      {meta}
    </span>
    {description && <span className="block field-hint mt-1">{description}</span>}
  </button>
);

/** Knapper: præcis tre varianter, samme radius overalt. */
const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap';

export const buttonStyles = {
  primary: `${BUTTON_BASE} bg-rec text-white hover:bg-rec-hover px-4 py-2.5 text-[15.5px]`,
  secondary: `${BUTTON_BASE} bg-ink text-white hover:bg-black px-4 py-2.5 text-[15.5px]`,
  ghost: `${BUTTON_BASE} bg-surface text-ink border border-line-strong hover:bg-sunken px-4 py-2.5 text-[15.5px]`
};
