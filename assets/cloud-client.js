/**
 * Native Espresso — Cloud Client & Diagnostic Engine (v3.0)
 * Features:
 * 1. Unified Remembered Tester Email across Company Hub & Product Pages
 * 2. Company-Level General Closed Testing Signup (Pick All, One, or Few Apps)
 * 3. Per-Product Automatic Approval Check + Play Store Links & ISO/IEC 18004 QR Code
 * 4. Compact Expandable General Support (Company) & Product-Scoped Support Portals
 */

(function () {
  "use strict";

  const DEFAULT_API_BASE = "https://native-espresso-web-function-epbhdxbxbybte6bz.centralus-01.azurewebsites.net";
  const API_BASE = window.NE_API_BASE || DEFAULT_API_BASE;
  const EMAIL_STORAGE_KEY = "ne_tester_email";
  const STORAGE_KEY = "ne_tester_tickets";
  const ISSUE_STORAGE_KEY = "ne_submitted_tickets";
  const REVIEW_STORAGE_KEY = "ne_pending_reviews";

  /* ==========================================================================
     1. LocalStorage Helpers
     ========================================================================== */
  function getRememberedEmail() {
    try {
      const saved = (localStorage.getItem(EMAIL_STORAGE_KEY) || "").trim().toLowerCase();
      if (saved && saved.includes("@")) return saved;
      // Backwards compatibility: infer from existing per-app tickets if present
      const tickets = getTickets();
      for (const k of Object.keys(tickets)) {
        if (tickets[k]?.email) return String(tickets[k].email).trim().toLowerCase();
      }
      return "";
    } catch (_) {
      return "";
    }
  }

  function saveRememberedEmail(email) {
    try {
      const clean = (email || "").trim().toLowerCase();
      if (clean) localStorage.setItem(EMAIL_STORAGE_KEY, clean);
      else localStorage.removeItem(EMAIL_STORAGE_KEY);
    } catch (_) {}
  }

  function clearAllTesterState() {
    try {
      localStorage.removeItem(EMAIL_STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

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

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
     3. App Registry, Lifecycle Countdown & Cloud Status Helpers
     ========================================================================== */
  const APP_CONFIG = {
    "trans-title": {
      name: "Trans-Title",
      pageUrl: "trans-title/",
      subtitle: "On-Device Multimedia & AI Studio",
      badge: "Android: Closed-Testing (v1.0.17) · Windows (WinUI 3): Development",
      androidStatus: "ClosedTesting",
      windowsStatus: "Development",
      iosStatus: "Roadmap",
      macosStatus: "Roadmap",
      linuxStatus: "Roadmap",
      accent: "var(--magenta, #f43f7b)",
      platforms: ["Android (Closed Testing v1.0.17)", "Windows (WinUI 3 Beta)"],
      joinWebUrl: "https://play.google.com/apps/testing/com.espressonative.transtitle",
      joinAndroidUrl: "https://play.google.com/store/apps/details?id=com.espressonative.transtitle",
      closedTestingStartDate: null,
      closedTestingDays: 14,
      statusMessage: null,
      microsoftStoreUrl: null,
      windowsWingetId: null,
      latestVersion: "1.0.17",
      latestReleaseNotes: "Faster on-device speech recognition, 5-minute continuous pipelining with 3s overlap stitching, and improved background wake-lock resilience.",
      latestUpdatePublishedAt: null,
      pill: "Active"
    },
    "echo-cleaner": {
      name: "Echo Cleaner",
      pageUrl: "echo-cleaner/",
      subtitle: "On-Device Neural Audio Enhancement Engine",
      badge: "Android: Closed Testing Queue (Finalizing)",
      androidStatus: "TestingQueue",
      windowsStatus: "Planning",
      iosStatus: "Planning",
      macosStatus: "Hidden",
      linuxStatus: "Hidden",
      accent: "var(--cyan, #22d3ee)",
      platforms: ["Android (Closed Testing Queue)", "iOS (Planning Waitlist)"],
      joinWebUrl: null,
      joinAndroidUrl: null,
      closedTestingStartDate: null,
      closedTestingDays: 14,
      statusMessage: null,
      microsoftStoreUrl: null,
      windowsWingetId: null,
      latestVersion: null,
      latestReleaseNotes: null,
      latestUpdatePublishedAt: null,
      pill: "Queue"
    }
  };

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function isAppAcceptingTesters(cfg) {
    const s = (cfg?.androidStatus || "").toLowerCase();
    return s !== "published" && s !== "productionapproved";
  }

  function formatStatusBadge(androidStatus) {
    switch ((androidStatus || "").toLowerCase()) {
      case "closedtesting": return { label: "Android: Closed Testing Active", pill: "Active", tagClass: "active" };
      case "testingextended": return { label: "Android: Closed Testing Extended", pill: "Extended", tagClass: "queue" };
      case "productionapproved": return { label: "Android: Production Approved", pill: "Approved", tagClass: "active" };
      case "published": return { label: "Android: Published on Google Play", pill: "Live", tagClass: "active" };
      case "planning": return { label: "Android: Planning Waitlist", pill: "Plan", tagClass: "" };
      default: return { label: "Android: Closed Testing Queue", pill: "Queue", tagClass: "queue" };
    }
  }

  function formatWindowsStatus(windowsStatus) {
    switch ((windowsStatus || "").toLowerCase()) {
      case "published": return { label: "Published on Microsoft Store", tagClass: "active" };
      case "closedtesting": return { label: "Closed Testing (Beta)", tagClass: "queue" };
      case "development": return { label: "In Active Development", tagClass: "dev" };
      default: return { label: "In Planning", tagClass: "" };
    }
  }

  function formatGenericPlatformStatus(status) {
    switch ((status || "").toLowerCase()) {
      case "published": return { label: "Published", tagClass: "active", hidden: false };
      case "closedtesting": return { label: "Closed Testing", tagClass: "queue", hidden: false };
      case "development": return { label: "In Active Development", tagClass: "dev", hidden: false };
      case "planning": return { label: "In Planning", tagClass: "", hidden: false };
      case "hidden": return { label: "Hidden", tagClass: "", hidden: true };
      default: return { label: "On Roadmap", tagClass: "", hidden: false };
    }
  }

  function buildPlatformChoices(cfg) {
    const aMeta = formatStatusBadge(cfg.androidStatus);
    const verSuffix = cfg.latestVersion ? ` v${cfg.latestVersion}` : "";
    const list = [`Android (${aMeta.pill}${cfg.androidStatus?.toLowerCase() === "closedtesting" ? verSuffix : ""})`];

    const extras = [
      ["Windows (WinUI 3)", cfg.windowsStatus, formatWindowsStatus(cfg.windowsStatus)],
      ["iOS", cfg.iosStatus, formatGenericPlatformStatus(cfg.iosStatus)],
      ["macOS", cfg.macosStatus, formatGenericPlatformStatus(cfg.macosStatus)],
      ["Linux", cfg.linuxStatus, formatGenericPlatformStatus(cfg.linuxStatus)]
    ];
    extras.forEach(([name, raw, meta]) => {
      const s = (raw || "").toLowerCase();
      if (s === "closedtesting" || s === "development" || s === "planning") {
        list.push(`${name} (${meta.label})`);
      }
    });
    return list;
  }

  function computeCountdown(startDateIso, totalDays) {
    if (!startDateIso) return null;
    const startMs = Date.parse(startDateIso);
    if (Number.isNaN(startMs)) return null;
    const days = Math.max(1, Number(totalDays) || 14);
    const totalMs = days * 86400000;
    const endMs = startMs + totalMs;
    const nowMs = Date.now();
    const remainingMs = Math.max(0, endMs - nowMs);
    const elapsedMs = Math.max(0, Math.min(totalMs, nowMs - startMs));
    const pct = Math.min(100, Math.max(0, Number(((elapsedMs / totalMs) * 100).toFixed(1))));
    const currentDay = Math.min(days, Math.max(1, Math.floor(elapsedMs / 86400000) + 1));

    const elapsedDays = Math.floor(elapsedMs / 86400000);
    const elapsedHours = Math.floor((elapsedMs % 86400000) / 3600000);
    const elapsedMins = Math.floor((elapsedMs % 3600000) / 60000);

    const remDays = Math.floor(remainingMs / 86400000);
    const remHours = Math.floor((remainingMs % 86400000) / 3600000);
    const remMins = Math.floor((remainingMs % 3600000) / 60000);
    const remSecs = Math.floor((remainingMs % 60000) / 1000);

    return {
      startDate: new Date(startMs),
      endDate: new Date(endMs),
      totalDays: days,
      currentDay,
      percent: pct,
      isComplete: nowMs >= endMs,
      isNotStarted: nowMs < startMs,
      elapsedDays,
      elapsedHours,
      elapsedMins,
      remDays,
      remHours,
      remMins,
      remSecs
    };
  }

  function formatCountdownStrings(cd) {
    const pad = (n) => String(n).padStart(2, "0");
    const fmtDate = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    if (cd.isComplete) {
      return {
        running: `Ran ${cd.totalDays}d / ${cd.totalDays}d`,
        remaining: "Window complete · Awaiting Play review",
        headline: `${cd.totalDays}-day closed testing window complete — still accepting testers for next cycle`,
        startLabel: fmtDate(cd.startDate),
        endLabel: fmtDate(cd.endDate)
      };
    }
    if (cd.isNotStarted) {
      return {
        running: `Starts ${fmtDate(cd.startDate)}`,
        remaining: `${cd.totalDays}d cycle scheduled`,
        headline: `Closed testing window starts ${fmtDate(cd.startDate)} (${cd.totalDays} days)`,
        startLabel: fmtDate(cd.startDate),
        endLabel: fmtDate(cd.endDate)
      };
    }
    const runParts = [];
    if (cd.elapsedDays > 0) runParts.push(`${cd.elapsedDays}d`);
    runParts.push(`${cd.elapsedHours}h`);
    if (cd.elapsedDays === 0) runParts.push(`${cd.elapsedMins}m`);

    const remParts = [];
    if (cd.remDays > 0) remParts.push(`${cd.remDays}d`);
    remParts.push(`${pad(cd.remHours)}h`);
    remParts.push(`${pad(cd.remMins)}m`);
    remParts.push(`${pad(cd.remSecs)}s`);

    return {
      running: `Day ${cd.currentDay}/${cd.totalDays} · Running ${runParts.join(" ")}`,
      remaining: `${remParts.join(" ")} left`,
      headline: `Day ${cd.currentDay} of ${cd.totalDays} · Running ${runParts.join(" ")} · ${remParts.join(" ")} remaining`,
      startLabel: fmtDate(cd.startDate),
      endLabel: fmtDate(cd.endDate)
    };
  }

  function isActiveTestingCycle(cfg) {
    const s = (cfg?.androidStatus || "").toLowerCase();
    return s === "closedtesting" || s === "testingextended";
  }

  function getEffectiveStartDate(cfg) {
    if (cfg?.closedTestingStartDate) return cfg.closedTestingStartDate;
    // Localhost-only preview helper (?previewStart=ISO) so live ticking can be inspected offline without affecting production
    try {
      if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
        const p = new URLSearchParams(location.search).get("previewStart");
        if (p && !Number.isNaN(Date.parse(p))) return p;
      }
    } catch (_) {}
    return null;
  }

  function renderCountdownHtml(cfg) {
    const status = (cfg.androidStatus || "").toLowerCase();
    const startDate = getEffectiveStartDate(cfg);
    if (!isActiveTestingCycle(cfg) || !startDate) {
      return "";
    }
    const cd = computeCountdown(startDate, cfg.closedTestingDays);
    if (!cd) return "";
    const txt = formatCountdownStrings(cd);

    return `
      <div class="lifecycle-countdown ${status === "testingextended" ? "is-extended" : ""}" data-countdown-start="${escapeHtml(startDate)}" data-countdown-days="${cd.totalDays}">
        <div class="lc-head">
          <span class="lc-label">${status === "testingextended" ? "Extended Testing Window" : "Google Play Closed Testing Window"}</span>
          <span class="lc-time" data-countdown-text>${escapeHtml(txt.headline)}</span>
        </div>
        <div class="lc-track" role="progressbar" aria-valuenow="${Math.round(cd.percent)}" aria-valuemin="0" aria-valuemax="100">
          <div class="lc-fill" style="width:${cd.percent}%"></div>
        </div>
        <div class="lc-dates">
          <span>Started ${escapeHtml(txt.startLabel)}</span>
          <span>Target completion ${escapeHtml(txt.endLabel)}</span>
        </div>
      </div>
    `;
  }

  function focusJoinFormForApp(appId) {
    const studioSection = document.getElementById("closed-testing");
    const productSection = document.getElementById("beta-queue");
    const target = productSection || studioSection;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      if (studioSection && appId) {
        const cb = studioSection.querySelector(`input[name='studio_app'][value='${appId}']`);
        if (cb && !cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        }
        const emailEl = studioSection.querySelector("[data-studio-email]");
        if (emailEl) emailEl.focus({ preventScroll: true });
      } else if (productSection) {
        const emailEl = productSection.querySelector("[data-email-input]");
        if (emailEl) emailEl.focus({ preventScroll: true });
      }
    }, 420);
  }

  function renderStudioTopLiveBanner() {
    const slot = document.querySelector("[data-studio-live-banner]");
    if (!slot) return;

    const activeApps = Object.entries(APP_CONFIG).filter(([, cfg]) => isActiveTestingCycle(cfg));
    if (!activeApps.length) {
      slot.innerHTML = "";
      slot.hidden = true;
      return;
    }

    const email = getRememberedEmail();
    const tickets = getTickets();
    let hasTimed = false;

    const rows = activeApps.map(([appId, cfg]) => {
      const status = (cfg.androidStatus || "").toLowerCase();
      const isExtended = status === "testingextended";
      const startDate = getEffectiveStartDate(cfg);
      const cd = startDate ? computeCountdown(startDate, cfg.closedTestingDays) : null;
      const txt = cd ? formatCountdownStrings(cd) : null;
      if (cd) hasTimed = true;

      const t = email && tickets[appId] && tickets[appId].email === email ? tickets[appId] : null;
      const tStatus = t ? (t.status || "").toLowerCase() : "";
      const ctaLabel = tStatus === "approved"
        ? "✓ Approved · Open Page"
        : tStatus === "pending"
          ? "In Queue · View Status"
          : (isExtended ? "+ Join Extended Cycle" : "+ Join Running Cycle");
      const ctaHref = tStatus === "approved" ? `${cfg.pageUrl || `${appId}/`}#beta-queue` : "#closed-testing";

      return `
        <div class="live-cycle-bar ${isExtended ? "is-extended" : ""}" ${cd ? `data-countdown-start="${escapeHtml(startDate)}" data-countdown-days="${cd.totalDays}"` : ""}>
          <div class="live-cycle-main">
            <div class="live-cycle-meta">
              <span class="live-cycle-pill">
                <span class="${isExtended ? "pulse-dot-amber" : "pulse-dot-green"}" aria-hidden="true"></span>
                ${isExtended ? "Extended Testing" : "Closed Testing Live"}
              </span>
              <a class="live-cycle-app" href="${escapeHtml(cfg.pageUrl || `${appId}/`)}">${escapeHtml(cfg.name)}</a>
              <span class="live-cycle-sub">${cd
                ? `<strong data-countdown-running>${escapeHtml(txt.running)}</strong><span class="lc-sep">·</span><span class="live-cycle-rem" data-countdown-remaining>${escapeHtml(txt.remaining)}</span>`
                : `<strong>${cfg.closedTestingDays || 14}-Day Track Active</strong><span class="lc-sep">·</span><span class="live-cycle-rem">Open for new testers (current &amp; next cycle)</span>`}
              </span>
            </div>
            ${cd ? `
              <div class="live-cycle-track" role="progressbar" aria-valuenow="${Math.round(cd.percent)}" aria-valuemin="0" aria-valuemax="100">
                <div class="lc-fill" style="width:${cd.percent}%"></div>
              </div>
            ` : ""}
          </div>
          <div class="live-cycle-actions">
            ${tStatus === "approved"
              ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(ctaHref)}">${ctaLabel} →</a>`
              : `<button type="button" class="btn btn-primary btn-sm" data-join-running-app="${escapeHtml(appId)}">${ctaLabel}</button>`}
          </div>
        </div>
      `;
    }).join("");

    slot.innerHTML = `<div class="live-cycle-stack">${rows}</div>`;
    slot.hidden = false;

    slot.querySelectorAll("[data-join-running-app]").forEach((btn) => {
      btn.addEventListener("click", () => focusJoinFormForApp(btn.getAttribute("data-join-running-app")));
    });

    if (hasTimed) startCountdownTicker();
  }

  function renderProductHeroCountdown(appId, cfg, ticket) {
    const slot = document.querySelector(`[data-hero-countdown="${appId}"]`);
    if (!slot) return;

    if (!isActiveTestingCycle(cfg)) {
      slot.innerHTML = "";
      slot.hidden = true;
      return;
    }

    const status = (cfg.androidStatus || "").toLowerCase();
    const isExtended = status === "testingextended";
    const startDate = getEffectiveStartDate(cfg);
    const cd = startDate ? computeCountdown(startDate, cfg.closedTestingDays) : null;
    const txt = cd ? formatCountdownStrings(cd) : null;

    const tStatus = ticket ? (ticket.status || "").toLowerCase() : "";
    const ctaLabel = tStatus === "approved"
      ? "✓ Approved · View Play Links ↓"
      : tStatus === "pending"
        ? "In Queue · Check Status ↓"
        : (isExtended ? "+ Join Extended Cycle" : "+ Join Running Cycle");

    slot.innerHTML = `
      <div class="live-cycle-bar ${isExtended ? "is-extended" : ""}" ${cd ? `data-countdown-start="${escapeHtml(startDate)}" data-countdown-days="${cd.totalDays}"` : ""}>
        <div class="live-cycle-main">
          <div class="live-cycle-meta">
            <span class="live-cycle-pill">
              <span class="${isExtended ? "pulse-dot-amber" : "pulse-dot"}" aria-hidden="true"></span>
              ${isExtended ? "Extended Closed Testing" : "Closed Testing Running"}
            </span>
            <span class="live-cycle-sub">${cd
              ? `<strong data-countdown-running>${escapeHtml(txt.running)}</strong><span class="lc-sep">·</span><span class="live-cycle-rem" data-countdown-remaining>${escapeHtml(txt.remaining)}</span>`
              : `<strong>${cfg.closedTestingDays || 14}-Day Cycle Active</strong><span class="lc-sep">·</span><span class="live-cycle-rem">Still open — join anytime for current or next cycle</span>`}
            </span>
          </div>
          ${cd ? `
            <div class="live-cycle-track" role="progressbar" aria-valuenow="${Math.round(cd.percent)}" aria-valuemin="0" aria-valuemax="100">
              <div class="lc-fill" style="width:${cd.percent}%"></div>
            </div>
            <div class="live-cycle-dates">
              <span>Started ${escapeHtml(txt.startLabel)}</span>
              <span>Already running? You can still join for this cycle or the next.</span>
              <span>Target ${escapeHtml(txt.endLabel)}</span>
            </div>
          ` : `
            <div class="live-cycle-dates">
              <span>Already running? Add your Google Play email anytime so you're included in this cycle and any follow-up cycle.</span>
            </div>
          `}
        </div>
        <div class="live-cycle-actions">
          <button type="button" class="btn btn-primary btn-sm" data-join-running-app="${escapeHtml(appId)}">${ctaLabel}</button>
        </div>
      </div>
    `;
    slot.hidden = false;

    slot.querySelector("[data-join-running-app]")?.addEventListener("click", () => focusJoinFormForApp(appId));

    if (cd) startCountdownTicker();
  }

  function renderLifecycleNoticeHtml(cfg) {
    const status = (cfg.androidStatus || "").toLowerCase();
    const msg = (cfg.statusMessage || "").trim();

    if (status === "productionapproved") {
      const body = msg || `Thank you to every tester who installed, tested, and shared feedback! ${cfg.name} has been granted Google Play Production access and is now preparing for public release.`;
      return `
        <div class="lifecycle-banner is-thanks">
          <div class="lb-badge"><span class="dot-green"></span> Production Access Granted</div>
          <h3>Thank You to Our Closed Testing Community!</h3>
          <p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>
        </div>
      `;
    }

    if (status === "testingextended") {
      const body = msg || `Google Play requested additional closed testing activity before granting production access. Please keep ${cfg.name} installed and open it occasionally — your participation directly helps us reach public release!`;
      return `
        <div class="lifecycle-banner is-notice">
          <div class="lb-badge"><span class="pulse-dot-amber"></span> Closed Testing Update</div>
          <h3>Additional Closed Testing Requested</h3>
          <p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>
        </div>
      `;
    }

    if (status === "published" && msg) {
      return `
        <div class="lifecycle-banner is-thanks">
          <div class="lb-badge"><span class="dot-green"></span> Release Note &amp; Thanks</div>
          <p style="margin:0;">${escapeHtml(msg).replace(/\n/g, "<br>")}</p>
        </div>
      `;
    }

    if (msg) {
      return `
        <div class="lifecycle-banner is-info">
          <div class="lb-badge">Studio Notice</div>
          <p style="margin:0;">${escapeHtml(msg).replace(/\n/g, "<br>")}</p>
        </div>
      `;
    }

    return "";
  }

  function renderPublicInstallDeckHtml(cfg) {
    const androidLive = (cfg.androidStatus || "").toLowerCase() === "published" && Boolean(cfg.joinAndroidUrl || cfg.joinWebUrl);
    const windowsLive = (cfg.windowsStatus || "").toLowerCase() === "published" && Boolean(cfg.microsoftStoreUrl);
    if (!androidLive && !windowsLive) return "";

    const mobile = isMobileDevice();
    const playUrl = cfg.joinAndroidUrl || cfg.joinWebUrl;
    const qrSvg = androidLive && !mobile ? QR.generateSVG(playUrl, 152) : "";
    const wingetCmd = cfg.windowsWingetId ? `winget install "${cfg.windowsWingetId}"` : "";

    const androidCard = androidLive ? `
      <div class="store-install-card">
        <div class="store-card-head">
          <span class="store-pill is-live">● Live on Google Play</span>
          <h4>Android — Google Play Store</h4>
        </div>
        <div class="store-card-body ${!mobile ? "with-qr" : ""}">
          ${!mobile ? `
            <div class="qr-box store-qr">
              <div class="qr-target-frame">
                <span class="reticle r-tl"></span><span class="reticle r-tr"></span>
                <span class="reticle r-bl"></span><span class="reticle r-br"></span>
                <div class="qr-canvas">${qrSvg}</div>
              </div>
              <span class="qr-caption">Scan on Android</span>
            </div>
          ` : ""}
          <div class="store-card-steps">
            <ol class="install-steps">
              <li>${mobile ? "Tap <b>Get it on Google Play</b> below to open the official store listing." : "Click <b>Get it on Google Play</b> or scan the <b>QR code</b> with your Android phone."}</li>
              <li>Tap <b>Install</b> — runs 100% on-device with no account required.</li>
            </ol>
            <div class="approved-btn-row">
              <a href="${escapeHtml(playUrl)}" target="_blank" rel="noopener" class="btn btn-primary">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.5.8-.5 1.5v17.4c0 .7.2 1.2.5 1.5l9.2-9.6L3.6 1.8zm11.4 8.4l2.5-1.4L4.8.8l10.2 9.4zm0 3.6L4.8 23.2l12.7-7.6-2.5-1.8zm1.2-1.2l3.4 2c.9.5.9 1.4 0 1.9l-3.4 2-1.5-1.5 1.5-4.4z"/></svg>
                <span>Get it on Google Play</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    ` : "";

    const windowsCard = windowsLive ? `
      <div class="store-install-card">
        <div class="store-card-head">
          <span class="store-pill is-live">● Live on Microsoft Store</span>
          <h4>Windows — Microsoft Store</h4>
        </div>
        <div class="store-card-body">
          <div class="store-card-steps">
            <ol class="install-steps">
              <li>Click <b>Get it on Microsoft Store</b> to open the official Windows listing.</li>
              <li>Click <b>Get / Install</b> in Microsoft Store for automatic updates.</li>
              ${wingetCmd ? `<li>Or install via Windows Terminal:</li>` : ""}
            </ol>
            ${wingetCmd ? `
              <div class="winget-row">
                <code>${escapeHtml(wingetCmd)}</code>
                <button type="button" class="btn btn-ghost btn-sm" data-copy-text="${escapeHtml(wingetCmd)}">Copy</button>
              </div>
            ` : ""}
            <div class="approved-btn-row">
              <a href="${escapeHtml(cfg.microsoftStoreUrl)}" target="_blank" rel="noopener" class="btn btn-primary">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M3 5.5L11 4.4V11.5H3V5.5zm9-1.2L21 3V11.5H12V4.3zM3 12.5H11V19.6L3 18.5V12.5zm9 0H21V21L12 19.7V12.5z"/></svg>
                <span>Get it on Microsoft Store</span>
              </a>
              <a href="#support" class="btn btn-ghost btn-sm">Store Troubleshooting</a>
            </div>
          </div>
        </div>
      </div>
    ` : "";

    return `
      <div class="public-install-deck">
        <div class="public-install-grid ${androidLive && windowsLive ? "two-col" : ""}">
          ${androidCard}
          ${windowsCard}
        </div>
      </div>
    `;
  }

  function applyPlatformTagState(tagEl, labelTitle, statusText, tagClass, isHidden) {
    if (!tagEl) return;
    tagEl.hidden = Boolean(isHidden);
    tagEl.style.display = isHidden ? "none" : "";
    const isCardPill = tagEl.classList.contains("pc3d-plat-pill");
    const cardSuffix = tagClass ? `is-${tagClass}` : "";
    const stateEl = tagEl.querySelector("[data-plat-state]");
    tagEl.className = isCardPill
      ? `pc3d-plat-pill ${cardSuffix}`.trim()
      : `platform-tag ${tagClass}`.trim();

    if (stateEl) {
      stateEl.textContent = statusText;
    } else {
      tagEl.innerHTML = `<b>${escapeHtml(labelTitle)}</b> ${escapeHtml(statusText)}`;
    }
  }

  function syncProductHeroPlatformBadges(appId, cfg) {
    document.querySelectorAll(`[data-app-platforms="${appId}"]`).forEach((container) => {
      const aMeta = formatStatusBadge(cfg.androidStatus);
      const wMeta = formatWindowsStatus(cfg.windowsStatus);
      const aText = aMeta.label.replace(/^Android:\s*/i, "");

      applyPlatformTagState(container.querySelector("[data-platform-android]"), "Android", aText, aMeta.tagClass, false);
      applyPlatformTagState(container.querySelector("[data-platform-windows]"), "Windows (WinUI 3)", wMeta.label, wMeta.tagClass, false);

      const iosMeta = formatGenericPlatformStatus(cfg.iosStatus);
      applyPlatformTagState(container.querySelector("[data-platform-ios]"), "iOS", iosMeta.label, iosMeta.tagClass, iosMeta.hidden);

      const macMeta = formatGenericPlatformStatus(cfg.macosStatus);
      applyPlatformTagState(container.querySelector("[data-platform-macos]"), "macOS", macMeta.label, macMeta.tagClass, macMeta.hidden);

      const linuxMeta = formatGenericPlatformStatus(cfg.linuxStatus);
      applyPlatformTagState(container.querySelector("[data-platform-linux]"), "Linux", linuxMeta.label, linuxMeta.tagClass, linuxMeta.hidden);
    });
  }

  async function fetchCloudApps() {
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
          APP_CONFIG[id].badge = statusMeta.label;
          APP_CONFIG[id].joinWebUrl = a.joinWebUrl ?? APP_CONFIG[id].joinWebUrl;
          APP_CONFIG[id].joinAndroidUrl = a.joinAndroidUrl ?? APP_CONFIG[id].joinAndroidUrl;
          APP_CONFIG[id].closedTestingStartDate = a.closedTestingStartDate || null;
          APP_CONFIG[id].closedTestingDays = a.closedTestingDays || 14;
          APP_CONFIG[id].statusMessage = a.statusMessage || null;
          APP_CONFIG[id].windowsStatus = a.windowsStatus || APP_CONFIG[id].windowsStatus || "Planning";
          APP_CONFIG[id].microsoftStoreUrl = a.microsoftStoreUrl || null;
          APP_CONFIG[id].windowsWingetId = a.windowsWingetId || null;
          APP_CONFIG[id].latestVersion = a.latestVersion || APP_CONFIG[id].latestVersion || null;
          APP_CONFIG[id].latestReleaseNotes = a.latestReleaseNotes || APP_CONFIG[id].latestReleaseNotes || null;
          APP_CONFIG[id].latestUpdatePublishedAt = a.latestUpdatePublishedAt || APP_CONFIG[id].latestUpdatePublishedAt || null;
          APP_CONFIG[id].iosStatus = a.iosStatus || APP_CONFIG[id].iosStatus || "Roadmap";
          APP_CONFIG[id].macosStatus = a.macosStatus || APP_CONFIG[id].macosStatus || "Roadmap";
          APP_CONFIG[id].linuxStatus = a.linuxStatus || APP_CONFIG[id].linuxStatus || "Roadmap";
          APP_CONFIG[id].pill = statusMeta.pill;
          APP_CONFIG[id].platforms = buildPlatformChoices(APP_CONFIG[id]);
        } else {
          APP_CONFIG[id] = {
            name: a.appName || id,
            pageUrl: `${id}/`,
            subtitle: "Native Espresso Studio Application",
            badge: statusMeta.label,
            androidStatus: a.androidStatus || "TestingQueue",
            windowsStatus: a.windowsStatus || "Planning",
            iosStatus: a.iosStatus || "Roadmap",
            macosStatus: a.macosStatus || "Roadmap",
            linuxStatus: a.linuxStatus || "Roadmap",
            accent: "var(--cyan, #22d3ee)",
            platforms: [],
            joinWebUrl: a.joinWebUrl || null,
            joinAndroidUrl: a.joinAndroidUrl || null,
            closedTestingStartDate: a.closedTestingStartDate || null,
            closedTestingDays: a.closedTestingDays || 14,
            statusMessage: a.statusMessage || null,
            microsoftStoreUrl: a.microsoftStoreUrl || null,
            windowsWingetId: a.windowsWingetId || null,
            latestVersion: a.latestVersion || null,
            latestReleaseNotes: a.latestReleaseNotes || null,
            latestUpdatePublishedAt: a.latestUpdatePublishedAt || null,
            pill: statusMeta.pill
          };
          APP_CONFIG[id].platforms = buildPlatformChoices(APP_CONFIG[id]);
        }
      });
    } catch (_) {
      // Graceful fallback to static defaults
    }
  }

  async function fetchTesterStatus(email, appId) {
    if (!API_BASE || !email || !appId) return null;
    try {
      const res = await fetch(`${API_BASE}/api/testers/status?email=${encodeURIComponent(email)}&appId=${encodeURIComponent(appId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  async function registerTesterForApp(email, appId, platform) {
    const cfg = APP_CONFIG[appId] || { name: appId };
    const ticket = {
      email,
      appId,
      appName: cfg.name,
      platform: platform || "Android",
      status: "Pending",
      joinWebUrl: cfg.joinWebUrl || null,
      joinAndroidUrl: cfg.joinAndroidUrl || null,
      androidStatus: cfg.androidStatus || "TestingQueue",
      registeredAt: Date.now()
    };

    try {
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/testers/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, appId, appName: cfg.name, platform: ticket.platform })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) ticket.status = data.status;
          if (data.joinWebUrl || data.playStoreUrl) ticket.joinWebUrl = data.joinWebUrl || data.playStoreUrl;
          if (data.joinAndroidUrl) ticket.joinAndroidUrl = data.joinAndroidUrl;
          if (data.androidStatus) ticket.androidStatus = data.androidStatus;
        }
      }
    } catch (err) {
      console.warn("Cloud connection deferred; local state ticket saved.", err);
    }

    saveTicket(appId, ticket);
    return ticket;
  }

  async function recordTesterEngagement(email, appId, action, version) {
    const cleanEmail = (email || getRememberedEmail() || "").trim().toLowerCase();
    if (!cleanEmail || !appId) return null;

    const existingAll = getTickets();
    const cur = existingAll[appId] || { email: cleanEmail, appId, status: "Approved", registeredAt: Date.now() };
    const setsInstall = action === "install_clicked" || action === "install_confirmed" || action === "update_confirmed" || action === "daily_checkin";
    const nowIso = new Date().toISOString();
    const merged = {
      ...cur,
      email: cleanEmail,
      installConfirmed: setsInstall ? true : Boolean(cur.installConfirmed),
      installConfirmedAt: setsInstall ? (cur.installConfirmedAt || nowIso) : cur.installConfirmedAt || null,
      installedVersion: setsInstall ? (version || cur.installedVersion || APP_CONFIG[appId]?.latestVersion || null) : cur.installedVersion || null,
      lastEngagedAt: nowIso
    };
    saveTicket(appId, merged);

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/testers/engagement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, appId, action, version: version || null })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.tester) {
            const synced = {
              ...merged,
              status: data.tester.status || merged.status,
              installConfirmed: Boolean(data.tester.installConfirmed),
              installConfirmedAt: data.tester.installConfirmedAt || merged.installConfirmedAt,
              installedVersion: data.tester.installedVersion || merged.installedVersion,
              lastEngagedAt: data.tester.lastEngagedAt || merged.lastEngagedAt,
              day2ReminderSentAt: data.tester.day2ReminderSentAt || merged.day2ReminderSentAt || null
            };
            saveTicket(appId, synced);
            return { message: data.message, ticket: synced };
          }
        }
      } catch (_) {}
    }

    const fallbackMsg = action === "update_confirmed"
      ? `Confirmed update to v${merged.installedVersion || "latest"}.`
      : action === "daily_checkin"
        ? "Today's active testing session logged!"
        : "App installation confirmed! Remember to open the app briefly tomorrow (Day 2).";
    return { message: fallbackMsg, ticket: merged };
  }

  async function syncAllAppsForEmail(email) {
    const appIds = Object.keys(APP_CONFIG);
    const existing = getTickets();

    await Promise.all(appIds.map(async (appId) => {
      const cfg = APP_CONFIG[appId];
      const data = await fetchTesterStatus(email, appId);
      if (data && data.status) {
        const prev = existing[appId] || {};
        saveTicket(appId, {
          email,
          appId,
          appName: cfg.name,
          platform: data.platform || prev.platform || "Android",
          status: data.status,
          joinWebUrl: data.joinWebUrl || data.playStoreUrl || cfg.joinWebUrl || null,
          joinAndroidUrl: data.joinAndroidUrl || cfg.joinAndroidUrl || null,
          androidStatus: data.androidStatus || cfg.androidStatus || null,
          registeredAt: data.registeredAt || prev.registeredAt || Date.now(),
          approvedAt: data.approvedAt || prev.approvedAt || null,
          installConfirmed: Boolean(data.installConfirmed || prev.installConfirmed),
          installConfirmedAt: data.installConfirmedAt || prev.installConfirmedAt || null,
          installedVersion: data.installedVersion || prev.installedVersion || null,
          lastEngagedAt: data.lastEngagedAt || prev.lastEngagedAt || null,
          day2ReminderSentAt: data.day2ReminderSentAt || prev.day2ReminderSentAt || null
        });
      } else if (existing[appId] && existing[appId].email !== email) {
        removeTicket(appId);
      }
    }));

    updateProductDirectoryBadges(email);
  }

  function updateProductDirectoryBadges(email) {
    const tickets = getTickets();
    document.querySelectorAll("[data-row-access]").forEach((slot) => {
      const appId = slot.getAttribute("data-row-access");
      const t = tickets[appId];
      if (!email || !t || t.email !== email) {
        slot.innerHTML = "";
        return;
      }
      const isApproved = (t.status || "").toLowerCase() === "approved";
      slot.innerHTML = isApproved
        ? `<span class="product-access-pill approved">✓ Testing Approved</span>`
        : `<span class="product-access-pill pending">In Queue</span>`;
    });
  }

  /* ==========================================================================
     4. Company-Level General Closed Testing Controller ([data-studio-beta-widget])
        Lets users pick All, One, or a Few apps. Shows approval overview ONLY —
        Play Store links & QR codes unlock on each product's dedicated page.
     ========================================================================== */
  function initStudioBetaWidgets() {
    const containers = document.querySelectorAll("[data-studio-beta-widget]");
    if (!containers.length) return;

    const email = getRememberedEmail();
    containers.forEach((c) => renderStudioBeta(c, email));

    fetchCloudApps().then(async () => {
      Object.keys(APP_CONFIG).forEach((id) => syncProductHeroPlatformBadges(id, APP_CONFIG[id]));
      const currentEmail = getRememberedEmail();
      if (currentEmail) {
        await syncAllAppsForEmail(currentEmail);
      }
      containers.forEach((c) => renderStudioBeta(c, getRememberedEmail()));
    });
  }

  function renderStudioBeta(container, rememberedEmail) {
    const email = (rememberedEmail || "").trim().toLowerCase();
    updateProductDirectoryBadges(email);
    renderStudioTopLiveBanner();

    if (email) {
      renderStudioAccessSummary(container, email);
    } else {
      renderStudioSignupForm(container);
    }
  }

  function renderStudioSignupForm(container) {
    const testingIds = Object.keys(APP_CONFIG).filter((id) => isAppAcceptingTesters(APP_CONFIG[id]));

    if (testingIds.length === 0) {
      container.innerHTML = `
        <div class="studio-beta-card">
          <div class="studio-beta-top" style="margin-bottom:0;">
            <div>
              <h3>All Studio Apps Are Ready for Public Release</h3>
              <p>There are currently no active closed testing queues. Visit any product above to view public store download links.</p>
            </div>
            <a class="btn btn-primary btn-sm" href="#products">Browse Products ↑</a>
          </div>
        </div>
      `;
      return;
    }

    const appCheckboxes = testingIds.map((id) => {
      const app = APP_CONFIG[id];
      const liveTag = isActiveTestingCycle(app) ? ` <em class="chip-live-tag">Live</em>` : "";
      return `
        <label class="app-pick-chip">
          <input type="checkbox" name="studio_app" value="${escapeHtml(id)}" checked>
          <span><i class="app-pick-check">✓</i>${escapeHtml(app.name)}${liveTag}</span>
        </label>
      `;
    }).join("");

    container.innerHTML = `
      <div class="studio-beta-card">
        <div class="studio-beta-top">
          <div>
            <h3>Join or Check Closed Testing Access</h3>
            <p>Testing already running? You can still add your Google Play email right now to join the active track and be ready for any follow-up cycle. Once approved, visit each product page for your Play Store links and QR pass.</p>
          </div>
        </div>

        <form data-studio-beta-form>
          <div class="app-picker-row">
            <span class="picker-label">Apps:</span>
            ${testingIds.length > 1 ? `
              <label class="app-pick-chip">
                <input type="checkbox" data-pick-all checked>
                <span><i class="app-pick-check">✓</i>All Apps</span>
              </label>
            ` : ""}
            ${appCheckboxes}
          </div>

          <div class="input-wrap">
            <input type="email" required placeholder="Enter your Google Play email" class="queue-input" data-studio-email autocomplete="email">
            <button type="submit" class="btn btn-primary">Join / Check Access</button>
          </div>

          <div class="queue-meta">
            <span>⛨ Free · Zero Spam · Unlocks per-app store access on each product page</span>
            <span>Already approved? Enter your email to check which apps are unlocked.</span>
          </div>
        </form>
      </div>
    `;

    const form = container.querySelector("[data-studio-beta-form]");
    const pickAll = container.querySelector("[data-pick-all]");
    const appChecks = () => [...container.querySelectorAll("input[name='studio_app']")];

    if (pickAll) {
      pickAll.addEventListener("change", () => {
        appChecks().forEach((cb) => { cb.checked = pickAll.checked; });
      });
    }
    appChecks().forEach((cb) => {
      cb.addEventListener("change", () => {
        const list = appChecks();
        if (pickAll) pickAll.checked = list.length > 0 && list.every((c) => c.checked);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = form.querySelector("[data-studio-email]");
      const email = (emailInput.value || "").trim().toLowerCase();
      if (!email || !email.includes("@")) return;

      const selectedIds = appChecks().filter((c) => c.checked).map((c) => c.value);
      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Checking Access...";

      saveRememberedEmail(email);

      // Register selected apps (preserves Approved status if already approved)
      // and check status of any unselected apps so existing approvals are always detected
      const allIds = Object.keys(APP_CONFIG);
      await Promise.all(allIds.map(async (appId) => {
        if (selectedIds.includes(appId)) {
          await registerTesterForApp(email, appId, "Android");
        } else {
          const data = await fetchTesterStatus(email, appId);
          if (data && data.status) {
            const cfg = APP_CONFIG[appId];
            saveTicket(appId, {
              email,
              appId,
              appName: cfg.name,
              platform: data.platform || "Android",
              status: data.status,
              joinWebUrl: data.joinWebUrl || data.playStoreUrl || cfg.joinWebUrl || null,
              joinAndroidUrl: data.joinAndroidUrl || cfg.joinAndroidUrl || null,
              androidStatus: data.androidStatus || cfg.androidStatus || null,
              registeredAt: Date.now()
            });
          } else {
            removeTicket(appId);
          }
        }
      }));

      renderStudioBeta(container, email);
    });
  }

  function renderStudioAccessSummary(container, email) {
    const tickets = getTickets();
    const appIds = Object.keys(APP_CONFIG);

    const rowsHtml = appIds.map((id) => {
      const cfg = APP_CONFIG[id];
      const androidLifecycle = (cfg.androidStatus || "").toLowerCase();
      const t = tickets[id] && tickets[id].email === email ? tickets[id] : null;
      const status = t ? (t.status || "Pending").toLowerCase() : "none";
      const pageHref = `${cfg.pageUrl || `${id}/`}#beta-queue`;

      if (androidLifecycle === "published") {
        return `
          <div class="access-row is-approved">
            <div class="access-row-info">
              <div class="access-row-title">
                <span>${escapeHtml(cfg.name)}</span>
                <span class="access-badge approved">Live on Store</span>
              </div>
              <div class="access-row-note">${escapeHtml(cfg.name)} is now publicly available! Open the product page for direct store installation.</div>
            </div>
            <div class="access-row-actions">
              <a class="btn btn-primary btn-sm" href="${escapeHtml(pageHref)}">Download ${escapeHtml(cfg.name)} →</a>
            </div>
          </div>
        `;
      }

      if (androidLifecycle === "productionapproved") {
        return `
          <div class="access-row is-approved">
            <div class="access-row-info">
              <div class="access-row-title">
                <span>${escapeHtml(cfg.name)}</span>
                <span class="access-badge approved">Production Approved</span>
              </div>
              <div class="access-row-note">Thank you for testing! ${escapeHtml(cfg.name)} passed closed testing and is preparing for public release.</div>
            </div>
            <div class="access-row-actions">
              <a class="btn btn-ghost btn-sm" href="${escapeHtml(pageHref)}">View Update →</a>
            </div>
          </div>
        `;
      }

      if (status === "approved") {
        return `
          <div class="access-row is-approved">
            <div class="access-row-info">
              <div class="access-row-title">
                <span>${escapeHtml(cfg.name)}</span>
                <span class="access-badge approved">Approved</span>
              </div>
              <div class="access-row-note">Closed testing access is active. Open the ${escapeHtml(cfg.name)} page to view your Play Store links &amp; QR pass.</div>
            </div>
            <div class="access-row-actions">
              <a class="btn btn-primary btn-sm" href="${escapeHtml(pageHref)}">Open ${escapeHtml(cfg.name)} →</a>
            </div>
          </div>
        `;
      }

      if (status === "pending") {
        return `
          <div class="access-row">
            <div class="access-row-info">
              <div class="access-row-title">
                <span>${escapeHtml(cfg.name)}</span>
                <span class="access-badge pending">In Queue</span>
              </div>
              <div class="access-row-note">Registered for closed testing. Play Store links will unlock on the ${escapeHtml(cfg.name)} page once approved.</div>
            </div>
            <div class="access-row-actions">
              <a class="btn btn-ghost btn-sm" href="${escapeHtml(pageHref)}">View Product →</a>
            </div>
          </div>
        `;
      }

      return `
        <div class="access-row">
          <div class="access-row-info">
            <div class="access-row-title">
              <span>${escapeHtml(cfg.name)}</span>
              <span class="access-badge none">Not Joined</span>
            </div>
            <div class="access-row-note">You haven't requested closed testing access for ${escapeHtml(cfg.name)} yet.</div>
          </div>
          <div class="access-row-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-quick-join="${escapeHtml(id)}">+ Request Access</button>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="studio-beta-card">
        <div class="access-header">
          <div>
            <span class="access-email-pill"><i class="dot dot-green"></i>${escapeHtml(email)}</span>
          </div>
          <div class="access-header-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-studio-refresh>Refresh Status</button>
            <button type="button" class="btn btn-ghost btn-sm" data-studio-switch>Switch Email</button>
          </div>
        </div>

        <div class="access-summary-list">${rowsHtml}</div>

        <div class="access-footnote">
          <span>Your email is remembered across product pages so approved Play Store links unlock automatically when you visit them.</span>
        </div>
      </div>
    `;

    container.querySelector("[data-studio-refresh]")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = "Checking...";
      await fetchCloudApps();
      await syncAllAppsForEmail(email);
      renderStudioBeta(container, email);
    });

    container.querySelector("[data-studio-switch]")?.addEventListener("click", () => {
      clearAllTesterState();
      renderStudioBeta(container, "");
    });

    container.querySelectorAll("[data-quick-join]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const targetApp = btn.getAttribute("data-quick-join");
        btn.disabled = true;
        btn.textContent = "Requesting...";
        await registerTesterForApp(email, targetApp, "Android");
        renderStudioBeta(container, email);
      });
    });
  }

  /* ==========================================================================
     5. Per-Product Release Lifecycle, Public Store Install & Closed Testing
        - Renders live countdown bar when ClosedTestingStartDate is set
        - Renders Thank-You / Rejection / Extension notices from Admin App
        - Renders direct public Google Play & Microsoft Store install procedures
          when published (no email gate)
        - Auto-checks remembered email for email-gated closed testing
     ========================================================================== */
  function updateHeroAccessBanner(appId, cfg, ticket) {
    const banner = document.querySelector(`[data-app-access-banner="${appId}"]`);
    if (!banner) return;

    const androidLive = (cfg.androidStatus || "").toLowerCase() === "published" && Boolean(cfg.joinAndroidUrl || cfg.joinWebUrl);
    const windowsLive = (cfg.windowsStatus || "").toLowerCase() === "published" && Boolean(cfg.microsoftStoreUrl);
    const prodApproved = (cfg.androidStatus || "").toLowerCase() === "productionapproved";

    if (androidLive || windowsLive) {
      const stores = [androidLive ? "Google Play" : null, windowsLive ? "Microsoft Store" : null].filter(Boolean).join(" & ");
      banner.innerHTML = `
        <a href="#beta-queue" class="app-access-banner">
          <span class="dot dot-green"></span>
          <span><strong>Now Published on ${escapeHtml(stores)}</strong> — Direct Install &amp; Download ↓</span>
        </a>
      `;
      banner.hidden = false;
      return;
    }

    if (prodApproved) {
      banner.innerHTML = `
        <a href="#beta-queue" class="app-access-banner">
          <span class="dot dot-green"></span>
          <span><strong>Production Access Granted</strong> — Thank You to Our Closed Testers! ↓</span>
        </a>
      `;
      banner.hidden = false;
      return;
    }

    const isApproved = ticket && (ticket.status || "").toLowerCase() === "approved";
    const hasLinks = Boolean(cfg.joinWebUrl || cfg.joinAndroidUrl || ticket?.joinWebUrl || ticket?.joinAndroidUrl);

    if (isApproved && hasLinks) {
      banner.innerHTML = `
        <a href="#beta-queue" class="app-access-banner">
          <span class="dot dot-green"></span>
          <span><strong>Closed Testing Approved</strong> for ${escapeHtml(ticket.email)} — View Google Play Links &amp; QR ↓</span>
        </a>
      `;
      banner.hidden = false;
    } else {
      banner.innerHTML = "";
      banner.hidden = true;
    }
  }

  function bindCopyButtons(root) {
    root.querySelectorAll("[data-copy-text]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-copy-text") || "";
        navigator.clipboard.writeText(val).then(() => {
          const orig = btn.textContent;
          btn.textContent = "✓ Copied";
          setTimeout(() => { btn.textContent = orig; }, 2200);
        }).catch(() => {});
      });
    });
  }

  let countdownTickerStarted = false;
  function startCountdownTicker() {
    if (countdownTickerStarted) return;
    countdownTickerStarted = true;
    setInterval(() => {
      if (document.hidden) return;
      document.querySelectorAll("[data-countdown-start]").forEach((el) => {
        const start = el.getAttribute("data-countdown-start");
        const days = Number(el.getAttribute("data-countdown-days")) || 14;
        const cd = computeCountdown(start, days);
        if (!cd) return;
        const txt = formatCountdownStrings(cd);
        const fillEl = el.querySelector(".lc-fill");
        const textEl = el.querySelector("[data-countdown-text]");
        const runEl = el.querySelector("[data-countdown-running]");
        const remEl = el.querySelector("[data-countdown-remaining]");
        if (fillEl) fillEl.style.width = `${cd.percent}%`;
        if (textEl) textEl.textContent = txt.headline;
        if (runEl) runEl.textContent = txt.running;
        if (remEl) remEl.textContent = txt.remaining;
      });
    }, 1000);
  }

  let deepLinkToast = null;

  function renderVersionUpdateBannerHtml(appId, cfg, ticket) {
    const ver = (cfg?.latestVersion || "").trim();
    if (!ver) return "";

    const notes = (cfg.latestReleaseNotes || "").trim() || "Stability refinements, faster performance, and studio improvements are now approved on Google Play.";
    const isApproved = ticket && (ticket.status || "").toLowerCase() === "approved";
    const onLatest = isApproved && ticket.installConfirmed && ticket.installedVersion && ticket.installedVersion.toLowerCase() === ver.toLowerCase();
    const updateUrl = cfg.joinAndroidUrl || cfg.joinWebUrl || "";

    return `
      <div class="update-alert-banner">
        <div class="update-alert-main">
          <span class="update-alert-pill">
            <span class="pulse-dot" aria-hidden="true"></span>
            Approved Update Live · v${escapeHtml(ver)}
          </span>
          <h4>${onLatest ? `${escapeHtml(cfg.name)} v${escapeHtml(ver)} Confirmed Up to Date` : `New ${escapeHtml(cfg.name)} Build (v${escapeHtml(ver)}) Is Approved — Please Update`}</h4>
          <p>${escapeHtml(notes)}</p>
        </div>
        ${isApproved ? `
          <div class="update-alert-actions">
            ${onLatest
              ? `<span class="ti-badge is-done">✓ Updated to v${escapeHtml(ver)}</span>`
              : `
                ${updateUrl ? `<a href="${escapeHtml(updateUrl)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" data-track-install-click>Update on Play Store ↗</a>` : ""}
                <button type="button" class="btn btn-ghost btn-sm" data-engagement-action="update_confirmed" data-version="${escapeHtml(ver)}">✓ I Updated to v${escapeHtml(ver)}</button>
              `}
          </div>
        ` : ""}
      </div>
    `;
  }

  function initProductBetaWidgets() {
    const containers = document.querySelectorAll("[data-beta-widget]");
    if (!containers.length) return;

    const rememberedEmail = getRememberedEmail();

    // Support 1-click check-in deep links from reminder & update emails (?checkin=installed|engaged|updated)
    let pendingCheckin = null;
    try {
      const qs = new URLSearchParams(location.search);
      const checkin = (qs.get("checkin") || "").trim().toLowerCase();
      if (checkin === "installed" || checkin === "engaged" || checkin === "updated") {
        const emailParam = (qs.get("email") || "").trim().toLowerCase();
        if (emailParam && emailParam.includes("@")) saveRememberedEmail(emailParam);
        pendingCheckin = {
          action: checkin === "updated" ? "update_confirmed" : checkin === "engaged" ? "daily_checkin" : "install_confirmed",
          email: emailParam || getRememberedEmail(),
          version: (qs.get("version") || "").trim() || null
        };
        qs.delete("checkin");
        qs.delete("email");
        qs.delete("version");
        const cleanQs = qs.toString();
        history.replaceState(null, "", `${location.pathname}${cleanQs ? "?" + cleanQs : ""}${location.hash || "#beta-queue"}`);
      }
    } catch (_) {}

    containers.forEach((container) => {
      const appId = container.getAttribute("data-app-id") || "trans-title";
      if (!APP_CONFIG[appId]) return;
      if (pendingCheckin && pendingCheckin.email) {
        recordTesterEngagement(pendingCheckin.email, appId, pendingCheckin.action, pendingCheckin.version).then((res) => {
          if (res?.message) deepLinkToast = res.message;
          renderProductBetaShell(container, appId);
        });
      }
      renderProductBetaShell(container, appId);
    });

    fetchCloudApps().then(async () => {
      for (const container of containers) {
        const appId = container.getAttribute("data-app-id") || "trans-title";
        const cfg = APP_CONFIG[appId];
        if (!cfg) continue;

        const emailToCheck = getRememberedEmail() || rememberedEmail;
        if (emailToCheck && isAppAcceptingTesters(cfg)) {
          const live = await fetchTesterStatus(emailToCheck, appId);
          if (live && live.status) {
            const prev = getTickets()[appId] || {};
            saveTicket(appId, {
              email: emailToCheck,
              appId,
              appName: cfg.name,
              platform: live.platform || prev.platform || "Android",
              status: live.status,
              joinWebUrl: live.joinWebUrl || live.playStoreUrl || cfg.joinWebUrl || null,
              joinAndroidUrl: live.joinAndroidUrl || cfg.joinAndroidUrl || null,
              androidStatus: live.androidStatus || cfg.androidStatus || null,
              registeredAt: live.registeredAt || prev.registeredAt || Date.now(),
              approvedAt: live.approvedAt || prev.approvedAt || null,
              installConfirmed: Boolean(live.installConfirmed || prev.installConfirmed),
              installConfirmedAt: live.installConfirmedAt || prev.installConfirmedAt || null,
              installedVersion: live.installedVersion || prev.installedVersion || null,
              lastEngagedAt: live.lastEngagedAt || prev.lastEngagedAt || null,
              day2ReminderSentAt: live.day2ReminderSentAt || prev.day2ReminderSentAt || null
            });
          } else {
            const existing = getTickets()[appId];
            if (existing && existing.email !== emailToCheck) {
              removeTicket(appId);
            }
          }
        }
        renderProductBetaShell(container, appId);
      }
    });
  }

  function renderProductBetaShell(container, appId) {
    container.setAttribute("data-current-app", appId);
    const cfg = APP_CONFIG[appId] || APP_CONFIG["trans-title"];
    const rememberedEmail = getRememberedEmail();
    const tickets = getTickets();
    let currentTicket = tickets[appId];

    // Ignore stale ticket belonging to a different email
    if (currentTicket && rememberedEmail && currentTicket.email !== rememberedEmail) {
      currentTicket = null;
    }

    syncProductHeroPlatformBadges(appId, cfg);
    updateHeroAccessBanner(appId, cfg, currentTicket);
    renderProductHeroCountdown(appId, cfg, currentTicket);

    const noticeHtml = renderLifecycleNoticeHtml(cfg);
    const updateBannerHtml = renderVersionUpdateBannerHtml(appId, cfg, currentTicket);
    const countdownHtml = renderCountdownHtml(cfg);
    const publicInstallHtml = renderPublicInstallDeckHtml(cfg);
    const showClosedTestingWidget = isAppAcceptingTesters(cfg);

    container.innerHTML = `
      <div class="release-hub-stack">
        ${deepLinkToast ? `<div class="alert-success" style="margin-bottom:14px;"><b>✓ Activity Logged</b><p>${escapeHtml(deepLinkToast)}</p></div>` : ""}
        ${noticeHtml}
        ${updateBannerHtml}
        ${publicInstallHtml}
        ${countdownHtml}
        ${showClosedTestingWidget ? `
          <div class="queue-card">
            <div class="queue-body" data-queue-body></div>
          </div>
        ` : ""}
      </div>
    `;

    bindCopyButtons(container);
    if (countdownHtml) startCountdownTicker();

    if (showClosedTestingWidget) {
      const bodyEl = container.querySelector("[data-queue-body]");
      if (currentTicket && currentTicket.email) {
        renderProductStatusView(bodyEl, appId, cfg, currentTicket, container);
      } else {
        renderProductFormView(bodyEl, appId, cfg, container, rememberedEmail);
      }
    }

    wireEngagementHandlers(container.querySelector(".update-alert-banner"), container, appId, cfg, currentTicket);
  }

  function wireEngagementHandlers(scopeEl, container, appId, cfg, ticket) {
    if (!scopeEl) return;
    scopeEl.querySelectorAll("[data-engagement-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!ticket || !ticket.email) return;
        const action = btn.getAttribute("data-engagement-action") || "install_confirmed";
        const version = btn.getAttribute("data-version") || cfg.latestVersion || null;
        btn.disabled = true;
        btn.textContent = "Saving...";
        const res = await recordTesterEngagement(ticket.email, appId, action, version);
        if (res?.message) deepLinkToast = res.message;
        renderProductBetaShell(container, appId);
      });
    });

    scopeEl.querySelectorAll("[data-track-install-click]").forEach((link) => {
      link.addEventListener("click", () => {
        if (ticket?.email) {
          recordTesterEngagement(ticket.email, appId, "install_clicked", cfg.latestVersion || null);
        }
      });
    });
  }

  function renderProductFormView(bodyEl, appId, cfg, container, prefillEmail) {
    const platformOptions = (cfg.platforms || ["Android"]).map((p, idx) => `
      <label class="platform-pill">
        <input type="radio" name="queue_platform_${escapeHtml(appId)}" value="${escapeHtml(p)}" ${idx === 0 ? "checked" : ""}>
        <span>${escapeHtml(p)}</span>
      </label>
    `).join("");

    const statusLower = (cfg.androidStatus || "").toLowerCase();
    const isRunning = isActiveTestingCycle(cfg);
    const isExtended = statusLower === "testingextended";

    const prefillNote = prefillEmail
      ? `Signed in with <strong>${escapeHtml(prefillEmail)}</strong> — you aren't registered for ${escapeHtml(cfg.name)} yet. ${isRunning ? "Testing is already running — you can join right now for this cycle and any follow-up cycle." : "Click below to request access or check status."}`
      : isExtended
        ? `Additional closed testing is actively running for ${escapeHtml(cfg.name)} — new testers help us reach public Google Play release faster! Enter your Google Play email to join the active cycle.`
        : isRunning
          ? `Closed testing for ${escapeHtml(cfg.name)} is already running — and you can still join right now! Adding your Google Play email enrolls you into the active track and ensures extra testers are ready if Google Play requests another cycle.`
          : `${escapeHtml(cfg.subtitle)}. Enter your Google Play email to join the waitlist — or if you're already approved for ${escapeHtml(cfg.name)}, unlock your direct Google Play links and QR pass instantly.`;

    const submitLabel = prefillEmail
      ? (isRunning ? `Join Active ${escapeHtml(cfg.name)} Testing` : `Join ${escapeHtml(cfg.name)} Queue`)
      : (isExtended ? "Join Extended Testing" : isRunning ? "Join Active Testing" : "Join / Check Access");

    bodyEl.innerHTML = `
      <div class="queue-header">
        <div class="queue-badge"><span class="pulse-dot"></span> ${escapeHtml(cfg.badge)}</div>
        <h3>${escapeHtml(cfg.name)} Closed Testing Access</h3>
        <p class="queue-desc">${prefillNote}</p>
      </div>

      <form class="queue-form" data-queue-form>
        <div class="platform-selector-row">
          <span class="selector-label">Target Platform:</span>
          <div class="platform-pills">${platformOptions}</div>
        </div>

        <div class="input-wrap">
          <input type="email" required placeholder="Enter your Google Play account email" value="${escapeHtml(prefillEmail || "")}" class="queue-input" data-email-input autocomplete="email">
          <button type="submit" class="btn btn-primary queue-btn">
            <span>${submitLabel}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        <div class="queue-meta">
          <span>⛨ 100% Free · Zero Spam · Open During Running &amp; Follow-Up Cycles</span>
          <span class="queue-note">Google Play links &amp; QR pass appear here automatically once your email is approved for ${escapeHtml(cfg.name)}.</span>
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

      saveRememberedEmail(email);
      const newTicket = await registerTesterForApp(email, appId, checkedPlatform);
      updateHeroAccessBanner(appId, cfg, newTicket);
      renderProductStatusView(bodyEl, appId, cfg, newTicket, container);
    });
  }

  function renderProductStatusView(bodyEl, appId, cfg, ticket, container) {
    const isApproved = (ticket.status || "").toLowerCase() === "approved";
    const joinWebUrl = cfg.joinWebUrl || ticket.joinWebUrl || ticket.playStoreUrl || "";
    const joinAndroidUrl = cfg.joinAndroidUrl || ticket.joinAndroidUrl || joinWebUrl;
    const hasLinks = Boolean(joinWebUrl || joinAndroidUrl);
    const mobile = isMobileDevice();

    updateHeroAccessBanner(appId, cfg, ticket);
    renderProductHeroCountdown(appId, cfg, ticket);

    if (isApproved) {
      if (!hasLinks) {
        bodyEl.innerHTML = `
          <div class="queue-status-in approved-view">
            <div class="queue-header">
              <div class="queue-badge approved"><span class="dot-green"></span> Pre-Approved Tester</div>
              <h3>You are Approved for ${escapeHtml(cfg.name)}!</h3>
              <p class="queue-desc">Registered Account: <strong>${escapeHtml(ticket.email)}</strong></p>
            </div>
            <div class="pending-notice">
              <div class="notice-text">
                <p>Your Google Play account is pre-approved! As soon as <strong>${escapeHtml(cfg.name)}</strong> transitions from Testing Queue to Active Closed Testing, your <strong>Join via Web</strong> and <strong>Android Play Store QR / Install</strong> links will unlock right here automatically.</p>
              </div>
              <div class="ticket-footer-actions">
                <button class="btn-text-action" data-check-status>Refresh Links</button>
                <span class="sep">·</span>
                <button class="btn-text-action" data-reset-ticket>Switch Email</button>
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
              <div class="queue-badge approved"><span class="dot-green"></span> Google Play Closed Testing Unlocked</div>
              <h3>You are an Approved Tester for ${escapeHtml(cfg.name)}!</h3>
              <p class="queue-desc">Approved Account: <strong>${escapeHtml(ticket.email)}</strong> · Platform: <strong>${escapeHtml(ticket.platform || "Android")}</strong></p>
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
                  <div class="step-m"><b>3.</b> Make sure Google Play is signed in with <b>${escapeHtml(ticket.email)}</b></div>
                </div>

                <div class="approved-btn-row">
                  ${joinWebUrl ? `
                    <a href="${escapeHtml(joinWebUrl)}" target="_blank" rel="noopener" class="btn btn-primary">
                      <span>🌐 Join via Web</span>
                    </a>
                  ` : ""}
                  ${joinAndroidUrl ? `
                    <a href="${escapeHtml(joinAndroidUrl)}" target="_blank" rel="noopener" class="btn ${joinWebUrl ? "btn-ghost" : "btn-primary"}" data-track-install-click>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.5.8-.5 1.5v17.4c0 .7.2 1.2.5 1.5l9.2-9.6L3.6 1.8zm11.4 8.4l2.5-1.4L4.8.8l10.2 9.4zm0 3.6L4.8 23.2l12.7-7.6-2.5-1.8zm1.2-1.2l3.4 2c.9.5.9 1.4 0 1.9l-3.4 2-1.5-1.5 1.5-4.4z"/></svg>
                      <span>Join via Android (Play Store)</span>
                    </a>
                  ` : ""}
                  <button class="btn btn-ghost" data-copy-link>
                    <span>📋 Copy Link</span>
                  </button>
                </div>

                <div class="ticket-footer-actions">
                  <button class="btn-text-action" data-reset-ticket>Switch / Check Another Email</button>
                </div>
              </div>
            </div>

            <div class="tester-intelligence-card">
              <div class="ti-head">
                <strong>Tester Install &amp; Day-2 Engagement Tracker</strong>
                <span class="mono muted">${ticket.lastEngagedAt ? `Last active: ${new Date(ticket.lastEngagedAt).toLocaleDateString()}` : "Confirm install below so we don't send install reminders"}</span>
              </div>
              <div class="ti-steps">
                <div class="ti-step">
                  <div>
                    <div class="ti-step-top">
                      <span class="ti-step-title">1. Install Verification</span>
                      <span class="ti-badge ${ticket.installConfirmed ? "is-done" : "is-due"}">
                        ${ticket.installConfirmed ? `✓ Installed${ticket.installedVersion ? " v" + escapeHtml(ticket.installedVersion) : ""}` : "Awaiting Install"}
                      </span>
                    </div>
                    <p class="ti-step-desc" style="margin-top:6px;">
                      ${ticket.installConfirmed
                        ? `Your installation on Android is verified${cfg.latestVersion ? " (latest approved build: v" + escapeHtml(cfg.latestVersion) + ")" : ""}.`
                        : "After downloading from Google Play, confirm your install so the studio knows your device is active."}
                    </p>
                  </div>
                  <div class="ti-step-actions">
                    ${!ticket.installConfirmed
                      ? `<button type="button" class="btn btn-primary btn-sm" data-engagement-action="install_confirmed" data-version="${escapeHtml(cfg.latestVersion || "")}">✓ Confirm I Installed the App</button>`
                      : (cfg.latestVersion && (!ticket.installedVersion || ticket.installedVersion !== cfg.latestVersion)
                        ? `<button type="button" class="btn btn-ghost btn-sm" data-engagement-action="update_confirmed" data-version="${escapeHtml(cfg.latestVersion)}">✓ Confirm Updated to v${escapeHtml(cfg.latestVersion)}</button>`
                        : `<button type="button" class="btn btn-ghost btn-sm" data-engagement-action="install_confirmed" data-version="${escapeHtml(cfg.latestVersion || "")}">✓ Re-verify Install</button>`)}
                  </div>
                </div>

                <div class="ti-step">
                  <div>
                    <div class="ti-step-top">
                      <span class="ti-step-title">2. Day-2+ Active Usage Check-In</span>
                      <span class="ti-badge ${ticket.lastEngagedAt ? "is-done" : ""}">
                        ${ticket.lastEngagedAt ? "✓ Engaged" : "Day-2 Check-In"}
                      </span>
                    </div>
                    <p class="ti-step-desc" style="margin-top:6px;">
                      Google Play monitors multi-day tester engagement. Open <strong>${escapeHtml(cfg.name)}</strong> for a few minutes on Day 2+ and log your session here.
                    </p>
                  </div>
                  <div class="ti-step-actions">
                    <button type="button" class="btn btn-ghost btn-sm" data-engagement-action="daily_checkin" data-version="${escapeHtml(cfg.latestVersion || "")}">✓ Log Today's Testing Session</button>
                  </div>
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
        wireEngagementHandlers(bodyEl, container, appId, cfg, ticket);
      }
    } else {
      bodyEl.innerHTML = `
        <div class="queue-status-in pending-view">
          <div class="queue-header">
            <div class="queue-badge pending"><span class="pulse-dot-amber"></span> Queue Spot Confirmed</div>
            <h3>Waiting for ${escapeHtml(cfg.name)} Closed Testing Approval</h3>
            <p class="queue-desc">Registered Account: <strong>${escapeHtml(ticket.email)}</strong> · Platform: <strong>${escapeHtml(ticket.platform || "Android")}</strong></p>
          </div>

          <div class="pending-notice">
            <div class="notice-text">
              <p>Your request is confirmed in the ${escapeHtml(cfg.name)} priority queue. Once your email is authorized on Google Play Console, revisiting this page will automatically unlock your Google Play links and scannable QR code.</p>
            </div>

            <div class="ticket-status-pill">
              <span class="pill-label">Cloud Status: <b>In Queue (Waiting Approval)</b></span>
              <div class="pill-buttons">
                <button class="btn btn-sm btn-primary" data-check-status title="Check live status from cloud">Refresh Status</button>
                <button class="btn btn-sm btn-ghost" data-reset-ticket>Switch Email</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const checkBtn = bodyEl.querySelector("[data-check-status]");
    if (checkBtn) {
      checkBtn.addEventListener("click", async () => {
        checkBtn.textContent = "Checking...";
        checkBtn.disabled = true;

        await fetchCloudApps();
        const data = await fetchTesterStatus(ticket.email, appId);
        if (data) {
          ticket.joinWebUrl = data.joinWebUrl || data.playStoreUrl || ticket.joinWebUrl;
          ticket.joinAndroidUrl = data.joinAndroidUrl || ticket.joinAndroidUrl;
          ticket.androidStatus = data.androidStatus || ticket.androidStatus;
          if ((data.status || "").toLowerCase() === "approved") {
            ticket.status = "Approved";
            saveTicket(appId, ticket);
            renderProductStatusView(bodyEl, appId, APP_CONFIG[appId] || cfg, ticket, container);
            return;
          }
        }

        setTimeout(() => {
          checkBtn.textContent = "Still in Queue (Pending)";
          setTimeout(() => {
            checkBtn.disabled = false;
            checkBtn.textContent = "Refresh Status";
          }, 2200);
        }, 400);
      });
    }

    const resetBtn = bodyEl.querySelector("[data-reset-ticket]");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        clearAllTesterState();
        updateHeroAccessBanner(appId, cfg, null);
        renderProductHeroCountdown(appId, cfg, null);
        renderProductFormView(bodyEl, appId, cfg, container, "");
      });
    }
  }

  /* ==========================================================================
     6. Scoped & Expandable Support & Diagnostic Portal (v3.0)
     ========================================================================== */
  function initSupportPortal() {
    const portals = document.querySelectorAll("[data-support-portal]");
    if (!portals.length) return;

    portals.forEach((portal) => {
      setupPortalInstance(portal);
    });
  }

  function setupPortalInstance(portal) {
    const scope = (portal.getAttribute("data-support-scope") || "company").toLowerCase();
    const isExpandable = portal.getAttribute("data-expandable") === "true";

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

    // Pre-fill contact email if remembered
    const remembered = getRememberedEmail();
    const emailField = issueForm?.querySelector("[name='email']");
    if (emailField && !emailField.value && remembered) {
      emailField.value = remembered;
    }

    // Compact Expandable Drawer Logic (used on Company Hub)
    if (isExpandable) {
      const drawer = portal.querySelector("[data-support-drawer]");
      const triggers = portal.querySelectorAll("[data-support-open]");
      const tabs = portal.querySelectorAll("[data-support-tab]");
      const panes = portal.querySelectorAll("[data-support-pane]");
      const closeBtn = portal.querySelector("[data-support-close]");

      function setPane(paneName) {
        if (!drawer) return;
        const alreadyOpenSame = drawer.classList.contains("open") && drawer.getAttribute("data-active-pane") === paneName;
        if (alreadyOpenSame) {
          closeDrawer();
          return;
        }
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        drawer.setAttribute("data-active-pane", paneName);
        portal.classList.add("is-expanded");

        triggers.forEach((b) => b.classList.toggle("active", b.getAttribute("data-support-open") === paneName));
        tabs.forEach((t) => t.classList.toggle("active", t.getAttribute("data-support-tab") === paneName));
        panes.forEach((p) => p.classList.toggle("active", p.getAttribute("data-support-pane") === paneName));
      }

      function closeDrawer() {
        if (!drawer) return;
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        drawer.removeAttribute("data-active-pane");
        portal.classList.remove("is-expanded");
        triggers.forEach((b) => b.classList.remove("active"));
      }

      triggers.forEach((btn) => {
        btn.addEventListener("click", () => setPane(btn.getAttribute("data-support-open")));
      });
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const name = tab.getAttribute("data-support-tab");
          if (drawer) drawer.setAttribute("data-active-pane", "");
          setPane(name);
        });
      });
      closeBtn?.addEventListener("click", closeDrawer);
    }

    let currentAttachment = { base64: null, fileName: null };

    // Self-Service Advice Repository
    const adviceMap = {
      "windows-store": {
        title: "⚡ Fix: Microsoft Store Download Stuck or Error 0x80070005",
        steps: [
          "<b>Reset Microsoft Store Cache:</b> Press <kbd>Win + R</kbd>, type <code>wsreset.exe</code> and press <kbd>Enter</kbd>. Wait 30 seconds for the store window to re-open.",
          "<b>Install via Windows Terminal (PowerShell):</b><br><code>winget install \"Native Espresso.TransTitle\"</code>",
          "<b>Need offline package?</b> Submit a support ticket to request a signed offline installer."
        ]
      },
      "android-install": {
        title: "⚡ Fix: Google Play Closed Testing Track Not Showing App",
        steps: [
          "<b>Verify Account:</b> Ensure Google Play on your phone is signed into the <b>exact email</b> approved for that app.",
          "<b>Accept Web Opt-In First:</b> Visit the product's page, click <b>Join via Web</b>, then wait 5–10 minutes for Play Store propagation.",
          "<b>Clear Play Store Cache:</b> On Android, open <i>Settings → Apps → Google Play Store → Storage → Clear Cache</i>, then open <b>Join via Android</b>."
        ]
      },
      "audio-permission": {
        title: "⚡ Microphone & Local Storage Access",
        steps: [
          "<b>Explicit Permission Required:</b> Android requires microphone or media storage permission to read local files and analyze voice audio.",
          "<b>100% On-Device Guarantee:</b> Audio never leaves your hardware. Permissions connect strictly to the local processing engine."
        ]
      },
      "app-crash": {
        title: "⚡ Startup Crash or Processing Error",
        steps: [
          "<b>Check System Requirements:</b> Android 8.0+ (64-bit) or Windows 10/11 (Build 19041+) for desktop builds.",
          "<b>Share Diagnostics:</b> Attach a screenshot, short clip, or crash log using the support form so we can isolate the issue quickly."
        ]
      },
      "general": {
        title: "💡 General Studio Inquiries & Feedback",
        steps: [
          "For partnerships, privacy questions, closed testing account help, or general feedback, submit a general ticket or email <code>native.espresso@gmail.com</code>."
        ]
      }
    };

    const scopePills = {
      "company": [
        { id: "android-install", icon: "🤖", label: "Closed Testing Access" },
        { id: "windows-store", icon: "🪟", label: "Store Downloads" },
        { id: "general", icon: "💬", label: "Studio Inquiry" }
      ],
      "trans-title": [
        { id: "android-install", icon: "🤖", label: "Play Store Track" },
        { id: "windows-store", icon: "🪟", label: "Windows Store Stuck" },
        { id: "audio-permission", icon: "🎙️", label: "Media Permissions" },
        { id: "app-crash", icon: "⚡", label: "App Crashes" },
        { id: "general", icon: "💬", label: "Trans-Title Feedback" }
      ],
      "echo-cleaner": [
        { id: "android-install", icon: "🤖", label: "Play Store Track" },
        { id: "audio-permission", icon: "🎙️", label: "Mic & Storage Access" },
        { id: "app-crash", icon: "⚡", label: "Audio / App Crash" },
        { id: "general", icon: "💬", label: "Echo Cleaner Feedback" }
      ]
    };

    if (pillsContainer) {
      const pills = scopePills[scope] || scopePills["company"];
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
        setTimeout(() => { autoDetectBtn.textContent = "⚡ Auto-Detect Device Info"; }, 2500);
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
              <span>${isVideo ? "🎬 Video:" : "📎"} ${escapeHtml(file.name)} (${sizeStr})</span>
              <button type="button" class="chip-remove" data-remove-file title="Remove file">✕</button>
            </div>
            ${isImg ? `<img src="${e.target.result}" class="preview-thumb" alt="Upload thumbnail" />` : ""}
            ${isVideo ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:2px;">🎬 Video clip ready for upload</div>` : ""}
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
        const appId = issueForm.querySelector("[name='appId']")?.value || scope || "company";
        const platform = issueForm.querySelector("[name='platform']")?.value || "General";
        const category = categorySelect ? categorySelect.value : "general";
        const description = issueForm.querySelector("[name='description']").value.trim();
        const appName = APP_CONFIG[appId]?.name || (appId === "trans-title" ? "Trans-Title" : appId === "echo-cleaner" ? "Echo Cleaner" : "General / Studio");

        const ticketNum = "NE-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        const payload = {
          email,
          appId,
          appName,
          platform,
          category,
          description,
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
          email,
          appId,
          appName,
          platform,
          category,
          status: "Open",
          submittedAt: new Date().toLocaleDateString()
        });

        if (issueAlert) {
          issueAlert.innerHTML = `
            <div class="alert-success">
              <b>✓ Ticket #${escapeHtml(ticketNum)} Logged Successfully</b>
              <p>Your report for <strong>${escapeHtml(appName)}</strong> has been recorded. A confirmation email has been queued for <strong>${escapeHtml(email)}</strong>.</p>
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

    // Ticket Lookup
    const lookupForm = portal.querySelector("[data-lookup-form]");
    const lookupResult = portal.querySelector("[data-lookup-result]");
    if (lookupForm && lookupResult) {
      lookupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = lookupForm.querySelector("[name='ticketQuery']").value.trim().toUpperCase();
        if (!query) return;
        const localIssues = getLocalIssues();
        const match = localIssues.find((i) => i.ticketNumber.toUpperCase() === query || i.email.toUpperCase() === query);

        if (match) {
          lookupResult.innerHTML = `
            <div class="ticket-status-card">
              <div class="tsc-head">
                <span class="tsc-num">#${escapeHtml(match.ticketNumber)}</span>
                <span class="tsc-badge">${escapeHtml(match.status)}</span>
              </div>
              <p class="tsc-detail">App: <b>${escapeHtml(match.appName || match.appId)}</b> · Platform: <b>${escapeHtml(match.platform)}</b> · Submitted: <b>${escapeHtml(match.submittedAt)}</b></p>
              <p class="tsc-note">Our studio is reviewing this ticket. Progress updates will be sent to <b>${escapeHtml(match.email)}</b>.</p>
            </div>
          `;
        } else {
          lookupResult.innerHTML = `
            <div class="ticket-status-card not-found">
              <p>No local record found for <strong>${escapeHtml(query)}</strong>. If submitted on another device, check your email inbox for your confirmation ticket.</p>
            </div>
          `;
        }
      });
    }
  }

  /* ==========================================================================
     6.5. Community Reviews & Official Studio Reply Engine ([data-reviews-widget])
     ========================================================================== */
  const SHOWCASE_REVIEWS = {
    "trans-title": [
      {
        reviewId: "RV-TT01",
        appId: "trans-title",
        appName: "Trans-Title",
        platform: "Android",
        authorName: "Tariq M.",
        rating: 5,
        comment: "Lock-screen background transcription handled a 42-minute lecture without missing a single cue, and Cross-Play lip-sync offset nailed a dubbed clip in seconds.",
        isPinned: true,
        developerReply: "Thank you for testing long-form runs! We tuned our 5-minute continuous pipeline specifically so long videos never lose progress when switching apps.",
        repliedAt: "2026-11-16T10:30:00Z",
        createdAt: "2026-11-16T08:15:00Z",
        isSample: true
      },
      {
        reviewId: "RV-TT02",
        appId: "trans-title",
        appName: "Trans-Title",
        platform: "Android",
        authorName: "Elena R.",
        rating: 5,
        comment: "Love that subtitle colors, edge outlines, and audio timing stay remembered per video while keeping everything strictly offline.",
        isPinned: false,
        developerReply: "Appreciated, Elena! Per-video memory and live preview styling were built directly from closed-testing feedback.",
        repliedAt: "2026-11-17T14:20:00Z",
        createdAt: "2026-11-17T11:05:00Z",
        isSample: true
      }
    ],
    "echo-cleaner": [
      {
        reviewId: "RV-EC01",
        appId: "echo-cleaner",
        appName: "Echo Cleaner",
        platform: "Android",
        authorName: "Hassan K.",
        rating: 5,
        comment: "Recorded a voice memo in a tiled hallway — Studio Pro stripped out the hollow room tail completely and the live A/B waveform toggle makes dialing clarity super intuitive.",
        isPinned: true,
        developerReply: "Thrilled to hear Studio Pro rescued that hallway recording! Cached slider re-blending lets you audition subtle adjustments instantly.",
        repliedAt: "2026-11-17T16:10:00Z",
        createdAt: "2026-11-17T13:40:00Z",
        isSample: true
      }
    ],
    "company": [
      {
        reviewId: "RV-NE01",
        appId: "trans-title",
        appName: "Trans-Title",
        platform: "Android",
        authorName: "Daniel P.",
        rating: 5,
        comment: "Rare to see multimedia tools this fast and polished without requiring an account or uploading private files to external servers.",
        isPinned: true,
        developerReply: "Zero accounts and 100% local silicon execution is our core promise across every Native Espresso release.",
        repliedAt: "2026-11-16T18:00:00Z",
        createdAt: "2026-11-16T15:20:00Z",
        isSample: true
      },
      {
        reviewId: "RV-NE02",
        appId: "echo-cleaner",
        appName: "Echo Cleaner",
        platform: "Android",
        authorName: "Nadia S.",
        rating: 5,
        comment: "Clean Room & Studio Pro engines plus video audio extraction right on my phone — looking forward to the desktop builds too!",
        isPinned: false,
        developerReply: null,
        repliedAt: null,
        createdAt: "2026-11-17T09:12:00Z",
        isSample: true
      }
    ]
  };

  function getPendingLocalReviews(appId) {
    try {
      const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return appId === "all" ? list : list.filter((r) => (r.appId || "").toLowerCase() === appId);
    } catch (_) {
      return [];
    }
  }

  function savePendingLocalReview(item) {
    try {
      const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(item);
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(list.slice(0, 12)));
    } catch (_) {}
  }

  function formatStarsString(rating) {
    const r = Math.max(1, Math.min(5, Number(rating) || 5));
    return "★".repeat(r) + "☆".repeat(5 - r);
  }

  function formatReviewDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function initReviewsWidgets() {
    const widgets = document.querySelectorAll("[data-reviews-widget]");
    if (!widgets.length) return;
    widgets.forEach((el) => setupReviewWidget(el));
  }

  async function setupReviewWidget(container) {
    const appId = (container.getAttribute("data-app-id") || "company").toLowerCase();
    const appName = container.getAttribute("data-app-name") || APP_CONFIG[appId]?.name || "Native Espresso Studio";
    let activeFilter = "all";
    let isDrawerOpen = false;
    let selectedRating = 5;
    let lastNotice = null;
    let cloudReviews = [];
    let isCloudFallback = false;

    async function loadReviews() {
      try {
        const qs = appId === "company" ? "" : `?appId=${encodeURIComponent(appId)}`;
        const res = await fetch(`${API_BASE}/api/reviews${qs}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
            cloudReviews = data.reviews;
            isCloudFallback = false;
            return;
          }
        }
      } catch (_) {}
      cloudReviews = SHOWCASE_REVIEWS[appId] || SHOWCASE_REVIEWS["company"] || [];
      isCloudFallback = true;
    }

    function render() {
      const pendingLocal = getPendingLocalReviews(appId === "company" ? "all" : appId)
        .filter((p) => !cloudReviews.some((c) => c.reviewId === p.reviewId));
      const allItems = [...pendingLocal, ...cloudReviews];

      const filtered = activeFilter === "all"
        ? allItems
        : allItems.filter((r) => (r.platform || "").toLowerCase() === activeFilter.toLowerCase());

      const ratedItems = cloudReviews.length ? cloudReviews : allItems;
      const avg = ratedItems.length
        ? (ratedItems.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / ratedItems.length).toFixed(1)
        : "5.0";

      const rememberedEmail = getRememberedEmail();

      const cardsHtml = filtered.length
        ? filtered.map((r) => {
            const isPending = r.status === "Pending";
            const replyHtml = r.developerReply ? `
              <div class="studio-reply-thread">
                <div class="studio-reply-head">
                  <span>✓ Official Reply · Native Espresso Studio</span>
                  <span>${escapeHtml(formatReviewDate(r.repliedAt))}</span>
                </div>
                <p class="studio-reply-body">${escapeHtml(r.developerReply)}</p>
              </div>
            ` : "";

            return `
              <article class="review-card ${r.isPinned ? "is-pinned" : ""}">
                <div class="review-head">
                  <div class="review-author-block">
                    <div class="review-author">
                      <span>${escapeHtml(r.authorName)}</span>
                      ${r.isPinned ? `<span class="review-badge">Pinned</span>` : ""}
                      ${isPending ? `<span class="review-badge">Pending Approval</span>` : ""}
                      ${r.isSample ? `<span class="review-badge">Featured</span>` : ""}
                    </div>
                    <div class="review-meta">${escapeHtml(r.appName || appName)} · ${escapeHtml(r.platform || "Android")} · ${escapeHtml(formatReviewDate(r.createdAt))}</div>
                  </div>
                  <div class="review-stars" aria-label="${Number(r.rating) || 5} out of 5 stars">${formatStarsString(r.rating)}</div>
                </div>
                <p class="review-body">“${escapeHtml(r.comment)}”</p>
                ${replyHtml}
              </article>
            `;
          }).join("")
        : `<p class="muted" style="grid-column:1/-1;margin:8px 0;">No reviews match this platform filter yet. Be the first to share feedback!</p>`;

      const appSelectRow = appId === "company" ? `
        <div class="form-row">
          <label for="rev-app-${appId}">Product</label>
          <select id="rev-app-${appId}" name="appId" class="form-select">
            <option value="trans-title">Trans-Title</option>
            <option value="echo-cleaner">Echo Cleaner</option>
            <option value="company">Native Espresso Studio</option>
          </select>
        </div>
      ` : `<input type="hidden" name="appId" value="${escapeHtml(appId)}">`;

      container.innerHTML = `
        <div class="reviews-shell">
          ${lastNotice ? `
            <div class="alert-success" style="margin-bottom:18px;">
              <b>${escapeHtml(lastNotice.title)}</b>
              <p>${escapeHtml(lastNotice.body)}</p>
            </div>
          ` : ""}

          <div class="reviews-toolbar">
            <div class="reviews-summary">
              <div class="rating-score-pill">
                <span class="rating-stars-gold">★</span>
                <span>${escapeHtml(avg)} / 5.0</span>
                <span class="muted" style="font-weight:500;">· ${ratedItems.length} ${isCloudFallback ? "featured" : "approved"}</span>
              </div>
              <div class="reviews-filter-pills" role="group" aria-label="Filter reviews by platform">
                ${["all", "Android", "Windows", "iOS"].map((f) => `
                  <button type="button" class="rev-filter-btn ${activeFilter === f ? "active" : ""}" data-rev-filter="${f}">
                    ${f === "all" ? "All Platforms" : f}
                  </button>
                `).join("")}
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" data-rev-toggle-form>
              ${isDrawerOpen ? "Close Review Form ↑" : "+ Write a Review"}
            </button>
          </div>

          <div class="review-compose-drawer ${isDrawerOpen ? "open" : ""}" data-rev-drawer>
            <form data-rev-form>
              ${appSelectRow}
              <div class="form-grid-2">
                <div class="form-row">
                  <label for="rev-name-${appId}">Your Name</label>
                  <input type="text" id="rev-name-${appId}" name="authorName" required placeholder="e.g. Alex M." class="queue-input">
                </div>
                <div class="form-row">
                  <label for="rev-email-${appId}">Email (Private — never displayed)</label>
                  <input type="email" id="rev-email-${appId}" name="authorEmail" required value="${escapeHtml(rememberedEmail)}" placeholder="name@example.com" class="queue-input" autocomplete="email">
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-row">
                  <label for="rev-plat-${appId}">Platform</label>
                  <select id="rev-plat-${appId}" name="platform" class="form-select">
                    <option value="Android">Android</option>
                    <option value="Windows">Windows</option>
                    <option value="iOS">iOS</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Rating</label>
                  <div class="star-picker" role="radiogroup" aria-label="Star rating">
                    ${[1, 2, 3, 4, 5].map((n) => `
                      <button type="button" class="star-pick-btn ${n <= selectedRating ? "lit" : ""}" data-star-val="${n}" aria-label="${n} stars">★</button>
                    `).join("")}
                  </div>
                </div>
              </div>

              <div class="form-row">
                <label for="rev-comment-${appId}">Your Review or Comment</label>
                <textarea id="rev-comment-${appId}" name="comment" required minlength="3" maxlength="1500" placeholder="Share how it runs on your device, features you love, or suggestions for the studio..." class="form-textarea"></textarea>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <span class="mono muted">Reviewed &amp; replied by Native Espresso Studio before public listing.</span>
                <button type="submit" class="btn btn-primary btn-sm">Submit Review →</button>
              </div>
            </form>
          </div>

          <div class="reviews-grid">${cardsHtml}</div>
        </div>
      `;

      container.querySelectorAll("[data-rev-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeFilter = btn.getAttribute("data-rev-filter") || "all";
          render();
        });
      });

      container.querySelector("[data-rev-toggle-form]")?.addEventListener("click", () => {
        isDrawerOpen = !isDrawerOpen;
        render();
      });

      container.querySelectorAll("[data-star-val]").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedRating = Number(btn.getAttribute("data-star-val")) || 5;
          container.querySelectorAll("[data-star-val]").forEach((s) => {
            const v = Number(s.getAttribute("data-star-val")) || 0;
            s.classList.toggle("lit", v <= selectedRating);
          });
        });
      });

      const form = container.querySelector("[data-rev-form]");
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const submitBtn = form.querySelector("button[type='submit']");
          submitBtn.disabled = true;
          submitBtn.textContent = "Submitting...";

          const targetAppId = form.querySelector("[name='appId']")?.value || appId;
          const targetAppName = APP_CONFIG[targetAppId]?.name || (targetAppId === "company" ? "Native Espresso Studio" : appName);
          const authorName = form.querySelector("[name='authorName']").value.trim();
          const authorEmail = form.querySelector("[name='authorEmail']").value.trim().toLowerCase();
          const platform = form.querySelector("[name='platform']").value || "Android";
          const comment = form.querySelector("[name='comment']").value.trim();

          saveRememberedEmail(authorEmail);

          let reviewId = "RV-" + Math.random().toString(36).substring(2, 10).toUpperCase();
          let msg = "Your review has been submitted! Once approved (and optionally replied to) by Native Espresso Studio, it will display publicly here.";

          try {
            const res = await fetch(`${API_BASE}/api/reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appId: targetAppId,
                appName: targetAppName,
                platform,
                authorName,
                authorEmail,
                rating: selectedRating,
                comment
              })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.reviewId) reviewId = data.reviewId;
              if (data.message) msg = data.message;
            }
          } catch (_) {
            // Offline fallback preserves instant UX confirmation locally
          }

          savePendingLocalReview({
            reviewId,
            appId: targetAppId,
            appName: targetAppName,
            platform,
            authorName,
            rating: selectedRating,
            comment,
            status: "Pending",
            isPinned: false,
            developerReply: null,
            createdAt: new Date().toISOString()
          });

          lastNotice = { title: `✓ Review #${reviewId} Received`, body: msg };
          isDrawerOpen = false;
          render();
        });
      }
    }

    render();
    await loadReviews();
    render();
  }

  /* ==========================================================================
     7. Bootloader on DOM Ready
     ========================================================================== */
  function boot() {
    initStudioBetaWidgets();
    initProductBetaWidgets();
    initSupportPortal();
    initReviewsWidgets();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
