import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

import { store } from "./store.js";
import { rankFeed, scorePost } from "./ranking.js";
import { buildMemoryCards } from "./memory.js";
import { enrichNote } from "./ai/enrichNote.js";
import { parsePoster } from "./ai/parsePoster.js";
import { askGhostSenior } from "./ai/ghostSenior.js";
import { findDuplicate } from "./ai/dedup.js";
import { hashImage, loadFallbacks } from "./ai/fallback.js";
import { prewarm, hasKey, VISION_MODEL, TEXT_MODEL, type ImageInput } from "./ai/client.js";
import { askOracle } from "./oracle.js";
import { synthesizeSpeech, hasRumikKey } from "./ai/rumikTts.js";
import type { Post, PostType, User } from "./types.js";

const PORT = Number(process.env.PORT || 4000);
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── helpers ────────────────────────────────────────────────────────────────
function currentUser(req: express.Request): User | undefined {
  const id = (req.header("x-user-id") || (req.query.as as string) || "").trim();
  return id ? store.getUser(id) : undefined;
}

function decorate(post: Post, viewer?: User) {
  const author = store.author(post.author_id);
  if (!viewer) return { ...post, author, score: 0, match_reason: "", matched: false };
  const { score, reason, matched } = scorePost(viewer, post);
  return { ...post, author, score, match_reason: reason, matched };
}

// How many users this post would be routed to (for the "matched to N students" toast).
function matchedCount(post: Post): number {
  return store.listUsers().filter((u) => u.role !== "admin" && scorePost(u, post).matched).length;
}

const MEDIA: Record<string, ImageInput["mediaType"]> = {
  "image/jpeg": "image/jpeg", "image/jpg": "image/jpeg", "image/png": "image/png",
  "image/webp": "image/webp", "image/gif": "image/gif",
};
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

function saveImage(file: Express.Multer.File): { url: string; image: ImageInput; hash: string } {
  const hash = hashImage(file.buffer);
  const mediaType = MEDIA[file.mimetype] ?? "image/jpeg";
  const ext = EXT[file.mimetype] ?? "jpg";
  fs.writeFileSync(path.join(UPLOAD_DIR, `${hash}.${ext}`), file.buffer);
  return { url: `/uploads/${hash}.${ext}`, image: { base64: file.buffer.toString("base64"), mediaType }, hash };
}

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ── routes ─────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, vision_model: VISION_MODEL, text_model: TEXT_MODEL, live_ai: hasKey }));

// Auth (demo): pick an identity → fake token.
app.post("/auth/login", (req, res) => {
  const { identity } = req.body ?? {};
  const user = store.getUser(identity);
  if (!user) return res.status(404).json({ error: "unknown identity" });
  res.json({ token: `tok_${user.id}`, user });
});

app.get("/users", (_req, res) => res.json(store.listUsers()));

app.get("/me", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  res.json(user);
});

app.patch("/me/interests", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const interests = Array.isArray(req.body?.interests) ? req.body.interests : user.interests;
  user.interests = interests;
  res.json(user);
});

app.get("/feed", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  res.json({
    items: rankFeed(user, store.listPosts(), (id) => store.author(id)),
    memory_cards: buildMemoryCards(user), // F6 — proactive, surfaced unprompted
    stats: store.stats,
  });
});

app.get("/stats", (_req, res) => res.json(store.stats));

// F6 · Proactive Campus Memory
app.get("/calendar", (_req, res) => res.json(store.getCalendar()));

app.get("/memory", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  res.json({ memory_cards: buildMemoryCards(user) });
});

app.post("/memory/:eventId/ack", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const ok = store.ackMemory(user.id, req.params.eventId);
  if (!ok) return res.status(404).json({ error: "unknown event" });
  res.json({ ok: true, added: true });
});

// The two-tap contribution. kind ∈ note | poster | text.
app.post("/contribute", upload.single("image"), async (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });

  const kind = (req.body?.kind || "note") as "note" | "poster" | "text";
  const title = (req.body?.title || "").trim();
  const desc = (req.body?.desc || "").trim();

  try {
    let post: Post;
    let usedFallback = false;
    let duplicateOf: string | null = null;

    if (kind === "text") {
      post = basePost("announcement", user.id, title || "Quick note", desc);
      post.topic_tags = ["Announcements"];
    } else {
      if (!req.file) return res.status(400).json({ error: "image required" });
      const { url, image, hash } = saveImage(req.file);

      if (kind === "note") {
        const r = await enrichNote(image, { title, desc, hash });
        usedFallback = r.used_fallback;
        post = basePost("note", user.id, title || r.enrichment.summary.slice(0, 48) || "Scanned note", desc || r.enrichment.summary);
        post.image_url = url;
        post.topic_tags = r.topic_tags;
        post.branch_relevance = r.branch_relevance;
        post.year_relevance = r.year_relevance;
        post.enrichment = r.enrichment;
        duplicateOf = findDuplicate({ title: post.title, topic_tags: post.topic_tags }, store.listPosts());
        if (duplicateOf) post.dedup_hash = duplicateOf;
      } else {
        const { parse, used_fallback } = await parsePoster(image, { title, desc, hash });
        usedFallback = used_fallback;
        const ptype: PostType = parse.type === "drive" ? "drive" : "event";
        post = basePost(ptype, user.id, parse.title || title || "Scanned poster", desc);
        post.image_url = url;
        post.topic_tags = parse.topic_tags;
        post.branch_relevance = parse.branch_relevance;
        post.year_relevance = parse.year_relevance;
        if (ptype === "drive") {
          post.drive = { role: parse.role || "", ctc: parse.ctc || "", eligibility: parse.eligibility || "", deadline: parse.deadline || "" };
        } else {
          post.event = { venue: parse.venue || "", start_time: parse.start_time || "", rsvp_count: 0 };
        }
      }
    }

    store.addPost(post);
    store.bumpStats(post.type);
    store.addInteraction({ user_id: user.id, post_id: post.id, action: "contribute", at: new Date().toISOString() });

    res.json({
      post: decorate(post, user),
      used_fallback: usedFallback,
      duplicate_of: duplicateOf,
      matched_count: matchedCount(post),
      stats: store.stats,
    });
  } catch (e) {
    console.error("[contribute] error:", e);
    res.status(500).json({ error: "contribution failed" });
  }
});

// ── Voice Note — text-to-speech via RumiK, pinned to map location ──
app.post("/contribute/voice", async (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });

  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "text required" });
  if (text.length > 200) return res.status(400).json({ error: "max 200 chars" });
  const gender: "male" | "female" = req.body?.voice === "male" ? "male" : "female";

  try {
    let voiceUrl = "";
    if (hasRumikKey) {
      const wav = await synthesizeSpeech(text, { gender });
      const fname = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.wav`;
      fs.writeFileSync(path.join(UPLOAD_DIR, fname), wav);
      voiceUrl = `/uploads/${fname}`;
    }

    const post: Post = {
      id: `p_voice_${Date.now()}`,
      type: "voice",
      author_id: user.id,
      title: "🎙️ Voice Note",
      description: text,
      voice_url: voiceUrl,
      voice_gender: gender,
      status: "enriched",
      topic_tags: ["Voice"],
      branch_relevance: [user.branch],
      year_relevance: [user.year],
      created_at: new Date().toISOString(),
      trust: { verified_by: 0, topped_exam: 0 },
      tip_count: 0,
      lat: user.lat,
      lng: user.lng,
    };

    store.addPost(post);
    store.bumpStats("note");
    store.addInteraction({ user_id: user.id, post_id: post.id, action: "contribute", at: new Date().toISOString() });

    res.json({
      post: decorate(post, user),
      used_fallback: !hasRumikKey,
      matched_count: matchedCount(post),
      stats: store.stats,
    });
  } catch (e) {
    console.error("[voice] error:", e);
    res.status(500).json({ error: "voice synthesis failed" });
  }
});

app.get("/post/:id", (req, res) => {
  const post = store.getPost(req.params.id);
  if (!post) return res.status(404).json({ error: "not found" });
  const viewer = currentUser(req);
  if (viewer) store.addInteraction({ user_id: viewer.id, post_id: post.id, action: "open", at: new Date().toISOString() });
  res.json(decorate(post, viewer));
});

// Ghost Senior — ask a note a question.
app.post("/post/:id/ask", async (req, res) => {
  const post = store.getPost(req.params.id);
  if (!post || post.type !== "note" || !post.enrichment) return res.status(400).json({ error: "not an enriched note" });
  const question = (req.body?.question || "").trim();
  if (!question) return res.status(400).json({ error: "question required" });
  const { answer, used_fallback } = await askGhostSenior(question, post.enrichment, store.author(post.author_id), post.title);
  res.json({ answer, used_fallback, contributor: store.author(post.author_id) });
});

app.post("/post/:id/verify", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const post = store.verifyPost(req.params.id, user.id);
  if (!post) return res.status(404).json({ error: "not found" });
  res.json({ trust: post.trust });
});

// Quad Points — gift points to a note author when you find it useful.
app.post("/post/:id/tip", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const amount = Math.min(100, Math.max(1, Number(req.body?.amount) || 10));
  const result = store.tipPost(req.params.id, user.id, amount);
  if (!result) return res.status(400).json({ error: "cannot tip" });
  res.json({ ok: true, amount, author: result.author, new_points: result.newPoints, tip_count: result.tipCount, max_tips: 50 });
});

// Campus Map — zone activity heatmap.
app.get("/map", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  res.json({ zones: store.mapData() });
});

// Leaderboard — top contributors by Quad Points.
app.get("/leaderboard", (_req, res) => {
  const top = store.listUsers()
    .filter((u) => u.role !== "admin")
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
  res.json({ users: top });
});

// Active users on the campus map (users active in last 24h).
app.get("/active-users", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const cutoff = Date.now() - 24 * 3600_000;
  const active = store.listUsers()
    .filter((u) => u.id !== "u_office" && new Date(u.last_active).getTime() > cutoff)
    .map((u) => ({
      id: u.id, name: u.name, role: u.role, branch: u.branch, year: u.year,
      avatar: u.avatar, points: u.points, lat: u.lat, lng: u.lng, last_active: u.last_active,
    }));
  res.json({ users: active, me: user.id });
});

// ── Campus Nudge — short friendly pings between map users ──
app.post("/nudge", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const { to_id, text } = req.body ?? {};
  if (!to_id || typeof text !== "string") return res.status(400).json({ error: "to_id and text required" });
  const to = store.getUser(to_id);
  if (!to) return res.status(404).json({ error: "user not found" });
  if (to.id === user.id) return res.status(400).json({ error: "can't nudge yourself" });
  const clean = text.trim().slice(0, 60);
  if (!clean) return res.status(400).json({ error: "text empty" });
  const nudge = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    from_id: user.id,
    to_id: to.id,
    text: clean,
    read: false,
    created_at: new Date().toISOString(),
  };
  store.addNudge(nudge);
  res.json({ ok: true, nudge });
});

app.get("/nudges", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const nudges = store.nudgesFor(user.id).map((n) => {
    const from = store.author(n.from_id);
    return { ...n, from_name: from.name, from_avatar: from.avatar, from_role: from.role };
  });
  res.json({ nudges, unread_count: store.unreadNudgeCount(user.id) });
});

app.post("/nudges/read", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  store.markNudgesRead(user.id);
  res.json({ ok: true });
});

// ── Campus Live Events Feed ──
app.get("/voices", (req, res) => {
  const user = currentUser(req);
  const voices = store.listPosts()
    .filter((p) => p.type === "voice")
    .map((p) => decorate(p, user))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ voices });
});

app.get("/events/live", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const events = store.listPosts()
    .filter((p) => p.type === "event" && p.event)
    .map((p) => decorate(p, user))
    .sort((a, b) => {
      // Sort by start time proximity to now
      const aDiff = Math.abs(new Date(a.event!.start_time).getTime() - Date.now());
      const bDiff = Math.abs(new Date(b.event!.start_time).getTime() - Date.now());
      return aDiff - bDiff;
    });
  res.json({ events });
});

app.post("/events/:id/rsvp", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const post = store.getPost(req.params.id);
  if (!post || post.type !== "event" || !post.event) return res.status(404).json({ error: "not an event" });
  const already = store.interactions.some((i) => i.post_id === post.id && i.user_id === user.id && i.action === "rsvp");
  if (!already) {
    post.event.rsvp_count += 1;
    post.event.rsvp_users = [...(post.event.rsvp_users || []), user.id];
    store.addInteraction({ user_id: user.id, post_id: post.id, action: "rsvp", at: new Date().toISOString() });
  }
  res.json({ ok: true, rsvp_count: post.event.rsvp_count, rsvp_users: post.event.rsvp_users });
});

app.post("/events/:id/react", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const post = store.getPost(req.params.id);
  if (!post || post.type !== "event") return res.status(404).json({ error: "not an event" });
  const emoji = (req.body?.emoji || "🔥").trim();
  if (!post.reactions) post.reactions = {};
  post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
  store.addInteraction({ user_id: user.id, post_id: post.id, action: "react", meta: emoji, at: new Date().toISOString() });
  res.json({ ok: true, reactions: post.reactions });
});

// Post a drive from a structured form (no image).
app.post("/drive", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const { role, ctc, eligibility, deadline, title, tags, branch_relevance, year_relevance } = req.body ?? {};
  const post = basePost("drive", user.id, title || `${role} — Campus Drive`, `${role} · ${ctc}`);
  post.drive = { role: role || "", ctc: ctc || "", eligibility: eligibility || "", deadline: deadline || "" };
  post.topic_tags = Array.isArray(tags) && tags.length ? tags : ["Placements"];
  post.branch_relevance = Array.isArray(branch_relevance) ? branch_relevance : ["CSE", "IT"];
  post.year_relevance = Array.isArray(year_relevance) ? year_relevance : ["4"];
  store.addPost(post);
  store.bumpStats("drive");
  res.json({ post: decorate(post, user), matched_count: matchedCount(post), stats: store.stats });
});

// Reverse discovery — students whose interests/contributions match the drive.
app.get("/drive/:id/candidates", (req, res) => {
  const post = store.getPost(req.params.id);
  if (!post || post.type !== "drive") return res.status(404).json({ error: "not a drive" });
  let candidates = store.candidatesFor(post.id);
  // Seeded list for the demo drives; otherwise compute live by tag overlap.
  if (candidates.length === 0) {
    candidates = store
      .listUsers()
      .filter((u) => u.role !== "admin" && u.role !== "alumni")
      .map((u) => ({ u, s: scorePost(u, post) }))
      .filter((x) => x.s.matched)
      .sort((a, b) => b.s.score - a.s.score)
      .slice(0, 6)
      .map((x) => x.u);
  }
  res.json({
    drive: decorate(post),
    candidates: candidates.map((u) => ({
      ...u,
      match_reason: scorePost(u, post).reason,
    })),
  });
});

// Campus Oracle — ask the entire campus anything.
app.post("/oracle", async (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "no user" });
  const query = (req.body?.query || "").trim();
  if (!query) return res.status(400).json({ error: "query required" });
  try {
    const result = await askOracle(query, user);
    res.json(result);
  } catch (e) {
    console.error("[oracle] error:", e);
    res.status(500).json({ error: "oracle failed" });
  }
});

app.post("/admin/reset", (_req, res) => {
  store.reset();
  res.json({ ok: true, stats: store.stats });
});

function basePost(type: PostType, authorId: string, title: string, description: string): Post {
  return {
    id: newId("p"), type, author_id: authorId, title, description,
    status: "enriched", topic_tags: [], branch_relevance: [], year_relevance: [],
    created_at: new Date().toISOString(), trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0,
  };
}

// ── boot ──────────────────────────────────────────────────────────────────
loadFallbacks();
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Quad API → http://0.0.0.0:${PORT}  (live AI: ${hasKey ? "on" : "off — fallback mode"})`);
  console.log(`  Models → vision: ${VISION_MODEL} · text: ${TEXT_MODEL}`);
  console.log(`  Seeded: ${store.listUsers().length} users · ${store.listPosts().length} posts · stats ${JSON.stringify(store.stats)}\n`);
  prewarm();
});
