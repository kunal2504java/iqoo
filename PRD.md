# Quad — Product Requirements Document
### iQOO Hackathon 2026 · PS2 CampusOS · 8-hour build

> **One line:** Quad isn't a campus app — it's the first system where **a college stops forgetting**. Every year the same exams, drives, clubs and panic repeat, and every June it all walks out with the graduating batch. Quad captures campus life as it happens and turns accumulated, verified, AI-enriched memory into something the next student can **query, get matched to, and get warned by — before the deadline.**

> **Positioning (read once, then everywhere):** The thesis is *institutional memory*, not "an app with features." Reframe the existing pieces accordingly — Ghost Senior = "the college remembers how to explain this"; the compounding counter = "the institution's memory growing"; the feed = "your campus's accumulated memory, tuned to you." The new feature **F6 (Proactive Campus Memory)** is the proof: the system warns a student about something nobody told them, because last year's batch lived it and Quad never forgot.

---

## 0. Build philosophy (read this first)

This is an **8-hour sprint**, not a startup. The PRD below specifies the *full* product so the pitch looks ambitious, but the **MUST-BUILD** core is small and ruthless. Anything marked `[DEMO]` is faked with seed data and must *look* real, not *be* real. Anything marked `[STRETCH]` is built only if core is solid.

**Golden rule of the demo:** one real handwritten Hindi-English note, scanned live on the iQOO phone, becomes a summary + flashcards + a chat-able tutor + a feed item routed to a matching student — in under 20 seconds, on stage. Everything else supports that moment.

| Priority | Meaning |
|----------|---------|
| `[CORE]` | Must work live. If this breaks, we lose. |
| `[DEMO]` | Seed/mock data, must look authentic. |
| `[STRETCH]` | Only if CORE is done with time to spare. |

---

## 1. The five features

### F1 — Notes Intelligence (the marquee loop) `[CORE]`
Scan a page → multimodal LLM does OCR + summary + key points + flashcards in **one call** → published to the shared campus library, indexed by topic, deduped, and pushed into matching feeds.

### F2 — Ghost Senior (notes that talk back) `[CORE]`
Every contributed note becomes a tutor. A student opens any note and *asks it questions*. RAG over that note's extracted text + the LLM answers in the contributor's framing. Pitch: *"The senior graduated, but their explanation didn't leave campus."*

### F3 — The camera reads the whole campus `[CORE for posters/drives, DEMO for mess menu]`
Same enrichment engine, different inputs. Point the camera at:
- a **notice-board poster** → structured event (title, date, venue, RSVP)
- a **company-drive flyer** → structured opportunity (role, CTC, eligibility, deadline) → routed to matching students
- the **mess menu board** `[DEMO]` → parsed + searchable

### F4 — Reverse discovery (two-sided) `[DEMO]`
When an alumni posts an opening, Quad surfaces *"6 students whose contributions & interests match"* back to the poster. **Demo data only** — a pre-seeded candidate list rendered against the posted drive. Looks like a marketplace; is a query over seed rows.

### F5 — Two students, two campuses (personalization) `[CORE]`
Same post pool, two profiles, visibly different feeds, shown side by side live. Plus a **trust layer**: AI dedups near-identical notes and a "verified by N students / topped exam using this" signal ranks quality. The compounding-value counter ("this batch added 412 notes…") makes the moat a number on screen — framed as **the institution's memory growing**, not a vanity metric.

### F6 — Proactive Campus Memory (the system warns you first) `[CORE]`
The feature that makes "a college that stops forgetting" undeniable. A **seeded academic calendar** (mid-sems, GATE/placement registration deadlines, fest dates, drive windows — each with branch/year relevance and curated "cleared-by" evidence) feeds a **rule-based surfacing engine**. Given today's date + a user's branch/year/interests, Quad pushes *unprompted* **memory cards** into the feed:

> "GATE registration closes in **4 days**. **3 seniors from your branch** cleared it — here are the verified notes and the exact resources they used. *Add deadline to your calendar?*"

The card pulls entirely from **existing** seeded notes + trust + contributions — it is *evidence* of the memory thesis, not new content. Reuse the existing **tag-matching + trust scoring**; rank by urgency (days-until) × relevance.

**Implementation honesty `[important]`:** this is **rule-based on seed data** for the demo — one seeded calendar + one rule engine + one new card type. Frame it in copy and deck as **"rule-based today, learned over batches next."** Do **not** claim a knowledge graph, embeddings, or ML we didn't build. Scope: ~1 hour. Don't let it expand.

---

## 2. User roles

| Role | Can do |
|------|--------|
| **Student** | Onboard (interests/branch/year), scan notes, ask Ghost Senior, RSVP, verify notes, see personalized feed |
| **Senior** | Everything a student can, + their notes are weighted higher in trust |
| **Alumni** | Post drives/openings, see reverse-discovery candidate matches |
| **Admin** `[STRETCH]` | Moderate, pin announcements |

Auth for the hackathon: **fake college-email login** — pick a role + identity from a dropdown, no real SSO. Don't waste time on auth. `[DEMO]`

---

## 3. UI / Screens

**Aesthetic direction:** phone-first, dark "campus at night" theme with one warm accent (think notebook-ink + a single highlighter color). Distinctive display font for headers, clean readable body. Avoid generic AI/purple-gradient look. Big tap targets, two-tap contribution, motion only on the enrichment "reveal" moment (the wow).

Design tokens (suggested — refine in build):
```
--bg:        #0E0F12   (near-black, slight blue)
--surface:   #17191F
--ink:       #EDEDEA   (paper-white text)
--muted:     #8A8F98
--accent:    #FFD24A   (highlighter yellow — the ONE accent)
--accent-2:  #6EE7B7   (success / verified)
--danger:    #FF6B6B
--radius:    18px
font-display: a characterful serif/grotesque (NOT Inter/Roboto)
font-body:    a clean readable sans
```

### Screen list

**S0 — Onboarding** `[CORE]`
- Pick role + identity (dropdown, demo).
- Interest multi-select chips: Placements, GATE, Hackathons, Sports, Cultural, specific clubs, domains.
- Branch + year pickers.
- "These build your profile — your feed tunes to this." → writes interest profile.

**S1 — Feed (home)** `[CORE]`
- Personalized, ranked stream of cards: notes, events, drives, announcements.
- Card types color-coded by accent intensity. Each shows: title, AI summary (1 line), topic tags, trust badge, contributor + role.
- Top strip: **compounding counter** ("412 notes · 38 drives · 1,200 enrichments this batch").
- Tap a card → detail.

**S2 — Contribute (the two-tap)** `[CORE]`
- One big FAB → sheet with: **Scan note**, **Snap a poster**, **Post a drive**, **Quick text**.
- Scan flow: camera (Capacitor) → preview → optional title + 1-line desc → "Enrich" button.

**S3 — Enrichment reveal** `[CORE]` — *the wow screen*
- Shows the raw scanned image on top.
- Animated, staggered reveal as AI returns: **Summary** → **Key points** → **Flashcards** (flippable) → **Resource links**.
- "Published to campus library · matched to N students" toast.
- Loading state must feel alive (skeleton + progress copy), not a frozen spinner.

**S4 — Note detail + Ghost Senior** `[CORE]`
- Full extracted text, summary, flashcards, resources.
- Trust row: "verified by 7 · topped exam: 2".
- **Ask this note** chat box → RAG answers framed as the contributor.

**S5 — Drive / Opportunity detail** `[CORE for student view]`
- Structured: role, CTC, eligibility, deadline, who posted.
- Student view: "Matches your profile" badge + RSVP/apply.
- Alumni view: **Reverse discovery** — "6 matching students" list `[DEMO]`.

**S6 — Two-campus split (demo view)** `[CORE]`
- A presenter screen: two phone frames side by side, Profile A (final-year, placements) vs Profile B (fresher, clubs), same post pool, different ordered feeds. Toggle to prove it live.

**S7 — Profile / interests edit** `[CORE-lite]`
- Edit interests anytime. Shows "your feed adapts to what you open & contribute."

---

## 4. Backend

Keep it **stateless + thin**. Single Node service (or edge functions) + Postgres + object storage + Redis (optional). No microservices. No pgvector unless trivial — **topic-tag matching beats embeddings for the demo and is 10x faster to build.**

### Services (logical, can be one app)

**Auth** `[DEMO]` — pick role/identity, returns a fake JWT.

**Ingestion** `[CORE]` — receives a contribution (image + meta), stores image to object storage, creates a `post` row in `pending` state, kicks the enrichment call, updates row to `enriched`.

**Enrichment orchestrator** `[CORE]` — calls the LLM (see §6), parses structured JSON, writes summary/flashcards/resources/tags, computes dedup hash.

**Feed ranking** `[CORE]` — `score = interest_overlap*W1 + recency*W2 + role_relevance*W3 + trust*W4`. Plain SQL + scoring in app code. No ML.

**Ghost Senior / RAG** `[CORE]` — for a note, fetch its extracted text, stuff into context, answer the question framed as contributor. For a single note, context-stuffing **is** the RAG — no vector DB needed.

**Reverse discovery** `[DEMO]` — query seed students whose interest tags ∩ drive tags, return top N.

**Notifications** `[STRETCH]` — FCM push; for demo, an in-app toast/notification list is enough.

### Data model (Postgres)

```sql
users(
  id, name, role,            -- student|senior|alumni|admin
  branch, year, interests[], -- text[] of interest tags
  created_at
)

posts(
  id, type,                  -- note|event|drive|announcement|menu
  author_id, title, description,
  image_url,                 -- object storage
  status,                    -- pending|enriched|failed
  topic_tags[],              -- AI-assigned, used for matching
  branch_relevance[], year_relevance[],
  dedup_hash,                -- for near-dup detection
  created_at
)

note_enrichment(
  post_id, extracted_text,   -- OCR result
  summary, key_points[],
  flashcards jsonb,          -- [{q,a}]
  resources jsonb,           -- [{title,url}]
  language                   -- detected (hi/en/mixed)
)

drive_details(
  post_id, role, ctc, eligibility, deadline
)

trust_signals(
  post_id, verified_by int, topped_exam int
)

events(
  post_id, venue, start_time, rsvp_count
)

interactions(            -- powers "profile adapts to what you open"
  user_id, post_id, action  -- open|save|verify|contribute
)

academic_calendar(       -- F6: the seed that lets the campus "remember what's coming"
  id, title, kind,          -- exam|registration|drive|fest|deadline
  date,                     -- ISO date
  branch_relevance[], year_relevance[], topic_tags[],
  cleared_by,               -- curated "N seniors cleared it" count (seed)
  evidence_post_ids[]       -- verified notes/resources they used
)
```

Seed: ~30 posts across types, ~12 users across roles/branches/years, trust counts, a few drives with candidate matches. This seed data carries F4 and the two-campus demo.

### API surface (REST)

```
POST /auth/login            {identity} -> {token, user}
GET  /feed                  -> ranked posts for current user
POST /contribute            multipart: image + {type,title,desc} -> {post_id}
GET  /post/:id              -> full post + enrichment
POST /post/:id/ask          {question} -> Ghost Senior answer (RAG)
POST /post/:id/verify       -> increments trust
POST /drive                 {role,ctc,eligibility,deadline,tags} -> post
GET  /drive/:id/candidates  -> reverse-discovery matches  [DEMO]
GET  /me                    -> profile
PATCH /me/interests         {interests[]} -> updated profile
GET  /stats                 -> compounding counter numbers
GET  /feed                  -> also returns `memory_cards[]` (F6 proactive surfacing)
GET  /calendar              -> seeded academic calendar
POST /memory/:eventId/ack   -> "add deadline to my calendar" (records intent)  [DEMO]
```

---

## 5. Architecture (one diagram, for the deck)

```
  iQOO PHONE (Capacitor, one web codebase)
   Camera · Mic · Push · Filesystem · offline cache
                    │
                    ▼
   THIN API  (Node, stateless)
   auth · ingestion · feed ranking · ask · stats
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  AI ENRICHMENT            SHARED CAMPUS BRAIN
  (LLM calls)              Postgres · Object store
  OCR+summary+cards        (+ Redis cache, optional)
  parse poster/drive
  Ghost Senior RAG
        │
        ▼
  External: LLM provider (Claude API) · Web search · FCM
```

---

## 6. AI calls — exact specs

All enrichment is **multimodal, single-call where possible**, returning **strict JSON**. Use Claude API (model: a current vision-capable model). Always instruct "respond ONLY with JSON, no prose, no markdown fences," then parse defensively (strip fences, try/catch).

### AI-1 · Note enrichment (image → everything) `[CORE]`
**Input:** scanned note image (base64) + optional title/desc.
**One call does OCR + summarize + flashcards + tags + resources-query.**

System prompt (essence):
> You are Quad's note-enrichment engine. You receive a photo of student notes that may mix Hindi and English, handwriting and print. Extract the text faithfully, then produce study aids. Respond ONLY with JSON.

Expected JSON:
```json
{
  "extracted_text": "...",
  "language": "mixed|en|hi",
  "summary": "2-3 sentence tight summary",
  "key_points": ["...", "..."],
  "flashcards": [{"q":"...","a":"..."}],
  "topic_tags": ["thermodynamics","first-law"],
  "branch_relevance": ["Mechanical","Chemical"],
  "year_relevance": ["2","3"],
  "resource_query": "first law of thermodynamics intro"
}
```

### AI-2 · Resource finder `[CORE, can be DEMO]`
Take `resource_query` → one web-search-enabled call returning 2–3 `{title,url}`. If web search is flaky in the venue, **hardcode 2 good links per demo topic**. Nobody verifies links live.

### AI-3 · Ghost Senior (RAG chat) `[CORE]`
**Input:** note's `extracted_text` + `summary` + user question.
System prompt:
> You are the student who wrote these notes, helping a junior. Answer ONLY from the notes; if it's not covered, say so plainly and suggest what to look up. Keep the senior's framing and tone.
Return plain text answer.

### AI-4 · Poster / drive parser (image → structured) `[CORE]`
**Input:** poster or flyer image.
> Extract a structured campus item from this image. Decide if it's an EVENT or a DRIVE. Respond ONLY with JSON.
```json
{
  "type": "event|drive",
  "title": "...",
  "venue": "...", "start_time": "...",          // event
  "role":"...","ctc":"...","eligibility":"...","deadline":"...", // drive
  "topic_tags":["placements","backend"],
  "branch_relevance":["CSE"], "year_relevance":["4"]
}
```

### AI-5 · Dedup check `[STRETCH / cheap version]`
Cheap version: hash normalized `summary` text; if cosine/sim over a threshold against existing summaries, mark `duplicate_of`. For demo, a simple normalized-string match on title+topic is enough to *show* "Quad merged 3 near-identical notes."

### Cost / latency notes
- Note enrichment is the slow call (vision + generation). Pre-warm during setup; on stage, the *first* scan should be a known-good page you tested. Have a **pre-enriched fallback** keyed to the demo image hash so if the live call stalls, the reveal still fires. (Build this fallback — it's your insurance.)

---

## 7. Demo script (3 minutes)

1. **Hook (15s):** "Every June, a college forgets. The exams, the drives, the notes, the hard-won lessons — they graduate with the batch and next year starts from zero. Quad is the first system where the college *stops forgetting*."
2. **Live scan (50s):** iQOO camera → scan real Hindi-English page → S3 reveal: summary, key points, flashcards, resources. "That's one student handing a memory to the whole campus — matched to N students who care."
3. **Ghost Senior (25s):** Open the note, type a question, it answers in the senior's voice. "The college now *remembers how to explain this* — the senior graduated, the explanation didn't."
4. **Camera reads campus (25s):** Snap a company-drive flyer → structured opportunity → "routed only to final-year CSE, placement-interested."
5. **Two campuses (20s):** Split screen, two profiles, same posts, different feeds. "Same accumulated memory — a final-year and a fresher open it and see two different campuses."
6. **Moat (15s):** Point at the live counter. "This isn't a metric — it's the institution's memory growing. We don't make the content. The campus does. Every batch makes it richer."
7. **The proactive close (25s) — the moment:** Switch to a **fresher's** profile. Quad has *unprompted* surfaced a memory card: *"GATE registration closes in 4 days. 3 seniors from your branch cleared it — here are their verified notes and the exact resources they used."* Land it:
   > "No one told this student. The college didn't email them. A senior didn't WhatsApp them. The system remembered — because last year's batch lived it, and Quad never forgot."
8. **Built vs next (5s):** "Notes, Ghost Senior, camera capture, personalization, proactive memory — live today. The proactive layer is rule-based now; it *learns over batches* next." Stop.

**Pre-empt the judge's question:** "What about garbage content?" → trust signals + AI dedup, shown on screen. "Is the proactive part real ML?" → "Rule-based on real accumulated data today; the data is the moat, the learning is the roadmap. We don't overclaim."

---

## 8. 8-hour build timeline (suggested)

| Hour | Goal |
|------|------|
| 0–1 | Scaffold Capacitor + React app, design tokens, Postgres schema, seed data |
| 1–2 | AI-1 note enrichment call working end-to-end (image → JSON) + fallback |
| 2–3 | Contribute + Enrichment reveal screens (S2, S3) — the wow |
| 3–4 | Feed + ranking + note detail (S1, S4) |
| 4–5 | Ghost Senior RAG (AI-3) + poster/drive parser (AI-4) |
| 5–6 | Two-campus split + trust signals + compounding counter |
| 6–7 | Reverse discovery (seed), polish, animations, dark theme pass |
| 7–8 | Demo rehearsal, fallback testing on the actual iQOO device, deck cut |

**De-risk early:** get the camera plugin working on the real iQOO device in hour 0–1. Hardware surprises kill demos.

---

## 9. What we are explicitly NOT building today
Lecture transcription (Phase 2), full SSO, pgvector embeddings (tag-match instead), real push infra (in-app notifications instead), expense splitter / timetable / mess utilities beyond the one menu-scan demo, admin moderation. State these as roadmap with confidence — don't apologize for them.

---

## 10. Implementation status — as built (updated 2026-06-06)

> This section reflects what is **actually implemented and running**, which has grown past the original §1 spec. Sections 1–9 remain the product vision; the divergences below are deliberate and honest.

### Status at a glance
- **All CORE features (F1–F6) are built, wired end-to-end, and demo-ready.** Live AI calls succeed through the real provider, with the on-stage fallback in place.
- Several **bonus features** shipped on top of CORE (campus map, voice notes, oracle, points, leaderboard, live events).
- **Android APK is built** (`Quad-debug.apk`, ~8.6 MB) and installs on the iQOO device.
- Both servers run locally; the phone reaches the backend over the LAN.

### Actual stack (diverged from §0/§4/§6 — intentional)
| Area | PRD said | Built with | Why |
|---|---|---|---|
| LLM provider | Claude API (direct) | **OpenRouter** (OpenAI-compatible gateway) | One key, swappable models, cheaper |
| Vision model | "current vision model" | **`qwen/qwen2.5-vl-72b-instruct`** | Cheap, strong multilingual (Hindi+English) handwriting OCR |
| Text model (Ghost Senior, Oracle) | — | **`qwen/qwen3-235b-a22b-2507`** | Cheap + capable chat |
| Data layer | Postgres + object store | **In-memory store + local disk** (`/uploads`) | No DB setup risk; resets clean every rehearsal; runs on the laptop |
| Matching | tag overlap (no embeddings) | **tag overlap** ✅ as planned | Looks semantic, 10× faster to build |
| TTS (voice notes) | not in original PRD | **RumiK TTS** (`mulberry` model, gender-specific) | Bonus feature |
| Map | not in original PRD | **Google Maps JS API** | Bonus feature |
| App shell | Capacitor | **Capacitor 8 → Android APK** ✅ | As planned |
| Design | "campus at night" + 1 accent | **BMW-M design system** (true-black canvas, white machined type, M-tricolor accent, 0px radius) via `getdesign` | Distinctive, non-generic |

All AI calls go through the backend (keys never reach the client), return strict JSON, and parse defensively. The note-enrichment fallback (served on timeout/error so the on-stage reveal never hangs) is implemented.

### Feature checklist
| | Feature | State |
|---|---|---|
| F1 | Notes intelligence (scan → OCR + summary + key points + flashcards + tags + resources, one call) | ✅ live (Qwen-VL) |
| F2 | Ghost Senior (ask-a-note RAG, in the contributor's voice) | ✅ live, + offline keyword fallback |
| F3 | Camera reads campus (poster → event / drive; mess menu seeded) | ✅ live |
| F4 | Reverse discovery (drive → matching candidate students) | ✅ seeded + live tag-match fallback |
| F5 | Two-campus personalization + trust + compounding counter (increments live) | ✅ |
| F6 | **Proactive Campus Memory** (seeded calendar + rule engine + memory cards in feed) | ✅ — fires unprompted for the fresher |

### Bonus features built (beyond original scope)
- **Campus Oracle** — campus-wide natural-language Q&A over all accumulated posts + deadlines (`POST /oracle`). The "ask the whole campus memory" surface.
- **Campus Map** (Google Maps) — posts/activity by zone, **live student presence**, and **Campus Nudge** (send a short ping to another student on the map).
- **Voice Notes** — type → **RumiK TTS** → WAV pinned to the map at your location, **gender-specific** (female/male via the `mulberry` model + voice description + pitch). Tap a 🎙️ marker to play.
- **Quad Points + tipping** — "hearts" on useful notes (max 50/post); authors earn points; a **leaderboard** ranks contributors. This *is* the "institution's memory growing," per-contributor.
- **Live events feed** — RSVP + emoji reactions on events.

### Real API surface (as implemented)
```
GET  /health                         vision/text model + live-AI status
POST /auth/login                     {identity} -> {token, user}      [demo auth]
GET  /users                          all seeded users (identity picker)
GET  /me  ·  PATCH /me/interests     profile read / edit
GET  /feed                           ranked posts + memory_cards[] (F6) + stats
GET  /stats                          compounding counter
GET  /calendar                       seeded academic calendar (F6)
GET  /memory  ·  POST /memory/:id/ack   proactive cards / "add to calendar"
POST /contribute                     multipart image: note|poster|drive|text -> enriched post
POST /contribute/voice               {text, voice:"male"|"female"} -> RumiK WAV post
GET  /post/:id                       full post + enrichment
POST /post/:id/ask                   Ghost Senior (RAG)
POST /post/:id/verify                +1 trust
POST /post/:id/tip                   {amount} -> Quad Points to author
GET  /map  ·  GET /active-users      campus map zones / live presence
POST /nudge  ·  GET /nudges  ·  POST /nudges/read    Campus Nudge pings
GET  /voices                         voice notes for the map
GET  /events/live  ·  POST /events/:id/rsvp  ·  POST /events/:id/react
POST /drive  ·  GET /drive/:id/candidates    post drive / reverse discovery
POST /oracle                         {query} -> campus-wide answer + sources + deadlines
POST /admin/reset                    re-seed to a known state for the next rehearsal
```

### Screens built (React + Capacitor)
Onboarding · Feed (with F6 memory cards + compounding counter) · Contribute (note/poster/drive/text/voice, two-tap) · Enrichment reveal (staggered) · Note detail + Ghost Senior · Drive detail + reverse discovery · Two-campus split · Profile · **Campus Oracle** · **Campus Map** · **Live events**.

### Build & deploy status
- **Backend:** `quad/server` — Node + Express + TypeScript, in-memory store, runs on `0.0.0.0:4000`. `npm start`. Needs `OPENROUTER_API_KEY` + `RUMIK_API_KEY` in `server/.env` (both set; gitignored).
- **Frontend:** `quad/app` — Vite + React + TS + Tailwind (BMW-M tokens). `npm run dev` (browser) or built into the APK.
- **Android APK:** `Quad-debug.apk` at repo root (and `quad/app/android/app/build/outputs/apk/debug/`). Built with JDK 21 (Android Studio JBR); manifest has cleartext HTTP + CAMERA/MIC/LOCATION/INTERNET permissions.
- **GitHub:** all source pushed to `github.com/kunal2504java/iqoo` (`main`). `.env` files and the APK are not committed.

### To run the demo
1. `cd quad/server && npm start` (backend on `:4000`, with both keys in `.env`).
2. Ensure the phone + laptop are on the same Wi-Fi **and** `quad/app/src/api.ts` `API_BASE` matches the laptop's current LAN IP (currently `http://10.2.204.159:4000`). **If the IP changes, update it and rebuild the APK.**
3. Install `Quad-debug.apk` on the iQOO; grant Camera/Mic/Location on first use.
4. `POST /admin/reset` before each rehearsal for a clean counter.

### Known runtime caveats
- **Baked-in API IP** is the #1 risk: the LAN IP is compiled into the APK bundle. Change network → rebuild (or add an in-app server-URL setting — recommended next step).
- **Debug-signed APK** — fine for sideloading, not Play Store.
- **Google Maps** uses a browser JS key; if the map is blank, the key's referrer/app restrictions are the cause — the rest of the app is unaffected.
- In-memory store means **contributions reset on server restart** (intended — clean rehearsals).