import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import type { BrandBrief, GenerateBriefRequest, GenerateBriefResponse, GenerateBriefError } from "@/lib/types";

export const runtime = "nodejs";

async function fetchWithJina(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      headers: { Accept: "text/plain", "User-Agent": "CopyBrief/1.0", "X-Return-Format": "text" },
    });
    if (!response.ok) throw new Error(`Jina returned HTTP ${response.status}`);
    return (await response.text()).slice(0, 10_000);
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildBriefPrompt(content: string): string {
  return `You are a brand strategist. Analyze the following website content and extract a structured brand brief for a copywriter.

Return ONLY a JSON object matching this exact schema. No markdown, no extra text.

{
  "companyName": "string — the brand or company name",
  "tagline": "string — their tagline or core value proposition (1 sentence)",
  "brandVoice": {
    "title": "Brand Voice",
    "content": "string — describe the brand's tone, personality, and communication style (2–4 sentences)"
  },
  "targetAudience": {
    "title": "Target Audience",
    "content": "string — who they speak to, demographics and psychographics (2–4 sentences)"
  },
  "messagingPillars": {
    "title": "Messaging Pillars",
    "content": "string — 3–5 core themes the brand consistently communicates. Format as a numbered list, one per line."
  },
  "competitivePositioning": {
    "title": "Competitive Positioning",
    "content": "string — how they differentiate from competitors and what makes them unique (2–4 sentences)"
  },
  "writingGuidelines": {
    "title": "Writing Guidelines",
    "content": "string — specific do's and don'ts for writing copy for this brand. Use + for do, - for don't, one per line."
  }
}

Rules:
- Be specific and concrete, not vague.
- Use actual phrases or examples from the content when possible.
- If a field cannot be determined, make a reasonable inference — never leave a field empty.
- Focus on what is useful for a copywriter writing marketing emails for this brand.

Website content:
---
${content}
---`;
}

export async function POST(req: NextRequest) {
  let body: GenerateBriefRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<GenerateBriefError>({ error: "Invalid request body.", code: "INVALID_URL" }, { status: 400 });
  }

  const { url, manualContent } = body;

  if (!url && !manualContent) {
    return NextResponse.json<GenerateBriefError>({ error: "Provide either a URL or manual content.", code: "INVALID_URL" }, { status: 400 });
  }

  if (url) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      return NextResponse.json<GenerateBriefError>({ error: "Invalid URL — must start with http:// or https://", code: "INVALID_URL" }, { status: 400 });
    }
  }

  let content: string;

  if (manualContent) {
    content = manualContent.trim().slice(0, 10_000);
  } else {
    try {
      content = await fetchWithJina(url!);
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return NextResponse.json<GenerateBriefError>(
        {
          error: isTimeout
            ? "The site took too long to respond (15s limit). Try pasting the content manually."
            : "Could not fetch that URL. The site may block automated access. Try pasting the content manually.",
          code: isTimeout ? "TIMEOUT" : "FETCH_FAILED",
        },
        { status: 502 }
      );
    }
  }

  if (content.trim().length < 100) {
    return NextResponse.json<GenerateBriefError>({ error: "Not enough content found. Try pasting the content manually.", code: "FETCH_FAILED" }, { status: 422 });
  }

  try {
    const brief = await callAI<BrandBrief>(buildBriefPrompt(content));
    return NextResponse.json<GenerateBriefResponse>({ brief });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<GenerateBriefError>({ error: `AI generation failed: ${message}`, code: "AI_ERROR" }, { status: 500 });
  }
}
