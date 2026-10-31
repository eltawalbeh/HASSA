# HASSA — Jordanian identity and UI implementation

**Status (31 October 2026):** The user has demonstrated Ollama + Qwen3:4b working in the local browser development starter. The newer desktop starter source (v0.2) is supplied separately as a ZIP and has not yet been synced into this repository. Do not claim that this repository itself currently builds.

## Why we do not train a model from scratch
HASSA is a Jordanian *product identity* built around existing on-device language models. The MVP sends an identity prompt with role `system` before every Ollama chat request:
- name HASSA / هسّا; Jordanian Arabic-first, honest about being local AI;
- use natural Jordanian dialect in casual Arabic, formal Arabic for formal work, and respond in English when requested;
- avoid fabricating current Jordanian facts and do not claim browsing or external tool access;
- preserve user message history separately; system prompt is added at request time.

A future curated Jordan knowledge layer (retrieval/RAG) can supply dated sources; training/fine-tuning from scratch is **not** an MVP dependency.

## Figma fidelity
- [Dark MVP Screens](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=2-2)
- [Dark Design System](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=91-13)
- Starter v0.2 begins desktop layout proportions (312px sidebar, 88px header), persona and Markdown responses.
- Exact branding/assets, all screen/states visual parity, accessible Windows keyboard test, and desktop packaging still require implementation and validation.
- Light Mode is paused.

## Synchronization
The v0.2 ZIP includes `Sync-To-GitHub.ps1` to clone this private repo and push source from the extracted starter when run on the owner's Windows machine with Git for Windows and GitHub authentication. Existing conversation data lives in browser/WebView localStorage; source commits do not include it.

## Security
No secrets, proprietary font files or downloaded model weights should be committed. Ollama downloads require initial internet; inference is local via the loopback API. The MVP conversation storage is **not encrypted**.
