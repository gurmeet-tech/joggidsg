/* ==========================================================================
   MINHAJ MOTION - vanilla MagicBento port
   The React Bits component's core behaviours, rebuilt without React:
   staggered entrance, pointer spotlight, border glow and a click ripple.
   ========================================================================== */
(function () {
  "use strict";

  const grids = Array.from(document.querySelectorAll("[data-magic-bento]"));
  if (!grids.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  grids.forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll(".bento-card"));
    if (!cards.length) return;

    cards.forEach((card, index) => {
      card.style.setProperty("--mb-delay", index * 0.055 + "s");
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      grid.dataset.state = "in";
    } else {
      grid.dataset.state = "idle";
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0] || !entries[0].isIntersecting) return;
          grid.dataset.state = "in";
          observer.disconnect();
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      observer.observe(grid);
    }

    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const moveSpotlight = () => {
      pointerFrame = 0;
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mb-x", pointerX - rect.left + "px");
        card.style.setProperty("--mb-y", pointerY - rect.top + "px");
      });
    };

    grid.addEventListener(
      "pointermove",
      (event) => {
        if (reducedMotion.matches) return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(moveSpotlight);
      },
      { passive: true }
    );

    grid.addEventListener("pointerleave", () => {
      if (pointerFrame) {
        window.cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
      }
      cards.forEach((card) => {
        card.style.removeProperty("--mb-x");
        card.style.removeProperty("--mb-y");
      });
    });

    cards.forEach((card) => {
      card.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        const rect = card.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "bento-ripple";
        ripple.style.left = event.clientX - rect.left + "px";
        ripple.style.top = event.clientY - rect.top + "px";
        card.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 720);
      });
    });
  });

  reducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    grids.forEach((grid) => {
      grid.dataset.state = "in";
    });
  });
})();
