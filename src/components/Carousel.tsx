import { ReactNode, useEffect, useRef, useState } from 'react';

// One-row slider: whole cards only, arrows outside the cards, "Showing 1–3 of 7".
export default function Carousel({ count, noun, perView = 4, children }: { count: number; noun: string; perView?: number; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false, first: 1, last: 1 });

  const measure = () => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : 1;
    const first = Math.round(el.scrollLeft / step) + 1;
    const fit = Math.max(1, Math.round((el.clientWidth + 12) / step));
    setEdge({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      first: Math.min(first, count),
      last: Math.min(first + fit - 1, count),
    });
  };
  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [count]);

  const slide = (dir: number) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + 12), behavior: 'smooth' });
  };

  return (
    <div className="carousel-wrap">
      <div className="carousel">
        <button type="button" className="car-arrow" aria-label={`Previous ${noun}`} disabled={!edge.left} onClick={() => slide(-1)}>‹</button>
        <div className={`car-track per-${perView}`} ref={track} onScroll={measure}>{children}</div>
        <button type="button" className="car-arrow" aria-label={`Next ${noun}`} disabled={!edge.right} onClick={() => slide(1)}>›</button>
      </div>
      {count > 0 && <p className="car-count" aria-live="polite">Showing {edge.first}–{edge.last} of {count} {noun}s</p>}
    </div>
  );
}
