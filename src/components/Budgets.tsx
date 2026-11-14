import { useState } from 'react';
import { Filters, STATUS_LABEL, usd, View } from '../data/model';
import { IconBadge } from './Icon';
import FlipModal, { ApiSourceItem } from './FlipModal';

const SCALE = 140; // bars run to 140% of budget; the budget line sits at 100/140
const LINE = (100 / SCALE) * 100;

interface Props { view: View; filters: Filters; onDept: (i: number) => void }

const BUDGET_API_SOURCES: ApiSourceItem[] = [
  {
    name: 'Enterprise AI Vendor Billing APIs',
    category: 'Direct API',
    purpose: 'Real-time billing run-rate and usage fees per cost-center/workspace.',
    howItWorks: 'Direct Admin API webhooks (OpenAI `/v1/organization/costs`, Anthropic `cost_report`, Azure Cost Management API).',
    status: 'Ready (Standard API)',
  },
  {
    name: 'HR Information System (HRIS)',
    category: 'SSO / Identity',
    purpose: 'Maps employees, managers, and cost-center owners (e.g. VP Engineering, Head of Marketing) to departments.',
    howItWorks: 'SCIM directory connector with Workday / BambooHR / Rippling.',
    status: 'Scheduled Sync',
  },
];

export default function Budgets({ view, filters, onDept }: Props) {
  const [popup, setPopup] = useState(false);
  const { deptRows, budgetMode, maxExpected, topTools, scopeName } = view;
  const w = (p: number) => `${(Math.min(p, SCALE) / SCALE) * 100}%`;

  return (
    <section id="budgets" className="card section" aria-label="Spend versus budget by department">
      {/* ── Clean Header without verbose subtexts ── */}
      <div className="section-head" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBadge name="chart" />
          <h2 className="sec-title" style={{ margin: 0, fontWeight: 600 }}>
            Spend vs budget by department
            {scopeName !== 'Whole company' && <span className="muted" style={{ fontWeight: 400 }}> · {scopeName}</span>}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Visual Legend */}
          <div className="legend" style={{ margin: 0 }}>
            <span><i className="key seat ok" />Spent so far</span>
            <span><i className="key use ok" />Expected month-end</span>
            {budgetMode && <span><i className="key line" />Budget limit</span>}
          </div>

          {/* "i" Info Button */}
          <button
            type="button"
            className="info-btn"
            onClick={() => setPopup(true)}
            aria-label="About department spend vs budget"
            title="About this section & API sources"
          >
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Split ── */}
      <div className="split" style={{ gap: 20, alignItems: 'stretch' }}>
        {/* Department Progress Bars */}
        <div className="split-main scroll-x">
          <div className="dept-chart">
            {deptRows.map((d) => {
              const st = budgetMode ? d.status : 'ok';
              const spP = budgetMode ? (d.spent / d.budget) * 100 : (d.spent / maxExpected) * SCALE * 0.7;
              const exP = budgetMode ? d.pct : (d.expected / maxExpected) * SCALE * 0.7;
              const on = filters.dept === d.i;
              return (
                <div key={d.name} className={`dept-row ${filters.dept >= 0 && !on ? 'dim' : ''}`}>
                  <button type="button" className={`linkish ${on ? 'on' : ''}`} onClick={() => onDept(d.i)} aria-pressed={on}>
                    <span className="name">{d.name}</span>
                    <span className="sub">{d.owner}</span>
                  </button>
                  <div className="track">
                    <div className={`bar use ${st}`} style={{ width: w(exP) }} />
                    <div className={`bar seat ${st}`} style={{ width: w(spP) }} />
                    {budgetMode && <div className="budget-line" style={{ left: `${LINE}%` }} />}
                  </div>
                  <div className="dept-val">
                    <strong>{budgetMode ? `${usd(d.expected)} / ${usd(d.budget)}` : `${usd(d.expected)} expected`}</strong>
                    <span className={`pill ${budgetMode ? st : 'neutral'}`}>
                      {budgetMode ? `${STATUS_LABEL[st]} · ${Math.round(d.pct)}%` : `${usd(d.spent)} so far`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most-used AI tools panel */}
        <aside className="split-side panel" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>
              Most-used AI tools{scopeName === 'Whole company' ? '' : ` · ${scopeName}`}
            </h3>
            {topTools.length === 0 && <p className="muted">No approved tool seats in this selection.</p>}
            {topTools.slice(0, 7).map((x, r) => {
              const full = x.t.usageData === 'Full';
              const maxA = Math.max(...topTools.map((y) => y.a.active), 1);
              return (
                <div key={x.t.name} className="top-row">
                  <span className="rank">{r + 1}</span>
                  <div className="top-mid">
                    <div className="top-name"><strong>{x.t.name}</strong><span className="muted">{x.t.cat}</span></div>
                    <div className="mini-track"><div className="mini-bar" style={{ width: full ? `${(x.a.active / maxA) * 100}%` : 0 }} /></div>
                  </div>
                  <div className="top-val">
                    <strong>{full ? `${x.a.active} people` : `${x.a.seats} licences*`}</strong>
                    <span className="small">{usd(x.a.cost)} · {Math.round(x.share)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ── FlipModal Info Card with in-modal 'About' and 'Data Sources & APIs' slider ── */}
      <FlipModal
        isOpen={popup}
        onClose={() => setPopup(false)}
        accent="var(--blue)"
        accentBg="var(--blue-bg)"
        title="Spend vs budget by department"
        eyebrow="About this section"
        apiSources={BUDGET_API_SOURCES}
      >
        <p className="fp-meaning">
          This chart benchmarks each department's current AI spend and expected month-end forecast against the monthly allocation assigned by Finance.
        </p>

        <div className="fp-section-label">How to read the bars</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel)', borderRadius: 14, padding: '10px 14px' }}>
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Darker Bar (Spent so far)</strong>
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Actual charges incurred through the current billing day of the month.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel)', borderRadius: 14, padding: '10px 14px' }}>
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Lighter Bar (Expected by month-end)</strong>
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Projected total expenditure based on seat commitments plus current consumption run-rates.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel)', borderRadius: 14, padding: '10px 14px' }}>
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Vertical Black Line (Monthly Budget)</strong>
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              The 100% budget threshold. Bars that cross this line are flagged as <em>Over limit</em> or <em>Near limit</em>.
            </span>
          </div>
        </div>

        <div className="fp-why" style={{ marginLeft: 24 }}>
          <div className="fp-section-label">Most-used tools & data notes</div>
          <p className="fp-meaning">
            Clicking any department filters the entire dashboard to show that department's specific AI usage.
            <br /><br />
            <strong>*Data reporting note:</strong> Tools with full telemetry (e.g. ChatGPT Enterprise, Copilot) report exact user counts. Invoice-only vendors (like Midjourney) bill in bulk seats without individual user logs, so purchased licences are shown.
          </p>
        </div>
      </FlipModal>
    </section>
  );
}
