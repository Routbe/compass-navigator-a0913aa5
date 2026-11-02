import { sql, withDbContext } from "@/lib/neon";
import { assertWorkspaceRole } from "./workspaces.server";
import { voiceSettingsView, type VoiceSettingsView, ELEVENLABS_MODEL, ELEVENLABS_OUTPUT_FORMAT } from "./workspace-voice";

/**
 * Server side of per-workspace ElevenLabs voice settings. The API key is
 * sealed with AES-256-GCM (crypto/secretbox.server.ts) under an AAD bound to
 * the workspace id, so a copied ciphertext is useless for another workspace.
 * The plaintext key exists only inside save/synthesize calls.
 */

const aad = (workspaceId: string) => `workspace-voice:${workspaceId}`;

type VoiceRow = { api_key_ciphertext: string | null; api_key_iv: string | null; default_voice_id: string | null; updated_at: string };

async function readRow(workspaceId: string): Promise<VoiceRow | null> {
  const rows = (await sql`
    select api_key_ciphertext, api_key_iv, default_voice_id, updated_at
      from public.workspace_voice_settings
     where workspace_id = ${workspaceId}
     limit 1
  `) as VoiceRow[];
  return rows[0] ?? null;
}

/** What the settings page may show: a boolean and the voice id, never the key. */
export async function getVoiceSettings(userId: string, workspaceId: string): Promise<VoiceSettingsView> {
  return withDbContext({ userId, workspaceId }, async () => {
    await assertWorkspaceRole(userId, workspaceId, ["owner", "admin"]);
    return voiceSettingsView(await readRow(workspaceId));
  });
}

/** Owner/admin only. Empty apiKey keeps the stored key; clearApiKey removes it. */
export async function saveVoiceSettings(
  userId: string,
  input: { workspaceId: string; apiKey?: string; defaultVoiceId: string | null; clearApiKey?: boolean },
): Promise<VoiceSettingsView> {
  return withDbContext({ userId, workspaceId: input.workspaceId }, async () => {
    await assertWorkspaceRole(userId, input.workspaceId, ["owner", "admin"]);

    let ciphertext: string | null | undefined; // undefined = keep existing
    let iv: string | null | undefined;
    if (input.clearApiKey) {
      ciphertext = null;
      iv = null;
    } else if (input.apiKey) {
      const { seal, encryptionConfigured } = await import("./crypto/secretbox.server");
      if (!encryptionConfigured()) throw new Error("Versleuteling is niet geconfigureerd op de server.");
      const sealed = await seal(input.apiKey, aad(input.workspaceId));
      ciphertext = sealed.ciphertext;
      iv = sealed.iv;
    }

    await sql`
      insert into public.workspace_voice_settings (workspace_id, api_key_ciphertext, api_key_iv, default_voice_id, updated_at)
      values (${input.workspaceId}, ${ciphertext ?? null}, ${iv ?? null}, ${input.defaultVoiceId}, now())
      on conflict (workspace_id) do update set
        api_key_ciphertext = case when ${ciphertext === undefined} then public.workspace_voice_settings.api_key_ciphertext else ${ciphertext ?? null} end,
        api_key_iv = case when ${iv === undefined} then public.workspace_voice_settings.api_key_iv else ${iv ?? null} end,
        default_voice_id = ${input.defaultVoiceId},
        updated_at = now()
    `;
    return voiceSettingsView(await readRow(input.workspaceId));
  });
}

export class VoiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Synthesize speech for a workspace. Any workspace member (or an agent acting
 * for one) may call this; the key is opened in memory and never returned.
 * Returns the MP3 bytes from ElevenLabs.
 */
export async function synthesizeWorkspaceSpeech(
  userId: string,
  input: { workspaceId: string; text: string; voiceId?: string },
): Promise<{ audio: ArrayBuffer; contentType: string }> {
  return withDbContext({ userId, workspaceId: input.workspaceId }, async () => {
    await assertWorkspaceRole(userId, input.workspaceId, ["owner", "admin", "editor", "viewer"]);
    const row = await readRow(input.workspaceId);
    if (!row?.api_key_ciphertext || !row.api_key_iv) {
      throw new VoiceError("Deze workspace heeft geen ElevenLabs-sleutel ingesteld.", 412);
    }
    const voiceId = input.voiceId ?? row.default_voice_id;
    if (!voiceId) throw new VoiceError("Deze workspace heeft geen standaard Voice ID ingesteld.", 412);

    const { open } = await import("./crypto/secretbox.server");
    const apiKey = await open(row.api_key_ciphertext, row.api_key_iv, aad(input.workspaceId));

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${ELEVENLABS_OUTPUT_FORMAT}`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.text,
          model_id: ELEVENLABS_MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[workspace-voice] ElevenLabs ${response.status}: ${body.slice(0, 300)}`);
      if (response.status === 401) throw new VoiceError("De ElevenLabs-sleutel van deze workspace wordt geweigerd.", 412);
      if (response.status === 429) throw new VoiceError("Het ElevenLabs-quotum van deze workspace is op.", 429);
      throw new VoiceError("Spraakgeneratie is tijdelijk niet beschikbaar.", 502);
    }
    return { audio: await response.arrayBuffer(), contentType: "audio/mpeg" };
  });
}
