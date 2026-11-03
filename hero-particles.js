/* ==========================================================================
   MINHAJ MOTION - hero light particles
   Soft dust falls from the ray origin. The canvas is masked to the beam, and
   particles swell + lose alpha near the end of their life so they leave the
   light without a hard cut.
   ========================================================================== */
(function () {
  "use strict";

  const hero = document.querySelector(".hero--editorial");
  const canvas = document.querySelector(".hero-editorial__particles");
  if (!hero || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const light = () => document.documentElement.getAttribute("data-theme") === "light";

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let sprites = [];
  let raf = 0;
  let last = 0;
  let visible = true;
  let onScreen = true;
  let ready = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const random = (min, max) => min + Math.random() * (max - min);

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = 1;
  colorCanvas.height = 1;
  const colorCtx = colorCanvas.getContext("2d", { willReadFrequently: true });

  const rgba = (color, alpha) => {
    if (!colorCtx) return "rgba(255,255,255," + alpha + ")";
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = "#fff";
    colorCtx.fillStyle = color;
    colorCtx.fillRect(0, 0, 1, 1);
    const data = colorCtx.getImageData(0, 0, 1, 1).data;
    return "rgba(" + data[0] + "," + data[1] + "," + data[2] + "," + alpha + ")";
  };

  const makeSprite = (color) => {
    const sprite = document.createElement("canvas");
    sprite.width = 64;
    sprite.height = 64;
    const spriteCtx = sprite.getContext("2d");
    if (!spriteCtx) return sprite;
    const gradient = spriteCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, rgba(color, 1));
    gradient.addColorStop(0.22, rgba(color, 0.86));
    gradient.addColorStop(0.55, rgba(color, 0.24));
    gradient.addColorStop(1, rgba(color, 0));
    spriteCtx.fillStyle = gradient;
    spriteCtx.fillRect(0, 0, 64, 64);
    return sprite;
  };

  const readPalette = () => {
    const styles = getComputedStyle(document.documentElement);
    const fg = styles.getPropertyValue("--fg").trim() || (light() ? "#0c0c0d" : "#f7f7f5");
    const accent =
      styles.getPropertyValue("--accent-blue").trim() || (light() ? "#315fca" : "#8aa5ff");
    sprites = [makeSprite(fg), makeSprite(accent)];
  };

  const spawn = (seeded) => {
    const angle = random(-0.22, 0.22);
    const speed = random(18, 54);
    const life = random(6800, 12400);
    const born = seeded ? Math.random() * life * 0.64 : 0;
    const startY = seeded
      ? -18 + (born / life) * height * 0.64
      : -18 - Math.random() * height * 0.08;
    const drift = random(-5, 5);
    return {
      x: width * 0.5 + random(-width * 0.026, width * 0.026),
      y: startY,
      vx: Math.sin(angle) * speed * 0.45 + drift,
      vy: Math.cos(angle) * speed,
      size: random(4.5, 11),
      age: born,
      life: life,
      alpha: random(0.22, 0.62),
      tint: Math.random() < 0.22 ? 1 : 0,
      phase: Math.random() * Math.PI * 2,
      twinkle: random(0.7, 1.5),
    };
  };

  const fill = () => {
    const count = Math.min(
      window.innerWidth < 721 ? 34 : 58,
      Math.max(18, Math.round((width * height) / 26000))
    );
    particles = [];
    for (let i = 0; i < count; i++) particles.push(spawn(true));
  };

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fill();
  };

  const draw = (now) => {
    raf = 0;
    if (!ready || !visible || !onScreen || reducedMotion.matches) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000 || 0.016));
    last = now;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = light() ? "source-over" : "lighter";

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.age += dt * 1000;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.age >= p.life || p.y > height * 0.86) {
        particles[i] = spawn(false);
        continue;
      }

      const lifeProgress = clamp(p.age / p.life, 0, 1);
      const depthFade = 1 - smoothstep(height * 0.52, height * 0.84, p.y);
      const lifeFade = 1 - smoothstep(0.5, 1, lifeProgress);
      const exit = 1 - Math.min(depthFade, lifeFade);
      const twinkle = 0.76 + 0.24 * Math.sin(now * 0.0016 * p.twinkle + p.phase);
      const alpha = p.alpha * depthFade * lifeFade * twinkle;
      if (alpha <= 0.002) continue;

      const size = p.size * (1 + exit * 3.8);
      const sprite = sprites[p.tint];
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, p.x - size * 0.5, p.y - size * 0.5, size, size);
    }

    ctx.globalAlpha = 1;
    raf = window.requestAnimationFrame(draw);
  };

  const start = () => {
    if (raf || !ready || reducedMotion.matches || !visible || !onScreen) return;
    last = performance.now();
    raf = window.requestAnimationFrame(draw);
  };

  const stop = () => {
    if (!raf) return;
    window.cancelAnimationFrame(raf);
    raf = 0;
  };

  const boot = () => {
    if (ready || reducedMotion.matches) return;
    ready = true;
    readPalette();
    resize();
    start();
  };

  if (reducedMotion.matches) canvas.hidden = true;

  document.addEventListener("mm-theme-change", () => {
    if (!ready) return;
    readPalette();
  });

  const countObserver = new IntersectionObserver(
    (entries) => {
      onScreen = entries[0] ? entries[0].isIntersecting : true;
      if (onScreen) start();
      else stop();
    },
    { rootMargin: "120px 0px" }
  );
  countObserver.observe(hero);

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  });

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      if (!ready) return;
      resize();
    });
    resizeObserver.observe(hero);
  } else {
    window.addEventListener("resize", resize);
  }

  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      stop();
      canvas.hidden = true;
      return;
    }
    canvas.hidden = false;
    if (ready) start();
    else boot();
  });

  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot, { once: true });
  }
})();
