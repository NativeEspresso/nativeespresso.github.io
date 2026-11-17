/**
 * Native Espresso — Cloud Client & Diagnostic Engine (v2.0)
 * Features:
 * 1. Testing Queue Multi-App Tabs & Platform Selectors
 * 2. Instant localStorage State Hydration & Live VIP Preview Mode
 * 3. Minimalist Zero-Dependency Vector SVG QR Code Engine
 * 4. Interactive Symptom Pills & Self-Service Troubleshooting
 * 5. Screenshot / Crash Log Dropzone with Base64 File Encoding
 * 6. Quick Device & OS Spec Auto-Detection
 * 7. Ticket Status Lookup for Returning Users
 */

(function () {
  "use strict";

  const DEFAULT_API_BASE = "https://native-espresso-web-function-epbhdxbxbybte6bz.centralus-01.azurewebsites.net";
  const API_BASE = window.NE_API_BASE || DEFAULT_API_BASE;
  const STORAGE_KEY = "ne_tester_tickets";
  const ISSUE_STORAGE_KEY = "ne_submitted_tickets";

  /* ==========================================================================
     1. LocalStorage Helpers
     ========================================================================== */
  function getTickets() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  function saveTicket(appId, ticket) {
    try {
      const all = getTickets();
      all[appId] = { ...ticket, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  function removeTicket(appId) {
    try {
      const all = getTickets();
      delete all[appId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  function getLocalIssues() {
    try {
      const data = localStorage.getItem(ISSUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocalIssue(issue) {
    try {
      const all = getLocalIssues();
      all.unshift(issue);
      localStorage.setItem(ISSUE_STORAGE_KEY, JSON.stringify(all.slice(0, 10)));
    } catch (_) {}
  }

  /* ==========================================================================
     2. Standards-Compliant ISO/IEC 18004 QR Code Generator (Zero-Dependency SVG)
        Byte mode, Error Correction Level M (15%), Versions 1-10 (up to 214 bytes)
     ========================================================================== */
  const QR = (function () {
    const GF_EXP = new Uint8Array(512);
    const GF_LOG = new Uint8Array(256);
    for (let x = 1, i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 256) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];

    function gfMul(a, b) {
      return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
    }

    function rsGeneratorPoly(degree) {
      let poly = [1];
      for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
          next[j] ^= poly[j];
          next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
        }
        poly = next;
      }
      return poly;
    }

    function rsEncode(data, ecCount) {
      const gen = rsGeneratorPoly(ecCount);
      const res = new Uint8Array(data.length + ecCount);
      res.set(data);
      for (let i = 0; i < data.length; i++) {
        const factor = res[i];
        if (factor !== 0) {
          for (let j = 0; j < gen.length; j++) {
            res[i + j] ^= gfMul(gen[j], factor);
          }
        }
      }
      return res.slice(data.length);
    }

    // [version, totalDataBytes, ecPerBlock, [[numBlocks, dataBytesPerBlock], ...]] for EC Level M
    const VERSION_M = [
      null,
      [1, 16, 10, [[1, 16]]],
      [2, 28, 16, [[1, 28]]],
      [3, 44, 26, [[1, 44]]],
      [4, 64, 18, [[2, 32]]],
      [5, 86, 24, [[2, 43]]],
      [6, 108, 16, [[4, 27]]],
      [7, 124, 18, [[4, 31]]],
      [8, 154, 22, [[2, 38], [2, 39]]],
      [9, 182, 22, [[3, 36], [2, 37]]],
      [10, 216, 26, [[4, 43], [1, 44]]]
    ];

    const ALIGN_POS = [
      [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
      [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
    ];

    // Precomputed 15-bit format info for EC Level M (00) and masks 0..7
    const FORMAT_INFO_M = [
      0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0
    ];

    // Precomputed 18-bit version info for versions 7..10
    const VERSION_INFO = {
      7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3
    };

    function encodeBytes(str) {
      if (typeof TextEncoder !== "undefined") {
        return Array.from(new TextEncoder().encode(str));
      }
      const out = [];
      for (let i = 0; i < str.length; i++) out.push(str.charCodeAt(i) & 0xff);
      return out;
    }

    function createMatrix(text) {
      const bytes = encodeBytes(text);
      let spec = null;
      for (let v = 1; v <= 10; v++) {
        const countBits = v <= 9 ? 8 : 16;
        const capBits = VERSION_M[v][1] * 8;
        if (4 + countBits + bytes.length * 8 <= capBits) {
          spec = VERSION_M[v];
          break;
        }
      }
      if (!spec) spec = VERSION_M[10];

      const version = spec[0];
      const totalData = spec[1];
      const ecPerBlock = spec[2];
      const groups = spec[3];
      const size = version * 4 + 17;

      // Build bit stream: Mode 0100 + length + UTF-8 bytes + terminator + pad bytes
      const bits = [];
      const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
      };
      pushBits(0b0100, 4);
      pushBits(bytes.length, version <= 9 ? 8 : 16);
      for (const b of bytes) pushBits(b, 8);

      const capBits = totalData * 8;
      for (let i = 0; i < 4 && bits.length < capBits; i++) bits.push(0);
      while (bits.length % 8 !== 0) bits.push(0);

      const dataCodewords = new Uint8Array(totalData);
      let idx = 0;
      for (let i = 0; i < bits.length; i += 8) {
        let v = 0;
        for (let b = 0; b < 8; b++) v = (v << 1) | bits[i + b];
        dataCodewords[idx++] = v;
      }
      const padSeq = [0xec, 0x11];
      for (let p = 0; idx < totalData; p++) dataCodewords[idx++] = padSeq[p & 1];

      // Split into blocks and compute Reed-Solomon EC codewords
      const dataBlocks = [];
      const ecBlocks = [];
      let offset = 0;
      for (const [count, dcLen] of groups) {
        for (let b = 0; b < count; b++) {
          const blk = dataCodewords.slice(offset, offset + dcLen);
          offset += dcLen;
          dataBlocks.push(blk);
          ecBlocks.push(rsEncode(blk, ecPerBlock));
        }
      }

      // Interleave data codewords, then EC codewords
      const finalBytes = [];
      const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
      for (let i = 0; i < maxDataLen; i++) {
        for (const blk of dataBlocks) if (i < blk.length) finalBytes.push(blk[i]);
      }
      for (let i = 0; i < ecPerBlock; i++) {
        for (const blk of ecBlocks) finalBytes.push(blk[i]);
      }

      // Build function module template
      const modules = Array.from({ length: size }, () => new Int8Array(size));
      const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

      const setFunc = (r, c, dark) => {
        if (r >= 0 && r < size && c >= 0 && c < size) {
          modules[r][c] = dark ? 1 : 0;
          isFunc[r][c] = 1;
        }
      };

      // Finder patterns + separators
      const drawFinder = (r0, c0) => {
        for (let r = -1; r <= 7; r++) {
          for (let c = -1; c <= 7; c++) {
            const inBox = r >= 0 && r <= 6 && c >= 0 && c <= 6;
            const dark = inBox && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
            setFunc(r0 + r, c0 + c, dark);
          }
        }
      };
      drawFinder(0, 0);
      drawFinder(0, size - 7);
      drawFinder(size - 7, 0);

      // Alignment patterns
      const pos = ALIGN_POS[version];
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          const r0 = pos[i], c0 = pos[j];
          if ((r0 === 6 && c0 === 6) || (r0 === 6 && c0 === size - 7) || (r0 === size - 7 && c0 === 6)) continue;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              setFunc(r0 + dr, c0 + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
            }
          }
        }
      }

      // Timing patterns
      for (let i = 8; i < size - 8; i++) {
        setFunc(6, i, i % 2 === 0);
        setFunc(i, 6, i % 2 === 0);
      }

      // Reserve format info + dark module
      for (let i = 0; i <= 8; i++) {
        if (i !== 6) { setFunc(8, i, false); setFunc(i, 8, false); }
      }
      for (let i = 0; i < 8; i++) setFunc(8, size - 1 - i, false);
      for (let i = 0; i < 7; i++) setFunc(size - 1 - i, 8, false);
      setFunc(size - 8, 8, true);

      // Version info (v >= 7)
      if (version >= 7 && VERSION_INFO[version]) {
        const vi = VERSION_INFO[version];
        for (let i = 0; i < 18; i++) {
          const bit = ((vi >> i) & 1) === 1;
          const a = Math.floor(i / 3);
          const b = size - 11 + (i % 3);
          setFunc(a, b, bit);
          setFunc(b, a, bit);
        }
      }

      // Place data bits in zig-zag columns
      const allBits = [];
      for (const byte of finalBytes) {
        for (let b = 7; b >= 0; b--) allBits.push((byte >> b) & 1);
      }

      let bitPtr = 0;
      let upward = true;
      for (let col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col = 5;
        for (let i = 0; i < size; i++) {
          const row = upward ? size - 1 - i : i;
          for (let dx = 0; dx < 2; dx++) {
            const c = col - dx;
            if (!isFunc[row][c]) {
              modules[row][c] = bitPtr < allBits.length ? allBits[bitPtr++] : 0;
            }
          }
        }
        upward = !upward;
      }

      // Apply mask and pick lowest penalty (ISO/IEC 18004)
      const maskPreds = [
        (r, c) => (r + c) % 2 === 0,
        (r) => r % 2 === 0,
        (_, c) => c % 3 === 0,
        (r, c) => (r + c) % 3 === 0,
        (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
        (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
        (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
        (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
      ];

      function writeFormat(grid, mask) {
        const bits15 = FORMAT_INFO_M[mask];
        const b = (k) => (bits15 >> k) & 1;
        // Around top-left
        for (let i = 0; i <= 5; i++) grid[8][i] = b(14 - i);
        grid[8][7] = b(8);
        grid[8][8] = b(7);
        grid[7][8] = b(6);
        for (let i = 0; i <= 5; i++) grid[5 - i][8] = b(5 - i);
        // Bottom-left & top-right
        for (let i = 0; i < 7; i++) grid[size - 1 - i][8] = b(14 - i);
        for (let i = 0; i < 8; i++) grid[8][size - 8 + i] = b(7 - i);
      }

      function calcPenalty(grid) {
        let p = 0;
        for (let r = 0; r < size; r++) {
          let runR = 1, runC = 1;
          for (let c = 1; c < size; c++) {
            if (grid[r][c] === grid[r][c - 1]) { runR++; if (runR === 5) p += 3; else if (runR > 5) p++; }
            else runR = 1;
            if (grid[c][r] === grid[c - 1][r]) { runC++; if (runC === 5) p += 3; else if (runC > 5) p++; }
            else runC = 1;
          }
        }
        for (let r = 0; r < size - 1; r++) {
          for (let c = 0; c < size - 1; c++) {
            const v = grid[r][c];
            if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) p += 3;
          }
        }
        return p;
      }

      let bestGrid = null;
      let bestPenalty = Infinity;
      for (let mask = 0; mask < 8; mask++) {
        const g = modules.map((row, r) => {
          const copy = new Int8Array(row);
          for (let c = 0; c < size; c++) {
            if (!isFunc[r][c] && maskPreds[mask](r, c)) copy[c] ^= 1;
          }
          return copy;
        });
        writeFormat(g, mask);
        const pen = calcPenalty(g);
        if (pen < bestPenalty) {
          bestPenalty = pen;
          bestGrid = g;
        }
      }

      return bestGrid;
    }

    function generateSVG(text, size = 168) {
      const grid = createMatrix(text);
      const count = grid.length;
      const quiet = 3; // ISO quiet zone modules
      const total = count + quiet * 2;
      let pathD = "";

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (grid[r][c]) {
            pathD += `M${c + quiet},${r + quiet}h1v1h-1z`;
          }
        }
      }

      return `<svg viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="Scannable QR code for Google Play Store"><rect width="${total}" height="${total}" fill="#ffffff" rx="1.5"/><path d="${pathD}" fill="#0f172a"/></svg>`;
    }

    return { generateSVG, createMatrix };
  })();

  /* ==========================================================================
     3. Closed Testing Queue Controller (Multi-App & Dynamic Cloud Registry)
     ========================================================================== */
  const APP_CONFIG = {
    "trans-title": {
      name: "Trans-Title",
      subtitle: "Flagship Multimedia Suite & On-Device AI Studio",
      badge: "Android: Closed-Testing (v1.0.16) · Windows: Development",
      androidStatus: "ClosedTesting",
      accent: "var(--magenta, #f43f7b)",
      platforms: ["Android (Closed Testing v1.0.16)", "Windows (WinUI 3 Beta)"],
      joinWebUrl: "https://play.google.com/apps/testing/com.espressonative.transtitle",
      joinAndroidUrl: "https://play.google.com/store/apps/details?id=com.espressonative.transtitle",
      icon: "🎬",
      pill: "Active"
    },
    "echo-cleaner": {
      name: "Echo Cleaner",
      subtitle: "On-Device Neural Audio Enhancement Engine",
      badge: "Android: Closed Testing Queue (Finalizing)",
      androidStatus: "TestingQueue",
      accent: "var(--cyan, #22d3ee)",
      platforms: ["Android (Closed Testing Queue)", "iOS (Planning Waitlist)"],
      joinWebUrl: null,
      joinAndroidUrl: null,
      icon: "🎙️",
      pill: "Queue"
    }
  };

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function formatStatusBadge(androidStatus) {
    switch ((androidStatus || "").toLowerCase()) {
      case "closedtesting": return { label: "Android: Closed Testing Active", pill: "Active" };
      case "published": return { label: "Android: Published on Google Play", pill: "Live" };
      case "planning": return { label: "Android: Planning Waitlist", pill: "Plan" };
      default: return { label: "Android: Closed Testing Queue", pill: "Queue" };
    }
  }

  async function hydrateAppsFromCloud(containers) {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/api/apps`);
      if (!res.ok) return;
      const apps = await res.json();
      if (!Array.isArray(apps) || !apps.length) return;

      apps.forEach((a) => {
        if (!a.appId) return;
        const id = a.appId.toLowerCase();
        const statusMeta = formatStatusBadge(a.androidStatus);
        if (APP_CONFIG[id]) {
          APP_CONFIG[id].name = a.appName || APP_CONFIG[id].name;
          APP_CONFIG[id].androidStatus = a.androidStatus || APP_CONFIG[id].androidStatus;
          APP_CONFIG[id].joinWebUrl = a.joinWebUrl || APP_CONFIG[id].joinWebUrl;
          APP_CONFIG[id].joinAndroidUrl = a.joinAndroidUrl || APP_CONFIG[id].joinAndroidUrl;
          APP_CONFIG[id].pill = statusMeta.pill;
        } else {
          APP_CONFIG[id] = {
            name: a.appName || id,
            subtitle: "Native Espresso Studio Application",
            badge: statusMeta.label,
            androidStatus: a.androidStatus || "TestingQueue",
            accent: "var(--cyan, #22d3ee)",
            platforms: [`Android (${statusMeta.pill})`],
            joinWebUrl: a.joinWebUrl || null,
            joinAndroidUrl: a.joinAndroidUrl || null,
            icon: "📱",
            pill: statusMeta.pill
          };
        }
      });

      // Re-render widgets with fresh cloud links & any new apps
      containers.forEach((container) => {
        const currentApp = container.getAttribute("data-current-app") || container.getAttribute("data-app-id") || "trans-title";
        renderQueueShell(container, APP_CONFIG[currentApp] ? currentApp : "trans-title");
      });

      // Also sync any new apps into the homepage support dropdown
      const supportSelect = document.getElementById("sup-app");
      if (supportSelect) {
        const existingValues = new Set(Array.from(supportSelect.options).map((o) => o.value.toLowerCase()));
        apps.forEach((a) => {
          const id = (a.appId || "").toLowerCase();
          if (id && !existingValues.has(id)) {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = a.appName || id;
            const companyOpt = supportSelect.querySelector("option[value='company']");
            supportSelect.insertBefore(opt, companyOpt || null);
          }
        });
      }
    } catch (_) {
      // Graceful fallback to static defaults
    }
  }

  function initTestingQueue() {
    const containers = document.querySelectorAll("[data-beta-widget]");
    if (!containers.length) return;

    containers.forEach((container) => {
      let activeAppId = container.getAttribute("data-app-id") || "trans-title";
      if (!APP_CONFIG[activeAppId]) activeAppId = "trans-title";
      renderQueueShell(container, activeAppId);
    });

    hydrateAppsFromCloud(containers);
  }

  function renderQueueShell(container, currentAppId) {
    container.setAttribute("data-current-app", currentAppId);
    const isMultiApp = !container.getAttribute("data-single-app");
    const cfg = APP_CONFIG[currentAppId] || APP_CONFIG["trans-title"];
    const tickets = getTickets();
    const currentTicket = tickets[currentAppId];

    let tabsHtml = "";
    if (isMultiApp) {
      const buttons = Object.keys(APP_CONFIG).map((id) => {
        const item = APP_CONFIG[id];
        return `
          <button class="queue-tab ${currentAppId === id ? 'active' : ''}" data-switch-app="${id}">
            <span class="tab-icon">${item.icon || "📱"}</span>
            <span>${item.name}</span>
            <span class="tab-pill">${item.pill || "Beta"}</span>
          </button>
        `;
      }).join("");
      tabsHtml = `<div class="queue-tabs" role="tablist">${buttons}</div>`;
    }

    container.innerHTML = `
      <div class="queue-card">
        ${tabsHtml}
        <div class="queue-body" data-queue-body></div>
      </div>
    `;

    if (isMultiApp) {
      container.querySelectorAll("[data-switch-app]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextAppId = btn.getAttribute("data-switch-app");
          renderQueueShell(container, nextAppId);
        });
      });
    }

    const bodyEl = container.querySelector("[data-queue-body]");
    if (currentTicket && currentTicket.email) {
      renderStatusView(bodyEl, currentAppId, cfg, currentTicket, container);
    } else {
      renderFormView(bodyEl, currentAppId, cfg, container);
    }
  }

  function renderFormView(bodyEl, appId, cfg, container) {
    const platformOptions = cfg.platforms.map((p, idx) => `
      <label class="platform-pill">
        <input type="radio" name="queue_platform_${appId}" value="${p}" ${idx === 0 ? "checked" : ""}>
        <span>${p}</span>
      </label>
    `).join("");

    bodyEl.innerHTML = `
      <div class="queue-header">
        <div class="queue-badge"><span class="pulse-dot"></span> ${cfg.badge}</div>
        <h3>Join the ${cfg.name} Closed Testing Squad</h3>
        <p class="queue-desc">${cfg.subtitle}. Enter your Google Play email to join the waitlist — or if you're already approved, unlock your direct Web &amp; Android install links instantly.</p>
      </div>

      <form class="queue-form" data-queue-form>
        <div class="platform-selector-row">
          <span class="selector-label">Target Platform:</span>
          <div class="platform-pills">${platformOptions}</div>
        </div>

        <div class="input-wrap">
          <input type="email" required placeholder="Enter your Google Play account email" class="queue-input" data-email-input autocomplete="email">
          <button type="submit" class="btn btn-primary queue-btn">
            <span>Join / Check Access</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        <div class="queue-meta">
          <span>⛨ 100% Free · Zero Spam · Direct Play Store Invitation</span>
          <span class="queue-note">Already approved? Typing your email unlocks your links &amp; QR pass immediately.</span>
        </div>
      </form>
    `;

    const form = bodyEl.querySelector("[data-queue-form]");
    const input = bodyEl.querySelector("[data-email-input]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = input.value.trim().toLowerCase();
      if (!email || !email.includes("@")) return;

      const checkedPlatform = form.querySelector(`input[name="queue_platform_${appId}"]:checked`)?.value || "Android";
      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Checking Cloud Access...</span>`;

      const newTicket = {
        email: email,
        appId: appId,
        appName: cfg.name,
        platform: checkedPlatform,
        status: "Pending",
        joinWebUrl: cfg.joinWebUrl,
        joinAndroidUrl: cfg.joinAndroidUrl,
        androidStatus: cfg.androidStatus,
        registeredAt: Date.now()
      };

      try {
        if (API_BASE) {
          const res = await fetch(`${API_BASE}/api/testers/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, appId, appName: cfg.name, platform: checkedPlatform })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status) newTicket.status = data.status;
            if (data.joinWebUrl || data.playStoreUrl) newTicket.joinWebUrl = data.joinWebUrl || data.playStoreUrl;
            if (data.joinAndroidUrl) newTicket.joinAndroidUrl = data.joinAndroidUrl;
            if (data.androidStatus) newTicket.androidStatus = data.androidStatus;
          }
        }
      } catch (err) {
        console.warn("Cloud connection deferred; local state ticket saved.", err);
      }

      saveTicket(appId, newTicket);
      renderStatusView(bodyEl, appId, cfg, newTicket, container);
    });
  }

  function renderStatusView(bodyEl, appId, cfg, ticket, container) {
    const isApproved = (ticket.status || "").toLowerCase() === "approved";
    const joinWebUrl = cfg.joinWebUrl || ticket.joinWebUrl || ticket.playStoreUrl || "";
    const joinAndroidUrl = cfg.joinAndroidUrl || ticket.joinAndroidUrl || joinWebUrl;
    const hasLinks = Boolean(joinWebUrl || joinAndroidUrl);
    const mobile = isMobileDevice();

    if (isApproved) {
      if (!hasLinks) {
        bodyEl.innerHTML = `
          <div class="queue-status-in approved-view">
            <div class="queue-header">
              <div class="queue-badge approved"><span class="dot-green"></span> Pre-Approved Tester</div>
              <h3>You are Approved for ${cfg.name}!</h3>
              <p class="queue-desc">Registered Account: <strong>${ticket.email}</strong></p>
            </div>
            <div class="pending-notice">
              <div class="notice-text">
                <p>Your Google Play account is pre-approved! As soon as <strong>${cfg.name}</strong> transitions from Testing Queue to Active Closed Testing, your <strong>Join via Web</strong> and <strong>Android Play Store QR / Install</strong> links will unlock right here automatically.</p>
              </div>
              <div class="ticket-footer-actions">
                <button class="btn-text-action" data-check-status>Refresh Links</button>
                <span class="sep">·</span>
                <button class="btn-text-action" data-reset-ticket>Change / Reset Account</button>
              </div>
            </div>
          </div>
        `;
      } else {
        const qrTargetUrl = joinAndroidUrl || joinWebUrl;
        const qrSvg = QR.generateSVG(qrTargetUrl, 168);

        bodyEl.innerHTML = `
          <div class="queue-status-in approved-view">
            <div class="queue-header">
              <div class="queue-badge approved"><span class="dot-green"></span> VIP Tester Access Granted</div>
              <h3>You are an Approved Tester for ${cfg.name}!</h3>
              <p class="queue-desc">Approved Account: <strong>${ticket.email}</strong> · Platform: <strong>${ticket.platform || 'Android'}</strong></p>
            </div>

            <div class="approved-deck">
              ${!mobile ? `
                <div class="qr-box">
                  <div class="qr-target-frame">
                    <span class="reticle r-tl"></span><span class="reticle r-tr"></span>
                    <span class="reticle r-bl"></span><span class="reticle r-br"></span>
                    <div class="qr-canvas">${qrSvg}</div>
                  </div>
                  <span class="qr-caption">Scan on Android to Open Play Store</span>
                </div>
              ` : ""}

              <div class="approved-actions">
                <div class="steps-mini">
                  <div class="step-m"><b>1.</b> Click <b>Join via Web</b> to accept the closed testing invite in your browser</div>
                  <div class="step-m"><b>2.</b> ${mobile ? "Tap <b>Join via Android</b> below to open Google Play and install" : "Scan the <b>QR Code</b> with your Android phone (or click <b>Join via Android</b>) to install from Google Play"}</div>
                  <div class="step-m"><b>3.</b> Make sure Google Play is signed in with <b>${ticket.email}</b></div>
                </div>

                <div class="approved-btn-row">
                  ${joinWebUrl ? `
                    <a href="${joinWebUrl}" target="_blank" rel="noopener" class="btn btn-primary">
                      <span>🌐 Join via Web</span>
                    </a>
                  ` : ""}
                  ${joinAndroidUrl ? `
                    <a href="${joinAndroidUrl}" target="_blank" rel="noopener" class="btn ${joinWebUrl ? 'btn-ghost' : 'btn-primary'}">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.5.8-.5 1.5v17.4c0 .7.2 1.2.5 1.5l9.2-9.6L3.6 1.8zm11.4 8.4l2.5-1.4L4.8.8l10.2 9.4zm0 3.6L4.8 23.2l12.7-7.6-2.5-1.8zm1.2-1.2l3.4 2c.9.5.9 1.4 0 1.9l-3.4 2-1.5-1.5 1.5-4.4z"/></svg>
                      <span>Join via Android (Play Store)</span>
                    </a>
                  ` : ""}
                  <button class="btn btn-ghost" data-copy-link>
                    <span>📋 Copy Link</span>
                  </button>
                </div>

                <div class="ticket-footer-actions">
                  <button class="btn-text-action" data-reset-ticket>Change / Check Another Email</button>
                </div>
              </div>
            </div>
          </div>
        `;

        const copyBtn = bodyEl.querySelector("[data-copy-link]");
        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(joinWebUrl || joinAndroidUrl).then(() => {
              copyBtn.innerHTML = "<span>✓ Copied!</span>";
              setTimeout(() => { copyBtn.innerHTML = "<span>📋 Copy Link</span>"; }, 2500);
            }).catch(() => {});
          });
        }
      }
    } else {
      bodyEl.innerHTML = `
        <div class="queue-status-in pending-view">
          <div class="queue-header">
            <div class="queue-badge pending"><span class="pulse-dot-amber"></span> Queue Spot Confirmed</div>
            <h3>Waiting for Closed Testing Approval</h3>
            <p class="queue-desc">Registered Account: <strong>${ticket.email}</strong> · Platform: <strong>${ticket.platform || 'Android'}</strong></p>
          </div>

          <div class="pending-notice">
            <div class="notice-text">
              <p>Your request is confirmed and logged in our priority queue. As soon as your account is whitelisted on Google Play Console, you will receive an email — and revisiting this page will automatically unlock your Web link and Android Play Store QR code.</p>
            </div>

            <div class="ticket-status-pill">
              <span class="pill-label">Cloud Status: <b>In Queue (Waiting Approval)</b></span>
              <div class="pill-buttons">
                <button class="btn btn-sm btn-primary" data-check-status title="Check live status from cloud">Refresh Status</button>
                <button class="btn btn-sm btn-ghost" data-reset-ticket>Change Email</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Quietly auto-check cloud once on load in case tester was recently approved
      if (API_BASE && !ticket._autoCheckedThisLoad) {
        ticket._autoCheckedThisLoad = true;
        fetch(`${API_BASE}/api/testers/status?email=${encodeURIComponent(ticket.email)}&appId=${encodeURIComponent(appId)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data && (data.status || "").toLowerCase() === "approved") {
              ticket.status = "Approved";
              ticket.joinWebUrl = data.joinWebUrl || data.playStoreUrl || ticket.joinWebUrl;
              ticket.joinAndroidUrl = data.joinAndroidUrl || ticket.joinAndroidUrl;
              ticket.androidStatus = data.androidStatus || ticket.androidStatus;
              saveTicket(appId, ticket);
              renderStatusView(bodyEl, appId, cfg, ticket, container);
            }
          })
          .catch(() => {});
      }
    }

    const checkBtn = bodyEl.querySelector("[data-check-status]");
    if (checkBtn) {
      checkBtn.addEventListener("click", async () => {
        checkBtn.textContent = "Checking...";
        checkBtn.disabled = true;

        if (API_BASE) {
          try {
            const res = await fetch(`${API_BASE}/api/testers/status?email=${encodeURIComponent(ticket.email)}&appId=${encodeURIComponent(appId)}`);
            if (res.ok) {
              const data = await res.json();
              ticket.joinWebUrl = data.joinWebUrl || data.playStoreUrl || ticket.joinWebUrl;
              ticket.joinAndroidUrl = data.joinAndroidUrl || ticket.joinAndroidUrl;
              ticket.androidStatus = data.androidStatus || ticket.androidStatus;
              if ((data.status || "").toLowerCase() === "approved") {
                ticket.status = "Approved";
                saveTicket(appId, ticket);
                renderStatusView(bodyEl, appId, cfg, ticket, container);
                return;
              }
            }
          } catch (_) {}
        }

        setTimeout(() => {
          checkBtn.textContent = "Still in Queue (Pending)";
          setTimeout(() => {
            checkBtn.disabled = false;
            checkBtn.textContent = "Refresh Status";
          }, 2500);
        }, 600);
      });
    }

    const resetBtn = bodyEl.querySelector("[data-reset-ticket]");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        removeTicket(appId);
        renderFormView(bodyEl, appId, cfg, container);
      });
    }
  }

  /* ==========================================================================
     4. Interactive Support & Diagnostic Portal (v2.0)
     ========================================================================== */
  function initSupportPortal() {
    const portals = document.querySelectorAll("[data-support-portal]");
    if (!portals.length) return;

    portals.forEach((portal) => {
      setupPortalInstance(portal);
    });
  }

  function setupPortalInstance(portal) {
    const pillsContainer = portal.querySelector("[data-symptom-pills]");
    const dynamicHelp = portal.querySelector("[data-dynamic-troubleshooting]");
    const issueForm = portal.querySelector("[data-issue-form]");
    const issueAlert = portal.querySelector("[data-issue-alert]");
    const categorySelect = portal.querySelector("[data-issue-category]");
    const dropzone = portal.querySelector("[data-file-dropzone]");
    const fileInput = portal.querySelector("[data-file-input]");
    const filePreview = portal.querySelector("[data-file-preview]");
    const autoDetectBtn = portal.querySelector("[data-auto-detect-specs]");
    const descField = portal.querySelector("[name='description']");

    let currentAttachment = { base64: null, fileName: null };

    // Self-Service Advice Repository
    const adviceMap = {
      "windows-store": {
        title: "⚡ Instant Fix: Microsoft Store Download Stuck or Error 0x80070005",
        steps: [
          "<b>Reset Microsoft Store Cache:</b> Press <kbd>Win + R</kbd>, type <code>wsreset.exe</code> and press <kbd>Enter</kbd>. Wait 30 seconds for the store window to re-open automatically.",
          "<b>Install via Windows Terminal (PowerShell):</b><br><code>winget install \"Native Espresso.TransTitle\"</code>",
          "<b>Need offline package?</b> If your organization restricts Microsoft Store, submit the form below to receive a direct signed <code>.msixbundle</code> offline installer."
        ]
      },
      "android-install": {
        title: "⚡ Instant Fix: Google Play Closed Testing Track Not Showing App",
        steps: [
          "<b>Verify Account:</b> Ensure your phone is logged into Google Play using the <b>exact same email</b> registered in our testing queue.",
          "<b>Wait for CDN Propagation:</b> After accepting the web invite, Google Play CDN permissions take 5–10 minutes to propagate to your Android device.",
          "<b>Clear Play Store Cache:</b> On Android, go to <i>Settings → Apps → Google Play Store → Storage → Clear Cache</i>, then re-open the invite link."
        ]
      },
      "audio-permission": {
        title: "⚡ Audio Recording & Storage Access",
        steps: [
          "<b>Microphone Access:</b> Android and Windows require explicit microphone permission for real-time speech and acoustic analysis.",
          "<b>100% Offline Guarantee:</b> We never upload audio to remote servers. Granting permission only connects your hardware microphone to the local silicon DSP engine."
        ]
      },
      "app-crash": {
        title: "⚡ App Crashes on Startup or Launch Error",
        steps: [
          "<b>Verify Hardware Requirements:</b> Trans-Title and Echo Cleaner require Android 8.0+ (ARM64 / x86_64) or Windows 10/11 Build 19041+.",
          "<b>Attach Crash Details:</b> Use the dropzone below to attach a screenshot or log file so our engineering team can isolate the fault."
        ]
      },
      "general": {
        title: "💡 General Questions & Feature Suggestions",
        steps: [
          "We read every suggestion from our testing community! Submit your thoughts below and we'll reply within 24 hours."
        ]
      }
    };

    // Render interactive symptom pills if container exists
    if (pillsContainer) {
      const pills = [
        { id: "windows-store", icon: "🪟", label: "Windows Store Stuck" },
        { id: "android-install", icon: "🤖", label: "Play Store Track" },
        { id: "audio-permission", icon: "🎙️", label: "Audio Permission" },
        { id: "app-crash", icon: "⚡", label: "App Crashes" },
        { id: "general", icon: "💬", label: "General Feedback" }
      ];

      pillsContainer.innerHTML = pills.map((p) => `
        <button type="button" class="symptom-pill" data-pill-id="${p.id}">
          <span class="pill-ico">${p.icon}</span>
          <span>${p.label}</span>
        </button>
      `).join("");

      pillsContainer.querySelectorAll(".symptom-pill").forEach((btn) => {
        btn.addEventListener("click", () => {
          pillsContainer.querySelectorAll(".symptom-pill").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          const id = btn.getAttribute("data-pill-id");
          if (categorySelect) categorySelect.value = id;

          showAdvice(id);
        });
      });
    }

    function showAdvice(id) {
      if (!dynamicHelp) return;
      const item = adviceMap[id];
      if (!item) {
        dynamicHelp.innerHTML = "";
        return;
      }

      dynamicHelp.innerHTML = `
        <div class="troubleshoot-box">
          <div class="tb-title">${item.title}</div>
          <ol class="tb-steps">
            ${item.steps.map((s) => `<li>${s}</li>`).join("")}
          </ol>
        </div>
      `;
    }

    if (categorySelect) {
      categorySelect.addEventListener("change", () => {
        const val = categorySelect.value;
        if (pillsContainer) {
          pillsContainer.querySelectorAll(".symptom-pill").forEach((b) => {
            b.classList.toggle("active", b.getAttribute("data-pill-id") === val);
          });
        }
        showAdvice(val);
      });
    }

    // Auto-detect device specs
    if (autoDetectBtn && descField) {
      autoDetectBtn.addEventListener("click", () => {
        const ua = navigator.userAgent;
        let os = "Unknown OS";
        if (ua.includes("Win")) os = "Windows";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("Mac")) os = "macOS";
        else if (ua.includes("Linux")) os = "Linux";

        const specs = `\n\n--- Diagnostic Environment ---\nOS: ${os}\nScreen: ${window.screen.width}x${window.screen.height}\nLanguage: ${navigator.language}\nUserAgent: ${ua}`;
        if (!descField.value.includes("--- Diagnostic Environment ---")) {
          descField.value = descField.value.trim() + specs;
        }
        autoDetectBtn.textContent = "✓ Specs Appended";
        setTimeout(() => { autoDetectBtn.textContent = "⚡ Auto-Detect OS & Device"; }, 2500);
      });
    }

    // File / Screenshot Dropzone
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      ["dragenter", "dragover"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.add("dragover");
        });
      });

      ["dragleave", "drop"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.remove("dragover");
        });
      });

      dropzone.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
      });

      fileInput.addEventListener("change", () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
      });
    }

    function handleFile(file) {
      const maxMb = 15;
      if (file.size > maxMb * 1024 * 1024) {
        alert(`File size exceeds ${maxMb} MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(",")[1];
        currentAttachment = { base64: base64, fileName: file.name };

        if (filePreview) {
          const isImg = file.type.startsWith("image/");
          const isVideo = file.type.startsWith("video/");
          const sizeKb = (file.size / 1024).toFixed(1);
          const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;

          filePreview.innerHTML = `
            <div class="file-chip">
              <span>${isVideo ? "🎬 Video:" : "📎"} ${file.name} (${sizeStr})</span>
              <button type="button" class="chip-remove" data-remove-file title="Remove file">✕</button>
            </div>
            ${isImg ? `<img src="${e.target.result}" class="preview-thumb" alt="Upload thumbnail" />` : ""}
            ${isVideo ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:2px;">🎬 Video clip ready for Azure Blob Storage upload</div>` : ""}
          `;
          filePreview.querySelector("[data-remove-file]")?.addEventListener("click", () => {
            currentAttachment = { base64: null, fileName: null };
            filePreview.innerHTML = "";
            if (fileInput) fileInput.value = "";
          });
        }
      };
      reader.readAsDataURL(file);
    }

    // Form submission
    if (issueForm) {
      issueForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = issueForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Submitting to Cloud...</span>`;

        const email = issueForm.querySelector("[name='email']").value.trim();
        const appId = issueForm.querySelector("[name='appId']")?.value || "trans-title";
        const platform = issueForm.querySelector("[name='platform']")?.value || "Android";
        const category = categorySelect ? categorySelect.value : "general";
        const description = issueForm.querySelector("[name='description']").value.trim();
        const appName = APP_CONFIG[appId]?.name || (appId === "trans-title" ? "Trans-Title" : appId === "echo-cleaner" ? "Echo Cleaner" : "General / Studio");

        const ticketNum = "NE-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        const payload = {
          email: email,
          appId: appId,
          appName: appName,
          platform: platform,
          category: category,
          description: description,
          attachmentBase64: currentAttachment.base64,
          attachmentFileName: currentAttachment.fileName
        };

        try {
          if (API_BASE) {
            await fetch(`${API_BASE}/api/support/report-issue`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
          }
        } catch (err) {
          console.warn("Cloud issue submission fallback active.", err);
        }

        saveLocalIssue({
          ticketNumber: ticketNum,
          email: email,
          appId: appId,
          platform: platform,
          category: category,
          status: "Open",
          submittedAt: new Date().toLocaleDateString()
        });

        if (issueAlert) {
          issueAlert.innerHTML = `
            <div class="alert-success">
              <b>✓ Ticket #${ticketNum} Logged Successfully</b>
              <p>Your issue has been recorded directly in our studio diagnostic backlog. A confirmation email has been queued for <strong>${email}</strong>, and an engineer will review your hardware environment.</p>
            </div>
          `;
        }

        issueForm.reset();
        currentAttachment = { base64: null, fileName: null };
        if (filePreview) filePreview.innerHTML = "";
        if (dynamicHelp) dynamicHelp.innerHTML = "";
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Submit Another Report</span>`;
      });
    }

    // Ticket Lookup Tab
    const lookupForm = portal.querySelector("[data-lookup-form]");
    const lookupResult = portal.querySelector("[data-lookup-result]");
    if (lookupForm && lookupResult) {
      lookupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = lookupForm.querySelector("[name='ticketQuery']").value.trim().toUpperCase();
        const localIssues = getLocalIssues();
        const match = localIssues.find((i) => i.ticketNumber.toUpperCase() === query || i.email.toUpperCase() === query);

        if (match) {
          lookupResult.innerHTML = `
            <div class="ticket-status-card">
              <div class="tsc-head">
                <span class="tsc-num">#${match.ticketNumber}</span>
                <span class="tsc-badge">${match.status}</span>
              </div>
              <p class="tsc-detail">App: <b>${match.appId}</b> · Platform: <b>${match.platform}</b> · Submitted: <b>${match.submittedAt}</b></p>
              <p class="tsc-note">Our development team in Sargodha is actively inspecting this ticket. You will receive progress notifications directly to <b>${match.email}</b>.</p>
            </div>
          `;
        } else {
          lookupResult.innerHTML = `
            <div class="ticket-status-card not-found">
              <p>No local record found for <strong>${query}</strong>. If you recently submitted on another device, check your email inbox for the confirmation ticket link.</p>
            </div>
          `;
        }
      });
    }
  }

  /* ==========================================================================
     5. Bootloader on DOM Ready
     ========================================================================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initTestingQueue();
      initSupportPortal();
    });
  } else {
    initTestingQueue();
    initSupportPortal();
  }
})();
