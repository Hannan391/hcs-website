import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const pages=["index.html","services.html","jobs.html","downloads.html","catalog.html","contact.html"];

test("pages do not depend on third-party render-blocking stylesheets",async()=>{
  for(const page of pages){
    const html=await readFile(new URL(`../${page}`,import.meta.url),"utf8");
    const styles=[...html.matchAll(/<link\b[^>]*>/gi)].map(match=>match[0]).filter(tag=>/\brel=["']stylesheet["']/i.test(tag)).map(tag=>tag.match(/\bhref=["']([^"']+)["']/i)?.[1]).filter(Boolean);
    assert.deepEqual(styles.filter(url=>/^https?:\/\//i.test(url)),[],`${page} has third-party render-blocking CSS`);
  }
});
