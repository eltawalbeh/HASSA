# HASSA Dark Design implementation roadmap

Design source: https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=2-2
Library: https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=91-13

## Already implemented in Starter v0.2
- Working Chat/Ollama flow; local model list and download/delete.
- Dark palette, desktop proportion foundation (Sidebar 312px, Header 88px).
- Assistant persona through Ollama system messages; Arabic-first behavior.
- Safe basic Markdown for assistant answers; new chat, history, rename/delete, settings.
- Keyboard basics: Enter send, Shift+Enter newline, Escape modal, focus trap.

## Pending source-of-truth visual parity
- Export/recreate exact HASSA logo from Figma component, not the placeholder letterform.
- Map semantic color variables, fonts, tokens, icons and spacing from current Figma master components.
- Compare each Dark MVP view/state at the approved desktop viewport and fix the layout deltas.
- Onboarding, install progress, model-specific errors, empty states, dialogs and local storage details.
- Run keyboard and screen-reader tests in a real Windows packaged build.
- Desktop installer and offline first-run instructions.

## Deliberate exclusions
No Light Mode and no mobile redesign. Noor Bold remains a design experiment; no proprietary fonts bundled.

## Local model customization levels
1. System Prompt (implemented): identity, language, style and honesty. Applies to messages without changing weights.
2. Knowledge / RAG (future): curated, dated sources on Jordan, with attribution and retrieval. Needs accuracy and update controls.
3. Optional fine-tuning (future only after data, licensing, evaluation and device budget). Training from scratch is out of scope.
