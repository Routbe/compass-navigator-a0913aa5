import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { voiceSettingsInput, voiceSpeakInput } from "./workspace-voice";

/** Settings-page read: a `configured` boolean and the voice id, never the key. */
export const getWorkspaceVoiceSettings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getVoiceSettings } = await import("./workspace-voice.server");
    return getVoiceSettings(context.userId, data.workspaceId);
  });

/** Owner/admin write. The API key travels once, sealed server-side. */
export const saveWorkspaceVoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => voiceSettingsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { enforceRateLimit } = await import("./rate-limit.server");
    enforceRateLimit(`workspace-voice:${context.userId}`, 20, 60_000);
    const { saveVoiceSettings } = await import("./workspace-voice.server");
    return saveVoiceSettings(context.userId, data);
  });

/**
 * Studio preview: a workspace member hears text in the workspace's ElevenLabs
 * voice before publishing it. Returns base64 MP3 — the client plays it as a
 * data URI, the key never leaves the server.
 */
export const speakWorkspaceVoice = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => voiceSpeakInput.parse(d))
  .handler(async ({ data, context }) => {
    const { enforceRateLimit } = await import("./rate-limit.server");
    enforceRateLimit(`workspace-voice-speak:${context.userId}`, 10, 60_000);
    const { synthesizeWorkspaceSpeech } = await import("./workspace-voice.server");
    const { audio, contentType } = await synthesizeWorkspaceSpeech(context.userId, {
      workspaceId: data.workspace_id,
      text: data.text,
      voiceId: data.voice_id,
    });
    return { audioBase64: Buffer.from(audio).toString("base64"), contentType };
  });
