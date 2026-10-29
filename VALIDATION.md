# Validation — 0.2.1-preview.1

- 86 automated tests passed, zero failures or skipped tests, including native Windows Raycast runtime checks with fake credentials and local HTTP fixtures.
- An expanded run with the prebuilt-package check passed 86 of 87 tests; one existing multi-turn chat test timed out. Both that test and the prebuilt-package check passed on the focused retry. The timeout remains a test-stability limitation, not a clean 87-test suite claim.
- Automatic allocation covers first available slot, capacity overflow, reuse of released slots, preservation of explicit unassignment and latest-storage reads. Runtime creation checks automatic defaults; duplicates use Automatic and retain no original slot ownership.
- The installed Windows 2.9 import-path validator was extracted without modifying Raycast and exercised against the original .rayext and an existing directory. The former reproduces the internal-build-only rejection; the latter is accepted.
- Prebuilt distribution uses a ZIP with a Commands directory, sanitized manifest, all 34 compiled commands and runtime dependencies. Source maps and machine-specific markers are excluded.
- The installed importer copy routine was exercised without changing the app. It retained all 34 self-contained executables. The copied Command 01 executed successfully in an isolated native runtime with only Raycast-provided modules, no project dependencies or source tree.
- Raycast classifies local imports as development extensions. Removing the badge is not a claimed outcome. No continuously running builder is needed for the slot workflow.
- Package integrity checks verify executable coverage, slot count, profile sanitization and exclusion of private generated commands. Full desktop import and OS hotkeys remain unverified because computer-use initialization failed.
- Dependency audit: 8 unresolved findings (2 low, 2 moderate, 4 high). The optional encoding dependency was added explicitly so the standalone bundle can include it; the existing dependency versions were retained.
