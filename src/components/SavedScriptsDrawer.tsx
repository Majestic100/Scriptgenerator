import React, { useState } from 'react';
import { X, Trash2, Film, Clock, Copy, Check, ExternalLink, Bookmark, Search } from 'lucide-react';
import { GeneratedScript } from '../types';
import { formatScriptToHtml, formatScriptToPlainText, copyFormattedToClipboard } from '../utils/formatUtils';

interface SavedScriptsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedScripts: GeneratedScript[];
  onDelete: (scriptId: string) => void;
  onSelectScript: (script: GeneratedScript) => void;
}

export const SavedScriptsDrawer: React.FC<SavedScriptsDrawerProps> = ({
  isOpen,
  onClose,
  savedScripts,
  onDelete,
  onSelectScript
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = savedScripts.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.scriptType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyQuick = async (script: GeneratedScript, idx: number) => {
    const htmlContent = formatScriptToHtml(script, idx);
    const plainTextContent = formatScriptToPlainText(script, idx);
    await copyFormattedToClipboard(htmlContent, plainTextContent);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl text-slate-800">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#E52328]" />
            <h3 className="font-bold text-xl text-[#181E2B]">Gemte Meta Scripts</h3>
            <span className="text-base bg-red-50 text-[#E52328] font-bold px-2 py-0.5 rounded-full border border-red-200">
              {savedScripts.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søg i gemte scripts..."
              className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-base text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328]"
            />
          </div>
        </div>

        {/* Script List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-base">
                {searchTerm ? 'Ingen matcher din søgning' : 'Du har ingen gemte scripts endnu. Klik på gem-ikonet på et script for at have det lige ved hånden.'}
              </p>
            </div>
          ) : (
            filtered.map((script, idx) => (
              <div
                key={script.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 transition-all hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-bold text-[#E52328] uppercase tracking-wider block">
                      {script.companyName}
                    </span>
                    <h4 className="text-lg font-bold text-[#181E2B] line-clamp-1">
                      {script.title}
                    </h4>
                  </div>

                  <button
                    onClick={() => onDelete(script.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                    title="Slet gemt script"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Film className="w-3 h-3 text-[#E52328]" />
                    {script.scriptType.split(' ')[0]}
                  </span>
                  <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    {script.bodyDuration}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      onSelectScript(script);
                      onClose();
                    }}
                    className="text-base text-[#E52328] hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Åbn fuld visning</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopyQuick(script, idx)}
                    className="text-base text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 cursor-pointer"
                  >
                    {copiedId === script.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Kopieret</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hurtig kopi</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
