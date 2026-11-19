import { FUNNEL, LOOPS } from "@/lib/campaign";

/*
  The campaign's growth model in one figure.
  Top row: the funnel from video views to activated signups, with the ten-week forecast in each stage.
  Below it: the loops that feed new active users back into earlier stages. The agent and revenue loops
  are dashed because they depend on things outside the campaign. On phones the figure turns into a numbered list.
*/

const W = 184; // stage width
const GAP = 36;
const H = 112; // stage height
const x = (i) => i * (W + GAP);
const cx = (i) => x(i) + W / 2;

// A loop leaves the bottom of one stage, runs under the row and comes back up into an earlier stage.
function under(fromX, toX, depth) {
  const r = 14;
  const y0 = H;
  return `M${fromX},${y0} V${depth - r} Q${fromX},${depth} ${fromX - r},${depth} H${toX + r} Q${toX},${depth} ${toX},${depth - r} V${y0 + 10}`;
}
// The agent loop runs over the top of the row.
function over(fromX, toX, height) {
  const r = 14;
  return `M${fromX},0 V${height + r} Q${fromX},${height} ${fromX - r},${height} H${toX + r} Q${toX},${height} ${toX},${height + r} V-10`;
}

export default function GrowthModel() {
  const loopPaths = {
    fork: { d: under(cx(3) - 20, cx(1), 158), label: { x: (cx(1) + cx(3)) / 2, y: 143 } },
    bounty: { d: under(cx(4) - 20, cx(0) + 20, 206), label: { x: (cx(0) + cx(4)) / 2, y: 191 } },
    kickbacks: { d: under(cx(4) + 20, cx(0) - 20, 254), label: { x: (cx(0) + cx(4)) / 2, y: 239 } },
    revenue: { d: under(cx(4) + 50, cx(0) - 50, 302), label: { x: (cx(0) + cx(4)) / 2, y: 287 } },
    agents: { d: over(cx(4), cx(2), -46), label: { x: (cx(2) + cx(4)) / 2, y: -60 } },
  };

  return (
    <figure className="growth">
      <svg
        className="growth-svg"
        viewBox="-6 -92 1076 416"
        role="img"
        aria-labelledby="growth-title growth-desc"
      >
        <title id="growth-title">Growth model: the funnel and the loops that feed it</title>
        <desc id="growth-desc">
          {FUNNEL.map((s) => `${s.stage}: ${s.value}. ${s.note}.`).join(" ")}{" "}
          {LOOPS.map((l) => `${l.name}: ${l.text}.`).join(" ")}
        </desc>
        <defs>
          <marker id="growth-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="growth-head" />
          </marker>
        </defs>

        {LOOPS.map((l) => {
          const p = loopPaths[l.id];
          return (
            <g key={l.id} className={`growth-loop${l.guess ? " guess" : ""}`}>
              <path d={p.d} markerEnd="url(#growth-head)" />
              {/* The halo is its own layer so it never paints over the label's letters. */}
              <text x={p.label.x} y={p.label.y} textAnchor="middle" className="growth-loop-label halo" aria-hidden="true">
                <tspan className="growth-loop-name">{l.name}:</tspan> {l.text}
              </text>
              <text x={p.label.x} y={p.label.y} textAnchor="middle" className="growth-loop-label">
                <tspan className="growth-loop-name">{l.name}:</tspan> {l.text}
              </text>
            </g>
          );
        })}

        {FUNNEL.map((s, i) => (
          <g key={s.stage} transform={`translate(${x(i)},0)`}>
            <rect width={W} height={H} rx="8" className={`growth-stage${i === FUNNEL.length - 1 ? " last" : ""}`} />
            <text x="14" y="28" className="growth-stage-name">
              {s.stage}
            </text>
            <text x="14" y="60" className="growth-stage-value">
              {s.value}
            </text>
            <text x="14" y="90" className="growth-stage-note">
              {s.note}
            </text>
            {i < FUNNEL.length - 1 ? (
              <path d={`M${W + 8},${H / 2} H${W + GAP - 10}`} className="growth-step" markerEnd="url(#growth-head)" />
            ) : null}
          </g>
        ))}
      </svg>

      <div className="growth-list">
        <ol className="growth-funnel">
          {FUNNEL.map((s) => (
            <li key={s.stage}>
              <span className="growth-stage-name">{s.stage}</span>
              <span className="growth-stage-value">{s.value}</span>
              <span className="growth-stage-note">{s.note}</span>
            </li>
          ))}
        </ol>
        <ul className="growth-loops">
          {LOOPS.map((l) => (
            <li key={l.id}>
              <strong>{l.name}:</strong> {l.text}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
