// Small line icons that sit beside card and section titles.
const PATHS: Record<string, string> = {
  wallet: 'M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14V9H5a2 2 0 0 1-2-2zm13 6h.01',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  eyeOff: 'M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.4 3M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a9 9 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zm0 6v4m0 3h.01',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  grid: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z',
  person: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  download: 'M12 4v11m0 0l-4-4m4 4l4-4M4 20h16',
  upload: 'M12 16V5m0 0l-4 4m4-4l4 4M4 20h16',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  piggy: 'M19 10c0-3.3-3.1-6-7-6S5 6.7 5 10c0 1.9 1 3.6 2.6 4.7L7 19h3l.5-2h3l.5 2h3l-.6-4.3A5.8 5.8 0 0 0 19 10zM9 9h.01M2 10a3 3 0 0 0 3 3',
};

export default function Icon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

// Round icon badge used at the start of a card/section title
export function IconBadge({ name, tone = 'blue' }: { name: string; tone?: 'blue' | 'orange' | 'red' }) {
  return <span className={`ico-badge ${tone}`}><Icon name={name} size={16} /></span>;
}
