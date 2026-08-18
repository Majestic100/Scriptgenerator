import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RefreshCw, Copy, Upload, AlertTriangle, Star, Quote } from 'lucide-react';
import { buttonStyles } from './ui';
import { useLang } from '../i18n';
import { AiModel } from '../types';

interface ScriptReview {
  overallAssessment: string;
  strengths: string[];
  hookSuggestions: { original?: string; suggestion: string; reason: string }[];
  bodySuggestions: { issue: string; suggestion: string }[];
  ctaSuggestion: { issue: string; suggestion: string };
  watchouts: string[];
  languageFixes: { original: string; corrected: string; note?: string }[];
}

interface ScriptReviewModalProps {
  aiModel: AiModel;
  companyName?: string;
  onClose: () => void;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md', '.markdown'];

/**
 * "Script-doktoren": indsæt et færdigt script og få et udkast til forbedringer.
 * Der ændres ikke i noget - alt leveres som forslag, man selv vælger fra.
 */
export const ScriptReviewModal: React.FC<ScriptReviewModalProps> = ({ aiModel, companyName, onClose }) => {
  const { t, lang } = useLang();
  const [scriptText, setScriptText] = useState('');
  const [company, setCompany] = useState(companyName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ScriptReview | null>(null);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const lower = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setFileName(file.name);
      // Dokumentet sendes med; serveren trækker teksten ud (PDF/Word/tekst).
      setPendingDoc({ name: file.name, mimeType: file.type || 'application/octet-stream', base64 });
    };
    reader.readAsDataURL(file);
  };

  const [pendingDoc, setPendingDoc] = useState<{ name: string; mimeType: string; base64: string } | null>(null);

  const fetchReview = async () => {
    if (!scriptText.trim() && !pendingDoc) return;
    setIsLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch('/api/review-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: scriptText.trim(),
          document: pendingDoc || undefined,
          companyName: company.trim(),
          language: lang,
          aiModel
        })
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(t.app.invalidServerResponse);
      }
      if (!res.ok || !data.success) throw new Error(data.error || t.review.error);
      setReview(data.review);
    } catch (err: any) {
      setError(err.message || t.review.error);
    } finally {
      setIsLoading(false);
    }
  };

  const reviewAsText = (): string => {
    if (!review) return '';
    const lines: string[] = [];
    lines.push(`${t.review.overall}:`, review.overallAssessment, '');
    if (review.strengths.length) {
      lines.push(`${t.review.strengths}:`, ...review.strengths.map((s) => `- ${s}`), '');
    }
    if (review.hookSuggestions.length) {
      lines.push(`${t.review.hooks}:`);
      review.hookSuggestions.forEach((h, i) => {
        lines.push(`${i + 1}. "${h.suggestion}"`);
        if (h.original) lines.push(`   (${t.review.replaces} "${h.original}")`);
        lines.push(`   ${h.reason}`);
      });
      lines.push('');
    }
    if (review.bodySuggestions.length) {
      lines.push(`${t.review.body}:`, ...review.bodySuggestions.flatMap((b) => [`- ${b.issue}`, `  -> ${b.suggestion}`]), '');
    }
    if (review.ctaSuggestion?.suggestion) {
      lines.push(`${t.review.cta}:`, `- ${review.ctaSuggestion.issue}`, `  -> "${review.ctaSuggestion.suggestion}"`, '');
    }
    if (review.watchouts.length) {
      lines.push(`${t.review.watchouts}:`, ...review.watchouts.map((w) => `- ${w}`), '');
    }
    if (review.languageFixes.length) {
      lines.push(`${t.review.languageFixes}:`, ...review.languageFixes.map((f) => `- "${f.original}" -> "${f.corrected}"${f.note ? ` (${f.note})` : ''}`));
    }
    return lines.join('\n');
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(reviewAsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.review.title}
    >
      <div
        className="bg-surface rounded-[var(--radius-card)] border border-line-strong shadow-xl w-full max-w-3xl my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line">
          <div className="min-w-0">
            <h2 className="text-[19px] font-semibold text-ink m-0">{t.review.title}</h2>
            <p className="field-hint mt-1">{t.review.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="chip-btn shrink-0" aria-label={t.review.close}>
            <X className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!review && (
            <>
              <textarea
                rows={10}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder={t.review.placeholder}
                className="control resize-y font-['Arial',sans-serif]"
                disabled={isLoading}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="chip-btn cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  <span>{fileName || t.review.uploadLabel}</span>
                  <input
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(',')}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t.review.companyLabel}
                  className="control flex-1"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="flex items-start gap-2 text-[15px] text-rec">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={fetchReview}
                disabled={isLoading || (!scriptText.trim() && !pendingDoc)}
                className={`${buttonStyles.primary} w-full sm:w-auto`}
              >
                {isLoading ? (
                  <>
                    <span className="rec-dot rec-blink !bg-white" aria-hidden="true" />
                    {t.review.analyzing}
                  </>
                ) : (
                  t.review.analyze
                )}
              </button>
            </>
          )}

          {review && (
            <div className="space-y-6">
              <section>
                <h3 className="field-label mb-1">{t.review.overall}</h3>
                <p className="text-[16px] text-ink leading-relaxed border-l-2 border-rec pl-3.5 m-0">
                  {review.overallAssessment}
                </p>
              </section>

              {review.strengths.length > 0 && (
                <section>
                  <h3 className="field-label mb-1.5">{t.review.strengths}</h3>
                  <ul className="m-0 pl-0 list-none space-y-1.5">
                    {review.strengths.map((sItem, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15.5px] text-ink">
                        <Star className="w-4 h-4 text-rec shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                        {sItem}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {review.hookSuggestions.length > 0 && (
                <section>
                  <h3 className="field-label mb-1.5">{t.review.hooks}</h3>
                  <div className="space-y-2">
                    {review.hookSuggestions.map((h, i) => (
                      <div key={i} className="rounded-[var(--radius-control)] border border-line bg-sunken px-4 py-3">
                        <p className="text-[15.5px] text-ink font-medium m-0 flex items-start gap-2">
                          <Quote className="w-4 h-4 text-muted shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                          "{h.suggestion}"
                        </p>
                        {h.original && (
                          <p className="field-hint mt-1">{t.review.replaces} "{h.original}"</p>
                        )}
                        <p className="field-hint mt-1">{h.reason}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {review.bodySuggestions.length > 0 && (
                <section>
                  <h3 className="field-label mb-1.5">{t.review.body}</h3>
                  <div className="space-y-2">
                    {review.bodySuggestions.map((b, i) => (
                      <div key={i} className="rounded-[var(--radius-control)] border border-line px-4 py-3">
                        <p className="text-[15px] text-muted m-0">{b.issue}</p>
                        <p className="text-[15.5px] text-ink mt-1 m-0">{b.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {review.ctaSuggestion?.suggestion && (
                <section>
                  <h3 className="field-label mb-1.5">{t.review.cta}</h3>
                  <div className="rounded-[var(--radius-control)] border border-line px-4 py-3">
                    <p className="text-[15px] text-muted m-0">{review.ctaSuggestion.issue}</p>
                    <p className="text-[15.5px] text-ink font-medium mt-1 m-0">"{review.ctaSuggestion.suggestion}"</p>
                  </div>
                </section>
              )}

              {review.watchouts.length > 0 && (
                <section>
                  <h3 className="field-label mb-1.5">{t.review.watchouts}</h3>
                  <ul className="m-0 pl-0 list-none space-y-1.5">
                    {review.watchouts.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15.5px] text-ink">
                        <AlertTriangle className="w-4 h-4 text-rec shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="field-label mb-1.5">{t.review.languageFixes}</h3>
                {review.languageFixes.length === 0 ? (
                  <p className="text-[15px] text-muted m-0 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-700" strokeWidth={2} aria-hidden="true" />
                    {t.review.languageClean}
                  </p>
                ) : (
                  <ul className="m-0 pl-0 list-none space-y-1.5">
                    {review.languageFixes.map((f, i) => (
                      <li key={i} className="text-[15px] text-ink">
                        <span className="line-through text-muted">{f.original}</span>
                        {' -> '}
                        <span className="font-medium">{f.corrected}</span>
                        {f.note && <span className="text-muted"> ({f.note})</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
                <button type="button" onClick={copyAll} className={buttonStyles.ghost}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-700" strokeWidth={2} aria-hidden="true" />
                      {t.review.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                      {t.review.copyAll}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setReview(null); setError(null); }}
                  className={buttonStyles.ghost}
                >
                  <RefreshCw className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  {t.review.newReview}
                </button>
                <button type="button" onClick={onClose} className={`${buttonStyles.ghost} ml-auto`}>
                  {t.review.close}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
