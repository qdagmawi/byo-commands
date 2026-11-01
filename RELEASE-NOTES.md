# Release notes — 0.3.0-preview.1

- Add Explainer, Rewriter, Explain This in Simple Terms, Ask About Webpage, Critique & Counterarguments and Synthesize & Connect as defaults with named native entries.
- Replace the unchanged stock Summarize Webpage prompt with the supplied structured summary. Preserve user-edited prompts and provider/model choices.
- New supplied defaults inherit the current default provider/model and use original icons on a shared teal tile.
- Resolve selected text, named question arguments and webpage title/URL/Markdown placeholders before sending. Insert values once, without recursive template interpretation.
- Ask for a question when required. Browser capture uses one identified active tab; unavailable or ambiguous capture offers a manual page-content form. Windows currently needs this fallback.
- Keep 20 optional slots for custom prompts, with automatic first-free-slot assignment.
- Distribute a prebuilt Windows folder ZIP. No running builder is required. Local imports may still carry Raycast's Development badge.

No full Raycast Dynamic Placeholders engine is claimed; supported syntax is documented in PROMPT-TEMPLATES.md. Real browser capture on Windows is not claimed. Native OS hotkeys and full desktop import remain acceptance checks.
