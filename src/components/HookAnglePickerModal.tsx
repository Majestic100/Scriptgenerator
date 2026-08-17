import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Sparkles } from 'lucide-react';
import { HOOK_ANGLES, HOOK_CATEGORIES, AUTO_HOOK_ANGLE } from '../types';
import { useLang } from '../i18n';

interface HookAnglePickerModalProps {
  hookNumber: number;
  selectedId: string; // 'auto' eller et vinkel-id
  onSelect: (angleId: string) => void;
  onClose: () => void;
}

/**
 * De 25 hook-vinkler som klikbare kort i deres 6 kategorier, i stedet for en
 * dropdown med 25 punkter. Automatisk står øverst som det anbefalede valg.
 */
export const HookAnglePickerModal: React.FC<HookAnglePickerModalProps> = ({
  hookNumber,
  selectedId,
  onSelect,
  onClose
}) => {
  const { t } = useLang();

  const pick = (id: string) => {
    onSelect(id);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.form.hookAnglePickerTitle(hookNumber)}
    >
      <div
        className="bg-surface rounded-[var(--radius-card)] border border-line-strong shadow-xl w-full max-w-4xl my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line sticky top-0 bg-surface rounded-t-[var(--radius-card)]">
          <div>
            <h2 className="text-[19px] font-semibold text-ink m-0">
              {t.form.hookAnglePickerTitle(hookNumber)}
            </h2>
            <p className="field-hint mt-1">{t.form.hookAnglePickerHint}</p>
          </div>
          <button type="button" onClick={onClose} className="chip-btn shrink-0" aria-label="Luk">
            <X className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Automatisk: det anbefalede valg */}
          <button
            type="button"
            onClick={() => pick(AUTO_HOOK_ANGLE)}
            className={`w-full text-left rounded-[var(--radius-control)] border px-4 py-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
              selectedId === AUTO_HOOK_ANGLE
                ? 'border-ink bg-sunken'
                : 'border-line-strong bg-surface hover:border-ink/40'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5 text-rec shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
            <span>
              <span className="font-semibold text-ink flex items-center gap-2">
                {t.form.hookAngleAuto}
                {selectedId === AUTO_HOOK_ANGLE && (
                  <Check className="w-4 h-4 text-rec" strokeWidth={2.5} aria-hidden="true" />
                )}
              </span>
              <span className="block text-[15px] text-muted mt-0.5">{t.form.hookAngleAutoDesc}</span>
            </span>
          </button>

          {HOOK_CATEGORIES.map((category) => (
            <div key={category}>
              <h3 className="field-label mb-2">{t.hookCategories[category] || category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HOOK_ANGLES.filter((a) => a.category === category).map((a) => {
                  const info = t.hookAngles[a.id];
                  const isSelected = selectedId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => pick(a.id)}
                      className={`text-left rounded-[var(--radius-control)] border px-3.5 py-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-ink bg-sunken'
                          : 'border-line bg-surface hover:border-ink/40'
                      }`}
                    >
                      <span className="font-semibold text-ink text-[15.5px] flex items-center gap-2">
                        {a.id}
                        {isSelected && <Check className="w-4 h-4 text-rec" strokeWidth={2.5} aria-hidden="true" />}
                      </span>
                      {info?.desc && <span className="block text-[14.5px] text-muted mt-0.5">{info.desc}</span>}
                      {info?.example && (
                        <span className="block text-[14px] text-muted italic mt-1">"{info.example}"</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
