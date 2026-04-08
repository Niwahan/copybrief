import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local and restart the dev server.");
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey,
});

const MODEL = "openrouter/auto";

export async function callAI<T>(prompt: string): Promise<T> {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const text = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`AI returned invalid JSON. First 300 chars: ${text.slice(0, 300)}`);
  }
}
