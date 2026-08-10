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

## Sådan virker det

- Frontenden (React/Vite) er uændret fra den oprindelige app.
- Backend (`server.ts`) kalder Claude Fable 5 med **structured outputs** (JSON Schema), så alle scripts kommer tilbage i præcis det format, appen forventer.
- Modellen styrer selv sin reasoning (Fable 5 har altid thinking slået til), og et evt. sikkerhedsafslag besvares automatisk af en fallback-model (`fallbacks: "default"`).
- Modellen skiftes ét sted: konstanten `CLAUDE_MODEL` i `server.ts`.
- Projekter og AI-træningseksempler gemmes lokalt i `data/` (oprettes automatisk, ikke i git).
