# Install Commands on Windows

## Install the prebuilt folder

1. Download commands-0.3.0-preview.1-windows.zip and select **Extract All** in Windows.
2. Put the extracted **Commands** folder somewhere permanent, for example Documents\Commands. That folder contains package.json, compiled .js files and assets. Do not select the ZIP itself.
3. Keep Raycast running. Stop any old Commands development builder; press Ctrl+C in its terminal. Do not launch Start-AI-Commands for normal use.
4. In Raycast search, run **Import Extension**.
5. In the folder picker, choose the extracted **Commands** folder containing package.json, then confirm.
6. Search for **Commands**. Open **Models & Providers** to add a key if needed and choose your default provider/model. The extension ID is unchanged, so existing prompts and provider data stay associated with it.

There is no npm install, build command or continuously running development process. The Windows ZIP already contains compiled executables and their runtime dependencies.

## Why the ZIP replaces .rayext

The installed public Windows Raycast 2.9 build explicitly rejects bundle-file imports with “Extension bundles are only available in internal builds.” Its importer accepts directories. Opening a .rayext file with Raycast does not establish that it was imported. The earlier .rayext instructions were incorrect for this build.

Raycast classifies local folder imports as development extensions. **The Development badge can remain even with no builder running.** This package does not bypass that classification or modify Raycast. Store distribution is a separate workflow.

## Included defaults

Explainer, Rewriter, Explain This in Simple Terms, Ask About Webpage, Summarize Webpage, Critique & Counterarguments, and Synthesize & Connect are included, alongside Fix Spelling and Grammar and Improve Writing. Set their hotkeys directly on their named native entries in Raycast Settings. The seven supplied prompts inherit the default provider/model. Existing edited prompts are preserved; only the unchanged legacy webpage-summary prompt is upgraded.

Ask About Webpage asks for your question before sending. Browser placeholders use captured metadata when the browser API is available; otherwise a form accepts pasted page content, title and URL. On Windows, expect that paste fallback. See PROMPT-TEMPLATES.md for supported syntax.

## Automatic slots and hotkeys

1. Create a custom prompt in **Commands**. Leave **Hotkey Slot** at **Automatic — First Available Slot**.
2. Save. The first free slot is assigned at save time, and its number appears beside the prompt in Commands. Duplicates also receive their own free slots.
3. Open **Raycast Settings → Extensions → Commands**, find the assigned **Command 01–20**, enable it, and set its hotkey or alias. Slots start disabled to keep main search uncluttered; assigning a prompt does not itself enable the native entry.
4. Select text in another application and press the hotkey. The slot runs its saved prompt with its current provider/model and input settings.

When all 20 slots are occupied, new prompts still save and run inside Commands. Existing assignments never get displaced. Deleting or unassigning a prompt frees its slot for the next automatic save. Choose **None — Run from Commands** to deliberately leave a prompt unassigned. Existing unassigned custom prompts receive a slot when edited and saved with Automatic. All built-in defaults have named native entries and do not need slots.

Native names and icons stay fixed. Prompt names/icons inside Commands remain customizable. Renaming a prompt preserves its slot; native overrides and hotkeys belong to the slot and follow it through reassignment. Clear native overrides to follow the newly assigned prompt. Specific provider profiles are selected in the prompt editor; static native provider preferences offer saved/default choices.

## Troubleshooting

- If you see “Missing executable,” confirm you imported the folder from the **windows.zip**, not the unbuilt source ZIP.
- If a slot is absent from main search, enable it in Raycast Settings.
- Do not uninstall with data removal to clear the Development badge. Local import classification does not prevent normal command execution.
- The source ZIP and Start-AI-Commands launchers are for developers. They are not required for the prebuilt installation.

The installed import-path validator was checked directly and accepts the directory route. Full import UI completion and OS hotkeys still require desktop verification. No private keys or personal prompt definitions are included.
