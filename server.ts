import express from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";
import { SCRIPT_TYPE_GUIDELINES } from "./src/data/scriptTypeGuidelines";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "25mb" }));

// --- Adgang & virksomheder ---
// APP_USERS: "Navn:Virksomhed:kode" adskilt af komma, fx
//   Sinan:Hero Media:sinan-x92k,Jalal:Jalal Visuals:jalal-t44m
// Hver bruger ser sin egen virksomheds data + alt der er markeret som fælles.
// Fallback: APP_PASSWORDS (kun koder) = alle deler alt, som før.
interface AppUser {
  name: string;
  companyLabel: string;
  company: string; // normaliseret nøgle
  password: string;
}

const normalizeCompany = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, "-") || "alle";

function getAppUsers(): AppUser[] {
  const structured = (process.env.APP_USERS || "").split(",").map((e) => e.trim()).filter(Boolean);
  if (structured.length > 0) {
    return structured.map((entry) => {
      const parts = entry.split(":").map((p) => p.trim());
      if (parts.length >= 3) {
        const [name, companyLabel, ...rest] = parts;
        return { name, companyLabel, company: normalizeCompany(companyLabel), password: rest.join(":") };
      }
      // Uden virksomhed: brugeren ser alt
      const password = parts[parts.length - 1];
      const name = parts.length > 1 ? parts[0] : "Bruger";
      return { name, companyLabel: "Alle", company: "alle", password };
    }).filter((u) => u.password);
  }

  return (process.env.APP_PASSWORDS || process.env.APP_PASSWORD || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((password) => ({ name: "Bruger", companyLabel: "Alle", company: "alle", password }));
}

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "sg-auth-" + (process.env.APP_USERS || process.env.APP_PASSWORDS || "dev");

const authTokenFor = (password: string) =>
  crypto.createHmac("sha256", AUTH_SECRET).update(password).digest("hex");

function getCookie(req: any, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

// Returnerer den loggede bruger, eller null hvis adgangskontrol er slået fra
function getCurrentUser(req: any): AppUser | null {
  const users = getAppUsers();
  if (users.length === 0) return null;
  const token = getCookie(req, "sg_auth");
  if (!token) return null;
  return users.find((u) => authTokenFor(u.password) === token) || null;
}

const isAuthRequired = () => getAppUsers().length > 0;
const isAuthed = (req: any) => !isAuthRequired() || !!getCurrentUser(req);

// Ser denne bruger dette element? (fælles + egen virksomhed + gamle elementer uden ejer)
function canAccess(item: any, user: AppUser | null): boolean {
  if (!user || user.company === "alle") return true;
  if (item?.shared) return true;
  if (!item?.owner) return true;
  return item.owner === user.company;
}

app.get("/api/auth/status", (req, res) => {
  const user = getCurrentUser(req);
  res.json({
    success: true,
    required: isAuthRequired(),
    authed: isAuthed(req),
    user: user ? { name: user.name, company: user.company, companyLabel: user.companyLabel } : null
  });
});

app.post("/api/auth/login", (req, res) => {
  const { password } = req.body || {};
  const users = getAppUsers();
  if (users.length === 0) return res.json({ success: true });
  const match = typeof password === "string" ? users.find((u) => u.password === password.trim()) : null;
  if (match) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      `sg_auth=${authTokenFor(match.password)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${secure}`
    );
    return res.json({
      success: true,
      user: { name: match.name, company: match.company, companyLabel: match.companyLabel }
    });
  }
  return res.status(401).json({ success: false, error: "Forkert adgangskode." });
});

app.post("/api/auth/logout", (req, res) => {
  res.setHeader("Set-Cookie", "sg_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  res.json({ success: true });
});

// Alle øvrige API-ruter kræver login
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth/")) return next();
  if (isAuthed(req)) return next();
  return res.status(401).json({ success: false, error: "Log ind for at bruge appen." });
});

// Helper function to extract text from uploaded analysis document (PDF, Word, Text)
// pdf-parse v2 eksporterer klassen PDFParse. Ældre versioner eksporterede en
// kaldbar funktion, så begge former understøttes her.
async function extractPdfText(buffer: Buffer): Promise<string> {
  const mod = pdfParseModule as any;

  if (typeof mod.PDFParse === "function") {
    const parser = new mod.PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return (result?.text || "").trim();
    } finally {
      await parser.destroy?.();
    }
  }

  const legacyParse = typeof mod.default === "function" ? mod.default : typeof mod === "function" ? mod : null;
  if (legacyParse) {
    const parsed = await legacyParse(buffer);
    return (parsed?.text || "").trim();
  }

  throw new Error("pdf-parse eksporterer hverken PDFParse eller en kaldbar funktion.");
}

async function extractTextFromAnalysisDoc(doc: { name?: string; mimeType?: string; base64?: string; extractedText?: string }): Promise<string> {
  if (!doc) return "";
  if (doc.extractedText && doc.extractedText.trim().length > 0) {
    return doc.extractedText.trim();
  }
  if (!doc.base64) return "";

  const buffer = Buffer.from(doc.base64, 'base64');
  const mime = (doc.mimeType || '').toLowerCase();
  const fileName = (doc.name || '').toLowerCase();
  const isPdf = mime.includes('pdf') || fileName.endsWith('.pdf');
  const isWord = mime.includes('word') || mime.includes('officedocument') || fileName.endsWith('.docx') || fileName.endsWith('.doc');

  // Ren tekst og markdown
  if (mime.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json')) {
    return buffer.toString('utf-8').trim();
  }

  // PDF og Word håndteres for sig, så en parser-fejl ikke ender i utf-8-fallbacket
  // og bliver til ulæselig binær tekst.
  if (isPdf) {
    try {
      const text = await extractPdfText(buffer);
      if (text.length > 0) return text;
      // Tom tekst betyder som regel en scannet PDF uden tekstlag
      return "";
    } catch (err: any) {
      console.error("[extractTextFromAnalysisDoc] PDF kunne ikke læses:", err?.message || err);
      return "";
    }
  }

  if (isWord) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return (result?.value || "").trim();
    } catch (err: any) {
      console.error("[extractTextFromAnalysisDoc] Word-dokument kunne ikke læses:", err?.message || err);
      return "";
    }
  }

  // Ukendt filtype: prøv som tekst
  try {
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\x0A\x0D\xC0-\xFF]/g, ' ').trim();
  } catch (err: any) {
    console.warn("[extractTextFromAnalysisDoc] Fejl ved udtræk af tekst fra dokument:", err?.message || err);
    return "";
  }
}

// Text Sanitization helper to guarantee forbidden words/anglicisms are never present in output
function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return text;
  let s = text.trim();

  // If text is in ALL CAPS (and contains at least 3 letters), convert to natural sentence case
  const letters = s.replace(/[^a-zA-ZÆØÅæøå]/g, "");
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    const lower = s.toLowerCase();
    s = lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  // Replace gamechanger / game changer / game-changer
  s = s.replace(/game\s*[-–—]?\s*changer/gi, "kæmpe forskel");

  // Replace forbidden cliché anglicisms
  s = s.replace(/det handler om at/gi, "det drejer sig om at");
  s = s.replace(/lad os dykke ned i/gi, "lad os kigge på");

  // Replace forbidden cliché openings if they appear at start
  s = s.replace(/^(Hej med jer|Er du træt af|Lad mig fortælle dig|Du vil ikke tro|Stop op|I dagens video|POV:\s*du)[,!\.]?\s*/i, "");

  // Clean dashes used as mid-sentence hyphens in spoken dialogue or overlays
  s = s.replace(/\s+[-–—]\s+/g, ", ");

  return s;
}

function sanitizeScript(script: any): any {
  if (!script || typeof script !== "object") return script;
  const clone = JSON.parse(JSON.stringify(script));

  if (clone.title) clone.title = sanitizeText(clone.title);
  if (clone.conceptAngle) clone.conceptAngle = sanitizeText(clone.conceptAngle);
  if (clone.callToAction) clone.callToAction = sanitizeText(clone.callToAction);
  if (clone.competitorDifferentiation) clone.competitorDifferentiation = sanitizeText(clone.competitorDifferentiation);

  if (Array.isArray(clone.hooks)) {
    clone.hooks = clone.hooks.map((h: any) => ({
      ...h,
      angleType: sanitizeText(h.angleType || ""),
      visualDirection: sanitizeText(h.visualDirection || ""),
      textOnScreen: sanitizeText(h.textOnScreen || ""),
      audioDialogue: sanitizeText(h.audioDialogue || "")
    }));
  }

  if (Array.isArray(clone.scenes)) {
    clone.scenes = clone.scenes.map((sc: any) => ({
      ...sc,
      visualDescription: sanitizeText(sc.visualDescription || ""),
      textOnScreen: sanitizeText(sc.textOnScreen || ""),
      audioDialogue: sanitizeText(sc.audioDialogue || ""),
      soundEffects: sanitizeText(sc.soundEffects || "")
    }));
  }

  return clone;
}

// Helper to build prompt section for specific script type guidelines
function getScriptTypeGuidelinesPrompt(requestedTypes: string[]): string {
  const uniqueTypes = Array.from(new Set(requestedTypes)).filter(Boolean);
  if (uniqueTypes.length === 0) return "";

  const sections = uniqueTypes.map(st => {
    let guide = SCRIPT_TYPE_GUIDELINES[st];
    if (!guide) {
      const key = Object.keys(SCRIPT_TYPE_GUIDELINES).find(k =>
        k.toLowerCase() === st.toLowerCase() ||
        k.toLowerCase().includes(st.toLowerCase()) ||
        st.toLowerCase().includes(k.toLowerCase())
      );
      if (key) guide = SCRIPT_TYPE_GUIDELINES[key];
    }

    if (guide) {
      return `--- MEKANIK, BEATS, KRAV OG FEJLMODER FOR SCRIPT TYPE: "${st}" ---\n${guide}`;
    }
    return `--- SCRIPT TYPE: "${st}" ---\nFølg bedste konverteringspraksis og skarpe beats for denne type.`;
  });

  return `\n\n🎯 REGEL-SÆT OG BEATS FOR VALGTE SCRIPT-TYPER (SKAL OVERHOLDES 100%):\n${sections.join("\n\n")}\n\n`;
}

// Claude setup
const CLAUDE_MODEL = "claude-fable-5";

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY miljøvariabel er ikke konfigureret. Tilføj den i en .env fil i projektets rod.");
  }
  return new Anthropic({ apiKey });
};

// JSON Schema type-navne (samme form som @google/genai's Type-enum, så schemaerne nedenfor er standard JSON Schema)
const Type = {
  OBJECT: "object",
  ARRAY: "array",
  STRING: "string",
  INTEGER: "integer",
  NUMBER: "number",
  BOOLEAN: "boolean",
} as const;

// Structured outputs kræver additionalProperties: false og fuld required-liste på alle objekter
function toStrictSchema(node: any): any {
  if (Array.isArray(node)) return node.map(toStrictSchema);
  if (node && typeof node === "object") {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(node)) out[key] = toStrictSchema(value);
    if (out.type === "object" && out.properties) {
      out.additionalProperties = false;
      out.required = Object.keys(out.properties);
    }
    return out;
  }
  return node;
}

// Kalder Claude (Fable 5) og returnerer svaret som JSON-tekst jf. det angivne schema.
// Fable 5 styrer selv sin thinking (ingen thinking-config) og accepterer ikke temperature.
// fallbacks: "default" gør at et evt. sikkerhedsafslag automatisk besvares af en fallback-model.
async function generateContentJson(options: {
  prompt: string;
  schema: Record<string, any>;
  system?: string;
  maxTokens?: number;
}): Promise<{ text: string }> {
  const client = getAnthropicClient();
  const response: any = await (client.beta.messages.create as any)({
    model: CLAUDE_MODEL,
    max_tokens: options.maxTokens ?? 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    ...(options.system ? { system: options.system } : {}),
    output_config: { format: { type: "json_schema", schema: toStrictSchema(options.schema) } },
    messages: [{ role: "user", content: options.prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("AI-modellen afviste forespørgslen. Prøv at omformulere dit input.");
  }

  const text = response.content?.find((block: any) => block.type === "text")?.text ?? "{}";
  return { text };
}

// --- Awareness-playbook (playbook/) ---
// Kanonisk vidensgrundlag: klassificér strategien på engelsk FØR scriptet skrives på markedssproget.
const PLAYBOOK_DIR = path.join(process.cwd(), "playbook");

function readPlaybookFile(rel: string): string {
  try {
    return fs.readFileSync(path.join(PLAYBOOK_DIR, rel), "utf-8");
  } catch {
    return "";
  }
}

/**
 * Varighed angives som interval ('30-40 sekunder'). Læser tallene ud, så både
 * intervaller og gamle enkelt-tal ('30 sekunder') kan omsættes til et ordbudget.
 * Ca. 2,1 ord i sekundet er et roligt dansk taletempo.
 */
function durationRange(value) {
  const numbers = String(value || "").match(/\d+/g);
  const minSec = numbers ? parseInt(numbers[0], 10) : 30;
  const maxSec = numbers ? parseInt(numbers[numbers.length - 1], 10) : 40;
  return {
    minSec,
    maxSec,
    minWords: Math.round(minSec * 2.0),
    maxWords: Math.round(maxSec * 2.1),
  };
}

/** Én linje med varighed og ordbudget til script-specifikationen. */
function durationSpec(value) {
  const r = durationRange(value);
  return r.minSec === r.maxSec
    ? `"${value}" (ca. ${r.maxWords} ord dialog i alt)`
    : `"${value}". Scriptet må lande hvor som helst mellem ${r.minSec} og ${r.maxSec} sekunder, med ${r.minWords}-${r.maxWords} ord dialog i alt`;
}

/** 'retargeting' var den gamle værdi og svarer til 'warm' i tre-lags-modellen. */
function normalizeTraffic(value) {
  const v = (value || "").toLowerCase();
  if (v === "hot") return "hot";
  if (v === "warm" || v.includes("retarget")) return "warm";
  return "cold";
}

const TRAFFIC_LABELS = {
  cold: "KOLD (første møde, kender ikke virksomheden)",
  warm: "VARM (har set jer før: sitet, video, annonce eller brandsøgning)",
  hot: "HOT (købsklar: kurv-afbrud, prisside, gentagne besøg på beslutningssider)",
};

const AWARENESS_STAGE_FILES: Record<string, string> = {
  "unaware": "stages/unaware.md",
  "completely unaware": "stages/unaware.md",
  "problem aware": "stages/problem-aware.md",
  "solution aware": "stages/solution-aware.md",
  "product aware": "stages/product-aware.md",
  "most aware": "stages/most-aware.md",
};

/** Playbook-uddrag til genererings-prompten: kun de stadier, de aktuelle scripts rammer. */
function buildPlaybookGenerationSection(options: {
  stages: string[];
  language: string;
  scriptFocus: string;
}): string {
  const parts: string[] = [];

  const uniqueFiles = Array.from(new Set(
    options.stages
      .map((s) => AWARENESS_STAGE_FILES[(s || "Problem Aware").trim().toLowerCase()])
      .filter(Boolean)
  ));
  for (const file of uniqueFiles) {
    const content = readPlaybookFile(file);
    if (content) parts.push(content);
  }

  const focusFile = options.scriptFocus === "lead" ? "leadgen.md" : "ecommerce.md";
  const focusContent = readPlaybookFile(focusFile);
  if (focusContent) parts.push(focusContent);

  if (options.language !== "en") {
    const marketContent = readPlaybookFile(`markets/${options.language}.md`);
    if (marketContent) parts.push(marketContent);
  }

  // Trafik-temperatur og skrivestil gælder hvert eneste script uanset stadie
  const trafficContent = readPlaybookFile("trafik-temperatur.md");
  if (trafficContent) parts.push(trafficContent);

  const styleContent = readPlaybookFile("skrivestil.md");
  if (styleContent) parts.push(styleContent);

  if (parts.length === 0) return "";
  return `\n\nAWARENESS-PLAYBOOK (BINDENDE VIDENSGRUNDLAG FOR DE VALGTE STADIER):\n"""\n${parts.join("\n\n---\n\n")}\n"""\n`;
}

/**
 * Skrivestils-reglerne alene. Bruges ved regenerering af enkeltdele, hvor hele
 * playbooken ville fylde for meget, men et nyt hook stadig skal lyde menneskeskrevet.
 */
function buildWritingStyleSection(): string {
  const style = readPlaybookFile("skrivestil.md");
  if (!style) return "";
  return `\n\nSKRIVESTIL (BINDENDE):\n"""\n${style}\n"""\n`;
}

/**
 * Skridt 1 af 2: klassificér strategien for hvert script FØR der skrives copy.
 * Kører på engelsk (kanonisk terminologi) jf. playbookens driftsspecifikation.
 * Fejler kaldet, returneres null og genereringen fortsætter uden strategiblok.
 */
async function classifyScriptStrategies(input: {
  companyName: string;
  productName?: string;
  productDescription?: string;
  targetAudience?: string;
  demographics?: string;
  offerOrCta?: string;
  competitors: string[];
  scriptFocus: string;
  language: string;
  analysisDocText?: string;
  websiteAnalysisText?: string;
  toneOfVoice?: string;
  scriptConfigs: any[];
}): Promise<any[] | null> {
  const core = readPlaybookFile("core.md");
  if (!core) return null;

  // Strategiblokken læses i grænsefladen, så prosaen skal skrives på brugerens sprog.
  // Kun de kanoniske begreber (stadie-navne, Schwartz-processer) bliver på engelsk.
  const outputLanguageName = input.language === "en" ? "English" : "Danish";

  const configLines = input.scriptConfigs.map((cfg: any, i: number) => {
    return `SCRIPT #${i + 1}: script type "${cfg.scriptType || "UGC"}", operator-chosen awareness stage "${cfg.awarenessStage || "Problem Aware"}", traffic temperature "${normalizeTraffic(cfg.trafficType)}"${cfg.retargetingNotes ? ` (what the viewer has already seen: "${cfg.retargetingNotes}")` : ""}, duration ${cfg.bodyDuration || "30-40 sekunder"}, ${cfg.numHooks || 3} hooks${cfg.mustInclude ? `, must include: "${cfg.mustInclude}"` : ""}${Array.isArray(cfg.preferredHookTypes) && cfg.preferredHookTypes.length > 0 ? `, requested hook angles: ${cfg.preferredHookTypes.join(", ")}` : ""}`;
  }).join("\n");

  const prompt = `You are classifying advertising strategy BEFORE any copy is written, following the playbook below. Do not write any script copy in this step.

PLAYBOOK (classification apparatus):
"""
${core}
"""

BUSINESS FACTS (everything below is supplied fact; anything not listed is unknown — do not invent):
- Business model: ${input.scriptFocus === "lead" ? "lead generation" : "e-commerce / direct product sales"}
- Company: "${input.companyName}"
${input.productName ? `- Product/offer: "${input.productName}"` : ""}
${input.productDescription ? `- Product description / USP: "${input.productDescription}"` : ""}
${input.targetAudience ? `- Ideal customer: "${input.targetAudience}"` : ""}
${input.demographics ? `- Geography/demographics: "${input.demographics}"` : ""}
${input.offerOrCta ? `- Offer / CTA: "${input.offerOrCta}"` : ""}
- Competitors: ${input.competitors.length > 0 ? input.competitors.join(", ") : "none supplied"}
${input.toneOfVoice ? `- Tone of voice: "${input.toneOfVoice}"` : ""}
- Output market language: ${input.language === "en" ? "English" : "Danish"}
${input.websiteAnalysisText ? `\nWEBSITE CONTENT (supplied fact):\n"""\n${input.websiteAnalysisText}\n"""` : ""}
${input.analysisDocText ? `\nAUDIENCE/COMPANY ANALYSIS DOCUMENT (voice-of-customer source — quote its exact wording as evidence):\n"""\n${input.analysisDocText}\n"""` : ""}

SCRIPTS TO CLASSIFY (one strategy object per script, in order):
${configLines}

RULES FOR THIS STEP:
- The operator's chosen awareness stage is BINDING for the script: set awarenessState to exactly that stage. If the evidence points to a different stage, keep the operator's stage, set stageMatch to "evidence-suggests-other" and name the better-supported stage in suggestedStage with your reasoning in classificationEvidence. Otherwise set stageMatch to "confirmed" and suggestedStage to "".
- Follow the mandatory reasoning sequence and the classification guardrails from the playbook.
- classificationEvidence must cite concrete supplied material (analysis wording, website content, product facts) — never invented insight.
- unsupportedClaimsExcluded: list claims the script must NOT make because no supplied fact supports them (e.g. discounts, review counts, guarantees, urgency not present in the facts). Empty array if none.

OUTPUT LANGUAGE — READ CAREFULLY:
Reason in English, but WRITE every prose field in ${outputLanguageName}. The operator reads this panel in ${outputLanguageName}; a half-English strategy block is unusable.
- Keep ONLY these as canonical English: awarenessState ("Unaware" / "Problem Aware" / "Solution Aware" / "Product Aware" / "Most Aware"), suggestedStage, and the process NAME inside schwartzProcess ("Intensification", "Identification", "Gradualization", "Redefinition", "Mechanization", "Concentration", "Camouflage", "Verification").
- Everything else — sophisticationNote, massDesire, currentBelief, requiredBeliefShift, primaryAngle, mechanism, proofType, cta, classificationEvidence, unsupportedClaimsExcluded — must be written in ${outputLanguageName}. Quotes lifted from the analysis stay in their original wording.

LENGTH — the panel must be scannable, not an essay:
- massDesire: a noun phrase, max 8 words. Not a quote, not a sentence.
- currentBelief / requiredBeliefShift: ONE short sentence each, max 15 words.
- primaryAngle: ONE sentence, max 20 words.
- schwartzProcess: the canonical name, optionally two, nothing more (e.g. "Intensification + Gradualization").
- mechanism / proofType / cta: ONE sentence each, max 20 words.
- sophisticationNote: max 12 words explaining the level.
- classificationEvidence: max 2 sentences.
Write plainly. No headings, no bullet lists, no markdown inside the fields.`;

  const strategySchema = {
    type: Type.OBJECT,
    properties: {
      strategies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scriptNumber: { type: Type.INTEGER },
            awarenessState: { type: Type.STRING },
            stageMatch: { type: Type.STRING, enum: ["confirmed", "evidence-suggests-other"] },
            suggestedStage: { type: Type.STRING },
            classificationEvidence: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
            marketSophistication: { type: Type.INTEGER },
            sophisticationNote: { type: Type.STRING },
            massDesire: { type: Type.STRING },
            currentBelief: { type: Type.STRING },
            requiredBeliefShift: { type: Type.STRING },
            primaryAngle: { type: Type.STRING },
            schwartzProcess: { type: Type.STRING },
            mechanism: { type: Type.STRING },
            proofType: { type: Type.STRING },
            cta: { type: Type.STRING },
            unsupportedClaimsExcluded: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "scriptNumber", "awarenessState", "stageMatch", "suggestedStage", "classificationEvidence",
            "confidence", "marketSophistication", "sophisticationNote", "massDesire", "currentBelief",
            "requiredBeliefShift", "primaryAngle", "schwartzProcess", "mechanism", "proofType", "cta",
            "unsupportedClaimsExcluded"
          ]
        }
      }
    },
    required: ["strategies"]
  };

  try {
    const response = await generateContentJson({
      prompt,
      system: "You are a direct-response advertising strategist working from Eugene Schwartz's Breakthrough Advertising framework. You classify strategy before any copy is written. You never fabricate customer insight, proof or urgency.",
      schema: strategySchema,
      maxTokens: 6000
    });
    const parsed = JSON.parse(response.text || "{}");
    if (Array.isArray(parsed.strategies) && parsed.strategies.length > 0) {
      return parsed.strategies;
    }
    return null;
  } catch (err) {
    console.error("Strategiklassificering fejlede — fortsætter uden strategiblok:", err);
    return null;
  }
}

/** Strategiblokken som bindende instruks i genererings-prompten. */
function buildStrategyInstruction(strategies: any[] | null): string {
  if (!strategies || strategies.length === 0) return "";
  const blocks = strategies.map((s: any, i: number) => {
    const lines = [
      `SCRIPT #${s.scriptNumber || i + 1} STRATEGY (BINDING — the script must execute exactly this):`,
      `- Awareness state: ${s.awarenessState}${s.stageMatch === "evidence-suggests-other" && s.suggestedStage ? ` (note: evidence suggests "${s.suggestedStage}" — the operator's choice stands, but keep assumptions within it)` : ""}`,
      `- Market sophistication: level ${s.marketSophistication}${s.sophisticationNote ? ` (${s.sophisticationNote})` : ""}`,
      `- Dominant mass desire: ${s.massDesire}`,
      `- Belief shift: from "${s.currentBelief}" to "${s.requiredBeliefShift}"`,
      `- Primary angle: ${s.primaryAngle}`,
      `- Schwartz process: ${s.schwartzProcess}`,
      `- Mechanism: ${s.mechanism}`,
      `- Proof type (only proof supported by supplied facts): ${s.proofType}`,
      `- CTA (smallest natural next action): ${s.cta}`
    ];
    if (Array.isArray(s.unsupportedClaimsExcluded) && s.unsupportedClaimsExcluded.length > 0) {
      lines.push(`- FORBIDDEN CLAIMS (no supplied fact supports these — the script must NOT state them): ${s.unsupportedClaimsExcluded.join("; ")}`);
    }
    return lines.join("\n");
  });
  return `\n\n🧭 STRATEGIBLOKKE FRA KLASSIFICERINGEN (SKRIDT 1 — BINDENDE FOR HVERT SCRIPT):
Hvert script SKAL flytte præcis ÉN blokerende overbevisning (belief shift), bruge den angivne vinkel, mekanisme og bevistype, og holde sig inden for stadiets tilladte antagelser. Skriv replikkerne på markedssproget fra bunden i naturligt kundesprog — oversæt ALDRIG engelsk copy ordret.

${blocks.join("\n\n")}\n`;
}

/** Kort strategikontekst til regenererings-kaldene, så nye forslag bliver i samme strategi. */
function buildStrategyContextForRegeneration(script: any): string {
  const s = script?.strategy;
  if (!s) return "";
  return `\nSTRATEGI FOR DETTE SCRIPT (BINDENDE — det nye forslag skal blive inden for samme strategi):
- Awareness: ${s.awarenessState} | Mass desire: ${s.massDesire} | Belief shift: "${s.currentBelief}" → "${s.requiredBeliefShift}"
- Vinkel: ${s.primaryAngle} | Mekanisme: ${s.mechanism} | Bevistype: ${s.proofType} | CTA: ${s.cta}${Array.isArray(s.unsupportedClaimsExcluded) && s.unsupportedClaimsExcluded.length > 0 ? `\n- FORBUDTE PÅSTANDE (må ikke bruges): ${s.unsupportedClaimsExcluded.join("; ")}` : ""}\n`;
}

// Helper function to scrape and analyze website content
async function scrapeWebsiteContent(urlStr: string): Promise<string> {
  if (!urlStr || typeof urlStr !== "string") return "";
  const rawUrl = urlStr.trim();
  if (!rawUrl) return "";

  // Extract clean domain name without protocol or trailing paths
  let cleanDomain = rawUrl
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim();

  // Create candidate URLs to try in sequence
  const candidates: string[] = [];
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    candidates.push(rawUrl);
    // Also add HTTP alternative if HTTPS was provided
    if (rawUrl.startsWith("https://")) {
      candidates.push("http://" + rawUrl.substring(8));
    }
  } else {
    candidates.push(`https://${cleanDomain}`);
    candidates.push(`http://${cleanDomain}`);
    if (!cleanDomain.startsWith("www.")) {
      candidates.push(`https://www.${cleanDomain}`);
      candidates.push(`http://www.${cleanDomain}`);
    }
  }

  const uniqueCandidates = Array.from(new Set(candidates));

  let successfulHtml = "";
  let successfulUrl = uniqueCandidates[0];

  for (const candidateUrl of uniqueCandidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000); // 6s per candidate

      const response = await fetch(candidateUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "da,en-US;q=0.9,en;q=0.8",
        },
      });

      clearTimeout(timeout);

      if (response.ok) {
        successfulHtml = await response.text();
        successfulUrl = candidateUrl;
        break;
      }
    } catch {
      // Continue trying next candidate gracefully
      continue;
    }
  }

  if (!successfulHtml) {
    return `Hjemmeside Link: "${rawUrl}" (Domæne: ${cleanDomain}). Brug virksomhedsnavnet og domænenavnet til at udlede deres ydelser, produkter og branche.`;
  }

  try {
    // Extract title
    const titleMatch = successfulHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

    // Extract meta description
    const metaDescMatch = successfulHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          successfulHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].replace(/\s+/g, " ").trim() : "";

    // Extract headings (h1, h2, h3)
    const headings: string[] = [];
    const headingMatches = successfulHtml.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
    for (const match of headingMatches) {
      const cleanHeading = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (cleanHeading && cleanHeading.length > 3 && cleanHeading.length < 150) {
        headings.push(cleanHeading);
      }
    }

    // Strip scripts, styles, svg, nav, footer, header
    let cleanText = successfulHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length > 3000) {
      cleanText = cleanText.substring(0, 3000) + "...";
    }

    let summaryParts: string[] = [];
    summaryParts.push(`Hjemmeside Link: "${successfulUrl}"`);
    if (title) summaryParts.push(`Side-titel: "${title}"`);
    if (metaDesc) summaryParts.push(`Meta-beskrivelse: "${metaDesc}"`);
    if (headings.length > 0) {
      const uniqueHeadings = Array.from(new Set(headings)).slice(0, 15);
      summaryParts.push(`Hovedoverskrifter og Ydelser fundet på siden:\n- ${uniqueHeadings.join("\n- ")}`);
    }
    if (cleanText) {
      summaryParts.push(`Ekstraheret tekstindhold fra hjemmesiden:\n"${cleanText}"`);
    }

    return summaryParts.join("\n\n");
  } catch (err: any) {
    return `Hjemmeside Link: "${rawUrl}" (Domæne: ${cleanDomain}). Brug virksomhedsnavnet og domænet til at identificere deres services, produkter og branche.`;
  }
}

// API Endpoint for generating Meta Ads scripts
app.post("/api/generate-scripts", async (req, res) => {
  try {
    const {
      companyName,
      companyWebsite = "",
      analysisDocument,
      productName = "",
      competitors = [],
      numScripts = 2,
      scriptConfigs = [],
      numHooksPerScript = 3,
      bodyDuration = "30-40 sekunder",
      scriptType = "UGC (User Generated Content)",
      productDescription = "",
      targetAudience = "",
      demographics = "",
      offerOrCta = "",
      scriptFocus = "product",
      language = "da",
      globalAnalogies = [],
      toneOfVoice = "",
    } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, error: "Virksomhedsnavn er påkrævet." });
    }

    let websiteAnalysisText = "";
    if (companyWebsite && companyWebsite.trim().length > 0) {
      websiteAnalysisText = await scrapeWebsiteContent(companyWebsite.trim());
    }

    let analysisDocText = "";
    if (analysisDocument) {
      analysisDocText = await extractTextFromAnalysisDoc(analysisDocument);
    }

    const filteredCompetitors = Array.isArray(competitors)
      ? competitors.filter((c: any) => typeof c === "string" && c.trim().length > 0).slice(0, 3)
      : [];

    const competitorsText = filteredCompetitors.length > 0
      ? `Konkurrenter at differentiere sig imod: ${filteredCompetitors.join(", ")}.`
      : "Ingen specifikke konkurrenter angivet (fokuser på generelle alternativer i markedet).";

    const promptLanguage = language === "en" ? "English" : "Danish";

    const globalAnalogiesText = Array.isArray(globalAnalogies) && globalAnalogies.length > 0
      ? `\n\nSTÆRKE ANALOGIER & TALESPROG DER SKAL INTEGRERES I MANUSKRIPTERNE:\n` + globalAnalogies.map((a: string) => `- "${a}"`).join("\n")
      : "";

    let perScriptSpecs = "";
    if (Array.isArray(scriptConfigs) && scriptConfigs.length > 0) {
      perScriptSpecs = scriptConfigs.slice(0, numScripts).map((cfg: any, i: number) => {
        const scriptProdDesc = cfg.productDescription || productDescription;
        const scriptTargetAud = cfg.targetAudience || targetAudience;
        const scriptDemographics = cfg.demographics || demographics;
        const scriptOfferCta = cfg.offerOrCta || offerOrCta;
        const scriptHookTypes = Array.isArray(cfg.preferredHookTypes) && cfg.preferredHookTypes.length > 0 ? cfg.preferredHookTypes : null;
        const scriptMustInclude = cfg.mustInclude ? cfg.mustInclude.trim() : null;
        const scriptAwareness = cfg.awarenessStage ? cfg.awarenessStage.trim() : null;
        const scriptTrafficType = normalizeTraffic(cfg.trafficType);
        const scriptRetargetingNotes = cfg.retargetingNotes ? cfg.retargetingNotes.trim() : null;
        const scriptAnalogies = Array.isArray(cfg.analogies) && cfg.analogies.length > 0 ? cfg.analogies : null;

        let extraDetails = [];
        if (scriptAwareness) extraDetails.push(`AWARENESS STADIE: "${scriptAwareness}"`);
        extraDetails.push(`TRAFIK-TEMPERATUR: ${TRAFFIC_LABELS[scriptTrafficType]}${scriptRetargetingNotes ? ` Hvad seeren allerede har set: "${scriptRetargetingNotes}"` : ''}`);
        if (scriptProdDesc) extraDetails.push(`Produkt/USP: "${scriptProdDesc}"`);
        if (scriptTargetAud) extraDetails.push(`Ideelle kunde: "${scriptTargetAud}"`);
        if (scriptDemographics) extraDetails.push(`Hvor i landet / Geografi: "${scriptDemographics}"`);
        if (scriptOfferCta) extraDetails.push(`Tilbud/CTA: "${scriptOfferCta}"`);
        if (scriptHookTypes && scriptHookTypes.length > 0) {
          const perHookFormatted = scriptHookTypes.slice(0, cfg.numHooks || 3).map((v: string, hIdx: number) => `Hook #${hIdx + 1} Vinkel: "${v}"`);
          extraDetails.push(`Ønskede hook-vinkler (1 specifik vinkel pr. hook): [ ${perHookFormatted.join(" | ")} ]`);
        }
        if (scriptMustInclude) extraDetails.push(`SKAL INKLUDERES (specifikke punkter/elementer): "${scriptMustInclude}"`);
        if (scriptAnalogies) extraDetails.push(`SPECIFIKKE ANALOGIER / TALESPROG DER SKAL BENYTTES: ${scriptAnalogies.map((a: string) => `"${a}"`).join(", ")}`);

        return `SCRIPT #${i + 1}:
- Type: "${cfg.scriptType || scriptType}"
- Samlet varighed for HELE videoen (Hook + Body + CTA): ${durationSpec(cfg.bodyDuration || bodyDuration)}
- Antal hooks: ${cfg.numHooks || numHooksPerScript}${extraDetails.length > 0 ? `\n- Specifikke detaljer for dette script: ${extraDetails.join(" | ")}` : ""}`;
      }).join("\n\n");
    } else {
      perScriptSpecs = `Alle ${numScripts} scripts skal have standard type "${scriptType}", samlet varighed for hele videoen ${durationSpec(bodyDuration)} og ${numHooksPerScript} hooks.`;
    }

    const focusInstruction = scriptFocus === 'lead'
      ? `SÆRLIGT KAMPAGNE-FOKUS: LEAD-GENERERING (LEAD FOKUSERET)
CRITICAL: Alle ${numScripts} scripts skal tilpasses og vinkles 100% til LEAD GENERERING (f.eks. tiltrække nye leads, tilmelding til en gratis guide / e-bog, booke en gratis uforpligtende samtale / konsultation, prøve en gratis demo, tilmelde sig webinar eller nyhedsbrev).
- Alle hooks, dialoger og CTAs skal opbygge værdifuld nysgerrighed og opfordre til at klikke for at hente/booke/tilmelde sig (lead magnet).
- Undgå direkte e-handel / produkt-købssprog ("Læg i kurv", "Køb nu i webshoppen"); brug i stedet lead-orienteret sprog ("Hent din gratis guide", "Book dit kald i dag", "Tilmeld dig nu").`
      : `SÆRLIGT KAMPAGNE-FOKUS: PRODUKTSALG & E-COMMERCE (PRODUKT FOKUSERET)
CRITICAL: Alle ${numScripts} scripts skal tilpasses og vinkles 100% til DIREKTE PRODUKTSALG (f.eks. e-handel, køb af det fysiske eller digitale produkt, visning af produktet i brug, pris/rabat og opfordring til direkte køb).
- Alle hooks, dialoger og CTAs skal fremhæve produktets unikke fordele og lede brugeren til direkte konvertering og køb.`;

    const requestedTypes: string[] = Array.isArray(scriptConfigs) && scriptConfigs.length > 0
      ? scriptConfigs.map((cfg: any) => cfg.scriptType || scriptType)
      : [scriptType];

    const scriptTypeMasterGuidelines = getScriptTypeGuidelinesPrompt(requestedTypes);

    const toneInstruction = typeof toneOfVoice === "string" && toneOfVoice.trim().length > 0
      ? `\nTONE OF VOICE / TALESPROG (SKAL GENNEMSYRE ALLE TALTE REPLIKKER):\n"${toneOfVoice.trim()}"\n- Alle audioDialogue-replikker skal lyde som denne tone, uden at bryde hook-reglerne og sprogforbuddene.\n`
      : "";

    // Skridt 1 af 2: klassificér strategien pr. script FØR der skrives copy (playbookens kernekrav).
    const effectiveConfigs = Array.isArray(scriptConfigs) && scriptConfigs.length > 0
      ? scriptConfigs.slice(0, numScripts)
      : Array.from({ length: numScripts }, () => ({
          scriptType, bodyDuration, numHooks: numHooksPerScript, awarenessStage: "Problem Aware", trafficType: "cold"
        }));

    const strategies = await classifyScriptStrategies({
      companyName,
      productName,
      productDescription,
      targetAudience,
      demographics,
      offerOrCta,
      competitors: filteredCompetitors,
      scriptFocus,
      language,
      analysisDocText,
      websiteAnalysisText,
      toneOfVoice,
      scriptConfigs: effectiveConfigs
    });

    const strategyInstruction = buildStrategyInstruction(strategies);
    const playbookSection = buildPlaybookGenerationSection({
      stages: effectiveConfigs.map((c: any) => c.awarenessStage || "Problem Aware"),
      language,
      scriptFocus
    });

    const prompt = `
Du er en verdensklasse Direct Response Meta Ads (Facebook & Instagram Video Ads) copywriter og video instruktør.
Din opgave er at generere præcis ${numScripts} højkonverterende video-script-koncepter til en Meta annoncekampagne.

${focusInstruction}
${toneInstruction}${scriptTypeMasterGuidelines}
PRODUKT / VIRKSOMHED DETALJER:
- Virksomhedsnavn: "${companyName}"
${companyWebsite ? `- Virksomhedens Hjemmeside: "${companyWebsite}"` : ""}
${productName ? `- Produktnavn: "${productName}"` : ""}
- ${competitorsText}
${productDescription ? `- Produktbeskrivelse / Unikke fordele: "${productDescription}"` : ""}
${targetAudience ? `- Ideelle kunde: "${targetAudience}"` : ""}
${demographics ? `- Hvor i landet / Geografi: "${demographics}"` : ""}
${offerOrCta ? `- Tilbud / Call to Action: "${offerOrCta}"` : ""}${globalAnalogiesText}
${websiteAnalysisText ? `\n🔍 VIRKSOMHEDENS HJEMMESIDE ANALYSE & ANVENDELIGT INDHOLD:\n${websiteAnalysisText}\n\nKRITISK REGEL FOR HJEMMESIDE-ANALYSE:\nAnvend de præcise services, ydelser, fagudtryk, løsninger og værditilbud fra hjemmeside-analysen ovenfor direkte i manuskripterne. Vinkl scriptsne så de passer 100% til de faktiske ydelser og produkter virksomheden sælger på deres webside!` : ""}
${analysisDocText ? `\n\n🔍 VIRKSOMHEDS- OG MÅLGRUPPEANALYSE DOKUMENT ("${analysisDocument?.name || 'Målgruppeanalyse.pdf'}"):\nIndhold fra det uploadede analysedokument:\n"""\n${analysisDocText}\n"""\n\nKRITISK REGEL FOR UPLOADET ANALYSEDOKUMENT:\nAnvend den dybe viden fra den uploadede virksomheds- og målgruppeanalyse som det primære fundament for alle manuskripter:\n1. Beting alle hooks og dialoger på målgruppens reelle smertepunkter, ubevidste og bevidste frustrationer, købsudløsere (triggers) og barrierer fra analysen.\n2. BRUG BRANCHENS OG MÅLGRUPPENS EGNE ORD: Integrer de specifikke udtryk, fagsprog og citater fundet i analysen (f.eks. fagbegreber som 'KS', 'tilsyn', 'fejl og mangler', 'ryggen fri', eller målgruppens direkte udtalelser).\n3. Tilpas scriptsne til de specifikke kundepersonaer og brancher der er fremhævet i analysedokumentet.` : ""}
- Sprog i scriptet: ${promptLanguage} (skal være flydende, autentisk, mundtligt og engagerende).

INDIVIDUELLE SCRIPT SPECIFIKATIONER (Skal overholdes præcist for hvert enkelt script):
${perScriptSpecs}
${strategyInstruction}${playbookSection}
REGLER FOR AWARENESS STADIE & TRAFIK-TYPE:
- Hvis et script er angivet til et bestemt AWARENESS STADIE (f.eks. Unaware, Problem Aware, Solution Aware, Product Aware, Most Aware), SKAL hele vinklen, hooken og manuskriptet tilpasses dette stadium:
  * Unaware (Ubevidst): Åbn med nysgerrighed eller en uventet opdagelse/smerte. Målgruppen ved endnu ikke de har et behov.
  * Problem Aware (Problembevidst): Fremhæv smerten og de kendte frustrationer stærkt, opbyg empati og introducer kategorien.
  * Solution Aware (Løsningsbevidst): Fokuser på hvorfor dit produkt/mekanisme virker anderledes og bedre end andre løsninger på markedet.
  * Product Aware (Produktbevidst): Fjern tvivl og indvendinger, fremvis beviser, UGC, anmeldelser og produkt-demonstration.
  * Most Aware (Mest bevidst / Købsklar): Fokuser direkte på tilbuddet, rabat, garanti, tidsfrist/urgency og en kontant CTA.
- TRAFIK-TEMPERATUREN ER LIGE SÅ BINDENDE SOM AWARENESS-STADIET. Awareness handler om hvad seeren ved om PROBLEMET og LØSNINGEN. Temperatur handler om deres historik med VIRKSOMHEDEN. De to akser bruges sammen: et Problem Aware-script til kold trafik må kende smerten, men ikke brandet.
- "Hot" betyder KØBSKLAR (kurv-afbrud, prisside, gentagne besøg på beslutningssider), ikke "eksisterende kunde".
- Hvis et script er markeret som KOLD:
  * Seeren har ALDRIG hørt om virksomheden. Scriptet må intet tage for givet om kendskab til brand, produkt, tidligere besøg eller tilbud.
  * STRENGT FORBUDT: "Som du ved", "Husker du", "Du har set", "Kom tilbage", "Din kurv", "Igen i dag", "Vi har jo", og enhver anden formulering der forudsætter et tidligere møde med virksomheden.
  * Intet brandnavn i første linje. Start ved problemet, formuleret som seeren selv ville sige det. Virksomhedsnavnet falder først når der er skabt genkendelse.
  * Tilbuddet er ikke åbningen. Rabat, kode og deadline hører til i CTA'en, ikke i de første sekunder hvor seeren endnu ikke ved hvad der sælges.
  * CTA'en er et lavfriktions-skridt: se hvordan, hent guiden, se sammenligningen. IKKE "book en demo" eller "køb nu" som primær opfordring.
  * Bevis må gerne være generisk kategoribevis, for der er endnu ingen relation at trække på. Vis det i billedet frem for at påstå det.
  * Kvalificér den rigtige seer tidligt, så de forkerte scroller videre: nævn situationen, faget eller rollen konkret i stedet for en bred påstand alle kan nikke til.
- Hvis et script er markeret som VARM:
  * Seeren har en forbindelse til virksomheden: har været på sitet, set en video, klikket en annonce eller søgt på brandet. Spring den generiske introduktion over.
  * Referér konkret til det seeren allerede har set eller gjort (se feltet "Hvad har de allerede set?", hvis det er udfyldt).
  * Beviset skal være SPECIFIKT: en case, et tal, en navngiven kunde, en demonstration. Ikke kategoribevis.
  * CTA'en er et lavtærskel-næste-skridt, ikke et køb: se casen, book en snak, få et estimat, sammenlign.
  * Genforklar ikke problemet fra bunden. Seeren kender det, og en genopvarmning spilder de sekunder der skulle flytte beslutningen.
- Hvis et script er markeret som HOT:
  * Seeren er købsklar og færdig med at blive undervist. Fjern friktion frem for at tilføje overtalelse.
  * Knyt budskabet til præcis det de har set: varen i kurven, siden de læste, prisen de tjekkede.
  * Direkte tilbud og tydelig CTA: køb nu, vælg tidspunkt, betal depositum, fuldfør bestillingen.
  * Hastværk KUN hvis det er ægte og står i materialet. Falsk knaphed og permanente nedtællinger koster tillid.
  * Ingen genopvarmning af problemet og ingen ny undervisning. Det forsinker købet.

KRITISK REGEL FOR VARIGHED, TALEHASTIGHED OG REPLIKLÆNGDE (SAMLET TID FOR HELE VIDEOEN):
- Varigheden angives som et INTERVAL (f.eks. "20-30 sekunder", "30-40 sekunder"). Det er den SAMLEDE LÆNGDE FOR HELE MANUSKRIPTET TILSAMMEN (Hook + Body-scener + CTA).
- Intervallet er en ramme, ikke et præcist mål. Scriptet må lande hvor som helst inde i intervallet. Lad indholdet bestemme længden: har historien brug for hele intervallet, så brug det, og er pointen landet før, så stop dér i stedet for at strække teksten med fyld. Gå aldrig under den nedre eller over den øvre grænse.
- Mennesker taler i et roligt, naturligt og behageligt tempo i videoer (ca. 2,0-2,2 ord pr. sekund på dansk). Skuespillere skal ikke tale for hurtigt eller stresse.
- Ordbudgettet for hvert script står i selve script-specifikationen og følger taletempoet. Hold det samlede ordantal af dialogen (audioDialogue) på tværs af hele scriptet inden for det budget.
- Replikkerne skal være mundtlige, skarpe, fængende og fri for fyldord!
- Tidskoderne for Body-scenerne og CTA skal lægges, så de går op med den samlede længde, du har valgt inde i intervallet. Sidste tidskode slutter dér, hvor scriptet reelt slutter.

REGLER FOR HOOKS (SÅDAN SKABES HOOKET: CONTEXT -> PULL -> WHIPLASH):
- Generer det præcise antal hooks der er angivet for det pågældende script. Alle hooks til et script skal kunne klippes ind foran samme body.
- KRITISK REGEL FOR HOOK-VINKLER: Der er angivet nøjagtig 1 specifik vinkel pr. hook i specifikationerne (f.eks. Hook #1 Vinkel, Hook #2 Vinkel, Hook #3 Vinkel). Hook #1 SKAL skabes 100% ud fra 'Hook #1 Vinkel', Hook #2 SKAL skabes ud fra 'Hook #2 Vinkel', Hook #3 ud fra 'Hook #3 Vinkel' osv.
- opbygning af HVER HOOK REPLIK (Tre-delt opbygning i løbet af sek. 0-3):
  1. CONTEXT (sekund 0): Navngiver emnet med en flad konstaterende sætning på 3-8 ord i nutid/datid. INGEN hilsen ("Hej med jer"), INTET spørgsmål ("Er du træt af"), INGEN optakt.
  2. PULL (sekund 1-2): Lad fælden med præcis én af følgende typer:
     * TABOO: Sig det der føles socialt farligt at sige højt.
     * DARK: Afslør en skjult mekanisme der allerede rammer seeren uden deres viden.
     * CONTRADICTION: Sig det direkte modsatte af målgruppens vante overbevisning.
     * PROOF: Led med et konkret tal fra analysen/data (må kun bruges hvis tallet eksisterer!).
  3. WHIPLASH (sekund 2-3): Ryk linen stik modsat af hvad optakten fik seeren til at forvente (reversal of goal/blame/outcome/role).
- AWARENESS-STADIE MATRIX FOR HOOKS:
  * Unaware: Context = situationen/vanen (aldrig problemet/produktet). Pull: Dark, Taboo, Contradiction. Produktnavn & tilbud FORBUDT.
  * Problem Aware: Context = symptomet/situationen hvor smerten opstår. Pull: Dark, Contradiction, Taboo. Produktnavn FORBUDT.
  * Solution Aware: Context = løsningskategorien. Pull: Contradiction, Dark, Proof. Produktnavn kun tilladt til sidst.
  * Product Aware: Context = produktet/indvendingen. Pull: Proof, Taboo, Contradiction. Produktnavn TILLADT.
  * Most Aware: Context = tilbuddet/garantien/deadline. Pull: Proof, Contradiction, Taboo. Tilbud SKAL optræde.
- FASTE HOOK-REGLER:
  * Maks 25 ord totalt pr. hook (under 3 sekunder taletid).
  * Mundtligt dansk talesprog som en dansker taler.
  * STRENGT FORBUDTE ORD OG ANGULICISMER: "gamechanger", "game changer", "game-changer", "det handler om at", "lad os dykke ned i". Erstat dem ikke med reklamefyld som "revolutionerende" eller "banebrydende" (se skrivestils-reglerne); sig i stedet konkret hvad produktet gør.
  * STRENGT FORBUDTE ÅBNINGER: "Hej med jer", "Er du træt af", "Lad mig fortælle dig", "Du vil ikke tro", "Stop op", "I dagens video", "POV: du".
  * SKRIV ALDRIG MED KUN STORE BOGSTAVER (ALL CAPS): Brug altid almindelig dansk retskrivning med kun stort begyndelsesbogstav og små bogstaver for at gøre teksten naturlig og letlæselig.
  * INGEN tankestreger (-) i talte linjer eller overlays.
  * Skal virke uden lyd: Skærm overlay skal være 3 til 7 stærke ord.
  * Fysisk visuel handling i sekund 0 (beskriv hvad skuespiller/kamera gør i billedet).
  * Nævn aldrig konkurrenter ved navn i talte replikker eller overlay.
- Hver hook skal indeholde:
  1. angleType (f.eks. "Pattern Interrupt", "Indvendingsknuser", "Contradiction", osv.)
  2. visualDirection (hvad skuespilleren/kameraet fysisk gør i sekund 0-3)
  3. textOnScreen (3-7 ord stor tekst-overlay til skærmen uden lyd)
  4. audioDialogue (den talte replik opbygget med Context + Pull + Whiplash)
  5. estimatedDurationSec (typisk 3 sekunder)

REGLER FOR BODY SCENES (Manuskriptet):
- Opdel kropsstykket af scriptet i strukturerede scener med præcise tidskoder tilpasset den angivne varighed for det script.
- KRITISK REGEL FOR BODY: Body-scenerne SKAL KUN indeholde historien, problemløsningen, produktfordelene, B-roll og social proof. Body-scenerne må ALDRIG indeholde den afsluttende Call To Action, rabatkoder (f.eks. 'Spar 20%', 'Brug koden SCANDI20'), eller købsopfordringer! Alt tilbud og Call To Action placeres UDELUKKENDE i 'callToAction'.
- KRITISK REGEL FOR CTA ('callToAction'): Feltet må KUN indeholde den afsluttende TALTE replik, ordret som den siges. Ingen tidskoder ("0:26, 0:30"), ingen scene- eller kamerabeskrivelser ("End card med logo", "app-skærmbillede vises"), ingen overlay-anvisninger ("Overlay: ..."), ingen regi-noter om tone eller stemme ("Voiceover i rolig business-tone") og ingen forklaring af, hvad klikket fører til. Kun replikken. Alt visuelt hentes separat bagefter, når brugeren beder om det.
- Hver scene skal have:
  1. timecode (f.eks. "0:03 - 0:08")
  2. section (en af: 'Problem/Pain', 'Solution/Demo', 'Social Proof', 'Value Prop')
  3. visualDescription (B-roll, skuespiller handling, produkt-demonstration, kameravinkel)
  4. textOnScreen (dynamiske undertekster / overlays)
  5. audioDialogue (mundtlig speak / voiceover / skuespiller replik)
  6. soundEffects (SFX som swoosh, pop, baggrundsmusik stemning)

DIFFERENTIERING MOD KONKURRENTER:
- Hvis der er konkurrenter (${filteredCompetitors.join(", ")}), skal scriptet explicit fremhæve hvorfor ${companyName} er bedre eller anderledes (f.eks. "Hvorfor folk skifter fra ${filteredCompetitors[0] || 'andre'}...", "I modsætning til [Konkurrent] som er...", osv.).
${buildAiTrainingPromptSnippet()}
Sørg for at svare udelukkende med et struktureret JSON-objekt jf. det angivne JSON schema.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        scripts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              conceptAngle: { type: Type.STRING },
              scriptType: { type: Type.STRING },
              bodyDuration: { type: Type.STRING },
              companyName: { type: Type.STRING },
              competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
              competitorDifferentiation: { type: Type.STRING },
              awarenessStage: { type: Type.STRING },
              trafficType: { type: Type.STRING },
              hooks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    hookNumber: { type: Type.INTEGER },
                    angleType: { type: Type.STRING },
                    visualDirection: { type: Type.STRING },
                    textOnScreen: { type: Type.STRING },
                    audioDialogue: { type: Type.STRING },
                    estimatedDurationSec: { type: Type.INTEGER }
                  },
                  required: ["hookNumber", "angleType", "visualDirection", "textOnScreen", "audioDialogue"]
                }
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    timecode: { type: Type.STRING },
                    section: { type: Type.STRING },
                    visualDescription: { type: Type.STRING },
                    textOnScreen: { type: Type.STRING },
                    audioDialogue: { type: Type.STRING },
                    soundEffects: { type: Type.STRING }
                  },
                  required: ["timecode", "section", "visualDescription", "textOnScreen", "audioDialogue"]
                }
              },
              callToAction: { type: Type.STRING },
              proTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "conceptAngle", "hooks", "scenes", "callToAction", "competitorDifferentiation"]
          }
        }
      },
      required: ["scripts"]
    };

    const response = await generateContentJson({
      prompt,
              system: "Du er en prisvindende Meta Ads video script strateg og copywriter.",
        schema: responseSchema
    });

    const rawText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      console.error("Fejl ved parsing af JSON fra AI-modellen:", rawText);
      return res.status(500).json({ success: false, error: "Ugyldigt format modtaget fra AI modellen." });
    }

    const scripts = (parsedData.scripts || []).map((script: any, idx: number) => {
      const cfg = Array.isArray(scriptConfigs) && scriptConfigs[idx] ? scriptConfigs[idx] : null;
      const effectiveScriptType = cfg?.scriptType || script.scriptType || scriptType;
      const effectiveBodyDuration = cfg?.bodyDuration || script.bodyDuration || bodyDuration;
      // Modellen selvrapporterer stadie og trafik-type i sit svar, og den kan drive fra
      // det operatøren valgte. Opsætningen vinder, så kortet og det gemte script viser
      // det der faktisk blev bestilt.
      const effectiveAwareness = cfg?.awarenessStage || script.awarenessStage || "Problem Aware";
      const effectiveTrafficType = normalizeTraffic(cfg?.trafficType || script.trafficType);

      const rawScript = {
        ...script,
        id: script.id || `script-${Date.now()}-${idx}`,
        documentTitle: req.body.documentTitle || `${companyName} - Script 2`,
        companyName: companyName,
        productName: productName || undefined,
        competitors: filteredCompetitors,
        scriptType: effectiveScriptType,
        bodyDuration: effectiveBodyDuration,
        awarenessStage: effectiveAwareness,
        trafficType: effectiveTrafficType,
        strategy: strategies?.[idx] || undefined,
        createdAt: new Date().toISOString(),
        hooks: (script.hooks || []).map((h: any, hIdx: number) => ({
          ...h,
          id: h.id || `hook-${idx}-${hIdx}-${Date.now()}`,
          hookNumber: h.hookNumber || hIdx + 1,
          estimatedDurationSec: h.estimatedDurationSec || 3
        })),
        scenes: (script.scenes || []).map((s: any, sIdx: number) => ({
          ...s,
          id: s.id || `scene-${idx}-${sIdx}-${Date.now()}`
        }))
      };

      return sanitizeScript(rawScript);
    });

    return res.json({ success: true, scripts });
  } catch (error: any) {
    console.error("Error generating scripts:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Der opstod en fejl under generering af scripts."
    });
  }
});

// API Endpoint for regenerating individual elements (hook, cta, or full script)
app.post("/api/regenerate-element", async (req, res) => {
  try {
    const {
      elementType, // 'hook' | 'cta' | 'script'
      script,
      hookIndex,
      companyName,
      productName,
      productDescription,
      targetAudience,
      offerOrCta,
      scriptFocus,
      language = "da"
    } = req.body;

    if (!elementType || !script) {
      return res.status(400).json({ success: false, error: "Manglende parametre til re-generering." });
    }

    const promptLanguage = language === "en" ? "English" : "Danish";
    const strategyContext = buildStrategyContextForRegeneration(script);
    const writingStyle = buildWritingStyleSection();

    if (elementType === "hook") {
      const existingHook = script.hooks && script.hooks[hookIndex] ? script.hooks[hookIndex] : null;
      const otherHooksText = (script.hooks || [])
        .filter((_: any, idx: number) => idx !== hookIndex)
        .map((h: any) => `Hook: "${h.audioDialogue}" (Vinkel: ${h.angleType || 'Ukendt'})`)
        .join("\n");

      const prompt = `
Du er en verdensklasse Meta Ads copywriter.
Opgave: Generér 1 NY, frisk, højkonverterende video-hook til en Meta video-annonce på ${promptLanguage}.
${strategyContext}${writingStyle}
VIRKSOMHED / PRODUKT DETALJER:
- Navn: "${companyName || script.companyName || ''}"
${productName || script.productName ? `- Produkt: "${productName || script.productName}"` : ''}
${productDescription ? `- Produktbeskrivelse: "${productDescription}"` : ''}
${targetAudience ? `- Målgruppe: "${targetAudience}"` : ''}
${scriptFocus === 'lead' ? '- Kampagnefokus: LEAD GENERERING (Tilmeld, hent guide, book samtale)' : '- Kampagnefokus: PRODUKTSALG'}

DEN NUVÆRENDE HOOK SKAL UDSKIFTES:
"${existingHook ? existingHook.audioDialogue : 'Ingen'}"

ANDRE HOOKS I DETTE SCRIPT (Undgå at gentage disse vinkler eller ordlyd):
${otherHooksText || 'Ingen andre hooks'}

REGLER FOR DET NYE HOOK (3-DELT OPBYGNING: CONTEXT -> PULL -> WHIPLASH):
1. CONTEXT (sek. 0): 3-8 ord flad konstatering der navngiver emnet på 1 sekund. Ingen "Hej med jer", intet spørgsmål, ingen optakt.
2. PULL (sek. 1-2): Vælg præcis 1: Taboo, Dark, Contradiction, eller Proof.
3. WHIPLASH (sek. 2-3): Ryk linen stik modsat af hvad optakten fik dem til at forvente.
4. SPOR / STIL: Flydende dansk talesprog. Max 25 ord i alt (max 3 sekunder taletid).
5. SKÆRM OVERLAY: 3-7 iøjnefaldende ord til visning uden lyd.
6. VISUEL HANDLING: Konkret hvad skuespiller/kamera gør i sekund 0.

Returnér UDELUKKENDE et JSON-objekt:
{
  "angleType": "f.eks. Pattern Interrupt / Loss Aversion / Specificitet / Status / Curiosity gap / Identity / Authority / Future pacing / Kontrast",
  "visualDirection": "Kort beskrivelse af hvad skuespiller/kamera gør i de første 3 sekunder",
  "textOnScreen": "Iøjnefaldende tekst-overlay til skærmen",
  "audioDialogue": "Den nye talte replik / speak",
  "estimatedDurationSec": 3
}
`;

      const response = await generateContentJson({
        prompt,
                  schema: {
            type: Type.OBJECT,
            properties: {
              angleType: { type: Type.STRING },
              visualDirection: { type: Type.STRING },
              textOnScreen: { type: Type.STRING },
              audioDialogue: { type: Type.STRING },
              estimatedDurationSec: { type: Type.INTEGER }
            },
            required: ["angleType", "visualDirection", "textOnScreen", "audioDialogue"]
          }
      });

      const newHookData = JSON.parse(response.text || "{}");
      const updatedHooks = [...(script.hooks || [])];
      const targetIdx = typeof hookIndex === 'number' && hookIndex >= 0 ? hookIndex : 0;

      updatedHooks[targetIdx] = {
        id: `hook-${Date.now()}-${targetIdx}`,
        hookNumber: targetIdx + 1,
        angleType: newHookData.angleType || "Frisk Vinkel",
        visualDirection: newHookData.visualDirection || "",
        textOnScreen: newHookData.textOnScreen || "",
        audioDialogue: newHookData.audioDialogue || "",
        estimatedDurationSec: newHookData.estimatedDurationSec || 3
      };

      const updatedScript = {
        ...script,
        hooks: updatedHooks
      };

      return res.json({ success: true, script: sanitizeScript(updatedScript) });

    } else if (elementType === "cta") {
      const bodySummary = (script.scenes || [])
        .map((s: any) => s.audioDialogue)
        .filter(Boolean)
        .join(" ");

      const prompt = `
Du er en verdensklasse Meta Ads copywriter.
Opgave: Generér 1 NY, stærk og overbevisende Call To Action (CTA) replik til en Meta video-annonce på ${promptLanguage}.
${strategyContext}${writingStyle}
VIRKSOMHED / PRODUKT DETALJER:
- Navn: "${companyName || script.companyName || ''}"
${productName || script.productName ? `- Produkt: "${productName || script.productName}"` : ''}
${offerOrCta ? `- Tilbud / CTA instruktion: "${offerOrCta}"` : ''}
${scriptFocus === 'lead' ? '- Fokus: LEAD GENERERING (F.eks. Hent din gratis guide, Book en uforpligtende samtale, Tilmeld i dag)' : '- Fokus: PRODUKTSALG (F.eks. Bestil i dag med gratis fragt, Prøv i 100 dage uden risiko)'}

VIDEO MANUSKRIPTETS INDHOLD:
"${bodySummary}"

DEN EKSISTERENDE CTA DER SKAL UDSKIFTES:
"${script.callToAction || ''}"

Generér en ny, skarp og handlingsanvisende CTA replik.

KRITISK REGEL FOR CTA ('callToAction'): Feltet må KUN indeholde den afsluttende TALTE replik, ordret som den siges. Ingen tidskoder ("0:26, 0:30"), ingen scene- eller kamerabeskrivelser ("End card med logo", "app-skærmbillede vises"), ingen overlay-anvisninger ("Overlay: ..."), ingen regi-noter om tone eller stemme ("Voiceover i rolig business-tone") og ingen forklaring af, hvad klikket fører til. Kun replikken. Alt visuelt hentes separat bagefter, når brugeren beder om det.

Returnér UDELUKKENDE et JSON-objekt:
{
  "callToAction": "Kun den talte CTA-replik"
}
`;

      const response = await generateContentJson({
        prompt,
                  schema: {
            type: Type.OBJECT,
            properties: {
              callToAction: { type: Type.STRING }
            },
            required: ["callToAction"]
          }
      });

      const newCtaData = JSON.parse(response.text || "{}");
      const updatedScript = {
        ...script,
        callToAction: newCtaData.callToAction || script.callToAction
      };

      return res.json({ success: true, script: sanitizeScript(updatedScript) });

    } else if (elementType === "body") {
      const scriptType = script.scriptType || "UGC (User Generated Content)";
      const scriptTypeGuide = getScriptTypeGuidelinesPrompt([scriptType]);
      const bodyDuration = script.bodyDuration || "30-40 sekunder";
      const hooksSummary = (script.hooks || []).map((h: any) => h.audioDialogue).join(" / ");

      const prompt = `
Du er en verdensklasse Meta Ads copywriter.
Opgave: Generér NYE, friske body-scener / manuskript for denne Meta video-annonce på ${promptLanguage}.
${strategyContext}${writingStyle}
${scriptTypeGuide}
VIRKSOMHED & PRODUKT DETALJER:
- Virksomhedsnavn: "${companyName || script.companyName || ''}"
${productName || script.productName ? `- Produktnavn: "${productName || script.productName}"` : ''}
${productDescription ? `- Produktbeskrivelse: "${productDescription}"` : ''}
${targetAudience ? `- Målgruppe: "${targetAudience}"` : ''}
${offerOrCta ? `- Tilbud/CTA: "${offerOrCta}"` : ''}
- Sprog: ${promptLanguage}
- Script Type: "${scriptType}"
- Varighed: ${durationSpec(bodyDuration)}

EKSISTERENDE HOOKS DER SKAL PASSES TIL:
"${hooksSummary}"

EKSISTERENDE BODY DER SKAL UDSKIFTES OG FORBEDRES:
"${(script.scenes || []).map((s: any) => s.audioDialogue).join(' ')}"

KRITISK REGEL FOR BODY:
Generér KUN brødteksten/scenerne for bodyen (problem, løsning, demonstration, social proof).
Må ALDRIG indeholde Call To Action, rabatkoder (f.eks. 'Spar 20%'), eller købsopfordringer! Alt tilbud placeres separat i CTA.

Returnér UDELUKKENDE et JSON-objekt:
{
  "scenes": [
    {
      "timecode": "0:03 - 0:10",
      "section": "Problem/Pain / Solution/Demo / Social Proof / Value Prop",
      "visualDescription": "Beskrivelse af hvad der filmes i denne scene",
      "textOnScreen": "Tekst-overlay på skærmen",
      "audioDialogue": "Den talte replik / speak for denne del af bodyen",
      "soundEffects": "Lydeffekter eller bakgrunnsmusikk"
    }
  ]
}
`;

      const response = await generateContentJson({
        prompt,
                  schema: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timecode: { type: Type.STRING },
                    section: { type: Type.STRING },
                    visualDescription: { type: Type.STRING },
                    textOnScreen: { type: Type.STRING },
                    audioDialogue: { type: Type.STRING },
                    soundEffects: { type: Type.STRING }
                  },
                  required: ["timecode", "section", "visualDescription", "textOnScreen", "audioDialogue"]
                }
              }
            },
            required: ["scenes"]
          }
      });

      const parsed = JSON.parse(response.text || "{}");
      const updatedScript = {
        ...script,
        scenes: (parsed.scenes || []).map((s: any, sIdx: number) => ({
          ...s,
          id: `scene-${Date.now()}-${sIdx}`
        }))
      };

      return res.json({ success: true, script: sanitizeScript(updatedScript) });

    } else if (elementType === "hook_visual") {
      const targetIdx = typeof hookIndex === 'number' && hookIndex >= 0 ? hookIndex : 0;
      const targetHook = script.hooks && script.hooks[targetIdx] ? script.hooks[targetIdx] : null;

      const prompt = `
Du er en prisvindende video-director for Meta Ads annoncer.
Opgave: Generér 1 konkrete, kreative og let-filmbare VISUEL OPTAGE-IDÉ (B-roll / kameravinkel / skuespiller-handling) for følgende hook på ${promptLanguage}:

HOOK REPLIK:
"${targetHook ? targetHook.audioDialogue : ''}"

HOOK VINKEL:
"${targetHook ? targetHook.angleType : 'Pattern Interrupt'}"

PRODUKT / VIRKSOMHED:
"${companyName || script.companyName || ''}" - "${productName || script.productName || ''}"

Beskriv præcist hvad skuespilleren/kameraet skal gøre i de første 3 sekunder for at fange opmærksomheden visuelt og matche replikken perfekt.

Returnér UDELUKKENDE et JSON-objekt:
{
  "visualDirection": "Konkret og inspirerende beskrivelse af hvad der skal filmes (kamera, handling, b-roll, kropssprog)"
}
`;

      const response = await generateContentJson({
        prompt,
                  schema: {
            type: Type.OBJECT,
            properties: {
              visualDirection: { type: Type.STRING }
            },
            required: ["visualDirection"]
          }
      });

      const parsed = JSON.parse(response.text || "{}");
      const updatedHooks = [...(script.hooks || [])];
      if (updatedHooks[targetIdx]) {
        updatedHooks[targetIdx] = {
          ...updatedHooks[targetIdx],
          visualDirection: parsed.visualDirection || updatedHooks[targetIdx].visualDirection || "Visuel optagelse foran spejl/skærm"
        };
      }

      const updatedScript = {
        ...script,
        hooks: updatedHooks
      };

      return res.json({ success: true, script: updatedScript });

    } else if (elementType === "script") {
      const numHooks = (script.hooks || []).length || 3;
      const scriptType = script.scriptType || "UGC (User Generated Content)";
      const scriptTypeGuide = getScriptTypeGuidelinesPrompt([scriptType]);
      const bodyDuration = script.bodyDuration || "30-40 sekunder";

      const prompt = `
Du er en verdensklasse Meta Ads copywriter.
Opgave: Generér et HELT NYT komplet Meta Ads video-script (hooks, body scener og CTA) for ${companyName || script.companyName || 'Virksomheden'}.
${strategyContext}${writingStyle}
${scriptTypeGuide}
VIRKSOMHED & PRODUKT DETALJER:
- Virksomhedsnavn: "${companyName || script.companyName || ''}"
${productName || script.productName ? `- Produktnavn: "${productName || script.productName}"` : ''}
${productDescription ? `- Produktbeskrivelse: "${productDescription}"` : ''}
${targetAudience ? `- Målgruppe: "${targetAudience}"` : ''}
${offerOrCta ? `- Tilbud/CTA: "${offerOrCta}"` : ''}
- Sprog: ${promptLanguage}
- Script Type: "${scriptType}"
- Varighed: ${durationSpec(bodyDuration)}
- Antal hooks: ${numHooks}
${scriptFocus === 'lead' ? '- Fokus: LEAD GENERERING (Gratis guide, book samtale, tilmeld)' : '- Fokus: PRODUKTSALG'}

UNDGÅ DET EKSISTERENDE SCRIPT (Skab en helt ny vinkel og frisk dialog):
- Tidligere vinkel: "${script.conceptAngle || ''}"
- Tidligere CTA: "${script.callToAction || ''}"

Returnér et komplet JSON-objekt:
{
  "title": "Nyt script navn",
  "conceptAngle": "Nyt koncept / vinkel",
  "scriptType": "${scriptType}",
  "bodyDuration": "${bodyDuration}",
  "competitorDifferentiation": "Hvordan dette nye script differentierer sig",
  "hooks": [ ${numHooks} stks hooks med angleType, visualDirection, textOnScreen, audioDialogue, estimatedDurationSec ],
  "scenes": [ opdelte scener med timecode, section, visualDescription, textOnScreen, audioDialogue, soundEffects ],
  "callToAction": "Stærk afsluttende CTA, kun den talte replik"
}

KRITISK REGEL FOR CTA ('callToAction'): Feltet må KUN indeholde den afsluttende TALTE replik, ordret som den siges. Ingen tidskoder ("0:26, 0:30"), ingen scene- eller kamerabeskrivelser ("End card med logo", "app-skærmbillede vises"), ingen overlay-anvisninger ("Overlay: ..."), ingen regi-noter om tone eller stemme ("Voiceover i rolig business-tone") og ingen forklaring af, hvad klikket fører til. Kun replikken. Alt visuelt hentes separat bagefter, når brugeren beder om det.
`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          conceptAngle: { type: Type.STRING },
          scriptType: { type: Type.STRING },
          bodyDuration: { type: Type.STRING },
          competitorDifferentiation: { type: Type.STRING },
          hooks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                angleType: { type: Type.STRING },
                visualDirection: { type: Type.STRING },
                textOnScreen: { type: Type.STRING },
                audioDialogue: { type: Type.STRING },
                estimatedDurationSec: { type: Type.INTEGER }
              },
              required: ["angleType", "visualDirection", "textOnScreen", "audioDialogue"]
            }
          },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timecode: { type: Type.STRING },
                section: { type: Type.STRING },
                visualDescription: { type: Type.STRING },
                textOnScreen: { type: Type.STRING },
                audioDialogue: { type: Type.STRING },
                soundEffects: { type: Type.STRING }
              },
              required: ["timecode", "section", "visualDescription", "textOnScreen", "audioDialogue"]
            }
          },
          callToAction: { type: Type.STRING }
        },
        required: ["title", "conceptAngle", "hooks", "scenes", "callToAction"]
      };

      const response = await generateContentJson({
        prompt,
                  schema: responseSchema
      });

      const parsed = JSON.parse(response.text || "{}");
      const newScript = {
        ...script,
        id: `script-${Date.now()}`,
        title: parsed.title || script.title,
        conceptAngle: parsed.conceptAngle || script.conceptAngle,
        competitorDifferentiation: parsed.competitorDifferentiation || script.competitorDifferentiation || "",
        callToAction: parsed.callToAction || script.callToAction,
        hooks: (parsed.hooks || []).map((h: any, hIdx: number) => ({
          ...h,
          id: `hook-${Date.now()}-${hIdx}`,
          hookNumber: hIdx + 1,
          estimatedDurationSec: h.estimatedDurationSec || 3
        })),
        scenes: (parsed.scenes || []).map((s: any, sIdx: number) => ({
          ...s,
          id: `scene-${Date.now()}-${sIdx}`
        }))
      };

      return res.json({ success: true, script: newScript });
    }

    return res.status(400).json({ success: false, error: "Ugyldig elementType" });
  } catch (error: any) {
    console.error("Fejl ved re-generering af element:", error);
    return res.status(500).json({ success: false, error: error.message || "Fejl ved re-generering af element." });
  }
});

// Projects Persistent Storage
const PROJECTS_FILE = path.join(process.cwd(), "data", "projects.json");

function ensureProjectsFile() {
  const dir = path.dirname(PROJECTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function getProjectsData() {
  ensureProjectsFile();
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveProjectsData(projects: any[]) {
  ensureProjectsFile();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
}

// AI Training Persistent Storage
const AI_TRAINING_FILE = path.join(process.cwd(), "data", "ai_training.json");

function ensureAiTrainingFile() {
  const dir = path.dirname(AI_TRAINING_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(AI_TRAINING_FILE)) {
    fs.writeFileSync(AI_TRAINING_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function getAiTrainingData() {
  ensureAiTrainingFile();
  try {
    const raw = fs.readFileSync(AI_TRAINING_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveAiTrainingData(items: any[]) {
  ensureAiTrainingFile();
  fs.writeFileSync(AI_TRAINING_FILE, JSON.stringify(items, null, 2), "utf-8");
}

function buildAiTrainingPromptSnippet(): string {
  const items = getAiTrainingData();
  if (!items || items.length === 0) return "";

  const hooks = items.filter((i: any) => i.type === 'hook').slice(0, 8);
  const bodies = items.filter((i: any) => i.type === 'body').slice(0, 8);
  const ctas = items.filter((i: any) => i.type === 'cta').slice(0, 8);
  const fullScripts = items.filter((i: any) => i.type === 'script').slice(0, 4);

  let snippet = `\n\n🎯 BRUGERENS TRÆNEDE AI-GULDSTANDARDER (EFTERLIGN DENNE STIL, TONE OG STRUKTUR KVALITETSMÆSSIGT):\n`;

  if (hooks.length > 0) {
    snippet += `GODE HOOK-EKSEMPLER TIL EFTERLIGNING:\n` + hooks.map((h: any) => `- "${h.text}"${h.brandContext ? ` (${h.brandContext})` : ''}`).join('\n') + `\n`;
  }
  if (bodies.length > 0) {
    snippet += `GODE BODY-MANUSKRIPTER TIL EFTERLIGNING:\n` + bodies.map((b: any) => `- "${b.text}"${b.brandContext ? ` (${b.brandContext})` : ''}`).join('\n') + `\n`;
  }
  if (ctas.length > 0) {
    snippet += `GODE CTA-EKSEMPLER TIL EFTERLIGNING:\n` + ctas.map((c: any) => `- "${c.text}"${c.brandContext ? ` (${c.brandContext})` : ''}`).join('\n') + `\n`;
  }
  // Hele scripts står som blokke, ikke i punktopstilling: de skal læses som en
  // sammenhængende helhed, og det er rytmen fra hook til CTA, der skal efterlignes.
  if (fullScripts.length > 0) {
    snippet += `HELE SCRIPTS TIL EFTERLIGNING (efterlign rytmen og overgangene fra hook til CTA, ikke ordene):\n`;
    snippet += fullScripts
      .map((sc: any, idx: number) => `--- Script-eksempel ${idx + 1}${sc.title ? `: ${sc.title}` : ''}${sc.brandContext ? ` (${sc.brandContext})` : ''} ---\n${sc.text}`)
      .join('\n\n') + `\n`;
  }

  return snippet;
}

// GET all AI training items
app.get("/api/ai-training", (req, res) => {
  try {
    const items = getAiTrainingData();
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add new AI training item
app.post("/api/ai-training", (req, res) => {
  try {
    const { type, text, title = "", brandContext = "", notes = "" } = req.body;
    if (!type || !text || !text.trim()) {
      return res.status(400).json({ success: false, error: "Type og tekst er påkrævet." });
    }
    const items = getAiTrainingData();
    const newItem = {
      id: `train-${Date.now()}`,
      type: type.trim(),
      text: text.trim(),
      title: title.trim(),
      brandContext: brandContext.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    saveAiTrainingData(items);
    res.json({ success: true, item: newItem, items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE AI training item
app.delete("/api/ai-training/:id", (req, res) => {
  try {
    const { id } = req.params;
    let items = getAiTrainingData();
    items = items.filter((item: any) => item.id !== id);
    saveAiTrainingData(items);
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all projects
app.get("/api/projects", (req, res) => {
  try {
    const user = getCurrentUser(req);
    const projects = getProjectsData().filter((p: any) => canAccess(p, user));
    res.json({ success: true, projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create project
app.post("/api/projects", (req, res) => {
  try {
    const { name, description = "" } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Projektnavn er påkrævet." });
    }
    const user = getCurrentUser(req);
    const projects = getProjectsData();
    const newProject = {
      id: `project-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      shared: !!req.body.shared,
      owner: user?.company || "alle",
      ownerLabel: user?.companyLabel || "",
      createdBy: user?.name || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scripts: []
    };
    projects.unshift(newProject);
    saveProjectsData(projects);
    res.json({ success: true, project: newProject, projects: projects.filter((p: any) => canAccess(p, user)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update project
app.put("/api/projects/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const projects = getProjectsData();
    const idx = projects.findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Projektet blev ikke fundet." });
    }
    if (!canAccess(projects[idx], getCurrentUser(req))) {
      return res.status(403).json({ success: false, error: "Du har ikke adgang til dette projekt." });
    }
    if (req.body.shared !== undefined) projects[idx].shared = !!req.body.shared;
    if (name !== undefined) projects[idx].name = name.trim();
    if (description !== undefined) projects[idx].description = description.trim();
    projects[idx].updatedAt = new Date().toISOString();
    saveProjectsData(projects);
    res.json({ success: true, project: projects[idx], projects: projects.filter((p: any) => canAccess(p, getCurrentUser(req))) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE project
app.delete("/api/projects/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    const projects = getProjectsData();
    const target = projects.find((p: any) => p.id === id);
    if (target && !canAccess(target, user)) {
      return res.status(403).json({ success: false, error: "Du har ikke adgang til dette projekt." });
    }
    const remaining = projects.filter((p: any) => p.id !== id);
    saveProjectsData(remaining);
    res.json({ success: true, projects: remaining.filter((p: any) => canAccess(p, user)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add script to project
app.post("/api/projects/:id/scripts", (req, res) => {
  try {
    const { id } = req.params;
    const { script } = req.body;
    if (!script || !script.id) {
      return res.status(400).json({ success: false, error: "Script objekt med ID er påkrævet." });
    }
    const projects = getProjectsData();
    const projIndex = projects.findIndex((p: any) => p.id === id);
    if (projIndex === -1) {
      return res.status(404).json({ success: false, error: "Projektet blev ikke fundet." });
    }

    const currentScripts = projects[projIndex].scripts || [];
    const existingIdx = currentScripts.findIndex((s: any) => s.id === script.id);
    if (existingIdx !== -1) {
      currentScripts[existingIdx] = script;
    } else {
      currentScripts.unshift(script);
    }
    projects[projIndex].scripts = currentScripts;
    projects[projIndex].updatedAt = new Date().toISOString();

    saveProjectsData(projects);
    res.json({ success: true, project: projects[projIndex], projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE script from project
app.delete("/api/projects/:id/scripts/:scriptId", (req, res) => {
  try {
    const { id, scriptId } = req.params;
    const projects = getProjectsData();
    const projIndex = projects.findIndex((p: any) => p.id === id);
    if (projIndex === -1) {
      return res.status(404).json({ success: false, error: "Projektet blev ikke fundet." });
    }

    projects[projIndex].scripts = (projects[projIndex].scripts || []).filter((s: any) => s.id !== scriptId);
    projects[projIndex].updatedAt = new Date().toISOString();

    saveProjectsData(projects);
    res.json({ success: true, project: projects[projIndex], projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrate-analogy
app.post("/api/integrate-analogy", async (req, res) => {
  try {
    const { 
      bodyText = "", 
      analogyText = "", 
      companyName = "", 
      productName = "", 
      productDescription = "" 
    } = req.body;

    if (!bodyText || !analogyText) {
      return res.status(400).json({ success: false, error: "Mangler bodyTekst eller analogiTekst." });
    }

    const prompt = `
Du er en verdensklasse dansk copywriter for Meta Ads.
Opgave: Omskriv den eksisterende manuskript-body ("EKSISTERENDE BODY TEKST") således at den medfølgende analogi ("ANALOGI") flettes SØMLØST, NATURLIGT og SPROGLIGT KORREKT ind i ca. midten af teksten (mellem problemstillingen og løsningen).

EKSISTERENDE BODY TEKST:
"${bodyText.trim()}"

ANALOGI DER SKAL SÆTTES IND:
"${analogyText.trim()}"

PRODUKT/VIRKSOMHED:
"${companyName} ${productName}" - "${productDescription}"

REGLER FOR OMSKRIVNINGEN:
1. Bevar det oprindelige budskab, tonen og nøglefordelene i manuskriptet.
2. Tilpas gerne sætningerne før og efter analogien med naturlige overgangsord (f.eks. "Sagen er nemlig...", "For uden den rette dybdevirkning svarer det til...", "Men det behøver ikke være sådan..."), så analogien føles 100% integreret og meningsfuld i sammenhængen.
3. Analogien skal placeres i midten af manuskriptet (typisk lige efter at problemstillingen er præsenteret og inden produktets løsning introduceres).
4. Svaret SKAL være mundret dansk reklamesprog til video/UGC.

Returnér et JSON-objekt:
{
  "wovenText": "Den komplette, færdige omskrevne body-tekst på dansk"
}
`;

    const response = await generateContentJson({
      prompt,
              schema: {
          type: Type.OBJECT,
          properties: {
            wovenText: { type: Type.STRING }
          },
          required: ["wovenText"]
        }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, wovenText: parsed.wovenText || bodyText });
  } catch (error: any) {
    console.error("Fejl i /api/integrate-analogy:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/analyze-ad-link
app.post("/api/analyze-ad-link", async (req, res) => {
  try {
    const { 
      adUrl = "", 
      adText = "", 
      companyName = "", 
      productName = "", 
      productDescription = "", 
      targetAudience = "", 
      offerOrCta = "" 
    } = req.body;

    if (!adUrl && !adText) {
      return res.status(400).json({ success: false, error: "Angiv enten et Facebook Ad Library link eller en annoncetekst." });
    }

    const prompt = `
Du er en verdensklasse Meta Ads strateg og dansk UGC manuskriptforfatter.
Opgave:
1. Dekod og analysér den angivne Facebook/Meta annonce (baseret på URL og/eller den angivne tekstreference/transskription).
2. Ekstrahér annoncens hook-psykologi, kernevinkel og opbygning.
3. Omskriv og genskab denne præcise vinder-struktur til et 100% færdigt, mundret Meta Video Script (30 sekunder UGC/video) til brugerens eget brand:
   - Virksomhed: "${companyName || 'Virksomhed'}"
   - Produkt: "${productName || 'Produkt'}"
   - Beskrivelse/USP: "${productDescription || ''}"
   - Målgruppe: "${targetAudience || ''}"
   - Tilbud/CTA: "${offerOrCta || ''}"

FACEBOOK AD LINK / URL:
"${adUrl}"

ANNONCETEKST / REFERENCE:
"${adText || 'Annoncelink angivet. Analysér vinklen baseret på konteksten af linket og skab et skræddersyet manuskript.'}"

Returnér et komplet JSON-objekt med følgende struktur:
{
  "adAnalysis": {
    "summary": "Kort resumé af den analyserede annonce og hvorfor den virker",
    "hookType": "f.eks. Pattern Interrupt / Loss Aversion / Curiosity Gap",
    "angleType": "f.eks. Problem-Solution PAS / UGC Review",
    "keyHookText": "Oprindelige krog / overskrift fra annoncen",
    "keyCoreMessage": "Kernepåstanden i den oprindelige annonce"
  },
  "script": {
    "id": "ad-script-${Date.now()}",
    "title": "Meta Ad Inspirations-Script (Facebook Ad Library)",
    "conceptAngle": "Tilpasset vinder-struktur fra Facebook Ad Library",
    "scriptType": "Problem–Solution / PAS",
    "bodyDuration": "30-40 sekunder",
    "companyName": "${companyName || 'Virksomhed'}",
    "productName": "${productName || 'Produkt'}",
    "competitors": [],
    "competitorDifferentiation": "Baseret på konverteringsoptimeret struktur fra Facebook Ads Library",
    "awarenessStage": "Problem Aware",
    "trafficType": "cold",
    "hooks": [
      {
        "id": "h1",
        "hookNumber": 1,
        "angleType": "Pattern Interrupt",
        "visualDirection": "Visuel anvisning på kamera...",
        "textOnScreen": "Tekst i videoen...",
        "audioDialogue": "Det hvad skuespilleren siger i de første 3 sekunder...",
        "estimatedDurationSec": 3
      },
      {
        "id": "h2",
        "hookNumber": 2,
        "angleType": "Loss Aversion",
        "visualDirection": "Visuel anvisning...",
        "textOnScreen": "Tekst...",
        "audioDialogue": "Alternativ hook vinkel...",
        "estimatedDurationSec": 3
      },
      {
        "id": "h3",
        "hookNumber": 3,
        "angleType": "Curiosity Gap",
        "visualDirection": "Visuel anvisning...",
        "textOnScreen": "Tekst...",
        "audioDialogue": "Tredje hook vinkel...",
        "estimatedDurationSec": 3
      }
    ],
    "scenes": [
      {
        "id": "s1",
        "timecode": "0:03 - 0:10",
        "section": "Problem/Pain",
        "visualDescription": "Nærbillede af problemstillingen...",
        "textOnScreen": "Billedtekst...",
        "audioDialogue": "Talemanuskript for scenen...",
        "soundEffects": "Subtil hverdagslyd"
      },
      {
        "id": "s2",
        "timecode": "0:10 - 0:22",
        "section": "Solution/Demo",
        "visualDescription": "Produktet i brug...",
        "textOnScreen": "Billedtekst...",
        "audioDialogue": "Forklaring af løsningen...",
        "soundEffects": "Swoosh effekt"
      },
      {
        "id": "s3",
        "timecode": "0:22 - 0:30",
        "section": "CTA & Offer",
        "visualDescription": "Viser hjemmesiden / tilbuddet...",
        "textOnScreen": "Køb nu med rabatkode...",
        "audioDialogue": "Afsluttende opfordring til handling...",
        "soundEffects": "Pop-lyd"
      }
    ],
    "callToAction": "${offerOrCta || 'Prøv i dag med gratis fragt'}",
    "proTips": [
      "Optag i naturligt dagslys for autentisk UGC følelse",
      "Sørg for at den valgte hook matcher din primære målgruppe"
    ],
    "createdAt": "${new Date().toISOString()}"
  }
}

KRITISK REGEL FOR CTA ('callToAction'): Feltet må KUN indeholde den afsluttende TALTE replik, ordret som den siges. Ingen tidskoder ("0:26, 0:30"), ingen scene- eller kamerabeskrivelser ("End card med logo", "app-skærmbillede vises"), ingen overlay-anvisninger ("Overlay: ..."), ingen regi-noter om tone eller stemme ("Voiceover i rolig business-tone") og ingen forklaring af, hvad klikket fører til. Kun replikken. Alt visuelt hentes separat bagefter, når brugeren beder om det.
`;

    const response = await generateContentJson({
      prompt,
              schema: {
          type: Type.OBJECT,
          properties: {
            adAnalysis: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                hookType: { type: Type.STRING },
                angleType: { type: Type.STRING },
                keyHookText: { type: Type.STRING },
                keyCoreMessage: { type: Type.STRING }
              },
              required: ["summary", "hookType", "angleType", "keyHookText", "keyCoreMessage"]
            },
            script: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                conceptAngle: { type: Type.STRING },
                scriptType: { type: Type.STRING },
                bodyDuration: { type: Type.STRING },
                companyName: { type: Type.STRING },
                productName: { type: Type.STRING },
                competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorDifferentiation: { type: Type.STRING },
                awarenessStage: { type: Type.STRING },
                trafficType: { type: Type.STRING },
                hooks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      hookNumber: { type: Type.NUMBER },
                      angleType: { type: Type.STRING },
                      visualDirection: { type: Type.STRING },
                      textOnScreen: { type: Type.STRING },
                      audioDialogue: { type: Type.STRING },
                      estimatedDurationSec: { type: Type.NUMBER }
                    },
                    required: ["id", "hookNumber", "angleType", "visualDirection", "textOnScreen", "audioDialogue", "estimatedDurationSec"]
                  }
                },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      timecode: { type: Type.STRING },
                      section: { type: Type.STRING },
                      visualDescription: { type: Type.STRING },
                      textOnScreen: { type: Type.STRING },
                      audioDialogue: { type: Type.STRING },
                      soundEffects: { type: Type.STRING }
                    },
                    required: ["id", "timecode", "section", "visualDescription", "textOnScreen", "audioDialogue"]
                  }
                },
                callToAction: { type: Type.STRING },
                proTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                createdAt: { type: Type.STRING }
              },
              required: ["id", "title", "conceptAngle", "scriptType", "bodyDuration", "companyName", "hooks", "scenes", "callToAction"]
            }
          },
          required: ["adAnalysis", "script"]
        }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ 
      success: true, 
      adAnalysis: parsed.adAnalysis, 
      script: parsed.script 
    });
  } catch (error: any) {
    console.error("Fejl i /api/analyze-ad-link:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/generate-analogy
app.post("/api/generate-analogy", async (req, res) => {
  try {
    const { 
      companyName = "", 
      productName = "", 
      productDescription = "", 
      targetAudience = "", 
      category = "Alle", 
      targetType = "hook",
      currentText = ""
    } = req.body;
    const categoryInstruction = category && category !== "Alle" 
      ? `Fokusér udelukkende på vinklen: "${category}".`
      : `Fordel analogierne ligeligt mellem de 3 kategorier: "Skabe frygt", "Vis forbedring", og "Skabe interesse".`;

    const hookConstraint = targetType === "hook"
      ? `VIGTIGT FOR HOOKS: Hver færdig sætning SKAL være mundret, ultra-fængende og max 15-20 ord (3-5 sekunders taletid i en video).`
      : `VIGTIGT FOR BODY: Hver færdig variation skal være en naturlig, forklarende del af manuskriptet.`;

    let prompt = "";

    if (currentText && currentText.trim().length > 5) {
      prompt = `
Du er en verdensklasse copywriter for Meta Ads og TikTok vaskekægte UGC-manuskripter.
Din opgave er at tage den eksisterende ${targetType.toUpperCase()}-tekst herunder og skabe EXACT 5 FORSKELLIGE variationer, hvor du fletter en stærk, visuel billedsprog/analogi direkte og sprogligt korrekt ind i teksten.

EKSISTERENDE TEKST: "${currentText.trim()}"
VIRKSOMHED / PRODUKT: "${companyName} ${productName}"
BESKRIVELSE: "${productDescription}"

EKSEMPEL PÅ INDFLETNING:
Eksisterende hook: "Hvis din hud stadig føles træt og mat efter din morgenrutine, gør du dette forkert."
Med indflettet analogi: "Hvis din hud stadig føles træt og mat efter din morgenrutine, er det som at vaske en rude og stadig se snavs igennem den – du gør noget forkert."

KRAV:
1. Skab 5 unikke, fængende variationer af den eksisterende tekst med indflettet analogi/talesprog.
2. ${hookConstraint}
3. ${categoryInstruction}
4. Teksten i "text" skal være den KOMPLETTE, færdige sætning med den indflettede analogi, klar til at erstatte eller opdatere hooket/bodyen direkte!
5. "title" skal være en ultrakort beskrivelse af analogi-billedet (f.eks. "Som at vaske en beskidt rude").

De 3 tilladte kategorier er UDELUKKENDE:
1. "Skabe frygt" (Fokus på spild af penge, tabte muligheder, risiko og ineffektivitet)
2. "Vis forbedring" (Fokus på transformation, lyntog, turbo, fantastisk fremdrift og overskud)
3. "Skabe interesse" (Fokus på nysgerrighed, overraskende visuelle billedsprog og øjenåbnere)

Returnér et JSON-objekt jf. schema.
`;
    } else {
      prompt = `
Du er en prisvindende Meta Ads copywriter med speciale i stærke billedsprog og hverdagsanalogier.
Opgave: Generér 5-6 stærke, visuelle og overraskende DANSKE ANALOGIER eller TALESPROG skræddersyet til følgende virksomhed/produkt.

VIRKSOMHED / PRODUKT: "${companyName} ${productName}"
BESKRIVELSE: "${productDescription}"
MÅLGRUPPE / FRUSTRATIONER: "${targetAudience}"

KATEGORI INSTRUKTION: ${categoryInstruction}
FORMÅL: Præcis tilpasset ${targetType.toUpperCase()} (Hook eller Body).
${hookConstraint}

De 3 tilladte kategorier er UDELUKKENDE:
1. "Skabe frygt" (Fokus på spild af penge, tabte muligheder, risiko og ineffektivitet)
2. "Vis forbedring" (Fokus på transformation, lyntog, turbo, fantastisk fremdrift og overskud)
3. "Skabe interesse" (Fokus på nysgerrighed, overraskende visuelle billedsprog og øjenåbnere)

Generér NYE, unikke og fængende analogier på dansk, hvor henholdsvis "title" er en kort overskrift og "text" er den KOMPLETTE, FULLSTÆNDIGE analogisætning.
Hver kategori i outputtet SKAL være enten "Skabe frygt", "Vis forbedring", eller "Skabe interesse".

Returnér et JSON-objekt jf. schema.
`;
    }

    const response = await generateContentJson({
      prompt,
              schema: {
          type: Type.OBJECT,
          properties: {
            analogies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "text", "category"]
              }
            }
          },
          required: ["analogies"]
        }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, analogies: parsed.analogies || [] });

  } catch (error: any) {
    console.error("Fejl i /api/generate-analogy:", error);
    res.status(500).json({ success: false, error: error.message || "Fejl under generering af analogier" });
  }
});

// Customers Persistent Storage (kundekartotek)
const CUSTOMERS_FILE = path.join(process.cwd(), "data", "customers.json");

function ensureCustomersFile() {
  const dir = path.dirname(CUSTOMERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CUSTOMERS_FILE)) {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function getCustomersData() {
  ensureCustomersFile();
  try {
    return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}

function saveCustomersData(customers: any[]) {
  ensureCustomersFile();
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf-8");
}

// Fælles: normaliser kundefelter fra request-body
async function buildCustomerFields(body: any) {
  const fields: any = {
    name: (body.name || body.companyName || "").trim(),
    companyName: (body.companyName || "").trim(),
    companyWebsite: (body.companyWebsite || "").trim(),
    productName: (body.productName || "").trim(),
    productDescription: (body.productDescription || "").trim(),
    targetAudience: (body.targetAudience || "").trim(),
    demographics: (body.demographics || "").trim(),
    offerOrCta: (body.offerOrCta || "").trim(),
    competitors: Array.isArray(body.competitors) ? body.competitors.filter((c: any) => typeof c === "string" && c.trim()).slice(0, 3) : [],
    toneOfVoice: (body.toneOfVoice || "").trim(),
    notes: (body.notes || "").trim(),
    shared: !!body.shared
  };

  // Analysedokument: udtræk og gem KUN teksten, så den kan genbruges uden ny upload
  if (body.analysisDocument && (body.analysisDocument.base64 || body.analysisDocument.extractedText)) {
    const extractedText = await extractTextFromAnalysisDoc(body.analysisDocument);
    if (extractedText && extractedText.trim().length > 0) {
      fields.analysisDocument = {
        name: body.analysisDocument.name || "Analyse",
        extractedText: extractedText.trim()
      };
    }
  } else if (body.analysisDocument === null) {
    fields.analysisDocument = undefined;
  }

  return fields;
}

// GET all customers
app.get("/api/customers", (req, res) => {
  try {
    const user = getCurrentUser(req);
    res.json({ success: true, customers: getCustomersData().filter((c: any) => canAccess(c, user)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create customer
app.post("/api/customers", async (req, res) => {
  try {
    const fields = await buildCustomerFields(req.body);
    if (!fields.companyName && !fields.name) {
      return res.status(400).json({ success: false, error: "Kundenavn eller virksomhedsnavn er påkrævet." });
    }
    const user = getCurrentUser(req);
    const customers = getCustomersData();
    const newCustomer = {
      id: `customer-${Date.now()}`,
      ...fields,
      owner: user?.company || "alle",
      ownerLabel: user?.companyLabel || "",
      createdBy: user?.name || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customers.unshift(newCustomer);
    saveCustomersData(customers);
    res.json({ success: true, customer: newCustomer, customers: customers.filter((c: any) => canAccess(c, user)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update customer
app.put("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customers = getCustomersData();
    const idx = customers.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Kunden blev ikke fundet." });
    }
    if (!canAccess(customers[idx], getCurrentUser(req))) {
      return res.status(403).json({ success: false, error: "Du har ikke adgang til denne kunde." });
    }
    const fields = await buildCustomerFields(req.body);
    // Behold eksisterende analysedokument hvis der ikke sendes et nyt
    if (fields.analysisDocument === undefined && req.body.analysisDocument !== null) {
      fields.analysisDocument = customers[idx].analysisDocument;
    }
    customers[idx] = {
      ...customers[idx],
      ...fields,
      updatedAt: new Date().toISOString()
    };
    saveCustomersData(customers);
    res.json({ success: true, customer: customers[idx], customers: customers.filter((c: any) => canAccess(c, getCurrentUser(req))) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE customer
app.delete("/api/customers/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    const customers = getCustomersData();
    const target = customers.find((c: any) => c.id === id);
    if (target && !canAccess(target, user)) {
      return res.status(403).json({ success: false, error: "Du har ikke adgang til denne kunde." });
    }
    const remaining = customers.filter((c: any) => c.id !== id);
    saveCustomersData(remaining);
    res.json({ success: true, customers: remaining.filter((c: any) => canAccess(c, user)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/analyze-brief - læser en uploadet målgruppe-/virksomhedsanalyse (og evt.
// hjemmesiden) og trækker de felter ud, formularen ellers skal udfyldes i hånden.
// Felter der ikke står i materialet returneres tomme - der gættes ikke.
// POST /api/recommend-angles - anbefaler script-stil og hook-vinkler til den
// konkrete kunde ud fra målgruppeanalysen og det udfyldte brief.
// Modellen må kun vælge fra de lister klienten sender med.
app.post("/api/recommend-angles", async (req, res) => {
  try {
    const {
      analysisDocument,
      brief = {},
      awarenessStage,
      trafficType,
      bodyDuration,
      numHooks,
      scriptTypes,
      hookAngles,
      scriptFocus
    } = req.body || {};

    if (!Array.isArray(scriptTypes) || scriptTypes.length === 0) {
      return res.status(400).json({ success: false, error: "Listen over script-stile mangler." });
    }
    if (!Array.isArray(hookAngles) || hookAngles.length === 0) {
      return res.status(400).json({ success: false, error: "Listen over hook-vinkler mangler." });
    }

    const documentText = analysisDocument ? await extractTextFromAnalysisDoc(analysisDocument) : "";

    const briefLines = [
      brief.companyName ? `Virksomhed: ${brief.companyName}` : "",
      brief.productName ? `Produkt eller ydelse: ${brief.productName}` : "",
      brief.productDescription ? `Unikke fordele: ${brief.productDescription}` : "",
      brief.targetAudience ? `Ideel kunde: ${brief.targetAudience}` : "",
      brief.demographics ? `Geografi og demografi: ${brief.demographics}` : "",
      brief.offerOrCta ? `Tilbud eller CTA: ${brief.offerOrCta}` : "",
      Array.isArray(brief.competitors) && brief.competitors.length
        ? `Konkurrenter: ${brief.competitors.join(", ")}`
        : ""
    ]
      .filter(Boolean)
      .join("\n");

    if (!documentText && !briefLines) {
      return res.status(400).json({
        success: false,
        error: "Der er intet at rådgive ud fra endnu. Upload en analyse eller udfyld kundeoplysningerne i trin 1."
      });
    }

    const hooksWanted = Math.min(Math.max(Number(numHooks) || 3, 1), 5);
    const angleList = hookAngles
      .map((a: any) => `- ${a.id}: ${a.label}${a.desc ? ` (${a.desc})` : ""}`)
      .join("\n");

    const prompt = `
Du er strategisk creative director i et dansk annoncebureau og har lavet Meta-annoncer i ti år.

Opgave: Anbefal hvilken script-stil og hvilke hook-vinkler der vil virke bedst for netop denne kunde.

${documentText ? `--- MÅLGRUPPEANALYSE ---\n${documentText.slice(0, 50000)}\n--- SLUT PÅ ANALYSE ---\n` : "Der er ingen målgruppeanalyse vedhæftet. Rådgiv ud fra briefet alene.\n"}
${briefLines ? `--- BRIEF ---\n${briefLines}\n--- SLUT PÅ BRIEF ---\n` : ""}
OPSÆTNING FOR DETTE SCRIPT:
- Awareness-stadie: ${awarenessStage || "Problem Aware"}
- Trafik-temperatur: ${TRAFFIC_LABELS[normalizeTraffic(trafficType)]}
- Varighed: ${durationSpec(bodyDuration || "30-40 sekunder")}
- Antal hooks der skal skrives: ${hooksWanted}
${scriptFocus === "lead" ? "- Målet er leads, ikke direkte salg.\n" : "- Målet er salg af produktet.\n"}

DU MÅ KUN VÆLGE FRA DISSE LISTER:

Script-stile:
${scriptTypes.map((t: string) => `- ${t}`).join("\n")}

Hook-vinkler:
${angleList}

SÅDAN SVARER DU:
- Anbefal præcis 3 script-stile, rangeret med den bedste først.
- Anbefal præcis ${hooksWanted} hook-vinkler, én pr. hook, rangeret. Vælg forskellige vinkler, medmindre der er en klar grund til at gentage.
- Hver begrundelse er ÉN sætning på dansk, maks 25 ord, og peger på noget konkret fra analysen eller briefet. Skriv "fordi målgruppen ..." eller "fordi analysen nævner ...", ikke almene råd.
- Er der ingen analyse, så sig det i begrundelsen frem for at lade som om der er dækning.
- fit angiver hvor stærkt matchet er: "stærk", "god" eller "ok".
- headline: én sætning på dansk om den røde tråd i anbefalingen, maks 25 ord.
- Ingen markdown, ingen punktopstilling inde i felterne.
`.trim();

    const schema = {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        scriptTypes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: scriptTypes },
              reason: { type: Type.STRING },
              fit: { type: Type.STRING, enum: ["stærk", "god", "ok"] }
            }
          }
        },
        hookAngles: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, enum: hookAngles.map((a: any) => a.id) },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    };

    const response = await generateContentJson({
      prompt,
      schema,
      system:
        "Du rådgiver om annoncevinkler. Du begrunder altid i det konkrete materiale du har fået, og du vælger kun fra de lister du får udleveret.",
      maxTokens: 4000
    });

    const parsed = JSON.parse(response.text || "{}");
    const validTypes = new Set(scriptTypes);
    const validAngles = new Set(hookAngles.map((a: any) => a.id));

    res.json({
      success: true,
      headline: typeof parsed.headline === "string" ? parsed.headline.trim() : "",
      basedOnAnalysis: !!documentText,
      scriptTypes: (Array.isArray(parsed.scriptTypes) ? parsed.scriptTypes : [])
        .filter((s: any) => s && validTypes.has(s.type))
        .slice(0, 3)
        .map((s: any) => ({
          type: s.type,
          reason: typeof s.reason === "string" ? s.reason.trim() : "",
          fit: ["stærk", "god", "ok"].includes(s.fit) ? s.fit : "god"
        })),
      hookAngles: (Array.isArray(parsed.hookAngles) ? parsed.hookAngles : [])
        .filter((h: any) => h && validAngles.has(h.id))
        .slice(0, hooksWanted)
        .map((h: any) => ({
          id: h.id,
          reason: typeof h.reason === "string" ? h.reason.trim() : ""
        }))
    });
  } catch (error: any) {
    console.error("[/api/recommend-angles] Fejl:", error?.message || error);
    res.status(500).json({ success: false, error: error?.message || "Kunne ikke hente forslag." });
  }
});

app.post("/api/analyze-brief", async (req, res) => {
  try {
    const { analysisDocument, companyWebsite, scriptFocus } = req.body || {};

    if (!analysisDocument) {
      return res.status(400).json({ success: false, error: "Der er ikke tilknyttet et dokument." });
    }

    const documentText = await extractTextFromAnalysisDoc(analysisDocument);
    if (!documentText || documentText.trim().length < 40) {
      const name = (analysisDocument.name || "").toLowerCase();
      const isPdf = (analysisDocument.mimeType || "").toLowerCase().includes("pdf") || name.endsWith(".pdf");
      return res.status(400).json({
        success: false,
        error: isPdf
          ? "Der er ingen tekst i PDF'en. Den er sandsynligvis scannet eller består af billeder. Prøv at gemme den som Word eller kopiér teksten ind i en tekstfil."
          : "Kunne ikke læse nok tekst ud af dokumentet. Prøv at gemme det som PDF, Word eller ren tekst."
      });
    }

    let websiteText = "";
    if (companyWebsite && typeof companyWebsite === "string" && companyWebsite.trim()) {
      websiteText = await scrapeWebsiteContent(companyWebsite.trim());
    }

    // Hold prompten inden for en fornuftig størrelse på meget lange analyser
    const trimmedDoc = documentText.slice(0, 60000);
    const trimmedSite = websiteText.slice(0, 8000);

    const prompt = `
Du er strategisk planner i et dansk annoncebureau.
Nedenfor er en målgruppe- eller virksomhedsanalyse for en kunde${trimmedSite ? ", samt indhold fra kundens hjemmeside" : ""}.

Opgave: Udfyld briefing-felterne til en Meta Ads script-generator ud fra materialet.

ABSOLUTTE REGLER:
- Brug KUN hvad der faktisk står i materialet. Find aldrig på produkter, tal, tilbud, rabatkoder, garantier eller konkurrenter.
- Står et felt ikke i materialet, returnér en tom streng (eller en tom liste). Et tomt felt er korrekt; et gættet felt er en fejl.
- Skriv på dansk i hele sætninger, kort og konkret. Ingen overskrifter, ingen punktopstilling, ingen markdown.
- Gengiv tal, priser og procenter præcis som de står. Rund ikke af, og opfind ikke nye.
${scriptFocus === "lead" ? "- Kunden sælger leads (booking, konsultation, e-bog), ikke et fysisk produkt. Beskriv ydelsen i produktfeltet." : ""}

FELTER:
- companyName: virksomhedens navn.
- productName: navnet på det produkt eller den ydelse annoncerne skal handle om.
- productDescription: hvad produktet er, og de unikke fordele. Maks 4 sætninger.
- targetAudience: den ideelle kunde. Hvem er de, hvad frustrerer dem, hvad vil de opnå. Maks 4 sætninger.
- demographics: geografi og demografi. Alder, køn, geografi, indkomst, interesser. Maks 3 sætninger.
- offerOrCta: det konkrete tilbud eller den handling kunden skal foretage. Kun hvis det står i materialet.
- competitors: op til 3 navngivne konkurrenter fra materialet.
- toneOfVoice: den ønskede tone i talesproget, f.eks. "afslappet dansk talesprog, som en god ven der anbefaler". Kun hvis materialet siger noget om tone.
- summary: én sætning på dansk om hvad analysen dækker, til visning i grænsefladen.
- missingFields: navnene på de felter ovenfor du IKKE kunne udfylde, fordi materialet ikke nævner dem.

--- ANALYSEDOKUMENT ---
${trimmedDoc}
--- SLUT PÅ ANALYSEDOKUMENT ---
${trimmedSite ? `\n--- INDHOLD FRA HJEMMESIDEN ---\n${trimmedSite}\n--- SLUT PÅ HJEMMESIDE ---\n` : ""}
`.trim();

    const schema = {
      type: Type.OBJECT,
      properties: {
        companyName: { type: Type.STRING },
        productName: { type: Type.STRING },
        productDescription: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        demographics: { type: Type.STRING },
        offerOrCta: { type: Type.STRING },
        competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
        toneOfVoice: { type: Type.STRING },
        summary: { type: Type.STRING },
        missingFields: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    };

    const response = await generateContentJson({
      prompt,
      schema,
      system: "Du udtrækker fakta fra et dokument. Du gætter aldrig og udfylder aldrig et felt, materialet ikke dækker.",
      maxTokens: 4000
    });

    const parsed = JSON.parse(response.text || "{}");
    const str = (v: any) => (typeof v === "string" ? v.trim() : "");

    res.json({
      success: true,
      fields: {
        companyName: str(parsed.companyName),
        productName: str(parsed.productName),
        productDescription: str(parsed.productDescription),
        targetAudience: str(parsed.targetAudience),
        demographics: str(parsed.demographics),
        offerOrCta: str(parsed.offerOrCta),
        competitors: Array.isArray(parsed.competitors)
          ? parsed.competitors.map(str).filter(Boolean).slice(0, 3)
          : [],
        toneOfVoice: str(parsed.toneOfVoice)
      },
      summary: str(parsed.summary),
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields.map(str).filter(Boolean) : [],
      usedWebsite: !!trimmedSite,
      // Sendes med retur, så klienten kan gemme teksten på kunden uden at læse filen igen
      extractedText: documentText
    });
  } catch (error: any) {
    console.error("[/api/analyze-brief] Fejl:", error?.message || error);
    res.status(500).json({ success: false, error: error?.message || "Kunne ikke analysere dokumentet." });
  }
});

// POST /api/generate-visuals - komplet shot list for alle hooks og scener i et script
app.post("/api/generate-visuals", async (req, res) => {
  try {
    const { script } = req.body;
    if (!script) {
      return res.status(400).json({ success: false, error: "Script mangler." });
    }

    const hooksList = (script.hooks || [])
      .map((h: any, i: number) => `Hook ${i + 1}: "${h.audioDialogue}" (Vinkel: ${h.angleType || 'Ukendt'})`)
      .join("\n");
    const scenesList = (script.scenes || [])
      .map((s: any, i: number) => `Scene ${i + 1} [${s.timecode || ''} / ${s.section || ''}]: Replik: "${s.audioDialogue}"`)
      .join("\n");

    const prompt = `
Du er en prisvindende video-director og content producer for Meta Ads.
Opgave: Lav en komplet, konkret og let-filmbar SHOT LIST på dansk for følgende video-annonce-script.

VIRKSOMHED/PRODUKT: "${script.companyName || ''} ${script.productName || ''}"
SCRIPT TYPE: "${script.scriptType || ''}"

HOOKS:
${hooksList}

SCENER (BODY):
${scenesList}

KRAV:
1. For HVER hook: en konkret visuel optage-idé for sekund 0-3 (hvad skuespilleren/kameraet præcist gør, lokation, energi, kropssprog).
2. For HVER scene: en konkret visuel beskrivelse (kameravinkel, B-roll, handling, props, klipperytme) der matcher replikken 1:1.
3. Alt skal kunne filmes med en telefon og 1-2 personer. Vær specifik og inspirerende, aldrig generisk.
4. Returnér præcis ${(script.hooks || []).length} hook-visuals og ${(script.scenes || []).length} scene-visuals i samme rækkefølge som ovenfor.
`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        hookVisuals: { type: Type.ARRAY, items: { type: Type.STRING } },
        sceneVisuals: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["hookVisuals", "sceneVisuals"]
    };

    const response = await generateContentJson({ prompt, schema, maxTokens: 8000 });
    const parsed = JSON.parse(response.text || "{}");

    const updatedScript = {
      ...script,
      hooks: (script.hooks || []).map((h: any, i: number) => ({
        ...h,
        visualDirection: parsed.hookVisuals?.[i] || h.visualDirection
      })),
      scenes: (script.scenes || []).map((sc: any, i: number) => ({
        ...sc,
        visualDescription: parsed.sceneVisuals?.[i] || sc.visualDescription
      }))
    };

    return res.json({ success: true, script: updatedScript });
  } catch (error: any) {
    console.error("Fejl i /api/generate-visuals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite & Static file handler
async function startServer() {
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
