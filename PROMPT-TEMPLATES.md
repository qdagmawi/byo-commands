# Prompt placeholders

Commands implements the following subset of Raycast-style placeholders. They are interpreted by this extension, not by a built-in Raycast AI prompt engine.

- `{selection}` inserts selected text. It requires an actual selection; unavailable input produces an error before an AI request.
- `{argument name="Question"}` displays a required Question field before running. Other argument names work too. Repeating a name reuses the same answer.
- `{browser-tab.title | raw}` inserts the captured or supplied page title.
- `{browser-tab.url | raw}` inserts the captured or supplied page URL.
- `{browser-tab.content format="markdown" | raw}` inserts captured Markdown, or the page text you paste.

`| raw` means the value is inserted unchanged as text, without escaping. It does not execute code or enable HTML rendering. Text inside a substituted value is never parsed again for placeholders. No expression evaluation, arbitrary filters, or complete Raycast Dynamic Placeholders engine is provided. Unsupported browser/argument variants fail before sending.

If a prompt has placeholders, the complete rendered task is sent once as the user message. This avoids adding selected text or page content twice. A separate system instruction treats supplied content as data. Prompts without placeholders retain the existing behavior: instructions in the system message, source text in the user message.

## Webpages on Windows

The Raycast Browser Extension API documentation currently says the API is not available on Windows. Commands checks availability rather than assuming support. If available, it captures the single active tab's title, URL and Markdown together. If unavailable, capture fails, or more than one active tab makes the source ambiguous, the command offers a paste-content form instead.

Page content is required; title and URL are optional. A pasted URL is metadata only: Commands does not fetch that URL. Paste the relevant page text as well. The resulting command can only answer from what you provide.

Reference: https://developers.raycast.com/api-reference/browser-extension
