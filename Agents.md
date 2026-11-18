# Agents Guide Reference

Please refer to the primary guide: [AGENT.md](file:///c:/Projects/Web/Native-Espresso/AGENT.md).

### Core Policies at a Glance:
1. **Project Hierarchy & Editing Scope**:
   * **Primary / Core Project**: `C:\Projects\Web\Native-Espresso` (`NativeEspresso/nativeespresso.github.io`) — The core Native Espresso Web Portal.
   * **Linear Secondary Projects (Editable As Needed)**:
     * **Cloud Backend (Azure)**: `C:\Projects\Azure\Native-Espresso-Backend` (`NativeEspresso/Native-Espresso-Backend`) — Serverless backend deployed via Azure Functions.
     * **Admin / Administrative App (WinUI 3)**: `C:\Projects\WinUI\Native-Espresso` (`ChTalhaArain/Native-Espresso`, `master` branch) — Allowed to edit as needed, but not always (typically updated only when the Azure backend changes).
   * **Associated Source Projects (`[READ_ONLY]` Secondary Projects)**:
     * `C:\Projects\Android\Trans-Title` `[READ_ONLY]` (Android Multimedia Suite & AI Studio)
     * `C:\Projects\WinUI\Trans-Title` `[READ_ONLY]` (Windows Desktop WinUI 3 App)
     * `C:\Projects\KMP\Echo-Cleaner` `[READ_ONLY]` (Kotlin Multiplatform / Android Audio Engine)
2. **Multi-Platform Status Matrix**:
   * Platforms: `Android`, `Windows`, `iOS`, `macOS`, `Linux`
   * Lifecycle States: `Published`, `Planning`, `Development`, `Closed-Testing`, `Testing Queue / Beta Waitlist`
   * **Current Matrix**:
     * **Trans-Title**: `Android: Closed-Testing (v1.0.17)` | `Windows (WinUI 3): Development` | `iOS: Roadmap` | `macOS: Roadmap` | `Linux: Roadmap` *(replaced earlier JavaFX prototype with native WinUI 3 first)*
     * **Echo Cleaner**: `Android: Testing Queue (Finalizing for Closed-Testing)` | `Windows: Planning` | `iOS: Planning` | `macOS / Linux: Hidden until scheduled`
3. **Strict IP Protection (IP Cloaking Rule)**:
   * **NEVER** expose internal library names or models (`FFmpeg`, `ONNX`, `DeepFilterNet`, `Whisper`, `GGML`, `ML Kit`, `JNI`, etc.) in public user-facing text.
   * Always use proprietary, benefit-driven terms (e.g. *Proprietary On-Device Neural Engine*, *Hardware-Accelerated DSP*, *4-Tier Speech Accuracy*).
4. **Modular Styling Systems**:
   * Company Homepage has its own styling system (`assets/company.css`).
   * Each app maintains its own app-like font family, color scheme, and distinct identity (`assets/trans-title.css`, `assets/style.css`).
5. **Light & Dark Theme Systems & Typography**:
   * **Company Hub**: `Space Grotesk` (Display), `Plus Jakarta Sans` (Body), `JetBrains Mono` (Code/Stats).
   * **Trans-Title**: `Bree Serif` (Wordmark), `Plus Jakarta Sans` (Titles), `Inter` (Body), `Share Tech Mono` (Telemetry).
   * **Echo Cleaner**: `Orbitron` (Logo), `Archivo` (Headings), `Manrope` (Body), `Fira Code` (Numeric).
   * Zero-flash synchronous theme bootloader in `<head>` and dynamic toggle on all pages.
6. **Google Play Profile Branding Assets**:
   * Developer Website URL: `https://nativeespresso.github.io/`
   * Assets at `assets/branding/`: `developer-icon.png` (512x512, 24-bit RGB), `header-image.png` & `header-image.jpg` (4096x2304, 16:9, <1MB).
7. **Cloud Architecture, Multi-App Registry & Studio Control Center**:
   * Isolated Private Backend (`C:\Projects\Azure\Native-Espresso-Backend` -> `NativeEspresso/Native-Espresso-Backend`): C# **.NET 10 (LTS)** Isolated Worker deployed on Azure Functions Flex Consumption (Ubuntu 24.04) with 6-hour `TesterEngagementTimer` automation.
   * Azure SQL Database (Free Tier Serverless): `dbo.Apps` (5-platform lifecycle statuses `AndroidStatus`/`WindowsStatus`/`IosStatus`/`MacosStatus`/`LinuxStatus`, closed testing countdown, `LatestVersion` update notes & links), `dbo.Testers` (install confirmation, Day-2 engagement & version tracking), `dbo.IssueReports`, and `dbo.AppReviews` (moderated reviews & official replies).
   * Azure Blob Storage (`sharedstoragepool/support-attachments`): Error screenshots, diagnostic logs, and short video clips up to 15 MB.
   * Dual-Email Cascade: Resend (Primary: 100/day free) + Brevo (Active Fallback: 300/day free, verified sender `native.espresso@gmail.com`).
   * Frontend Client (`assets/cloud-client.js`): Auto-hydrates 5-platform badges, update alerts (`v1.0.17`), countdowns, reviews, and ISO/IEC 18004 QR passes, plus 1-click `?checkin=` install/Day-2/update engagement tracking.
   * Admin / Administrative Studio Control Center (`C:\Projects\WinUI\Native-Espresso` -> `ChTalhaArain/Native-Espresso`, `master` branch): Native WinUI 3 (.NET 10) packaged app managing Overview, Closed Testing Queue (install tracking & Day-2 reminders), Support Issues, Reviews & Comments, and 5-platform Apps & Links + Update Broadcasts via `/api/studio/*`.
