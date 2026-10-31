# HASSA Phase 2.4 — Dark Desktop QA checkpoint

Figma source: https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=2-2
Scope: 31 approved Dark Mode MVP screens/states. One state is not necessarily a separate app route. **Awaiting visual approval on running desktop application.**

## Phase 2.2 — Visual implementation
- Original Figma HASSA logo, semantic Dark colors, 312px sidebar, 88px header, 950px composer, 824px page content, 520px dialogs.
- Arabic RTL and English LTR, focus/hover/pressed/disabled states, keyboard modal.
- Matching components for chat, model manager, history, privacy, settings, about and onboarding.
- Automated build success is NOT pixel-fidelity validation. Desktop 1440×900 screenshot comparison still requires visual user review.

## Phase 2.3 — 31-state mapping
| Screen | State | Code coverage |
|---|---|---|
| 01 | Welcome | Implemented |
| 02 | Model setup | Implemented/manual |
| 03 | Trial chat | Implemented |
| 04 | Device check | Partial: no automatic hardware probe |
| 05 | Download progress | Implemented |
| 06 | Setup complete | Implemented |
| 07 | Model manager | Implemented |
| 08 | Delete model dialog | Implemented |
| 09 | General settings | Implemented |
| 10 | AI response style | Implemented, wired to model instructions and temperature |
| 11 | Privacy & data | Implemented |
| 12 | Empty chat | Implemented |
| 13 | Generating/Stop | Implemented, aborts request |
| 14 | Engine disconnected | Implemented |
| 15 | History search | Implemented |
| 16 | Rename chat | Implemented |
| 17 | No search results | Implemented |
| 18 | Download error | Implemented |
| 19 | Low resource recommendation | Partial: manually select smaller model |
| 20 | About | Implemented |
| 22 | English LTR | Implemented |
| 23 | Clear all conversations dialog | Implemented |
| 24 | Export prepared | Implemented; save location needs user verification |
| 25 | Keyboard shortcuts | Implemented |
| 26 | No model | Implemented |
| 27 | Update available | Deferred: no real update engine; avoid fake updates |
| 28 | Delete one conversation | Implemented |
| 29 | Conversation action menu | Implemented |
| 30 | Disk space insufficient | Implemented conditional on Ollama error |
| 31 | Starting state | Implemented |
| 32 | Cancel download | Implemented; native cancellation waits for next download chunk |

## Phase 2.4 — QA acceptance requirements
1. Latest GitHub checks: TypeScript, unit/UI-state tests, Vite build and Tauri Rust check — must all pass.
2. Manual visual desktop comparison at 1440x900 for empty and active chat, models, history, settings and dialogs.
3. Test real Ollama send/stop, model download/cancel/delete, local conversation search/rename/delete/export and keyboard Tab/Escape/Enter/Shift+Enter.
4. Check Arabic and English and real font rendering on Windows.
5. Log all Figma mismatches. Phase 2.4 does not pass until user approves those screens.

**Out of scope:** Light Mode, mobile responsive, auto hardware profiling, automatic updater, signed Windows installer. Do not claim these exist.

**Data disclaimer:** current conversations are saved locally in browser/WebView storage, not end-to-end encrypted. The app does not upload chat content to a HASSA cloud service, but system integrations and future releases must be re-evaluated.
