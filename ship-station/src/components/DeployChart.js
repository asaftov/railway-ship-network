"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, ScrollArea, Table, Text } from "@radix-ui/themes";
import { weekDay, weekOf } from "@/lib/campaign";

/*
  Two small charts on one time axis.
  Top: first deploys per day for the kinds of apps the videos build (accent) against all other apps (gray).
  Bottom: video views per day, on its own scale, so the two measures never share a y-axis.
  Hover, touch or the arrow keys move a crosshair that reads out every value for that day.
*/

const num = (n) => Math.round(n).toLocaleString("en-US");
const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(Math.round(n)));

function niceStep(range, target = 4) {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const pick = [1, 1.5, 2, 2.5, 5, 10].find((m) => m * pow >= raw) ?? 10;
  return pick * pow;
}

export default function DeployChart({ days, waves, today }) {
  const wrap = useRef(null);
  const [W, setW] = useState(1040);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = W < 620;
  const pad = { l: 46, r: narrow ? 10 : 14, t: 30 };
  const H1 = narrow ? 190 : 250;
  const between = 52;
  const H2 = 54;
  const bottom = 26;
  const H = pad.t + H1 + between + H2 + bottom;
  const iw = W - pad.l - pad.r;
  // A wide chart shows all 70 days, which leaves room for labels after the last point. A narrow one stops at today.
  const lastDay = narrow ? today : days.length;
  const span = lastDay - 1;

  const obs = days.filter((d) => d.observed);
  const last = obs[obs.length - 1];
  const hi = Math.max(...obs.map((d) => Math.max(d.treated, d.control)));
  const lo = Math.min(...obs.map((d) => Math.min(d.treated, d.control)));
  const step = niceStep(hi - lo);
  const minY = Math.floor(lo / step) * step;
  const maxY = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let t = minY; t <= maxY + 1e-6; t += step) ticks.push(t);

  const x = (day) => pad.l + ((day - 1) / span) * iw;
  const y = (v) => pad.t + H1 - ((v - minY) / (maxY - minY)) * H1;

  const top2 = pad.t + H1 + between;
  const base2 = top2 + H2;
  const maxViews = Math.max(1, ...obs.map((d) => d.views));
  const vStep = niceStep(maxViews, 2);
  const maxV = Math.ceil(maxViews / vStep) * vStep;
  const yv = (v) => base2 - (v / maxV) * H2;

  const path = (k) => obs.map((d, i) => `${i ? "L" : "M"}${x(d.day).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
  const gap =
    obs.map((d, i) => `${i ? "L" : "M"}${x(d.day).toFixed(1)},${y(d.treated).toFixed(1)}`).join(" ") +
    " " +
    [...obs].reverse().map((d) => `L${x(d.day).toFixed(1)},${y(d.control).toFixed(1)}`).join(" ") +
    " Z";

  const bw = Math.min(24, Math.max(2, iw / span - 2));
  const bar = (d) => {
    const left = x(d.day) - bw / 2;
    const top = yv(d.views);
    const h = base2 - top;
    if (h < 0.5) return null;
    const r = Math.min(4, bw / 2, h);
    return `M${left},${base2} V${top + r} Q${left},${top} ${left + r},${top} H${left + bw - r} Q${left + bw},${top} ${left + bw},${top + r} V${base2} Z`;
  };

  const xTicks = [1, ...waves.map((w) => w.day), today, lastDay].filter((d, i, a) => a.indexOf(d) === i);

  // End labels sit to the right of the last point when there is room for them.
  const endLabels = W >= 760;
  let yMain = y(last.treated);
  let yCtx = y(last.control);
  if (Math.abs(yMain - yCtx) < 16) {
    const mid = (yMain + yCtx) / 2;
    const up = yMain <= yCtx ? -1 : 1;
    yMain = mid + up * 8;
    yCtx = mid - up * 8;
  }

  const pick = (clientX) => {
    const rect = wrap.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const day = Math.round(1 + ((px - pad.l) / iw) * span);
    setActive(Math.min(today, Math.max(1, day)));
  };
  const onKey = (e) => {
    const cur = active ?? today;
    const move = { ArrowLeft: cur - 1, ArrowRight: cur + 1, Home: 1, End: today }[e.key];
    if (move == null) return;
    e.preventDefault();
    setActive(Math.min(today, Math.max(1, move)));
  };

  const a = active ? obs.find((d) => d.day === active) : null;
  const tipLeft = a ? x(a.day) : 0;
  const flip = a ? tipLeft > W - 230 : false;

  return (
    <Box>
      <Flex justify="between" align="center" gap="3" wrap="wrap" mb="3">
        <Text size="2" weight="bold">
          First deploys per day
        </Text>
        <div className="chart-legend">
          <span>
            <i className="key-line" />
            Kinds of apps the videos build
          </span>
          <span>
            <i className="key-line context" />
            Kinds of apps no video builds
          </span>
          <span>
            <i className="key-gap" />
            The gap between them
          </span>
        </div>
      </Flex>

      <div
        ref={wrap}
        className="chart-wrap"
        role="group"
        tabIndex={0}
        aria-label={`Chart of first deploys per day from week 1 to week ${weekOf(today)}. Video views per day sit underneath. Use the left and right arrow keys to read each day.`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((cur) => cur ?? today)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
              <text className="chart-axis" x={pad.l - 8} y={y(t) + 4} textAnchor="end">
                {num(t)}
              </text>
            </g>
          ))}

          {waves.map((w) => (
            <g key={w.id}>
              <line className="chart-event" x1={x(w.day)} x2={x(w.day)} y1={pad.t - 4} y2={base2} />
              <text
                className="chart-label"
                x={narrow ? x(w.day) : x(w.day) + 5}
                textAnchor={narrow ? "middle" : "start"}
                y={pad.t - 12}
                fontWeight="600"
              >
                {w.name}
              </text>
            </g>
          ))}
          <line className="chart-now" x1={x(today)} x2={x(today)} y1={pad.t - 4} y2={base2} />
          {!narrow ? (
            <text className="chart-axis" x={x(today) + 5} y={pad.t - 12}>
              Week {weekOf(today)} of {weekOf(days.length)}
            </text>
          ) : null}

          <path className="chart-gap" d={gap} />
          <path className="chart-line-context" d={path("control")} />
          <path className="chart-line-main" d={path("treated")} />
          <circle className="chart-dot-context" cx={x(last.day)} cy={y(last.control)} r="4.5" />
          <circle className="chart-dot-main" cx={x(last.day)} cy={y(last.treated)} r="4.5" />
          {endLabels ? (
            <>
              <text className="chart-label" x={x(last.day) + 12} y={yMain + 4}>
                <tspan fontWeight="650">{num(last.treated)}</tspan> apps the videos build
              </text>
              <text className="chart-label" x={x(last.day) + 12} y={yCtx + 4}>
                <tspan fontWeight="650">{num(last.control)}</tspan> other apps
              </text>
            </>
          ) : null}

          <text className="chart-title" x={pad.l} y={top2 - 14}>
            Video views per day
          </text>
          <line className="chart-grid" x1={pad.l} x2={W - pad.r} y1={yv(maxV)} y2={yv(maxV)} />
          <line className="chart-grid" x1={pad.l} x2={W - pad.r} y1={base2} y2={base2} />
          <text className="chart-axis" x={pad.l - 8} y={yv(maxV) + 4} textAnchor="end">
            {compact(maxV)}
          </text>
          <text className="chart-axis" x={pad.l - 8} y={base2 + 4} textAnchor="end">
            0
          </text>
          {obs.map((d) => {
            const p = bar(d);
            return p ? <path key={d.day} className="chart-bar" d={p} data-active={a?.day === d.day ? "" : undefined} /> : null;
          })}

          {xTicks.map((d, i) => (
            <text
              key={d}
              className="chart-axis"
              x={x(d)}
              y={H - 6}
              textAnchor={i === 0 ? "start" : d === lastDay ? "end" : "middle"}
              fontWeight={d === today ? 650 : 400}
            >
              {narrow && i > 0 ? `W${weekOf(d)}` : `Week ${weekOf(d)}`}
            </text>
          ))}

          {a ? (
            <g>
              <line className="chart-cross" x1={x(a.day)} x2={x(a.day)} y1={pad.t} y2={base2} />
              <circle className="chart-dot-context" cx={x(a.day)} cy={y(a.control)} r="4.5" />
              <circle className="chart-dot-main" cx={x(a.day)} cy={y(a.treated)} r="4.5" />
            </g>
          ) : null}
        </svg>

        {a ? (
          <div
            className="chart-tip"
            style={
              narrow
                ? { left: Math.max(0, Math.min(W - 220, tipLeft - 110)), top: base2 - 150 }
                : { left: flip ? undefined : tipLeft + 14, right: flip ? W - tipLeft + 14 : undefined, top: pad.t + 8 }
            }
          >
            <div className="tip-day">{weekDay(a.day)}</div>
            <div className="tip-row">
              <i className="key-line" />
              <span>Apps the videos build</span>
              <strong>{num(a.treated)}</strong>
            </div>
            <div className="tip-row">
              <i className="key-line context" />
              <span>Other apps</span>
              <strong>{num(a.control)}</strong>
            </div>
            <div className="tip-row">
              <i className="key-gap" />
              <span>Gap</span>
              <strong>
                {a.treated - a.control >= 0 ? "+" : "-"}
                {num(Math.abs(a.treated - a.control))}
              </strong>
            </div>
            <div className="tip-row">
              <i className="key-box" />
              <span>Video views</span>
              <strong>{num(a.views)}</strong>
            </div>
          </div>
        ) : null}
      </div>

      <Box mt="3">
        <details>
          <summary>
            <Text size="2">Show the numbers as a table</Text>
          </summary>
          <Box mt="3">
            <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 320 }}>
              <Table.Root size="1" variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Week and day</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell justify="end">Apps the videos build</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell justify="end">Other apps</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell justify="end">Gap</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell justify="end">Video views</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {obs.map((d) => (
                    <Table.Row key={d.day}>
                      <Table.RowHeaderCell>{weekDay(d.day)}</Table.RowHeaderCell>
                      <Table.Cell justify="end" className="tnum">{num(d.treated)}</Table.Cell>
                      <Table.Cell justify="end" className="tnum">{num(d.control)}</Table.Cell>
                      <Table.Cell justify="end" className="tnum">{num(d.treated - d.control)}</Table.Cell>
                      <Table.Cell justify="end" className="tnum">{num(d.views)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </ScrollArea>
          </Box>
        </details>
      </Box>
    </Box>
  );
}
