import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import type {
  GenerateSubjectsRequest,
  GenerateSubjectsResponse,
  GenerateSubjectsError,
  SubjectLineOption,
} from "@/lib/types";

export const runtime = "nodejs";

function buildSubjectPrompt(body: string, context?: string): string {
  return `You are an expert email copywriter. Based on the email body below, generate 6 subject line variations — one for each copywriting angle listed.

${context ? `Brand/audience context: ${context}\n` : ""}
Email body:
---
${body}
---

Return ONLY a JSON object with this exact schema. No markdown, no extra text.

{
  "subjects": [
    {
      "subject": "string — the subject line (max 60 chars, punchy)",
      "angle": "Curiosity",
      "notes": "string — one sentence on why this angle works for this email"
    },
    {
      "subject": "string",
      "angle": "Direct Benefit",
      "notes": "string"
    },
    {
      "subject": "string",
      "angle": "Urgency",
      "notes": "string"
    },
    {
      "subject": "string",
      "angle": "Question",
      "notes": "string"
    },
    {
      "subject": "string",
      "angle": "Story Hook",
      "notes": "string"
    },
    {
      "subject": "string",
      "angle": "Social Proof",
      "notes": "string"
    }
  ]
}

Rules:
- Each subject line must be unique and genuinely different — not just slight rewording of each other.
- Max 60 characters per subject line.
- Reference specific details from the email body — never write generic filler.
- The angle field must be exactly one of: Curiosity, Direct Benefit, Urgency, Question, Story Hook, Social Proof.`;
}

export async function POST(req: NextRequest) {
  let body: GenerateSubjectsRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json<GenerateSubjectsError>(
      { error: "Invalid request body.", code: "MISSING_INPUT" },
      { status: 400 }
    );
  }

  if (!body.body?.trim() || body.body.trim().length < 20) {
    return NextResponse.json<GenerateSubjectsError>(
      { error: "Email body is too short to generate subject lines.", code: "MISSING_INPUT" },
      { status: 400 }
    );
  }

  const emailBody = body.body.trim().slice(0, 5_000);
  const context = body.context?.trim().slice(0, 300);

  try {
    const result = await callAI<{ subjects: SubjectLineOption[] }>(
      buildSubjectPrompt(emailBody, context)
    );
    return NextResponse.json<GenerateSubjectsResponse>({ subjects: result.subjects });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<GenerateSubjectsError>(
      { error: `AI generation failed: ${message}`, code: "AI_ERROR" },
      { status: 500 }
    );
  }
}
