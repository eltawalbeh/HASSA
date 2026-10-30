# HASSA AI — هسّا

An **Arabic-first, local-first desktop AI assistant**, developed for a free Jordanian public product. The first release is **desktop-first** and uses the approved **Dark Mode**.

## Source of truth

- [Approved Dark MVP screens](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=2-2)
- [Dark Design System & components](https://www.figma.com/design/9hILsRoBweXX8t5gGpzKPm?node-id=91-13)

## Planned MVP

- Arabic RTL and English LTR interface
- Local chat powered by Ollama/on-device models
- Install and manage supported models
- Local conversation history, search, rename and deletion
- Clear engine-disconnected and no-model states
- Accessible keyboard controls, focus states, and modal focus management
- No remote inference service and no cloud account requirement

## Architecture direction

React + TypeScript + Vite for the interface; Tauri 2 + Rust for desktop packaging and safe loopback communication with Ollama. Target platform and distribution packaging will be verified in development.

**Current status:** repository initialized. Initial desktop starter source is being validated separately before the first code commit; the project is not yet a production-ready build.

**Out of scope for this phase:** Light Mode, mobile breakpoints, cloud inference, and online account functionality.

## License

To be decided before publishing the repository or distributing the application publicly.
