// AI-4 · Poster / drive parser (image → structured event or drive). Same
// enrichment engine, different input. Degrades to the fallback parse.

import { callJSON, hasKey, type ImageInput } from "./client.js";
import { fallbackPoster, type PosterParse } from "./fallback.js";

const SYSTEM =
  "You extract a single structured campus item from a photo of a notice-board poster or company-drive flyer. " +
  "Decide if it is an EVENT (talk, fest, workshop, tryout) or a DRIVE (job/internship opportunity).";

export async function parsePoster(
  image: ImageInput,
  meta: { title?: string; desc?: string; hash?: string },
): Promise<{ parse: PosterParse; used_fallback: boolean }> {
  if (!hasKey) return { parse: fallbackPoster(meta.hash), used_fallback: true };

  const prompt =
    `Extract the campus item from this image.${meta.title ? ` Hint title: "${meta.title}".` : ""}\n\n` +
    `Return JSON:\n` +
    `{\n` +
    `  "type": "event" | "drive",\n` +
    `  "title": string,\n` +
    `  "venue": string,        // event only, else ""\n` +
    `  "start_time": string,   // event only, "YYYY-MM-DD HH:mm" if known, else ""\n` +
    `  "role": string,         // drive only, else ""\n` +
    `  "ctc": string,          // drive only, else ""\n` +
    `  "eligibility": string,  // drive only, else ""\n` +
    `  "deadline": string,     // drive only, "YYYY-MM-DD" if known, else ""\n` +
    `  "topic_tags": string[], // 2-4 tags e.g. ["placements","backend"] or ["cultural","music"]\n` +
    `  "branch_relevance": string[], // from: CSE, IT, ECE, Mechanical, Chemical\n` +
    `  "year_relevance": string[]    // subset of ["1","2","3","4"]\n` +
    `}`;

  try {
    const parse = await callJSON<PosterParse>({ system: SYSTEM, text: prompt, image, maxTokens: 1500 });
    if (parse.type !== "event" && parse.type !== "drive") parse.type = "drive";
    parse.topic_tags ??= [];
    parse.branch_relevance ??= [];
    parse.year_relevance ??= [];
    return { parse, used_fallback: false };
  } catch (e) {
    console.warn("[ai-4] poster parse failed, serving fallback:", (e as Error).message);
    return { parse: fallbackPoster(meta.hash), used_fallback: true };
  }
}
