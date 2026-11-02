import { describe, expect, it } from "vitest";
import { VOICE_TEXT_MAX, isVoiceId, voiceSettingsInput, voiceSettingsView, voiceSpeakInput } from "./workspace-voice";

const WS = "0f1e2d3c-4b5a-4697-8877-665544332211";

describe("voice ids", () => {
  it("accepts ElevenLabs-style ids", () => {
    expect(isVoiceId("CwhRBWXzGAHq8TQ4Fs17")).toBe(true);
    expect(isVoiceId("EXAVITQu4vr4xnSDxMaL")).toBe(true);
  });
  it("rejects short, long and non-alphanumeric ids", () => {
    expect(isVoiceId("short")).toBe(false);
    expect(isVoiceId("a".repeat(65))).toBe(false);
    expect(isVoiceId("has-dash-in-it-12345")).toBe(false);
    expect(isVoiceId("")).toBe(false);
  });
});

describe("settings input", () => {
  it("accepts a key plus voice id", () => {
    expect(voiceSettingsInput.safeParse({ workspaceId: WS, apiKey: "sk_test", defaultVoiceId: "CwhRBWXzGAHq8TQ4Fs17" }).success).toBe(true);
  });
  it("allows updating only the voice id (key stays stored)", () => {
    expect(voiceSettingsInput.safeParse({ workspaceId: WS, defaultVoiceId: "CwhRBWXzGAHq8TQ4Fs17" }).success).toBe(true);
  });
  it("allows clearing the key", () => {
    expect(voiceSettingsInput.safeParse({ workspaceId: WS, defaultVoiceId: null, clearApiKey: true }).success).toBe(true);
  });
  it("rejects unexpected fields", () => {
    expect(voiceSettingsInput.safeParse({ workspaceId: WS, defaultVoiceId: null, apiKeyPlaintext: "x" }).success).toBe(false);
  });
});

describe("speak input", () => {
  it("bounds text to the ElevenLabs per-request limit", () => {
    expect(VOICE_TEXT_MAX).toBe(5000);
    expect(voiceSpeakInput.safeParse({ workspace_id: WS, text: "Hallo" }).success).toBe(true);
    expect(voiceSpeakInput.safeParse({ workspace_id: WS, text: "" }).success).toBe(false);
    expect(voiceSpeakInput.safeParse({ workspace_id: WS, text: "x".repeat(5001) }).success).toBe(false);
  });
  it("rejects an invalid override voice id", () => {
    expect(voiceSpeakInput.safeParse({ workspace_id: WS, text: "Hallo", voice_id: "!!" }).success).toBe(false);
  });
});

describe("what the client may see", () => {
  it("exposes only a configured boolean, never key material", () => {
    const view = voiceSettingsView({ api_key_ciphertext: "ct", default_voice_id: "CwhRBWXzGAHq8TQ4Fs17", updated_at: "2026-11-02" });
    expect(view).toEqual({ configured: true, defaultVoiceId: "CwhRBWXzGAHq8TQ4Fs17", updatedAt: "2026-11-02" });
    expect(JSON.stringify(view)).not.toContain("ct");
  });
  it("reports unconfigured when no row or no key exists", () => {
    expect(voiceSettingsView(null).configured).toBe(false);
    expect(voiceSettingsView({ api_key_ciphertext: null, default_voice_id: null, updated_at: "2026-11-02" }).configured).toBe(false);
  });
});
