(function(){
"use strict";
const BACKEND="https://script.google.com/macros/s/AKfycby-ILsCMUcD4_25OSwKAnAG7ajyjXbKfFmFxAmXTDfzxS3bvyWaZN2cJYrDKK7JJD55/exec";
const form=document.getElementById("track-form"),status=document.getElementById("track-status"),result=document.getElementById("track-result");
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const steps=["Order Received","Processing","Ready","Completed"];
function render(data){
 if(!data||!data.ok){status.className="track-status form-status error";status.textContent=(data&&data.message)||"Order not found. Check the tracking number.";result.hidden=true;return}
 status.textContent="";status.className="track-status form-status success";result.hidden=false;
 const orderStatus=String(data.orderStatus||"Order Received"),payment=String(data.paymentStatus||"Payment Pending");
 const current=steps.indexOf(orderStatus);
 const progress=steps.map((step,index)=>'<div class="track-step '+(index===current?'current':'')+'"><b>'+(index<current?'✓':index+1)+'. '+esc(step)+'</b></div>').join("");
 result.innerHTML='<h2>Order Status</h2><p><span class="track-pill">'+esc(orderStatus)+'</span></p><dl><div><dt>Tracking Number</dt><dd>'+esc(data.orderId)+'</dd></div><div><dt>Payment Status</dt><dd>'+esc(payment)+'</dd></div><div><dt>Order Date</dt><dd>'+esc(data.createdAt||"Not available")+'</dd></div><div><dt>Total Amount</dt><dd>Rs '+esc(data.totalAmount||"—")+'</dd></div></dl><div class="track-steps">'+progress+'</div>';
}
form.addEventListener("submit",event=>{
 event.preventDefault();result.hidden=true;status.className="track-status form-status";status.textContent="Checking your order...";
 const orderId=form.elements.orderId.value.trim();
 if(!orderId){status.textContent="Enter your tracking number.";return}
 const callback="hcsTrackCallback";
 window[callback]=data=>{delete window[callback];script.remove();render(data)};
 const script=document.createElement("script");
 script.src=BACKEND+"?action=track&orderId="+encodeURIComponent(orderId)+"&callback="+callback;
 script.onerror=()=>{delete window[callback];script.remove();status.className="track-status form-status error";status.textContent="Tracking service is not active yet. Please try again later or contact the shop."};
 document.body.appendChild(script);
});
})();