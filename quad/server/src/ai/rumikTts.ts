// RumiK TTS client — Text-to-Speech for campus voice notes.
// https://playground.rumik.ai/docs  →  POST https://silk-api.rumik.ai/v1/tts
// Returns 24kHz mono WAV audio bytes (Content-Type: audio/wav).

const RUMIK_BASE = "https://silk-api.rumik.ai";
const RUMIK_KEY = process.env.RUMIK_API_KEY || "";

export type VoiceGender = "male" | "female";

// Gender voices use the `mulberry` model: a natural-language `description` steers
// timbre, and `f0_up_key` nudges pitch (-12..+12 semitones) to reinforce it.
const VOICE_PRESETS: Record<VoiceGender, { description: string; f0_up_key: number }> = {
  male: {
    description:
      "A male speaker with a warm, clear, friendly voice, speaking at a natural conversational pace with high-quality, studio-clean audio.",
    f0_up_key: -3,
  },
  female: {
    description:
      "A female speaker with a warm, clear, friendly voice, speaking at a natural conversational pace with high-quality, studio-clean audio.",
    f0_up_key: 2,
  },
};

export interface SynthOpts {
  /** Pick a gendered studio voice (uses the mulberry model). */
  gender?: VoiceGender;
  /** Override the model directly. Defaults to muga, or mulberry when gender/description is set. */
  model?: "muga" | "mulberry";
  /** Custom natural-language voice description (mulberry only). Overrides the gender preset. */
  description?: string;
}

export async function synthesizeSpeech(text: string, opts: SynthOpts = {}): Promise<Buffer> {
  const body: Record<string, unknown> = { text };

  if (opts.gender || opts.description || opts.model === "mulberry") {
    // description-controlled voice
    body.model = "mulberry";
    const preset = opts.gender ? VOICE_PRESETS[opts.gender] : undefined;
    body.description = opts.description || preset?.description;
    if (preset) body.f0_up_key = preset.f0_up_key;
  } else {
    body.model = opts.model || "muga";
  }

  const res = await fetch(`${RUMIK_BASE}/v1/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RUMIK_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}) as { error?: string });
    throw new Error((err as { error?: string }).error || `RumiK TTS failed: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export const hasRumikKey = Boolean(RUMIK_KEY);
