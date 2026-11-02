import { createFileRoute } from "@tanstack/react-router";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * GET /api/public/workspace-voice/<slug> — public spoken introduction.
 * Synthesizes the published Profile Hub's intro text with the workspace's own
 * ElevenLabs voice. Only published hubs with an intro text and a configured
 * key answer (otherwise 404); the sealed key is opened in memory and never
 * leaves the server. IP rate-limited and edge-cached to protect the
 * workspace's ElevenLabs quota.
 */
export const Route = createFileRoute("/api_/public/workspace-voice/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug.trim().toLowerCase();
        if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
          return Response.json({ error: "Ongeldige workspace." }, { status: 400 });
        }
        const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const { enforceRateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
        try {
          enforceRateLimit(`public-voice:${ip}`, 30, 60_000);
          const { synthesizePublicWorkspaceVoice } = await import("@/lib/workspace-voice.server");
          const { audio, contentType } = await synthesizePublicWorkspaceVoice(slug);
          return new Response(audio, {
            status: 200,
            headers: {
              "content-type": contentType,
              // The intro rarely changes; caching shields the ElevenLabs quota.
              "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
            },
          });
        } catch (error) {
          if (error instanceof RateLimitError) {
            return Response.json({ error: error.message }, { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } });
          }
          const { VoiceError } = await import("@/lib/workspace-voice.server");
          if (error instanceof VoiceError) {
            return Response.json({ error: error.message }, { status: error.status });
          }
          console.error("[public-workspace-voice]", error);
          return Response.json({ error: "Spraakgeneratie is tijdelijk niet beschikbaar." }, { status: 500 });
        }
      },
    },
  },
});
