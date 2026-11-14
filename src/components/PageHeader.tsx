import { DATA } from '../data/model';
import icon from '../assets/cloudeagle-icon.png';

// Page title + company identity. No filters: this one screen is for one viewer (the executive), company-wide.
export default function PageHeader() {
  const employees = DATA.employees.length.toLocaleString('en-US');
  const departments = DATA.depts.length;
  return (
    <header className="topbar">
      <div>
        <h1><strong>AI Governance</strong><br />Dashboard</h1>
        <p className="muted">
          {employees} employees · {departments} departments
        </p>
      </div>
      <div className="company">
        <img src={icon} alt="" className="company-icon" width={36} height={36} />
        <span className="company-name">CloudEagle.ai</span>
      </div>
    </header>
  );
}
