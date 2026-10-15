import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { ProjectData } from "@/lib/data";

export default function ConflictsView({ data }: { data: ProjectData }) {
  const { conflicts, graph } = data;
  const edgeById = new Map(graph.edges.map((e) => [e.id, e]));
  if (!conflicts.length) return <div className="text-sm text-muted-foreground">No conflicts recorded.</div>;
  const order = (s: string) => (s === "open" ? 0 : 1);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {[...conflicts].sort((a, b) => order(a.status) - order(b.status)).map((c) => (
        <Card key={c.id} className={c.status === "open" ? "border-amber-500/60" : ""}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={c.status === "open" ? "warning" : "success"}>{c.status === "resolution_recorded" ? "resolution recorded" : c.status}</Badge>
              <Badge variant="outline">{c.kind}</Badge>
              <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
            </div>
            <CardTitle className="text-base">{c.subject}</CardTitle>
            <CardDescription className="font-mono text-xs whitespace-pre-wrap">{c.detail}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex flex-col gap-1">
              {c.edges.map((id) => { const e = edgeById.get(id); return e ? <div key={id} className="rounded-md border p-2 text-xs"><span className="font-mono">{id}</span> <Badge variant="outline">{e.source_id}</Badge> {e.strength && <Badge variant="secondary">{e.strength}</Badge>}<div className="mt-1 italic text-muted-foreground">“{e.evidence}”</div></div> : <div key={id} className="text-xs text-muted-foreground">{id} (edge dropped)</div>; })}
            </div>
            {c.proposal && <div className="rounded-md bg-muted p-2 text-xs"><b>proposal:</b> keep {c.proposal.keep_edges.join(", ")} — {c.proposal.rule}</div>}
            {c.resolution && <div className="rounded-md bg-emerald-500/10 p-2 text-xs"><b>resolution:</b> {c.resolution.resolution} {c.resolution.keep_edges?.join(", ")} by {c.resolution.reviewer_type}{c.resolution.note ? ` — ${c.resolution.note}` : ""}</div>}
            {c.status === "open" && <div className="text-xs text-muted-foreground">Awaiting researcher review. This public snapshot is read-only.</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
