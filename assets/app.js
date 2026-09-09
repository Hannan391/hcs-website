const CFG = {
  SELF_CONTAINED: true,
  BACKEND_URL: "https://script.google.com/macros/s/AKfycby-ILsCMUcD4_25OSwKAnAG7ajyjXbKfFmFxAmXTDfzxS3bvyWaZN2cJYrDKK7JJD55/exec",
  CONTACT_EMAIL: "alhannancomputers@gmail.com",
  WHATSAPP_NUMBER: "923346395391",
  SOCIAL_LINKS: {
    youtube: "https://www.youtube.com/@hannancs021",
    facebook: "https://web.facebook.com/hannancs",
    instagram: "https://www.instagram.com/hannancomputers",
    whatsapp: "https://whatsapp.com/channel/0029VaFbzpy2UPBMgZqZUQ1L",
    tiktok: "https://www.tiktok.com/@hannan_computers"
  }
};

(function(){
  "use strict";

  const PAGE=document.body.dataset.page||"home";
  let DATA={settings:{},services:[],jobs:[],downloads:[],products:[],schemes:[],education:[]};
  let favourites=new Set(JSON.parse(localStorage.getItem("hcs-favourites")||"[]"));
  const catalogState={search:"",brand:"",stock:"",sort:"newest",view:localStorage.getItem("hcs-catalog-view")||"grid",savedOnly:false};
  const jobSearchState={query:"",department:"",category:"",location:""};

  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const cleanId=value=>String(value||"").replace(/[^a-zA-Z0-9_-]/g,"");
  const productName=p=>p.ItemName||p.Title||"HCS Product";
  const money=value=>Number(value||0).toLocaleString("en-PK");
  const postTime=item=>{
    const value=item.CreatedAt||item.AdDate||item.UploadedAt||item.Date||item.LastDate||item.PublishDate||0;
    const time=new Date(value).getTime();
    return Number.isFinite(time)&&time?time:idTimestamp(item.ID);
  };
  const idTimestamp=id=>{const text=String(id||""),epoch=text.match(/(?:^|\D)(1\d{12})(?:\D|$)/);if(epoch){const value=Number(epoch[1]);if(value>=946684800000&&value<=4102444800000)return value}const match=text.match(/(?:^|\D)((?:19|20)\d{6})(\d{6})?(?:\D|$)/);if(!match)return 0;const date=match[1],time=match[2]||"000000",hour=Number(time.slice(0,2)),minute=Number(time.slice(2,4)),second=Number(time.slice(4,6));if(hour>23||minute>59||second>59)return 0;const value=Date.UTC(Number(date.slice(0,4)),Number(date.slice(4,6))-1,Number(date.slice(6,8)),hour,minute,second),parsed=new Date(value);return parsed.getUTCFullYear()===Number(date.slice(0,4))&&parsed.getUTCMonth()===Number(date.slice(4,6))-1&&parsed.getUTCDate()===Number(date.slice(6,8))?value:0};
  const newestFirst=(a,b)=>postTime(b)-postTime(a);
  const currentData=data=>{const copy={...(data||{})};copy.jobs=[...(copy.jobs||[])].filter(job=>{const hasEpoch=Object.prototype.hasOwnProperty.call(job,"PublicHiddenFrom"),epoch=Number(job.PublicHiddenFrom);if(!hasEpoch||!Number.isFinite(epoch)||epoch<0)return !(job.LastDate||job.ExtendedDate);return epoch===0||Date.now()<epoch});return copy};
  const highlight=(value,query)=>{
    const tokens=String(query||"").trim().split(/\s+/).filter(Boolean).map(token=>token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
    if(!tokens.length)return esc(value);
    const pattern=new RegExp(`(${tokens.join("|")})`,"ig");
    return String(value||"").split(pattern).map((part,index)=>index%2?`<mark>${esc(part)}</mark>`:esc(part)).join("");
  };
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
          <nav class="desktop-nav" aria-label="Main navigation">${navLink("index.html","Home","home")}${navLink("services.html","Services","services")}${navLink("jobs.html","Jobs","jobs")}${navLink("govt-schemes.html","Govt Schemes","schemes")}${navLink("education-updates.html","Education Updates","education")}${navLink("downloads.html","Downloads","downloads")}${navLink("catalog.html","Catalog","catalog")}${navLink("contact.html","Contact","contact")}</nav>
          <div class="header-actions"><a class="saved-link" href="catalog.html?saved=1"><i class="bi bi-heart"></i> Saved <span data-saved-count>${favourites.size}</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-label="Open menu"><i class="bi bi-list"></i></button></div>
        </div>
        <nav class="mobile-nav" aria-label="Mobile navigation">${navLink("index.html","Home","home")}${navLink("services.html","Services","services")}${navLink("jobs.html","Jobs","jobs")}${navLink("govt-schemes.html","Govt Schemes","schemes")}${navLink("education-updates.html","Education Updates","education")}${navLink("downloads.html","Downloads","downloads")}${navLink("catalog.html","Catalog","catalog")}${navLink("contact.html","Contact","contact")}</nav>
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

  function remoteImage(url,size=640){
    const text=String(url||"").trim();
    const match=text.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)||text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match?`https://drive.google.com/thumbnail?id=${match[1]}&sz=w${size}`:text;
  }

  function localImage(item,group,field="ImageURL",size=640){
    if(CFG.SELF_CONTAINED)return remoteImage(item[field],size);
    const id=cleanId(item.ID);if(!id)return remoteImage(item[field],size);
    if(group==="services")return `assets/services/${id}-ImageURL.jpg`;
    if(group==="products")return `assets/products/${id}-ImageURL.jpg`;
    if(group==="jobs"&&field==="BannerURL")return `assets/jobs/${id}-BannerURL.jpg`;
    return remoteImage(item[field],size);
  }

  function imageButton(item,group,title,field="ImageURL",className="image-button"){
    const thumbnailSize=group==="jobs"?640:480;
    const thumbnail=localImage(item,group,field,thumbnailSize),fallback=remoteImage(item[field],thumbnailSize),fullImage=remoteImage(item[field],1600);
    if(!thumbnail)return `<div class="${className} placeholder-image"><span>HCS</span></div>`;
    return `<button class="${className}" type="button" data-lightbox-src="${esc(fullImage||thumbnail)}" data-lightbox-title="${esc(title)}" aria-label="Open complete image of ${esc(title)}"><img src="${esc(thumbnail)}" data-fallback="${esc(fallback)}" alt="${esc(title)}" loading="lazy" decoding="async" fetchpriority="low" width="640" height="420"><span class="image-hint"><i class="bi bi-arrows-fullscreen"></i> View & zoom</span></button>`;
  }

  const SAFE_BANNER_TAGS=["div","section","span","p","h1","h2","h3","strong","em","a","button","ul","ol","li","br"];
  const BLOCKED_BANNER_CONTAINERS=["script","style","iframe","form","object","svg","math","template","picture","video","audio","canvas","noscript","xmp","plaintext","textarea","title"];
  const BLOCKED_BANNER_VOID_TAGS=["base","embed","img","link","meta","source"];
  const SAFE_BANNER_CSS=["color","background","background-color","padding","margin","border","border-radius","text-align","font-size","font-weight","line-height","width","max-width","height","min-height","display","gap","justify-content","align-items"];
  const SAFE_BANNER_CSS_FUNCTIONS=["rgb","rgba","hsl","hsla","linear-gradient","radial-gradient","repeating-linear-gradient","repeating-radial-gradient","calc","min","max","clamp"];

  function decodeBannerEntities(value){
    return String(value||"").replace(/&#(?:x([0-9a-f]+)|(\d+));?/gi,(match,hex,decimal)=>{
      const code=parseInt(hex||decimal,hex?16:10);
      return isNaN(code)||code<1||code>1114111?"":String.fromCodePoint(code);
    }).replace(/&(amp|quot|apos|lt|gt|colon|tab|newline);/gi,(match,name)=>({amp:"&",quot:'"',apos:"'",lt:"<",gt:">",colon:":",tab:"\t",newline:"\n"})[name.toLowerCase()]);
  }

  function safeBannerUrl(value){
    const text=decodeBannerEntities(value).trim();
    if(!text)return "";
    if(text.length>1000)return "";
    return /^https?:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?(?:[/?#]|$)/i.test(text)&&!/[\s\\]/.test(text)?text:"";
  }

  function sanitizeBannerClass_(value){
    return String(value||"").split(/\s+/).filter(token=>/^[a-z0-9_-]{1,80}$/i.test(token)).slice(0,20).join(" ");
  }

  function safeBannerCssValue_(value){
    if(!value||value.length>300||/url|expression|javascript|@import|[\\\u0000-\u001f\u007f]|\/\*|\*\//i.test(value))return false;
    const functions=String(value).match(/[a-z_-][a-z0-9_-]*\s*\(/gi)||[];
    return functions.every(name=>SAFE_BANNER_CSS_FUNCTIONS.indexOf(name.replace(/\s*\($/,"").toLowerCase())>=0);
  }

  function sanitizeBannerStyle_(value){
    const declarations=[];
    String(value||"").split(";").forEach(declaration=>{
      const colon=declaration.indexOf(":");
      if(colon<1)return;
      const property=declaration.slice(0,colon).trim().toLowerCase(),cssValue=decodeBannerEntities(declaration.slice(colon+1)).trim();
      if(SAFE_BANNER_CSS.indexOf(property)<0||!safeBannerCssValue_(cssValue))return;
      declarations.push(property+": "+cssValue);
    });
    return declarations.join("; ");
  }

  function bannerTagEnd_(source,start){
    let quote="";
    for(let index=start;index<source.length;index++){
      const character=source.charAt(index);
      if(quote){if(character===quote)quote="";continue}
      if(character==='"'||character==="'"){quote=character;continue}
      if(character===">")return index;
    }
    return -1;
  }

  function removeBlockedBannerElements_(value){
    const containers=BLOCKED_BANNER_CONTAINERS.join("|");
    const paired=new RegExp("<\\s*("+containers+")\\b[^>]*>[\\s\\S]*?(?:<\\s*\\/\\s*\\1\\s*>|$)","gi");
    let previous;
    do{previous=value;value=value.replace(paired,"")}while(value!==previous);
    const blocked=containers+"|"+BLOCKED_BANNER_VOID_TAGS.join("|");
    return value.replace(new RegExp("<\\s*\\/?\\s*(?:"+blocked+")\\b[^>]*>","gi"),"");
  }

  function bannerAttributes_(source){
    const attributes={},pattern=/([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match;
    while((match=pattern.exec(source))){
      const name=String(match[1]||"").toLowerCase();
      if(["class","style","href","target","rel"].indexOf(name)<0||attributes[name]!==undefined)continue;
      attributes[name]=decodeBannerEntities(match[2]!==undefined?match[2]:match[3]!==undefined?match[3]:match[4]!==undefined?match[4]:"");
    }
    return attributes;
  }

  function sanitizeBannerTag_(source){
    const closing=source.match(/^\s*\/\s*([a-z][a-z0-9]*)\s*$/i);
    if(closing){const tag=closing[1].toLowerCase();return SAFE_BANNER_TAGS.indexOf(tag)>=0&&tag!=="br"?"</"+tag+">":""}
    const opening=source.match(/^\s*([a-z][a-z0-9]*)([\s\S]*?)\/?\s*$/i);
    if(!opening)return "";
    const tag=opening[1].toLowerCase();
    if(SAFE_BANNER_TAGS.indexOf(tag)<0)return "";
    const attributes=bannerAttributes_(opening[2]),rendered=[];
    if(attributes["class"]){
      const className=sanitizeBannerClass_(attributes["class"]);
      if(className)rendered.push('class="'+esc(className)+'"');
    }
    if(attributes.style){
      const style=sanitizeBannerStyle_(attributes.style);
      if(style)rendered.push('style="'+esc(style)+'"');
    }
    if(tag==="a"){
      const href=safeBannerUrl(attributes.href||"");
      if(href)rendered.push('href="'+esc(href)+'"');
      rendered.push('target="_blank"','rel="noopener noreferrer"');
    }
    return "<"+tag+(rendered.length?" "+rendered.join(" "):"")+">";
  }

  function sanitizeBannerHtml(html){
    const original=String(html||"").trim();
    if(!original)return "";
    let source=original.slice(0,12000).replace(/<!--[\s\S]*?(?:-->|$)/g,"");
    source=removeBlockedBannerElements_(source);
    let output="",index=0;
    while(index<source.length){
      const open=source.indexOf("<",index);
      if(open<0){output+=source.slice(index);break}
      output+=source.slice(index,open);
      const end=bannerTagEnd_(source,open+1);
      if(end<0){output+="&lt;"+source.slice(open+1);break}
      output+=sanitizeBannerTag_(source.slice(open+1,end));
      index=end+1;
    }
    return output.trim();
  }

  function safeBannerDocument(html){
    const body=sanitizeBannerHtml(html);
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-src 'none'; connect-src 'none'"><style>html,body{margin:0;padding:0;height:100%;background:#edf3f9;color:#0b223d;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}body{overflow:auto}.banner-shell{box-sizing:border-box;min-height:100%;padding:14px}</style></head><body><div class="banner-shell">${body}</div></body></html>`;
  }

  function xmlSafeBannerHtml_(html){
    const sanitized=sanitizeBannerHtml(html),stack=[];
    return (sanitized.match(/<[^>]*>|[^<]+/g)||[]).map(part=>{
      if(part.charAt(0)!=="<"){
        const entities={nbsp:"&#160;",copy:"©",reg:"®",trade:"™",ndash:"–",mdash:"—",hellip:"…",bull:"•",middot:"·",laquo:"«",raquo:"»",euro:"€",pound:"£",yen:"¥",cent:"¢"};
        return part.replace(/&([a-z]+);/gi,(match,name)=>entities[name.toLowerCase()]||match).replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi,"&amp;");
      }
      const closing=part.match(/^<\/([a-z0-9]+)>$/i);
      if(closing){
        const tag=closing[1].toLowerCase(),position=stack.lastIndexOf(tag);
        if(position<0)return "";
        return stack.splice(position).reverse().map(open=>`</${open}>`).join("");
      }
      const opening=part.match(/^<([a-z0-9]+)/i),tag=opening?opening[1].toLowerCase():"";
      if(!tag)return "";
      if(tag==="br")return "<br/>";
      stack.push(tag);
      return part;
    }).join("")+stack.reverse().map(tag=>`</${tag}>`).join("");
  }

  function bannerSvgDataUrl(html,title){
    const body=xmlSafeBannerHtml_(html);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1576" viewBox="0 0 1200 788"><title>${esc(title||"HCS Banner")}</title><foreignObject width="1200" height="788"><div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;width:1200px;height:788px;overflow:hidden;background:#edf3f9;color:#0b223d;font-family:Arial,sans-serif">${body}</div></foreignObject></svg>`;
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }

  function visualMedia(item,group,title,imageField="ImageURL",htmlField="ImageHTML",className="image-button"){
    const image=String(item?.[imageField]||"").trim();
    const html=String(item?.[htmlField]||"").trim();
    if(image)return imageButton(item,group,title,imageField,className);
    if(!html)return imageButton(item,group,title,imageField,className);
    const fileName=(String(title||"hcs-banner").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"hcs-banner")+"-hd.svg";
    return `<div class="html-media"><iframe class="html-visual ${esc(className)}" sandbox="allow-popups" loading="lazy" title="${esc(title)}" srcdoc="${esc(safeBannerDocument(html))}"></iframe><a class="html-download" href="${esc(bannerSvgDataUrl(html,title))}" download="${esc(fileName)}"><i class="bi bi-download"></i> Download HD</a></div>`;
  }

  function serviceCard(item){
    const title=item.Title||"HCS Service";
    return `<article class="content-card">${visualMedia(item,"services",title)}<div class="card-body"><span class="category">${esc(item.Category||"HCS Service")}</span><h3>${esc(title)}</h3><p>${esc(item.Description||"Professional service by HCS.")}</p><div class="card-actions"><a class="button primary small" href="${waUrl(item.WhatsAppText||`Mujhe ${title} ki details chahiye.`)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Ask Details</a></div></div></article>`;
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
      ${visualMedia(item,"products",title,"ImageURL","ImageHTML","product-image")}
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
      DATA=currentData(window.HCS_INLINE_DATA);renderPage();applySettings();
    }else{
      const cached=window.HCSDataCache?.read();
      if(cached){DATA=currentData(cached);renderPage();applySettings()}
      try{
        const response=await fetch("data/live-data.json",{cache:"no-store"});
        if(response.ok){DATA=currentData(await response.json());renderPage();applySettings()}
      }catch(error){renderPage()}
    }
    if(CFG.BACKEND_URL&&CFG.BACKEND_URL.startsWith("http"))loadRemoteData();
  }

  function loadRemoteData(){
    const script=document.createElement("script");
    const cleanup=()=>script.remove();
    window.hcsDataCallback=data=>{if(data&&!data.error){window.HCSDataCache?.write(data);DATA=currentData(data);renderPage();applySettings()}cleanup()};
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
    if(PAGE==="schemes")renderUpdates("schemes","schemes-content");
    if(PAGE==="education")renderUpdates("education","education-content");
    if(PAGE==="downloads")renderDownloads();
    if(PAGE==="catalog")renderCatalog();
  }

  function renderHome(){
    const services=document.getElementById("home-services");
    const homeServices=[...(DATA.services||[])].sort(newestFirst).slice(0,3);
    if(services)services.innerHTML=homeServices.map(serviceCard).join("")||empty("Services will appear here soon.","bi-grid");
    const product=document.getElementById("home-product");
    const homeProducts=[...(DATA.products||[])].sort(newestFirst);
    if(product)product.innerHTML=homeProducts.length?productCard(homeProducts[0]):empty("Products will appear here soon.","bi-bag");
  }

  function renderServices(){
    const grid=document.getElementById("services-grid"),input=document.getElementById("service-search");if(!grid)return;
    const draw=()=>{const q=String(input?.value||"").trim().toLowerCase();const rows=[...(DATA.services||[])].sort(newestFirst).filter(x=>[x.Title,x.Category,x.Description].join(" ").toLowerCase().includes(q));grid.innerHTML=rows.map(serviceCard).join("")||empty("No matching services found.","bi-search");document.getElementById("service-count").textContent=`${rows.length} service${rows.length===1?"":"s"}`};
    if(input&&!input.dataset.bound){input.addEventListener("input",draw);input.dataset.bound="1"}draw();
  }

  function renderJobs(){
    const list=document.getElementById("jobs-list"),input=document.getElementById("job-search");if(!list)return;
    const filters={department:document.getElementById("job-department-filter"),category:document.getElementById("job-category-filter"),location:document.getElementById("job-location-filter")};
    Object.entries(filters).forEach(([key,select])=>{if(!select)return;const current=jobSearchState[key];const field=key[0].toUpperCase()+key.slice(1),label={Department:"Departments",Category:"Categories",Location:"Locations"}[field];select.innerHTML=`<option value="">All ${label}</option>`+window.HCSJobSearch.options(DATA.jobs||[],field).map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join("");select.value=current});
    const draw=()=>{jobSearchState.query=String(input?.value||"");Object.entries(filters).forEach(([key,select])=>jobSearchState[key]=select?.value||"");const rows=window.HCSJobSearch.filter([...(DATA.jobs||[])].sort(newestFirst),jobSearchState);list.innerHTML=rows.map((job,index)=>{
      const title=job.Title||"Job Opportunity";
      const description=job.Description||job.Qualification||"";
      const descriptionId=`job-description-${cleanId(job.ID)||index}`;
      const jobId=String(job.ID||"");
      const status=job.ComputedStatus||job.Status||"Open",hasBanner=String(job.BannerURL||job.BannerHTML||"").trim();
      return `<article class="job-card" id="job-${cleanId(jobId)}" data-job-card="${esc(jobId)}"><div class="job-content"><div class="job-card-top"><span class="category job-department">${highlight(job.Department||"Job Opportunity",jobSearchState.query)}</span><span class="job-status"><i class="bi bi-circle-fill"></i>${esc(status)}</span></div><h2 class="job-title">${highlight(title,jobSearchState.query)}</h2>${description?`<div class="job-description-wrap"><p class="job-description" id="${descriptionId}">${esc(description)}</p><button class="job-read-more" type="button" data-job-read-more aria-expanded="false" aria-controls="${descriptionId}">Read More <i class="bi bi-chevron-down" aria-hidden="true"></i></button></div>`:""}<div class="job-meta"><div class="meta-box qualification-meta"><small><i class="bi bi-mortarboard"></i> Qualification</small><b>${highlight(job.Qualification||"See advertisement",jobSearchState.query)}</b></div><div class="meta-box age-meta"><small><i class="bi bi-person"></i> Age</small><b>${highlight(job.Age||job.AgeLimit||"See advertisement",jobSearchState.query)}</b></div><div class="meta-box category-meta"><small><i class="bi bi-grid"></i> Category</small><b>${highlight(job.Category||"General",jobSearchState.query)}</b></div><div class="meta-box date-meta"><small><i class="bi bi-calendar-event"></i> Last Date</small><b>${esc(job.ExtendedDate||job.LastDate||"Not specified")}</b></div></div><div class="card-actions job-actions">${job.ApplyLink?`<a class="button primary small" href="${esc(job.ApplyLink)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Apply Officially</a>`:""}${job.OfficialAdURL?`<a class="button full-ad-button small" href="${esc(job.OfficialAdURL)}" target="_blank" rel="noopener"><i class="bi bi-file-earmark-pdf"></i> Full Advertisement</a>`:""}${hasBanner?`<button class="button short-ad-button small" type="button" data-short-advertisement="${esc(jobId)}"><i class="bi bi-card-image"></i> Short Advertisement</button>`:""}<a class="button ask-hcs-button small" href="${waUrl(`Mujhe ${title} ki details chahiye.`)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Ask HCS</a></div><div class="job-share-row"><span><i class="bi bi-share"></i> Share this job</span><button class="job-share-button whatsapp" type="button" data-share-job-whatsapp="${esc(jobId)}"><i class="bi bi-whatsapp"></i> WhatsApp</button><button class="job-share-button" type="button" data-share-job="${esc(jobId)}"><i class="bi bi-share-fill"></i> More</button></div></div></article>`;
    }).join("")||empty("No matching jobs found.","bi-briefcase");document.getElementById("job-count").textContent=`${rows.length} job${rows.length===1?"":"s"}`;const sharedId=new URLSearchParams(location.search).get("job");if(sharedId){const sharedCard=[...list.querySelectorAll("[data-job-card]")].find(card=>card.dataset.jobCard===sharedId);if(sharedCard){sharedCard.classList.add("shared-job");if(!list.dataset.sharedJobFocused){list.dataset.sharedJobFocused="1";requestAnimationFrame(()=>sharedCard.scrollIntoView({behavior:"smooth",block:"center"}))}}}};
    if(!list.dataset.readMoreBound){list.addEventListener("click",event=>{const button=event.target.closest("[data-job-read-more]");if(!button)return;const description=document.getElementById(button.getAttribute("aria-controls"));if(!description)return;const expanded=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!expanded));description.classList.toggle("expanded",!expanded);button.innerHTML=`${expanded?"Read More":"Read Less"} <i class="bi ${expanded?"bi-chevron-down":"bi-chevron-up"}" aria-hidden="true"></i>`});list.dataset.readMoreBound="1"}
    if(input&&!input.dataset.bound){input.addEventListener("input",draw);input.dataset.bound="1";Object.values(filters).forEach(select=>select?.addEventListener("change",draw));document.getElementById("clear-job-search")?.addEventListener("click",()=>{input.value="";Object.values(filters).forEach(select=>select.value="");Object.assign(jobSearchState,{query:"",department:"",category:"",location:""});input.focus();draw()})}draw();
  }

  function renderDownloads(){
    const root=document.getElementById("downloads-content");if(!root)return;
    const rows=[...(DATA.downloads||[])].sort(newestFirst);
    const groups=[{title:"Software & Tools",rows:rows.filter(x=>String(x.Category||"").toLowerCase()!=="customer data")},{title:"Customer Data",rows:rows.filter(x=>String(x.Category||"").toLowerCase()==="customer data")}];
    root.innerHTML=groups.map(group=>`<section class="download-group"><h2>${group.title}</h2><div class="card-grid card-grid-3">${group.rows.map((item,index)=>{const description=item.Description||"";const descriptionId=`download-description-${cleanId(item.ID)||index}`;return `<article class="content-card">${visualMedia(item,"downloads",item.Title||"Download")}<div class="card-body"><span class="category">${esc(item.Category||"Download")}</span><h3>${esc(item.Title||"Download")}</h3>${description?`<div class="download-description-wrap"><p class="download-description" id="${descriptionId}">${esc(description)}</p><button class="job-read-more" type="button" data-download-read-more aria-expanded="false" aria-controls="${descriptionId}">Read More <i class="bi bi-chevron-down" aria-hidden="true"></i></button></div>`:""}<div class="card-actions">${item.URL?`<a class="button primary small" href="${esc(item.URL)}" target="_blank" rel="noopener"><i class="bi bi-download"></i> Download</a>`:""}</div></div></article>`}).join("")||empty("No files added yet.","bi-cloud-arrow-down")}</div></section>`).join("");
    if(!root.dataset.readMoreBound){root.addEventListener("click",event=>{const button=event.target.closest("[data-download-read-more]");if(!button)return;const description=document.getElementById(button.getAttribute("aria-controls"));if(!description)return;const expanded=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!expanded));description.classList.toggle("expanded",!expanded);button.innerHTML=`${expanded?"Read More":"Read Less"} <i class="bi ${expanded?"bi-chevron-down":"bi-chevron-up"}" aria-hidden="true"></i>`});root.dataset.readMoreBound="1"}
  }

  function updateCard(item,index){
    const title=item.Title||"HCS Update",description=item.Description||"",date=item.PublishDate||item.CreatedAt||"";
    const officialLink=safeHttpUrl(item.OfficialLink);
    const descriptionId=`update-description-${cleanId(item.ID)||index}`;
    return `<article class="content-card update-card">${visualMedia(item,"updates",title)}<div class="card-body"><span class="category">${esc(item.Category||"Update")}</span><h3>${esc(title)}</h3>${date?`<time class="update-date" datetime="${esc(date)}"><i class="bi bi-calendar3" aria-hidden="true"></i>${esc(date)}</time>`:""}${description?`<div class="download-description-wrap"><p class="download-description" id="${descriptionId}">${esc(description)}</p><button class="job-read-more" type="button" data-update-read-more aria-expanded="false" aria-controls="${descriptionId}">Read More <i class="bi bi-chevron-down" aria-hidden="true"></i></button></div>`:""}<div class="card-actions">${officialLink?`<a class="button primary small update-link" href="${esc(officialLink)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Official Link</a>`:""}</div></div></article>`;
  }

  function safeHttpUrl(value){
    const text=String(value||"").trim();
    if(!/^https?:\/\//i.test(text))return "";
    try{const url=new URL(text);return url.protocol==="http:"||url.protocol==="https:"?url.href:""}catch(error){return ""}
  }

  function bindUpdateReadMore(root){
    if(root.dataset.readMoreBound)return;
    root.addEventListener("click",event=>{const button=event.target.closest("[data-update-read-more]");if(!button)return;const description=document.getElementById(button.getAttribute("aria-controls"));if(!description)return;const expanded=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!expanded));description.classList.toggle("expanded",!expanded);button.innerHTML=`${expanded?"Read More":"Read Less"} <i class="bi ${expanded?"bi-chevron-down":"bi-chevron-up"}" aria-hidden="true"></i>`});
    root.dataset.readMoreBound="1";
  }

  function renderUpdates(type,rootId){
    const root=document.getElementById(rootId);if(!root)return;
    const rows=[...(DATA[type]||[])].sort(newestFirst);
    root.innerHTML=rows.map(updateCard).join("")||empty("No updates added yet.","bi-megaphone");
    bindUpdateReadMore(root);
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
    rows.sort((a,b)=>catalogState.sort==="price-low"?Number(a.Price||0)-Number(b.Price||0):catalogState.sort==="price-high"?Number(b.Price||0)-Number(a.Price||0):catalogState.sort==="alpha"?productName(a).localeCompare(productName(b)):newestFirst(a,b));
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
    const modal=document.getElementById("product-modal");const body=modal.querySelector(".product-detail");
    body.innerHTML=`<div class="product-detail-image">${visualMedia(p,"products",title,"ImageURL","ImageHTML","product-detail-visual")}</div><div class="product-detail-copy"><span class="category">${esc(p.Category||"HCS Product")}</span><h2>${esc(title)}</h2><div class="product-code">Product Code: ${esc(p.ID)}</div><span class="price">Rs ${money(p.Price)}</span><p><b>Brand:</b> ${esc(p.Brand||"HCS")} &nbsp; · &nbsp; <b class="${isInStock(p)?"status":"stock out"}">${isInStock(p)?"In Stock":"Out of Stock"}</b></p><h3>Complete Specifications</h3><ul class="spec-list">${details.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><a class="button primary" href="${waUrl(p.WhatsAppText||`Mujhe ${title} (${p.ID}) order karna hai.`)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Order on WhatsApp</a></div>`;
    openModal(modal);
  }

  function openShortAdvertisement(id){
    const job=(DATA.jobs||[]).find(item=>String(item.ID)===String(id));if(!job)return;
    const modal=document.getElementById("short-ad-modal"),content=modal?.querySelector(".short-ad-content"),heading=modal?.querySelector(".short-ad-title");if(!modal||!content)return;
    const title=job.Title||"Short Advertisement";if(heading)heading.textContent=title;
    if(String(job.BannerURL||"").trim()){
      const src=remoteImage(job.BannerURL,1600);
      content.innerHTML=`<img class="short-ad-image" src="${esc(src)}" alt="${esc(title)}" loading="eager" decoding="async">`;
    }else content.innerHTML=visualMedia(job,"jobs",title,"BannerURL","BannerHTML","short-ad-html");
    openModal(modal);
  }

  function createModals(){
    document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer"><div class="modal-backdrop" data-close-modal></div><div class="lightbox-dialog"><div class="lightbox-top"><span class="lightbox-title"></span><button type="button" data-close-modal aria-label="Close image"><i class="bi bi-x-lg"></i></button></div><div class="lightbox-stage"><img alt="Full image"></div><div class="lightbox-controls"><button type="button" data-zoom-out aria-label="Zoom out"><i class="bi bi-dash-lg"></i></button><span class="zoom-level">100%</span><button type="button" data-zoom-in aria-label="Zoom in"><i class="bi bi-plus-lg"></i></button><button type="button" data-zoom-reset aria-label="Fit to screen"><i class="bi bi-arrows-angle-contract"></i></button></div></div></div><div class="modal" id="product-modal" role="dialog" aria-modal="true" aria-label="Product details"><div class="modal-backdrop" data-close-modal></div><div class="product-modal-card"><button class="icon-button product-modal-close" type="button" data-close-modal aria-label="Close product details"><i class="bi bi-x-lg"></i></button><div class="product-detail"></div></div></div><div class="modal" id="short-ad-modal" role="dialog" aria-modal="true" aria-label="Short Advertisement"><div class="modal-backdrop" data-close-modal></div><div class="short-ad-dialog"><div class="short-ad-head"><h2 class="short-ad-title">Short Advertisement</h2><button class="icon-button" type="button" data-close-modal aria-label="Close short advertisement"><i class="bi bi-x-lg"></i></button></div><div class="short-ad-content"></div></div></div><div id="toast" class="toast" role="status"></div>`);
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

  window.visualMedia=visualMedia;
  window.safeBannerDocument=safeBannerDocument;
  window.openHcsProduct=openProduct;
  window.openShortAdvertisement=openShortAdvertisement;

  document.addEventListener("click",event=>{
    const emptySocial=event.target.closest("[data-empty-social]");if(emptySocial){event.preventDefault();toast("This social media link will be added soon.");return}
    const lightbox=event.target.closest("[data-lightbox-src]");if(lightbox){event.preventDefault();const img=lightbox.matches("img")?lightbox:lightbox.querySelector("img");window.openHcsLightbox(img?.currentSrc||lightbox.dataset.lightboxSrc,lightbox.dataset.lightboxTitle||img?.alt);return}
    const favourite=event.target.closest("[data-favourite]");if(favourite){toggleFavourite(favourite.dataset.favourite);return}
    const detail=event.target.closest("[data-details]");if(detail){openProduct(detail.dataset.details);return}
    const shortAd=event.target.closest("[data-short-advertisement]");if(shortAd){openShortAdvertisement(shortAd.dataset.shortAdvertisement);return}
    const share=event.target.closest("[data-share-product]");if(share){shareProduct(share.dataset.shareProduct);return}
    const jobWhatsApp=event.target.closest("[data-share-job-whatsapp]");if(jobWhatsApp){shareJobWhatsApp(jobWhatsApp.dataset.shareJobWhatsapp);return}
    const jobShare=event.target.closest("[data-share-job]");if(jobShare){shareJob(jobShare.dataset.shareJob);return}
    const close=event.target.closest("[data-close-modal]");if(close)closeModal(close.closest(".modal"));
  });
  document.addEventListener("error",event=>{const img=event.target;if(img.tagName!=="IMG")return;const fallback=img.dataset.fallback;if(fallback&&!img.dataset.triedFallback){img.dataset.triedFallback="1";img.src=fallback}else{img.style.opacity="0"}},true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll(".modal.open").forEach(closeModal)});

  renderLayout();createModals();setupCatalog();updateSavedCount();loadData();
})();
