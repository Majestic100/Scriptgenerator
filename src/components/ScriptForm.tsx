import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Package,
  Users2, 
  MapPin,
  Layers, 
  Sparkles, 
  Plus, 
  X, 
  Clock, 
  Film, 
  Target, 
  Gift, 
  Sliders, 
  Check, 
  ChevronRight,
  Flame,
  HelpCircle,
  ShoppingBag,
  UserPlus,
  ListPlus,
  Brain,
  Repeat,
  Quote,
  Globe,
  Upload,
  FileCheck,
  FileText,
  Copy
} from 'lucide-react';
import { ScriptRequest, ScriptType, AnalysisDocument } from '../types';
import { PRESET_ANALOGIES } from '../data/analogies';
import { AwarenessFunnelFigure } from './AwarenessFunnelFigure';

interface ScriptFormProps {
  onSubmit: (request: ScriptRequest) => void;
  isLoading: boolean;
  initialData?: Partial<ScriptRequest>;
  onSaveAsCustomer?: (data: Partial<ScriptRequest>) => void;
}

const SCRIPT_TYPES: { type: ScriptType; desc: string; icon: string }[] = [
  { type: 'Problem–Solution / PAS', desc: 'Fokusér stærkt på kundens smerte før produktet introduceres som helten.', icon: '🎯' },
  { type: 'Humor & Skæv Vinkel', desc: 'Underholdende, sjov eller selvironisk tilgang der fanger opmærksomheden.', icon: '🎭' },
  { type: 'Educational / Explainer', desc: 'Pædagogisk gennemgang af problemet og hvorfor produktet er løsningen.', icon: '💡' },
  { type: 'Lifestyle & Product in Action', desc: 'Æstetisk visuel fremvisning af produktet i brug i hverdagen.', icon: '✨' },
  { type: 'Testimonial / UGC', desc: 'Autentisk anmeldelse og oplevelse fra en tilfreds kunde eller skuespiller.', icon: '📱' },
  { type: 'Demonstration & How-it-Works', desc: 'Hands-on demonstration af hvordan produktet fungerer i praksis.', icon: '🛠️' },
  { type: 'Before-and-After Transformation', desc: 'Dramatisk visuel kontrast før og efter brug af produktet.', icon: '🔄' },
  { type: 'Story-Driven / Narrative', desc: 'En medrivende personlig historie eller rejse der opbygger empati.', icon: '📖' },
  { type: 'Shock / Pattern Interrupt', desc: 'Chokerende påstand eller uventet visuel start der stopper scrollen.', icon: '⚡' },
  { type: 'ASMR / Sensory Experience', desc: 'Fokus på lyde, teksturer og nærbilleder for en sanselig oplevelse.', icon: '🎧' },
  { type: 'Aesthetic / Cinematic', desc: 'Flot produceret video med lækre vinkler og eksklusiv stemning.', icon: '🎬' },
  { type: 'Comparison (Us vs Competitors)', desc: 'Direkte sammenligning af dit produkt mod konkurrenter eller alternativer.', icon: '⚔️' },
  { type: 'Social Proof / Data-Backed', desc: 'Fokus på gode anmeldelser, testresultater, kliniske studier og tal.', icon: '📊' },
  { type: 'Tips & Hacks', desc: 'Nyttige råd og genveje hvor produktet naturligt indgår som løsningen.', icon: '🧠' },
  { type: 'Green Screen / Reaction & Review', desc: 'Kreatøren står foran et screenshot af en artikel, anmeldelse eller opslag.', icon: '🟢' },
  { type: 'Unboxing & First Impression', desc: 'Spændingen ved at åbne pakken og afprøve produktet for første gang.', icon: '📦' },
  { type: 'Founder Story & Behind the Scenes', desc: 'Personlig historie fra stifteren om hvorfor virksomheden blev skabt.', icon: '🎙️' },
  { type: 'Objection Handling / Indvendingsknuser', desc: 'Tager kundens største tvivl op og aflyser den direkte i hooket.', icon: '🛡️' },
  { type: 'Skeptiker → Overbevist', desc: 'Kreatøren starter som decideret skeptiker og bliver vendt af resultatet.', icon: '😳' },
  { type: 'Myth-Busting / Aflivning af myter', desc: 'Punkterer en udbredt misforståelse i kategorien og korrigerer den.', icon: '🚫' },
  { type: 'FAQ / Rapid-Fire Q&A', desc: 'Besvarer de 3-5 mest stillede spørgsmål i højt tempo.', icon: '❓' },
  { type: 'Anmeldelses-oplæsning', desc: 'Kreatøren læser rigtige kundeanmeldelser højt på skærmen.', icon: '⭐' },
  { type: 'Ingrediens- & Spec Deep-Dive', desc: 'Zoomer ind på én ingrediens, materiale eller teknologi og hvorfor den virker.', icon: '🔬' },
  { type: 'Ekspert & Autoritet', desc: 'Læge, tandlæge, fysioterapeut eller fagperson forklarer og validerer produktet.', icon: '🩺' },
  { type: 'Risikofri / Garanti-fokus', desc: 'Hele scriptet bygger på returret, garanti eller "prøv gratis" for at fjerne købsrisiko.', icon: '💸' },
  { type: 'Transparens & Priskalkyle', desc: 'Bryder prisen ned i råvarer, produktion og markup for at retfærdiggøre den.', icon: '📑' }
];

const DURATION_OPTIONS = [
  { label: '15 sekunder', value: '15 sekunder' },
  { label: '20 sekunder', value: '20 sekunder' },
  { label: '25 sekunder', value: '25 sekunder' },
  { label: '30 sekunder', value: '30 sekunder' },
  { label: '35 sekunder', value: '35 sekunder' },
  { label: '40 sekunder', value: '40 sekunder' },
  { label: '45 sekunder', value: '45 sekunder' },
  { label: '50 sekunder', value: '50 sekunder' },
  { label: '55 sekunder', value: '55 sekunder' },
  { label: '60 sekunder', value: '60 sekunder' }
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
    title: '1. Unaware (Ubevidst)',
    short: 'Unaware',
    badge: 'Koldest',
    desc: 'Kender hverken til problemet eller løsningen.',
    focus: 'Væk nysgerrighed, stop scrollen og afslør en uopdaget ulempe/smerte.'
  },
  {
    id: 'Problem Aware',
    title: '2. Problem Aware (Problembevidst)',
    short: 'Problem Aware',
    badge: 'Middel Kold',
    desc: 'Mærker problemet og frustreres i hverdagen.',
    focus: 'Spejl smerten stærkt, skab empati og introducer løsningskategorien.'
  },
  {
    id: 'Solution Aware',
    title: '3. Solution Aware (Løsningsbevidst)',
    short: 'Solution Aware',
    badge: 'Middel Varm',
    desc: 'Kender til løsninger, men søger den bedste mulighed.',
    focus: 'Fremhæv mekanismen og hvorfor dit produkt virker bedre end alternativer.'
  },
  {
    id: 'Product Aware',
    title: '4. Product Aware (Produktbevidst)',
    badge: 'Varm',
    short: 'Product Aware',
    desc: 'Kender dit produkt, men har tvivl eller indvendinger.',
    focus: 'Fjern købsmodstand, vis social proof, kunders anmeldelser & demo.'
  },
  {
    id: 'Most Aware',
    title: '5. Most Aware (Købsklar)',
    short: 'Most Aware',
    badge: 'Hot',
    desc: 'Klar til køb, mangler kun et uimodståeligt tilbud.',
    focus: 'Fokusér stærkt på tilbuddet, rabat/bonus, garanti, urgency og CTA.'
  }
];

const TRAFFIC_TYPES = [
  {
    id: 'cold',
    title: '❄️ Kold Trafik (Prospecting / Nye Besøgende)',
    desc: 'Målrettet personer der aldrig har hørt om virksomheden før. Bygger kendskab og tillid op fra bunden.'
  },
  {
    id: 'retargeting',
    title: '🔄 Retargeting (Varm Trafik / Besøgende & Kurv-forladere)',
    desc: 'Målrettet tidligere besøgende, inaktive kunder eller forladte kurve. Bruger genkendeligt sprog og lukker salget.'
  }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingDoc(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setIsReadingDoc(false);
        return;
      }

      const base64Data = result.includes(',') ? result.split(',')[1] : result;

      const newDoc: AnalysisDocument = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: base64Data,
        size: file.size,
      };

      setAnalysisDoc(newDoc);
      setIsReadingDoc(false);
    };

    reader.onerror = (error) => {
      console.error("Fejl ved indlæsning af fil:", error);
      setIsReadingDoc(false);
    };

    reader.readAsDataURL(file);
  };
  const [productName, setProductName] = useState(initialData?.productName || SAMPLE_EXAMPLE_DATA.productName);
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(
    initialData?.competitors || SAMPLE_EXAMPLE_DATA.competitors
  );
  const [numScripts, setNumScripts] = useState<number>(initialData?.numScripts || SAMPLE_EXAMPLE_DATA.numScripts);
  
  // Tab selector for editing specific scripts
  const [activeTab, setActiveTab] = useState<number>(0);

  // Per-script configuration
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

  // Optional extra details
  const [productDescription, setProductDescription] = useState(initialData?.productDescription || SAMPLE_EXAMPLE_DATA.productDescription);
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || SAMPLE_EXAMPLE_DATA.targetAudience);
  const [demographics, setDemographics] = useState(initialData?.demographics || SAMPLE_EXAMPLE_DATA.demographics);
  const [offerOrCta, setOfferOrCta] = useState(initialData?.offerOrCta || SAMPLE_EXAMPLE_DATA.offerOrCta);
  const [scriptFocus, setScriptFocus] = useState<'product' | 'lead'>(initialData?.scriptFocus || SAMPLE_EXAMPLE_DATA.scriptFocus);
  const [language, setLanguage] = useState<'da' | 'en'>(initialData?.language || SAMPLE_EXAMPLE_DATA.language);

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
    updated[activeTab] = {
      ...updated[activeTab],
      [field]: value
    };
    setScriptConfigs(updated);
  };

  const setHookAngleForHookIndex = (hookIndex: number, angleId: string) => {
    const currentCfg = scriptConfigs[activeTab] || defaultPresets[0];
    const numHooks = currentCfg.numHooks || 3;
    const currentHooks = [...(currentCfg.preferredHookTypes || [])];

    for (let i = 0; i < numHooks; i++) {
      if (!currentHooks[i]) {
        currentHooks[i] = HOOK_TYPE_OPTIONS[i % HOOK_TYPE_OPTIONS.length].id;
      }
    }

    currentHooks[hookIndex] = angleId;
    updateCurrentScriptConfig('preferredHookTypes', currentHooks.slice(0, numHooks));
  };

  const toggleAnalogyForCurrentScript = (analogyText: string) => {
    const currentCfg = scriptConfigs[activeTab] || defaultPresets[0];
    const currentAnalogies = currentCfg.analogies || [];
    const exists = currentAnalogies.includes(analogyText);
    const updated = exists
      ? currentAnalogies.filter(a => a !== analogyText)
      : [...currentAnalogies, analogyText];

    updateCurrentScriptConfig('analogies', updated);
  };

  const handleApplyToAll = () => {
    const current = scriptConfigs[activeTab];
    const updated = scriptConfigs.map(() => ({ ...current }));
    setScriptConfigs(updated);
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

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ink/10 rounded-lg p-6 md:p-8 shadow-sm space-y-6 text-slate-800">
      
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-red-50 text-[#E52328] border border-red-100">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#181E2B] tracking-tight">
              Annonce Script Konfiguration
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleFillExampleData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer shadow-2xs"
            title="Udfyld formularen med klar testdata"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Indsæt Eksempeldata</span>
          </button>

          {/* Language selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setLanguage('da')}
              className={`px-3 py-1 rounded text-sm font-semibold transition-all cursor-pointer ${
                language === 'da'
                  ? 'bg-white text-[#E52328] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇩🇰 Dansk
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded text-sm font-semibold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-[#E52328] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </div>

      {/* CORE GLOBAL FIELDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Virksomheds Navn & Hjemmeside */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#E52328]" />
                Virksomheds Navn <span className="text-[#E52328]">*</span>
              </span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => {
                const val = e.target.value;
                setCompanyName(val);
                setDocumentTitle(`${val} - Script 2`);
              }}
              placeholder="f.eks. JP Køl og Klima"
              className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E52328]/20 focus:border-[#E52328] rounded-md px-3.5 py-2.5 text-base text-slate-900 placeholder-slate-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#E52328]" />
                Virksomhedens Hjemmeside / Link
              </span>
              <span className="text-xs text-[#E52328] font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Analyserer Siden</span>
              </span>
            </label>
            <input
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="f.eks. https://jpkoelogklima.dk"
              className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E52328]/20 focus:border-[#E52328] rounded-md px-3.5 py-2 text-sm font-mono text-slate-900 placeholder-slate-400 transition-all"
            />

          </div>

          {/* Upload Målgruppe- / Virksomhedsanalyse (PDF, Word, Text) */}
          <div className="space-y-1.5 md:col-span-2 pt-1 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#E52328]" />
                Målgruppeanalyse / Virksomhedsanalyse (PDF, Word, Text)
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>AI Dybdegående Grundlag</span>
              </span>
            </label>

            {!analysisDoc ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer border-2 border-dashed border-slate-200 hover:border-[#E52328] bg-slate-50/70 hover:bg-red-50/20 rounded-lg p-3.5 text-center transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />
                <div className="w-9 h-9 rounded-full bg-white border border-slate-200 group-hover:border-red-300 shadow-xs flex items-center justify-center text-slate-500 group-hover:text-[#E52328] transition-colors">
                  <Upload className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 group-hover:text-[#E52328] transition-colors">
                    {isReadingDoc ? 'Læser fil...' : 'Upload PDF, Word eller Text analyse'}
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-200/80 rounded-lg p-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate flex items-center gap-2">
                      <span className="truncate">{analysisDoc.name}</span>
                      <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                        Analyse Tilknyttet
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                      <span>{analysisDoc.size ? `${(analysisDoc.size / 1024).toFixed(0)} KB` : 'Dokument tilknyttet'}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">Bruges som direkte fundament for dine scripts</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAnalysisDoc(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0 ml-2"
                  title="Fjern analysedokument"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Produktets Navn & Script Fokus */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#E52328]" />
              Produktets Navn
            </span>
            <span className="text-xs text-slate-400 font-normal">Valgfri</span>
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={scriptFocus === 'lead' ? "f.eks. Gratis E-bog / Konsultation" : "f.eks. Hydrating Face Serum"}
            className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E52328]/20 focus:border-[#E52328] rounded-md px-3.5 py-2.5 text-base text-slate-900 placeholder-slate-400 transition-all"
          />

          {/* Script Fokus Type Selector */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Script Fokus
              </span>
              <span className="text-xs font-medium text-slate-500">
                {scriptFocus === 'product' ? '🛒 Produkt & Salg' : '🎯 Lead Generering'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setScriptFocus('product')}
                className={`py-1.5 px-2 text-sm font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  scriptFocus === 'product'
                    ? 'bg-white text-[#E52328] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#E52328]" />
                <span>Produkt-fokuseret</span>
              </button>
              <button
                type="button"
                onClick={() => setScriptFocus('lead')}
                className={`py-1.5 px-2 text-sm font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  scriptFocus === 'lead'
                    ? 'bg-white text-[#E52328] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-[#E52328]" />
                <span>Lead-fokuseret</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Konkurrenter (Op til 3) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5 text-[#E52328]" />
              Konkurrenter (Op til 3)
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {competitors.length}/3 tilføjet
            </span>
          </label>

          <div className="flex gap-2">
            <input
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
              placeholder={competitors.length >= 3 ? "Maksimalt 3 konkurrenter" : "f.eks. Luminance, Mærke Y"}
              className="flex-1 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E52328]/20 focus:border-[#E52328] rounded-md px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleAddCompetitor}
              disabled={!competitorInput.trim() || competitors.length >= 3}
              className="px-3.5 py-2 bg-[#181E2B] hover:bg-slate-800 disabled:opacity-40 text-white rounded-md text-sm font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tilføj
            </button>
          </div>

          {/* Added competitor tags */}
          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {competitors.map((comp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 text-red-900 text-sm rounded-md font-medium"
                >
                  <span className="text-xs text-[#E52328] font-bold">{idx + 1}</span>
                  {comp}
                  <button
                    type="button"
                    onClick={() => handleRemoveCompetitor(idx)}
                    className="hover:text-red-600 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* GLOBAL SCRIPT COUNT SLIDER */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#E52328]" />
            <span>Antal scripts</span>
          </label>
          <span className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            {numScripts} {numScripts === 1 ? 'script' : 'forskellige scripts'}
          </span>
        </div>
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
          className="w-full accent-[#E52328] bg-slate-200 rounded-lg h-2 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-500 font-medium overflow-x-auto gap-1">
          <span>1 script</span>
          <span>2 scripts</span>
          <span>3 scripts</span>
          <span>4 scripts</span>
          <span>5 scripts</span>
          <span>6 scripts</span>
          <span>7 scripts</span>
          <span>8 scripts</span>
        </div>
      </div>

      {/* PER-SCRIPT INDIVIDUAL CONFIGURATION TABS */}
      <div className="space-y-4 pt-2">
        
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#E52328]" />
            <span>Tilpas Parametre Pr. Script</span>
          </h3>
        </div>

        {/* Script Selection Tabs + Copy Settings Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {Array.from({ length: numScripts }).map((_, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-[#E52328] border-red-700 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>Script {idx + 1}</span>
                </button>
              );
            })}
          </div>

          {numScripts > 1 && (
            <button
              type="button"
              onClick={handleApplyToAll}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-[#E52328] font-bold text-sm rounded-lg border border-red-300 hover:border-red-400 transition-all shadow-xs shrink-0 cursor-pointer active:scale-98"
              title="Kopier alle parametre fra Script 1 til alle andre scripts"
            >
              <Copy className="w-3.5 h-3.5 text-[#E52328]" />
              <span>Kopier Script {activeTab + 1} valg til alle scripts</span>
            </button>
          )}
        </div>

        {/* Active Tab Config Box */}
        <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-sm font-extrabold text-[#E52328] uppercase tracking-wider">
              ⚙️ Indstillinger for Script {activeTab + 1}
            </span>
            <span className="text-sm text-slate-500 font-medium">
              Vinkel: <strong className="text-slate-800">{currentCfg.scriptType.split('(')[0].trim()}</strong>
            </span>
          </div>

          {/* Hooks & Duration Controls for this script */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Hooks for this script */}
            <div className="space-y-2 bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Antal hooks for Script {activeTab + 1}
                </label>
                <span className="text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  {currentCfg.numHooks} {currentCfg.numHooks === 1 ? 'hook' : 'hooks'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={currentCfg.numHooks}
                onChange={(e) => updateCurrentScriptConfig('numHooks', parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-200 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 font-medium px-0.5">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            {/* Duration for this script */}
            <div className="space-y-2 bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E52328]" />
                Samlet varighed for Script {activeTab + 1}
              </label>
              <select
                value={currentCfg.bodyDuration}
                onChange={(e) => updateCurrentScriptConfig('bodyDuration', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#E52328] focus:outline-none rounded-md px-3 py-2 text-sm text-slate-800 font-medium"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* AWARENESS STADIE SELECTOR */}
          <div className="space-y-2.5 bg-white p-3.5 rounded-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Brain className="w-3.5 h-3.5 text-[#E52328]" />
                  Awareness Stadie for Script {activeTab + 1}
                </label>

              </div>
              <div className="text-xs font-semibold text-[#E52328] bg-red-50 px-2.5 py-1 rounded-full border border-red-200 shrink-0 self-start sm:self-auto">
                {currentCfg.awarenessStage || 'Problem Aware'}
              </div>
            </div>

            {/* Graphical Awareness Funnel Figure with Active Dot Indicator */}
            <AwarenessFunnelFigure
              currentStage={currentCfg.awarenessStage || 'Problem Aware'}
              onSelectStage={(stId) => updateCurrentScriptConfig('awarenessStage', stId)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1">
              {AWARENESS_STAGES.map((st) => {
                const isSelected = (currentCfg.awarenessStage || 'Problem Aware') === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => updateCurrentScriptConfig('awarenessStage', st.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-50/90 border-[#E52328] ring-1 ring-[#E52328]/30 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-sm font-bold ${isSelected ? 'text-[#E52328]' : 'text-slate-800'}`}>
                          {st.short}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {st.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-snug line-clamp-2">
                        {st.desc}
                      </p>
                    </div>
                    <p className="text-[9.5px] text-slate-400 italic mt-2 border-t border-slate-200/60 pt-1 line-clamp-2">
                      Fokus: {st.focus}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TRAFFIC TYPE & RETARGETING SELECTOR */}
          <div className="space-y-2.5 bg-white p-3.5 rounded-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Repeat className="w-3.5 h-3.5 text-[#E52328]" />
                  Trafik-type & Retargeting for Script {activeTab + 1}
                </label>

              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {TRAFFIC_TYPES.map((tt) => {
                const isSelected = (currentCfg.trafficType || 'cold') === tt.id;
                return (
                  <button
                    key={tt.id}
                    type="button"
                    onClick={() => updateCurrentScriptConfig('trafficType', tt.id)}
                    className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/90 border-[#E52328] ring-1 ring-[#E52328]/30 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-bold ${isSelected ? 'text-[#E52328]' : 'text-slate-800'}`}>
                        {tt.title}
                      </span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                        isSelected ? 'bg-[#E52328] border-[#E52328] text-white' : 'border-slate-300 bg-white text-transparent'
                      }`}>
                        ✓
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {tt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* If retargeting is selected, offer a retargeting notes input */}
            {(currentCfg.trafficType === 'retargeting') && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Repeat className="w-3 h-3 text-[#E52328]" />
                  Særlige retargeting-vinkler / noter (valgfrit)
                </label>
                <input
                  type="text"
                  value={currentCfg.retargetingNotes || ''}
                  onChange={(e) => updateCurrentScriptConfig('retargetingNotes', e.target.value)}
                  placeholder="f.eks. Glemte varer i kurven, nævn 15% rabatkode 'KOMTILBAGE', fremhæv 100 dages fuld returret..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:bg-white transition-all"
                />
              </div>
            )}
          </div>

          {/* HOOK TYPES / ANGLES SELECTION FOR THIS SCRIPT */}
          <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-[#E52328]" />
                  1 Hook-vinkel pr. Hook (Script {activeTab + 1})
                </label>

              </div>
              <div className="text-xs font-semibold text-[#E52328] bg-red-50 px-2.5 py-1 rounded-full border border-red-200 shrink-0 self-start sm:self-auto">
                {currentCfg.numHooks} {currentCfg.numHooks === 1 ? 'vinkel valgt' : 'vinkler valgt'} (1 pr. hook)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {Array.from({ length: currentCfg.numHooks || 3 }).map((_, hookIdx) => {
                const currentHooksList = currentCfg.preferredHookTypes || [];
                const selectedAngleId = currentHooksList[hookIdx] || HOOK_TYPE_OPTIONS[hookIdx % HOOK_TYPE_OPTIONS.length].id;
                const selectedOption = HOOK_TYPE_OPTIONS.find(h => h.id === selectedAngleId) || HOOK_TYPE_OPTIONS[0];

                return (
                  <div key={hookIdx} className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#E52328] text-white text-xs flex items-center justify-center font-black">
                          {hookIdx + 1}
                        </span>
                        Hook {hookIdx + 1} Vinkel
                      </span>
                      <span className="text-xs font-bold text-[#E52328] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        {selectedOption.label}
                      </span>
                    </div>

                    <select
                      value={selectedAngleId}
                      onChange={(e) => setHookAngleForHookIndex(hookIdx, e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328] focus:outline-none rounded-md px-2.5 py-1.5 text-sm text-slate-800 font-medium cursor-pointer"
                    >
                      {HOOK_TYPE_OPTIONS.map((ht) => (
                        <option key={ht.id} value={ht.id}>
                          {ht.label} ({ht.desc})
                        </option>
                      ))}
                    </select>

                    <div className="bg-white p-2 rounded border border-slate-100 text-[10.5px] text-slate-500 leading-tight">
                      <span className="font-semibold text-slate-700">Eksempel: </span>
                      <span className="italic">{selectedOption.example}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRODUCT & TARGET DETAILS FOR THIS SPECIFIC SCRIPT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Produktbeskrivelse / USP */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Target className="w-3 h-3 text-[#E52328]" />
                {scriptFocus === 'lead' ? 'Ydelse / USP (Unikke fordele)' : 'Produkt / USP (Unikke fordele)'}
              </label>
              <textarea
                rows={15}
                value={currentCfg.productDescription ?? productDescription}
                onChange={(e) => {
                  updateCurrentScriptConfig('productDescription', e.target.value);
                  if (activeTab === 0) setProductDescription(e.target.value);
                }}
                placeholder={scriptFocus === 'lead' ? "f.eks. Gratis e-bog med 5 trin til bedre søvn, uforpligtende rådgivning, 1:1 strategi-session..." : "f.eks. Lavendel duft, justerbar skum og kølende side..."}
                className="w-full min-h-[280px] bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328] transition-all"
              />
            </div>

            {/* Ideelle kunde */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Users2 className="w-3 h-3 text-[#E52328]" />
                Ideelle kunde
              </label>
              <textarea
                rows={15}
                value={currentCfg.targetAudience ?? targetAudience}
                onChange={(e) => {
                  updateCurrentScriptConfig('targetAudience', e.target.value);
                  if (activeTab === 0) setTargetAudience(e.target.value);
                }}
                placeholder="f.eks. folk med soveproblemer, travle forældre, boligejere eller B2B-virksomheder..."
                className="w-full min-h-[280px] bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328] transition-all"
              />
            </div>

            {/* Hvor i landet */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#E52328]" />
                Hvor i landet
              </label>
              <textarea
                rows={15}
                value={currentCfg.demographics ?? demographics}
                onChange={(e) => {
                  updateCurrentScriptConfig('demographics', e.target.value);
                  if (activeTab === 0) setDemographics(e.target.value);
                }}
                placeholder="f.eks. Hele Danmark, Storkøbenhavn, Jylland & Fyn, lokalområdet inden for 50 km..."
                className="w-full min-h-[280px] bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328] transition-all"
              />
            </div>

            {/* Call to Action (CTA) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Gift className="w-3 h-3 text-[#E52328]" />
                Call to Action (CTA)
              </label>
              <textarea
                rows={15}
                value={currentCfg.offerOrCta ?? offerOrCta}
                onChange={(e) => {
                  updateCurrentScriptConfig('offerOrCta', e.target.value);
                  if (activeTab === 0) setOfferOrCta(e.target.value);
                }}
                placeholder="f.eks. Klik på knappen nedenfor og bestil/hent i dag, Book en gratis uforpligtende samtale..."
                className="w-full min-h-[280px] bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328] transition-all"
              />
            </div>
          </div>

          {/* SPECIFIKKE TING DER SKAL INKLUDERES (PER SCRIPT) */}
          <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-200">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <ListPlus className="w-3.5 h-3.5 text-[#E52328]" />
              Specifikke ting & Offer / Tilbud der SKAL inkluderes i Script {activeTab + 1}
            </label>

            <textarea
              rows={4}
              value={currentCfg.mustInclude ?? ''}
              onChange={(e) => updateCurrentScriptConfig('mustInclude', e.target.value)}
              placeholder="f.eks. Offer: 'Køb 2 og få 1 gratis med koden SOMMER', husk at nævne vores 100 dages returret, og vis den grønne flaske i nærbillede..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328] transition-all"
            />
          </div>

          {/* Script Type selector for this script */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-[#E52328]" />
                Script Type / Style for Script {activeTab + 1}
              </label>

              {/* Quick Select Dropdown */}
              <div className="w-full sm:w-64">
                <select
                  value={currentCfg.scriptType}
                  onChange={(e) => updateCurrentScriptConfig('scriptType', e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328] focus:outline-none rounded-md px-3 py-1.5 text-sm text-slate-900 font-bold shadow-2xs"
                >
                  {SCRIPT_TYPES.map((st) => (
                    <option key={st.type} value={st.type}>
                      {st.icon} {st.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SCRIPT_TYPES.map((st) => {
                const isSelected = currentCfg.scriptType === st.type;
                return (
                  <button
                    type="button"
                    key={st.type}
                    onClick={() => updateCurrentScriptConfig('scriptType', st.type)}
                    className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/80 border-2 border-[#E52328] shadow-xs text-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-lg">{st.icon}</span>
                      {isSelected && (
                        <span className="p-0.5 rounded-full bg-[#E52328] text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-bold text-slate-900">{st.type}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {st.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>


      {/* TONE OF VOICE & HOOK-PSYKOLOGI */}
      <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-base font-bold text-slate-800">
            Talesprog / tone of voice
          </label>
          <input
            list="tone-presets"
            value={toneOfVoice}
            onChange={(e) => setToneOfVoice(e.target.value)}
            placeholder="Vælg fra listen eller skriv din egen tone"
            className="w-full bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rec/20 focus:border-rec rounded-md px-3.5 py-2.5 text-base text-slate-900 transition-all"
          />
          <datalist id="tone-presets">
            <option value="Afslappet dansk talesprog, som en god ven der anbefaler" />
            <option value="Ungt og energisk, TikTok-tempo" />
            <option value="Professionelt og troværdigt, business-tone" />
            <option value="Varmt og omsorgsfuldt, empatisk" />
            <option value="Direkte og kontant, ingen omsvøb" />
            <option value="Humoristisk og selvironisk" />
          </datalist>
          <p className="text-sm text-slate-500">Måden replikkerne skal tales på. Gennemsyrer alle hooks, body og CTA.</p>
        </div>

        <div className="space-y-2">
          <label className="text-base font-bold text-slate-800">Psykologi bag hooks</label>
          <label className="flex items-start gap-3 p-3.5 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={explainHookPsychology}
              onChange={(e) => setExplainHookPsychology(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#e52328] cursor-pointer"
            />
            <span className="text-base text-slate-700">
              <span className="font-semibold text-slate-900 block">Forklar psykologien bag hvert hook</span>
              AI'en tilføjer 1-2 sætninger pr. hook om den psykologiske mekanisme (f.eks. loss aversion, curiosity gap).
            </span>
          </label>
        </div>
      </div>

      {/* GEM SOM KUNDE */}
      {onSaveAsCustomer && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSaveAsCustomer(collectCustomerData())}
            disabled={!companyName.trim()}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-md text-base font-semibold cursor-pointer disabled:opacity-50"
            title="Gem alle udfyldte kundeoplysninger (inkl. uploadet analyse) i kundekartoteket"
          >
            + Gem som kunde
          </button>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || !companyName.trim()}
          className="w-full py-4 px-6 rounded-md font-bold text-base bg-rec hover:bg-[#c81e22] text-white shadow-md shadow-red-200/50 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="rec-dot rec-blink !bg-white" aria-hidden="true" />
              <span className="font-mono text-sm font-semibold tracking-[0.14em] uppercase">REC · Genererer {numScripts} scripts…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-red-200 group-hover:scale-110 transition-transform" />
              <span>Generér {numScripts} Skræddersyede Meta Ads Scripts Nu</span>
              <ChevronRight className="w-4 h-4 text-red-200 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

    </form>
  );
};
