import NextLink from "next/link";
import { Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { getCreators } from "@/lib/data";
import { WAVES, SERIES } from "@/lib/seed";
import { PRICING, channelHealth, fmt, weekOf } from "@/lib/campaign";
import { SIM_TODAY } from "@/lib/sim";
import { NextStep, Note, PageHeader, Section } from "@/components/ui";
import CreatorMark, { markColor } from "@/components/CreatorMark";
import ViewsBars from "@/components/ViewsBars";

export const dynamic = "force-dynamic";
export const metadata = { title: "Creators" };

const sponsorsOf = (c) => c.sponsors.replace(/ \([^)]*\)/g, "").replace(/, ([^,]*)$/, " and $1");

// One creator as a card. It shows who they are, what their recent videos pulled in and their fee.
function CreatorCard({ c, showFee = true }) {
  const health = channelHealth(c.recent);
  return (
    <Card size="2" asChild className="creator-card">
      <NextLink href={`/creators/${c.slug}`}>
        <Flex gap="3" align="center">
          <CreatorMark creator={c} size={44} />
          <div style={{ minWidth: 0 }}>
            <Text as="div" size="3" weight="medium" className="creator-card-name">
              {c.name}
            </Text>
            <Text as="div" size="2" color="gray">
              {c.series ? SERIES[c.series] : "Not in the campaign"}
            </Text>
          </div>
        </Flex>
        <ViewsBars recent={c.recent} median={c.medianViews} color={markColor(c)} height={40} />
        <Flex justify="between" align="end" gap="3">
          <div>
            <Text as="div" size="1" color="gray">
              Typical views
            </Text>
            <Text as="div" size="3" weight="medium" className="tnum">
              {fmt.compact(c.medianViews)}
            </Text>
          </div>
          {health ? (
            <div>
              <Text as="div" size="1" color="gray">
                Engagement
              </Text>
              <Text as="div" size="3" weight="medium" className="tnum" color={health.low ? "amber" : undefined}>
                {(health.engagement * 100).toFixed(1)}%{health.low ? " (check)" : ""}
              </Text>
            </div>
          ) : null}
          {showFee ? (
            <div style={{ textAlign: "right" }}>
              <Text as="div" size="1" color="gray">
                Fee
              </Text>
              <Text as="div" size="3" weight="medium" className="tnum">
                {fmt.usd(c.fee)}
              </Text>
            </div>
          ) : null}
        </Flex>
        <Text as="div" size="1" color="gray" className="creator-card-sponsors">
          Recently sponsored by {sponsorsOf(c)}
        </Text>
      </NextLink>
    </Card>
  );
}

export default async function Creators() {
  const { creators } = await getCreators();
  const paid = creators.filter((c) => c.group === "paid");
  const reserve = creators.filter((c) => c.group === "reserve");
  const comparison = creators.filter((c) => c.group === "comparison");
  const synced = creators.map((c) => c.syncedAt).filter(Boolean).sort().at(-1);
  const fees = paid.reduce((sum, c) => sum + c.fee, 0);

  return (
    <>
      <PageHeader title="The creators in the plan">
        Twelve mid-size YouTube channels that already make sponsored videos where they build something. Each one
        is paid about {fmt.usd(PRICING.cpmTarget)} for every 1,000 views their videos usually get.
        That&apos;s the middle of what tech channels charge. Click anyone to see their links and video ideas.
      </PageHeader>

      {WAVES.map((w, i) => {
        const group = paid.filter((c) => c.wave === w.id);
        return (
          <section key={w.id} className={i === 0 ? "wave-group first" : "wave-group"}>
            <Flex align="baseline" gap="3" mb="3">
              <Heading as="h2" size="5" weight="medium">
                {w.name}
              </Heading>
              <Text size="3" color="gray">
                Week {weekOf(w.day)}
              </Text>
            </Flex>
            <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
              {group.map((c) => (
                <CreatorCard key={c.slug} c={c} />
              ))}
            </Grid>
          </section>
        );
      })}

      <Flex justify="between" align="baseline" gap="3" mt="5" className="fees-total" wrap="wrap">
        <Text size="3" weight="medium">
          Fees for all {paid.length} videos
        </Text>
        <Text size="5" weight="medium" className="tnum">
          {fmt.usd(fees)}
        </Text>
      </Flex>
      <Note mt="3">
        The bars show each channel&apos;s last ten long videos from oldest to newest. Typical views are the median of
        those ten. Engagement is the share of viewers who like or comment. Channels below 0.5% get a closer look
        because ads can inflate views. Views come from the YouTube API
        {synced ? ` and were last updated on ${fmt.date(synced)}` : ""}. Fees use the November 18 numbers and range from{" "}
        {fmt.usd(PRICING.minFee)} to {fmt.usd(PRICING.maxFee)}. Sponsor history comes from SponsorRadar.
      </Note>

      <Section title="Backups and a comparison group">
        <Text as="p" size="3" color="gray" mb="3" className="measure">
          The backups step in if a paid creator is cut.
        </Text>
        <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
          {reserve.map((c) => (
            <CreatorCard key={c.slug} c={c} />
          ))}
        </Grid>
        <Text as="p" size="3" color="gray" mt="6" mb="3" className="measure">
          Railway has sponsored these two channels recently. They stay out of the campaign so the two kinds of
          sponsorship can be compared.
        </Text>
        <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
          {comparison.map((c) => (
            <CreatorCard key={c.slug} c={c} showFee={false} />
          ))}
        </Grid>
      </Section>

      <NextStep href="/ship-day" title="See how Ship Day runs">
        The weeks around launch and where each creator stands.
      </NextStep>
    </>
  );
}
