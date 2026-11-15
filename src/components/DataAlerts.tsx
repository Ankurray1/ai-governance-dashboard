import { useState } from 'react';
import { DATA, fmtDay, View } from '../data/model';
import { FEATURES } from '../data/sources';
import Icon, { IconBadge } from './Icon';
import FlipModal, { Why } from './FlipModal';

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export default function DataAlerts({ view }: { view: View }) {
  const [popup, setPopup] = useState(false);
  const { alertCounts, alertRows, scopeName } = view;
  const open = alertRows.filter((r) => r.a.status === 'Open').length;

  const download = () => {
    const head = ['Date', 'Name', 'Department', 'What was shared', 'AI tool', 'Status'];
    const rows = alertRows.map(({ e, a }) =>
      [a.date, e.name, DATA.depts[e.dept].name, DATA.alertTypes[a.type], DATA.tools[a.tool].name, a.status === 'Open' ? 'To review' : 'Checked']
        .map(csvCell).join(','));
    const blob = new Blob(['﻿' + [head.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-alerts-${scopeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="alerts" className="card section grow-2" aria-label="Sensitive data alerts">
      <div className="sec-head">
        <h2 className="sec-title">
          <IconBadge name="shield" tone="red" />
          Sensitive data alerts
          {scopeName !== 'Whole company' && <span className="sec-scope"> · {scopeName}</span>}
        </h2>
        <div className="sec-actions">
          <button type="button" className="btn btn-sm" onClick={download} disabled={!alertRows.length}>
            <Icon name="download" size={15} /> Download list
          </button>
          <button type="button" className="info-btn" onClick={() => setPopup(true)} aria-label="What are sensitive data alerts?">
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>
      <p className="sec-sub">{alertRows.length} times this month sensitive information was shared with approved AI tools · {open} to review.</p>

      <div className="alert-cards">
        {DATA.alertTypes.map((label, i) => (
          <div key={label} className="alert-card">
            <span className="alert-num">{alertCounts[i]}</span>
            <span className="alert-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="modal-label">Most recent</div>
      <ul className="alert-list">
        {alertRows.slice(0, 4).map(({ e, a }, i) => (
          <li key={i}>
            <span className="alert-date">{fmtDay(a.date)}</span>
            <span className="alert-who">
              <strong>{e.name} · {DATA.depts[e.dept].name}</strong>
              <span>{DATA.alertTypes[a.type]} in {DATA.tools[a.tool].name}</span>
            </span>
            <span className={`pill ${a.status === 'Open' ? 'over' : 'neutral'}`}>{a.status === 'Open' ? 'To review' : 'Checked'}</span>
          </li>
        ))}
        {alertRows.length === 0 && <li className="caption">No alerts here.</li>}
      </ul>

      <FlipModal isOpen={popup} onClose={() => setPopup(false)} tone="red" title="Sensitive data alerts" eyebrow="About this list" data={FEATURES.alerts}>
        <p className="modal-text">Times someone shared sensitive information with an <strong>approved</strong> AI tool such as Copilot or ChatGPT Enterprise.</p>
        <ul className="read-list">
          <li><span><strong>Customer personal data:</strong> names, emails, phone numbers or IDs</span></li>
          <li><span><strong>Financial data:</strong> revenue, invoices or payroll</span></li>
          <li><span><strong>Passwords &amp; access keys:</strong> logins or keys that open company systems</span></li>
        </ul>
        <Why>Each one could be a data leak or a breach of privacy rules. Download the list to follow up with each person.</Why>
        <p className="modal-note">We only see this for approved tools, not what people type into unapproved ones.</p>
      </FlipModal>
    </section>
  );
}
