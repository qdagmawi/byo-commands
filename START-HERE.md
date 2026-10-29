# Commands — local Windows fork

## Custom commands and expandable settings

Open **Create AI Command** or **Commands** to create/edit a saved prompt. Each save generates a real command entry in this local extension's manifest and source. The running development process rebuilds and refreshes Raycast's registered commands.

In **Raycast Settings → Extensions → Commands**, expand/select the individual command just as you do with **Summarize Website**. Raycast owns its enable checkbox, alias, and hotkey controls. Command-specific preferences include:

- Provider override
- Prompt override
- Model ID override
- Temperature override
- Input source

Blank overrides / **Use Saved Command** follow the configuration in **Edit AI Command**. Nonblank native Settings overrides take precedence. Name, icon, model inheritance, vision and reasoning can be edited in the command form. Saving a rename retains the generated command name so Raycast can retain its native shortcut identity.

No separate Settings command or per-command Quicklink/script-folder setup is needed for this local native-entry workflow. Earlier script launchers are retained only for compatibility with any shortcuts already assigned to them.

## Keep the local build running

This is a personal local-development integration, not a public dynamic-registration API. Keep `npm run dev` running in this folder. After saving a command, allow the rebuild/import to complete before looking for its new entry. Moving the source folder requires updating the local integration path in src/utils/native-sync.ts.

The source generator writes only this project's generated command files and manifest, using a lock and stable hashed IDs. It does not write to Raycast's private settings database. Prompt text and API keys are not embedded in generated source files.

## Providers and models

1. Open **Models & Providers** and add your Gemini or OpenAI-compatible connection.
2. Save, choose a model and press Enter to set the default.
3. New commands inherit Default unless you choose an independent configuration.
4. Existing commands with explicit model/provider choices retain them. Untouched built-ins follow your configured default.

Keys are kept separately in Raycast's encrypted LocalStorage, not in generated command files or model exports. Saving a provider refreshes available provider choices in the generated native command preferences.

## Validation and limits

Use `npm run build`, `npm run check-install`, `npm test`, and `npm run lint`.

Native-runtime tests exercise provider routing, command preferences, command execution and generated-entry identity with fake credentials/local mock APIs. Actual global hotkey activation, focus handoff and live Gemini requests using your key remain desktop acceptance checks. The existing native AI Commands page under Raycast's own AI category remains a separate product feature; our command entries appear under this extension.

Native Anthropic Messages transport, model capability discovery, advanced native AI parity and public release readiness are outside this implementation. See FEATURE-AUDIT.md for the earlier audit and limitations.

## Result view

Command results use Raycast's native Detail view with the answer as the content. Command/model SVG headings and the decorative footer are removed. The command name appears only in the navigation bar. Copy, Paste, Cancel and Continue in Chat remain in the action menu. Original input is available through View Original Input when enabled; it no longer appears above the answer. Copy Model ID keeps model information available without a footer. Windows Continue in Chat uses Ctrl+J.
