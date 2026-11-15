# AI Governance Dashboard — Submission

**Prepared by:** Ankur Ray · **For:** a CFO or IT / security lead (non-technical) · **Sample company:** 2,400 employees, 7 departments, $105,000 monthly AI budget

## Part 1: Prototype a screen
One screen: <https://ankurray1.github.io/ai-governance-dashboard/>

It answers the brief's questions in order:
1. **How much does it cost?** AI spend this month vs budget ($97,100 of $105,000, 92% used), split into licences and pay-per-use.
2. **Who is using what?** AI adoption (58% of employees used approved AI in the last 30 days) and the most-used tools.
3. **Is usage within approved limits?** Spend vs budget by department, and each approved tool against its own limit (licences or spending cap).
4. **Shadow AI.** Unapproved AI use (at least 7.3% of employees, 174 people on 7 tools) and sensitive data alerts (26 of 38 still to review).

Every card has an **"i"** that explains the number, how it's worked out, and where the data comes from.

## Part 2: API & data source plan

| # | Feature | API & Data Sources | Purpose |
|---|---|---|---|
| 1 | AI spend vs budget | Vendor billing APIs (OpenAI, Anthropic, Microsoft) + invoices + budget set by Finance | How much we spent this month vs the budget |
| 2 | AI adoption | Vendor admin APIs + HR system | Who used AI in the last 30 days |
| 3 | Unapproved AI use | Sign-in logs (Okta / Microsoft Entra) + expense claims | How many people use unapproved AI |
| 4 | Data alerts to review | Data-protection tool (Microsoft Purview) | Alerts nobody has checked yet |
| 5 | Spend vs budget by department | Vendor billing APIs + HR system + budgets set by Finance | Which team spent it, and its budget |
| 6 | Unapproved AI tools | Sign-in logs + work calendar access + expense claims | Which tools, and how we found them |
| 7 | Sensitive data alerts | Data-protection tool (Microsoft Purview) + HR system | What was shared, by whom, in which tool |
| 8 | Approved AI tools | Vendor admin APIs + invoices | Licences bought vs used, and spending caps |

**Note:** personal AI accounts on personal devices can't be seen.

## Part 3: Pick your three charts

| Rank | Metric | Why this metric? |
|---|---|---|
| 1 | Department Spend vs. Budget Limit | Pinpoints exactly which teams are over budget · Assigns direct accountability to named leaders (VP Eng, Head of Mktg) for immediate action |
| 2 | Total AI Spend vs. Budget Ceiling | Prevents month-end bill shock by tracking spend pacing against calendar days · Gives an early trigger to freeze variable consumption caps before the Limit is breached |
| 3 | Active Tool Adoption: (Shadow AI) | Flags paid licenses that are sitting idle and unused so that cost can be reduced · Uncovers Shadow AI defection |
