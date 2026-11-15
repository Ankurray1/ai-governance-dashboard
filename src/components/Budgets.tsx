import { useState } from 'react';
import { Filters, STATUS_LABEL, usd, View } from '../data/model';
import { FEATURES } from '../data/sources';
import { IconBadge } from './Icon';
import FlipModal, { Why } from './FlipModal';

const SCALE = 140; // bars run to 140% of budget; the budget line sits at 100/140
const LINE = (100 / SCALE) * 100;

interface Props { view: View; filters: Filters; onDept: (i: number) => void }

export default function Budgets({ view, filters, onDept }: Props) {
  const [popup, setPopup] = useState(false);
  const { deptRows, budgetMode, maxExpected, topTools, scopeName } = view;
  const w = (p: number) => `${(Math.min(p, SCALE) / SCALE) * 100}%`;
  const maxA = Math.max(...topTools.map((y) => y.a.active), 1);

  return (
    <section id="budgets" className="card section" aria-label="Spend versus budget by department">
      <div className="sec-head">
        <h2 className="sec-title">
          <IconBadge name="chart" />
          Spend vs budget by department
          {scopeName !== 'Whole company' && <span className="sec-scope"> · {scopeName}</span>}
        </h2>
        <div className="sec-actions">
          <div className="legend">
            <span><i className="key seat ok" />Spent so far</span>
            <span><i className="key use ok" />Expected by month-end</span>
            {budgetMode && <span><i className="key line" />Budget</span>}
          </div>
          <button type="button" className="info-btn" onClick={() => setPopup(true)} aria-label="What is spend vs budget by department?">
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>
      <p className="sec-sub">Click a department to see only its numbers.</p>

      <div className="split">
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

        <aside className="split-side panel" aria-label="Most-used AI tools">
          <h3 className="panel-title">Most-used AI tools{scopeName === 'Whole company' ? '' : ` · ${scopeName}`}</h3>
          <p className="caption">People who used it in the last 30 days · cost this month</p>
          {topTools.length === 0 && <p className="caption">No approved tools here.</p>}
          {topTools.slice(0, 6).map((x, r) => {
            const full = x.t.usageData === 'Full';
            return (
              <div key={x.t.name} className="top-row">
                <span className="rank">{r + 1}</span>
                <div className="top-mid">
                  <span className="top-name">{x.t.name}</span>
                  <div className="mini-track"><div className="mini-bar" style={{ width: full ? `${(x.a.active / maxA) * 100}%` : 0 }} /></div>
                </div>
                <div className="top-val">
                  <strong>{full ? `${x.a.active} people` : `${x.a.seats} licences`}</strong>
                  <span>{usd(x.a.cost)}</span>
                </div>
              </div>
            );
          })}
        </aside>
      </div>

      <FlipModal isOpen={popup} onClose={() => setPopup(false)} title="Spend vs budget by department" eyebrow="About this chart" data={FEATURES.departments}>
        <p className="modal-text">Each department’s AI spend against the monthly budget Finance gave it, with the person who owns that budget.</p>
        <ul className="read-list">
          <li><i className="key seat ok" /><span><strong>Dark bar:</strong> spent so far this month</span></li>
          <li><i className="key use ok" /><span><strong>Light bar:</strong> expected by month-end if use carries on at today’s pace</span></li>
          <li><i className="key line" /><span><strong>Black line:</strong> the department’s budget</span></li>
        </ul>
        <Why>It shows who is over budget and whom to talk to, before the month’s bill arrives.</Why>
      </FlipModal>
    </section>
  );
}
