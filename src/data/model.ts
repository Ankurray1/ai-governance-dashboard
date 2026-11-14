import raw from './acme_ai_governance.json';

// ---------- Raw dataset types ----------
export interface Dept { name: string; owner: string; budget: number; teams: string[] }
export interface Tool { name: string; cat: Category; price: number; billing: string; usageData: 'Full' | 'Invoice only'; usageLimit: number | null }
export interface ShadowTool { name: string; cat: string; found: string; alt: string; cost: number }
export type Category = 'Text & chat' | 'Video' | 'Voice' | 'Image';
export const CATEGORIES: Category[] = ['Text & chat', 'Video', 'Voice', 'Image'];
export const LEVELS: { id: string; label: string }[] = [
  { id: 'L1', label: 'L1 · CEO' },
  { id: 'L2', label: 'L2 · CXOs' },
  { id: 'L3', label: 'L3 · Department heads' },
  { id: 'L4', label: 'L4 · Managers' },
  { id: 'L5', label: 'L5 · Employees' },
];

type SeatStatus = 'active' | 'inactive' | 'never' | 'unknown';
export interface Seat { tool: number; days: number | null; usage: number; status: SeatStatus; cost: number }
export interface Employee {
  i: number; id: string; name: string; email: string; dept: number; team: string; title: string;
  level: string; mgr: number; loc: number; status: 'Active' | 'Left'; leave: string | null; start: string;
  seats: Seat[]; shadow: { tool: number; first: string }[]; alerts: { date: string; tool: number; type: number; status: string }[];
  cost: number; hasUnused: boolean; isLeaver: boolean; idle: number; search: string;
}

interface RawData {
  asOf: string; company: string; depts: Dept[]; locations: string[]; tools: Tool[]; shadowTools: ShadowTool[]; alertTypes: string[];
  emp: [string, string, string, number, number, string, string, number, number, 'Active' | 'Left', string | null, string][];
  lic: [number, number, string | null, number, SeatStatus][];
  shadow: [number, number, string][];
  alerts: [string, number, number, number, string][];
}

// ---------- Prepare once ----------
const R = raw as unknown as RawData;
const asOf = Date.parse(R.asOf + 'T00:00:00Z');
export const DATA = {
  asOf: R.asOf, company: R.company, depts: R.depts, locations: R.locations, tools: R.tools,
  shadowTools: R.shadowTools, alertTypes: R.alertTypes,
  employees: R.emp.map((r, i): Employee => ({
    i, id: r[0], name: r[1], email: r[2], dept: r[3], team: R.depts[r[3]].teams[r[4]], title: r[5], level: r[6],
    mgr: r[7], loc: r[8], status: r[9], leave: r[10], start: r[11], seats: [], shadow: [], alerts: [],
    cost: 0, hasUnused: false, isLeaver: false, idle: -1,
    search: `${r[1]} ${r[2]} ${R.depts[r[3]].teams[r[4]]} ${r[5]}`.toLowerCase(),
  })),
};
R.lic.forEach(([e, t, date, usage, status]) => {
  const days = date ? Math.round((asOf - Date.parse(date + 'T00:00:00Z')) / 86400000) : null;
  DATA.employees[e].seats.push({ tool: t, days, usage, status, cost: R.tools[t].price + usage });
});
R.shadow.forEach(([e, t, first]) => DATA.employees[e].shadow.push({ tool: t, first }));
R.alerts.forEach(([date, e, tool, type, status]) => DATA.employees[e].alerts.push({ date, tool, type, status }));
DATA.employees.forEach((e) => {
  e.cost = e.seats.reduce((s, x) => s + x.cost, 0);
  e.hasUnused = e.seats.some((x) => x.status === 'inactive' || x.status === 'never');
  e.isLeaver = e.status === 'Left' && e.seats.length > 0;
  const known = e.seats.filter((x) => x.status !== 'unknown').map((x) => (x.days === null ? 999 : x.days));
  e.idle = known.length ? Math.min(...known) : -1;
});

// ---------- Filters ----------
export type Flag = 'all' | 'unused' | 'leaver' | 'shadow' | 'alert' | 'none';
export type Sort = 'cost' | 'name' | 'idle';
export interface Filters { dept: number; loc: number; level: string; cat: string; tool: number; q: string; flag: Flag; sort: Sort }
export const DEFAULT_FILTERS: Filters = { dept: -1, loc: -1, level: 'all', cat: 'all', tool: -1, q: '', flag: 'all', sort: 'cost' };

// ---------- Helpers ----------
export const usd = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${parseInt(d, 10)} ${MON[parseInt(m, 10) - 1]} ${y}`; };
export const fmtDay = (iso: string) => { const [, m, d] = iso.split('-'); return `${parseInt(d, 10)} ${MON[parseInt(m, 10) - 1]}`; };
export const lastText = (s: Seat) =>
  s.status === 'unknown' ? 'Not reported' : s.days === null ? 'Never used' : s.days === 0 ? 'Today' : s.days === 1 ? 'Yesterday' : `${s.days} days ago`;

export type Status = 'ok' | 'near' | 'over';
export const statusOf = (pct: number): Status => (pct > 100 ? 'over' : pct >= 85 ? 'near' : 'ok');
export const STATUS_LABEL: Record<Status, string> = { ok: 'On track', near: 'Near limit', over: 'Over limit' };
// Targets shown next to the headline rates. Set by leadership in a real build; assumed here.
export const ADOPTION_TARGET = 70; // % of employees actively using approved AI
export const SHADOW_BENCHMARK = 15; // % of employees on unapproved AI above which the blind spot is serious
const FORECAST_FACTOR = 30 / 20; // day 20 of 30: usage-based spend grows, seats are fixed

const shadowCat = (c: string) => (c === 'Text' ? 'Text & chat' : c);

// ---------- The one function that turns filters into everything on screen ----------
export function compute(f: Filters) {
  const { depts, tools, shadowTools, alertTypes, employees, locations } = DATA;
  const catOk = (t: number) => f.cat === 'all' || tools[t].cat === f.cat;
  const shadowOk = (t: number) => f.cat === 'all' || shadowCat(shadowTools[t].cat) === f.cat;
  const otherOk = (e: Employee) => (f.loc < 0 || e.loc === f.loc) && (f.level === 'all' || e.level === f.level);
  const budgetMode = f.loc < 0 && f.level === 'all' && f.cat === 'all';

  const scopeParts = [
    f.dept >= 0 ? depts[f.dept].name : '', f.loc >= 0 ? locations[f.loc] : '',
    f.level !== 'all' ? f.level : '', f.cat !== 'all' ? f.cat : '',
  ].filter(Boolean);
  const scopeName = scopeParts.length ? scopeParts.join(' · ') : 'Whole company';

  // department money (respects location / level / tool-type filters)
  const dSeat = depts.map(() => 0), dUse = depts.map(() => 0);
  const toolAgg = tools.map(() => ({ seats: 0, active: 0, unused: 0, leavers: 0, cost: 0 }));
  const companyUsage = tools.map(() => 0);
  const scope: Employee[] = [];
  employees.forEach((e) => {
    e.seats.forEach((s) => { companyUsage[s.tool] += s.usage; });
    if (!otherOk(e)) return;
    e.seats.forEach((s) => { if (catOk(s.tool)) { dSeat[e.dept] += tools[s.tool].price; dUse[e.dept] += s.usage; } });
    if (f.dept >= 0 && e.dept !== f.dept) return;
    scope.push(e);
    e.seats.forEach((s) => {
      if (!catOk(s.tool)) return;
      const a = toolAgg[s.tool];
      a.seats++; a.cost += s.cost;
      if (s.status === 'active') a.active++;
      if (s.status === 'inactive' || s.status === 'never') a.unused++;
      if (e.status === 'Left') a.leavers++;
    });
  });

  const idx = f.dept < 0 ? depts.map((_, i) => i) : [f.dept];
  const seatPart = idx.reduce((s, i) => s + dSeat[i], 0);
  const usagePart = idx.reduce((s, i) => s + dUse[i], 0);
  const budget = idx.reduce((s, i) => s + depts[i].budget, 0);
  const spent = seatPart + usagePart;
  const forecast = seatPart + usagePart * FORECAST_FACTOR;
  const overCount = depts.filter((d, i) => dSeat[i] + dUse[i] > d.budget).length;

  const kpi = {
    spent, seatPart, usagePart, budget, forecast, overCount, people: scope.length,
    usedPct: (spent / budget) * 100, forecastPct: (forecast / budget) * 100,
    status: statusOf((spent / budget) * 100),
  };

  const deptRows = depts.map((d, i) => {
    const sp = dSeat[i] + dUse[i], ex = dSeat[i] + dUse[i] * FORECAST_FACTOR;
    return { i, name: d.name, owner: d.owner, budget: d.budget, spent: sp, expected: ex, pct: (ex / d.budget) * 100, status: statusOf((ex / d.budget) * 100) };
  });
  const maxExpected = Math.max(...deptRows.map((r) => r.expected));

  // top tools
  const scopeCost = toolAgg.reduce((s, a) => s + a.cost, 0) || 1;
  const topTools = tools
    .map((t, ti) => ({ t, ti, a: toolAgg[ti] }))
    .filter((x) => x.a.seats > 0)
    .sort((x, y) => (y.t.usageData === 'Full' ? y.a.active : -1) - (x.t.usageData === 'Full' ? x.a.active : -1))
    .map((x) => ({ ...x, share: (x.a.cost / scopeCost) * 100 }));

  // tool rows with limit status
  const toolRows = tools.map((t, ti) => {
    const a = toolAgg[ti];
    // Each tool is judged on the limit that matters for it: a usage cap (pay-per-use), or seats bought.
    let kind: 'cap' | 'seats' | 'invoice' = 'seats', status = 'On track', tone: 'ok' | 'warn' | 'bad' | 'muted' = 'ok', rank = 3;
    let pct = a.seats ? (a.active / a.seats) * 100 : 0;
    const capUsed = companyUsage[ti];
    if (t.usageLimit) {
      kind = 'cap';
      pct = (capUsed / t.usageLimit) * 100;
      if (pct >= 100) { status = 'Limit reached'; tone = 'bad'; rank = 0; }
      else if (pct * FORECAST_FACTOR > 100) { status = 'Runs out before month-end'; tone = 'warn'; rank = 1; }
    } else if (t.usageData !== 'Full') {
      kind = 'invoice'; status = 'No usage data'; tone = 'muted'; rank = 2;
    } else if (a.seats && pct < 70) {
      status = 'Underused'; tone = 'warn'; rank = 1;
    }
    return { ti, t, a, kind, status, tone, rank, pct, capUsed };
  }).filter((r) => catOk(r.ti) && (r.a.seats > 0 || (f.dept < 0 && f.loc < 0 && f.level === 'all')))
    .sort((x, y) => x.rank - y.rank || y.a.cost - x.a.cost);

  // quick facts
  let unusedPeople = 0, unusedCost = 0, leavers = 0, shadowPeople = 0, alertPeople = 0, activePeople = 0;
  const shadowCounts = shadowTools.map(() => 0);
  const alertCounts = alertTypes.map(() => 0);
  const alertRows: { e: Employee; a: Employee['alerts'][number] }[] = [];
  scope.forEach((e) => {
    e.seats.forEach((s) => { if (catOk(s.tool) && (s.status === 'inactive' || s.status === 'never')) unusedCost += tools[s.tool].price; });
    if (e.hasUnused) unusedPeople++;
    if (e.status === 'Active' && e.seats.some((s) => catOk(s.tool) && s.status === 'active')) activePeople++;
    if (e.isLeaver) leavers++;
    let anyShadow = false;
    e.shadow.forEach((x) => { if (shadowOk(x.tool)) { shadowCounts[x.tool]++; anyShadow = true; } });
    if (anyShadow) shadowPeople++;
    let anyAlert = false;
    e.alerts.forEach((a) => { if (catOk(a.tool)) { alertCounts[a.type]++; alertRows.push({ e, a }); anyAlert = true; } });
    if (anyAlert) alertPeople++;
  });
  alertRows.sort((x, y) => (x.a.date < y.a.date ? 1 : -1));
  const shadowRows = shadowTools.map((t, si) => ({ ...t, people: shadowCounts[si] })).filter((r) => r.people > 0).sort((a, b) => b.people - a.people);

  // people list
  const q = f.q.trim().toLowerCase();
  const people = scope.filter((e) => {
    if (q && !e.search.includes(q)) return false;
    if (f.tool >= 0 && !e.seats.some((s) => s.tool === f.tool)) return false;
    switch (f.flag) {
      case 'unused': return e.hasUnused;
      case 'leaver': return e.isLeaver;
      case 'shadow': return e.shadow.some((x) => shadowOk(x.tool));
      case 'alert': return e.alerts.length > 0;
      case 'none': return e.seats.length === 0;
      default: return true;
    }
  });
  if (f.sort === 'name') people.sort((a, b) => a.name.localeCompare(b.name));
  else if (f.sort === 'idle') people.sort((a, b) => b.idle - a.idle);
  else people.sort((a, b) => b.cost - a.cost);

  return {
    scopeName, budgetMode, kpi, deptRows, maxExpected, topTools, toolRows,
    facts: {
      unusedPeople, unusedCost, leavers, shadowPeople, alertPeople,
      // second-row headline metrics (see the "i" explainers on screen)
      activePeople, staff: scope.filter((e) => e.status === 'Active').length,
      unapprovedFound: shadowRows.length,
      alertsTotal: alertRows.length,
      openAlerts: alertRows.filter((r) => r.a.status === 'Open').length,
      alertsByType: alertTypes.map((type, i) => ({ type, count: alertCounts[i] })),
    },
    shadowRows, shadowPeople, alertCounts, alertRows, people,
  };
}
export type View = ReturnType<typeof compute>;

// ---------- People export (the screen shows a short preview; the full list goes to a CSV) ----------
export const FLAG_LABEL: Record<Flag, string> = {
  all: 'Everyone', unused: 'Unused licences', leaver: 'Left, still has a licence',
  shadow: 'Using unapproved AI', alert: 'Has a data alert', none: 'No AI tools',
};

export function peopleFor(flag: Flag, dept: number, tool: number): Employee[] {
  return DATA.employees
    .filter((e) => {
      if (dept >= 0 && e.dept !== dept) return false;
      if (tool >= 0 && !e.seats.some((s) => s.tool === tool)) return false;
      switch (flag) {
        case 'unused': return e.hasUnused;
        case 'leaver': return e.isLeaver;
        case 'shadow': return e.shadow.length > 0;
        case 'alert': return e.alerts.length > 0;
        case 'none': return e.seats.length === 0;
        default: return true;
      }
    })
    .sort((a, b) => b.cost - a.cost);
}

const lastActive = (e: Employee) => {
  const known = e.seats.filter((s) => s.status !== 'unknown');
  if (!known.length) return e.seats.length ? 'Not reported' : 'No AI licences';
  return lastText(known.reduce((b, s) => ((s.days ?? 999) < (b.days ?? 999) ? s : b)));
};

export function peopleCsv(list: Employee[]): string {
  const head = ['Employee ID', 'Name', 'Email', 'Job title', 'Department', 'Team', 'Level', 'Location', 'Status',
    'Approved AI tools', 'AI cost per month (USD)', 'Last AI activity', 'Unused licences', 'Left but holds licence',
    'Unapproved AI tools', 'Data alerts'];
  const q = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = list.map((e) => [
    e.id, e.name, e.email, e.title, DATA.depts[e.dept].name, e.team, e.level, DATA.locations[e.loc], e.status,
    e.seats.map((s) => DATA.tools[s.tool].name).join('; '),
    Math.round(e.cost),
    lastActive(e),
    e.seats.filter((s) => s.status === 'inactive' || s.status === 'never').map((s) => DATA.tools[s.tool].name).join('; '),
    e.isLeaver ? 'Yes' : 'No',
    e.shadow.map((x) => DATA.shadowTools[x.tool].name).join('; '),
    e.alerts.map((a) => `${DATA.alertTypes[a.type]} in ${DATA.tools[a.tool].name} (${a.status})`).join('; '),
  ].map(q).join(','));
  return [head.join(','), ...rows].join('\r\n');
}
