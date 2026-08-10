import { GeneratedScript } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getScriptTitleHeader(script: GeneratedScript, scriptIndex: number): string {
  const stType = script.scriptType?.trim() || 'Problem–Solution / PAS';
  const stAware = script.awarenessStage?.trim() || 'Problem Aware';
  const isRetargeting = script.trafficType === 'retargeting' || script.trafficType?.toLowerCase().includes('retargeting');
  const stTraffic = isRetargeting ? 'Retargeting' : 'Kold Trafik';

  return `Script ${scriptIndex + 1} - ${stType} - ${stAware} - ${stTraffic}`;
}

export function formatScriptToHtml(script: GeneratedScript, scriptIndex: number, startHookNumber = 0): string {
  const bodyText = script.scenes
    .map((sc) => (sc.audioDialogue ? sc.audioDialogue.trim() : ''))
    .filter(Boolean)
    .join(' ');

  const titleHeader = getScriptTitleHeader(script, scriptIndex);

  let html = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000; line-height: 1.5;">`;
  html += `<p style="font-family: Arial, sans-serif; font-size: 12pt; font-weight: bold; margin: 0 0 14pt 0;">${escapeHtml(titleHeader)}</p>`;

  script.hooks.forEach((hook, i) => {
    const hookNum = startHookNumber + i + 1;
    html += `<p style="font-family: Arial, sans-serif; font-size: 11pt; margin: 0 0 12pt 0;"><strong style="font-weight: bold;">Hook ${hookNum} -</strong> ${escapeHtml(hook.audioDialogue)}</p>`;
  });

  html += `<p style="font-family: Arial, sans-serif; font-size: 11pt; margin: 0 0 12pt 0;"><strong style="font-weight: bold;">Body -</strong> ${escapeHtml(bodyText)}</p>`;
  html += `<p style="font-family: Arial, sans-serif; font-size: 11pt; margin: 0 0 16pt 0;"><strong style="font-weight: bold;">CTA -</strong> ${escapeHtml(script.callToAction)}</p>`;
  html += `</div>`;
  return html;
}

export function formatScriptToPlainText(script: GeneratedScript, scriptIndex: number, startHookNumber = 0): string {
  const bodyText = script.scenes
    .map((sc) => (sc.audioDialogue ? sc.audioDialogue.trim() : ''))
    .filter(Boolean)
    .join(' ');

  const titleHeader = getScriptTitleHeader(script, scriptIndex);

  let lines: string[] = [];
  lines.push(`${titleHeader}\n`);

  script.hooks.forEach((hook, i) => {
    const hookNum = startHookNumber + i + 1;
    lines.push(`Hook ${hookNum} - ${hook.audioDialogue}`);
    lines.push('');
  });

  lines.push(`Body - ${bodyText}`);
  lines.push('');
  lines.push(`CTA - ${script.callToAction}`);

  return lines.join('\n');
}

export function formatAllScriptsToHtml(scripts: GeneratedScript[]): string {
  let accumulatedHooks = 0;
  return scripts
    .map((s, idx) => {
      const html = formatScriptToHtml(s, idx, accumulatedHooks);
      accumulatedHooks += (s.hooks?.length || 0);
      return html;
    })
    .join('<br><hr style="border:0; border-top:1px solid #ccc; margin: 20pt 0;" /><br>');
}

export function formatAllScriptsToPlainText(scripts: GeneratedScript[]): string {
  let accumulatedHooks = 0;
  return scripts
    .map((s, idx) => {
      const text = formatScriptToPlainText(s, idx, accumulatedHooks);
      accumulatedHooks += (s.hooks?.length || 0);
      return text;
    })
    .join('\n\n----------------------------------------\n\n');
}

export async function copyFormattedToClipboard(htmlContent: string, plainTextContent: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plainTextContent], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      await navigator.clipboard.writeText(plainTextContent);
      return true;
    }
  } catch (err) {
    console.error('Clipboard rich-copy failed, falling back to writeText:', err);
    try {
      await navigator.clipboard.writeText(plainTextContent);
      return true;
    } catch (fallbackErr) {
      return false;
    }
  }
}

export function weaveBodyWithAnalogy(existingBody: string, analogyText: string): string {
  const cleanAnalogy = analogyText.trim();
  const cleanBody = existingBody.trim();

  if (!cleanBody) return cleanAnalogy;
  if (cleanBody.toLowerCase().includes(cleanAnalogy.toLowerCase())) return cleanBody;

  // Add natural bridge transitions for raw/standalone analogies
  let bridgedAnalogy = cleanAnalogy;
  const lowerAnalogy = cleanAnalogy.toLowerCase();

  if (lowerAnalogy.startsWith("det er som ")) {
    bridgedAnalogy = "Sagen er nemlig, at det er som " + cleanAnalogy.slice(11);
  } else if (lowerAnalogy.startsWith("som at ")) {
    bridgedAnalogy = "Det svarer lidt til at " + cleanAnalogy.slice(7);
  } else if (lowerAnalogy.startsWith("det svarer til ")) {
    bridgedAnalogy = "For uden den rette sammensætning svarer det til " + cleanAnalogy.slice(15);
  }

  if (!/[.!?]$/.test(bridgedAnalogy)) {
    bridgedAnalogy += '.';
  }

  const sentences = cleanBody.match(/[^.!?]+[.!?]+/g);

  if (!sentences || sentences.length === 0) {
    const bodyEnd = /[.!?]$/.test(cleanBody) ? cleanBody : `${cleanBody}.`;
    return `${bodyEnd} ${bridgedAnalogy}`;
  }

  if (sentences.length === 1) {
    const s1 = sentences[0].trim();
    return `${s1} ${bridgedAnalogy}`;
  }

  // Insert after Sentence 1 (the hook / problem setup) - ideal spot before solution presentation
  const insertIndex = 1;

  const firstPart = sentences.slice(0, insertIndex).map(s => s.trim()).join(' ');
  const secondPart = sentences.slice(insertIndex).map(s => s.trim()).join(' ');

  const matchedLength = sentences.join('').length;
  const trailingText = cleanBody.slice(matchedLength).trim();

  let result = `${firstPart} ${bridgedAnalogy} ${secondPart}`;
  if (trailingText) {
    result += ` ${trailingText}`;
  }

  return result.trim().replace(/\s+/g, ' ');
}

