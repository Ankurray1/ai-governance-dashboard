import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LIMITS, Source } from '../data/sources';

// The "i" pop-up: what this shows, how it's worked out, where the data comes from,
// and what we can't see. One short scroll, no tabs.

export type Tone = 'blue' | 'orange' | 'red';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tone?: Tone;
  title: string;
  eyebrow?: string;
  sources: Source[];
  children: React.ReactNode;
}

export default function FlipModal({ isOpen, onClose, tone = 'blue', title, eyebrow = 'About this metric', sources, children }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
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
          <div>
            <span className="modal-eyebrow">{eyebrow}</span>
            <h3 className="modal-title">{title}</h3>
          </div>
          <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {children}

          <div className="modal-label">Where the data comes from</div>
          <ul className="src-list">
            {sources.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong>
                <span>{s.gives}</span>
              </li>
            ))}
          </ul>

          <div className="modal-label">What we can’t see</div>
          <ul className="limits">
            {LIMITS.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Small building blocks used inside the pop-ups
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
