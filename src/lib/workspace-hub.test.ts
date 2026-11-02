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
});
