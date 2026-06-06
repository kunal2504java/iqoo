// RumiK TTS client — Text-to-Speech for campus voice notes.
// https://playground.rumik.ai/docs
// Returns 24kHz mono WAV audio.

const RUMIK_BASE = "https://silk-api.rumik.ai";
const RUMIK_KEY = process.env.RUMIK_API_KEY || "";

export async function synthesizeSpeech(text: string, opts?: { model?: "muga" | "mulberry"; description?: string }): Promise<Buffer> {
  const model = opts?.model || "muga";
  const body: Record<string, any> = { model, text };
  if (model === "mulberry" && opts?.description) {
    body.description = opts.description;
  }

  const res = await fetch(`${RUMIK_BASE}/v1/tts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RUMIK_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `RumiK TTS failed: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export const hasRumikKey = Boolean(RUMIK_KEY);
