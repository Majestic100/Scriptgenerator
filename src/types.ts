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

/**
 * AI-modeller der kan skrive scripts. Fable 5 er standard; Opus 5 kan vælges
 * til, fx når den ene model er ustabil, eller man vil sammenligne resultaterne.
 */
export type AiModel = 'claude-fable-5' | 'claude-opus-5' | 'grok-4.6';

export const DEFAULT_AI_MODEL: AiModel = 'claude-fable-5';

export const AI_MODEL_IDS: AiModel[] = ['claude-fable-5', 'claude-opus-5', 'grok-4.6'];

/** Ukendte eller gamle værdier falder tilbage til standardmodellen. */
export const normalizeAiModel = (value?: string): AiModel => {
  const v = (value || '').toLowerCase();
  if (v.includes('grok')) return 'grok-4.6';
  if (v.includes('opus')) return 'claude-opus-5';
  return DEFAULT_AI_MODEL;
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
  /** Hvilken AI-model der skal skrive scriptene. Udeladt = standardmodellen. */
  aiModel?: AiModel;
}

/**
 * Framing: gain sætter gevinsten forrest, loss sætter tabet eller smerten forrest.
 * Loss aversion betyder, at folk er stærkere motiveret af at undgå et tab end af
 * at opnå en gevinst af samme størrelse.
 */
export type HookFrame = 'gain' | 'loss';

export interface HookAngle {
  id: string;
  category: string;
}

/** De seks kategorier i hook-biblioteket, i den rækkefølge de vises. */
export const HOOK_CATEGORIES = [
  'Smerte og relevans',
  'Påstand og provokation',
  'Bevis og resultat',
  'Nysgerrighed',
  'Identitet og callout',
  'Format og timing'
] as const;

/**
 * De 25 hooks fra definitionsbiblioteket. Id'erne er faste og oversættes ikke;
 * beskrivelse og eksempel slås op i oversættelserne.
 */
export const HOOK_ANGLES: HookAngle[] = [
  { id: 'Smertespørgsmålet', category: 'Smerte og relevans' },
  { id: 'Fejl-hooket', category: 'Smerte og relevans' },
  { id: 'Skyldig uden at vide det', category: 'Smerte og relevans' },
  { id: 'Stop med at', category: 'Smerte og relevans' },
  { id: 'Selv-erkendelsen', category: 'Smerte og relevans' },

  { id: 'Den kontroversielle påstand', category: 'Påstand og provokation' },
  { id: 'Myteaflivningen', category: 'Påstand og provokation' },
  { id: 'Vi tog fejl', category: 'Påstand og provokation' },
  { id: 'Den ubehagelige ærlighed', category: 'Påstand og provokation' },
  { id: 'Dis-kvalificeringen', category: 'Påstand og provokation' },

  { id: 'Tal-chokket', category: 'Bevis og resultat' },
  { id: 'Før og efter', category: 'Bevis og resultat' },
  { id: 'Tidsramme-resultatet', category: 'Bevis og resultat' },
  { id: 'Testimonial-åbningen', category: 'Bevis og resultat' },
  { id: 'Regnestykket', category: 'Bevis og resultat' },

  { id: 'Insider-viden', category: 'Nysgerrighed' },
  { id: 'Jeg troede X, indtil Y', category: 'Nysgerrighed' },
  { id: 'Den uafsluttede sætning', category: 'Nysgerrighed' },
  { id: 'Den kendte reference', category: 'Nysgerrighed' },
  { id: 'Listicle-hooket', category: 'Nysgerrighed' },

  { id: 'Den direkte målgruppe-callout', category: 'Identitet og callout' },
  { id: 'Identitets-hooket', category: 'Identitet og callout' },
  { id: 'Ekspert-vinklen', category: 'Identitet og callout' },

  { id: 'Demo i sekund 1', category: 'Format og timing' },
  { id: 'Urgency og aktualitet', category: 'Format og timing' }
];

export const HOOK_ANGLE_IDS = HOOK_ANGLES.map((a) => a.id);

/**
 * De ni mekanikker. Hook-typen i biblioteket er formatet; mekanikken er den
 * psykologiske motor bagved. Awareness-stadiet afgør, hvilken mekanik der passer,
 * så generatoren vælger den selv og skriver den på hooket.
 */
export const HOOK_MECHANICS = [
  'Pattern interrupt',
  'Loss aversion',
  'Specificitet',
  'Status',
  'Curiosity gap',
  'Identity',
  'Authority',
  'Future pacing',
  'Kontrast'
] as const;

/**
 * De ni vinkler fra før biblioteket. Gemte opsætninger kan stadig indeholde dem,
 * så de læses som den hook i biblioteket, de svarer til.
 */
const LEGACY_ANGLE_MAP: Record<string, string> = {
  'pattern interrupt': 'Demo i sekund 1',
  'loss aversion': 'Stop med at',
  'specificitet': 'Tal-chokket',
  'status': 'Identitets-hooket',
  'curiosity gap': 'Den uafsluttede sætning',
  'identity': 'Identitets-hooket',
  'authority': 'Ekspert-vinklen',
  'future pacing': 'Urgency og aktualitet',
  'kontrast': 'Den kontroversielle påstand'
};

/** 'auto' = AI'en vælger selv vinklen ud fra strategien. Standard for nye scripts. */
export const AUTO_HOOK_ANGLE = 'auto';

export const normalizeHookAngle = (value?: string): string => {
  if (!value) return HOOK_ANGLE_IDS[0];
  if (value === AUTO_HOOK_ANGLE) return AUTO_HOOK_ANGLE;
  if (HOOK_ANGLE_IDS.includes(value)) return value;
  return LEGACY_ANGLE_MAP[value.trim().toLowerCase()] || HOOK_ANGLE_IDS[0];
};

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
  /** Om hooket sætter gevinsten eller tabet forrest. */
  frame?: HookFrame;
  /** Den psykologiske mekanik bag hooket, en af de ni. */
  mechanic?: string;
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
  /**
   * Modellen der skrev scriptet. Følger med når et hook eller en scene
   * regenereres, så samme model retter sin egen tekst.
   */
  aiModel?: AiModel;
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
