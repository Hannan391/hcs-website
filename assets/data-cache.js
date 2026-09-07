(function(window,storage){
  "use strict";

  const KEY="hcs-public-data-v1";

  function valid(data){
    return data&&typeof data==="object"&&Array.isArray(data.jobs)&&Array.isArray(data.downloads);
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
