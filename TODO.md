# Native Espresso — Engineering Roadmap & Task Tracker

This file serves as the single source of truth for ongoing development, completed work, and upcoming milestones across the Native Espresso web portal and cloud architecture.

---

## 🟢 1. Completed Work

* [x] **Company Hub & Portal Architecture**:
  * Root `index.html` as the studio portal with app showcases, technology philosophy, and multi-platform status matrix.
  * Dedicated app directories (`trans-title/` and `echo-cleaner/`) with independent `index.html`, `privacy.html`, and `terms.html`.
  * Verified Google Search Console ownership file (`googlec843c5927d99b442.html`).
* [x] **IP Cloaking & Strict Protection Rule**:
  * Sanitized all public copy of internal toolset names (0 mentions of FFmpeg, ONNX, DeepFilterNet, Whisper, GGML, JNI, etc.).
  * Documented proprietary benefit-driven terminology in `AGENT.md` and `Agents.md`.
* [x] **Production Typography & Color Palettes**:
  * Inspected `[READ_ONLY]` app repositories and extracted verified fonts and tokens:
    * **Company Hub**: Space Grotesk (Headings), Plus Jakarta Sans (Body), JetBrains Mono (Code).
    * **Trans-Title**: Bree Serif (Wordmark), Plus Jakarta Sans (Titles), Inter (Body), Share Tech Mono (Telemetry).
    * **Echo Cleaner**: Orbitron (Logo), Archivo (Headings), Manrope (Body), Fira Code (Telemetry).
* [x] **Light & Dark Theme Engine**:
  * Synchronous zero-flash inline bootloader in `<head>` of all 7 HTML pages.
  * Accessible `.theme-toggle` button in navigation on desktop and mobile viewports.
  * Cohesive CSS variables and smooth transitions across dark and light palettes.
* [x] **Google Play Developer Profile Branding Assets**:
  * Generated 512×512 non-transparent 24-bit RGB Developer Icon (`assets/branding/developer-icon.png`).
  * Generated 4096×2304 16:9 widescreen Header Image (`assets/branding/header-image.png` and `assets/branding/header-image.jpg` <1MB).
* [x] **Closed Testing Queue & Client State Engine (`assets/cloud-client.js`)**:
  * Multi-app tab switcher on homepage (`[ Trans-Title ]` vs. `[ Echo Cleaner ]`).
  * Target platform selector pills (`[ Android (Closed Testing) ]` vs. `[ Windows (WinUI 3 Beta) ]`).
  * In-browser zero-dependency vector SVG QR Code generator for Android camera scanning with viewfinder reticles.
  * Local state hydration with `localStorage` (`ne_tester_tickets`).
  * Instant status preview toggle (`data-preview-approved` / `data-toggle-preview`) allowing instant toggling between "Pending Queue" and "Approved VIP Tester Pass" for testing.
* [x] **Self-Service Support & Issue Diagnostic Portal (`#support`)**:
  * Interactive clickable Symptom Pills (`Windows Store Stuck`, `Play Store Track`, `Audio Permissions`, `App Crashes`, `General Feedback`).
  * Instant self-service diagnostic instructions (`wsreset.exe`, `winget`, Android CDN propagation, offline DSP rationale).
  * Direct web-based issue reporting form as a fail-safe for when in-app forms crash or store downloads fail.
  * Auto-detect OS, screen resolution, browser language, and device environment helper.
  * Drag-and-drop file attachment dropzone with thumbnail preview, size check (5MB), and Base64 encoding.
  * Ticket status lookup form (`NE-XXXXXXXX`) for returning users.
* [x] **C# .NET 8 Isolated Worker Azure Functions Backend (`backend/NativeEspresso.Cloud/`)**:
  * Dual-Email Cascade Service (`Resend` primary + `Brevo` fallback) for 100% cost-free operation (400 emails/day, 12,000/mo).
  * Azure SQL database service with `schema.sql` (compatible with Azure SQL Free Tier).
  * Azure Blob Storage service for crash logs and error screenshots.
  * Rest API triggers: `/api/testers/register`, `/api/testers/status`, `/api/admin/approve-tester`, `/api/support/report-issue`.
  * Verified compilation: **0 warnings, 0 errors**.

---

## 🟡 2. Active Focus: Azure Cloud Provisioning & Account Setup

Now that the frontend GUI is 100% complete and fully verified across all pages, the next step is for the user to provision the free-tier cloud resources and communication accounts:

* [ ] **Azure SQL Database (Free Tier)**:
  * Create Azure SQL Database on the free offer (32 GB storage, 100,000 vCore seconds/month free).
  * Get connection string: `Server=tcp:your-server.database.windows.net...`
* [ ] **Azure Blob Storage (Standard LRS)**:
  * Create storage account with container `issue-attachments`.
  * Get storage connection string: `DefaultEndpointsProtocol=https;AccountName=...`
* [ ] **Dual-Email Cascade API Keys (100% Free)**:
  * **Resend** (Primary: 100 emails/day free): Sign up at `resend.com`, generate API key `re_...`
  * **Brevo** (Fallback: 300 emails/day free): Sign up at `brevo.com`, generate API key `xkeysib-...`
* [ ] **Azure Function App (.NET 8 Isolated)**:
  * Create Azure Function App on Consumption Plan (1 million executions/month free).
  * Set Application Settings (`local.settings.json` keys).
  * Deploy backend via `func azure functionapp publish`.

---

## ⚪ 3. Upcoming Milestones (Post-Frontend)

* [ ] **User Azure Resource Provisioning**:
  * User provisions Azure SQL Database (Free Tier), Azure Storage Account, and Function App.
  * User signs up for free accounts on Resend (100/day free) and Brevo (300/day free) and generates API keys.
* [ ] **Cloud Backend Activation & Deployment**:
  * Run `schema.sql` in Azure SQL Query Editor.
  * Deploy `NativeEspresso.Cloud` via Azure Functions Core Tools.
  * Configure CORS for `https://nativeespresso.github.io`.
  * Point `window.NE_API_BASE` in the web client to the live Azure Function App URL.
* [ ] **End-to-End Live Validation**:
  * Submit live test email -> verify insertion in Azure SQL -> verify welcome email receipt.
  * Submit support ticket with screenshot -> verify storage in Azure Blob -> verify developer alert email.
