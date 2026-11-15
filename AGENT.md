# Native Espresso — Agent Guide & Architecture Reference

This document serves as the operational manual and architectural guide for AI agents, developers, and maintainers working on the **Native Espresso** web portal and its associated mobile application landing pages.

---

## 1. Company Identity & Philosophy

* **Company / Studio Name**: Native Espresso
* **Public / End-User Facing Email**: `native.espresso@gmail.com`
* **Official Website**: [https://nativeespresso.github.io/](https://nativeespresso.github.io/)
* **GitHub Repository**: [NativeEspresso/nativeespresso.github.io](https://github.com/NativeEspresso/nativeespresso.github.io)
* **Core Engineering Focus**:
  * **100% On-Device Processing**: Deep learning models (DeepFilterNet, Whisper/Speech AI, ONNX Runtime) and media DSP (FFmpeg, native C++/Rust kernels) execute strictly on the client device.
  * **Zero Cloud Surveillance**: No telemetry, no behavioral profiling, and no uploading user audio, video, or documents to remote servers.
  * **Native Performance**: Modern Android architecture powered by Jetpack Compose, Kotlin Coroutines, and JNI bindings for maximum efficiency and 120Hz responsiveness.

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
