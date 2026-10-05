/* L'Écrin du Goût — theme.js : comportements globaux */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  /* ---------------- Sticky header ---------------- */
  var header = document.querySelector("[data-site-header]");
  if (header) {
    var lastState = false;
    var onScroll = function () {
      var stuck = window.scrollY > 24;
      if (stuck !== lastState) {
        header.classList.toggle("is-stuck", stuck);
        lastState = stuck;
      }
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Mega menu (desktop) ---------------- */
  var navItems = document.querySelectorAll("[data-nav-item]");
  navItems.forEach(function (item) {
    var trigger = item.querySelector("[data-nav-trigger]");
    if (!trigger) return;
    var open = function () { item.classList.add("is-open"); trigger.setAttribute("aria-expanded", "true"); };
    var close = function () { item.classList.remove("is-open"); trigger.setAttribute("aria-expanded", "false"); };
    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", close);
    trigger.addEventListener("focus", open);
    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) close();
    });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); trigger.focus(); }
    });
  });

  /* ---------------- Search panel ---------------- */
  var searchPanel = document.querySelector("[data-search-panel]");
  var searchOpeners = document.querySelectorAll("[data-search-open]");
  if (searchPanel && searchOpeners.length) {
    searchOpeners.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isHidden = searchPanel.hasAttribute("hidden");
        if (isHidden) {
          searchPanel.removeAttribute("hidden");
          var input = searchPanel.querySelector("input[type='search']");
          if (input) input.focus();
        } else {
          searchPanel.setAttribute("hidden", "hidden");
        }
      });
    });
  }

  /* ---------------- Mobile nav drawer ---------------- */
  var mobileDrawer = document.querySelector("[data-mobile-nav]");
  var mobileOpeners = document.querySelectorAll("[data-mobile-nav-open]");
  var mobileClosers = document.querySelectorAll("[data-mobile-nav-close]");
  if (mobileDrawer) {
    var openMobile = function () {
      mobileDrawer.classList.add("is-open");
      mobileDrawer.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
    };
    var closeMobile = function () {
      mobileDrawer.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(function () { mobileDrawer.setAttribute("hidden", "hidden"); }, 320);
    };
    mobileOpeners.forEach(function (btn) { btn.addEventListener("click", openMobile); });
    mobileClosers.forEach(function (btn) { btn.addEventListener("click", closeMobile); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobile();
    });
  }

  /* ---------------- Accordions ---------------- */
  document.querySelectorAll("[data-accordion-trigger]").forEach(function (trigger) {
    var panel = document.getElementById(trigger.getAttribute("aria-controls"));
    if (!panel) return;
    var inner = panel.querySelector(".accordion__panel-inner");
    trigger.addEventListener("click", function () {
      var expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      if (expanded) {
        // Un panneau ouvert par défaut a max-height: none : on fixe sa hauteur avant de l'animer vers 0
        panel.style.maxHeight = inner.scrollHeight + "px";
        panel.offsetHeight;
        panel.classList.remove("is-open");
        panel.style.maxHeight = "0px";
      } else {
        panel.style.maxHeight = inner.scrollHeight + "px";
      }
    });
  });

  /* ---------------- Quantity selectors ---------------- */
  document.querySelectorAll("[data-quantity-selector]").forEach(function (wrap) {
    var input = wrap.querySelector("input");
    var min = parseInt(input.getAttribute("min") || "1", 10);
    wrap.querySelectorAll("[data-quantity-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var step = parseInt(btn.getAttribute("data-quantity-step"), 10);
        var next = Math.max(min, (parseInt(input.value, 10) || min) + step);
        input.value = next;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  });

  /* ---------------- Scroll reveal ---------------- */
  var animated = document.querySelectorAll("[data-animate]");
  if (animated.length) {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      animated.forEach(function (el) { observer.observe(el); });
    } else {
      animated.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  /* ---------------- Newsletter / generic AJAX forms feedback ---------------- */
  document.querySelectorAll("[data-ajax-status-form]").forEach(function (form) {
    form.addEventListener("submit", function () {
      var status = form.querySelector("[data-form-status]");
      if (status) status.setAttribute("hidden", "hidden");
    });
  });
})();
