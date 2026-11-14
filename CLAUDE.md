# CLAUDE.md — AI Governance Dashboard (PM assignment prototype)

Read this first. It is the full context for this project. Longer reasoning lives in `docs/PRODUCT_DECISIONS.md`.

## What this is
A PM take-home assignment: design ONE screen of an "AI Governance Dashboard" that shows **AI tool usage and spend limits across an organisation**, for a **non-technical stakeholder (CFO or IT/security lead)**. The problem is "Shadow AI": teams adopting ChatGPT, Claude, Copilot, Midjourney etc. without central visibility of who uses what, what it costs, and whether usage stays within approved limits.

Assignment parts:
1. **Prototype one screen** (product thinking > visual polish; rough but clearly labelled is fine).
2. **API & data-source plan** — what we'd pull from.
3. **Pick three charts** — if only three, which and why.

Author: Ankur (Product Manager). The reviewer is evaluating product judgment, simplicity and honesty about data.

## Golden rules (do not break)
- **Simple, plain language.** No jargon on screen. Money and people, never tokens or prompts. Use these labels:
  "Spend with no owner" (not unattributed spend) · "Fixed vs pay-per-use" (not seat vs consumption) · "Approved / unapproved" · "Unused licences/seats" · "Expected by month-end" (not forecast to period end).
- **Every element must trace back to the brief's three questions:** Who is using what? How much does it cost? Is usage within approved limits? (+ Shadow AI). If it doesn't answer one, cut it.
- **Never show data we couldn't really get.** See "What we can and can't see" below. Claiming visibility we don't have is the worst mistake this project can make.
- **Do not copy CloudEagle.ai (or any company's) design or branding.** Use generic SaaS-admin patterns in our own original look. The folder name is just where the portfolio lives.
  - **Exception (Ankur's decision, 14 Nov 2026):** the header badge shows CloudEagle.ai's real name and logo icon (`src/assets/cloudeagle-icon.png`, the blue round icon from cloudeagle.ai / their LinkedIn). Also (same day, Ankur's request): the colour theme uses CloudEagle's palette (blue #2145FF, navy #111B31, slate greys, Outfit font), with a glowing-gradient hero, tick dial and rounded pill controls inspired by the Dribbble "Spinetic" app shot. Theme lives in the "THEME LAYER" block at the end of `src/styles.css`. Colour meaning is unchanged. Don't remove the logo or theme without asking.
- Data is mock but must look real and must add up (teams → departments → company).

## Audience and scope decisions
- Primary viewer: **CFO**, secondary: **IT/Security lead** ("Viewing as CFO"). The CEO/board get a summary of this, they don't operate it.
- One screen. Other hierarchy levels are served by **filters** (department, location, level), not extra screens.
- Hierarchy used everywhere (universal across company sizes; in a startup one person holds several roles):
  - L1 CEO · L2 CTO / CFO / COO · L3 Department heads / VPs · L4 Managers / Team leads · L5 Employees (+ AI agents, owned by an L4 — future scope)
- "Limit" = **monthly AI budget per department** (set by Finance) + **approved seats per tool** + **usage caps on pay-per-use tools** (video/voice). Budgets exist per department only → when filtering by location/level/tool type, hide budget lines and show spend only.

## What we can and can't see (Shadow AI honesty)
| How someone uses an unapproved tool | Visible? | How |
|---|---|---|
| Pays and expenses it / company card | Yes (tool + cost) | Expense claims, card feeds |
| Signs up with work email / "Sign in with Microsoft/Google" / connects work calendar | Yes (tool + person) | Okta / Microsoft Entra / Google Workspace login & connected-app logs |
| Personal account on company laptop/network | Partly (tool, not person) | Web security tools (Zscaler, Netskope, Defender) — only if the company has one; out of scope for v1 |
| Personal account on personal device | **No** | Nobody can. Policy/training problem. |
Therefore: Shadow AI is shown as **tools found + people found (a minimum)** with "how we found it" and the approved alternative — **never** as a headline KPI. Sensitive-data alerts are shown **only for approved enterprise tools** (their audit logs); we never claim to see what people type into unauthorised tools.

## Part 2 — data sources (answer)
| Need | Source |
|---|---|
| Spend, seats, last activity | Vendor admin/billing APIs: OpenAI Admin API (Usage + Costs, admin key), Anthropic Admin API (usage_report, cost_report), Microsoft Graph Copilot usage reports (licensed users only, ~48h delay), GitHub billing usage API; **invoices** for tools without APIs (e.g. Midjourney) |
| People, departments, managers, leavers | HR system (Workday / Darwinbox / BambooHR) |
| Unauthorised tools | Identity provider logs (Okta / Entra / Google Workspace) + expense / corporate-card data |
| Sensitive data alerts | Enterprise AI audit/compliance logs + company DLP (e.g. Microsoft Purview) |
| Budgets | Finance (entered in tool or imported from planning tool) |
Known gaps to state openly: personal accounts invisible; not every vendor has an API; data is 1–2 days behind for some vendors.

## Part 3 — the three charts (current answer)
1. **Spend vs budget by department** (bar per dept: spent, expected by month-end, budget line) → *who* is over/near their limit.
2. **This month's spend vs the limit** (spent so far split fixed vs pay-per-use, expected month-end) → *when/whether* we cross.
3. **AI tools by people using them, approved vs unapproved** (with cost where known, and how unapproved ones were found) → *what* people use and what we don't control.
Rejected: pie of vendors (shows split, not problems), token/prompt counts, active-users trend alone (vanity), agents/compliance/ROI (later).

## Assumed company + tool stack (mock)
Acme Corp, 2,400 employees, offices Bengaluru 1,103 · Pune 450 · London 379 · New York 299 · Singapore 169. As-of date 20 Nov 2026 (day 20 of 30).
Departments (headcount, monthly AI budget): Engineering 700 $25k · Marketing 260 $18k · Sales 520 $22k · Support 480 $18k · Product & Design 160 $10k · Finance & Ops 180 $7k · HR 100 $5k → $105k.
Approved tools (assumed $/seat/mo): Text & chat — ChatGPT Enterprise $45, Microsoft 365 Copilot $30, Claude Enterprise $40 · Video — Synthesia $65 (+usage, cap $2k), Runway $35 (+usage, cap $1.8k) · Voice — ElevenLabs $22 (+usage, cap $1.5k), Otter.ai $20 · Image — Midjourney $60 (**invoice only, no usage data**), Adobe Firefly $30.
Unapproved found: Perplexity, Fireflies.ai, Claude Pro (personal, expensed), Leonardo.ai, DeepSeek, HeyGen, Suno.
Headline mock results: spent $97,100 of $105,000 (92%), expected $99,500; Engineering (104%) and Marketing (118%) over; Runway usage cap reached; 18 leavers still hold seats; 174 people on unauthorised tools; 38 data alerts.

## Tech
- React 18 + TypeScript + Vite, plain CSS (tokens in `src/styles.css`), no chart library (bars are divs).
- `vite-plugin-singlefile` → `npm run build` makes `dist/index.html`, one self-contained file. After building, copy it to `AI-Governance-Dashboard.html` in the project root (that's the double-click deliverable).
- Commands: `npm install` · `npm run dev` · `npm run build`.

## File map
- `src/data/model.ts` — ALL calculations. `compute(filters)` returns everything the screen shows. Keep logic here; components only render.
- `src/data/acme_ai_governance.json` — compact dataset the app imports (generated).
- `src/components/` — Sidebar, FilterBar, KpiRow (spend vs budget + quick-fact chips), Budgets (dept chart + top tools panel), ToolsTable, ShadowAI, DataAlerts, People (table + person detail).
- `data/csv/` — human-readable dataset (employees, ai_licences, unauthorised_ai, sensitive_data_alerts, department_budgets).
- `scripts/generate_mock_data.py` — regenerates dataset (seed 20261120). Run it from the project root (`python scripts/generate_mock_data.py`); it overwrites `src/data/acme_ai_governance.json` and `data/csv/*.csv`.

## Conventions
- Colours carry meaning only: blue = OK/approved, amber = near limit / waste, red = over limit / risk, orange = unauthorised. Status thresholds: >100% over, ≥85% near.
- Accessibility: real buttons/links, labels on inputs, ≥40px targets, text contrast ≥4.5:1.
- Any number on screen must be computable from the dataset. No hard-coded totals.

## Open items / next steps
- Write the short submission doc (Part 1 rationale, Part 2 table, Part 3 three charts) — can be generated from this file + README.
- Optional: "View as" switcher for L1–L5 personas; month-over-month trend once a second month of data exists; AI-agent inventory (owner, spend vs cap) as v2.
