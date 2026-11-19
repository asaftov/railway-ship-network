import { weekOf } from "@/lib/campaign";
import NextLink from "next/link";
import { Badge, Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { ArrowRightIcon } from "@radix-ui/react-icons";

// Page title with an optional badge beside it and a short introduction under it.
export function PageHeader({ title, badge, children, before }) {
  return (
    <Box mb="6">
      {before}
      {badge ? <Box mb="3">{badge}</Box> : null}
      <Heading as="h1" size={{ initial: "7", sm: "8" }} weight="medium" className="page-title">
        {title}
      </Heading>
      {children ? (
        <Text as="p" size={{ initial: "3", sm: "4" }} mt="3" className="lede">
          {children}
        </Text>
      ) : null}
    </Box>
  );
}

// A titled block of the page. The title states the point. The intro is the one sentence to remember.
export function Section({ title, badge, intro, children, first = false }) {
  return (
    <section className={first ? "section section-first" : "section"}>
      <Flex align="center" gap="3" wrap="wrap">
        <Heading as="h2" size={{ initial: "6", sm: "7" }} weight="medium" className="section-title">
          {title}
        </Heading>
        {badge}
      </Flex>
      {intro ? (
        <Text as="p" size={{ initial: "3", sm: "4" }} mt="3" className="lede">
          {intro}
        </Text>
      ) : null}
      <Box mt="5">{children}</Box>
    </section>
  );
}

// The first sentence under a title, when a section needs more than one paragraph.
export function Lead({ children, ...props }) {
  return (
    <Text as="p" size={{ initial: "3", sm: "4" }} className="lede" {...props}>
      {children}
    </Text>
  );
}

export function P({ children, ...props }) {
  return (
    <Text as="p" size="3" className="measure" {...props}>
      {children}
    </Text>
  );
}

export function Note({ children, ...props }) {
  return (
    <Text as="p" size="2" color="gray" className="measure" {...props}>
      {children}
    </Text>
  );
}

export function Stat({ value, label, hint }) {
  return (
    <Card size="2">
      <Text as="div" size="2" color="gray">
        {label}
      </Text>
      <Text as="div" size={{ initial: "6", sm: "8" }} mt="1" className="stat-value">
        {value}
      </Text>
      {hint ? (
        <Text as="div" size="2" color="gray" mt="1">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

export function SimBadge() {
  return (
    <Badge color="amber" size="2">
      Simulated
    </Badge>
  );
}

// Plain-language decision on a creator, from the simulation.
export function callFor(s) {
  if (!s) return { text: "", tone: "wait" };
  if (s.daysLive <= 0) return { text: `Goes out in week ${weekOf(s.launchDay)}`, tone: "wait" };
  if (!s.evaluable) return { text: "Too early to call", tone: "wait" };
  if (s.flags.includes("cost")) return { text: "Don't book again", tone: "cut" };
  if (s.flags.includes("sentiment")) return { text: "Pause follow-ups", tone: "cut" };
  if (s.decision.startsWith("re-book")) return { text: "Offer a paid series", tone: "best" };
  return { text: "Keep", tone: "keep" };
}

// The reason for the decision in plain words.
export function whyFor(s, rules) {
  if (!s) return "";
  if (s.daysLive <= 0) return `The video goes out in week ${weekOf(s.launchDay)}.`;
  if (!s.evaluable) return `The video has only been out for ${s.daysLive < 7 ? "a few days" : "a week"}. It gets reviewed in week ${weekOf(s.launchDay + 14)}.`;
  const cost = `$${Math.round(s.costPerD7)}`;
  const neg = `${Math.round(s.negShare * 100)}%`;
  if (s.flags.includes("cost")) return `Each new active user cost ${cost}. The limit is $${rules.cost}.`;
  if (s.flags.includes("sentiment"))
    return `${neg} of the comments were about the October incident. The limit is ${Math.round(rules.sentiment * 100)}%.`;
  if (s.decision.startsWith("re-book")) return `Each new active user cost ${cost}. That's one of the lowest of the twelve.`;
  return `Each new active user cost ${cost}. That's well under the $${rules.cost} limit.`;
}

export const TONE_COLOR = { keep: "green", best: "green", cut: "red", wait: "gray" };

export function Decision({ s }) {
  const c = callFor(s);
  if (!c.text) return null;
  return (
    <Badge color={TONE_COLOR[c.tone]} variant={c.tone === "best" ? "solid" : "soft"} size="2">
      {c.text}
    </Badge>
  );
}


// One link at the end of a page that says where the story goes next.
export function NextStep({ href, title, children }) {
  return (
    <Card size="3" asChild className="next-step">
      <NextLink href={href} className="linkcard">
        <Flex align="center" justify="between" gap="4">
          <Box>
            <Text as="div" size="2" color="gray">
              Next
            </Text>
            <Text as="div" size={{ initial: "4", sm: "5" }} weight="medium" mt="1">
              {title}
            </Text>
            {children ? (
              <Text as="div" size="3" color="gray" mt="1">
                {children}
              </Text>
            ) : null}
          </Box>
          <ArrowRightIcon width="22" height="22" aria-hidden="true" />
        </Flex>
      </NextLink>
    </Card>
  );
}
