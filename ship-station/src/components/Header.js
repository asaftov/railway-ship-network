"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { IconButton, TabNav, Tooltip } from "@radix-ui/themes";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import ThemeToggle from "@/components/ThemeToggle";

const PAGES = [
  ["/", "Plan"],
  ["/creators", "Creators"],
  ["/ship-day", "Ship Day"],
  ["/bounty", "Bounty"],
  ["/results", "Results"],
  ["/agents", "AI agents"],
];

// The mark is the route line in miniature: one stop passed, one stop ahead.
function Mark() {
  return (
    <svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true">
      <rect x="2" y="5" width="26" height="4" rx="2" fill="var(--accent-9)" />
      <circle cx="7" cy="7" r="5" fill="var(--color-background)" stroke="var(--accent-9)" strokeWidth="3" />
      <circle cx="23" cy="7" r="6" fill="var(--accent-9)" />
    </svg>
  );
}

export default function Header({ repo }) {
  const path = usePathname();
  const active = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NextLink href="/" className="mark">
          <Mark />
          Ship Station
        </NextLink>
        <TabNav.Root className="topbar-nav" aria-label="Main" size={{ initial: "1", sm: "2" }} justify={{ initial: "start", sm: "end" }}>
          {PAGES.map(([href, label]) => (
            <TabNav.Link key={href} asChild active={active(href)}>
              <NextLink href={href}>{label}</NextLink>
            </TabNav.Link>
          ))}
        </TabNav.Root>
        <div className="topbar-actions">
          <ThemeToggle />
          <Tooltip content="Code on GitHub">
            <IconButton asChild variant="ghost" color="gray" size="2">
              <a href={repo} aria-label="Code on GitHub">
                <GitHubLogoIcon width="17" height="17" />
              </a>
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
