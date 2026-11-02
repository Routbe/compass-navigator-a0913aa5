import { z } from "zod";

/**
 * Pure rules for per-workspace ElevenLabs voice settings. Browser-safe.
 *
 * Zero-trust rules:
 * - The API key is write-only: the client can store a new one, but only ever
 *   reads back a `configured` boolean. The sealed key is opened solely inside
 *   the speech proxy.
 * - Voice IDs are ElevenLabs identifiers: 10–64 alphanumerics.
 * - Synthesis text is bounded (ElevenLabs documents 5000 chars per request).
 */

export const VOICE_ID_PATTERN = /^[A-Za-z0-9]{10,64}$/;
export const VOICE_TEXT_MAX = 5000;
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128";

export function isVoiceId(value: string): boolean {
  return VOICE_ID_PATTERN.test(value);
}

/** Settings form input. An empty apiKey means "keep the stored key". */
export const voiceSettingsInput = z.strictObject({
  workspaceId: z.string().uuid(),
  apiKey: z.string().trim().min(1).max(200).optional(),
  defaultVoiceId: z.string().trim().refine(isVoiceId, "10–64 letters or digits").nullable(),
  clearApiKey: z.boolean().optional(),
});
export type VoiceSettingsInput = z.infer<typeof voiceSettingsInput>;

/** Synthesis request for the proxy. */
export const voiceSpeakInput = z.strictObject({
  workspace_id: z.string().uuid(),
  text: z.string().min(1).max(VOICE_TEXT_MAX),
  voice_id: z.string().trim().refine(isVoiceId, "invalid voice id").optional(),
});
export type VoiceSpeakInput = z.infer<typeof voiceSpeakInput>;

/** What the client may know about stored settings — never the key itself. */
export type VoiceSettingsView = {
  configured: boolean;
  defaultVoiceId: string | null;
  updatedAt: string | null;
};

export function voiceSettingsView(row: { api_key_ciphertext: string | null; default_voice_id: string | null; updated_at: string } | null | undefined): VoiceSettingsView {
  return {
    configured: Boolean(row?.api_key_ciphertext),
    defaultVoiceId: row?.default_voice_id ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}
