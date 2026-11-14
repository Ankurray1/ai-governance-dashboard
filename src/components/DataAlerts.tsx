import { useState } from 'react';
import { DATA, fmtDay, View } from '../data/model';
import Icon, { IconBadge } from './Icon';
import FlipModal, { ApiSourceItem } from './FlipModal';

const ALERTS_API_SOURCES: ApiSourceItem[] = [
  {
    name: 'Microsoft Purview / Cloud Security Audit API',
    category: 'Security / DLP',
    purpose: 'Captures Data Loss Prevention (DLP) violation incidents when employees paste confidential data into Microsoft 365 Copilot.',
    howItWorks: 'Stream audit events via Microsoft Graph Security API / Office 365 Management Activity API `DlpMatches`.',
    status: 'Ready (Standard API)',
  },
  {
    name: 'OpenAI Enterprise Audit Logs API',
    category: 'Direct API',
    purpose: 'Inspects user workspace activity logs, login anomalies, and enterprise security flags for ChatGPT Enterprise.',
    howItWorks: 'Poll `/v1/organization/audit_logs` using Enterprise Admin Key (event types: `user.login`, `data_export`, `sensitive_flag`).',
    status: 'Ready (Standard API)',
  },
  {
    name: 'CASB / Web Gateway DLP Connector',
    category: 'Security / DLP',
    purpose: 'Real-time regex & natural language pattern inspection (detecting SSNs, credit cards, proprietary code, JWT tokens).',
    howItWorks: 'Cloudflare Zero Trust / Netskope / Zscaler Cloud DLP API policy triggers.',
    status: 'Scheduled Sync',
  },
];

export default function DataAlerts({ view }: { view: View }) {
  const [popup, setPopup] = useState(false);
  const { alertCounts, alertRows, scopeName } = view;

  const downloadCsv = () => {
    const headers = ['Date', 'Employee Name', 'Department', 'Alert Type', 'AI Tool', 'Status'];
    const rows = alertRows.map(({ e, a }) => [
      fmtDay(a.date),
      `"${e.name.replace(/"/g, '""')}"`,
      `"${DATA.depts[e.dept].name.replace(/"/g, '""')}"`,
      `"${DATA.alertTypes[a.type].replace(/"/g, '""')}"`,
      `"${DATA.tools[a.tool].name.replace(/"/g, '""')}"`,
      a.status === 'Open' ? 'To review' : 'Checked',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sensitive-data-alerts-${scopeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="alerts" className="card section grow-2" aria-label="Sensitive data alerts">
      {/* ── Header ── */}
      <div className="section-head">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconBadge name="shield" />
            <h2 className="sec-title" style={{ margin: 0, fontWeight: 600 }}>
              Sensitive data alerts
              {scopeName !== 'Whole company' && <span className="muted" style={{ fontWeight: 400 }}> · {scopeName}</span>}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Minimalist circular download action button */}
            <button
              type="button"
              className="action-circle-btn"
              onClick={downloadCsv}
              disabled={alertRows.length === 0}
              aria-label={`Download alerts log (${alertRows.length} records CSV)`}
              title={`Download alerts audit log (${alertRows.length} records CSV)`}
            >
              <Icon name="download" size={16} />
            </button>

            {/* Info button */}
            <button
              type="button"
              className="info-btn"
              onClick={() => setPopup(true)}
              aria-label="What is this data?"
              title="About this data & API sources"
            >
              <span aria-hidden="true">i</span>
            </button>
          </div>
        </div>
      </div>

      <p className="muted" style={{ margin: '2px 0 6px 0', fontSize: '13px' }}>
        Confidential information shared with approved AI tools this month.
      </p>

      {/* ── Category stat cards ── */}
      <div className="alert-cards">
        {DATA.alertTypes.map((label, i) => (
          <div key={label} className="alert-card">
            <span className="alert-num">{alertCounts[i]}</span>
            <span className="small">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Minimal footnote summary with download hint ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <p className="small muted" style={{ margin: 0 }}>
          {alertRows.length} total alerts detected · click download icon above for CSV audit report
        </p>
      </div>

      {/* ── FlipModal mounted at document.body via Portal with in-modal slider ── */}
      <FlipModal
        isOpen={popup}
        onClose={() => setPopup(false)}
        accent="var(--red)"
        accentBg="var(--red-bg)"
        title="Sensitive data alerts"
        eyebrow="About this data"
        apiSources={ALERTS_API_SOURCES}
      >
        <p className="fp-meaning">
          These alerts detect times employees pasted or submitted confidential or restricted information into <strong>approved AI tools</strong> (like Microsoft Copilot or ChatGPT Enterprise) this month.
        </p>

        <div className="fp-section-label">Alert categories tracked</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 24px' }}>
          {[
            ['Customer personal data', 'Names, email addresses, phone numbers, PII, or IDs entered into AI prompts.'],
            ['Financial data', 'Revenue numbers, invoices, payroll info, or confidential company financials.'],
            ['Passwords & access keys', 'API secrets, credentials, internal tokens, or SSH keys detected in queries.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel)', borderRadius: 14, padding: '10px 14px' }}>
              <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{title}</strong>
              <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>

        <div className="fp-why" style={{ marginLeft: 24 }}>
          <div className="fp-section-label">Why it matters & Scope</div>
          <p className="fp-meaning">
            Each occurrence represents a potential compliance infraction or internal data leakage risk. We monitor approved enterprise tools via telemetry and DLP connectors (e.g. Purview). Note: What employees type into unapproved or personal AI accounts remains invisible to enterprise monitoring.
          </p>
        </div>
      </FlipModal>
    </section>
  );
}
