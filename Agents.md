# Agents Guide Reference

Please refer to the primary guide: [AGENT.md](file:///c:/Projects/Web/Native-Espresso/AGENT.md).

### Core Policies at a Glance:
1. **Associated Source Projects [READ_ONLY]**:
   * `C:\Projects\Android\Trans-Title` `[READ_ONLY]` (Android Multimedia Suite & AI Studio)
   * `C:\Projects\WinUI\Trans-Title` `[READ_ONLY]` (Windows Desktop WinUI 3 App)
   * `C:\Projects\KMP\Echo-Cleaner` `[READ_ONLY]` (Kotlin Multiplatform / Android Audio Engine)
2. **Multi-Platform Status Matrix**:
   * Platforms: `Android`, `Windows`, `iOS`, `macOS`, `Linux`
   * Lifecycle States: `Published`, `Planning`, `Development`, `Closed-Testing`, `Testing Queue / Beta Waitlist`
   * **Current Matrix**:
     * **Trans-Title**: `Android: Closed-Testing (v1.0.16)` | `Windows: Development (WinUI 3)` | `iOS: Planning`
     * **Echo Cleaner**: `Android: Testing Queue (Finalizing for Closed-Testing)` | `iOS: Planning` | `Windows: Planning`
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
7. **Cloud Architecture & Support Fail-Safe**:
   * Backend in `backend/NativeEspresso.Cloud/`: C# .NET 8 Isolated Worker Azure Functions.
   * Dual Email Cascade: Resend (Primary: 100/day free) + Brevo (Fallback: 300/day free) for 100% cost-free operation.
   * Frontend Client in `assets/cloud-client.js`: `localStorage` state caching, inline SVG QR code generator, and web-based issue reporting for when in-app forms or store downloads encounter issues.
