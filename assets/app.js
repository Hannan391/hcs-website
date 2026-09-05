const CFG = {
  SELF_CONTAINED: true,
  BACKEND_URL: "https://script.google.com/macros/s/AKfycby-ILsCMUcD4_25OSwKAnAG7ajyjXbKfFmFxAmXTDfzxS3bvyWaZN2cJYrDKK7JJD55/exec",
  CONTACT_EMAIL: "alhannancomputers@gmail.com",
  WHATSAPP_NUMBER: "923346395391",
  SOCIAL_LINKS: {
    youtube: "",
    facebook: "",
    instagram: "",
    whatsapp: "https://wa.me/923346395391",
    tiktok: ""
  }
};

(function(){
  "use strict";

  const PAGE=document.body.dataset.page||"home";
  let DATA={settings:{},services:[],jobs:[],downloads:[],products:[]};
  let favourites=new Set(JSON.parse(localStorage.getItem("hcs-favourites")||"[]"));
  const catalogState={search:"",brand:"",stock:"",sort:"newest",view:localStorage.getItem("hcs-catalog-view")||"grid",savedOnly:false};

  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const cleanId=value=>String(value||"").replace(/[^a-zA-Z0-9_-]/g,"");
  const productName=p=>p.ItemName||p.Title||"HCS Product";
  const money=value=>Number(value||0).toLocaleString("en-PK");
  const postTime=item=>{
    const value=item.CreatedAt||item.AdDate||item.UploadedAt||item.Date||item.LastDate||0;
    const time=new Date(value).getTime();
    return Number.isFinite(time)?time:0;
  };
  const newestFirst=(a,b)=>postTime(b)-postTime(a);
  const socialMeta={
    youtube:{label:"YouTube",icon:"bi-youtube"},
    facebook:{label:"Facebook",icon:"bi-facebook"},
    instagram:{label:"Instagram",icon:"bi-instagram"},
    whatsapp:{label:"WhatsApp",icon:"bi-whatsapp"},
    tiktok:{label:"TikTok",icon:"bi-tiktok"}
  };

  function navLink(file,label,key){return `<a href="${file}" class="${PAGE===key?"active":""}">${label}</a>`}

  function renderLayout(){
    const header=document.getElementById("site-header");
    const footer=document.getElementById("site-footer");
    if(header)header.innerHTML=`
      <div class="top-strip"><div class="shell"><span>Hannan Computers & Printers - Bangla Chowk Mamukanjan</span><span><i class="bi bi-whatsapp"></i> 0334-6395391</span></div></div>
      <header class="site-header">
        <div class="shell nav-wrap">
          <a class="brand" href="index.html" aria-label="HCS home"><span class="brand-mark">HCS</span><span class="brand-copy"><b>Hannan Computers</b><small>& Printers</small></span></a>
          <nav class="desktop-nav" aria-label="Main navigation">${navLink("index.html","Home","home")}${navLink("services.html","Services","services")}${navLink("jobs.html","Jobs","jobs")}${navLink("downloads.html","Downloads","downloads")}${navLink("catalog.html","Catalog","catalog")}${navLink("contact.html","Contact","contact")}</nav>
          <div class="header-actions"><a class="saved-link" href="catalog.html?saved=1"><i class="bi bi-heart"></i> Saved <span data-saved-count>${favourites.size}</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-label="Open menu"><i class="bi bi-list"></i></button></div>
        </div>
        <nav class="mobile-nav" aria-label="Mobile navigation">${navLink("index.html","Home","home")}${navLink("services.html","Services","services")}${navLink("jobs.html","Jobs","jobs")}${navLink("downloads.html","Downloads","downloads")}${navLink("catalog.html","Catalog","catalog")}${navLink("contact.html","Contact","contact")}</nav>
      </header>`;
    if(footer)footer.innerHTML=`
      <footer class="site-footer">
        <div class="shell footer-main">
          <div class="footer-info">
            <a class="brand" href="index.html"><span class="brand-mark">HCS</span><span class="brand-copy"><b>Hannan Computers & Printers</b><small>Professional local services</small></span></a>
            <p>Printing, online applications, computer services, job information and quality products - managed professionally in Mamukanjan.</p>
            <div class="social-links" data-social-links></div>
            <div class="footer-links"><div><h3>Quick Links</h3><a href="services.html">Services</a><a href="jobs.html">Latest Jobs</a><a href="catalog.html">Product Catalog</a></div><div><h3>Contact</h3><span data-setting="address">Bangla Chowk Mamukanjan</span><span data-setting="phone">0334-6395391</span><a href="mailto:${esc(CFG.CONTACT_EMAIL||"alhannancomputers@gmail.com")}">${esc(CFG.CONTACT_EMAIL||"alhannancomputers@gmail.com")}</a></div></div>
          </div>
          <div class="footer-form-wrap">
            <h2>Contact Us</h2><p>This form sends your message directly to our email inbox.</p>
            <form class="contact-form" data-contact-form>
              <div class="form-row"><label>Name<input name="name" required maxlength="80" autocomplete="name" placeholder="Your name"></label><label>Phone<input name="phone" required maxlength="30" inputmode="tel" autocomplete="tel" placeholder="03xx xxxxxxx"></label></div>
              <label>Message<textarea name="message" required maxlength="2000" rows="4" placeholder="How can we help?"></textarea></label>
              <input type="hidden" name="subject" value="Website footer contact message"><input class="hp-field" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
              <button class="button gold" type="submit"><i class="bi bi-envelope"></i> Send to Email</button><p class="form-status" role="status"></p>
            </form>
          </div>
        </div>
        <div class="footer-bottom"><div class="shell"><span>© ${new Date().getFullYear()} HCS - Hannan Computers & Printers</span><a href="${esc(CFG.BACKEND_URL||"#")}" target="_blank" rel="noopener">Admin</a></div></div>
      </footer>`;

    const toggle=document.querySelector(".menu-toggle");
    const mobile=document.querySelector(".mobile-nav");
    toggle?.addEventListener("click",()=>{const open=mobile.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.innerHTML=`<i class="bi ${open?"bi-x-lg":"bi-list"}"></i>`});
    document.querySelectorAll("[data-contact-form]").forEach(bindContactForm);
    renderSocialLinks();
  }

  function mergedSocialLinks(){
    const s=DATA.settings||{};
    const configured=CFG.SOCIAL_LINKS||{};
    return {
      youtube:s.YouTube||s.youtube||configured.youtube||"",
      facebook:s.Facebook||s.facebook||configured.facebook||"",
      instagram:s.Instagram||s.instagram||configured.instagram||"",
      whatsapp:s.WhatsAppChannel||s.whatsapp||configured.whatsapp||"",
      tiktok:s.TikTok||s.tiktok||configured.tiktok||""
    };
  }

  function safeSocialUrl(value){
    const text=String(value||"").trim();
    if(!text)return "";
    if(/^https?:\/\//i.test(text))return text;
    if(/^wa\.me\//i.test(text))return `https://${text}`;
    return `https://${text.replace(/^\/+/,"")}`;
  }

  function renderSocialLinks(){
    const links=mergedSocialLinks();
    document.querySelectorAll("[data-social-links]").forEach(container=>{
      container.innerHTML=Object.entries(socialMeta).map(([key,meta])=>{
        const url=safeSocialUrl(links[key]);
        return `<a class="social-link ${url?"":"disabled"}" href="${esc(url||"#")}" ${url?'target="_blank" rel="noopener"':'aria-disabled="true" data-empty-social="true"'} title="${url?meta.label:meta.label+" link will be added soon"}"><i class="bi ${meta.icon}"></i><span>${meta.label}</span></a>`;
      }).join("");
    });
  }

  function bindContactForm(form){
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const status=form.querySelector(".form-status");
      const button=form.querySelector("button[type=submit]");
      const payload=new URLSearchParams(new FormData(form));
      payload.set("action","contact");payload.set("page",location.href);payload.set("recipient",CFG.CONTACT_EMAIL||"alhannancomputers@gmail.com");
      if(payload.get("company"))return;
      if(!CFG.BACKEND_URL||!CFG.BACKEND_URL.startsWith("http")){status.className="form-status error";status.textContent="Email service is not configured yet.";return}
      button.disabled=true;status.className="form-status";status.textContent="Sending your message...";
      try{
        await fetch(CFG.BACKEND_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:payload.toString()});
        form.reset();status.className="form-status success";status.textContent="Message sent successfully by email. Thank you!";
      }catch(error){status.className="form-status error";status.textContent="Message could not be sent. Please try again."}
      finally{button.disabled=false}
    });
  }

  function remoteImage(url){
    const text=String(url||"").trim();
    const match=text.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)||text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match?`https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600`:text;
  }

  function localImage(item,group,field="ImageURL"){
    if(CFG.SELF_CONTAINED)return remoteImage(item[field]);
    const id=cleanId(item.ID);if(!id)return remoteImage(item[field]);
    if(group==="services")return `assets/services/${id}-ImageURL.jpg`;
    if(group==="products")return `assets/products/${id}-ImageURL.jpg`;
    if(group==="jobs"&&field==="BannerURL")return `assets/jobs/${id}-BannerURL.jpg`;
    return remoteImage(item[field]);
  }

  function imageButton(item,group,title,field="ImageURL",className="image-button"){
    const local=localImage(item,group,field),fallback=remoteImage(item[field]);
    if(!local)return `<div class="${className} placeholder-image"><span>HCS</span></div>`;
    return `<button class="${className}" type="button" data-lightbox-src="${esc(local)}" data-lightbox-title="${esc(title)}" aria-label="Open complete image of ${esc(title)}"><img src="${esc(local)}" data-fallback="${esc(fallback)}" alt="${esc(title)}" loading="lazy" decoding="async" fetchpriority="low"><span class="image-hint"><i class="bi bi-arrows-fullscreen"></i> View & zoom</span></button>`;
  }

  function serviceCard(item){
    const title=item.Title||"HCS Service";
    return `<article class="content-card">${imageButton(item,"services",title)}<div class="card-body"><span class="category">${esc(item.Category||"HCS Service")}</span><h3>${esc(title)}</h3><p>${esc(item.Description||"Professional service by HCS.")}</p><div class="card-actions"><a class="button primary small" href="${waUrl(item.WhatsAppText||`Mujhe ${title} ki details chahiye.`)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Ask Details</a></div></div></article>`;
  }

  function waUrl(message){return `https://wa.me/${encodeURIComponent(String(CFG.WHATSAPP_NUMBER||"923346395391").replace(/\D/g,""))}?text=${encodeURIComponent(message||"")}`}

  function jobShareUrl(job){
    const id=String(job?.ID||"");
    if(CFG.BACKEND_URL&&CFG.BACKEND_URL.startsWith("http"))return `${CFG.BACKEND_URL}${CFG.BACKEND_URL.includes("?")?"&":"?"}share=job&id=${encodeURIComponent(id)}`;
    return new URL(`jobs.html?job=${encodeURIComponent(id)}#job-${cleanId(id)}`,location.href).href;
  }

  function jobShareText(job){
    const title=job.Title||"Job Opportunity",lastDate=job.ExtendedDate||job.LastDate||"Not specified";
    return `*${title}*\n${job.Department?`Department: ${job.Department}\n`:""}${job.Location?`Location: ${job.Location}\n`:""}Last Date: ${lastDate}\n\nComplete job details:`;
  }

  function shareJobWhatsApp(id){
    const job=(DATA.jobs||[]).find(item=>String(item.ID)===String(id));if(!job)return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${jobShareText(job)}\n${jobShareUrl(job)}`)}`,"_blank","noopener");
  }

  async function shareJob(id){
    const job=(DATA.jobs||[]).find(item=>String(item.ID)===String(id));if(!job)return;
    const url=jobShareUrl(job),text=jobShareText(job);
    if(navigator.share){try{await navigator.share({title:job.Title||"HCS Job Opportunity",text,url});return}catch(error){if(error?.name==="AbortError")return}}
    try{await navigator.clipboard.writeText(`${text}\n${url}`);toast("Job details and link copied. You can share them anywhere.")}
    catch(error){window.prompt("Copy this job link:",url)}
  }

  function productCard(item){
    const title=productName(item),saved=favourites.has(String(item.ID)),stock=isInStock(item),isNew=isNewArrival(item);
    return `<article class="product-card" data-product-id="${esc(item.ID)}">
      <button class="favourite-button ${saved?"saved":""}" type="button" data-favourite="${esc(item.ID)}" aria-label="${saved?"Remove from":"Save to"} favourites"><i class="bi ${saved?"bi-heart-fill":"bi-heart"}"></i></button>
      <div class="product-badges">${isNew?'<span class="badge new">New Arrival</span>':""}<span class="badge">${esc(item.Category||"Product")}</span></div>
      ${imageButton(item,"products",title,"ImageURL","product-image")}
      <div class="product-body"><span class="product-code">Product Code: ${esc(item.ID||"N/A")}</span><h3>${esc(title)}</h3><div class="product-brand">Brand: ${esc(item.Brand||"HCS")}</div><div class="price-row"><span class="price">Rs ${money(item.Price)}</span><span class="stock ${stock?"":"out"}">${stock?"In Stock":"Out of Stock"}</span></div>
      <div class="product-actions"><button class="button primary small" type="button" data-details="${esc(item.ID)}">View Details</button><button class="icon-button" type="button" data-share-product="${esc(item.ID)}" aria-label="Share product"><i class="bi bi-share"></i></button><a class="icon-button" href="${waUrl(item.WhatsAppText||`Mujhe ${title} (${item.ID}) order karna hai.`)}" target="_blank" rel="noopener" aria-label="Order on WhatsApp"><i class="bi bi-whatsapp"></i></a></div></div>
    </article>`;
  }

  function isInStock(item){
    const status=String(item.StockStatus||"").toLowerCase();
    if(/out|unavailable|sold/.test(status)||Number(item.Quantity)===0)return false;
    return true;
  }

  function isNewArrival(item){
    if(!item.CreatedAt)return false;
    const created=new Date(item.CreatedAt);if(Number.isNaN(created.getTime()))return false;
    return (Date.now()-created.getTime())/(86400000)<=60;
  }

  async function loadData(){
    if(window.HCS_INLINE_DATA){
      DATA=window.HCS_INLINE_DATA;renderPage();applySettings();
    }else{
      try{
        const response=await fetch("data/live-data.json",{cache:"no-store"});
        if(response.ok){DATA=await response.json();renderPage();applySettings()}
      }catch(error){renderPage()}
    }
    if(CFG.BACKEND_URL&&CFG.BACKEND_URL.startsWith("http"))loadRemoteData();
  }

  function loadRemoteData(){
    const script=document.createElement("script");
    const cleanup=()=>script.remove();
    window.hcsDataCallback=data=>{if(data&&!data.error){DATA=data;renderPage();applySettings()}cleanup()};
    script.src=`${CFG.BACKEND_URL}${CFG.BACKEND_URL.includes("?")?"&":"?"}api=public&callback=hcsDataCallback&_=${Date.now()}`;
    script.onerror=cleanup;document.body.appendChild(script);setTimeout(cleanup,9000);
  }

  function applySettings(){
    const s=DATA.settings||{};
    document.querySelectorAll('[data-setting="address"]').forEach(el=>el.textContent=s.address||s.Address||"Bangla Chowk Mamukanjan");
    document.querySelectorAll('[data-setting="phone"]').forEach(el=>el.textContent=s.phone||s.Phone||"0334-6395391");
    renderSocialLinks();
  }

  function renderPage(){
    if(PAGE==="home")renderHome();
    if(PAGE==="services")renderServices();
    if(PAGE==="jobs")renderJobs();
    if(PAGE==="downloads")renderDownloads();
    if(PAGE==="catalog")renderCatalog();
  }

  function renderHome(){
    const services=document.getElementById("home-services");if(services)services.innerHTML=(DATA.services||[]).slice(0,3).map(serviceCard).join("")||empty("Services will appear here soon.","bi-grid");
    const product=document.getElementById("home-product");if(product)product.innerHTML=(DATA.products||[]).length?productCard(DATA.products[0]):empty("Products will appear here soon.","bi-bag");
  }

  function renderServices(){
    const grid=document.getElementById("services-grid"),input=document.getElementById("service-search");if(!grid)return;
    const draw=()=>{const q=String(input?.value||"").trim().toLowerCase();const rows=(DATA.services||[]).filter(x=>[x.Title,x.Category,x.Description].join(" ").toLowerCase().includes(q));grid.innerHTML=rows.map(serviceCard).join("")||empty("No matching services found.","bi-search");document.getElementById("service-count").textContent=`${rows.length} service${rows.length===1?"":"s"}`};
    if(input&&!input.dataset.bound){input.addEventListener("input",draw);input.dataset.bound="1"}draw();
  }

  function renderJobs(){
    const list=document.getElementById("jobs-list"),input=document.getElementById("job-search");if(!list)return;
    const draw=()=>{const q=String(input?.value||"").trim().toLowerCase();const rows=(DATA.jobs||[]).filter(x=>[x.Title,x.Department,x.Location,x.Qualification,x.Age,x.Category,x.Description].join(" ").toLowerCase().includes(q)).sort(newestFirst);list.innerHTML=rows.map((job,index)=>{
      const title=job.Title||"Job Opportunity";
      const description=job.Description||job.Qualification||"";
      const descriptionId=`job-description-${cleanId(job.ID)||index}`;
      const jobId=String(job.ID||"");
      return `<article class="job-card" id="job-${cleanId(jobId)}" data-job-card="${esc(jobId)}">${imageButton(job,"jobs",title,"BannerURL")}<div class="job-content"><span class="category">${esc(job.Department||"Job Opportunity")}</span><h2>${esc(title)}</h2>${description?`<div class="job-description-wrap"><p class="job-description" id="${descriptionId}">${esc(description)}</p><button class="job-read-more" type="button" data-job-read-more aria-expanded="false" aria-controls="${descriptionId}">Read More <i class="bi bi-chevron-down" aria-hidden="true"></i></button></div>`:""}<div class="job-meta"><div class="meta-box"><small>Qualification</small><b>${esc(job.Qualification||"See advertisement")}</b></div><div class="meta-box"><small>Age</small><b>${esc(job.Age||job.AgeLimit||"See advertisement")}</b></div><div class="meta-box"><small>Category</small><b>${esc(job.Category||"General")}</b></div><div class="meta-box"><small>Last Date</small><b>${esc(job.ExtendedDate||job.LastDate||"Not specified")}</b></div><div class="meta-box"><small>Status</small><b class="status">${esc(job.ComputedStatus||job.Status||"Open")}</b></div></div><div class="card-actions">${job.ApplyLink?`<a class="button primary small" href="${esc(job.ApplyLink)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Apply Officially</a>`:""}${job.OfficialAdURL?`<a class="button subtle small" href="${esc(job.OfficialAdURL)}" target="_blank" rel="noopener"><i class="bi bi-file-earmark-pdf"></i> Full Advertisement</a>`:""}<a class="button subtle small" href="${waUrl(`Mujhe ${title} ki details chahiye.`)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Ask HCS</a></div><div class="job-share-row"><span><i class="bi bi-share"></i> Share this job</span><button class="job-share-button whatsapp" type="button" data-share-job-whatsapp="${esc(jobId)}"><i class="bi bi-whatsapp"></i> WhatsApp</button><button class="job-share-button" type="button" data-share-job="${esc(jobId)}"><i class="bi bi-share-fill"></i> More</button></div></div></article>`;
    }).join("")||empty("No matching jobs found.","bi-briefcase");document.getElementById("job-count").textContent=`${rows.length} job${rows.length===1?"":"s"}`;const sharedId=new URLSearchParams(location.search).get("job");if(sharedId){const sharedCard=[...list.querySelectorAll("[data-job-card]")].find(card=>card.dataset.jobCard===sharedId);if(sharedCard){sharedCard.classList.add("shared-job");if(!list.dataset.sharedJobFocused){list.dataset.sharedJobFocused="1";requestAnimationFrame(()=>sharedCard.scrollIntoView({behavior:"smooth",block:"center"}))}}}};
    if(!list.dataset.readMoreBound){list.addEventListener("click",event=>{const button=event.target.closest("[data-job-read-more]");if(!button)return;const description=document.getElementById(button.getAttribute("aria-controls"));if(!description)return;const expanded=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!expanded));description.classList.toggle("expanded",!expanded);button.innerHTML=`${expanded?"Read More":"Read Less"} <i class="bi ${expanded?"bi-chevron-down":"bi-chevron-up"}" aria-hidden="true"></i>`});list.dataset.readMoreBound="1"}
    if(input&&!input.dataset.bound){input.addEventListener("input",draw);input.dataset.bound="1"}draw();
  }

  function renderDownloads(){
    const root=document.getElementById("downloads-content");if(!root)return;
    const groups=[{title:"Software & Tools",rows:(DATA.downloads||[]).filter(x=>String(x.Category||"").toLowerCase()!=="customer data").sort(newestFirst)},{title:"Customer Data",rows:(DATA.downloads||[]).filter(x=>String(x.Category||"").toLowerCase()==="customer data").sort(newestFirst)}];
    root.innerHTML=groups.map(group=>`<section class="download-group"><h2>${group.title}</h2><div class="card-grid card-grid-3">${group.rows.map((item,index)=>{const description=item.Description||"";const descriptionId=`download-description-${cleanId(item.ID)||index}`;return `<article class="content-card">${item.ImageURL?imageButton(item,"downloads",item.Title||"Download"):""}<div class="card-body"><span class="category">${esc(item.Category||"Download")}</span><h3>${esc(item.Title||"Download")}</h3>${description?`<div class="download-description-wrap"><p class="download-description" id="${descriptionId}">${esc(description)}</p><button class="job-read-more" type="button" data-download-read-more aria-expanded="false" aria-controls="${descriptionId}">Read More <i class="bi bi-chevron-down" aria-hidden="true"></i></button></div>`:""}<div class="card-actions">${item.URL?`<a class="button primary small" href="${esc(item.URL)}" target="_blank" rel="noopener"><i class="bi bi-download"></i> Download</a>`:""}</div></div></article>`}).join("")||empty("No files added yet.","bi-cloud-arrow-down")}</div></section>`).join("");
    if(!root.dataset.readMoreBound){root.addEventListener("click",event=>{const button=event.target.closest("[data-download-read-more]");if(!button)return;const description=document.getElementById(button.getAttribute("aria-controls"));if(!description)return;const expanded=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!expanded));description.classList.toggle("expanded",!expanded);button.innerHTML=`${expanded?"Read More":"Read Less"} <i class="bi ${expanded?"bi-chevron-down":"bi-chevron-up"}" aria-hidden="true"></i>`});root.dataset.readMoreBound="1"}
  }

  function empty(message,icon){return `<div class="empty-state"><i class="bi ${icon}"></i>${esc(message)}</div>`}

  function setupCatalog(){
    if(PAGE!=="catalog")return;
    const params=new URLSearchParams(location.search);catalogState.savedOnly=params.get("saved")==="1";
    const bindings={"product-search":"search","brand-filter":"brand","stock-filter":"stock","sort-products":"sort"};
    Object.entries(bindings).forEach(([id,key])=>document.getElementById(id)?.addEventListener(id==="product-search"?"input":"change",event=>{catalogState[key]=event.target.value;renderCatalogProducts()}));
    document.getElementById("reset-filters")?.addEventListener("click",()=>{Object.assign(catalogState,{search:"",brand:"",stock:"",sort:"newest",savedOnly:false});["product-search","brand-filter","stock-filter"].forEach(id=>document.getElementById(id).value="");document.getElementById("sort-products").value="newest";renderCatalogProducts()});
    document.getElementById("saved-only")?.addEventListener("click",()=>{catalogState.savedOnly=!catalogState.savedOnly;renderCatalogProducts()});
    document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{catalogState.view=button.dataset.view;localStorage.setItem("hcs-catalog-view",catalogState.view);renderCatalogProducts()}));
    document.getElementById("open-filters")?.addEventListener("click",()=>document.getElementById("filter-panel").classList.add("open"));
    document.getElementById("close-filters")?.addEventListener("click",()=>document.getElementById("filter-panel").classList.remove("open"));
  }

  function renderCatalog(){
    const brand=document.getElementById("brand-filter");
    if(brand){const current=brand.value;const brands=[...new Set((DATA.products||[]).map(p=>String(p.Brand||"HCS").trim()).filter(Boolean))].sort();brand.innerHTML='<option value="">All brands</option>'+brands.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");brand.value=current}
    renderCatalogProducts();
  }

  function renderCatalogProducts(){
    const grid=document.getElementById("products-grid");if(!grid)return;
    let rows=[...(DATA.products||[])];const q=catalogState.search.trim().toLowerCase();
    if(q)rows=rows.filter(p=>[productName(p),p.ID,p.Category,p.Brand,p.ProductDetails,p.Specifications].join(" ").toLowerCase().includes(q));
    if(catalogState.brand)rows=rows.filter(p=>String(p.Brand||"HCS")===catalogState.brand);
    if(catalogState.stock)rows=rows.filter(p=>catalogState.stock==="in"?isInStock(p):!isInStock(p));
    if(catalogState.savedOnly)rows=rows.filter(p=>favourites.has(String(p.ID)));
    rows.sort((a,b)=>catalogState.sort==="price-low"?Number(a.Price||0)-Number(b.Price||0):catalogState.sort==="price-high"?Number(b.Price||0)-Number(a.Price||0):catalogState.sort==="alpha"?productName(a).localeCompare(productName(b)):new Date(b.CreatedAt||0)-new Date(a.CreatedAt||0));
    grid.className=`product-grid ${catalogState.view==="list"?"list-view":""}`;grid.innerHTML=rows.map(productCard).join("")||empty(catalogState.savedOnly?"You have not saved any matching products.":"No matching products found.","bi-bag");
    document.getElementById("product-count").textContent=`${rows.length} product${rows.length===1?"":"s"}`;
    const saved=document.getElementById("saved-only");if(saved)saved.setAttribute("aria-pressed",String(catalogState.savedOnly));
    document.querySelectorAll("[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===catalogState.view));
    renderActiveFilters();updateSavedCount();
  }

  function renderActiveFilters(){
    const root=document.getElementById("active-filters");if(!root)return;const labels=[];
    if(catalogState.search)labels.push(`Search: ${catalogState.search}`);if(catalogState.brand)labels.push(`Brand: ${catalogState.brand}`);if(catalogState.stock)labels.push(catalogState.stock==="in"?"In stock":"Out of stock");if(catalogState.savedOnly)labels.push("Saved only");
    root.innerHTML=labels.map(label=>`<span class="filter-chip"><i class="bi bi-funnel"></i>${esc(label)}</span>`).join("");
  }

  function updateSavedCount(){document.querySelectorAll("[data-saved-count],#saved-counter").forEach(el=>el.textContent=favourites.size)}

  function toggleFavourite(id){
    const key=String(id);favourites.has(key)?favourites.delete(key):favourites.add(key);localStorage.setItem("hcs-favourites",JSON.stringify([...favourites]));updateSavedCount();renderPage();
  }

  async function shareProduct(id){
    const p=(DATA.products||[]).find(x=>String(x.ID)===String(id));if(!p)return;const share={title:productName(p),text:`${productName(p)} - Rs ${money(p.Price)} | Product code: ${p.ID}`,url:`${location.origin}${location.pathname}?product=${encodeURIComponent(p.ID)}`};
    try{if(navigator.share)await navigator.share(share);else{await navigator.clipboard.writeText(`${share.text}\n${share.url}`);toast("Product link copied.")}}catch(error){if(error.name!=="AbortError")toast("Sharing is not available on this device.")}
  }

  function openProduct(id){
    const p=(DATA.products||[]).find(x=>String(x.ID)===String(id));if(!p)return;const title=productName(p),details=String(p.ProductDetails||p.Specifications||p.Description||"Details will be added soon.").split(/\n|•/).map(x=>x.trim()).filter(Boolean);
    const modal=document.getElementById("product-modal");const body=modal.querySelector(".product-detail");const src=localImage(p,"products");
    body.innerHTML=`<div class="product-detail-image"><img src="${esc(src)}" data-fallback="${esc(remoteImage(p.ImageURL))}" alt="${esc(title)}" data-lightbox-src="${esc(src)}" data-lightbox-title="${esc(title)}"></div><div class="product-detail-copy"><span class="category">${esc(p.Category||"HCS Product")}</span><h2>${esc(title)}</h2><div class="product-code">Product Code: ${esc(p.ID)}</div><span class="price">Rs ${money(p.Price)}</span><p><b>Brand:</b> ${esc(p.Brand||"HCS")} &nbsp; · &nbsp; <b class="${isInStock(p)?"status":"stock out"}">${isInStock(p)?"In Stock":"Out of Stock"}</b></p><h3>Complete Specifications</h3><ul class="spec-list">${details.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><a class="button primary" href="${waUrl(p.WhatsAppText||`Mujhe ${title} (${p.ID}) order karna hai.`)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Order on WhatsApp</a></div>`;
    openModal(modal);
  }

  function createModals(){
    document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer"><div class="modal-backdrop" data-close-modal></div><div class="lightbox-dialog"><div class="lightbox-top"><span class="lightbox-title"></span><button type="button" data-close-modal aria-label="Close image"><i class="bi bi-x-lg"></i></button></div><div class="lightbox-stage"><img alt="Full image"></div><div class="lightbox-controls"><button type="button" data-zoom-out aria-label="Zoom out"><i class="bi bi-dash-lg"></i></button><span class="zoom-level">100%</span><button type="button" data-zoom-in aria-label="Zoom in"><i class="bi bi-plus-lg"></i></button><button type="button" data-zoom-reset aria-label="Fit to screen"><i class="bi bi-arrows-angle-contract"></i></button></div></div></div><div class="modal" id="product-modal" role="dialog" aria-modal="true" aria-label="Product details"><div class="modal-backdrop" data-close-modal></div><div class="product-modal-card"><button class="icon-button product-modal-close" type="button" data-close-modal aria-label="Close product details"><i class="bi bi-x-lg"></i></button><div class="product-detail"></div></div></div><div id="toast" class="toast" role="status"></div>`);
    setupLightbox();
  }

  function openModal(modal){document.querySelectorAll(".modal.open").forEach(closeModal);modal.classList.add("open");document.body.classList.add("modal-open")}
  function closeModal(modal){modal.classList.remove("open");if(!document.querySelector(".modal.open"))document.body.classList.remove("modal-open")}

  function setupLightbox(){
    const modal=document.getElementById("lightbox"),img=modal.querySelector("img"),stage=modal.querySelector(".lightbox-stage"),level=modal.querySelector(".zoom-level");
    let scale=1,x=0,y=0,drag=null,pinch=null;const pointers=new Map();
    const clamp=v=>Math.max(1,Math.min(5,v));
    const draw=()=>{if(scale===1){x=0;y=0}img.style.transform=`translate(${x}px,${y}px) scale(${scale})`;level.textContent=`${Math.round(scale*100)}%`};
    const setScale=value=>{scale=clamp(value);draw()};
    window.openHcsLightbox=(src,title)=>{img.src=src;img.alt=title||"Full image";modal.querySelector(".lightbox-title").textContent=title||"Image";scale=1;x=0;y=0;draw();openModal(modal)};
    modal.querySelector("[data-zoom-in]").addEventListener("click",()=>setScale(scale+.25));modal.querySelector("[data-zoom-out]").addEventListener("click",()=>setScale(scale-.25));modal.querySelector("[data-zoom-reset]").addEventListener("click",()=>setScale(1));
    stage.addEventListener("wheel",event=>{event.preventDefault();setScale(scale+(event.deltaY<0?.2:-.2))},{passive:false});stage.addEventListener("dblclick",()=>setScale(scale===1?2.25:1));
    stage.addEventListener("pointerdown",event=>{stage.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===1)drag={startX:event.clientX,startY:event.clientY,x,y};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale};drag=null}});
    stage.addEventListener("pointermove",event=>{if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];setScale(pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance)}else if(pointers.size===1&&drag&&scale>1){x=drag.x+event.clientX-drag.startX;y=drag.y+event.clientY-drag.startY;draw()}});
    const release=event=>{pointers.delete(event.pointerId);pinch=null;drag=null};stage.addEventListener("pointerup",release);stage.addEventListener("pointercancel",release);
  }

  function toast(message){const box=document.getElementById("toast");box.textContent=message;box.classList.add("show");setTimeout(()=>box.classList.remove("show"),2300)}

  document.addEventListener("click",event=>{
    const emptySocial=event.target.closest("[data-empty-social]");if(emptySocial){event.preventDefault();toast("This social media link will be added soon.");return}
    const lightbox=event.target.closest("[data-lightbox-src]");if(lightbox){event.preventDefault();const img=lightbox.matches("img")?lightbox:lightbox.querySelector("img");window.openHcsLightbox(img?.currentSrc||lightbox.dataset.lightboxSrc,lightbox.dataset.lightboxTitle||img?.alt);return}
    const favourite=event.target.closest("[data-favourite]");if(favourite){toggleFavourite(favourite.dataset.favourite);return}
    const detail=event.target.closest("[data-details]");if(detail){openProduct(detail.dataset.details);return}
    const share=event.target.closest("[data-share-product]");if(share){shareProduct(share.dataset.shareProduct);return}
    const jobWhatsApp=event.target.closest("[data-share-job-whatsapp]");if(jobWhatsApp){shareJobWhatsApp(jobWhatsApp.dataset.shareJobWhatsapp);return}
    const jobShare=event.target.closest("[data-share-job]");if(jobShare){shareJob(jobShare.dataset.shareJob);return}
    const close=event.target.closest("[data-close-modal]");if(close)closeModal(close.closest(".modal"));
  });
  document.addEventListener("error",event=>{const img=event.target;if(img.tagName!=="IMG")return;const fallback=img.dataset.fallback;if(fallback&&!img.dataset.triedFallback){img.dataset.triedFallback="1";img.src=fallback}else{img.style.opacity="0"}},true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll(".modal.open").forEach(closeModal)});

  renderLayout();createModals();setupCatalog();updateSavedCount();loadData();
})();
