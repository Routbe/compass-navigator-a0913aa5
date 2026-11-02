import { Building2, ExternalLink } from "lucide-react";
import { profileImageSrc } from "@/lib/image-proxy-rules";
import type { WorkspaceHub } from "@/lib/workspace-hub";

type Props = {
  name: string;
  slug: string;
  avatarUrl: string | null;
  hub: WorkspaceHub | null;
  /** Extra actions under the links (profile link, verified domain). */
  children?: React.ReactNode;
};

/** The public link-in-bio card of a workspace; also used as the live preview in the editor. */
export function WorkspaceHubView({ name, slug, avatarUrl, hub, children }: Props) {
  const avatar = avatarUrl ? profileImageSrc(avatarUrl) : null;
  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center text-card-foreground">
      {avatar ? (
        <img src={avatar} alt="" className="mx-auto h-24 w-24 rounded-2xl object-cover" />
      ) : (
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
          <Building2 className="h-10 w-10 text-muted-foreground" aria-hidden />
        </div>
      )}
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">rout.be/w/{slug}</p>
      {hub?.tagline && <p className="mt-3 text-base">{hub.tagline}</p>}
      {hub?.bio && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{hub.bio}</p>}
      {hub && hub.links.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2">
          {hub.links.map((l, i) => (
            <li key={`${l.url}-${i}`}>
              <a
                href={l.url}
                rel="noopener nofollow"
                target="_blank"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-secondary"
              >
                {l.title} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
      {children && <div className="mt-6 flex flex-col gap-2">{children}</div>}
    </section>
  );
}
