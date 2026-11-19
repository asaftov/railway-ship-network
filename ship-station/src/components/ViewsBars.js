// Views on a channel's most recent long videos, oldest on the left. Real YouTube data.
// The dashed line is the median, which is what each fee is priced from.

const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function ViewsBars({ recent = [], median, color = "violet", height = 44, large = false }) {
  if (!recent.length) return null;
  const W = 240;
  const H = height;
  const top = large ? 16 : 4;
  const gap = 3;
  const n = recent.length;
  const bw = (W - gap * (n - 1)) / n;
  const max = Math.max(...recent.map((r) => r.v), median || 0);
  const y = (v) => top + (H - top) * (1 - v / max);
  const summary = `Views on the last ${n} long videos, from ${compact(Math.min(...recent.map((r) => r.v)))} to ${compact(
    Math.max(...recent.map((r) => r.v)),
  )}${median ? `. The median is ${compact(median)}.` : "."}`;
  return (
    <figure className={large ? "views-bars large" : "views-bars"}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={summary} style={{ height }}>
        {recent.map((r, i) => {
          const x = i * (bw + gap);
          const yy = y(r.v);
          return (
            <rect
              key={i}
              x={x}
              y={yy}
              width={bw}
              height={Math.max(1.5, H - yy)}
              rx={Math.min(3, bw / 3)}
              style={{ fill: `var(--${color}-${i === n - 1 ? 9 : 8})` }}
            >
              <title>{`${day(r.d)}: ${r.v.toLocaleString("en-US")} views`}</title>
            </rect>
          );
        })}
        {median ? <line x1="0" x2={W} y1={y(median)} y2={y(median)} className="views-median" vectorEffect="non-scaling-stroke" /> : null}
      </svg>
      {large ? (
        <figcaption>
          <span>{day(recent[0].d)}</span>
          <span>Median {compact(median)}</span>
          <span>{day(recent[n - 1].d)}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
