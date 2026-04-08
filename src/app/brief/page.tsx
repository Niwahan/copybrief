"use client";

import { useState, useRef } from "react";
import type { BrandBrief, BriefSection, GenerateBriefResponse, GenerateBriefError } from "@/lib/types";

type PageState =
  | { status: "idle" }
  | { status: "loading"; step: number }
  | { status: "success"; brief: BrandBrief }
  | { status: "error"; message: string; code: string; allowManual: boolean };

const LOADING_STEPS = [
  "Fetching website content...",
  "Reading brand signals...",
  "Generating brand brief...",
  "Formatting output...",
];

const BRIEF_SECTION_KEYS: (keyof Omit<BrandBrief, "companyName" | "tagline">)[] = [
  "brandVoice",
  "targetAudience",
  "messagingPillars",
  "competitivePositioning",
  "writingGuidelines",
];

const SECTION_ACCENTS: Record<string, string> = {
  brandVoice:             "border-l-blue-400",
  targetAudience:         "border-l-purple-400",
  messagingPillars:       "border-l-emerald-400",
  competitivePositioning: "border-l-amber-400",
  writingGuidelines:      "border-l-rose-400",
};

const EXAMPLE_URLS = [
  { label: "Linear", url: "https://linear.app" },
  { label: "Notion", url: "https://notion.so" },
  { label: "Warby Parker", url: "https://warbyparker.com" },
];

const INPUT_CLS = "mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-colors";

export default function BriefPage() {
  const [state, setState] = useState<PageState>({ status: "idle" });
  const [url, setUrl] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);

  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function startLoadingCycle() {
    let step = 0;
    setState({ status: "loading", step });
    stepInterval.current = setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setState({ status: "loading", step });
    }, 2_500);
  }

  function stopLoadingCycle() {
    if (stepInterval.current) { clearInterval(stepInterval.current); stepInterval.current = null; }
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const payload = showManual ? { manualContent: manualContent.trim() } : { url: url.trim() };
    startLoadingCycle();
    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as GenerateBriefResponse | GenerateBriefError;
      if (!res.ok) {
        const err = data as GenerateBriefError;
        setState({ status: "error", message: err.error, code: err.code, allowManual: err.code === "FETCH_FAILED" || err.code === "TIMEOUT" });
        return;
      }
      setState({ status: "success", brief: (data as GenerateBriefResponse).brief });
    } catch {
      setState({ status: "error", message: "Network error — check your connection and try again.", code: "NETWORK", allowManual: false });
    } finally {
      stopLoadingCycle();
    }
  }

  async function handleCopy(brief: BrandBrief) {
    const lines = [
      `# Brand Brief: ${brief.companyName}`,
      `> ${brief.tagline}`,
      "",
      ...BRIEF_SECTION_KEYS.map((key) => {
        const section = brief[key] as BriefSection;
        return `## ${section.title}\n${section.content}`;
      }),
    ];
    await navigator.clipboard.writeText(lines.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  }

  function handleReset() {
    setState({ status: "idle" });
    setUrl("");
    setManualContent("");
    setShowManual(false);
  }

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Tool 1 of 3</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Brand Brief Generator</h1>
        <p className="text-sm text-zinc-600">Paste a website URL and get a structured brand brief in under a minute.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="h-1 w-full bg-blue-500" />
        <div className="p-5 space-y-4">
          {!showManual ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-800">Website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className={INPUT_CLS}
              />
              <div className="flex flex-wrap gap-2 pt-0.5">
                <span className="text-xs text-zinc-500">Try:</span>
                {EXAMPLE_URLS.map(({ label, url: exUrl }) => (
                  <button key={label} type="button" onClick={() => setUrl(exUrl)}
                    className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-800">Paste homepage content</label>
              <p className="text-xs text-zinc-600">Copy headings, paragraphs, and taglines from the brand&apos;s homepage.</p>
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste website text here..."
                rows={8}
                maxLength={10_000}
                required
                className={INPUT_CLS + " resize-y"}
              />
              <p className="text-right text-xs text-zinc-400">{manualContent.length} / 10,000</p>
            </div>
          )}

          <button type="button" onClick={() => setShowManual((v) => !v)}
            className="text-xs text-zinc-500 hover:text-zinc-800 underline underline-offset-2 transition-colors">
            {showManual ? "← Back to URL input" : "Site not loading? Paste content manually"}
          </button>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={state.status === "loading"}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {state.status === "loading" ? "Generating..." : "Generate Brief"}
            </button>
            {state.status !== "idle" && (
              <button type="button" onClick={handleReset}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                Start over
              </button>
            )}
          </div>
        </div>
      </form>

      {state.status === "loading" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 flex items-center gap-3">
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm text-zinc-600">{LOADING_STEPS[state.step]}</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-sm font-medium text-red-700">{state.message}</p>
          {state.allowManual && (
            <button onClick={() => { setShowManual(true); setState({ status: "idle" }); }}
              className="text-sm text-red-600 underline underline-offset-2 hover:text-red-800 transition-colors">
              Paste content manually instead →
            </button>
          )}
        </div>
      )}

      {state.status === "success" && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="p-5 flex items-start justify-between gap-4 border-b border-zinc-100">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{state.brief.companyName}</h2>
              <p className="mt-0.5 text-sm text-zinc-600 italic">{state.brief.tagline}</p>
            </div>
            <button onClick={() => handleCopy(state.brief)}
              className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
              {copied ? "Copied!" : "Copy brief"}
            </button>
          </div>

          {BRIEF_SECTION_KEYS.map((key) => {
            const section = state.brief[key] as BriefSection;
            const accent = SECTION_ACCENTS[key] ?? "border-l-zinc-300";
            return (
              <div key={key} className={`p-5 border-b border-zinc-100 last:border-b-0 border-l-4 ${accent}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{section.title}</h3>
                <p className="text-sm text-zinc-700 whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
