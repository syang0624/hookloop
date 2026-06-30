# HookLoop

**An autonomous paid‑ad experimentation agent for startups.**

A founder gives HookLoop a product, a budget, and a target cost‑per‑acquisition. Three AI agents then run the growth loop on their own: they form creative hypotheses, generate short‑form ad reels, simulate a campaign, explain what worked and why, and generate an improved batch from what they learned — week after week, with CPC visibly dropping each loop.

> HookLoop is **not** an AI reel generator. It's a self‑improving growth‑engineering agent that happens to generate reels as one step in its loop. The loop is the point.

---

## Demo video

[![HookLoop demo video](https://img.youtube.com/vi/RyWogQuJ2y4/maxresdefault.jpg)](https://www.youtube.com/watch?v=RyWogQuJ2y4)

Watch the demo: <https://www.youtube.com/watch?v=RyWogQuJ2y4>

---

## The loop

1. **Input** — product, budget, past creative, and a **target CAC** (CAC is primary; cheap clicks are a trap).
2. **Strategist agent** — reads the brief and forms testable hypotheses, each isolating one creative‑DNA dimension (hook, voice, pacing, …).
3. **Generator agent** — turns the hypotheses into **3 ad reels** per week, each tagged with structured DNA, and produces a real video for each (Sora).
4. **Simulator** — runs a heuristic **7‑day campaign**. A Thompson‑sampling **bandit** reallocates budget toward what converts and **kills** what doesn't (gated on a CVR floor, not CPC).
5. **Analyst agent** — declares winners/losers, renders a **verdict on each hypothesis**, attributes performance to specific DNA values, and writes the brief for next week.
6. **Repeat** — click **Run Next Week**; the next batch builds on the prior week's winner. Reels evolve and CPC trends down across 3 weeks.

Every panel is driven by **Convex reactive queries** — the dashboard streams live as the simulation runs, no refresh.

---

## Stack

- **Frontend** — Next.js 14 (App Router), TypeScript (strict), Tailwind, Recharts, lucide-react
- **Backend** — [Convex](https://convex.dev) (database + actions + scheduled functions)
- **AI** — OpenAI (GPT‑class structured outputs for the agents; **Sora 2** for video reels)

---

## Quick start (local)

**Prerequisites:** Node 18+, a Convex account, an OpenAI API key (with Sora access if you want live video).

```bash
npm install
npx convex dev      # first run provisions a dev deployment + writes CONVEX vars
```

Set your environment in `.env.local`:

```bash
OPENAI_API_KEY=sk-...                 # used by the agents AND Sora (server-side)
CONVEX_DEPLOYMENT=...                 # written by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://...    # written by `npx convex dev`
NEXT_PUBLIC_CONVEX_SITE_URL=https://...
```

Then, in a second terminal:

```bash
npm run dev
```

Open <http://localhost:3000>, click **Start Experiment → Prefill with Coca‑Cola sample → submit**, and watch the loop run.

> The `OPENAI_API_KEY` is read inside Convex actions, so it must be present in the **Convex deployment** env (local dev reads `.env.local`; production needs it set on the prod deployment — see below).

---

## The Coca‑Cola demo

The bundled **Coca‑Cola** sample is the showcase run:

- **Weeks 1 → 3** each generate **3 distinct reels**. The dashboard stacks one section per week (newest on top); past weeks stay frozen — they aren't re‑analyzed.
- Coca‑Cola serves **pre‑generated cached reels** from `public/reels/week{w}_slot{n}.mp4` (fast, deterministic, no live Sora during the demo). **Any other product** generates live via Sora.
- Killed reels stay visible, dimmed with a **CUT** badge. Click any reel to play it full‑size with audio.
- Each week ends with a **Weekly Report**: hypothesis verdicts, what won / was cut, CPC/CAC delta vs last week, and the directive for next week.

### Regenerating the cached reels

The 9 cached reels are generated from feedback‑driven prompts that evolve week over week:

```bash
node scripts/generate-cached-reels.mjs   # reads OPENAI_API_KEY from .env.local; needs Sora access + credits
```

Files land in `public/reels/` (existing files are skipped — delete to regenerate).

---

## Deployment (Convex Cloud + Vercel)

The backend (`convex/`) deploys to **Convex Cloud**; the Next.js frontend deploys to **Vercel**.

1. **Backend + URL in one step** — in Vercel, set the **Build Command** to:
   ```
   npx convex deploy --cmd 'npm run build'
   ```
   and add `CONVEX_DEPLOY_KEY` (a **Production deploy key** from the Convex dashboard) to Vercel's env. This deploys your Convex functions **and** injects `NEXT_PUBLIC_CONVEX_URL` into the build.
2. **Backend secret** — set the OpenAI key on the production Convex deployment (separate from Vercel):
   ```
   npx convex env set OPENAI_API_KEY "sk-..." --prod
   ```
   Without it, the agents and live Sora fail in production (Coca‑Cola still works off the cached reels).

`VIDEO_ENABLED` in `convex/video.ts` is the kill switch for live Sora if credits run low.

---

## Project structure

```
app/                     # Next.js routes (landing, setup, launch, dashboard)
components/              # UI — WeekSection, VariantCard, ReelModal, WeeklyReport, charts
convex/                 # backend: agents, simulator, experiments, video, schema
lib/agents/             # agent prompts + structured-output schemas
lib/simulator/          # pure heuristic campaign simulator + DNA weights
lib/video/              # Sora provider + feedback-driven prompt builder
public/reels/           # cached Coca-Cola reels (week{w}_slot{n}.mp4)
scripts/                # one-off cached-reel generation
```

---

## Design principles

- **CAC is primary, CPC is secondary.** The bandit is gated on a CVR floor so it never learns to buy cheap, non‑converting clicks.
- **Three agents, not six** — Strategist, Generator, Analyst.
- **The simulator is defensible** — documented heuristic priors (including a per‑week improvement prior) plus LLM commentary, not random noise.
- **Reactive by design** — `useQuery` drives every live panel.
