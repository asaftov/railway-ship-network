import NextLink from "next/link";
import { Fragment } from "react";
import { Box, Button, Card, Flex, Grid, Heading, Link, Table, Text } from "@radix-ui/themes";
import { getCreators } from "@/lib/data";
import { WAVES, SERIES } from "@/lib/seed";
import { BUDGET, BOUNTY, FORECAST, KILL_RULES, LOOPS, fmt, weekOf } from "@/lib/campaign";
import { SIM_TODAY } from "@/lib/sim";
import RouteMap from "@/components/RouteMap";
import GrowthModel from "@/components/GrowthModel";
import HeroArt from "@/components/HeroArt";
import CreatorMark from "@/components/CreatorMark";
import ForecastCalculator from "@/components/ForecastCalculator";
import { Note, P, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

const DAYS = 70;

function Fact({ value, label }) {
  return (
    <div>
      <Text as="div" size={{ initial: "5", sm: "7" }} className="fact-value">
        {value}
      </Text>
      <Text as="div" size={{ initial: "2", sm: "3" }} color="gray" mt="1" className="fact-label">
        {label}
      </Text>
    </div>
  );
}

function TryCard({ href, title, children }) {
  return (
    <Card size="3" asChild>
      <NextLink href={href} className="linkcard">
        <Text as="div" size="4" weight="medium" color="violet">
          {title}
        </Text>
        <Text as="div" size="3" color="gray" mt="1">
          {children}
        </Text>
      </NextLink>
    </Card>
  );
}

function Marks({ list, size = 32 }) {
  return (
    <span className="mark-stack">
      {list.map((c) => (
        <CreatorMark key={c.slug} creator={c} size={size} />
      ))}
    </span>
  );
}

function NameLinks({ list }) {
  return list.map((c, i) => (
    <Fragment key={c.slug}>
      {i ? (i === list.length - 1 ? " and " : ", ") : ""}
      <Link asChild>
        <NextLink href={`/creators/${c.slug}`}>{c.name}</NextLink>
      </Link>
    </Fragment>
  ));
}

// Notes in a new user's first week. They help people from the videos get an app running and keep it running.
const FOLLOW_UP = [
  {
    when: "Right after signup",
    title: "Back to the deploy",
    text: "A link to the point in the video where the deploy happens. The template is one click away.",
  },
  {
    when: "Midweek if nothing is deployed",
    title: "The usual fixes",
    text: "The problems people hit most often with that template and how to solve them. The creator helps write it.",
  },
  {
    when: "Before the week is up if the app stopped",
    title: "Get it running again",
    text: "Why the app stopped and the quickest way to bring it back.",
  },
];

// Who each kind of video is for. Matches the formats in the write-up.
const AUDIENCES = [
  {
    series: "zero-to-live",
    who: "People building with AI who get stuck when it's time to put the app online.",
    shows: "The whole path from the first prompt to a live link.",
    example: "I gave Claude Code one prompt and 60 minutes. Here's what's live.",
  },
  {
    series: "real-stack",
    who: "Working developers whose app needs more than a front end.",
    shows: "A database, background workers and scheduled jobs running together in one Railway project.",
    example: "Deploying an AI agent with a queue, a cron job and a database",
  },
  {
    series: "heroku-takeout",
    who: "Teams thinking about leaving Heroku.",
    shows: "A real Heroku app moved over in an afternoon. It's one episode. Render already offers this group credits.",
    example: "Moving a real Heroku app with my AI in an afternoon",
  },
];

export default async function Plan() {
  const { creators } = await getCreators();
  const paid = creators.filter((c) => c.group === "paid");
  // Paid creators who have also made sponsored videos for Clerk (SponsorRadar).
  const clerkAlumni = paid.filter((c) => /clerk/i.test(c.sponsors));
  const fees = paid.reduce((sum, c) => sum + c.fee, 0);
  const allLive = paid.every((c) => c.feeBasis === "live");
  const budget = BUDGET.map((b, i) => (i === 0 ? { line: `${paid.length} paid creator videos`, amount: allLive ? fees : b.amount } : b));
  const total = budget.reduce((sum, b) => sum + b.amount, 0);
  const range = `${fmt.num(FORECAST.activatedLow)} to ${fmt.num(FORECAST.activatedHigh)}`;
  // Five more points of first deploys, kept at the forecast's two-thirds still running.
  const deployLift = Math.round((((FORECAST.signupsLow + FORECAST.signupsHigh) / 2) * 0.05 * (2 / 3)) / 10) * 10;
  const typicalViews = paid.reduce((sum, c) => sum + (c.pricedViews ?? c.medianViews ?? 0), 0);

  const stations = [
    { day: 1, name: "Creators booked", who: ["Briefs go out"] },
    ...WAVES.map((w, i) => ({
      day: w.day,
      name: w.name,
      who: [
        ...paid.filter((c) => c.wave === w.id).map((c) => ({ slug: c.slug, name: c.name })),
        ...(i === 0 ? ["Plus 15 to 20 community builders"] : []),
      ],
    })),
    { day: DAYS, name: "Review", who: ["Decide who to book again"] },
  ];

  return (
    <>
      <Box className="hero">
        <HeroArt />
        <h1 className="hero-title">
          <span>Build it with AI.</span> <span>Ship it on Railway.</span>
        </h1>
        <Text as="p" size={{ initial: "4", sm: "5" }} mt="5" className="lede">
          Ship Network is a program that pays developers to record themselves building real apps with AI and shipping them on Railway.
          Twelve YouTube creators make the first videos. Then anyone can make one and earn from an open bounty.
          Ship Station is the tool that would run it.
        </Text>
        <Flex gap="3" mt="5" wrap="wrap">
          <Button asChild size="3">
            <NextLink href="/creators">Meet the creators</NextLink>
          </Button>
          <Button asChild size="3" variant="soft">
            <NextLink href="/results">See the week {weekOf(SIM_TODAY)} report</NextLink>
          </Button>
        </Flex>
        <div className="facts">
          <Fact value={`${paid.length} creators`} label="paid to make the first videos" />
          <Fact value={`${fmt.usd(BOUNTY.perDeploy)} bounty`} label="for each new active user" />
          <Fact value={fmt.usd(total)} label="for ten weeks" />
          <Fact value={range} label="new active users" />
        </div>
      </Box>

      <Section
        title="Developers pick a host while they build"
        intro="Sometimes an AI agent picks it at the start while setting up the project. Sometimes it comes later when the app first runs and needs to go online. Tutorials and AI agents shape both choices. Ship Network puts Railway in both places."
      >
        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          <Card size="3">
            <Heading as="h3" size="4" mb="2">
              Halfway through a tutorial
            </Heading>
            <P color="gray">
              The app runs on their laptop and they want it online. Plenty of them try whatever the creator used.
            </P>
            <Text as="div" size={{ initial: "6", sm: "8" }} mt="4" className="stat-value">
              11 of {paid.length}
            </Text>
            <Text as="div" size="3" mt="1">
              channels in this plan were recently sponsored by Clerk, Supabase, Neon or Render
            </Text>
          </Card>
          <Card size="3">
            <Heading as="h3" size="4" mb="2">
              In a chat with an AI agent
            </Heading>
            <P color="gray">
              Claude Code and Cursor now set up whole projects. They can pick the host before the app even works.
              Agents learn from public videos, templates and tutorials. Every video in this program adds to that.
            </P>
            <Text as="div" size={{ initial: "6", sm: "8" }} mt="4" className="stat-value">
              32 of 112
            </Text>
            <Text as="div" size="3" mt="1">
              deploy picks from Claude Code went to Railway in February. A newer model hasn&apos;t picked it yet.
            </Text>
            <Link asChild size="2" mt="3" style={{ display: "inline-block" }}>
              <NextLink href="/agents">See how agent picks are tracked</NextLink>
            </Link>
          </Card>
        </Grid>
      </Section>

      <Section
        title="Clerk has already shown this works"
        intro="Clerk started by sponsoring videos that were only about Clerk. They didn't move its numbers. So Clerk switched to paying creators to build full apps with Clerk as one of the tools."
      >
        <Grid columns={{ initial: "1", md: "minmax(0, 5fr) minmax(0, 7fr)" }} gap="4" align="stretch">
          <Card size="3">
            <Text as="div" size={{ initial: "6", sm: "8" }} className="stat-value">
              20 creators
            </Text>
            <Text as="div" size="3" mt="1">
              and Clerk&apos;s best install rate of any channel
            </Text>
            <Link href="https://playbooks.hypergrowthpartners.com/p/how-clerk-partners-with-youtubes" size="2" mt="3" style={{ display: "inline-block" }}>
              Read how Clerk did it
            </Link>
          </Card>
          <Card size="3">
            <Flex align="center" gap="3" wrap="wrap">
              <Marks list={clerkAlumni} size={36} />
              <Text as="div" size="3" weight="medium">
                Clerk&apos;s creators are already in this plan
              </Text>
            </Flex>
            <Text as="p" size="3" color="gray" mt="2" mb="0">
              <NameLinks list={clerkAlumni} /> already make these videos. In this plan they ship on Railway.
            </Text>
          </Card>
        </Grid>
      </Section>

      <Section
        title="Each video is made for one kind of developer"
        intro="Each creator makes the kind of video their audience already watches."
      >
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          {AUDIENCES.map((a) => {
            const who = paid.filter((c) => c.series === a.series);
            return (
              <Card size="3" key={a.series}>
                <Flex direction="column" gap="3" height="100%">
                  <Heading as="h3" size="4">
                    {SERIES[a.series]}
                  </Heading>
                  <Text as="p" size="3" mb="0">
                    {a.who}
                  </Text>
                  <Text as="p" size="3" color="gray" mb="0" style={{ flexGrow: 1 }}>
                    {a.shows}
                  </Text>
                  <Text as="p" size="2" color="gray" mb="0" className="example-title">
                    &ldquo;{a.example}&rdquo;
                  </Text>
                  <Flex align="center" gap="2" wrap="wrap" pt="3" className="audience-who">
                    <Marks list={who} size={28} />
                    <Text size="2" color="gray">
                      {who.length === 1 ? who[0].name : `${who.length} creators`}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Grid>
      </Section>

      <Section title="Every video ends with a one-click deploy">
        <ol className="steps">
          <li>
            <Heading as="h3" size="4" mb="1">
              A creator records the build
            </Heading>
            <Text as="p" size="3" color="gray">
              They build a real app with an AI agent like Claude Code or Cursor and talk through each step. Viewers
              watch the deploy to Railway from start to finish.
            </Text>
          </li>
          <li>
            <Heading as="h3" size="4" mb="1">
              The video ends with a deploy link
            </Heading>
            <Text as="p" size="3" color="gray">
              The creator publishes their app as a Railway template. The link at the end puts a working copy of the app
              and its database in the viewer&apos;s own account. New viewers sign up first.
            </Text>
          </li>
          <li>
            <Heading as="h3" size="4" mb="1">
              Each signup is tied to a video
            </Heading>
            <Text as="p" size="3" color="gray">
              Every link carries the creator&apos;s referral code. That shows which video sent each person.
            </Text>
          </li>
        </ol>
      </Section>

      <Section
        title="New users get help until their app is live"
        intro={`The forecast expects 45% of signups to deploy something and two thirds of those apps to keep running. Short notes in the first week can lift both. They can go out by email or in the Railway dashboard.`}
      >
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          {FOLLOW_UP.map((f) => (
            <Card size="3" key={f.when}>
              <Text as="div" size="2" color="gray" mb="1">
                {f.when}
              </Text>
              <Heading as="h3" size="4" mb="2">
                {f.title}
              </Heading>
              <Text as="p" size="3" color="gray" mb="0">
                {f.text}
              </Text>
            </Card>
          ))}
        </Grid>
        <Note mt="3">
          Lifting first deploys from 45% to 50% adds about {fmt.num(deployLift)} new active users. The forecast leaves this
          out. The first-deploy slider in the forecast below shows the effect.
        </Note>
      </Section>

      <Section
        title="Six videos go out on the same day"
        intro="This is Ship Day. Six paid creators and 15 to 20 community builders all post together. That makes the jump easy to see in the numbers. The other six paid videos go out two and four weeks later."
      >
        <Card size="4">
          <RouteMap stations={stations} animate label="Campaign timeline, week 1 to week 10" />
        </Card>
        <Link asChild size="3" weight="medium" mt="3" style={{ display: "inline-block" }}>
          <NextLink href="/ship-day">See the Ship Day plan</NextLink>
        </Link>
      </Section>

      <Section
        title="Each new user can bring in the next one"
        intro="The paid videos start things off. Loops keep new people coming after the videos stop. The forecast counts the bounty. The other loops come on top."
      >
        <Card size="4" mb="4" className="growth-card">
          <GrowthModel />
        </Card>
        <Heading as="h3" size="5" mb="2">
          How each loop is measured
        </Heading>
        <Text as="p" size="3" color="gray" mb="3">
          Each loop is tracked on its own. A loop that comes back around faster compounds faster and earns more budget.
        </Text>
        <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Loop</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>How it repeats</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hide-phone">Tracked by</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hide-phone">Cycle time</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hide-phone nowrap">In the forecast</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {LOOPS.map((l) => (
              <Table.Row key={l.id} className="top">
                <Table.RowHeaderCell className="nowrap">
                  {l.href ? (
                    l.href.startsWith("/") ? (
                      <Link asChild weight="medium">
                        <NextLink href={l.href}>{l.name}</NextLink>
                      </Link>
                    ) : (
                      <Link href={l.href} weight="medium">
                        {l.name}
                      </Link>
                    )
                  ) : (
                    <Text weight="medium">{l.name}</Text>
                  )}
                </Table.RowHeaderCell>
                <Table.Cell>
                  {l.repeats}
                  {l.id === "kickbacks" ? (
                    <>
                      {" "}
                      Railway has{" "}
                      <Link href="https://blog.railway.com/p/1M-paid-to-developers-who-built-railway-templates">
                        paid template authors more than $700,000
                      </Link>{" "}
                      in cash.
                    </>
                  ) : null}
                </Table.Cell>
                <Table.Cell className="hide-phone">{l.tracked}</Table.Cell>
                <Table.Cell className="hide-phone nowrap">{l.cycle}</Table.Cell>
                <Table.Cell className="hide-phone">{l.forecast ? "Yes" : "No"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        <Note mt="3">
          People who come in through a loop should keep their apps running as long as anyone else. Each loop gets that
          check too. Dashed lines in the figure depend on things outside the campaign.
        </Note>
      </Section>

      <Section title="The goal is new active users">
        <Grid columns={{ initial: "1", md: "minmax(0, 5fr) minmax(0, 7fr)" }} gap={{ initial: "5", md: "7" }} align="start">
          <Flex direction="column" gap="4">
            <div className="definition">
              <Text as="p" size={{ initial: "3", sm: "4" }}>
                <strong>A new active user</strong> signs up through a creator&apos;s link and still has an app running a
                week later. The write-up calls them activated signups.
              </Text>
            </div>
            <P color="gray">
              Views and signups are easy to rack up. A running app means someone actually
              built something. Each one gets traced back to where it came from.
            </P>
            <ul className="plain-list">
              <li>
                <strong>Referral codes</strong> count everyone who clicks a creator&apos;s link.
              </li>
              <li>
                <strong>One question at first deploy</strong> catches people who watched and came back later.
              </li>
              <li>
                <strong>Deploys before and after each wave</strong> show what the videos added overall.
              </li>
            </ul>
            <P>
              <Link asChild>
                <NextLink href="/results">See what the week {weekOf(SIM_TODAY)} report would look like</NextLink>
              </Link>
            </P>
          </Flex>
          <div>
            <Text as="p" size="3" weight="medium" mb="3">
              These rules are set before launch. The $60 limit should sit below what a new active user is worth to Railway. Railway&apos;s revenue data would set the final number.
            </Text>
            <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>If this happens</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>What happens next</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {KILL_RULES.map((k) => (
                  <Table.Row key={k.id} className="top">
                    <Table.RowHeaderCell>{k.when}</Table.RowHeaderCell>
                    <Table.Cell>{k.then}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>
        </Grid>
      </Section>

      <Section title="What it costs and what it brings in">
        <Grid columns={{ initial: "1", md: "minmax(0, 7fr) minmax(0, 5fr)" }} gap={{ initial: "4", md: "5" }} align="start">
          <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Budget line</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Amount</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell width="30%">Share</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {budget.map((b) => {
                const share = `${Math.round((b.amount / total) * 100)}%`;
                return (
                  <Table.Row key={b.line}>
                    <Table.RowHeaderCell>{b.line}</Table.RowHeaderCell>
                    <Table.Cell justify="end" className="tnum">
                      {fmt.usd(b.amount)}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <span className="share-bar" style={{ flex: 1 }} aria-hidden="true">
                          <i style={{ width: share }} />
                        </span>
                        <Text size="2" color="gray" className="tnum" style={{ width: 34, textAlign: "right" }}>
                          {share}
                        </Text>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
              <Table.Row>
                <Table.RowHeaderCell>
                  <Text weight="bold">Total for ten weeks</Text>
                </Table.RowHeaderCell>
                <Table.Cell justify="end" className="tnum">
                  <Text weight="bold">{fmt.usd(total)}</Text>
                </Table.Cell>
                <Table.Cell />
              </Table.Row>
            </Table.Body>
          </Table.Root>
          <Card size="3">
            <Text as="div" size="2" color="gray">
              Expected over ten weeks
            </Text>
            <Text as="div" size={{ initial: "6", sm: "8" }} mt="1" className="stat-value">
              {range}
            </Text>
            <Text as="div" size="3" mt="1">
              new active users at about {fmt.usd(FORECAST.costEach)} each
            </Text>
            <Note mt="3">
              Creator fees are based on each channel&apos;s real YouTube views. The rest of the budget and the forecast
              are estimates. Half as many people from the videos would push the cost per new active user past $60.
              Then booking stops.
            </Note>
          </Card>
        </Grid>
      </Section>

      <Section
        title="Test the forecast"
        intro={`Every rate in the forecast is an estimate. Move them to see what each new active user would cost. Booking stops if the paid videos cost more than ${fmt.usd(KILL_RULES[0].threshold)} per new active user.`}
      >
        <ForecastCalculator typicalViews={typicalViews} creatorFees={fees} budgetTotal={total} limit={KILL_RULES[0].threshold} />
      </Section>

      <Section title="See how it would run">
        <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
          <TryCard href="/creators" title="Meet the creators">
            Their recent views, engagement and fees.
          </TryCard>
          <TryCard href="/ship-day" title="See the Ship Day plan">
            The weeks around launch and where each creator stands.
          </TryCard>
          <TryCard href="/bounty" title="Run the bounty checks">
            Enter a video or try an example and watch each check pass or fail.
          </TryCard>
          <TryCard href="/results" title={`Read the week ${weekOf(SIM_TODAY)} report`}>
            How the campaign might look eight weeks in. The numbers are simulated.
          </TryCard>
          <TryCard href="/agents" title="See what AI agents recommend">
            The questions coding agents get asked every week.
          </TryCard>
          <TryCard href="/badge" title="Make a fork badge">
            The footer button that lets anyone deploy a copy of an app.
          </TryCard>
        </Grid>
      </Section>
    </>
  );
}
