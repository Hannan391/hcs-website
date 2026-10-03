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
  let DATA={settings:{},services:[],jobs:[],downloads:[],products:[],schemes:[],education:[],knowledge:[]};
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
        return `<a class="social-link social-${key} ${url?"":"disabled"}" href="${esc(url||"#")}" ${url?'target="_blank" rel="noopener"':'aria-disabled="true" data-empty-social="true"'} title="${url?meta.label:meta.label+" link will be added soon"}"><i class="bi ${meta.icon}"></i><span>${meta.label}</span></a>`;
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
  const BLOCKED_BANNER_VOID_TAGS=["base","embed","img","link","OpenAI","source"];
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
    const group=serviceGroup(title);
    return `<article class="content-card service-card compact-service-card" data-service-group="${group}">${serviceIconVisual(title)}<div class="card-body"><h3>${esc(title)}</h3><p>${esc(item.Description||"Professional service by HCS.")}</p><a class="service-explore" href="${waUrl(item.WhatsAppText||`Mujhe ${title} ki details chahiye.`)}" target="_blank" rel="noopener">Explore <i class="bi bi-arrow-right"></i></a></div><a class="service-arrow" href="${waUrl(item.WhatsAppText||`Mujhe ${title} ki details chahiye.`)}" target="_blank" rel="noopener" aria-label="Explore ${esc(title)}"><i class="bi bi-chevron-right"></i></a></article>`;
  }

  function serviceGroup(title){
    const text=String(title||"").toLowerCase();
    if(/job|education|student|staff/.test(text))return "education";
    if(/computer|software|windows|hardware|development|marketing/.test(text))return "computer";
    if(/fbr|tax|govt|scheme|online|excise|token/.test(text))return "government";
    return "printing";
  }

  function serviceIconVisual(title){
    const text=String(title||"").toLowerCase();
    const rules=[[/photo studio|studio/,"camera"],[/computer/,"pc-display"],[/software|windows|hardware/,"windows"],[/job|educational/,"briefcase"],[/fbr|tax/,"calculator"],[/govt|scheme/,"bank"],[/online apply/,"send-check"],[/online/,"globe"],[/panaflex/,"easel"],[/wedding/,"envelope-heart"],[/visiting/,"person-vcard"],[/stamp/,"patch-check"],[/brochure/,"file-earmark-richtext"],[/sticker/,"sticky"],[/staff/,"person-badge"],[/student/,"mortarboard"],[/pvc|fee card/,"credit-card"],[/scanning/,"upc-scan"],[/toner/,"printer-fill"],[/excise/,"car-front"],[/token/,"receipt"],[/binding/,"journal-bookmark"],[/cv/,"file-person"],[/composing/,"keyboard"],[/development/,"code-square"],[/marketing/,"megaphone"],[/print|photocop/,"printer"]];
    const icon=(rules.find(([pattern])=>pattern.test(text))||[,"gear-wide-connected"])[1];
    return `<div class="service-icon-visual" aria-hidden="true"><span class="service-icon-orbit"></span><i class="bi bi-${icon}"></i></div>`;
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
      <div class="product-body"><span class="product-code">Product Code: ${esc(item.ID||"N/A")}</span><h3>${esc
