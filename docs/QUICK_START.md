# HASSA Desktop Starter v0.2

## Current setup (Windows + VS Code)

1. Unzip the HASSA v0.2 archive to a NEW folder, without deleting your previous working starter.
2. Open the extracted `HASSA-Desktop-Starter` folder in VS Code.
3. In its Terminal, run **one command:** `powershell -ExecutionPolicy Bypass -File .\Develop-And-Sync.ps1`. This installs dependencies, tests, builds, syncs to your private GitHub repository, then launches the Vite development UI.
4. Open the localhost address from Vite, then create a new chat while Ollama is running and Qwen3:4b is installed.

Git for Windows and GitHub sign-in may be required on your first sync. If a test/build fails, the script stops without publishing.

## What changed

- Local HASSA persona using Ollama's `system` role for **every new chat request**. Existing user/assistant message history remains intact.
- The model remains Qwen3:4b; this is **not fine-tuning or training a foundation model**.
- Render assistant answers with basic safe Markdown: paragraphs, headings, bullets, ordered lists, bold, italics, inline links, fenced code blocks.
- Do not show the suggested model card if Qwen3:4b is already installed.
- Progress fill direction now follows the numeric percentage in RTL interfaces.
- Desktop shell width refinements closer to Figma (312px sidebar, 88px header).

## Verification limits

Identity message construction and TS/TSX syntax are verified in this environment. A complete React/Tauri build and Ollama end-to-end test on Windows still need verification on your computer. Do not distribute as a signed production installer yet.
