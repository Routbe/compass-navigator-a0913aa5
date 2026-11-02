import { useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";

/**
 * Minimalist player for a workspace's spoken introduction on its public
 * Profile Hub. The audio is synthesized on demand by
 * GET /api/public/workspace-voice/<slug> with the workspace's own ElevenLabs
 * voice; nothing is fetched until the visitor presses play.
 */
export function VoiceIntroPlayer({ slug, label }: { slug: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");

  const toggle = async () => {
    if (state === "playing") {
      audioRef.current?.pause();
      audioRef.current = null;
      setState("idle");
      return;
    }
    setState("loading");
    try {
      const res = await fetch(`/api/public/workspace-voice/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setState("idle");
      };
      await audio.play();
      setState("playing");
    } catch {
      audioRef.current = null;
      setState("error");
    }
  };

  return (
    <div className="mt-5 flex items-center justify-center gap-3 rounded-full border border-border bg-background px-4 py-2.5">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={state === "loading"}
        aria-label={state === "playing" ? "Pauzeer ingesproken introductie" : "Beluister ingesproken introductie"}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : state === "playing" ? (
          <Pause className="h-4 w-4" aria-hidden />
        ) : (
          <Play className="ml-0.5 h-4 w-4" aria-hidden />
        )}
      </button>
      <span className="text-sm text-muted-foreground">
        {state === "error" ? "Audio is nu niet beschikbaar" : (label ?? "Beluister onze introductie")}
      </span>
    </div>
  );
}
