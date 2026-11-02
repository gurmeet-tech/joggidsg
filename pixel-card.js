/* ==========================================================================
   PixelCard - vanilla canvas port of the React Bits component.
   Used as a subtle interactive layer on the contact cards.
   ========================================================================== */
(function () {
  "use strict";

  const APPEAR = 0.26;
  const EXIT = 0.22;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const easeOutBack = (t) => {
    const c = 1.9;
    const u = t - 1;
    return 1 + (c + 1) * u * u * u + c * u * u;
  };

  const toList = (value) =>
    (Array.isArray(value) ? value : String(value || "").split(","))
      .map((color) => color.trim())
      .filter(Boolean);

  const toRgb = (() => {
    let context = null;
    return (color) => {
      if (typeof document === "undefined") return [255, 255, 255];
      if (!context) {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        context = canvas.getContext("2d", { willReadFrequently: true });
      }
      if (!context) return [255, 255, 255];
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = "#fff";
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
  })();

  const number = (el, key, fallback) => {
    const value = parseFloat(el.dataset[key]);
    return Number.isFinite(value) ? value : fallback;
  };

  function readSettings(container) {
    const root = getComputedStyle(document.documentElement);
    const light = document.documentElement.getAttribute("data-theme") === "light";
    const fg = root.getPropertyValue("--fg").trim() || (light ? "#0c0c0d" : "#f7f7f5");
    const muted = root.getPropertyValue("--muted").trim() || (light ? "#5f5e59" : "#a3a3a0");
    const border = root.getPropertyValue("--border-strong").trim() || (light ? "#cbc7bc" : "#3a3a3d");
    const palette = toList(container.dataset.pixelColors);
    const colors = palette.length ? palette : light ? [fg, muted, border] : [fg, muted, border];

    return {
      colors,
      gap: Math.max(2, number(container, "pixelGap", 5)),
      speed: clamp(number(container, "pixelSpeed", 35), 0, 100),
      pixelSize: Math.max(0.5, number(container, "pixelSize", 2)),
      revealDuration: Math.max(50, number(container, "pixelReveal", 600)),
      spotlight: clamp(number(container, "pixelSpotlight", 0.5), 0, 1),
      glow: clamp(number(container, "pixelGlow", 0.5), 0, 1),
      glowColor: toRgb(container.dataset.pixelGlowColor || fg),
      opacity: clamp(number(container, "pixelOpacity", 1), 0, 1),
      fade: clamp(number(container, "pixelFade", 0), 0, 1),
      trigger: container.dataset.pixelTrigger === "always" ? "always" : "hover",
      clickPulse: container.dataset.pixelClickPulse !== "false",
      intro: container.dataset.pixelIntro !== "false",
      introDelay: Math.max(0, number(container, "pixelIntroDelay", 0)),
    };
  }

  function mount(container) {
    if (container.dataset.pixelMounted) return;
    container.dataset.pixelMounted = "1";

    const canvas = container.querySelector(".pixel-card__canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const settings = readSettings(container);

    const state = {
      alive: true,
      raf: 0,
      last: 0,
      time: 0,
      visible: true,
      width: 0,
      height: 0,
      ratio: 1,
      key: "",
      count: 0,
      x: new Float32Array(0),
      y: new Float32Array(0),
      tint: new Uint8Array(0),
      size: new Float32Array(0),
      phase: new Float32Array(0),
      rate: new Float32Array(0),
      jitter: new Float32Array(0),
      presence: new Float32Array(0),
      delay: new Float32Array(0),
      mask: new Float32Array(0),
      maskKey: "",
      active: false,
      changedAt: 0,
      originX: 0,
      originY: 0,
      maxDistance: 1,
      pointerX: 0,
      pointerY: 0,
      spotX: 0,
      spotY: 0,
      spotVX: 0,
      spotVY: 0,
      spotPower: 0,
      hovering: false,
      pulses: [],
      dt: 1 / 60,
      releaseAt: -1,
      introAt: -1,
    };

    const build = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const key = [width, height, ratio, settings.gap, settings.pixelSize, settings.colors.join(",")].join("|");
      if (key === state.key) return;
      state.key = key;
      state.width = width;
      state.height = height;
      state.ratio = ratio;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      const columns = Math.floor((width - 1) / settings.gap) + 1;
      const rows = Math.floor((height - 1) / settings.gap) + 1;
      const offsetX = (width - (columns - 1) * settings.gap) / 2;
      const offsetY = (height - (rows - 1) * settings.gap) / 2;
      const count = columns * rows;
      const previous = state.presence;
      state.count = count;
      state.x = new Float32Array(count);
      state.y = new Float32Array(count);
      state.tint = new Uint8Array(count);
      state.size = new Float32Array(count);
      state.phase = new Float32Array(count);
      state.rate = new Float32Array(count);
      state.jitter = new Float32Array(count);
      state.presence = new Float32Array(count);
      state.delay = new Float32Array(count);

      let i = 0;
      for (let column = 0; column < columns; column++) {
        for (let row = 0; row < rows; row++) {
          state.x[i] = offsetX + column * settings.gap;
          state.y[i] = offsetY + row * settings.gap;
          state.tint[i] = Math.floor(Math.random() * settings.colors.length);
          state.size[i] = settings.pixelSize * (0.25 + Math.random() * 0.75);
          state.phase[i] = Math.random() * Math.PI * 2;
          state.rate[i] = 0.55 + Math.random() * 0.9;
          state.jitter[i] = Math.random();
          if (previous.length) state.presence[i] = previous[Math.min(i, previous.length - 1)];
          i++;
        }
      }
      state.maxDistance = Math.hypot(width, height);
      schedule();
    };

    const schedule = () => {
      const span = settings.revealDuration / 1000;
      let far = 1;
      for (let i = 0; i < state.count; i++) {
        far = Math.max(far, Math.hypot(state.x[i] - state.originX, state.y[i] - state.originY));
      }
      state.maxDistance = far;
      for (let i = 0; i < state.count; i++) {
        const distance = Math.hypot(state.x[i] - state.originX, state.y[i] - state.originY) / far;
        state.delay[i] = state.active
          ? distance * span * 0.82 + state.jitter[i] * span * 0.18
          : (1 - distance) * span * 0.45 + state.jitter[i] * span * 0.1;
      }
    };

    const setActiveState = (value, x, y) => {
      if (state.active === value) return;
      state.active = value;
      state.changedAt = state.time;
      if (value) {
        state.originX = state.width / 2;
        state.originY = state.height / 2;
      }
      schedule();
      container.classList.toggle("is-pixel-active", value);
      wake();
    };

    const draw = () => {
      const { width, height, ratio } = state;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const maskKey = state.count + "|" + width + "|" + height + "|" + settings.fade;
      if (state.maskKey !== maskKey) {
        state.maskKey = maskKey;
        state.mask = new Float32Array(state.count);
        const near = Math.min(width, height) * 0.05;
        const far = Math.min(width, height) * 0.42;
        for (let i = 0; i < state.count; i++) {
          const edge = Math.min(state.x[i], width - state.x[i], state.y[i], height - state.y[i]);
          const t = clamp((edge - near) / (far - near), 0, 1);
          state.mask[i] = 1 - settings.fade * t * t * t * (t * (t * 6 - 15) + 10);
        }
      }

      let presenceSum = 0;
      const elapsed = state.time - state.changedAt;
      const appearStep = state.dt / APPEAR;
      const exitStep = state.dt / EXIT;
      for (let i = 0; i < state.count; i++) {
        const current = state.presence[i];
        const ready = elapsed >= state.delay[i] || reduce;
        const target = state.active ? (ready ? 1 : 0) : ready ? 0 : current;
        if (reduce) state.presence[i] = target;
        else if (target > current) state.presence[i] = Math.min(1, current + appearStep);
        else if (target < current) state.presence[i] = Math.max(0, current - exitStep);
        presenceSum += state.presence[i];
      }
      const presenceAvg = state.count ? presenceSum / state.count : 0;

      if (settings.glow > 0 && presenceAvg > 0.001) {
        const [r, g, b] = settings.glowColor;
        const cx = state.spotPower > 0.01 ? state.spotX : state.originX;
        const cy = state.spotPower > 0.01 ? state.spotY : state.originY;
        const reach = Math.max(width, height) * 0.85;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach);
        const strength = settings.glow * settings.opacity * 0.3 * Math.min(1, presenceAvg * 1.4);
        gradient.addColorStop(0, "rgba(" + r + ", " + g + ", " + b + ", " + strength + ")");
        gradient.addColorStop(0.45, "rgba(" + r + ", " + g + ", " + b + ", " + strength * 0.35 + ")");
        gradient.addColorStop(1, "rgba(" + r + ", " + g + ", " + b + ", 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      const spotRadius = Math.min(width, height) * 0.38 + 30;
      const spotStrength = settings.spotlight * state.spotPower;
      const pulses = state.pulses;
      const twinkle = reduce ? 0 : smoothstep(0, 100, settings.speed) > 0 ? 1 : 0;
      const frequency = (settings.speed / 35) * 1.35;

      for (let color = 0; color < settings.colors.length; color++) {
        ctx.fillStyle = settings.colors[color];
        for (let i = 0; i < state.count; i++) {
          if (state.tint[i] !== color) continue;
          const presence = state.presence[i];
          if (presence <= 0.002) continue;
          const x = state.x[i];
          const y = state.y[i];
          let size = state.size[i];
          let alpha = 0.5 + presence * 0.38;
          if (twinkle) {
            const wave = Math.sin(state.phase[i] + state.time * frequency * state.rate[i]);
            size *= 0.62 + 0.38 * wave;
            alpha += 0.12 * wave + (state.jitter[i] > 0.92 ? 0.35 * Math.max(0, wave) : 0);
          }
          size *= easeOutBack(presence);
          const flash = presence < 1 && state.active ? Math.sin(presence * Math.PI) : 0;
          size *= 1 + flash * 0.9;
          alpha += flash * 0.6;
          if (spotStrength > 0.001) {
            const near = smoothstep(spotRadius, 0, Math.hypot(x - state.spotX, y - state.spotY));
            size *= 1 + spotStrength * near * near * 2.4;
            alpha += spotStrength * near * 0.45;
          }
          alpha = Math.min(1, alpha) * state.mask[i] * settings.opacity;
          if (alpha <= 0.004) continue;
          for (let p = 0; p < pulses.length; p++) {
            const pulse = pulses[p];
            const band = (Math.hypot(x - pulse.x, y - pulse.y) - pulse.radius) / 26;
            const wave = Math.exp(-band * band) * pulse.power;
            size *= 1 + wave * 1.4;
            alpha = Math.min(1, alpha + wave * 0.5);
          }
          if (size <= 0.05) continue;
          ctx.globalAlpha = alpha;
          ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        }
      }
      ctx.globalAlpha = 1;
      return presenceSum;
    };

    const frame = (now) => {
      state.raf = 0;
      if (!state.alive) return;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      state.dt = dt;
      state.time += dt;
      build();

      if (state.introAt >= 0 && state.time >= state.introAt) {
        state.introAt = -1;
        if (!state.active) {
          setActiveState(true);
          state.releaseAt = state.time + settings.revealDuration / 1000 + 0.7;
        }
      }

      if (state.releaseAt >= 0 && state.time >= state.releaseAt && !state.hovering) {
        state.releaseAt = -1;
        setActiveState(false);
      }

      const want = state.hovering && !reduce ? 1 : 0;
      state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 6 : 3) * dt));
      const stiffness = 120;
      const damping = 2 * Math.sqrt(stiffness) * 0.9;
      state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
      state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
      state.spotX += state.spotVX * dt;
      state.spotY += state.spotVY * dt;

      const pulseSpeed = state.maxDistance / Math.max(0.35, (settings.revealDuration / 1000) * 0.9);
      state.pulses = state.pulses.filter((pulse) => {
        pulse.radius += pulseSpeed * dt;
        pulse.power = Math.max(0, 1 - pulse.radius / (state.maxDistance + 40));
        return pulse.power > 0;
      });

      const presence = draw();
      const settling =
        state.active ||
        state.introAt >= 0 ||
        presence > 0 ||
        state.pulses.length > 0 ||
        state.spotPower > 0.002 ||
        Math.abs(state.spotVX) + Math.abs(state.spotVY) > 0.5;
      if (settling && state.visible) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const wake = () => {
      if (!state.raf && state.alive && state.visible) state.raf = requestAnimationFrame(frame);
    };

    const local = (event) => {
      const rect = container.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top];
    };

    const onEnter = (event) => {
      const [x, y] = local(event);
      state.hovering = event.pointerType !== "touch";
      state.pointerX = x;
      state.pointerY = y;
      if (state.spotPower < 0.01) {
        state.spotX = x;
        state.spotY = y;
        state.spotVX = 0;
        state.spotVY = 0;
      }
      state.releaseAt = -1;
      state.introAt = -1;
      setActiveState(true, x, y);
      wake();
    };

    const onMove = (event) => {
      const [x, y] = local(event);
      state.pointerX = x;
      state.pointerY = y;
      wake();
    };

    const onLeave = (event) => {
      state.hovering = false;
      if (event.pointerType === "touch") state.releaseAt = state.time + 1.2;
      else setActiveState(false);
      wake();
    };

    const onDown = (event) => {
      const [x, y] = local(event);
      if (!state.active) setActiveState(true, x, y);
      if (settings.clickPulse && !reduce && state.active) {
        state.pulses.push({ x, y, radius: 0, power: 1 });
      }
      wake();
    };

    const onFocusIn = () => {
      state.introAt = -1;
      setActiveState(true);
      wake();
    };

    const onFocusOut = (event) => {
      if (container.contains(event.relatedTarget)) return;
      if (!state.hovering) setActiveState(false);
    };

    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);

    const resizeObserver = new ResizeObserver(() => {
      build();
      wake();
    });
    resizeObserver.observe(container);

    let introStarted = false;
    const visibility = new IntersectionObserver(
      (entries) => {
        state.visible = entries.some((entry) => entry.isIntersecting);
        if (state.visible && !introStarted && (settings.trigger === "always" || settings.intro)) {
          introStarted = true;
          build();
          state.introAt = state.time + settings.introDelay / 1000;
        }
        if (state.visible) wake();
      },
      { threshold: 0.2 }
    );
    visibility.observe(container);

    const onTheme = () => {
      Object.assign(settings, readSettings(container));
      state.key = "";
      build();
      wake();
    };
    document.addEventListener("mm-theme-change", onTheme);

    build();
    state.pointerX = state.width / 2;
    state.pointerY = state.height / 2;
    state.spotX = state.pointerX;
    state.spotY = state.pointerY;
    state.originX = state.width / 2;
    state.originY = state.height / 2;
    if (settings.trigger === "always") {
      setActiveState(true);
      state.releaseAt = -1;
    }
    wake();
  }

  document.querySelectorAll("[data-pixel-card]").forEach(mount);
})();
