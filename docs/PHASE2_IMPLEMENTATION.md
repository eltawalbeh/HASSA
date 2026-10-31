# Phase 2 — Dark UI implementation

Source of truth: [Dark MVP Screens](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=2-2), [Dark Design System](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=91-13).

## Implemented in first Phase 2 code milestone
- Approved HASSA official wordmark exported from Screen 12 as SVG (no proprietary fonts included).
- Official HASSA icon exported from the approved design for Tauri resources.
- Semantic CSS Dark variables matched against HASSA / Semantic Colors, including surface, brand, text, stroke, states, and focus.
- Desktop shell: 312px sidebar, 88px header; model selector, status and accessible search.
- Chat empty state: official logo, approved welcome copy, three 300×74-style prompts and aligned 950px composer.
- Chat populated state: user/assistant cards, copper assistant role, model response Markdown and accessible focus indicators.
- Model Manager and Settings: centered 824px content and component dimensions aligned to Dark MVP.
- Original Ollama flows and local conversation history retained.
- Rust fixes: Tauri app icon + Progress: Clone for event emission.

## Still to implement / verify
- Full fidelity of the 31 approved Figma screens and states, especially dialogs, onboarding, download states and localized variants.
- Exact font availability on the user's Windows machine; system fallback is intentional until legal font asset provision.
- Runtime visual screenshot comparison at 1440×900, actual user desktop interactions, keyboard and modal focus after installation.
- Mobile/Light Mode intentionally not part of this Desktop MVP.

CI validates TypeScript/tests/frontend and Rust compilation. Passing CI does not prove pixel-level visual parity or Windows packaging.
