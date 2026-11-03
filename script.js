/* ==========================================================================
   MINHAJ MOTION — interactions
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  window.__mmReducedMotion = reducedMotion;

  /* ------------------------------------------------------- Floating navigation */
  const siteHeader = $("#siteHeader");
  if (siteHeader) {
    const navArcFill = $(".nav-progress-arc__fill", siteHeader);
    let headerFrame = 0;

    const updateHeader = () => {
      headerFrame = 0;
      const y = window.scrollY;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.min(1, Math.max(0, y / maxScroll));
      siteHeader.style.setProperty("--nav-progress", progress.toFixed(4));
      if (navArcFill) {
        navArcFill.style.strokeDashoffset = (100 - progress * 100).toFixed(2);
      }

      // Stay in the compact island on any upward scroll. Only the very top
      // restores the full navigation bar.
      if (y > 28) {
        siteHeader.classList.add("is-condensed");
      } else if (y <= 8) {
        siteHeader.classList.remove("is-condensed");
      }
    };

    const requestHeaderUpdate = () => {
      if (headerFrame) return;
      headerFrame = window.requestAnimationFrame(updateHeader);
    };

    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
    window.addEventListener("resize", requestHeaderUpdate);
    updateHeader();
  }

  /* ---------------------------------------------------------------- Hero reel */
  const heroReels = $$(".macbook__video, .hero-editorial__video");
  if (heroReels.length) {
    if (reducedMotion) {
      heroReels.forEach((video) => {
        video.removeAttribute("autoplay");
        video.pause();
      });
    }
    const syncHeroReels = () => {
      heroReels.forEach((video) => {
        if (document.hidden) {
          video.pause();
        } else if (!reducedMotion) {
          video.play().catch(() => {});
        }
      });
    };
    document.addEventListener("visibilitychange", syncHeroReels);
    window.addEventListener("load", syncHeroReels);
  }

  /* --------------------------------------------------------------- Intro loader */
  (function initIntro() {
    const root = document.documentElement;
    const preloader = $("#preloader");
    const introMode = root.getAttribute("data-intro");

    if (introMode !== "play" || !preloader) {
      if (preloader) preloader.remove();
      root.classList.remove("is-loading");
      return;
    }

    const regions = $$("body > .site-header, body > main, body > .site-footer, body > .skip-link");
    let finished = false;
    let exiting = false;
    const timers = [];

    document.body.classList.add("no-scroll");
    document.body.setAttribute("aria-busy", "true");
    regions.forEach((el) => {
      el.inert = true;
    });

    const finalize = () => {
      if (finished) return;
      finished = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      preloader.hidden = true;
      preloader.remove();
      root.setAttribute("data-intro", "done");
      root.classList.remove("is-loading");
      root.classList.add("is-ready");
      document.body.classList.remove("no-scroll");
      document.body.removeAttribute("aria-busy");
      regions.forEach((el) => {
        el.inert = false;
      });
      try {
        sessionStorage.setItem("mm-intro-seen", "1");
      } catch (e) {}
    };

    const exit = () => {
      if (exiting || finished) return;
      exiting = true;
      preloader.classList.add("is-exiting");
      root.classList.remove("is-loading");
      root.classList.add("is-ready");
      document.body.classList.remove("no-scroll");
      document.body.removeAttribute("aria-busy");
      regions.forEach((el) => {
        el.inert = false;
      });
      timers.push(window.setTimeout(finalize, 1000));
    };

    if (reducedMotion) {
      timers.push(window.setTimeout(finalize, 160));
      return;
    }

    // Three full-width slices arrive from above, one after another, then merge.
    const start = () => {
      preloader.classList.add("is-running");
      timers.push(window.setTimeout(() => preloader.classList.add("is-merged"), 3220));
      timers.push(window.setTimeout(exit, 3740));
    };
    requestAnimationFrame(() => requestAnimationFrame(start));
  })();

  /* ------------------------------------------------------------------ Theme */
  const themeToggle = $("#themeToggle");
  const themeMeta = $('meta[name="theme-color"]');

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) {
      try {
        localStorage.setItem("mm-theme", theme);
      } catch (e) {}
    }
    if (themeToggle) {
      const next = theme === "dark" ? "light" : "dark";
      themeToggle.setAttribute("aria-label", "Switch to " + next + " mode");
      themeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    }
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0a0a0b" : "#f5f4f0");
    try {
      document.dispatchEvent(new CustomEvent("mm-theme-change", { detail: { theme: theme } }));
    } catch (e) {}
  }

  if (themeToggle) {
    applyTheme(document.documentElement.getAttribute("data-theme") || "dark", false);
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark", true);
    });
  }

  /* ------------------------------------------------------------- Mobile menu */
  const menuToggle = $("#menuToggle");
  const mobileMenu = $("#mobileMenu");

  function closeMenu() {
    if (!menuToggle || !mobileMenu || mobileMenu.hidden) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    mobileMenu.hidden = true;
    document.body.classList.remove("no-scroll");
    // Closing the sheet must not pop the island back open mid-page.
    if (siteHeader) {
      if (window.scrollY > 8) siteHeader.classList.add("is-condensed");
      else siteHeader.classList.remove("is-condensed");
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu();
      } else {
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close menu");
        mobileMenu.hidden = false;
        document.body.classList.add("no-scroll");
      }
    });

    $$("a", mobileMenu).forEach((a) => a.addEventListener("click", closeMenu));
  }

  // Orientation + gallery metadata for the lightbox.
  const showreelMedia = $(".showreel__media");
  if (showreelMedia) {
    showreelMedia.dataset.orientation = "landscape";
    showreelMedia.dataset.gallery = "showreel";
  }

  /* ------------------------------------------------------- Work grid previews */
  function bindPreview(container) {
    if (!canHover || container.dataset.previewBound) return;
    const video = $("video[data-preview]", container);
    if (!video) return;
    container.dataset.previewBound = "1";
    let playToken = 0;

    const start = () => {
      const token = ++playToken;
      if (!video.getAttribute("src")) {
        video.src = video.dataset.preview;
        video.load();
      }
      const attempt = video.play();
      if (attempt && typeof attempt.then === "function") attempt.catch(() => {});
      if (token === playToken) container.classList.add("is-playing");
    };

    const stop = () => {
      playToken++;
      video.pause();
      try {
        video.currentTime = 0;
      } catch (e) {}
      container.classList.remove("is-playing");
    };

    container.addEventListener("mouseenter", start);
    container.addEventListener("mouseleave", stop);
    container.addEventListener("focusout", stop);
  }

  $$("#workGrid .work-card__media").forEach((media) => {
    const wide = media.closest(".work-card--wide");
    media.dataset.orientation = wide ? "landscape" : "portrait";
    media.dataset.gallery = "work";
  });
  $$("#workGrid .work-card").forEach(bindPreview);

  /* ---------------------------------------------------------------- Work filters */
  const filterButtons = $$(".filters .filter");
  const workCards = $$("#workGrid .work-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", active ? "true" : "false");
      });

      workCards.forEach((card) => {
        const show = filter === "all" || card.dataset.cat === filter;
        if (card._hideTimer) {
          window.clearTimeout(card._hideTimer);
          card._hideTimer = null;
        }
        if (show) {
          card.classList.remove("is-hidden");
          card.classList.add("is-filtering");
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => card.classList.remove("is-filtering"));
          });
        } else {
          card.classList.add("is-filtering");
          card._hideTimer = window.setTimeout(() => {
            card.classList.add("is-hidden");
            card.classList.remove("is-filtering");
            card._hideTimer = null;
          }, 200);
        }
      });
    });
  });

  /* ------------------------------------------------------------------ Header */
  const header = $("#siteHeader");
  const heroGhost = $(".hero__ghost");
  const navLinks = $$(".site-nav a[data-nav]");
  const navSectionLabel = $("#navSectionLabel");
  const sectionLabels = {
    top: "Home",
    work: "Showreel",
    about: "About",
    testimonials: "Reviews",
    faq: "FAQ",
    contact: "Contact",
    book: "Book a call",
  };
  const sectionIds = ["top", "work", "about", "testimonials", "faq", "contact", "book"];
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle("is-scrolled", y > 8);

    if (heroGhost && !reducedMotion) {
      heroGhost.style.transform = "translateX(-50%) translateY(" + Math.min(y * 0.09, 70) + "px)";
    }

    // Scroll spy
    let active = "top";
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.getBoundingClientRect().top - 130 <= 0) active = id;
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = href === "#" + active;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (navSectionLabel) {
      navSectionLabel.textContent = sectionLabels[active] || "Home";
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------------------------------------------------------- Booking calendar */
  const bookingCalendar = $("[data-booking-calendar]");
  if (bookingCalendar) {
    const grid = $("[data-cal-grid]", bookingCalendar);
    const slotsEl = $("[data-cal-slots]", bookingCalendar);
    const title = $("[data-cal-title]", bookingCalendar);
    const note = $("[data-cal-note]", bookingCalendar);
    const cta = $("[data-cal-cta]", bookingCalendar);
    const prevBtn = $("[data-cal-prev]", bookingCalendar);
    const nextBtn = $("[data-cal-next]", bookingCalendar);
    const slots = ["10:00", "11:30", "13:00", "14:30", "16:00"];

    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const dateKey = (date) =>
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");

    const nextAvailableDay = (from) =>
      new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);

    const availableTimes = (date) => {
      if (date.getDay() === 5) return slots.slice(0, 3);
      if (date.getDay() === 1) return slots.slice(1);
      return slots;
    };

    const today = startOfDay(new Date());
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 6, 1);
    let selectedDate = nextAvailableDay(today);
    let viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    let selectedTime = availableTimes(selectedDate)[0] || "";

    function updateBookingSummary() {
      if (!selectedDate) return;
      const shortDate = selectedDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const longDate = selectedDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const subject = "Intro call — " + shortDate + (selectedTime ? " " + selectedTime : "");
      const body =
        "Hi Minhaj,\n\nI'd like to book the intro call on " +
        longDate +
        (selectedTime ? " at " + selectedTime + " GMT" : "") +
        ".\n\nA little about my project: ";
      if (note) {
        note.textContent = selectedTime
          ? longDate + " · " + selectedTime + " GMT · 30 minutes"
          : "Choose an available time to continue.";
      }
      if (cta) {
        cta.href =
          "mailto:clipzymediaco@gmail.com?subject=" +
          encodeURIComponent(subject) +
          "&body=" +
          encodeURIComponent(body);
      }
    }

    function renderSlots() {
      if (!slotsEl || !selectedDate) return;
      const times = availableTimes(selectedDate);
      if (!times.includes(selectedTime)) selectedTime = times[0] || "";
      slotsEl.innerHTML = "";
      times.forEach((time) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "booking-calendar__slot";
        button.textContent = time;
        button.dataset.time = time;
        button.setAttribute("aria-pressed", time === selectedTime ? "true" : "false");
        if (time === selectedTime) button.classList.add("is-active");
        button.addEventListener("click", () => {
          selectedTime = time;
          $$(".booking-calendar__slot", slotsEl).forEach((slot) => {
            const active = slot.dataset.time === time;
            slot.classList.toggle("is-active", active);
            slot.setAttribute("aria-pressed", active ? "true" : "false");
          });
          updateBookingSummary();
        });
        slotsEl.appendChild(button);
      });
      updateBookingSummary();
    }

    function syncSelectedDay() {
      if (!grid || !selectedDate) return;
      const selectedKey = dateKey(selectedDate);
      $$(".booking-calendar__day[data-date]", grid).forEach((button) => {
        const active = button.dataset.date === selectedKey;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function renderCalendar() {
      if (!grid) return;
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      if (title) {
        title.textContent = viewDate.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        });
      }
      if (prevBtn) prevBtn.disabled = viewDate <= minMonth;
      if (nextBtn) nextBtn.disabled = viewDate >= maxMonth;

      const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
      const totalDays = new Date(year, month + 1, 0).getDate();
      grid.innerHTML = "";

      for (let i = 0; i < firstWeekday; i++) {
        const blank = document.createElement("span");
        blank.className = "booking-calendar__day is-empty";
        blank.setAttribute("aria-hidden", "true");
        grid.appendChild(blank);
      }

      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const disabled = date < today;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "booking-calendar__day";
        button.dataset.date = dateKey(date);
        button.textContent = String(day);
        button.setAttribute(
          "aria-label",
          date.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        );
        if (sameDay(date, today)) button.classList.add("is-today");
        if (!disabled) button.classList.add("has-slots");
        if (sameDay(date, selectedDate)) {
          button.classList.add("is-selected");
          button.setAttribute("aria-pressed", "true");
        } else {
          button.setAttribute("aria-pressed", "false");
        }
        button.disabled = disabled;
        button.addEventListener("click", () => {
          if (disabled) return;
          selectedDate = date;
          selectedTime = availableTimes(date)[0] || "";
          syncSelectedDay();
          renderSlots();
        });
        grid.appendChild(button);
      }
    }

    const shiftMonth = (amount) => {
      const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + amount, 1);
      if (next < minMonth || next > maxMonth) return;
      viewDate = next;
      renderCalendar();
    };

    if (prevBtn) prevBtn.addEventListener("click", () => shiftMonth(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => shiftMonth(1));

    renderCalendar();
    renderSlots();
  }

  /* ----------------------------------------------------------------- Reveals */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------------------------------------------------------------- Counters */
  const counters = $$(".stat__num");
  let countersDone = false;

  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    counters.forEach((el) => {
      const target = parseFloat(el.dataset.target || "0");
      const duration = 1500;
      const start = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      el.textContent = "0";
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        el.textContent = Math.round(target * ease(p)).toString();
        if (p < 1) window.requestAnimationFrame(tick);
      }
      window.requestAnimationFrame(tick);
    });
  }

  const statsBand = $(".stats-band");
  if (statsBand && "IntersectionObserver" in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          runCounters();
          statsObserver.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    statsObserver.observe(statsBand);
  } else {
    runCounters();
  }

  /* -------------------------------------------------------------- Testimonials */
  const reviewTrack = $("#reviewTrack");
  if (reviewTrack) {
    const originals = $$(".review", reviewTrack);
    originals.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      reviewTrack.appendChild(clone);
    });
  }

  /* ------------------------------------------------------------ Marquee fill */
  // Keeps every loop seamless on wide screens by repeating the track until a
  // half is at least as wide as the viewport.
  function fillMarquee(track) {
    if (!track) return;
    let guard = 0;
    while (track.scrollWidth / 2 < window.innerWidth && guard < 5) {
      Array.from(track.children).forEach((node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.classList.remove("is-playing");
        if (clone.matches("button, a")) clone.setAttribute("tabindex", "-1");
        $$("button, a", clone).forEach((el) => el.setAttribute("tabindex", "-1"));
        clone.removeAttribute("data-preview-bound");
        const cloneVideo = $("video[data-preview]", clone);
        if (cloneVideo) {
          cloneVideo.removeAttribute("src");
        }
        track.appendChild(clone);
      });
      guard++;
    }
  }

  fillMarquee($(".ticker-track"));
  fillMarquee(reviewTrack);

  /* ---------------------------------------------------------------- Lightbox */
  const lightbox = $("#lightbox");
  const lbVideo = $("#lbVideo");
  const lbTitle = $("#lbTitle");
  const lbCat = $("#lbCat");
  const lbDuration = $("#lbDuration");
  const lbCount = $("#lbCount");
  const dialog = $(".lightbox__dialog", lightbox);
  let gallery = [];
  let current = 0;
  let lastFocused = null;

  function items() {
    return $$('[data-lightbox]:not([aria-hidden="true"])');
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function showItem(index) {
    if (!gallery.length) return;
    current = (index + gallery.length) % gallery.length;
    const item = gallery[current];
    const src = item.dataset.src;
    const poster = item.dataset.poster || "";
    const title = item.dataset.title || "Project";
    const cat = item.dataset.category || "Film";
    const duration = item.dataset.duration || "";

    lbTitle.textContent = title;
    lbCat.textContent = cat;
    lbDuration.textContent = duration;
    lbCount.textContent = pad(current + 1) + " / " + pad(gallery.length);
    lightbox.classList.toggle("is-portrait", item.dataset.orientation === "portrait");
    if (poster) lbVideo.setAttribute("poster", poster);
    else lbVideo.removeAttribute("poster");

    lbVideo.src = src;
    lbVideo.muted = false;
    const attempt = lbVideo.play();
    if (attempt && typeof attempt.then === "function") attempt.catch(() => {});
  }

  function openLightbox(item) {
    const group = item.dataset.gallery;
    gallery = group
      ? items().filter((el) => el.dataset.gallery === group)
      : items();
    const index = gallery.indexOf(item);
    current = index < 0 ? 0 : index;
    lightbox.classList.toggle("is-single", gallery.length <= 1);
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("no-scroll");
    showItem(current);
    const closeBtn = $(".lightbox__btn--close", lightbox);
    if (closeBtn) window.setTimeout(() => closeBtn.focus(), 60);
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("no-scroll");
    lbVideo.pause();
    lbVideo.removeAttribute("src");
    lbVideo.load();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox]");
    if (trigger) {
      event.preventDefault();
      openLightbox(trigger);
      return;
    }
    if (event.target.closest("[data-close]")) {
      event.preventDefault();
      closeLightbox();
    }
  });

  const lbPrev = $("#lbPrev");
  const lbNext = $("#lbNext");
  if (lbPrev) lbPrev.addEventListener("click", () => showItem(current - 1));
  if (lbNext) lbNext.addEventListener("click", () => showItem(current + 1));

  document.addEventListener("keydown", (event) => {
    if (!lightbox.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showItem(current - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showItem(current + 1);
      } else if (event.key === "Tab" && dialog) {
        const focusable = $$(
          'button, [href], video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          dialog
        ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    } else if (event.key === "Escape" && menuToggle && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  });

  // Keep the portrait/landscape framing accurate once metadata arrives.
  if (lbVideo) {
    lbVideo.addEventListener("loadedmetadata", () => {
      if (!lbVideo.videoWidth) return;
      const portrait = lbVideo.videoHeight > lbVideo.videoWidth;
      lightbox.classList.toggle("is-portrait", portrait);
    });
  }

  /* --------------------------------------------------------------- Copy email */
  const toast = $("#toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || "";
      try {
        await navigator.clipboard.writeText(text);
        showToast("Email copied to clipboard");
      } catch (e) {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
          showToast("Email copied to clipboard");
        } catch (err) {
          showToast(text);
        }
        document.body.removeChild(temp);
      }
    });
  });

  /* ------------------------------------------------------- Media protections */
  function hardenMedia() {
    $$("img, video").forEach((media) => {
      media.draggable = false;
      media.setAttribute("draggable", "false");
    });
    $$("video").forEach((video) => {
      video.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
      try {
        video.disablePictureInPicture = true;
        video.disableRemotePlayback = true;
      } catch (e) {}
    });
  }

  hardenMedia();

  const isMediaTarget = (target) =>
    target instanceof Element && Boolean(target.closest("img, video, canvas"));

  document.addEventListener("contextmenu", (event) => {
    if (!isMediaTarget(event.target)) return;
    event.preventDefault();
    showToast("Media is preview only");
  });

  document.addEventListener("dragstart", (event) => {
    if (isMediaTarget(event.target)) event.preventDefault();
  });

  document.addEventListener("selectstart", (event) => {
    if (isMediaTarget(event.target)) event.preventDefault();
  });

  /* ---------------------------------------------------------- Button feedback */
  if (!reducedMotion) {
    $$(".btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const rect = button.getBoundingClientRect();
        const fromKeyboard = event.detail === 0;
        const ripple = document.createElement("span");
        ripple.className = "btn-grid-ripple";
        ripple.style.left =
          (fromKeyboard ? rect.width / 2 : event.clientX - rect.left) + "px";
        ripple.style.top =
          (fromKeyboard ? rect.height / 2 : event.clientY - rect.top) + "px";
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
        button.appendChild(ripple);
      });
    });
  }

  /* ------------------------------------------------------------------- Misc */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Close mobile menu when the viewport grows past the breakpoint.
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1180) closeMenu();
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      fillMarquee($(".ticker-track"));
      fillMarquee(reviewTrack);
    }, 250);
  });

  // Pause any playing preview videos when the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      $$("video").forEach((v) => {
        if (!v.controls) v.pause();
      });
    }
  });
})();
