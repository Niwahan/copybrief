"use client";

import { useState } from "react";
import type {
  CompareEmailsResponse,
  CompareEmailsError,
  ScoredEmailVersion,
} from "@/lib/types";

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: CompareEmailsResponse }
  | { status: "error"; message: string };

interface EmailDraft {
  subject: string;
  body: string;
}

const SUBJECT_MAX = 200;
const BODY_MAX = 5_000;

const INPUT_CLS = "mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-colors";

const VERSION_STYLES = {
  A: { bar: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  B: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-600">
        <span>{label}</span>
        <span className="font-semibold text-zinc-800">{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100">
        <div className="h-1.5 rounded-full bg-zinc-800 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function VersionResults({ v }: { v: ScoredEmailVersion }) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Heuristics</h4>
        <dl className="space-y-1.5 text-xs text-zinc-700">
          {[
            ["Word count", String(v.heuristics.wordCount)],
            ["FK Grade Level", String(v.heuristics.fleschKincaidGrade)],
            ["Avg sentence", `${v.heuristics.avgSentenceLength} words`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <dt>{label}</dt>
              <dd className="font-semibold text-zinc-800">{val}</dd>
            </div>
          ))}
          <div className="flex justify-between">
            <dt>Spam score</dt>
            <dd className={`font-semibold ${v.heuristics.spamScore >= 60 ? "text-red-600" : v.heuristics.spamScore >= 40 ? "text-amber-600" : "text-emerald-600"}`}>
              {v.heuristics.spamScore}/100
            </dd>
          </div>
        </dl>
        {v.heuristics.spamTriggers.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {v.heuristics.spamTriggers.map((t) => (
              <li key={t} className="text-xs text-amber-700 flex gap-1.5">
                <span className="shrink-0">⚠</span><span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">AI Scores</h4>
        <div className="space-y-2.5">
          <ScoreBar label="Clarity" value={v.aiScores.clarity} />
          <ScoreBar label="Persuasiveness" value={v.aiScores.persuasiveness} />
          <ScoreBar label="Relevance" value={v.aiScores.relevance} />
          <ScoreBar label="Call to Action" value={v.aiScores.callToAction} />
          <ScoreBar label="Overall" value={v.aiScores.overall} />
        </div>
        <p className="mt-2 text-xs text-zinc-600 italic leading-relaxed">{v.aiScores.notes}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Improvements</h4>
        <ul className="space-y-2">
          {v.improvements.map((imp, i) => (
            <li key={i} className="text-xs text-zinc-700 flex gap-2">
              <span className="shrink-0 font-semibold text-zinc-400">{i + 1}.</span>
              <span className="leading-relaxed">{imp}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AbPage() {
  const [state, setState] = useState<PageState>({ status: "idle" });
  const [vA, setVA] = useState<EmailDraft>({ subject: "", body: "" });
  const [vB, setVB] = useState<EmailDraft>({ subject: "", body: "" });
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/compare-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionA: vA, versionB: vB }),
      });
      const data = (await res.json()) as CompareEmailsResponse | CompareEmailsError;
      if (!res.ok) {
        setState({ status: "error", message: (data as CompareEmailsError).error });
        return;
      }
      setState({ status: "success", result: data as CompareEmailsResponse });
    } catch {
      setState({ status: "error", message: "Network error — check your connection and try again." });
    }
  }

  function handleSwap() { setVA(vB); setVB(vA); setState({ status: "idle" }); }
  function handleClear() { setVA({ subject: "", body: "" }); setVB({ subject: "", body: "" }); setState({ status: "idle" }); }

  async function handleCopyReport(result: CompareEmailsResponse) {
    const fmt = (v: ScoredEmailVersion) => [
      `Subject: "${v.subject}"`,
      `Heuristics: ${v.heuristics.wordCount} words | FK Grade ${v.heuristics.fleschKincaidGrade} | Spam ${v.heuristics.spamScore}/100`,
      v.heuristics.spamTriggers.length > 0 ? `Spam triggers: ${v.heuristics.spamTriggers.join(", ")}` : "Spam triggers: none",
      `AI: Clarity ${v.aiScores.clarity} | Persuasion ${v.aiScores.persuasiveness} | CTA ${v.aiScores.callToAction} | Overall ${v.aiScores.overall}`,
      `Notes: ${v.aiScores.notes}`,
      `Improvements:\n${v.improvements.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`,
    ].join("\n");

    await navigator.clipboard.writeText([
      "# Email A/B Comparison Report",
      "", "## Version A", fmt(result.versionA),
      "", "## Version B", fmt(result.versionB),
      "", `## Recommendation: Version ${result.recommendation.toUpperCase()}`,
      result.recommendationReason,
      "", "## Key Insights",
      ...result.summaryInsights.map((s) => `• ${s}`),
    ].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <section className="space-y-6">

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Tool 3 of 3</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Email A/B Tester</h1>
        <p className="text-sm text-zinc-600">
          Compare two email versions — heuristic scores plus AI qualitative feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {(["A", "B"] as const).map((label) => {
            const draft = label === "A" ? vA : vB;
            const setDraft = label === "A" ? setVA : setVB;
            const bodyPct = Math.round((draft.body.length / BODY_MAX) * 100);
            const vs = VERSION_STYLES[label];

            return (
              <div key={label} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <div className={`h-1 ${vs.bar}`} />
                <div className="p-5 space-y-3">
                  <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${vs.badge}`}>
                    Version {label}
                  </span>

                  <div>
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-zinc-800">Subject</label>
                      <span className={`text-xs ${draft.subject.length > SUBJECT_MAX * 0.9 ? "text-amber-500" : "text-zinc-400"}`}>
                        {draft.subject.length}/{SUBJECT_MAX}
                      </span>
                    </div>
                    <input
                      value={draft.subject}
                      onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                      placeholder={`Subject line ${label}`}
                      maxLength={SUBJECT_MAX}
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-zinc-800">Body</label>
                      <span className={`text-xs ${bodyPct >= 90 ? "text-amber-500" : "text-zinc-400"}`}>
                        {draft.body.length}/{BODY_MAX}
                      </span>
                    </div>
                    <textarea
                      value={draft.body}
                      onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                      placeholder={`Email body ${label}`}
                      rows={10}
                      maxLength={BODY_MAX}
                      required
                      className={INPUT_CLS + " resize-y"}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={state.status === "loading"}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {state.status === "loading" ? "Analysing..." : "Compare Versions"}
          </button>
          <button type="button" onClick={handleSwap}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            Swap A ↔ B
          </button>
          <button type="button" onClick={handleClear}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            Clear
          </button>
        </div>
      </form>

      {state.status === "loading" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 flex items-center gap-3">
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm text-zinc-600">Analysing both versions...</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{state.message}</p>
        </div>
      )}

      {state.status === "success" && (
        <div className="space-y-4">

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="h-1 bg-zinc-900" />
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Recommendation</p>
                  <span className={`rounded-md border px-3 py-1 text-sm font-bold ${VERSION_STYLES[state.result.recommendation === "tie" ? "A" : state.result.recommendation]?.badge ?? "bg-zinc-100 text-zinc-700 border-zinc-200"}`}>
                    {state.result.recommendation === "tie" ? "Tie" : `Version ${state.result.recommendation}`}
                  </span>
                </div>
                <button onClick={() => handleCopyReport(state.result)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                  {copied ? "Copied!" : "Copy report"}
                </button>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">{state.result.recommendationReason}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(["versionA", "versionB"] as const).map((key) => {
              const v = state.result[key] as ScoredEmailVersion;
              const vs = VERSION_STYLES[v.version];
              return (
                <div key={key} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <div className={`h-1 ${vs.bar}`} />
                  <div className="p-5 space-y-4">
                    <div>
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${vs.badge}`}>
                        Version {v.version}
                      </span>
                      {v.subject && (
                        <p className="mt-1 text-xs text-zinc-600 truncate">{v.subject}</p>
                      )}
                    </div>
                    <VersionResults v={v} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Key Insights</h3>
            <ul className="space-y-2">
              {state.result.summaryInsights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-700">
                  <span className="shrink-0 text-zinc-400">•</span>
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
