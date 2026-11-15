// Part 2 answer: the API & data sources behind each of the 8 features on the screen.
// This mirrors the 8-row table in the submission doc exactly (Feature · API & Data Sources · Purpose).
// Every "i" card shows its own row in the "Data sources" tab.

export interface Source { name: string; gives: string }
export interface Feature { feature: string; purpose: string; sources: Source[] }

const VENDOR_BILLING: Source = { name: 'Vendor billing APIs (OpenAI, Anthropic, Microsoft)', gives: 'This month’s cost of each AI tool' };
const VENDOR_ADMIN: Source = { name: 'Vendor admin APIs', gives: 'Licences bought and when each person last used the tool' };
const INVOICES: Source = { name: 'Invoices', gives: 'Cost and licences for tools with no API (e.g. Midjourney)' };
const BUDGETS: Source = { name: 'Budgets set by Finance', gives: 'The monthly AI budget for each department' };
const HR: Source = { name: 'HR system', gives: 'Who works here, their department and manager, and who has left' };
const SIGN_INS: Source = { name: 'Sign-in logs (Okta / Microsoft Entra)', gives: 'AI tools people signed up to with their work email' };
const CALENDAR: Source = { name: 'Work calendar access', gives: 'AI tools connected to someone’s work calendar' };
const EXPENSES: Source = { name: 'Expense claims', gives: 'AI subscriptions people paid for and claimed back' };
const PURVIEW: Source = { name: 'Data-protection tool (Microsoft Purview)', gives: 'Flags sensitive data shared with approved AI tools' };

export const FEATURES = {
  spend: { feature: 'AI spend vs budget', purpose: 'How much we spent this month vs the budget', sources: [VENDOR_BILLING, INVOICES, { ...BUDGETS, name: 'Budget set by Finance', gives: 'The company’s monthly AI budget' }] },
  adoption: { feature: 'AI adoption', purpose: 'Who used AI in the last 30 days', sources: [VENDOR_ADMIN, HR] },
  shadowUse: { feature: 'Unapproved AI use', purpose: 'How many people use unapproved AI', sources: [SIGN_INS, EXPENSES] },
  alertsToReview: { feature: 'Data alerts to review', purpose: 'Alerts nobody has checked yet', sources: [PURVIEW] },
  departments: { feature: 'Spend vs budget by department', purpose: 'Which team spent it, and its budget', sources: [VENDOR_BILLING, HR, BUDGETS] },
  shadowTools: { feature: 'Unapproved AI tools', purpose: 'Which tools, how we found them, what to use instead', sources: [SIGN_INS, CALENDAR, EXPENSES] },
  alerts: { feature: 'Sensitive data alerts', purpose: 'What was shared, by whom, in which tool', sources: [PURVIEW, HR] },
  tools: { feature: 'Approved AI tools', purpose: 'Licences bought vs used, and spending caps', sources: [VENDOR_ADMIN, INVOICES] },
} satisfies Record<string, Feature>;

export const NOTE = 'Personal AI accounts on personal devices can’t be seen.';
