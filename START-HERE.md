# Commands

Follow [INSTALL.md](INSTALL.md) for Windows installation and native hotkey setup.

Version 0.2 replaces runtime generation of native entries with 20 predefined optional slots. Assign a saved prompt through its **Hotkey Slot** field, then enable that entry and set its alias/hotkey in Raycast Settings. Runtime edits and slot assignments use extension storage and need no compiler or running development builder.

The three built-in writing commands keep their original native entries. Existing saved prompts, provider profiles, keys and chat data retain their storage identifiers. Legacy generated source entries and script helpers remain in the local source for compatibility; new saves no longer generate them.

Slot names and icons are fixed. Prompts inside Commands retain custom names and icons. Native overrides belong to the slot and follow it through reassignment. Raycast's built-in AI settings page remains separate.

Developers: npm ci, npm test, npm run build. Use npm run dev only when modifying source. Release staging excludes personal generated entries and provider IDs.
