import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

function fakeElement(){
  const classes=new Set();
  return {
    dataset:{},innerHTML:"",value:"",listeners:{},style:{},
    addEventListener(type,listener){this.listeners[type]=listener},
    querySelectorAll(){return []},focus(){},scrollIntoView(){},
    setAttribute(name,value){this.attributes??={};this.attributes[name]=String(value)},
    getAttribute(name){return this.attributes?.[name]??null},
    classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),toggle(name,force){const on=force===undefined?!classes.has(name):force;on?classes.add(name):classes.delete(name);return on},contains:name=>classes.has(name)}
  };
}

async function render(page,data,elements,runtime={}){
  const source=await readFile(new URL("../assets/app.js",import.meta.url),"utf8");
  const lightbox=fakeElement(),parts=new Map();
  for(const selector of ["img",".lightbox-stage",".zoom-level",".lightbox-title","[data-zoom-in]","[data-zoom-out]","[data-zoom-reset]"]){const part=fakeElement();part.setPointerCapture=()=>{};parts.set(selector,part)}
  lightbox.querySelector=selector=>parts.get(selector)||null;
  const nodes=new Map([["lightbox",lightbox],["site-header",fakeElement()],...Object.entries(elements)]);
  const document={
    body:{...fakeElement(),dataset:{page},insertAdjacentHTML(){},appendChild(){}},
    getElementById:id=>nodes.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({remove(){}}),addEventListener(){}
  };
  const window={HCSJobSearch:{options:()=>[],filter:rows=>[...rows]}};
  if(runtime.inline!==false)window.HCS_INLINE_DATA={settings:{},services:[],jobs:[],downloads:[],products:[],schemes:[],education:[],...data};
  if(runtime.cache)window.HCSDataCache={read:()=>runtime.cache,write:()=>true};
  vm.runInNewContext(source,{document,window,localStorage:{getItem:()=>null,setItem(){}},location:{href:"https://hannancs.com/",origin:"https://hannancs.com",pathname:"/",search:""},navigator:{},URL,URLSearchParams,FormData,setTimeout:()=>0,requestAnimationFrame:fn=>fn(),fetch:runtime.fetch||(()=>Promise.resolve({ok:false}))});
  return {window,nodes};
}

function dated(title,date,extra={}){return {ID:title.toLowerCase().replace(/\s/g,"-"),Title:title,CreatedAt:date,Active:true,...extra}}

test("browser hides cached jobs once their server-derived expiry epoch passes",async()=>{
  const root=fakeElement();
  await render("jobs",{jobs:[dated("Expired cached job","2026-08-02",{PublicHiddenFrom:Date.now()-1000}),dated("Current cached job","2026-08-01",{PublicHiddenFrom:Date.now()+60000})]},{"jobs-list":root,"job-count":fakeElement(),"job-search":fakeElement()});
  assert.doesNotMatch(root.innerHTML,/Expired cached job/);
  assert.match(root.innerHTML,/Current cached job/);
});

test("offline inline and v4 cached data fail closed for dated jobs without expiry metadata",async()=>{
  for(const runtime of [{},{inline:false,cache:{settings:{},services:[],jobs:[{ID:"missing",Title:"Missing",LastDate:"2099-01-01"},{ID:"undated",Title:"Undated",PublicHiddenFrom:0}],downloads:[],products:[],schemes:[],education:[]},fetch:()=>Promise.resolve({ok:false})}]){
    const root=fakeElement();
    const data={jobs:[{ID:"missing",Title:"Missing",LastDate:"2099-01-01"},{ID:"undated",Title:"Undated",PublicHiddenFrom:0}]};
    await render("jobs",data,{"jobs-list":root,"job-count":fakeElement(),"job-search":fakeElement()},runtime);
    assert.doesNotMatch(root.innerHTML,/Missing/);
    assert.match(root.innerHTML,/Undated/);
  }
});

test("checked-in inline jobs include finite server expiry metadata",async()=>{
  const source=await readFile(new URL("../assets/data.js",import.meta.url),"utf8"),context={window:{}};vm.createContext(context);vm.runInContext(source,context);
  assert.ok(context.window.HCS_INLINE_DATA.jobs.every(job=>Number.isFinite(job.PublicHiddenFrom)&&job.PublicHiddenFrom>=0));
});

test("frontend ordering uses the same timestamp-encoded ID fallback",async()=>{
  const root=fakeElement();
  await render("services",{services:[{ID:"SV-20260907120000",Title:"Older ID"},{ID:"SV-20260908120000",Title:"Newer ID"}]},{"services-grid":root,"service-count":fakeElement()});
  assert.ok(root.innerHTML.indexOf("Newer ID")<root.innerHTML.indexOf("Older ID"));
  const invalid=fakeElement();
  await render("services",{services:[{ID:"SV-20260908125959",Title:"Valid time"},{ID:"SV-20260908126000",Title:"Invalid time"}]},{"services-grid":invalid,"service-count":fakeElement()});
  assert.ok(invalid.innerHTML.indexOf("Valid time")<invalid.innerHTML.indexOf("Invalid time"));
});

test("service cards use lightweight title-matched vector icons instead of banner media",async()=>{
  const root=fakeElement();
  await render("services",{services:[
    {ID:"SV1",Title:"Color Photocopies & Prints",ImageURL:"https://example.com/heavy.jpg"},
    {ID:"SV2",Title:"Computer Sale & Service",ImageHTML:"<div>heavy</div>"},
    {ID:"SV3",Title:"Photo Studio"}
  ]},{"services-grid":root,"service-count":fakeElement()});
  assert.doesNotMatch(root.innerHTML,/<img\b|<iframe\b/);
  assert.match(root.innerHTML,/class="service-icon-visual[^>]*>[\s\S]*bi-printer/);
  assert.match(root.innerHTML,/bi-pc-display/);
  assert.match(root.innerHTML,/bi-camera/);
  const styles=await readFile(new URL("../assets/styles.css",import.meta.url),"utf8");
  assert.match(styles,/\.service-icon-visual\{[^}]*height:150px/);
  assert.match(styles,/\.service-icon-visual\{[^}]*#0369a1[^}]*#083b66/);
  assert.match(styles,/\.service-icon-visual \.bi\{[^}]*perspective|\.service-icon-visual \.bi\{[^}]*rotateX/);
});

test("product details use shared safe visual media",async()=>{
  const body=fakeElement(),modal=fakeElement();modal.querySelector=selector=>selector===".product-detail"?body:null;
  const {window}=await render("catalog",{products:[dated("HTML Product","2026-08-01",{ImageHTML:"<div>Product offer</div>"})]},{"products-grid":fakeElement(),"product-count":fakeElement(),"product-modal":modal});
  window.openHcsProduct("html-product");
  assert.match(body.innerHTML,/product-detail-image/);
  assert.match(body.innerHTML,/<iframe[^>]+product-detail-visual/);
  assert.match(body.innerHTML,/class="html-download"/);
});

test("all six public sections render newest records before older records",async()=>{
  const cases=[
    ["services","services","services-grid",{"service-count":fakeElement()}],
    ["jobs","jobs","jobs-list",{"job-count":fakeElement(),"job-search":fakeElement()}],
    ["catalog","products","products-grid",{"product-count":fakeElement()}],
    ["downloads","downloads","downloads-content",{}],
    ["schemes","schemes","schemes-content",{}],
    ["education","education","education-content",{}]
  ];
  for(const [page,key,rootId,extras] of cases){
    const root=fakeElement();
    await render(page,{[key]:[dated("Older Post","2026-01-01"),dated("Newer Post","2026-08-01")]},{[rootId]:root,...extras});
    assert.ok(root.innerHTML.indexOf("Newer Post")<root.innerHTML.indexOf("Older Post"),`${key} must be newest first`);
  }
});

test("job cards hide banners and open HTML or JPEG from Short Advertisement",async()=>{
  const list=fakeElement(),modal=fakeElement(),content=fakeElement(),heading=fakeElement();
  modal.querySelector=selector=>selector===".short-ad-content"?content:selector===".short-ad-title"?heading:null;
  const {window}=await render("jobs",{jobs:[
    dated("HTML Job","2026-08-02",{BannerHTML:"<div><strong>Clear HTML</strong></div>",PublicHiddenFrom:0}),
    dated("JPEG Job","2026-08-01",{BannerURL:"https://example.com/job.jpg",PublicHiddenFrom:0})
  ]},{"jobs-list":list,"job-count":fakeElement(),"job-search":fakeElement(),"short-ad-modal":modal});

  assert.equal((list.innerHTML.match(/data-short-advertisement=/g)||[]).length,2);
  assert.match(list.innerHTML,/Short Advertisement/);
  assert.doesNotMatch(list.innerHTML,/<iframe\b|<img\b|class="html-media"/);
  assert.match(list.innerHTML,/class="category job-department"/);
  for(const className of ["qualification-meta","age-meta","category-meta","date-meta"]){
    assert.match(list.innerHTML,new RegExp(`class="meta-box ${className}"`));
  }
  assert.match(list.innerHTML,/class="button short-ad-button small"/);

  window.openShortAdvertisement("html-job");
  assert.match(content.innerHTML,/<iframe[^>]+srcdoc=/);
  assert.match(content.innerHTML,/Download HD/);
  assert.equal(heading.textContent,"HTML Job");

  window.openShortAdvertisement("jpeg-job");
  assert.match(content.innerHTML,/<img[^>]+job\.jpg/);
  assert.doesNotMatch(content.innerHTML,/<iframe/);
});

test("job titles use the approved dark-green visual treatment",async()=>{
  const list=fakeElement();
  await render("jobs",{jobs:[dated("Forest Job","2026-08-02",{PublicHiddenFrom:0})]},{"jobs-list":list,"job-count":fakeElement(),"job-search":fakeElement()});
  const styles=await readFile(new URL("../assets/styles.css",import.meta.url),"utf8");

  assert.match(list.innerHTML,/<h2 class="job-title">Forest Job<\/h2>/);
  assert.match(styles,/\.job-title\{[^}]*color:#14532d/i);
});

test("job descriptions use full-black readable text",async()=>{
  const styles=await readFile(new URL("../assets/styles.css",import.meta.url),"utf8");
  assert.match(styles,/\.job-description\{[^}]*color:#000(?:000)?(?:;|})/i);
});

test("HTML media renders as a clear sandboxed preview with a separate HD download",async()=>{
  const root=fakeElement();
  await render("downloads",{downloads:[
    dated("HTML Post","2026-08-03",{ImageHTML:'<div class="banner"><strong>Offer</strong></div>'}),
    dated("Image Post","2026-08-02",{ImageURL:"https://example.com/image.jpg"}),
    dated("Dual Post","2026-08-01",{ImageURL:"https://example.com/preferred.jpg",ImageHTML:"<div>ignored</div>"})
  ]},{"downloads-content":root});

  assert.equal((root.innerHTML.match(/<iframe\b/g)||[]).length,1);
  assert.match(root.innerHTML,/class="html-visual image-button"/);
  assert.match(root.innerHTML,/sandbox="allow-popups"/);
  assert.match(root.innerHTML,/srcdoc=/);
  assert.match(root.innerHTML,/<a[^>]+class="html-download"[^>]+data:image\/svg\+xml/);
  assert.match(root.innerHTML,/download="html-post-hd\.svg"/);
  assert.match(root.innerHTML,/loading="lazy"/);
  assert.equal((root.innerHTML.match(/<img\b/g)||[]).length,2);
  assert.match(root.innerHTML,/preferred\.jpg/);
  assert.doesNotMatch(root.innerHTML,/ignored/);
});

test("HTML banner download is a sanitized vector-HD file",async()=>{
  const root=fakeElement();
  await render("downloads",{downloads:[dated("HD Job","2026-08-01",{ImageHTML:'<section style="background:#fff"><h2>HD Banner</h2><script>alert(1)</script></section>'})]},{"downloads-content":root});
  const encoded=root.innerHTML.match(/href="data:image\/svg\+xml;charset=utf-8,([^"]+)"/)?.[1]||"";
  const svg=decodeURIComponent(encoded.replaceAll("&amp;","&"));
  assert.match(svg,/<svg[^>]+width="2400"[^>]+height="1576"[^>]+viewBox="0 0 1200 788"/);
  assert.match(svg,/HD Banner/);
  assert.doesNotMatch(svg,/<script/i);
  assert.match(root.innerHTML,/Download HD/);
});

test("HTML banner SVG stays XML-safe for ampersands, named entities, and unbalanced HTML",async()=>{
  const root=fakeElement();
  await render("downloads",{downloads:[dated("XML-safe Job","2026-08-01",{ImageHTML:"<div><p>A & B&nbsp;&copy;&mdash;&euro;<strong>Offer</div>"})]},{"downloads-content":root});
  const svg=decodeDownloadSvg(root.innerHTML);
  assert.match(svg,/A &amp; B&#160;©—€/);
  assert.match(svg,/<div><p>A [\s\S]*<strong>Offer<\/strong><\/p><\/div>/);
  assert.doesNotMatch(svg,/A & B|&(?:nbsp|copy|mdash|euro);/);
  assert.match(root.innerHTML,/sandbox="allow-popups"/);
});

function decodeDownloadSvg(markup){
  const encoded=String(markup||"").match(/href="data:image\/svg\+xml;charset=utf-8,([^"]+)"/)?.[1]||"";
  return decodeURIComponent(encoded.replaceAll("&amp;","&"));
}

test("safe HTML banner images remove executable or outbound markup",async()=>{
  const root=fakeElement();
  await render("downloads",{downloads:[dated("Safe Job","2026-08-01",{ImageHTML:'<div onclick="alert(1)" style="color:red;background-image:url(data:text/html,bad)"><script>alert(1)</script><form><input></form><iframe src="https://evil.test"></iframe><a href="javascript:alert(1)">Bad</a><a href="https://example.com">Good</a></div>'})]},{"downloads-content":root});

  const doc=decodeVisualDocument(root.innerHTML);
  assert.doesNotMatch(doc,/<script|\son\w+\s*=|<form|<iframe|javascript:|data:/i);
  assert.match(doc,/https:\/\/example\.com/);
});

function decodeVisualDocument(markup){
  const svg=String(markup||"").match(/src="data:image\/svg\+xml;charset=utf-8,([^"]+)"/)?.[1]||"";
  if(svg)return decodeURIComponent(svg.replaceAll("&amp;","&"));
  const srcdoc=String(markup||"").match(/srcdoc="([^"]*)"/)?.[1]||"";
  return srcdoc.replaceAll("&quot;",'"').replaceAll("&#39;","'").replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&amp;","&");
}

function escapeRegExp(value){
  return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

test("safe HTML documents preserve named entities in hrefs once",async()=>{
  const cases=[
    {label:"amp",html:`<div><a href="https://example.com/path?a=1&amp;b=2">Good</a></div>`,href:'https://example.com/path?a=1&amp;b=2'},
    {label:"quot",html:`<div><a href="https://example.com/path?q=&quot;x&quot;">Good</a></div>`,href:'https://example.com/path?q=&quot;x&quot;'},
    {label:"apos",html:`<div><a href="https://example.com/path?q=&apos;x&apos;">Good</a></div>`,href:"https://example.com/path?q=&#39;x&#39;"},
    {label:"ltgt",html:`<div><a href="https://example.com/path?q=&lt;x&gt;">Good</a></div>`,href:"https://example.com/path?q=&lt;x&gt;"}
  ];

  for(const testCase of cases){
    const root=fakeElement();
    await render("downloads",{downloads:[dated(`Href ${testCase.label}`,"2026-08-01",{ImageHTML:testCase.html})]},{"downloads-content":root});

    const doc=decodeVisualDocument(root.innerHTML);
    if(testCase.href){
      assert.match(doc,new RegExp(`href="${escapeRegExp(testCase.href)}"`));
      assert.doesNotMatch(doc,/&amp;amp;|&quot;amp;|&#39;amp;/);
    }
  }
});

test("safe HTML documents reject entity-obfuscated javascript hrefs",async()=>{
  const cases=[
    {label:"colon",html:`<div><a href="javascript&colon;alert(1)">Bad</a></div>`},
    {label:"tab",html:`<div><a href="java&tab;script:alert(1)">Bad</a></div>`},
    {label:"newline",html:`<div><a href="java&newline;script:alert(1)">Bad</a></div>`}
  ];

  for(const testCase of cases){
    const root=fakeElement();
    await render("downloads",{downloads:[dated(`Href block ${testCase.label}`,"2026-08-01",{ImageHTML:testCase.html})]},{"downloads-content":root});

    const doc=decodeVisualDocument(root.innerHTML);
    assert.doesNotMatch(doc,/javascript:/i);
    assert.doesNotMatch(doc,/href="/i);
  }
});

test("safe HTML documents reject restored numeric and named CSS hazards",async()=>{
  const cases=[
    {label:"image-set",html:`<div style="background:image-set('https://evil.test'); color:rgb(12,34,56)">Visual</div>`,blocked:/image-set\s*\(/i},
    {label:"numeric expression",html:`<div style="width:&#x65;&#x78;&#x70;&#x72;&#x65;&#x73;&#x73;&#x69;&#x6f;&#x6e;(1); color:rgb(12,34,56)">Visual</div>`,blocked:/expression\s*\(/i},
    {label:"numeric url",html:`<div style="background:&#x75;&#x72;&#x6c;(data:text/html,bad); color:rgb(12,34,56)">Visual</div>`,blocked:/data:/i},
    {label:"named colon",html:`<div style="background:url(data&colon;text/html,bad); color:rgb(12,34,56)">Visual</div>`,blocked:/data:/i},
    {label:"named tab",html:`<div style="background:url(data&tab;text/html,bad); color:rgb(12,34,56)">Visual</div>`,blocked:/data:/i},
    {label:"named newline",html:`<div style="background:url(data&newline;text/html,bad); color:rgb(12,34,56)">Visual</div>`,blocked:/data:/i}
  ];

  for(const testCase of cases){
    const root=fakeElement();
    await render("downloads",{downloads:[dated(`CSS ${testCase.label}`,"2026-08-01",{ImageHTML:testCase.html})]},{"downloads-content":root});

    const doc=decodeVisualDocument(root.innerHTML);
    assert.doesNotMatch(doc,testCase.blocked);
    if(testCase.label==="numeric url")assert.doesNotMatch(doc,/url\s*\(/i);
    assert.match(doc,/rgb\(12,34,56\)/i);
  }
});

test("safe HTML documents keep entity-obfuscated data URLs out of CSS",async()=>{
  const root=fakeElement();
  await render("downloads",{downloads:[dated("Data CSS","2026-08-01",{ImageHTML:`<div style="background:url(data&colon;text/html,bad); color:rgb(12,34,56)">Visual</div>`})]},{"downloads-content":root});

  const doc=decodeVisualDocument(root.innerHTML);
  assert.doesNotMatch(doc,/data:/i);
  assert.doesNotMatch(doc,/url\s*\(/i);
  assert.match(doc,/rgb\(12,34,56\)/i);
});
