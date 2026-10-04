/* L'Écrin du Goût — cart-drawer.js : panier AJAX */
(function () {
  "use strict";

  var drawer = document.getElementById("CartDrawer");
  if (!drawer) return;

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function refreshDrawer(openAfter) {
    return fetch("/?sections=cart-drawer")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var html = data["cart-drawer"];
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        var fresh = doc.getElementById("CartDrawer");
        if (fresh) {
          drawer.innerHTML = fresh.innerHTML;
          drawer.className = fresh.className;
        }
        if (openAfter) openDrawer();
      })
      .catch(function (err) { console.error("Cart drawer refresh failed", err); });
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-cart-drawer-open]");
    if (opener) { e.preventDefault(); refreshDrawer(true); return; }

    var closer = e.target.closest("[data-cart-drawer-close]");
    if (closer) { e.preventDefault(); closeDrawer(); return; }

    var overlay = e.target.closest("[data-cart-drawer-overlay]");
    if (overlay) { closeDrawer(); return; }

    var remove = e.target.closest("[data-cart-remove]");
    if (remove) {
      e.preventDefault();
      var key = remove.getAttribute("data-cart-remove");
      changeLineQuantity(key, 0);
      return;
    }

    var step = e.target.closest("[data-cart-quantity-step]");
    if (step) {
      var wrap = step.closest("[data-cart-quantity]");
      var input = wrap.querySelector("input");
      var delta = parseInt(step.getAttribute("data-cart-quantity-step"), 10);
      var next = Math.max(0, (parseInt(input.value, 10) || 0) + delta);
      input.value = next;
      changeLineQuantity(wrap.getAttribute("data-cart-quantity"), next);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  function changeLineQuantity(key, quantity) {
    fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity: quantity })
    })
      .then(function () { return refreshDrawer(true); })
      .then(updateCartCount);
  }

  function updateCartCount() {
    fetch("/cart.js")
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        document.querySelectorAll("[data-cart-count]").forEach(function (el) {
          el.textContent = cart.item_count;
          el.classList.toggle("hidden", cart.item_count === 0);
        });
      });
  }

  /* Interception des formulaires d'ajout au panier (cartes produit + page produit) */
  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-product-form]");
    if (!form) return;
    e.preventDefault();

    var submitBtn = form.querySelector("[type='submit']");
    var formData = new FormData(form);

    if (submitBtn) submitBtn.classList.add("is-loading");

    fetch("/cart/add.js", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status) {
          var errorBox = form.querySelector("[data-product-form-error]");
          if (errorBox) {
            errorBox.textContent = data.description || data.message;
            errorBox.removeAttribute("hidden");
          }
          return;
        }
        return refreshDrawer(true).then(updateCartCount);
      })
      .catch(function (err) { console.error("Add to cart failed", err); })
      .finally(function () {
        if (submitBtn) submitBtn.classList.remove("is-loading");
      });
  });

  updateCartCount();
})();
