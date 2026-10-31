# HASSA architecture — Phase 1

## System boundaries

- **UI:** `src/App.tsx`, `src/components/` and `src/styles.css`. React 19 / TypeScript / Vite. Desktop-first, Arabic RTL, English LTR. This is a functional starter; Figma parity is Phase 2.
- **Engine adapter:** `src/lib/ollama.ts` exposes `checkEngine`, `listModels`, `sendChat`, `pullModel` and `deleteModel`. Desktop implementation invokes Tauri Rust commands, while browser preview talks to the user's loopback Ollama API. Do not let React pages call Ollama directly.
- **Streaming protocol:** `src/lib/ollamaStream.ts` handles partial NDJSON/UTF-8 download events and errors.
- **Desktop Rust bridge:** `src-tauri/src/lib.rs` has an allowlisted command surface that targets `http://127.0.0.1:11434`. Requests do not target an external inference provider. This does not make the localhost API a security boundary; Ollama must be run with appropriate user permissions and origin settings.
- **Product identity:** `src/lib/persona.ts`. Appends a `system` message to each local Ollama chat request; it is not a newly trained model.
- **Storage:** `src/lib/storage.ts` validates stored preferences/history before rendering. Uses WebView/browser `localStorage`, **not encrypted**. Never promise encryption, safe storage for secrets, or continuity between browser and Tauri WebView.
- **Types and localization:** `src/types.ts`, `src/i18n.ts`.

## Data flow

1. User message is appended to local history.
2. Persona instruction is prepended to the request only.
3. Engine adapter routes to Tauri `invoke` (desktop) or loopback HTTP (browser preview).
4. Ollama runs a locally installed model and returns the text.
5. UI displays result and persists message history locally.

## Failure boundaries

- `checkEngine` exposes connected/disconnected status and text error.
- Invalid model and HTTP errors become `EngineError` or Tauri command rejection.
- Model download NDJSON may arrive in arbitrary chunks; never assume a network chunk is one JSON message.
- A failed response must not insert fake assistant content. A retry is a new action.

## Security and privacy limits

- Do not commit `.env`, model weights, proprietary fonts, conversation history, tokens or build directories.
- Browser-preview CORS depends on local Ollama configuration; Tauri uses a Rust-side loopback bridge.
- Model download requires internet. Local inference does not inherently imply offline updates or secure chat storage.
- Current data is stored unencrypted; encryption and migration are separate security hardening work.
- Validate Rust command surface and CSP in the Windows packaging milestone.

## Deferred out of Phase 1

Full Figma visual parity, light mode, responsive mobile views, dynamic user knowledge/RAG, Windows signing/distribution and runtime keyboard accessibility certification.
