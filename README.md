# Jalal Visuals MetaScript Generator

Script-generator til Meta (Facebook/Instagram) video-annoncer — hooks, body-scener og CTA'er på dansk. Kører på **Grok 4.6** via xAI's API.

## Kom i gang

1. **Installér dependencies**
   ```bash
   npm install
   ```

2. **Opret en `.env`-fil** i projektets rod med din Anthropic API-nøgle (opret nøglen på [platform.claude.com](https://platform.claude.com) under *API Keys*):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **Start appen**
   ```bash
   npm run dev
   ```
   Åbn derefter [http://localhost:3000](http://localhost:3000)

## Produktion

```bash
npm run build
npm start
```

## Adgang

Appen er lukket bag en login-side. Adgangskoderne sættes i miljøvariablen
`APP_PASSWORDS` (adskil flere koder med komma):

```
APP_PASSWORDS=jeres-fælles-kode
```

- Alle med koden deler kunder, projekter og AI-træning — ét fælles arbejdsrum
- Skal én person miste adgang, skiftes koden (og deles på ny med resten)
- Koden må **aldrig** stå i repoet — den sættes kun som miljøvariabel i Render
- Sættes `APP_PASSWORDS` ikke, er appen åben (kun til lokal udvikling)

Skal data i stedet holdes adskilt pr. virksomhed, understøtter serveren også
`APP_USERS` med formatet `Navn:Virksomhed:kode` adskilt af komma. Så ser hver
bruger kun sin egen virksomheds kunder og projekter, medmindre de markeres som
fælles.

## Offentlig hosting (Render.com — gratis)

Repoet indeholder en `render.yaml`, så deploy er få klik:

1. Opret en konto på [render.com](https://render.com) og log ind med GitHub
2. Klik **New → Blueprint** og vælg `Majestic100/Scriptgenerator`-repoet
3. Indsæt din `ANTHROPIC_API_KEY`, når Render spørger efter den
4. Klik **Apply** — efter et par minutter kører appen på en offentlig URL a la `https://metascript-generator.onrender.com`

Bemærk: På gratis-planen "sover" appen efter inaktivitet (første besøg tager ~30 sek.), og gemte projekter/AI-træning nulstilles ved re-deploy, da de gemmes på serverens lokale disk.

## Sådan virker det

- Frontenden (React/Vite) er uændret fra den oprindelige app.
- Backend (`server.ts`) kalder modellen med **structured outputs** (JSON Schema), så alle scripts kommer tilbage i præcis det format, appen forventer. Svaret streames, så store bestillinger ikke rammer faste forbindelses-timeouts.
- **Grok 4.6** (xAI) er den eneste aktive model og kræver `XAI_API_KEY` som miljøvariabel (nøgle oprettes på console.x.ai). Claude-kaldsvejen står urørt i `server.ts`; skal Fable 5/Opus 5 tilbage, genindsættes opslaget i `normalizeModel`.
- Projekter og AI-træningseksempler gemmes lokalt i `data/` (oprettes automatisk, ikke i git).
