import Link from "next/link";

const FEATURES = [
  {
    href: "/brief",
    accent: "bg-blue-500",
    iconBg: "bg-blue-50 text-blue-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: "Brand Brief Generator",
    description: "Paste any website URL and extract a full brand voice brief in under a minute — tone, audience, messaging pillars, and do's & don'ts.",
    cta: "Generate a brief →",
  },
  {
    href: "/subject",
    accent: "bg-purple-500",
    iconBg: "bg-purple-50 text-purple-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"/>
        <line x1="9" y1="20" x2="15" y2="20"/>
        <line x1="12" y1="4" x2="12" y2="20"/>
      </svg>
    ),
    title: "Subject Line Generator",
    description: "Paste your email body and get 6 subject line variations — one per angle: curiosity, urgency, direct benefit, question, story hook, and social proof.",
    cta: "Generate subject lines →",
  },
  {
    href: "/ab",
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: "Email A/B Tester",
    description: "Compare two versions side-by-side. Heuristic scores (reading level, spam risk) plus AI feedback on clarity, persuasion, and call-to-action strength.",
    cta: "Compare emails →",
  },
];

const STEPS = [
  { n: "1", label: "Research the brand", detail: "Generate a brief from any URL." },
  { n: "2", label: "Write your email", detail: "Use the brief to write on-brand." },
  { n: "3", label: "Pick the best subject", detail: "Get 6 angles, choose the winner." },
  { n: "4", label: "Test before sending", detail: "A/B test with data, not gut feel." },
];

export default function HomePage() {
  return (
    <div className="space-y-20">

      {/* Hero */}
      <section className="pt-10 max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Built for freelance email copywriters
        </div>

        <h1 className="text-5xl font-semibold tracking-tight leading-[1.1] text-zinc-900">
          Research faster.<br />
          Write better.<br />
          <span className="text-zinc-400">Win more clients.</span>
        </h1>

        <p className="text-lg text-zinc-600 leading-relaxed">
          CopyBrief turns hours of brand research and gut-feel testing into a
          repeatable, data-backed workflow — all in one tab, for free.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/brief"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Generate your first brief
          </Link>
          <Link
            href="/ab"
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Try A/B testing →
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Three tools
          </h2>
          <p className="mt-1 text-lg font-medium text-zinc-900">One workflow, start to send.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all"
            >
              {/* Colored accent bar */}
              <div className={`h-1 w-full ${f.accent}`} />

              <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.iconBg}`}>
                  {f.icon}
                </div>

                {/* Text */}
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{f.description}</p>
                </div>

                {/* CTA */}
                <span className="text-sm font-medium text-zinc-900 group-hover:underline underline-offset-2">
                  {f.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            How it works
          </h2>
          <p className="mt-1 text-lg font-medium text-zinc-900">Four steps from URL to send.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{s.label}</p>
                <p className="mt-0.5 text-xs text-zinc-600 leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer strip */}
      <section className="border-t border-zinc-200 pt-8 pb-6 flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-zinc-500">
          No account. No database. No data stored. Just copy and go.
        </p>
        <div className="flex gap-3">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              {f.title.split(" ")[0]}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
