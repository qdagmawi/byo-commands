# Commands 0.1.0-preview.1 — Windows

## Which package to use

**Source ZIP — recommended for the full local workflow.** Extract it to a permanent folder and double-click Start-AI-Commands.cmd. Node.js 22.22.2+ and npm are required. The launcher installs locked dependencies on first use and starts the local Raycast builder in the background. Logs are stored in .runtime beside the launcher. The process-only PowerShell policy flag in the CMD launcher does not change the computer's execution-policy setting.

Keeping that builder running allows new saved prompts to become native command entries with enabled state, aliases, hotkeys, and expandable per-command settings. Restart the launcher after signing back into Windows; this preview does not install a startup task or service. Paths are configured automatically for the folder you extract to.

**.rayext — direct-install snapshot.** Open it with Raycast, or use Raycast's extension import UI. It contains compiled code, icons, the three built-in commands, and command/provider management. No Node.js installation is needed just to run that snapshot. Saved custom prompts remain runnable inside Commands, but automatically adding their own native Settings entries requires the source package and its running builder. Installing the snapshot alone does not include a background compiler.

## Set up AI

1. Open Models & Providers.
2. Add your own Gemini, OpenAI, or compatible/local connection.
3. Select a default model.
4. Create a command or use the built-in writing commands.

No credentials, personal command definitions, chat history or provider profiles are included. Installing on a new machine starts with clean extension storage. Existing extension data is managed by Raycast; this package does not import or delete it.

## Scope

This is a personal Windows preview, not a Raycast Store publication. The built-in Raycast AI settings page is a separate feature. Extension commands appear under this extension's own native settings. Real OS hotkey activation and foreground-selection behavior still depend on Raycast and the active application. See RELEASE-NOTES.md and VALIDATION.md for limitations and checks.

To use the source version from a terminal, run npm ci followed by npm run dev. The pinned SDK is kept for compatibility; the .rayext is packaged separately using the current official bundle tool.
