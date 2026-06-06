// In-memory store. Seeded on boot (and resettable) so every rehearsal starts
// from a known state. Behind a small interface, so a real DB could slot in later.

import { buildSeed } from "./seed.js";
import type { CalendarEvent, Interaction, Post, Stats, User } from "./types.js";

class Store {
  users = new Map<string, User>();
  posts = new Map<string, Post>();
  interactions: Interaction[] = [];
  driveCandidates: Record<string, string[]> = {};
  stats: Stats = { notes: 0, drives: 0, enrichments: 0 };
  calendar: CalendarEvent[] = [];
  ackedMemories = new Set<string>(); // `${userId}:${eventId}`
  tips = new Map<string, Set<string>>(); // postId -> Set<tipperUserId>

  constructor() {
    this.reset();
  }

  reset() {
    const seed = buildSeed();
    this.users = new Map(seed.users.map((u) => [u.id, u]));
    this.posts = new Map(seed.posts.map((p) => [p.id, p]));
    this.driveCandidates = seed.driveCandidates;
    this.stats = seed.stats;
    this.calendar = seed.calendar;
    this.interactions = [];
    this.ackedMemories.clear();
  }

  // ── F6 · calendar / proactive memory ──
  getCalendar(): CalendarEvent[] {
    return this.calendar;
  }
  getEvent(id: string): CalendarEvent | undefined {
    return this.calendar.find((e) => e.id === id);
  }
  ackMemory(userId: string, eventId: string): boolean {
    if (!this.getEvent(eventId)) return false;
    this.ackedMemories.add(`${userId}:${eventId}`);
    return true;
  }
  hasAcked(userId: string, eventId: string): boolean {
    return this.ackedMemories.has(`${userId}:${eventId}`);
  }

  // ── Users ──
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }
  listUsers(): User[] {
    return [...this.users.values()];
  }
  author(id: string): User {
    return (
      this.users.get(id) ?? {
        id, name: "Unknown", role: "student", branch: "—", year: "—", interests: [], points: 0,
        lat: 28.5459, lng: 77.1926, last_active: new Date().toISOString(), created_at: new Date().toISOString(),
      }
    );
  }

  // ── Posts ──
  getPost(id: string): Post | undefined {
    return this.posts.get(id);
  }
  listPosts(): Post[] {
    return [...this.posts.values()];
  }
  addPost(post: Post) {
    this.posts.set(post.id, post);
  }
  updatePost(id: string, patch: Partial<Post>): Post | undefined {
    const p = this.posts.get(id);
    if (!p) return undefined;
    const next = { ...p, ...patch };
    this.posts.set(id, next);
    return next;
  }

  // Trust: a student vouches for a note. Idempotent per user via interactions.
  verifyPost(id: string, userId: string): Post | undefined {
    const p = this.posts.get(id);
    if (!p) return undefined;
    const already = this.interactions.some(
      (i) => i.post_id === id && i.user_id === userId && i.action === "verify",
    );
    if (!already) {
      p.trust.verified_by += 1;
      this.addInteraction({ user_id: userId, post_id: id, action: "verify", at: new Date().toISOString() });
    }
    return p;
  }

  // ── Interactions (powers "your feed adapts to what you open & contribute") ──
  addInteraction(i: Interaction) {
    this.interactions.push(i);
  }

  // ── Reverse discovery ──
  candidatesFor(driveId: string): User[] {
    const ids = this.driveCandidates[driveId] ?? [];
    return ids.map((id) => this.author(id)).filter((u) => u.id !== "Unknown");
  }

  // ── Stats (the compounding-value counter) ──
  bumpStats(kind: "note" | "drive" | "event" | "announcement" | "menu") {
    this.stats.enrichments += 1;
    if (kind === "note") this.stats.notes += 1;
    if (kind === "drive") this.stats.drives += 1;
    return this.stats;
  }

  // ── Quad Points: tip a note author (max 50 hearts per post) ──
  tipPost(postId: string, tipperId: string, amount: number): { author: User; newPoints: number; tipCount: number } | null {
    const MAX_TIPS = 50;
    const post = this.posts.get(postId);
    if (!post) return null;
    const author = this.users.get(post.author_id);
    if (!author) return null;
    if (author.id === tipperId) return null; // can't tip yourself
    if ((post.tip_count || 0) >= MAX_TIPS) return null; // cap reached
    const key = `${postId}:${tipperId}`;
    if (this.tips.has(key)) return null; // already tipped
    this.tips.set(key, new Set([tipperId]));
    post.tip_count = (post.tip_count || 0) + 1;
    author.points += amount;
    this.addInteraction({ user_id: tipperId, post_id: postId, action: "verify", at: new Date().toISOString() });
    return { author, newPoints: author.points, tipCount: post.tip_count };
  }

  // ── Campus Map: zone activity counts ──
  mapData() {
    const zones = [
      { id: "library", name: "Central Library", x: 35, y: 25, types: ["note"] },
      { id: "hostel", name: "Boys Hostel Block", x: 15, y: 60, types: ["note", "announcement"] },
      { id: "canteen", name: "Main Canteen", x: 55, y: 70, types: ["menu", "event"] },
      { id: "lab", name: "CS/IT Lab Block", x: 70, y: 30, types: ["note", "drive"] },
      { id: "ground", name: "Sports Ground", x: 25, y: 85, types: ["event"] },
      { id: "academic", name: "Academic Block", x: 50, y: 45, types: ["note", "event", "drive"] },
      { id: "gate", name: "Main Gate", x: 85, y: 80, types: ["announcement", "drive"] },
    ];
    const all = this.listPosts();
    return zones.map((z) => {
      // Count posts whose type matches this zone + add some noise based on tags
      let count = all.filter((p) => z.types.includes(p.type)).length;
      // Scale to feel realistic (some zones busier than others)
      const multiplier = z.id === "library" ? 1.8 : z.id === "canteen" ? 1.5 : z.id === "lab" ? 1.3 : 1.0;
      count = Math.round(count * multiplier);
      // Recent activity boost
      const recent = all.filter((p) => z.types.includes(p.type) && (Date.now() - new Date(p.created_at).getTime()) < 48 * 3600_000).length;
      return { ...z, count: Math.max(1, count), recent: Math.max(0, recent) };
    });
  }
}

export const store = new Store();
