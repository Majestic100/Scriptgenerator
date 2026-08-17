import React, { useEffect, useState } from 'react';
import { X, Check, RefreshCw, FileText, PenLine } from 'lucide-react';
import { buttonStyles } from './ui';
import { useLang } from '../i18n';

export interface AngleRecommendation {
  headline: string;
  basedOnAnalysis: boolean;
  scriptTypes: { type: string; reason: string; fit: 'stærk' | 'god' | 'ok' }[];
  hookAngles: { id: string; reason: string }[];
}

interface AngleAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Alt serveren skal bruge for at kunne rådgive. Bygges af formularen. */
  payload: Record<string, any>;
  /** Navnet på den vinkel et id svarer til, så listen kan læses uden koder. */
  angleLabel: (id: string) => string;
  currentScriptType: string;
  onApplyScriptType: (type: string) => void;
  onApplyHookAngles: (ids: string[]) => void;
}

export const AngleAdvisorModal: React.FC<AngleAdvisorModalProps> = ({
  isOpen,
  onClose,
  payload,
  angleLabel,
  currentScriptType,
  onApplyScriptType,
  onApplyHookAngles
}) => {
  const { t } = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AngleRecommendation | null>(null);
  const [appliedAngles, setAppliedAngles] = useState(false);
  // To-trins-flow: vælger man en stil, hentes vinklerne igen målrettet den stil.
  const [hookLoadingFor, setHookLoadingFor] = useState<string | null>(null);
  const [anglesStyle, setAnglesStyle] = useState<string | null>(null);

  const chooseStyle = async (type: string) => {
    onApplyScriptType(type);
    setAppliedAngles(false);
    setHookLoadingFor(type);
    try {
      const res = await fetch('/api/recommend-angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, chosenScriptType: type })
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.hookAngles) && json.hookAngles.length > 0) {
        setData((prev) => (prev ? { ...prev, hookAngles: json.hookAngles } : json));
        setAnglesStyle(type);
      }
    } catch (err) {
      console.error('Kunne ikke hente vinkler til stilen:', err);
    } finally {
      setHookLoadingFor(null);
    }
  };

  const fetchRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setAppliedAngles(false);
    setAnglesStyle(null);
    try {
      const res = await fetch('/api/recommend-angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || t.advisor.couldNotFetch);
        setData(null);
        return;
      }
      setData(json);
    } catch (err) {
      console.error('Fejl ved hentning af forslag:', err);
      setError(t.advisor.serverUnreachable);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Hent forslag når panelet åbnes
  useEffect(() => {
    if (!isOpen) return;
    setData(null);
    fetchRecommendation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Luk på Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const applyEverything = () => {
    if (!data) return;
    // Har brugeren selv valgt en stil, er det den, der gælder - ikke nummer 1.
    const styleToApply = anglesStyle || data.scriptTypes[0]?.type;
    if (styleToApply) onApplyScriptType(styleToApply);
    if (data.hookAngles.length > 0) onApplyHookAngles(data.hookAngles.map((h) => h.id));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/45 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.advisor.ariaLabel}
    >
      <div
        className="bg-surface border border-line rounded-[var(--radius-card)] shadow-[0_16px_48px_rgb(22_24_29/0.18)] w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >

        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
          <div className="min-w-0">
            <h2 className="font-display text-[21px] leading-tight text-ink">{t.advisor.title}</h2>
            <p className="field-hint mt-0.5">
              {data?.basedOnAnalysis ? t.advisor.basedOnAnalysis : t.advisor.basedOnStep1}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 text-muted hover:text-ink rounded-[6px] hover:bg-sunken transition-colors cursor-pointer shrink-0"
            aria-label={t.advisor.close}
          >
            <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        <div className="p-6 space-y-6">

          {isLoading && (
            <div className="space-y-3" aria-live="polite">
              <p className="flex items-center gap-2.5 text-[15.5px] text-ink">
                <span className="rec-dot rec-blink" aria-hidden="true" />
                {t.advisor.loading}
              </p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[76px] rounded-[var(--radius-control)] bg-sunken border border-line" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="space-y-3">
              <p className="text-[15.5px] text-ink">{error}</p>
              <button type="button" onClick={fetchRecommendation} className={buttonStyles.ghost}>
                <RefreshCw className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                {t.advisor.tryAgain}
              </button>
            </div>
          )}

          {!isLoading && !error && data && (
            <>
              {data.headline && (
                <p className="text-[16px] text-ink leading-relaxed border-l-2 border-rec pl-3.5">{data.headline}</p>
              )}

              {!data.basedOnAnalysis && (
                <p className="field-hint flex items-start gap-2">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                  {t.advisor.noAnalysis}
                </p>
              )}

              {/* Script-stil */}
              <section>
                <h3 className="field-label">{t.advisor.scriptStyle}</h3>
                <div className="space-y-2">
                  {data.scriptTypes.map((s, i) => {
                    const isCurrent = s.type === currentScriptType;
                    return (
                      <div
                        key={s.type}
                        className={`flex items-start justify-between gap-4 p-3.5 rounded-[var(--radius-control)] border ${
                          isCurrent ? 'border-rec bg-rec-soft' : 'border-line-strong bg-surface'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[13px] text-muted tabular-nums">{i + 1}</span>
                            <span className="font-semibold text-[16px] text-ink">{s.type}</span>
                            <span className="font-mono text-[11.5px] uppercase tracking-wider text-muted">
                              {t.advisor.fitLabels[s.fit] || s.fit}
                            </span>
                          </div>
                          <p className="field-hint mt-1">{s.reason}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => chooseStyle(s.type)}
                          disabled={isCurrent || hookLoadingFor !== null}
                          className="chip-btn shrink-0"
                          data-active={isCurrent ? 'true' : 'false'}
                        >
                          {hookLoadingFor === s.type ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted" strokeWidth={1.75} aria-hidden="true" />
                              {t.advisor.findingAngles}
                            </>
                          ) : isCurrent ? (
                            <>
                              <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                              {t.advisor.chosen}
                            </>
                          ) : (
                            t.advisor.choose
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Hook-vinkler */}
              {data.hookAngles.length > 0 && (
                <section>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="field-label">
                      {t.advisor.hookAngles}
                      {anglesStyle && (
                        <span className="ml-2 normal-case font-normal text-muted">{t.advisor.anglesForStyle(anglesStyle)}</span>
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyHookAngles(data.hookAngles.map((h) => h.id));
                        setAppliedAngles(true);
                      }}
                      className="chip-btn"
                      data-active={appliedAngles ? 'true' : 'false'}
                    >
                      {appliedAngles ? (
                        <>
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                          {t.advisor.inserted}
                        </>
                      ) : (
                        <>
                          <PenLine className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                          {t.advisor.useAllAngles}
                        </>
                      )}
                    </button>
                  </div>
                  <ol className="divide-y divide-line border border-line-strong rounded-[var(--radius-control)]">
                    {data.hookAngles.map((h, i) => (
                      <li key={`${h.id}-${i}`} className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] text-muted tabular-nums">{t.advisor.hookN(i + 1)}</span>
                          <span className="font-semibold text-[15.5px] text-ink">{angleLabel(h.id)}</span>
                        </div>
                        <p className="field-hint mt-1">{h.reason}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-line bg-sunken rounded-b-[var(--radius-card)]">
          <button
            type="button"
            onClick={fetchRecommendation}
            disabled={isLoading}
            className={buttonStyles.ghost}
          >
            <RefreshCw
              className={`w-4 h-4 text-muted ${isLoading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {t.advisor.newSuggestion}
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className={buttonStyles.ghost}>
              {t.advisor.close}
            </button>
            <button
              type="button"
              onClick={applyEverything}
              disabled={isLoading || !data || data.scriptTypes.length === 0}
              className={buttonStyles.primary}
            >
              {t.advisor.useSuggestion}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
