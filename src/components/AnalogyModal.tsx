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
    return <span className="font-medium text-slate-800">{wovenText}</span>;
  }

  const before = wovenText.slice(0, matchIdx);
  const highlighted = wovenText.slice(matchIdx, matchIdx + matchLen);
  const after = wovenText.slice(matchIdx + matchLen);

  return (
    <span className="font-medium text-slate-800">
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
    setAppliedNotice(`Tilføjet til scriptet!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E52328] flex items-center justify-center text-white shadow-xs">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Analogier & Billedsprog
                <span className="text-sm font-normal text-slate-300">
                  ({currentType === 'hook' ? `Hook ${currentHookIdx + 1}` : 'Body'})
                </span>
              </h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {appliedNotice && (
          <div className="bg-emerald-600 text-white text-sm font-bold py-2 px-4 text-center shrink-0 flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{appliedNotice}</span>
          </div>
        )}

        {/* MODAL CONTENT */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* CATEGORY & AI BUTTON BAR */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Category buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Generate 5 new AI analogies button */}
              <button
                onClick={handleGenerateAiAnalogies}
                disabled={isGeneratingAi}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-lg text-sm font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Bed AI om at udtænke 5 nye unikke analogier"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Genererer...' : '🔄 Hent 5 nye eksempler'}</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Søg i 30+ stærke ordsprog og analogier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#E52328] focus:bg-white"
              />
            </div>
          </div>

          {/* CURRENT HOOK/BODY CONTEXT */}
          {currentText && (
            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-sm space-y-1">
              <span className="font-bold text-amber-900 uppercase tracking-wider block text-xs">
                🎯 Måltekst ({currentType === 'hook' ? `Hook ${currentHookIdx + 1}` : 'Body'}):
              </span>
              <p className="text-amber-950 font-medium italic">"{currentText}"</p>
            </div>
          )}

          {/* ANALOGY LIST */}
          <div className="space-y-3">
            {isGeneratingAi ? (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6 space-y-2">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-600">AI skræddersyr 5 nye analogier til din tekst...</p>
              </div>
            ) : filteredAnalogies.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300 p-4">
                <p className="text-sm font-medium text-slate-500 mb-2">Ingen analogier fundet for søgningen</p>
                <button
                  onClick={handleGenerateAiAnalogies}
                  className="px-3 py-1.5 bg-[#E52328] text-white rounded-lg text-sm font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generér nye med AI</span>
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
                      className={`rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 ${
                        isAdded
                          ? 'bg-amber-50/90 border-2 border-amber-400 ring-2 ring-amber-300/50 shadow-sm'
                          : 'bg-white border border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Top info */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isCustomAdapted && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-700" />
                                AI-Tilpasset
                              </span>
                            )}
                            {isAdded && (
                              <span className="px-2.5 py-0.5 bg-[#FEF08A] text-amber-950 border border-amber-400 rounded-full text-xs font-black flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-800" />
                                🟡 TILFØJET I SCRIPTET
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1. ANALOGI ALENE */}
                        <div className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200/90 p-2.5 rounded-lg">
                          <span className="font-extrabold text-slate-900 mr-1.5">Analogi:</span>
                          <span className="text-slate-900">{item.title || item.text}</span>
                        </div>

                        {/* 2. SCRIPT + ANALOGI (HIGHLIGHTED) */}
                        <div className="text-sm font-semibold text-slate-900 bg-amber-50/70 border border-amber-200/90 p-2.5 rounded-lg relative">
                          <span className="font-extrabold text-amber-950 mr-1.5 block sm:inline">Script + analogi:</span>
                          {isIntegratingThis ? (
                            <div className="py-2 flex items-center gap-2 text-amber-800 italic">
                              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                              <span>AI omskriver teksten så analogien passer sømløst i midten...</span>
                            </div>
                          ) : (
                            renderHighlightedScriptWithAnalogy(wovenPreview, item.title, item.text)
                          )}
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => handleCopy(item.id, wovenPreview)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-sm font-medium flex items-center gap-1 cursor-pointer"
                          title="Kopier den indflettede sætning til udklipsholderen"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === item.id ? 'Kopieret' : 'Kopier'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {currentType === 'body' && (
                            <button
                              onClick={() => handleIntegrateWithAi(item.id, item.text)}
                              disabled={isIntegratingThis || !currentText.trim()}
                              className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-sm font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Lad AI omskrive hele teksten så analogien passer 100% naturligt i midten"
                            >
                              <Sparkles className={`w-3.5 h-3.5 text-amber-700 ${isIntegratingThis ? 'animate-spin' : ''}`} />
                              <span>{isIntegratingThis ? 'Tilpasser...' : '✨ AI Tilpas Tekst'}</span>
                            </button>
                          )}

                          {currentType === 'hook' ? (
                            <button
                              onClick={() => handleApply(wovenPreview, 'hook')}
                              className="px-3.5 py-1.5 bg-[#E52328] hover:bg-red-700 text-white rounded-lg text-sm font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Indsæt i Hook {currentHookIdx + 1}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApply(wovenPreview, 'body')}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Indsæt i Body</span>
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
              placeholder="Tilføj dit eget ordsprog eller analogi..."
              value={customAnalogy}
              onChange={(e) => setCustomAnalogy(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={!customAnalogy.trim()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tilføj</span>
            </button>
          </form>

        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 cursor-pointer"
          >
            Luk
          </button>
        </div>

      </div>
    </div>
  );
};
