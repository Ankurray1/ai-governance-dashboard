import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RawData } from '../data/model';
import { currentAsCsv, downloadText, importCsv, ImportResult, plural, RECORD_TYPES, templateCsv } from '../data/csvImport';
import Icon from './Icon';

// "Upload your data": download the template, fill it in, upload it. Checked before anything changes.
interface Props { onLoad: (data: RawData, fileName: string) => void }

export default function UploadData({ onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [drag, setDrag] = useState(false);
  const [guide, setGuide] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = () => { setOpen(false); setResult(null); setFile(''); setGuide(false); };

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  const read = (f: File | undefined) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) { setFile(f.name); setResult({ ok: false, errors: ['Please choose a .csv file. In Excel or Google Sheets use File → Download / Save as → CSV.'] }); return; }
    const reader = new FileReader();
    reader.onload = () => { setFile(f.name); setResult(importCsv(String(reader.result ?? ''))); };
    reader.readAsText(f);
  };

  const apply = () => {
    if (result?.ok && result.data) { onLoad(result.data, file); close(); }
  };

  return (
    <>
      <button type="button" className="btn btn-sm upload-btn" onClick={() => setOpen(true)}>
        <Icon name="upload" size={15} /> Upload your data
      </button>

      {open && createPortal(
        <div className="modal-backdrop" onClick={close}>
          <div className="modal upload-modal" role="dialog" aria-modal="true" aria-label="Use your own data" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-row">
                <div>
                  <span className="modal-eyebrow">Upload your data</span>
                  <h3 className="modal-title">See this dashboard with your own numbers</h3>
                </div>
                <button ref={closeRef} type="button" className="modal-close" onClick={close} aria-label="Close">×</button>
              </div>
            </div>

            <div className="modal-body">
              {/* Step 1 */}
              <div className="step">
                <span className="step-n">1</span>
                <div className="step-body">
                  <strong>Download the template</strong>
                  <span>One CSV file with example rows. Open it in Excel or Google Sheets.</span>
                  <div className="step-actions">
                    <button type="button" className="btn btn-sm" onClick={() => downloadText(templateCsv(), 'ai-governance-template.csv')}>
                      <Icon name="download" size={15} /> Template (.csv)
                    </button>
                    <button type="button" className="link-btn" onClick={() => downloadText(currentAsCsv(), 'ai-governance-current-data.csv')}>
                      or the data on screen now
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step">
                <span className="step-n">2</span>
                <div className="step-body">
                  <strong>Fill it in</strong>
                  <span>Keep the first row as it is. Each row is one record; the <code>record_type</code> column says what it is.</span>
                  <button type="button" className="link-btn left" onClick={() => setGuide(!guide)} aria-expanded={guide}>
                    {guide ? 'Hide' : 'Show'} what goes in each row
                  </button>
                  {guide && (
                    <ul className="guide-list">
                      {RECORD_TYPES.map((t) => (
                        <li key={t.type}>
                          <code>{t.type}</code>
                          <span>
                            {t.what}. <em>Needs:</em> {t.required.join(', ')}
                            {t.optional.length > 0 && <> · <em>optional:</em> {t.optional.join(', ')}</>}
                          </span>
                        </li>
                      ))}
                      <li className="guide-note">Dates look like 2026-11-18. For a licence, a blank date means never used, and “not reported” means the tool doesn’t tell us (e.g. Midjourney).</li>
                    </ul>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="step">
                <span className="step-n">3</span>
                <div className="step-body">
                  <strong>Upload it</strong>
                  <div
                    className={`drop ${drag ? 'over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); read(e.dataTransfer.files[0]); }}
                  >
                    <Icon name="upload" size={22} />
                    <span>Drag your CSV here, or</span>
                    <button type="button" className="btn btn-sm" onClick={() => input.current?.click()}>Choose file</button>
                    <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { read(e.target.files?.[0]); e.target.value = ''; }} />
                  </div>
                  <span className="privacy"><Icon name="shield" size={13} /> Your file stays in this browser. Nothing is sent to a server.</span>
                </div>
              </div>

              {/* Result */}
              {result && !result.ok && (
                <div className="result bad" role="alert">
                  <strong>{file}: fix {result.errors.length === 1 ? 'this' : `these ${result.errors.length >= 50 ? '50+' : result.errors.length}`} and upload again</strong>
                  <ul>{result.errors.slice(0, 8).map((e) => <li key={e}>{e}</li>)}</ul>
                  {result.errors.length > 8 && <span className="caption">…and {result.errors.length - 8} more.</span>}
                  <span className="caption">Nothing on the dashboard has changed.</span>
                </div>
              )}
              {result?.ok && result.summary && (
                <div className="result good" role="status">
                  <strong>{file} looks good</strong>
                  <span>
                    {plural(result.summary.departments, 'department', 'departments')} · {plural(result.summary.people, 'person', 'people')} ·{' '}
                    {plural(result.summary.licences, 'licence', 'licences')} · {plural(result.summary.unapproved, 'unapproved tool user', 'unapproved tool users')} ·{' '}
                    {plural(result.summary.alerts, 'alert', 'alerts')}
                  </span>
                  <button type="button" className="btn btn-primary" onClick={apply}>Show on dashboard</button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
