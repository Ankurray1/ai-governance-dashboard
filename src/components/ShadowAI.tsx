import { useRef, useState } from 'react';
import { View } from '../data/model';
import Icon from './Icon';
import FlipModal, { ApiSourceItem } from './FlipModal';

const CATS = ['All', 'Text', 'Voice', 'Image', 'Video'] as const;
type Cat = typeof CATS[number];

const SHADOW_API_SOURCES: ApiSourceItem[] = [
  {
    name: 'Identity Provider (IdP) Audit Logs',
    category: 'SSO / Identity',
    purpose: 'Discovers employees creating accounts or logging into unsanctioned AI tools using their corporate work email (@company.com).',
    howItWorks: 'Stream real-time authentication events via Okta System Log API / Microsoft Entra ID Audit Logs / Google Workspace Reports API.',
    status: 'Ready (Standard API)',
  },
  {
    name: 'Corporate Card & Expense Feeds',
    category: 'Expense / ERP',
    purpose: 'Detects expensed AI tools or individual subscription receipts (e.g. personal Claude Pro, Midjourney, Suno, Runway).',
    howItWorks: 'Webhook integrations with Brex / Ramp API / Expensify / Concur ERP connectors to flag AI merchant categories.',
    status: 'Ready (Standard API)',
  },
  {
    name: 'OAuth Calendar & App Grant Permissions',
    category: 'SSO / Identity',
    purpose: 'Catches meeting note-taker AI bots (e.g. Fireflies.ai, Otter.ai) granted read access to corporate calendars.',
    howItWorks: 'Query Google Workspace Third-Party App Access API / Microsoft Graph `oauth2PermissionGrants`.',
    status: 'Ready (Standard API)',
  },
];

export default function ShadowAI({ view }: { view: View }) {
  const [cat, setCat]     = useState<Cat>('All');
  const [popup, setPopup] = useState(false);
  const scrollRef         = useRef<HTMLDivElement>(null);
  const { shadowRows, shadowPeople, scopeName } = view;

  const filtered = cat === 'All' ? shadowRows : shadowRows.filter(r => r.cat === cat);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="shadow" className="card section grow-3" aria-label="Unapproved AI Tool">

      {/* ── Header: 4 elements on a single clean row: Icon + Title + Slider + Info ── */}
      <div className="section-head shadow-single-header">
        {/* 1 & 2: Icon and Text */}
        <div className="shadow-title-group">
          <span className="ico-badge shadow-red-badge" aria-hidden="true">
            <Icon name="eyeOff" />
          </span>
          <h2 className="sec-title shadow-title-text">
            <span>Unapproved AI Tool</span>
            {scopeName !== 'Whole company' && (
              <span className="muted" style={{ fontWeight: 400, fontSize: '13px' }}> · {scopeName}</span>
            )}
          </h2>
        </div>

        {/* 3: Slider of all tags on the same line */}
        <div className="ios-slider-wrapper inline-slider">
          <div className="ios-slider-track" role="tablist" aria-label="Filter unapproved AI by type">
            {CATS.map(c => {
              const on = cat === c;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={on}
                  className={`ios-slider-tab${on ? ' on' : ''}`}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4: Info button on the extreme right */}
        <button
          className="info-btn shadow-header-info"
          onClick={() => setPopup(true)}
          aria-label="What is this data?"
          title="About unapproved AI tools & data sources"
        >
          <span aria-hidden="true">i</span>
        </button>
      </div>

      {/* ── Single line horizontal carousel with Left/Right navigation arrows ── */}
      <div className="shadow-carousel-container">
        <button
          type="button"
          className="shadow-carousel-btn left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          title="Scroll left"
        >
          ‹
        </button>

        <div className="shadow-carousel-track" ref={scrollRef}>
          {filtered.length === 0 ? (
            <p className="muted" style={{ padding: '24px 16px', margin: 0 }}>
              No {cat.toLowerCase()} tools found in this selection.
            </p>
          ) : (
            filtered.map(r => (
              <div key={r.name} className="shadow-tool-card single-row-card">
                {/* top row */}
                <div className="stc-top">
                  <div className="stc-name-wrap">
                    <span className="stc-name">{r.name}</span>
                    <span className="stc-type-pill">{r.cat}</span>
                  </div>
                  <span className="stc-people">{r.people}<small> people</small></span>
                </div>

                {/* how found */}
                <div className="stc-found">
                  <span className="stc-found-label">Found via</span>
                  <span className="stc-found-val">{r.found}</span>
                </div>

                {/* alternative */}
                {r.alt && r.alt !== 'None approved yet' ? (
                  <div className="stc-alt">
                    <span className="stc-alt-label">Use instead</span>
                    <span className="stc-alt-val">{r.alt}</span>
                  </div>
                ) : (
                  <div className="stc-alt">
                    <span className="stc-alt-none">No approved alternative yet</span>
                  </div>
                )}

                {/* accent bar at bottom */}
                <div className="stc-bar" />
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          className="shadow-carousel-btn right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          title="Scroll right"
        >
          ›
        </button>
      </div>

      {/* ── Footer summary ── */}
      <p className="small" style={{ color: 'var(--muted)', marginTop: 2 }}>
        {shadowRows.length} unapproved tools · at least {shadowPeople} people
        {cat !== 'All' && ` · showing ${filtered.length} ${cat.toLowerCase()} tool${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {/* ── FlipModal mounted at document.body via Portal with in-modal slider ── */}
      <FlipModal
        isOpen={popup}
        onClose={() => setPopup(false)}
        accent="var(--red)"
        accentBg="var(--red-bg)"
        title="Unapproved AI Tool"
        eyebrow="About this data"
        apiSources={SHADOW_API_SOURCES}
      >
        <p className="fp-meaning">
          These are AI tools employees are using that the company has <strong>not approved</strong>. We call this "Shadow AI" — it's a blind spot because company data may be going into tools we've never security-checked.
        </p>
        <div className="fp-section-label">How we find them</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 24px' }}>
          {[
            ['Work-email sign-up', 'An employee used their @company.com address to register on an external AI platform.'],
            ['Work calendar connected', 'The tool was granted access to the employee\'s Google or Outlook calendar.'],
            ['Expense claim', 'A subscription appeared on a company card or personal expense report.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel)', borderRadius: 14, padding: '10px 14px' }}>
              <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{title}</strong>
              <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
        <div className="fp-why" style={{ marginLeft: 24 }}>
          <div className="fp-section-label">Why it matters</div>
          <p className="fp-meaning">
            This is a minimum count. Personal accounts on personal devices are invisible to us — the real number is likely higher. Each unapproved tool is a potential data-leak or compliance risk.
          </p>
        </div>
      </FlipModal>
    </section>
  );
}
