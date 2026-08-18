import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  Check,
  ChevronRight,
  Square,
  ShoppingBag,
  UserPlus,
  Upload,
  FileCheck,
  Copy,
  Sparkles,
  Wand2,
  Eraser,
  Undo2,
  AlertTriangle
} from 'lucide-react';
import {
  ScriptRequest,
  ScriptType,
  AnalysisDocument,
  normalizeTrafficTemperature,
  normalizeDuration,
  normalizeHookAngle,
  DURATION_OPTIONS,
  DEFAULT_DURATION,
  HOOK_ANGLE_IDS,
  AUTO_HOOK_ANGLE,
  AiModel,
  DEFAULT_AI_MODEL,
  normalizeAiModel
} from '../types';
import { AngleAdvisorModal } from './AngleAdvisorModal';
import { HookAnglePickerModal } from './HookAnglePickerModal';
import { ScriptReviewModal } from './ScriptReviewModal';
import { Section, Field, Disclosure, ChoiceButton, buttonStyles } from './ui';
import { FlagDK, FlagGB } from './ui/flags';
import { useLang, formatDuration } from '../i18n';

interface ScriptFormProps {
  onSubmit: (request: ScriptRequest) => void;
  isLoading: boolean;
  initialData?: Partial<ScriptRequest>;
  onSaveAsCustomer?: (data: Partial<ScriptRequest>) => void;
  /** Stopper en igangværende generering, hvis man opdager en fejl i opsætningen. */
  onStop?: () => void;
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


const AWARENESS_STAGE_IDS = ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware'];

const TRAFFIC_TYPE_IDS = ['cold', 'warm', 'hot'] as const;

const SAMPLE_EXAMPLE_DATA = {
  companyName: 'GlowSkin Scandinavia',
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
      bodyDuration: '30-40 sekunder',
      numHooks: 3,
      awarenessStage: 'Problem Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Smertespørgsmålet', 'Stop med at', 'Den uafsluttede sætning'],
      mustInclude: "Offer: 'Spar 20% + Gratis fragt', vis flasken og dråberne i nærbillede, fremhæv at den ikke klistrer, og nævn 100 dages tilfredshedsgaranti."
    },
    {
      scriptType: 'Testimonial / UGC',
      bodyDuration: '30-40 sekunder',
      numHooks: 3,
      awarenessStage: 'Product Aware',
      trafficType: 'warm' as const,
      retargetingNotes: "Glemte varer i kurven, fremhæv koden 'KOMTILBAGE15' for 15% ekstra rabat og nævn at vi har over 4.800 5-stjernede anmeldelser.",
      preferredHookTypes: ['Testimonial-åbningen', 'Tal-chokket', 'Identitets-hooket'],
      mustInclude: "UGC følelse foran spejlet, 'Jeg var så tæt på at give op...', vis før/efter resultat på huden."
    },
    {
      scriptType: 'Humor & Skæv Vinkel',
      bodyDuration: '20-30 sekunder',
      numHooks: 3,
      awarenessStage: 'Unaware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Demo i sekund 1', 'Den kontroversielle påstand'],
      mustInclude: "Sammenlign med at hælde fedtet olie i ansigtet vs denne lette konsistens."
    },
    {
      scriptType: 'Comparison (Us vs Competitors)',
      bodyDuration: '30-40 sekunder',
      numHooks: 3,
      awarenessStage: 'Solution Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Den kontroversielle påstand', 'Regnestykket'],
      mustInclude: "2-kolonne sammenligning vs almindelige serummer: Ingen parfume, 100% vegansk, fremstillet i Danmark."
    },
    {
      scriptType: 'Educational / Explainer',
      bodyDuration: '40-50 sekunder',
      numHooks: 3,
      awarenessStage: 'Problem Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Ekspert-vinklen', 'Myteaflivningen'],
      mustInclude: "Forklar hvorfor løsningen virker bedre på en enkel måde."
    },
    {
      scriptType: 'Story-Driven / Narrative',
      bodyDuration: '40-50 sekunder',
      numHooks: 3,
      awarenessStage: 'Problem Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Jeg troede X, indtil Y', 'Identitets-hooket'],
      mustInclude: "Personlig historie og identifikation med målgruppens situation."
    },
    {
      scriptType: 'Tips & Hacks',
      bodyDuration: '30-40 sekunder',
      numHooks: 3,
      awarenessStage: 'Unaware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Listicle-hooket', 'Insider-viden'],
      mustInclude: "3 hurtige tips hvor produktet indgår som den hemmelige genvej."
    },
    {
      scriptType: 'Founder Story & Behind the Scenes',
      bodyDuration: '50-60 sekunder',
      numHooks: 3,
      awarenessStage: 'Solution Aware',
      trafficType: 'cold' as const,
      preferredHookTypes: ['Vi tog fejl', 'Identitets-hooket'],
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
  const { mustInclude, retargetingNotes, preferredHookTypes, ...setup } = cfg;
  // Ingen faste vinkler som udgangspunkt: AI'en vælger selv (automatisk).
  return { ...setup, mustInclude: '', preferredHookTypes: [] };
});

export const ScriptForm: React.FC<ScriptFormProps> = ({
  onSubmit,
  isLoading,
  initialData,
  onSaveAsCustomer,
  onStop
}) => {
  const { t, lang, setLang } = useLang();

  // Sekundtæller ved siden af loadingen, så man kan se at der sker noget,
  // og hvor længe det har taget.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isLoading) return;
    setElapsedSeconds(0);
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [documentTitle, setDocumentTitle] = useState(
    initialData?.documentTitle || (initialData?.companyName ? `${initialData.companyName} - Script 2` : '')
  );
  const [analysisDoc, setAnalysisDoc] = useState<AnalysisDocument | null>(initialData?.analysisDocument || null);
  const [toneOfVoice, setToneOfVoice] = useState(initialData?.toneOfVoice || '');
  const [isReadingDoc, setIsReadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productName, setProductName] = useState(initialData?.productName || '');
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(initialData?.competitors || []);
  const [numScripts, setNumScripts] = useState<number>(initialData?.numScripts || 2);
  const [aiModel, setAiModel] = useState<AiModel>(normalizeAiModel(initialData?.aiModel));
  const [activeTab, setActiveTab] = useState<number>(0);

  const defaultPresets = BLANK_SCRIPT_CONFIGS;

  const [scriptConfigs, setScriptConfigs] = useState(() => {
    if (initialData?.scriptConfigs && initialData.scriptConfigs.length > 0) {
      const merged = [...defaultPresets];
      initialData.scriptConfigs.forEach((cfg, idx) => {
        // Varigheden læses gennem normalizeDuration, så en gammel opsætning med ét
        // sekundtal ('30 sekunder') stadig rammer et gyldigt interval i listen.
        if (merged[idx]) {
          merged[idx] = { ...merged[idx], ...cfg, bodyDuration: normalizeDuration(cfg.bodyDuration) };
        }
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
  // Hvilket hook der er ved at få valgt vinkel i kort-galleriet (null = lukket)
  const [anglePickerHookIdx, setAnglePickerHookIdx] = useState<number | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  /** Sat efter "Ryd alle felter", så indholdet kan hentes tilbage med ét klik. */
  const [clearedSnapshot, setClearedSnapshot] = useState<null | (() => void)>(null);

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

  /** Filtyper vi kan læse tekst ud af. Nogle browsere sender tom mimetype, så endelsen tæller også. */
  const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md'];

  const isAcceptedFile = (file: File) =>
    ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

  const readAnalysisFile = (file: File) => {
    if (!isAcceptedFile(file)) {
      setAnalysisError(t.form.unsupportedFile(file.name));
      return;
    }

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readAnalysisFile(file);
  };

  /**
   * Træk og slip. Tælleren er nødvendig, fordi dragleave også fyrer, når musen
   * går fra feltet ind over et element inden i det: uden den ville rammen blinke.
   */
  const dragDepth = useRef(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Uden det her åbner browseren filen i stedet, hvis man rammer ved siden af feltet.
  useEffect(() => {
    const swallow = (e: DragEvent) => {
      if (Array.from(e.dataTransfer?.types || []).includes('Files')) e.preventDefault();
    };
    window.addEventListener('dragover', swallow);
    window.addEventListener('drop', swallow);
    return () => {
      window.removeEventListener('dragover', swallow);
      window.removeEventListener('drop', swallow);
    };
  }, []);

  const hasFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types || []).includes('Files');

  const handleDragEnter = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readAnalysisFile(file);
  };

  const handleFillExampleData = () => {
    setAnalysisNotice(null);
    setClearedSnapshot(null);
    setCompanyName(SAMPLE_EXAMPLE_DATA.companyName);
    setDocumentTitle(`${SAMPLE_EXAMPLE_DATA.companyName} - Script 2`);
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

  /**
   * Tømmer hele formularen, inklusive det uploadede analysedokument, og lægger
   * en fortryd-handling til rette. Opsætningen pr. script går tilbage til
   * standarden (type, varighed, hooks), så der stadig er noget at generere ud fra.
   */
  const handleClearAll = () => {
    const snapshot = {
      companyName,
      documentTitle,
      analysisDoc,
      toneOfVoice,
      productName,
      competitorInput,
      competitors,
      numScripts,
      aiModel,
      activeTab,
      scriptConfigs,
      productDescription,
      targetAudience,
      demographics,
      offerOrCta,
      scriptFocus,
      analysisNotice
    };

    setCompanyName('');
    setDocumentTitle('');
    setAnalysisDoc(null);
    setToneOfVoice('');
    setProductName('');
    setCompetitorInput('');
    setCompetitors([]);
    setNumScripts(2);
    setAiModel(DEFAULT_AI_MODEL);
    setActiveTab(0);
    setScriptConfigs(BLANK_SCRIPT_CONFIGS);
    setProductDescription('');
    setTargetAudience('');
    setDemographics('');
    setOfferOrCta('');
    setScriptFocus('product');
    setAnalysisNotice(null);
    setAnalysisError(null);
    undoRef.current = null;
    // Uden dette kan den samme fil ikke uploades igen bagefter.
    if (fileInputRef.current) fileInputRef.current.value = '';

    setClearedSnapshot(() => () => {
      setCompanyName(snapshot.companyName);
      setDocumentTitle(snapshot.documentTitle);
      setAnalysisDoc(snapshot.analysisDoc);
      setToneOfVoice(snapshot.toneOfVoice);
      setProductName(snapshot.productName);
      setCompetitorInput(snapshot.competitorInput);
      setCompetitors(snapshot.competitors);
      setNumScripts(snapshot.numScripts);
      setAiModel(snapshot.aiModel);
      setActiveTab(snapshot.activeTab);
      setScriptConfigs(snapshot.scriptConfigs);
      setProductDescription(snapshot.productDescription);
      setTargetAudience(snapshot.targetAudience);
      setDemographics(snapshot.demographics);
      setOfferOrCta(snapshot.offerOrCta);
      setScriptFocus(snapshot.scriptFocus);
      setAnalysisNotice(snapshot.analysisNotice);
      setClearedSnapshot(null);
    });
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
      if (!currentHooks[i]) currentHooks[i] = AUTO_HOOK_ANGLE;
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
      analysisDocument: analysisDoc || undefined,
      productName: productName.trim(),
      competitors,
      numScripts,
      scriptConfigs: activeConfigs,
      numHooksPerScript: activeConfigs[0]?.numHooks || 3,
      bodyDuration: activeConfigs[0]?.bodyDuration || DEFAULT_DURATION,
      scriptType: activeConfigs[0]?.scriptType || 'UGC (User Generated Content)',
      productDescription: productDescription.trim(),
      targetAudience: targetAudience.trim(),
      demographics: demographics.trim(),
      offerOrCta: offerOrCta.trim(),
      scriptFocus,
      language: lang,
      toneOfVoice: toneOfVoice.trim() || undefined,
      aiModel
    });
  };

  const collectCustomerData = (): Partial<ScriptRequest> => ({
    companyName: companyName.trim(),
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
      else if (!next[i]) next[i] = HOOK_ANGLE_IDS[i % HOOK_ANGLE_IDS.length];
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
    hookAngles: HOOK_ANGLE_IDS.map((id) => ({ id, label: id, desc: t.hookAngles[id]?.desc || '' }))
  };
  const activeStageId = currentCfg.awarenessStage || 'Problem Aware';
  const activeStage = t.awareness[activeStageId];
  const activeTraffic = t.traffic[activeTemp];

  /**
   * Er der overhovedet noget i formularen. Bruges til at trække fortryd-strippen
   * tilbage, så snart man begynder forfra: ellers ville et klik på "Fortryd"
   * kaste det nye indhold væk til fordel for det gamle.
   */
  const hasContent = Boolean(
    companyName.trim() ||
      productName.trim() ||
      productDescription.trim() ||
      targetAudience.trim() ||
      demographics.trim() ||
      offerOrCta.trim() ||
      toneOfVoice.trim() ||
      competitors.length ||
      analysisDoc
  );

  const segmentCls = (active: boolean) =>
    `px-3.5 py-2 rounded-[6px] text-[15px] font-semibold transition-colors cursor-pointer ${
      active ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(22_24_29/0.1)]' : 'text-muted hover:text-ink'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-28">

      {clearedSnapshot && !hasContent && (
        <div className="rounded-[10px] border border-line bg-surface-2 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[15px] text-ink">
              <span className="font-semibold">{t.form.clearedTitle}.</span> {t.form.clearedBody}
            </p>
            <button type="button" onClick={() => clearedSnapshot()} className="chip-btn shrink-0">
              <Undo2 className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} aria-hidden="true" />
              {t.form.undo}
            </button>
          </div>
        </div>
      )}

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
            <button type="button" onClick={() => setIsReviewOpen(true)} className={buttonStyles.ghost}>
              <Wand2 className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              {t.review.open}
            </button>
            <button type="button" onClick={handleClearAll} className={buttonStyles.ghost}>
              <Eraser className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              {t.form.clearAll}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
            {!analysisDoc ? (
              <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border border-dashed rounded-[var(--radius-control)] px-4 py-5 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isDraggingFile
                    ? 'border-rec bg-rec-soft'
                    : 'border-line-strong hover:border-ink/40 bg-sunken hover:bg-line/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />
                <span className="flex items-center gap-3">
                  <Upload
                    className={`w-5 h-5 ${isDraggingFile ? 'text-rec' : 'text-muted'}`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-[15.5px] text-ink">
                    {isReadingDoc
                      ? t.form.readingFile
                      : isDraggingFile
                      ? t.form.dropHere
                      : t.form.uploadAnalysis}
                  </span>
                </span>
                {!isReadingDoc && !isDraggingFile && (
                  <span className="field-hint">{t.form.dropOrClick}</span>
                )}
              </button>
              {analysisError && (
                <p className="mt-2 flex items-start gap-2 text-[15px] text-rec" aria-live="polite">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {analysisError}
                </p>
              )}
              </>
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

                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Slipper man en fil, mens der allerede ligger en, bytter den ud */}
            {analysisDoc && isDraggingFile && (
              <p className="mt-2 flex items-center gap-2 text-[15px] text-rec font-semibold">
                <Upload className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {t.form.dropToReplace}
              </p>
            )}
            </div>
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

        <Field label={t.form.aiModelLabel} hint={t.form.aiModelHint} htmlFor="ai-model">
          <select
            id="ai-model"
            value={aiModel}
            onChange={(e) => setAiModel(normalizeAiModel(e.target.value))}
            className="control"
            aria-label={t.form.aiModelLabel}
          >
            <option value="claude-fable-5">{t.form.aiModelFable}</option>
            <option value="claude-opus-5">{t.form.aiModelOpus}</option>
          </select>
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
            <Field label={t.form.duration} hint={t.form.durationHint} htmlFor="duration">
              <select
                id="duration"
                value={normalizeDuration(currentCfg.bodyDuration)}
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
                const rawChoice = currentHooksList[hookIdx] || AUTO_HOOK_ANGLE;
                const isAuto = rawChoice === AUTO_HOOK_ANGLE;
                const selectedAngleId = isAuto ? AUTO_HOOK_ANGLE : normalizeHookAngle(rawChoice);
                const angleInfo = isAuto ? null : t.hookAngles[selectedAngleId];

                return (
                  <div key={hookIdx} className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3.5 flex flex-col">
                    <span className="field-label mb-0.5">{t.form.hookN(hookIdx + 1)}</span>
                    <p className="font-semibold text-ink text-[15.5px] m-0 flex items-center gap-1.5">
                      {isAuto && <Sparkles className="w-4 h-4 text-rec shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                      {isAuto ? t.form.hookAngleAuto : selectedAngleId}
                    </p>
                    <p className="field-hint mt-0.5 flex-1">
                      {isAuto ? t.form.hookAngleAutoDesc : angleInfo?.desc}
                      {!isAuto && angleInfo?.example ? (
                        <span className="block italic mt-1">"{angleInfo.example}"</span>
                      ) : null}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <button type="button" className="chip-btn" onClick={() => setAnglePickerHookIdx(hookIdx)}>
                        {t.form.hookAngleChange}
                      </button>
                      {!isAuto && (
                        <button type="button" className="chip-btn" onClick={() => setHookAngleForHookIndex(hookIdx, AUTO_HOOK_ANGLE)}>
                          {t.form.hookAngleReset}
                        </button>
                      )}
                    </div>
                  </div>
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isLoading && onStop && (
              <button
                type="button"
                onClick={onStop}
                className={`${buttonStyles.ghost} px-5 py-3 text-[16px] shrink-0`}
              >
                <Square className="w-3.5 h-3.5 fill-current" strokeWidth={1.75} aria-hidden="true" />
                {t.form.stopGeneration}
              </button>
            )}
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
                  <span className="font-mono text-[14.5px] tabular-nums opacity-80">
                    {elapsedSeconds}s
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
      </div>

      {isReviewOpen && (
        <ScriptReviewModal
          aiModel={aiModel}
          companyName={companyName.trim()}
          onClose={() => setIsReviewOpen(false)}
        />
      )}

      {anglePickerHookIdx !== null && (
        <HookAnglePickerModal
          hookNumber={anglePickerHookIdx + 1}
          selectedId={(currentCfg.preferredHookTypes || [])[anglePickerHookIdx] || AUTO_HOOK_ANGLE}
          onSelect={(id) => setHookAngleForHookIndex(anglePickerHookIdx, id)}
          onClose={() => setAnglePickerHookIdx(null)}
        />
      )}

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
