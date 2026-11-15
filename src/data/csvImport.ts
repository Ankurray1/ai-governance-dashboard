// "Upload your data": one CSV file, one row per record, a `record_type` column says what the row is.
// Everything is read in the browser; nothing is sent anywhere.
import { DATA, RawData, Tool, ShadowTool, Category } from './model';

export const COLUMNS = [
  'record_type', 'department', 'budget_owner', 'monthly_budget_usd',
  'person_id', 'person_name', 'status',
  'tool', 'tool_category', 'monthly_cost_usd', 'date', 'found_via', 'alert_type',
] as const;
type Col = typeof COLUMNS[number];
type Row = Record<Col, string> & { _line: number };

// What each record type needs. Shown in the upload guide and used by the checks.
export const RECORD_TYPES: { type: string; what: string; required: Col[]; optional: Col[]; example: string }[] = [
  { type: 'department', what: 'One row per department, with its monthly AI budget', required: ['department', 'monthly_budget_usd'], optional: ['budget_owner'], example: 'Marketing · Head of Marketing · 18000' },
  { type: 'person', what: 'One row per employee (Active or Left)', required: ['person_id', 'person_name', 'department', 'status'], optional: [], example: 'E001 · Priya Shah · Marketing · Active' },
  { type: 'licence', what: 'One row per approved AI licence a person holds', required: ['person_id', 'tool', 'monthly_cost_usd'], optional: ['tool_category', 'date'], example: 'E001 · ChatGPT Enterprise · Text & chat · 45 · last used 2026-11-18' },
  { type: 'unapproved', what: 'One row per person found using an unapproved AI tool', required: ['person_id', 'tool', 'found_via'], optional: ['tool_category', 'date'], example: 'E002 · Perplexity · Text · Work-email sign-up' },
  { type: 'alert', what: 'One row per sensitive data alert in an approved tool', required: ['person_id', 'tool', 'alert_type'], optional: ['status', 'date'], example: 'E003 · Microsoft 365 Copilot · Financial data · To review' },
];

const CATS: Category[] = ['Text & chat', 'Video', 'Voice', 'Image'];
const ALERT_ORDER = ['Customer personal data', 'Financial data', 'Passwords & access keys'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// ---------- CSV text <-> rows ----------
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); out.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  return out.filter((r) => r.some((v) => v.trim() !== ''));
}

const cell = (v: string | number | null | undefined) => {
  const t = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const toCsv = (rows: (string | number | null)[][]) => '﻿' + [COLUMNS.join(','), ...rows.map((r) => r.map(cell).join(','))].join('\r\n');

function line(o: Partial<Record<Col, string | number | null>>) {
  return COLUMNS.map((c) => o[c] ?? '');
}

// ---------- Template: a few example rows of every type ----------
export function templateCsv(): string {
  return toCsv([
    line({ record_type: 'department', department: 'Engineering', budget_owner: 'VP Engineering', monthly_budget_usd: 5000 }),
    line({ record_type: 'department', department: 'Marketing', budget_owner: 'Head of Marketing', monthly_budget_usd: 3000 }),
    line({ record_type: 'person', person_id: 'E001', person_name: 'Priya Shah', department: 'Engineering', status: 'Active' }),
    line({ record_type: 'person', person_id: 'E002', person_name: 'Tom Reed', department: 'Marketing', status: 'Active' }),
    line({ record_type: 'person', person_id: 'E003', person_name: 'Ana Lopez', department: 'Marketing', status: 'Left' }),
    line({ record_type: 'licence', person_id: 'E001', tool: 'ChatGPT Enterprise', tool_category: 'Text & chat', monthly_cost_usd: 45, date: '2026-11-18' }),
    line({ record_type: 'licence', person_id: 'E002', tool: 'Microsoft 365 Copilot', tool_category: 'Text & chat', monthly_cost_usd: 30, date: '2026-09-02' }),
    line({ record_type: 'licence', person_id: 'E003', tool: 'Microsoft 365 Copilot', tool_category: 'Text & chat', monthly_cost_usd: 30, date: '' }),
    line({ record_type: 'licence', person_id: 'E002', tool: 'Midjourney', tool_category: 'Image', monthly_cost_usd: 60, date: 'not reported' }),
    line({ record_type: 'unapproved', person_id: 'E002', tool: 'Perplexity', tool_category: 'Text', found_via: 'Work-email sign-up', date: '2026-10-04' }),
    line({ record_type: 'alert', person_id: 'E001', tool: 'ChatGPT Enterprise', alert_type: 'Customer personal data', status: 'To review', date: '2026-11-19' }),
  ]);
}

// ---------- The dataset currently on screen, in the same format ----------
export function currentAsCsv(): string {
  const rows: (string | number | null)[][] = [];
  DATA.depts.forEach((d) => rows.push(line({ record_type: 'department', department: d.name, budget_owner: d.owner, monthly_budget_usd: d.budget })));
  DATA.employees.forEach((e) => rows.push(line({ record_type: 'person', person_id: e.id, person_name: e.name, department: DATA.depts[e.dept].name, status: e.status })));
  const asOf = Date.parse(DATA.asOf + 'T00:00:00Z');
  const back = (days: number | null) => (days === null ? '' : new Date(asOf - days * 86400000).toISOString().slice(0, 10));
  DATA.employees.forEach((e) => e.seats.forEach((s) => {
    const t = DATA.tools[s.tool];
    rows.push(line({ record_type: 'licence', person_id: e.id, tool: t.name, tool_category: t.cat, monthly_cost_usd: s.cost, date: s.status === 'unknown' ? 'not reported' : back(s.days) }));
  }));
  DATA.employees.forEach((e) => e.shadow.forEach((x) => {
    const t = DATA.shadowTools[x.tool];
    rows.push(line({ record_type: 'unapproved', person_id: e.id, tool: t.name, tool_category: t.cat, found_via: t.found, date: x.first }));
  }));
  DATA.employees.forEach((e) => e.alerts.forEach((a) => rows.push(line({
    record_type: 'alert', person_id: e.id, tool: DATA.tools[a.tool].name, alert_type: DATA.alertTypes[a.type],
    status: a.status === 'Open' ? 'To review' : 'Checked', date: a.date,
  }))));
  return toCsv(rows);
}

// ---------- Read + check a file, and turn it into a dataset ----------
export interface ImportResult {
  ok: boolean;
  errors: string[];
  data?: RawData;
  summary?: { departments: number; people: number; licences: number; unapproved: number; alerts: number };
}

export function importCsv(text: string): ImportResult {
  const grid = parseCsv(text);
  if (grid.length < 2) return { ok: false, errors: ['The file is empty. Start from the template.'] };
  const head = grid[0].map((h) => h.trim().toLowerCase());
  const missing = COLUMNS.filter((c) => !head.includes(c));
  if (missing.length) return { ok: false, errors: [`Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Use the template’s first row as-is.`] };

  const rows: Row[] = grid.slice(1).map((r, i) => {
    const o = { _line: i + 2 } as Row;
    COLUMNS.forEach((c) => { o[c] = (r[head.indexOf(c)] ?? '').trim(); });
    return o;
  });

  const errors: string[] = [];
  const err = (r: Row, msg: string) => { if (errors.length < 50) errors.push(`Row ${r._line}: ${msg}`); };
  const num = (v: string) => Number(v.replace(/[$,\s]/g, ''));
  const byType = (t: string) => rows.filter((r) => r.record_type.toLowerCase() === t);

  rows.forEach((r) => {
    const def = RECORD_TYPES.find((d) => d.type === r.record_type.toLowerCase());
    if (!def) { err(r, `record_type “${r.record_type || '(blank)'}” isn’t one of: ${RECORD_TYPES.map((d) => d.type).join(', ')}.`); return; }
    def.required.forEach((c) => { if (!r[c]) err(r, `${def.type} rows need “${c}”.`); });
  });

  // departments
  const depts = new Map<string, { name: string; owner: string; budget: number }>();
  byType('department').forEach((r) => {
    if (!r.department) return;
    const b = num(r.monthly_budget_usd);
    if (!Number.isFinite(b) || b < 0) err(r, `monthly_budget_usd “${r.monthly_budget_usd}” must be a number.`);
    if (depts.has(r.department.toLowerCase())) err(r, `department “${r.department}” is listed twice.`);
    depts.set(r.department.toLowerCase(), { name: r.department, owner: r.budget_owner || 'Not set', budget: Number.isFinite(b) ? b : 0 });
  });
  if (!byType('department').length) errors.push('Add at least one “department” row with its monthly budget.');
  const deptList = [...depts.values()];
  const deptIndex = (name: string) => deptList.findIndex((d) => d.name.toLowerCase() === name.toLowerCase());

  // people
  const people = new Map<string, number>();
  const emp: RawData['emp'] = [];
  byType('person').forEach((r) => {
    if (!r.person_id) return;
    const d = deptIndex(r.department);
    if (r.department && d < 0) err(r, `department “${r.department}” has no “department” row.`);
    const st = r.status.toLowerCase();
    if (r.status && st !== 'active' && st !== 'left') err(r, `status for a person must be Active or Left, not “${r.status}”.`);
    if (people.has(r.person_id)) { err(r, `person_id “${r.person_id}” is listed twice.`); return; }
    people.set(r.person_id, emp.length);
    emp.push([r.person_id, r.person_name, '', Math.max(d, 0), 0, '', 'L5', -1, 0, st === 'left' ? 'Left' : 'Active', null, '']);
  });
  if (!byType('person').length) errors.push('Add at least one “person” row.');
  const personIndex = (r: Row) => {
    const i = people.get(r.person_id);
    if (r.person_id && i === undefined) err(r, `person_id “${r.person_id}” has no “person” row.`);
    return i ?? -1;
  };

  // as-of date = the latest date in the file (so "last 30 days" works for old exports too)
  const dates = rows.map((r) => r.date).filter((d) => ISO.test(d)).sort();
  const asOfStr = dates.length ? dates[dates.length - 1] : new Date().toISOString().slice(0, 10);
  const asOf = Date.parse(asOfStr + 'T00:00:00Z');

  // approved tools + licences
  const tools: Tool[] = [];
  const toolIndex = (name: string, cat: string) => {
    let i = tools.findIndex((t) => t.name.toLowerCase() === name.toLowerCase());
    if (i < 0) {
      const c = CATS.find((x) => x.toLowerCase() === cat.toLowerCase()) ?? (cat.toLowerCase() === 'text' ? 'Text & chat' : 'Text & chat');
      tools.push({ name, cat: c, price: 0, billing: 'Per seat', usageData: 'Full', usageLimit: null });
      i = tools.length - 1;
    }
    return i;
  };
  const lic: RawData['lic'] = [];
  byType('licence').forEach((r) => {
    const p = personIndex(r);
    if (p < 0 || !r.tool) return;
    const cost = num(r.monthly_cost_usd);
    if (!Number.isFinite(cost) || cost < 0) { err(r, `monthly_cost_usd “${r.monthly_cost_usd}” must be a number.`); return; }
    const t = toolIndex(r.tool, r.tool_category);
    if (!tools[t].price) tools[t].price = cost;
    const d = r.date.toLowerCase();
    if (d === 'not reported') { tools[t].usageData = 'Invoice only'; lic.push([p, t, null, 0, 'unknown', cost]); return; }
    if (d && !ISO.test(r.date)) { err(r, `date “${r.date}” should look like 2026-11-18, be blank (never used) or say “not reported”.`); return; }
    const days = d ? Math.round((asOf - Date.parse(r.date + 'T00:00:00Z')) / 86400000) : null;
    lic.push([p, t, d ? r.date : null, 0, days === null ? 'never' : days <= 30 ? 'active' : 'inactive', cost]);
  });

  // unapproved tools
  const shadowTools: ShadowTool[] = [];
  const shadow: RawData['shadow'] = [];
  byType('unapproved').forEach((r) => {
    const p = personIndex(r);
    if (p < 0 || !r.tool) return;
    let t = shadowTools.findIndex((x) => x.name.toLowerCase() === r.tool.toLowerCase());
    if (t < 0) { shadowTools.push({ name: r.tool, cat: r.tool_category || 'Text', found: r.found_via, alt: '', cost: 0 }); t = shadowTools.length - 1; }
    if (r.date && !ISO.test(r.date)) err(r, `date “${r.date}” should look like 2026-11-18.`);
    shadow.push([p, t, ISO.test(r.date) ? r.date : asOfStr]);
  });

  // alerts
  const alertTypes: string[] = [];
  byType('alert').forEach((r) => { if (r.alert_type && !alertTypes.some((a) => a.toLowerCase() === r.alert_type.toLowerCase())) alertTypes.push(r.alert_type); });
  alertTypes.sort((a, b) => (ALERT_ORDER.indexOf(a) + 1 || 99) - (ALERT_ORDER.indexOf(b) + 1 || 99));
  const alerts: RawData['alerts'] = [];
  byType('alert').forEach((r) => {
    const p = personIndex(r);
    if (p < 0 || !r.tool || !r.alert_type) return;
    const t = tools.findIndex((x) => x.name.toLowerCase() === r.tool.toLowerCase());
    if (t < 0) { err(r, `alerts are only for approved tools; “${r.tool}” has no “licence” row.`); return; }
    const st = r.status.toLowerCase();
    if (st && st !== 'to review' && st !== 'checked') err(r, `status for an alert must be “To review” or “Checked”.`);
    if (r.date && !ISO.test(r.date)) err(r, `date “${r.date}” should look like 2026-11-18.`);
    alerts.push([ISO.test(r.date) ? r.date : asOfStr, p, t, alertTypes.findIndex((a) => a.toLowerCase() === r.alert_type.toLowerCase()), st === 'checked' ? 'Reviewed' : 'Open']);
  });
  alerts.sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const rowNo = (e: string) => Number(/^Row (\d+):/.exec(e)?.[1] ?? 0);
  if (errors.length) return { ok: false, errors: errors.sort((a, b) => rowNo(a) - rowNo(b)) };
  const data: RawData = {
    asOf: asOfStr, company: 'Your company',
    depts: deptList.map((d) => ({ name: d.name, owner: d.owner, budget: d.budget, teams: [d.name] })),
    locations: ['—'], tools, shadowTools, alertTypes: alertTypes.length ? alertTypes : ALERT_ORDER,
    emp, lic, shadow, alerts,
  };
  return { ok: true, errors: [], data, summary: { departments: deptList.length, people: emp.length, licences: lic.length, unapproved: shadow.length, alerts: alerts.length } };
}

// "1 person", "2 people"
export const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

export function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
