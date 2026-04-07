# CopyBrief

A toolkit for email copywriters. Three AI-powered tools to speed up brand research, subject line writing, and email testing.

**Live:** [copybrief.vercel.app](https://copybrief.vercel.app)

---

## Tools

**Brand Brief Generator**
Paste a website URL and get a structured brand brief — voice, audience, messaging pillars, competitive positioning, and writing guidelines. Uses Jina AI Reader to scrape the site and an LLM to extract the brand signals.

**Subject Line Generator**
Paste an email body and get 6 subject line variations, one per copywriting angle: Curiosity, Direct Benefit, Urgency, Question, Story Hook, and Social Proof.

**Email A/B Tester**
Paste two email versions and get a side-by-side comparison. Scores each version with Flesch-Kincaid readability, spam trigger detection, and AI qualitative scores (clarity, persuasiveness, CTA strength). Returns a recommendation with reasoning.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **AI:** OpenRouter (`openrouter/auto`) via OpenAI-compatible SDK
- **Scraping:** Jina AI Reader

---

## Running Locally

**1. Clone and install**

```bash
git clone https://github.com/Niwahan/copybrief.git
cd copybrief
npm install
```

**2. Add your API key**

Create `.env.local` in the project root:

```
OPENROUTER_API_KEY=your_key_here
```

Get a free key at [openrouter.ai](https://openrouter.ai).

**3. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── brief/page.tsx        # Brand Brief Generator
│   ├── subject/page.tsx      # Subject Line Generator
│   ├── ab/page.tsx           # Email A/B Tester
│   ├── components/
│   │   └── Header.tsx        # Navigation
│   └── api/
│       ├── generate-brief/   # POST: scrape URL + AI brief
│       ├── generate-subjects/ # POST: email body + subject lines
│       └── compare-emails/   # POST: score + compare emails
└── lib/
    ├── types.ts              # Shared TypeScript interfaces
    ├── scoring.ts            # Flesch-Kincaid + spam detection
    └── gemini.ts             # OpenRouter AI client wrapper
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI calls |
