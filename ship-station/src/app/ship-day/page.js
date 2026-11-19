import { Fragment } from "react";
import NextLink from "next/link";
import { Badge, Card, Code, Flex, Grid, Heading, Link, Table, Text } from "@radix-ui/themes";
import { CheckCircledIcon, ClockIcon } from "@radix-ui/react-icons";
import { getCreators } from "@/lib/data";
import { WAVES } from "@/lib/seed";
import { BUDGET, fmt, weekOf } from "@/lib/campaign";
import { simulateCreator, SIM_TODAY } from "@/lib/sim";
import CreatorMark from "@/components/CreatorMark";
import { Decision, NextStep, PageHeader, Section, SimBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ship Day" };

// The weeks around Ship Day. Based on campaign/ship-day-run-of-show.md.
const SCHEDULE = [
  ["Week 1", "Growth team", "Reach out to the paid creators and agree briefs and fees."],
  ["Week 2", "Growth team", "Invite community builders and issue referral codes in Ship Station."],
  ["Weeks 2 and 3", "Growth team", "Record a baseline of first deploys by app type and searches for Railway."],
  ["Week 3", "Creators", "Publish their templates. The growth team deploys each one from a fresh account to test it."],
  ["Week 3", "Growth team", "Check each video's deploy segment for accuracy. Open the bounty to community builders and queue Railway's posts."],
  ["Ship Day", "Everyone", "Publish at 16:00 UTC."],
  ["Ship Day", "Growth team", "Watch Ship Station every hour for template deploys, failed deploys and bounty entries. Fix any broken template within two hours."],
  ["Rest of week 4", "Growth team", "Read the comments on every video and answer creator questions."],
  ["End of week 4", "Growth team", "First read on new active users and cost per creator. Change the Wave 3 brief if a format isn't working."],
  ["Week 6", "Growth team", "Review the Ship Day creators against the stop rules. Offer a paid series to the lowest-cost ones. Open the bounty to everyone."],
];

const RISKS = [
  ["A template breaks under load", "Every template gets tested from a fresh account the week before. The growth team watches deploys all through Ship Day."],
  [
    "Free VMs run out",
    <>
      Creators use <Code variant="ghost">ssh railway.new</Code> for their own build only. Viewers get the template link.
    </>,
  ],
  ["Comments turn to the October incident", "Creators get the facts in their brief. The comment rule pauses follow-ups and leaves fees alone."],
  ["Bounty fraud spikes", "Payouts wait until each deploy has run for a week. The bounty pauses if more than 15% of entries get flagged."],
  ["A creator misses the date", "Their video moves to Wave 2. Ship Day still has at least five paid creators and the community builders."],
];

// One step on a creator's path: done by the report week, or still ahead.
function Step({ week, now, children }) {
  const done = week <= now;
  const Icon = done ? CheckCircledIcon : ClockIcon;
  return (
    <Flex direction="column" gap="1" align="start">
      <Flex align="center" gap="2">
        <Icon aria-hidden="true" color={done ? "var(--green-11)" : "var(--gray-10)"} />
        <Text size="2" color={done ? undefined : "gray"} className="nowrap">
          Week {week}
        </Text>
      </Flex>
      {children}
    </Flex>
  );
}

function nameList(list) {
  return list.map((c, i) => (
    <Fragment key={c.slug}>
      {i ? (i === list.length - 1 ? " and " : ", ") : ""}
      <Link asChild>
        <NextLink href={`/creators/${c.slug}`}>{c.name}</NextLink>
      </Link>
    </Fragment>
  ));
}

export default async function ShipDay() {
  const { creators } = await getCreators();
  const paid = creators.filter((c) => c.group === "paid");
  const now = weekOf(SIM_TODAY);
  const shipDay = WAVES[0];
  const first = paid.filter((c) => c.wave === shipDay.id);
  const reserve = BUDGET.find((b) => /reserve/i.test(b.line));
  const tutorials = BUDGET.find((b) => /tutorial/i.test(b.line));

  return (
    <>
      <PageHeader title="Ship Day">
        Ship Day is the first day of week {weekOf(shipDay.day)}. Six paid creators and 15 to 20 community builders publish
        their videos at 16:00 UTC. A launch that size is easy to see in first deploys and in searches for Railway. Supabase
        did the same with more than 30 creators and called it a{" "}
        <Link href="https://supabase.com/blog/the-supabase-content-storm">Content Storm</Link>.
      </PageHeader>

      <Section title="Who posts on Ship Day" first>
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          <Card size="3">
            <Flex direction="column" gap="3">
              <span className="mark-stack">
                {first.map((c) => (
                  <CreatorMark key={c.slug} creator={c} size={32} />
                ))}
              </span>
              <Heading as="h3" size="4">
                Paid creators
              </Heading>
              <Text as="p" size="3" color="gray" mb="0">
                {nameList(first)} each publish a full build video and a short cut. Each one gets a fee.
              </Text>
            </Flex>
          </Card>
          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading as="h3" size="4">
                Community builders
              </Heading>
              <Text as="p" size="3" color="gray" mb="0">
                Template authors, affiliates, Central Station regulars and smaller channels that already make Railway
                tutorials. They get credits, swag and first access to the bounty instead of a fee.
              </Text>
            </Flex>
          </Card>
          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading as="h3" size="4">
                Railway&apos;s own accounts
              </Heading>
              <Text as="p" size="3" color="gray" mb="0">
                Railway&apos;s X account, the changelog and Jake Cooper share the creators&apos; videos as they go out.
                There&apos;s no separate launch post.
              </Text>
            </Flex>
          </Card>
        </Grid>
      </Section>

      <Section
        title={`Where each creator stands in week ${now}`}
        badge={<SimBadge />}
        intro="Every wave follows the same steps. The brief is agreed three weeks before the video goes out. The template gets tested the week before. The review comes two weeks after launch."
      >
        <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Creator</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hide-phone">Brief agreed</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hide-phone">Template tested</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hide-phone">Video live</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Reviewed</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {WAVES.map((w) => {
              const live = weekOf(w.day);
              return paid
                .filter((c) => c.wave === w.id)
                .map((c) => {
                  const s = simulateCreator(c);
                  return (
                    <Table.Row key={c.slug} className="top">
                      <Table.RowHeaderCell>
                        <Flex align="center" gap="2">
                          <CreatorMark creator={c} size={28} />
                          <div>
                            <Link asChild weight="medium">
                              <NextLink href={`/creators/${c.slug}`}>{c.name}</NextLink>
                            </Link>
                            <Text as="div" size="1" color="gray">
                              {w.name}
                            </Text>
                          </div>
                        </Flex>
                      </Table.RowHeaderCell>
                      <Table.Cell className="hide-phone">
                        <Step week={live - 3} now={now} />
                      </Table.Cell>
                      <Table.Cell className="hide-phone">
                        <Step week={live - 1} now={now} />
                      </Table.Cell>
                      <Table.Cell className="hide-phone">
                        <Step week={live} now={now} />
                      </Table.Cell>
                      <Table.Cell>
                        <Step week={live + 2} now={now}>
                          {live + 2 <= now ? <Decision s={s} /> : null}
                        </Step>
                      </Table.Cell>
                    </Table.Row>
                  );
                });
            })}
          </Table.Body>
        </Table.Root>
      </Section>

      <Section
        title="The weeks around Ship Day"
        intro="Each step lands in a set week. Ship Station tracks the links, deploys and bounty entries along the way."
      >
        <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>When</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hide-phone">Who</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>What happens</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {SCHEDULE.map(([when, who, what], i) => (
              <Table.Row key={i} className="top">
                <Table.RowHeaderCell className="nowrap">
                  {when === "Ship Day" ? (
                    <Badge size="2" color="violet">
                      Ship Day
                    </Badge>
                  ) : (
                    when
                  )}
                </Table.RowHeaderCell>
                <Table.Cell className="hide-phone nowrap">{who}</Table.Cell>
                <Table.Cell>{what}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Section>

      <Section
        title="Each video keeps working after Ship Day"
        intro="Most views land in a video's first week. Clips, written tutorials and ads keep each one bringing in new users after that."
      >
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          <Card size="3">
            <Heading as="h3" size="4" mb="2">
              A short cut on every platform
            </Heading>
            <Text as="p" size="3" color="gray" mb="0">
              Each creator also posts a 45 to 60 second cut on Shorts, X and TikTok. It ends on the deploy and links to the
              full video.
            </Text>
          </Card>
          <Card size="3">
            <Heading as="h3" size="4" mb="2">
              Written tutorials
            </Heading>
            <Text as="p" size="3" color="gray" mb="0">
              Ten of the videos get a written version for Railway&apos;s guides. Search engines and AI agents keep finding
              them long after launch week. The budget has {fmt.usd(tutorials?.amount ?? 4000)} for them.
            </Text>
          </Card>
          <Card size="3">
            <Heading as="h3" size="4" mb="2">
              Ads behind the videos that work
            </Heading>
            <Text as="p" size="3" color="gray" mb="0">
              A video that brings in new active users well under the $60 limit has already proven it works. Part of the{" "}
              {fmt.usd(reserve?.amount ?? 5000)} reserve goes into ads that bring it more viewers.
            </Text>
          </Card>
        </Grid>
      </Section>

      <Section title="What can go wrong">
        <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>If this happens</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>What happens next</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {RISKS.map(([risk, plan]) => (
              <Table.Row key={risk} className="top">
                <Table.RowHeaderCell>{risk}</Table.RowHeaderCell>
                <Table.Cell>{plan}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Section>

      <NextStep href="/bounty" title="See how anyone else can join">
        The open bounty pays anyone else who makes the same kind of video.
      </NextStep>
    </>
  );
}
