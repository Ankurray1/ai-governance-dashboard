import { useState } from 'react';
import ToolLogo from './ToolLogo';
import { Filters, usd, View } from '../data/model';
import { FEATURES } from '../data/sources';
import { IconBadge } from './Icon';
import Carousel from './Carousel';
import FlipModal, { Why } from './FlipModal';

interface Props { view: View; filters: Filters; onTool: (i: number) => void }

// One compact card per approved tool, problems first: licences bought vs licences used.
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
      <p className="sec-sub">Are the licences we bought being used? Problems first.</p>

      <Carousel count={rows.length} noun="tool" perView={4}>
        {rows.map(({ ti, t, a, kind, status, tone, pct }) => {
          const on = filters.tool === ti;
          return (
            <button key={t.name} type="button" className={`mini-card tool tone-${tone} ${on ? 'on' : ''}`} onClick={() => onTool(ti)} aria-pressed={on}>
              <span className="mc-top">
                <span className="mc-id"><ToolLogo name={t.name} /><span className="mc-name">{t.name}<span className="mc-cat">{t.cat}</span></span></span>
              </span>
              <span className={`status ${tone}`}>{status}</span>
              <span className="mc-metric">
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

      <FlipModal isOpen={popup} onClose={() => setPopup(false)} title="Approved AI tools" eyebrow="About this list" data={FEATURES.tools}>
        <p className="modal-text">Every AI tool the company pays for, checked on how many of its licences are really used. Tools that need attention come first.</p>
        <ul className="read-list">
          <li><span><strong>Licences in use:</strong> people who used it in the last 30 days out of licences bought. Under 70% means “Underused”.</span></li>
          <li><span><strong>Held by leavers:</strong> licences still assigned to people who have left. These can be cancelled now.</span></li>
        </ul>
        <Why>Unused licences and leavers’ licences are the quickest money to save.</Why>
        <p className="modal-note">Midjourney only sends a bill, so we show the licences bought, not who uses them.</p>
      </FlipModal>
    </section>
  );
}
