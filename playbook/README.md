# Playbook

Kanonisk vidensgrundlag for scriptgeneratoren, bygget på "Awareness Stages in Marketing" (Hero Media / Schwartz, *Breakthrough Advertising*).

Princippet: **generatoren klassificerer strategien, før den skriver.** Klassificering og strategi sker på engelsk (kanonisk terminologi); selve scriptet skrives på markedssproget med naturligt kundesprog — aldrig oversat ordret.

## Hvordan serveren bruger filerne

| Fil | Bruges |
|---|---|
| `core.md` | Altid — i klassificerings-kaldet (diagnose, vagtregler, sophistication, QA) |
| `stages/<stadie>.md` | I genererings-kaldet — kun de stadier, de aktuelle scripts rammer |
| `markets/da.md` | I genererings-kaldet når scriptsproget er dansk |
| `ecommerce.md` / `leadgen.md` | I genererings-kaldet efter kampagnefokus (produkt/leads) |
| `trafik-temperatur.md` | I genererings-kaldet — sprogregler for kold, varm og hot trafik |
| `hooks.md` | I genererings-kaldet og ved regenerering af et hook — opråb, værdiløfte og de otte former |
| `hook-bibliotek.md` | Samme steder — de 25 hook-formater med brugssituation og framing-varianter |
| `hook-mekanik.md` | Samme steder — de 9 mekanikker, kombinationsregler, benchmarks og Meta-politik |
| `skrivestil.md` | I genererings-kaldet og ved regenerering — reglerne mod AI-klingende tekst |
| `processes.md` | Reference — stadie-filerne har hver deres relevante processer indlejret |

Filnavnene under `stages/` matcher awareness-id'erne i appen ("Problem Aware" → `problem-aware.md`). Rediger indholdet frit — serveren læser filerne ved hvert kald, så ændringer slår igennem uden genstart af buildet (dog kræver Render et re-deploy, da filerne følger med repoet).

Kildedokumenterne (dansk + engelsk Word-udgave) er fundamentet; denne mappe er den driftsklare opdeling af dem.
