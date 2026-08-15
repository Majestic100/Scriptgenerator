import React, { useState, useRef } from 'react';
import {
  Plus,
  X,
  Check,
  ChevronRight,
  ShoppingBag,
  UserPlus,
  Upload,
  FileCheck,
  Copy,
  Sparkles,
  Wand2,
  Undo2,
  AlertTriangle
} from 'lucide-react';
import { ScriptRequest, ScriptType, AnalysisDocument, normalizeTrafficTemperature } from '../types';
import { AngleAdvisorModal } from './AngleAdvisorModal';
import { Section, Field, Disclosure, ChoiceButton, buttonStyles } from './ui';
import { FlagDK, FlagGB } from './ui/flags';
import { useLang, formatDuration } from '../i18n';

interface ScriptFormProps {
  onSubmit: (request: ScriptRequest) => void;
  isLoading: boolean;
  initialData?: Partial<ScriptRequest>;
  onSaveAsCustomer?: (data: Partial<ScriptRequest>) => void;
}

/** Script-stilene er faste id'er; beskrivelserne slås op i oversættelserne. */
const SCRIPT_TYPES: ScriptType[] = [
  'Problem–Solution / PAS',
  'Humor & Skæv Vinkel',
  'Educational / Explainer',
  'Lifestyle & Product in Action',
  'Testimonial / UGC',
  'Demonstration & How-it-Works',
  'Before-and-After Transformation',
  'Story-Driven / Narrative',
  'Shock / Pattern Interrupt',
  'ASMR / Sensory Experience',
  'Aesthetic / Cinematic',
  'Comparison (Us vs Competitors)',
  'Social Proof / Data-Backed',
  'Tips & Hacks',
  'Green Screen / Reaction & Review',
  'Unboxing & First Impression',
  'Founder Story & Behind the Scenes',
  'Objection Handling / Indvendingsknuser',
  'Skeptiker → Overbevist',
  'Myth-Busting / Aflivning af myter',
  'FAQ / Rapid-Fire Q&A',
  'Anmeldelses-oplæsning',
  'Ingrediens- & Spec Deep-Dive',
  'Ekspert & Autoritet',
  'Risikofri / Garanti-fokus',
  'Transparens & Priskalkyle'
];

const DURATION_OPTIONS = [
  '15 sekunder', '20 sekunder', '25 sekunder', '30 sekunder', '35 sekunder',
  '40 sekunder', '45 sekunder', '50 sekunder', '55 sekunder', '60 sekunder'
];

const HOOK_TYPE_IDS = [
  'Pattern interrupt',
  'Loss aversion',
  'Specificitet',
  'Status',
  'Curiosity gap',
  'Identity',
  'Authority',
  'Future pacing',
  'Kontrast'
];

const AWARENESS_STAGE_IDS = ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware'];

const TRAFFIC_TYPE_IDS = ['cold', 'warm', 'hot'] as const;

const SAMPLE_EXAMPLE_DATA = {
  companyName: 'GlowSkin Scandinavia',
  companyWebsite: 'https://jpkoelogklima.dk',
  productName: 'HydraBoost C-Serum',
  competitors: ['Ordinary C-Serum', 'Ole Henriksen Truth Serum'],
  numScripts: 2,
  productDescription: 'Koldpresset C-vitamin serum med hyaluronsyre. Absorberes på 10 sekunder, gennemfugter i 24 timer og giver øjeblikkelig glød uden kemi.',
  targetAudience: 'Kvinder 25-45 år der døjer med tør/træt hud og uens hudtone, og ønsker glød uden fedtet fornemmelse.',
  demographics: 'Kvinder 25-45 år, bosat i Norden/Danmark, byboere, middel til høj indkomst, interesserede i skønhed, selvforkælelse og hudpleje.',
  offerOrCta: 'Spar 20% + Gratis fragt ved køb af 2 flasker i dag (Brug koden: SCANDI20)',
  scriptFocus: 'product' as const,
  scriptConfigs: [
    {
      scriptType: 'Problem–Solution / PAS',
      bodyDuration: '30 sekunder',
      numHooks: 3,
      awarenessStage: 'Problem Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Pattern Interrupt', 'Loss Aversion', 'Curiosity Gap'],
      mustInclude: "Offer: 'Spar 20% + Gratis fragt', vis flasken og dråberne i nærbillede, fremhæv at den ikke klistrer, og nævn 100 dages tilfredshedsgaranti."
    },
    {
      scriptType: 'Testimonial / UGC',
      bodyDuration: '30 sekunder',
      numHooks: 3,
      awarenessStage: 'Product Aware',
      trafficType: 'warm' as const,
      retargetingNotes: "Glemte varer i kurven, fremhæv koden 'KOMTILBAGE15' for 15% ekstra rabat og nævn at vi har over 4.800 5-stjernede anmeldelser.",
      preferredHookTypes: ['Specificitet', 'Authority', 'Status'],
      mustInclude: "UGC følelse foran spejlet, 'Jeg var så tæt på at give op...', vis før/efter resultat på huden."
    },
    {
      scriptType: 'Humor & Skæv Vinkel',
      bodyDuration: '25 sekunder',
      numHooks: 3,
      awarenessStage: 'Unaware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Pattern Interrupt', 'Kontrast'],
      mustInclude: "Sammenlign med at hælde fedtet olie i ansigtet vs denne lette konsistens."
    },
    {
      scriptType: 'Comparison (Us vs Competitors)',
      bodyDuration: '35 sekunder',
      numHooks: 3,
      awarenessStage: 'Solution Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Kontrast', 'Specificitet'],
      mustInclude: "2-kolonne sammenligning vs almindelige serummer: Ingen parfume, 100% vegansk, fremstillet i Danmark."
    },
    {
      scriptType: 'Educational / Explainer',
      bodyDuration: '40 sekunder',
      numHooks: 3,
      awarenessStage: 'Problem Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Authority', 'Future Pacing'],
      mustInclude: "Forklar hvorfor løsningen virker bedre på en enkel måde."
    },
    {
      scriptType: 'Story-Driven / Narrative',
      bodyDuration: '45 sekunder',
      numHooks: 3,
      awarenessStage: 'Problem Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Future Pacing', 'Identity'],
      mustInclude: "Personlig historie og identifikation med målgruppens situation."
    },
    {
      scriptType: 'Tips & Hacks',
      bodyDuration: '30 sekunder',
      numHooks: 3,
      awarenessStage: 'Unaware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Curiosity Gap', 'Pattern Interrupt'],
      mustInclude: "3 hurtige tips hvor produktet indgår som den hemmelige genvej."
    },
    {
      scriptType: 'Founder Story & Behind the Scenes',
      bodyDuration: '50 sekunder',
      numHooks: 3,
      awarenessStage: 'Solution Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Authority', 'Identity'],
      mustInclude: "Autentisk historie fra stifteren om missionen bag virksomheden."
    }
  ]
};

/**
 * Opsætning pr. script når formularen er tom. Samme spredning af typer, varigheder
 * og stadier som eksemplet, men uden en linje kundetekst: intet "Skal med i script"
 * og ingen retargeting-noter, så en anden kundes tilbud aldrig kan slippe med ind
 * i manuskripterne. Formularen starter tom ved hver indlæsning.
 */
const BLANK_SCRIPT_CONFIGS = SAMPLE_EXAMPLE_DATA.scriptConfigs.map((cfg: any) => {
  const { mustInclude, retargetingNotes, ...setup } = cfg;
  return { ...setup, mustInclude: '' };
});

export const ScriptForm: React.FC<ScriptFormProps> = ({
  onSubmit,
  isLoading,
  initialData,
  onSaveAsCustomer
}) => {
  const { t, lang, setLang } = useLang();

  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [documentTitle, setDocumentTitle] = useState(
    initialData?.documentTitle || (initialData?.companyName ? `${initialData.companyName} - Script 2` : '')
  );
  const [companyWebsite, setCompanyWebsite] = useState(initialData?.companyWebsite || '');
  const [analysisDoc, setAnalysisDoc] = useState<AnalysisDocument | null>(initialData?.analysisDocument || null);
  const [toneOfVoice, setToneOfVoice] = useState(initialData?.toneOfVoice || '');
  const [isReadingDoc, setIsReadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productName, setProductName] = useState(initialData?.productName || '');
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(initialData?.competitors || []);
  const [numScripts, setNumScripts] = useState<number>(initialData?.numScripts || 2);
  const [activeTab, setActiveTab] = useState<number>(0);

  const defaultPresets = BLANK_SCRIPT_CONFIGS;

  const [scriptConfigs, setScriptConfigs] = useState(() => {
    if (initialData?.scriptConfigs && initialData.scriptConfigs.length > 0) {
      const merged = [...defaultPresets];
      initialData.scriptConfigs.forEach((cfg, idx) => {
        if (merged[idx]) merged[idx] = { ...merged[idx], ...cfg };
      });
      return merged;
    }
    return defaultPresets;
  });

  const [productDescription, setProductDescription] = useState(initialData?.productDescription || '');
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || '');
  const [demographics, setDemographics] = useState(initialData?.demographics || '');
  const [offerOrCta, setOfferOrCta] = useState(initialData?.offerOrCta || '');
  const [scriptFocus, setScriptFocus] = useState<'product' | 'lead'>(initialData?.scriptFocus || 'product');

  // Automatisk udfyldning ud fra den uploadede analyse
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<{
    summary: string;
    filled: string[];
    usedWebsite: boolean;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const undoRef = useRef<(() => void) | null>(null);

  // Forslag til stil og hook-vinkler
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  /** Skriver de fundne felter ind i formularen og lægger en fortryd-handling til rette. */
  const applyBriefFields = (fields: Record<string, any>) => {
    const snapshot = {
      companyName,
      productName,
      productDescription,
      targetAudience,
      demographics,
      offerOrCta,
      competitors,
      toneOfVoice,
      scriptConfigs
    };

    undoRef.current = () => {
      setCompanyName(snapshot.companyName);
      setProductName(snapshot.productName);
      setProductDescription(snapshot.productDescription);
      setTargetAudience(snapshot.targetAudience);
      setDemographics(snapshot.demographics);
      setOfferOrCta(snapshot.offerOrCta);
      setCompetitors(snapshot.competitors);
      setToneOfVoice(snapshot.toneOfVoice);
      setScriptConfigs(snapshot.scriptConfigs);
      setAnalysisNotice(null);
      undoRef.current = null;
    };

    // Analysen er eneste kilde: felter uden dækning i materialet ryddes i stedet for at
    // beholde eksempel- eller kundedata, som AI'en ellers ville skrive scripts ud fra.
    const filled: string[] = [];
    const set = (label: string, value: string, setter: (v: string) => void) => {
      const clean = typeof value === 'string' ? value.trim() : '';
      setter(clean);
      if (clean) filled.push(label);
    };

    set(t.form.fieldLabels.companyName, fields.companyName, (v) => {
      setCompanyName(v);
      if (v) setDocumentTitle(`${v} - Script 2`);
    });
    set(t.form.fieldLabels.productName, fields.productName, setProductName);
    set(t.form.fieldLabels.productDescription, fields.productDescription, setProductDescription);
    set(t.form.fieldLabels.targetAudience, fields.targetAudience, setTargetAudience);
    set(t.form.fieldLabels.demographics, fields.demographics, setDemographics);
    set(t.form.fieldLabels.offerOrCta, fields.offerOrCta, setOfferOrCta);
    set(t.form.fieldLabels.toneOfVoice, fields.toneOfVoice, setToneOfVoice);

    const foundCompetitors = Array.isArray(fields.competitors)
      ? fields.competitors.filter((c: any) => typeof c === 'string' && c.trim()).slice(0, 3)
      : [];
    setCompetitors(foundCompetitors);
    if (foundCompetitors.length > 0) filled.push(t.form.fieldLabels.competitors);

    // Ryd alle overstyringer og eksempeltekster pr. script, så intet fra en anden kunde
    // slipper med over i manuskripterne. Opsætningen (type, varighed, hooks) bevares.
    setScriptConfigs((configs) =>
      configs.map((cfg) => {
        const next: any = { ...cfg };
        (['productDescription', 'targetAudience', 'demographics', 'offerOrCta'] as const).forEach((key) => {
          delete next[key];
        });
        next.mustInclude = '';
        next.retargetingNotes = '';
        return next;
      })
    );

    return filled;
  };

  /** Sender dokumentet til serveren og udfylder formularen med det der står i det. */
  const analyseDocument = async (doc: AnalysisDocument) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisNotice(null);

    try {
      const res = await fetch('/api/analyze-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisDocument: doc,
          companyWebsite: companyWebsite.trim(),
          scriptFocus
        })
      });
      const data = await res.json();

      if (!data.success) {
        setAnalysisError(data.error || t.form.couldNotReadAnalysis);
        return;
      }

      // Gem den udtrukne tekst på dokumentet, så kunden kan gemmes uden at læse filen igen
      if (data.extractedText) {
        setAnalysisDoc((current) =>
          current ? { ...current, extractedText: data.extractedText } : current
        );
      }

      const filled = applyBriefFields(data.fields || {});
      setAnalysisNotice({
        summary: data.summary || '',
        filled,
        usedWebsite: !!data.usedWebsite
      });
    } catch (err) {
      console.error('Fejl ved analyse af dokument:', err);
      setAnalysisError(t.form.serverUnreachable);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingDoc(true);
    setAnalysisError(null);
    setAnalysisNotice(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setIsReadingDoc(false);
        return;
      }

      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      const doc: AnalysisDocument = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: base64Data,
        size: file.size
      };

      setAnalysisDoc(doc);
      setIsReadingDoc(false);
      analyseDocument(doc);
    };

    reader.onerror = (error) => {
      console.error('Fejl ved indlæsning af fil:', error);
      setIsReadingDoc(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFillExampleData = () => {
    setAnalysisNotice(null);
    setCompanyName(SAMPLE_EXAMPLE_DATA.companyName);
    setDocumentTitle(`${SAMPLE_EXAMPLE_DATA.companyName} - Script 2`);
    setCompanyWebsite(SAMPLE_EXAMPLE_DATA.companyWebsite);
    setProductName(SAMPLE_EXAMPLE_DATA.productName);
    setCompetitors(SAMPLE_EXAMPLE_DATA.competitors);
    setNumScripts(SAMPLE_EXAMPLE_DATA.numScripts);
    setProductDescription(SAMPLE_EXAMPLE_DATA.productDescription);
    setTargetAudience(SAMPLE_EXAMPLE_DATA.targetAudience);
    setDemographics(SAMPLE_EXAMPLE_DATA.demographics);
    setOfferOrCta(SAMPLE_EXAMPLE_DATA.offerOrCta);
    setScriptFocus(SAMPLE_EXAMPLE_DATA.scriptFocus);
    setScriptConfigs(SAMPLE_EXAMPLE_DATA.scriptConfigs);
  };

  const handleAddCompetitor = () => {
    const trimmed = competitorInput.trim();
    if (trimmed && competitors.length < 3 && !competitors.includes(trimmed)) {
      setCompetitors([...competitors, trimmed]);
      setCompetitorInput('');
    }
  };

  const handleRemoveCompetitor = (indexToRemove: number) => {
    setCompetitors(competitors.filter((_, idx) => idx !== indexToRemove));
  };

  const updateCurrentScriptConfig = (field: string, value: any) => {
    const updated = [...scriptConfigs];
    updated[activeTab] = { ...updated[activeTab], [field]: value };
    setScriptConfigs(updated);
  };

  const setHookAngleForHookIndex = (hookIndex: number, angleId: string) => {
    const cfg = scriptConfigs[activeTab] || defaultPresets[0];
    const hooks = cfg.numHooks || 3;
    const currentHooks = [...(cfg.preferredHookTypes || [])];

    for (let i = 0; i < hooks; i++) {
      if (!currentHooks[i]) currentHooks[i] = HOOK_TYPE_IDS[i % HOOK_TYPE_IDS.length];
    }

    currentHooks[hookIndex] = angleId;
    updateCurrentScriptConfig('preferredHookTypes', currentHooks.slice(0, hooks));
  };

  const handleApplyToAll = () => {
    const current = scriptConfigs[activeTab];
    setScriptConfigs(scriptConfigs.map(() => ({ ...current })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const activeConfigs = scriptConfigs.slice(0, numScripts);

    onSubmit({
      documentTitle: documentTitle.trim() || `${companyName.trim()} - Script 2`,
      companyName: companyName.trim(),
      companyWebsite: companyWebsite.trim(),
      analysisDocument: analysisDoc || undefined,
      productName: productName.trim(),
      competitors,
      numScripts,
      scriptConfigs: activeConfigs,
      numHooksPerScript: activeConfigs[0]?.numHooks || 3,
      bodyDuration: activeConfigs[0]?.bodyDuration || '30 sekunder',
      scriptType: activeConfigs[0]?.scriptType || 'UGC (User Generated Content)',
      productDescription: productDescription.trim(),
      targetAudience: targetAudience.trim(),
      demographics: demographics.trim(),
      offerOrCta: offerOrCta.trim(),
      scriptFocus,
      language: lang,
      toneOfVoice: toneOfVoice.trim() || undefined
    });
  };

  const collectCustomerData = (): Partial<ScriptRequest> => ({
    companyName: companyName.trim(),
    companyWebsite: companyWebsite.trim(),
    productName: productName.trim(),
    productDescription: productDescription.trim(),
    targetAudience: targetAudience.trim(),
    demographics: demographics.trim(),
    offerOrCta: offerOrCta.trim(),
    competitors,
    toneOfVoice: toneOfVoice.trim() || undefined,
    analysisDocument: analysisDoc || undefined
  });

  const currentCfg = scriptConfigs[activeTab] || defaultPresets[0];
  const activeTemp = normalizeTrafficTemperature(currentCfg.trafficType);
  const selectedTypeDesc = t.scriptTypeDescs[currentCfg.scriptType];

  /**
   * Felter der bærer scriptets kvalitet. Efter en analyse markeres de tomme,
   * så man kan se hvad analysen ikke dækkede. Beregnes løbende, så markeringen
   * forsvinder i samme øjeblik feltet udfyldes.
   */
  const briefFields = [
    { label: t.form.productName, empty: !productName.trim() },
    {
      label: scriptFocus === 'lead' ? t.form.productDescLead : t.form.productDescProduct,
      empty: !(currentCfg.productDescription ?? productDescription).trim()
    },
    { label: t.form.targetAudience, empty: !(currentCfg.targetAudience ?? targetAudience).trim() },
    { label: t.form.demographics, empty: !(currentCfg.demographics ?? demographics).trim() },
    { label: t.form.cta, empty: !(currentCfg.offerOrCta ?? offerOrCta).trim() },
    { label: t.form.competitors, empty: competitors.length === 0 },
    { label: t.form.toneLabel, empty: !toneOfVoice.trim() }
  ];
  const missingFields = analysisNotice ? briefFields.filter((f) => f.empty).map((f) => f.label) : [];

  /** "Mangler"-mærkat på et tomt felt, kun efter en analyse. */
  const missingMark = (isEmpty: boolean) =>
    analysisNotice && isEmpty ? (
      <span className="font-mono text-[11px] uppercase tracking-wider text-rec">{t.form.missingBadge}</span>
    ) : undefined;

  /** Sætter en hel række hook-vinkler ind på det aktive script. */
  const applyHookAngles = (ids: string[]) => {
    const hooks = currentCfg.numHooks || 3;
    const next = [...(currentCfg.preferredHookTypes || [])];
    for (let i = 0; i < hooks; i++) {
      if (ids[i]) next[i] = ids[i];
      else if (!next[i]) next[i] = HOOK_TYPE_IDS[i % HOOK_TYPE_IDS.length];
    }
    updateCurrentScriptConfig('preferredHookTypes', next.slice(0, hooks));
  };

  const advisorPayload = {
    analysisDocument: analysisDoc || undefined,
    brief: {
      companyName: companyName.trim(),
      productName: productName.trim(),
      productDescription: (currentCfg.productDescription ?? productDescription).trim(),
      targetAudience: (currentCfg.targetAudience ?? targetAudience).trim(),
      demographics: (currentCfg.demographics ?? demographics).trim(),
      offerOrCta: (currentCfg.offerOrCta ?? offerOrCta).trim(),
      competitors
    },
    awarenessStage: currentCfg.awarenessStage || 'Problem Aware',
    trafficType: activeTemp,
    bodyDuration: currentCfg.bodyDuration,
    numHooks: currentCfg.numHooks || 3,
    scriptFocus,
    scriptTypes: SCRIPT_TYPES,
    hookAngles: HOOK_TYPE_IDS.map((id) => ({ id, label: id, desc: t.hookAngles[id]?.desc || '' }))
  };
  const activeStageId = currentCfg.awarenessStage || 'Problem Aware';
  const activeStage = t.awareness[activeStageId];
  const activeTraffic = t.traffic[activeTemp];

  const segmentCls = (active: boolean) =>
    `px-3.5 py-2 rounded-[6px] text-[15px] font-semibold transition-colors cursor-pointer ${
      active ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(22_24_29/0.1)]' : 'text-muted hover:text-ink'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-28">

      {/* ------------------------------------------------ 1. Kunde & produkt */}
      <Section
        id="kunde"
        step={1}
        title={t.form.section1Title}
        description={t.form.section1Desc}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleFillExampleData} className={buttonStyles.ghost}>
              <Sparkles className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              {t.form.exampleData}
            </button>
            <div className="segment-track grid-cols-2">
              <button
                type="button"
                onClick={() => setLang('da')}
                className={`${segmentCls(lang === 'da')} flex items-center justify-center gap-2`}
                aria-pressed={lang === 'da'}
              >
                <FlagDK />
                Dansk
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`${segmentCls(lang === 'en')} flex items-center justify-center gap-2`}
                aria-pressed={lang === 'en'}
              >
                <FlagGB />
                English
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Field label={t.form.companyName} required htmlFor="companyName">
            <input
              id="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setDocumentTitle(`${e.target.value} - Script 2`);
              }}
              placeholder={t.form.companyPlaceholder}
              className="control"
            />
          </Field>

          <Field label={t.form.website} hint={t.form.websiteHint} htmlFor="companyWebsite">
            <input
              id="companyWebsite"
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://..."
              className="control font-mono text-[15px]"
            />
          </Field>

          <Field
            label={t.form.productName}
            meta={missingMark(!productName.trim()) ?? t.form.optional}
            htmlFor="productName"
          >
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={scriptFocus === 'lead' ? t.form.productPlaceholderLead : t.form.productPlaceholderProduct}
              className="control"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Field label={t.form.focusLabel}>
            <div className="segment-track grid-cols-2">
              <button type="button" onClick={() => setScriptFocus('product')} className={`${segmentCls(scriptFocus === 'product')} flex items-center justify-center gap-1.5`}>
                <ShoppingBag className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                {t.form.focusProduct}
              </button>
              <button type="button" onClick={() => setScriptFocus('lead')} className={`${segmentCls(scriptFocus === 'lead')} flex items-center justify-center gap-1.5`}>
                <UserPlus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                {t.form.focusLeads}
              </button>
            </div>
          </Field>

          <div className="lg:col-span-2">
            <Field
              label={t.form.competitors}
              meta={missingMark(competitors.length === 0) ?? t.form.nOf3(competitors.length)}
              htmlFor="competitor"
            >
              <div className="flex gap-2">
                <input
                  id="competitor"
                  type="text"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCompetitor();
                    }
                  }}
                  disabled={competitors.length >= 3}
                  placeholder={competitors.length >= 3 ? t.form.competitorMax : t.form.competitorPlaceholder}
                  className="control"
                />
                <button
                  type="button"
                  onClick={handleAddCompetitor}
                  disabled={!competitorInput.trim() || competitors.length >= 3}
                  className={buttonStyles.secondary}
                >
                  <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  {t.form.add}
                </button>
              </div>
              {competitors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {competitors.map((comp, idx) => (
                    <span
                      key={comp}
                      className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-sunken border border-line-strong text-ink text-[14.5px] rounded-[var(--radius-control)] font-medium"
                    >
                      {comp}
                      <button
                        type="button"
                        onClick={() => handleRemoveCompetitor(idx)}
                        className="text-muted hover:text-rec transition-colors cursor-pointer"
                        aria-label={t.form.removeCompetitor(comp)}
                      >
                        <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <Field
            label={t.form.analysisLabel}
            hint={t.form.analysisHint}
          >
            {!analysisDoc ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-line-strong hover:border-ink/40 bg-sunken hover:bg-line/40 rounded-[var(--radius-control)] px-4 py-5 flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                <span className="font-semibold text-[15.5px] text-ink">
                  {isReadingDoc ? t.form.readingFile : t.form.uploadAnalysis}
                </span>
              </button>
            ) : (
              <div className="border border-line-strong rounded-[var(--radius-control)] overflow-hidden">
                <div className="flex items-center justify-between gap-3 bg-sunken px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck className="w-5 h-5 text-ink shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[15.5px] text-ink truncate">{analysisDoc.name}</p>
                      <p className="field-hint">
                        {analysisDoc.size ? `${(analysisDoc.size / 1024).toFixed(0)} KB` : t.form.docAttached} · {t.form.usedAsBasis}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => analyseDocument(analysisDoc)}
                      disabled={isAnalyzing}
                      className="chip-btn"
                      title={t.form.refillTitle}
                    >
                      <Wand2
                        className={`w-3.5 h-3.5 text-muted ${isAnalyzing ? 'animate-pulse' : ''}`}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      {isAnalyzing ? t.form.reading : t.form.fillFields}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalysisDoc(null);
                        setAnalysisNotice(null);
                        setAnalysisError(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1.5 text-muted hover:text-rec rounded-[6px] transition-colors cursor-pointer"
                      aria-label={t.form.removeDoc}
                    >
                      <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Status på den automatiske udfyldning */}
                {(isAnalyzing || analysisError || analysisNotice) && (
                  <div className="border-t border-line px-4 py-3 bg-surface" aria-live="polite">
                    {isAnalyzing && (
                      <p className="flex items-center gap-2.5 text-[15px] text-ink">
                        <span className="rec-dot rec-blink" aria-hidden="true" />
                        {t.form.analyzing}
                      </p>
                    )}

                    {!isAnalyzing && analysisError && (
                      <p className="text-[15px] text-ink">
                        <span className="font-semibold">{t.form.couldNotFill} </span>
                        {analysisError}
                      </p>
                    )}

                    {!isAnalyzing && analysisNotice && (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[15px] text-ink">
                            <span className="font-semibold">
                              {analysisNotice.filled.length > 0
                                ? t.form.fieldsFilled(analysisNotice.filled.length)
                                : t.form.nothingFilled}
                            </span>{' '}
                            {analysisNotice.summary}
                          </p>
                          {analysisNotice.filled.length > 0 && (
                            <button
                              type="button"
                              onClick={() => undoRef.current?.()}
                              className="chip-btn shrink-0"
                            >
                              <Undo2 className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                              {t.form.undo}
                            </button>
                          )}
                        </div>

                        {analysisNotice.filled.length > 0 && (
                          <p className="field-hint">{t.form.filledLabel} {analysisNotice.filled.join(', ')}.</p>
                        )}

                        {missingFields.length > 0 ? (
                          <div className="flex items-start gap-2.5 bg-rec-soft border border-rec/30 rounded-[var(--radius-control)] px-3.5 py-3">
                            <AlertTriangle className="w-4 h-4 text-rec shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                            <div className="min-w-0">
                              <p className="font-semibold text-[15px] text-ink">
                                {t.form.missingHeading(missingFields.length)}
                              </p>
                              <p className="field-hint">{t.form.missingHelp}</p>
                              <ul className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                                {missingFields.map((label) => (
                                  <li
                                    key={label}
                                    className="text-[14.5px] text-ink bg-surface border border-rec/30 rounded px-2 py-0.5"
                                  >
                                    {label}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <p className="flex items-center gap-2 text-[15px] text-ink">
                            <Check className="w-4 h-4 text-rec shrink-0" strokeWidth={2.5} aria-hidden="true" />
                            {t.form.allFilled}
                          </p>
                        )}

                        {analysisNotice.usedWebsite && (
                          <p className="field-hint">{t.form.websiteUsed}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Field>
        </div>

        <div className="border-t border-line pt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label={scriptFocus === 'lead' ? t.form.productDescLead : t.form.productDescProduct}
            meta={missingMark(!(currentCfg.productDescription ?? productDescription).trim())}
          >
            <textarea
              rows={4}
              value={currentCfg.productDescription ?? productDescription}
              onChange={(e) => {
                updateCurrentScriptConfig('productDescription', e.target.value);
                if (activeTab === 0) setProductDescription(e.target.value);
              }}
              placeholder={t.form.productDescPlaceholder}
              className="control resize-y"
            />
          </Field>

          <Field
            label={t.form.targetAudience}
            meta={missingMark(!(currentCfg.targetAudience ?? targetAudience).trim())}
          >
            <textarea
              rows={4}
              value={currentCfg.targetAudience ?? targetAudience}
              onChange={(e) => {
                updateCurrentScriptConfig('targetAudience', e.target.value);
                if (activeTab === 0) setTargetAudience(e.target.value);
              }}
              placeholder={t.form.targetAudiencePlaceholder}
              className="control resize-y"
            />
          </Field>

          <Field
            label={t.form.demographics}
            meta={missingMark(!(currentCfg.demographics ?? demographics).trim())}
          >
            <textarea
              rows={4}
              value={currentCfg.demographics ?? demographics}
              onChange={(e) => {
                updateCurrentScriptConfig('demographics', e.target.value);
                if (activeTab === 0) setDemographics(e.target.value);
              }}
              placeholder={t.form.demographicsPlaceholder}
              className="control resize-y"
            />
          </Field>

          <Field
            label={t.form.cta}
            meta={missingMark(!(currentCfg.offerOrCta ?? offerOrCta).trim())}
          >
            <textarea
              rows={4}
              value={currentCfg.offerOrCta ?? offerOrCta}
              onChange={(e) => {
                updateCurrentScriptConfig('offerOrCta', e.target.value);
                if (activeTab === 0) setOfferOrCta(e.target.value);
              }}
              placeholder={t.form.ctaPlaceholder}
              className="control resize-y"
            />
          </Field>
        </div>

        {onSaveAsCustomer && (
          <div className="border-t border-line pt-5 flex justify-end">
            <button
              type="button"
              onClick={() => onSaveAsCustomer(collectCustomerData())}
              disabled={!companyName.trim()}
              className={buttonStyles.ghost}
            >
              <Plus className="w-4 h-4 text-muted" strokeWidth={2} aria-hidden="true" />
              {t.form.saveAsCustomer}
            </button>
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------ 2. Scripts */}
      <Section
        id="scripts"
        step={2}
        title={t.form.section2Title}
        description={t.form.section2Desc}
      >
        <Field label={t.form.numScripts} meta={t.form.scriptCount(numScripts)}>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={8}
              value={numScripts}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setNumScripts(val);
                if (activeTab >= val) setActiveTab(val - 1);
              }}
              className="flex-1 h-2 cursor-pointer"
              aria-label={t.form.numScripts}
            />
            <span className="font-mono text-[20px] font-medium text-ink w-8 text-right tabular-nums">{numScripts}</span>
          </div>
        </Field>

        {/* Faneblade pr. script */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex gap-1.5 overflow-x-auto" role="tablist">
            {Array.from({ length: numScripts }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={activeTab === idx}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 rounded-[var(--radius-control)] text-[15.5px] font-semibold transition-colors shrink-0 cursor-pointer border ${
                  activeTab === idx
                    ? 'bg-ink border-ink text-white'
                    : 'bg-surface border-line-strong text-muted hover:text-ink hover:border-ink/35'
                }`}
              >
                {t.form.scriptTab(idx + 1)}
              </button>
            ))}
          </div>

          {numScripts > 1 && (
            <button type="button" onClick={handleApplyToAll} className={buttonStyles.ghost}>
              <Copy className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              {t.form.copyToAll}
            </button>
          )}
        </div>

        {/* Opsætning for det aktive script */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label={t.form.duration} htmlFor="duration">
              <select
                id="duration"
                value={currentCfg.bodyDuration}
                onChange={(e) => updateCurrentScriptConfig('bodyDuration', e.target.value)}
                className="control"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{formatDuration(d, lang)}</option>
                ))}
              </select>
            </Field>

            <Field label={t.form.numHooks} meta={t.form.hookCount(currentCfg.numHooks)}>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={currentCfg.numHooks}
                  onChange={(e) => updateCurrentScriptConfig('numHooks', parseInt(e.target.value))}
                  className="flex-1 h-2 cursor-pointer"
                  aria-label={t.form.numHooks}
                />
                <span className="font-mono text-[20px] font-medium text-ink w-8 text-right tabular-nums">
                  {currentCfg.numHooks}
                </span>
              </div>
            </Field>
          </div>

          {/* Script-stil */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 mb-2">
              <span className="field-label mb-0">{t.form.styleLabel}</span>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="field-hint">{t.form.chooseBetween(SCRIPT_TYPES.length)}</span>
                <button
                  type="button"
                  onClick={() => setIsAdvisorOpen(true)}
                  className="chip-btn"
                  title={t.form.suggestTitle}
                >
                  <Wand2 className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  {t.form.suggestFromAnalysis}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {SCRIPT_TYPES.map((type) => {
                const isSelected = currentCfg.scriptType === type;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => updateCurrentScriptConfig('scriptType', type)}
                    aria-pressed={isSelected}
                    title={t.scriptTypeDescs[type]}
                    className={`flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-[var(--radius-control)] border text-[15px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-rec bg-rec-soft text-ink font-semibold ring-1 ring-rec'
                        : 'border-line bg-surface text-muted hover:text-ink hover:border-line-strong'
                    }`}
                  >
                    <span className="truncate">{type}</span>
                    {isSelected && <Check className="w-4 h-4 text-rec shrink-0" strokeWidth={2.5} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {selectedTypeDesc && <p className="field-hint mt-2.5">{selectedTypeDesc}</p>}
          </div>

          {/* Awareness */}
          <Disclosure title={t.form.awarenessTitle} summary={activeStageId}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {AWARENESS_STAGE_IDS.map((id) => (
                  <ChoiceButton
                    key={id}
                    selected={(currentCfg.awarenessStage || 'Problem Aware') === id}
                    onClick={() => updateCurrentScriptConfig('awarenessStage', id)}
                    title={id}
                    description={t.awareness[id]?.desc}
                    meta={
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted shrink-0">
                        {t.awareness[id]?.badge}
                      </span>
                    }
                  />
                ))}
              </div>
              {activeStage && (
                <p className="field-hint border-t border-line pt-3">
                  <span className="font-semibold text-ink">{t.form.focus} </span>
                  {activeStage.focus}
                </p>
              )}
            </div>
          </Disclosure>

          {/* Trafik */}
          <Disclosure title={t.form.trafficTitle} summary={activeTraffic?.title}>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TRAFFIC_TYPE_IDS.map((id) => (
                  <ChoiceButton
                    key={id}
                    selected={activeTemp === id}
                    onClick={() => updateCurrentScriptConfig('trafficType', id)}
                    title={t.traffic[id].title}
                    description={t.traffic[id].desc}
                    meta={
                      activeTemp === id ? (
                        <Check className="w-4 h-4 text-rec shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted shrink-0">
                          {t.traffic[id].sub}
                        </span>
                      )
                    }
                  />
                ))}
              </div>

              {activeTemp !== 'cold' && (
                <Field label={t.form.retargetingNotes} hint={t.form.retargetingHint}>
                  <input
                    type="text"
                    value={currentCfg.retargetingNotes || ''}
                    onChange={(e) => updateCurrentScriptConfig('retargetingNotes', e.target.value)}
                    placeholder={t.form.retargetingPlaceholder}
                    className="control"
                  />
                </Field>
              )}
            </div>
          </Disclosure>

          {/* Hook-vinkler */}
          <Disclosure
            title={t.form.hookAnglesTitle}
            summary={t.form.angleCount(currentCfg.numHooks)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: currentCfg.numHooks || 3 }).map((_, hookIdx) => {
                const currentHooksList = currentCfg.preferredHookTypes || [];
                const selectedAngleId = currentHooksList[hookIdx] || HOOK_TYPE_IDS[hookIdx % HOOK_TYPE_IDS.length];
                const selectedAngle = t.hookAngles[selectedAngleId] || t.hookAngles[HOOK_TYPE_IDS[0]];

                return (
                  <Field key={hookIdx} label={t.form.hookN(hookIdx + 1)}>
                    <select
                      value={selectedAngleId}
                      onChange={(e) => setHookAngleForHookIndex(hookIdx, e.target.value)}
                      className="control"
                      aria-label={t.form.hookAngleAria(hookIdx + 1)}
                    >
                      {HOOK_TYPE_IDS.map((id) => (
                        <option key={id} value={id}>
                          {id} ({t.hookAngles[id]?.desc})
                        </option>
                      ))}
                    </select>
                    <p className="field-hint mt-1.5 italic">{selectedAngle?.example}</p>
                  </Field>
                );
              })}
            </div>
          </Disclosure>

          <Field
            label={t.form.mustInclude(activeTab + 1)}
            hint={t.form.mustIncludeHint}
          >
            <textarea
              rows={3}
              value={currentCfg.mustInclude ?? ''}
              onChange={(e) => updateCurrentScriptConfig('mustInclude', e.target.value)}
              placeholder={t.form.mustIncludePlaceholder}
              className="control resize-y"
            />
          </Field>
        </div>
      </Section>

      {/* --------------------------------------------------- 3. Tone & sprog */}
      <Section
        id="tone"
        step={3}
        title={t.form.section3Title}
        description={t.form.section3Desc}
      >
        <Field
          label={t.form.toneLabel}
          hint={t.form.toneHint}
          meta={missingMark(!toneOfVoice.trim())}
          htmlFor="toneOfVoice"
        >
          <input
            id="toneOfVoice"
            value={toneOfVoice}
            onChange={(e) => setToneOfVoice(e.target.value)}
            placeholder={t.form.tonePlaceholder}
            className="control"
          />
          {/* Forslagene stod før i en datalist, som browseren ikke viser nogen
              indgang til. Nu er de synlige knapper, man kan klikke direkte. */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {t.form.tonePresets.map((preset) => {
              const selected = toneOfVoice.trim() === preset;
              return (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setToneOfVoice(selected ? '' : preset)}
                  aria-pressed={selected}
                  className="chip-btn"
                  data-active={selected ? 'true' : 'false'}
                >
                  {selected && <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />}
                  {preset}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      {/* ------------------------------------------------ Fast handlingsbjælke */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-sm border-t border-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
          <p className="field-hint hidden sm:block truncate">
            <span className="font-semibold text-ink">{numScripts}</span>{' '}
            {numScripts === 1 ? 'script' : 'scripts'}
            <span className="mx-2 text-line-strong">·</span>
            <span className="font-semibold text-ink">{currentCfg.numHooks}</span> {t.form.hooksWord}
            <span className="mx-2 text-line-strong">·</span>
            {formatDuration(currentCfg.bodyDuration, lang)}
          </p>

          <button
            type="submit"
            disabled={isLoading || !companyName.trim()}
            className={`${buttonStyles.primary} w-full sm:w-auto px-6 py-3 text-[16px]`}
          >
            {isLoading ? (
              <>
                <span className="rec-dot rec-blink !bg-white" aria-hidden="true" />
                <span className="font-mono text-[14.5px] tracking-[0.12em] uppercase">
                  {t.form.generating(numScripts)}
                </span>
              </>
            ) : (
              <>
                {t.form.generate(numScripts)}
                <ChevronRight className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      <AngleAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        payload={advisorPayload}
        angleLabel={(id) => id}
        currentScriptType={currentCfg.scriptType}
        onApplyScriptType={(type) => updateCurrentScriptConfig('scriptType', type)}
        onApplyHookAngles={applyHookAngles}
      />
    </form>
  );
};
