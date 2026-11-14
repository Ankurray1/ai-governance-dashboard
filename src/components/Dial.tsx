// Circular tick dial (270° sweep). Ticks up to `pct` are lit; the rest are faint.
export default function Dial({ pct, label, size = 168 }: { pct: number; label: string; size?: number }) {
  const TICKS = 54;
  const lit = Math.round((Math.min(pct, 100) / 100) * TICKS);
  const c = size / 2;
  const r1 = c - 6, r2 = c - 18;
  const start = 135; // degrees, measured clockwise from +x
  return (
    <div className="dial" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(pct)}% ${label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => {
          const a = ((start + (270 * i) / (TICKS - 1)) * Math.PI) / 180;
          const long = i % 9 === 0;
          const rr = long ? r2 - 4 : r2;
          return (
            <line
              key={i}
              x1={c + r1 * Math.cos(a)} y1={c + r1 * Math.sin(a)}
              x2={c + rr * Math.cos(a)} y2={c + rr * Math.sin(a)}
              className={i < lit ? 'tick on' : 'tick'}
              strokeWidth={long ? 2.4 : 1.8}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="dial-center">
        <span className="dial-num">{Math.round(pct)}<small>%</small></span>
        <span className="dial-label">{label}</span>
      </div>
    </div>
  );
}
