import { ReactNode, useEffect, useRef, useState } from 'react';

// "i" button that opens an explainer card: what the metric means, how it's calculated
// (shown as a visual sum), where the data comes from, and why it matters.

export interface Explainer {
  title: string;
  tone: 'ok' | 'warn' | 'bad' | 'shadow';
  meaning: string;
  formula: { parts: { value: string; label: string }[]; op: string; result: { value: string; label: string } };
  visual?: ReactNode;
  sources: string[];
  why: string;
  note?: string;
}

export default function InfoButton({ info }: { info: Explainer }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      btnRef.current?.focus();
    };
  }, [open]);

  const [a, b] = info.formula.parts;
  return (
    <>
      <button ref={btnRef} type="button" className="info-btn" aria-label={`What is ${info.title}?`} onClick={() => setOpen(true)}>
        <span aria-hidden="true">i</span>
      </button>
      {open && (
        <div className="info-backdrop" onClick={() => setOpen(false)}>
          <div
            className={`info-card tone-${info.tone}`}
            role="dialog"
            aria-modal="true"
            aria-label={info.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="info-top">
              <div>
                <span className="info-eyebrow">About this metric</span>
                <h3>{info.title}</h3>
              </div>
              <button ref={closeRef} type="button" className="info-close" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <p className="info-meaning">{info.meaning}</p>

            <div className="info-section-label">How it's calculated</div>
            <div className="formula">
              <div className="f-box"><strong>{a.value}</strong><span>{a.label}</span></div>
              <span className="f-op" aria-hidden="true">{info.formula.op}</span>
              <div className="f-box"><strong>{b.value}</strong><span>{b.label}</span></div>
              <span className="f-op" aria-hidden="true">=</span>
              <div className="f-box f-result"><strong>{info.formula.result.value}</strong><span>{info.formula.result.label}</span></div>
            </div>

            {info.visual && <div className="info-visual">{info.visual}</div>}

            <div className="info-section-label">Where the data comes from</div>
            <div className="info-sources">
              {info.sources.map((s) => <span key={s} className="src-chip">{s}</span>)}
            </div>

            <div className="info-why">
              <span className="info-section-label">Why it matters</span>
              <p>{info.why}</p>
            </div>
            {info.note && <p className="info-note">{info.note}</p>}
          </div>
        </div>
      )}
    </>
  );
}

// 50-dot picture: each dot = 2% of employees
export function DotGrid({ pct, tone, markerPct, markerLabel }: { pct: number; tone: string; markerPct?: number; markerLabel?: string }) {
  const filled = Math.round(pct / 2);
  const marker = markerPct !== undefined ? Math.round(markerPct / 2) : -1;
  return (
    <div className="dots-wrap">
      <div className="dots" role="img" aria-label={`${Math.round(pct)}% of employees`}>
        {Array.from({ length: 50 }, (_, i) => (
          <i key={i} className={`dot ${i < filled ? tone : ''} ${i === marker - 1 ? 'mark' : ''}`} />
        ))}
      </div>
      <div className="dots-legend">
        <span><i className={`dot ${tone}`} /> 1 dot = 2% of employees</span>
        {markerLabel && <span><i className="dot mark" /> {markerLabel}</span>}
      </div>
    </div>
  );
}
