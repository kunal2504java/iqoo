# Quad — phone-first CampusOS

Point a phone at campus life → AI enriches it → it's routed only to the people who care.

Two parts:

- `server/` — single Node service (Express + TypeScript). In-memory store seeded on boot, local disk for images, all Claude AI calls (vision enrichment, Ghost Senior, poster parser).
- `app/` — React + TypeScript + Tailwind, shipped to the iQOO phone via Capacitor.

## Run for the demo (phone + laptop)

The demo runs **on the iQOO phone**; the backend runs **on your laptop**. Easiest venue-proof setup:

1. Turn on your **phone's hotspot** and join the laptop to it. (The laptop now has internet via mobile data — that's what the Claude calls use. The phone reaches the laptop over the same hotspot LAN.)
2. Find your laptop's hotspot IP: `ipconfig` (look for the Wi-Fi adapter address, e.g. `192.168.x.x`).
3. Start the backend (binds `0.0.0.0`, so the phone can reach it):
   ```sh
   cd server && npm install && npm run dev
   ```
4. Point the app at the laptop. Set `VITE_API_BASE` in `app/.env` to `http://<laptop-ip>:4000`, then build & sync the Android app:
   ```sh
   cd app && npm install && npm run build && npx cap sync android && npx cap run android
   ```

For fast iteration on the laptop browser, just `cd app && npm run dev` (camera falls back to a file picker in the browser).

## AI (OpenRouter)

All AI calls go through the backend via **OpenRouter** (OpenAI-compatible API). The backend reads `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` from `server/.env`. The model must be vision-capable for the note/poster scan — default is `anthropic/claude-3.5-sonnet` (switch to `google/gemini-2.0-flash-001` for faster/cheaper, or `openai/gpt-4o`). Without a key, every AI call serves the built-in fallback/seed result — the whole app still works for a dry run, the live scan just won't be "live". Copy `server/.env.example` to `server/.env` and fill in the key.
