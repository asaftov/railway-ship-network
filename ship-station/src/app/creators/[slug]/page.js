import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Badge, Box, Callout, Card, Code, DataList, Flex, Grid, Heading, Link, Text } from "@radix-ui/themes";
import { ArrowLeftIcon, CheckCircledIcon, ClockIcon, CrossCircledIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { getCreators } from "@/lib/data";
import { SERIES, CATEGORIES, WAVES } from "@/lib/seed";
import { channelHealth, channelUrl, deployLink, fmt, KILL_RULES, weekOf } from "@/lib/campaign";
import { simulateCreator, SIM_TODAY } from "@/lib/sim";
import { Note, P, PageHeader, Section, SimBadge, Stat, TONE_COLOR, callFor, whyFor } from "@/components/ui";
import CopyBlock from "@/components/CopyBlock";
import CreatorMark, { markColor } from "@/components/CreatorMark";
import ViewsBars from "@/components/ViewsBars";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { creators } = await getCreators();
  return { title: creators.find((c) => c.slug === slug)?.name ?? "Creator" };
}

const IDEAS = {
  "zero-to-live": [
    "I gave Claude Code one prompt and 60 minutes. Here's what's live.",
    "I built a SaaS on a free VM with no account and no card",
    "Cursor vs Claude Code: which one ships a full-stack app faster?",
  ],
  "real-stack": [
    "FastAPI, Postgres and workers deployed on one canvas",
    "I moved my $40 a month VPS setup to Railway",
    "Deploying an AI agent with a queue, a cron job and a database",
  ],
  "heroku-takeout": [
    "Moving a real Heroku app with my AI in an afternoon",
    "From Procfile to Railway: what broke and what didn't",
  ],
};

const RULES = { cost: KILL_RULES[0].threshold, sentiment: KILL_RULES[1].threshold };
const TONE_ICON = { keep: CheckCircledIcon, best: CheckCircledIcon, cut: CrossCircledIcon, wait: ClockIcon };

export default async function CreatorPage({ params }) {
  const { slug } = await params;
  const { creators } = await getCreators();
  const index = creators.findIndex((x) => x.slug === slug);
  const c = creators[index];
  if (!c) notFound();
  const prev = creators[index - 1];
  const next = creators[index + 1];
  const s = simulateCreator(c);
  const wave = WAVES.find((w) => w.id === c.wave);
  const link = deployLink({ templateSlug: c.templateSlug, slug: c.slug });
  const badgeLink = deployLink({ templateSlug: c.templateSlug, slug: c.slug, medium: "fork-badge" });
  const badge = `<a href="${badgeLink}">\n  <img src="https://railway.com/button.svg" alt="Deploy on Railway" />\n</a>`;

  let role;
  if (c.group === "paid") role = `Paid creator. Their video goes out ${wave.id === 1 ? "on Ship Day" : `with ${wave.name}`} in week ${weekOf(wave.day)}.`;
  else if (c.group === "reserve") role = "Backup. Steps in if a paid creator is cut.";
  else role = "Comparison group. Not part of the campaign.";

  const call = callFor(s);
  const health = channelHealth(c.recent);
  const ToneIcon = TONE_ICON[call.tone];

  return (
    <>
      <PageHeader
        title={
          <span className="title-with-mark">
            <CreatorMark creator={c} size={56} />
            <span>{c.name}</span>
          </span>
        }
        before={
          <Link asChild size="2" color="gray" highContrast>
            <NextLink href="/creators" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <ArrowLeftIcon aria-hidden="true" />
              All creators
            </NextLink>
          </Link>
        }
      >
        {role}
      </PageHeader>
      <Flex gap="2" wrap="wrap" align="center" mt="-3" mb="6">
        {wave ? <Badge size="2" color={markColor(c)}>{wave.name}</Badge> : null}
        {c.group === "reserve" ? <Badge size="2">Backup</Badge> : null}
        {c.group === "comparison" ? <Badge size="2" color="gray">Comparison</Badge> : null}
        {c.series ? <Badge size="2" color="gray">Video: {SERIES[c.series]}</Badge> : null}
        {c.category ? <Badge size="2" color="gray">App: {CATEGORIES[c.category]}</Badge> : null}
        {channelUrl(c) ? (
          <Link href={channelUrl(c)} size="2" weight="medium" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {c.handle ?? "YouTube channel"}
            {c.handle ? " on YouTube" : ""}
            <ExternalLinkIcon aria-hidden="true" />
          </Link>
        ) : null}
      </Flex>

      <Grid columns={{ initial: "1", md: "minmax(0, 1fr) 340px" }} gap={{ initial: "6", md: "7" }} align="start">
        <Box style={{ minWidth: 0 }}>
          {c.group !== "comparison" ? (
            <>
              <Section
                title="What they get"
                intro="Both links carry this creator's referral code. The template address gets filled in once they publish their app on Railway."
                first
              >
                <Heading as="h3" size="3" mb="2">
                  A link for the video description
                </Heading>
                <CopyBlock text={link} />
                <Heading as="h3" size="3" mt="5" mb="2">
                  A badge for the app&apos;s footer
                </Heading>
                <CopyBlock text={badge} />
              </Section>

              <Section title="Video ideas">
                <ul className="plain-list">
                  {(IDEAS[c.series] ?? []).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <Note mt="3">
                  The creator picks the idea and keeps full control of the video. The deploy to Railway has to happen on
                  screen. The video has to end on the deploy link.
                </Note>
              </Section>
            </>
          ) : (
            <P>
              Railway has sponsored this channel recently with short awareness spots. It gets no campaign links.
              Comparing those spots with the build tutorials shows which kind of video brings in more new active users.
            </P>
          )}
          {s ? (
            <Section title={`How the video is doing in week ${weekOf(SIM_TODAY)}`} badge={<SimBadge />} first={c.group === "comparison"}>
              {s.daysLive > 0 ? (
                <Grid columns="2" gap="3" mb="3">
                  <Stat value={fmt.compact(s.viewsToDate)} label={`Views in ${Math.max(1, Math.round(s.daysLive / 7))} ${Math.round(s.daysLive / 7) > 1 ? "weeks" : "week"}`} />
                  <Stat value={fmt.num(s.signups)} label="New signups" />
                  <Stat value={fmt.num(s.d7Deploys)} label="New active users" />
                  <Stat value={fmt.usd(s.costPerD7)} label="Cost per new active user" />
                </Grid>
              ) : null}
              <Callout.Root color={TONE_COLOR[call.tone]} variant="surface">
                <Callout.Icon>
                  <ToneIcon />
                </Callout.Icon>
                <Callout.Text>
                  <strong>{call.text}.</strong> {whyFor(s, RULES)}
                </Callout.Text>
              </Callout.Root>
            </Section>
          ) : null}

        </Box>

        <Card size="3" asChild>
          <aside aria-label="Channel facts">
            <Heading as="h2" size="4" mb="3">
              Channel
            </Heading>
            {c.recent?.length ? (
              <Box mb="4">
                <Text as="div" size="2" color="gray" mb="2">
                  Views on their last {c.recent.length} long videos
                </Text>
                <ViewsBars recent={c.recent} median={c.medianViews} color={markColor(c)} height={84} large />
              </Box>
            ) : null}
            {health?.low ? (
              <Callout.Root color="amber" size="1" mb="4">
                <Callout.Text>
                  Likes and comments are low for this many views. That can mean some views come from ads. Ask for
                  their audience numbers before booking.
                </Callout.Text>
              </Callout.Root>
            ) : null}
            <DataList.Root size="2" orientation="vertical">
              <DataList.Item>
                <DataList.Label>Subscribers</DataList.Label>
                <DataList.Value>{fmt.compact(c.subsLive ?? c.subsEst)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Typical views</DataList.Label>
                <DataList.Value>
                  <div>
                    {c.medianViews ? fmt.num(c.medianViews) : "Not synced yet"}
                    {c.viewsSampled ? (
                      <Text as="div" color="gray">
                        Median of the last {c.viewsSampled} long videos
                      </Text>
                    ) : null}
                  </div>
                </DataList.Value>
              </DataList.Item>
              {health ? (
                <DataList.Item>
                  <DataList.Label>Engagement</DataList.Label>
                  <DataList.Value>
                    <span>
                      {(health.engagement * 100).toFixed(1)}%<Text color="gray"> of viewers like or comment</Text>
                    </span>
                  </DataList.Value>
                </DataList.Item>
              ) : null}
              {health?.perMonth ? (
                <DataList.Item>
                  <DataList.Label>Posting</DataList.Label>
                  <DataList.Value>
                    <div>
                      About {Math.max(1, Math.round(health.perMonth))} long {Math.round(health.perMonth) === 1 ? "video" : "videos"} a month
                      <Text as="div" color="gray">
                        Latest on {fmt.date(health.lastVideo)}
                      </Text>
                    </div>
                  </DataList.Value>
                </DataList.Item>
              ) : null}
              <DataList.Item>
                <DataList.Label>Fee</DataList.Label>
                <DataList.Value>
                  {c.group === "comparison" ? (
                    "Not part of the campaign budget"
                  ) : (
                    <span>
                      {fmt.usd(c.fee)}
                      <Text color="gray"> set from November 18 views</Text>
                    </span>
                  )}
                </DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Recent sponsors</DataList.Label>
                <DataList.Value>
                  <div>
                    {c.sponsors.replace(" deals)", ")").replace(/, ([^,]*)$/, " and $1")}
                    {/\(\d/.test(c.sponsors) ? (
                      <Text as="div" color="gray">
                        The number in brackets is how many sponsored videos.
                      </Text>
                    ) : null}
                  </div>
                </DataList.Value>
              </DataList.Item>
              {c.group !== "comparison" ? (
                <DataList.Item>
                  <DataList.Label>Referral code</DataList.Label>
                  <DataList.Value>
                    <Code variant="soft">{c.referralCode}</Code>
                  </DataList.Value>
                </DataList.Item>
              ) : null}
            </DataList.Root>
          </aside>
        </Card>
      </Grid>

      <Flex justify="between" gap="4" mt="9" wrap="wrap">
        {prev ? (
          <Link asChild size="2" color="gray" highContrast>
            <NextLink href={`/creators/${prev.slug}`}>Previous: {prev.name}</NextLink>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link asChild size="2" color="gray" highContrast>
            <NextLink href={`/creators/${next.slug}`}>Next: {next.name}</NextLink>
          </Link>
        ) : null}
      </Flex>
    </>
  );
}
