import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const publicPages=[
  "index.html",
  "services.html",
  "jobs.html",
  "govt-schemes.html",
  "education-updates.html",
  "downloads.html",
  "catalog.html",
  "contact.html"
];

function fakeElement(){
  const classes=new Set();
  return {
    dataset:{},
    innerHTML:"",
    listeners:{},
    addEventListener(type,listener){this.listeners[type]=listener},
    classList:{
      add:name=>classes.add(name),
      remove:name=>classes.delete(name),
      toggle(name,force){
        const enabled=force===undefined?!classes.has(name):force;
        enabled?classes.add(name):classes.delete(name);
        return enabled;
      },
      contains:name=>classes.has(name)
    },
    getAttribute(name){return this.attributes?.[name]??null},
    setAttribute(name,value){this.attributes??={};this.attributes[name]=String(value)}
  };
}

async function renderApp(page,data={},extraElements={},runtime={}){
  const source=await readFile(new URL("../assets/app.js",import.meta.url),"utf8");
  const header=fakeElement(),lightbox=fakeElement(),lightboxParts=new Map();
  for(const selector of ["img",".lightbox-stage",".zoom-level",".lightbox-title","[data-zoom-in]","[data-zoom-out]","[data-zoom-reset]"]){
    const part=fakeElement();
    part.style={};
    part.setPointerCapture=()=>{};
    lightboxParts.set(selector,part);
  }
  lightbox.querySelector=selector=>lightboxParts.get(selector)||null;
  const elements=new Map([
    ["site-header",header],
    ["lightbox",lightbox],
    ...Object.entries(extraElements)
  ]);
  const body={...fakeElement(),dataset:{page},insertAdjacentHTML(){},appendChild(){}};
  const document={
    body,
    getElementById:id=>elements.get(id)||null,
    querySelector:()=>null,
    querySelectorAll:()=>[],
    createElement:()=>({remove(){}}),
    addEventListener(){}
  };
  const window={};
  if(runtime.inlineData!==false)window.HCS_INLINE_DATA={settings:{},services:[],jobs:[],downloads:[],products:[],schemes:[],education:[],...data};
  if(runtime.cache)window.HCSDataCache={read:()=>runtime.cache,write() { return true; }};
  const context={
    document,
    window,
    localStorage:{getItem:()=>null,setItem(){}},
    location:{href:"https://hannancs.com/",origin:"https://hannancs.com",pathname:"/",search:""},
    navigator:{},
    setTimeout:()=>0,
    clearTimeout(){},
    URL,
    URLSearchParams,
    FormData,
    fetch:runtime.fetch||(()=>Promise.resolve({ok:false}))
  };
  vm.createContext(context);
  vm.runInContext(source,context);
  return {header,elements};
}

test("update pages expose the correct modes, content roots, and shared assets",async()=>{
  const expectations=[
    ["govt-schemes.html","schemes","schemes-content"],
    ["education-updates.html","education","education-content"]
  ];

  for(const [file,page,root] of expectations){
    const html=await readFile(new URL(`../${file}`,import.meta.url),"utf8");
    assert.match(html,new RegExp(`data-page=["']${page}["']`));
    assert.match(html,new RegExp(`id=["']${root}["'][^>]*class=["'][^"']*card-grid[^"']*card-grid-3[^"']*loading-grid`));
    assert.match(html,/href=["']assets\/styles\.css["']/);
    assert.match(html,/src=["']assets\/app\.js["'][^>]*defer/);
  }
});

test("shared desktop and mobile navigation place both update pages immediately after Jobs",async()=>{
  for(const page of publicPages){
    const html=await readFile(new URL(`../${page}`,import.meta.url),"utf8");
    assert.match(html,/src=["']assets\/app\.js["'][^>]*defer/,`${page} must load the shared navigation`);
  }

  const {header}=await renderApp("home");
  for(const className of ["desktop-nav","mobile-nav"]){
    const nav=header.innerHTML.match(new RegExp(`<nav class="${className}"[^>]*>([\\s\\S]*?)<\\/nav>`))?.[1]||"";
    const order=["index.html","services.html","jobs.html","govt-schemes.html","education-updates.html","downloads.html","catalog.html","contact.html"];
    let last=-1;
    for(const href of order){
      const current=nav.indexOf(`href="${href}"`);
      assert.ok(current>last,`${href} is out of order or missing from ${className}`);
      last=current;
    }
  }
});

test("update cards sort newest first and safely render optional content",async()=>{
  const root=fakeElement();
  await renderApp("schemes",{
    schemes:[
      {
        ID:"older",
        Title:"Older update",
        Category:"Community",
        PublishDate:"2026-05-01",
        ImageURL:"   ",
        Description:"Older description",
        OfficialLink:"   ",
        CreatedAt:"",
        Active:true
      },
      {
        ID:"newer",
        Title:"New <Update>",
        Category:"Support & Aid",
        PublishDate:"",
        ImageURL:"https://drive.google.com/file/d/image123/view",
        Description:"Read <b>all</b> details",
        OfficialLink:"https://example.com/details?a=1&b=2",
        CreatedAt:"2026-06-01T00:00:00Z",
        Active:true
      }
    ]
  },{"schemes-content":root});

  assert.ok(root.innerHTML.indexOf("New &lt;Update&gt;")<root.innerHTML.indexOf("Older update"));
  assert.match(root.innerHTML,/Support &amp; Aid/);
  assert.match(root.innerHTML,/Read &lt;b&gt;all&lt;\/b&gt; details/);
  assert.doesNotMatch(root.innerHTML,/<b>all<\/b>/);
  assert.match(root.innerHTML,/<time class="update-date" datetime="2026-06-01T00:00:00Z">[^<]*<i[^>]*><\/i>2026-06-01T00:00:00Z<\/time>/);
  assert.equal((root.innerHTML.match(/<img\b/g)||[]).length,1,"only records with an image render media");
  assert.equal((root.innerHTML.match(/placeholder-image/g)||[]).length,1,"missing images use the HCS placeholder");
  assert.match(root.innerHTML,/thumbnail\?id=image123&amp;sz=w480/);
  assert.match(root.innerHTML,/loading="lazy"/);
  assert.match(root.innerHTML,/decoding="async"/);
  assert.equal((root.innerHTML.match(/Official Link<\/a>/g)||[]).length,1,"empty official links stay hidden");
  assert.equal((root.innerHTML.match(/data-update-read-more/g)||[]).length,2);
  assert.equal((root.innerHTML.match(/class="download-description"/g)||[]).length,2);
});

test("update Read More toggles the controlled two-line description",async()=>{
  const root=fakeElement();
  const description=fakeElement();
  const {elements}=await renderApp("education",{
    education:[{ID:"edu-1",Title:"Admissions",Description:"A detailed education update."}]
  },{"education-content":root,"update-description-edu-1":description});
  elements.set("update-description-edu-1",description);

  const button=fakeElement();
  button.attributes={"aria-controls":"update-description-edu-1","aria-expanded":"false"};
  button.closest=selector=>selector==="[data-update-read-more]"?button:null;
  root.listeners.click({target:button});

  assert.equal(button.getAttribute("aria-expanded"),"true");
  assert.equal(description.classList.contains("expanded"),true);
  assert.match(button.innerHTML,/Read Less/);
});

test("cached public data renders before the live-data request settles",async()=>{
  const root=fakeElement();
  const pending=new Promise(()=>{});
  await renderApp("schemes",{}, {"schemes-content":root}, {
    inlineData:false,
    cache:{settings:{},services:[],jobs:[],downloads:[],products:[],schemes:[{ID:"cached",Title:"Cached scheme"}],education:[]},
    fetch:()=>pending
  });

  assert.match(root.innerHTML,/Cached scheme/);
});

test("update HTML media uses a clear preview and separate HD download",async()=>{
  const root=fakeElement();
  await renderApp("education",{education:[
    {ID:"html",Title:"HTML update",ImageHTML:"<div>Safe visual</div>"},
    {ID:"dual",Title:"Dual update",ImageURL:"https://example.com/image.jpg",ImageHTML:"<div>Ignored visual</div>"}
  ]},{"education-content":root});

  assert.equal((root.innerHTML.match(/<iframe\b/g)||[]).length,1);
  assert.equal((root.innerHTML.match(/<img\b/g)||[]).length,1);
  assert.match(root.innerHTML,/sandbox="allow-popups"/);
  assert.match(root.innerHTML,/class="html-download"/);
  assert.match(root.innerHTML,/Download HD/);
  assert.doesNotMatch(root.innerHTML,/Ignored visual/);
});

test("update cards suppress non-HTTP official links",async()=>{
  const root=fakeElement();
  await renderApp("education",{
    education:[
      {ID:"bad",Title:"Unsafe",OfficialLink:"javascript:alert(1)"},
      {ID:"good",Title:"Safe",OfficialLink:"https://example.com/details"}
    ]
  },{"education-content":root});

  assert.doesNotMatch(root.innerHTML,/javascript:/i);
  assert.equal((root.innerHTML.match(/Official Link<\/a>/g)||[]).length,1);
});
