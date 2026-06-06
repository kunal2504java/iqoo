// API client for Quad. Hardcoded to laptop LAN IP for hackathon demo.
export const API_BASE = "http://10.2.204.159:4000";

export function imageUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export interface User {
  id: string;
  name: string;
  role: "student" | "senior" | "alumni" | "admin";
  branch: string;
  year: string;
  interests: string[];
  avatar?: string;
  points: number;
  lat: number;
  lng: number;
  last_active: string;
}

export interface TrustSignals {
  verified_by: number;
  topped_exam: number;
}

export interface Post {
  id: string;
  type: "note" | "event" | "drive" | "announcement" | "menu" | "voice";
  author_id: string;
  title: string;
  description: string;
  image_url?: string;
  voice_url?: string;
  voice_gender?: "male" | "female";
  status: string;
  topic_tags: string[];
  branch_relevance: string[];
  year_relevance: string[];
  dedup_hash?: string;
  created_at: string;
  trust: TrustSignals;
  tip_count: number;
  reactions?: Record<string, number>;
  enrichment?: NoteEnrichment;
  drive?: DriveDetails;
  event?: EventDetails;
  lat?: number;
  lng?: number;
  // decorated fields from feed
  author?: User;
  score?: number;
  match_reason?: string;
  matched?: boolean;
}

export interface NoteEnrichment {
  extracted_text: string;
  language: "mixed" | "en" | "hi";
  summary: string;
  key_points: string[];
  flashcards: { q: string; a: string }[];
  resources: { title: string; url: string }[];
}

export interface DriveDetails {
  role: string;
  ctc: string;
  eligibility: string;
  deadline: string;
}

export interface EventDetails {
  venue: string;
  start_time: string;
  rsvp_count: number;
  rsvp_users?: string[];
}

export interface Stats {
  notes: number;
  drives: number;
  enrichments: number;
}

export interface MemoryCard {
  id: string;
  event: {
    id: string;
    title: string;
    kind: string;
    date: string;
    description: string;
    branch_relevance: string[];
    year_relevance: string[];
    topic_tags: string[];
    cleared_by: number;
    evidence_post_ids: string[];
  };
  days_until: number;
  urgency: "high" | "medium" | "low";
  headline: string;
  subline: string;
  cta: string;
  senior_count: number;
  evidence: {
    id: string;
    title: string;
    type: string;
    verified_by: number;
    topped_exam: number;
    author_name: string;
    author_avatar?: string;
  }[];
  matched: boolean;
}

export interface FeedResponse {
  items: Post[];
  memory_cards: MemoryCard[];
  stats: Stats;
}

function getUserId(): string | null {
  return localStorage.getItem("quad_user_id");
}

async function fetchJSON<T>(path: string, opts?: RequestInit): Promise<T> {
  const uid = getUserId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(uid ? { "x-user-id": uid } : {}),
      ...(opts?.headers || {}),
    } as HeadersInit,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => fetchJSON<{ ok: boolean }>("/health"),

  login: (identity: string) =>
    fetchJSON<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity }),
    }),

  me: () => fetchJSON<User>("/me"),

  updateInterests: (interests: string[]) =>
    fetchJSON<User>("/me/interests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests }),
    }),

  feed: () => fetchJSON<FeedResponse>("/feed"),

  stats: () => fetchJSON<Stats>("/stats"),

  postDetail: (id: string) => fetchJSON<Post>(`/post/${id}`),

  askGhostSenior: (postId: string, question: string) =>
    fetchJSON<{ answer: string; used_fallback: boolean; contributor?: User }>(
      `/post/${postId}/ask`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      }
    ),

  verifyPost: (postId: string) =>
    fetchJSON<{ trust: TrustSignals }>(`/post/${postId}/verify`, {
      method: "POST",
    }),

  contribute: (form: FormData) =>
    fetchJSON<{
      post: Post;
      used_fallback: boolean;
      duplicate_of?: string | null;
      matched_count: number;
      stats: Stats;
    }>("/contribute", {
      method: "POST",
      body: form,
    }),

  driveDetail: (id: string) => fetchJSON<Post>(`/post/${id}`),

  driveCandidates: (id: string) =>
    fetchJSON<{ drive: Post; candidates: (User & { match_reason?: string })[] }>(
      `/drive/${id}/candidates`
    ),

  postDrive: (body: {
    role: string;
    ctc: string;
    eligibility: string;
    deadline: string;
    title?: string;
    tags?: string[];
    branch_relevance?: string[];
    year_relevance?: string[];
  }) =>
    fetchJSON<{ post: Post; matched_count: number; stats: Stats }>("/drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  ackMemory: (eventId: string) =>
    fetchJSON<{ ok: boolean }>(`/memory/${eventId}/ack`, { method: "POST" }),

  askOracle: (query: string) =>
    fetchJSON<{
      query: string;
      answer: string;
      used_fallback: boolean;
      sources: { post: Post; author: User; score: number; match_reason: string }[];
      deadlines: { id: string; title: string; kind: string; date: string; description: string; cleared_by: number; days_until: number }[];
    }>("/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }),

  tipPost: (postId: string, amount: number) =>
    fetchJSON<{ ok: boolean; amount: number; author: User; new_points: number; tip_count: number; max_tips: number }>(`/post/${postId}/tip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }),

  getMap: () => fetchJSON<{ zones: { id: string; name: string; x: number; y: number; count: number; recent: number }[] }>("/map"),

  getLeaderboard: () => fetchJSON<{ users: User[] }>("/leaderboard"),

  getActiveUsers: () => fetchJSON<{ users: User[]; me: string }>("/active-users"),

  liveEvents: () => fetchJSON<{ events: Post[] }>("/events/live"),

  getVoices: () => fetchJSON<{ voices: Post[] }>("/voices"),

  rsvpEvent: (eventId: string) =>
    fetchJSON<{ ok: boolean; rsvp_count: number; rsvp_users: string[] }>(`/events/${eventId}/rsvp`, {
      method: "POST",
    }),

  reactEvent: (eventId: string, emoji: string) =>
    fetchJSON<{ ok: boolean; reactions: Record<string, number> }>(`/events/${eventId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    }),

  // ── Voice Note — RumiK TTS (gender-specific via mulberry) ──
  contributeVoice: (text: string, voice: "male" | "female" = "female") =>
    fetchJSON<{ post: Post; used_fallback: boolean; matched_count: number; stats: Stats }>("/contribute/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    }),

  // ── Campus Nudge — map pings ──
  nudgeUser: (to_id: string, text: string) =>
    fetchJSON<{ ok: boolean; nudge: { id: string; from_id: string; to_id: string; text: string; created_at: string } }>("/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_id, text }),
    }),

  getNudges: () =>
    fetchJSON<{ nudges: { id: string; from_id: string; from_name: string; from_avatar?: string; from_role: string; text: string; read: boolean; created_at: string }[]; unread_count: number }>("/nudges"),

  markNudgesRead: () =>
    fetchJSON<{ ok: boolean }>("/nudges/read", { method: "POST" }),

  reset: () => fetchJSON<{ ok: boolean }>("/admin/reset", { method: "POST" }),
};
