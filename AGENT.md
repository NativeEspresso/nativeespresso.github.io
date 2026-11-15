# Native Espresso — Agent Guide & Architecture Reference

This document serves as the operational manual and architectural guide for AI agents, developers, and maintainers working on the **Native Espresso** web portal and its associated mobile application landing pages.

---

## 1. Company Identity & Philosophy

* **Company / Studio Name**: Native Espresso
* **Public / End-User Facing Email**: `native.espresso@gmail.com`
* **Official Website**: [https://nativeespresso.github.io/](https://nativeespresso.github.io/)
* **GitHub Repository**: [NativeEspresso/nativeespresso.github.io](https://github.com/NativeEspresso/nativeespresso.github.io)
* **Core Engineering Focus**:
  * **100% On-Device Processing**: Deep neural engines, speech recognition models, and high-performance audio/video DSP kernels execute strictly on the client device.
  * **Zero Cloud Surveillance**: No telemetry, no behavioral profiling, and no uploading user audio, video, or documents to remote servers.
  * **Native Performance**: Modern Android architecture powered by Jetpack Compose, Kotlin Coroutines, and native low-level silicon acceleration for maximum efficiency and 120Hz responsiveness.

---

## 2. Company & Project Level Hierarchy

The website utilizes a clean, folder-based static architecture hosted on **GitHub Pages**, providing independent URL routing for each application under the studio umbrella:

```text
nativeespresso.github.io/
│
├── index.html                   <-- LEVEL 1: Studio / Company Hub (Native Espresso)
├── AGENT.md                     <-- Developer & Agent instructions (this file)
├── googlec843c5927d99b442.html  <-- Google Search Console ownership verification
│
├── assets/                      <-- Shared Design System
│   ├── style.css                <-- Unified dark theme, typography, spotlight cards
│   └── main.js                  <-- Shared animations, navigation, dynamic dates
│
├── echo-cleaner/                <-- LEVEL 2: App #1 (Echo Cleaner)
│   ├── index.html               <-- App landing page + interactive signal demo
│   ├── privacy.html             <-- App-specific Privacy Policy (Google Play requirement)
│   └── terms.html               <-- App-specific Terms of Service
│
├── trans-title/                 <-- LEVEL 2: App #2 (Trans-Title)
│   ├── index.html               <-- App landing page + feature overview
│   ├── privacy.html             <-- App-specific Privacy Policy (Google Play requirement)
│   └── terms.html               <-- App-specific Terms of Service
│
└── [future-app-name]/           <-- LEVEL 2: Any new app follows this exact folder pattern
    ├── index.html
    ├── privacy.html
    └── terms.html
```

---

## 3. URL Routing on GitHub Pages

GitHub Pages natively serves directory roots, enabling clean URLs for marketing and Google Play compliance:

| Target | URL Endpoint | File Path |
| :--- | :--- | :--- |
| **Studio Portal** | `https://nativeespresso.github.io/` | `/index.html` |
| **Echo Cleaner Showcase** | `https://nativeespresso.github.io/echo-cleaner/` | `/echo-cleaner/index.html` |
| **Echo Cleaner Privacy Policy** | `https://nativeespresso.github.io/echo-cleaner/privacy.html` | `/echo-cleaner/privacy.html` |
| **Echo Cleaner Terms** | `https://nativeespresso.github.io/echo-cleaner/terms.html` | `/echo-cleaner/terms.html` |
| **Trans-Title Showcase** | `https://nativeespresso.github.io/trans-title/` | `/trans-title/index.html` |
| **Trans-Title Privacy Policy** | `https://nativeespresso.github.io/trans-title/privacy.html` | `/trans-title/privacy.html` |
| **Trans-Title Terms** | `https://nativeespresso.github.io/trans-title/terms.html` | `/trans-title/terms.html` |

---

## 4. Protocols for Adding a New App

When adding a new application to the portfolio (e.g., `voice-scribe`), adhere to the following workflow:

1. **Create the Folder**:
   Create a new folder at the repository root using lowercase kebab-case (e.g., `voice-scribe/`).

2. **Scaffold the App Files**:
   * `index.html`: Product showcase, features, workflow, and beta signup. Reference `../assets/style.css` and `../assets/main.js`. Include a breadcrumb link to the company hub (`../index.html`).
   * `privacy.html`: Legal disclosure tailored for Google Play Store policies. Disclose offline/on-device AI processing, third-party SDKs (AdMob, Play Billing), and data deletion contact (`native.espresso@gmail.com`).
   * `terms.html`: App-specific terms of service.

3. **Register on the Company Hub**:
   Open root `index.html` and add a new `<article class="project-card reveal">` inside the `.spotlight-grid` section, linking to:
   * App Page: `voice-scribe/`
   * Privacy Policy: `voice-scribe/privacy.html`
   * Terms: `voice-scribe/terms.html`

4. **Verify Contact & Links**:
   * Ensure all user-facing contact buttons and emails reference `native.espresso@gmail.com`.
   * Test relative paths for styles (`../assets/style.css`), scripts (`../assets/main.js`), and navigation links.

---

## 5. Google Play Console Integration Rules

1. **Developer Identity Verification**:
   * Google Play requires domain verification through **Google Search Console**.
   * The root verification file `googlec843c5927d99b442.html` must remain at the repository root to maintain verified ownership of `https://nativeespresso.github.io`.

2. **Public Store Listing**:
   * **Developer Email**: `native.espresso@gmail.com`
   * **Developer Website**: Use the app-specific URL (e.g., `https://nativeespresso.github.io/echo-cleaner/`) or the studio root `https://nativeespresso.github.io/`.
   * **Privacy Policy URL**: Always use the direct HTTPS link to the app's policy (e.g., `https://nativeespresso.github.io/echo-cleaner/privacy.html`).

---

## 6. Local Toolchain & Environment Runtimes

The host environment has verified access to the following runtimes in `PATH`:
* **Node.js** (`node`): Available for modern web workflows, package management, and asset pipelines.
* **Python** (`python`): Available for automation, model conversion, and data scripting.
* **FFmpeg** (`ffmpeg`): Available for audio/video manipulation, DSP testing, and codec processing.
* **Java / OpenJDK** (`java`): Available for Android Gradle builds, Kotlin scripting, and bytecode analysis.

---

## 7. Associated Source Projects [READ_ONLY]

The following local repositories contain the production source code and development assets for the applications hosted and showcased on this web portal. AI agents and developers may read, analyze, and inspect these directories for technical context, feature sets, audio/AI pipelines, and privacy compliance requirements, but **MUST NOT modify, create, or delete** any files within them from this web repository:

* `C:\Projects\Android\Trans-Title` `[READ_ONLY]`
  * **Trans-Title (Android)**: Native Android source code for on-device transcription, subtitle generation (SRT/VTT), multi-track Cross-Play orchestration, and Media3 players.
* `C:\Projects\WinUI\Trans-Title` `[READ_ONLY]`
  * **Trans-Title (Windows Desktop / WinUI 3)**: Native Windows App SDK / WinUI 3 desktop application source code for high-performance media playback, offline voice processing, and local media indexing.
* `C:\Projects\KMP\Echo-Cleaner` `[READ_ONLY]`
  * **Echo Cleaner**: Kotlin Multiplatform / Android source code for on-device neural audio enhancement, acoustic de-reverberation, and noise suppression.

> [!IMPORTANT]
> **Strict Read-Only Access**: Treat `C:\Projects\Android\Trans-Title`, `C:\Projects\WinUI\Trans-Title`, and `C:\Projects\KMP\Echo-Cleaner` strictly as read-only references (`[READ_ONLY]`). Do not run write, edit, stage, or git operations against those project paths from the `Native-Espresso` web workspace.

---

## 8. Application Lifecycle & Multi-Platform Status Matrix

Every application in the Native Espresso portfolio may support one or multiple platforms:
* **Platforms**: `Android`, `Windows`, `iOS`, `macOS`, `Linux`

Each supported platform tracks its own independent publication lifecycle status:
1. **Published**: Live, publicly available on the official store (e.g. Google Play Store, Microsoft Store, App Store).
2. **Unpublished**: In progress towards public release, categorized under distinct phases:
   * **`Planning`**: Concept, product specification, architecture design, and feasibility testing.
   * **`Development`**: Active engineering, UI implementation, and internal alpha builds.
   * **`Closed-Testing`**: Active pre-release testing under store-gated programs (e.g., Google Play Closed Testing).
   * **`Testing Queue / Beta Waitlist`**: Public invitation stage where users and visitors are recruited to join active closed testing cohorts by submitting their email.

### Current Portfolio Platform Statuses:
* **Trans-Title**:
  * `Android`: **`Closed-Testing`** (v1.0.16 active on Google Play Store)
  * `Windows (WinUI 3)`: **`Development`** (Native Windows desktop app at `C:\Projects\WinUI\Trans-Title`)
  * `iOS`: **`Planning`**
  * `macOS / Linux`: **`Planning`**
* **Echo Cleaner**:
  * `Android`: **`Testing Queue / Closed Testing Preparation`** (Finalizing for Google Play Closed Testing release)
  * `iOS`: **`Planning`**
  * `Windows / Others`: **`Planning`**

---

## 9. Modular Styling Architecture (Company vs. App-Level Themes)

To ensure the studio brand feels unified yet each app feels bespoke and prominent:
1. **Company Portal Theme (`assets/company.css`)**:
   * Has its **own authoritative styling system** distinct from individual apps.
   * Typography: Display font `"Space Grotesk"`, body font `"Plus Jakarta Sans"`, monospace `"JetBrains Mono"`.
   * Color Palette: Obsidian dark space (`#05070d`), warm espresso gold (`#f59e0b`), electric cyan (`#22d3ee`), and cobalt blue (`#4f7cff`).
   * Tailored for executive showcase: Project spotlights, platform matrices, testing queues, and engineering principles.
2. **App-Specific Styling Systems**:
   * Each app keeps its own app-like font family, color scheme, and unique visual identity:
     * **Echo Cleaner** (`assets/style.css`): Tailored for acoustic sound engineering — cyan (`#22d3ee`), electric emerald (`#a3e635`), interactive signal waveform canvas, and acoustic dB readouts.
     * **Trans-Title** (`assets/trans-title.css`): Tailored for cinematic media and creative studios — OLED black canvas (`#04060b`), vivid neon magenta (`#f43f7b`), electric cyan (`#22d3ee`), and cinema violet (`#8b5cf6`).
   * *Rule*: App styling can evolve independently whenever needed to highlight prominent features, as long as it remains cohesive and functional.

---

## 9. Strict Intellectual Property Protection (IP Cloaking Rule)

> [!CAUTION]
> **Zero Disclosure of Internal Implementation Toolsets**:
> Never reveal low-level internal toolchains, specific third-party libraries, underlying neural network model architectures, or internal extraction/JNI mechanics to the public on any website page, landing page, badge, or FAQ.

### Why This Rule Exists:
Publicly documenting our exact stack (e.g., specific open-source neural checkpoints, audio DSP libraries, and JNI bridges) gives competitors and scrapers an exact blueprint to clone our products.

### Forbidden Words in Public User-Facing Text:
* **DO NOT USE**: `FFmpeg`, `ONNX`, `ONNX Runtime`, `DeepFilterNet`, `Whisper`, `GGML`, `tiny-q5`, `base-q5`, `small-q5`, `medium-q5`, `ML Kit`, `JNI`, `16kHz PCM`, `Librosa`, `PyTorch`.

### Permitted User-Facing Proprietary Terms:
Replace all technical implementation details with benefit-driven, high-level, proprietary phrasing:
* *Instead of "FFmpeg DSP"* → **"Studio-Grade Audio Engine"** or **"Hardware-Accelerated DSP Pipeline"**
* *Instead of "DeepFilterNet + ONNX Runtime"* → **"Proprietary On-Device Neural Voice Filter"** or **"Edge Neural Denoising"**
* *Instead of "Whisper / Speech AI JNI"* → **"High-Precision On-Device Speech Recognition"** or **"Neural Transcription Engine"**
* *Instead of "Model tiers (tiny-q5, base-q5...)"* → **"Accuracy Tiers: Fair, Better, High, and Superior"**
* *Instead of "Downloading model / extracting 16kHz audio"* → **"Preparing…"**
* *Instead of "C++ / Rust / JNI"* → **"Native Hardware Acceleration"** or **"Bare-Metal Silicon Optimization"**

---

## 10. Multi-Theme Architecture (Light & Dark Mode) & Typography Tokens

The website supports instant light and dark mode switching across all 7 pages with persistent user preferences (`localStorage`) and system scheme fallback (`prefers-color-scheme`).

### Typography & Palette Mapping by Context:

| Project | Role | Font Family | Dark Mode Primary Tokens | Light Mode Primary Tokens |
| :--- | :--- | :--- | :--- | :--- |
| **Native Espresso** *(Company Hub)* | Display / Headings<br>Body Copy<br>Monospace | `"Space Grotesk"`<br>`"Plus Jakarta Sans"`<br>`"JetBrains Mono"` | Bg: `#05070D`<br>Surface: `#0A0E1A`<br>Espresso Gold: `#F59E0B`<br>Text: `#EDF2FC` | Bg: `#F8FAFC`<br>Surface: `#FFFFFF`<br>Espresso Amber: `#D97706`<br>Text: `#090D16` |
| **Trans-Title** *(Multimedia Suite)* | Wordmark<br>Headings / Titles<br>Body / Metadata<br>Readouts / Stats | `"Bree Serif"`<br>`"Plus Jakarta Sans"`<br>`"Inter"`<br>`"Share Tech Mono"` | Bg: `#0C0C0E` (OLED)<br>Surface: `#141416`<br>Primary: `#9B72E8` (Lavender)<br>Secondary: `#4FD1C5` (Teal) | Bg: `#F8F9FA`<br>Surface: `#FFFFFF`<br>Primary: `#7A45C4` (Purple)<br>Secondary: `#0E9C90` (Deep Teal) |
| **Echo Cleaner** *(Acoustic Studio)* | App Logo<br>Headings / Titles<br>Body / Controls<br>Telemetry / dB | `"Orbitron"`<br>`"Archivo"`<br>`"Manrope"`<br>`"Fira Code"` | Bg: `#0D1117`<br>Surface: `#161B22`<br>Primary: `#22D3EE` (Acoustic Cyan)<br>Noise: `#34D399` | Bg: `#F3F6F9`<br>Surface: `#FFFFFF`<br>Primary: `#0891B2` (Deep Cyan)<br>Noise: `#10B981` |

### Zero-Flash Theme Bootstrapping:
Every HTML document includes a synchronous, render-blocking `<script>` inside `<head>`:
```html
<script>(()=>{const t=localStorage.getItem("theme")||(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t)})();</script>
```
This guarantees zero flicker when loading or navigating across pages.

---

## 11. Google Play Developer Profile & Store Presence

### Developer Profile Specifications:
* **Developer Name**: Native Espresso
* **Public Account Details**:
  * Address: `Street # 16, Kajoor Wala Chonk, Sargodha, Islampura - 40100, Pakistan (PK)`
  * Phone Number: `+923087337850`
  * Developer Email: `native.espresso@gmail.com`
* **Developer Website**: `https://nativeespresso.github.io/`
* **Featured App**: `TransTitle: Translate Subtitle`
* **Promotional Text** *(Max 140 chars)*:
  * Primary: `"High-performance Android apps and on-device AI tools. 100% local processing, zero data collection, studio-grade performance."` (120 chars)

### High-Resolution Branding Assets:
Stored in `assets/branding/` for developer page upload:
1. `developer-icon.png` (512x512, 24-bit RGB PNG, non-transparent): Minimalist, iconic studio espresso cup with acoustic/neural steam curves and high-contrast typography.
2. `header-image.png` & `header-image.jpg` (4096x2304, 16:9 ratio, non-transparent): Cinematic widescreen studio banner featuring deep obsidian background, sweeping neural audio waveforms, and bold branding. Tested under 1 MB for Google Play Console compatibility.




