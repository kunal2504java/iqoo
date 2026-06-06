# CLAUDE.md — Quad build guide

You are building **Quad**, a phone-first CampusOS, for an **8-hour hackathon**. Read `PRD.md` for the full product. This file tells you *how to build it fast and not lose*.

## Prime directives

1. **The demo is the product.** Optimize every decision for the live 3-minute demo (PRD §7), not for production correctness.
2. **Working slice > broad surface.** A flawless scan→enrich→Ghost-Senior→feed loop beats six half-features. Build CORE before touching STRETCH.
3. **Fake confidently where marked `[DEMO]`.** Seed data that looks real is a feature, not a shortcut. F4 (reverse discovery) and the mess-menu are fully seeded.
4. **Always have a fallback for the live AI call.** The on-stage scan must never hang. See "AI resilience" below.
5. **De-risk hardware first.** Get the Capacitor camera working on the real iQOO device in the first hour. Nothing else matters if the camera fails on stage.
6. **Quad is Campus Memory — "the system where a college stops forgetting" — and F6 proves it, but stay honest.** Reframe existing pieces in copy (Ghost Senior = "the college remembers how to explain this"; counter = "the institution's memory growing"; feed = "your campus's accumulated memory, tuned to you"). The proactive layer (F6) is **rule-based on seed data**: frame it as *"rule-based today, learned over batches next."* Never claim a knowledge graph, embeddings, or ML we didn't build.

## Stack (do not deviate — no time to research alternatives)

- **App shell:** Capacitor, single web codebase shipped as native Android on the iQOO phone.
- **Frontend:** React + TypeScript + Tailwind. Offline cache via Capacitor Preferences/Filesystem (feed + saved notes only).
- **Native plugins:** Camera, Microphone (stub for now), Push (stub), Filesystem, Share.
- **Backend:** Single Node service, REST, stateless. Background work can be synchronous for the demo — don't build a real queue.
- **Data:** Postgres. Object storage S3-compatible (or local disk + static serve for the hackathon). Redis optional, skip if tight.
- **AI:** Claude API, vision-capable model. All enrichment calls return strict JSON.
- **NO** pgvector, **NO** microservices, **NO** real SSO, **NO** real push infra unless CORE is fully done.

## Matching = tags, not embeddings

The personalization and routing run on **tag overlap**, not vector similarity. A post has `topic_tags`, `branch_relevance`, `year_relevance` (all AI-assigned). A user has `interests`, `branch`, `year`. Feed score:

```
score = 3*tagOverlap(user.interests, post.topic_tags)
      + 2*recencyDecay(post.created_at)
      + 2*roleRelevance(user, post)
      + 1*trustScore(post)
```

This looks identical to "semantic matching" in a demo and is buildable in 20 minutes. The deck can say "semantic interest profile" — the implementation is honest tag overlap.

## AI call contract (all calls)

- System prompt ends with: **"Respond ONLY with valid JSON. No prose, no markdown, no code fences."**
- Parse defensively:
  ```ts
  function parseJSON(raw: string) {
    const clean = raw.replace(/```json|```/g, "").trim();
    try { return JSON.parse(clean); }
    catch { /* attempt to slice from first { to last } */ }
  }
  ```
- Never pass an API key from the client. All AI calls go through the Node backend.
- Temperature low for parsers (AI-1, AI-4), normal for Ghost Senior (AI-3).
- See `PRD.md §6` for the exact JSON schema of each call. Build them in this order: **AI-1 → AI-3 → AI-4 → AI-2 → AI-5**.

## AI resilience (the insurance that wins demos)

For the **on-stage scan**, you must pre-test one specific note page and cache its enrichment result keyed by image hash. If the live call exceeds ~6s or errors, serve the cached result and continue the reveal animation. The audience cannot tell. Build this in hour 2, alongside AI-1. **Do not skip this.**

Also: pre-warm the model with a throwaway call during setup so the first real call isn't cold.

## Build order (mirrors PRD §8)

1. Scaffold + tokens + schema + seed (`seed.sql` with ~12 users, ~30 posts, trust counts, drive candidates).
2. AI-1 note enrichment, end-to-end, + fallback cache. **Prove the camera on device here.**
3. Contribute (S2) + Enrichment reveal (S3) — the wow screen, with staggered reveal animation.
4. Feed + ranking (S1) + note detail (S4).
5. Ghost Senior RAG (AI-3) + poster/drive parser (AI-4).
6. Two-campus split (S6) + trust signals + compounding counter (`/stats`).
7. **Proactive Campus Memory (F6)** — seed the academic calendar + one rule engine + one memory-card type surfaced into the feed. Reuses the tag-match + trust from step 6; ~1 hour, do not let it expand. This is the thesis-proving feature; build it before final polish.
8. Reverse discovery (seed-backed) + polish + dark theme pass.
9. Rehearse on the iQOO device — end on the proactive memory card for a fresher. Cut the deck last.

## UI rules

- Read `PRD.md §3` for tokens and screens. Dark "campus at night" theme, ONE highlighter accent.
- Avoid generic AI aesthetics: no Inter/Roboto, no purple-on-white gradients. Pick a characterful display font.
- Motion budget: spend it on the **enrichment reveal** (staggered fade/slide as summary→points→flashcards→resources land). Everything else is calm.
- Two-tap contribution is sacred: FAB → action → camera → enrich. No extra screens.
- Loading states must feel alive (skeletons + progress copy), never a frozen spinner — especially S3.

## Data seeding rules

- Seed must support the **two-campus demo**: include posts that match Profile A (final-year CSE, placements) and Profile B (1st-year, clubs/sports) so their feeds visibly differ.
- Seed at least one **drive** with 6 pre-matched candidate students for reverse discovery.
- Seed trust counts so cards show "verified by 7 · topped exam: 2".
- Seed the `/stats` numbers (412 notes, 38 drives, 1,200 enrichments) — and increment them live when a new contribution is added so the counter visibly moves on stage.
- Seed the **academic calendar (F6)** with dates near "today" so a deadline is genuinely "in N days" on stage — at least one GATE/registration deadline ≤4 days out, branch-relevant to the fresher demo profile, with curated `cleared_by` and `evidence_post_ids` pointing at existing high-trust notes. The proactive card must render unprompted for the fresher.

## Definition of done (CORE)

- [ ] Camera scan works on the real iQOO device.
- [ ] Live scan → enrichment reveal fires in <20s (or fallback fires invisibly).
- [ ] Note detail → Ghost Senior answers a question from the note.
- [ ] Poster/flyer scan → structured event/drive.
- [ ] Two profiles show visibly different feeds from the same post pool.
- [ ] Trust badges + compounding counter visible; counter increments on contribute.
- [ ] Reverse-discovery candidate list renders for a drive (seed).
- [ ] 3-minute demo rehearsed end-to-end at least twice.

If all boxes are checked with time left, then and only then touch `[STRETCH]`: real push, dedup AI, mic/transcription stub, admin.

## Things that will lose the hackathon (avoid)

- Spending hour 1 on auth or a job queue instead of the camera + AI-1.
- Building embeddings/pgvector to feel "real" — it's invisible in a demo and eats hours.
- A live AI call with no fallback.
- Six features at 60% each instead of four at 100%.
- A 12-slide deck for a 3-minute pitch — show ~6, demo-first.