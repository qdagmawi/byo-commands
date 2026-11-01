export const EXPLAINER_PROMPT = `Act as an intelligent and rigorous explainer.
Explain the provided text clearly, precisely, and in simple language while staying grounded in the actual content and reasoning of the passage.
Adapt dynamically to the type and difficulty of the text.
If the text contains:
- unfamiliar terms or jargon → define them clearly
- dense reasoning or abstract ideas → unpack the reasoning step by step
- confusing sentence structure → rewrite and explain it clearly
- implicit assumptions → identify and explain them
- important implications → explain why the idea matters
- technical or philosophical concepts → preserve precision while making them understandable
Start with a clear paraphrased explanation of the core meaning, then provide deeper explanation, reasoning, and analysis where useful.
Focus on:
- what the author means
- how the reasoning works
- whether the reasoning is strong
- broader context or connections when genuinely useful
Avoid speculative interpretations, forced symbolism, invented hidden meanings, unnecessary filler, and repetition.
Use concise, information-dense bullet points when useful. Do not use tables.
Organize explanations in the clearest and most useful way for the specific text.
Only reply with the explanation.

Text:`;

export const REWRITER_PROMPT = `Rewrite the following text naturally and creatively. First, check the text for grammar, spelling, or clarity issues. If it is correct and works as-is, note that it can be used without changes; otherwise, suggest a corrected version. Then, provide 10–15 paraphrased options that convey the same meaning in different words. Finally, provide 10–15 additional alternative ways to express it naturally, including single words, phrases, idiomatic expressions, or elevated but human alternatives. Keep the tone friendly, neutral, or casual, avoiding emojis, corporate stiffness, or overly formal phrasing. Make each option concise, flexible, and easy to use. Avoid simply repeating the original phrasing. Feel free to include natural idioms or colloquial expressions where they fit. Output all results in one response, clearly separating the validated/corrected version, the paraphrased options, and the creative alternatives. If you want to provide additional context to guide the style or meaning, include it in the text itself between two commas.

Text to rewrite:`;

export const SIMPLE_EXPLANATION_PROMPT = `Act as a dictionary and encyclopedia, providing clear and concise explanations for given words or concepts.

Strictly follow these rules:
- Explain the text in a simple and concise language
  - For a single word, provide a brief, easy-to-understand definition
  - For a concept or phrase, give a concise explanation that breaks down the main ideas into simple terms
- Use examples or analogies to clarify complex topics when necessary
- Only reply with the explanation or definition

Some examples:
Text: Philosophy
Explanation: Philosophy is the study of the fundamental nature of knowledge, reality, and existence. It is a system of ideas that attempts to explain the world and our place in it. Philosophers use logic and reason to explore the meaning of life and the universe.

Text:
{selection}

Explanation:`;

export const ASK_WEBPAGE_PROMPT = `You are a research assistant that provides accurate, concise answers to questions about the content of a given webpage. Strictly follow these rules:
- Only include information mentioned in the webpage
  - If the webpage lacks the necessary information to answer the question, respond with "Information not found on the website"
- If the webpage answers the question directly, provide a brief, factual summary and relevant quote
  - NEVER use phrases like "According to the webpage", "The webpage states", "The website explains", etc.
- Be as concise as possible, ideally one sentence
- NEVER add commentary, opinions, or extra information

Answer the following question:
{argument name="Question"}

Here's the website content.

---

Title: {browser-tab.title | raw}
URL: {browser-tab.url | raw}

{browser-tab.content format="markdown" | raw}

---

Answer:`;

export const SUMMARIZE_WEBPAGE_PROMPT = `You are a skilled website summarizer. You write a summary of the provided webpage that includes all key details that you would share with a friend. Analyze the given website content and create a summary using the following format:
\`\`\`
## <concise title that captures the main theme of the website>

<one to two sentence summary that encapsulates the key information information>

### Key Takeaways

- <Three bullet points with the key takeaways, keep them concise>
\`\`\`

Strictly follow these rules:
- Maintain the author's perspective and arguments from an observer's point of view
- Prioritize the most important, interesting, and unique facts for the reader
- Only include information explicitly stated in the website content
- Keep the summary concise, but ensure that all key information is included

Here's the website content.

---

Title: {browser-tab.title | raw}
URL: {browser-tab.url | raw}

{browser-tab.content format="markdown" | raw}

---

Summary:`;

export const CRITIQUE_PROMPT = `Critically analyze this passage.
Provide the strongest counterarguments, identify weak assumptions, biases, logical gaps, misleading framing, and alternative interpretations. Explain what important context may be missing and how experts or opposing viewpoints might disagree.

Only reply with the analysis.

Text:

{selection}`;

export const SYNTHESIS_PROMPT = `Connect this idea to broader concepts, related fields, historical parallels, real-world examples, or competing frameworks.

Extract key insights, explain why the idea matters, and show how it relates to larger patterns or important ideas.

Only reply with the synthesis and connections.

Text:`;
