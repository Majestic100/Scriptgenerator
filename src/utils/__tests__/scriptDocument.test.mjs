// Kører scriptDocument.ts gennem tsx og tjekker frem-og-tilbage-omsætningen.
import { scriptToDocument, documentToScript, parseDocument } from '../scriptDocument';

let fejl = 0;
const ok = (navn, faktisk, forventet) => {
  const a = JSON.stringify(faktisk);
  const b = JSON.stringify(forventet);
  if (a !== b) { fejl++; console.log('FEJL  ' + navn + '\n  fik      ' + a + '\n  forventet ' + b); }
  else console.log('ok    ' + navn);
};

const base = {
  id: 's', title: 'T', conceptAngle: '', scriptType: 'UGC', bodyDuration: '30-40 sekunder',
  companyName: 'Firma', competitors: [], competitorDifferentiation: '',
  hooks: [
    { id: 'h1', hookNumber: 1, angleType: 'A', visualDirection: 'VIS1', textOnScreen: 'T1', audioDialogue: 'Hook et.', estimatedDurationSec: 3 },
    { id: 'h2', hookNumber: 2, angleType: 'B', visualDirection: 'VIS2', textOnScreen: 'T2', audioDialogue: 'Hook to.', estimatedDurationSec: 3 }
  ],
  scenes: [
    { id: 'sc1', timecode: '0:03 - 0:10', section: 'Problem/Pain', visualDescription: 'SV1', textOnScreen: 'ST1', audioDialogue: 'Scene et.' },
    { id: 'sc2', timecode: '0:10 - 0:20', section: 'Solution/Demo', visualDescription: 'SV2', textOnScreen: 'ST2', audioDialogue: 'Scene to.' },
    { id: 'sc3', timecode: '0:20 - 0:26', section: 'CTA & Offer', visualDescription: 'SV3', textOnScreen: 'ST3', audioDialogue: 'CTA-scene.' }
  ],
  callToAction: 'Køb i dag.', proTips: [], createdAt: ''
};

// 1. Dokumentet indeholder replikkerne og ikke visuals
const doc = scriptToDocument(base);
ok('dokument uden visuals', /VIS1|SV1|ST1/.test(doc), false);
ok('dokument har begge hooks', doc.includes('Hook et.') && doc.includes('Hook to.'), true);
ok('CTA-scenen er ikke i manuskriptet', doc.includes('CTA-scene.'), false);
ok('manuskript samlet', doc.includes('Scene et. Scene to.'), true);

// 2. Uændret dokument giver uændret indhold
const r1 = documentToScript(base, doc);
ok('uændret: hooks', r1.script.hooks.map(h => h.audioDialogue), ['Hook et.', 'Hook to.']);
ok('uændret: visuals bevaret', r1.script.hooks.map(h => h.visualDirection), ['VIS1', 'VIS2']);
ok('uændret: body uden dublering', scriptToDocument(r1.script).includes('Scene et. Scene to.'), true);
ok('uændret: CTA-scene rørt ikke', r1.script.scenes[2].audioDialogue, 'CTA-scene.');
ok('uændret: tidskoder bevaret', r1.script.scenes.map(s => s.timecode), ['0:03 - 0:10', '0:10 - 0:20', '0:20 - 0:26']);

// 3. Rettet tekst havner det rigtige sted
const rettet = `HOOK 1
Nyt hook.

HOOK 2
Hook to.

MANUSKRIPT
Helt ny body over
to linjer.

CTA
Ny CTA.`;
const r2 = documentToScript(base, rettet);
ok('rettet: hook 1', r2.script.hooks[0].audioDialogue, 'Nyt hook.');
ok('rettet: hook 1 beholder visual', r2.script.hooks[0].visualDirection, 'VIS1');
ok('rettet: body', r2.script.scenes[0].audioDialogue, 'Helt ny body over\nto linjer.');
ok('rettet: scene 2 tømt', r2.script.scenes[1].audioDialogue, '');
ok('rettet: scene 2 beholder visual', r2.script.scenes[1].visualDescription, 'SV2');
ok('rettet: CTA', r2.script.callToAction, 'Ny CTA.');

// 4. Slettet hook forsvinder
const udenHook2 = `HOOK 1
Kun et hook.

MANUSKRIPT
Body.

CTA
CTA.`;
const r3 = documentToScript(base, udenHook2);
ok('slettet hook', r3.script.hooks.length, 1);
ok('slettet hook: nummerering', r3.script.hooks[0].hookNumber, 1);

// 5. Nyt hook tilføjet
const medHook3 = doc + '\n\nHOOK 3\nHelt nyt hook.';
const r4 = documentToScript(base, medHook3);
ok('nyt hook tilføjet', r4.script.hooks.length, 3);
ok('nyt hook tekst', r4.script.hooks[2].audioDialogue, 'Helt nyt hook.');

// 6. Engelske overskrifter læses også
const engelsk = `HOOK 1
Eng hook.

BODY
Eng body.

Call to action
Eng cta.`;
const r5 = documentToScript(base, engelsk);
ok('engelske overskrifter', [r5.script.hooks[0].audioDialogue, r5.script.scenes[0].audioDialogue, r5.script.callToAction],
   ['Eng hook.', 'Eng body.', 'Eng cta.']);

// 7. Tekst uden overskrifter gemmes ikke
const r6 = documentToScript(base, 'Bare noget løs tekst uden overskrifter.');
ok('uden overskrifter: ingen ændring', r6.changed, false);

// 8. Tomt manuskript er en bevidst tømning, ikke "mangler"
const r7 = documentToScript(base, 'HOOK 1\nH.\n\nMANUSKRIPT\n\nCTA\nC.');
ok('tomt manuskript tømmer bodyen', r7.script.scenes[0].audioDialogue, '');

console.log(fejl === 0 ? '\nALLE TESTS OK' : `\n${fejl} FEJL`);
process.exit(fejl === 0 ? 0 : 1);
