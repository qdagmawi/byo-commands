# Release notes — 0.1.0-preview.1

- Custom commands with provider/model inheritance and per-command overrides.
- Gemini, OpenAI and compatible/local provider profiles with model discovery and manual IDs.
- Native entries generated for new commands in local source mode.
- Expandable native command preferences, aliases, enabled state and hotkeys.
- Clean native result views, copy/paste actions and continuation into chat.
- Provider-neutral settings and chat presets; shared defaults for image requests.
- Portable source launcher; no fixed user-directory paths in distributed code.

Known limitations: direct-install snapshots do not dynamically add native entries without the local source builder. A persistent bottom-of-window composer is not exposed by the extension Detail API and is not implemented. Native Anthropic Messages transport is not implemented. No auto-start service is installed. This preview is not a claim of full native Raycast AI parity.
