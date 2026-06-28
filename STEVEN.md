# STEVEN.md — Frontend Owner

Working on `main` (post-merge). Read `CLAUDE.md` first.

---

## Phase 1 status: COMPLETE

All original tasks (1-10) are done, design system applied, responsive pass done, launch interstitial added.

---

## Files you own

```
app/page.tsx                          (landing — bento grid)
app/setup/page.tsx                    (product input form)
app/launch/[batchId]/page.tsx         (animated launch interstitial)
app/dashboard/[batchId]/page.tsx      (main dashboard)
app/layout.tsx                        (root layout, fonts, ConvexProvider)
app/globals.css
app/ConvexClientProvider.tsx
components/VariantCard.tsx
components/MetricsChart.tsx
components/AgentReasoningPanel.tsx
components/DNAHeatmap.tsx
components/BudgetAllocator.tsx
components/HypothesisList.tsx
components/CampaignTimeline.tsx       (stub — not yet implemented)
components/ProductInputForm.tsx
lib/types.ts
lib/mockData.ts
tailwind.config.ts
```

**Do NOT touch** `convex/**`, `lib/agents/**`, `lib/simulator/**`, `lib/bandit.ts`.

---

## Phase 2 — Integration tasks (post-merge)

These wire the frontend to Nori's live backend. All Convex functions now exist.

### Task I1 — Wire form to real `products.create` + `experiments.startBatch`

The form currently has a `USE_MOCKS` flag and navigates to a hardcoded `MOCK_BATCH_ID`. Now that `products.create` returns `{ productId, batchId }` and `experiments.startBatch(productId)` triggers the loop:

1. Remove the `USE_MOCKS` branch in `ProductInputForm.tsx`
2. After `createProduct(form)`, call `startBatch(productId)` — this returns the real batchId
3. Navigate to `/launch/${batchId}` with the real batchId
4. The launch interstitial auto-redirects to `/dashboard/${batchId}`

### Task I2 — Wire AgentReasoningPanel to live `agents.reasoningByBatch`

**Contract addition from Nori** (not in original CLAUDE.md):
- New table: `agent_reasoning` with fields `{ batchId, agent, content, data, createdAt }`
- New query: `api.agents.reasoningByBatch(batchId)` → returns array of reasoning rows

Currently the dashboard hardcodes `MOCK_AGENT_REASONING`. Replace with:
```ts
const liveReasoning = useQuery(api.agents.reasoningByBatch, { batchId });
```
Filter by `agent === "strategist"` and `agent === "analyst"`, pass `.content` to `AgentReasoningPanel`. Keep mock fallback for when no reasoning rows exist yet (experiment just started).

### Task I3 — Use `phase` from `experiments.getStatus` in header

`getStatus` now returns `{ status, phase, progress }` where `phase` is one of:
`"strategizing" | "generating" | "simulating" | "analyzing" | "complete"`

Show the phase in the dashboard header badge instead of just "Running"/"Complete". E.g. "Strategizing...", "Simulating (Day 2)..." etc. The `progress` field (0-1) can drive a subtle progress bar.

### Task I4 — Use analyst `perDimensionAttribution` in DNAHeatmap

The analyst stores structured data in `agent_reasoning.data` (JSON string). Parse it to get:
```ts
perDimensionAttribution: Array<{
  dimension: string;  // "hookType", "voice", etc.
  value: string;      // "pain-point", "founder", etc.
  cacDeltaPct: number; // e.g. -23 means 23% lower CAC
  cpcDeltaPct: number;
}>
```
This is more accurate than the heatmap's current approach of averaging raw CAC. Use `cacDeltaPct` to color cells when analyst data is available, falling back to the current raw-average logic when it's not.

### Task I5 — Remove mock fallbacks

Once I1-I4 are wired and tested end-to-end with a real OpenAI key:
1. Remove all mock fallback logic from the dashboard (the `liveX.length > 0 ? live : MOCK` pattern)
2. Show proper empty states when data hasn't arrived yet (skeleton loaders are already in place)
3. `lib/mockData.ts` can stay for development but should not be imported in production code paths

### Task I6 — `npm install` after merge

Nori added `openai ^6` to `package.json`. Run `npm install` before anything else.

---

## Contracts with Nori (updated post-merge)

**Queries** (use `useQuery`):

```ts
api.products.getById(productId);
api.variants.listByBatch(batchId);
api.metrics.liveMetrics(batchId);
api.hypotheses.listByBatch(batchId);
api.experiments.getStatus(batchId);        // returns { status, phase, progress }
api.agents.reasoningByBatch(batchId);      // NEW — returns agent_reasoning rows
```

**Mutations** (use `useMutation`):

```ts
api.products.create(input);                // returns { productId, batchId }
api.experiments.startBatch(productId);     // returns batchId, triggers full loop
```

---

## Definition of "Phase 2 done"

- [ ] Form submits to real Convex, receives real batchId, navigates to live dashboard
- [ ] Dashboard shows live data streaming in day-by-day (no mock fallbacks)
- [ ] Agent reasoning panel shows real strategist + analyst output
- [ ] Header shows current phase (strategizing → generating → simulating → analyzing → complete)
- [ ] DNAHeatmap uses analyst attribution data when available
- [ ] `npm run build` passes
- [ ] End-to-end demo works with a real OpenAI key
