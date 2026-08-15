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
  FileDown,
  Compass,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { GeneratedScript, normalizeTrafficTemperature } from '../types';
import { formatScriptToHtml, formatScriptToPlainText, copyFormattedToClipboard, weaveBodyWithAnalogy } from '../utils/formatUtils';
import { downloadScriptsAsDocx, downloadScriptsAsPdf } from '../utils/exportUtils';
import { AnalogyModal, AnalogyTargetContext } from './AnalogyModal';
import { useLang } from '../i18n';

interface ScriptCardProps {
  script: GeneratedScript;
  scriptIndex: number;
  startHookNumber?: number;
  onUpdateScript?: (updatedScript: GeneratedScript) => void;
  onSaveToProject?: (script: GeneratedScript) => void;
  onSaveToAiTraining?: (type: 'hook' | 'body' | 'cta' | 'script', text: string, title?: string, brandContext?: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  scriptIndex,
  startHookNumber = 0,
  onUpdateScript,
  onSaveToProject,
  onSaveToAiTraining
}) => {
  const { t } = useLang();
  const [copiedText, setCopiedText] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(true);
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

  const handleSaveElementToAiTraining = (type: 'hook' | 'body' | 'cta' | 'script', text: string, key: string, title?: string) => {
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

  /**
   * Hele manuskriptet som ét stykke, i den rækkefølge det læses op. Bruges når man
   * gemmer scriptet som træningseksempel: det er sammenhængen fra hook til CTA,
   * AI'en skal lære af, ikke de tre dele hver for sig. Kun første hook kommer med,
   * fordi de øvrige er alternativer til samme body.
   */
  const wholeScriptText = [
    script.hooks?.[0]?.audioDialogue?.trim(),
    bodyText,
    script.callToAction?.trim()
  ].filter(Boolean).join('\n\n');

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

    // Flet analogien ind foran hooket. Punktum frem for tankestreg: tankestreger er
    // et af de tydeligste AI-tegn og bliver alligevel ikke hørt i en talt replik.
    const rest = cleanExisting.replace(/^(vidste du at|mange|derfor|hvorfor)\s+/i, '');
    const restSentence = rest.charAt(0).toUpperCase() + rest.slice(1);

    let combined = `${cleanAnalogy}. ${restSentence}`;

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
    <div className="bg-surface border border-line rounded-[var(--radius-control)] overflow-hidden shadow-sm hover:shadow-md transition-all">
      
      {/* Top Action Bar */}
      <div className="px-5 py-4 bg-sunken border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 min-w-0">
          <span className="rec-dot self-center shrink-0" aria-hidden="true" />
          <span className="font-display text-[19px] text-ink">
            Script {String(scriptIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-[14.5px] text-muted">{script.scriptType || 'UGC'}</span>
          {script.awarenessStage && (
            <>
              <span className="text-line-strong" aria-hidden="true">·</span>
              <span className="text-[14.5px] text-muted">{script.awarenessStage}</span>
            </>
          )}
          {script.trafficType && (
            <>
              <span className="text-line-strong" aria-hidden="true">·</span>
              <span className="text-[14.5px] text-muted">
                {t.traffic[normalizeTrafficTemperature(script.trafficType)].title}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Gem til Projekt Button */}
          {onSaveToProject && (
            <button
              onClick={() => onSaveToProject(script)}
              className="px-3 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              title={t.card.saveToProjectTitle}
            >
              <FolderPlus className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              <span>{t.card.saveToProject}</span>
            </button>
          )}

          {/* Generate Visuals Button */}
          <button
            onClick={handleGenerateAllVisuals}
            disabled={isGeneratingVisuals || isRegeneratingScript}
            className="px-3 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title={t.card.generateVisualsTitle}
          >
            <Clapperboard className={`w-3.5 h-3.5 ${isGeneratingVisuals ? 'animate-pulse text-rec' : 'text-muted'}`} />
            <span>{isGeneratingVisuals ? t.card.generatingVisuals : t.card.generateVisuals}</span>
          </button>

          {/* Gem hele scriptet som ét træningseksempel, ikke delt op i hook, body og CTA */}
          <button
            onClick={() =>
              handleSaveElementToAiTraining('script', wholeScriptText, 'whole-script', script.title || t.card.scriptFallbackTitle)
            }
            className="px-3 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            data-active={savedTrainingKeys['whole-script'] ? 'true' : 'false'}
            title={t.card.starScriptTitle}
          >
            <Star
              className={`w-3.5 h-3.5 ${savedTrainingKeys['whole-script'] ? 'fill-rec text-rec' : 'text-muted'}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>{savedTrainingKeys['whole-script'] ? t.card.starredScript : t.card.starScript}</span>
          </button>

          {/* Regenerate Full Script Button */}
          <button
            onClick={handleRegenerateFullScript}
            disabled={isRegeneratingScript || regeneratingHookIndex !== null || isRegeneratingBody || isRegeneratingCta}
            className="px-3 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title={t.card.regenScriptTitle}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingScript ? 'animate-spin text-rec' : 'text-muted'}`} />
            <span>{isRegeneratingScript ? t.card.makingNewSuggestion : t.card.newSuggestion}</span>
          </button>

          {/* Single Script Download Docs Button */}
          <button
            onClick={() => downloadScriptsAsDocx([script], script.documentTitle)}
            className="px-2.5 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title={t.card.docsTitle}
          >
            <FileText className="w-3.5 h-3.5 text-muted" />
            <span>Docs</span>
          </button>

          {/* Single Script Download PDF Button */}
          <button
            onClick={() => downloadScriptsAsPdf([script], script.documentTitle)}
            className="px-2.5 py-2 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title={t.card.pdfTitle}
          >
            <FileDown className="w-3.5 h-3.5 text-muted" />
            <span>PDF</span>
          </button>

          {/* Copy Script Button */}
          <button
            onClick={handleCopyText}
            className="px-3.5 py-2 bg-ink hover:bg-black text-white rounded-[var(--radius-control)] text-[15px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title={t.card.copyScriptTitle}
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>{t.card.copiedExcl}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>{t.card.copyScript}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EDIT MODE BANNER */}
      {isEditing && (
        <div className="px-5 py-2.5 bg-rec-soft border-b border-rec/30 flex items-center justify-between text-base text-ink font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-rec shrink-0" />
            <span><strong>{t.card.editBannerStrong}</strong> {t.card.editBannerRest}</span>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="px-2.5 py-1 bg-rec hover:bg-rec-hover text-white rounded text-sm font-bold cursor-pointer transition-colors shrink-0"
          >
            {t.card.doneEditing}
          </button>
        </div>
      )}

      {/* STRATEGIBLOK: klassificeret før scriptet blev skrevet */}
      {script.strategy && (
        <div className="border-b border-line">
          <button
            type="button"
            onClick={() => setIsStrategyOpen(!isStrategyOpen)}
            aria-expanded={isStrategyOpen}
            className="w-full flex items-center justify-between gap-3 px-5 py-3 bg-surface hover:bg-sunken transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Compass className="w-4 h-4 text-rec shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="font-semibold text-[15.5px] text-ink">{t.strategyP.title}</span>
              <span className="text-[14px] text-muted truncate hidden sm:inline">
                {script.strategy.awarenessState} · {script.strategy.massDesire}
              </span>
              {script.strategy.stageMatch === 'evidence-suggests-other' && (
                <AlertTriangle className="w-4 h-4 text-rec shrink-0" strokeWidth={1.75} aria-hidden="true" />
              )}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted shrink-0 transition-transform ${isStrategyOpen ? 'rotate-180' : ''}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>

          {isStrategyOpen && (
            <div className="px-5 pb-5 bg-surface animate-fadeIn">

              {/* Nøgletal som chips */}
              <div className="flex flex-wrap items-center gap-1.5 pb-4">
                <span className="strategy-chip">
                  <span className="text-muted">{t.strategyP.awareness}</span>
                  <span className="font-semibold text-ink">{script.strategy.awarenessState}</span>
                </span>
                <span className="strategy-chip">
                  <span className="text-muted">{t.strategyP.sophistication}</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {script.strategy.marketSophistication}/5
                  </span>
                </span>
                <span className="strategy-chip">
                  <span className="text-muted">{t.strategyP.confidence}</span>
                  <span className="font-semibold text-ink">
                    {t.strategyP.confidenceLabels[script.strategy.confidence] || script.strategy.confidence}
                  </span>
                </span>
              </div>

              {script.strategy.stageMatch === 'evidence-suggests-other' && script.strategy.suggestedStage && (
                <p className="flex items-start gap-2 text-[15px] text-ink bg-rec-soft border border-rec/30 rounded-[var(--radius-control)] px-3.5 py-2.5 mb-4">
                  <AlertTriangle className="w-4 h-4 text-rec shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                  {t.strategyP.stageMismatch(script.strategy.suggestedStage)}
                </p>
              )}

              {/* Kernen: den overbevisning scriptet skal flytte */}
              <div className="border border-line-strong rounded-[var(--radius-control)] overflow-hidden mb-4">
                <div className="px-4 py-2 bg-sunken border-b border-line">
                  <span className="field-label mb-0">{t.strategyP.beliefShift}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-2 px-4 py-3.5">
                  <p className="text-[15.5px] text-muted leading-snug">
                    <span className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
                      {t.strategyP.beliefFrom}
                    </span>
                    {script.strategy.currentBelief}
                  </p>
                  <span className="hidden sm:block text-line-strong text-[20px] leading-none" aria-hidden="true">→</span>
                  <p className="text-[15.5px] text-ink font-medium leading-snug">
                    <span className="block font-mono text-[11px] uppercase tracking-wider text-rec mb-1">
                      {t.strategyP.beliefTo}
                    </span>
                    {script.strategy.requiredBeliefShift}
                  </p>
                </div>
              </div>

              {/* Sådan flyttes den */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 text-[15px]">
                <div>
                  <dt className="field-label mb-0.5">{t.strategyP.massDesire}</dt>
                  <dd className="text-ink">{script.strategy.massDesire}</dd>
                </div>
                <div>
                  <dt className="field-label mb-0.5">{t.strategyP.angle}</dt>
                  <dd className="text-ink">{script.strategy.primaryAngle}</dd>
                </div>
                <div>
                  <dt className="field-label mb-0.5">{t.strategyP.mechanism}</dt>
                  <dd className="text-ink">{script.strategy.mechanism}</dd>
                </div>
                <div>
                  <dt className="field-label mb-0.5">{t.strategyP.proof}</dt>
                  <dd className="text-ink">{script.strategy.proofType}</dd>
                </div>
                <div>
                  <dt className="field-label mb-0.5">{t.strategyP.cta}</dt>
                  <dd className="text-ink">{script.strategy.cta}</dd>
                </div>
                <div>
                  <dt className="field-label mb-0.5">{t.strategyP.process}</dt>
                  <dd className="text-ink">{script.strategy.schwartzProcess}</dd>
                </div>
              </dl>

              {/* Belæg og udeladelser */}
              {(script.strategy.classificationEvidence ||
                (Array.isArray(script.strategy.unsupportedClaimsExcluded) &&
                  script.strategy.unsupportedClaimsExcluded.length > 0)) && (
                <div className="border-t border-line mt-4 pt-4 space-y-3">
                  {script.strategy.classificationEvidence && (
                    <div>
                      <span className="field-label mb-0.5">{t.strategyP.evidence}</span>
                      <p className="text-[15px] text-muted leading-relaxed">
                        {script.strategy.classificationEvidence}
                      </p>
                      {script.strategy.sophisticationNote && (
                        <p className="text-[15px] text-muted leading-relaxed mt-1">
                          {t.strategyP.level(script.strategy.marketSophistication)}: {script.strategy.sophisticationNote}
                        </p>
                      )}
                    </div>
                  )}

                  {Array.isArray(script.strategy.unsupportedClaimsExcluded) &&
                    script.strategy.unsupportedClaimsExcluded.length > 0 && (
                      <div>
                        <span className="field-label mb-1">{t.strategyP.excluded}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {script.strategy.unsupportedClaimsExcluded.map((claim, ci) => (
                            <span
                              key={ci}
                              className="text-[14px] text-muted bg-sunken border border-line rounded px-2 py-0.5"
                            >
                              {claim}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <p className="field-hint">{t.strategyP.subtitle}</p>
                </div>
              )}
            </div>
          )}
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
              <div key={hook.id || i} className="space-y-1.5 p-2 rounded-[var(--radius-control)] bg-sunken border border-line">
                <div className="group flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  
                  {isHookAudioEditing ? (
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-base font-bold text-black">
                        <span>{t.card.hook} {globalHookNumber} {hook.angleType ? `(${hook.angleType})` : ''}:</span>
                        <span className="text-sm text-rec font-semibold">{t.card.autoSaved}</span>
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
                        className="w-full bg-rec-soft border border-rec/40 rounded-[var(--radius-control)] p-2 text-base text-black font-['Arial',sans-serif] outline-none focus:border-rec focus:ring-1 focus:ring-rec"
                        placeholder={t.card.hookPlaceholder}
                      />
                    </div>
                  ) : (
                    <p
                      onDoubleClick={() => setEditingFieldKey(`hook-${i}`)}
                      className="text-black font-['Arial',sans-serif] m-0 flex-1 cursor-pointer hover:bg-rec-soft hover:outline-dashed hover:outline-1 hover:outline-rec/40 p-1.5 -m-1.5 rounded-[var(--radius-control)] transition-all group/hook"
                      title={t.card.dblClickTitle}
                    >
                      <strong className="font-bold text-black">{t.card.hook} {globalHookNumber} -</strong> {hook.audioDialogue}
                      {hook.psychology && (
                        <span className="block mt-1.5 text-base text-ink bg-sunken border border-line rounded px-2.5 py-1.5">
                          <strong className="font-semibold">{t.card.psychology}</strong> {hook.psychology}
                        </span>
                      )}
                      {hook.angleType && (
                        <span className="text-[9pt] text-muted font-normal ml-2 italic">
                          ({hook.angleType})
                        </span>
                      )}
                      <span className="inline-flex items-center ml-2 text-muted opacity-0 group-hover/hook:opacity-100 transition-opacity text-sm font-normal">
                        <Pencil className="w-3 h-3 inline mr-0.5" /> {t.card.dblClickEdit}
                      </span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-auto pt-0.5">
                    {/* Gem Hook til AI Træning Button */}
                    <button
                      onClick={() => handleSaveElementToAiTraining('hook', hook.audioDialogue, `hook-${i}`, `Hook ${globalHookNumber} (${hook.angleType || t.card.angleWord})`)}
                      className="chip-btn"
                      data-active={savedTrainingKeys[`hook-${i}`] ? 'true' : 'false'}
                      title={t.card.starHookTitle}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${savedTrainingKeys[`hook-${i}`] ? 'fill-rec text-rec' : 'text-muted'}`}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span>{savedTrainingKeys[`hook-${i}`] ? t.card.starred : t.card.star}</span>
                    </button>

                    {/* Visual Idea Toggle Button */}
                    <button
                      onClick={() => handleFetchOrToggleVisualIdea(i)}
                      disabled={isVisualLoading || isRegeneratingScript}
                      className="chip-btn"
                      data-active={isVisualOpen ? 'true' : 'false'}
                      title={t.card.visualTitle(globalHookNumber)}
                    >
                      <Video
                        className={`w-3.5 h-3.5 ${isVisualLoading ? 'animate-spin' : ''}`}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span>{isVisualLoading ? t.card.fetchingIdea : isVisualOpen ? t.card.hideFilmingIdea : t.card.whatToFilm}</span>
                    </button>

                    {/* Analogi / Talesprog Button for Hook */}
                    <button
                      onClick={() => handleOpenAnalogyModal('hook', i)}
                      className="chip-btn"
                      title={t.card.analogyHookTitle}
                    >
                      <Quote className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                      <span>{t.card.analogy}</span>
                    </button>

                    {/* Regenerate Hook Button */}
                    <button
                      onClick={() => handleRegenerateHook(i)}
                      disabled={isThisHookLoading || isRegeneratingScript}
                      className="chip-btn"
                      title={t.card.regenHookTitle(globalHookNumber)}
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-muted ${isThisHookLoading ? 'animate-spin' : ''}`}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span>{isThisHookLoading ? t.card.regenerating : t.card.newSuggestion}</span>
                    </button>
                  </div>
                </div>

                {/* VISUAL FILMING IDEA BOX */}
                {(isVisualOpen || isHookVisEditing) && (
                  <div className="p-2.5 bg-rec-soft border border-rec/30 rounded-[var(--radius-control)] text-base space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-ink flex items-center gap-1 text-sm">
                        {t.card.filmingIdeaFor(globalHookNumber)}
                      </span>
                      {!isEditing && (
                        <button
                          onClick={() => handleRegenerateVisualIdea(i)}
                          disabled={isVisualLoading}
                          className="text-sm text-rec hover:text-ink underline font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {t.card.newFilmingSuggestion}
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
                        placeholder={t.card.visualPlaceholder}
                        className="w-full bg-surface border border-rec/40 rounded p-1.5 text-sm text-ink outline-none focus:border-rec"
                      />
                    ) : (
                      <p
                        onDoubleClick={() => setEditingFieldKey(`hook-vis-${i}`)}
                        className="text-ink text-sm leading-snug italic m-0 cursor-pointer hover:bg-rec-soft p-1 -m-1 rounded transition-colors"
                        title={t.card.visualEditTitle}
                      >
                        {hook.visualDirection || t.card.visualFallback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BODY */}
        <div className="space-y-1 p-2 rounded-[var(--radius-control)] bg-sunken border border-line mb-3">
          <div className="group flex items-start justify-between gap-3">
            {isEditing || editingFieldKey === 'body' ? (
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-base font-bold text-black">
                  <span>{t.card.bodyLabel}</span>
                  <span className="text-sm text-rec font-semibold">{t.card.autoSaved}</span>
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
                  className="w-full bg-rec-soft border border-rec/40 rounded-[var(--radius-control)] p-2 text-base text-black font-['Arial',sans-serif] outline-none focus:border-rec focus:ring-1 focus:ring-rec"
                  placeholder={t.card.bodyPlaceholder}
                />
              </div>
            ) : (
              <p
                onDoubleClick={() => setEditingFieldKey('body')}
                className="text-black font-['Arial',sans-serif] m-0 flex-1 cursor-pointer hover:bg-rec-soft hover:outline-dashed hover:outline-1 hover:outline-rec/40 p-1.5 -m-1.5 rounded-[var(--radius-control)] transition-all group/body"
                title={t.card.dblClickTitle}
              >
                <strong className="font-bold text-black">{t.card.bodyWord} -</strong> {bodyText}
                <span className="inline-flex items-center ml-2 text-muted opacity-0 group-hover/body:opacity-100 transition-opacity text-sm font-normal">
                  <Pencil className="w-3 h-3 inline mr-0.5" /> {t.card.dblClickEdit}
                </span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 mt-1">
              <button
                onClick={() => handleSaveElementToAiTraining('body', bodyText, 'body', `Body - ${script.title || t.card.bodyFallbackTitle}`)}
                className="chip-btn"
                data-active={savedTrainingKeys['body'] ? 'true' : 'false'}
                title={t.card.starBodyTitle}
              >
                <Star
                  className={`w-3.5 h-3.5 ${savedTrainingKeys['body'] ? 'fill-rec text-rec' : 'text-muted'}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{savedTrainingKeys['body'] ? t.card.starred : t.card.star}</span>
              </button>

              <button
                onClick={() => handleOpenAnalogyModal('body')}
                className="chip-btn"
                title={t.card.analogyBodyTitle}
              >
                <Quote className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                <span>{t.card.analogy}</span>
              </button>

              <button
                onClick={handleRegenerateBody}
                disabled={isRegeneratingBody || isRegeneratingScript}
                className="chip-btn"
                title={t.card.regenBodyTitle}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-muted ${isRegeneratingBody ? 'animate-spin' : ''}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{isRegeneratingBody ? t.card.regenerating : t.card.newSuggestion}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-1 p-2 rounded-[var(--radius-control)] bg-sunken border border-line">
          <div className="group flex items-start justify-between gap-3">
            {isEditing || editingFieldKey === 'cta' ? (
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-base font-bold text-black">
                  <span>{t.card.ctaLabel}</span>
                  <span className="text-sm text-rec font-semibold">{t.card.autoSaved}</span>
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
                  className="w-full bg-rec-soft border border-rec/40 rounded-[var(--radius-control)] p-2 text-base text-black font-[#Arial',sans-serif] outline-none focus:border-rec focus:ring-1 focus:ring-rec"
                  placeholder={t.card.ctaPlaceholder}
                />
              </div>
            ) : (
              <p
                onDoubleClick={() => setEditingFieldKey('cta')}
                className="text-black font-['Arial',sans-serif] m-0 flex-1 cursor-pointer hover:bg-rec-soft hover:outline-dashed hover:outline-1 hover:outline-rec/40 p-1.5 -m-1.5 rounded-[var(--radius-control)] transition-all group/cta"
                title={t.card.dblClickTitle}
              >
                <strong className="font-bold text-black">{t.card.ctaWord} -</strong> {script.callToAction}
                <span className="inline-flex items-center ml-2 text-muted opacity-0 group-hover/cta:opacity-100 transition-opacity text-sm font-normal">
                  <Pencil className="w-3 h-3 inline mr-0.5" /> {t.card.dblClickEdit}
                </span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 mt-1">
              <button
                onClick={() => handleSaveElementToAiTraining('cta', script.callToAction, 'cta', `CTA - ${script.title || t.card.ctaFallbackTitle}`)}
                className="chip-btn"
                data-active={savedTrainingKeys['cta'] ? 'true' : 'false'}
                title={t.card.starCtaTitle}
              >
                <Star
                  className={`w-3.5 h-3.5 ${savedTrainingKeys['cta'] ? 'fill-rec text-rec' : 'text-muted'}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{savedTrainingKeys['cta'] ? t.card.starred : t.card.star}</span>
              </button>

              <button
                onClick={handleRegenerateCta}
                disabled={isRegeneratingCta || isRegeneratingScript}
                className="chip-btn"
                title={t.card.regenCtaTitle}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-muted ${isRegeneratingCta ? 'animate-spin' : ''}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{isRegeneratingCta ? t.card.regenerating : t.card.newSuggestion}</span>
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
