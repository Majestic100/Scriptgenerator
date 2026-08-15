import { GeneratedScript, ScriptScene } from '../types';

/**
 * Scriptet som ét sammenhængende dokument, man kan rette i som almindelig tekst.
 *
 * Overskrifterne er det, der binder teksten sammen med scriptets felter. De skrives
 * på dansk, men læses på begge sprog, så et dokument skrevet i den engelske visning
 * stadig kan gemmes. Alt uden for en overskrift bliver ikke gemt.
 */

export const DOC_HEADINGS = {
  hook: (n: number) => `HOOK ${n}`,
  body: 'MANUSKRIPT',
  cta: 'CTA'
};

const CTA_SECTIONS = ['cta', 'cta & offer', 'cta and offer'];

/** Scener der bærer selve manuskriptet. CTA-scener hører til CTA-feltet. */
export const bodyScenes = (script: GeneratedScript): ScriptScene[] =>
  (script.scenes || []).filter(
    (sc) => !sc.section || !CTA_SECTIONS.includes(sc.section.toLowerCase())
  );

/** Manuskriptet som én tekst, sådan som det læses op. */
export const bodyTextOf = (script: GeneratedScript): string =>
  bodyScenes(script)
    .map((sc) => (sc.audioDialogue || '').trim())
    .filter(Boolean)
    .join(' ');

/** Bygger dokumentteksten ud fra scriptet. */
export const scriptToDocument = (script: GeneratedScript): string => {
  const blocks: string[] = [];

  (script.hooks || []).forEach((hook, idx) => {
    blocks.push(`${DOC_HEADINGS.hook(idx + 1)}\n${(hook.audioDialogue || '').trim()}`);
  });

  blocks.push(`${DOC_HEADINGS.body}\n${bodyTextOf(script)}`);
  blocks.push(`${DOC_HEADINGS.cta}\n${(script.callToAction || '').trim()}`);

  return blocks.join('\n\n');
};

type Section = { kind: 'hook'; number: number } | { kind: 'body' } | { kind: 'cta' };

/** Læser en linje som overskrift, hvis den er en. Tåler kolon og begge sprog. */
const headingOf = (line: string): Section | null => {
  const clean = line.trim().replace(/:$/, '').trim();
  const hook = clean.match(/^hook\s*(\d+)$/i);
  if (hook) return { kind: 'hook', number: parseInt(hook[1], 10) };
  if (/^(manuskript|body|script)$/i.test(clean)) return { kind: 'body' };
  if (/^(cta|call to action)$/i.test(clean)) return { kind: 'cta' };
  return null;
};

export interface ParsedDocument {
  hooks: string[];
  body: string | null;
  cta: string | null;
  /** Sandt hvis der overhovedet blev fundet en overskrift at gemme ud fra. */
  hasSections: boolean;
}

/** Deler dokumentteksten op i de felter, den hører til. */
export const parseDocument = (text: string): ParsedDocument => {
  const hooks: string[] = [];
  let body: string | null = null;
  let cta: string | null = null;
  let current: Section | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!current) return;
    const value = buffer.join('\n').trim();
    if (current.kind === 'hook') hooks[current.number - 1] = value;
    else if (current.kind === 'body') body = value;
    else cta = value;
    buffer = [];
  };

  for (const line of text.split('\n')) {
    const heading = headingOf(line);
    if (heading) {
      flush();
      current = heading;
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();

  return {
    // Springer man HOOK 2 over, må hullet ikke blive til undefined længere nede.
    hooks: Array.from(hooks, (h) => h || ''),
    body,
    cta,
    hasSections: hooks.length > 0 || body !== null || cta !== null
  };
};

/**
 * Skriver dokumentteksten tilbage i scriptet. Visuals, tidskoder og sektioner
 * bevares: kun de talte replikker kommer fra dokumentet. Manuskriptet lægges i
 * første scene, og de øvrige sceners replik tømmes, så teksten ikke står to gange.
 */
export const documentToScript = (
  script: GeneratedScript,
  text: string
): { script: GeneratedScript; changed: boolean } => {
  const parsed = parseDocument(text);
  if (!parsed.hasSections) return { script, changed: false };

  const next: GeneratedScript = { ...script };

  const typedHooks = parsed.hooks.filter((h) => h.trim());
  if (typedHooks.length > 0) {
    next.hooks = parsed.hooks
      .map((audioDialogue, idx) => {
        if (!audioDialogue.trim()) return null;
        const existing = script.hooks?.[idx];
        return existing
          ? { ...existing, audioDialogue }
          : {
              id: `hook-${Date.now()}-${idx}`,
              hookNumber: idx + 1,
              angleType: '',
              visualDirection: '',
              textOnScreen: '',
              audioDialogue,
              estimatedDurationSec: 3
            };
      })
      .filter(Boolean)
      .map((hook, idx) => ({ ...(hook as any), hookNumber: idx + 1 }));
  }

  if (parsed.body !== null) {
    const scenes = [...(script.scenes || [])];
    if (scenes.length === 0) {
      next.scenes = [
        {
          id: `scene-${Date.now()}`,
          timecode: '',
          section: 'Problem/Pain',
          visualDescription: '',
          textOnScreen: '',
          audioDialogue: parsed.body
        }
      ];
    } else {
      let first = true;
      next.scenes = scenes.map((sc) => {
        const isCta = sc.section && CTA_SECTIONS.includes(sc.section.toLowerCase());
        if (isCta) return sc;
        if (first) {
          first = false;
          return { ...sc, audioDialogue: parsed.body as string };
        }
        return { ...sc, audioDialogue: '' };
      });
    }
  }

  if (parsed.cta !== null) next.callToAction = parsed.cta;

  return { script: next, changed: true };
};
