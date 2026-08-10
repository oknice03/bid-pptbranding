(function () {
  "use strict";

  /* ---- Header scroll shadow ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav toggle ---- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  function closeNav() {
    mainNav.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* ---- Portfolio lightbox (grid markup is static in HTML for SEO/crawlers) ---- */
  var grid = document.getElementById("portfolioGrid");
  var portfolioImages = Array.prototype.map.call(
    grid.querySelectorAll(".portfolio-item"),
    function (item) {
      var img = item.querySelector("img");
      return { src: img.getAttribute("src"), label: item.querySelector(".portfolio-label").textContent };
    }
  );

  /* ---- Lightbox ---- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function updateLightboxImage() {
    var item = portfolioImages[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.label + " 공사지명원 제작 사례 확대 이미지";
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + portfolioImages.length) % portfolioImages.length;
    updateLightboxImage();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % portfolioImages.length;
    updateLightboxImage();
  }

  grid.addEventListener("click", function (e) {
    var item = e.target.closest(".portfolio-item");
    if (!item) return;
    openLightbox(Number(item.getAttribute("data-index")));
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", showPrev);
  lightboxNext.addEventListener("click", showNext);

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
  });

  /* ---- Scroll reveal ---- */
  var revealTargets = document.querySelectorAll(
    ".timeline-item, .service-card, .process-item, .tip-card, .review-card, .portfolio-item"
  );
  if ("IntersectionObserver" in window) {
    revealTargets.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity .5s ease, transform .5s ease";
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
