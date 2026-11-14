import { useState } from 'react';
import { ADOPTION_TARGET, SHADOW_BENCHMARK, STATUS_LABEL, usd, View } from '../data/model';
import Icon, { IconBadge } from './Icon';
import { DotGrid } from './InfoCard';
import FlipModal, { ApiSourceItem } from './FlipModal';

interface Props { view: View }

/* ─── Popup content definition ─── */
interface PopupDef {
  tone: 'adopt' | 'shadow' | 'alert' | 'spend';
  title: string;
  meaning: string;
  formula?: { a: { val: string; label: string }; b: { val: string; label: string }; op: string; result: { val: string; label: string } };
  visual?: React.ReactNode;
  why: string;
  note?: string;
  apiSources: ApiSourceItem[];
}

function FlipPopup({ def, onClose }: { def: PopupDef; onClose: () => void }) {
  const accentMap = { adopt: 'var(--blue)', shadow: 'var(--orange)', alert: 'var(--red)', spend: 'var(--blue)' };
  const bgMap = { adopt: 'var(--blue-bg)', shadow: 'var(--orange-bg)', alert: 'var(--red-bg)', spend: 'var(--blue-bg)' };
  const accent = accentMap[def.tone];
  const accentBg = bgMap[def.tone];

  return (
    <FlipModal
      isOpen={true}
      onClose={onClose}
      accent={accent}
      accentBg={accentBg}
      title={def.title}
      eyebrow="About this metric"
      apiSources={def.apiSources}
    >
      {/* meaning */}
      <p className="fp-meaning">{def.meaning}</p>

      {/* formula if present */}
      {def.formula && (
        <>
          <div className="fp-section-label">How it's calculated</div>
          <div className="fp-formula">
            <div className="fp-box">
              <strong>{def.formula.a.val}</strong>
              <span>{def.formula.a.label}</span>
            </div>
            <span className="fp-op">{def.formula.op}</span>
            <div className="fp-box">
              <strong>{def.formula.b.val}</strong>
              <span>{def.formula.b.label}</span>
            </div>
            <span className="fp-op">=</span>
            <div className="fp-box fp-result">
              <strong>{def.formula.result.val}</strong>
              <span>{def.formula.result.label}</span>
            </div>
          </div>
        </>
      )}

      {/* visual */}
      {def.visual && <div className="fp-visual">{def.visual}</div>}

      {/* why */}
      <div className="fp-why">
        <div className="fp-section-label">Why it matters</div>
        <p className="fp-meaning">{def.why}</p>
      </div>

      {def.note && <p className="fp-note">{def.note}</p>}
    </FlipModal>
  );
}

/* ─── Main KpiRow ─── */
export default function KpiRow({ view }: Props) {
  const [popup, setPopup] = useState<null | 0 | 1 | 2 | 3>(null);
  const { kpi, budgetMode, facts } = view;
  const st = budgetMode ? kpi.status : 'ok';
  const fmt = (n: number) => n.toLocaleString('en-US');
  const adoptionPct = Math.round((facts.activePeople / Math.max(facts.staff, 1)) * 100);
  const shadowPct   = (facts.shadowPeople / Math.max(facts.staff, 1)) * 100;
  const reviewed    = facts.alertsTotal - facts.openAlerts;

  const usedPct = Math.round(kpi.usedPct);
  const usedBarWidth = Math.min(Math.max(kpi.usedPct, 0), 100);

  /* popup definitions */
  const popups: PopupDef[] = [
    // 0: Adoption
    {
      tone: 'adopt',
      title: 'AI adoption',
      meaning: 'How many of our employees actually used an approved AI tool in the last 30 days. It tells you whether the AI we pay for is really being used.',
      formula: {
        a: { val: fmt(facts.activePeople), label: 'used approved AI' },
        b: { val: fmt(facts.staff),        label: 'current employees' },
        op: '÷',
        result: { val: `${adoptionPct}%`, label: 'adoption' },
      },
      visual: <DotGrid pct={adoptionPct} tone="ok" markerPct={ADOPTION_TARGET} markerLabel={`Goal: ${ADOPTION_TARGET}% (set by leadership)`} />,
      why: 'Low use means we are paying for AI that is not helping anyone. Rising use is the earliest sign that the investment is paying off.',
      note: 'Some tools (e.g. Midjourney) only send a bill and don\'t report who uses them, so their users aren\'t counted here.',
      apiSources: [
        {
          name: 'OpenAI Admin API (/v1/organization/users)',
          category: 'Direct API',
          purpose: 'Tracks last login/activity date for ChatGPT Enterprise users.',
          howItWorks: 'Daily query to check who used their account in the last 30 days.',
          status: 'Ready (Standard API)',
        },
        {
          name: 'Microsoft Graph Copilot Usage Reports',
          category: 'Direct API',
          purpose: 'Reports Copilot active users across Word, Excel, Teams, and PowerPoint.',
          howItWorks: 'Daily aggregation from Microsoft 365 admin center via Graph API.',
          status: 'Ready (Standard API)',
        },
        {
          name: 'HR Information System (Workday / BambooHR)',
          category: 'SSO / Identity',
          purpose: 'Official employee headcount baseline (2,400 staff) to compute adoption % accurately.',
          howItWorks: 'Automated SCIM roster sync.',
          status: 'Scheduled Sync',
        },
      ],
    },
    // 1: Shadow AI
    {
      tone: 'shadow',
      title: 'Unapproved AI use',
      meaning: 'How many employees we found using AI tools the company has not approved. This is often called "Shadow AI", and it shows the size of our blind spot.',
      formula: {
        a: { val: fmt(facts.shadowPeople), label: 'using unapproved AI' },
        b: { val: fmt(facts.staff),        label: 'current employees' },
        op: '÷',
        result: { val: `${shadowPct.toFixed(1)}%`, label: 'at least' },
      },
      visual: <DotGrid pct={shadowPct} tone="shadow" markerPct={SHADOW_BENCHMARK} markerLabel={`${SHADOW_BENCHMARK}%: serious risk`} />,
      why: 'Company information may be going into tools we have no contract with and have never checked for security.',
      note: `Why "at least": nobody can see personal accounts on personal devices, so the real number may be higher. Found across ${facts.unapprovedFound} unapproved tools.`,
      apiSources: [
        {
          name: 'Okta / Microsoft Entra System Log API',
          category: 'SSO / Identity',
          purpose: 'Catches work email sign-ups on third-party AI sites.',
          howItWorks: 'Streams authentication and OAuth consent grant events.',
          status: 'Ready (Standard API)',
        },
        {
          name: 'Corporate Card / Expense Feeds (Brex, Ramp, Expensify)',
          category: 'Expense / ERP',
          purpose: 'Catches expensed AI tools paid on corporate or personal cards.',
          howItWorks: 'Webhook matching against AI merchant list.',
          status: 'Ready (Standard API)',
        },
      ],
    },
    // 2: Alerts
    {
      tone: 'alert',
      title: 'Data alerts to review',
      meaning: 'Times this month someone shared sensitive information with an approved AI tool, and nobody has checked it yet.',
      formula: {
        a: { val: fmt(facts.alertsTotal), label: 'alerts this month' },
        b: { val: fmt(reviewed),          label: 'already checked' },
        op: '−',
        result: { val: fmt(facts.openAlerts), label: 'still to review' },
      },
      visual: (
        <div className="fp-type-list">
          {facts.alertsByType.map(t => (
            <div key={t.type} className="fp-type-row">
              <span className="small">{t.type}</span>
              <div className="mini-meter" style={{ flex: 1 }}>
                <div className="fill bad" style={{ width: `${(t.count / Math.max(facts.alertsTotal, 1)) * 100}%` }} />
              </div>
              <strong className="small">{t.count}</strong>
            </div>
          ))}
        </div>
      ),
      why: 'Each one could be a data leak or a breach of privacy rules. The goal is zero waiting: every alert checked quickly.',
      note: 'We can only see this for approved tools. What people type into unapproved tools is not visible to us.',
      apiSources: [
        {
          name: 'Microsoft Purview / DLP Audit Stream',
          category: 'Security / DLP',
          purpose: 'Catches PII, credit cards, and credentials submitted into Copilot prompts.',
          howItWorks: 'Office 365 Management Activity API `DlpMatches`.',
          status: 'Ready (Standard API)',
        },
        {
          name: 'OpenAI Enterprise Security Audit Log',
          category: 'Direct API',
          purpose: 'Workspace compliance audit logs for ChatGPT Enterprise.',
          howItWorks: '`/v1/organization/audit_logs` polling.',
          status: 'Ready (Standard API)',
        },
      ],
    },
    // 3: Hero spend card
    {
      tone: 'spend',
      title: 'AI spend this month vs budget',
      meaning: 'Total company-wide monthly AI expenditure tracked across fixed seat commitments and variable pay-per-use consumption charges.',
      why: 'Allows the CFO and Finance leadership to monitor whether AI spend remains within approved fiscal limits and prevent month-end bill shock.',
      note: 'Budgets ($105,000 monthly total) and invoiced tools (e.g. Midjourney) are managed via manual configuration by Finance, so no complex ERP or invoice API is required.',
      apiSources: [
        {
          name: 'Vendor Billing APIs (OpenAI, Anthropic, Azure AI)',
          category: 'Direct API',
          purpose: 'Pulls current month-to-date charges, seat counts, and variable pay-per-use token billing.',
          howItWorks: 'Daily cost sync via vendor administrative billing endpoints.',
          status: 'Ready (Standard API)',
        },
        {
          name: 'Corporate Card & Expense Feeds (Ramp / Brex / Expensify)',
          category: 'Expense / ERP',
          purpose: 'Pulls expensed AI tool charges and subscription receipts directly into total spend.',
          howItWorks: 'Real-time transaction webhooks matched against AI merchant categories.',
          status: 'Ready (Standard API)',
        },
      ],
    },
  ];

  return (
    <>
      {/* ── Hero spend card: Visual-First, High Information-Density, Thin & Clean ── */}
      <section className="kpis" aria-label="Headline numbers">
        <div className="card kpi kpi-wide hero-spend-unified">
          {/* 1. Header with primary question, status, and "i" Info button */}
          <div className="hsu-head">
            <span className="card-label">
              <IconBadge name="wallet" />
              <span>AI spend this month vs budget</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`pill ${budgetMode ? st : 'neutral'}`}>
                {budgetMode ? STATUS_LABEL[st] : 'Budget n/a'}
              </span>
              <button
                type="button"
                className="info-btn"
                onClick={() => setPopup(3)}
                aria-label="About AI spend vs budget"
                title="About this metric & API sources"
              >
                <span aria-hidden="true">i</span>
              </button>
            </div>
          </div>

          {/* 2. Visual-First Anchor: Primary numbers alongside a full-width unified budget bar */}
          <div className="hsu-main">
            <div className="hsu-values-row">
              <div className="hsu-primary-val">
                <span className="hsu-amount">${Math.round(kpi.spent).toLocaleString('en-US')}</span>
                <span className="hsu-limit-label">
                  {budgetMode ? `of ${usd(kpi.budget)} budget` : 'total spend'}
                </span>
              </div>
              {budgetMode && (
                <div className="hsu-consumption-badge">
                  <strong className={`hsu-pct ${st}`}>{usedPct}%</strong>
                  <span className="muted small">consumed</span>
                </div>
              )}
            </div>

            {/* Full-width elegant progress bar (matching AI adoption design) */}
            {budgetMode && (
              <div className="hsu-bar-container">
                <div className="mini-meter target-meter hsu-meter">
                  <div className={`fill ${st}`} style={{ width: `${usedBarWidth}%` }} />
                  <i className="target-tick" style={{ left: '100%' }} title="Budget Limit (100%)" />
                </div>
              </div>
            )}
          </div>

          {/* 3. Supporting Contextual Data Pointers (Thin, minimal, readable) */}
          <div className="hsu-breakdown-row">
            <div className="hsu-breakdown-item">
              <span className="hsu-dot licences" />
              <span className="muted small">Licences:</span>
              <strong>{usd(kpi.seatPart)}</strong>
            </div>
            <div className="hsu-breakdown-item">
              <span className="hsu-dot usage" />
              <span className="muted small">Pay-per-use:</span>
              <strong>{usd(kpi.usagePart)}</strong>
            </div>
            {budgetMode && (
              <div className="hsu-breakdown-item highlight">
                <span className="hsu-dot remaining" />
                <span className="muted small">Remaining:</span>
                <strong className={kpi.budget - kpi.spent < 10000 ? 'warn' : 'ok'}>
                  {usd(Math.max(kpi.budget - kpi.spent, 0))}
                </strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Three KPI cards ── */}
      <section className="kpis-3" aria-label="Adoption, unapproved AI and data incidents">

        {/* Card 1 – AI adoption */}
        <div className="card kpi kpi-adopt">
          <div className="kpi-title">
            <span className="card-label"><IconBadge name="users" />AI adoption</span>
            <button className="info-btn" onClick={() => setPopup(0)} aria-label="About AI adoption" title="About AI adoption & API sources">
              <span aria-hidden="true">i</span>
            </button>
          </div>
          <div>
            <span className="big ok">{adoptionPct}%</span>
            <span className="of">of employees use approved AI</span>
          </div>
          <div className="mini-meter target-meter">
            <div className="fill ok" style={{ width: `${adoptionPct}%` }} />
            <i className="target-tick" style={{ left: `${ADOPTION_TARGET}%` }} />
          </div>
          <span className="small">Goal: {ADOPTION_TARGET}% · based on the last 30 days</span>
        </div>

        {/* Card 2 – Unapproved AI */}
        <div className="card kpi kpi-shadow">
          <div className="kpi-title">
            <span className="card-label"><IconBadge name="eyeOff" />Unapproved AI use</span>
            <button className="info-btn" onClick={() => setPopup(1)} aria-label="About unapproved AI" title="About unapproved AI & API sources">
              <span aria-hidden="true">i</span>
            </button>
          </div>
          <div>
            <span className="big shadow-text">{shadowPct.toFixed(1)}%</span>
            <span className="of">of employees</span>
          </div>
          <div className="mini-meter target-meter">
            <div className="fill shadow" style={{ width: `${(shadowPct / 30) * 100}%` }} />
            <i className="target-tick" style={{ left: `${(SHADOW_BENCHMARK / 30) * 100}%` }} />
          </div>
          <span className="small">At least {facts.shadowPeople} people · over {SHADOW_BENCHMARK}% is serious</span>
        </div>

        {/* Card 3 – Data alerts */}
        <div className="card kpi kpi-alert">
          <div className="kpi-title">
            <span className="card-label"><IconBadge name="shield" />Data alerts to review</span>
            <button className="info-btn" onClick={() => setPopup(2)} aria-label="About data alerts" title="About data alerts & API sources">
              <span aria-hidden="true">i</span>
            </button>
          </div>
          <span className={`big ${facts.openAlerts ? 'bad' : 'ok'}`}>{facts.openAlerts}</span>
          <div className="mini-meter split">
            <div className="fill bad"       style={{ width: `${(facts.openAlerts / Math.max(facts.alertsTotal, 1)) * 100}%` }} />
            <div className="fill muted-fill" style={{ width: `${(reviewed / Math.max(facts.alertsTotal, 1)) * 100}%` }} />
          </div>
          <span className="small">of {facts.alertsTotal} this month need checking</span>
        </div>

      </section>

      {/* ── Flip popup ── */}
      {popup !== null && (
        <FlipPopup def={popups[popup]} onClose={() => setPopup(null)} />
      )}
    </>
  );
}
