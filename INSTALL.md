# Install Commands — Windows

## Install the packaged extension

1. Keep Raycast installed and running.
2. Stop any existing Commands development builder. If it is running in a terminal, press Ctrl+C there. Do not restart the old Start-AI-Commands launcher for normal use.
3. Open commands-0.2.0-preview.1.rayext with Raycast and follow its import prompt. If Windows asks which app to use, choose Raycast. Import behavior depends on the installed Raycast version.
4. Search for **Commands** in Raycast. Existing provider keys and prompts use the same extension ID; this update does not intentionally delete them.
5. Open **Models & Providers**, add your API key if needed, and select the default provider and model.

The packaged slot workflow needs no Node installation, development builder, startup task, script directory or Quicklink.

## Give a prompt a global hotkey

1. Open **Commands**, select a prompt and choose **Edit AI Command**.
2. Set **Hotkey Slot** to an available entry, such as **Command 01**, then save.
3. Open **Raycast Settings → Extensions → Commands**.
4. Find **Command 01**, enable it, and assign its native hotkey or alias. Slots are disabled by default to keep main search uncluttered.
5. Select text in another application and press the hotkey. The slot runs its assigned prompt using the prompt's input and model settings.

Alternatively, enable and launch an empty slot to choose a saved prompt. Assignment itself does not send an AI request; launch the slot again to run it.

## Change a slot later

Edit its current prompt and select **None — Run from Commands** to free the slot. Assign it to another prompt. The slot's native identifier and hotkey do not change when the prompt is renamed, edited or replaced.

Deleting a prompt frees its slot. Duplicating a prompt leaves the duplicate unassigned. Resetting a built-in prompt or deleting all prompts also clears their slot assignments. Extra prompts remain available inside Commands after all 20 slots are occupied.

Native entries retain fixed names **Command 01** through **Command 20** and a common icon. Each prompt keeps its own name and icon inside Commands. Use Raycast aliases to find slots more easily. Slot-level provider/model/prompt/input overrides stay attached to the slot when reassigned; clear them to follow the assigned prompt. Configure specific provider profiles in the prompt editor; the static native provider preference offers saved/default choices.

## Development and troubleshooting

The source ZIP is for modifying the extension: extract it, run npm ci, then npm run dev. This intentionally imports a development version and can show the Development badge. Existing Start-AI-Commands launchers are development tools, not the normal installation path.

If the badge remains after importing the package, verify that the builder is stopped and check whether Raycast still has the development registration active. Do not uninstall or clear extension data just to remove a badge. Native Windows import, badge transitions and actual OS hotkeys still need desktop acceptance testing; automated tests validate slot routing and persistence.

This is a personal preview. No credentials or personal prompt definitions are included in the package.
