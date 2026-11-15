// 50-dot picture used inside the "i" pop-ups: each dot = 2% of employees.
export function DotGrid({ pct, tone, markerPct, markerLabel }: { pct: number; tone: string; markerPct?: number; markerLabel?: string }) {
  const filled = Math.round(pct / 2);
  const marker = markerPct !== undefined ? Math.round(markerPct / 2) : -1;
  return (
    <div className="dots-wrap">
      <div className="dots" role="img" aria-label={`${Math.round(pct)}% of employees`}>
        {Array.from({ length: 50 }, (_, i) => (
          <i key={i} className={`dot ${i < filled ? tone : ''} ${i === marker - 1 ? 'mark' : ''}`} />
        ))}
      </div>
      <div className="dots-legend">
        <span><i className={`dot ${tone}`} /> 1 dot = 2% of employees</span>
        {markerLabel && <span><i className="dot mark" /> {markerLabel}</span>}
      </div>
    </div>
  );
}
