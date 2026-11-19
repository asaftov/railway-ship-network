import NextLink from "next/link";
import { Text } from "@radix-ui/themes";
import { weekOf } from "@/lib/campaign";

const DAYS = 70;

// Grid lines run from 1 (day 1) to 70 (day 70, the end of week 10). Each station's label is centred on its day's line.
function span(day, pos) {
  if (pos === "first") return [1, 10];
  if (pos === "last") return [58, 70];
  return [day - 6, day + 6];
}

/*
  The campaign drawn as a line with a station for each wave.
  stations: [{ day, name, who: [string | { slug, name }] }]
  today: when set, the line is filled up to that day and a marker shows where the campaign stands.
*/
export default function RouteMap({ stations, today, compact = false, animate = false, label }) {
  const frac = (day) => (day - 1) / (DAYS - 1);
  const cls = ["route", compact ? "route-compact" : "", animate ? "route-animate" : "", today ? "route-has-today" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} style={{ "--progress": today ? `${frac(today) * 100}%` : "100%" }}>
      <div className="route-track" aria-hidden="true">
        <div className="route-fill" />
      </div>
      <ol className="route-stations" aria-label={label}>
        {stations.map((s, i) => {
          const pos = i === 0 ? "first" : i === stations.length - 1 ? "last" : "middle";
          const [from, to] = span(s.day, pos);
          const state = today && s.day > today ? "ahead" : "passed";
          return (
            <li
              key={s.day}
              className="route-station"
              data-pos={pos}
              data-state={state}
              data-end={pos === "last" && !today ? "" : undefined}
              style={{ "--from": from, "--to": to, "--i": i }}
            >
              <span className="route-dot" aria-hidden="true" />
              <div className="route-label">
                <Text size="2" color="gray" className="tnum">
                  Week {weekOf(s.day)}
                </Text>
                <Text size={compact ? "2" : "3"} weight="bold" className="route-name">
                  {s.name}
                </Text>
                {!compact && s.who?.length ? (
                  <div className="route-who">
                    {s.who.map((w) =>
                      typeof w === "string" ? (
                        <span key={w}>{w}</span>
                      ) : (
                        <NextLink key={w.slug} href={`/creators/${w.slug}`}>
                          {w.name}
                        </NextLink>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {today ? (
        <div className="route-today" style={{ "--at": frac(today) }}>
          <span>Week {weekOf(today)}</span>
          <i aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
