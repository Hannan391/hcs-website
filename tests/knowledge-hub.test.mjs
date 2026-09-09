import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const root=new URL("../",import.meta.url);

test("Knowledge public page and app provide professional article features",async()=>{
  const [page,app,css]=await Promise.all([
    readFile(new URL("knowledge.html",root),"utf8"),
    readFile(new URL("assets/app.js",root),"utf8"),
    readFile(new URL("assets/styles.css",root),"utf8")
  ]);
  for(const id of ["knowledge-search","knowledge-category","knowledge-count","knowledge-grid"])assert.match(page,new RegExp(`id="${id}"`));
  assert.match(page,/data-page="knowledge"/);
  assert.match(app,/knowledge\.html","Knowledge","knowledge"/);
  assert.match(app,/function renderKnowledge\(/);
  assert.match(app,/function openKnowledgeArticle\(/);
  assert.match(app,/data-knowledge-read/);
  assert.match(app,/data-share-knowledge-whatsapp/);
  assert.match(css,/\.knowledge-description\{[^}]*-webkit-line-clamp:3/);
  assert.match(css,/\.knowledge-featured/);
});

test("Apps Script backend and Admin register Knowledge CRUD",async()=>{
  const [code,html]=await Promise.all([
    readFile("/workspace/scratch/09ee9ea50d18/deliverables/Code.gs","utf8"),
    readFile("/workspace/scratch/09ee9ea50d18/deliverables/Index.html","utf8")
  ]);
  assert.match(code,/knowledge:\s*\{sheet:"Knowledge"/);
  assert.match(code,/knowledge:newestFirst_\(rows_\("Knowledge"\)\.filter\(active_\),"knowledge"\)/);
  assert.match(code,/knowledge:"Knowledge"/);
  assert.match(code,/validateKnowledgeRecord_/);
  assert.match(code,/\["downloads","knowledge"\]\.includes\(type\)/);
  assert.match(html,/knowledge:\{label:"Knowledge",form:"knowledge-form"/);
  assert.match(html,/key==="Featured"&&!record\.ID\?false/);
  assert.match(html,/id="knowledge-form"[^>]*data-section="knowledge"/);
  for(const name of ["Title","Category","Description","PublishDate","ImageURL","ImageHTML","Featured","Active"])assert.match(html,new RegExp(`name="${name}"`));
});
