import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function searchApi(){
  const source=await readFile(new URL("../assets/job-search.js",import.meta.url),"utf8");
  const context={window:{}};
  vm.createContext(context);
  vm.runInContext(source,context);
  return context.window.HCSJobSearch;
}

const jobs=[
  {Title:"Junior Teacher",Department:"Education",Category:"Government",Location:"Faisalabad",Qualification:"B.Ed",Age:"22-35"},
  {Title:"Computer Operator",Department:"Administration",Category:"Private",Location:"Lahore",Qualification:"Intermediate",Age:"18-30"}
];

test("partial multi-word search matches job fields regardless of case",async()=>{
  const search=await searchApi();
  const result=search.filter(jobs,{query:"TEACH fais",department:"",category:"",location:""});
  assert.deepEqual(result.map(job=>job.Title),["Junior Teacher"]);
});

test("department category and location filters combine with the search text",async()=>{
  const search=await searchApi();
  const result=search.filter(jobs,{query:"computer",department:"Administration",category:"Private",location:"Lahore"});
  assert.deepEqual(result.map(job=>job.Title),["Computer Operator"]);
  assert.deepEqual(Array.from(search.options(jobs,"Category")),["Government","Private"]);
});
