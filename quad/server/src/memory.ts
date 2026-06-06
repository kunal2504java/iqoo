// F6 · Proactive Campus Memory — the rule engine. Given today's date and a user's
// branch/year/interests, surface unprompted "memory cards" for what's coming, with
// the verified notes seniors used. Rule-based on seed data today; learned over
// batches next. Reuses tag overlap + trust — no embeddings, no graph.

import { store } from "./store.js";
import { tagOverlap } from "./ranking.js";
import type { CalendarEvent, MemoryCard, MemoryEvidence, User } from "./types.js";

const HORIZON_DAYS = 21;

function daysUntil(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ev = new Date(`${dateISO}T00:00:00`);
  return Math.round((ev.getTime() - today.getTime()) / 86400_000);
}

const VERB: Record<CalendarEvent["kind"], string> = {
  registration: "closes",
  deadline: "closes",
  exam: "begins",
  drive: "opens",
  fest: "is",
};

function evidenceFor(ids: string[]): MemoryEvidence[] {
  return ids
    .map((id) => store.getPost(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => {
      const a = store.author(p.author_id);
      return {
        id: p.id, title: p.title, type: p.type,
        verified_by: p.trust.verified_by, topped_exam: p.trust.topped_exam,
        author_name: a.name, author_avatar: a.avatar,
      };
    })
    .sort((a, b) => b.verified_by + 2 * b.topped_exam - (a.verified_by + 2 * a.topped_exam))
    .slice(0, 3);
}

export function buildMemoryCards(user: User): MemoryCard[] {
  const urgencyRank = { high: 0, medium: 1, low: 2 } as const;

  const cards: (MemoryCard & { _rel: number })[] = [];
  for (const ev of store.getCalendar()) {
    const days = daysUntil(ev.date);
    if (days < 0 || days > HORIZON_DAYS) continue;

    const branchMatch = ev.branch_relevance.length === 0 || ev.branch_relevance.map((b) => b.toLowerCase()).includes(user.branch.toLowerCase());
    const yearMatch = ev.year_relevance.map(String).includes(String(user.year));
    const overlap = tagOverlap(user.interests, ev.topic_tags).count;
    if (!branchMatch && overlap === 0) continue; // not for this campus profile

    const rel = 3 * overlap + (branchMatch ? 2 : 0) + (yearMatch ? 1 : 0);
    const urgency: MemoryCard["urgency"] = days <= 4 ? "high" : days <= 8 ? "medium" : "low";
    const dayWord = days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`;
    const headline = days === 0 ? `${ev.title} is today.` : `${ev.title} ${VERB[ev.kind]} in ${dayWord}.`;

    const evidence = evidenceFor(ev.evidence_post_ids);
    const subline =
      ev.cleared_by > 0
        ? `${ev.cleared_by} seniors from ${user.branch} cleared it — here are the verified notes and the exact resources they used.`
        : evidence.length
          ? `Your campus did this last year — here's what helped most.`
          : `The campus remembers this one. Here's what's coming.`;

    cards.push({
      _rel: rel,
      id: `mem_${ev.id}`,
      event: ev,
      days_until: days,
      urgency,
      headline,
      subline,
      cta: store.hasAcked(user.id, ev.id) ? "Added to your calendar ✓" : "Add deadline to your calendar",
      senior_count: ev.cleared_by,
      evidence,
      matched: rel > 0,
    });
  }

  cards.sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency] || b._rel - a._rel || a.days_until - b.days_until);
  return cards.slice(0, 4).map(({ _rel, ...card }) => card);
}
