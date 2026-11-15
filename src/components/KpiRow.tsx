import { useState } from 'react';
import { ADOPTION_TARGET, SHADOW_BENCHMARK, STATUS_LABEL, usd, View } from '../data/model';
import { FEATURES } from '../data/sources';
import { IconBadge } from './Icon';
import { plural } from '../data/csvImport';
import { DotGrid } from './InfoCard';
import FlipModal, { Formula, Why } from './FlipModal';

type Popup = null | 'spend' | 'adoption' | 'shadow' | 'alerts';

function InfoBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="info-btn" onClick={onClick} aria-label={`What is ${label}?`}>
      <span aria-hidden="true">i</span>
    </button>
  );
}

export default function KpiRow({ view }: { view: View }) {
  const [popup, setPopup] = useState<Popup>(null);
  const close = () => setPopup(null);
  const { kpi, budgetMode, facts } = view;
  const st = budgetMode ? kpi.status : 'ok';
  const fmt = (n: number) => n.toLocaleString('en-US');

  const usedPct = Math.round(kpi.usedPct);
  const usedW = budgetMode ? Math.min(kpi.usedPct, 100) : 100;
  const left = Math.max(kpi.budget - kpi.spent, 0);

  const adoptionPct = Math.round((facts.activePeople / Math.max(facts.staff, 1)) * 100);
  const shadowPct = (facts.shadowPeople / Math.max(facts.staff, 1)) * 100;
  const reviewed = facts.alertsTotal - facts.openAlerts;

  return (
    <>
      {/* ── Headline: this month's AI spend against the budget ── */}
      <section className="card hero" aria-label="AI spend this month vs budget">
        <div className="kpi-title">
          <span className="card-label"><IconBadge name="wallet" />AI spend this month vs budget</span>
          <span className="title-actions">
            <span className={`pill ${budgetMode ? st : 'neutral'}`}>{budgetMode ? STATUS_LABEL[st] : 'Budget n/a'}</span>
            <InfoBtn label="AI spend vs budget" onClick={() => setPopup('spend')} />
          </span>
        </div>

        <div className="hero-figures">
          <div>
            <span className="hero-num">{usd(kpi.spent)}</span>
            <span className="hero-of">{budgetMode ? `of ${usd(kpi.budget)} budget` : 'spent this month'}</span>
          </div>
          {budgetMode && <span className={`hero-pct ${st}`}>{usedPct}% used</span>}
        </div>

        <div className="stack-bar" role="img" aria-label={`${usedPct}% of the monthly budget used`}>
          <span className={`seg seat ${st}`} style={{ width: `${usedW}%` }} />
        </div>

        <div className="legend-row">
          <span><i className={`key seat ${st}`} />Spent on licences <strong>{usd(kpi.spent)}</strong></span>
          {budgetMode && <span><i className="key left" />Left this month <strong>{usd(left)}</strong></span>}
        </div>
      </section>

      {/* ── Three supporting numbers ── */}
      <section className="kpis-3" aria-label="Adoption, unapproved AI and data alerts">
        <div className="card kpi">
          <div className="kpi-title">
            <span className="card-label"><IconBadge name="users" />AI adoption</span>
            <InfoBtn label="AI adoption" onClick={() => setPopup('adoption')} />
          </div>
          <div><span className="big ok">{adoptionPct}%</span><span className="of">of employees use approved AI</span></div>
          <div className="meter">
            <span className="fill ok" style={{ width: `${adoptionPct}%` }} />
            <i className="target-tick" style={{ left: `${ADOPTION_TARGET}%` }} title={`Goal ${ADOPTION_TARGET}%`} />
          </div>
          <span className="caption">Goal {ADOPTION_TARGET}% · last 30 days</span>
        </div>

        <div className="card kpi">
          <div className="kpi-title">
            <span className="card-label"><IconBadge name="eyeOff" tone="orange" />Unapproved AI use</span>
            <InfoBtn label="unapproved AI use" onClick={() => setPopup('shadow')} />
          </div>
          <div><span className="big shadow-text">{shadowPct.toFixed(1)}%</span><span className="of">of employees, at least</span></div>
          <div className="meter">
            <span className="fill shadow" style={{ width: `${(shadowPct / 30) * 100}%` }} />
            <i className="target-tick" style={{ left: `${(SHADOW_BENCHMARK / 30) * 100}%` }} title={`${SHADOW_BENCHMARK}% is serious`} />
          </div>
          <span className="caption">{plural(facts.shadowPeople, 'person', 'people')} · over {SHADOW_BENCHMARK}% is serious</span>
        </div>

        <div className="card kpi">
          <div className="kpi-title">
            <span className="card-label"><IconBadge name="shield" tone="red" />Data alerts to review</span>
            <InfoBtn label="data alerts to review" onClick={() => setPopup('alerts')} />
          </div>
          <div><span className={`big ${facts.openAlerts ? 'bad' : 'ok'}`}>{facts.openAlerts}</span><span className="of">of {facts.alertsTotal} this month</span></div>
          <div className="meter">
            <span className="fill bad" style={{ width: `${(facts.openAlerts / Math.max(facts.alertsTotal, 1)) * 100}%` }} />
          </div>
          <span className="caption">{reviewed} already checked</span>
        </div>
      </section>

      {/* ── "i" pop-ups ── */}
      <FlipModal isOpen={popup === 'spend'} onClose={close} title="AI spend this month vs budget" data={FEATURES.spend}>
        <p className="modal-text">Everything the company spent on approved AI tools this month, against the monthly budget Finance set. All of it is licences: a fixed monthly price per person.</p>
        <Formula a={[usd(kpi.spent), 'spent so far']} op="÷" b={[usd(kpi.budget), 'monthly budget']} result={[`${usedPct}%`, 'used']} />
        <Why>If spend passes the budget, someone has to approve the extra cost or cut back before the bill arrives.</Why>
      </FlipModal>

      <FlipModal isOpen={popup === 'adoption'} onClose={close} title="AI adoption" data={FEATURES.adoption}>
        <p className="modal-text">How many employees actually used an approved AI tool in the last 30 days.</p>
        <Formula a={[fmt(facts.activePeople), 'used approved AI']} op="÷" b={[fmt(facts.staff), 'employees']} result={[`${adoptionPct}%`, 'adoption']} />
        <div className="modal-visual">
          <DotGrid pct={adoptionPct} tone="ok" markerPct={ADOPTION_TARGET} markerLabel={`Goal ${ADOPTION_TARGET}% (set by leadership)`} />
        </div>
        <Why>Low use means we pay for AI that isn’t helping anyone. Rising use is the first sign the money is well spent.</Why>
        <p className="modal-note">Tools that only send a bill (e.g. Midjourney) don’t say who uses them, so their users aren’t counted.</p>
      </FlipModal>

      <FlipModal isOpen={popup === 'shadow'} onClose={close} tone="orange" title="Unapproved AI use" data={FEATURES.shadowUse}>
        <p className="modal-text">How many employees we found using AI tools the company hasn’t approved (often called “Shadow AI”).</p>
        <Formula a={[fmt(facts.shadowPeople), 'using unapproved AI']} op="÷" b={[fmt(facts.staff), 'employees']} result={[`${shadowPct.toFixed(1)}%`, 'at least']} />
        <div className="modal-visual">
          <DotGrid pct={shadowPct} tone="shadow" markerPct={SHADOW_BENCHMARK} markerLabel={`${SHADOW_BENCHMARK}%: serious`} />
        </div>
        <Why>Company information may be going into tools we have no contract with and have never checked.</Why>
        <p className="modal-note">“At least”, because personal accounts on personal devices can’t be seen. Found across {facts.unapprovedFound} tools.</p>
      </FlipModal>

      <FlipModal isOpen={popup === 'alerts'} onClose={close} tone="red" title="Data alerts to review" data={FEATURES.alertsToReview}>
        <p className="modal-text">Times this month someone shared sensitive information with an approved AI tool, and nobody has checked it yet.</p>
        <Formula a={[fmt(facts.alertsTotal), 'alerts this month']} op="−" b={[fmt(reviewed), 'already checked']} result={[fmt(facts.openAlerts), 'to review']} />
        <Why>Each one could be a data leak or a breach of privacy rules. The goal is to check every alert quickly.</Why>
        <p className="modal-note">We only see this for approved tools, not what people type into unapproved ones.</p>
      </FlipModal>
    </>
  );
}
