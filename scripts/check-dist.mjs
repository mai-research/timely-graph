import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk('dist');
for(const file of files){
  const name=file.replaceAll('\\','/');
  assert.ok(name==='dist/index.html'||name==='dist/.nojekyll'||name==='dist/data/aki-v2.json'||/^dist\/assets\/[^/]+\.(js|css)$/.test(name),`Unexpected public file: ${name}`);
  assert.doesNotMatch(fs.readFileSync(file,'utf8'),/\/Users\/|\/home\/|graph-log\.jsonl|query-log\.jsonl|graph_\*|graph_(?:add|query|resolve|export|review|validate|map)|contact_supervisor|docs_search|systemPrompt|["\/]\.pi\//i,`Private content in ${name}`);
}
assert.doesNotMatch(fs.readFileSync('dist/index.html','utf8'),/(?:src|href)=["']\//);
console.log(`Verified ${files.length} public files; no private runtime material or source maps.`);
