// Campaign assumptions. Every number here is a planning assumption, not Railway data.

export const CAMPAIGN = {
  name: "Ship Network",
  line: "Build it with AI. Ship it on Railway.",
  weeks: 10,
  days: 70,
  northStar: "Activated signups: new users from creator links whose first deploy is still running a week later",
};

// The plan is counted in weeks. Day 1 is the first day of week 1.
export const weekOf = (day) => Math.ceil(day / 7);
export const weekDay = (day) => `Week ${weekOf(day)}, day ${((day - 1) % 7) + 1}`;

// How a channel's recent long videos perform beyond views. Real YouTube data.
// Engagement is the median share of viewers who like or comment. Below the floor, views may be coming from ads.
export const ENGAGEMENT_FLOOR = 0.005;
export function channelHealth(recent = []) {
  const withViews = recent.filter((r) => r.v > 0 && r.l != null);
  if (!withViews.length) return null;
  const rates = withViews.map((r) => (r.l + (r.c || 0)) / r.v).sort((a, b) => a - b);
  const mid = Math.floor(rates.length / 2);
  const engagement = rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
  const first = new Date(`${recent[0].d}T00:00:00Z`);
  const last = new Date(`${recent[recent.length - 1].d}T00:00:00Z`);
  const months = Math.max(1, (last - first) / (30 * 86_400_000));
  const perMonth = recent.length > 1 ? (recent.length - 1) / months : null;
  return { engagement, perMonth, lastVideo: recent[recent.length - 1].d, low: engagement < ENGAGEMENT_FLOOR };
}

export const LINKS = {
  repo: "https://github.com/asaftov/railway-ship-network",
};

export const PRICING = {
  cpmLow: 40, // USD per 1,000 median views
  cpmHigh: 60,
  cpmTarget: 50,
  defaultFee: 4000, // used until real median views are synced
  minFee: 1500,
  maxFee: 9000,
};

export const BOUNTY = {
  perDeploy: 10, // USD per new active user: a new user whose first deploy is still running a week later
  perPaidDeploy: 20, // fallback if new signups ever require a paid plan
  capPerCreatorMonth: 1000,
  minGithubAgeDays: 30,
  maxEntriesPerIpPerDay: 5,
};

export const KILL_RULES = [
  { id: "cost", label: "More than $60 per new active user after two weeks", threshold: 60,
    when: "A creator's video costs more than $60 per new active user after two weeks.",
    then: "They don't get booked again." },
  { id: "sentiment", label: "A quarter of comments about the October incident", threshold: 0.25,
    when: "More than a quarter of the comments on a video are about Railway's October security incident.",
    then: "Follow-ups with that creator pause until the comments are talked through. They still get paid in full." },
  { id: "fraud", label: "More than 15% of bounty entries flagged", threshold: 0.15,
    when: "More than 15% of bounty entries get flagged as fraud.",
    then: "The bounty pauses while the checks get tightened." },
  { id: "branded", label: "No rise in searches for Railway on Ship Day", threshold: 0,
    when: "Searches for Railway don't go up in the week of Ship Day.",
    then: "Future launches drop the one big day." },
].map((k) => ({ ...k, plain: `${k.when} ${k.then}` }));

// The plan's forecast for the full ten weeks. Planning assumptions, not Railway data.
export const FORECAST = { signupsLow: 6000, signupsHigh: 7300, activatedLow: 1800, activatedHigh: 2200, costEach: 34 };

// The funnel behind the forecast, ten weeks in total. Planning assumptions, not Railway data.
export const FUNNEL = [
  { stage: "Video views", value: "833K", note: "From 12 paid videos" },
  { stage: "Clicks", value: "12,500", note: "1.5% of views" },
  { stage: "Signups", value: "6,000 to 7,300", note: "35% of clicks + bounty" },
  { stage: "First deploys", value: "2,700 to 3,300", note: "45% of signups" },
  { stage: "Active users", value: "1,800 to 2,200", note: "Running after a week" },
];

// The loops that feed new active users back into the funnel. Only the bounty is in the forecast.
// Dashed loops (guess) depend on things outside the campaign: model releases and Railway's revenue data.
export const LOOPS = [
  {
    id: "fork",
    name: "Fork badge",
    text: "people who find an app deploy a copy",
    href: "/badge",
    repeats: "People who find a running app deploy a copy. Their copies carry the badge too.",
    tracked: "The badge link's own tag",
    cycle: "Under a week",
    forecast: false,
  },
  {
    id: "bounty",
    name: "Bounty",
    text: "viewers make their own videos and earn per new active user",
    href: "/bounty",
    repeats: "Viewers make their own videos. Their viewers become the next creators.",
    tracked: "Bounty entries and their referral codes",
    cycle: "About 3 weeks",
    forecast: true,
  },
  {
    id: "kickbacks",
    name: "Kickbacks",
    text: "creators earn on every deploy and keep sharing their template",
    href: "https://railway.com/open-source-kickback",
    repeats: "Template authors earn up to 25% of what their deploys spend for as long as they run. That keeps them sharing.",
    tracked: "Deploys of each creator's template",
    cycle: "Every month the apps run",
    forecast: false,
  },
  {
    id: "agents",
    name: "Agents",
    text: "more Railway tutorials online for AI agents to learn from",
    href: "/agents",
    repeats: "Public videos and tutorials teach the next model. Agents that pick Railway lead to more public apps on Railway.",
    tracked: "The weekly agent panel",
    cycle: "Each new model",
    forecast: false,
    guess: true,
  },
  {
    id: "revenue",
    name: "Revenue",
    text: "new users who start paying fund the next round of videos",
    repeats: "New users who start paying fund the next round of videos.",
    tracked: "Paid plans by referral code",
    cycle: "Each ten-week round",
    forecast: false,
    guess: true,
  },
];

export const BUDGET = [
  { line: "12 paid creator videos", amount: 48000 },
  { line: "Ship Day gifts for community builders", amount: 8000 },
  { line: "Deploy Bounty payouts", amount: 10000 },
  { line: "Ten written tutorials to go with the videos", amount: 4000 },
  { line: "Reserve for a paid series or ads with the best creators", amount: 5000 },
];

export const budgetTotal = () => BUDGET.reduce((s, b) => s + b.amount, 0);

export function suggestedFee(medianViews) {
  if (!medianViews) return { fee: PRICING.defaultFee, basis: "assumption" };
  const raw = (medianViews / 1000) * PRICING.cpmTarget;
  const fee = Math.round(Math.min(PRICING.maxFee, Math.max(PRICING.minFee, raw)) / 100) * 100;
  return { fee, basis: "live" };
}

export function referralCode(slug) {
  return `ship-${slug}`.slice(0, 32);
}

export function deployLink({ templateSlug, slug, medium = "video" }) {
  const base = templateSlug ? `https://railway.com/deploy/${templateSlug}` : "https://railway.com/deploy/template-code";
  const params = new URLSearchParams({
    referralCode: referralCode(slug),
    utm_source: slug,
    utm_medium: medium,
    utm_campaign: "ship-network",
  });
  return `${base}?${params.toString()}`;
}

export const fmt = {
  usd: (n) => (n == null ? "-" : `$${Math.round(n).toLocaleString("en-US")}`),
  num: (n) => (n == null ? "-" : Math.round(n).toLocaleString("en-US")),
  pct: (n) => (n == null ? "-" : `${(n * 100).toFixed(0)}%`),
  date: (d) =>
    d == null ? "-" : new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
  compact: (n) =>
    n == null ? "-" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n),
};

// A creator's YouTube channel. The handle reads better. The channel ID is the fallback.
export function channelUrl(c) {
  if (c.handle) return `https://www.youtube.com/${c.handle}`;
  if (c.channelId) return `https://www.youtube.com/channel/${c.channelId}`;
  return null;
}
