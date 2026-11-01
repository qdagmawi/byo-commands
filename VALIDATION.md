# Validation — 0.3.0-preview.1

- All 95 tests passed, with zero failures and zero skipped tests.
- Four checks against the compiled prebuilt files passed: selected-text explanation, required webpage question/manual content, captured webpage metadata, and fixed-slot execution.
- TypeScript build passed. Lint completed with zero errors and 12 existing warnings.
- The release contains 40 compiled native command executables, including 20 optional custom slots. Dependencies are bundled; normal use requires no running builder.
- Native-runtime tests use isolated storage, fake credentials and local HTTP fixtures, never personal provider credentials.

Coverage includes curated prompt definitions, native entry/icon metadata, safe defaults migration, template rendering, required questions, manual webpage input and browser-capture fixtures. Browser capture fixtures validate integration logic; they do not establish live Windows support. Actual desktop import and OS hotkeys remain unverified.

The prior dependency audit reported 8 unresolved findings (2 low, 2 moderate, 4 high); dependencies were not changed in this release.
