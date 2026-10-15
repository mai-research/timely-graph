import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fmtQualifiers, strengthVariant, type ProjectData, type Criterion } from "@/lib/data";

function qualOf(c: Criterion) {
  return fmtQualifiers({ operator: c.operator, value: c.value, value_high: c.value_high, unit: c.unit, window: c.window, duration: c.duration, aggregate: c.aggregate, direction: c.direction });
}

export default function CriteriaView({ data, onGoToNode }: { data: ProjectData; onGoToNode: (id: string) => void }) {
  const { criteria, graph } = data;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const nodeIdByName = useMemo(() => new Map(graph.nodes.map((n) => [n.name.toLowerCase(), n.id])), [graph]);
  const rows = useMemo(() => {
    if (!criteria) return [];
    const s = q.trim().toLowerCase();
    return criteria.criteria.filter((c) => !s || [c.id, c.group, c.criterion, c.source_id, c.population, c.cdm_table].join(" ").toLowerCase().includes(s));
  }, [criteria, q]);
  const definesFallback = useMemo(() => graph.edges.filter((e) => e.relation === "defines"), [graph]);
  const nameOf = (id: string) => graph.nodes.find((n) => n.id === id)?.name ?? id;
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (!criteria) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm text-muted-foreground">No compiled criteria in this snapshot. Showing <code>defines</code> edges from the graph:</div>
        <Table>
          <TableHeader><TableRow><TableHead>edge</TableHead><TableHead>criterion</TableHead><TableHead>defines</TableHead><TableHead>qualifiers</TableHead><TableHead>source</TableHead></TableRow></TableHeader>
          <TableBody>{definesFallback.map((e) => <TableRow key={e.id}><TableCell className="font-mono text-xs">{e.id}</TableCell><TableCell><button className="underline" onClick={() => onGoToNode(e.source)}>{nameOf(e.source)}</button></TableCell><TableCell>{nameOf(e.target)}</TableCell><TableCell className="font-mono text-xs">{fmtQualifiers(e.qualifiers)}</TableCell><TableCell><Badge variant="outline">{e.source_id}</Badge> {e.strength && <Badge variant={strengthVariant(e.strength)}>{e.strength}</Badge>}</TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="gap-1 py-3"><CardHeader className="px-3"><CardDescription>criteria</CardDescription><CardTitle>{criteria.criteria.length}</CardTitle></CardHeader><CardContent className="px-3 text-xs text-muted-foreground">{criteria.criteria.filter((c) => c.kind === "inclusion").length} inclusion · {criteria.criteria.filter((c) => c.kind === "exclusion").length} exclusion</CardContent></Card>
        <Card className="gap-1 py-3"><CardHeader className="px-3"><CardDescription>groups</CardDescription><CardTitle>{criteria.groups.length}</CardTitle></CardHeader><CardContent className="px-3 text-xs text-muted-foreground">{criteria.groups.map((g) => g.name).join(" · ")}</CardContent></Card>
        <Card className="gap-1 py-3"><CardHeader className="px-3"><CardDescription>risk factors</CardDescription><CardTitle>{criteria.risk_factors.length}</CardTitle></CardHeader></Card>
        <Card className="gap-1 py-3"><CardHeader className="px-3"><CardDescription>blocked / unmapped</CardDescription><CardTitle>{criteria.generated_from.blocked_edges.length} / {criteria.unmapped.length}</CardTitle></CardHeader><CardContent className="px-3 text-xs text-muted-foreground">{criteria.unmapped.map((u) => u.name).join(", ") || "—"}</CardContent></Card>
      </div>
      <Input placeholder="filter criteria…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <Table>
        <TableHeader><TableRow><TableHead /><TableHead>id</TableHead><TableHead>kind</TableHead><TableHead>group</TableHead><TableHead>criterion</TableHead><TableHead>qualifiers</TableHead><TableHead>population</TableHead><TableHead>CDM</TableHead><TableHead>concept</TableHead><TableHead>source</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((c) => (
            <Fragment key={c.id}>
              <TableRow key={c.id} className="cursor-pointer" onClick={() => toggle(c.id)}>
                <TableCell><button aria-label={`Evidence for ${c.id}`} aria-expanded={open.has(c.id)} onClick={(e) => { e.stopPropagation(); toggle(c.id); }}>{open.has(c.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button></TableCell>
                <TableCell className="font-mono text-xs">{c.id}<div className="text-muted-foreground">{c.edge_id}</div></TableCell>
                <TableCell><Badge variant={c.kind === "exclusion" ? "destructive" : "default"}>{c.kind}</Badge></TableCell>
                <TableCell>{c.group}</TableCell>
                <TableCell><button className="underline" onClick={(e) => { e.stopPropagation(); const id = nodeIdByName.get(c.criterion.toLowerCase()); if (id) onGoToNode(id); }}>{c.criterion}</button><div className="text-xs text-muted-foreground">{c.criterion_type}</div></TableCell>
                <TableCell className="font-mono text-xs">{qualOf(c)}</TableCell>
                <TableCell className="text-xs">{c.population ?? "all"}</TableCell>
                <TableCell className="font-mono text-xs">{c.cdm_table}</TableCell>
                <TableCell>{c.concept_set ? <Badge variant={c.concept_set.status === "confirmed" ? "success" : "warning"} title={c.concept_set.concept_name}>{c.concept_set.concept_id}</Badge> : <Badge variant="destructive">UNMAPPED</Badge>}</TableCell>
                <TableCell className="text-xs"><Badge variant="outline">{c.source_id}</Badge> {c.strength && <Badge variant={strengthVariant(c.strength)}>{c.strength}</Badge>}{c.recommendation && <div className="text-muted-foreground">§{c.recommendation}</div>}</TableCell>
              </TableRow>
              {open.has(c.id) && (
                <TableRow key={c.id + "-x"}>
                  <TableCell colSpan={10} className="bg-muted/40">
                    <div className="mb-2 text-xs italic text-muted-foreground">“{c.evidence}”</div>
                    {c.notes.length > 0 && <ul className="mb-2 list-disc pl-5 text-xs">{c.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
                    <div className="text-xs text-muted-foreground">Source evidence and research qualifiers shown above. Execution templates are not part of this public demo.</div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
      {criteria.risk_factors.length > 0 && (
        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">Risk factors ({criteria.risk_factors.length})</summary>
          <Table><TableHeader><TableRow><TableHead>edge</TableHead><TableHead>name</TableHead><TableHead>type</TableHead><TableHead>qualifiers</TableHead><TableHead>concept</TableHead><TableHead>source</TableHead></TableRow></TableHeader>
            <TableBody>{criteria.risk_factors.map((r) => <TableRow key={r.edge_id}><TableCell className="font-mono text-xs">{r.edge_id}</TableCell><TableCell>{r.name}</TableCell><TableCell className="text-xs">{r.type}</TableCell><TableCell className="font-mono text-xs">{fmtQualifiers(r.qualifiers)}</TableCell><TableCell>{r.concept_set ? <Badge variant="secondary">{r.concept_set.concept_id}</Badge> : <span className="text-xs text-muted-foreground">unmapped</span>}</TableCell><TableCell><Badge variant="outline">{r.source_id}</Badge> {r.strength && <Badge variant={strengthVariant(r.strength)}>{r.strength}</Badge>}</TableCell></TableRow>)}</TableBody></Table>
        </details>
      )}
    </div>
  );
}
