import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readHub, type WorkspaceHub } from "./workspace-hub";

export type PublicWorkspace = {
  name: string;
  slug: string;
  avatarUrl: string | null;
  description: string | null;
  domain: string | null;
  profileHandle: string | null;
  /** Published hub content, or null when the workspace has not published its Profile Hub. */
  hub: WorkspaceHub | null;
};

/** Public card for rout.be/w/<slug>. A definer helper returns only non-private fields (never billing data). */
export const getPublicWorkspace = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().trim().toLowerCase().max(40) }).parse(d))
  .handler(async ({ data }): Promise<PublicWorkspace | null> => {
    const { isValidWorkspaceSlug } = await import("./workspace-rules");
    if (!isValidWorkspaceSlug(data.slug)) return null;
    const { hasDatabase, sql } = await import("@/lib/neon");
    if (!hasDatabase()) return null;
    const rows = (await sql`select * from public.rout_public_workspace(${data.slug})`) as {
      name: string; slug: string; avatar_url: string | null; description: string | null; domain: string | null; profile_handle: string | null; public_profile: unknown;
    }[];
    const r = rows[0];
    if (!r) return null;
    const hub = readHub(r.public_profile);
    return {
      name: r.name, slug: r.slug, avatarUrl: r.avatar_url, description: r.description, domain: r.domain,
      profileHandle: r.profile_handle, hub: hub.published ? hub : null,
    };
  });

/** rout.be/<handle> → workspace slug when the handle is a workspace root alias; null otherwise. */
export const resolveWorkspaceRootAlias = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ handle: z.string().trim().toLowerCase().max(40) }).parse(d))
  .handler(async ({ data }): Promise<string | null> => {
    if (!/^[a-z0-9-]{3,40}$/.test(data.handle)) return null;
    const { hasDatabase, sql } = await import("@/lib/neon");
    if (!hasDatabase()) return null;
    const rows = (await sql`select public.workspace_slug_for_root_alias(${data.handle}) as slug`.catch(() => [])) as { slug: string | null }[];
    return rows[0]?.slug ?? null;
  });
