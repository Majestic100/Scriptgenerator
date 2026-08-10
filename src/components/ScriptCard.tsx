import React, { useState } from 'react';
import { 
  Star,
  Clapperboard,
  Copy, 
  Check, 
  FolderPlus, 
  Pencil, 
  RefreshCw, 
  Video, 
  Quote,
  Brain,
  FileText,
  FileDown
} from 'lucide-react';
import { GeneratedScript } from '../types';
import { formatScriptToHtml, formatScriptToPlainText, copyFormattedToClipboard, weaveBodyWithAnalogy } from '../utils/formatUtils';
import { downloadScriptsAsDocx, downloadScriptsAsPdf } from '../utils/exportUtils';
import { AnalogyModal, AnalogyTargetContext } from './AnalogyModal';

interface ScriptCardProps {
  script: GeneratedScript;
  scriptIndex: number;
  startHookNumber?: number;
  onUpdateScript?: (updatedScript: GeneratedScript) => void;
  onSaveToProject?: (script: GeneratedScript) => void;
  onSaveToAiTraining?: (type: 'hook' | 'body' | 'cta', text: string, title?: string, brandContext?: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  scriptIndex,
  startHookNumber = 0,
  onUpdateScript,
  onSaveToProject,
  onSaveToAiTraining
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);

  // Regeneration states
  const [isRegeneratingScript, setIsRegeneratingScript] = useState(false);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [regeneratingHookIndex, setRegeneratingHookIndex] = useState<number | null>(null);
  const [isRegeneratingBody, setIsRegeneratingBody] = useState(false);
  const [isRegeneratingCta, setIsRegeneratingCta] = useState(false);
  
  // Analogy Modal states
  const [isAnalogyModalOpen, setIsAnalogyModalOpen] = useState(false);
  const [analogyTargetContext, setAnalogyTargetContext] = useState<AnalogyTargetContext>({ type: 'hook', hookIndex: 0 });

  // Track open visual idea panels and loading states per hook
  const [openVisualHooks, setOpenVisualHooks] = useState<Record<number, boolean>>({});
  const [loadingVisualHooks, setLoadingVisualHooks] = useState<Record<number, boolean>>({});

  // Track saved AI training items per card
  const [savedTrainingKeys, setSavedTrainingKeys] = useState<Record<string, boolean>>({});

  const handleSaveElementToAiTraining = (type: 'hook' | 'body' | 'cta', text: string, key: string, title?: string) => {
    if (!text || !text.trim()) return;
    const brandContext = [script.companyName, script.productName].filter(Boolean).join(' - ');
    onSaveToAiTraining?.(type, text.trim(), title, brandContext);
    setSavedTrainingKeys(prev => ({ ...prev, [key]: true }));
  };

  // Helper to remove CTA/Offer text from body dialogue so Body remains strictly Body
  const stripCtaFromText = (rawText: string, ctaText?: string): string => {
    if (!rawText) return '';
    let text = rawText.trim();

    if (ctaText && ctaText.trim().length > 3) {
      const cleanCta = ctaText.trim();
      if (text.toLowerCase().includes(cleanCta.toLowerCase())) {
        const idx = text.toLowerCase().indexOf(cleanCta.toLowerCase());
        text = text.substring(0, idx).trim();
      }
    }

    // Strip trailing offer or discount codes if present in body
    text = text.replace(/\s*(?:Spar\s+\d+%.*|Brug koden:?.*|Få gratis fragt.*|Køb \d+.*|Klik på linket.*|Prøv det 100% risikofrit!?.*)$/gi, '').trim();

    return text;
  };

  // Build continuous body text from scene dialogues (EXCLUDING CTA scenes)
  const rawBodyScenes = script.scenes
    .filter((sc) => !sc.section || !['cta', 'cta & offer', 'cta and offer'].includes(sc.section.toLowerCase()))
    .map((sc) => (sc.audioDialogue ? sc.audioDialogue.trim() : ''))
    .filter(Boolean)
    .join(' ');

  const bodyText = stripCtaFromText(rawBodyScenes, script.callToAction);

  // Full concatenated script text for detecting added analogies
  const fullScriptText = [
    ...script.hooks.map(h => h.audioDialogue),
    bodyText,
    script.callToAction,
    script.title
  ].filter(Boolean).join(' ');

  // Helper to blend analogy into a hook grammatically and keep it max 4-5 seconds (12-16 words)
  const weaveHookWithAnalogy = (existingHook: string, analogyText: string): string => {
    const cleanAnalogy = analogyText.trim().replace(/\.$/, '');
    const cleanExisting = existingHook ? existingHook.trim().replace(/^[.!\-\s]+/, '') : '';

    if (!cleanExisting) {
      return cleanAnalogy + '.';
    }

    if (cleanExisting.toLowerCase().includes(cleanAnalogy.toLowerCase())) {
      return cleanExisting;
    }

    // Check if analogy is already long enough to be a standalone hook
    const analogyWords = cleanAnalogy.split(/\s+/);
    if (analogyWords.length >= 12) {
      return cleanAnalogy + '.';
    }

    // Weave analogy seamlessly into the hook grammatically
    let lowerFirstChar = cleanExisting.charAt(0).toLowerCase() + cleanExisting.slice(1);
    lowerFirstChar = lowerFirstChar.replace(/^(vidste du at|mange|derfor|hvorfor)\s+/i, '');

    let combined = `${cleanAnalogy} – ${lowerFirstChar}`;
    
    // Ensure max ~15 words for ~4-5 second speaking speed
    const words = combined.split(/\s+/);
    if (words.length > 15) {
      combined = words.slice(0, 15).join(' ');
    }

    if (!/[.!?]$/.test(combined)) {
      combined += '.';
    }
    return combined;
  };

  const handleOpenAnalogyModal = (type: 'hook' | 'body', hookIdx: number = 0) => {
    const currentText = type === 'hook' 
      ? script.hooks[hookIdx]?.audioDialogue || ''
      : bodyText;

    setAnalogyTargetContext({
      type,
      hookIndex: hookIdx,
      currentText
    });
    setIsAnalogyModalOpen(true);
  };

  const handleApplyAnalogy = (text: string, action: 'hook' | 'body' | 'both' | 'new_hook', targetHookIndex?: number) => {
    if (!onUpdateScript) return;

    const hookIdx = targetHookIndex ?? analogyTargetContext.hookIndex ?? 0;

    if (action === 'body') {
      const updatedBody = text.length > 30 ? text : weaveBodyWithAnalogy(bodyText, text);
      handleUpdateBodyText(updatedBody);
    } else if (action === 'hook') {
      const hooks = [...script.hooks];
      if (hooks[hookIdx]) {
        const woven = text.length > 25 ? text : weaveHookWithAnalogy(hooks[hookIdx].audioDialogue, text);
        hooks[hookIdx] = {
          ...hooks[hookIdx],
          audioDialogue: woven,
          textOnScreen: woven.length > 40 ? woven.slice(0, 40) + '...' : woven,
          estimatedDurationSec: Math.min(5, Math.max(3, Math.ceil(woven.split(' ').length / 3.5)))
        };
        onUpdateScript({ ...script, hooks });
      } else {
        const woven = weaveHookWithAnalogy('', text);
        onUpdateScript({
          ...script,
          hooks: [
            ...hooks,
            {
              id: `hook-${Date.now()}`,
              hookNumber: hooks.length + 1,
              angleType: 'Analogi',
              visualDirection: 'Kameraet fanger skuespillerens udtryksfulde ansigtsudtryk.',
              textOnScreen: woven.length > 35 ? woven.slice(0, 35) + '...' : woven,
              audioDialogue: woven,
              estimatedDurationSec: 4
            }
          ]
        });
      }
    } else if (action === 'both') {
      const hooks = [...script.hooks];
      if (hooks[hookIdx]) {
        const wovenHook = weaveHookWithAnalogy(hooks[hookIdx].audioDialogue, text);
        hooks[hookIdx] = {
          ...hooks[hookIdx],
          audioDialogue: wovenHook,
          estimatedDurationSec: 4
        };
      }
      const newBodyText = weaveBodyWithAnalogy(bodyText, text);
      const updatedScenes = script.scenes.length > 0
        ? script.scenes.map((sc, idx) => idx === 0 ? { ...sc, audioDialogue: weaveBodyWithAnalogy(sc.audioDialogue || '', text) } : sc)
        : [{ id: `scene-${Date.now()}`, sceneNumber: 1, visualDirection: 'Produktet vises i brug', audioDialogue: newBodyText }];
      
      onUpdateScript({ ...script, hooks, scenes: updatedScenes });
    } else if (action === 'new_hook') {
      const woven = weaveHookWithAnalogy('', text);
      const newHook = {
        id: `hook-${Date.now()}`,
        hookNumber: script.hooks.length + 1,
        angleType: 'Analogi',
        visualDirection: 'Kameraet fanger skuespillerens udtryksfulde ansigtsudtryk og kropssprog.',
        textOnScreen: woven.length > 40 ? woven.slice(0, 40) + '...' : woven,
        audioDialogue: woven,
        estimatedDurationSec: 4
      };
      onUpdateScript({
        ...script,
        hooks: [...script.hooks, newHook]
      });
    }
  };

  const handleCopyText = async () => {
    const htmlContent = formatScriptToHtml(script, scriptIndex, startHookNumber);
    const plainTextContent = formatScriptToPlainText(script, scriptIndex, startHookNumber);
    await copyFormattedToClipboard(htmlContent, plainTextContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Editing Handlers
  const handleUpdateHookText = (hookIdx: number, newAudioDialogue: string) => {
    const updatedHooks = script.hooks.map((h, i) =>
      i === hookIdx ? { ...h, audioDialogue: newAudioDialogue } : h
    );
    onUpdateScript?.({ ...script, hooks: updatedHooks });
  };

  const handleUpdateHookVisual = (hookIdx: number, newVisualDirection: string) => {
    const updatedHooks = script.hooks.map((h, i) =>
      i === hookIdx ? { ...h, visualDirection: newVisualDirection } : h
    );
    onUpdateScript?.({ ...script, hooks: updatedHooks });
  };

  const handleUpdateBodyText = (newBodyText: string) => {
    let updatedScenes = [...(script.scenes || [])];
    if (updatedScenes.length === 0) {
      updatedScenes = [{ sceneNumber: 1, audioDialogue: newBodyText, visualDirection: '', textOnScreen: '', estimatedDurationSec: 15 }];
    } else {
      updatedScenes = updatedScenes.map((sc, i) =>
        i === 0 ? { ...sc, audioDialogue: newBodyText } : sc
      );
    }
    onUpdateScript?.({ ...script, scenes: updatedScenes });
  };

  const handleUpdateCtaText = (newCtaText: string) => {
    onUpdateScript?.({ ...script, callToAction: newCtaText });
  };

  const handleUpdateTitle = (newTitle: string) => {
    onUpdateScript?.({ ...script, title: newTitle });
  };

  const handleRegenerateHook = async (hookIdx: number) => {
    setRegeneratingHookIndex(hookIdx);
    try {
      const response = await fetch('/api/regenerate-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementType: 'hook',
          script,
          hookIndex: hookIdx
        })
      });
      const data = await response.json();
      if (data.success && data.script) {
        onUpdateScript?.(data.script);
      }
    } catch (err) {
      console.error('Fejl ved re-generering af hook:', err);
    } finally {
      setRegeneratingHookIndex(null);
    }
  };

  // Generér komplet shot list for hele scriptet (alle hooks + scener)
  const handleGenerateAllVisuals = async () => {
    setIsGeneratingVisuals(true);
    try {
      const response = await fetch('/api/generate-visuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script })
      });
      const data = await response.json();
      if (data.success && data.script) {
        onUpdateScript?.(data.script);
        setOpenVisualHooks(Object.fromEntries((data.script.hooks || []).map((_: any, i: number) => [i, true])));
      }
    } catch (err) {
      console.error('Fejl ved generering af visuals:', err);
    } finally {
      setIsGeneratingVisuals(false);
    }
  };

  const handleFetchOrToggleVisualIdea = async (hookIdx: number) => {
    const currentHook = script.hooks[hookIdx];
    const isOpen = !!openVisualHooks[hookIdx];

    if (!isOpen && (!currentHook?.visualDirection || currentHook.visualDirection.trim() === '')) {
      setLoadingVisualHooks((prev) => ({ ...prev, [hookIdx]: true }));
      try {
        const response = await fetch('/api/regenerate-element', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            elementType: 'hook_visual',
            script,
            hookIndex: hookIdx
          })
        });
        const data = await response.json();
        if (data.success && data.script) {
          onUpdateScript?.(data.script);
        }
      } catch (err) {
        console.error('Fejl ved generering af visuel idé:', err);
      } finally {
        setLoadingVisualHooks((prev) => ({ ...prev, [hookIdx]: false }));
        setOpenVisualHooks((prev) => ({ ...prev, [hookIdx]: true }));
      }
    } else {
      setOpenVisualHooks((prev) => ({ ...prev, [hookIdx]: !isOpen }));
    }
  };

  const handleRegenerateVisualIdea = async (hookIdx: number) => {
    setLoadingVisualHooks((prev) => ({ ...prev, [hookIdx]: true }));
    try {
      const response = await fetch('/api/regenerate-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementType: 'hook_visual',
          script,
          hookIndex: hookIdx
        })
      });
      const data = await response.json();
      if (data.success && data.script) {
        onUpdateScript?.(data.script);
      }
    } catch (err) {
      console.error('Fejl ved gen-generering af visuel idé:', err);
    } finally {
      setLoadingVisualHooks((prev) => ({ ...prev, [hookIdx]: false }));
      setOpenVisualHooks((prev) => ({ ...prev, [hookIdx]: true }));
    }
  };

  const handleRegenerateBody = async () => {
    setIsRegeneratingBody(true);
    try {
      const response = await fetch('/api/regenerate-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementType: 'body',
          script
        })
      });
      const data = await response.json();
      if (data.success && data.script) {
        onUpdateScript?.(data.script);
      }
    } catch (err) {
      console.error('Fejl ved re-generering af body:', err);
    } finally {
      setIsRegeneratingBody(false);
    }
  };

  const handleRegenerateCta = async () => {
    setIsRegeneratingCta(true);
    try {
      const response = await fetch('/api/regenerate-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementType: 'cta',
          script
        })
      });
      const data = await response.json();
      if (data.success && data.script) {
        onUpdateScript?.(data.script);
      }
    } catch (err) {
      console.error('Fejl ved re-generering af CTA:', err);
    } finally {
      setIsRegeneratingCta(false);
    }
  };

  const handleRegenerateFullScript = async () => {
    setIsRegeneratingScript(true);
    try {
      const response = await fetch('/api/regenerate-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementType: 'script',
          script
        })
      });
      const data = await response.json();
      if (data.success && data.script) {
        onUpdateScript?.(data.script);
      }
    } catch (err) {
      console.error('Fejl ved re-generering af script:', err);
    } finally {
      setIsRegeneratingScript(false);
    }
  };

  return (
    <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
      
      {/* Top Action Bar */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-semibold tracking-[0.1em] uppercase text-ink">
            <span className="text-rec">●</span> Script {String(scriptIndex + 1).padStart(2, '0')}
          </span>
          <span className="font-mono text-base bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded">
            {script.scriptType || 'UGC'}
          </span>
          {script.awarenessStage && (
            <span className="font-mono text-base bg-amber-100 text-amber-900 font-medium px-2 py-0.5 rounded flex items-center gap-1">
              {script.awarenessStage}
            </span>
          )}
          {script.trafficType && (
            <span className={`text-sm font-semibold px-2 py-0.5 rounded flex items-center gap-1 border ${
              script.trafficType === 'retargeting' || script.trafficType?.toLowerCase().includes('retargeting')
                ? 'bg-red-50 text-rec border-red-200'
                : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}>
              {script.trafficType === 'retargeting' || script.trafficType?.toLowerCase().includes('retargeting') ? 'Retargeting' : 'Kold trafik'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Gem til Projekt Button */}
          {onSaveToProject && (
            <button
              onClick={() => onSaveToProject(script)}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-base font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Gem dette script til et projekt"
            >
              <FolderPlus className="w-3.5 h-3.5 text-rec" />
              <span>Gem til Projekt</span>
            </button>
          )}

          {/* Generate Visuals Button */}
          <button
            onClick={handleGenerateAllVisuals}
            disabled={isGeneratingVisuals || isRegeneratingScript}
            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-base font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Generér en komplet shot list: konkrete optage-idéer til alle hooks og scener"
          >
            <Clapperboard className={`w-3.5 h-3.5 ${isGeneratingVisuals ? 'animate-pulse text-rec' : 'text-slate-500'}`} />
            <span>{isGeneratingVisuals ? 'Genererer visuals...' : 'Generér visuals'}</span>
          </button>

          {/* Regenerate Full Script Button */}
          <button
            onClick={handleRegenerateFullScript}
            disabled={isRegeneratingScript || regeneratingHookIndex !== null || isRegeneratingBody || isRegeneratingCta}
            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-base font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Lav et helt nyt forslag til netop dette script (nye hooks, ny body og ny CTA)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingScript ? 'animate-spin text-rec' : 'text-slate-500'}`} />
            <span>{isRegeneratingScript ? 'Laver nyt forslag...' : 'Nyt forslag'}</span>
          </button>

          {/* Single Script Download Docs Button */}
          <button
            onClick={() => downloadScriptsAsDocx([script], script.documentTitle)}
            className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-base font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Download dette enkelt script som Google Docs (.docx)"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Docs</span>
          </button>

          {/* Single Script Download PDF Button */}
          <button
            onClick={() => downloadScriptsAsPdf([script], script.documentTitle)}
            className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-base font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Download dette enkelt script som PDF (.pdf)"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </button>

          {/* Copy Script Button */}
          <button
            onClick={handleCopyText}
            className="px-3.5 py-1.5 bg-[#E52328] hover:bg-[#c81e22] text-white rounded-md text-base font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Kopiér dette script"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Kopieret!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>Kopiér dette script</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EDIT MODE BANNER */}
      {isEditing && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-base text-amber-900 font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-700 shrink-0" />
            <span><strong>Redigeringstilstand aktiv:</strong> Du kan nu rette ord eller sætninger i alle felter herunder. Ændringerne opdateres automatisk.</span>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-bold cursor-pointer transition-colors shrink-0"
          >
            Færdig med redigering
          </button>
        </div>
      )}

      {/* SCRIPT CONTENT - SIMPLE TEXT MODE */}
      <div className="script-text-container p-6 md:p-8 space-y-4 text-black text-[11pt] leading-relaxed select-text font-['Arial',sans-serif]">
        
        {/* HOOKS */}
        <div className="space-y-3 mb-4">
          {script.hooks.map((hook, i) => {
            const globalHookNumber = (startHookNumber || 0) + i + 1;
            const isThisHookLoading = regeneratingHookIndex === i;
            const isVisualLoading = !!loadingVisualHooks[i];
            const isVisualOpen = !!openVisualHooks[i];
            const isHookAudioEditing = isEditing || editingFieldKey === `hook-${i}`;
            const isHookVisEditing = isEditing || editingFieldKey === `hook-vis-${i}`;

            return (
              <div key={hook.id || i} className="space-y-1.5 p-2 rounded-lg bg-slate-50/40 border border-slate-100">
                <div className="group flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  
                  {isHookAudioEditing ? (
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-base font-bold text-black">
                        <span>Hook {globalHookNumber} {hook.angleType ? `(${hook.angleType})` : ''}:</span>
                        <span className="text-sm text-amber-700 font-semibold">Gemmes automatisk</span>
                      </div>
                      <textarea
                        rows={2}
                        autoFocus={editingFieldKey === `hook-${i}`}
                        value={hook.audioDialogue}
                        onChange={(e) => handleUpdateHookText(i, e.target.value)}
                        onBlur={() => setEditingFieldKey(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setEditingFieldKey(null);
                          }
                        }}
                        className="w-full bg-amber-50/80 border border-amber-300 rounded-md p-2 text-base text-black font-['Arial',sans-serif] outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328]"
                        placeholder="Skriv hook-teksten her..."
                      />
                    </div>
                  ) : (
                    <p
                      onDoubleClick={() => setEditingFieldKey(`hook-${i}`)}
                      className="text-black font-['Arial',sans-serif] m-0 flex-1 cursor-pointer hover:bg-amber-50/60 hover:outline-dashed hover:outline-1 hover:outline-amber-300 p-1.5 -m-1.5 rounded-md transition-all group/hook"
                      title="Dobbeltklik direkte i teksten for at redigere"
                    >
                      <strong className="font-bold text-black">Hook {globalHookNumber} -</strong> {hook.audioDialogue}
                      {hook.psychology && (
                        <span className="block mt-1.5 text-base text-violet-800 bg-violet-50 border border-violet-200 rounded px-2.5 py-1.5">
                          <strong className="font-semibold">Psykologi:</strong> {hook.psychology}
                        </span>
                      )}
                      {hook.angleType && (
                        <span className="text-[9pt] text-slate-500 font-normal ml-2 italic">
                          ({hook.angleType})
                        </span>
                      )}
                      <span className="inline-flex items-center ml-2 text-slate-400 opacity-0 group-hover/hook:opacity-100 transition-opacity text-sm font-normal">
                        <Pencil className="w-3 h-3 inline mr-0.5" /> Dobbeltklik for at rette
                      </span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-auto pt-0.5">
                    {/* Gem Hook til AI Træning Button */}
                    <button
                      onClick={() => handleSaveElementToAiTraining('hook', hook.audioDialogue, `hook-${i}`, `Hook ${globalHookNumber} (${hook.angleType || 'Vinkel'})`)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-bold rounded transition-all cursor-pointer ${
                        savedTrainingKeys[`hook-${i}`]
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300'
                      }`}
                      title="Stjernemarkér: AI'en tager udgangspunkt i dine stjernemarkerede hooks fremover"
                    >
                      <Star className={`w-3.5 h-3.5 ${savedTrainingKeys[`hook-${i}`] ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                      <span>{savedTrainingKeys[`hook-${i}`] ? 'Stjernemarkeret' : 'Stjernemarkér'}</span>
                    </button>

                    {/* Visual Idea Toggle Button */}
                    <button
                      onClick={() => handleFetchOrToggleVisualIdea(i)}
                      disabled={isVisualLoading || isRegeneratingScript}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      title={`Se visuel idé til hvad der kan filmes til Hook ${globalHookNumber}`}
                    >
                      <Video className={`w-3 h-3 ${isVisualLoading ? 'animate-spin text-amber-600' : 'text-amber-600'}`} />
                      <span>{isVisualLoading ? 'Henter idé...' : isVisualOpen ? 'Skjul optage-idé' : 'Hvad kan filmes?'}</span>
                    </button>

                    {/* Analogi / Talesprog Button for Hook */}
                    <button
                      onClick={() => handleOpenAnalogyModal('hook', i)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition-all cursor-pointer"
                      title="Søg eller vælg analogier til at flette ind i Hook"
                    >
                      <Quote className="w-3 h-3 text-amber-700" />
                      <span>+ Analogi</span>
                    </button>

                    {/* Regenerate Hook Button */}
                    <button
                      onClick={() => handleRegenerateHook(i)}
                      disabled={isThisHookLoading || isRegeneratingScript}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-slate-600 hover:text-[#E52328] bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      title={`Gen-generér Hook ${globalHookNumber}`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isThisHookLoading ? 'animate-spin text-[#E52328]' : 'text-slate-500'}`} />
                      <span>{isThisHookLoading ? 'Regenererer...' : 'Regenerér hook'}</span>
                    </button>
                  </div>
                </div>

                {/* VISUAL FILMING IDEA BOX */}
                {(isVisualOpen || isHookVisEditing) && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-md text-base space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-900 flex items-center gap-1 text-sm">
                        🎥 Optage-idé til Hook {globalHookNumber}:
                      </span>
                      {!isEditing && (
                        <button
                          onClick={() => handleRegenerateVisualIdea(i)}
                          disabled={isVisualLoading}
                          className="text-sm text-amber-800 hover:text-amber-950 underline font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Nyt optage-forslag
                        </button>
                      )}
                    </div>
                    {isHookVisEditing ? (
                      <textarea
                        rows={2}
                        autoFocus={editingFieldKey === `hook-vis-${i}`}
                        value={hook.visualDirection || ''}
                        onChange={(e) => handleUpdateHookVisual(i, e.target.value)}
                        onBlur={() => setEditingFieldKey(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setEditingFieldKey(null);
                          }
                        }}
                        placeholder="Skriv instruks eller hvad der kan filmes..."
                        className="w-full bg-white border border-amber-300 rounded p-1.5 text-sm text-slate-800 outline-none focus:border-[#E52328]"
                      />
                    ) : (
                      <p
                        onDoubleClick={() => setEditingFieldKey(`hook-vis-${i}`)}
                        className="text-slate-800 text-sm leading-snug italic m-0 cursor-pointer hover:bg-amber-100/60 p-1 -m-1 rounded transition-colors"
                        title="Dobbeltklik for at redigere optage-idéen"
                      >
                        {hook.visualDirection || 'Kameraet panorerer tæt over produktet, mens personen ser overrasket på skærmen.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BODY */}
        <div className="space-y-1 p-2 rounded-lg bg-slate-50/40 border border-slate-100 mb-3">
          <div className="group flex items-start justify-between gap-3">
            {isEditing || editingFieldKey === 'body' ? (
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-base font-bold text-black">
                  <span>Body (Manuskriftets hoveddel):</span>
                  <span className="text-sm text-amber-700 font-semibold">Gemmes automatisk</span>
                </div>
                <textarea
                  rows={4}
                  autoFocus={editingFieldKey === 'body'}
                  value={bodyText}
                  onChange={(e) => handleUpdateBodyText(e.target.value)}
                  onBlur={() => setEditingFieldKey(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setEditingFieldKey(null);
                    }
                  }}
                  className="w-full bg-amber-50/80 border border-amber-300 rounded-md p-2 text-base text-black font-['Arial',sans-serif] outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328]"
                  placeholder="Skriv manuskriptets brødtekst / body her..."
                />
              </div>
            ) : (
              <p
                onDoubleClick={() => setEditingFieldKey('body')}
                className="text-black font-['Arial',sans-serif] m-0 flex-1 cursor-pointer hover:bg-amber-50/60 hover:outline-dashed hover:outline-1 hover:outline-amber-300 p-1.5 -m-1.5 rounded-md transition-all group/body"
                title="Dobbeltklik direkte i teksten for at redigere"
              >
                <strong className="font-bold text-black">Body -</strong> {bodyText}
                <span className="inline-flex items-center ml-2 text-slate-400 opacity-0 group-hover/body:opacity-100 transition-opacity text-sm font-normal">
                  <Pencil className="w-3 h-3 inline mr-0.5" /> Dobbeltklik for at rette
                </span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 mt-1">
              <button
                onClick={() => handleSaveElementToAiTraining('body', bodyText, 'body', `Body - ${script.title || 'Manuskript'}`)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-bold rounded transition-all cursor-pointer ${
                  savedTrainingKeys['body']
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300'
                }`}
                title="Stjernemarkér: AI'en tager udgangspunkt i dine stjernemarkerede bodies fremover"
              >
                <Star className={`w-3.5 h-3.5 ${savedTrainingKeys['body'] ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                <span>{savedTrainingKeys['body'] ? 'Stjernemarkeret' : 'Stjernemarkér body'}</span>
              </button>

              <button
                onClick={() => handleOpenAnalogyModal('body')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition-all cursor-pointer"
                title="Tilføj en stærk analogi til Body"
              >
                <Quote className="w-3 h-3 text-amber-700" />
                <span>+ Analogi</span>
              </button>

              <button
                onClick={handleRegenerateBody}
                disabled={isRegeneratingBody || isRegeneratingScript}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-slate-600 hover:text-[#E52328] bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded transition-all cursor-pointer disabled:opacity-50"
                title="Gen-generér Body"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingBody ? 'animate-spin text-[#E52328]' : 'text-slate-500'}`} />
                <span>{isRegeneratingBody ? 'Regenererer...' : 'Regenerér body'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-1 p-2 rounded-lg bg-slate-50/40 border border-slate-100">
          <div className="group flex items-start justify-between gap-3">
            {isEditing || editingFieldKey === 'cta' ? (
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-base font-bold text-black">
                  <span>CTA (Call to Action / Tilbud):</span>
                  <span className="text-sm text-amber-700 font-semibold">Gemmes automatisk</span>
                </div>
                <textarea
                  rows={2}
                  autoFocus={editingFieldKey === 'cta'}
                  value={script.callToAction}
                  onChange={(e) => handleUpdateCtaText(e.target.value)}
                  onBlur={() => setEditingFieldKey(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setEditingFieldKey(null);
                    }
                  }}
                  className="w-full bg-amber-50/80 border border-amber-300 rounded-md p-2 text-base text-black font-[#Arial',sans-serif] outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328]"
                  placeholder="Skriv Call to Action her..."
                />
              </div>
            ) : (
              <p
                onDoubleClick={() => setEditingFieldKey('cta')}
                className="text-black font-['Arial',sans-serif] m-0 flex-1 cursor-pointer hover:bg-amber-50/60 hover:outline-dashed hover:outline-1 hover:outline-amber-300 p-1.5 -m-1.5 rounded-md transition-all group/cta"
                title="Dobbeltklik direkte i teksten for at redigere"
              >
                <strong className="font-bold text-black">CTA -</strong> {script.callToAction}
                <span className="inline-flex items-center ml-2 text-slate-400 opacity-0 group-hover/cta:opacity-100 transition-opacity text-sm font-normal">
                  <Pencil className="w-3 h-3 inline mr-0.5" /> Dobbeltklik for at rette
                </span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 mt-1">
              <button
                onClick={() => handleSaveElementToAiTraining('cta', script.callToAction, 'cta', `CTA - ${script.title || 'Tilbud'}`)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-bold rounded transition-all cursor-pointer ${
                  savedTrainingKeys['cta']
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300'
                }`}
                title="Stjernemarkér: AI'en tager udgangspunkt i dine stjernemarkerede CTA'er fremover"
              >
                <Star className={`w-3.5 h-3.5 ${savedTrainingKeys['cta'] ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                <span>{savedTrainingKeys['cta'] ? 'Stjernemarkeret' : 'Stjernemarkér CTA'}</span>
              </button>

              <button
                onClick={handleRegenerateCta}
                disabled={isRegeneratingCta || isRegeneratingScript}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-slate-600 hover:text-[#E52328] bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded transition-all cursor-pointer shrink-0 disabled:opacity-50"
                title="Gen-generér CTA"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingCta ? 'animate-spin text-[#E52328]' : 'text-slate-500'}`} />
                <span>{isRegeneratingCta ? 'Regenererer...' : 'Regenerér CTA'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <AnalogyModal
        isOpen={isAnalogyModalOpen}
        onClose={() => setIsAnalogyModalOpen(false)}
        onApplyAnalogy={handleApplyAnalogy}
        targetContext={analogyTargetContext}
        scriptTextContext={fullScriptText}
        companyName={script.companyName}
        productName={script.productName}
      />
    </div>
  );
};
