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

### 1. Data Architecture: The 4 Core Ingestion Layers

To solve the governance problem without building complex proprietary telemetry clients on day one, we aggregate data across **four existing enterprise systems of record**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                     AI GOVERNANCE DASHBOARD                            │
 └───────▲────────────────────▲────────────────────▲────────────────▲─────┘
         │                    │                    │                │
 ┌───────┴────────┐   ┌───────┴────────┐   ┌───────┴────────┐   ┌───┴────────────┐
 │  1. Identity & │   │ 2. Direct AI   │   │  3. Finance &  │   │  4. Security & │
 │     Org (HRIS) │   │    Vendor APIs │   │     Expense    │   │      DLP Logs  │
 ├────────────────┤   ├────────────────┤   ├────────────────┤   ├────────────────┤
 │ • Workday/Okta │   │ • OpenAI Admin │   │ • NetSuite ERP │   │ • MS Purview   │
 │ • SCIM 2.0     │   │ • MS Graph     │   │ • Ramp / Brex  │   │ • O365 Audit   │
 │ • Entra / Google│  │ • Anthropic    │   │ • Expensify    │   │ • CASB / DLP   │
 └────────────────┘   └────────────────┘   └────────────────┘   └────────────────┘
```

---

### 2. Comprehensive API & Data Source Matrix

| Dashboard Metric / Card | Required Data | Primary Source / API | Exact Endpoint / Method | Integration Type & Latency | PM Rationale & Practical Nuance |
|---|---|---|---|---|---|
| **AI Spend This Month vs Budget** (Hero Card) | • Total MTD spend ($97,100)<br>• Monthly budget ($105,000)<br>• Fixed vs Pay-per-use split | • ERP / FP&A Tool (NetSuite / Anaplan)<br>• Vendor Billing APIs<br>• Accounts Payable (Invoices) | • NetSuite SuiteTalk REST API (`/record/v1/budget`)<br>• OpenAI `/v1/organization/costs`<br>• Anthropic `cost_report`<br>• Azure Cost Management API | **Daily Batch & Hourly Webhooks**<br>Budget: Monthly sync<br>Spend: ~2h latency | Budgets are defined centrally by Finance in the ERP. AI costs are a hybrid of predictable seat licenses ($92.3k) and volatile pay-per-use token charges ($4.8k). Direct billing APIs capture consumption before month-end invoice shock. |
| **Department Spend vs Budget** (Budget Chart) | • Spend per department<br>• Month-end forecast<br>• Dept budget limits<br>• Dept owners | • HRIS (Workday / BambooHR)<br>• ERP Cost Center Hierarchy<br>• Vendor Usage by Cost Center / Workspace | • SCIM 2.0 User Sync (`/Users`, `/Groups`)<br>• Workday RaaS (Report-as-a-Service)<br>• OpenAI Projects/Workspaces API | **Nightly SCIM Sync**<br>Hierarchy: Daily<br>Spend: Daily | Budgets exist **only at the department level**. If users filter by location or level, the budget line must be hidden rather than inventing false sub-budgets. Department owners (e.g. VP Eng, Head of Mktg) are dynamically pulled from HRIS. |
| **AI Adoption Rate** (KPI Card) | • Active users last 30d (1,392)<br>• Total employee baseline (2,400)<br>• % adoption vs target (58% vs 70%) | • HRIS (Employee headcount)<br>• Vendor Admin Activity Telemetry | • HRIS Active Employee Count (`status == 'ACTIVE'`)<br>• OpenAI `/v1/organization/users` (`last_active_at`)<br>• Microsoft Graph `reports/getOffice365ActiveUserDetail(period='D30')` | **Daily Telemetry Batch**<br>Latency: 24–48 hours (Microsoft Graph limitation) | Adoption cannot simply be "licenses bought." It requires checking `last_active_at <= 30 days`. Ghost/zombie licenses (paying $45/mo for someone who never logged in) are flagged for reclamation. |
| **Approved AI Tools** (Carousel / Table) | • Seat count & cost<br>• Active usage %<br>• Pay-per-use caps<br>• Tool status | • Vendor Admin APIs (OpenAI, Anthropic, MS Graph, Synthesia, Runway, ElevenLabs)<br>• Accounts Payable Invoice Ledger | • OpenAI `/v1/organization/users`<br>• Azure Cognitive Services Usage API<br>• Runway / ElevenLabs Webhooks<br>• Manual / OCR Invoice Ingestion for Midjourney | **Hybrid (API + Invoiced Fallback)**<br>APIs: Daily sync<br>Invoices: Monthly PDF/ERP | **Data Honesty:** Midjourney does not offer an enterprise seat telemetry API. We explicitly display Midjourney as *"Invoiced licenses only — usage telemetry unavailable"*, avoiding fabricated adoption numbers. |
| **Unapproved AI Tools** ("Shadow AI") | • Tool names & categories<br>• Detected users (174 min)<br>• Discovery vector<br>• Approved alternative | • Identity Provider (Okta / Entra / Google Workspace)<br>• Corporate Card & Expense Feeds (Ramp / Brex / Expensify)<br>• Calendar & OAuth App Permissions | • Okta System Log API (`eventType eq "user.authentication.auth_via_social"` or app sign-ins)<br>• Microsoft Graph `oauth2PermissionGrants`<br>• Ramp Developer API (`/developer/v1/transactions` filtered by MCC / AI merchant list)<br>• Google Workspace Third-Party Apps | **Near Real-Time Event Stream**<br>IdP: Webhook / Log Stream<br>Expenses: Daily webhook | **Zero-Agent Architecture:** Discovers Shadow AI without installing intrusive desktop endpoint spyware. We catch: 1) work email SSO logins, 2) calendar note-taker bot grants (Fireflies/Otter), and 3) expensed personal subscriptions on company cards. |
| **Sensitive Data Alerts** (DLP Card) | • Alert counts (38 total)<br>• Categories (Customer PII, Financials, Passwords)<br>• Tool & user involved<br>• Review status | • Cloud Security & Enterprise DLP (Microsoft Purview / O365 Management API)<br>• OpenAI Enterprise Audit Logs | • Office 365 Management Activity API (`DlpMatches`, `SensitivityLabelAction`)<br>• OpenAI `/v1/organization/audit_logs` (event types: `sensitive_flag`, `data_export`)<br>• Netskope / Cloudflare Zero Trust DLP Webhooks | **Real-Time Security Event Stream**<br>Push webhook: < 5 mins | **Strict Scope:** We **only** show data alerts for *approved enterprise tools* that have DLP hooks. We never falsely claim to inspect prompt text entered into personal accounts or unmanaged tools. |

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
- **The Non-API Fallback (Midjourney):**
  - Fallback: ERP Accounts Payable ledger (NetSuite/QuickBooks) via invoice matching on vendor name "Midjourney Inc."
  - PM Rule: Acknowledge vendor limitations openly. Midjourney does not offer employee-level telemetry; display invoiced seats bought rather than misleading active user metrics.

#### C. Financial Budgets & Shadow Expense Feeds (The "Limits" & "Shadow Spend")
- **Departmental Budgets:**
  - Source: FP&A Planning software (Anaplan / Workday Adaptive Planning) or direct REST import from NetSuite.
  - Data: Monthly budget allocation per department ($105,000 total).
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
| **Manual / Invoiced Billing** | Monthly ledger upload | Monthly | Fixed costs updated on invoice receipt. |

---

### 6. Phased Implementation Roadmap (Week 1 Scoping)

```
Phase 1: Zero-Friction Foundation (Days 1–7)
  ├── 1. Connect Okta / Entra ID for work-email OAuth audit logs (Shadow AI baseline).
  ├── 2. Ingest HRIS SCIM roster (Workday) for 2,400 employee baseline and org hierarchy.
  └── 3. Connect Ramp / Brex expense webhooks to catch expensed AI tools.

Phase 2: High-Volume Vendor Integrations (Days 8–14)
  ├── 1. Connect OpenAI Enterprise Admin API (ChatGPT Enterprise spend & usage).
  ├── 2. Connect Microsoft Graph Reports API (Microsoft 365 Copilot activity).
  └── 3. Import Departmental Budget ceilings from Finance ERP (NetSuite).

Phase 3: Deep Security & Video/Voice APIs (Days 15–21)
  ├── 1. Stream Microsoft Purview DLP incident alerts into the security card.
  ├── 2. Connect Anthropic, Synthesia, Runway, and ElevenLabs usage webhooks.
  └── 3. Establish AP invoice reconciliation workflow for Midjourney.
```
