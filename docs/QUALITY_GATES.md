# HASSA Phase 1 completion gates

| Gate | Automated command | Acceptance |
|---|---|---|
| TypeScript strict type-check | `npm run check` | Exit 0 |
| Unit tests (persona, storage, NDJSON) | `npm test` | All pass |
| Frontend production bundle | `npm run build` | Exit 0, dist generated |
| Rust bridge compilation | `cd src-tauri && cargo check` | Exit 0 on machine with Tauri prerequisites |
| GitHub CI | `.github/workflows/ci.yml` | Frontend + Rust jobs green |
| Secrets and artifacts | `git status`, ignore rules | No secrets, model weights, node_modules or dist committed |
| Browser preview sanity | `npm run dev`, Ollama running | Can connect and ask Qwen3:4b |

Local CLI test results do not establish Windows installer build. If any gate cannot run, record it as unverified; do not report a full pass.

## Manual smoke QA

- Start Ollama and verify `ollama list` includes a model.
- In browser preview, test disconnected/connected and no-model state, install model and chat.
- Verify conversation history persists within the same profile, rename/delete confirmations, AR/EN switching.
- Use Tab/Shift+Tab, Enter, Shift+Enter and Escape for dialog and composer controls. Keyboard behavior must also be retested in the actual Tauri Windows window in later Phase 5.

## Windows prerequisites

Node 22 LTS, npm, Rust stable, MSVC Build Tools / C++ workload, WebView2 Runtime, Tauri dependencies and Ollama installed. Ollama typically runs its Windows service from the tray; a separate `ollama serve` is not required if already running.
