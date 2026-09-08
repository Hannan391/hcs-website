import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

function memoryStorage(){
  const values=new Map();
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value))
  };
}

test("saved public data is available immediately on the next page load",async()=>{
  const source=await readFile(new URL("../assets/data-cache.js",import.meta.url),"utf8");
  const localStorage=memoryStorage();
  const context={window:{},localStorage};
  vm.createContext(context);
  vm.runInContext(source,context);

  const fresh={settings:{site:"HCS"},services:[],jobs:[{ID:"J2"}],downloads:[{ID:"D2"}],products:[],schemes:[],education:[]};
  context.window.HCSDataCache.write(fresh);

  assert.deepEqual(JSON.parse(JSON.stringify(context.window.HCSDataCache.read())),fresh);
});

test("invalid cached data is ignored safely",async()=>{
  const source=await readFile(new URL("../assets/data-cache.js",import.meta.url),"utf8");
  const localStorage=memoryStorage();
  localStorage.setItem("hcs-public-data-v1","not-json");
  const context={window:{},localStorage};
  vm.createContext(context);
  vm.runInContext(source,context);

  assert.equal(context.window.HCSDataCache.read(),null);
});

test("cache stores schemes and education and rejects incomplete collections",async()=>{
  const source=await readFile(new URL("../assets/data-cache.js",import.meta.url),"utf8");
  const localStorage=memoryStorage();
  const context={window:{},localStorage};
  vm.createContext(context);
  vm.runInContext(source,context);
  const cache=context.window.HCSDataCache;
  const payload={settings:{},services:[],jobs:[],downloads:[],products:[],schemes:[{ID:"S1"}],education:[{ID:"E1"}]};

  assert.equal(cache.write(payload),true);
  assert.notEqual(localStorage.getItem("hcs-public-data-v2"),null);
  assert.deepEqual(JSON.parse(JSON.stringify(cache.read().schemes)),[{ID:"S1"}]);
  assert.deepEqual(JSON.parse(JSON.stringify(cache.read().education)),[{ID:"E1"}]);

  for(const key of ["services","jobs","downloads","products","schemes","education"]){
    const invalid={...payload,[key]:{ID:"invalid"}};
    assert.equal(cache.write(invalid),false);
    assert.deepEqual(JSON.parse(JSON.stringify(cache.read())),payload);
  }

  assert.equal(cache.write({...payload,settings:[]}),false);
});
