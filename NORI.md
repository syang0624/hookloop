# NORI.md — Backend + AI Owner

You are working on the nori branch. Read CLAUDE.md first if you haven't. This file is your task list, file ownership, and definitions of done.

---

## Your role

Backend + AI. You own the Convex layer, the three agents, the simulator, and the bandit. You expose a small, stable API surface that Steven consumes via useQuery and useMutation. You do not touch the frontend.

---

## Setup check (do this first, ONCE)

Before any task, verify Steven has pushed the initial commit:

git fetch origin
git checkout nori
git pull origin main           # pull Steven's scaffolding into your branch
npm install
npx convex dev                 # leave running in a terminal
If convex/schema.ts doesn't exist or has empty tables, message Steven. He owns Phase 0.

---

## Files you own

convex/schema.ts                      (already exists from Phase 0)
convex/products.ts
convex/variants.ts
convex/metrics.ts
convex/hypotheses.ts
convex/experiments.ts
convex/agents.ts                      (Convex actions calling OpenAI)
convex/simulator.ts                   (Convex actions + scheduled functions)
lib/agents/prompts.ts                 (system prompts for all 3 agents)
lib/agents/schemas.ts                 (Zod/JSON schemas for structured outputs)
lib/simulator/dnaWeights.ts           (heuristic weights table)
lib/simulator/runCampaign.ts          (pure simulator logic)
lib/bandit.ts                         (Thompson sampling allocator)
Do NOT touch app/**, components/**, lib/types.ts, or lib/mockData.ts. Those are Steven's.

If lib/types.ts doesn't match what you need, message Steven. Do not edit it yourself.

---

## Task order

Build in this order. Each task is a real demo-blocker — don't skip.

### Task 1 — convex/products.ts (30 min)

Two functions:
- create mutation: takes the product input shape from lib/types.ts, inserts a row, also creates an experiment_runs row with status: "running" and a fresh batchId. Returns { productId, batchId }.
- getById query: returns the product by id.

Push immediately. Steven is blocked on this.

### Task 2 — lib/agents/prompts.ts + lib/agents/schemas.ts (60 min)

The three system prompts. Use structured output (OpenAI's `response_format: { type: "json_schema" }`).

Strategist — input: product + past performance (empty array OK) + experiment goal. Output:
{
  "audienceAnalysis": "string",
  "hypotheses": [{ "text": "...", "reasoning": "...", "dimension": "hookType|voice|pacing|cta|..." }],
  "experimentPlan": { "totalBudget": number, "perVariantBudget": number, "killRules": [...], "scaleRules": [...] }
}
Generator — input: hypotheses + product context + brand assets. Output: array of 8 variants matching the ad_variants schema. Each variant references which hypothesis it tests in its hypothesis field.

Analyst — input: variants + their metrics. Output:
{
  "winners": [variantId, ...],
  "losers": [variantId, ...],
  "perDimensionAttribution": { "hookType": { "pain-point": -23%, "benefit": +12%, ... }, ... },
  "narrative": "string explaining what happened",
  "nextBatchBrief": "string fed back into Strategist"
}
Critical: prompts must reference the actual past data, not generic marketing wisdom. The failure mode here is bland output. Seed each prompt with the specific numbers and DNA from the prior batch.

### Task 3 — convex/agents.ts (45 min)

Three Convex actions: runStrategist, runGenerator, runAnalyst. Each:
1. Reads inputs from the DB
2. Calls OpenAI with the system prompt
3. Writes structured output to the relevant table
4. Returns the result

Use internalAction since they're not called from the frontend directly.

### Task 4 — lib/simulator/dnaWeights.ts (45 min)

The heuristic weights table. Each DNA dimension carries a multiplier on baseline CTR and CVR. Document the priors with comments — judges will inspect this.

Suggested baselines (tune to taste):
```ts
baseline: { ctr: 0.012, cvr: 0.025, cpm: 8.50 }

hookType: {
  "pain-point":   { ctrMul: 1.15, cvrMul: 1.05 },
  "benefit":      { ctrMul: 1.00, cvrMul: 1.00 },
  "curiosity":    { ctrMul: 1.20, cvrMul: 0.85 },  // high CTR, low intent
  "social-proof": { ctrMul: 1.08, cvrMul: 1.18 },
  "shock-stat":   { ctrMul: 1.25, cvrMul: 0.90 },
}

voice: {
  "founder":  { ctrMul: 1.10, cvrMul: 1.20 },  // strong on B2B
  "ai-male":  { ctrMul: 0.95, cvrMul: 0.95 },
  "ai-female":{ ctrMul: 1.00, cvrMul: 1.00 },
  "ugc":      { ctrMul: 1.12, cvrMul: 1.08 },
}

// pacing, cta, music similarly
```

The curiosity hook intentionally has high CTR + low CVR — this teaches the system to not optimize CPC alone, which is the core thesis.

### Task 5 — lib/simulator/runCampaign.ts (60 min)

Pure function. Input: array of variants + total budget + days. Output: per-variant per-day metrics.

Algorithm:
1. For each variant, compute effectiveCTR = baseline.ctr * Π(dimensionMultipliers)
2. Similarly effectiveCVR
3. Allocate impressions by budget / cpm
4. Sample clicks ~ Binomial(impressions, ctr) — add Gaussian noise
5. Sample conversions ~ Binomial(clicks, cvr) — add noise
6. Compute CPC = spend / clicks, CAC = spend / conversions

Return day-by-day to support the streaming dashboard.

### Task 6 — convex/simulator.ts (45 min)

Convex action runCampaign(batchId):
1. Reads variants for the batch
2. Calls lib/simulator/runCampaign to get day 1 metrics
3. Inserts into campaign_metrics (this is what makes Steven's dashboard light up)
4. Uses Convex scheduler.runAfter(2000, ...) to insert day 2 after 2 seconds
5. Same for day 3
6. Marks experiment_runs.status = "complete"
7. Triggers runAnalyst

The scheduled delays create the live-streaming dashboard effect without making the demo wait 3 days.

### Task 7 — lib/bandit.ts (45 min)

Thompson sampling. For each variant track (alpha, beta) priors on conversion rate. Sample from Beta(alpha, beta) for each, allocate the next impression slice to the highest sample. Update priors with observed conversions.

Crucially: gate budget reallocation on a CVR floor. A variant with high CTR but CVR < 0.5% of target should be killed, not scaled, even if its bandit score is high.

### Task 8 — Wire the loop in convex/experiments.ts (45 min)

The orchestration:
- startBatch(productId) mutation:
  1. Create batchId
  2. Schedule agents.runStrategist
  3. On strategist complete → schedule agents.runGenerator
  4. On generator complete → schedule simulator.runCampaign
  5. Simulator handles its own day-by-day scheduling
  6. On final day → schedule agents.runAnalyst
- getStatus(batchId) query: returns current phase + progress

### Task 9 — convex/metrics.ts (15 min)

Simple query liveMetrics(batchId) returning all metrics rows. Convex's reactivity means Steven's dashboard updates automatically as simulator inserts rows. This is the Convex prize criterion in action.

### Task 10 — convex/hypotheses.ts, convex/variants.ts (15 min)

Trivial listByBatch queries for each.

---

## Contracts with Steven

You expose these. Lock the shapes early; if they change, message Steven.

Mutations:
- products.create(input: ProductInput) → { productId, batchId }
- experiments.startBatch(productId) → batchId

Queries (reactive):
- products.getById(productId) → Product | null
- variants.listByBatch(batchId) → Variant[]
- metrics.liveMetrics(batchId) → Metric[]
- hypotheses.listByBatch(batchId) → Hypothesis[]
- experiments.getStatus(batchId) → { phase, progress }

---

## Critical correctness checks

- [ ] Bandit gated on CVR floor — verify a high-CTR, low-CVR variant gets killed, not scaled
- [ ] Simulator produces internally consistent numbers (CPC = spend/clicks, CAC = spend/conversions)
- [ ] DNA weights documented with comments citing rationale
- [ ] Analyst attribution names specific dimensions, not "the ads with the better hook"
- [ ] No randomness without a seed (so demo runs are reproducible)
- [ ] OpenAI calls handle rate limits + retries

---

## Definition of "Phase 1 done" for you

- [ ] All Convex functions deployed (`npx convex dev` shows no errors)
- [ ] End-to-end loop runs: input → strategist → generator → simulator → analyst
- [ ] Metrics stream into the DB across 3 simulated days with visible delays
- [ ] Analyst output references actual variant data, not generic platitudes
- [ ] Bandit reallocates between variants based on live metrics

When all checked, message Steven — time to integrate.