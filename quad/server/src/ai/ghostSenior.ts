// AI-3 · Ghost Senior. The note answers questions in the contributor's voice.
// For a single note, context-stuffing IS the RAG — no vector DB needed.

import type { NoteEnrichment, User } from "../types.js";
import { callText, hasKey } from "./client.js";

export async function askGhostSenior(
  question: string,
  enrichment: NoteEnrichment,
  contributor: User,
  noteTitle: string,
): Promise<{ answer: string; used_fallback: boolean }> {
  const senior = `${contributor.name}, ${contributor.year === "alum" ? "an alum" : `a ${contributor.year}-year ${contributor.branch} student`}`;

  if (!hasKey) {
    return { answer: offlineAnswer(question, enrichment, contributor), used_fallback: true };
  }

  const system =
    `You are ${senior}, the student who wrote these notes titled "${noteTitle}", helping a junior. ` +
    `Answer ONLY from the notes below; if something isn't covered, say so plainly and suggest what to look up. ` +
    `Keep your own framing and a warm, senior-to-junior tone. Be concise (2-4 sentences). Do not invent facts.`;

  const context =
    `MY NOTES — "${noteTitle}"\n` +
    `Summary: ${enrichment.summary}\n\n` +
    `Full text:\n${enrichment.extracted_text}\n\n` +
    `Key points:\n${enrichment.key_points.map((k) => `- ${k}`).join("\n")}\n\n` +
    `Junior's question: ${question}`;

  try {
    const answer = await callText({ system, text: context, maxTokens: 600, timeoutMs: 15000 });
    return { answer: answer.trim(), used_fallback: false };
  } catch (e) {
    console.warn("[ai-3] ghost senior failed, serving fallback:", (e as Error).message);
    return { answer: offlineAnswer(question, enrichment, contributor), used_fallback: true };
  }
}

// Keyword-grounded answer so the chat still works in a no-key dry run.
function offlineAnswer(question: string, e: NoteEnrichment, contributor: User): string {
  const q = question.toLowerCase();
  const hit = e.key_points.find((k) => {
    const words = k.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    return words.some((w) => q.includes(w));
  });
  const lead = `Good question! From my notes — `;
  if (hit) return `${lead}${hit} (See the full note for the working.) — ${contributor.name}`;
  return `${lead}${e.summary} If that doesn't cover it, check the resources I linked. — ${contributor.name}`;
}
