# Validation — 0.2.0-preview.1

- 84 automated tests passed, zero failures and zero skipped tests.
- Native-runtime checks execute with the installed Windows Raycast JavaScript runtime, isolated storage, fake credentials and local HTTP fixtures.
- New coverage: fixed slot manifest, assignment persistence, slot conflicts, deletion and reuse, legacy prompt migration, native overrides, empty-slot assignment, renamed prompts and duplicate behavior.
- TypeScript build passed. Lint completed with zero errors and 12 existing warnings.
- Distribution checks verify 20 predefined slots, compiled executables, sanitized provider choices and exclusion of personal generated entries and machine-path markers. Debug source maps are omitted from the release.
- Slot assignment and command/provider saves no longer invoke source generation, script synchronization or the development builder.
- Desktop package import, Development badge transition, actual OS hotkeys and foreground-selection handoff across real applications remain unverified.
- Prior dependency audit: 8 unresolved findings (2 low, 2 moderate, 4 high). Dependencies were not upgraded in this change.
- No personal keys, provider profiles or custom prompt definitions are included in the release. Existing storage identifiers are retained.
