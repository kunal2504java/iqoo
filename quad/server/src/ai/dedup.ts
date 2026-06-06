// AI-5 · Dedup (cheap version). Normalized token overlap on title + tags against
// existing notes. Enough to show "Quad merged N near-identical notes" — no model call.

import type { Post } from "../types.js";

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const sig = (p: { title: string; topic_tags: string[] }) =>
  new Set([...normalize(p.title), ...p.topic_tags.flatMap(normalize)]);

// Returns the id of an existing near-duplicate note, or null. Threshold tuned to
// fire on genuinely similar topics without false-merging distinct notes.
export function findDuplicate(candidate: { title: string; topic_tags: string[] }, existing: Post[]): string | null {
  const cs = sig(candidate);
  let best: { id: string; score: number } | null = null;
  for (const p of existing) {
    if (p.type !== "note") continue;
    const score = jaccard(cs, sig(p));
    if (score >= 0.5 && (!best || score > best.score)) best = { id: p.id, score };
  }
  return best?.id ?? null;
}
