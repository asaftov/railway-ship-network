import { Badge, Card, Flex, Grid, Link, Table, Text } from "@radix-ui/themes";
import { getAgentPanel } from "@/lib/data";
import PROMPTS from "@/lib/agent-prompts.json";
import { fmt } from "@/lib/campaign";
import { NextStep, Note, PageHeader, Section, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI agents" };

function Study({ when, value, share, children, href }) {
  return (
    <Card size="3">
      <Text as="div" size="2" color="gray">
        {when}
      </Text>
      <Text as="div" size={{ initial: "6", sm: "8" }} mt="1" className="stat-value">
        {value}
      </Text>
      <Flex align="center" gap="2" mt="2">
        <span className="share-bar" style={{ flex: 1 }} aria-hidden="true">
          <i style={{ width: `${share * 100}%` }} />
        </span>
        <Text size="2" color="gray" className="tnum">
          {Math.round(share * 100)}% of picks
        </Text>
      </Flex>
      <Text as="p" size="3" mt="3" mb="2">
        {children}
      </Text>
      <Link size="2" href={href}>
        Read the report
      </Link>
    </Card>
  );
}

function PromptTable() {
  return (
    <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Stack</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Question</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {PROMPTS.prompts.map((p) => (
          <Table.Row key={p.id} className="top">
            <Table.RowHeaderCell minWidth="200px">{p.stack}</Table.RowHeaderCell>
            <Table.Cell>{p.prompt}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export default async function Agents() {
  const { rows, runs } = await getAgentPanel();
  const latest = runs[0];
  const current = latest ? rows.filter((r) => r.run_id === latest.runId) : [];
  const agents = [...new Set(current.map((r) => r.agent))];
  const share = {};
  for (const r of current) share[r.pick || "None"] = (share[r.pick || "None"] ?? 0) + 1;
  const ranked = Object.entries(share).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Developers also ask AI agents where to deploy">
        AI agents now set up whole projects. They can pick the host before the app even works. Jake Cooper has said
        Railway has{" "}
        <Link href="https://www.latent.space/p/railway">&quot;prioritized agentic as a top-of-funnel thing&quot;</Link>.
        Every video, template and tutorial in this program is public. The next model can learn from all of it. This
        page shows where agents stand today and how they&apos;d be checked every week.
      </PageHeader>

      <Section
        title="Agents have picked Railway before"
        intro="Amplifying asked Claude Code where it would deploy in February 2026. They asked again in July."
        first
      >
        <Grid columns={{ initial: "1", sm: "2" }} gap="4">
          <Study when="February 2026" value="32 of 112" share={32 / 112} href="https://amplifying.ai/research/claude-code-picks/report">
            of its deploy picks went to Railway. For Python apps it was 82%.
          </Study>
          <Study when="July 2026" value="0 of 44" share={0} href="https://amplifying.ai/research/claude-code-picks-fable">
            of its deploy picks went to Railway. The newer model leaned toward Vercel and Docker. That&apos;s the gap to close.
          </Study>
        </Grid>
      </Section>

      <Section
        title="Every week the agents get the same questions"
        intro="Claude Code, Codex and Cursor each answer them. The panel records which host each one recommends. The campaign is judged on new active users. Any lift here is a bonus."
      >
        {!latest ? (
          <>
            <PromptTable />
            <Note mt="3">
              The weekly runs would start with the campaign. The code is in the repo under agent-pick-panel. Every
              prompt ends with the same instruction: {PROMPTS.instruction}
            </Note>
          </>
        ) : (
          <>
            <Note mb="3">
              Run on {fmt.date(latest.runAt)} with {agents.join(" and ")}. {current.length} answers in total.
            </Note>
            <Grid columns={{ initial: "2", sm: "4" }} gap="3" mb="4">
              {ranked.slice(0, 4).map(([name, n]) => (
                <Stat key={name} value={fmt.pct(n / current.length)} label={name} hint={`${n} of ${current.length} picks`} />
              ))}
            </Grid>
            <Table.Root variant="surface" size={{ initial: "2", sm: "3" }}>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Stack</Table.ColumnHeaderCell>
                  {agents.map((a) => (
                    <Table.ColumnHeaderCell key={a}>{a}</Table.ColumnHeaderCell>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {PROMPTS.prompts.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.RowHeaderCell>{p.stack}</Table.RowHeaderCell>
                    {agents.map((a) => {
                      const pick = current.find((r) => r.agent === a && r.prompt_id === p.id)?.pick ?? "None";
                      return (
                        <Table.Cell key={a}>
                          {pick === "Railway" ? (
                            <Badge color="green" variant="soft" size="2">
                              Railway
                            </Badge>
                          ) : (
                            pick
                          )}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </>
        )}
      </Section>

      {latest ? (
        <Section title="The prompts">
          <details>
            <summary>
              <Text size="3">Show the {PROMPTS.prompts.length} prompts</Text>
            </summary>
            <Note mt="3" mb="3">
              Every prompt ends with the same instruction: {PROMPTS.instruction}
            </Note>
            <PromptTable />
          </details>
        </Section>
      ) : null}

      <NextStep href="/" title="Back to the plan">
        The whole campaign on one page.
      </NextStep>
    </>
  );
}
