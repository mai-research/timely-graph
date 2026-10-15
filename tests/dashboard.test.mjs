import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('dashboard snapshot preserves complete clinical structures and stable references',()=>{
  assert.ok(fs.existsSync('public/data/aki-v2.json'),'dashboard-compatible public snapshot exists');
  const d=JSON.parse(fs.readFileSync('public/data/aki-v2.json','utf8'));
  assert.equal(d.graph.nodes.length,551); assert.equal(d.graph.edges.length,756);
  assert.equal(d.claims.length,480); assert.equal(d.sources.length,7); assert.equal(d.conflicts.length,11);
  assert.equal(d.criteria.criteria.length,53); assert.equal(d.criteria.groups.length,8);
  assert.equal(d.criteria.risk_factors.length,81); assert.equal(d.criteria.generated_from.blocked_edges.length,10);
  assert.equal(d.criteria.unmapped.length,3); assert.equal(d.omop.coverage.mapped,192);
  assert.equal(d.omop.coverage.clinical_nodes,505);
  const nodes=new Set(d.graph.nodes.map(n=>n.id)), edges=new Set(d.graph.edges.map(e=>e.id)), sources=new Set(d.sources.map(s=>s.id));
  for(const e of d.graph.edges){ assert.ok(nodes.has(e.source)&&nodes.has(e.target));assert.ok(sources.has(e.source_id)); }
  for(const c of d.criteria.criteria){assert.ok(edges.has(c.edge_id));assert.ok(sources.has(c.source_id));assert.ok(!('sql' in c));}
  for(const s of d.sources){assert.ok(!('path' in s));assert.ok(!('hash' in s));}
  assert.equal(Object.keys(d.md).length,4);
});
test('public source contains no runtime, filesystem or orchestration instructions',()=>{
  assert.ok(fs.existsSync('public/data/aki-v2.json'),'public snapshot exists');
  const raw=fs.readFileSync('public/data/aki-v2.json','utf8');
  assert.doesNotMatch(raw,/\/Users\/|\/home\/|graph-log|query-log|graph_\*|graph_(?:add|query|resolve|export|review|validate|map)|contact_supervisor|docs_search|write-capable tool|systemPrompt|\.pi\/|SELECT\s+[\s\S]{0,100}?FROM\s/i);
  const d=JSON.parse(raw);
  assert.equal(d.config.condition,'acute kidney injury');
  assert.deepEqual(Object.keys(d.config),['condition']);
});
