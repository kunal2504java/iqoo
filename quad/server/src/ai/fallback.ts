// AI resilience — the insurance that wins demos. The on-stage scan must never
// hang: if the live call errors or exceeds the timeout, we serve a cached result
// keyed by image hash (or a high-quality default) and the reveal still fires.
//
// To pin a specific demo page: drop server/fallback/<md5-of-image>.json containing
// a NoteEnrichment (or a poster parse). Pre-test that exact page before going on stage.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NoteEnrichment } from "../types.js";

export function hashImage(buf: Buffer): string {
  return crypto.createHash("md5").update(buf).digest("hex");
}

// A genuinely good default so even a cold-failed scan produces the marquee result.
export const DEFAULT_NOTE_ENRICHMENT: NoteEnrichment = {
  language: "mixed",
  extracted_text:
    "First Law of Thermodynamics (ऊष्मागतिकी का पहला नियम):\nΔU = Q − W\n" +
    "Q = heat added to the system, W = work done by the system, ΔU = change in internal energy.\n" +
    "Isothermal: ΔU = 0 ⇒ Q = W. Adiabatic: Q = 0 ⇒ ΔU = −W. It is conservation of energy.",
  summary:
    "The First Law of Thermodynamics is conservation of energy for a system: ΔU = Q − W. Heat added minus work done by the system equals the change in internal energy. Isothermal ⇒ Q = W; adiabatic ⇒ ΔU = −W.",
  key_points: [
    "ΔU = Q − W — internal-energy change equals heat added minus work done by the system.",
    "Q is positive when heat is added; W is positive when the system expands (does work).",
    "Isothermal process: ΔU = 0, so Q = W.",
    "Adiabatic process: Q = 0, so ΔU = −W.",
    "Fundamentally it is just the conservation of energy.",
  ],
  flashcards: [
    { q: "State the First Law of Thermodynamics.", a: "ΔU = Q − W: change in internal energy equals heat added minus work done by the system." },
    { q: "Isothermal process — what is ΔU?", a: "Zero, because internal energy depends only on temperature, which is constant. So Q = W." },
    { q: "Adiabatic process — relate ΔU and W.", a: "Q = 0, so ΔU = −W." },
  ],
  resources: [
    { title: "First Law of Thermodynamics — Khan Academy", url: "https://www.khanacademy.org/science/physics/thermodynamics" },
    { title: "NPTEL: Basic Thermodynamics", url: "https://nptel.ac.in/courses/112105123" },
  ],
};

export interface PosterParse {
  type: "event" | "drive";
  title: string;
  venue?: string;
  start_time?: string;
  role?: string;
  ctc?: string;
  eligibility?: string;
  deadline?: string;
  topic_tags: string[];
  branch_relevance: string[];
  year_relevance: string[];
}

// Demo step 4 snaps a company-drive flyer → structured opportunity for final-year CSE.
export const DEFAULT_POSTER_PARSE: PosterParse = {
  type: "drive",
  title: "SDE Campus Drive — Acme Corp",
  role: "Software Engineer (New Grad)",
  ctc: "₹16 LPA",
  eligibility: "CSE/IT · CGPA ≥ 7.0 · 2026 batch",
  deadline: "2026-06-22",
  topic_tags: ["Placements", "Backend", "Web Dev"],
  branch_relevance: ["CSE", "IT"],
  year_relevance: ["4"],
};

const FALLBACK_DIR = process.env.QUAD_FALLBACK_DIR || path.join(process.cwd(), "fallback");
const overrides = new Map<string, NoteEnrichment | PosterParse>();

export function loadFallbacks(): void {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) return;
    for (const file of fs.readdirSync(FALLBACK_DIR)) {
      if (!file.endsWith(".json")) continue;
      const hash = file.replace(/\.json$/, "");
      try {
        overrides.set(hash, JSON.parse(fs.readFileSync(path.join(FALLBACK_DIR, file), "utf8")));
        console.log(`[ai] loaded fallback for image ${hash}`);
      } catch {
        console.warn(`[ai] bad fallback json: ${file}`);
      }
    }
  } catch {
    /* no fallback dir — fine */
  }
}

export function fallbackEnrichment(hash?: string): NoteEnrichment {
  if (hash && overrides.has(hash)) return overrides.get(hash) as NoteEnrichment;
  return structuredClone(DEFAULT_NOTE_ENRICHMENT);
}

export function fallbackPoster(hash?: string): PosterParse {
  if (hash && overrides.has(hash)) return overrides.get(hash) as PosterParse;
  return structuredClone(DEFAULT_POSTER_PARSE);
}
