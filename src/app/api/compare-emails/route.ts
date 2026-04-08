import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { scoreEmail } from "@/lib/scoring";
import type {
  AIEmailScores, CompareEmailsError, CompareEmailsRequest,
  CompareEmailsResponse, HeuristicScores, ScoredEmailVersion,
} from "@/lib/types";

export const runtime = "nodejs";

function buildComparisonPrompt(
  subjectA: string, bodyA: string, hA: HeuristicScores,
  subjectB: string, bodyB: string, hB: HeuristicScores
): string {
  return `You are an expert email copywriter and conversion rate optimizer. Compare these two marketing email versions.

Heuristic data has already been computed — use it as context, but provide your own qualitative scores.

VERSION A
Subject: ${subjectA}
Body:
${bodyA}

Heuristics for A: words=${hA.wordCount}, FK grade=${hA.fleschKincaidGrade}, avg sentence=${hA.avgSentenceLength} words, spam triggers=${hA.spamTriggers.length === 0 ? "none" : hA.spamTriggers.join(" | ")}

---

VERSION B
Subject: ${subjectB}
Body:
${bodyB}

Heuristics for B: words=${hB.wordCount}, FK grade=${hB.fleschKincaidGrade}, avg sentence=${hB.avgSentenceLength} words, spam triggers=${hB.spamTriggers.length === 0 ? "none" : hB.spamTriggers.join(" | ")}

---

Return ONLY a JSON object matching this exact schema. No markdown, no extra text.

{
  "versionAScores": {
    "clarity": number (1–10),
    "persuasiveness": number (1–10),
    "relevance": number (1–10),
    "callToAction": number (1–10),
    "overall": number (1–10),
    "notes": "string — 1–2 sentence qualitative summary of Version A"
  },
  "versionBScores": {
    "clarity": number (1–10),
    "persuasiveness": number (1–10),
    "relevance": number (1–10),
    "callToAction": number (1–10),
    "overall": number (1–10),
    "notes": "string — 1–2 sentence qualitative summary of Version B"
  },
  "versionAImprovements": ["string", "string", "string"],
  "versionBImprovements": ["string", "string", "string"],
  "recommendation": "A" or "B" or "tie",
  "recommendationReason": "string — 2–3 sentences explaining the recommendation",
  "summaryInsights": ["string", "string", "string"]
}

Rules:
- Each improvements array must have exactly 3 specific, actionable suggestions referencing actual text from the email.
- summaryInsights should be broader observations that apply to both versions.
- Be direct. Avoid generic advice like "add a CTA" — say exactly what to change and why.`;
}

export async function POST(req: NextRequest) {
  let body: CompareEmailsRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<CompareEmailsError>({ error: "Invalid request body.", code: "MISSING_INPUT" }, { status: 400 });
  }

  const { versionA, versionB } = body;

  if (!versionA?.body?.trim() || !versionB?.body?.trim()) {
    return NextResponse.json<CompareEmailsError>({ error: "Both versions must have a non-empty body.", code: "MISSING_INPUT" }, { status: 400 });
  }

  const hA = scoreEmail(versionA.subject ?? "", versionA.body);
  const hB = scoreEmail(versionB.subject ?? "", versionB.body);

  let aiResult: {
    versionAScores: AIEmailScores;
    versionBScores: AIEmailScores;
    versionAImprovements: string[];
    versionBImprovements: string[];
    recommendation: "A" | "B" | "tie";
    recommendationReason: string;
    summaryInsights: string[];
  };

  try {
    aiResult = await callAI(buildComparisonPrompt(
      versionA.subject ?? "", versionA.body, hA,
      versionB.subject ?? "", versionB.body, hB
    ));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<CompareEmailsError>({ error: `AI comparison failed: ${message}`, code: "AI_ERROR" }, { status: 500 });
  }

  const scoredA: ScoredEmailVersion = {
    version: "A", subject: versionA.subject ?? "", body: versionA.body,
    heuristics: hA, aiScores: aiResult.versionAScores, improvements: aiResult.versionAImprovements,
  };
  const scoredB: ScoredEmailVersion = {
    version: "B", subject: versionB.subject ?? "", body: versionB.body,
    heuristics: hB, aiScores: aiResult.versionBScores, improvements: aiResult.versionBImprovements,
  };

  return NextResponse.json<CompareEmailsResponse>({
    versionA: scoredA, versionB: scoredB,
    recommendation: aiResult.recommendation,
    recommendationReason: aiResult.recommendationReason,
    summaryInsights: aiResult.summaryInsights,
  });
}
