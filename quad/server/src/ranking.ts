// Feed ranking. "Semantic interest profile" in the deck — honest tag overlap here.
//   score = 3*tagOverlap + 2*recencyDecay + 2*roleRelevance + 1*trustScore
// This produces visibly different feeds for two profiles over the same post pool.

import type { Post, User, FeedItem } from "./types.js";

// Normalize so AI kebab-case tags ("first-law") match spaced interests ("First Law").
const lc = (s: string) => s.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

export function tagOverlap(a: string[], b: string[]): { count: number; shared: string[] } {
  const set = new Set(a.map(lc));
  const shared = b.filter((t) => set.has(lc(t)));
  return { count: shared.length, shared };
}

// 1 at age 0, decays smoothly over a couple of days.
export function recencyDecay(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600_000;
  return Math.exp(-Math.max(0, ageHours) / 48);
}

// 0.5 for a branch match + 0.5 for a year match. Empty relevance = applies to all.
export function roleRelevance(user: User, post: Post): number {
  const branchOk = post.branch_relevance.length === 0 || post.branch_relevance.map(lc).includes(lc(user.branch));
  const yearOk = post.year_relevance.length === 0 || post.year_relevance.map(lc).includes(lc(user.year));
  return (branchOk ? 0.5 : 0) + (yearOk ? 0.5 : 0);
}

export function trustScore(post: Post): number {
  const raw = post.trust.verified_by + 2 * post.trust.topped_exam;
  return Math.min(1, raw / 20);
}

export function scorePost(user: User, post: Post): { score: number; reason: string; matched: boolean } {
  const { count, shared } = tagOverlap(user.interests, post.topic_tags);
  const recency = recencyDecay(post.created_at);
  const role = roleRelevance(user, post);
  const trust = trustScore(post);

  const score = 3 * count + 2 * recency + 2 * role + 1 * trust;

  // Human-readable "why you're seeing this".
  const bits: string[] = [];
  if (shared.length) bits.push(`Matches ${shared.slice(0, 2).join(", ")}`);
  const branchOk = post.branch_relevance.length === 0 || post.branch_relevance.map(lc).includes(lc(user.branch));
  const yearOk = post.year_relevance.length > 0 && post.year_relevance.map(lc).includes(lc(user.year));
  if (yearOk && branchOk && post.year_relevance.length < 4) {
    const yr = user.year === "4" ? "final-year" : user.year === "1" ? "first-year" : `year ${user.year}`;
    bits.push(`${yr} ${user.branch}`);
  }
  if (post.trust.verified_by >= 8) bits.push(`trusted (${post.trust.verified_by} verified)`);

  const matched = count > 0 || (role >= 1 && post.year_relevance.length > 0 && post.year_relevance.length < 5);
  return { score, reason: bits.join(" · ") || "On your campus", matched };
}

export function rankFeed(user: User, posts: Post[], author: (id: string) => User): FeedItem[] {
  return posts
    .map((p) => {
      const { score, reason, matched } = scorePost(user, p);
      return { ...p, author: author(p.author_id), score, match_reason: reason, matched };
    })
    .sort((a, b) => b.score - a.score);
}
