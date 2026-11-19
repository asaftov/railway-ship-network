"use client";

// The forecast with every rate on a slider. Anyone can test the assumptions.
// The math matches the write-up. Signups are views x click rate x signup rate + bounty signups.
// New active users are signups x first deploy rate x still active rate.
// "Paid videos" divides creator fees by the new active users the paid videos bring. That is what the $60 stop rule checks.

import { useId, useState } from "react";
import { Button, Card, Flex, Grid, Text } from "@radix-ui/themes";

const DEFAULTS = { viewsPct: 100, clickPct: 1.5, signupPct: 35, bountySignups: 2300, deployPct: 45, activePct: 67 };

const PRESETS = [
  { id: "plan", label: "The plan's forecast", values: DEFAULTS },
  { id: "half", label: "Paid videos do half as well", values: { ...DEFAULTS, viewsPct: 50 } },
  { id: "nobounty", label: "The bounty never takes off", values: { ...DEFAULTS, bountySignups: 0 } },
  { id: "strong", label: "A strong launch", values: { ...DEFAULTS, viewsPct: 120, clickPct: 2, signupPct: 40, bountySignups: 3000 } },
];

const num = (n) => Math.round(n).toLocaleString("en-US");
const usd = (n) => (Number.isFinite(n) ? `$${Math.round(n).toLocaleString("en-US")}` : "-");
const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : num(n));

function Control({ label, help, value, display, min, max, step, onChange }) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="calc-control">
      <Flex justify="between" align="baseline" gap="3">
        <Text as="label" size="2" weight="medium" htmlFor={id}>
          {label}
        </Text>
        <Text size="3" weight="bold" className="tnum">
          {display}
        </Text>
      </Flex>
      <input
        id={id}
        type="range"
        className="calc-range"
        style={{ "--fill": `${fill}%` }}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
      />
      <Text as="div" size="1" color="gray" mt="1">
        {help}
      </Text>
    </div>
  );
}

export default function ForecastCalculator({ typicalViews, creatorFees, budgetTotal, limit }) {
  const [v, setV] = useState(DEFAULTS);
  const set = (k) => (x) => setV((cur) => ({ ...cur, [k]: x }));
  const active = PRESETS.find((p) => Object.keys(DEFAULTS).every((k) => p.values[k] === v[k]))?.id;

  const views = typicalViews * (v.viewsPct / 100);
  const clicks = views * (v.clickPct / 100);
  const paidSignups = clicks * (v.signupPct / 100);
  const signups = paidSignups + v.bountySignups;
  const deploys = signups * (v.deployPct / 100);
  const keep = (v.deployPct / 100) * (v.activePct / 100);
  const paidActive = paidSignups * keep;
  const activeUsers = signups * keep;
  const paidCost = creatorFees / paidActive;
  const programCost = budgetTotal / activeUsers;
  const over = paidCost > limit;

  // The gauge runs from $0 to twice the limit. The limit sits in the middle.
  const scaleMax = limit * 2;
  const pos = Math.min(100, (Math.min(paidCost, scaleMax) / scaleMax) * 100);

  const steps = [
    { label: "Video views", value: compact(views) },
    { label: "Clicks", value: num(clicks) },
    { label: "Signups", value: num(signups) },
    { label: "First deploys", value: num(deploys) },
    { label: "New active users", value: num(activeUsers), strong: true },
  ];

  return (
    <Grid columns={{ initial: "1", md: "minmax(0, 5fr) minmax(0, 7fr)" }} gap="4" align="start">
      <Card size="3">
        <Flex gap="2" wrap="wrap" mb="4" role="group" aria-label="Starting points">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="1"
              variant={active === p.id ? "solid" : "soft"}
              color={active === p.id ? undefined : "gray"}
              onClick={() => setV(p.values)}
              aria-pressed={active === p.id}
            >
              {p.label}
            </Button>
          ))}
        </Flex>
        <Flex direction="column" gap="5">
          <Control
            label="Views per video"
            help="Compared with each channel's typical video."
            value={v.viewsPct}
            display={`${v.viewsPct}%`}
            min={25}
            max={150}
            step={5}
            onChange={set("viewsPct")}
          />
          <Control
            label="Viewers who click the deploy link"
            help="The forecast uses 1.5%."
            value={v.clickPct}
            display={`${v.clickPct.toFixed(1)}%`}
            min={0.5}
            max={3}
            step={0.1}
            onChange={set("clickPct")}
          />
          <Control
            label="Clicks that become signups"
            help="The forecast uses 35%. New viewers have to sign up before they can deploy."
            value={v.signupPct}
            display={`${v.signupPct}%`}
            min={10}
            max={60}
            step={1}
            onChange={set("signupPct")}
          />
          <Control
            label="Signups from the bounty"
            help="The forecast uses 1,700 to 2,900 from 100 to 150 smaller creators."
            value={v.bountySignups}
            display={num(v.bountySignups)}
            min={0}
            max={4000}
            step={100}
            onChange={set("bountySignups")}
          />
          <Control
            label="Signups who deploy something"
            help="The forecast uses 45%."
            value={v.deployPct}
            display={`${v.deployPct}%`}
            min={20}
            max={70}
            step={1}
            onChange={set("deployPct")}
          />
          <Control
            label="Apps still running a week later"
            help="The forecast uses about two thirds."
            value={v.activePct}
            display={`${v.activePct}%`}
            min={30}
            max={90}
            step={1}
            onChange={set("activePct")}
          />
        </Flex>
      </Card>

      <Flex direction="column" gap="4" aria-live="polite" className="calc-results">
        <Card size="3">
          <ol className="calc-funnel">
            {steps.map((s) => (
              <li key={s.label} className={s.strong ? "strong" : undefined}>
                <Text as="div" size="1" color="gray">
                  {s.label}
                </Text>
                <Text as="div" size={s.strong ? "6" : "4"} weight={s.strong ? "bold" : "medium"} className="tnum">
                  {s.value}
                </Text>
              </li>
            ))}
          </ol>
        </Card>

        <Card size="3" className={over ? "calc-verdict over" : "calc-verdict"}>
          <Text as="div" size="2" color="gray">
            Cost per new active user from the paid videos
          </Text>
          <Flex align="baseline" gap="3" mt="1" wrap="wrap">
            <Text size="8" weight="bold" className="tnum" color={over ? "red" : "green"}>
              {usd(paidCost)}
            </Text>
            <Text size="3" weight="medium" color={over ? "red" : "green"}>
              {over ? `Over the ${usd(limit)} limit. Creators like these don't get booked again.` : `Under the ${usd(limit)} limit. Keep booking.`}
            </Text>
          </Flex>
          <div className="calc-gauge" aria-hidden="true">
            <span className="calc-gauge-fill" style={{ width: `${pos}%` }} />
            <span className="calc-gauge-limit" />
          </div>
          <Flex justify="between" mt="1">
            <Text size="1" color="gray">
              $0
            </Text>
            <Text size="1" color="gray">
              {usd(limit)} limit
            </Text>
            <Text size="1" color="gray">
              {usd(scaleMax)}+
            </Text>
          </Flex>
        </Card>

        <Card size="3">
          <Flex justify="between" align="baseline" gap="3" wrap="wrap">
            <Text size="2" color="gray">
              Cost per new active user for the whole {usd(budgetTotal)} program
            </Text>
            <Text size="6" weight="bold" className="tnum">
              {usd(programCost)}
            </Text>
          </Flex>
          <Text as="p" size="2" color="gray" mt="2" mb="0">
            It counts the bounty, the Ship Day gifts, the written tutorials and the reserve too. The stop rule only
            looks at the paid videos. It decides which creators get booked again.
          </Text>
        </Card>
      </Flex>
    </Grid>
  );
}
