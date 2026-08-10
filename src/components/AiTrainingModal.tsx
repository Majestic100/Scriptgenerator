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
  Loader2
} from 'lucide-react';
import { AiTrainingItem, AiTrainingType } from '../types';

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
  const handleAdd = onAddItem || onAdd;
  const handleDelete = onDeleteItem || onDelete;

  const [activeFilter, setActiveFilter] = useState<'all' | 'hook' | 'body' | 'cta'>('all');
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
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
            <Zap className="w-3 h-3 text-[#E52328]" />
            Hook / Krog
          </span>
        );
      case 'body':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-white border border-slate-800">
            <FileText className="w-3 h-3 text-slate-300" />
            Body / Manuskript
          </span>
        );
      case 'cta':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
            <Target className="w-3 h-3 text-amber-700" />
            Call To Action
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E52328] to-red-600 flex items-center justify-center text-white shadow-md">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                AI Træning & Guldstandarder
                <span className="text-xs font-semibold bg-white/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/20">
                  {items.length} eksempler
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lær AI'en din stil ved at gemme de bedste hooks, manuskripter og CTA'er
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP INFO BANNER */}
        <div className="bg-amber-50 border-b border-amber-200 p-4 shrink-0 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 space-y-1">
            <p className="font-bold">Hvordan trænes AI'en?</p>
            <p className="leading-relaxed text-amber-900">
              Alle eksempler du gemmer her fungerer som <span className="font-semibold underline decoration-amber-400">Few-Shot Prompt Træning</span>. Når du genererer eller omstrukturerer nye manuskripter, foder motoren automatisk dine gemte eksempler ind som idealer for tone, struktur og vinkler.
            </p>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50">
          
          {/* FILTER & ACTIONS BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Alle ({items.length})
              </button>

              <button
                onClick={() => setActiveFilter('hook')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'hook'
                    ? 'bg-[#E52328] text-white border-[#E52328] shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                ⚡ Hooks ({hookCount})
              </button>

              <button
                onClick={() => setActiveFilter('body')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'body'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                📄 Bodies ({bodyCount})
              </button>

              <button
                onClick={() => setActiveFilter('cta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'cta'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                🎯 CTA'er ({ctaCount})
              </button>
            </div>

            {/* Manual Add Toggle Button */}
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3.5 py-1.5 bg-[#E52328] hover:bg-red-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tilføj eksempler</span>
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Søg i træningseksempler..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E52328] focus:ring-1 focus:ring-red-200 shadow-xs"
            />
          </div>

          {/* MANUAL ADD FORM */}
          {isAddingNew && (
            <form onSubmit={handleManualAddSubmit} className="bg-white border-2 border-red-200 rounded-2xl p-4 space-y-3.5 shadow-md animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#E52328]" />
                  Tilføj nyt guldstandard eksempel manuelt
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Type:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AiTrainingType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-[#E52328]"
                  >
                    <option value="hook">⚡ Hook / Krog</option>
                    <option value="body">📄 Body / Manuskript</option>
                    <option value="cta">🎯 Call To Action (CTA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Overskrift / Vinkel (Valgfri):</label>
                  <input
                    type="text"
                    placeholder="f.eks. Pattern Interrupt hook"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E52328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Produkt / Brand (Valgfri):</label>
                  <input
                    type="text"
                    placeholder="f.eks. GlowSkin C-vitamin"
                    value={newBrandContext}
                    onChange={(e) => setNewBrandContext(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E52328]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tekstindhold der skal træne AI'en:*
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    newType === 'hook'
                      ? 'f.eks. Stop lige med at spilde penge på C-vitamin serummer, der lader din hud tør og klistret tilbage!'
                      : newType === 'body'
                      ? 'f.eks. De fleste traditionelle C-vitamin serummer klistrer eller udtørrer huden. Mød HydraBoost C-Serum fra GlowSkin Scandinavia med 100% koldpresset hyaluronsyre.'
                      : 'f.eks. Prøv den 100% risikofrit i dag. Klik på linket nedenfor og spar 20% med koden GLOW20!'
                  }
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#E52328] focus:bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={!newText.trim() || isSubmitting}
                  className="px-4 py-1.5 bg-[#E52328] hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Gemmer...' : 'Gem til AI træning'}</span>
                </button>
              </div>
            </form>
          )}

          {/* LIST OF TRAINING ITEMS */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6 space-y-3">
              <Brain className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-800">Ingen træningseksempler fundet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {items.length === 0
                    ? 'Gem hooks, manuskripter eller CTA\'er fra dine genererede scripts ved at klikke på "🎓 Gem til AI træning" knappen på kortene.'
                    : 'Ingen eksempler matchede din søgning eller dit filter.'}
                </p>
              </div>
              {items.length === 0 && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-2 px-4 py-2 bg-[#E52328] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tilføj første træningseksempel</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(item.type)}
                      
                      {item.title && (
                        <span className="text-xs font-bold text-slate-900">
                          {item.title}
                        </span>
                      )}

                      {item.brandContext && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.brandContext}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(item.createdAt).toLocaleDateString('da-DK', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>

                  {/* Text content */}
                  <div className="text-xs font-medium leading-relaxed text-slate-800 bg-slate-50 border border-slate-200/80 p-3 rounded-lg italic">
                    "{item.text}"
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleCopy(item.id, item.text)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Kopier teksten"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === item.id ? 'Kopieret' : 'Kopier'}</span>
                    </button>

                    <button
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteItemClick(item.id)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      title="Slet fra AI træning"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span>{deletingId === item.id ? 'Sletter...' : 'Slet'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Disse eksempler inkluderes i hver prompt til Claude.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
          >
            Luk
          </button>
        </div>

      </div>
    </div>
  );
};
