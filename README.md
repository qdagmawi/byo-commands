# Commands

Reusable AI commands for Raycast on Windows, using your own model-provider connections.

## Included defaults

- Explainer — detailed, rigorous explanation.
- Rewriter — validation, paraphrases and creative alternatives.
- Explain This in Simple Terms — concise definitions and explanations.
- Ask About Webpage — a question about supplied page content.
- Summarize Webpage — concise summary and key takeaways.
- Critique & Counterarguments — assumptions, reasoning gaps and opposing views.
- Synthesize & Connect — broader concepts and connections.

Each has a suitable icon and a named native command. They inherit your default provider/model and do not consume custom slots. Fix Spelling and Grammar and Improve Writing remain available. Your edited prompts are preserved on upgrade.

The supplied selection, question and browser placeholders are supported. Windows webpage commands offer pasted content when the browser API is unavailable. See [PROMPT-TEMPLATES.md](PROMPT-TEMPLATES.md).

## Commands first

Create prompts with **Create AI Command**, or edit them in **Commands**. Choose an icon, input source, provider/model settings, and whether to keep the original input available. New commands follow the shared default provider and model unless customized.

New custom prompts automatically take the first available of 20 **Hotkey Slots**, then enable that slot and configure its alias, hotkey and overrides in Raycast Settings. Import the prebuilt Windows ZIP as a folder; no running development builder is needed. Local imports may retain Raycast’s Development badge. Native names are fixed (Command 01–20); prompt names and icons remain customizable inside Commands. See [INSTALL.md](INSTALL.md) for instructions.

## Models & Providers

Add Google Gemini, OpenAI/ChatGPT API models, or an OpenAI-compatible/local endpoint. Keys and connection details belong to individual profiles. Standard Gemini and OpenAI connections show a simple form; enable **Advanced → Use a custom API endpoint** only when needed. Compatible/local providers always show their endpoint.

Select a provider, choose a model and press Enter to set the default. Model discovery, manual model IDs, favorites and hidden models are supported. ChatGPT subscriptions and OpenAI API credentials are different products; this extension's OpenAI profile uses an API key.

## Optional chat tools

**Chat with AI**, **Chat Presets**, **Conversations**, **History** and **Saved Answers** are provider-neutral chat features. Chat presets store reusable instructions and model settings; Models & Providers manages actual connections and available model IDs.

Image questions use the selected default model, which must support images. The extension does not display the old GPT-specific token/cost estimates.

## Settings

Shared settings contain response streaming, conversation/history behavior, optional speech/input preferences and shared network proxy options. Old global OpenAI-key, Azure, endpoint and separate GPT-vision controls are removed from this UI. Saved provider profiles and keys were not deleted. Configure current connections through Models & Providers.

See [START-HERE.md](START-HERE.md) for local development, per-command overrides, and limitations. Build with `npm run build`, verify installed executables with `npm run check-install`, and run `npm test`.

## Attribution

Personal fork of [abielzulio's ChatGPT extension](https://github.com/raycast/extensions/tree/main/extensions/chatgpt). Original author/contributor attribution and MIT license are retained. Historical CHANGELOG entries describe upstream releases, not the current local UI. Locally sourced Raycast symbol artwork needs licensing review before public redistribution.
