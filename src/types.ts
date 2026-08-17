export type ScriptType = 
  | 'Problem–Solution / PAS'
  | 'Humor & Skæv Vinkel'
  | 'Educational / Explainer'
  | 'Lifestyle & Product in Action'
  | 'Testimonial / UGC'
  | 'Demonstration & How-it-Works'
  | 'Before-and-After Transformation'
  | 'Story-Driven / Narrative'
  | 'Shock / Pattern Interrupt'
  | 'ASMR / Sensory Experience'
  | 'Aesthetic / Cinematic'
  | 'Comparison (Us vs Competitors)'
  | 'Social Proof / Data-Backed'
  | 'Tips & Hacks'
  | 'Green Screen / Reaction & Review'
  | 'Unboxing & First Impression'
  | 'Founder Story & Behind the Scenes'
  | 'Objection Handling / Indvendingsknuser'
  | 'Skeptiker → Overbevist'
  | 'Myth-Busting / Aflivning af myter'
  | 'FAQ / Rapid-Fire Q&A'
  | 'Anmeldelses-oplæsning'
  | 'Ingrediens- & Spec Deep-Dive'
  | 'Ekspert & Autoritet'
  | 'Risikofri / Garanti-fokus'
  | 'Transparens & Priskalkyle';

/**
 * Varighed vælges som interval, ikke som ét præcist sekundtal. Et manuskript, der
 * skal ramme "30 sekunder" på slaget, bliver klippet til efter uret i stedet for
 * efter indholdet. Intervallet giver replikken plads til at fylde det, den skal,
 * og er stadig en ramme, ikke et frit slag.
 */
export const DURATION_OPTIONS = [
  '15-20 sekunder',
  '20-30 sekunder',
  '30-40 sekunder',
  '40-50 sekunder',
  '50-60 sekunder',
  '60-75 sekunder'
];

export const DEFAULT_DURATION = '30-40 sekunder';

/**
 * Ældre kunder og scripts gemte ét tal ('30 sekunder'). Læses som det interval,
 * tallet falder i, så en gammel opsætning stadig rammer et gyldigt valg i listen.
 */
export const normalizeDuration = (value?: string): string => {
  if (!value) return DEFAULT_DURATION;
  if (DURATION_OPTIONS.includes(value)) return value;
  const numbers = value.match(/\d+/g);
  if (!numbers) return DEFAULT_DURATION;
  const seconds = parseInt(numbers[numbers.length - 1], 10);
  if (seconds <= 20) return DURATION_OPTIONS[0];
  if (seconds <= 30) return DURATION_OPTIONS[1];
  if (seconds <= 40) return DURATION_OPTIONS[2];
  if (seconds <= 50) return DURATION_OPTIONS[3];
  if (seconds <= 60) return DURATION_OPTIONS[4];
  return DURATION_OPTIONS[5];
};

export type TrafficTemperature = 'cold' | 'warm' | 'hot';

/** Ældre scripts og opsætninger gemte 'retargeting'. Det svarer til 'warm' i den nye model. */
export const normalizeTrafficTemperature = (value?: string): TrafficTemperature => {
  const v = (value || '').toLowerCase();
  if (v === 'hot') return 'hot';
  if (v === 'warm' || v === 'retargeting' || v.includes('retarget')) return 'warm';
  return 'cold';
};

export interface PerScriptConfig {
  scriptType: string;
  bodyDuration: string;
  numHooks: number;
  productDescription?: string;
  targetAudience?: string;
  demographics?: string;
  offerOrCta?: string;
  preferredHookTypes?: string[];
  mustInclude?: string;
  awarenessStage?: string; // 'Unaware' | 'Problem Aware' | 'Solution Aware' | 'Product Aware' | 'Most Aware'
  /**
   * Trafik-temperatur: hvad seeren ved om VIRKSOMHEDEN. Egen akse i forhold til awareness,
   * som handler om hvad de ved om problemet. "hot" betyder købsklar, ikke eksisterende kunde.
   * 'retargeting' er den gamle værdi og læses som 'warm'.
   */
  trafficType?: TrafficTemperature | 'retargeting';
  retargetingNotes?: string;
  analogies?: string[]; // Custom or chosen Danish analogies/idioms
}

export interface AnalysisDocument {
  name: string;
  mimeType: string;
  base64: string;
  size?: number;
  extractedText?: string;
}

export interface ScriptRequest {
  documentTitle?: string;
  companyName: string;
  companyWebsite?: string;
  analysisDocument?: AnalysisDocument;
  productName?: string;
  competitors: string[]; // up to 3
  numScripts: number; // e.g. 1 - 8
  scriptConfigs?: PerScriptConfig[];
  numHooksPerScript?: number; // fallback
  bodyDuration?: string; // fallback
  scriptType?: string; // fallback
  productDescription?: string;
  targetAudience?: string;
  demographics?: string;
  offerOrCta?: string;
  scriptFocus?: 'product' | 'lead';
  language?: 'da' | 'en';
  globalAnalogies?: string[];
  toneOfVoice?: string;
}

/** De otte former et hook kan tage. Formen er grammatikken, vinklen er psykologien. */
export const HOOK_VERBAL_TYPES = [
  'Etiket',
  'Spørgsmål',
  'Betingelse',
  'Kommando',
  'Udsagn',
  'Liste eller trin',
  'Fortælling',
  'Udbrud'
] as const;

export interface HookItem {
  id: string;
  hookNumber: number;
  angleType: string; // e.g. "Pattern Interrupt", "Negative Curiosity", "Direct Callout"
  /** Formen: Etiket, Spørgsmål, Betingelse, Kommando, Udsagn, Liste eller trin, Fortælling, Udbrud. */
  verbalType?: string;
  /** Hvem hooket råber op til, og hvad der får dem til at føle sig ramt. */
  callOut?: string;
  /** Hvad seeren får ud af at blive hængende, udtalt eller underforstået. */
  promise?: string;
  visualDirection: string; // What we see on camera
  textOnScreen: string; // Big text overlay / captions
  audioDialogue: string; // Spoken dialogue / voiceover
  estimatedDurationSec: number;
  psychology?: string; // Optional: the psychology behind the hook
}

export interface ScriptScene {
  id: string;
  timecode: string; // e.g. "0:03 - 0:10"
  section: 'Problem/Pain' | 'Solution/Demo' | 'Social Proof' | 'Value Prop' | 'CTA & Offer';
  visualDescription: string;
  textOnScreen: string;
  audioDialogue: string;
  soundEffects?: string;
}

/** Strategiblok fra klassificerings-skridtet (playbooken): AI'en klassificerer strategien, før scriptet skrives. */
export interface ScriptStrategy {
  scriptNumber: number;
  awarenessState: string;
  stageMatch: 'confirmed' | 'evidence-suggests-other';
  suggestedStage: string;
  classificationEvidence: string;
  confidence: 'high' | 'medium' | 'low';
  marketSophistication: number;
  sophisticationNote: string;
  massDesire: string;
  currentBelief: string;
  requiredBeliefShift: string;
  primaryAngle: string;
  schwartzProcess: string;
  mechanism: string;
  proofType: string;
  cta: string;
  unsupportedClaimsExcluded: string[];
}

export interface GeneratedScript {
  id: string;
  documentTitle?: string;
  title: string;
  conceptAngle: string;
  scriptType: string;
  bodyDuration: string;
  companyName: string;
  productName?: string;
  competitors: string[];
  competitorDifferentiation: string; // How this script positions against competitors
  awarenessStage?: string;
  trafficType?: string;
  strategy?: ScriptStrategy;
  hooks: HookItem[];
  scenes: ScriptScene[];
  callToAction: string;
  proTips: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  shared?: boolean;
  owner?: string;
  ownerLabel?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  scripts: GeneratedScript[];
}

/**
 * 'script' er et helt manuskript lagt ind som ét eksempel. Det behøver ikke være
 * delt op i hook, body og CTA: nogle gange er det netop sammenhængen mellem dem,
 * der er værd at efterligne.
 */
export type AiTrainingType = 'hook' | 'body' | 'cta' | 'script';

export interface AiTrainingItem {
  id: string;
  type: AiTrainingType;
  text: string;
  title?: string;
  brandContext?: string;
  notes?: string;
  createdAt: string;
}

export interface GenerationResponse {
  success: boolean;
  scripts?: GeneratedScript[];
  error?: string;
}

export interface Customer {
  id: string;
  name: string; // label i kundekartoteket
  companyName: string;
  companyWebsite?: string;
  productName?: string;
  productDescription?: string;
  targetAudience?: string;
  demographics?: string;
  offerOrCta?: string;
  competitors?: string[];
  toneOfVoice?: string;
  notes?: string;
  analysisDocument?: { name: string; extractedText: string };
  shared?: boolean;
  owner?: string;
  ownerLabel?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUserInfo {
  name: string;
  company: string;
  companyLabel: string;
}
