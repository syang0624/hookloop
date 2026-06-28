# STEVEN.md — Frontend Owner

You are working on the `steven` branch. Read `CLAUDE.md` first if you haven't. This file is your task list, file ownership, and definitions of done.

---

## Your role

Frontend. You own everything the user sees. You consume Convex via `useQuery` and `useMutation` hooks — you never write Convex functions yourself. Until Nori's Convex functions land, you work against `lib/mockData.ts` and the types in `lib/types.ts`.

---

## Setup check (do this first, ONCE)

Before any task, verify:

```bash
git branch --show-current   # should print: steven
npm install
npx convex dev              # leave running in a terminal
npm run dev                 # leave running in another terminal
```

If any of those fail, fix the setup before writing any feature code. If `convex/schema.ts` doesn't exist yet, you are in Phase 0 — scaffold it per the schema in `CLAUDE.md`, commit, push, then continue.

---

## Files you own

```
app/page.tsx                          (landing)
app/setup/page.tsx                    (product input form)
app/dashboard/[batchId]/page.tsx      (main dashboard)
app/layout.tsx                        (root layout, fonts, ConvexProvider)
components/VariantCard.tsx
components/MetricsChart.tsx
components/AgentReasoningPanel.tsx
components/DNAHeatmap.tsx
components/BudgetAllocator.tsx
components/HypothesisList.tsx
components/CampaignTimeline.tsx
components/ProductInputForm.tsx
lib/types.ts
lib/mockData.ts
tailwind.config.ts
app/globals.css
```

**Do NOT touch** `convex/**` or `lib/agents/**` or `lib/simulator/**`. Those are Nori's.

---

## Task order

Build in this order. Stop and demo from whatever ships.

### Task 1 — `lib/types.ts` (15 min)

Define TS types matching the Convex schema in `CLAUDE.md`. Export `Product`, `Hypothesis`, `Variant`, `Metric`, `ExperimentRun`. This is the contract Nori reads. Push immediately so Nori can pull.

### Task 2 — `lib/mockData.ts` (15 min)

Seeded fake data: one sample product (a fictional B2B SaaS — call it "Reachly", a cold-email tool), 3 hypotheses, 8 variants with varied DNA, a stream of metrics across 3 simulated days. This unblocks the entire frontend.

### Task 3 — `app/setup/page.tsx` + `components/ProductInputForm.tsx` (60 min)

The 4 input groups from PRD §6 in a single form: product details, budget, existing creative (file inputs are placeholder for hackathon — just accept text descriptions), experiment goal as a radio group. Submit calls `useMutation(api.products.create)` (mock until Nori ships). On success, navigate to `/dashboard/[batchId]`.

**Definition of done**: form validates, submits, navigates. No styling polish yet.

### Task 4 — `app/dashboard/[batchId]/page.tsx` skeleton (30 min)

Layout grid: left rail (hypotheses), main column (variants + metrics chart), right rail (agent reasoning panel). All sections wire to `useQuery` with mock fallbacks. Loading states for every query.

### Task 5 — `components/VariantCard.tsx` (45 min)

Renders one ad variant. Shows: hook type, script (truncated), voice, music, pacing, CTA, hypothesis, budget, current CPC/CAC/CTR, kill/scale rules, and a status badge (running / killed / winning). This is the most-seen component — make it look sharp.

### Task 6 — `components/MetricsChart.tsx` (45 min)

Recharts line chart of CPC and CAC across days, with a band showing variance. Color winners green, losers red. Tooltip on hover shows the variant's DNA.

### Task 7 — `components/AgentReasoningPanel.tsx` (45 min)

Streaming text panel. For now, animate text from `lib/mockData.ts` letter-by-letter on mount. When Nori ships the real action, swap to a Convex action call that streams tokens. **This is a demo-critical surface — make the animation feel alive.**

### Task 8 — `components/DNAHeatmap.tsx` (60 min)

2D grid: rows = hook types, columns = voices. Each cell colored by avg CAC (green = low CAC, red = high). Hover shows the underlying variant count and metric. Use a single SVG, no chart library. **Demo-critical.**

### Task 9 — `components/BudgetAllocator.tsx` (45 min)

Horizontal stacked bar showing current budget split across variants. Animates when allocations change (transition on width). Subscribes to `metrics.liveMetrics` and recomputes splits. **Demo-critical — this is the bandit reallocation visual.**

### Task 10 — Polish pass (90 min)

Typography, spacing, dark mode if time. Add a HookLoop logo (text-only is fine). Smooth all transitions. Make the dashboard feel like a real product, not a hackathon submission.

---

## Contracts with Nori

You depend on these Convex functions. Treat them as fixed; if you need changes, message Nori in chat, do NOT edit `convex/`.

**Queries** (use `useQuery`):

```ts
api.products.getById(productId);
api.variants.listByBatch(batchId);
api.metrics.liveMetrics(batchId);
api.hypotheses.listByBatch(batchId);
api.experiments.getStatus(batchId);
```

**Mutations** (use `useMutation`):

```ts
api.products.create(input); // returns { productId, batchId }
api.experiments.startBatch(productId); // returns batchId, triggers full loop
```

Until any of these exist, use `lib/mockData.ts` and a feature flag:

```ts
const USE_MOCKS = !api.products?.getById;
```

---

## Conventions reminder

- TypeScript strict, no `any`
- Tailwind utility classes only
- Every `useQuery` consumer handles the `undefined` loading state
- Don't add npm deps without flagging in chat

---

## Definition of "Phase 1 done" for you

- [ ] Form at `/setup` submits and navigates
- [ ] Dashboard renders all 5 sections with mock or live data
- [ ] VariantCard, MetricsChart, AgentReasoningPanel, DNAHeatmap, BudgetAllocator all functional
- [ ] No console errors
- [ ] `npm run build` passes

When all checked, message Nori — time to integrate.
