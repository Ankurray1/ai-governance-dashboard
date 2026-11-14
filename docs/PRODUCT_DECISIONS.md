# Product decisions log — how we got here

The reasoning behind the prototype, in the order decisions were made. `CLAUDE.md` has the rules; this file has the "why".

## 1. Framing the problem
"AI governance" is really four jobs: **See** (what AI exists), **Spend** (cost vs limits), **Risk** (data/compliance), **Value** (is it worth it). The brief sits in *See + Spend*, with a slice of *Risk*. Market lanes for context: compliance/model-risk platforms (Credo AI, IBM, ServiceNow, OneTrust — Gartner's first Magic Quadrant for AI Governance Platforms, June 2026), **SaaS/AI spend management** (Torii, Zylo, Productiv, CloudEagle), AI FinOps for tokens (Finout, CloudNuro), AI security/DLP (Harmonic, LayerX, Nudge). This prototype lives in the spend-management lane.

Why it matters (vendor research, directional only): unsanctioned AI use rose sharply in 2026 surveys (Verizon DBIR: 15% → 45% of employees; PagerDuty: 66% used AI they believed wasn't permitted); Zylo's 2026 index: AI-native app spend +108% (+393% at 10k+ employee firms), ChatGPT now the most-expensed app; FinOps Foundation: 98% of FinOps teams now manage AI spend.

## 2. Large MNC vs startup
- **MNC:** deep cost hierarchy (region → BU → department → cost centre → team → person/agent), federated budgets, mixed seat + consumption billing, unclear ownership (CAIO vs CIO vs CISO), agents as new identities, multi-jurisdiction rules (EU AI Act high-risk duties now Dec 2027; India DPDP full compliance May 2027). Core problem: **attribution and accountability**.
- **Startup/mid-size:** flat, card-based buying, founder wears CEO/CFO hats, risk = bill shock and duplicate tools, compliance driven by customer security reviews. Core problem: **visibility of burn and caps**.
- Decision: use one **universal 5-level hierarchy** (L1 CEO · L2 CTO/CFO/COO · L3 dept heads · L4 managers · L5 employees + agents) for all sizes; a startup just has one person in several roles.

## 3. Personas and metrics
Each level needs common metrics (same metric, narrower scope) plus a few of its own:
- **Common (L1–L4, scoped):** total AI spend, spend vs limit, expected month-end, limit alerts, trend, adoption rate, unused seats, cost per active user, top tools, approved vs unapproved share, risk events, tool count.
- **Unique:** CEO — AI spend % of opex, year-end vs plan, adoption maturity. CFO — budget vs actual by dept, spend with no owner, fixed vs pay-per-use, renewals, expensed AI. CTO — API spend by project/model, shadow tools, sensitive-data events, SSO coverage, agents with no owner. COO — adoption by dept, duplicate tools, hours saved. Dept head — dept vs budget, rank, requests. Manager — per-person usage, reclaimable seats, leavers with seats, owned agents. Employee — my allowance, approved catalog, my flags.

## 4. Narrowing to the brief (most important decisions)
- The brief asks for **one screen** for a **CFO or IT/security lead** → built for them; other levels become filters.
- Every element must answer: *who uses what / what does it cost / is it within approved limits* (+ Shadow AI).
- **Correction we made:** an early draft claimed to count people on *free personal accounts* and said "company data may be leaving". We can't see either. Fixed: unauthorised use is detected only via work-email sign-ups, connected work accounts and expense claims, shown as a *minimum*, below the fold, never as a headline number.
- Sensitive-data alerts limited to approved enterprise tools with audit logs.
- Removed "AI inside our own product" (different problem: product cost) and moved "unused licences" out of the headline row.
- Added an **assumption block** (which 9 tools the company pays for, by text/video/voice/image) so every number is grounded.
- Merged "spend so far" and "budget used" into one wide card with a fixed vs pay-per-use split.
- Added **top tools per department** next to the department budget chart (click a department to see its tools).
- When filtering by location/level/tool type, budget lines hide (budgets only exist per department).

## 5. Build history
1. Canvas wireframe (CFO view, 3 charts + needs-attention list).
2. Persona discussion → universal 5 levels.
3. Narrowed, honest version (assumptions, filters, tools by category, unauthorised tools, data alerts).
4. Mock dataset of 2,400 employees + fully interactive dashboard.
5. This React/Vite project (same logic, single-file build).
