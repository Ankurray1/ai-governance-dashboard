import { useState } from 'react';
import { DATA, View } from '../data/model';
import { FEATURES } from '../data/sources';
import Icon, { IconBadge } from './Icon';
import FlipModal, { Why } from './FlipModal';

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// One headline number, then a slim bar per type of data shared (red = still to review).
export default function DataAlerts({ view }: { view: View }) {
  const [popup, setPopup] = useState(false);
  const { alertCounts, alertRows, scopeName } = view;
  const open = alertRows.filter((r) => r.a.status === 'Open').length;
  const openByType = DATA.alertTypes.map((_, t) => alertRows.filter((r) => r.a.type === t && r.a.status === 'Open').length);
  const max = Math.max(...alertCounts, 1);

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
          <button type="button" className="icon-btn" onClick={download} disabled={!alertRows.length} aria-label="Download the list of alerts (CSV)" title="Download list">
            <Icon name="download" size={16} />
          </button>
          <button type="button" className="info-btn" onClick={() => setPopup(true)} aria-label="What are sensitive data alerts?">
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>

      <div className="alert-head">
        <span className="alert-total">{alertRows.length}</span>
        <span className="alert-total-label">times sensitive data was shared with approved AI tools this month</span>
        <span className="pill over">{open} to review</span>
      </div>

      <ul className="type-list">
        {DATA.alertTypes.map((label, i) => (
          <li key={label}>
            <span className="tl-label">{label}</span>
            <span className="tl-bar">
              <span className="tl-open" style={{ width: `${(openByType[i] / max) * 100}%` }} />
              <span className="tl-done" style={{ width: `${((alertCounts[i] - openByType[i]) / max) * 100}%` }} />
            </span>
            <span className="tl-num">{alertCounts[i]}</span>
          </li>
        ))}
      </ul>
      <div className="tl-legend">
        <span><i className="tl-key open" />To review</span>
        <span><i className="tl-key done" />Checked</span>
        <button type="button" className="link-btn" onClick={download} disabled={!alertRows.length}>Download list</button>
      </div>

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
