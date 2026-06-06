# Quad — phone-first CampusOS

Point a phone at campus life → AI enriches it → it's routed only to the people who care, and the
campus *remembers it forever*. See the root [`../README.md`](../README.md) for the full overview,
architecture, and design system.

Two parts:

- `server/` — single Node service (Express + TypeScript). In-memory store seeded on boot, local disk
  for images & voice WAVs. All AI calls (vision enrichment, Ghost Senior, poster parser, Oracle) go
  through the backend via **OpenRouter**; voice notes via **RumiK TTS**.
- `app/` — React + TypeScript + Tailwind (BMW-M design), shipped to the iQOO phone via **Capacitor 8**.

## Run for the demo (phone + laptop)

The demo runs **on the iQOO phone**; the backend runs **on your laptop**. Venue-proof setup:

1. Turn on the **phone's hotspot** and join the laptop to it. (The laptop now has internet via mobile
   data — that's what the OpenRouter/RumiK calls use. The phone reaches the laptop over the same LAN.)
2. Find the laptop's IP: `ipconfig` (Wi-Fi adapter address, e.g. `192.168.x.x` / `10.x.x.x`).
3. Start the backend (binds `0.0.0.0`, so the phone can reach it):
   ```sh
   cd server && npm install && npm start
   ```
4. Point the app at the laptop. Set `API_BASE` in `app/src/api.ts` to `http://<laptop-ip>:4000`,
   then build & install the Android app:
   ```sh
   cd app && npm install && npm run build && npx cap sync android
   cd android && ./gradlew assembleDebug
   # → app/build/outputs/apk/debug/app-debug.apk   (or use the prebuilt ../Quad-debug.apk)
   ```

For fast iteration on the laptop browser: `cd app && npm run dev` (camera falls back to a file picker).

> The API base IP is compiled into the APK. If the laptop's LAN IP changes, update `app/src/api.ts`
> and rebuild. Before each rehearsal, `POST /admin/reset` for a clean compounding counter.

## Environment (`server/.env`)

```
OPENROUTER_API_KEY=...                              # all AI (vision OCR + chat/RAG)
OPENROUTER_VISION_MODEL=qwen/qwen2.5-vl-72b-instruct  # multilingual handwriting OCR
OPENROUTER_TEXT_MODEL=qwen/qwen3-235b-a22b-2507        # Ghost Senior + Oracle
RUMIK_API_KEY=...                                  # voice notes (optional)
PORT=4000
QUAD_AI_TIMEOUT_MS=18000                            # before the scan fallback fires
```

Copy `server/.env.example` to `server/.env` and fill in the keys. **Without keys**, every AI call
serves the built-in fallback/seed result — the whole app still works for a dry run, the live scan just
won't be "live". Keys live only on the backend; the client never sees one.

## Android requirements (already configured)

- `usesCleartextTraffic="true"` — so the app can reach the `http://` LAN backend (API, images, voice).
- Permissions: `INTERNET`, `CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE/COARSE_LOCATION`.
- Build with **JDK 21** (Android Studio's bundled JBR) — JDK 22 fails Capacitor 8's Gradle plugin.
