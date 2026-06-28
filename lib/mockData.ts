import type { Product, Hypothesis, Variant, Metric, ExperimentRun } from "./types";
import type { Id, TableNames } from "../convex/_generated/dataModel";

// Deterministic fake IDs for mock data — these will be replaced by real Convex IDs
// when Nori's backend is ready. Cast is safe for mocks only.
function fakeId<T extends TableNames>(table: T, n: number): Id<T> {
  return `mock_${table}_${n}` as unknown as Id<T>;
}

export const MOCK_BATCH_ID = "batch_001";

export const MOCK_PRODUCT: Product = {
  _id: fakeId("products", 1),
  _creationTime: Date.now(),
  name: "Reachly",
  landingUrl: "https://reachly.io",
  valueProp: "AI-powered cold email that actually gets replies. 3x response rates in 14 days.",
  targetCustomer: "B2B SaaS founders and sales teams (10-50 employees) doing outbound",
  pricing: "$99/mo starter, $299/mo growth, $799/mo scale",
  painPoint: "Cold emails land in spam or get ignored. SDRs waste hours writing personalized outreach that still gets 1-2% reply rates.",
  dailyBudget: 200,
  totalBudget: 2000,
  maxCPC: 4.5,
  targetCAC: 85,
  goal: "Maximize trial signups while keeping CAC under $85",
};

export const MOCK_HYPOTHESES: Hypothesis[] = [
  {
    _id: fakeId("hypotheses", 1),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    text: "Pain-led hooks outperform benefit-led hooks for B2B SaaS",
    reasoning:
      "B2B buyers are more motivated by avoiding loss (wasted SDR hours, missed quota) than by gain. A hook that opens with the pain of low reply rates should drive higher CTR and lower CAC than one that leads with '3x your replies'.",
  },
  {
    _id: fakeId("hypotheses", 2),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    text: "Founder-voice ads convert better than polished narrator ads",
    reasoning:
      "Startup buyers trust founders over brands. A casual, direct-to-camera founder voice should feel more authentic and drive higher CVR than a professional narrator, even if CTR is similar.",
  },
  {
    _id: fakeId("hypotheses", 3),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    text: "Fast-paced cuts with metric callouts reduce CAC vs. slow-burn storytelling",
    reasoning:
      "Short attention spans on social feeds reward quick cuts. Showing concrete numbers (reply rate %, hours saved) in rapid succession should hook analytical B2B buyers faster than narrative arcs.",
  },
];

export const MOCK_VARIANTS: Variant[] = [
  {
    _id: fakeId("ad_variants", 1),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "pain-point",
    scriptType: "problem-solution",
    voice: "founder",
    music: "minimal-ambient",
    pacing: "fast",
    cta: "Start free trial",
    audience: "SaaS founders 25-45",
    script: "Your SDRs are sending 200 cold emails a day. How many replies? Probably 3. Reachly uses AI to write emails that sound like a human wrote them for each prospect. Our users see 3x reply rates in the first two weeks. Stop burning your sales team out.",
    hypothesis: MOCK_HYPOTHESES[0].text,
    budget: 50,
    killRule: "Kill if CAC > $120 after day 2",
    scaleRule: "Scale 2x if CAC < $70 and CVR > 2%",
  },
  {
    _id: fakeId("ad_variants", 2),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "statistic",
    scriptType: "demo-walkthrough",
    voice: "narrator",
    music: "upbeat-electronic",
    pacing: "medium",
    cta: "See it in action",
    audience: "Sales leaders & VPs",
    script: "97% of cold emails never get a reply. Watch what happens when we plug Reachly into a real sales pipeline. Step 1: import your leads. Step 2: AI researches each prospect. Step 3: personalized emails go out. Result: 3x more meetings booked.",
    hypothesis: MOCK_HYPOTHESES[0].text,
    budget: 25,
    killRule: "Kill if CAC > $120 after day 2",
    scaleRule: "Scale 2x if CAC < $70 and CVR > 2%",
  },
  {
    _id: fakeId("ad_variants", 3),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "question",
    scriptType: "problem-solution",
    voice: "founder",
    music: "none",
    pacing: "fast",
    cta: "Try free for 14 days",
    audience: "SaaS founders 25-45",
    script: "What if your cold emails actually got replies? I built Reachly because my sales team was drowning in manual outreach. Now AI handles the personalization and my team focuses on closing. It took us from 2% to 8% reply rates.",
    hypothesis: MOCK_HYPOTHESES[1].text,
    budget: 25,
    killRule: "Kill if CAC > $110 after day 2",
    scaleRule: "Scale 2x if CAC < $65 and CVR > 2.5%",
  },
  {
    _id: fakeId("ad_variants", 4),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "contrarian",
    scriptType: "before-after",
    voice: "founder",
    music: "minimal-ambient",
    pacing: "medium",
    cta: "Start free trial",
    audience: "SDRs and AEs",
    script: "Personalization is a lie. At least the way most teams do it. Swapping {first_name} isn't personal. Reachly reads your prospect's LinkedIn, recent posts, and company news, then writes an email only a human could have written. Before: 2% replies. After: 9%.",
    hypothesis: MOCK_HYPOTHESES[1].text,
    budget: 25,
    killRule: "Kill if CAC > $100 after day 2",
    scaleRule: "Scale 2x if CAC < $60 and CVR > 3%",
  },
  {
    _id: fakeId("ad_variants", 5),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "pain-point",
    scriptType: "testimonial",
    voice: "customer",
    music: "upbeat-electronic",
    pacing: "medium",
    cta: "Get 3x more replies",
    audience: "SaaS founders 25-45",
    script: "I was about to fire my SDR team. Not because they were bad — because cold email was broken. Then we tried Reachly. First week: reply rates went from 1.5% to 6%. Second week: 8%. Now we book 40 demos a month from outbound alone.",
    hypothesis: MOCK_HYPOTHESES[1].text,
    budget: 25,
    killRule: "Kill if CAC > $120 after day 2",
    scaleRule: "Scale 2x if CAC < $70 and CVR > 2%",
  },
  {
    _id: fakeId("ad_variants", 6),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "statistic",
    scriptType: "problem-solution",
    voice: "narrator",
    music: "minimal-ambient",
    pacing: "fast",
    cta: "Start free trial",
    audience: "Sales leaders & VPs",
    script: "Sales teams waste 68% of their time on emails that never get opened. Reachly's AI writes cold emails that sound human, reference real prospect activity, and land in the primary inbox. Teams using Reachly see 3x reply rates and 2x more meetings.",
    hypothesis: MOCK_HYPOTHESES[2].text,
    budget: 15,
    killRule: "Kill if CAC > $130 after day 2",
    scaleRule: "Scale 2x if CAC < $75 and CVR > 2%",
  },
  {
    _id: fakeId("ad_variants", 7),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "question",
    scriptType: "demo-walkthrough",
    voice: "founder",
    music: "none",
    pacing: "slow",
    cta: "See it in action",
    audience: "SDRs and AEs",
    script: "Want to see the email that booked us a meeting with Stripe's head of sales? Here it is. Reachly wrote it in 4 seconds. It referenced their Q3 earnings call and a LinkedIn post from last Tuesday. That's not a template. That's AI that actually understands your prospect.",
    hypothesis: MOCK_HYPOTHESES[2].text,
    budget: 20,
    killRule: "Kill if CAC > $110 after day 2",
    scaleRule: "Scale 2x if CAC < $65 and CVR > 2.5%",
  },
  {
    _id: fakeId("ad_variants", 8),
    _creationTime: Date.now(),
    productId: MOCK_PRODUCT._id,
    batchId: MOCK_BATCH_ID,
    hookType: "contrarian",
    scriptType: "before-after",
    voice: "customer",
    music: "upbeat-electronic",
    pacing: "fast",
    cta: "Try free for 14 days",
    audience: "SaaS founders 25-45",
    script: "Everyone told me AI email tools are spammy. I believed them until I saw Reachly's output side by side with what my best SDR wrote. I couldn't tell the difference. Neither could our prospects. 6 months later: 3x pipeline, same team size.",
    hypothesis: MOCK_HYPOTHESES[2].text,
    budget: 15,
    killRule: "Kill if CAC > $120 after day 2",
    scaleRule: "Scale 2x if CAC < $70 and CVR > 2%",
  },
];

// Seeded metrics across 3 simulated days for all 8 variants.
// Variant 1 (pain-point + founder + fast) is the winner — lowest CAC.
// Variant 2 (statistic + narrator) gets killed on day 2 — high CAC.
function buildMetrics(): Metric[] {
  const metrics: Metric[] = [];
  let counter = 1;

  const dayData: Record<number, { impressions: number; ctr: number; cvr: number; cpc: number }[]> = {
    // Day 1: exploration — all variants get similar spend
    1: [
      { impressions: 1200, ctr: 0.042, cvr: 0.028, cpc: 2.80 },  // v1 — good
      { impressions: 1100, ctr: 0.031, cvr: 0.012, cpc: 3.90 },  // v2 — weak
      { impressions: 1050, ctr: 0.038, cvr: 0.022, cpc: 3.10 },  // v3
      { impressions: 980, ctr: 0.044, cvr: 0.025, cpc: 2.95 },   // v4
      { impressions: 1150, ctr: 0.035, cvr: 0.019, cpc: 3.40 },  // v5
      { impressions: 900, ctr: 0.029, cvr: 0.014, cpc: 4.10 },   // v6 — weak
      { impressions: 1000, ctr: 0.036, cvr: 0.020, cpc: 3.20 },  // v7
      { impressions: 950, ctr: 0.040, cvr: 0.023, cpc: 3.00 },   // v8
    ],
    // Day 2: bandit starts shifting — winners get more budget
    2: [
      { impressions: 1800, ctr: 0.045, cvr: 0.031, cpc: 2.60 },  // v1 — scaling
      { impressions: 600, ctr: 0.028, cvr: 0.010, cpc: 4.20 },   // v2 — killed
      { impressions: 1200, ctr: 0.040, cvr: 0.024, cpc: 2.90 },  // v3
      { impressions: 1400, ctr: 0.046, cvr: 0.027, cpc: 2.75 },  // v4 — rising
      { impressions: 1100, ctr: 0.033, cvr: 0.018, cpc: 3.50 },  // v5
      { impressions: 500, ctr: 0.026, cvr: 0.011, cpc: 4.40 },   // v6 — killed
      { impressions: 900, ctr: 0.034, cvr: 0.019, cpc: 3.30 },   // v7
      { impressions: 1000, ctr: 0.041, cvr: 0.024, cpc: 2.85 },  // v8
    ],
    // Day 3: exploitation — clear winners and losers
    3: [
      { impressions: 2800, ctr: 0.048, cvr: 0.034, cpc: 2.40 },  // v1 — winner
      { impressions: 0, ctr: 0, cvr: 0, cpc: 0 },                // v2 — dead
      { impressions: 1400, ctr: 0.041, cvr: 0.026, cpc: 2.80 },  // v3
      { impressions: 2200, ctr: 0.049, cvr: 0.030, cpc: 2.50 },  // v4 — strong
      { impressions: 800, ctr: 0.030, cvr: 0.016, cpc: 3.60 },   // v5 — fading
      { impressions: 0, ctr: 0, cvr: 0, cpc: 0 },                // v6 — dead
      { impressions: 700, ctr: 0.032, cvr: 0.017, cpc: 3.40 },   // v7 — fading
      { impressions: 1100, ctr: 0.043, cvr: 0.026, cpc: 2.70 },  // v8
    ],
  };

  for (let day = 1; day <= 3; day++) {
    for (let vi = 0; vi < 8; vi++) {
      const d = dayData[day][vi];
      const clicks = Math.round(d.impressions * d.ctr);
      const conversions = Math.round(d.impressions * d.cvr);
      const spend = clicks * d.cpc;
      const cac = conversions > 0 ? spend / conversions : 0;

      metrics.push({
        _id: fakeId("campaign_metrics", counter++),
        _creationTime: Date.now(),
        variantId: MOCK_VARIANTS[vi]._id,
        batchId: MOCK_BATCH_ID,
        day,
        impressions: d.impressions,
        clicks,
        conversions,
        spend: Math.round(spend * 100) / 100,
        cpc: d.cpc,
        ctr: d.ctr,
        cac: Math.round(cac * 100) / 100,
        cvr: d.cvr,
      });
    }
  }

  return metrics;
}

export const MOCK_METRICS: Metric[] = buildMetrics();

export const MOCK_EXPERIMENT: ExperimentRun = {
  _id: fakeId("experiment_runs", 1),
  _creationTime: Date.now(),
  productId: MOCK_PRODUCT._id,
  batchId: MOCK_BATCH_ID,
  status: "complete",
  startedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
};

export const MOCK_AGENT_REASONING = {
  strategist: `Analyzing Reachly's positioning in the B2B cold-email space...

The core tension: cold email has a reputation problem. Most tools promise "personalization" but deliver mail-merge with {first_name} tokens. Reachly's genuine AI personalization is a real differentiator, but the market is skeptical.

Three hypotheses to test:

1. PAIN-LED vs. BENEFIT-LED HOOKS
B2B buyers are loss-averse. "Your SDRs are wasting 68% of their time" should outperform "Get 3x more replies." Testing pain-point and contrarian hooks against statistic and question hooks.

2. FOUNDER VOICE vs. POLISHED PRODUCTION
The startup audience trusts authenticity. A founder talking direct-to-camera with no music should feel more credible than a narrator with upbeat production. Testing across voice and music dimensions.

3. PACING AND PROOF
Fast cuts with concrete metrics (reply rates, meetings booked) vs. slow-burn storytelling. The B2B audience is analytical — numbers should win.

Allocating budget: 50/200 to the strongest hypothesis (pain + founder), 25 each to variants testing individual dimensions, 15-20 to exploratory combinations.`,
  analyst: `Campaign complete. 3 days, 8 variants, $2,000 budget.

WINNER: Variant 1 (pain-point hook + founder voice + fast pacing)
- Day 3 CAC: $70.59 — well under the $85 target
- CTR climbed from 4.2% to 4.8% across days — creative isn't fatiguing
- CVR hit 3.4% by day 3 — highest in the batch

KEY FINDING: The pain-point + founder combination is 2.3x more efficient than statistic + narrator (Variant 2, killed on day 2 with $120+ CAC). This confirms Hypothesis 1.

SURPRISING: Variant 4 (contrarian + founder + before-after) was the #2 performer. The contrarian hook "Personalization is a lie" paired with a founder voice created an authenticity signal that drove strong CVR. Consider this a new hypothesis for Batch 2.

KILLED: Variants 2 and 6 (both narrator voice). Narrator consistently underperformed founder and customer voices — the polished production read as "ad" rather than "advice."

RECOMMENDATION FOR BATCH 2:
- Double down on pain-point and contrarian hooks with founder voice
- Test customer testimonial + contrarian as a new combination
- Drop narrator voice entirely
- Explore "slow" pacing with founder voice (untested combination)`,
};
