"use client";

import { useMemo, useState } from "react";
import { Card, Flex, Grid, Heading, SegmentedControl, Select, Text, TextField } from "@radix-ui/themes";
import CopyBlock from "@/components/CopyBlock";

export default function BadgeGenerator({ creators }) {
  const [slug, setSlug] = useState(creators[0]?.slug ?? "");
  const [template, setTemplate] = useState("railway.com/deploy/Hk35vY");
  const [style, setStyle] = useState("button");

  const creator = creators.find((c) => c.slug === slug);
  const url = useMemo(() => {
    const code = template.trim().replace(/^.*\/deploy\//, "").split("?")[0].replace(/[^\w-]/g, "");
    const base = code ? `https://railway.com/deploy/${code}` : "https://railway.com/deploy/template-code";
    const p = new URLSearchParams({
      referralCode: creator?.referralCode ?? "",
      utm_source: slug,
      utm_medium: "fork-badge",
      utm_campaign: "ship-network",
    });
    return `${base}?${p}`;
  }, [template, creator, slug]);

  const snippet =
    style === "button"
      ? `<a href="${url}">\n  <img src="https://railway.com/button.svg" alt="Deploy on Railway" />\n</a>`
      : `<a href="${url}" style="display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border:1px solid #dfe1e6;border-radius:999px;font:600 14px system-ui,sans-serif;color:#14141a;background:#fff;text-decoration:none">\n  <span style="width:9px;height:9px;border-radius:50%;background:#6e56cf"></span>Fork this app on Railway\n</a>`;

  return (
    <Grid columns={{ initial: "1", md: "minmax(0, 2fr) minmax(0, 3fr)" }} gap="4" align="start">
      <Card size="3">
        <Flex direction="column" gap="4">
          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Creator
            </Text>
            <Select.Root value={slug} onValueChange={setSlug} size="3">
              <Select.Trigger style={{ width: "100%" }} />
              <Select.Content position="popper">
                {creators.map((c) => (
                  <Select.Item key={c.slug} value={c.slug}>
                    {c.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>
          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Template link
            </Text>
            <Text as="div" size="2" color="gray" mb="2">
              Paste the creator&apos;s Railway template link or its short code. The Ship Station template is filled in as an example.
            </Text>
            <TextField.Root size="3" value={template} onChange={(e) => setTemplate(e.target.value)} placeholder="railway.com/deploy/fastapi-agent" />
          </label>
          <div>
            <Text as="div" size="2" weight="medium" mb="2" id="badge-style">
              Style
            </Text>
            <SegmentedControl.Root value={style} onValueChange={setStyle} aria-labelledby="badge-style" style={{ width: "100%" }}>
              <SegmentedControl.Item value="button">Railway deploy button</SegmentedControl.Item>
              <SegmentedControl.Item value="pill">Small footer link</SegmentedControl.Item>
            </SegmentedControl.Root>
          </div>
        </Flex>
      </Card>
      <Card size="3">
        <Heading as="h2" size="4" mb="3">
          Preview
        </Heading>
        {/* The snippet is built from the fields above and a fixed template, never from free-form HTML. */}
        <div className="badge-preview" dangerouslySetInnerHTML={{ __html: snippet }} />
        <Heading as="h2" size="4" mt="5" mb="3">
          Code to paste into the app&apos;s footer
        </Heading>
        <CopyBlock text={snippet} />
      </Card>
    </Grid>
  );
}
