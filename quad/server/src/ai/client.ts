// Single entry point for every model call. All AI goes through the backend via
// OpenRouter (OpenAI-compatible API) — the key never reaches the client. We force
// JSON via the system prompt + defensive parsing (per CLAUDE.md) rather than rely
// on any one model's structured-output support, so it's portable across OpenRouter
// models. Swap the model with OPENROUTER_MODEL.

import OpenAI from "openai";

// Vision model handles the note/poster scan (needs to "see" the image + OCR
// Hindi/English). Text model handles Ghost Senior chat. Both swappable via env.
export const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || process.env.OPENROUTER_MODEL || "qwen/qwen2.5-vl-72b-instruct";
export const TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL || "qwen/qwen3-235b-a22b-2507";
export const MODEL = VISION_MODEL; // back-compat alias for logging
export const AI_TIMEOUT_MS = Number(process.env.QUAD_AI_TIMEOUT_MS || 18000);

const API_KEY = process.env.OPENROUTER_API_KEY || "";
export const hasKey = Boolean(API_KEY);

const client = hasKey
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: API_KEY,
      defaultHeaders: { "HTTP-Referer": "https://quad.campus", "X-Title": "Quad CampusOS" },
    })
  : null;

export const JSON_GUARD = "Respond ONLY with valid JSON. No prose, no markdown, no code fences.";

export interface ImageInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

// Defensive parse — strips fences, then falls back to slicing first { … last }.
export function parseJSON<T = any>(raw: string): T {
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as T;
  } catch {
    const first = clean.indexOf("{");
    const last = clean.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(clean.slice(first, last + 1)) as T;
    }
    throw new Error("Could not parse JSON from model output");
  }
}

function userContent(text: string, image?: ImageInput): OpenAI.Chat.ChatCompletionUserMessageParam["content"] {
  if (!image) return text;
  return [
    { type: "image_url", image_url: { url: `data:${image.mediaType};base64,${image.base64}` } },
    { type: "text", text },
  ];
}

interface CallOpts {
  system: string;
  text: string;
  image?: ImageInput;
  maxTokens?: number;
  timeoutMs?: number;
  model?: string;
}

// Returns raw assistant text. Throws if no key or on API error/timeout.
export async function callText({ system, text, image, maxTokens = 2048, timeoutMs = AI_TIMEOUT_MS, model }: CallOpts): Promise<string> {
  if (!client) throw new Error("No OPENROUTER_API_KEY configured");
  const res = await client.chat.completions.create(
    {
      model: model || (image ? VISION_MODEL : TEXT_MODEL),
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent(text, image) },
      ],
    },
    { timeout: timeoutMs, maxRetries: 1 },
  );
  return res.choices[0]?.message?.content ?? "";
}

// callText + defensive JSON parse. System prompt gets the JSON guard appended.
export async function callJSON<T = any>(opts: CallOpts): Promise<T> {
  const raw = await callText({ ...opts, system: `${opts.system}\n\n${JSON_GUARD}` });
  return parseJSON<T>(raw);
}

// Fire-and-forget warm-up so the first real on-stage call isn't cold.
export async function prewarm(): Promise<void> {
  if (!client) return;
  try {
    await client.chat.completions.create(
      { model: TEXT_MODEL, max_tokens: 8, messages: [{ role: "user", content: "ping" }] },
      { timeout: 20000, maxRetries: 0 },
    );
    console.log(`[ai] pre-warmed via OpenRouter (vision: ${VISION_MODEL}, text: ${TEXT_MODEL})`);
  } catch (e) {
    console.warn("[ai] pre-warm skipped:", (e as Error).message);
  }
}
