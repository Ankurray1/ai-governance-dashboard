// Where each number on the screen comes from: the Part 2 answer in plain words.
// Kept short on purpose (2-3 sources per card). The submission doc uses the same list.

export interface Source { name: string; gives: string }

const VENDORS: Source = {
  name: 'AI vendors’ admin & billing APIs (OpenAI, Anthropic, Microsoft and others)',
  gives: 'Cost of each tool this month, licences bought, and when each person last used it',
};
const INVOICES: Source = {
  name: 'Invoices',
  gives: 'Cost and licences for tools with no API (e.g. Midjourney)',
};
const BUDGETS: Source = {
  name: 'Budgets set by Finance',
  gives: 'Monthly AI budget per department, entered in the dashboard',
};
const HR: Source = {
  name: 'HR system (e.g. Workday, BambooHR)',
  gives: 'Who works here, their department and manager, and who has left',
};
const SIGN_INS: Source = {
  name: 'Company sign-in system (Okta, Microsoft Entra or Google Workspace)',
  gives: 'AI tools people signed up to with a work email, or connected to their work calendar',
};
const EXPENSES: Source = {
  name: 'Expense claims and company cards',
  gives: 'AI subscriptions people paid for and claimed back',
};
const DATA_PROTECTION: Source = {
  name: 'Company data-protection tool (e.g. Microsoft Purview)',
  gives: 'Flags customer data, financial data or passwords shared with approved AI tools',
};

export const SOURCES = {
  spend: [VENDORS, INVOICES, BUDGETS],
  adoption: [VENDORS, HR],
  shadow: [SIGN_INS, EXPENSES],
  alerts: [DATA_PROTECTION, HR],
  departments: [VENDORS, HR, BUDGETS],
  tools: [VENDORS, INVOICES, HR],
};

// What we can't see, said once and the same way everywhere
export const LIMITS = [
  'Personal AI accounts on personal phones or laptops can’t be seen by anyone.',
  'Some vendors report 1–2 days late (e.g. Microsoft Copilot).',
];
