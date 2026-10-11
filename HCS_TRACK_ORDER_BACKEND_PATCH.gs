/* HCS TRACKING + CUSTOMER EMAIL BACKEND PATCH
Apply these edits to the ACTUAL Google Apps Script project (Code.gs), not just this helper file.
Then save and Deploy > Manage deployments > Edit > New version > Deploy.

1) In HCS_TABLES.orders, set the headers to:
orders:{sheet:"Orders",headers:["OrderID","CreatedAt","CustomerName","Phone","Address","Tehsil","District","OrderedProducts","TotalAmount","OrderNotes","PaymentProofName","PaymentProofURL","PaymentStatus","OrderStatus","AdminNote","CustomerEmail"]}

2) In doGet(e), immediately after the api=ping check, add:
if (e.parameter.action === "track") return trackOrderPublic_(e.parameter);

3) In createWebsiteOrder_(p), add email to the fields being cleaned:
email=clean_(p.email,120),
Change the required-fields check to include !email:
if(!name||!phone||!email||!address||!tehsil||!district||!items||!total) throw new Error("Complete order details including email are required");
Then validate:
if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error("Enter a valid email address");

4) Replace the existing orderId declaration with:
const requestedOrderId = clean_(p.orderId, 60);
const orderId = /^HCS-\d{8}-[A-Z0-9]{6}$/.test(requestedOrderId) ? requestedOrderId : "HCS-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Utilities.getUuid().slice(0,6).toUpperCase();

5) Change the Orders appendRow line to:
if(sheet)sheet.appendRow([orderId,created,name,phone,address,tehsil,district,items,total,notes,proofName,proofUrl,"Payment Pending","Order Received","",email]);
CustomerEmail is at the end to avoid shifting existing columns. setupHCS()/ensureSheet_ will add the new header.

6) After the existing try/catch that saves the proof and order row, but before the final return jsonOutput_(...), add:
try {
  const customerHtml = "<h2>Thank you for your order!</h2>" +
    "<p>Your order at Hannan Computers &amp; Printers has been received.</p>" +
    "<p><b>Tracking Number:</b> " + html_(orderId) + "</p>" +
    "<p><b>Order Total:</b> Rs " + html_(total) + "</p>" +
    "<p><b>Payment Status:</b> Payment Pending</p>" +
    "<p>Your payment proof will be checked within 24 hours. Keep your tracking number safe.</p>" +
    "<p>Track your order: <a href=\"" + HCS_SITE_URL + "/track-order.html\">Track Your Order</a></p>" +
    "<p>Hannan Computers &amp; Printers<br>Bangla Chowk Mamukanjan<br>0334-6395391</p>";
  MailApp.sendEmail({to:email,subject:"Hannan Computers Order Confirmation - "+orderId,htmlBody:customerHtml,name:"Hannan Computers & Printers"});
} catch (customerEmailError) {
  console.error("Customer confirmation email failed: " + customerEmailError);
}
Keep the existing admin notification email.

7) Add this function anywhere in Code.gs. Customers track using ONLY the tracking number; do not require phone number. It returns only order ID, date, total, payment status, and order status.

function trackOrderPublic_(p) {
  var callback = String(p.callback || "hcsTrackCallback");
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) callback = "hcsTrackCallback";
  var result;
  try {
    var orderId = String(p.orderId || "").trim().toUpperCase();
    if (!/^HCS-\d{8}-[A-Z0-9]{6}$/.test(orderId)) throw new Error("Enter a valid tracking number.");
    var sheet = SpreadsheetApp.getActive().getSheetByName("Orders");
    if (!sheet || sheet.getLastRow() < 2) throw new Error("Order not found. Check the tracking number.");
    var data = sheet.getDataRange().getDisplayValues();
    var headers = data[0].map(String);
    var ix = {};
    headers.forEach(function(h, i) { ix[h] = i; });
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (String(row[ix.OrderID] || "").trim().toUpperCase() === orderId) {
        result = { ok:true, orderId:row[ix.OrderID], createdAt:row[ix.CreatedAt], totalAmount:row[ix.TotalAmount], paymentStatus:row[ix.PaymentStatus] || "Payment Pending", orderStatus:row[ix.OrderStatus] || "Order Received" };
        break;
      }
    }
    if (!result) throw new Error("Order not found. Check the tracking number.");
  } catch (err) { result = { ok:false, message:String(err.message || "Order could not be found.") }; }
  return ContentService.createTextOutput(callback + "(" + JSON.stringify(result).replace(/</g, "\\u003c") + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
}
