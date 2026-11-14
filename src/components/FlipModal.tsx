import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ApiSourceItem {
  name: string;
  category: 'Direct API' | 'SSO / Identity' | 'Expense / ERP' | 'Security / DLP' | 'Finance Planning';
  purpose: string;
  howItWorks: string;
  status: 'Ready (Standard API)' | 'Scheduled Sync' | 'Invoice Fallback';
}

interface FlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  accent: string;
  accentBg: string;
  title: string;
  eyebrow?: string;
  apiSources?: ApiSourceItem[];
  children: React.ReactNode;
}

export default function FlipModal({
  isOpen,
  onClose,
  accent,
  accentBg,
  title,
  eyebrow = 'About this metric',
  apiSources,
  children,
}: FlipModalProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'api'>('about');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('about'); // reset tab on open
    closeRef.current?.focus();
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fp-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fp-card"
        onClick={(e) => e.stopPropagation()}
        style={{ '--fp-accent': accent, '--fp-accent-bg': accentBg } as React.CSSProperties}
      >
        <div className="fp-bar" />
        
        {/* Header */}
        <div className="fp-head">
          <div>
            <span className="fp-eyebrow">{eyebrow}</span>
            <h3 className="fp-title">{title}</h3>
          </div>
          <button ref={closeRef} className="fp-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* ── iOS-style Slider Tab inside the modal ── */}
        {apiSources && apiSources.length > 0 && (
          <div className="fp-tab-slider-wrap">
            <div className="fp-tab-slider-track" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'about'}
                className={`fp-tab-btn ${activeTab === 'about' ? 'on' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                About Metric
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'api'}
                className={`fp-tab-btn ${activeTab === 'api' ? 'on' : ''}`}
                onClick={() => setActiveTab('api')}
              >
                Data Sources & APIs
                <span className="fp-api-badge">{apiSources.length}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: About Body */}
        {activeTab === 'about' && (
          <div className="fp-tab-content">
            {children}
          </div>
        )}

        {/* Tab 2: PM API & Data Source Plan */}
        {activeTab === 'api' && apiSources && (
          <div className="fp-tab-content fp-api-plan">
            <div className="fp-section-label" style={{ padding: '0 24px', marginBottom: 4 }}>
              PM Data Sourcing Architecture (Part 2)
            </div>
            <p className="fp-meaning" style={{ marginBottom: 12 }}>
              To compute these numbers honestly without guesswork, here are the real-world APIs and enterprise connectors we pull from:
            </p>

            <div className="fp-api-list">
              {apiSources.map((source) => (
                <div key={source.name} className="fp-api-card">
                  <div className="fp-api-card-top">
                    <div>
                      <strong className="fp-api-name">{source.name}</strong>
                      <span className="fp-api-cat">{source.category}</span>
                    </div>
                    <span className={`pill ${source.status.includes('Ready') ? 'ok' : source.status.includes('Scheduled') ? 'near' : 'neutral'}`}>
                      {source.status}
                    </span>
                  </div>
                  <div className="fp-api-purpose">
                    <strong>What we get:</strong> {source.purpose}
                  </div>
                  <div className="fp-api-how">
                    <strong>Integration path:</strong> {source.howItWorks}
                  </div>
                </div>
              ))}
            </div>

            <div className="fp-why" style={{ marginLeft: 24, marginTop: 12 }}>
              <div className="fp-section-label">Honest Data Gaps & Caveats</div>
              <p className="fp-meaning" style={{ fontSize: '12px' }}>
                • <strong>Personal accounts on personal phones/laptops</strong> cannot be inspected via APIs; treated as policy/training scope.<br />
                • <strong>Invoice lag:</strong> Vendor usage APIs update hourly to daily; tools without APIs (e.g. Midjourney) rely on finance billing upload.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
