import React, { useState } from 'react';
import { 
  Quote, 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Plus, 
  Search, 
  RefreshCw,
  Zap, 
  FileText, 
  CheckCircle2
} from 'lucide-react';
import { PRESET_ANALOGIES, AnalogyItem, AnalogyCategory } from '../data/analogies';
import { weaveBodyWithAnalogy } from '../utils/formatUtils';
import { useLang } from '../i18n';

export interface AnalogyTargetContext {
  type: 'hook' | 'body';
  hookIndex?: number;
  currentText?: string;
}

interface AnalogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAnalogy: (text: string, action: 'hook' | 'body' | 'both' | 'new_hook', hookIndex?: number) => void;
  targetContext?: AnalogyTargetContext | null;
  scriptTextContext?: string;
  productName?: string;
  productDescription?: string;
  companyName?: string;
}

// Helper to weave an analogy with current text for instant display preview
const formatInstantWovenText = (currentText: string, analogyText: string, targetType: 'hook' | 'body'): string => {
  if (!currentText || !currentText.trim()) return analogyText;

  if (targetType === 'body') {
    return weaveBodyWithAnalogy(currentText, analogyText);
  }

  const cleanAnalogy = analogyText.trim();
  const cleanCurrent = currentText.trim();

  if (cleanCurrent.toLowerCase().includes(cleanAnalogy.toLowerCase())) {
    return cleanCurrent;
  }

  let formattedCurrent = cleanCurrent;
  if (!/[.!?]$/.test(formattedCurrent)) {
    formattedCurrent += '!';
  }

  let formattedAnalogy = cleanAnalogy;
  if (!/[.!?]$/.test(formattedAnalogy)) {
    formattedAnalogy += '.';
  }

  return `${formattedCurrent} ${formattedAnalogy}`;
};


// Helper to highlight ONLY the analogy portion within the woven sentence
const renderHighlightedScriptWithAnalogy = (wovenText: string, itemTitle: string, itemText: string) => {
  if (!wovenText) return null;

  const cleanAnalogy = itemText.trim().replace(/\.$/, '');
  const wovenLower = wovenText.toLowerCase();
  const analogyLower = cleanAnalogy.toLowerCase();

  let matchIdx = wovenLower.indexOf(analogyLower);
  let matchLen = cleanAnalogy.length;

  // Fallback: if exact cleanAnalogy isn't found in full, match the first main clause or title
  if (matchIdx === -1) {
    const mainClause = cleanAnalogy.split(/[-–]/)[0].trim().toLowerCase();
    if (mainClause.length > 5) {
      matchIdx = wovenLower.indexOf(mainClause);
      if (matchIdx !== -1) {
        matchLen = mainClause.length;
      }
    }
  }

  // Fallback 2: match title
  if (matchIdx === -1 && itemTitle) {
    const titleLower = itemTitle.trim().toLowerCase();
    if (titleLower.length > 5) {
      matchIdx = wovenLower.indexOf(titleLower);
      if (matchIdx !== -1) {
        matchLen = titleLower.length;
      }
    }
  }

  if (matchIdx === -1) {
    return <span className="font-medium text-ink">{wovenText}</span>;
  }

  const before = wovenText.slice(0, matchIdx);
  const highlighted = wovenText.slice(matchIdx, matchIdx + matchLen);
  const after = wovenText.slice(matchIdx + matchLen);

  return (
    <span className="font-medium text-ink">
      {before}
      <span className="bg-yellow-300/60 text-slate-950 font-bold px-1.5 py-0.5 rounded border border-yellow-400/50 inline">
        {highlighted}
      </span>
      {after}
    </span>
  );
};

export const AnalogyModal: React.FC<AnalogyModalProps> = ({
  isOpen,
  onClose,
  onApplyAnalogy,
  targetContext = { type: 'hook', hookIndex: 0, currentText: '' },
  scriptTextContext = '',
  productName = '',
  productDescription = '',
  companyName = ''
}) => {
  const { t } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  
  const [customAnalogy, setCustomAnalogy] = useState<string>('');
  const [userCreatedAnalogies, setUserCreatedAnalogies] = useState<AnalogyItem[]>([]);
  
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiAnalogies, setAiAnalogies] = useState<AnalogyItem[]>([]);

  const [customWovenTexts, setCustomWovenTexts] = useState<Record<string, string>>({});
  const [integratingId, setIntegratingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentType: 'hook' | 'body' = targetContext?.type === 'body' ? 'body' : 'hook';
  const currentHookIdx = targetContext?.hookIndex ?? 0;
  const currentText = targetContext?.currentText || '';

  const categories: ('Alle' | AnalogyCategory)[] = ['Alle', 'Skabe frygt', 'Vis forbedring', 'Skabe interesse'];

  const allAnalogies = [...aiAnalogies, ...PRESET_ANALOGIES, ...userCreatedAnalogies];

  const filteredAnalogies = allAnalogies.filter(item => {
    const matchesCat = selectedCategory === 'Alle' || item.category === selectedCategory;
    const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const isAnalogyAdded = (itemText: string) => {
    if (!scriptTextContext) return false;
    const lowerScript = scriptTextContext.toLowerCase();
    const lowerText = itemText.toLowerCase();

    if (lowerScript.includes(lowerText)) return true;

    const words = lowerText.split(' ').filter(w => w.length > 3);
    if (words.length >= 3) {
      const snippet = words.slice(1, 4).join(' ');
      if (snippet && lowerScript.includes(snippet)) return true;
    }
    return false;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (text: string, action: 'hook' | 'body' | 'both' | 'new_hook') => {
    onApplyAnalogy(text, action, currentHookIdx);
    setAppliedNotice(t.analogy.added);
    setTimeout(() => {
      setAppliedNotice(null);
      onClose();
    }, 500);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAnalogy.trim()) return;

    const cat: AnalogyCategory = (selectedCategory !== 'Alle' ? selectedCategory : 'Skabe frygt') as AnalogyCategory;

    const newItem: AnalogyItem = {
      id: `custom-${Date.now()}`,
      title: customAnalogy.trim(),
      text: customAnalogy.trim(),
      category: cat
    };

    setUserCreatedAnalogies(prev => [newItem, ...prev]);
    setCustomAnalogy('');
  };

  const handleIntegrateWithAi = async (itemId: string, analogyText: string) => {
    if (!currentText.trim()) return;
    setIntegratingId(itemId);
    try {
      const res = await fetch('/api/integrate-analogy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyText: currentText,
          analogyText,
          companyName,
          productName,
          productDescription
        })
      });
      const data = await res.json();
      if (data.success && data.wovenText) {
        setCustomWovenTexts(prev => ({ ...prev, [itemId]: data.wovenText }));
      }
    } catch (err) {
      console.error('Fejl ved AI tilpasning af analogi:', err);
    } finally {
      setIntegratingId(null);
    }
  };

  const handleGenerateAiAnalogies = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/generate-analogy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          productName,
          productDescription,
          category: selectedCategory,
          targetType: currentType,
          currentText
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.analogies)) {
        const newItems: AnalogyItem[] = data.analogies.map((item: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          title: item.title || 'AI Analogi',
          text: item.text,
          category: (['Skabe frygt', 'Vis forbedring', 'Skabe interesse'].includes(item.category) 
            ? item.category 
            : (selectedCategory !== 'Alle' ? selectedCategory : 'Skabe frygt')) as AnalogyCategory
        }));

        setAiAnalogies(newItems);
      }
    } catch (err) {
      console.error('Fejl ved AI analogi generering:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 md:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-surface rounded-2xl shadow-2xl border border-line w-full max-w-3xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-ink text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-card)] bg-rec flex items-center justify-center text-white shadow-xs">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {t.analogy.title}
                <span className="text-base font-normal text-slate-300">
                  ({currentType === 'hook' ? t.analogy.hookCtx(currentHookIdx + 1) : t.analogy.bodyCtx})
                </span>
              </h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-white hover:bg-surface/10 rounded-[var(--radius-control)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {appliedNotice && (
          <div className="bg-ink text-white text-base font-bold py-2 px-4 text-center shrink-0 flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{appliedNotice}</span>
          </div>
        )}

        {/* MODAL CONTENT */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-sunken">
          
          {/* CATEGORY & AI BUTTON BAR */}
          <div className="bg-surface p-3.5 rounded-[var(--radius-card)] border border-line space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Category buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-[var(--radius-control)] text-base font-bold transition-all cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-ink text-white border-slate-900 shadow-xs'
                        : 'bg-sunken hover:bg-sunken text-ink border-line'
                    }`}
                  >
                    {t.analogy.categoryLabels[cat] || cat}
                  </button>
                ))}
              </div>

              {/* Generate 5 new AI analogies button */}
              <button
                onClick={handleGenerateAiAnalogies}
                disabled={isGeneratingAi}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-rec text-ink rounded-[var(--radius-control)] text-base font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title={t.analogy.fetchNewTitle}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? t.analogy.generating : t.analogy.fetchNew}</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.analogy.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-sunken border border-line rounded-[var(--radius-control)] text-base outline-none focus:border-rec focus:bg-surface"
              />
            </div>
          </div>

          {/* CURRENT HOOK/BODY CONTEXT */}
          {currentText && (
            <div className="bg-rec-soft border border-rec/30 p-3 rounded-[var(--radius-card)] text-base space-y-1">
              <span className="font-bold text-ink uppercase tracking-wider block text-sm">
                {t.analogy.targetText(currentType === 'hook' ? t.analogy.hookCtx(currentHookIdx + 1) : t.analogy.bodyCtx)}
              </span>
              <p className="text-ink font-medium italic">"{currentText}"</p>
            </div>
          )}

          {/* ANALOGY LIST */}
          <div className="space-y-3">
            {isGeneratingAi ? (
              <div className="text-center py-10 bg-surface rounded-[var(--radius-card)] border border-line p-6 space-y-2">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                <p className="text-base font-semibold text-muted">{t.analogy.aiTailoring}</p>
              </div>
            ) : filteredAnalogies.length === 0 ? (
              <div className="text-center py-8 bg-surface rounded-[var(--radius-card)] border border-dashed border-line-strong p-4">
                <p className="text-base font-medium text-muted mb-2">{t.analogy.noneFound}</p>
                <button
                  onClick={handleGenerateAiAnalogies}
                  className="px-3 py-1.5 bg-rec text-white rounded-[var(--radius-control)] text-base font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.analogy.genWithAi}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredAnalogies.map((item) => {
                  const isAdded = isAnalogyAdded(item.text);
                  const isCustomAdapted = !!customWovenTexts[item.id];
                  const wovenPreview = customWovenTexts[item.id] || formatInstantWovenText(currentText, item.text, currentType);
                  const isIntegratingThis = integratingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-[var(--radius-card)] p-4 transition-all flex flex-col justify-between space-y-3 ${
                        isAdded
                          ? 'bg-rec-soft border-2 border-amber-400 ring-2 ring-amber-300/50 shadow-sm'
                          : 'bg-surface border border-line hover:border-line-strong shadow-xs'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Top info */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold uppercase px-2 py-0.5 rounded bg-sunken text-muted border border-line">
                            {t.analogy.categoryLabels[item.category] || item.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isCustomAdapted && (
                              <span className="px-2 py-0.5 bg-sunken text-emerald-900 border border-line-strong rounded-full text-sm font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-ink" />
                                {t.analogy.aiAdapted}
                              </span>
                            )}
                            {isAdded && (
                              <span className="px-2.5 py-0.5 bg-[#FEF08A] text-ink border border-amber-400 rounded-full text-sm font-black flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-rec" />
                                {t.analogy.addedBadge}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1. ANALOGI ALENE */}
                        <div className="text-base font-semibold text-ink bg-sunken border border-line p-2.5 rounded-[var(--radius-control)]">
                          <span className="font-extrabold text-ink mr-1.5">{t.analogy.analogyLabel}</span>
                          <span className="text-ink">{item.title || item.text}</span>
                        </div>

                        {/* 2. SCRIPT + ANALOGI (HIGHLIGHTED) */}
                        <div className="text-base font-semibold text-ink bg-rec-soft border border-rec/30 p-2.5 rounded-[var(--radius-control)] relative">
                          <span className="font-extrabold text-ink mr-1.5 block sm:inline">{t.analogy.scriptPlusAnalogy}</span>
                          {isIntegratingThis ? (
                            <div className="py-2 flex items-center gap-2 text-rec italic">
                              <RefreshCw className="w-4 h-4 animate-spin text-rec" />
                              <span>{t.analogy.aiRewriting}</span>
                            </div>
                          ) : (
                            renderHighlightedScriptWithAnalogy(wovenPreview, item.title, item.text)
                          )}
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="pt-2 border-t border-line flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => handleCopy(item.id, wovenPreview)}
                          className="px-2.5 py-1 bg-sunken hover:bg-line text-muted rounded text-base font-medium flex items-center gap-1 cursor-pointer"
                          title={t.analogy.copyTitle}
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-ink" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === item.id ? t.analogy.copied : t.analogy.copy}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {currentType === 'body' && (
                            <button
                              onClick={() => handleIntegrateWithAi(item.id, item.text)}
                              disabled={isIntegratingThis || !currentText.trim()}
                              className="px-2.5 py-1.5 bg-rec-soft hover:bg-amber-200 text-ink border border-rec/40 rounded-[var(--radius-control)] text-base font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title={t.analogy.aiAdaptTitle}
                            >
                              <Sparkles className={`w-3.5 h-3.5 text-rec ${isIntegratingThis ? 'animate-spin' : ''}`} />
                              <span>{isIntegratingThis ? t.analogy.adapting : t.analogy.aiAdaptBtn}</span>
                            </button>
                          )}

                          {currentType === 'hook' ? (
                            <button
                              onClick={() => handleApply(wovenPreview, 'hook')}
                              className="px-3.5 py-1.5 bg-rec hover:bg-red-700 text-white rounded-[var(--radius-control)] text-base font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>{t.analogy.insertInHook(currentHookIdx + 1)}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApply(wovenPreview, 'body')}
                              className="px-3.5 py-1.5 bg-ink hover:bg-ink text-white rounded-[var(--radius-control)] text-base font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{t.analogy.insertInBody}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ADD CUSTOM ANALOGY */}
          <form onSubmit={handleAddCustom} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder={t.analogy.customPlaceholder}
              value={customAnalogy}
              onChange={(e) => setCustomAnalogy(e.target.value)}
              className="flex-1 bg-surface border border-line rounded-[var(--radius-control)] px-3 py-1.5 text-base outline-none focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={!customAnalogy.trim()}
              className="px-3 py-1.5 bg-ink hover:bg-ink text-white rounded-[var(--radius-control)] text-base font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.analogy.add}</span>
            </button>
          </form>

        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-sunken border-t border-line flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface hover:bg-line border border-line-strong rounded-[var(--radius-control)] text-base font-bold text-ink cursor-pointer"
          >
            {t.analogy.close}
          </button>
        </div>

      </div>
    </div>
  );
};
