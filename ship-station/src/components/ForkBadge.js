import { Button } from "@radix-ui/themes";

// The badge every creator app carries. Ship Station wears its own, linked to its Railway template.
export default function ForkBadge() {
  const href = process.env.TEMPLATE_URL || "/badge";
  const code = process.env.REFERRAL_CODE;
  let url = href;
  if (href.startsWith("http")) {
    const u = new URL(href);
    if (code) u.searchParams.set("referralCode", code);
    u.searchParams.set("utm_source", "ship-station");
    u.searchParams.set("utm_medium", "fork-badge");
    u.searchParams.set("utm_campaign", "ship-network");
    url = u.toString();
  }
  return (
    <Button asChild variant="surface" color="gray" highContrast radius="full" size="2">
      <a href={url} title="Deploy a copy of this app on Railway">
        <span className="fork-dot" aria-hidden="true" />
        Fork this app on Railway
      </a>
    </Button>
  );
}
