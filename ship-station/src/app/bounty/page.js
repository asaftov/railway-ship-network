import { Badge, Code, Grid, Link, Table, Text } from "@radix-ui/themes";
import { getBountyEntries } from "@/lib/data";
import { BOUNTY, fmt, weekOf } from "@/lib/campaign";
import { simulateBounty, SIM_TODAY } from "@/lib/sim";
import { NextStep, Note, PageHeader, Section, SimBadge, Stat } from "@/components/ui";
import BountyForm from "./BountyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deploy Bounty" };

export default async function Bounty() {
  const { entries, dbReady } = await getBountyEntries();
  const sim = simulateBounty();

  return (
    <>
      <PageHeader title="Deploy Bounty">
        Anyone can make a video that builds an app and deploys it on Railway. Then they enter it here. Each entry earns{" "}
        {fmt.usd(BOUNTY.perDeploy)} for every new active user the video brings in. That&apos;s a new user whose app is
        still running a week later. The cap is {fmt.usd(BOUNTY.capPerCreatorMonth)} per creator each month.
      </PageHeader>

      <Section
        title="Enter a video and watch the checks run"
        intro="Every entry is checked as soon as it comes in. The examples show one entry that passes and one that fails."
        first
      >
        <BountyForm minGithubAgeDays={BOUNTY.minGithubAgeDays} />
      </Section>

      {dbReady && entries.length > 0 ? (
        <Section title="Entries so far">
          <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Creator</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Referral code</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Result</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Failed checks</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {entries.map((e) => {
                const failed = (e.checks || []).filter((c) => c.state === "fail");
                return (
                  <Table.Row key={e.id} className="top">
                    <Table.Cell className="nowrap">{fmt.date(e.created_at)}</Table.Cell>
                    <Table.RowHeaderCell>
                      <Link href={e.video_url} weight="medium">
                        {e.creator_name}
                      </Link>
                    </Table.RowHeaderCell>
                    <Table.Cell>{e.referral_code ? <Code variant="soft">{e.referral_code}</Code> : <Text color="gray">None</Text>}</Table.Cell>
                    <Table.Cell>
                      <Badge color={e.status === "rejected" ? "red" : "green"} variant="soft" size="2">
                        {e.status === "rejected" ? "Not accepted" : "Accepted"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{failed.length ? failed.map((c) => c.label).join(". ") : <Text color="gray">None</Text>}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Section>
      ) : null}

      <Section title={`How the bounty looks in week ${weekOf(SIM_TODAY)}`} badge={<SimBadge />}>
        <Grid columns={{ initial: "2", sm: "4" }} gap="3">
          <Stat value={fmt.num(sim.entries)} label={`Entries from ${sim.creators} creators`} />
          <Stat value={fmt.pct(sim.fraudRate)} label="Entries flagged" />
          <Stat value={fmt.num(sim.d7Deploys)} label="New active users paid for" />
          <Stat value={fmt.usd(sim.payout)} label="Paid out" />
        </Grid>
        <Note mt="3">
          Why {sim.flagged} entries were flagged:{" "}
          {sim.reasons.map((r) => `${r.count} ${r.reason}`).join(", ").replace(/, ([^,]*)$/, " and $1")}. The bounty
          pauses if more than 15% of entries get flagged.
        </Note>
      </Section>
      <NextStep href="/results" title={`See what the week ${weekOf(SIM_TODAY)} report would look like`}>
        Signups, cost and a decision on each creator. The numbers are simulated.
      </NextStep>
    </>
  );
}
