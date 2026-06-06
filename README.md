# Quad — the campus that stops forgetting

> **Quad isn't a campus app — it's the first system where a college stops forgetting.**
> Every June the same exams, drives, clubs and panic repeat, and all of it walks out with the
> graduating batch. Quad captures campus life as it happens and turns accumulated, verified,
> AI-enriched memory into something the next student can **query, get matched to, and get warned
> by — before the deadline.**

Phone-first **CampusOS** built for the **iQOO Hackathon 2026 (PS2 · CampusOS)**.
Point a phone at campus life → AI enriches it → it's routed only to the people who care, and the
campus *remembers it forever*.

---

## The problem

Every year a college re-learns the same things. The best handwritten notes die in one notebook. A
senior's hard-won explanation leaves campus when they graduate. Deadlines (GATE, placement drives,
fests) are scattered across WhatsApp, notice boards, and word-of-mouth — so a fresher finds out
*after* it's too late. The most valuable asset a college has — its **lived, accumulated experience**
— is never captured, organized, trusted, or routed to the student who needs it.

## The solution

Capture campus life through the camera, enrich it with AI, and turn it into **institutional memory**
that is personalized, trustworthy, and *proactive*.

---

## Features

| | Feature | What it does |
|---|---|---|
| **F1** | **Notes Intelligence** | Scan a (Hindi-English) note → one vision-AI call does OCR + summary + key points + flashcards + tags + resources → published to the shared campus library |
| **F2** | **Ghost Senior** | Every note becomes a tutor — ask it questions, it answers in the contributor's voice. *The senior graduated; the explanation didn't.* |
| **F3** | **Camera reads the campus** | Poster → structured event · company flyer → structured drive (role/CTC/eligibility/deadline) → auto-routed to matching students |
| **F4** | **Reverse discovery** | An alumni posts an opening → Quad surfaces the students whose contributions & interests match |
| **F5** | **Two campuses, one pool** | Same posts, visibly different feeds for a final-year vs a fresher (tag-matching) + trust signals + a live **compounding counter** ("the institution's memory growing") |
| **F6** | **Proactive Campus Memory** | Unprompted warnings: *"GATE registration closes in 4 days. 3 seniors from your branch cleared it — here are their verified notes."* Rule-based on real data today, learns over batches next. |

**Bonus features shipped:** Campus **Oracle** (ask the whole campus memory) · Campus **Map** with live presence + **Nudge** pings · **Voice Notes** (RumiK TTS, gender-specific, pinned to the map) · **Quad Points** + tipping + **leaderboard** · live **events** with RSVP/reactions.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  iQOO PHONE  ·  Quad.apk  (Capacitor 8 → native Android)              │
│  React + TypeScript + Tailwind   ·   BMW-M design system              │
│  Camera · Microphone · Location · offline-friendly                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  HTTP over Wi-Fi / phone-hotspot LAN
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  QUAD BACKEND   ·   Node + Express + TypeScript   ·   :4000           │
│  stateless · in-memory store (seeded) · /uploads (images, voice WAVs) │
│                                                                       │
│  feed ranking (tag overlap)   Ghost Senior RAG   proactive-memory     │
│  reverse discovery   trust/points   Campus Oracle   map · nudges      │
│  — every AI key lives here; the client never sees one —               │
└───────────┬───────────────────────────────────────────┬──────────────┘
            │                                           │
            ▼                                           ▼
  ┌──────────────────────────┐               ┌────────────────────────┐
  │  OpenRouter              │               │  RumiK TTS             │
  │  Qwen2.5-VL-72B (vision) │               │  voice notes → WAV     │
  │  Qwen3-235B    (text)    │               └────────────────────────┘
  └──────────────────────────┘
  Google Maps JS API  (Campus Map screen)
```

### The core loop (scan → enrich → route → remember)

```
  Scan note ──▶ POST /contribute ──▶ Qwen-VL: OCR + summary + cards + tags
      │                                     │   (>18s or error ─▶ cached fallback,
      ▼                                     │    reveal still fires on stage)
  image saved to /uploads                   ▼
                                  enriched post · dedup · trust signals
                                            │
                                            ▼
                       tag-overlap ranking ──▶ routed into matching student feeds
                                            │
                                            ▼
                       compounding counter +1   (the campus memory grows, live)
```

**Matching is honest tag overlap, not embeddings** — looks semantic, 10× faster to build:

```
score = 3·tagOverlap(interests, post.tags)
      + 2·recencyDecay(created_at)
      + 2·roleRelevance(branch, year)
      + 1·trustScore(verified_by, topped_exam)
```

---

## Design system — "BMW M"

A motorsport-engineering aesthetic (installed via `getdesign add bmw-m`): precision, restraint, one
brand accent.

| Token | Value |
|---|---|
| Canvas | `#000000` true black |
| Type | white, **UPPERCASE machined** display (Saira Condensed 700) over light body (Saira 300) |
| Accent | the **M tricolor** stripe — `#0066b1` → `#1c69d4` → `#e22718` (brand signature only) |
| Urgency | **M-red `#e22718`** — drives the proactive deadline cards |
| Radius | `0px` everywhere (sharp rectangles = engineered precision); circles only for icon buttons |

Motion budget is spent almost entirely on the **enrichment reveal** (staggered summary → key points
→ flashcards → resources). Everything else stays calm.

---

## Repo structure

```
iqoo/
├── README.md            ← you are here (project overview)
├── PRD.md               ← full product spec + §10 "as-built" implementation status
├── CLAUDE.md            ← build guide / engineering constraints
├── Quad-debug.apk       ← installable Android build
└── quad/
    ├── README.md        ← detailed run / build guide
    ├── server/          ← Node + Express + TS backend (AI, store, ranking, memory engine)
    │   └── src/
    │       ├── index.ts        ← all REST routes
    │       ├── store.ts        ← in-memory seeded store
    │       ├── seed.ts         ← users, posts, drives, academic calendar
    │       ├── ranking.ts      ← feed scoring (tag overlap)
    │       ├── memory.ts       ← F6 proactive-memory rule engine
    │       ├── oracle.ts       ← campus-wide Q&A
    │       └── ai/             ← OpenRouter client, enrichNote, ghostSenior, parsePoster, rumikTts, fallback
    └── app/             ← React + Vite + Tailwind + Capacitor (Android)
        └── src/screens/ ← Onboarding, Feed, Contribute, NoteDetail, DriveDetail,
                           TwoCampus, Oracle, CampusMap, EventsFeed, Profile
```

---

## Getting started

### 1. Backend
```sh
cd quad/server
npm install
cp .env.example .env      # then fill in keys (see below)
npm start                 # binds 0.0.0.0:4000 so the phone can reach it
```

`server/.env`:
```
OPENROUTER_API_KEY=...            # all AI (vision OCR + chat) via OpenRouter
OPENROUTER_VISION_MODEL=qwen/qwen2.5-vl-72b-instruct
OPENROUTER_TEXT_MODEL=qwen/qwen3-235b-a22b-2507
RUMIK_API_KEY=...                 # voice notes (optional — app still runs without it)
```
> Without keys, the backend serves built-in **fallback/seed** results — the whole app still works for
> a dry run; the live scan just won't be "live".

### 2. Frontend (browser dev)
```sh
cd quad/app
npm install
npm run dev               # http://localhost:5173 (camera falls back to file picker)
```

### 3. Android APK (the real demo)
The phone runs the app; the laptop runs the backend; the phone reaches it over the LAN.
```sh
cd quad/app
# set API_BASE in src/api.ts to your laptop's LAN IP, e.g. http://192.168.x.x:4000
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk
```
A prebuilt **`Quad-debug.apk`** is at the repo root. The manifest already enables cleartext HTTP and
Camera/Mic/Location/Internet permissions.

> ⚠️ The API base IP is **compiled into the bundle**. If the laptop's LAN IP changes, update
> `src/api.ts` and rebuild.

---

## API surface (REST, `:4000`)

```
GET  /health                      ·  GET /feed (posts + memory_cards + stats)  ·  GET /stats
POST /auth/login  ·  GET /me  ·  PATCH /me/interests
POST /contribute (note|poster|drive|text)   ·   POST /contribute/voice (RumiK TTS)
GET  /post/:id  ·  POST /post/:id/ask (Ghost Senior)  ·  /verify  ·  /tip
GET  /calendar  ·  GET /memory  ·  POST /memory/:id/ack            (F6 proactive memory)
POST /drive  ·  GET /drive/:id/candidates                         (reverse discovery)
GET  /map  ·  GET /active-users  ·  POST /nudge  ·  GET /nudges     (campus map)
GET  /voices  ·  GET /events/live  ·  /rsvp  ·  /react             (voice notes, events)
POST /oracle                                                       (campus-wide Q&A)
POST /admin/reset                                                  (clean state per rehearsal)
```

---

## Tech stack

**Frontend** React · TypeScript · Vite · Tailwind · Framer Motion · Capacitor 8 (Android) · Google Maps JS
**Backend** Node · Express · TypeScript · in-memory store · Multer (uploads)
**AI** OpenRouter — Qwen2.5-VL-72B (multilingual handwriting OCR) · Qwen3-235B (chat/RAG) · RumiK TTS (voice)
**Design** BMW-M system (Saira / Saira Condensed, M-tricolor accent)

---

## Honesty (we don't overclaim)

- Matching is **tag overlap**, not embeddings or a knowledge graph.
- Proactive Campus Memory is **rule-based on real accumulated data** today — *"rule-based now, learns over batches next."* The data is the moat; the learning is the roadmap.
- Store is **in-memory** for the demo (resets clean each rehearsal); the design slots a real DB in behind the same interface.

See **`PRD.md`** for the full product spec and the detailed **§10 as-built** status.
