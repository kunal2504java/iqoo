// AI-1 · Note enrichment (image → everything). One vision call does OCR +
// summary + key points + flashcards + tags + resources. Always returns a valid
// result: on missing key / error / timeout it serves the hash-keyed fallback.

import type { NoteEnrichment } from "../types.js";
import { callJSON, hasKey, type ImageInput } from "./client.js";
import { fallbackEnrichment } from "./fallback.js";

export interface NoteAIResult {
  enrichment: NoteEnrichment;
  topic_tags: string[];
  branch_relevance: string[];
  year_relevance: string[];
  used_fallback: boolean;
}

const SYSTEM =
  "You are Quad's note-enrichment engine. You receive a photo of student notes that may mix " +
  "Hindi and English, handwriting and print. Extract the text faithfully (keep Hindi in Devanagari " +
  "where written), then produce concise study aids that a junior could revise from. Be accurate and tight.";

const FALLBACK_TAGS = {
  topic_tags: ["Thermodynamics", "First Law", "GATE", "Core Mechanical"],
  branch_relevance: ["Mechanical", "Chemical"],
  year_relevance: ["2", "3"],
};

interface RawNoteJSON {
  extracted_text: string;
  language?: "mixed" | "en" | "hi";
  summary: string;
  key_points: string[];
  flashcards: { q: string; a: string }[];
  resources?: { title: string; url: string }[];
  topic_tags: string[];
  branch_relevance: string[];
  year_relevance: string[];
}

export async function enrichNote(
  image: ImageInput,
  meta: { title?: string; desc?: string; hash?: string },
): Promise<NoteAIResult> {
  if (!hasKey) {
    return { enrichment: fallbackEnrichment(meta.hash), ...FALLBACK_TAGS, used_fallback: true };
  }

  const prompt =
    `Enrich these student notes.${meta.title ? ` The student titled them: "${meta.title}".` : ""}` +
    `${meta.desc ? ` Note: "${meta.desc}".` : ""}\n\n` +
    `Return JSON with exactly these keys:\n` +
    `{\n` +
    `  "extracted_text": string,            // faithful OCR, keep line breaks\n` +
    `  "language": "mixed" | "en" | "hi",\n` +
    `  "summary": string,                   // 2-3 tight sentences\n` +
    `  "key_points": string[],              // 3-6 bullets\n` +
    `  "flashcards": [{"q": string, "a": string}],  // 3-5 cards\n` +
    `  "resources": [{"title": string, "url": string}], // 2 real, relevant links\n` +
    `  "topic_tags": string[],              // 2-5 lowercase-ish topic tags e.g. ["thermodynamics","first-law"]\n` +
    `  "branch_relevance": string[],        // from: CSE, IT, ECE, Mechanical, Chemical\n` +
    `  "year_relevance": string[]           // subset of ["1","2","3","4"]\n` +
    `}`;

  try {
    const raw = await callJSON<RawNoteJSON>({ system: SYSTEM, text: prompt, image, maxTokens: 4096 });
    const enrichment: NoteEnrichment = {
      extracted_text: raw.extracted_text ?? "",
      language: raw.language ?? "mixed",
      summary: raw.summary ?? "",
      key_points: raw.key_points ?? [],
      flashcards: raw.flashcards ?? [],
      resources: raw.resources ?? [],
    };
    return {
      enrichment,
      topic_tags: raw.topic_tags?.length ? raw.topic_tags : FALLBACK_TAGS.topic_tags,
      branch_relevance: raw.branch_relevance?.length ? raw.branch_relevance : FALLBACK_TAGS.branch_relevance,
      year_relevance: raw.year_relevance?.length ? raw.year_relevance : FALLBACK_TAGS.year_relevance,
      used_fallback: false,
    };
  } catch (e) {
    console.warn("[ai-1] live enrichment failed, serving fallback:", (e as Error).message);
    return { enrichment: fallbackEnrichment(meta.hash), ...FALLBACK_TAGS, used_fallback: true };
  }
}
