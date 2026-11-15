import { DATA } from '../data/model';
import icon from '../assets/cloudeagle-icon.png';
import Icon from './Icon';

// Light, compact page header. Title and company facts on the left;
// the CloudEagle.ai logo + name always sit in the top-right corner.
export default function PageHeader() {
  const tools = DATA.tools.length + DATA.shadowTools.length;
  return (
    <header className="page-head">
      <div className="ph-left">
        <div className="ph-title-row">
          <h1>AI Governance Dashboard</h1>
          <span className="ph-tag">Prototype · sample data</span>
        </div>
        <p className="ph-sub">Who uses which AI tools, what they cost, and whether we’re within budget.</p>
        <div className="ph-facts">
          <span className="ph-fact"><Icon name="person" size={16} /><strong>{DATA.employees.length.toLocaleString('en-US')}</strong> employees</span>
          <span className="ph-fact"><Icon name="chart" size={16} /><strong>{DATA.depts.length}</strong> departments</span>
          <span className="ph-fact"><Icon name="grid" size={16} /><strong>{tools}</strong> AI tools tracked</span>
        </div>
      </div>

      <div className="ph-brand">
        <img src={icon} alt="" width={32} height={32} />
        <span>CloudEagle.ai</span>
      </div>
    </header>
  );
}
