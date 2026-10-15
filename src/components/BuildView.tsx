import { useEffect, useState } from "react";
import { Check, Circle, Play, Pause, RotateCcw, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { ProjectData } from "@/lib/data";

const stages = [
  ["Prepare sources", "Organize guidelines and research papers for the clinical question."],
  ["Build the knowledge graph", "Connect concepts, relationships and source-attributed evidence."],
  ["Review definitions and mappings", "Inspect thresholds, populations, vocabulary matches and disagreements."],
  ["Explore research outputs", "Open the graph, criteria, conflicts and cited reports."],
];

export default function BuildView({ data, onExplore }: { data: ProjectData; onExplore: () => void }) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, stages.length)), 1800);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => { if (step === stages.length) setRunning(false); }, [step]);
  const start = () => { if (step < 0 || step === stages.length) setStep(0); setRunning(!running); };
  const open = data.conflicts.filter((c) => c.status === "open").length;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 py-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Build a research knowledge graph</h1><p className="mt-1 text-sm text-muted-foreground">Acute kidney injury · guidelines, evidence and researcher review</p></div>
        <Badge variant="outline">Illustrative replay</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Research context</CardTitle><CardDescription>How is acute kidney injury identified, and which factors indicate increased risk?</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">{data.sources.length} sources in the supplied AKI case</div>
            {data.sources.map((s) => <div key={s.id} className="flex items-start gap-3 rounded-md border p-3"><FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><div className="text-sm">{s.title}</div><div className="mt-1 flex gap-1"><Badge variant="outline">{s.id}</Badge><Badge variant={s.tier === 1 ? "success" : "secondary"}>tier {s.tier} · {s.source_kind}</Badge></div></div></div>)}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card><CardHeader><CardTitle>Build walkthrough</CardTitle><CardDescription>Presentation stages using an existing research snapshot. No live model execution or document upload.</CardDescription></CardHeader><CardContent>
            <ol className="flex flex-col gap-5">{stages.map(([title, description], i) => <li key={title} className="flex items-start gap-3">{step > i ? <Check className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <Circle className={`mt-0.5 size-5 shrink-0 ${step === i ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />}<div><div className="text-sm font-medium">{title} {step === i && <Badge variant="secondary">in focus</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></li>)}</ol>
            <div className="mt-6 flex gap-2"><Button onClick={start}>{running ? <Pause /> : <Play />}{running ? "Pause" : step === stages.length ? "Replay" : step < 0 ? "Play walkthrough" : "Continue"}</Button><Button variant="outline" aria-label="Reset walkthrough" onClick={() => { setRunning(false); setStep(-1); }}><RotateCcw /></Button></div>
            <p className="mt-3 text-xs text-muted-foreground" role="status">{step === stages.length ? "Walkthrough complete. The existing snapshot is ready to explore; review findings remain open." : "Replay timing is illustrative, not recorded processing time."}</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Snapshot outputs</CardTitle><CardDescription>Complete exported research content, with its existing review state.</CardDescription></CardHeader><CardContent>
            <div className="grid grid-cols-3 gap-3">{[["concepts", data.graph.nodes.length],["relationships", data.graph.edges.length],["criteria", data.criteria?.criteria.length ?? 0]].map(([label, value]) => <div key={label} className="rounded-md border p-3"><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>)}</div>
            <p className="my-4 text-xs text-muted-foreground">{open} open conflicts · mappings include proposed matches · research demonstration, not clinical sign-off.</p>
            <Button variant="outline" onClick={onExplore}>Explore the graph <ArrowRight /></Button>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
