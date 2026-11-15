import { useState } from 'react';
import { View } from '../data/model';
import { FEATURES } from '../data/sources';
import { IconBadge } from './Icon';
import Carousel from './Carousel';
import FlipModal, { Why } from './FlipModal';

const CATS = ['All', 'Text', 'Voice', 'Image', 'Video'] as const;
type Cat = typeof CATS[number];

export default function ShadowAI({ view }: { view: View }) {
  const [cat, setCat] = useState<Cat>('All');
  const [popup, setPopup] = useState(false);
  const { shadowRows, shadowPeople, scopeName } = view;
  const rows = cat === 'All' ? shadowRows : shadowRows.filter((r) => r.cat === cat);

  return (
    <section id="shadow" className="card section grow-3" aria-label="Unapproved AI tools">
      <div className="sec-head">
        <h2 className="sec-title">
          <IconBadge name="eyeOff" tone="orange" />
          Unapproved AI tools
          {scopeName !== 'Whole company' && <span className="sec-scope"> · {scopeName}</span>}
        </h2>
        <div className="sec-actions">
          <div className="seg-group" role="radiogroup" aria-label="Filter by type">
            {CATS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cat === c} className={`seg-btn ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <button type="button" className="info-btn" onClick={() => setPopup(true)} aria-label="What are unapproved AI tools?">
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>
      <p className="sec-sub">{shadowRows.length} tools · at least {shadowPeople} people, with how we found each one and what to use instead.</p>

      {rows.length === 0 ? (
        <p className="caption empty">No {cat.toLowerCase()} tools found.</p>
      ) : (
        <Carousel count={rows.length} noun="tool" perView={3}>
          {rows.map((r) => (
            <article key={r.name} className="mini-card shadow">
              <div className="mc-top">
                <span className="mc-name">{r.name}<span className="mc-cat">{r.cat}</span></span>
                <span className="mc-num">{r.people}<small> people</small></span>
              </div>
              <div className="mc-row"><span>Found via</span><strong>{r.found}</strong></div>
              <div className="mc-row">
                <span>Use instead</span>
                <strong className={r.alt === 'None approved yet' ? 'muted' : 'ok'}>{r.alt}</strong>
              </div>
            </article>
          ))}
        </Carousel>
      )}

      <FlipModal isOpen={popup} onClose={() => setPopup(false)} tone="orange" title="Unapproved AI tools" eyebrow="About this list" data={FEATURES.shadowTools}>
        <p className="modal-text">AI tools employees use that the company hasn’t approved (“Shadow AI”), how we found them, and the approved tool to move people to.</p>
        <ul className="read-list">
          <li><span><strong>Work-email sign-up:</strong> someone registered with their work email</span></li>
          <li><span><strong>Work calendar connected:</strong> the tool was given access to a work calendar</span></li>
          <li><span><strong>Expense claim:</strong> someone paid for it and claimed it back</span></li>
        </ul>
        <Why>Company information may be going into tools we have no contract with. Moving people to the approved tool removes the risk and often the extra cost.</Why>
      </FlipModal>
    </section>
  );
}
