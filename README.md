# AI Governance Dashboard (Prototype & PM Scoping Plan)

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-2145ff?style=for-the-badge&logo=github)](https://ankurray1.github.io/ai-governance-dashboard/)
[![Submission Doc](https://img.shields.io/badge/PM%20Plan-Part%202%20API%20%26%20Data%20Sources-0a85ea?style=for-the-badge)](./docs/SUBMISSION.md)

An interactive prototype and comprehensive product specification for an **AI Governance Dashboard** that provides centralized visibility into AI tool adoption, spend against approved limits, and "Shadow AI" across an organisation. It runs on a realistic **mock dataset of 2,400 employees** at a fictional company, *Acme Corp*.

Built as a PM assignment for leadership stakeholders (**CFO** and **IT / Security Lead**).

### 🚀 Live Interactive Prototype
👉 **[View Live Dashboard on GitHub Pages](https://ankurray1.github.io/ai-governance-dashboard/)**

### 📄 Executive Documentation
- [Part 2: API & Data Source Plan](./docs/SUBMISSION.md)
- [Product Decisions Log](./docs/PRODUCT_DECISIONS.md)

---

## Open it Locally

**Option 1: Single-file double-click**  
Double-click `AI-Governance-Dashboard.html`. Everything (React app, styles, mock dataset) is bundled into that single file—no server, internet connection, or dependencies required.

**Option 2: Live GitHub Pages URL**  
Visit [https://ankurray1.github.io/ai-governance-dashboard/](https://ankurray1.github.io/ai-governance-dashboard/)

## What you can do

- **Filter** by department, location, level (L1 CEO → L5 employees) or tool type. Every number recalculates from the data.
- **Click a department** in the budget chart to focus the whole page on it, including its top AI tools.
- **Click a tool** to list everyone holding a seat for it.
- **Click the coloured chips** to see who has unused seats, who has left but still holds paid seats, who uses unauthorised tools, or who has a data alert.
- **Search, sort and page** through people. **Click a name** for their tools, last activity, cost and flags.

Budgets exist per department only. When you filter by location, level or tool type, the page hides budget lines and shows spend only, rather than inventing a budget that doesn't exist.

## What's on the screen and why

| Section | Question it answers |
|---|---|
| Spend vs budget, expected month-end, departments over budget | How much are we spending, and are we within approved limits? |
| Spend vs budget by department + top tools | Who is over their limit, and which tools drive it? |
| Approved tools table | Who uses what, what it costs, is each tool within its seat or usage limit? |
| Unauthorised AI tools | What Shadow AI can we actually detect, and what approved tool replaces it? |
| Sensitive data alerts | Where has sensitive data gone into approved AI tools? |
| People | Who exactly, so someone can act. |

Deliberately left out: token or prompt counts (meaningless to a CFO), a headline number for unauthorised use (can't be measured completely), and the content of prompts in unauthorised tools (not visible to any of our sources).

## The mock dataset (`data/csv/`)

| File | Rows | Contents |
|---|---|---|
| `employees.csv` | 2,400 | Name, work email, department, team, title, level, manager, location, start date, status (18 leavers) |
| `ai_licences.csv` | 2,565 | One row per approved AI seat: tool, seat cost, usage cost so far, last active date, activity status |
| `unauthorised_ai.csv` | 181 | Unapproved tool sign-ups: how they were found (work-email sign-up, work calendar connected, expense claim) and the approved alternative |
| `sensitive_data_alerts.csv` | 38 | Data-protection alerts from the enterprise chat tools' audit logs |
| `department_budgets.csv` | 7 | Monthly AI budget and owner per department |

Assumed tool stack: ChatGPT Enterprise, Microsoft 365 Copilot, Claude Enterprise (text & chat) · Otter.ai (voice) · Midjourney, Adobe Firefly (image). Prices are assumptions. Midjourney is treated as "invoice only" because it doesn't report per-user usage.

`scripts/generate_mock_data.py` regenerates the dataset (fixed random seed, so output is identical each run).

## Where the data would come from in a real build

| Data | Source |
|---|---|
| Spend, seats, last activity | Vendor bills and admin APIs (e.g. OpenAI Usage/Costs API, Anthropic Admin API, Microsoft Graph Copilot usage reports), invoices for tools without APIs |
| People, departments, managers, leavers | HR system (Workday, Darwinbox, etc.) |
| Unauthorised tools | Company login logs (Okta / Microsoft Entra / Google Workspace) and expense / corporate-card data |
| Sensitive data alerts | Audit logs of enterprise AI plans + the company's data-protection rules |
| Budgets | Set by Finance per department |

## For developers

```bash
npm install
npm run dev      # local dev server
npm run build    # builds dist/index.html (single self-contained file)
```

Stack: React 18 + TypeScript + Vite, plain CSS, no chart library. All calculations live in `src/data/model.ts` (`compute(filters)` turns the current filters into everything on screen); components in `src/components/` only render.
