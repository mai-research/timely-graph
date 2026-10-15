import { useMemo, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { colorFor, type ProjectData } from "@/lib/data";

export default function MappingsView({ data, onGoToNode }: { data: ProjectData; onGoToNode: (id: string) => void }) {
  const { graph, omop } = data;
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"all" | "mapped" | "unmapped">("all");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return graph.nodes.filter((n) => n.type !== "Concept" && n.type !== "Population").filter((n) => (show === "all" ? true : show === "mapped" ? !!n.omop : !n.omop)).filter((n) => !s || n.name.toLowerCase().includes(s) || n.omop?.concept_name?.toLowerCase().includes(s) || String(n.omop?.concept_id ?? "").includes(s)).sort((a, b) => b.degree - a.degree);
  }, [graph, q, show]);
  const byType = useMemo(() => {
    const m = new Map<string, { total: number; mapped: number; confirmed: number }>();
    for (const n of graph.nodes) { if (n.type === "Concept" || n.type === "Population") continue; const e = m.get(n.type) ?? { total: 0, mapped: 0, confirmed: 0 }; e.total++; if (n.omop) e.mapped++; if (n.omop?.status === "confirmed") e.confirmed++; m.set(n.type, e); }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [graph]);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-1 py-3"><CardHeader className="px-3"><CardDescription>coverage</CardDescription><CardTitle>{omop ? `${Math.round(omop.coverage.rate * 100)}%` : "—"}</CardTitle></CardHeader><CardContent className="px-3 text-xs text-muted-foreground">{omop ? `${omop.coverage.mapped}/${omop.coverage.clinical_nodes} clinical nodes · ${omop.coverage.confirmed} confirmed` : "No vocabulary mapping summary in this snapshot"}</CardContent></Card>
        {byType.slice(0, 3).map(([t, e]) => <Card key={t} className="gap-1 py-3"><CardHeader className="px-3"><CardDescription><span className="mr-1 inline-block size-2 rounded-full" style={{ background: colorFor(t) }} />{t}</CardDescription><CardTitle>{e.mapped}/{e.total}</CardTitle></CardHeader><CardContent className="px-3 text-xs text-muted-foreground">{e.confirmed} confirmed</CardContent></Card>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="filter nodes / concept names / ids…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        {(["all", "mapped", "unmapped"] as const).map((k) => <button key={k} onClick={() => setShow(k)} className={`rounded-md border px-2 py-1 text-xs ${show === k ? "bg-secondary" : ""}`}>{k}</button>)}
        <span className="text-xs text-muted-foreground">{rows.length} nodes</span>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>node</TableHead><TableHead>type</TableHead><TableHead>degree</TableHead><TableHead>concept</TableHead><TableHead>vocabulary</TableHead><TableHead>domain</TableHead><TableHead>status</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map((n) => <TableRow key={n.id}><TableCell><button className="underline" onClick={() => onGoToNode(n.id)}>{n.name}</button></TableCell><TableCell><Badge variant="outline" style={{ borderColor: colorFor(n.type) }}>{n.type}</Badge></TableCell><TableCell className="tabular-nums">{n.degree}</TableCell><TableCell className="text-xs">{n.omop ? <><span className="font-mono">{n.omop.concept_id}</span> {n.omop.concept_name}</> : <span className="text-muted-foreground">—</span>}</TableCell><TableCell className="text-xs">{n.omop ? `${n.omop.vocabulary_id ?? ""}${n.omop.concept_code ? ":" + n.omop.concept_code : ""}` : ""}</TableCell><TableCell className="text-xs">{n.omop?.domain_id ?? ""}</TableCell><TableCell>{n.omop ? <Badge variant={n.omop.status === "confirmed" ? "success" : "warning"}>{n.omop.status}</Badge> : <Badge variant="destructive">unmapped</Badge>}</TableCell></TableRow>)}</TableBody>
      </Table>
    </div>
  );
}
