"use client";

import { useState } from "react";
import type {
  SubjectLineOption,
  SubjectAngle,
  GenerateSubjectsResponse,
  GenerateSubjectsError,
} from "@/lib/types";

type PageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; subjects: SubjectLineOption[] }
  | { status: "error"; message: string };

const BODY_MAX = 5_000;
const CONTEXT_MAX = 300;

const ANGLE_STYLES: Record<SubjectAngle, { badge: string; bar: string }> = {
  Curiosity:        { badge: "bg-purple-50 text-purple-700 border-purple-200", bar: "bg-purple-400" },
  "Direct Benefit": { badge: "bg-blue-50 text-blue-700 border-blue-200",       bar: "bg-blue-400" },
  Urgency:          { badge: "bg-red-50 text-red-700 border-red-200",           bar: "bg-red-400" },
  Question:         { badge: "bg-amber-50 text-amber-700 border-amber-200",     bar: "bg-amber-400" },
  "Story Hook":     { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-400" },
  "Social Proof":   { badge: "bg-zinc-100 text-zinc-700 border-zinc-300",       bar: "bg-zinc-400" },
};

const INPUT_CLS = "mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-colors";

function SubjectCard({
  option,
  onCopy,
  copied,
}: {
  option: SubjectLineOption;
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  const style = ANGLE_STYLES[option.angle] ?? { badge: "bg-zinc-50 text-zinc-700 border-zinc-200", bar: "bg-zinc-400" };
  const charCount = option.subject.length;
  const tooLong = charCount > 50;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
      <div className={`h-1 ${style.bar}`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${style.badge}`}>
            {option.angle}
          </span>
          <button
            onClick={() => onCopy(option.subject)}
            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <p className="text-base font-semibold text-zinc-900 leading-snug">
          {option.subject}
        </p>

        <p className={`text-xs ${tooLong ? "text-amber-600" : "text-zinc-500"}`}>
          {charCount} chars{tooLong ? " — may clip on mobile" : ""}
        </p>

        <p className="text-xs text-zinc-600 border-t border-zinc-100 pt-2.5 leading-relaxed">
          {option.notes}
        </p>
      </div>
    </div>
  );
}

export default function SubjectPage() {
  const [state, setState] = useState<PageState>({ status: "idle" });
  const [body, setBody] = useState("");
  const [context, setContext] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/generate-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), context: context.trim() || undefined }),
      });
      const data = (await res.json()) as GenerateSubjectsResponse | GenerateSubjectsError;
      if (!res.ok) {
        setState({ status: "error", message: (data as GenerateSubjectsError).error });
        return;
      }
      setState({ status: "success", subjects: (data as GenerateSubjectsResponse).subjects });
    } catch {
      setState({ status: "error", message: "Network error — check your connection and try again." });
    }
  }

  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2_000);
  }

  function handleCopyAll(subjects: SubjectLineOption[]) {
    const text = subjects.map((s) => `[${s.angle}] ${s.subject}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2_000);
  }

  const bodyPct = Math.round((body.length / BODY_MAX) * 100);

  return (
    <section className="max-w-2xl mx-auto space-y-6">

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Tool 2 of 3</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Subject Line Generator</h1>
        <p className="text-sm text-zinc-600">
          Paste your email body and get 6 subject line variations — one per copywriting angle.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="h-1 w-full bg-purple-500" />
        <div className="p-5 space-y-4">

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-800">
              Brand / audience context{" "}
              <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. DTC skincare brand, audience: women 25–40, warm and expert tone"
              maxLength={CONTEXT_MAX}
              className={INPUT_CLS}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-zinc-800">Email body</label>
              <span className={`text-xs ${bodyPct >= 90 ? "text-amber-500" : "text-zinc-400"}`}>
                {body.length} / {BODY_MAX}
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste your email body here..."
              rows={10}
              maxLength={BODY_MAX}
              required
              className={INPUT_CLS + " resize-y"}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={state.status === "loading"}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {state.status === "loading" ? "Generating..." : "Generate Subject Lines"}
            </button>
            {state.status === "success" && (
              <button
                type="button"
                onClick={() => { setState({ status: "idle" }); setBody(""); setContext(""); }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Start over
              </button>
            )}
          </div>
        </div>
      </form>

      {state.status === "loading" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 flex items-center gap-3">
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm text-zinc-600">Writing subject lines...</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{state.message}</p>
        </div>
      )}

      {state.status === "success" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-800">
              {state.subjects.length} subject lines
            </p>
            <button
              onClick={() => handleCopyAll(state.subjects)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {copiedAll ? "Copied all!" : "Copy all"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {state.subjects.map((option, i) => (
              <SubjectCard
                key={i}
                option={option}
                onCopy={(text) => handleCopy(text, i)}
                copied={copiedIndex === i}
              />
            ))}
          </div>

          <p className="text-xs text-zinc-500">
            Under 50 chars = less likely to clip in mobile inboxes.
          </p>
        </div>
      )}
    </section>
  );
}
