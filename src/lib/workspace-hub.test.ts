import { describe, expect, it } from "vitest";
import { readHub, workspaceHubSchema } from "./workspace-hub";

describe("workspace hub", () => {
  it("adds https to bare domains and refuses javascript links", () => {
    const ok = workspaceHubSchema.parse({ links: [{ title: "Site", url: "acme.be" }] });
    expect(ok.links[0]?.url).toBe("https://acme.be");
    expect(workspaceHubSchema.safeParse({ links: [{ title: "x", url: "javascript:alert(1)" }] }).success).toBe(false);
    expect(workspaceHubSchema.safeParse({ links: [{ title: "x", url: "http://acme.be" }] }).success).toBe(false);
  });

  it("allows at most 20 links", () => {
    const links = Array.from({ length: 21 }, (_, i) => ({ title: `L${i}`, url: "https://acme.be" }));
    expect(workspaceHubSchema.safeParse({ links }).success).toBe(false);
  });

  it("stored garbage reads as an empty, unpublished hub", () => {
    expect(readHub({ links: "nope" }).published).toBe(false);
    expect(readHub(null).links).toEqual([]);
  });

  it("voice intro defaults to empty and is capped at 500 characters", () => {
    expect(readHub(null).voiceIntro).toBe("");
    expect(workspaceHubSchema.parse({ voiceIntro: "Hallo, wij zijn Studio Nova." }).voiceIntro).toBe("Hallo, wij zijn Studio Nova.");
    expect(workspaceHubSchema.safeParse({ voiceIntro: "x".repeat(501) }).success).toBe(false);
  });

  it("older stored hubs without a voice intro still read cleanly", () => {
    const legacy = readHub({ tagline: "Studio", bio: "Wij maken sites.", links: [], published: true });
    expect(legacy.voiceIntro).toBe("");
    expect(legacy.published).toBe(true);
  });
});
