(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  $("#yr") && ($("#yr").textContent = new Date().getFullYear());

  /* ================= 1. Theme Toggle (Light / Dark) ================= */
  const getStoredTheme = () => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  };

  const sunIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  const applyTheme = (theme, animate = false) => {
    if (animate && !reducedMotion) {
      document.documentElement.classList.add("theme-transition");
      setTimeout(() => document.documentElement.classList.remove("theme-transition"), 360);
    }
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    const toggles = $$(".theme-toggle");
    toggles.forEach((btn) => {
      btn.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
      btn.innerHTML = theme === "dark" ? sunIcon : moonIcon;
      if (animate && !reducedMotion) {
        btn.classList.remove("is-spinning");
        void btn.offsetWidth;
        btn.classList.add("is-spinning");
      }
    });
  };

  applyTheme(getStoredTheme(), false);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    const active = document.documentElement.getAttribute("data-theme") || "dark";
    const next = active === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch (_) {}
    applyTheme(next, true);
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
      try {
        if (!localStorage.getItem("theme")) {
          applyTheme(e.matches ? "light" : "dark", true);
        }
      } catch (_) {}
    });
  }

  /* ================= 2. Scroll Progress Filament & Nav ================= */
  let progressBar = $(".scroll-progress");
  if (!progressBar) {
    progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    progressBar.setAttribute("aria-hidden", "true");
    document.body.prepend(progressBar);
  }

  const nav = $(".nav"), burger = $("#burger"), menu = $("#menu");
  let scrollTick = false;
  const updateScrollChrome = () => {
    scrollTick = false;
    const y = window.scrollY || 0;
    if (nav) nav.classList.toggle("scrolled", y > 10);
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = clamp(y / maxScroll, 0, 1);
    progressBar.style.transform = `scaleX(${pct.toFixed(4)})`;
  };
  const onScroll = () => {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(updateScrollChrome);
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  updateScrollChrome();

  if (burger && menu) {
    const close = () => {
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", (e) => e.target.closest("a") && close());
    addEventListener("keydown", (e) => e.key === "Escape" && close());
    document.addEventListener("click", (e) => {
      if (menu.classList.contains("open") && !menu.contains(e.target) && !burger.contains(e.target)) {
        close();
      }
    });
  }

  /* ================= 3. Choreographed Staggered Scroll Reveals ================= */
  // Assign gentle cascading delays for grouped cards & steps
  $$(".cards, .steps, .plans, .principle-grid").forEach((group) => {
    const items = $$(".reveal", group);
    items.forEach((item, idx) => {
      if (!item.style.getPropertyValue("--stagger")) {
        item.style.setProperty("--stagger", `${Math.min(idx, 6) * 70}ms`);
      }
    });
  });

  const revealAllVisible = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight || 900;
    $$(".reveal:not(.in)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh + 48) el.classList.add("in");
    });
  };

  if (!reducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -20px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
    revealAllVisible();
    addEventListener("hashchange", () => setTimeout(revealAllVisible, 80));
    addEventListener("scroll", revealAllVisible, { passive: true });
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ================= 4. Active Section in Nav & Legal TOC ================= */
  $$("a[href='#top']").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      $$(".links a[href^='#'], .floating-dock a[href^='#']").forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("active", href === "#top" || href === "#overview");
      });
    });
  });

  if ("IntersectionObserver" in window) {
    const navSections = $$("main section[id]");
    if (navSections.length) {
      const secIO = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = "#" + e.target.id;
          $$(".links a[href^='#'], .floating-dock a[href^='#']").forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === id));
        });
      }, { rootMargin: "-38% 0px -54% 0px" });
      navSections.forEach((s) => secIO.observe(s));
    }
    const dockTop = $(".floating-dock a[href='#top']");
    if (dockTop) {
      addEventListener("scroll", () => {
        if ((window.scrollY || 0) < 180) {
          $$(".floating-dock a[href^='#']").forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#top"));
        }
      }, { passive: true });
    }

    const tocLinks = $$(".toc a[href^='#']");
    if (tocLinks.length) {
      const headings = tocLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
      const tocIO = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          tocLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
        });
      }, { rootMargin: "-18% 0px -70% 0px" });
      headings.forEach((h) => tocIO.observe(h));
    }
  }

  /* ================= 5. Cursor-Reactive Atelier Spotlight & Magnetic CTAs ================= */
  if (finePointer && !reducedMotion) {
    const spotlightSelectors = [
      ".card",
      ".product-row",
      ".product-card-3d",
      ".workbench-shell",
      ".reviews-shell",
      ".studio-beta-card",
      ".support-compact-shell",
      ".support-portal",
      ".principle-item",
      ".contact-card",
      ".queue-card",
      ".plan",
      ".steps li",
      ".store-install-card",
      ".console",
      ".hero-panel"
    ].join(",");

    let activeSpot = null;
    document.addEventListener("pointermove", (e) => {
      const target = e.target.closest(spotlightSelectors);
      if (activeSpot && activeSpot !== target) {
        activeSpot.classList.remove("spot-active");
      }
      activeSpot = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty("--mx", `${x.toFixed(1)}px`);
      target.style.setProperty("--my", `${y.toFixed(1)}px`);
      target.classList.add("spot-active");
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      if (activeSpot) {
        activeSpot.classList.remove("spot-active");
        activeSpot = null;
      }
    });

    // Subtle magnetic glide on primary CTAs
    document.addEventListener("pointermove", (e) => {
      const btn = e.target.closest(".btn-primary");
      if (!btn || btn.disabled) return;
      const r = btn.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 6;
      const dy = ((e.clientY - r.top) / r.height - 0.5) * 4;
      btn.style.setProperty("--mag-x", `${dx.toFixed(2)}px`);
      btn.style.setProperty("--mag-y", `${dy.toFixed(2)}px`);
    }, { passive: true });

    document.addEventListener("pointerout", (e) => {
      const btn = e.target.closest(".btn-primary");
      if (!btn) return;
      if (!btn.contains(e.relatedTarget)) {
        btn.style.setProperty("--mag-x", "0px");
        btn.style.setProperty("--mag-y", "0px");
      }
    });
  }

  /* ================= 6. Hero Ambient Parallax ================= */
  const hw = $("#heroWave");
  const orbs = $$(".hero .orb");
  if ((hw || orbs.length) && !reducedMotion) {
    let pTick = false;
    addEventListener("scroll", () => {
      if (pTick) return;
      pTick = true;
      requestAnimationFrame(() => {
        pTick = false;
        const y = window.scrollY || 0;
        if (y > window.innerHeight * 1.4) return;
        if (hw) hw.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
        orbs.forEach((orb, i) => {
          const factor = i % 2 === 0 ? 0.08 : -0.06;
          orb.style.setProperty("--py", `${(y * factor).toFixed(1)}px`);
        });
      });
    }, { passive: true });
  }

  /* ================= 6.5. 3D Tilt Stage, Studio Deck, Workbench & Lightbox ================= */
  // Fullscreen 3D Lightbox Modal (created once lazily)
  let lbEl = null;
  let lbItems = [];
  let lbIndex = 0;

  const ensureLightbox = () => {
    if (lbEl) return lbEl;
    lbEl = document.createElement("div");
    lbEl.className = "lightbox-backdrop";
    lbEl.setAttribute("role", "dialog");
    lbEl.setAttribute("aria-modal", "true");
    lbEl.setAttribute("aria-label", "App screenshot viewer");
    lbEl.innerHTML = `
      <div class="lightbox-dialog">
        <img class="lightbox-img" alt="App screenshot preview">
        <div class="lightbox-bar">
          <button type="button" class="lightbox-btn" data-lb-prev>← Prev</button>
          <span data-lb-caption></span>
          <button type="button" class="lightbox-btn" data-lb-next>Next →</button>
          <button type="button" class="lightbox-btn" data-lb-close>Close ✕</button>
        </div>
      </div>
    `;
    document.body.appendChild(lbEl);
    const renderLb = () => {
      const item = lbItems[lbIndex] || lbItems[0];
      if (!item) return;
      const img = lbEl.querySelector(".lightbox-img");
      const cap = lbEl.querySelector("[data-lb-caption]");
      img.src = item.src;
      img.alt = item.label || "App screenshot";
      cap.textContent = lbItems.length > 1
        ? `${item.label || "Preview"} (${lbIndex + 1}/${lbItems.length})`
        : (item.label || "Preview");
      lbEl.querySelector("[data-lb-prev]").hidden = lbItems.length <= 1;
      lbEl.querySelector("[data-lb-next]").hidden = lbItems.length <= 1;
    };
    const closeLb = () => lbEl.classList.remove("open");
    lbEl.querySelector("[data-lb-close]").addEventListener("click", closeLb);
    lbEl.querySelector("[data-lb-prev]").addEventListener("click", () => {
      lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length;
      renderLb();
    });
    lbEl.querySelector("[data-lb-next]").addEventListener("click", () => {
      lbIndex = (lbIndex + 1) % lbItems.length;
      renderLb();
    });
    lbEl.addEventListener("click", (e) => { if (e.target === lbEl) closeLb(); });
    addEventListener("keydown", (e) => {
      if (!lbEl.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft" && lbItems.length > 1) { lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length; renderLb(); }
      if (e.key === "ArrowRight" && lbItems.length > 1) { lbIndex = (lbIndex + 1) % lbItems.length; renderLb(); }
    });
    lbEl._renderLb = renderLb;
    return lbEl;
  };

  const openLightbox = (items, startIndex = 0) => {
    if (!items.length) return;
    const modal = ensureLightbox();
    lbItems = items;
    lbIndex = clamp(startIndex, 0, items.length - 1);
    modal._renderLb();
    modal.classList.add("open");
  };

  // Helper to swap screenshot cleanly inside a [data-3d-stage]
  const setStageShot = (stage, src, label) => {
    if (!stage || !src) return;
    const frame = stage.querySelector(".phone-3d-frame");
    const img = stage.querySelector(".phone-3d-screen img");
    const badge = stage.querySelector(".phone-3d-badge span");
    if (!img) return;
    if (img.getAttribute("src") === src) {
      if (badge && label) badge.textContent = label;
      return;
    }
    if (frame) frame.classList.add("is-swapping");
    setTimeout(() => {
      img.src = src;
      if (label) img.alt = label;
      if (badge && label) badge.textContent = label;
      if (frame) frame.classList.remove("is-swapping");
    }, reducedMotion ? 0 : 150);
  };

  $$("[data-3d-stage]").forEach((stage) => {
    const frame = stage.querySelector(".phone-3d-frame");
    const pills = $$(".shot-pill[data-shot-src]", stage);

    if (frame && finePointer && !reducedMotion) {
      frame.addEventListener("pointermove", (e) => {
        const r = frame.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * 18;
        const ry = (px - 0.5) * 20;
        frame.classList.add("is-tilting");
        frame.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
        frame.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        frame.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        frame.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      }, { passive: true });
      frame.addEventListener("pointerleave", () => {
        frame.classList.remove("is-tilting");
        frame.style.setProperty("--rx", "3deg");
        frame.style.setProperty("--ry", "-8deg");
        frame.style.setProperty("--gx", "35%");
        frame.style.setProperty("--gy", "22%");
      });
    }

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        setStageShot(stage, pill.getAttribute("data-shot-src"), pill.getAttribute("data-shot-label") || pill.textContent.trim());
      });
    });

    if (frame) {
      frame.addEventListener("click", () => {
        const activeImg = stage.querySelector(".phone-3d-screen img");
        const activeLabel = stage.querySelector(".phone-3d-badge span")?.textContent || activeImg?.alt || "";
        const visiblePills = $$(".shot-pill[data-shot-src]", stage).filter((p) => !p.hidden);
        const list = visiblePills.length
          ? visiblePills.map((p) => ({ src: p.getAttribute("data-shot-src"), label: p.getAttribute("data-shot-label") || p.textContent.trim() }))
          : [{ src: activeImg?.getAttribute("src"), label: activeLabel }];
        const idx = Math.max(0, list.findIndex((i) => i.src === activeImg?.getAttribute("src")));
        openLightbox(list, idx);
      });
    }
  });

  // Allow any standalone [data-lightbox-src] card thumbnail to open Lightbox
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-lightbox-src]");
    if (!trigger) return;
    e.preventDefault();
    const group = trigger.closest("[data-lightbox-group]") || document;
    const all = $$("[data-lightbox-src]", group).map((el) => ({
      src: el.getAttribute("data-lightbox-src"),
      label: el.getAttribute("data-lightbox-label") || "Preview"
    }));
    const idx = Math.max(0, all.findIndex((i) => i.src === trigger.getAttribute("data-lightbox-src")));
    openLightbox(all, idx);
  });

  // Interactive 3D Tabbed Studio Deck (Trans-Title)
  $$("[data-studio-deck]").forEach((deck) => {
    const tabs = $$("[data-studio-tab]", deck);
    const panes = $$("[data-studio-pane]", deck);
    const stage = deck.querySelector("[data-3d-stage]");
    const shotPills = stage ? $$(".shot-pill[data-shot-group]", stage) : [];

    const activateStudio = (name) => {
      tabs.forEach((t) => {
        const on = t.getAttribute("data-studio-tab") === name;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
      });
      panes.forEach((p) => p.classList.toggle("active", p.getAttribute("data-studio-pane") === name));

      if (stage) {
        let firstVisible = null;
        shotPills.forEach((p) => {
          const match = p.getAttribute("data-shot-group") === name;
          p.hidden = !match;
          p.classList.remove("active");
          if (match && !firstVisible) firstVisible = p;
        });
        if (firstVisible) {
          firstVisible.classList.add("active");
          setStageShot(stage, firstVisible.getAttribute("data-shot-src"), firstVisible.getAttribute("data-shot-label"));
        }
      }
    };

    tabs.forEach((t) => {
      t.addEventListener("click", () => activateStudio(t.getAttribute("data-studio-tab")));
    });

    const studioHashes = new Set(["#transcribe", "#translate", "#crossplay", "#players"]);
    const syncStudioHash = () => {
      if (studioHashes.has(location.hash)) {
        activateStudio(location.hash.slice(1));
      }
    };
    syncStudioHash();
    addEventListener("hashchange", syncStudioHash);
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const h = a.getAttribute("href");
      if (studioHashes.has(h)) {
        activateStudio(h.slice(1));
        const sec = document.getElementById("studios");
        if (sec) {
          e.preventDefault();
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // Interactive Acoustic Workbench Switcher (Echo Cleaner)
  $$("[data-workbench]").forEach((wb) => {
    const tabs = $$("[data-wb-tab]", wb);
    const panes = $$("[data-wb-pane]", wb);
    const stage = wb.querySelector("[data-3d-stage]");

    const activateWb = (name) => {
      tabs.forEach((t) => {
        const on = t.getAttribute("data-wb-tab") === name;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
      });
      panes.forEach((p) => p.classList.toggle("active", p.getAttribute("data-wb-pane") === name));
      if (name === "demo") {
        requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      }
      if (name === "studios" && stage) {
        const activeShot = stage.querySelector(".shot-pill.active") || stage.querySelector(".shot-pill");
        if (activeShot) {
          activeShot.classList.add("active");
          setStageShot(stage, activeShot.getAttribute("data-shot-src"), activeShot.getAttribute("data-shot-label"));
        }
      }
    };

    tabs.forEach((t) => {
      t.addEventListener("click", () => activateWb(t.getAttribute("data-wb-tab")));
    });

    const hashMap = { "#demo": "demo", "#features": "studios", "#how": "pipeline", "#pricing": "pipeline" };
    const syncWbHash = () => {
      const target = hashMap[location.hash];
      if (target) activateWb(target);
    };
    syncWbHash();
    addEventListener("hashchange", syncWbHash);
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const target = hashMap[a.getAttribute("href")];
      if (target) {
        activateWb(target);
        const sec = document.getElementById("workbench");
        if (sec) {
          e.preventDefault();
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // Support / FAQ deep-links auto-open the expandable Support & FAQ drawer when clicked
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href='#faq'], a[href='#support']");
    if (!a) return;
    const h = a.getAttribute("href");
    const portal = $("[data-support-portal][data-expandable='true']");
    if (!portal) return;
    const targetPane = h === "#faq" ? "faq" : "troubleshoot";
    const trigger = portal.querySelector(`[data-support-open='${targetPane}']`);
    const drawer = portal.querySelector("[data-support-drawer]");
    if (trigger && drawer && (!drawer.classList.contains("open") || drawer.getAttribute("data-active-pane") !== targetPane)) {
      trigger.click();
    }
    const sec = document.getElementById("support");
    if (h === "#faq" && sec) {
      e.preventDefault();
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Exclusive FAQ accordion behavior (opening one collapses open siblings in the same list)
  document.addEventListener("toggle", (e) => {
    const det = e.target;
    if (!det || det.tagName !== "DETAILS" || !det.open) return;
    const list = det.closest(".faq");
    if (!list) return;
    list.querySelectorAll("details[open]").forEach((other) => {
      if (other !== det) other.open = false;
    });
  }, true);

  /* ================= 7. Echo Cleaner Live Signal Lab ================= */
  const canvas = $("#wave");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);

  const DEF = { enh: 70, boost: 35, speed: reducedMotion ? 0 : 40, echo: true, noise: true, reverb: true, style: "wave" };
  const S = { ...DEF };
  const el = {
    enh: $("#enh"), boost: $("#boost"), speed: $("#speed"),
    echo: $("#tEcho"), noise: $("#tNoise"), reverb: $("#tReverb"), style: $("#style"),
    vEnh: $("#vEnh"), vBoost: $("#vBoost"), vSpeed: $("#vSpeed"),
    roNoise: $("#roNoise"), roEcho: $("#roEcho"), roGain: $("#roGain"),
    audio: $("#btnAudio"), rand: $("#btnRand"), reset: $("#btnReset"), exp: $("#btnExport")
  };

  function syncUI() {
    el.enh.value = S.enh; el.boost.value = S.boost; el.speed.value = S.speed;
    el.echo.checked = S.echo; el.noise.checked = S.noise; el.reverb.checked = S.reverb;
    el.style.value = S.style;
    el.vEnh.textContent = S.enh + "%"; el.vBoost.textContent = S.boost + "%"; el.vSpeed.textContent = S.speed + "%";
    const e = S.enh / 100;
    el.roNoise.textContent = `NOISE −${Math.round(6 + (S.noise ? e * 42 : 0))} dB`;
    el.roEcho.textContent = `ECHO −${Math.round(4 + (S.echo ? e * 38 : 0))} dB`;
    el.roGain.textContent = `GAIN +${(S.boost / 100 * 9).toFixed(1)} dB`;
    audioUpdate();
  }
  el.enh.addEventListener("input", () => { S.enh = +el.enh.value; syncUI(); });
  el.boost.addEventListener("input", () => { S.boost = +el.boost.value; syncUI(); });
  el.speed.addEventListener("input", () => { S.speed = +el.speed.value; syncUI(); });
  el.echo.addEventListener("change", () => { S.echo = el.echo.checked; syncUI(); });
  el.noise.addEventListener("change", () => { S.noise = el.noise.checked; syncUI(); });
  el.reverb.addEventListener("change", () => { S.reverb = el.reverb.checked; syncUI(); });
  el.style.addEventListener("change", () => { S.style = el.style.value; });
  el.reset.addEventListener("click", () => { Object.assign(S, DEF); syncUI(); });
  el.rand.addEventListener("click", () => {
    S.enh = 20 + Math.random() * 80 | 0; S.boost = Math.random() * 90 | 0;
    S.speed = 15 + Math.random() * 70 | 0;
    S.echo = Math.random() > 0.25; S.noise = Math.random() > 0.2; S.reverb = Math.random() > 0.3;
    S.style = Math.random() > 0.5 ? "bars" : "wave"; syncUI();
  });
  el.exp.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "echo-cleaner-waveform.png"; a.href = canvas.toDataURL("image/png"); a.click();
  });

  /* ---- signal model ---- */
  const frac = (x) => x - Math.floor(x);
  const rnd = (x, p) => frac(Math.sin(x * 12.9898 + p * 78.233) * 43758.5453);
  const voice = (t, p) => {
    const env = Math.pow(Math.max(0, Math.sin(t * 19 + p * 0.9)), 2.2) * 0.8 + 0.18;
    return env * (Math.sin(t * 61 + p * 2.1) * 0.55 + Math.sin(t * 122 + p * 3.7) * 0.3 + Math.sin(t * 244 + p) * 0.15);
  };
  function sample(t, p) {
    const e = S.enh / 100, gain = 1 + S.boost / 100 * 1.1;
    const dry = voice(t, p) * gain;
    const n = S.noise ? (1 - e) : 1, ec = S.echo ? (1 - e) : 1, rv = S.reverb ? (1 - e) : 1;
    const noise = (rnd(t * 997, p) - 0.5) * 0.9 * n + Math.sin(t * 900 + p * 9) * 0.12 * n;
    const echo = (voice(t - 0.055, p - 0.5) * 0.5 + voice(t - 0.11, p - 1) * 0.26) * ec;
    const reverb = (voice(t - 0.03, p - 0.3) * 0.3 + voice(t - 0.085, p - 0.8) * 0.2) * rv;
    return { dry, junk: noise + echo + reverb };
  }

  /* ---- render (theme-aware luxury studio oscilloscope) ---- */
  let W = 0, H = 0, phase = 0, last = 0, visible = true, running = true;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener("resize", resize); resize();
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);
  document.addEventListener("visibilitychange", () => { running = !document.hidden; last = 0; });

  function draw(ts) {
    requestAnimationFrame(draw);
    if (!visible || !running) { last = ts; return; }
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    phase += dt * (S.speed / 100) * 4;
    ctx.clearRect(0, 0, W, H);

    const isLight = document.documentElement.getAttribute("data-theme") === "light";

    // Precision acoustic grid
    ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.07)" : "rgba(148, 163, 194, 0.08)";
    ctx.lineWidth = 1;
    for (let y = H / 6; y < H; y += H / 6) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let x = W / 10; x < W; x += W / 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    // Center zero-crossing reference line
    ctx.strokeStyle = isLight ? "rgba(8, 145, 178, 0.22)" : "rgba(34, 211, 238, 0.16)";
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    const mid = H / 2, amp = H * 0.34;
    if (S.style === "bars") {
      const N = 72, bw = W / N;
      for (let i = 0; i < N; i++) {
        const { dry, junk } = sample(i / N, phase);
        const h = clamp(Math.abs(dry) + Math.abs(junk) * 0.8, 0.02, 1) * amp;
        const jr = clamp(Math.abs(junk) / (Math.abs(dry) + Math.abs(junk) + 0.001), 0, 1);
        ctx.fillStyle = jr > 0.45
          ? (isLight ? `rgba(219, 39, 119, ${0.42 + jr * 0.45})` : `rgba(244, 63, 123, ${0.38 + jr * 0.5})`)
          : (isLight ? `rgba(8, 145, 178, ${0.55 + (1 - jr) * 0.4})` : `rgba(34, 211, 238, ${0.5 + (1 - jr) * 0.5})`);
        const barX = i * bw + 1.5;
        const barW = Math.max(2, bw - 3);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(barX, mid - h, barW, h * 2, 2);
          ctx.fill();
        } else {
          ctx.fillRect(barX, mid - h, barW, h * 2);
        }
      }
    } else {
      const path = (key, color, glow) => {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const s = sample(x / W, phase);
          const y = mid - (key === "junk" ? s.junk : s.dry + s.junk * 0.25) * amp;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = key === "junk" ? 1.5 : 2.5;
        ctx.shadowColor = glow; ctx.shadowBlur = key === "junk" ? 0 : (isLight ? 8 : 16);
        ctx.stroke(); ctx.shadowBlur = 0;
      };
      path("junk", isLight ? "rgba(219, 39, 119, 0.52)" : "rgba(244, 63, 123, 0.58)", "transparent");
      const g = ctx.createLinearGradient(0, 0, W, 0);
      if (isLight) {
        g.addColorStop(0, "#0891b2"); g.addColorStop(0.55, "#0284c7"); g.addColorStop(1, "#059669");
      } else {
        g.addColorStop(0, "#22d3ee"); g.addColorStop(0.55, "#38bdf8"); g.addColorStop(1, "#34d399");
      }
      path("dry", g, isLight ? "rgba(8, 145, 178, 0.35)" : "rgba(34, 211, 238, 0.72)");
      ctx.globalAlpha = isLight ? 0.12 : 0.15;
      ctx.lineTo(W, mid); ctx.lineTo(0, mid); ctx.closePath();
      ctx.fillStyle = g; ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  requestAnimationFrame(draw);

  /* ---- optional WebAudio preview (user-initiated) ---- */
  let AC = null, nodes = null, playing = false;
  function audioBuild() {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) { el.audio.hidden = true; return; }
    AC = new C();
    const master = AC.createGain(); master.gain.value = 0.14; master.connect(AC.destination);
    const vg = AC.createGain(); vg.gain.value = 0.5;
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 950;
    const o1 = AC.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 110;
    const o2 = AC.createOscillator(); o2.type = "sine"; o2.frequency.value = 220;
    o1.connect(lp); o2.connect(lp); lp.connect(vg);
    const lfo = AC.createOscillator(); lfo.frequency.value = 2.6;
    const lg = AC.createGain(); lg.gain.value = 0.32; lfo.connect(lg); lg.connect(vg.gain);
    const dry = AC.createGain(); vg.connect(dry); dry.connect(master);
    const nb = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = AC.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 0.6;
    const ng = AC.createGain(); ns.connect(bp); bp.connect(ng); ng.connect(master);
    const mk = (time, fb, freq) => {
      const dl = AC.createDelay(1); dl.delayTime.value = time;
      const f = AC.createGain(); f.gain.value = fb;
      const fl = AC.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = freq;
      const out = AC.createGain();
      vg.connect(dl); dl.connect(fl); fl.connect(f); f.connect(dl); fl.connect(out); out.connect(master);
      return out;
    };
    const eg = mk(0.21, 0.5, 1600), rg = mk(0.07, 0.62, 1100);
    [o1, o2, lfo, ns].forEach((n) => n.start());
    nodes = { dry, ng, eg, rg };
  }
  function audioUpdate() {
    if (!nodes) return;
    const e = S.enh / 100, t = AC.currentTime, set = (g, v) => g.gain.setTargetAtTime(v, t, 0.06);
    set(nodes.dry, 0.45 + S.boost / 100 * 0.8);
    set(nodes.ng, (S.noise ? 1 - e : 1) * 0.4);
    set(nodes.eg, (S.echo ? 1 - e : 1) * 0.55);
    set(nodes.rg, (S.reverb ? 1 - e : 1) * 0.4);
  }
  el.audio.addEventListener("click", async () => {
    if (!AC) audioBuild();
    if (!AC) return;
    if (playing) { await AC.suspend(); playing = false; }
    else { await AC.resume(); audioUpdate(); playing = true; }
    el.audio.textContent = playing ? "■ Stop demo tone" : "▶ Play demo tone";
    el.audio.setAttribute("aria-pressed", String(playing));
  });
  addEventListener("pagehide", () => { if (AC) AC.close(); });

  syncUI();
})();
