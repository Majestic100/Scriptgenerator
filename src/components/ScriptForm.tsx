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
  Undo2
} from 'lucide-react';
import { ScriptRequest, ScriptType, AnalysisDocument } from '../types';
import { AwarenessFunnelFigure } from './AwarenessFunnelFigure';
import { Section, Field, Disclosure, ChoiceButton, buttonStyles } from './ui';

interface ScriptFormProps {
  onSubmit: (request: ScriptRequest) => void;
  isLoading: boolean;
  initialData?: Partial<ScriptRequest>;
  onSaveAsCustomer?: (data: Partial<ScriptRequest>) => void;
}

const SCRIPT_TYPES: { type: ScriptType; desc: string }[] = [
  { type: 'Problem–Solution / PAS', desc: 'Fokusér stærkt på kundens smerte før produktet introduceres som helten.' },
  { type: 'Humor & Skæv Vinkel', desc: 'Underholdende, sjov eller selvironisk tilgang der fanger opmærksomheden.' },
  { type: 'Educational / Explainer', desc: 'Pædagogisk gennemgang af problemet og hvorfor produktet er løsningen.' },
  { type: 'Lifestyle & Product in Action', desc: 'Æstetisk visuel fremvisning af produktet i brug i hverdagen.' },
  { type: 'Testimonial / UGC', desc: 'Autentisk anmeldelse og oplevelse fra en tilfreds kunde eller skuespiller.' },
  { type: 'Demonstration & How-it-Works', desc: 'Hands-on demonstration af hvordan produktet fungerer i praksis.' },
  { type: 'Before-and-After Transformation', desc: 'Dramatisk visuel kontrast før og efter brug af produktet.' },
  { type: 'Story-Driven / Narrative', desc: 'En medrivende personlig historie eller rejse der opbygger empati.' },
  { type: 'Shock / Pattern Interrupt', desc: 'Chokerende påstand eller uventet visuel start der stopper scrollen.' },
  { type: 'ASMR / Sensory Experience', desc: 'Fokus på lyde, teksturer og nærbilleder for en sanselig oplevelse.' },
  { type: 'Aesthetic / Cinematic', desc: 'Flot produceret video med lækre vinkler og eksklusiv stemning.' },
  { type: 'Comparison (Us vs Competitors)', desc: 'Direkte sammenligning af dit produkt mod konkurrenter eller alternativer.' },
  { type: 'Social Proof / Data-Backed', desc: 'Fokus på gode anmeldelser, testresultater, kliniske studier og tal.' },
  { type: 'Tips & Hacks', desc: 'Nyttige råd og genveje hvor produktet naturligt indgår som løsningen.' },
  { type: 'Green Screen / Reaction & Review', desc: 'Kreatøren står foran et screenshot af en artikel, anmeldelse eller opslag.' },
  { type: 'Unboxing & First Impression', desc: 'Spændingen ved at åbne pakken og afprøve produktet for første gang.' },
  { type: 'Founder Story & Behind the Scenes', desc: 'Personlig historie fra stifteren om hvorfor virksomheden blev skabt.' },
  { type: 'Objection Handling / Indvendingsknuser', desc: 'Tager kundens største tvivl op og aflyser den direkte i hooket.' },
  { type: 'Skeptiker → Overbevist', desc: 'Kreatøren starter som decideret skeptiker og bliver vendt af resultatet.' },
  { type: 'Myth-Busting / Aflivning af myter', desc: 'Punkterer en udbredt misforståelse i kategorien og korrigerer den.' },
  { type: 'FAQ / Rapid-Fire Q&A', desc: 'Besvarer de 3-5 mest stillede spørgsmål i højt tempo.' },
  { type: 'Anmeldelses-oplæsning', desc: 'Kreatøren læser rigtige kundeanmeldelser højt på skærmen.' },
  { type: 'Ingrediens- & Spec Deep-Dive', desc: 'Zoomer ind på én ingrediens, materiale eller teknologi og hvorfor den virker.' },
  { type: 'Ekspert & Autoritet', desc: 'Læge, tandlæge, fysioterapeut eller fagperson forklarer og validerer produktet.' },
  { type: 'Risikofri / Garanti-fokus', desc: 'Hele scriptet bygger på returret, garanti eller "prøv gratis" for at fjerne købsrisiko.' },
  { type: 'Transparens & Priskalkyle', desc: 'Bryder prisen ned i råvarer, produktion og markup for at retfærdiggøre den.' }
];

const DURATION_OPTIONS = [
  '15 sekunder', '20 sekunder', '25 sekunder', '30 sekunder', '35 sekunder',
  '40 sekunder', '45 sekunder', '50 sekunder', '55 sekunder', '60 sekunder'
];

const HOOK_TYPE_OPTIONS = [
  { id: 'Pattern interrupt', label: 'Pattern interrupt', desc: 'sig noget uventet', example: '"Stop med at bruge din almindelige pude..."' },
  { id: 'Loss aversion', label: 'Loss aversion', desc: 'folk vil hellere undgå at tabe end vinde', example: '"Du smider 500 kr. ud af vinduet hver måned..."' },
  { id: 'Specificitet', label: 'Specificitet', desc: '"37.000 kr." føles stærkere end "mange penge"', example: '"14.820 danskere har skiftet..."' },
  { id: 'Status', label: 'Status', desc: '"de bedste brands gør..."', example: '"Hvorfor de bedst præsterende bureauer..."' },
  { id: 'Curiosity gap', label: 'Curiosity gap', desc: 'hjernen vil have svaret', example: '"Der er én hemmelig grund til..."' },
  { id: 'Identity', label: 'Identity', desc: '"du er ikke typen der..."', example: '"Hvis du er typen der tager dine mål seriøst..."' },
  { id: 'Authority', label: 'Authority', desc: '"vi ser det igen og igen..."', example: '"Eksperter råber op: De fleste gør denne fejl..."' },
  { id: 'Future pacing', label: 'Future pacing', desc: '"om 6 måneder står du samme sted..."', example: '"Forestil dig hvordan din hverdag ser ud om 30 dage..."' },
  { id: 'Kontrast', label: 'Kontrast', desc: '"det er ikke X... det er Y"', example: '"Det er ikke dine evner, det er metoden..."' }
];

const AWARENESS_STAGES = [
  {
    id: 'Unaware',
    short: 'Unaware',
    badge: 'Koldest',
    desc: 'Kender hverken til problemet eller løsningen.',
    focus: 'Væk nysgerrighed, stop scrollen og afslør en uopdaget ulempe eller smerte.'
  },
  {
    id: 'Problem Aware',
    short: 'Problem Aware',
    badge: 'Middel kold',
    desc: 'Mærker problemet og frustreres i hverdagen.',
    focus: 'Spejl smerten stærkt, skab empati og introducer løsningskategorien.'
  },
  {
    id: 'Solution Aware',
    short: 'Solution Aware',
    badge: 'Middel varm',
    desc: 'Kender til løsninger, men søger den bedste mulighed.',
    focus: 'Fremhæv mekanismen og hvorfor dit produkt virker bedre end alternativer.'
  },
  {
    id: 'Product Aware',
    short: 'Product Aware',
    badge: 'Varm',
    desc: 'Kender dit produkt, men har tvivl eller indvendinger.',
    focus: 'Fjern købsmodstand, vis social proof, kunders anmeldelser og demo.'
  },
  {
    id: 'Most Aware',
    short: 'Most Aware',
    badge: 'Hot',
    desc: 'Klar til køb, mangler kun et uimodståeligt tilbud.',
    focus: 'Fokusér stærkt på tilbuddet, rabat eller bonus, garanti, urgency og CTA.'
  }
];

const TRAFFIC_TYPES = [
  {
    id: 'cold',
    title: 'Kold trafik',
    sub: 'Prospecting / nye besøgende',
    desc: 'Målrettet personer der aldrig har hørt om virksomheden før. Bygger kendskab og tillid op fra bunden.'
  },
  {
    id: 'retargeting',
    title: 'Retargeting',
    sub: 'Varm trafik / kurv-forladere',
    desc: 'Målrettet tidligere besøgende, inaktive kunder eller forladte kurve. Bruger genkendeligt sprog og lukker salget.'
  }
];

const TONE_PRESETS = [
  'Afslappet dansk talesprog, som en god ven der anbefaler',
  'Ungt og energisk, TikTok-tempo',
  'Professionelt og troværdigt, business-tone',
  'Varmt og omsorgsfuldt, empatisk',
  'Direkte og kontant, ingen omsvøb',
  'Humoristisk og selvironisk'
];

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
  language: 'da' as const,
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
      trafficType: 'retargeting' as const,
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

export const ScriptForm: React.FC<ScriptFormProps> = ({
  onSubmit,
  isLoading,
  initialData,
  onSaveAsCustomer
}) => {
  const [companyName, setCompanyName] = useState(initialData?.companyName || SAMPLE_EXAMPLE_DATA.companyName);
  const [documentTitle, setDocumentTitle] = useState(
    initialData?.documentTitle || (initialData?.companyName ? `${initialData.companyName} - Script 2` : 'JP Køl og Klima - Script 2')
  );
  const [companyWebsite, setCompanyWebsite] = useState(initialData?.companyWebsite || SAMPLE_EXAMPLE_DATA.companyWebsite);
  const [analysisDoc, setAnalysisDoc] = useState<AnalysisDocument | null>(initialData?.analysisDocument || null);
  const [toneOfVoice, setToneOfVoice] = useState(initialData?.toneOfVoice || '');
  const [explainHookPsychology, setExplainHookPsychology] = useState(!!initialData?.explainHookPsychology);
  const [isReadingDoc, setIsReadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productName, setProductName] = useState(initialData?.productName || SAMPLE_EXAMPLE_DATA.productName);
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(
    initialData?.competitors || SAMPLE_EXAMPLE_DATA.competitors
  );
  const [numScripts, setNumScripts] = useState<number>(initialData?.numScripts || SAMPLE_EXAMPLE_DATA.numScripts);
  const [activeTab, setActiveTab] = useState<number>(0);

  const defaultPresets = SAMPLE_EXAMPLE_DATA.scriptConfigs;

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

  const [productDescription, setProductDescription] = useState(initialData?.productDescription || SAMPLE_EXAMPLE_DATA.productDescription);
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || SAMPLE_EXAMPLE_DATA.targetAudience);
  const [demographics, setDemographics] = useState(initialData?.demographics || SAMPLE_EXAMPLE_DATA.demographics);
  const [offerOrCta, setOfferOrCta] = useState(initialData?.offerOrCta || SAMPLE_EXAMPLE_DATA.offerOrCta);
  const [scriptFocus, setScriptFocus] = useState<'product' | 'lead'>(initialData?.scriptFocus || SAMPLE_EXAMPLE_DATA.scriptFocus);
  const [language, setLanguage] = useState<'da' | 'en'>(initialData?.language || SAMPLE_EXAMPLE_DATA.language);

  // Automatisk udfyldning ud fra den uploadede analyse
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<{
    summary: string;
    filled: string[];
    missing: string[];
    usedWebsite: boolean;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const undoRef = useRef<(() => void) | null>(null);

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

    const filled: string[] = [];
    const set = (label: string, value: string, setter: (v: string) => void) => {
      if (value) {
        setter(value);
        filled.push(label);
      }
    };

    set('Virksomhedens navn', fields.companyName, (v) => {
      setCompanyName(v);
      setDocumentTitle(`${v} - Script 2`);
    });
    set('Produktets navn', fields.productName, setProductName);
    set('Produkt og unikke fordele', fields.productDescription, setProductDescription);
    set('Den ideelle kunde', fields.targetAudience, setTargetAudience);
    set('Geografi og demografi', fields.demographics, setDemographics);
    set('Call to action', fields.offerOrCta, setOfferOrCta);
    set('Talesprog', fields.toneOfVoice, setToneOfVoice);

    if (Array.isArray(fields.competitors) && fields.competitors.length > 0) {
      setCompetitors(fields.competitors.slice(0, 3));
      filled.push('Konkurrenter');
    }

    // Ryd tidligere overstyringer pr. script, så de nye værdier slår igennem på alle scripts
    const overridden = ['productDescription', 'targetAudience', 'demographics', 'offerOrCta'] as const;
    setScriptConfigs((configs) =>
      configs.map((cfg) => {
        const next: any = { ...cfg };
        overridden.forEach((key) => {
          if (fields[key]) delete next[key];
        });
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
        setAnalysisError(data.error || 'Kunne ikke læse analysen.');
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
        missing: data.missingFields || [],
        usedWebsite: !!data.usedWebsite
      });
    } catch (err) {
      console.error('Fejl ved analyse af dokument:', err);
      setAnalysisError('Kunne ikke få fat i serveren. Prøv igen.');
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
    setCompanyName(SAMPLE_EXAMPLE_DATA.companyName);
    setDocumentTitle('JP Køl og Klima - Script 2');
    setCompanyWebsite(SAMPLE_EXAMPLE_DATA.companyWebsite);
    setProductName(SAMPLE_EXAMPLE_DATA.productName);
    setCompetitors(SAMPLE_EXAMPLE_DATA.competitors);
    setNumScripts(SAMPLE_EXAMPLE_DATA.numScripts);
    setProductDescription(SAMPLE_EXAMPLE_DATA.productDescription);
    setTargetAudience(SAMPLE_EXAMPLE_DATA.targetAudience);
    setDemographics(SAMPLE_EXAMPLE_DATA.demographics);
    setOfferOrCta(SAMPLE_EXAMPLE_DATA.offerOrCta);
    setScriptFocus(SAMPLE_EXAMPLE_DATA.scriptFocus);
    setLanguage(SAMPLE_EXAMPLE_DATA.language);
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
      if (!currentHooks[i]) currentHooks[i] = HOOK_TYPE_OPTIONS[i % HOOK_TYPE_OPTIONS.length].id;
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
      language,
      toneOfVoice: toneOfVoice.trim() || undefined,
      explainHookPsychology
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
  const selectedType = SCRIPT_TYPES.find((st) => st.type === currentCfg.scriptType);
  const activeStage = AWARENESS_STAGES.find((s) => s.id === (currentCfg.awarenessStage || 'Problem Aware'));
  const activeTraffic = TRAFFIC_TYPES.find((t) => t.id === (currentCfg.trafficType || 'cold'));

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
        title="Kunde & produkt"
        description="Grundlaget AI'en skriver ud fra. Gem det som kunde, så du slipper for at taste det igen."
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleFillExampleData} className={buttonStyles.ghost}>
              <Sparkles className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              Eksempeldata
            </button>
            <div className="segment-track grid-cols-2">
              <button type="button" onClick={() => setLanguage('da')} className={segmentCls(language === 'da')}>
                Dansk
              </button>
              <button type="button" onClick={() => setLanguage('en')} className={segmentCls(language === 'en')}>
                English
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Field label="Virksomhedens navn" required htmlFor="companyName">
            <input
              id="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setDocumentTitle(`${e.target.value} - Script 2`);
              }}
              placeholder="f.eks. JP Køl og Klima"
              className="control"
            />
          </Field>

          <Field label="Hjemmeside" hint="AI'en læser siden og bruger den som baggrund." htmlFor="companyWebsite">
            <input
              id="companyWebsite"
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://..."
              className="control font-mono text-[15px]"
            />
          </Field>

          <Field label="Produktets navn" meta="Valgfri" htmlFor="productName">
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={scriptFocus === 'lead' ? 'f.eks. Gratis e-bog / konsultation' : 'f.eks. Hydrating Face Serum'}
              className="control"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Field label="Hvad skal scriptet sælge?">
            <div className="segment-track grid-cols-2">
              <button type="button" onClick={() => setScriptFocus('product')} className={`${segmentCls(scriptFocus === 'product')} flex items-center justify-center gap-1.5`}>
                <ShoppingBag className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                Produkt
              </button>
              <button type="button" onClick={() => setScriptFocus('lead')} className={`${segmentCls(scriptFocus === 'lead')} flex items-center justify-center gap-1.5`}>
                <UserPlus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                Leads
              </button>
            </div>
          </Field>

          <div className="lg:col-span-2">
            <Field label="Konkurrenter" meta={`${competitors.length} af 3`} htmlFor="competitor">
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
                  placeholder={competitors.length >= 3 ? 'Maksimalt 3 konkurrenter' : 'f.eks. Luminance'}
                  className="control"
                />
                <button
                  type="button"
                  onClick={handleAddCompetitor}
                  disabled={!competitorInput.trim() || competitors.length >= 3}
                  className={buttonStyles.secondary}
                >
                  <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  Tilføj
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
                        aria-label={`Fjern ${comp}`}
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
            label="Målgruppe- eller virksomhedsanalyse"
            hint="PDF, Word eller tekst. Felterne herunder udfyldes automatisk med det, der står i dokumentet."
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
                  {isReadingDoc ? 'Læser fil...' : 'Upload analyse'}
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
                        {analysisDoc.size ? `${(analysisDoc.size / 1024).toFixed(0)} KB` : 'Dokument tilknyttet'} · bruges som grundlag
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => analyseDocument(analysisDoc)}
                      disabled={isAnalyzing}
                      className="chip-btn"
                      title="Læs dokumentet igen og udfyld felterne forfra"
                    >
                      <Wand2
                        className={`w-3.5 h-3.5 text-muted ${isAnalyzing ? 'animate-pulse' : ''}`}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      {isAnalyzing ? 'Læser...' : 'Udfyld felter'}
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
                      aria-label="Fjern analysedokument"
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
                        Læser analysen og udfylder felterne...
                      </p>
                    )}

                    {!isAnalyzing && analysisError && (
                      <p className="text-[15px] text-ink">
                        <span className="font-semibold">Kunne ikke udfylde felterne. </span>
                        {analysisError}
                      </p>
                    )}

                    {!isAnalyzing && analysisNotice && (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[15px] text-ink">
                            <span className="font-semibold">
                              {analysisNotice.filled.length > 0
                                ? `${analysisNotice.filled.length} ${
                                    analysisNotice.filled.length === 1 ? 'felt' : 'felter'
                                  } udfyldt fra analysen.`
                                : 'Analysen indeholdt ikke noget der kunne udfylde felterne.'}
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
                              Fortryd
                            </button>
                          )}
                        </div>

                        {analysisNotice.filled.length > 0 && (
                          <p className="field-hint">Udfyldt: {analysisNotice.filled.join(', ')}.</p>
                        )}
                        {analysisNotice.missing.length > 0 && (
                          <p className="field-hint">
                            Stod ikke i analysen, så udfyld selv: {analysisNotice.missing.join(', ')}.
                          </p>
                        )}
                        {analysisNotice.usedWebsite && (
                          <p className="field-hint">Hjemmesiden er læst med som supplement.</p>
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
          <Field label={scriptFocus === 'lead' ? 'Ydelse og unikke fordele' : 'Produkt og unikke fordele'}>
            <textarea
              rows={4}
              value={currentCfg.productDescription ?? productDescription}
              onChange={(e) => {
                updateCurrentScriptConfig('productDescription', e.target.value);
                if (activeTab === 0) setProductDescription(e.target.value);
              }}
              placeholder="f.eks. Lavendelduft, justerbart skum og kølende side..."
              className="control resize-y"
            />
          </Field>

          <Field label="Den ideelle kunde">
            <textarea
              rows={4}
              value={currentCfg.targetAudience ?? targetAudience}
              onChange={(e) => {
                updateCurrentScriptConfig('targetAudience', e.target.value);
                if (activeTab === 0) setTargetAudience(e.target.value);
              }}
              placeholder="f.eks. folk med soveproblemer, travle forældre, boligejere..."
              className="control resize-y"
            />
          </Field>

          <Field label="Geografi og demografi">
            <textarea
              rows={4}
              value={currentCfg.demographics ?? demographics}
              onChange={(e) => {
                updateCurrentScriptConfig('demographics', e.target.value);
                if (activeTab === 0) setDemographics(e.target.value);
              }}
              placeholder="f.eks. Hele Danmark, Storkøbenhavn, inden for 50 km..."
              className="control resize-y"
            />
          </Field>

          <Field label="Call to action">
            <textarea
              rows={4}
              value={currentCfg.offerOrCta ?? offerOrCta}
              onChange={(e) => {
                updateCurrentScriptConfig('offerOrCta', e.target.value);
                if (activeTab === 0) setOfferOrCta(e.target.value);
              }}
              placeholder="f.eks. Bestil i dag, book en gratis samtale..."
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
              Gem som kunde
            </button>
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------ 2. Scripts */}
      <Section
        id="scripts"
        step={2}
        title="Scripts"
        description="Vælg hvor mange scripts du vil have, og sæt hvert enkelt op for sig."
      >
        <Field label="Antal scripts" meta={`${numScripts} ${numScripts === 1 ? 'script' : 'scripts'}`}>
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
              aria-label="Antal scripts"
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
                Script {idx + 1}
              </button>
            ))}
          </div>

          {numScripts > 1 && (
            <button type="button" onClick={handleApplyToAll} className={buttonStyles.ghost}>
              <Copy className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              Kopiér til alle scripts
            </button>
          )}
        </div>

        {/* Opsætning for det aktive script */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Varighed" htmlFor="duration">
              <select
                id="duration"
                value={currentCfg.bodyDuration}
                onChange={(e) => updateCurrentScriptConfig('bodyDuration', e.target.value)}
                className="control"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            <Field label="Antal hooks" meta={`${currentCfg.numHooks} ${currentCfg.numHooks === 1 ? 'hook' : 'hooks'}`}>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={currentCfg.numHooks}
                  onChange={(e) => updateCurrentScriptConfig('numHooks', parseInt(e.target.value))}
                  className="flex-1 h-2 cursor-pointer"
                  aria-label="Antal hooks"
                />
                <span className="font-mono text-[20px] font-medium text-ink w-8 text-right tabular-nums">
                  {currentCfg.numHooks}
                </span>
              </div>
            </Field>
          </div>

          {/* Script-stil */}
          <div>
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span className="field-label mb-0">Stil og vinkel</span>
              <span className="field-hint shrink-0">{SCRIPT_TYPES.length} at vælge mellem</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {SCRIPT_TYPES.map((st) => {
                const isSelected = currentCfg.scriptType === st.type;
                return (
                  <button
                    type="button"
                    key={st.type}
                    onClick={() => updateCurrentScriptConfig('scriptType', st.type)}
                    aria-pressed={isSelected}
                    title={st.desc}
                    className={`flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-[var(--radius-control)] border text-[15px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-rec bg-rec-soft text-ink font-semibold ring-1 ring-rec'
                        : 'border-line bg-surface text-muted hover:text-ink hover:border-line-strong'
                    }`}
                  >
                    <span className="truncate">{st.type}</span>
                    {isSelected && <Check className="w-4 h-4 text-rec shrink-0" strokeWidth={2.5} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {selectedType && <p className="field-hint mt-2.5">{selectedType.desc}</p>}
          </div>

          {/* Awareness */}
          <Disclosure title="Awareness-stadie" summary={activeStage?.short}>
            <div className="space-y-4">
              <AwarenessFunnelFigure
                currentStage={currentCfg.awarenessStage || 'Problem Aware'}
                onSelectStage={(stId) => updateCurrentScriptConfig('awarenessStage', stId)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {AWARENESS_STAGES.map((st) => (
                  <ChoiceButton
                    key={st.id}
                    selected={(currentCfg.awarenessStage || 'Problem Aware') === st.id}
                    onClick={() => updateCurrentScriptConfig('awarenessStage', st.id)}
                    title={st.short}
                    description={st.desc}
                    meta={
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted shrink-0">
                        {st.badge}
                      </span>
                    }
                  />
                ))}
              </div>
              {activeStage && (
                <p className="field-hint border-t border-line pt-3">
                  <span className="font-semibold text-ink">Fokus: </span>
                  {activeStage.focus}
                </p>
              )}
            </div>
          </Disclosure>

          {/* Trafik */}
          <Disclosure title="Trafik-type" summary={activeTraffic?.title}>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRAFFIC_TYPES.map((tt) => (
                  <ChoiceButton
                    key={tt.id}
                    selected={(currentCfg.trafficType || 'cold') === tt.id}
                    onClick={() => updateCurrentScriptConfig('trafficType', tt.id)}
                    title={tt.title}
                    description={tt.desc}
                    meta={
                      (currentCfg.trafficType || 'cold') === tt.id ? (
                        <Check className="w-4 h-4 text-rec shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted shrink-0">
                          {tt.sub}
                        </span>
                      )
                    }
                  />
                ))}
              </div>

              {currentCfg.trafficType === 'retargeting' && (
                <Field label="Retargeting-noter" hint="Valgfrit. Hvad skal AI'en huske om de besøgende der kommer tilbage?">
                  <input
                    type="text"
                    value={currentCfg.retargetingNotes || ''}
                    onChange={(e) => updateCurrentScriptConfig('retargetingNotes', e.target.value)}
                    placeholder="f.eks. glemte varer i kurven, nævn rabatkoden KOMTILBAGE..."
                    className="control"
                  />
                </Field>
              )}
            </div>
          </Disclosure>

          {/* Hook-vinkler */}
          <Disclosure
            title="Hook-vinkler"
            summary={`${currentCfg.numHooks} ${currentCfg.numHooks === 1 ? 'vinkel' : 'vinkler'}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: currentCfg.numHooks || 3 }).map((_, hookIdx) => {
                const currentHooksList = currentCfg.preferredHookTypes || [];
                const selectedAngleId = currentHooksList[hookIdx] || HOOK_TYPE_OPTIONS[hookIdx % HOOK_TYPE_OPTIONS.length].id;
                const selectedOption = HOOK_TYPE_OPTIONS.find((h) => h.id === selectedAngleId) || HOOK_TYPE_OPTIONS[0];

                return (
                  <Field key={hookIdx} label={`Hook ${hookIdx + 1}`}>
                    <select
                      value={selectedAngleId}
                      onChange={(e) => setHookAngleForHookIndex(hookIdx, e.target.value)}
                      className="control"
                      aria-label={`Vinkel for hook ${hookIdx + 1}`}
                    >
                      {HOOK_TYPE_OPTIONS.map((ht) => (
                        <option key={ht.id} value={ht.id}>
                          {ht.label} ({ht.desc})
                        </option>
                      ))}
                    </select>
                    <p className="field-hint mt-1.5 italic">{selectedOption.example}</p>
                  </Field>
                );
              })}
            </div>
          </Disclosure>

          <Field
            label={`Skal med i script ${activeTab + 1}`}
            hint="Tilbud, koder, garantier eller billeder AI'en ikke må glemme."
          >
            <textarea
              rows={3}
              value={currentCfg.mustInclude ?? ''}
              onChange={(e) => updateCurrentScriptConfig('mustInclude', e.target.value)}
              placeholder="f.eks. Køb 2 få 1 gratis med koden SOMMER, nævn 100 dages returret, vis den grønne flaske i nærbillede..."
              className="control resize-y"
            />
          </Field>
        </div>
      </Section>

      {/* --------------------------------------------------- 3. Tone & sprog */}
      <Section
        id="tone"
        step={3}
        title="Tone"
        description="Måden replikkerne skal tales på. Gennemsyrer alle hooks, body og CTA."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Talesprog" hint="Vælg fra listen eller skriv din egen." htmlFor="toneOfVoice">
            <input
              id="toneOfVoice"
              list="tone-presets"
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              placeholder="f.eks. afslappet dansk talesprog"
              className="control"
            />
            <datalist id="tone-presets">
              {TONE_PRESETS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>

          <Field label="Psykologi bag hooks">
            <label className="flex items-start gap-3 px-4 py-3 border border-line-strong rounded-[var(--radius-control)] cursor-pointer hover:bg-sunken transition-colors">
              <input
                type="checkbox"
                checked={explainHookPsychology}
                onChange={(e) => setExplainHookPsychology(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[var(--color-rec)] cursor-pointer shrink-0"
              />
              <span>
                <span className="block font-semibold text-[15.5px] text-ink">Forklar mekanismen bag hvert hook</span>
                <span className="field-hint">
                  AI'en tilføjer 1-2 sætninger pr. hook om psykologien, f.eks. loss aversion eller curiosity gap.
                </span>
              </span>
            </label>
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------ Fast handlingsbjælke */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-sm border-t border-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
          <p className="field-hint hidden sm:block truncate">
            <span className="font-semibold text-ink">{numScripts}</span>{' '}
            {numScripts === 1 ? 'script' : 'scripts'}
            <span className="mx-2 text-line-strong">·</span>
            <span className="font-semibold text-ink">{currentCfg.numHooks}</span> hooks
            <span className="mx-2 text-line-strong">·</span>
            {currentCfg.bodyDuration}
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
                  Genererer {numScripts} scripts
                </span>
              </>
            ) : (
              <>
                Generér {numScripts} {numScripts === 1 ? 'script' : 'scripts'}
                <ChevronRight className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
