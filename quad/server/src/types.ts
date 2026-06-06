// Shared domain types for Quad. Kept deliberately flat — this maps 1:1 to the
// in-memory store and to the JSON the app consumes.

export type Role = "student" | "senior" | "alumni" | "admin";

export type PostType = "note" | "event" | "drive" | "announcement" | "menu";

export type PostStatus = "pending" | "enriched" | "failed";

export interface User {
  id: string;
  name: string;
  role: Role;
  branch: string; // e.g. "CSE", "ECE", "Mechanical"
  year: string; // "1".."4" or "alum"
  interests: string[]; // tag list used for matching
  avatar?: string; // emoji used as a cheap avatar
  points: number; // Quad Points — earned when others find your notes useful
  lat: number; // campus location for the map
  lng: number;
  last_active: string; // ISO timestamp
  created_at: string;
}

export interface Flashcard {
  q: string;
  a: string;
}

export interface Resource {
  title: string;
  url: string;
}

export interface NoteEnrichment {
  extracted_text: string;
  language: "mixed" | "en" | "hi";
  summary: string;
  key_points: string[];
  flashcards: Flashcard[];
  resources: Resource[];
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
  rsvp_users?: string[]; // user IDs who RSVP'd
}

export interface PostReactions {
  [emoji: string]: number;
}

export interface TrustSignals {
  verified_by: number;
  topped_exam: number;
}

export interface Post {
  id: string;
  type: PostType;
  author_id: string;
  title: string;
  description: string;
  image_url?: string;
  status: PostStatus;
  topic_tags: string[];
  branch_relevance: string[];
  year_relevance: string[];
  dedup_hash?: string;
  created_at: string;

  // Type-specific payloads (only the relevant one is populated).
  enrichment?: NoteEnrichment;
  drive?: DriveDetails;
  event?: EventDetails;
  trust: TrustSignals;
  tip_count: number; // capped at 50 — "50 hearts max"
  reactions?: PostReactions;
}

export interface Interaction {
  user_id: string;
  post_id: string;
  action: "open" | "save" | "verify" | "contribute" | "rsvp" | "react";
  meta?: string; // for react: emoji character
  at: string;
}

export interface Stats {
  notes: number;
  drives: number;
  enrichments: number;
}

// A post decorated with the author and a per-user match score, as the feed
// returns it to the client.
export interface FeedItem extends Post {
  author: User;
  score: number;
  match_reason: string;
  matched: boolean;
}

// ── F6 · Proactive Campus Memory ────────────────────────────────────────────
export type CalendarKind = "exam" | "registration" | "drive" | "fest" | "deadline";

export interface CalendarEvent {
  id: string;
  title: string;
  kind: CalendarKind;
  date: string; // ISO date — what's coming
  description: string;
  branch_relevance: string[];
  year_relevance: string[];
  topic_tags: string[];
  cleared_by: number; // curated "N seniors cleared it" (seed)
  evidence_post_ids: string[]; // verified notes/resources they used
}

export interface MemoryEvidence {
  id: string;
  title: string;
  type: PostType;
  verified_by: number;
  topped_exam: number;
  author_name: string;
  author_avatar?: string;
}

// An unprompted card the system surfaces into the feed — the proof that the
// college "remembers what's coming" and warns you before the deadline.
export interface MemoryCard {
  id: string;
  event: CalendarEvent;
  days_until: number;
  urgency: "high" | "medium" | "low";
  headline: string;
  subline: string;
  cta: string;
  senior_count: number;
  evidence: MemoryEvidence[];
  matched: boolean;
}
