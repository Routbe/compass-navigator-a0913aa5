import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { voiceSettingsInput } from "./workspace-voice";

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
