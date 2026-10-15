/** Public research snapshot types used by the standalone dashboard. */
export interface Qualifiers {
  operator?: string; value?: number; value_high?: number | null; unit?: string;
  window?: { amount?: number; unit?: string; anchor?: string; text?: string };
  duration?: { amount?: number; unit?: string; operator?: string; text?: string };
  aggregate?: string; population?: string; direction?: string; strength?: string; confidence?: number; context?: string;
}
export interface Omop { concept_id: number; concept_name?: string; vocabulary_id?: string; domain_id?: string; concept_code?: string; standard_concept?: string; status: "proposed" | "confirmed" }
export interface GNode { id: string; name: string; type: string; degree: number; omop?: Omop }
export interface GEdge { id: string; source: string; target: string; relation: string; evidence: string; source_id: string; qualifiers?: Qualifiers; strength?: string; recommendation?: string }
export interface Graph { directed: boolean; condition?: string; nodes: GNode[]; edges: GEdge[] }
export interface Claim { id: string; claim: string; evidence: string; source_id: string }
export interface Source { id: string; title?: string; filename?: string; file_type?: string; chars?: number; tier?: number; source_kind?: string; chunks?: number }
export interface Conflict { id: string; kind: string; subject: string; edges: string[]; detail: string; proposal?: { keep_edges: string[]; rule: string }; status: string; resolution?: { resolution: string; keep_edges?: string[]; reviewer_type: string; note?: string } }
export interface OmopMap { coverage: { clinical_nodes: number; mapped: number; confirmed: number; rate: number }; map: Record<string, Omop & { name: string; type: string }>; unmapped: { id: string; name: string; type: string; candidates: unknown[] }[] }
export interface Criterion { id: string; edge_id: string; kind: string; group: string; criterion: string; criterion_type: string; cdm_table: string; concept_set?: { concept_id: number; concept_name?: string; vocabulary_id?: string; status?: string }; unmapped?: boolean; operator?: string; value?: number; value_high?: number | null; unit?: string; window?: Qualifiers["window"]; duration?: Qualifiers["duration"]; aggregate?: string; population?: string; direction?: string; strength?: string; tier?: number; source_id: string; recommendation?: string; evidence: string; notes: string[] }
export interface CohortCriteria { condition?: string; generated_from: { nodes: number; edges: number; defines_edges: number; blocked_edges: string[] }; groups: { name: string; type: string; logic: string; criteria: string[] }[]; criteria: Criterion[]; risk_factors: { edge_id: string; name: string; type: string; concept_set?: { concept_id: number }; qualifiers?: Qualifiers; strength?: string; source_id: string; evidence: string }[]; unmapped: { name: string; type: string; used_by: string[] }[] }
export interface ProjectInfo { name: string; condition: string | null; files: string[]; mtime: number }
export interface ProjectData {
  name: string; graph: Graph; claims: Claim[]; sources: Source[]; conflicts: Conflict[]; omop?: OmopMap; criteria?: CohortCriteria;
  config: { condition?: string; strict?: boolean }; manifest?: Record<string, unknown>;
  md: Record<string, string>; // report.md, cohort_criteria.md, verifier-*.md
}

const projects: ProjectInfo[] = [{ name: "aki-v2", condition: "acute kidney injury", files: [], mtime: 0 }];

export async function listProjects(): Promise<{ projects: ProjectInfo[] }> {
  return { projects };
}

export async function loadProject(name: string): Promise<ProjectData> {
  if (!projects.some((p) => p.name === name)) throw new Error("This public demo contains the aki-v2 research snapshot. Select aki-v2 above.");
  const response = await fetch(`${import.meta.env.BASE_URL}data/${encodeURIComponent(name)}.json`);
  if (!response.ok) throw new Error("The research snapshot could not be loaded. Please reload the page.");
  return response.json() as Promise<ProjectData>;
}

// ---------------------------------------------------------------- helpers

export const NODE_TYPE_COLORS: Record<string, string> = {
  Condition: "#dc2626", Stage: "#f97316", Finding: "#eab308", Measurement: "#2563eb", Drug: "#16a34a",
  Procedure: "#0891b2", Outcome: "#7c3aed", Population: "#db2777", Concept: "#9ca3af",
};
export const colorFor = (type: string) => NODE_TYPE_COLORS[type] ?? stringColor(type);
function stringColor(s: string) {
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 50%)`;
}
export const EDGE_TYPE_ORDER = ["defines","risk_factor_for","indicates","causes","precedes","follows","treated_with","contraindicated_in","excludes","associated_with","predicts","part_of","contradicts","supports"];

export function fmtQualifiers(q?: Qualifiers): string {
  if (!q) return "";
  const p: string[] = [];
  if (q.operator || q.value !== undefined) p.push([q.operator, q.value, q.value_high != null ? `–${q.value_high}` : "", q.unit].filter((x) => x !== undefined && x !== "" && x !== null).join(" "));
  if (q.aggregate) p.push(`agg ${q.aggregate}`);
  if (q.window) p.push(`window ${q.window.amount ?? ""} ${q.window.unit ?? ""}${q.window.anchor ? " from " + q.window.anchor : ""}${!q.window.amount && q.window.text ? " (" + q.window.text + ")" : ""}`.trim());
  if (q.duration) p.push(`for ${q.duration.operator ?? ""}${q.duration.amount ?? ""} ${q.duration.unit ?? ""}`.trim());
  if (q.population) p.push(`pop: ${q.population}`);
  if (q.direction) p.push(q.direction);
  if (q.context) p.push(`ctx: ${q.context}`);
  return p.join("; ");
}
export const strengthVariant = (s?: string) => (s === "guideline" ? "success" : s === "rct" || s === "systematic_review" ? "default" : s === "observational" ? "secondary" : "outline");
