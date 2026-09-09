(function(window,storage){
  "use strict";

  const KEY="hcs-public-data-v4";

  function valid(data){
    return data&&typeof data==="object"&&!Array.isArray(data)&&data.settings&&typeof data.settings==="object"&&!Array.isArray(data.settings)&&["services","jobs","downloads","products","schemes","education"].every(key=>Array.isArray(data[key]))&&data.jobs.every(job=>job&&Object.prototype.hasOwnProperty.call(job,"PublicHiddenFrom")&&Number.isFinite(Number(job.PublicHiddenFrom))&&Number(job.PublicHiddenFrom)>=0);
  }

  window.HCSDataCache={
    read(){
      try{
        const data=JSON.parse(storage.getItem(KEY)||"null");
        return valid(data)?data:null;
      }catch(error){return null}
    },
    write(data){
      if(!valid(data))return false;
      try{storage.setItem(KEY,JSON.stringify(data));return true}catch(error){return false}
    }
  };
})(window,localStorage);
