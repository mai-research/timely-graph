import { useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProjectData } from "@/lib/data";

export default function SourcesView({ data }: { data: ProjectData }) {
  const { sources, graph, claims } = data;
  const counts = useMemo(() => {
    const m = new Map<string, { edges: number; defines: number; claims: number }>();
    for (const e of graph.edges) { const c = m.get(e.source_id) ?? { edges: 0, defines: 0, claims: 0 }; c.edges++; if (e.relation === "defines") c.defines++; m.set(e.source_id, c); }
    for (const c of claims) { const x = m.get(c.source_id) ?? { edges: 0, defines: 0, claims: 0 }; x.claims++; m.set(c.source_id, x); }
    return m;
  }, [graph, claims]);
  const tierVariant = (t?: number) => (t === 1 ? "success" : t === 2 ? "default" : t === 3 ? "secondary" : "outline");
  return (
    <Table>
      <TableHeader><TableRow><TableHead>id</TableHead><TableHead>tier</TableHead><TableHead>title</TableHead><TableHead>file</TableHead><TableHead>chars</TableHead><TableHead>edges</TableHead><TableHead>defines</TableHead><TableHead>claims</TableHead></TableRow></TableHeader>
      <TableBody>{sources.map((s) => { const c = counts.get(s.id); return <TableRow key={s.id}><TableCell className="font-mono text-xs">{s.id}</TableCell><TableCell><Badge variant={tierVariant(s.tier)}>tier {s.tier ?? "?"} · {s.source_kind ?? ""}</Badge></TableCell><TableCell>{s.title}</TableCell><TableCell className="text-xs text-muted-foreground">{s.filename}</TableCell><TableCell className="tabular-nums text-xs">{s.chars?.toLocaleString()}</TableCell><TableCell className="tabular-nums">{c?.edges ?? 0}</TableCell><TableCell className="tabular-nums">{c?.defines ?? 0}</TableCell><TableCell className="tabular-nums">{c?.claims ?? 0}</TableCell></TableRow>; })}</TableBody>
    </Table>
  );
}
