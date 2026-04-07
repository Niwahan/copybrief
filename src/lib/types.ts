// ─── Brand Brief ─────────────────────────────────────────────────────────────

export interface BriefSection {
  title: string;
  content: string;
}

export interface BrandBrief {
  companyName: string;
  tagline: string;
  brandVoice: BriefSection;
  targetAudience: BriefSection;
  messagingPillars: BriefSection;
  competitivePositioning: BriefSection;
  writingGuidelines: BriefSection;
}

export interface GenerateBriefRequest {
  url?: string;
  manualContent?: string;
}

export interface GenerateBriefResponse {
  brief: BrandBrief;
}

export interface GenerateBriefError {
  error: string;
  code:
    | "INVALID_URL"
    | "FETCH_FAILED"
    | "TIMEOUT"
    | "AI_ERROR"
    | "PARSE_ERROR";
}

// ─── Email A/B Scoring ───────────────────────────────────────────────────────

export interface HeuristicScores {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  syllableCount: number;
  fleschKincaidGrade: number;
  spamTriggers: string[];
  spamScore: number; // 0–100
}

export interface AIEmailScores {
  clarity: number;       // 1–10
  persuasiveness: number;
  relevance: number;
  callToAction: number;
  overall: number;
  notes: string;
}

export interface EmailVersion {
  subject: string;
  body: string;
}

export interface ScoredEmailVersion {
  version: "A" | "B";
  subject: string;
  body: string;
  heuristics: HeuristicScores;
  aiScores: AIEmailScores;
  improvements: string[];
}

export interface CompareEmailsRequest {
  versionA: EmailVersion;
  versionB: EmailVersion;
}

export interface CompareEmailsResponse {
  versionA: ScoredEmailVersion;
  versionB: ScoredEmailVersion;
  recommendation: "A" | "B" | "tie";
  recommendationReason: string;
  summaryInsights: string[];
}

export interface CompareEmailsError {
  error: string;
  code: "MISSING_INPUT" | "AI_ERROR" | "PARSE_ERROR";
}

// ─── Subject Line Generator ───────────────────────────────────────────────────

export type SubjectAngle =
  | "Curiosity"
  | "Direct Benefit"
  | "Urgency"
  | "Question"
  | "Story Hook"
  | "Social Proof";

export interface SubjectLineOption {
  subject: string;       // the subject line itself
  angle: SubjectAngle;   // the copywriting angle used
  notes: string;         // one sentence on why it works
}

export interface GenerateSubjectsRequest {
  body: string;
  context?: string;      // optional: brand/audience context
}

export interface GenerateSubjectsResponse {
  subjects: SubjectLineOption[];
}

export interface GenerateSubjectsError {
  error: string;
  code: "MISSING_INPUT" | "AI_ERROR";
}
