# NORI.md — Backend + AI Owner

Working on `main` (post-merge). Read `CLAUDE.md` first.

---

## Phase 1 status: COMPLETE

All original tasks (1-10) are done. Loop runs: strategist → generator → simulator (3-day streaming) → analyst. Bandit with CVR-floor gate implemented. Schema extended with `agent_reasoning` table.

---

## Files you own

```
convex/schema.ts
convex/products.ts
convex/variants.ts
convex/metrics.ts
convex/hypotheses.ts
convex/experiments.ts
convex/agents.ts                      (3 agents as Convex internalActions)
convex/simulator.ts                   (day-by-day streaming via scheduler)
lib/agents/prompts.ts                 (system prompts, data-seeded)
lib/agents/schemas.ts                 (OpenAI strict JSON schemas)
lib/simulator/dnaWeights.ts           (heuristic multipliers with documented priors)
lib/simulator/runCampaign.ts          (pure seeded simulator)
lib/bandit.ts                         (Thompson sampling + CVR-floor kill gate)
```

**Do NOT touch** `app/**`, `components/**`, `lib/types.ts`, `lib/mockData.ts`.

---

## Contract additions made (beyond CLAUDE.md)

These were communicated to Steven and are documented here for the record:

1. **`agent_reasoning` table** — new table not in original schema. Stores each agent's human-readable output + structured JSON. Public query `agents.reasoningByBatch(batchId)` added.
2. **`experiments.getStatus`** — returns `{ status, phase, progress }`. CLAUDE.md said `status`, NORI.md said `phase`; both are returned.
3. **`perDimensionAttribution`** — analyst output is `Array<{ dimension, value, cacDeltaPct, cpcDeltaPct }>` (not an open map). Constrained by OpenAI strict mode.
4. **`experiment_runs.by_product` index** — added for `startBatch` to find existing runs.
5. **`openai ^6`** — added to package.json dependencies.

---

## Phase 2 — Remaining tasks

### Task N1 — Integrate bandit into simulator day-over-day allocation

The Thompson sampling bandit (`lib/bandit.ts`) is implemented but the simulator currently uses static budget splits. Wire the bandit into `convex/simulator.ts` so that between days, the bandit reallocates budget based on observed conversions. This is demo surface #3 (live bandit reallocation).

Steps:
1. After inserting day N metrics, run `allocate()` from `lib/bandit.ts` on the accumulated results
2. Use the resulting `share` values as the budget split for day N+1's simulation
3. Variants with `status: "kill"` should get 0 impressions on subsequent days
4. Store allocation results so Steven's `BudgetAllocator` can show the shift

### Task N2 — Analyst marks run as complete

Currently `simulator.markComplete` sets `status: "complete"` before the analyst runs. The analyst should be the one to mark complete (after it finishes writing its reasoning). Move the `markComplete` call to after `runAnalyst` completes, or have `runAnalyst` do it.

### Task N3 — Batch 2 / looping support

The strategist already accepts `priorBatchId` to seed from past performance. Wire a "Run Next Batch" flow:
1. After analyst completes, the `nextBatchBrief` is available in `agent_reasoning.data`
2. A new mutation (or extend `startBatch`) that creates a new batchId, passes the prior batchId to `runStrategist`
3. Steven will need a UI trigger for this — coordinate in chat

### Task N4 — Error handling for OpenAI failures

Currently errors surface but there's no recovery path. Add:
1. A `status: "failed"` literal to `experiment_runs` schema
2. Catch in each agent action — if OpenAI fails after retries, mark the run as failed with an error message
3. Steven's `getStatus` handler already returns phase — add an `error` field

### Task N5 — Validate end-to-end with real OpenAI key

Set `OPENAI_API_KEY` in `.env.local` and run the full loop. Verify:
- [ ] Strategist produces 3+ hypotheses with real reasoning
- [ ] Generator produces exactly 8 variants with varied DNA
- [ ] Simulator streams metrics day-by-day with 2s delays
- [ ] Analyst references actual variant performance, not generic platitudes
- [ ] `perDimensionAttribution` has real delta percentages
- [ ] Bandit kills at least one low-CVR variant (if the DNA weights produce one)

---

## Critical correctness checks (Phase 1 — verify these still hold)

- [x] Bandit gated on CVR floor (implemented in `lib/bandit.ts`)
- [x] Simulator produces internally consistent numbers (CPC = spend/clicks, CAC = spend/conversions)
- [x] DNA weights documented with comments citing rationale
- [x] No randomness without a seed (seeded PRNG in simulator + bandit)
- [x] OpenAI calls handle rate limits + retries (maxRetries: 4)
- [ ] Analyst attribution names specific dimensions (needs live test — Task N5)

---

## Definition of "Phase 2 done"

- [ ] Bandit reallocates budget between days (killed variants get 0 impressions)
- [ ] Full loop verified with real OpenAI key
- [ ] Error states handled gracefully (failed runs don't hang the UI)
- [ ] Batch 2 looping works (strategist seeds from prior batch performance)