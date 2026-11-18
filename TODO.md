# Native Espresso — Engineering Roadmap & Task Tracker

This file serves as the single source of truth for ongoing development, completed work, and upcoming milestones across the Native Espresso web portal and cloud architecture.

---

## 🟢 1. Completed Work

* [x] **Closed Testing Intelligence, FAQ Polish & 5-Platform Live WinUI Sync**:
  * Added install confirmation, Day-2 active engagement tracking, `?checkin=installed|engaged|updated` URL deep links, and live `LatestVersion` update alert banners in `assets/cloud-client.js`, paired with `TesterEngagementTimer` (6h), `POST /api/testers/engagement`, `POST /api/studio/testers/send-reminders`, and `AppUpdateApproved` Brevo broadcasts.
  * Added live `IosStatus`, `MacosStatus`, and `LinuxStatus` controls across Azure SQL (`dbo.Apps`), WinUI 3 `AppsPage`, and `assets/cloud-client.js` (syncing all 5 platform pills cleanly without manual HTML edits).
  * Fixed `.faq summary::after` rounded-square `−`/`+` icon alignment (`assets/trans-title.css`, `assets/style.css`), added exclusive `<details>` accordion toggle in `assets/main.js`, and documented the native WinUI 3 transition over the earlier JavaFX prototype.
* [x] **3D Spatial Product Showcase, Interactive Studio Workbench & Community Reviews Ecosystem**:
  * Copied real product icons & screenshots from `Trans-Title` and `Echo-Cleaner` into `assets/media/` and rebuilt `index.html`, `trans-title/index.html`, and `echo-cleaner/index.html` with product-first identity lockups (`Bree Serif` & `Orbitron`), above-the-fold Platform & Development Lifecycle Matrices, cursor-reactive **3D Tilt Phone Stages** with Lightbox zoom (`assets/spatial-ui.css`, `assets/main.js`), dual-angled 3D product cards on the Company Hub, interactive Studio Deck / Acoustic Workbench switchers, collapsible Support & FAQ drawers, and the fixed `.floating-dock` command dock.
  * Built the end-to-end **Community Reviews & Official Studio Reply** workflow across Azure Functions (`dbo.AppReviews`, `ReviewFunctions.cs`, `GET/POST /api/reviews`, `/api/studio/reviews/*`, Brevo email alerts), the WinUI 3 Studio Control Center (`Pages/ReviewsPage.xaml`), and `assets/cloud-client.js` (`[data-reviews-widget]`, 5-star picker, platform filters, `Pending Approval` local feedback, and indented `Official Reply` threads).
* [x] **Atelier Glass & Ambient Light Luxury UI/UX Overhaul (All 7 Pages)**:
  * Upgraded Company Hub (`index.html`, `assets/company.css`), Trans-Title showcase (`trans-title/`, `assets/trans-title.css`), Echo Cleaner showcase (`echo-cleaner/`, `assets/style.css`), and all legal pages with specular glassmorphism, ambient light orbs, architectural grid veils, channel-strip section notches, cursor-reactive spotlight sheen, magnetic CTA micro-interactions, top scroll-progress filament, staggered scroll choreography, smooth theme-switch icon transitions, active legal TOC highlighting, and theme-aware oscilloscope rendering in `assets/main.js`.
  * Updated Company Hub navbar & favicon mark to the authentic "Extracted Shot" crema + lightning emblem and synchronized IP-cloaked product highlights with the latest Android/KMP release notes.
  * Added live top-of-hero Closed Testing telemetry strips (`[data-studio-live-banner]`, `[data-hero-countdown]`) displaying real-time 1-second running & remaining cycle timers and one-click `+ Join Running Cycle` enrollment for active and follow-up testing windows.
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
  * Local Project: `C:\Projects\Azure\Native-Espresso-Backend` (Deployed via Azure Functions)
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
  * Tables: `dbo.Apps`, `dbo.Testers`, `dbo.IssueReports` verified.
* [x] **Azure Blob Storage (sharedstoragepool)**:
  * Container: `support-attachments`
  * Read/Write verification: **PASS** (test blob uploaded and cleaned up).
* [x] **Azure Function App (native-espresso-web-function)**:
  * Plan: Flex Consumption (.NET 10 LTS Isolated Worker, 512 MB, Linux Ubuntu 24.04, Central US)
  * Default Domain: `native-espresso-web-function-epbhdxbxbybte6bz.centralus-01.azurewebsites.net`
  * Code Package Deployed: **PASS** (All 13 endpoints active: public queue/apps/support/health + `/api/studio/*` authenticated admin API).
  * App Settings Synchronized: `AZURE_SQL_CONNECTION_STRING`, `BLOB_STORAGE_CONNECTION_STRING`, `STORAGE_ACCOUNT_NAME`, `BREVO_API_KEY`, `ADMIN_API_KEY` (36-char cryptographic key).
  * Live `/api/health` Check: **PASS** (`status: Healthy`, `database: connected`, `blobStorage: Configured`, `emailCascade: Configured`).
  * CORS Configured: `https://nativeespresso.github.io` allowed.
  * Frontend Web Client: Configured `DEFAULT_API_BASE` in `assets/cloud-client.js?v=20261118` with live `GET /api/apps` hydration, dual `Join via Web` + `Join via Android` links, and **verified ISO/IEC 18004 scannable QR codes** (decoded byte-for-byte via `jsQR`).
* [x] **Email Alerts (Brevo Free Tier — 300 emails/day)**:
  * Verified sender `native.espresso@gmail.com` (`active: True`) on Brevo.
  * Hardened serverless delivery (`await` / `Task.WhenAll`) for Beta Queue confirmations, Developer signup alerts, dual-link VIP Play Store approvals (`Join on the Web` + `Install on Android`), and Support Ticket notifications.
  * Live delivery confirmed **`delivered`** by Brevo SMTP relay to `native.espresso@gmail.com`.
* [x] **Dynamic Multi-App Registry (`dbo.Apps`) & WinUI 3 Studio Control Center**:
  * Authenticated endpoints (`X-Admin-Key` constant-time check): `summary`, `apps`, `apps/upsert`, `testers`, `approve-testers-bulk`, `issues`, `issues/update` (verified HTTP `401` when unauthenticated, `200` when authorized).
  * WinUI 3 Packaged Admin / Studio Control Center (`C:\Projects\WinUI\Native-Espresso`, private repo `ChTalhaArain/Native-Espresso` on `master` — linear secondary project updated as needed when backend changes): Overview, Closed Testing Queue (dynamic app filters, 1-click Play Console copy, dual-link bulk VIP approve), Support Issues inspector with attachment launcher, **Apps & Links** manager (add future apps, transition `TestingQueue` -> `ClosedTesting`, update Web & Android links anytime), and Windows Credential Locker (`PasswordVault`) settings.
* [x] **Live End-to-End Validation**:
  * Tester Registration: **PASS** (Tested with `test.verification@nativeespresso.com` -> saved in `dbo.Testers` -> verified via `/api/testers/status`).
  * Diagnostic Issue Report & Storage: **PASS** (Tested with Base64 payload -> uploaded to `sharedstoragepool/support-attachments` -> ticket `NE-DB566AF4` saved in `dbo.IssueReports` -> verified public attachment download).

---

## ⚪ 3. Optional Future Enhancements

* [ ] **Custom Domain + Resend Primary Cascade (Optional)**:
  * When purchasing a custom domain (e.g., `nativeespresso.com`), optionally add `RESEND_API_KEY` (100 emails/day free) as primary alongside Brevo fallback.
