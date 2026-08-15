import React, { useState } from 'react';
import { 
  X, 
  Brain, 
  Zap, 
  FileText, 
  Target, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  Search,
  Sparkles,
  Info,
  Loader2,
  ScrollText
} from 'lucide-react';
import { AiTrainingItem, AiTrainingType } from '../types';
import { useLang, dateLocale } from '../i18n';

interface AiTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AiTrainingItem[];
  onAddItem?: (type: AiTrainingType, text: string, title?: string, brandContext?: string) => Promise<void> | void;
  onDeleteItem?: (id: string) => Promise<void> | void;
  onAdd?: (type: AiTrainingType, text: string, title?: string, brandContext?: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const AiTrainingModal: React.FC<AiTrainingModalProps> = ({
  isOpen,
  onClose,
  items,
  onAddItem,
  onDeleteItem,
  onAdd,
  onDelete
}) => {
  const { t, lang } = useLang();
  const handleAdd = onAddItem || onAdd;
  const handleDelete = onDeleteItem || onDelete;

  const [activeFilter, setActiveFilter] = useState<'all' | 'hook' | 'body' | 'cta' | 'script'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states for manual adding
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newType, setNewType] = useState<AiTrainingType>('hook');
  const [newText, setNewText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBrandContext, setNewBrandContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const hookCount = items.filter(i => i.type === 'hook').length;
  const bodyCount = items.filter(i => i.type === 'body').length;
  const ctaCount = items.filter(i => i.type === 'cta').length;
  const scriptCount = items.filter(i => i.type === 'script').length;

  const filteredItems = items.filter(item => {
    const matchesType = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = 
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.brandContext && item.brandContext.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      if (handleAdd) {
        await handleAdd(newType, newText.trim(), newTitle.trim() || undefined, newBrandContext.trim() || undefined);
      }
      setNewText('');
      setNewTitle('');
      setNewBrandContext('');
      setIsAddingNew(false);
    } catch (err) {
      console.error('Fejl ved tilføjelse af AI træningseksempel:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItemClick = async (id: string) => {
    if (!handleDelete) return;
    setDeletingId(id);
    try {
      await handleDelete(id);
    } catch (err) {
      console.error('Fejl ved sletning af AI træningseksempel:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeBadge = (type: AiTrainingType) => {
    switch (type) {
      case 'hook':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-extrabold uppercase px-2 py-0.5 rounded bg-rec-soft text-rec border border-rec/30">
            <Zap className="w-3 h-3 text-rec" />
            {t.aiT.badgeHook}
          </span>
        );
      case 'body':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-extrabold uppercase px-2 py-0.5 rounded bg-ink text-white border border-slate-800">
            <FileText className="w-3 h-3 text-slate-300" />
            {t.aiT.badgeBody}
          </span>
        );
      case 'cta':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-extrabold uppercase px-2 py-0.5 rounded bg-rec-soft text-ink border border-rec/40">
            <Target className="w-3 h-3 text-rec" />
            {t.aiT.badgeCta}
          </span>
        );
      case 'script':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-extrabold uppercase px-2 py-0.5 rounded bg-ink text-white border border-slate-800">
            <ScrollText className="w-3 h-3 text-slate-300" />
            {t.aiT.badgeScript}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 md:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-surface rounded-2xl shadow-2xl border border-line w-full max-w-4xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-ink text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-card)] bg-gradient-to-tr from-rec to-red-600 flex items-center justify-center text-white shadow-md">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                {t.aiT.title}
                <span className="text-base font-semibold bg-surface/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/20">
                  {t.aiT.examplesCount(items.length)}
                </span>
              </h2>
              <p className="text-base text-muted">
                {t.aiT.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-white hover:bg-surface/10 rounded-[var(--radius-control)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP INFO BANNER */}
        <div className="bg-rec-soft border-b border-rec/30 p-4 shrink-0 flex items-start gap-3">
          <Info className="w-5 h-5 text-rec shrink-0 mt-0.5" />
          <div className="text-base text-ink space-y-1">
            <p className="font-bold">{t.aiT.howTitle}</p>
            <p className="leading-relaxed text-ink">
              {t.aiT.howBody1}<span className="font-semibold underline decoration-amber-400">{t.aiT.fewShot}</span>{t.aiT.howBody2}
            </p>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-sunken">
          
          {/* FILTER & ACTIONS BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-[var(--radius-control)] text-base font-bold transition-all cursor-pointer border ${
                  activeFilter === 'all'
                    ? 'bg-ink text-white border-slate-900 shadow-xs'
                    : 'bg-surface hover:bg-sunken text-ink border-line'
                }`}
              >
                {t.aiT.filterAll(items.length)}
              </button>

              <button
                onClick={() => setActiveFilter('hook')}
                className={`px-3 py-1.5 rounded-[var(--radius-control)] text-base font-bold transition-all cursor-pointer border ${
                  activeFilter === 'hook'
                    ? 'bg-rec text-white border-rec shadow-xs'
                    : 'bg-surface hover:bg-sunken text-ink border-line'
                }`}
              >
                {t.aiT.filterHooks(hookCount)}
              </button>

              <button
                onClick={() => setActiveFilter('body')}
                className={`px-3 py-1.5 rounded-[var(--radius-control)] text-base font-bold transition-all cursor-pointer border ${
                  activeFilter === 'body'
                    ? 'bg-ink text-white border-slate-900 shadow-xs'
                    : 'bg-surface hover:bg-sunken text-ink border-line'
                }`}
              >
                {t.aiT.filterBodies(bodyCount)}
              </button>

              <button
                onClick={() => setActiveFilter('cta')}
                className={`px-3 py-1.5 rounded-[var(--radius-control)] text-base font-bold transition-all cursor-pointer border ${
                  activeFilter === 'cta'
                    ? 'bg-rec text-white border-amber-600 shadow-xs'
                    : 'bg-surface hover:bg-sunken text-ink border-line'
                }`}
              >
                {t.aiT.filterCtas(ctaCount)}
              </button>

              <button
                onClick={() => setActiveFilter('script')}
                className={`px-3 py-1.5 rounded-[var(--radius-control)] text-base font-bold transition-all cursor-pointer border ${
                  activeFilter === 'script'
                    ? 'bg-ink text-white border-slate-900 shadow-xs'
                    : 'bg-surface hover:bg-sunken text-ink border-line'
                }`}
              >
                {t.aiT.filterScripts(scriptCount)}
              </button>
            </div>

            {/* Manual Add Toggle Button */}
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3.5 py-1.5 bg-rec hover:bg-red-700 text-white rounded-[var(--radius-control)] text-base font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.aiT.addExamples}</span>
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.aiT.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-line rounded-[var(--radius-card)] text-base outline-none focus:border-rec focus:ring-1 focus:ring-red-200 shadow-xs"
            />
          </div>

          {/* MANUAL ADD FORM */}
          {isAddingNew && (
            <form onSubmit={handleManualAddSubmit} className="bg-surface border-2 border-rec/30 rounded-2xl p-4 space-y-3.5 shadow-md animate-fadeIn">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-base font-bold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rec" />
                  {t.aiT.addManualTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-muted hover:text-muted p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">{t.aiT.typeLabel}</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AiTrainingType)}
                    className="w-full bg-sunken border border-line rounded-[var(--radius-control)] px-2.5 py-1.5 text-base font-semibold outline-none focus:border-rec"
                  >
                    <option value="hook">{t.aiT.typeHook}</option>
                    <option value="body">{t.aiT.typeBody}</option>
                    <option value="cta">{t.aiT.typeCta}</option>
                    <option value="script">{t.aiT.typeScript}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-1">{t.aiT.titleLabel}</label>
                  <input
                    type="text"
                    placeholder={t.aiT.titlePlaceholder}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-sunken border border-line rounded-[var(--radius-control)] px-2.5 py-1.5 text-base outline-none focus:border-rec"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-1">{t.aiT.brandLabel}</label>
                  <input
                    type="text"
                    placeholder={t.aiT.brandPlaceholder}
                    value={newBrandContext}
                    onChange={(e) => setNewBrandContext(e.target.value)}
                    className="w-full bg-sunken border border-line rounded-[var(--radius-control)] px-2.5 py-1.5 text-base outline-none focus:border-rec"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-ink mb-1">
                  {t.aiT.textLabel}
                </label>
                <textarea
                  rows={newType === 'script' ? 10 : 3}
                  placeholder={
                    newType === 'hook'
                      ? t.aiT.textPlaceholderHook
                      : newType === 'body'
                      ? t.aiT.textPlaceholderBody
                      : newType === 'cta'
                      ? t.aiT.textPlaceholderCta
                      : t.aiT.textPlaceholderScript
                  }
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full bg-sunken border border-line rounded-[var(--radius-control)] p-2.5 text-base outline-none focus:border-rec focus:bg-surface"
                  required
                />
                {newType === 'script' && (
                  <p className="field-hint mt-1.5">{t.aiT.scriptHint}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 bg-sunken hover:bg-line text-ink rounded-[var(--radius-control)] text-base font-bold cursor-pointer"
                >
                  {t.aiT.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newText.trim() || isSubmitting}
                  className="px-4 py-1.5 bg-rec hover:bg-red-700 text-white rounded-[var(--radius-control)] text-base font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? t.aiT.saving : t.aiT.saveBtn}</span>
                </button>
              </div>
            </form>
          )}

          {/* LIST OF TRAINING ITEMS */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-dashed border-line-strong p-6 space-y-3">
              <Brain className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-lg font-bold text-ink">{t.aiT.emptyTitle}</p>
                <p className="text-base text-muted mt-1 max-w-md mx-auto">
                  {items.length === 0
                    ? t.aiT.emptyNone
                    : t.aiT.emptyFiltered}
                </p>
              </div>
              {items.length === 0 && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-2 px-4 py-2 bg-rec text-white rounded-[var(--radius-card)] text-base font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.aiT.addFirst}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface rounded-[var(--radius-card)] p-4 border border-line hover:border-line-strong shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(item.type)}
                      
                      {item.title && (
                        <span className="text-base font-bold text-ink">
                          {item.title}
                        </span>
                      )}

                      {item.brandContext && (
                        <span className="text-sm font-semibold text-muted bg-sunken px-2 py-0.5 rounded border border-line">
                          {item.brandContext}
                        </span>
                      )}
                    </div>

                    <span className="text-sm text-muted font-mono shrink-0">
                      {new Date(item.createdAt).toLocaleDateString(dateLocale(lang), {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>

                  {/* Text content */}
                  <div className="text-base font-medium leading-relaxed text-ink bg-sunken border border-line p-3 rounded-[var(--radius-control)] italic">
                    "{item.text}"
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-line">
                    <button
                      onClick={() => handleCopy(item.id, item.text)}
                      className="px-2.5 py-1 bg-sunken hover:bg-line text-muted rounded-[var(--radius-control)] text-base font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title={t.aiT.copyTitle}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-ink" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === item.id ? t.aiT.copied : t.aiT.copy}</span>
                    </button>

                    <button
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteItemClick(item.id)}
                      className="px-2.5 py-1 bg-rec-soft hover:bg-rec-soft text-rec rounded-[var(--radius-control)] text-base font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      title={t.aiT.deleteTitle}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-rec animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-rec" />
                      )}
                      <span>{deletingId === item.id ? t.aiT.deleting : t.aiT.delete}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-sunken border-t border-line flex justify-between items-center shrink-0">
          <div className="text-base text-muted font-medium hidden sm:block">
            {t.aiT.footerNote}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface hover:bg-line border border-line-strong rounded-[var(--radius-control)] text-base font-bold text-ink cursor-pointer"
          >
            {t.aiT.close}
          </button>
        </div>

      </div>
    </div>
  );
};
