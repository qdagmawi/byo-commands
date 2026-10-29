# Implementation audit — 29 October 2026

## Sources checked

- [Script Commands](https://manual.raycast.com/script-commands) and [metadata](https://github.com/raycast/script-commands#metadata): Windows platform, interpreters, icons and directory indexing.
- [Environment API](https://developers.raycast.com/api-reference/environment): packaged assets versus writable support data.
- [Storage](https://developers.raycast.com/api-reference/storage): encrypted local storage shared by extension commands.
- [Deeplinks](https://developers.raycast.com/information/lifecycle/deeplinks): launch URLs and context. Raycast may show its own confirmation for a deeplink.
- [Hotkeys](https://manual.raycast.com/command-aliases-and-hotkeys): recording global shortcuts belongs to registered Raycast entries.
- [Gemini default-model picker](https://github.com/raycast/extensions/blob/main/extensions/raycast-gemini/src/setDefaultModel.tsx): model discovery, default indicator and error states.
- [ChatGPT extension](https://github.com/raycast/extensions/tree/main/extensions/chatgpt): saved-command configuration, inheritance, selected-text input and Quicklinks.
- [Google compatibility endpoint](https://ai.google.dev/gemini-api/docs/openai): Gemini key, endpoint and model ID must match.

The stock ChatGPT extension uses Quicklinks. Our generated Script Commands combine documented scripts and deeplinks; this integration is custom, not native Raycast Commands.

## Fixed

1. Parallel recursive icon copies reproduced the exact ENOENT/unlink failure. Output now uses a filesystem lock, immutable versioned icon files, unique temporary script files and atomic replacement. Transient Windows file locks receive bounded retries.
2. Launcher generation rereads the latest saved commands after locking. Stable filenames preserve command identity; unrelated scripts are untouched.
3. Model saves no longer regenerate command launchers unnecessarily.
4. Provider and catalog writes are locked across workers. Model refresh preserves newer preferences and ignores responses from a changed endpoint.
5. HTTP providers previously received an HTTPS agent from legacy settings. Transport now follows the selected provider endpoint. The native test failed before this fix and passes afterward.
6. Built-ins still using the original unassigned OpenAI model follow the configured default. Prompts and explicit provider/model choices are retained.
7. Setup failures show Retry instead of continuing with success instructions. Model discovery reports its underlying connection error.
8. Provider/model lists have stable item IDs and selection state.

## Verification

71 tests pass, zero skipped, through the installed Windows Raycast JavaScript runtime with fake credentials, isolated storage, temporary directories and local mock servers. Coverage includes command creation/editing and custom icons, model inheritance, default-provider request routing, follow-up chats, conversation import/storage, credential separation, concurrent provider writes, concurrent launcher saves, and two simultaneous native setup screens.

Compilation and executable-path checks pass. Native setup tests verify Windows metadata, owner/extension identity, and every generated icon reference. Three launchers in the reported production folder were repaired while preserving their IDs and filenames. This repair did not read or change saved prompts or API keys.

## Remaining acceptance checks and limits

| Feature | Status |
|---|---|
| Script directory registration | One-time native settings step. No documented extension API was found to automate registration. |
| Global hotkeys | Assigned through Raycast's recorder on indexed Script Commands. No documented API was found for an in-extension global recorder. |
| Real hotkey activation and search indexing | Needs live desktop verification after directory registration. Native bridge tests do not exercise the launcher UI or OS hotkeys. |
| Selection through script/deeplink handoff | Tested with selection fixtures; actual app focus and possible confirmation still need live verification. |
| Real Gemini authentication/quota | No request using the user's real key was made. Routing is covered with mock APIs. |
| Vision and webpage context | Inherited upstream functionality; full live image/browser workflows were not verified in this audit. |
| Model capabilities | Controls are manual. A model appearing in discovery does not guarantee chat, vision, temperature or reasoning support. |
| Anthropic native Messages API | Not implemented. Transport is OpenAI-compatible, including Gemini's compatibility endpoint. |
| Full native AI parity | Memory, agents/tools, dynamic placeholders, tags and automatic replace-selection output remain outside this milestone. |
| Public release | Not established. Upstream dependency findings and locally sourced Raycast artwork need review before redistribution. |

Compilation and bridge tests do not prove OS hotkeys or foreground focus behavior. Those remaining checks are explicitly not marked verified.

## Settings/native entry update

A dedicated Commands Settings command opens Commands and Models & Providers directly. Built-in grammar, writing, and webpage-summary prompts now also have static manifest entries; their hotkeys are configured normally in Raycast without script registration. Runtime tests cover Settings navigation and the native grammar request path. Arbitrary saved prompts still cannot be registered dynamically using the documented API. The optional script route remains explicitly labeled as a workaround. The management screens are an extension-owned Settings hub, not custom panes embedded in Raycast’s global Settings.

## Expandable per-command Settings correction

The separate Settings command and links were removed. The existing Summarize Website command already demonstrated the correct mechanism: manifest-level command preferences. Every saved custom prompt now generates a stable native entry and its own preference definitions. Raycast provides native enabled/alias/hotkey controls for the registered entry. A local running development process is required to rebuild and import manifest changes. This is not Store-compatible dynamic registration and does not inject controls into Raycast's built-in AI category.

Native preferences override the saved prompt/model/provider/temperature/input when set; otherwise the saved command configuration remains effective. A pure filesystem test covers generated identities, updates and removals. Native runtime tests cover preference overrides reaching the request. Real OS hotkey activation and live app focus remain unverified.

## Provider-neutral cleanup

Shared settings no longer expose the inherited global OpenAI key/endpoint, Azure, or separate GPT vision-model fields. Current connection details belong to Models & Providers profiles. Standard Gemini/OpenAI forms show endpoint overrides only under Advanced; compatible/local forms show the endpoint directly. Existing encrypted provider profiles and credentials were not removed or rewritten by this cleanup.

The inherited chat tools are labeled Chat with AI and Chat Presets, with consistent preset terminology. New presets use the configured default connection/model. Prompt templates are named generically. Image questions follow the shared default model, use a valid image MIME type and no longer display GPT-specific price estimates. The unused legacy client hook and pricing helper/dependency were removed. Network proxy controls remain shared because they apply to every provider.
