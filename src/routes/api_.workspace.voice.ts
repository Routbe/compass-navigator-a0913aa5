import { createFileRoute } from "@tanstack/react-router";
import { voiceSpeakInput } from "@/lib/workspace-voice";

/**
 * POST /api/workspace/voice — scope `assets:write`.
 * Speech proxy for external apps ("Login met ROUT") and agents: synthesizes
 * text with the workspace's own ElevenLabs key and Voice ID. The key is
 * sealed in the database and opened only here; the answer is the MP3 stream,
 * never the key. The caller must be a member of the workspace.
 */
export const Route = createFileRoute("/api_/workspace/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateAgent } = await import("@/lib/agent/agent-auth.server");
        const agent = await authenticateAgent(request, "assets:write");
        if (agent instanceof Response) return agent;
        const { agentError } = await import("@/lib/agent/responses");
        const parsed = voiceSpeakInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          return agentError(400, "invalid_request", `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}`);
        }
        try {
          const { synthesizeWorkspaceSpeech, VoiceError } = await import("@/lib/workspace-voice.server");
          const { audio, contentType } = await synthesizeWorkspaceSpeech(agent.userId, {
            workspaceId: parsed.data.workspace_id,
            text: parsed.data.text,
            voiceId: parsed.data.voice_id,
          });
          return new Response(audio, {
            status: 200,
            headers: { "content-type": contentType, "cache-control": "no-store" },
          });
        } catch (error) {
          const { VoiceError } = await import("@/lib/workspace-voice.server");
          if (error instanceof VoiceError) {
            return agentError(error.status === 429 ? 429 : error.status, error.status === 429 ? "rate_limited" : "invalid_request", error.message);
          }
          const message = error instanceof Error ? error.message : "";
          if (message.includes("Geen toegang") || message.includes("access") || message.includes("role")) {
            return agentError(403, "insufficient_scope", "The token's member is not part of this workspace.");
          }
          console.error("[workspace-voice]", error);
          return agentError(500, "server_error", "Speech synthesis is temporarily unavailable.");
        }
      },
    },
  },
});
