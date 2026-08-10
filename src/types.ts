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
  trafficType?: 'cold' | 'retargeting';
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
}

export interface HookItem {
  id: string;
  hookNumber: number;
  angleType: string; // e.g. "Pattern Interrupt", "Negative Curiosity", "Direct Callout"
  visualDirection: string; // What we see on camera
  textOnScreen: string; // Big text overlay / captions
  audioDialogue: string; // Spoken dialogue / voiceover
  estimatedDurationSec: number;
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
  createdAt: string;
  updatedAt: string;
  scripts: GeneratedScript[];
}

export type AiTrainingType = 'hook' | 'body' | 'cta';

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
