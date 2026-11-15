import { useMemo, useState } from 'react';
import { compute, DATA, DEFAULT_FILTERS, Filters, fmtDate, loadDataset, RawData, SAMPLE, SOURCE } from './data/model';
import PageHeader from './components/PageHeader';
import KpiRow from './components/KpiRow';
import Budgets from './components/Budgets';
import ToolsTable from './components/ToolsTable';
import ShadowAI from './components/ShadowAI';
import DataAlerts from './components/DataAlerts';
import { plural } from './data/csvImport';

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [version, setVersion] = useState(0); // bumps when a new dataset is loaded
  const view = useMemo(() => compute(filters), [filters, version]);
  const showData = (data: RawData, source: { kind: 'sample' | 'file'; name: string }) => {
    loadDataset(data, source);
    setFilters(DEFAULT_FILTERS);
    setVersion((v) => v + 1);
    window.scrollTo({ top: 0 });
  };
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const focused = filters.dept >= 0 || filters.tool >= 0;

  return (
    <div className="shell">
      <main id="overview" className="main" key={version}>
        <PageHeader onLoad={(d, name) => showData(d, { kind: 'file', name })} onReset={() => showData(SAMPLE, { kind: 'sample', name: 'Sample data' })} />
        {focused && (
          <div className="focus-bar" role="status">
            Showing <strong>{view.scopeName}</strong>
            {filters.tool >= 0 && <> · {DATA.tools[filters.tool].name} licence holders</>}
            <button type="button" className="btn btn-sm" onClick={() => update({ dept: -1, tool: -1 })}>Show whole company</button>
          </div>
        )}
        <KpiRow view={view} />
        <Budgets view={view} filters={filters} onDept={(dept) => update({ dept: filters.dept === dept ? -1 : dept })} />
        <div className="row">
          <ShadowAI view={view} />
          <DataAlerts view={view} />
        </div>
        <ToolsTable view={view} filters={filters} onTool={(tool) => update({ tool: filters.tool === tool ? -1 : tool })} />
        <footer className="footnote">
          <p>
            <strong>Where the numbers come from:</strong> AI vendors’ admin &amp; billing APIs and invoices · HR system · company
            sign-in system · expense claims · company data-protection tool · budgets set by Finance. Tap any “i” for details.
          </p>
          <p>
            {SOURCE.kind === 'file' ? `Showing your file “${SOURCE.name}”:` : 'Prototype with sample data:'} {plural(DATA.employees.length, 'employee', 'employees')},{' '}
            {plural(DATA.employees.reduce((n, e) => n + e.seats.length, 0), 'AI licence', 'AI licences')},{' '}
            {plural(DATA.employees.reduce((n, e) => n + e.shadow.length, 0), 'unapproved sign-up', 'unapproved sign-ups')},{' '}
            {plural(DATA.employees.reduce((n, e) => n + e.alerts.length, 0), 'data alert', 'data alerts')}.{SOURCE.kind === 'sample' && ' Prices are estimates.'} Data as of {fmtDate(DATA.asOf)}.
          </p>
        </footer>
      </main>
    </div>
  );
}
