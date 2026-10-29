# Release notes — 0.2.1-preview.1

- Automatically assign the first free slot on save; full capacity saves the prompt without displacing existing assignments.
- Replace unsupported public Windows .rayext installation with a prebuilt directory ZIP. The local Development badge may remain; no builder is required.
- 20 predefined native slots replace source/manifest regeneration during command saves.
- Assign, release or reassign slots in the prompt editor without a development builder.
- Each slot has native enabled state, aliases, hotkeys and preferences. Native names/icons are fixed.
- Existing prompts are preserved and start unassigned. Duplicate prompts do not inherit slots.
- Gemini, OpenAI and compatible/local provider profiles, model discovery, manual IDs and inheritance remain available.
- Specific provider selection stays in the prompt editor; static native preferences offer saved/default providers.
- Clean result views, copy/paste and continuation into chat remain available.

Limitations: 20 slots; extra prompts run from Commands. Native slot names/icons do not follow prompt names/icons. Native overrides persist through reassignment. A persistent bottom composer and native Anthropic Messages transport are not implemented. No startup service is needed. This is not full native Raycast AI parity. Package import, badge changes and actual OS hotkeys still need desktop acceptance testing.
