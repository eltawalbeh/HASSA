# HASSA AI — هسّا

Arabic-first, local-first desktop AI assistant for Jordan. This is the **Phase 1 codebase** for the approved **Dark Desktop MVP**; the Light Mode is out of scope.

## Design reference

- [MVP Screens (Dark)](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=2-2)
- [Dark Design System](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=91-13)

The current UI is a coded first pass, **not yet a pixel-perfect reproduction** of all 31 Figma states. Use Figma variables, components, and accessibility rules as the reference for subsequent refinement.

## Tech

- React 19 + TypeScript + Vite
- Tauri 2 (Rust) for desktop packaging and local engine commands
- Ollama on `127.0.0.1:11434`, **no remote model service**
- Local conversation storage in the WebView's `localStorage` (not encrypted; replace with an encrypted desktop store before sensitive production use)

## Requirements

- Node.js 20+ and npm
- Rust stable toolchain + platform-specific Tauri prerequisites
- [Ollama](https://ollama.com/) installed on the user's machine

## Run

```bash
npm install
npm run verify
npm run tauri dev
```

On Windows, Ollama normally starts automatically after installation. Ensure it is running first (`ollama list`). For a browser-only UI preview, use `npm run dev`. Browser requests to Ollama may require its origin configuration; Tauri commands avoid that browser CORS dependency. To download the starter model manually:

```bash
ollama pull qwen3:4b
```

## What is included

- Dark desktop shell, Arabic RTL / English LTR switcher
- Conversation list, local history, rename and deletion
- Installed model detection, model download progress, model removal
- Local chat with Ollama, disconnected and no-model fallback states
- Visible focus, modal focus trap, Escape, Enter-to-send and Shift+Enter newline

## Security, privacy and next work

- Desktop API calls are restricted in Rust code to loopback Ollama. Verify this in a security review before release.
- This starter **does not** bundle Ollama or any model; both must be present locally.
- Conversations currently use localStorage without encryption or OS-level secure storage.
- Basic CI workflow is present (TypeScript, unit tests, frontend build, Rust compile check). No passing CI status is claimed until GitHub Actions executes. No app signing, installer, auto-updates, WCAG runtime certification, or full 31-screen visual parity is claimed.
- First follow-up: complete visual parity and explicit interaction tests with Playwright/webdriver + manual desktop keyboard testing.
- Do not enable Light Mode in this development phase.

## License

No public license has been selected yet; repository is private during development. Decide the license before a public release.

## HASSA identity (v0.2)

`src/lib/persona.ts` defines the HASSA brand personality: an Arabic-first Jordanian product using **existing locally served models**, not a foundation model trained from scratch. Each `/api/chat` request prepends a `system` role with these instructions, independent of the installed model. History in localStorage contains only user and assistant turns; the system instructions are supplied at request time. Prompts steer behavior but do not guarantee dialect or factual accuracy, and do not alter model weights.

Assistant messages now render a safe subset of Markdown, and installed Qwen3 4B is no longer shown as a model waiting to download. A first-pass desktop layout adjustment uses the Figma 312px sidebar and 88px header. Full visual parity with Figma is still a separate implementation/QA milestone.

**Data note:** history is currently stored in the browser/WebView localStorage (not encrypted). Inference calls target local Ollama at `127.0.0.1:11434`; model downloads require internet. Don't place sensitive information in chat until storage hardening is complete.

## Project structure and validation

See [Architecture](docs/ARCHITECTURE.md) and [Quality Gates](docs/QUALITY_GATES.md). Run `npm run verify` before changes are merged. GitHub Actions reruns these checks and a Rust `cargo check`. Windows package validation comes later.
