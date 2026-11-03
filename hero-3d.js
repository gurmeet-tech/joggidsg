/* ==========================================================================
   MINHAJ MOTION - editorial hero 3D scroll interaction
   One video plane, scrubbed directly by scroll progress. CSS keeps a stable
   fallback for reduced motion and for browsers where GSAP is unavailable.
   ========================================================================== */
(function () {
  "use strict";

  const hero = document.querySelector(".hero--editorial");
  const card = document.querySelector("[data-hero-card]");
  if (!hero || !card) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const showFinalState = () => {
    card.style.transform = "none";
    card.style.willChange = "auto";
  };

  if (reducedMotion.matches || !gsap || !ScrollTrigger) {
    showFinalState();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const lenis = window.__mmLenis;
  if (lenis && typeof lenis.on === "function") {
    lenis.on("scroll", ScrollTrigger.update);
  }

  const state = {
    desktop: {
      rotateX: 15,
      z: -80,
      scale: 0.92,
      y: 32,
    },
    tablet: {
      rotateX: 11,
      z: -64,
      scale: 0.94,
      y: 28,
    },
    mobile: {
      rotateX: 7,
      z: -42,
      scale: 0.95,
      y: 22,
    },
  };

  const visual = hero.querySelector(".hero-editorial__visual");

  // End the scrub when the flat card reaches the space just beneath the
  // floating navigation. This keeps the final frame straight and fully visible
  // instead of scrolling it behind the header on short viewports.
  const scrollDistance = () => {
    if (!visual) return Math.round(window.innerHeight * 0.46);
    const headerHeight =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-h")
      ) || 86;
    const heroTop = hero.getBoundingClientRect().top + window.scrollY;
    const visualTop = visual.getBoundingClientRect().top + window.scrollY;
    return Math.max(240, Math.round(visualTop - heroTop - headerHeight - 14));
  };

  const build = (values) => {
    gsap.fromTo(
      card,
      {
        rotateX: values.rotateX,
        z: values.z,
        scale: values.scale,
        y: values.y,
        transformOrigin: "50% 62%",
      },
      {
        rotateX: 0,
        z: 0,
        scale: 1,
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: () => "+=" + scrollDistance(),
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  };

  const media = gsap.matchMedia();
  media.add("(min-width: 1101px)", () => build(state.desktop));
  media.add("(min-width: 721px) and (max-width: 1100px)", () => build(state.tablet));
  media.add("(max-width: 720px)", () => build(state.mobile));

  const refresh = () => ScrollTrigger.refresh();
  const video = hero.querySelector(".hero-editorial__video");

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh).catch(() => {});
  }
  if (video) {
    video.addEventListener("loadedmetadata", refresh, { once: true });
  }
  window.addEventListener("load", refresh, { once: true });

  // If the preference changes while open, release the inline 3D transform.
  reducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    media.revert();
    gsap.killTweensOf(card);
    showFinalState();
  });
})();
