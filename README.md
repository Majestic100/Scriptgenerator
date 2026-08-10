# Jalal Visuals MetaScript Generator

Script-generator til Meta (Facebook/Instagram) video-annoncer — hooks, body-scener og CTA'er på dansk. Kører på **Claude Fable 5** via Anthropic API.

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

## Offentlig hosting (Render.com — gratis)

Repoet indeholder en `render.yaml`, så deploy er få klik:

1. Opret en konto på [render.com](https://render.com) og log ind med GitHub
2. Klik **New → Blueprint** og vælg `Majestic100/Scriptgenerator`-repoet
3. Indsæt din `ANTHROPIC_API_KEY`, når Render spørger efter den
4. Klik **Apply** — efter et par minutter kører appen på en offentlig URL a la `https://metascript-generator.onrender.com`

Bemærk: På gratis-planen "sover" appen efter inaktivitet (første besøg tager ~30 sek.), og gemte projekter/AI-træning nulstilles ved re-deploy, da de gemmes på serverens lokale disk.

## Sådan virker det

- Frontenden (React/Vite) er uændret fra den oprindelige app.
- Backend (`server.ts`) kalder Claude Fable 5 med **structured outputs** (JSON Schema), så alle scripts kommer tilbage i præcis det format, appen forventer.
- Modellen styrer selv sin reasoning (Fable 5 har altid thinking slået til), og et evt. sikkerhedsafslag besvares automatisk af en fallback-model (`fallbacks: "default"`).
- Modellen skiftes ét sted: konstanten `CLAUDE_MODEL` i `server.ts`.
- Projekter og AI-træningseksempler gemmes lokalt i `data/` (oprettes automatisk, ikke i git).
