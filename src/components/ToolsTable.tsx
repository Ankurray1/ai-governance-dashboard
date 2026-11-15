import { useState } from 'react';
import { Filters, usd, View } from '../data/model';
import { SOURCES } from '../data/sources';
import { IconBadge } from './Icon';
import Carousel from './Carousel';
import FlipModal, { Why } from './FlipModal';

interface Props { view: View; filters: Filters; onTool: (i: number) => void }

// One compact card per approved tool, problems first. Each card shows the one limit that
// matters for that tool: its spending cap (pay-per-use) or the licences we bought.
export default function ToolsTable({ view, filters, onTool }: Props) {
  const [popup, setPopup] = useState(false);
  const rows = view.toolRows;
  const count = (tone: string) => rows.filter((r) => r.tone === tone).length;
  const summary = [
    { tone: 'over', n: count('bad'), label: 'limit reached' },
    { tone: 'near', n: count('warn'), label: 'need a look' },
    { tone: 'ok', n: count('ok'), label: 'on track' },
    { tone: 'neutral', n: count('muted'), label: 'no usage data' },
  ].filter((s) => s.n > 0);

  return (
    <section id="tools" className="card section" aria-label="Approved AI tools">
      <div className="sec-head">
        <h2 className="sec-title">
          <IconBadge name="grid" />
          Approved AI tools{view.scopeName === 'Whole company' ? '' : ` · ${view.scopeName}`}
        </h2>
        <div className="sec-actions">
          <div className="tool-summary">
            {summary.map((s) => <span key={s.tone} className={`pill ${s.tone}`}>{s.n} {s.label}</span>)}
          </div>
          <button type="button" className="info-btn" onClick={() => setPopup(true)} aria-label="What are approved AI tools?">
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>
      <p className="sec-sub">Is each tool within its limit? Problems first.</p>

      <Carousel count={rows.length} noun="tool" perView={4}>
        {rows.map(({ ti, t, a, kind, status, tone, pct, capUsed }) => {
          const on = filters.tool === ti;
          return (
            <button key={t.name} type="button" className={`mini-card tool tone-${tone} ${on ? 'on' : ''}`} onClick={() => onTool(ti)} aria-pressed={on}>
              <span className="mc-top">
                <span className="mc-name">{t.name}<span className="mc-cat">{t.cat}</span></span>
              </span>
              <span className={`status ${tone}`}>{status}</span>
              <span className="mc-metric">
                {kind === 'cap' && <>Spending cap: <strong>{usd(capUsed)}</strong> of {usd(t.usageLimit ?? 0)}</>}
                {kind === 'seats' && <>Licences in use: <strong>{a.active}</strong> of {a.seats}</>}
                {kind === 'invoice' && <>Licences bought: <strong>{a.seats}</strong> · use not reported</>}
              </span>
              <span className="meter">
                <span className={`fill ${tone === 'muted' ? 'muted-fill' : tone}`} style={{ width: kind === 'invoice' ? '100%' : `${Math.min(pct, 100)}%` }} />
              </span>
              <span className="mc-foot">
                <strong>{usd(a.cost)}</strong> this month
                {kind !== 'invoice' && a.unused > 0 && <> · {a.unused} unused</>}
                {a.leavers > 0 && <> · <span className="bad-text">{a.leavers} held by leavers</span></>}
              </span>
            </button>
          );
        })}
      </Carousel>

      <FlipModal isOpen={popup} onClose={() => setPopup(false)} title="Approved AI tools" eyebrow="About this list" sources={SOURCES.tools}>
        <p className="modal-text">Every AI tool the company pays for, each checked against its own limit. Tools that need attention come first.</p>
        <ul className="read-list">
          <li><span><strong>Spending cap:</strong> pay-per-use tools (video and voice) have a monthly cap. “Runs out before month-end” means it will hit the cap at today’s pace.</span></li>
          <li><span><strong>Licences in use:</strong> people who used it in the last 30 days out of licences bought. Under 70% means “Underused”.</span></li>
          <li><span><strong>Held by leavers:</strong> licences still assigned to people who have left. These can be cancelled now.</span></li>
        </ul>
        <Why>Unused licences and leavers’ licences are the quickest money to save. Caps stop pay-per-use bills from running away.</Why>
        <p className="modal-note">Midjourney only sends a bill, so we show the licences bought, not who uses them.</p>
      </FlipModal>
    </section>
  );
}
