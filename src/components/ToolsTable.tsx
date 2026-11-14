import { useEffect, useRef, useState } from 'react';
import { IconBadge } from './Icon';
import { Filters, usd, View } from '../data/model';
import FlipModal, { ApiSourceItem } from './FlipModal';

interface Props { view: View; filters: Filters; onTool: (i: number) => void }

const TOOLS_API_SOURCES: ApiSourceItem[] = [
  {
    name: 'OpenAI Admin API',
    category: 'Direct API',
    purpose: 'Queries ChatGPT Enterprise active seats, last activity per licensed user, and total spend.',
    howItWorks: 'REST GET `https://api.openai.com/v1/organization/users` and `/v1/organization/costs`.',
    status: 'Ready (Standard API)',
  },
  {
    name: 'Microsoft Graph Copilot Usage Reports API',
    category: 'Direct API',
    purpose: 'Retrieves Microsoft 365 Copilot user activity, active days, and license assignment.',
    howItWorks: 'Call `reports/getOffice365ActiveUserDetail(period=\'D30\')` (refreshes daily with ~48h latency).',
    status: 'Ready (Standard API)',
  },
  {
    name: 'Anthropic Admin API',
    category: 'Direct API',
    purpose: 'Pulls Claude Enterprise seat utilization, token consumption, and monthly cost reports.',
    howItWorks: 'Direct Admin API `/v1/organizations/{id}/usage_report` using Enterprise service token.',
    status: 'Ready (Standard API)',
  },
  {
    name: 'Voice/Video Consumption APIs (Synthesia, Runway, ElevenLabs)',
    category: 'Direct API',
    purpose: 'Tracks minute/video generation meters against the department usage caps.',
    howItWorks: 'Usage query webhooks to monitor credits consumed before month-end.',
    status: 'Ready (Standard API)',
  },
  {
    name: 'Vendor Billing Invoices (Midjourney Fallback)',
    category: 'Expense / ERP',
    purpose: 'Midjourney does not provide team usage telemetry APIs; tracked via invoiced seats.',
    howItWorks: 'Monthly invoice ingestion from accounts payable or finance billing upload.',
    status: 'Invoice Fallback',
  },
];

export default function ToolsTable({ view, filters, onTool }: Props) {
  const [popup, setPopup] = useState(false);
  const rows = view.toolRows;
  const count = (tone: string) => rows.filter((r) => r.tone === tone).length;
  const summary = [
    { tone: 'bad', n: count('bad'), label: 'limit reached' },
    { tone: 'warn', n: count('warn'), label: 'need a look' },
    { tone: 'ok', n: count('ok'), label: 'on track' },
    { tone: 'muted', n: count('muted'), label: 'no usage data' },
  ].filter((s) => s.n > 0);

  // One-row slider: arrows move one card at a time
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: true, first: 1, last: 1 });
  const measure = () => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : 1;
    const first = Math.round(el.scrollLeft / step) + 1;
    const fit = Math.max(1, Math.round((el.clientWidth + 12) / step));
    setEdge({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2, first, last: Math.min(first + fit - 1, rows.length) });
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rows.length]);
  const slide = (dir: number) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + 12), behavior: 'smooth' });
  };

  return (
    <section id="tools" className="card section" aria-label="Approved AI tools">
      <div className="section-head" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBadge name="grid" />
          <h2 className="sec-title" style={{ margin: 0, fontWeight: 600 }}>
            Approved AI tools{view.scopeName === 'Whole company' ? '' : ` · ${view.scopeName}`}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="tool-summary">
            {summary.map((s) => (
              <span key={s.tone} className={`pill ${s.tone === 'bad' ? 'over' : s.tone === 'warn' ? 'near' : s.tone === 'ok' ? 'ok' : 'neutral'}`}>
                {s.n} {s.label}
              </span>
            ))}
          </div>

          {/* Info Button */}
          <button
            type="button"
            className="info-btn"
            onClick={() => setPopup(true)}
            aria-label="About approved tools & API sources"
            title="About approved AI tools"
          >
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>

      <div className="carousel">
        <button type="button" className="car-arrow left" aria-label="Previous tool" disabled={!edge.left} onClick={() => slide(-1)}>‹</button>
        <div className="tool-track" ref={track} onScroll={measure}>
        {rows.map(({ ti, t, a, kind, status, tone, pct, capUsed }) => {
          const on = filters.tool === ti;
          const barTone = tone === 'muted' ? 'muted-fill' : tone;
          return (
            <button
              key={t.name}
              type="button"
              className={`tool-card tone-${tone} ${on ? 'on' : ''}`}
              onClick={() => onTool(ti)}
              aria-pressed={on}
            >
              <span className="tool-top">
                <span className="tool-name">{t.name}<span className="tool-cat">{t.cat}</span></span>
                <span className={`tool-status ${tone}`}>{status}</span>
              </span>

              <span className="tool-metric">
                {kind === 'cap' && <>Spending cap: <strong>{usd(capUsed)}</strong> of {usd(t.usageLimit ?? 0)} used</>}
                {kind === 'seats' && <>Licences in use: <strong>{a.active}</strong> of {a.seats}</>}
                {kind === 'invoice' && <>Licences bought: <strong>{a.seats}</strong> · use not reported</>}
              </span>
              <span className="mini-meter">
                <span className={`fill ${barTone}`} style={{ width: kind === 'invoice' ? '100%' : `${Math.min(pct, 100)}%` }} />
              </span>

              <span className="tool-foot">
                <strong>{usd(a.cost)}</strong> this month
                {kind !== 'invoice' && a.unused > 0 && <> · {a.unused} unused {a.unused === 1 ? 'licence' : 'licences'}</>}
                {a.leavers > 0 && <> · <span className="bad-text">{a.leavers} held by people who left</span></>}
              </span>
            </button>
          );
        })}
        </div>
        <button type="button" className="car-arrow right" aria-label="Next tool" disabled={!edge.right} onClick={() => slide(1)}>›</button>
      </div>
      <p className="car-count muted small" aria-live="polite">Showing {edge.first}–{edge.last} of {rows.length} tools</p>

      {/* ── FlipModal Info Card with in-modal 'About' and 'Data Sources & APIs' slider ── */}
      <FlipModal
        isOpen={popup}
        onClose={() => setPopup(false)}
        accent="var(--blue)"
        accentBg="var(--blue-bg)"
        title="Approved AI tools"
        eyebrow="About this section"
        apiSources={TOOLS_API_SOURCES}
      >
        <p className="fp-meaning">
          This carousel monitors every sanctioned AI tool paid for by the company, sorted with tools needing immediate management attention first (e.g. tools that have exceeded their spending cap or hold unused licences).
        </p>

        <div className="fp-section-label">Management signals tracked</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel)', borderRadius: 14, padding: '10px 14px' }}>
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Spending Caps (Usage-based AI)</strong>
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              For video and voice AI (e.g. Synthesia, Runway, ElevenLabs) that bill per minute or credit. Alert triggers when close to month-end limits.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel)', borderRadius: 14, padding: '10px 14px' }}>
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Licences in Use vs Bought (Seat Waste)</strong>
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Identifies licences that haven't been active in 30 days or remain assigned to former employees who left the company.
            </span>
          </div>
        </div>

        <div className="fp-why" style={{ marginLeft: 24 }}>
          <div className="fp-section-label">Vendor Telemetry Note</div>
          <p className="fp-meaning">
            Tools with direct telemetry (ChatGPT Enterprise, Microsoft Copilot) report exact user logins. Tools without user-level APIs (e.g. Midjourney) report purchased seat commitments via invoice.
          </p>
        </div>
      </FlipModal>
    </section>
  );
}
