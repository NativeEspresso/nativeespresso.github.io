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
* [x] **C# .NET 10 Isolated Worker Azure Functions Backend (Isolated Private Repo)**:
  * Repository: `https://github.com/NativeEspresso/Native-Espresso-Backend` (Private)
  * Local Project: `C:\Projects\Web\Native-Espresso-Backend`
  * Upgraded to **.NET 10 (LTS)** with `Microsoft.Azure.Functions.Worker.Sdk` v2.1.0 to match Azure Flex Consumption deployment.
  * Dual-Email Cascade Service (`Resend` primary + `Brevo` fallback) for 100% cost-free operation.
  * Azure SQL database service with `schema.sql` (compatible with Azure SQL Free Tier, serverless auto-pause retry loop).
  * Azure Blob Storage service for error screenshots, diagnostic logs, and short screen-recording videos up to 15 MB in container `support-attachments`.
  * Support app reference tracking: Added `[AppName]` column and `[IX_IssueReports_AppId]` index to filter issues by Trans-Title, Echo Cleaner, or Studio/General.
  * Rest API triggers: `/api/testers/register`, `/api/testers/status`, `/api/admin/approve-tester`, `/api/support/report-issue`, `/api/health`.
  * Automated diagnostic test suite (`.\test-cloud.ps1`) verifying TCP Port 1433, Azure SQL authentication & schema, and Blob Storage read/write.
  * Verified compilation in dedicated repo: **0 errors**.
  * Decoupled from public frontend repo for maximum security and IP protection.

---

## 🟢 2. Verified Cloud Infrastructure

* [x] **Azure SQL Database (Free Tier)**:
  * Server: `native-espresso-web-server.database.windows.net`, Database: `Native-Espresso-Web-DB`
  * Auto-pause enabled, Overage billing disabled (100% free tier guarantee).
  * TCP Port 1433: **PASS**
  * Authentication: **PASS**
  * Tables: `dbo.Testers`, `dbo.IssueReports` verified.
* [x] **Azure Blob Storage (sharedstoragepool)**:
  * Container: `support-attachments`
  * Read/Write verification: **PASS** (test blob uploaded and cleaned up).
* [x] **Azure Function App (native-espresso-web-function)**:
  * Plan: Flex Consumption (.NET 10 LTS Isolated Worker, 512 MB, Linux Ubuntu 24.04, Central US)
  * Default Domain: `native-espresso-web-function-epbhdxbxbybte6bz.centralus-01.azurewebsites.net`
  * Code Package Deployed: **PASS** (All 5 endpoints active: `ApproveTester`, `CheckTesterStatus`, `HealthCheck`, `RegisterTester`, `ReportIssue`).
  * App Settings Synchronized: `AZURE_SQL_CONNECTION_STRING`, `BLOB_STORAGE_CONNECTION_STRING`, `STORAGE_ACCOUNT_NAME`, `ADMIN_API_KEY`.
  * Live `/api/health` Check: **PASS** (`status: Healthy`, `database: connected`, `blobStorage: Configured`).
  * Frontend Web Client: Configured `DEFAULT_API_BASE` in `assets/cloud-client.js` and pushed to GitHub.
* [x] **Live End-to-End Validation**:
  * Tester Registration: **PASS** (Tested with `test.verification@nativeespresso.com` -> saved in `dbo.Testers` -> verified via `/api/testers/status`).
  * Diagnostic Issue Report & Storage: **PASS** (Tested with Base64 payload -> uploaded to `sharedstoragepool/support-attachments` -> ticket `NE-DB566AF4` saved in `dbo.IssueReports` -> verified public attachment download).

---

## 🟡 3. Active Next Steps & Optional Enhancements

* [ ] **Azure Portal CORS (30-second task)**:
  * In Azure Portal -> `native-espresso-web-function` -> **API** -> **CORS**:
  * Add `https://nativeespresso.github.io` (and optionally `http://localhost:5500`) to Allowed Origins and click **Save**.
* [ ] **Dual-Email Cascade API Keys (Free Tier - When Ready)**:
  * Optional: Generate free API keys on Resend (100 emails/day) and Brevo (300 emails/day) and paste into Azure App Settings for automated email dispatches.
