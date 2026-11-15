import { DATA, RawData, SOURCE } from '../data/model';
import icon from '../assets/cloudeagle-icon.png';
import Icon from './Icon';
import UploadData from './UploadData';

// Light, compact page header. Title and company facts on the left;
// the CloudEagle.ai logo + name always sit in the top-right corner, with "Upload your data" beside it.
interface Props { onLoad: (data: RawData, fileName: string) => void; onReset: () => void }

export default function PageHeader({ onLoad, onReset }: Props) {
  const tools = DATA.tools.length + DATA.shadowTools.length;
  const mine = SOURCE.kind === 'file';
  return (
    <header className="page-head">
      <div className="ph-left">
        <div className="ph-title-row">
          <h1>AI Governance Dashboard</h1>
          {mine ? (
            <span className="ph-tag mine">
              Your data · {SOURCE.name}
              <button type="button" className="ph-tag-btn" onClick={onReset}>Back to sample</button>
            </span>
          ) : (
            <span className="ph-tag">Prototype · sample data</span>
          )}
        </div>
        <p className="ph-sub">Who uses which AI tools, what they cost, and whether we’re within budget.</p>
        <div className="ph-facts">
          <span className="ph-fact"><Icon name="person" size={16} /><strong>{DATA.employees.length.toLocaleString('en-US')}</strong> employees</span>
          <span className="ph-fact"><Icon name="chart" size={16} /><strong>{DATA.depts.length}</strong> departments</span>
          <span className="ph-fact"><Icon name="grid" size={16} /><strong>{tools}</strong> AI tools tracked</span>
        </div>
      </div>

      <div className="ph-right">
        <div className="ph-brand">
          <img src={icon} alt="" width={32} height={32} />
          <span>CloudEagle.ai</span>
        </div>
        <UploadData onLoad={onLoad} />
      </div>
    </header>
  );
}
