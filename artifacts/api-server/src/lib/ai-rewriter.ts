const BASE_URL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

export function isAiAvailable(): boolean {
  return !!(BASE_URL || process.env.OPENAI_API_KEY);
}

interface RewriteResult {
  title: string;
  summary: string;
  content: string;
  metaDescription: string;
  keywords: string[];
}

export async function rewriteArticle(
  originalTitle: string,
  originalContent: string,
  targetLang: "ar" | "en"
): Promise<RewriteResult> {
  if (!isAiAvailable()) {
    // Fallback: return original without AI
    return {
      title: originalTitle,
      summary: originalContent.substring(0, 200),
      content: originalContent,
      metaDescription: originalContent.substring(0, 160),
      keywords: [],
    };
  }

  const langLabel = targetLang === "ar" ? "Arabic" : "English";
  const prompt = `You are a professional news editor. Rewrite the following news article in ${langLabel}.
Return ONLY valid JSON with these fields: title, summary (2-3 sentences), content (3-5 paragraphs, rich HTML with <p> tags), metaDescription (max 160 chars), keywords (array of 5 strings).

Original title: ${originalTitle}
Original content: ${originalContent.substring(0, 2000)}`;

  const apiBase = BASE_URL || "https://api.openai.com/v1";
  const res = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      max_completion_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`AI API error: ${res.status}`);
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(text) as RewriteResult;
}
