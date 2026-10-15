import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { listProjects, loadProject, type ProjectData, type ProjectInfo } from "@/lib/data";
import BuildView from "@/components/BuildView";
import Overview from "@/components/Overview";
import GraphView from "@/components/GraphView";
import CriteriaView from "@/components/CriteriaView";
import ConflictsView from "@/components/ConflictsView";
import MappingsView from "@/components/MappingsView";
import SourcesView from "@/components/SourcesView";
import MarkdownView from "@/components/MarkdownView";

export default function App() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [name, setName] = useState<string>(() => new URLSearchParams(location.search).get("project") ?? "");
  const [data, setData] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get("tab") ?? "overview");
  const [focusNode, setFocusNode] = useState<string | null>(null);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const refreshProjects = async () => {
    const r = await listProjects();
    setProjects(r.projects);
    if (!name && r.projects[0]) setName(r.projects[0].name);
  };
  useEffect(() => { void refreshProjects(); }, []);
  const load = async () => {
    if (!name) return;
    setLoading(true); setError("");
    try { setData(await loadProject(name)); } catch (e) { setError((e as Error).message); setData(null); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [name]);
  useEffect(() => {
    const p = new URLSearchParams(location.search); if (name) p.set("project", name); p.set("tab", tab);
    history.replaceState(null, "", `?${p}`);
  }, [name, tab]);

  const mdFiles = useMemo(() => Object.keys(data?.md ?? {}), [data]);
  const goToNode = (id: string) => { setFocusNode(id); setTab("graph"); };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
          <div className="shrink-0 font-semibold">graph-report</div>
          <Select value={name} onValueChange={setName}>
            <SelectTrigger className="min-w-56"><SelectValue placeholder="select a project" /></SelectTrigger>
            <SelectContent>{projects.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}{p.condition ? ` — ${p.condition}` : ""}</SelectItem>)}</SelectContent>
          </Select>
          {data?.config.condition && <Badge variant="success">condition mode</Badge>}
          {data && !data.config.condition && <Badge variant="secondary">general</Badge>}
          <Button variant="ghost" size="icon" onClick={() => { void refreshProjects(); void load(); }} title="reload" aria-label="Reload snapshot"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden md:inline">TIMELY · public research demo</span>
            <Button variant="ghost" size="icon" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</Button>
          </div>
        </header>
        {error && <div className="m-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div>}
        {!data && !error && <div className="m-4 text-sm text-muted-foreground">{loading ? "loading…" : projects.length ? "select a project" : "No research snapshot available."}</div>}
        {data && (
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="mx-4 mt-2 overflow-x-auto"><TabsList className="w-max">
              <TabsTrigger value="build">Build demo</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="graph">Graph</TabsTrigger>
              <TabsTrigger value="criteria">Criteria</TabsTrigger>
              <TabsTrigger value="conflicts">Conflicts <Badge variant="secondary" className="ml-1">{data.conflicts.length}</Badge></TabsTrigger>
              <TabsTrigger value="mappings">OMOP</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              {mdFiles.map((f) => <TabsTrigger key={f} value={`md:${f}`}>{f.replace(".md", "")}</TabsTrigger>)}
            </TabsList></div>
            <TabsContent value="build" className="min-h-0 overflow-auto p-4"><BuildView data={data} onExplore={() => setTab("graph")} /></TabsContent>
            <TabsContent value="overview" className="min-h-0 overflow-auto p-4"><Overview data={data} onGoToNode={goToNode} /></TabsContent>
            <TabsContent value="graph" className="min-h-0 flex-1"><GraphView data={data} focusNode={focusNode} onFocusHandled={() => setFocusNode(null)} /></TabsContent>
            <TabsContent value="criteria" className="min-h-0 overflow-auto p-4"><CriteriaView data={data} onGoToNode={goToNode} /></TabsContent>
            <TabsContent value="conflicts" className="min-h-0 overflow-auto p-4"><ConflictsView data={data} /></TabsContent>
            <TabsContent value="mappings" className="min-h-0 overflow-auto p-4"><MappingsView data={data} onGoToNode={goToNode} /></TabsContent>
            <TabsContent value="sources" className="min-h-0 overflow-auto p-4"><SourcesView data={data} /></TabsContent>
            {mdFiles.map((f) => <TabsContent key={f} value={`md:${f}`} className="min-h-0 overflow-auto p-4"><div className="mb-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">{f.startsWith("verifier") ? "Archived verification: findings and counts may refer to an earlier graph version. This is not a fresh audit or clinical sign-off." : "Research snapshot for demonstration. Open review findings remain; this is not a clinically approved decision tool."}</div><MarkdownView text={data.md[f]} sources={data.sources} /></TabsContent>)}
          </Tabs>
        )}
      </div>
    </TooltipProvider>
  );
}
