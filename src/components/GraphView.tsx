import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { colorFor, fmtQualifiers, strengthVariant, EDGE_TYPE_ORDER, type ProjectData, type GNode, type GEdge } from "@/lib/data";

type FNode = GNode & { x?: number; y?: number };
type FLink = { id: string; source: string | FNode; target: string | FNode; edge: GEdge };

export default function GraphView({ data, focusNode, onFocusHandled }: { data: ProjectData; focusNode: string | null; onFocusHandled: () => void }) {
  const { graph, claims, sources } = data;
  const fgRef = useRef<ForceGraphMethods<FNode, FLink> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<string>>(() => new Set(graph.nodes.map((n) => n.type)));
  const [rels, setRels] = useState<Set<string>>(() => new Set(graph.edges.map((e) => e.relation)));
  const [minDegree, setMinDegree] = useState(1);
  const [criteriaOnly, setCriteriaOnly] = useState(false);
  const [labels, setLabels] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => { setTypes(new Set(graph.nodes.map((n) => n.type))); setRels(new Set(graph.edges.map((e) => e.relation))); setSelected(null); }, [graph]);
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const allTypes = useMemo(() => [...new Set(graph.nodes.map((n) => n.type))].sort(), [graph]);
  const allRels = useMemo(() => [...new Set(graph.edges.map((e) => e.relation))].sort((a, b) => (EDGE_TYPE_ORDER.indexOf(a) + 100) % 100 - (EDGE_TYPE_ORDER.indexOf(b) + 100) % 100 || a.localeCompare(b)), [graph]);
  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const sourceById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let edges = graph.edges.filter((e) => rels.has(e.relation));
    let keep = new Set<string>();
    if (criteriaOnly) {
      const crit = graph.edges.filter((e) => e.relation === "defines" || e.relation === "excludes" || e.relation === "part_of");
      for (const e of crit) { keep.add(e.source); keep.add(e.target); }
      edges = crit.filter((e) => rels.has(e.relation));
    } else {
      keep = new Set(graph.nodes.filter((n) => types.has(n.type) && n.degree >= minDegree).map((n) => n.id));
    }
    if (q) {
      const hit = new Set(graph.nodes.filter((n) => n.name.toLowerCase().includes(q)).map((n) => n.id));
      const nb = new Set<string>(hit);
      for (const e of graph.edges) { if (hit.has(e.source)) nb.add(e.target); if (hit.has(e.target)) nb.add(e.source); }
      keep = new Set([...keep].filter((id) => nb.has(id)));
    }
    edges = edges.filter((e) => keep.has(e.source) && keep.has(e.target));
    const used = new Set<string>(); for (const e of edges) { used.add(e.source); used.add(e.target); }
    const nodes: FNode[] = graph.nodes.filter((n) => keep.has(n.id) && (used.has(n.id) || (q && n.name.toLowerCase().includes(q)) || (!criteriaOnly && minDegree === 0))).map((n) => ({ ...n }));
    const links: FLink[] = edges.map((e) => ({ id: e.id, source: e.source, target: e.target, edge: e }));
    return { nodes, links };
  }, [graph, types, rels, minDegree, criteriaOnly, query]);

  // keep positions stable across filter changes
  const posRef = useRef(new Map<string, { x: number; y: number }>());
  const graphData = useMemo(() => {
    for (const n of filtered.nodes) { const p = posRef.current.get(n.id); if (p) { n.x = p.x; n.y = p.y; } }
    return filtered;
  }, [filtered]);

  useEffect(() => {
    if (!focusNode) return;
    setSelected(focusNode); setQuery(""); setCriteriaOnly(false); setMinDegree(0);
    setTypes(new Set(graph.nodes.map((n) => n.type))); setRels(new Set(graph.edges.map((e) => e.relation)));
    setTimeout(() => { const n = graphData.nodes.find((x) => x.id === focusNode); if (n?.x != null) fgRef.current?.centerAt(n.x, n.y, 600); fgRef.current?.zoom(3, 600); onFocusHandled(); }, 300);
  }, [focusNode]);

  const neighborhood = useMemo(() => {
    const id = hover ?? selected; if (!id) return null;
    const nodes = new Set([id]); const links = new Set<string>();
    for (const l of graphData.links) { const s = typeof l.source === "string" ? l.source : l.source.id; const t = typeof l.target === "string" ? l.target : l.target.id; if (s === id || t === id) { nodes.add(s); nodes.add(t); links.add(l.id); } }
    return { nodes, links };
  }, [hover, selected, graphData]);

  const drawNode = useCallback((node: FNode, ctx: CanvasRenderingContext2D, scale: number) => {
    const r = Math.max(2.5, Math.min(10, 2 + Math.sqrt(node.degree)));
    const dim = neighborhood && !neighborhood.nodes.has(node.id);
    ctx.globalAlpha = dim ? 0.15 : 1;
    ctx.beginPath(); ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI); ctx.fillStyle = colorFor(node.type); ctx.fill();
    if (node.omop) { ctx.lineWidth = 1 / scale; ctx.strokeStyle = node.omop.status === "confirmed" ? "#111" : "#666"; ctx.stroke(); }
    if (node.id === selected) { ctx.lineWidth = 2 / scale; ctx.strokeStyle = "#111"; ctx.stroke(); }
    if (labels && (scale > 1.4 || node.degree >= 8 || node.id === selected || (neighborhood?.nodes.has(node.id) ?? false))) {
      const fs = Math.max(10 / scale, 2.5);
      ctx.font = `${fs}px ui-sans-serif, system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#e5e5e5" : "#222";
      ctx.fillText(node.name.length > 40 ? node.name.slice(0, 38) + "…" : node.name, node.x!, node.y! + r + 1);
    }
    ctx.globalAlpha = 1;
  }, [neighborhood, selected, labels]);

  const sel = selected ? nodeById.get(selected) : undefined;
  const selEdges = useMemo(() => (selected ? graph.edges.filter((e) => e.source === selected || e.target === selected) : []), [selected, graph]);
  const selClaims = useMemo(() => (sel ? claims.filter((c) => c.claim.toLowerCase().includes(sel.name.toLowerCase())).slice(0, 12) : []), [sel, claims]);
  const toggle = (set: Set<string>, v: string, setter: (s: Set<string>) => void) => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); setter(n); };

  return (
    <div className="graph-workspace flex h-full min-h-0">
      <aside className="graph-filters flex w-60 shrink-0 flex-col gap-3 overflow-auto border-r p-3 text-sm">
        <div className="relative"><Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" aria-label="Search nodes" placeholder="search nodes…" value={query} onChange={(e) => setQuery(e.target.value)} />{query && <button aria-label="Clear node search" className="absolute right-2 top-2.5" onClick={() => setQuery("")}><X className="size-4" /></button>}</div>
        <label className="flex items-center justify-between"><span>criteria only</span><Switch aria-label="criteria only" checked={criteriaOnly} onCheckedChange={setCriteriaOnly} /></label>
        <label className="flex items-center justify-between"><span>labels</span><Switch aria-label="labels" checked={labels} onCheckedChange={setLabels} /></label>
        <label className="flex items-center justify-between gap-2"><span>min degree</span><input aria-label="min degree" type="range" min={0} max={10} value={minDegree} onChange={(e) => setMinDegree(Number(e.target.value))} className="w-24" /><span className="w-4 text-right tabular-nums">{minDegree}</span></label>
        <Separator />
        <div className="text-xs font-medium text-muted-foreground">Node types</div>
        <div className="flex flex-wrap gap-1">{allTypes.map((t) => <button key={t} aria-pressed={types.has(t)} onClick={() => toggle(types, t, setTypes)} className={`rounded-md border px-1.5 py-0.5 text-xs ${types.has(t) ? "" : "opacity-40"}`} style={{ borderColor: colorFor(t) }}><span className="mr-1 inline-block size-2 rounded-full" style={{ background: colorFor(t) }} />{t}</button>)}</div>
        <div className="flex gap-2 text-xs"><button className="underline" onClick={() => setTypes(new Set(allTypes))}>all</button><button className="underline" onClick={() => setTypes(new Set())}>none</button></div>
        <Separator />
        <div className="text-xs font-medium text-muted-foreground">Edge types</div>
        <div className="flex flex-wrap gap-1">{allRels.map((r) => <button key={r} aria-pressed={rels.has(r)} onClick={() => toggle(rels, r, setRels)} className={`rounded-md border px-1.5 py-0.5 text-xs ${rels.has(r) ? "bg-secondary" : "opacity-40"}`}>{r}</button>)}</div>
        <div className="flex gap-2 text-xs"><button className="underline" onClick={() => setRels(new Set(allRels))}>all</button><button className="underline" onClick={() => setRels(new Set())}>none</button></div>
        {query.trim() && <div className="flex max-h-40 flex-col gap-1 overflow-auto" aria-label="Matching concepts">{graph.nodes.filter((n) => n.name.toLowerCase().includes(query.toLowerCase().trim())).slice(0, 20).map((n) => <button key={n.id} className="rounded border px-2 py-1 text-left text-xs hover:bg-accent" onClick={() => setSelected(n.id)}>{n.name}</button>)}</div>}
        <Separator />
        <div className="text-xs text-muted-foreground">{graphData.nodes.length} nodes · {graphData.links.length} edges shown · ring = OMOP-mapped</div>
      </aside>
      <div ref={wrapRef} className="graph-canvas relative min-w-0 flex-1">
        <ForceGraph2D
          ref={fgRef as never}
          width={size.w} height={size.h}
          graphData={graphData}
          nodeId="id"
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(node: FNode, color, ctx) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(node.x!, node.y!, Math.max(4, 2 + Math.sqrt(node.degree)), 0, 2 * Math.PI); ctx.fill(); }}
          linkColor={(l: FLink) => (neighborhood && !neighborhood.links.has(l.id) ? "rgba(128,128,128,0.08)" : l.edge.relation === "defines" ? "#dc2626" : l.edge.relation === "risk_factor_for" ? "#f59e0b" : "rgba(128,128,128,0.45)")}
          linkWidth={(l: FLink) => (neighborhood?.links.has(l.id) ? 2 : l.edge.relation === "defines" ? 1.5 : 0.8)}
          linkDirectionalArrowLength={4} linkDirectionalArrowRelPos={1}
          linkLabel={(l: FLink) => `${l.edge.relation}${l.edge.qualifiers ? " {" + fmtQualifiers(l.edge.qualifiers) + "}" : ""} [${l.edge.source_id}]`}
          onNodeClick={(n: FNode) => setSelected(n.id === selected ? null : n.id)}
          onNodeHover={(n: FNode | null) => setHover(n?.id ?? null)}
          onBackgroundClick={() => setSelected(null)}
          onEngineStop={() => { for (const n of graphData.nodes) if (n.x != null && n.y != null) posRef.current.set(n.id, { x: n.x, y: n.y }); }}
          cooldownTicks={120}
          d3VelocityDecay={0.3}
        />
        <Button variant="outline" size="sm" className="absolute right-2 top-2" onClick={() => fgRef.current?.zoomToFit(500, 40)}>Fit graph</Button>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">{Object.entries({ defines: "#dc2626", risk_factor_for: "#f59e0b", other: "rgba(128,128,128,0.6)" }).map(([k, c]) => <span key={k} className="rounded bg-background/80 px-1.5 text-[10px]"><span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: c }} />{k}</span>)}</div>
      </div>
      {sel && (
        <aside className="graph-inspector flex w-96 shrink-0 flex-col border-l">
          <div className="flex items-start gap-2 border-b p-3">
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-tight">{sel.name}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline" style={{ borderColor: colorFor(sel.type) }}>{sel.type}</Badge>
                <Badge variant="secondary">degree {sel.degree}</Badge>
                {sel.omop ? <Badge variant={sel.omop.status === "confirmed" ? "success" : "warning"} title={sel.omop.concept_name}>{sel.omop.vocabulary_id ?? "OMOP"}:{sel.omop.concept_code ?? sel.omop.concept_id} · {sel.omop.concept_id}{sel.omop.status === "proposed" ? " ?" : ""}</Badge> : <Badge variant="outline">unmapped</Badge>}
              </div>
              {sel.omop?.concept_name && <div className="mt-1 text-xs text-muted-foreground">{sel.omop.concept_name}</div>}
            </div>
            <Button aria-label="Close node inspector" variant="ghost" size="icon" onClick={() => setSelected(null)}><X /></Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-2 p-3 text-sm">
              <div className="text-xs font-medium text-muted-foreground">Relationships ({selEdges.length})</div>
              {selEdges.map((e) => {
                const other = e.source === sel.id ? nodeById.get(e.target) : nodeById.get(e.source);
                const out = e.source === sel.id;
                return (
                  <div key={e.id} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span className="font-mono text-muted-foreground">{e.id}</span>
                      {!out && <button className="underline" onClick={() => setSelected(other!.id)}>{other?.name}</button>}
                      <Badge variant={e.relation === "defines" ? "destructive" : "secondary"}>{out ? "→ " : "← "}{e.relation}</Badge>
                      {out && <button className="underline" onClick={() => setSelected(other!.id)}>{other?.name}</button>}
                    </div>
                    {e.qualifiers && <div className="mt-1 font-mono text-xs">{fmtQualifiers(e.qualifiers)}</div>}
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                      <Badge variant="outline" title={sourceById.get(e.source_id)?.title}>{e.source_id}</Badge>
                      {e.strength && <Badge variant={strengthVariant(e.strength)}>{e.strength}</Badge>}
                      {e.recommendation && <Badge variant="outline">§{e.recommendation}</Badge>}
                    </div>
                    {e.evidence && <div className="mt-1 text-xs italic text-muted-foreground">“{e.evidence}”</div>}
                  </div>
                );
              })}
              {selClaims.length > 0 && <><div className="mt-2 text-xs font-medium text-muted-foreground">Claims mentioning this node</div>{selClaims.map((c) => <div key={c.id} className="rounded-md border p-2 text-xs"><span className="font-mono text-muted-foreground">{c.id}</span> <Badge variant="outline">{c.source_id}</Badge><div className="mt-1">{c.claim}</div></div>)}</>}
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}
