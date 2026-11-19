// The hero illustration: a rail line running into hills at dusk, with three signal lights for the three waves.
// Drawn by hand for Ship Station. Colors come from CSS variables so it works in light and dark.

// Fixed star positions so the server and the browser draw the same picture.
const STARS = [
  [22, 30, 1.1], [61, 72, 0.8], [96, 18, 1.3], [131, 54, 0.7], [170, 26, 1], [206, 88, 0.8], [238, 40, 1.2],
  [281, 14, 0.9], [318, 62, 0.7], [352, 30, 1.1], [395, 76, 0.8], [418, 22, 1], [44, 112, 0.7], [152, 120, 0.9],
  [372, 118, 0.8], [261, 104, 0.6], [12, 80, 0.9], [404, 140, 0.7], [118, 92, 0.6], [330, 96, 0.9],
];

// Sleepers get closer together toward the horizon. t runs from 0 at the front to 1 at the horizon.
const SLEEPERS = Array.from({ length: 16 }, (_, i) => 1 - Math.pow(0.82, i + 1));

const VP = { x: 262, y: 206 }; // where the rails meet the horizon
const NEAR_L = 128;
const NEAR_R = 330;
const BASE = 320;

const lerp = (a, b, t) => a + (b - a) * t;

export default function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 440 320" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="ha-moon" cx="40%" cy="38%" r="70%">
          <stop offset="0%" className="ha-moon-a" />
          <stop offset="100%" className="ha-moon-b" />
        </radialGradient>
        <linearGradient id="ha-rail" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" className="ha-rail-a" />
          <stop offset="100%" className="ha-rail-b" />
        </linearGradient>
        <filter id="ha-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} className="ha-star" style={{ opacity: 0.35 + ((i * 37) % 60) / 100 }} />
      ))}

      <circle cx="338" cy="70" r="34" fill="url(#ha-moon)" />
      <circle cx="338" cy="70" r="46" className="ha-halo" />

      <path className="ha-hill-3" d="M0 214 C 50 186 92 178 140 196 C 182 210 214 168 262 170 C 318 172 352 196 440 182 L440 320 L0 320 Z" />
      <path className="ha-hill-2" d="M0 236 C 44 214 104 210 150 222 C 196 234 230 206 262 206 C 300 206 340 224 384 214 C 410 208 428 210 440 212 L440 320 L0 320 Z" />
      <path className="ha-ground" d="M0 250 C 80 238 170 222 262 206 C 330 220 390 236 440 246 L440 320 L0 320 Z" />

      {SLEEPERS.map((t, i) => {
        const yy = lerp(BASE, VP.y, t);
        const half = lerp((NEAR_R - NEAR_L) / 2 + 26, 4, t);
        const cx = lerp((NEAR_L + NEAR_R) / 2, VP.x, t);
        return <line key={i} x1={cx - half} x2={cx + half} y1={yy} y2={yy} className="ha-sleeper" style={{ strokeWidth: lerp(5, 0.8, t) }} />;
      })}
      <path d={`M${NEAR_L} ${BASE} L${VP.x - 1.5} ${VP.y}`} className="ha-rail" />
      <path d={`M${NEAR_R} ${BASE} L${VP.x + 1.5} ${VP.y}`} className="ha-rail" />

      {[
        { t: 0.22, side: 1, color: "violet" },
        { t: 0.5, side: 1, color: "cyan" },
        { t: 0.72, side: 1, color: "amber" },
      ].map(({ t, color }, i) => {
        const x = lerp(NEAR_R + 30, VP.x + 10, t);
        const yb = lerp(BASE, VP.y, t);
        const h = lerp(70, 12, t);
        const r = lerp(5.5, 1.6, t);
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yb} y2={yb - h} className="ha-post" style={{ strokeWidth: lerp(3, 0.8, t) }} />
            <circle cx={x} cy={yb - h} r={r * 2.6} style={{ fill: `var(--${color}-9)`, opacity: 0.55 }} filter="url(#ha-glow)" />
            <circle cx={x} cy={yb - h} r={r} style={{ fill: `var(--${color}-9)` }} />
          </g>
        );
      })}

      <circle cx={VP.x} cy={VP.y - 2} r="7" className="ha-headlight-glow" filter="url(#ha-glow)" />
      <circle cx={VP.x} cy={VP.y - 2} r="2" className="ha-headlight" />
    </svg>
  );
}
