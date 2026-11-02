import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { getPublicWorkspace } from "@/lib/workspace-public.functions";
import { WorkspaceHubView } from "@/components/workspace/WorkspaceHubView";

export const Route = createFileRoute("/w/$slug")({
  loader: async ({ params }) => {
    const ws = await getPublicWorkspace({ data: { slug: params.slug } });
    if (!ws) throw notFound();
    return ws;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} op ROUT` : "Workspace niet gevonden — ROUT";
    const description = loaderData
      ? (loaderData.hub?.tagline || `Officiële ROUT-pagina van ${loaderData.name}: links, QR-codes en contact.`)
      : "Deze workspace bestaat niet of is niet openbaar.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: WorkspacePage,
});

function WorkspacePage() {
  const ws = Route.useLoaderData();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <WorkspaceHubView name={ws.name} slug={ws.slug} avatarUrl={ws.avatarUrl} hub={ws.hub}>
        {!ws.hub && ws.description && <p className="text-sm text-muted-foreground">{ws.description}</p>}
        {ws.profileHandle && (
          <Link to="/$username" params={{ username: ws.profileHandle }} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            Bekijk profiel
          </Link>
        )}
        {ws.domain && (
          <a href={`https://${ws.domain}`} rel="noopener" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium">
            {ws.domain} <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </WorkspaceHubView>
    </main>
  );
}
