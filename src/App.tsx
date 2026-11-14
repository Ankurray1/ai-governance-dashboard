import { useMemo, useState } from 'react';
import { compute, DATA, DEFAULT_FILTERS, Filters, fmtDate } from './data/model';
import PageHeader from './components/PageHeader';
import KpiRow from './components/KpiRow';
import Budgets from './components/Budgets';
import ToolsTable from './components/ToolsTable';
import ShadowAI from './components/ShadowAI';
import DataAlerts from './components/DataAlerts';
import People from './components/People';

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const view = useMemo(() => compute(filters), [filters]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="shell">
      <main id="overview" className="main">
        <PageHeader />
        <KpiRow view={view} />
        <Budgets view={view} filters={filters} onDept={(dept) => update({ dept: filters.dept === dept ? -1 : dept })} />
        <div className="row">
          <ShadowAI view={view} />
          <DataAlerts view={view} />
        </div>
        <ToolsTable view={view} filters={filters} onTool={(tool) => update({ tool: filters.tool === tool ? -1 : tool })} />
        <footer className="footnote">
          <p>
            <strong>Where these numbers come from:</strong> AI vendors' bills and admin reports (spend, licences, last use) · the HR
            system (people, teams, who has left) · sign-in records and expense claims (unapproved tools) · approved AI tools'
            activity records (data alerts) · department budgets set by Finance.
          </p>
          <p>
            Prototype with sample data: {DATA.employees.length.toLocaleString('en-US')} employees,{' '}
            {DATA.employees.reduce((n, e) => n + e.seats.length, 0).toLocaleString('en-US')} AI licences,{' '}
            {DATA.employees.reduce((n, e) => n + e.shadow.length, 0)} unapproved sign-ups,{' '}
            {DATA.employees.reduce((n, e) => n + e.alerts.length, 0)} data alerts. Prices are estimates. Data as of {fmtDate(DATA.asOf)}.
          </p>
        </footer>
      </main>
    </div>
  );
}
