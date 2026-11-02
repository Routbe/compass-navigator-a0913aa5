import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DocHelpLink } from "@/components/seo/DocHelpLink";
import { WorkspaceHubView } from "@/components/workspace/WorkspaceHubView";
import { activateScopeFromUrl, getWorkspaceHub, saveWorkspaceHub } from "@/lib/workspaces.functions";
import { HUB_LIMITS, hubLinkSchema, type WorkspaceHub } from "@/lib/workspace-hub";
import { ROLE_LABELS } from "@/lib/workspace-rules";

export const Route = createFileRoute("/_authenticated/studio_/w/$workspaceSlug/hub")({
  head: () => ({
    meta: [
      { title: "Workspace Profiel Hub | ROUT Studio" },
      { name: "description", content: "Bewerk de gedeelde link-in-bio pagina van je ROUT-workspace." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Workspace Profiel Hub | ROUT Studio" },
      { property: "og:description", content: "Bewerk de gedeelde link-in-bio pagina van je ROUT-workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkspaceHubPage,
});

const card = "space-y-3 rounded-2xl border border-border bg-card p-5";

/** Workspace Studio: the shared Profile Hub of a company or team, separate from anyone's personal hub. */
function WorkspaceHubPage() {
  const { workspaceSlug } = Route.useParams();
  const activate = useServerFn(activateScopeFromUrl);
  const load = useServerFn(getWorkspaceHub);
  const save = useServerFn(saveWorkspaceHub);
  const qc = useQueryClient();
  const [scope, setScope] = useState<"loading" | "ready" | "denied">("loading");
  const [hub, setHub] = useState<WorkspaceHub | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    let alive = true;
    void activate({ data: { workspaceSlug } })
      .then(() => { if (alive) { qc.removeQueries({ queryKey: ["workspace-context"] }); setScope("ready"); } })
      .catch(() => alive && setScope("denied"));
    return () => { alive = false; };
  }, [activate, qc, workspaceSlug]);

  const q = useQuery({
    queryKey: ["workspace-hub", workspaceSlug],
    queryFn: () => load({ data: { workspaceSlug } }),
    enabled: scope === "ready",
    retry: false,
  });
  useEffect(() => { if (q.data) setHub(q.data.hub); }, [q.data]);

  const crumbs = [{ label: "Studio", to: "/studio" }, { label: q.data?.name ?? "Workspace" }];
  if (scope === "denied" || q.isError) {
    return <AppLayout title="Workspace Studio" crumbs={crumbs}><p className="text-sm text-muted-foreground">Geen toegang tot deze workspace.</p></AppLayout>;
  }
  if (!q.data || !hub) {
    return <AppLayout title="Workspace Studio" crumbs={crumbs}><p className="text-sm text-muted-foreground">Workspace laden…</p></AppLayout>;
  }
  const ws = q.data;
  const edit = ws.canEdit;

  const addLink = () => {
    const parsed = hubLinkSchema.safeParse({ title: linkTitle, url: linkUrl });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Ongeldige link.");
    if (hub.links.length >= HUB_LIMITS.links) return void toast.error(`Maximaal ${HUB_LIMITS.links} links.`);
    setHub({ ...hub, links: [...hub.links, parsed.data] });
    setLinkTitle("");
    setLinkUrl("");
  };
  const move = (i: number, dir: -1 | 1) => {
    const links = [...hub.links];
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    [links[i], links[j]] = [links[j]!, links[i]!];
    setHub({ ...hub, links });
  };
  const persist = async (next: WorkspaceHub, ok: string) => {
    setBusy(true);
    try {
      const r = await save({ data: { workspaceId: ws.workspaceId, hub: next } });
      setHub(r.hub);
      await qc.invalidateQueries({ queryKey: ["workspace-hub", workspaceSlug] });
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan lukte niet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout
      width="wide"
      title={`${ws.name} · Profiel Hub`}
      description="De gedeelde link-in-bio van deze workspace. Losstaand van je persoonlijke profiel."
      crumbs={crumbs}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><a href={`/w/${ws.slug}`} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" /> Bekijk live</a></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/studio/w/$workspaceSlug/settings" params={{ workspaceSlug: ws.slug }}><Settings className="h-4 w-4" /> Instellingen</Link></Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-4">
          {!edit && (
            <p role="status" className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
              Je bent {ROLE_LABELS[ws.role]} in deze workspace: je kunt de Profiel Hub bekijken, niet bewerken.
            </p>
          )}
          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">Openbaar</h2>
                <p className="text-sm text-muted-foreground">rout.be/w/{ws.slug} toont {hub.published ? "deze pagina" : "alleen de naam van de workspace"}.</p>
              </div>
              <Switch
                aria-label="Profiel Hub publiceren"
                checked={hub.published}
                disabled={!edit || busy}
                onCheckedChange={(v) => void persist({ ...hub, published: v }, v ? "Profiel Hub gepubliceerd." : "Profiel Hub offline gehaald.")}
              />
            </div>
          </section>

          <section className={card}>
            <h2 className="font-medium">Introductie</h2>
            <Input aria-label="Slogan" placeholder="Korte slogan, bv. Digitale studio uit Gent" maxLength={HUB_LIMITS.tagline} value={hub.tagline} disabled={!edit} onChange={(e) => setHub({ ...hub, tagline: e.target.value })} />
            <Textarea aria-label="Over de workspace" placeholder="Wie zijn jullie en wat doen jullie?" rows={4} maxLength={HUB_LIMITS.bio} value={hub.bio} disabled={!edit} onChange={(e) => setHub({ ...hub, bio: e.target.value })} />
          </section>

          <section className={card}>
            <h2 className="font-medium">Links</h2>
            {hub.links.length === 0 && <p className="text-sm text-muted-foreground">Nog geen links.</p>}
            <ul className="divide-y divide-border">
              {hub.links.map((l, i) => (
                <li key={`${l.url}-${i}`} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.url}</p>
                  </div>
                  {edit && (
                    <>
                      <Button variant="ghost" size="icon" aria-label="Omhoog" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Omlaag" onClick={() => move(i, 1)} disabled={i === hub.links.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label={`${l.title} verwijderen`} onClick={() => setHub({ ...hub, links: hub.links.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {edit && (
              <form className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]" onSubmit={(e) => { e.preventDefault(); addLink(); }}>
                <Input aria-label="Titel van de link" placeholder="Titel" maxLength={HUB_LIMITS.linkTitle} value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
                <Input aria-label="Adres van de link" placeholder="bedrijf.be/contact" maxLength={HUB_LIMITS.linkUrl} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                <Button type="submit" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Toevoegen</Button>
              </form>
            )}
          </section>

          {edit && (
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={busy} onClick={() => void persist(hub, "Profiel Hub opgeslagen.")}>Opslaan</Button>
              <DocHelpLink to="/support/workspace/team-roles">Wie mag deze pagina bewerken?</DocHelpLink>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Voorbeeld</p>
          <div className="flex justify-center rounded-2xl bg-muted/40 p-4">
            <WorkspaceHubView name={ws.name} slug={ws.slug} avatarUrl={ws.avatarUrl} hub={hub} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
