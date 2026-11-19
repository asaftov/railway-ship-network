import NextLink from "next/link";
import { Badge, Card, Flex, Grid, Link, Table, Text, VisuallyHidden } from "@radix-ui/themes";
import { getCreators } from "@/lib/data";
import { WAVES } from "@/lib/seed";
import { FORECAST, KILL_RULES, fmt, weekOf } from "@/lib/campaign";
import {
  simulateCreator,
  simulateDaily,
  differenceInDifferences,
  attributedByWave,
  simulateBounty,
  simulateBrandedSearch,
  SIM_TODAY,
} from "@/lib/sim";
import DeployChart from "@/components/DeployChart";
import RouteMap from "@/components/RouteMap";
import CreatorMark from "@/components/CreatorMark";
import { Decision, NextStep, Note, PageHeader, Section, SimBadge, Stat, callFor } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Results" };

const DAYS = 70;

function Status({ ok, children }) {
  return (
    <Flex align="center" gap="2" wrap="wrap">
      <Badge color={ok ? "green" : "red"} variant="soft" size="2">
        {ok ? "Clear" : "Triggered"}
      </Badge>
      <Text size="2" color="gray">
        {children}
      </Text>
    </Flex>
  );
}

export default async function Results() {
  const { creators } = await getCreators();
  const paid = creators.filter((c) => c.group === "paid").map((c) => ({ c, s: simulateCreator(c) }));
  const live = paid.filter((x) => x.s.daysLive > 0);
  const evaluated = paid.filter((x) => x.s.evaluable);
  const flagged = evaluated.filter((x) => x.s.flags.length);
  const bounty = simulateBounty();
  const branded = simulateBrandedSearch();
  const days = simulateDaily(creators);
  const waves = differenceInDifferences(days, attributedByWave(creators));

  const views = live.reduce((a, x) => a + x.s.viewsToDate, 0);
  const signups = live.reduce((a, x) => a + x.s.signups, 0) + bounty.signups;
  const d7 = live.reduce((a, x) => a + x.s.d7Deploys, 0) + bounty.d7Deploys;
  const spend = live.reduce((a, x) => a + x.c.fee, 0) + bounty.payout;

  const overCost = flagged.filter((x) => x.s.flags.includes("cost")).length;
  const overComments = flagged.filter((x) => x.s.flags.includes("sentiment")).length;
  const people = (n) => `${n} of the ${evaluated.length} creators reviewed so far`;
  const rules = [
    { rule: KILL_RULES[0], ok: overCost === 0, now: people(overCost) },
    { rule: KILL_RULES[1], ok: overComments === 0, now: people(overComments) },
    { rule: KILL_RULES[2], ok: bounty.fraudRate <= KILL_RULES[2].threshold, now: `${fmt.pct(bounty.fraudRate)} of entries flagged` },
    { rule: KILL_RULES[3], ok: branded.lift > 0, now: `Up ${fmt.pct(branded.lift)} on the week before Ship Day` },
  ];

  const tones = evaluated.map((x) => callFor(x.s).tone);
  const count = (t) => tones.filter((x) => x === t).length;
  const verdict = `${evaluated.length} creators reviewed so far`;
  const verdictLine = `${count("keep")} are worth keeping. ${count("best")} gets offered a paid series. ${count("cut")} were flagged.`;
  const triggered = rules.filter((r) => !r.ok).length;

  // What the report says to do, in plain words. Built from the same numbers as the tables below.
  const usd = (n) => fmt.usd(n);
  const nameList = (list) => list.map((x) => x.c.name).join(", ").replace(/, ([^,]*)$/, " and $1");
  const moves = [];
  for (const { c, s } of evaluated) {
    const call = callFor(s);
    if (call.tone === "best") moves.push({ tone: "green", tag: "Book again", text: `Offer ${c.name} a paid series. Each new active user cost ${usd(s.costPerD7)}. That's one of the lowest.` });
    if (call.tone === "best") moves.push({ tone: "violet", tag: "Boost", text: `Put part of the reserve into ads behind ${c.name}'s video. It turns viewers into new active users for less than almost any other.` });
  }
  for (const { c, s } of evaluated) {
    if (s.flags.includes("cost")) moves.push({ tone: "red", tag: "Drop", text: `Don't book ${c.name} again. Each new active user cost ${usd(s.costPerD7)}. The limit is ${usd(KILL_RULES[0].threshold)}.` });
    else if (s.flags.includes("sentiment")) moves.push({ tone: "amber", tag: "Talk", text: `Pause follow-ups with ${c.name} and talk through the comments. ${fmt.pct(s.negShare)} were about the October incident.` });
  }
  const waiting = live.filter((x) => !x.s.evaluable);
  if (waiting.length) moves.push({ tone: "gray", tag: "Wait", text: `Hold off on ${nameList(waiting)}. Their videos get reviewed in week ${weekOf(DAYS)}.` });
  if (bounty.fraudRate <= KILL_RULES[2].threshold) moves.push({ tone: "green", tag: "Keep", text: `Keep the bounty open. ${fmt.pct(bounty.fraudRate)} of entries were flagged. The limit is ${fmt.pct(KILL_RULES[2].threshold)}.` });
  if (branded.lift > 0) moves.push({ tone: "green", tag: "Keep", text: `Keep launching in waves. Searches for Railway rose ${fmt.pct(branded.lift)} in the week of Ship Day.` });
  const rulesTitle = triggered ? `${triggered} of the ${rules.length} stop rules have kicked in` : "None of the stop rules has kicked in";

  const stations = [
    { day: 1, name: "Creators booked" },
    ...WAVES.map((w) => ({ day: w.day, name: w.name })),
    { day: DAYS, name: "Review" },
  ];

  return (
    <>
      <PageHeader title={`By week ${weekOf(SIM_TODAY)}: ${fmt.num(d7)} new active users at ${fmt.usd(spend / d7)} each`} badge={<SimBadge />}>
        This is what the campaign report would look like eight weeks in. The forecast is {fmt.num(FORECAST.activatedLow)} to{" "}
        {fmt.num(FORECAST.activatedHigh)} new active users over the full ten weeks. Railway&apos;s real signup and deploy
        data is private. Every number here comes from a model of the plan.
      </PageHeader>

      <Card size="3" mb="4">
        <RouteMap stations={stations} today={SIM_TODAY} compact label={`Campaign timeline. This report is from week ${weekOf(SIM_TODAY)} of ${weekOf(DAYS)}.`} />
      </Card>

      <Grid columns={{ initial: "2", md: "4" }} gap="3">
        <Stat value={fmt.compact(views)} label="Video views" hint={`from ${live.length} paid videos`} />
        <Stat value={fmt.num(signups)} label="New signups" hint="from paid videos and the bounty" />
        <Stat value={fmt.num(d7)} label="New active users" hint="still running an app a week later" />
        <Stat value={fmt.usd(spend / d7)} label="Cost per new active user" hint="creator fees and bounty payouts" />
      </Grid>

      <Section title="What to do next" intro="Decisions for this week based on the numbers below.">
        <Card size="3">
          <ul className="next-moves">
            {moves.map((m, i) => (
              <li key={i}>
                <Badge color={m.tone} size="2" style={{ minWidth: 84, justifyContent: "center" }}>
                  {m.tag}
                </Badge>
                <Text size="3">{m.text}</Text>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section
        title="Each wave of videos opens a gap"
        intro="The purple line shows new deploys of the kinds of apps the videos build. The gray line shows every other kind of app. The purple line pulls ahead each time a wave goes out. That gap is what the campaign added."
      >
        <Card size="3">
          <DeployChart days={days} waves={WAVES} today={SIM_TODAY} />
        </Card>
      </Section>

      <Section
        title="Referral codes miss part of the picture"
        intro="Referral codes only count people who click the link. Plenty of people watch, leave and come back later on their own. Comparing the week before a wave with the week after catches them too."
      >
        <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Wave</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Extra deploys in the first week</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Counted by referral code</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {waves.map((r) => (
              <Table.Row key={r.wave.id}>
                <Table.RowHeaderCell className="nowrap">
                  {r.wave.name}
                  <Text as="div" size="2" color="gray">
                    Week {weekOf(r.wave.day)}
                  </Text>
                </Table.RowHeaderCell>
                {r.observed ? (
                  <>
                    <Table.Cell justify="end" className="tnum">{fmt.num(r.incremental7d)}</Table.Cell>
                    <Table.Cell justify="end" className="tnum">{fmt.num(r.attributed7d)}</Table.Cell>
                  </>
                ) : (
                  <Table.Cell colSpan={2}>
                    <Text color="gray">The week after this wave isn&apos;t over yet.</Text>
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        <Note mt="3">
          Extra deploys higher than the coded ones mean the codes are missing people who never clicked. Lower means
          some of those coded deploys would have happened anyway. The channel is judged on the extra
          deploys.
        </Note>
      </Section>

      <Section
        title={verdict}
        intro={`${verdictLine} Each creator gets reviewed two weeks after their video goes out. Anyone costing more than ${fmt.usd(KILL_RULES[0].threshold)} per new active user gets flagged. So does any video where more than ${fmt.pct(KILL_RULES[1].threshold)} of the comments are about the October security incident.`}
      >
        <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Creator</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Cost per new active user</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end" className="hide-phone">Comments about the incident</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Decision</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {live.map(({ c, s }) => {
              const overCostNow = s.flags.includes("cost");
              const overCommentsNow = s.flags.includes("sentiment");
              return (
                <Table.Row key={c.slug}>
                  <Table.RowHeaderCell className="nowrap">
                    <Flex align="center" gap="2">
                      <CreatorMark creator={c} size={28} />
                      <Link asChild weight="medium">
                        <NextLink href={`/creators/${c.slug}`}>{c.name}</NextLink>
                      </Link>
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell justify="end" className="tnum">
                    <Text color={overCostNow ? "red" : undefined} weight={overCostNow ? "bold" : undefined}>
                      {fmt.usd(s.costPerD7)}
                      {overCostNow ? <VisuallyHidden> over the limit</VisuallyHidden> : null}
                    </Text>
                  </Table.Cell>
                  <Table.Cell justify="end" className="tnum hide-phone">
                    <Text color={overCommentsNow ? "red" : undefined} weight={overCommentsNow ? "bold" : undefined}>
                      {fmt.pct(s.negShare)}
                      {overCommentsNow ? <VisuallyHidden> over the limit</VisuallyHidden> : null}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Decision s={s} />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Section>

      <Section title={rulesTitle}>
        <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>If this happens</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>What happens next</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Week {weekOf(SIM_TODAY)}</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rules.map(({ rule, ok, now }) => (
              <Table.Row key={rule.id} className="top">
                <Table.RowHeaderCell>{rule.when}</Table.RowHeaderCell>
                <Table.Cell>{rule.then}</Table.Cell>
                <Table.Cell minWidth="230px">
                  <Status ok={ok}>{now}</Status>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Section>
      <NextStep href="/agents" title="See what AI agents recommend">
        AI agents are the other place developers pick a host. Here&apos;s how they&apos;d be tracked.
      </NextStep>
    </>
  );
}
