/* HCS TRACK ORDER BACKEND PATCH
Add the branch shown below near the top of your existing doGet(e), after the api=ping check:
if (e.parameter.action === "track") return trackOrderPublic_(e.parameter);

Then add the function below anywhere in the Apps Script project and deploy a NEW version.
This returns only order status/total/date after BOTH Order ID and phone match.
*/
function trackOrderPublic_(p) {
  var callback = String(p.callback || "hcsTrackCallback");
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) callback = "hcsTrackCallback";
  var result;
  try {
    var orderId = String(p.orderId || "").trim();
    var phone = String(p.phone || "").replace(/\D/g, "");
    if (!orderId || phone.length < 7) throw new Error("Enter your tracking number and order phone number.");
    var sheet = SpreadsheetApp.getActive().getSheetByName("Orders");
    if (!sheet || sheet.getLastRow() < 2) throw new Error("Order not found. Check your details.");
    var data = sheet.getDataRange().getDisplayValues();
    var headers = data[0].map(String);
    var ix = {};
    headers.forEach(function(h, i) { ix[h] = i; });
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var savedPhone = String(row[ix.Phone] || "").replace(/\D/g, "");
      if (String(row[ix.OrderID] || "").trim().toUpperCase() === orderId.toUpperCase() && savedPhone === phone) {
        result = {
          ok: true,
          orderId: row[ix.OrderID],
          createdAt: row[ix.CreatedAt],
          totalAmount: row[ix.TotalAmount],
          paymentStatus: row[ix.PaymentStatus] || "Payment Pending",
          orderStatus: row[ix.OrderStatus] || "Order Received"
        };
        break;
      }
    }
    if (!result) throw new Error("Order not found. Check your tracking number and phone number.");
  } catch (err) {
    result = { ok: false, message: String(err.message || "Order could not be found.") };
  }
  return ContentService.createTextOutput(callback + "(" + JSON.stringify(result).replace(/</g, "\\u003c") + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}