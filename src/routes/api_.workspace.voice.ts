import { createFileRoute } from "@tanstack/react-router";
import { voiceSpeakInput } from "@/lib/workspace-voice";

/**
 * POST /api/workspace/voice — signed-in workspace members only.
 * Speech proxy for the Studio: synthesizes text with the workspace's own
 * ElevenLabs key and Voice ID. The key is sealed in the database and opened
 * only here; the answer is the MP3 stream, never the key. External AI agents
 * have no access — ElevenLabs is a member/Profile Hub feature, not an agent API.
 */
export const Route = createFileRoute("/api_/workspace/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { currentUser } = await import("@/lib/auth/session.server");
        const user = await currentUser();
        if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

        const parsed = voiceSpeakInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          return Response.json({ error: `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}` }, { status: 400 });
        }
        const { enforceRateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
        try {
          enforceRateLimit(`workspace-voice-api:${user.id}`, 10, 60_000);
          const { synthesizeWorkspaceSpeech } = await import("@/lib/workspace-voice.server");
          const { audio, contentType } = await synthesizeWorkspaceSpeech(user.id, {
            workspaceId: parsed.data.workspace_id,
            text: parsed.data.text,
            voiceId: parsed.data.voice_id,
          });
          return new Response(audio, {
            status: 200,
            headers: { "content-type": contentType, "cache-control": "no-store" },
          });
        } catch (error) {
          if (error instanceof RateLimitError) {
            return Response.json({ error: error.message }, { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } });
          }
          const { VoiceError } = await import("@/lib/workspace-voice.server");
          if (error instanceof VoiceError) {
            return Response.json({ error: error.message }, { status: error.status });
          }
          const message = error instanceof Error ? error.message : "";
          if (message.includes("Geen toegang") || message.includes("access") || message.includes("role")) {
            return Response.json({ error: "Je bent geen lid van deze workspace." }, { status: 403 });
          }
          console.error("[workspace-voice]", error);
          return Response.json({ error: "Spraakgeneratie is tijdelijk niet beschikbaar." }, { status: 500 });
        }
      },
    },
  },
});
