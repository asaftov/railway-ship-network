// Creator roster for the Ship Network proposal.
// Audience figures are third-party estimates (SponsorRadar / GetYourSponsor, Nov 2026) unless marked otherwise.
// Run `npm run sync:youtube` with YOUTUBE_API_KEY set to replace them with live channel data.

export const WAVES = [
  { id: 1, name: "Ship Day", day: 22, note: "Six paid creators and 15 to 20 community builders publish on the same day." },
  { id: 2, name: "Wave 2", day: 36, note: "Three paid creators post two weeks after Ship Day." },
  { id: 3, name: "Wave 3", day: 50, note: "Three paid creators post four weeks after Ship Day. One of them makes the Heroku episode." },
];

export const SERIES = {
  "zero-to-live": "Beginner build",
  "real-stack": "Production build",
  "heroku-takeout": "Leaving Heroku",
};

// channelId pins the exact YouTube channel. handle is used when there is no channelId; with neither, the sync job
// searches by name and logs the match for review.
export const CREATORS = [
  // Wave 1: Ship Day
  { slug: "sonny-sangha", channelId: "UCqeTj_QAnNlmt7FwzNwHZnA", name: "Sonny Sangha", handle: "@SonnySangha", group: "paid", wave: 1, series: "zero-to-live", category: "nextjs-saas", subsEst: 500000, subsSource: "SponsorRadar (487K-515K)", sponsors: "Clerk (44 deals), Render (Sep 2026)" },
  { slug: "codesistency", channelId: "UCiuh2rVpl8I_wZQASC6wxbg", name: "Codesistency", handle: "@codesistency", group: "paid", wave: 1, series: "zero-to-live", category: "nextjs-saas", subsEst: 161000, subsSource: "SponsorRadar", sponsors: "Clerk (11)" },
  { slug: "jan-marshal", channelId: "UC--oQmMTiFaW3kmCwrjl9-A", name: "Jan Marshal", handle: "@janmarshalcoding", group: "paid", wave: 1, series: "zero-to-live", category: "ai-agent", subsEst: 56400, subsSource: "SponsorRadar", sponsors: "Neon (Oct 2026)" },
  { slug: "greatstack", channelId: "UCkjoHfkLEy7ZT4bA2myJ8xA", name: "GreatStack", handle: "@GreatStackDev", group: "paid", wave: 1, series: "real-stack", category: "api-postgres", subsEst: 1200000, subsSource: "SponsorRadar", sponsors: "Neon (May 2026)" },
  { slug: "leon-van-zyl", channelId: "UCtevzRsHEKhs-RK8pAqwSyQ", name: "Leon van Zyl", handle: "@leonvanzyl", group: "paid", wave: 1, series: "real-stack", category: "ai-agent", subsEst: 103000, subsSource: "SponsorRadar", sponsors: "Neon (May 2026)" },
  { slug: "chris-raroque", channelId: "UC4x3CR25WSlvMJUtSPPzwwg", name: "Chris Raroque", handle: "@raroque", group: "paid", wave: 1, series: "zero-to-live", category: "ai-agent", subsEst: null, subsSource: "unverified", sponsors: "Convex (4), PostHog" },
  // Wave 2
  { slug: "traversy-media", channelId: "UC29ju8bIPH5as8OGnQzwJyA", name: "Traversy Media", handle: "@TraversyMedia", group: "paid", wave: 2, series: "real-stack", category: "api-postgres", subsEst: 2400000, subsSource: "SponsorRadar", sponsors: "Render (Aug 2026)" },
  { slug: "tubeguruji", channelId: "UC33Tc4FCgd_to314_b2hNTg", name: "TubeGuruji", handle: "@TubeGuruji", group: "paid", wave: 2, series: "zero-to-live", category: "ai-agent", subsEst: 88200, subsSource: "SponsorRadar", sponsors: "Clerk (6)" },
  { slug: "awesome", name: "Awesome", handle: "@awesome-coding", group: "paid", wave: 2, series: "real-stack", category: "api-postgres", subsEst: 141000, subsSource: "SponsorRadar", sponsors: "Supabase (2, Oct-Nov 2026)" },
  // Wave 3
  { slug: "theo", channelId: "UCbRP3c757lWg9M-U7TyEkXA", name: "Theo (t3.gg)", handle: "@theo", group: "paid", wave: 3, series: "heroku-takeout", category: "heroku-migration", subsEst: 581000, subsSource: "SponsorRadar (88K avg views)", sponsors: "Railway (3), Convex, Clerk (20)" },
  { slug: "javascript-mastery", channelId: "UCmXmlB4-HJytD7wek0Uo97A", name: "JavaScript Mastery", handle: "@javascriptmastery", group: "paid", wave: 3, series: "zero-to-live", category: "nextjs-saas", subsEst: 1300000, subsSource: "SponsorRadar", sponsors: "Clerk, Supabase, Docker (Nov 2026)" },
  { slug: "codehead", channelId: "UCFVteOob_YXJHPaGTqlDV2Q", name: "CodeHead", handle: "@codehead01", group: "paid", wave: 3, series: "real-stack", category: "api-postgres", subsEst: 105000, subsSource: "SponsorRadar", sponsors: "Supabase (4)" },
  // Reserve: smaller recent audiences, or held back to re-book if a paid creator trips a kill rule
  { slug: "bytegrad", channelId: "UCf6AGqO98eGk11nfazociVQ", name: "ByteGrad", handle: "@ByteGrad", group: "reserve", wave: null, series: "real-stack", category: "nextjs-saas", subsEst: 203000, subsSource: "SponsorRadar", sponsors: "Supabase (8)" },
  { slug: "simon-grimm", channelId: "UCZZPgUIorPao48a1tBYSDgg", name: "Simon Grimm (Galaxies.dev)", handle: "@galaxies_dev", group: "reserve", wave: null, series: "real-stack", category: "api-postgres", subsEst: 125000, subsSource: "SponsorRadar", sponsors: "Clerk (6), Sentry" },
  // Comparison group: awareness reads Railway already buys. Not part of the campaign spend.
  { slug: "fireship", channelId: "UCsBjURrPoezykLs9EqgamOA", name: "Fireship", handle: "@Fireship", group: "comparison", wave: null, series: null, category: null, subsEst: 4300000, subsSource: "SponsorRadar", sponsors: "Railway (5), Clerk (6), Render (Jun 2026)" },
  { slug: "kai-lentit", channelId: "UCi8C7TNs2ohrc6hnRQ5Sn2w", name: "Kai Lentit", handle: "@programmersarealsohuman5909", group: "comparison", wave: null, series: null, category: null, subsEst: 395000, subsSource: "SponsorRadar (~418K typical views)", sponsors: "Railway (Sep 2026)" },
];

export const CATEGORIES = {
  "nextjs-saas": "Next.js SaaS starter",
  "api-postgres": "API + Postgres + worker",
  "ai-agent": "AI agent with queue and cron",
  "heroku-migration": "Heroku migration",
};

// Template categories not featured by any wave. Used as the control group in the before/after comparison.
export const CONTROL_CATEGORIES = ["self-hosted-apps", "bots", "static-sites"];
