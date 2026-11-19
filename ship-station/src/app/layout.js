import "@radix-ui/themes/styles.css";
import "@fontsource/ibm-plex-serif/400.css";
import "@fontsource/ibm-plex-serif/500.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import NextLink from "next/link";
import { Flex, Link, Text, Theme } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import ForkBadge from "@/components/ForkBadge";
import { LINKS } from "@/lib/campaign";

const description =
  "Ship Network is a campaign idea for Railway. Ship Station is the tool that would run it. It holds the creator list, the bounty checks and the results.";

// The public address comes from Railway at run time, so link previews point at whichever domain serves the app.
const siteUrl =
  process.env.SITE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:3000");

export function generateMetadata() {
  return {
    metadataBase: new URL(siteUrl),
    title: { default: "Ship Station", template: "%s | Ship Station" },
    description,
    openGraph: { title: "Ship Station", description, type: "website", siteName: "Ship Station" },
    twitter: { card: "summary_large_image", title: "Ship Station", description },
  };
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#13111c" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Theme accentColor="violet" grayColor="mauve" radius="medium" panelBackground="solid">
            <Header repo={LINKS.repo} />
            <aside className="demo-note" aria-label="About this demo">
              <div className="demo-note-inner">
                <InfoCircledIcon width="16" height="16" aria-hidden="true" />
                <Text as="p" size="2">
                  <strong>This is a demo built for a presentation.</strong> It isn&apos;t a Railway product. Creator
                  views and fees are real YouTube data. All campaign results are simulated.
                </Text>
              </div>
            </aside>
            <main className="page">{children}</main>
            <footer className="foot">
              <div className="foot-inner">
                <Text as="p" size="2" color="gray" style={{ margin: 0 }}>
                  Ship Network is an independent campaign concept by Asaf Ashirov. It is not affiliated with Railway.
                </Text>
                <Flex align="center" gap="5" wrap="wrap">
                  <Link size="2" color="gray" highContrast href={LINKS.repo}>
                    Code on GitHub
                  </Link>
                  <Link size="2" color="gray" highContrast asChild>
                    <NextLink href="/badge">Make a fork badge</NextLink>
                  </Link>
                  <ForkBadge />
                </Flex>
              </div>
            </footer>
          </Theme>
        </Providers>
      </body>
    </html>
  );
}
