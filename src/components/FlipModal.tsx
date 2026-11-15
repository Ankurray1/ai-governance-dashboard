import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Feature, NOTE } from '../data/sources';

// The "i" card. Two tabs:
//   1. About this metric: what it means, how it's worked out, why it matters
//   2. Data sources: this feature's row from the Part 2 table (sources + purpose)

export type Tone = 'blue' | 'orange' | 'red';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tone?: Tone;
  title: string;
  eyebrow?: string;
  data: Feature;
  children: React.ReactNode;
}

export default function FlipModal({ isOpen, onClose, tone = 'blue', title, eyebrow = 'About this metric', data, children }: Props) {
  const [tab, setTab] = useState<'about' | 'sources'>('about');
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTab('about');
    opener.current = document.activeElement;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal tone-${tone}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-row">
            <div>
              <span className="modal-eyebrow">{eyebrow}</span>
              <h3 className="modal-title">{title}</h3>
            </div>
            <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className="modal-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'about'} className={`modal-tab ${tab === 'about' ? 'on' : ''}`} onClick={() => setTab('about')}>
              About this metric
            </button>
            <button type="button" role="tab" aria-selected={tab === 'sources'} className={`modal-tab ${tab === 'sources' ? 'on' : ''}`} onClick={() => setTab('sources')}>
              Data sources <span className="tab-count">{data.sources.length}</span>
            </button>
          </div>
        </div>

        {tab === 'about' ? (
          <div className="modal-body" role="tabpanel">{children}</div>
        ) : (
          <div className="modal-body" role="tabpanel">
            <div className="purpose">
              <span className="modal-label">Purpose</span>
              <p>{data.purpose}</p>
            </div>
            <div className="modal-label">API &amp; data sources</div>
            <ul className="src-list">
              {data.sources.map((s, i) => (
                <li key={s.name}>
                  <span className="src-n">{i + 1}</span>
                  <span className="src-text"><strong>{s.name}</strong><span>{s.gives}</span></span>
                </li>
              ))}
            </ul>
            <p className="modal-note"><strong>Note:</strong> {NOTE}</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// Small building blocks used inside the "About" tab
export function Formula({ a, b, op, result }: { a: [string, string]; b: [string, string]; op: string; result: [string, string] }) {
  return (
    <div className="formula">
      <div className="f-box"><strong>{a[0]}</strong><span>{a[1]}</span></div>
      <span className="f-op" aria-hidden="true">{op}</span>
      <div className="f-box"><strong>{b[0]}</strong><span>{b[1]}</span></div>
      <span className="f-op" aria-hidden="true">=</span>
      <div className="f-box f-result"><strong>{result[0]}</strong><span>{result[1]}</span></div>
    </div>
  );
}

export function Why({ children }: { children: React.ReactNode }) {
  return (
    <div className="why">
      <div className="modal-label">Why it matters</div>
      <p>{children}</p>
    </div>
  );
}
