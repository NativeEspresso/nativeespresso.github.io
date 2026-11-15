(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  $("#yr") && ($("#yr").textContent = new Date().getFullYear());

  /* ================= theme toggle (light / dark) ================= */
  const getStoredTheme = () => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  };

  const sunIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    const toggles = $$(".theme-toggle");
    toggles.forEach(btn => {
      btn.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
      btn.innerHTML = theme === "dark" ? sunIcon : moonIcon;
    });
  };

  const currentTheme = getStoredTheme();
  applyTheme(currentTheme);

  document.addEventListener("click", e => {
    const btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    const active = document.documentElement.getAttribute("data-theme") || "dark";
    const next = active === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch (_) {}
    applyTheme(next);
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", e => {
      try {
        if (!localStorage.getItem("theme")) {
          applyTheme(e.matches ? "light" : "dark");
        }
      } catch (_) {}
    });
  }

  /* nav */
  const nav = $(".nav"), burger = $("#burger"), menu = $("#menu");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if (burger && menu) {
    const close = () => { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); };
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", e => e.target.closest("a") && close());
    addEventListener("keydown", e => e.key === "Escape" && close());
  }

  /* scroll reveals */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$(".reveal").forEach(el => io.observe(el));

  /* active section in nav */
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $$(".links a[href^='#']").forEach(a =>
      a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  $$("main section[id]").forEach(s => secIO.observe(s));

  /* hero parallax */
  const hw = $("#heroWave");
  if (hw && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    addEventListener("scroll", () => { hw.style.transform = `translateY(${scrollY * .12}px)`; }, { passive: true });

  /* ================= demo lab ================= */
  const canvas = $("#wave");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const DEF = { enh: 70, boost: 35, speed: reduced ? 0 : 40, echo: true, noise: true, reverb: true, style: "wave" };
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
    S.echo = Math.random() > .25; S.noise = Math.random() > .2; S.reverb = Math.random() > .3;
    S.style = Math.random() > .5 ? "bars" : "wave"; syncUI();
  });
  el.exp.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "echo-cleaner-waveform.png"; a.href = canvas.toDataURL("image/png"); a.click();
  });

  /* ---- signal model ---- */
  const frac = x => x - Math.floor(x);
  const rnd = (x, p) => frac(Math.sin(x * 12.9898 + p * 78.233) * 43758.5453);
  const voice = (t, p) => {
    const env = Math.pow(Math.max(0, Math.sin(t * 19 + p * .9)), 2.2) * .8 + .18;
    return env * (Math.sin(t * 61 + p * 2.1) * .55 + Math.sin(t * 122 + p * 3.7) * .3 + Math.sin(t * 244 + p) * .15);
  };
  function sample(t, p) {
    const e = S.enh / 100, gain = 1 + S.boost / 100 * 1.1;
    const dry = voice(t, p) * gain;
    const n = S.noise ? (1 - e) : 1, ec = S.echo ? (1 - e) : 1, rv = S.reverb ? (1 - e) : 1;
    const noise = (rnd(t * 997, p) - .5) * .9 * n + Math.sin(t * 900 + p * 9) * .12 * n;
    const echo = (voice(t - .055, p - .5) * .5 + voice(t - .11, p - 1) * .26) * ec;
    const reverb = (voice(t - .03, p - .3) * .3 + voice(t - .085, p - .8) * .2) * rv;
    return { dry, junk: noise + echo + reverb };
  }

  /* ---- render ---- */
  let W = 0, H = 0, phase = 0, last = 0, visible = true, running = true;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener("resize", resize); resize();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: .05 }).observe(canvas);
  document.addEventListener("visibilitychange", () => { running = !document.hidden; last = 0; });

  function draw(ts) {
    requestAnimationFrame(draw);
    if (!visible || !running) { last = ts; return; }
    const dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts;
    phase += dt * (S.speed / 100) * 4;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,161,191,.08)"; ctx.lineWidth = 1;
    for (let y = H / 6; y < H; y += H / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const mid = H / 2, amp = H * .34;
    if (S.style === "bars") {
      const N = 72, bw = W / N;
      for (let i = 0; i < N; i++) {
        const { dry, junk } = sample(i / N, phase);
        const h = clamp(Math.abs(dry) + Math.abs(junk) * .8, .02, 1) * amp;
        const jr = clamp(Math.abs(junk) / (Math.abs(dry) + Math.abs(junk) + .001), 0, 1);
        ctx.fillStyle = jr > .45 ? `rgba(244,63,123,${.35 + jr * .5})` : `rgba(34,211,238,${.5 + (1 - jr) * .5})`;
        ctx.fillRect(i * bw + 1.5, mid - h, bw - 3, h * 2);
      }
    } else {
      const path = (key, color, glow) => {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const s = sample(x / W, phase);
          const y = mid - (key === "junk" ? s.junk : s.dry + s.junk * .25) * amp;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = key === "junk" ? 1.4 : 2.4;
        ctx.shadowColor = glow; ctx.shadowBlur = key === "junk" ? 0 : 14;
        ctx.stroke(); ctx.shadowBlur = 0;
      };
      path("junk", "rgba(244,63,123,.55)", "transparent");
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "#22d3ee"); g.addColorStop(.6, "#4f7cff"); g.addColorStop(1, "#a3e635");
      path("dry", g, "rgba(34,211,238,.7)");
      ctx.globalAlpha = .14; ctx.lineTo(W, mid); ctx.lineTo(0, mid); ctx.closePath();
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
    const master = AC.createGain(); master.gain.value = .14; master.connect(AC.destination);
    const vg = AC.createGain(); vg.gain.value = .5;
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 950;
    const o1 = AC.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 110;
    const o2 = AC.createOscillator(); o2.type = "sine"; o2.frequency.value = 220;
    o1.connect(lp); o2.connect(lp); lp.connect(vg);
    const lfo = AC.createOscillator(); lfo.frequency.value = 2.6;
    const lg = AC.createGain(); lg.gain.value = .32; lfo.connect(lg); lg.connect(vg.gain);
    const dry = AC.createGain(); vg.connect(dry); dry.connect(master);
    const nb = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = AC.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = .6;
    const ng = AC.createGain(); ns.connect(bp); bp.connect(ng); ng.connect(master);
    const mk = (time, fb, freq) => {
      const dl = AC.createDelay(1); dl.delayTime.value = time;
      const f = AC.createGain(); f.gain.value = fb;
      const fl = AC.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = freq;
      const out = AC.createGain();
      vg.connect(dl); dl.connect(fl); fl.connect(f); f.connect(dl); fl.connect(out); out.connect(master);
      return out;
    };
    const eg = mk(.21, .5, 1600), rg = mk(.07, .62, 1100);
    [o1, o2, lfo, ns].forEach(n => n.start());
    nodes = { dry, ng, eg, rg };
  }
  function audioUpdate() {
    if (!nodes) return;
    const e = S.enh / 100, t = AC.currentTime, set = (g, v) => g.gain.setTargetAtTime(v, t, .06);
    set(nodes.dry, .45 + S.boost / 100 * .8);
    set(nodes.ng, (S.noise ? 1 - e : 1) * .4);
    set(nodes.eg, (S.echo ? 1 - e : 1) * .55);
    set(nodes.rg, (S.reverb ? 1 - e : 1) * .4);
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
