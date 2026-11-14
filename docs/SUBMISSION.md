# AI Governance Dashboard — Assignment Submission

**Author:** Ankur (Product Manager)  
**Target Stakeholders:** Chief Financial Officer (CFO) & IT / Security Lead  
**Scope Context:** Week 1 scoping of an enterprise AI Governance feature for Acme Corp (2,400 employees, 7 departments, $105,000 monthly AI budget).

---

## Executive Summary & Problem Framing

Organizations are adopting AI at breakneck speed. Employees use AI tools (ChatGPT, Claude, Copilot, Midjourney, etc.) to draft documents, generate code, summarize meetings, and create design collateral. However, leadership faces the **"Shadow AI" dilemma**:
1. **Who is using what?** (Adoption visibility vs. zombie seats)
2. **How much does it cost?** (Fixed seat licenses vs. consumption runaways)
3. **Is usage staying within approved limits?** (Departmental budget ceilings and tool-level token caps)
4. **What company risk is being introduced?** (Unsanctioned tools and confidential data leakage)

This document presents **Part 2: API & Data Source Plan**, detailing the data sources, API endpoints, integration mechanics, data freshness SLAs, and critical edge cases required to power the AI Governance Dashboard.

---

## Part 2: API & Data Source Plan

### 1. Data Architecture: The 3 Core Automated Ingestion Layers + Admin Settings

To solve the governance problem without building complex proprietary telemetry clients on day one, we aggregate automated data across **three enterprise systems of record**, while managing budgets and non-API tools through **lightweight in-app administrative configuration**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                     AI GOVERNANCE DASHBOARD                            │
 └───────▲────────────────────▲────────────────────▲────────────────▲─────┘
         │                    │                    │                │
 ┌───────┴────────┐   ┌───────┴────────┐   ┌───────┴────────┐   ┌───┴────────────┐
 │  1. Identity & │   │ 2. Direct AI   │   │  3. Expense &  │   │ 4. Security &  │
 │     Org (HRIS) │   │    Vendor APIs │   │     Corp Cards │   │     DLP Stream │
 ├────────────────┤   ├────────────────┤   ├────────────────┤   ├────────────────┤
 │ • Workday/Okta │   │ • OpenAI Admin │   │ • Ramp Webhooks│   │ • MS Purview   │
 │ • SCIM 2.0     │   │ • MS Graph     │   │ • Brex API     │   │ • O365 Audit   │
 │ • Entra ID     │   │ • Anthropic    │   │ • Expensify    │   │ • CASB / DLP   │
 └────────────────┘   └────────────────┘   └────────────────┘   └────────────────┘
         │
         ▼
 [ Native Admin Configuration ]: Monthly Department Budgets ($105,000 ceiling)
 and non-API seat counts (e.g. Midjourney) are configured directly in Settings by Finance.
```

---

### 2. Comprehensive API & Data Source Matrix

| Dashboard Metric / Card | Required Data | Primary Source / API | Exact Endpoint / Method | Integration Type & Latency | PM Rationale & Practical Nuance |
|---|---|---|---|---|---|
| **AI Spend This Month vs Budget** (Hero Card) | • Total MTD spend ($97,100)<br>• Monthly budget ($105,000)<br>• Fixed vs Pay-per-use split | • **Vendor Billing APIs** (OpenAI, Anthropic, Azure AI)<br>• **Corporate Card APIs** (Ramp, Brex)<br>• *Manual Admin Config (Budget)* | • OpenAI `/v1/organization/costs`<br>• Anthropic `cost_report`<br>• Ramp `/developer/v1/transactions`<br>• Admin Settings (Budget: $105k) | **Hourly Webhooks & Daily Sync**<br>Direct APIs: ~2h latency<br>Budget: Manual Setting | **PM Decision on Budgets:** Department budgets change quarterly or annually. Rather than building and maintaining fragile, expensive API pipelines to NetSuite/Anaplan, Finance sets or uploads budget ceilings directly in Admin Settings. Spend is tracked live via vendor billing APIs and card webhooks. |
| **Department Spend vs Budget** (Budget Chart) | • Spend per department<br>• Month-end forecast<br>• Dept budget limits<br>• Dept owners | • **HRIS** (Workday / BambooHR)<br>• **Vendor Usage by Workspace** (OpenAI, Anthropic)<br>• *Manual Admin Config (Dept Budgets)* | • SCIM 2.0 User Sync (`/Users`, `/Groups`)<br>• Workday RaaS (Report-as-a-Service)<br>• OpenAI Projects/Workspaces API | **Nightly SCIM Sync**<br>Hierarchy: Daily<br>Spend: Daily | Department owners (e.g. VP Eng, Head of Mktg) and employee assignments are dynamically pulled from HRIS via SCIM. Budgets exist **only at the department level** and are configured directly by Finance. |
| **AI Adoption Rate** (KPI Card) | • Active users last 30d (1,392)<br>• Total employee baseline (2,400)<br>• % adoption vs target (58% vs 70%) | • **HRIS** (Employee headcount)<br>• **Vendor Admin Activity Telemetry** | • HRIS Active Employee Count (`status == 'ACTIVE'`)<br>• OpenAI `/v1/organization/users` (`last_active_at`)<br>• Microsoft Graph `reports/getOffice365ActiveUserDetail(period='D30')` | **Daily Telemetry Batch**<br>Latency: 24–48 hours (Microsoft Graph limitation) | Adoption cannot simply be "licenses bought." It requires checking `last_active_at <= 30 days`. Ghost/zombie licenses (paying $45/mo for someone who never logged in) are flagged for reclamation. |
| **Approved AI Tools** (Carousel / Table) | • Seat count & cost<br>• Active usage %<br>• Pay-per-use caps<br>• Tool status | • **Vendor Admin APIs** (OpenAI, Anthropic, MS Graph, Synthesia, Runway, ElevenLabs)<br>• *Manual Admin Config (Midjourney)* | • OpenAI `/v1/organization/users`<br>• Azure Cognitive Services Usage API<br>• Runway / ElevenLabs Webhooks<br>• Admin Settings (Midjourney seats) | **Direct APIs (Daily Sync)**<br>Midjourney: Manual Setting | **PM Decision on Invoiced Tools:** Midjourney has no enterprise user-telemetry API and operates via Discord. Rather than setting up complex Accounts Payable OCR ingestion, Finance simply enters the number of paid Midjourney seats in Admin Settings. Telemetry tools run via direct APIs. |
| **Unapproved AI Tools** ("Shadow AI") | • Tool names & categories<br>• Detected users (174 min)<br>• Discovery vector<br>• Approved alternative | • **Identity Provider** (Okta / Entra / Google Workspace)<br>• **Corporate Card & Expense Feeds** (Ramp / Brex / Expensify)<br>• **Calendar & OAuth App Permissions** | • Okta System Log API (`eventType eq "user.authentication.auth_via_social"` or app sign-ins)<br>• Microsoft Graph `oauth2PermissionGrants`<br>• Ramp Developer API (`/developer/v1/transactions` filtered by MCC / AI merchant list)<br>• Google Workspace Third-Party Apps | **Near Real-Time Event Stream**<br>IdP: Webhook / Log Stream<br>Expenses: Daily webhook | **Zero-Agent Architecture:** Discovers Shadow AI without installing intrusive desktop endpoint spyware. We catch: 1) work email SSO logins, 2) calendar note-taker bot grants (Fireflies/Otter), and 3) expensed personal subscriptions on company cards. |
| **Sensitive Data Alerts** (DLP Card) | • Alert counts (38 total)<br>• Categories (Customer PII, Financials, Passwords)<br>• Tool & user involved<br>• Review status | • **Cloud Security & Enterprise DLP** (Microsoft Purview / O365 Management API)<br>• **OpenAI Enterprise Audit Logs** | • Office 365 Management Activity API (`DlpMatches`, `SensitivityLabelAction`)<br>• OpenAI `/v1/organization/audit_logs` (event types: `sensitive_flag`, `data_export`)<br>• Netskope / Cloudflare Zero Trust DLP Webhooks | **Real-Time Security Event Stream**<br>Push webhook: < 5 mins | **Strict Scope:** We **only** show data alerts for *approved enterprise tools* that have DLP hooks. We never falsely claim to inspect prompt text entered into personal accounts or unmanaged tools. |

---

### 3. Detailed Data Sourcing Specifications by Domain

#### A. Identity & Organizational Baseline (The "Who")
- **Primary Systems:** Workday, BambooHR, Rippling (via SCIM 2.0 protocol) + Okta / Microsoft Entra ID.
- **Data Points Collected:**
  - `employee_id`, `work_email`, `full_name`, `department`, `team`, `manager_id`, `employment_status` (`ACTIVE` vs `TERMINATED`), `location`.
- **Key PM Value:**
  - Identifies **deprovisioning gaps**: Employees who have left the company (`TERMINATED` in HRIS) but still occupy paid AI seats in OpenAI or Copilot. In Acme Corp's dataset, this catches **18 ex-employees still consuming licenses**, generating immediate cost savings.

#### B. Direct AI Vendor Admin & Telemetry (The "What" & "How Much")
- **ChatGPT Enterprise:**
  - Endpoint: `https://api.openai.com/v1/organization/users` and `/v1/organization/costs`.
  - Auth: Enterprise Admin API Key.
  - Sourced Data: Active seat allocation, user login timestamp, token consumption overages, total cost by workspace.
- **Microsoft 365 Copilot:**
  - Endpoint: Microsoft Graph API `/reports/getOffice365ActiveUserDetail(period='D30')` & `/reports/getM365CopilotUserDetail`.
  - Auth: Microsoft Entra OAuth 2.0 client credentials (`Reports.Read.All`).
  - Sourced Data: Assigned licenses, days active across Word, Excel, Teams, PowerPoint.
- **Anthropic (Claude Enterprise):**
  - Endpoint: Anthropic Admin API `/v1/organizations/{org_id}/usage_report`.
  - Sourced Data: Workspace seats, monthly invoice projections.
- **Voice & Video Consumption APIs (Synthesia, Runway, ElevenLabs):**
  - Webhooks / Usage APIs tracking credit meters against departmental spending limits (e.g. Synthesia $2k cap, Runway $1.8k cap).
- **Non-API Tools (Midjourney):**
  - **Manual Configuration:** Managed directly through Admin Settings. Finance inputs total purchased seats ($60/seat/mo) without attempting to fabricate artificial active usage data.

#### C. Financial Budgets & Shadow Expense Feeds (The "Limits" & "Shadow Spend")
- **Departmental Budgets (Manual Configuration):**
  - Configured by Finance directly in the dashboard Admin Settings.
  - Avoids the overhead of enterprise ERP API connectors (NetSuite/Anaplan) for static quarterly/annual allocations ($105,000 company total).
- **Expense Ingestion (Shadow AI Discovery):**
  - Source: Corporate card APIs (Ramp, Brex) and expense software (Expensify, SAP Concur).
  - Method: Webhook on transaction approval. Match merchant descriptions against a curated AI dictionary (`Claude.ai Pro`, `Midjourney`, `Perplexity AI`, `Suno`, `Leonardo.ai`).
  - Output: Flags individuals paying $20/mo on company cards for unapproved personal plans, offering them the enterprise-approved equivalent.

#### D. Security & Data Loss Prevention (The "Risk")
- **Enterprise DLP:**
  - Source: Microsoft Purview DLP Audit Log (`Office 365 Management Activity API`).
  - Schema Ingested: `IncidentTime`, `UserId`, `SensitivityType` (Credit Card, SSN, Source Code, API Keys), `Application` (Copilot, Teams).
  - Sourced Data: 38 incidents classified into 3 risk tiers: *Customer personal data (23)*, *Financial data (9)*, and *Passwords & access keys (6)*.

---

### 4. Data Honesty & Edge Cases: What We CAN and CANNOT See

A senior PM must be transparent with executive stakeholders about technical boundaries:

| Dimension | Visible to Dashboard | Invisible / Out of Scope | Management Strategy |
|---|---|---|---|
| **Approved Enterprise Tools** | **100% Full Visibility** (Seats, active days, spend, overages, audit logs). | Content of encrypted private end-to-end sessions. | Automated reclamation of inactive seats (>30 days idle). |
| **Unapproved Tools (Work Credentials)** | **High Visibility** (Work-email logins, SSO alerts, OAuth app permissions, corporate card expenses). | Specific prompt text entered by users in third-party unapproved portals. | Nudge user to approved corporate tool (e.g., replace Fireflies with Otter.ai). |
| **Personal Accounts on Company Laptops** | **Partial / Network Level Only** (CASB / Zscaler domain request volume; no user attribution without intrusive agent). | Personal login credentials or encrypted payloads. | Treat as IT network hygiene; out of scope for Week 1 MVP. |
| **Personal Devices on Personal Networks** | **0% Visibility** (Cannot be detected by any enterprise API). | Everything. | **Human Governance:** Addressed via corporate acceptable-use policies and security training, not dashboard deception. |

---

### 5. Data Refresh SLAs & Latency Expectations

To prevent confusing the CFO and IT teams, the dashboard communicates expected data freshness:

| Source Category | Refresh Frequency | Expected Latency | Impact on Stakeholder |
|---|---|---|---|
| **Identity & SCIM (HRIS)** | Nightly batch (02:00 UTC) | < 24 hours | Terminated employees reflected next morning. |
| **Direct AI Vendor APIs** | Daily 4-hour polling | 1–2 hours | Real-time tracking of token burn. |
| **Microsoft Graph Copilot** | Daily scheduled sync | **24–48 hours** | Documented Microsoft platform delay; usage reflects T-2 days. |
| **Expense & Corporate Cards** | Webhook push on settlement | Near real-time (< 1 hour) | Immediate alert when an unapproved tool is expensed. |
| **DLP & Security Alerts** | Event stream webhook | < 5 minutes | Immediate notification of high-severity credential leakage. |
| **Manual Admin Settings** | Instant on save | 0 seconds | Budget ceiling updates applied immediately across all views. |

---

### 6. Phased Implementation Roadmap (Week 1 Scoping)

```
Phase 1: Zero-Friction Foundation (Days 1–7)
  ├── 1. Connect Okta / Entra ID for work-email OAuth audit logs (Shadow AI baseline).
  ├── 2. Ingest HRIS SCIM roster (Workday) for 2,400 employee baseline and org hierarchy.
  ├── 3. Connect Ramp / Brex expense webhooks to catch expensed AI tools.
  └── 4. Set Department Budget ceilings ($105,000) directly in Admin Settings.

Phase 2: High-Volume Vendor Integrations (Days 8–14)
  ├── 1. Connect OpenAI Enterprise Admin API (ChatGPT Enterprise spend & usage).
  ├── 2. Connect Microsoft Graph Reports API (Microsoft 365 Copilot activity).
  └── 3. Connect Anthropic Admin API (Claude Enterprise seats & spend).

Phase 3: Deep Security & Video/Voice APIs (Days 15–21)
  ├── 1. Stream Microsoft Purview DLP incident alerts into the security card.
  ├── 2. Connect Synthesia, Runway, and ElevenLabs consumption webhooks.
  └── 3. Configure Midjourney seat counts in Admin Settings.
```


---

## Part 3: Pick Your Three Charts

### Executive Framing: The Jobs-to-be-Done
When constrained to just **three visualizations** on an executive dashboard, every square pixel must drive an operational business decision. 

A non-technical executive (CFO or IT/Security Lead) does not need vanity metrics. They evaluate AI through three specific lenses:
1. **Fiscal Trajectory:** *Are we on track to stay within our enterprise limits, or are we heading toward month-end bill shock?*
2. **Accountability & Ownership:** *Which specific departments are over budget, and who owns the remediation?*
3. **Control vs. Defection:** *Are employees actually adopting our sanctioned investments, or are they leaking company data into unvetted Shadow AI tools?*

### Quick Executive Summary: The 3 Core Metrics

| Rank | Metric | Why this metric? |
|:---:|---|---|
| **1** | **Department Spend vs. Budget Limit**<br>*(with Cost-Center Owner)* | • Pinpoints exactly which teams are over budget (Marketing at 118%, Engineering at 104%)<br>• Assigns direct accountability to named leaders (VP Eng, Head of Mktg) for immediate action<br>• Uses month-end projections so the CFO can intervene before invoices arrive |
| **2** | **Total AI Spend vs. Budget Ceiling**<br>*(Fixed Seats vs. Pay-per-Use Split)* | • Prevents month-end bill shock by tracking spend pacing against calendar days (92% on Day 20)<br>• Separates predictable seat costs ($92.3k) from volatile token/usage spikes ($4.8k)<br>• Gives an early trigger to freeze variable consumption caps before the $105k limit is breached |
| **3** | **Active Tool Adoption: Approved vs. Unapproved**<br>*(Shadow AI)* | • Exposes unused licenses by identifying paid enterprise seats that remain idle<br>• Uncovers Shadow AI defection (174 staff using unvetted tools like Perplexity & Fireflies)<br>• Helps the CFO cut duplicate costs and helps IT stop data leaks |

---

### Chart 1: Enterprise Spend Runway & Cost Composition Meter
* **Visual Representation:** Dual-progress bullet bar with actual MTD spend, forecasted month-end run rate, and a 100% budget threshold marker, backed by a cost-composition breakdown.
* **Metric Displayed:** Spent **$97,100** of **$105,000** budget (92% consumed on Day 20 of 30) · Split: **$92,300 Fixed Licenses** vs. **$4,800 Pay-per-use Consumption**.
* **Why This Chart (Senior PM Rationale):**
  * **Solves the "Hybrid SaaS" Problem:** Traditional SaaS software was purely seat-based (e.g. $40/user/month). AI software is fundamentally hybrid—seat licenses plus volatile, usage-based token consumption (video minutes, voice synthesis, API tokens). Without separating fixed commitments from consumption spikes, a CFO cannot diagnose *why* a budget is burning too fast.
  * **Pacing & Early Warning:** Comparing 92% budget consumption against a 66% calendar elapsed time (Day 20 of 30) gives the CFO an immediate, non-technical pacing signal to freeze variable consumption caps before an overdraft occurs.

---

### Chart 2: Department Spend vs. Budget Benchmark (With Cost-Center Owners)
* **Visual Representation:** Horizontal comparative benchmark bar chart sorted by risk severity (*Over Limit* > *Near Limit* > *On Track*), plotting actual spend vs. projected month-end against each department's 100% budget cap line.
* **Metric Displayed:**
  * Engineering: **$26,100 / $25,000** (Over limit · 104%) — Owner: *VP Engineering*
  * Marketing: **$21,225 / $18,000** (Over limit · 118%) — Owner: *Head of Marketing*
  * Sales: **$19,375 / $22,000** (Near limit · 88%) — Owner: *VP Sales*
  * Support, Product & Design, Finance & Ops, HR (On Track).
* **Why This Chart (Senior PM Rationale):**
  * **Decentralized Accountability:** Company-level aggregates are inactionable. A CFO cannot "cut company spend" in the abstract; they must hold department leaders accountable.
  * **Actionability in Week 1:** Attributing spend directly to named executives (*VP Engineering*, *Head of Marketing*) transforms passive data into an immediate operational workflow: the CFO knows exactly whose door to knock on to pause hiring or reallocate discretionary AI budget.
  * **Lead Metric vs. Lag Metric:** Plotting *Spent so far* (dark bar) next to *Expected month-end* (light bar) allows proactive remediation before the invoice arrives.

---

### Chart 3: Tool Adoption Matrix: Approved Utility vs. Shadow AI Defection
* **Visual Representation:** Ranked utilization bar chart comparing active user headcount across Approved Enterprise Tools against detected Unapproved Tools (Shadow AI), highlighted with discovery vectors.
* **Metric Displayed:**
  * Approved: **ChatGPT Enterprise** (712 people), **Microsoft 365 Copilot** (425 people), **Otter.ai** (276 people), **Claude Enterprise** (273 people).
  * Unapproved ("Shadow AI"): **Perplexity** (76 people · work-email signup), **Fireflies.ai** (42 people · calendar bot access), **Claude Pro Personal** (21 people · expensed card claims).
* **Why This Chart (Senior PM Rationale):**
  * **Detects Shelfware vs. Defection:** If an enterprise spends $21,000/month on Microsoft Copilot (425 active users out of 700 bought seats) while 76 employees are using Perplexity and 42 are connecting Fireflies.ai meeting bots, the company suffers two simultaneous failures: **shelfware waste** (paying for unused seats) and **security vulnerability** (unvetted third-party data processing).
  * **Bridge Between CFO and CISO:** This chart bridges the two primary personas. The CFO sees opportunities to consolidate duplicate spend (e.g. migrating personal expensed Claude Pro users to the enterprise agreement), while the IT/Security lead sees where policy compliance is failing.

---

### The PM "Kill List": What We Deliberately Cut & Why

Senior product management is defined by what you choose *not* to build. Here is what was evaluated and intentionally omitted:

1. **Vendor Market-Share Donut / Pie Chart:**
   * *Why Cut:* Classic executive vanity visual. Showing that OpenAI represents 42% of spend and Microsoft represents 22% provides zero operational leverage. It doesn't tell leadership whether that spend is within budget, generating ROI, or creating security risk.
2. **Raw Token / Prompt Volume Counters:**
   * *Why Cut:* Low stakeholder relevance. CFOs and IT leads budget in dollars, seats, and headcount, not floating-point context window tokens or embedding API calls. Token metrics confuse non-technical executives and obscure business outcomes.
3. **Daily Active User (DAU) Fluctuations:**
   * *Why Cut:* Day-to-day noise. AI usage fluctuates wildly mid-week vs. weekends. Tracking a rolling 30-day active user metric against purchased seat licenses provides stable procurement signal without the distraction of daily volatility.

---

### Summary: The Complete Executive Loop
Together, these three charts form a complete operational loop:
1. **Chart 1 (Macro):** *"Are we going to breach our fiscal limits this month?"* → Yes, 92% consumed on Day 20.
2. **Chart 2 (Micro/Attribution):** *"Who is causing the overage?"* → Marketing (118%) and Engineering (104%).
3. **Chart 3 (Behavior/Governance):** *"Why are employees adopting or defecting?"* → High text/chat demand, with 174 users on unapproved tools that need to be redirected into approved enterprise licenses.
