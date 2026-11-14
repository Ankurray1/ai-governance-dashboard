import { useMemo, useState } from 'react';
import Icon, { IconBadge } from './Icon';
import { DATA, Employee, Flag, FLAG_LABEL, peopleCsv, peopleFor, usd } from '../data/model';

// People, kept short on purpose: pick a group, see the top 5, download the full list as a CSV.
// In the live product the server builds the file, so the dashboard never loads thousands of rows.

const FLAGS: Flag[] = ['all', 'unused', 'leaver', 'shadow', 'alert', 'none'];
const PREVIEW = 5;

interface Props { tool: number; onClearTool: () => void }

function flagPill(e: Employee) {
  if (e.isLeaver) return <span className="pill over">Left, still has licence</span>;
  if (e.alerts.length) return <span className="pill over">Data alert</span>;
  if (e.shadow.length) return <span className="pill shadow">Unapproved AI</span>;
  if (e.hasUnused) return <span className="pill near">Unused licence</span>;
  return null;
}

export default function People({ tool, onClearTool }: Props) {
  const [flag, setFlag] = useState<Flag>('unused');
  const [dept, setDept] = useState(-1);

  const counts = useMemo(() => Object.fromEntries(FLAGS.map((f) => [f, peopleFor(f, dept, tool).length])) as Record<Flag, number>, [dept, tool]);
  const list = useMemo(() => peopleFor(flag, dept, tool), [flag, dept, tool]);

  const download = () => {
    const blob = new Blob(['﻿' + peopleCsv(list)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const parts = ['people', FLAG_LABEL[flag], dept >= 0 ? DATA.depts[dept].name : 'all-departments', tool >= 0 ? DATA.tools[tool].name : ''];
    a.href = url;
    a.download = parts.filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="people" className="card section" aria-label="People">
      <div className="section-head wrap">
        <div>
          <h2 className="sec-title"><IconBadge name="person" />People</h2>
          <p className="muted">Choose a group, check the top {PREVIEW}, then download the full list to open in Excel.</p>
        </div>
        <label className="field">
          <span>Department</span>
          <select value={dept} onChange={(e) => setDept(+e.target.value)}>
            <option value={-1}>All departments</option>
            {DATA.depts.map((d, i) => <option key={d.name} value={i}>{d.name}</option>)}
          </select>
        </label>
      </div>

      <div className="seg-group" role="radiogroup" aria-label="Which people">
        {FLAGS.map((f) => (
          <button key={f} type="button" role="radio" aria-checked={flag === f} className={`seg-btn ${flag === f ? 'on' : ''}`} onClick={() => setFlag(f)}>
            {FLAG_LABEL[f]} <span className="seg-count">{counts[f].toLocaleString('en-US')}</span>
          </button>
        ))}
      </div>

      {tool >= 0 && (
        <div className="banner">
          Only people with a <strong>{DATA.tools[tool].name}</strong> licence
          <button type="button" className="btn small-btn" onClick={onClearTool}>Clear</button>
        </div>
      )}

      <div className="people-preview">
        <div className="preview-label">Top {Math.min(PREVIEW, list.length)} by monthly AI cost</div>
        {list.length === 0 && <p className="muted">No one matches this selection.</p>}
        <ul className="preview-list">
          {list.slice(0, PREVIEW).map((e) => (
            <li key={e.id} className="preview-row">
              <span className="preview-who">
                <strong>{e.name}</strong>
                <span className="muted">{e.title} · {DATA.depts[e.dept].name}</span>
              </span>
              <span className="preview-flag">{flagPill(e)}</span>
              <strong className="preview-cost">{e.cost ? `${usd(e.cost)}/mo` : '—'}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="export-bar">
        <span className="muted small">
          {list.length > PREVIEW ? `+ ${(list.length - PREVIEW).toLocaleString('en-US')} more in the file · ` : ''}
          Includes each person's team, AI tools, monthly cost, last use and any issues.
        </span>
        <button type="button" className="btn btn-primary" onClick={download} disabled={!list.length}>
          <Icon name="download" /> Download list · {list.length.toLocaleString('en-US')} people (CSV)
        </button>
      </div>
    </section>
  );
}
