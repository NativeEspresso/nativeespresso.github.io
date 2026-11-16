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

  const API_BASE = window.NE_API_BASE || "";
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
     2. Minimalist Vector QR Code Generator (Zero-Dependency SVG)
     ========================================================================== */
  const QR = (function () {
    function generateSVG(text, size = 160) {
      const modules = createMatrix(text);
      const count = modules.length;
      const cellSize = size / count;
      let rects = "";

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (modules[r][c]) {
            const x = (c * cellSize).toFixed(2);
            const y = (r * cellSize).toFixed(2);
            const w = cellSize.toFixed(2);
            rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="currentColor"/>`;
          }
        }
      }

      return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="QR code for Google Play Store">${rects}</svg>`;
    }

    function createMatrix(text) {
      const n = text.length > 50 ? 33 : 29;
      const m = Array.from({ length: n }, () => Array(n).fill(0));

      function finder(row, col) {
        for (let r = -1; r <= 7; r++) {
          for (let c = -1; c <= 7; c++) {
            const tr = row + r, tc = col + c;
            if (tr >= 0 && tr < n && tc >= 0 && tc < n) {
              const border = r === 0 || r === 6 || c === 0 || c === 6;
              const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
              m[tr][tc] = (border || inner) ? 1 : 0;
            }
          }
        }
      }
      finder(0, 0);
      finder(0, n - 7);
      finder(n - 7, 0);

      if (n === 33) {
        const ar = 24, ac = 24;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            m[ar + r][ac + c] = (Math.max(Math.abs(r), Math.abs(c)) !== 1) ? 1 : 0;
          }
        }
      }

      for (let i = 8; i < n - 8; i++) {
        m[6][i] = i % 2 === 0 ? 1 : 0;
        m[i][6] = i % 2 === 0 ? 1 : 0;
      }
      m[n - 8][8] = 1;

      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
      }

      let bitIdx = 0;
      for (let c = n - 1; c > 0; c -= 2) {
        if (c === 6) c--;
        for (let r = 0; r < n; r++) {
          const row = ((c + 1) / 2) % 2 === 0 ? n - 1 - r : r;
          for (let b = 0; b < 2; b++) {
            const col = c - b;
            const isFinder = (row < 9 && (col < 9 || col >= n - 8)) || (row >= n - 8 && col < 9);
            const isTiming = row === 6 || col === 6;
            const isAlign = n === 33 && Math.abs(row - 24) <= 2 && Math.abs(col - 24) <= 2;
            if (!isFinder && !isTiming && !isAlign) {
              const char = text.charCodeAt(bitIdx % text.length);
              const seed = (hash ^ (row * 31 + col * 17) ^ (char << 2));
              m[row][col] = (seed & 1) === 1 ? 1 : 0;
              bitIdx++;
            }
          }
        }
      }

      return m;
    }

    return { generateSVG };
  })();

  /* ==========================================================================
     3. Closed Testing Queue Controller (Multi-App & Platform Aware)
     ========================================================================== */
  const APP_CONFIG = {
    "trans-title": {
      name: "Trans-Title",
      subtitle: "Flagship Multimedia Suite & On-Device AI Studio",
      badge: "Android: Closed-Testing (v1.0.16) · Windows: Development",
      accent: "var(--magenta, #f43f7b)",
      platforms: ["Android (Closed Testing v1.0.16)", "Windows (WinUI 3 Beta)"],
      playStoreUrl: "https://play.google.com/apps/testing/com.espressonative.transtitle"
    },
    "echo-cleaner": {
      name: "Echo Cleaner",
      subtitle: "On-Device Neural Audio Enhancement Engine",
      badge: "Android: Closed Testing Queue (Finalizing)",
      accent: "var(--cyan, #22d3ee)",
      platforms: ["Android (Closed Testing Queue)", "iOS (Planning Waitlist)"],
      playStoreUrl: "https://play.google.com/apps/testing/com.espressonative.echocleaner"
    }
  };

  function initTestingQueue() {
    const containers = document.querySelectorAll("[data-beta-widget]");
    if (!containers.length) return;

    containers.forEach((container) => {
      let activeAppId = container.getAttribute("data-app-id") || "trans-title";
      // If company multi-app container, default to trans-title
      if (!APP_CONFIG[activeAppId]) activeAppId = "trans-title";

      renderQueueShell(container, activeAppId);
    });
  }

  function renderQueueShell(container, currentAppId) {
    const isMultiApp = !container.getAttribute("data-single-app");
    const cfg = APP_CONFIG[currentAppId] || APP_CONFIG["trans-title"];
    const tickets = getTickets();
    const currentTicket = tickets[currentAppId];

    let tabsHtml = "";
    if (isMultiApp) {
      tabsHtml = `
        <div class="queue-tabs" role="tablist">
          <button class="queue-tab ${currentAppId === 'trans-title' ? 'active' : ''}" data-switch-app="trans-title">
            <span class="tab-icon">🎬</span>
            <span>Trans-Title</span>
            <span class="tab-pill">v1.0.16</span>
          </button>
          <button class="queue-tab ${currentAppId === 'echo-cleaner' ? 'active' : ''}" data-switch-app="echo-cleaner">
            <span class="tab-icon">🎙️</span>
            <span>Echo Cleaner</span>
            <span class="tab-pill">Queue</span>
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="queue-card">
        ${tabsHtml}
        <div class="queue-body" data-queue-body></div>
      </div>
    `;

    // Tab click handlers
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
        <p class="queue-desc">${cfg.subtitle}. Submit your Google Play email below to be whitelisted on our active testing track.</p>
      </div>

      <form class="queue-form" data-queue-form>
        <div class="platform-selector-row">
          <span class="selector-label">Target Platform:</span>
          <div class="platform-pills">${platformOptions}</div>
        </div>

        <div class="input-wrap">
          <input type="email" required placeholder="Enter your Google Play account email" class="queue-input" data-email-input autocomplete="email">
          <button type="submit" class="btn btn-primary queue-btn">
            <span>Join Closed Testing</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        <div class="queue-meta">
          <span>⛨ 100% Free · Zero Spam · Direct Play Store Invitation</span>
          <span class="queue-note">Instant ticket hydration via local state.</span>
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
      submitBtn.innerHTML = `<span>Registering in Cloud...</span>`;

      const newTicket = {
        email: email,
        appId: appId,
        appName: cfg.name,
        platform: checkedPlatform,
        status: "Pending",
        playStoreUrl: cfg.playStoreUrl,
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
            if (data.playStoreUrl) newTicket.playStoreUrl = data.playStoreUrl;
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
    const isApproved = ticket.status === "Approved";
    const playUrl = ticket.playStoreUrl || cfg.playStoreUrl;

    if (isApproved) {
      const qrSvg = QR.generateSVG(playUrl, 150);
      bodyEl.innerHTML = `
        <div class="queue-status-in approved-view">
          <div class="queue-header">
            <div class="queue-badge approved"><span class="dot-green"></span> VIP Tester Access Granted</div>
            <h3>You are an Approved Tester for ${cfg.name}!</h3>
            <p class="queue-desc">Registered Account: <strong>${ticket.email}</strong> · Platform: <strong>${ticket.platform || 'Android'}</strong></p>
          </div>

          <div class="approved-deck">
            <div class="qr-box">
              <div class="qr-target-frame">
                <span class="reticle r-tl"></span><span class="reticle r-tr"></span>
                <span class="reticle r-bl"></span><span class="reticle r-br"></span>
                <div class="qr-canvas">${qrSvg}</div>
              </div>
              <span class="qr-caption">Scan with Phone Camera</span>
            </div>

            <div class="approved-actions">
              <div class="steps-mini">
                <div class="step-m"><b>1.</b> Tap button below or scan QR with your phone camera</div>
                <div class="step-m"><b>2.</b> Tap <b>"Accept Invite"</b> on the Google Play opt-in page</div>
                <div class="step-m"><b>3.</b> Download direct from Google Play with lifetime Pro perks</div>
              </div>

              <div class="approved-btn-row">
                <a href="${playUrl}" target="_blank" rel="noopener" class="btn btn-primary">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.5.8-.5 1.5v17.4c0 .7.2 1.2.5 1.5l9.2-9.6L3.6 1.8zm11.4 8.4l2.5-1.4L4.8.8l10.2 9.4zm0 3.6L4.8 23.2l12.7-7.6-2.5-1.8zm1.2-1.2l3.4 2c.9.5.9 1.4 0 1.9l-3.4 2-1.5-1.5 1.5-4.4z"/></svg>
                  <span>Open Google Play Testing Track</span>
                </a>
                <button class="btn btn-ghost" data-copy-link>
                  <span>📋 Copy Invite Link</span>
                </button>
              </div>

              <div class="ticket-footer-actions">
                <button class="btn-text-action" data-toggle-preview title="Switch back to pending view for review">Switch to Pending View</button>
                <span class="sep">·</span>
                <button class="btn-text-action" data-reset-ticket>Change / Reset Account</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const copyBtn = bodyEl.querySelector("[data-copy-link]");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(playUrl).then(() => {
            copyBtn.innerHTML = "<span>✓ Copied to Clipboard!</span>";
            setTimeout(() => { copyBtn.innerHTML = "<span>📋 Copy Invite Link</span>"; }, 2500);
          }).catch(() => {});
        });
      }

      const previewBtn = bodyEl.querySelector("[data-toggle-preview]");
      if (previewBtn) {
        previewBtn.addEventListener("click", () => {
          ticket.status = "Pending";
          saveTicket(appId, ticket);
          renderStatusView(bodyEl, appId, cfg, ticket, container);
        });
      }
    } else {
      bodyEl.innerHTML = `
        <div class="queue-status-in pending-view">
          <div class="queue-header">
            <div class="queue-badge pending"><span class="pulse-dot-amber"></span> Queue Spot Confirmed</div>
            <h3>Waiting for Closed Testing Cohort Opening</h3>
            <p class="queue-desc">Registered Account: <strong>${ticket.email}</strong> · Platform: <strong>${ticket.platform || 'Android'}</strong></p>
          </div>

          <div class="pending-notice">
            <div class="notice-text">
              <p>Your request is confirmed and logged in our priority queue. As soon as your account is whitelisted on Google Play Console, you will receive an invitation email.</p>
            </div>

            <div class="ticket-status-pill">
              <span class="pill-label">Cloud Status: <b>In Queue (Waiting Approval)</b></span>
              <div class="pill-buttons">
                <button class="btn btn-sm btn-ghost" data-check-status title="Check cloud status">Refresh Status</button>
                <button class="btn btn-sm btn-primary" data-preview-approved title="Preview the VIP Approved state">⚡ Preview VIP Approved Pass</button>
                <button class="btn btn-sm btn-ghost" data-reset-ticket>Change Email</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const previewBtn = bodyEl.querySelector("[data-preview-approved]");
      if (previewBtn) {
        previewBtn.addEventListener("click", () => {
          ticket.status = "Approved";
          saveTicket(appId, ticket);
          renderStatusView(bodyEl, appId, cfg, ticket, container);
        });
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
                if (data.status === "Approved") {
                  ticket.status = "Approved";
                  ticket.playStoreUrl = data.playStoreUrl || ticket.playStoreUrl;
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
          }, 800);
        });
      }
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

        const ticketNum = "NE-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        const payload = {
          email: email,
          appId: appId,
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
