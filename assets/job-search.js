(function(window){
  "use strict";

  const fields=["Title","Department","Category","Location","Qualification","Age","Description"];
  const normalize=value=>String(value||"").trim().toLowerCase().replace(/\s+/g," ");

  window.HCSJobSearch={
    filter(jobs,criteria){
      const query=normalize(criteria.query),tokens=query?query.split(" "):[];
      return (jobs||[]).filter(job=>{
        const text=normalize(fields.map(field=>job[field]).join(" "));
        if(!tokens.every(token=>text.includes(token)))return false;
        return ["Department","Category","Location"].every(field=>{
          const selected=normalize(criteria[field.toLowerCase()]);
          return !selected||normalize(job[field])===selected;
        });
      });
    },
    options(jobs,field){
      return [...new Set((jobs||[]).map(job=>String(job[field]||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    }
  };
})(window);
