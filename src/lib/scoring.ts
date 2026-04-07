import type { HeuristicScores } from "./types";

export function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length <= 2) return 1;
  const stripped = cleaned.replace(/e$/, "");
  const vowelGroups = stripped.match(/[aeiouy]+/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

// FK formula: 0.39 × (words/sentences) + 11.8 × (syllables/words) − 15.59
// Grade 6 = easy read, Grade 10–12 = standard marketing, 16+ = academic
export function computeFleschKincaid(words: string[], sentences: number): number {
  if (words.length === 0 || sentences === 0) return 0;
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const grade = 0.39 * (words.length / sentences) + 11.8 * (totalSyllables / words.length) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

const SAFE_ACRONYMS = new Set([
  "CEO", "CFO", "CTO", "COO", "USA", "UK", "EU", "FAQ", "ROI",
  "API", "SEO", "CRM", "AI", "B2B", "B2C", "DTC", "SLA",
]);

const URGENCY_WORDS = [
  "act now", "limited time", "expires", "last chance", "don't miss",
  "today only", "hurry", "immediately", "deadline", "while supplies last",
  "selling fast", "almost gone",
];

export function detectSpamTriggers(text: string): string[] {
  const triggers: string[] = [];

  const spammyCaps = (text.match(/\b[A-Z]{3,}\b/g) ?? []).filter((w) => !SAFE_ACRONYMS.has(w));
  if (spammyCaps.length > 0) {
    triggers.push(`ALL CAPS words: ${[...new Set(spammyCaps)].slice(0, 3).join(", ")}`);
  }
  if (/!{2,}/.test(text)) triggers.push("Multiple exclamation marks (!!)");
  if (/\d+\s*%\s*off|\$\d+\s*off|save\s+\$?\d+/i.test(text)) triggers.push("Discount/price pattern (e.g. '50% off')");

  const foundUrgency = URGENCY_WORDS.filter((w) => text.toLowerCase().includes(w));
  if (foundUrgency.length > 0) triggers.push(`Urgency language: "${foundUrgency.slice(0, 2).join('", "')}"`);
  if (/\bFREE\b/.test(text)) triggers.push('"FREE" in all caps');

  return triggers;
}

export function scoreEmail(subject: string, body: string): HeuristicScores {
  const fullText = `${subject} ${body}`;

  const words = fullText
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z']/g, ""))
    .filter((w) => w.length > 0);

  const sentenceCount = Math.max(
    1,
    fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
  );

  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const spamTriggers = detectSpamTriggers(fullText);

  return {
    wordCount: words.length,
    sentenceCount,
    avgSentenceLength: Math.round((words.length / sentenceCount) * 10) / 10,
    syllableCount,
    fleschKincaidGrade: computeFleschKincaid(words, sentenceCount),
    spamTriggers,
    spamScore: Math.min(100, spamTriggers.length * 20),
  };
}
