import { useState } from 'react';
import ToolLogo from './ToolLogo';
import { View } from '../data/model';
import { FEATURES } from '../data/sources';
import { IconBadge } from './Icon';
import FlipModal, { Why } from './FlipModal';

// All unapproved tools in one ranked list: who uses it, how many, and how we found it.
export default function ShadowAI({ view }: { view: View }) {
  const [popup, setPopup] = useState(false);
  const { shadowRows, shadowPeople, scopeName } = view;
  const max = Math.max(...shadowRows.map((r) => r.people), 1);

  return (
    <section id="shadow" className="card section grow-3" aria-label="Unapproved AI tools">
      <div className="sec-head">
        <h2 className="sec-title">
          <IconBadge name="eyeOff" tone="orange" />
          Unapproved AI tools
          {scopeName !== 'Whole company' && <span className="sec-scope"> · {scopeName}</span>}
        </h2>
        <button type="button" className="info-btn" onClick={() => setPopup(true)} aria-label="What are unapproved AI tools?">
          <span aria-hidden="true">i</span>
        </button>
      </div>
      <p className="sec-sub">At least <strong>{shadowPeople} people</strong> on {shadowRows.length} tools</p>

      {shadowRows.length === 0 ? (
        <p className="caption empty">No unapproved tools found.</p>
      ) : (
        <ul className="rank-list">
          {shadowRows.map((r) => (
            <li key={r.name} className="rank-row">
              <ToolLogo name={r.name} size={30} />
              <span className="rr-name">
                <strong>{r.name}</strong>
                <span>{r.cat} · {r.found}</span>
              </span>
              <span className="rr-bar"><span style={{ width: `${(r.people / max) * 100}%` }} /></span>
              <span className="rr-num">{r.people}</span>
            </li>
          ))}
        </ul>
      )}

      <FlipModal isOpen={popup} onClose={() => setPopup(false)} tone="orange" title="Unapproved AI tools" eyebrow="About this list" data={FEATURES.shadowTools}>
        <p className="modal-text">AI tools employees use that the company hasn’t approved (“Shadow AI”), how many people use each, and how we found them.</p>
        <ul className="read-list">
          <li><span><strong>Work-email sign-up:</strong> someone registered with their work email</span></li>
          <li><span><strong>Work calendar connected:</strong> the tool was given access to a work calendar</span></li>
          <li><span><strong>Expense claim:</strong> someone paid for it and claimed it back</span></li>
        </ul>
        <Why>Company information may be going into tools we have no contract with and have never checked for security.</Why>
      </FlipModal>
    </section>
  );
}
