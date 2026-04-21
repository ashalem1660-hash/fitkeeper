import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClaude() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const MODEL = "claude-haiku-4-5-20251001";

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 400
) {
  const anthropic = getClaude();
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = msg.content[0];
  if (block.type === "text") return block.text.trim();
  return "";
}
