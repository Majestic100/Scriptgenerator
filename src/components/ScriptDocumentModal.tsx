import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RotateCcw, FileText, FileDown } from 'lucide-react';
import { GeneratedScript, normalizeTrafficTemperature } from '../types';
import { scriptToDocument, documentToScript } from '../utils/scriptDocument';
import { downloadScriptsAsDocx, downloadScriptsAsPdf } from '../utils/exportUtils';
import { useLang, formatDuration } from '../i18n';

interface ScriptDocumentModalProps {
  script: GeneratedScript;
  onClose: () => void;
  onSave: (updated: GeneratedScript) => void;
}

/**
 * Scriptet som ét dokument, man kan rette i som almindelig tekst. Overskrifterne
 * HOOK 1, MANUSKRIPT og CTA er det, der binder teksten sammen med scriptets felter,
 * så visuals, tidskoder og strategi bevares, selv om man skriver hele teksten om.
 */
export const ScriptDocumentModal: React.FC<ScriptDocumentModalProps> = ({
  script,
  onClose,
  onSave
}) => {
  const { t, lang } = useLang();
  const original = useMemo(() => scriptToDocument(script), [script]);
  const [text, setText] = useState(original);
  const [justSaved, setJustSaved] = useState(false);

  const isDirty = text !== original;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSave = () => {
    const { script: updated, changed } = documentToScript(script, text);
    if (!changed) return;
    onSave(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleSaveAndClose = () => {
    const { script: updated, changed } = documentToScript(script, text);
    if (changed) onSave(updated);
    onClose();
  };

  const handleReset = () => setText(original);

  const meta = [
    script.scriptType,
    formatDuration(script.bodyDuration, lang),
    script.awarenessStage,
    t.traffic[normalizeTrafficTemperature(script.trafficType)]?.title
  ]
    .filter(Boolean)
    .join('  ·  ');

  // Lægges direkte i body: scriptkortet ligger i en beholder, der laver sin egen
  // stablingskontekst, så et fixed-lag herinde ellers havner bag topbjælken.
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-xs flex flex-col animate-fadeIn">
      {/* Værktøjslinje */}
      <div className="shrink-0 bg-surface border-b border-line px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink truncate">{t.doc.title}</h2>
          <p className="text-[15px] text-muted truncate">
            {script.title || script.companyName}
            {isDirty ? ` · ${t.doc.unsaved}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] text-muted mr-1">{t.doc.wordCount(words)}</span>

          <button
            type="button"
            onClick={() => downloadScriptsAsDocx([script], script.documentTitle)}
            className="px-2.5 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title={t.card.docsTitle}
          >
            <FileText className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
            Docs
          </button>

          <button
            type="button"
            onClick={() => downloadScriptsAsPdf([script], script.documentTitle)}
            className="px-2.5 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title={t.card.pdfTitle}
          >
            <FileDown className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
            PDF
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty}
            className="px-2.5 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
            title={t.doc.resetTitle}
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
            {t.doc.reset}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="px-3.5 py-2 bg-ink hover:bg-black text-white rounded-[var(--radius-control)] text-[15px] font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Check className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            {justSaved ? t.doc.saved : t.doc.save}
          </button>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="p-2 hover:bg-sunken rounded-[var(--radius-control)] cursor-pointer"
            aria-label={t.doc.close}
            title={t.doc.close}
          >
            <X className="w-5 h-5 text-muted" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Selve siden */}
      <div className="flex-1 overflow-y-auto py-6 sm:py-10 px-3 sm:px-6">
        <div className="mx-auto w-full max-w-[820px] bg-surface rounded-[var(--radius-card)] shadow-[0_4px_24px_rgb(22_24_29/0.12)] border border-line px-6 sm:px-14 py-8 sm:py-12">
          <h1 className="text-[26px] font-bold text-ink leading-tight m-0">
            {script.documentTitle || script.title || script.companyName}
          </h1>
          {meta && <p className="text-[15px] text-muted mt-1.5 mb-0">{meta}</p>}

          <hr className="border-0 border-t border-line my-6" />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck
            className="w-full min-h-[55vh] resize-none bg-transparent border-0 outline-none text-black font-['Arial',sans-serif] text-[17px] leading-[1.75] whitespace-pre-wrap"
            aria-label={t.doc.title}
          />

          <p className="field-hint mt-6">{t.doc.hint}</p>
        </div>
      </div>
    </div>,
    document.body
  );
};
