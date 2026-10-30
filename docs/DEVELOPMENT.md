# Development workstream

1. **Foundation:** Tauri 2 / React / TypeScript, Dark design tokens, AR/EN locale and persistence.
2. **Local engine:** Ollama loopback API, installed models, model downloads/deletions and no-model/offline/error states.
3. **Conversation flows:** create, chat, search, rename, delete, model selection, user settings.
4. **Keyboard accessibility:** visible focus, Tab navigation, Enter/Shift+Enter, Escape, modal focus trap and focus restoration.
5. **QA:** automated frontend tests, actual desktop keyboard runs, security review, Figma visual comparisons at the desktop window size.
6. **Packaging:** signed Windows and other desktop builds after runtime validation.

The UI must respect the latest approved Dark Figma screens without treating any single screen as a superior visual reference. **Light Mode is paused.**

Do not commit secrets, user conversations, proprietary font files, or bundled AI model weights.
