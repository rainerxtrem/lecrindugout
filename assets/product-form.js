/* L'Écrin du Goût — product-form.js : variantes, prix, galerie */
(function () {
  "use strict";

  // Gère tous les formats monétaires Shopify ({{amount}}, {{amount_with_comma_separator}}…)
  function formatMoney(cents, format) {
    format = format || "{{amount}} €";
    function withDelimiters(number, precision, thousands, decimal) {
      var parts = (number / 100).toFixed(precision).split(".");
      var whole = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands);
      return parts[1] ? whole + decimal + parts[1] : whole;
    }
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, function (match, key) {
      switch (key) {
        case "amount_no_decimals": return withDelimiters(cents, 0, ",", ".");
        case "amount_with_comma_separator": return withDelimiters(cents, 2, ".", ",");
        case "amount_no_decimals_with_comma_separator": return withDelimiters(cents, 0, ".", ",");
        case "amount_with_space_separator": return withDelimiters(cents, 2, " ", ",");
        case "amount_no_decimals_with_space_separator": return withDelimiters(cents, 0, " ", ",");
        case "amount_with_period_and_space_separator": return withDelimiters(cents, 2, " ", ".");
        case "amount_with_apostrophe_separator": return withDelimiters(cents, 2, "'", ".");
        default: return withDelimiters(cents, 2, ",", ".");
      }
    });
  }

  document.querySelectorAll("[data-product-form]").forEach(function (form) {
    var dataEl = document.getElementById(form.getAttribute("data-variants-json"));
    if (!dataEl) return;

    var variants = JSON.parse(dataEl.textContent);
    var optionInputs = form.querySelectorAll("[data-option-position]");
    var idInput = form.querySelector("[data-variant-id-input]");
    var priceWrap = document.querySelector(form.getAttribute("data-price-target") || "[data-product-price]");
    var submitBtn = form.querySelector("[data-add-to-cart-button]");
    var moneyFormat = form.getAttribute("data-money-format") || "{{amount}} €";

    var gallerySelector = form.getAttribute("data-gallery-target");
    var gallery = gallerySelector ? document.querySelector(gallerySelector) : null;

    function getSelectedOptions() {
      var selected = [];
      var byPosition = {};
      optionInputs.forEach(function (input) {
        if (input.type !== "radio" && input.type !== "select-one") return;
        if (input.type === "radio" && !input.checked) return;
        byPosition[input.getAttribute("data-option-position")] = input.value;
      });
      Object.keys(byPosition)
        .sort(function (a, b) { return a - b; })
        .forEach(function (key) { selected.push(byPosition[key]); });
      return selected;
    }

    function findVariant() {
      // Produit sans choix d'options (variante unique) : on garde la variante déjà sélectionnée
      if (optionInputs.length === 0) {
        var currentId = idInput ? String(idInput.value) : "";
        return variants.find(function (v) { return String(v.id) === currentId; }) || variants[0];
      }
      var selected = getSelectedOptions();
      return variants.find(function (v) {
        return v.options.length === selected.length && v.options.every(function (opt, i) { return opt === selected[i]; });
      });
    }

    function updateAvailability(variant) {
      var allInputs = Array.from(optionInputs);
      allInputs.forEach(function (input) {
        var label = form.querySelector('label[for="' + input.id + '"]');
        if (!label) return;
        var hypothetical = getSelectedOptions();
        var position = parseInt(input.getAttribute("data-option-position"), 10) - 1;
        hypothetical[position] = input.value;
        var match = variants.find(function (v) {
          return v.options.every(function (opt, i) { return hypothetical[i] === undefined || opt === hypothetical[i]; });
        });
        label.classList.toggle("is-disabled", !match || !match.available);
      });
    }

    function render() {
      var variant = findVariant();
      if (!variant) {
        if (submitBtn) { submitBtn.setAttribute("disabled", "disabled"); submitBtn.textContent = submitBtn.getAttribute("data-unavailable-text") || "Indisponible"; }
        return;
      }

      if (idInput) idInput.value = variant.id;

      if (priceWrap) {
        var regular = priceWrap.querySelector("[data-price-regular]");
        var compare = priceWrap.querySelector("[data-price-compare]");
        if (regular) regular.textContent = formatMoney(variant.price, moneyFormat);
        if (compare) {
          if (variant.compare_at_price && variant.compare_at_price > variant.price) {
            compare.textContent = formatMoney(variant.compare_at_price, moneyFormat);
            compare.removeAttribute("hidden");
            priceWrap.classList.add("price--sale");
          } else {
            compare.setAttribute("hidden", "hidden");
            priceWrap.classList.remove("price--sale");
          }
        }
      }

      if (submitBtn) {
        submitBtn.removeAttribute("disabled");
        submitBtn.textContent = variant.available
          ? submitBtn.getAttribute("data-add-text") || "Ajouter au panier"
          : submitBtn.getAttribute("data-unavailable-text") || "Épuisé";
        if (!variant.available) submitBtn.setAttribute("disabled", "disabled");
      }

      if (gallery && variant.featured_media_id) {
        var target = gallery.querySelector('[data-media-id="' + variant.featured_media_id + '"]');
        if (target) {
          gallery.querySelectorAll("[data-gallery-main-item]").forEach(function (el) { el.classList.remove("is-active"); });
          target.classList.add("is-active");
          var mainImg = gallery.querySelector("[data-gallery-main-image]");
          var sourceImg = target.querySelector("img");
          if (mainImg && sourceImg) mainImg.src = sourceImg.src.replace(/width=\d+/, "width=1200");
        }
      }

      updateAvailability(variant);

      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set("variant", variant.id);
        window.history.replaceState({}, "", url);
      }
    }

    optionInputs.forEach(function (input) {
      input.addEventListener("change", render);
    });

    render();
  });

  /* Recommandations produit (API native Shopify) */
  document.querySelectorAll("[data-product-recommendations]").forEach(function (container) {
    var url = container.getAttribute("data-url");
    if (!url) return;
    fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        var fresh = doc.querySelector("[data-product-recommendations]");
        if (fresh && fresh.innerHTML.trim() !== "") {
          container.innerHTML = fresh.innerHTML;
        }
      })
      .catch(function (err) { console.error("Product recommendations failed", err); });
  });

  /* Galerie — miniatures */
  document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
    var mainImg = gallery.querySelector("[data-gallery-main-image]");
    gallery.querySelectorAll("[data-gallery-thumb]").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        gallery.querySelectorAll("[data-gallery-thumb]").forEach(function (t) { t.classList.remove("is-active"); });
        thumb.classList.add("is-active");
        var img = thumb.querySelector("img");
        if (mainImg && img) mainImg.src = img.src.replace(/width=\d+/, "width=1200");
      });
    });
  });
})();
