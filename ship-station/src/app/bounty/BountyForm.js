"use client";

import { useActionState, useState } from "react";
import { Box, Button, Card, Checkbox, Flex, Grid, Heading, Text, TextField, VisuallyHidden } from "@radix-ui/themes";
import { CheckCircledIcon, CircleIcon, ClockIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { submitEntry } from "./actions";

const ICON = { ok: CheckCircledIcon, fail: CrossCircledIcon, pending: ClockIcon };
const STATE = { ok: "Passed", fail: "Failed", pending: "Checked later" };

const EMPTY = { creator: "", videoUrl: "", templateUrl: "", github: "", disclosure: false, example: "" };
const EXAMPLES = {
  pass: {
    creator: "Example Builder",
    videoUrl: "https://dev.to/example/ship-an-ai-agent-on-railway",
    templateUrl: "https://railway.com/deploy/Hk35vY?referralCode=ship-example",
    github: "octocat",
    disclosure: true,
    example: "1",
  },
  fail: {
    creator: "Rushed Entry",
    videoUrl: "https://vimeo.com/123456789",
    templateUrl: "https://railway.com/deploy/Hk35vY",
    github: "no-such-account-ship-station",
    disclosure: false,
    example: "1",
  },
};

function Field({ label, hint, children }) {
  return (
    <label>
      <Text as="div" size="2" weight="medium" mb="1">
        {label}
      </Text>
      {hint ? (
        <Text as="div" size="2" color="gray" mb="2">
          {hint}
        </Text>
      ) : null}
      {children}
    </label>
  );
}

export default function BountyForm({ minGithubAgeDays = 30 }) {
  const [state, action, pending] = useActionState(submitEntry, null);
  const [v, setV] = useState(EMPTY);
  // Typing in a field turns an example back into a real entry.
  const set = (key) => (e) => setV((cur) => ({ ...cur, [key]: e.target.value, example: "" }));

  return (
    <Grid columns={{ initial: "1", md: "minmax(0, 11fr) minmax(0, 9fr)" }} gap="4" align="start">
      <Card size="3">
        <form action={action}>
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2" wrap="wrap">
              <Text size="2" color="gray">
                Fill in an example:
              </Text>
              <Button type="button" variant="soft" size="1" onClick={() => setV(EXAMPLES.pass)}>
                One that passes
              </Button>
              <Button type="button" variant="soft" color="gray" size="1" onClick={() => setV(EXAMPLES.fail)}>
                One that fails
              </Button>
            </Flex>
            <Field label="Name or channel">
              <TextField.Root size="3" name="creator" required placeholder="Simple Tech Skills" value={v.creator} onChange={set("creator")} />
            </Field>
            <Field label="Video link">
              <TextField.Root size="3" type="url" name="videoUrl" required placeholder="https://www.youtube.com/watch?v=..." value={v.videoUrl} onChange={set("videoUrl")} />
            </Field>
            <Field label="Template link" hint="The Railway deploy link from the video description. It needs the creator's referral code.">
              <TextField.Root
                size="3"
                type="url"
                name="templateUrl"
                required
                placeholder="https://railway.com/deploy/template-code?referralCode=..."
                value={v.templateUrl}
                onChange={set("templateUrl")}
              />
            </Field>
            <Field label="GitHub username" hint="The account that published the template.">
              <TextField.Root size="3" name="github" required placeholder="octocat" value={v.github} onChange={set("github")} />
            </Field>
            <Text as="label" size="2">
              <Flex gap="2" align="start">
                <Checkbox
                  name="disclosure"
                  mt="1"
                  checked={v.disclosure}
                  onCheckedChange={(checked) => setV((cur) => ({ ...cur, disclosure: checked === true, example: "" }))}
                />
                <span>The video says it&apos;s part of a paid program with Railway. YouTube&apos;s paid promotion setting is on.</span>
              </Flex>
            </Text>
            <input type="hidden" name="example" value={v.example} />
            <Flex gap="3" align="center" wrap="wrap">
              <Button type="submit" size="3" loading={pending}>
                Run the checks
              </Button>
              {v.example ? (
                <Text size="2" color="gray">
                  Examples are checked but not saved.
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </form>
      </Card>

      <Card size="3" aria-live="polite">
        <Heading as="h3" size="4" mb="3">
          {state && !state.error ? "Check results" : "What the checks look for"}
        </Heading>
        {!state ? (
          <ul className="checks">
            {[
              ["A real video and a real template", "The video is public and links to a published Railway template with the creator's referral code."],
              ["An honest disclosure", "The video says it's sponsored. YouTube's paid promotion setting is on."],
              ["A real person", `The GitHub account is at least ${minGithubAgeDays} days old. Entries aren't piling up from one network.`],
              ["Deploys that last", "Only signups whose app is still running with real traffic a week later count. A person reviews every payout."],
            ].map(([title, text]) => (
              <li key={title}>
                <span className="icon pending">
                  <CircleIcon width="16" height="16" aria-hidden="true" />
                </span>
                <span>
                  <Text as="div" size="3" weight="medium">
                    {title}
                  </Text>
                  <Text as="div" size="2" color="gray">
                    {text}
                  </Text>
                </span>
              </li>
            ))}
          </ul>
        ) : state.error ? (
          <Text as="p" size="2" color="red" style={{ margin: 0 }}>
            {state.error}
          </Text>
        ) : (
          <>
            <Text as="p" size="2" style={{ margin: 0 }}>
              <Text weight="bold" color={state.status === "rejected" ? "red" : "green"}>
                {state.status === "rejected" ? "Not accepted." : "Accepted."}
              </Text>{" "}
              <Text color="gray">
                {state.status === "rejected"
                  ? "Fix the items marked with a cross and run the checks again."
                  : "Payment goes out once each deploy has run for a week."}
                {state.example
                  ? " Examples are not saved."
                  : state.stored
                    ? ""
                    : " This entry was not saved because no database is connected."}
              </Text>
            </Text>
            <Box mt="4">
              <ul className="checks">
                {state.checks.map((c) => {
                  const Icon = ICON[c.state];
                  return (
                    <li key={c.label}>
                      <span className={`icon ${c.state}`}>
                        <Icon width="16" height="16" aria-hidden="true" />
                        <VisuallyHidden>{STATE[c.state]}:</VisuallyHidden>
                      </span>
                      <span>
                        <Text as="div" size="2">
                          {c.label}
                        </Text>
                        <Text as="div" size="2" color="gray" style={{ wordBreak: "break-word" }}>
                          {c.detail}
                        </Text>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Box>
          </>
        )}
      </Card>
    </Grid>
  );
}
