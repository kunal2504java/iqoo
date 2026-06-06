// Campus Oracle — ask the entire campus anything. It searches every note, drive,
// event, and calendar deadline using the existing tag-matching + trust scoring,
// then synthesizes a single answer via AI. No vector DB needed.

import { store } from "./store.js";
import { scorePost, tagOverlap } from "./ranking.js";
import { callText, hasKey } from "./ai/client.js";
import type { Post, User, CalendarEvent } from "./types.js";

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
}

function postTokens(p: Post): Set<string> {
  const tokens = new Set<string>();
  tokenize(p.title).forEach((t) => tokens.add(t));
  tokenize(p.description).forEach((t) => tokens.add(t));
  p.topic_tags.forEach((tag) => tokenize(tag).forEach((t) => tokens.add(t)));
  if (p.enrichment) {
    tokenize(p.enrichment.summary).forEach((t) => tokens.add(t));
    p.enrichment.key_points.forEach((kp) => tokenize(kp).forEach((t) => tokens.add(t)));
  }
  if (p.drive) {
    tokenize(p.drive.role).forEach((t) => tokens.add(t));
    tokenize(p.drive.eligibility).forEach((t) => tokens.add(t));
  }
  if (p.event) {
    tokenize(p.event.venue).forEach((t) => tokens.add(t));
  }
  return tokens;
}

function calTokens(c: CalendarEvent): Set<string> {
  const tokens = new Set<string>();
  tokenize(c.title).forEach((t) => tokens.add(t));
  tokenize(c.description).forEach((t) => tokens.add(t));
  c.topic_tags.forEach((tag) => tokenize(tag).forEach((t) => tokens.add(t)));
  return tokens;
}

function daysUntil(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ev = new Date(`${dateISO}T00:00:00`);
  return Math.round((ev.getTime() - today.getTime()) / 86400_000);
}

export interface OracleSource {
  post: Post;
  author: User;
  score: number;
  match_reason: string;
}

export interface OracleResult {
  query: string;
  answer: string;
  used_fallback: boolean;
  sources: OracleSource[];
  deadlines: (CalendarEvent & { days_until: number })[];
}

export async function askOracle(query: string, user: User): Promise<OracleResult> {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) {
    return { query, answer: "Ask me anything about your campus — notes, drives, deadlines, or subjects.", used_fallback: true, sources: [], deadlines: [] };
  }

  // 1. Search posts
  const posts = store.listPosts();
  const scoredPosts = posts
    .map((p) => {
      const pt = postTokens(p);
      const overlap = qTokens.filter((t) => pt.has(t)).length;
      const trust = p.trust.verified_by + 2 * p.trust.topped_exam;
      const score = overlap * 3 + trust * 0.5 + (p.enrichment ? 1 : 0);
      const { reason } = scorePost(user, p);
      return { post: p, score, match_reason: reason };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // 2. Search calendar
  const calendar = store.getCalendar();
  const scoredCal = calendar
    .map((c) => {
      const ct = calTokens(c);
      const overlap = qTokens.filter((t) => ct.has(t)).length;
      return { event: c, overlap };
    })
    .filter((s) => s.overlap > 0)
    .map((s) => ({ ...s.event, days_until: daysUntil(s.event.date) }))
    .slice(0, 2);

  // 3. Build context
  const contextParts: string[] = [];

  for (const s of scoredPosts) {
    const a = store.author(s.post.author_id);
    const lines: string[] = [
      `SOURCE: "${s.post.title}" by ${a.name} (${a.branch}, Year ${a.year}) — ${a.role}`,
    ];
    if (s.post.enrichment) {
      lines.push(`Summary: ${s.post.enrichment.summary}`);
      if (s.post.enrichment.key_points.length) {
        lines.push(`Key points: ${s.post.enrichment.key_points.slice(0, 3).join("; ")}`);
      }
    } else if (s.post.description) {
      lines.push(`Description: ${s.post.description}`);
    }
    if (s.post.drive) {
      lines.push(`Drive: ${s.post.drive.role} · ${s.post.drive.ctc} · deadline ${s.post.drive.deadline}`);
    }
    if (s.post.event) {
      lines.push(`Event: at ${s.post.event.venue} · ${s.post.event.start_time}`);
    }
    lines.push(`Trust: verified by ${s.post.trust.verified_by} students · topped exam: ${s.post.trust.topped_exam}`);
    contextParts.push(lines.join("\n"));
  }

  for (const c of scoredCal) {
    contextParts.push(`CALENDAR: "${c.title}" — ${c.days_until <= 0 ? "today" : `in ${c.days_until} days`} (${c.date}). ${c.description} (${c.cleared_by} seniors from your branch cleared it)`);
  }

  const context = contextParts.join("\n\n---\n\n");

  // 4. AI synthesis
  const system =
    `You are the Campus Oracle — the accumulated memory of the college speaking as one voice. ` +
    `A student asked: "${query}". ` +
    `Synthesize a concise, helpful answer (2-5 sentences) using ONLY the verified campus sources below. ` +
    `Cite specific seniors by name when possible. If the query is about a deadline, mention days remaining. ` +
    `If the query asks for a list, format it as a short bulleted list. ` +
    `If the sources don't cover the question, say so plainly and suggest what to look up. ` +
    `Never invent facts not in the sources. Keep a warm, senior-to-junior tone.`;

  let answer = "";
  let usedFallback = false;

  if (hasKey && contextParts.length > 0) {
    try {
      answer = (await callText({ system, text: context, maxTokens: 500, timeoutMs: 12000 })).trim();
    } catch (e) {
      console.warn("[oracle] AI synthesis failed:", (e as Error).message);
      usedFallback = true;
    }
  }

  if (!answer) {
    usedFallback = true;
    // Assemble fallback from top source
    if (scoredPosts.length > 0) {
      const top = scoredPosts[0];
      const a = store.author(top.post.author_id);
      const summary = top.post.enrichment?.summary || top.post.description || top.post.title;
      answer = `From ${a.name}'s verified note: ${summary}`;
      if (scoredCal.length > 0) {
        const c = scoredCal[0];
        answer += ` Also: "${c.title}" is ${c.days_until <= 0 ? "today" : `in ${c.days_until} days`}.`;
      }
    } else if (scoredCal.length > 0) {
      const c = scoredCal[0];
      answer = `"${c.title}" is ${c.days_until <= 0 ? "today" : `in ${c.days_until} days`}. ${c.description}`;
    } else {
      answer = "The campus memory doesn't have a clear answer for that yet. Try contributing a note on this topic!";
    }
  }

  const sources: OracleSource[] = scoredPosts.map((s) => ({
    post: s.post,
    author: store.author(s.post.author_id),
    score: s.score,
    match_reason: s.match_reason,
  }));

  return { query, answer, used_fallback: usedFallback, sources, deadlines: scoredCal };
}
