/** Van silhouettes scaled with the floor surface: the picker shows "which truck" at a glance. */
export function TruckIcon({ size, className = "", color = "currentColor" }: { size: 1 | 2 | 3 | 4; className?: string; color?: string }) {
  // Cargo box length grows with the size; cab stays the same.
  const box = [0, 34, 48, 62, 78][size];
  const h = [0, 26, 30, 36, 42][size];
  const w = box + 40;
  const y = 50 - h;
  return (
    <svg viewBox={`0 0 ${w + 4} 56`} className={className} aria-hidden="true" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2" y={y} width={box} height={h} rx="3" fill={color} fillOpacity="0.12" />
      <path d={`M${2 + box} ${y + 10} h18 l14 12 v12 h-32 z`} fill={color} fillOpacity="0.12" />
      <path d={`M${2 + box + 4} ${y + 13} h12 l9 8 h-21 z`} fill="#fff" fillOpacity="0.9" />
      <line x1="2" y1="50" x2={w} y2="50" />
      <circle cx={Math.max(16, box * 0.22)} cy="50" r="5.5" fill="#fff" />
      <circle cx={box + 24} cy="50" r="5.5" fill="#fff" />
    </svg>
  );
}
