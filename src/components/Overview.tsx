import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { colorFor, type ProjectData } from "@/lib/data";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="gap-1 py-3">
      <CardHeader className="px-3"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl tabular-nums">{value}</CardTitle></CardHeader>
      {sub && <CardContent className="px-3 text-xs text-muted-foreground">{sub}</CardContent>}
    </Card>
  );
}

export default function Overview({ data, onGoToNode }: { data: ProjectData; onGoToNode: (id: string) => void }) {
  const { graph, claims, sources, conflicts, omop, criteria, manifest } = data;
  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of graph.nodes) m.set(n.type, (m.get(n.type) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [graph]);
  const byRel = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of graph.edges) m.set(e.relation, (m.get(e.relation) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [graph]);
  const defines = graph.edges.filter((e) => e.relation === "defines").length;
  const open = conflicts.filter((c) => c.status === "open").length;
  const tiers = [1, 2, 3, 4].map((t) => sources.filter((s) => s.tier === t).length);
  const top = [...graph.nodes].sort((a, b) => b.degree - a.degree).slice(0, 12);
  const validation = manifest?.validation as { status?: string; ok?: boolean } | undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="concepts" value={graph.nodes.length} />
        <Stat label="relationships" value={graph.edges.length} sub={`${defines} defines`} />
        <Stat label="claims" value={claims.length} />
        <Stat label="sources" value={sources.length} sub={`tier 1/2/3/4: ${tiers.join("/")}`} />
        <Stat label="OMOP coverage" value={omop ? `${Math.round(omop.coverage.rate * 100)}%` : "—"} sub={omop ? `${omop.coverage.mapped}/${omop.coverage.clinical_nodes} clinical, ${omop.coverage.confirmed} confirmed` : "no mapping summary"} />
        <Stat label="conflicts" value={conflicts.length} sub={`${open} open`} />
        <Stat label="criteria" value={criteria?.criteria.length ?? "—"} sub={criteria ? `${criteria.groups.length} groups, ${criteria.unmapped.length} unmapped` : "not included"} />
        <Stat label="status" value={validation?.status ?? (data.config.condition ? "draft" : "general")} sub={manifest ? "hand-off package built" : "research snapshot · not signed off"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Node types</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {byType.map(([t, n]) => <Badge key={t} variant="outline" style={{ borderColor: colorFor(t) }}><span className="mr-1 inline-block size-2 rounded-full" style={{ background: colorFor(t) }} />{t} <span className="text-muted-foreground">{n}</span></Badge>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Edge types</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {byRel.map(([r, n]) => <Badge key={r} variant="secondary">{r} <span className="text-muted-foreground">{n}</span></Badge>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most connected</CardTitle><CardDescription>click to open in the graph</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {top.map((n) => <button key={n.id} onClick={() => onGoToNode(n.id)} className="rounded-md border px-2 py-0.5 text-xs hover:bg-accent"><span className="mr-1 inline-block size-2 rounded-full" style={{ background: colorFor(n.type) }} />{n.name} <span className="text-muted-foreground">{n.degree}</span></button>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
