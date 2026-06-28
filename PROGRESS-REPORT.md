# HookLoop Progress Report

**Date:** 2026-06-27
**Branch:** `main` (all work merged)
**Build:** `npm run build` passes cleanly

---

## Overall Status

The core loop is fully functional end-to-end. A user can input a product, trigger the AI pipeline, watch metrics stream in day-by-day, and see the analyst explain what worked. The Thompson sampling bandit reallocates budget between days, killing underperforming variants. Validated with a real OpenAI key against a live product ("FocusFlow").

---

## What's DONE

### Backend (Nori) — Phase 1 + Phase 2: ALL COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| Schema + all tables | Done | 6 tables + `agent_reasoning` + `bandit_allocations` |
| products.create + getById | Done | Returns `{ productId, batchId }` |
| 3 agent prompts + schemas | Done | Strict JSON output, data-seeded prompts |
| 3 Convex internalActions | Done | Strategist → Generator → Analyst chain |
| DNA weights | Done | Documented priors, curiosity-hook trap works |
| Pure simulator | Done | Seeded, internally consistent CPC/CAC |
| Convex simulator (streaming) | Done | Day-by-day with 2s delays, reactive |
| Thompson sampling bandit | Done | CVR-floor kill gate, batch-relative threshold |
| N1: Bandit drives day-over-day | Done | Budget visibly shifts, killed variants get $0 |
| N2: Analyst marks complete | Done | Run stays "running" through analysis |
| N3: Batch 2 looping | Done | `startNextBatch` mutation, strategist seeds from prior |
| N4: Error handling | Done | `status: "failed"` + error message in getStatus |
| N5: E2E validation | Done | All checks pass against real OpenAI output |

### Frontend (Steven) — Phase 1: COMPLETE, Phase 2: MOSTLY COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| Types + mock data | Done | Reachly sample product, 8 variants, 3-day metrics |
| Product input form | Done | 4 groups, validation, prefill button |
| Launch interstitial | Done | 5-step animation, auto-redirect |
| Dashboard skeleton | Done | 3-column bento grid, responsive |
| VariantCard | Done | Full DNA, metrics, status badges |
| MetricsChart | Done | Recharts, CAC/CPC toggle, winner/loser colors |
| AgentReasoningPanel | Done | Variable-speed streaming, auto-scroll |
| DNAHeatmap | Done | CSS grid, analyst cacDeltaPct support |
| BudgetAllocator | Done | Stacked bar with inverse-CAC scoring |
| HypothesisList | Done | Numbered cards with reasoning |
| Bento Grid redesign | Done | Full Canva-inspired design system |
| Responsive pass | Done | Mobile, tablet, desktop |
| I1: Wire real mutations | Done | createProduct + startBatch, real batchId |
| I2: Live reasoning panels | Done | useQuery agents.reasoningByBatch |
| I3: Phase display | Done | Strategizing/Generating/Simulating/Analyzing/Complete + progress bar |
| I4: Analyst attribution in heatmap | Done | cacDeltaPct colors cells when available |
| I5: Remove mock fallbacks | Done | Dashboard imports no mock data |

---

## What's NOT DONE

### Steven — remaining frontend work

| Task | Priority | Description |
|------|----------|-------------|
| **"Run Next Batch" button** | High | Nori shipped `experiments.startNextBatch({ productId, priorBatchId })`. Dashboard needs a button that appears when `phase === "complete"` to trigger the next batch and navigate to it. This closes the loop visually. |
| **Failed state UI** | Medium | `getStatus` now returns `status: "failed"` + `error` string. Dashboard header doesn't handle this — shows "Running" forever if OpenAI fails. Need a red error badge + the error message. |
| **BudgetAllocator uses real bandit data** | Medium | Nori added `simulator.allocationsByBatch(batchId)` returning exact Thompson sampling results per day. BudgetAllocator currently approximates from metrics. Could switch to real bandit allocations for accuracy. |
| **CampaignTimeline component** | Low | Still a stub. Could show day-by-day events (variant killed, budget shifted, etc.) |
| **`lib/types.ts` needs `AgentReasoning` type** | Low | No type for the `agent_reasoning` table — dashboard uses inline casts. Adding a proper type would be cleaner. |

### Nori — nothing remaining

All N1-N5 tasks complete and validated. Backend is feature-complete for the hackathon demo.

### Integration gaps (neither side yet)

| Gap | Owner | Description |
|-----|-------|-------------|
| **OPENAI_API_KEY in .env.local** | Both | Must be set for live demo. Nori validated locally but the key isn't committed (correctly). |
| **Convex Cloud deployment** | Both | Currently local only. Need `npx convex deploy` for a real demo URL. |

---

## Demo Flow (current)

1. `/` — Landing page with bento grid
2. `/setup` — Product form (prefill "Reachly" or type your own)
3. Submit → `/launch/[batchId]` — 5-step animated interstitial
4. Auto-redirect → `/dashboard/[batchId]`
   - Header shows phase: Strategizing → Generating → Simulating → Analyzing → Complete
   - Left rail: hypotheses appear, budget bar animates
   - Main: metrics stream in day by day, variant cards update, heatmap fills in
   - Right rail: strategist reasoning streams, then analyst reasoning after simulation
5. **Missing:** "Run Next Batch" button to close the loop

---

## Architecture Diagram

```
[Form] → products.create → experiment_runs row
       → startBatch → schedules runStrategist
                         ↓
                    [Strategist] → hypotheses + reasoning
                         ↓
                    [Generator] → 8 ad_variants
                         ↓
                    [Simulator] → day 1 metrics + bandit allocation
                         ↓ (2s delay)
                    [Simulator] → day 2 (bandit reallocates, kills losers)
                         ↓ (2s delay)
                    [Simulator] → day 3 (final metrics)
                         ↓
                    [Analyst] → narrative + attribution + markComplete
```

All DB writes trigger reactive `useQuery` updates on the dashboard — no polling.

---

## File Count

- Frontend (Steven): 15 files
- Backend (Nori): 12 files
- Shared: 3 files (CLAUDE.md, package.json, .env.local)
- Total source files: ~30 (excluding generated/config)
