(function () {
  "use strict";

  const ACCOUNT_NUMBER = "0334-6395391";

  function copyText(value, fallback, success) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(
        function () { showMessage(success); },
        function () { showMessage(fallback); }
      );
    } else {
      showMessage(fallback);
    }
  }

  function showMessage(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(function () { toast.classList.remove("show"); }, 2300);
  }

  function enhancePaymentInstructions() {
    const summary = document.getElementById("checkout-summary");
    const payment = summary && summary.querySelector(".payment-account");
    if (!payment || payment.dataset.hcsEnhanced === "1") return;

    const total = summary.querySelector("strong span");
    const amount = total ? total.textContent.trim() : "Please check the total above";
    payment.dataset.hcsEnhanced = "1";
    payment.innerHTML =
      '<h3>Pay with JazzCash</h3>' +
      '<p><b>JazzCash Number:</b> <span>' + ACCOUNT_NUMBER + '</span> ' +
      '<button type="button" class="button small" data-copy-payment-account>Copy Number</button></p>' +
      '<p><b>Send this exact amount:</b> <strong>' + amount + '</strong> ' +
      '<button type="button" class="button small" data-copy-payment-amount data-payment-amount="' + amount.replace(/[^0-9]/g, "") + '">Copy Amount</button></p>' +
      '<ol><li>Open JazzCash and send the amount shown above to this number.</li>' +
      '<li>After payment succeeds, save your transaction receipt or screenshot.</li>' +
      '<li>Upload the receipt below and place your order.</li></ol>' +
      '<p><b>Important:</b> Payment is checked manually. Your order stays pending until the amount is confirmed in the JazzCash account.</p>';
  }

  document.addEventListener("click", function (event) {
    const amountButton = event.target.closest("[data-copy-payment-amount]");
    if (!amountButton) return;
    const amount = amountButton.getAttribute("data-payment-amount") || "";
    if (!amount) {
      showMessage("Please check the total payment shown above.");
      return;
    }
    copyText(amount, "Payment amount: Rs " + amount, "Payment amount copied.");
  });

  const summary = document.getElementById("checkout-summary");
  if (summary) {
    enhancePaymentInstructions();
    new MutationObserver(enhancePaymentInstructions).observe(summary, { childList: true, subtree: true });
  }
})();
