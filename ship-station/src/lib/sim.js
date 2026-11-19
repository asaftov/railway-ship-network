// Simulated campaign telemetry for the demo.
// Railway's real per-template deploy events are internal, so the dashboard runs on a deterministic
// simulation built from the plan's assumptions. Every page that uses this module labels it as simulated.

import { WAVES, CONTROL_CATEGORIES } from "./seed.js";
import { KILL_RULES, BOUNTY } from "./campaign.js";

export const SIM_TODAY = 57; // the dashboard is shown at the start of week 9, a week after the last wave
export const DEFAULT_VIDEO_VIEWS = 50000; // planning assumption per paid video (30-day views)

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r, lo, hi) => lo + r() * (hi - lo);

// Share of a video's 30-day views that land on each day after publishing.
function viewCurve(daysSince) {
  if (daysSince < 0) return 0;
  const w = Math.exp(-daysSince / 4);
  return w / 4.4; // sums to roughly 1 over 30 days
}

export function simulateCreator(c) {
  if (c.group !== "paid" || !c.wave) return null;
  const r = rng(`creator:${c.slug}`);
  const wave = WAVES.find((w) => w.id === c.wave);
  const launchDay = wave.day + Math.floor(r() * 2);
  const plannedViews = c.medianViews ?? DEFAULT_VIDEO_VIEWS;
  const views30 = Math.round(plannedViews * between(r, 0.7, 1.4));
  const daysLive = Math.max(0, SIM_TODAY - launchDay);
  let viewsToDate = 0;
  for (let d = 0; d < Math.min(daysLive, 30); d++) viewsToDate += views30 * viewCurve(d);
  viewsToDate = Math.round(viewsToDate);
  const deploysPer1k = between(r, 1.7, 3.4);
  const clicks = Math.round(viewsToDate * between(r, 0.011, 0.022));
  r(); // keeps the random sequence in step with earlier runs
  const firstDeploys = Math.round((viewsToDate / 1000) * deploysPer1k);
  // The plan assumes about 45% of new signups deploy. A separate seed keeps the other numbers unchanged.
  const signups = Math.round(firstDeploys / between(rng(`signups:${c.slug}`), 0.4, 0.5));
  const d7Deploys = Math.round(firstDeploys * between(r, 0.55, 0.78));
  const costPerD7 = d7Deploys ? c.fee / d7Deploys : null;
  let negShare = between(r, 0.02, 0.16);
  if (c.slug === "traversy-media") negShare = 0.29; // one creator trips the sentiment rule, to show the rule working
  const evaluable = daysLive >= 14;
  const flags = [];
  if (evaluable && costPerD7 > KILL_RULES[0].threshold) flags.push("cost");
  if (evaluable && negShare > KILL_RULES[1].threshold) flags.push("sentiment");
  const reason = { cost: "cost", sentiment: "sentiment" };
  const decision = !evaluable
    ? daysLive > 0 ? "too early" : "scheduled"
    : flags.length
      ? `don't re-book (${flags.map((f) => reason[f]).join(", ")})`
      : costPerD7 < 25 ? "re-book: series deal" : "keep";
  return { launchDay, views30, viewsToDate, deploysPer1k, clicks, signups, firstDeploys, d7Deploys, costPerD7, negShare, daysLive, evaluable, flags, decision };
}

// Daily first deploys in featured template categories vs control categories, plus daily campaign views.
export function simulateDaily(creators) {
  const paid = creators.filter((c) => c.group === "paid" && c.wave).map((c) => ({ c, s: simulateCreator(c) }));
  const r = rng("daily");
  const days = [];
  for (let d = 1; d <= 70; d++) {
    const weekend = d % 7 === 6 || d % 7 === 0;
    const season = weekend ? 0.82 : 1;
    let views = 0;
    let lift = 0;
    for (const { s } of paid) {
      const since = d - s.launchDay;
      if (since >= 0 && since < 30) {
        const v = s.views30 * viewCurve(since);
        views += v;
        lift += (v / 1000) * 3.4; // attributed deploys plus a halo the referral codes miss
      }
    }
    const treated = Math.round((900 + between(r, -30, 30)) * season + lift);
    const control = Math.round((860 + between(r, -30, 30)) * season);
    days.push({ day: d, views: Math.round(views), treated, control, observed: d <= SIM_TODAY });
  }
  return days;
}

// Referral-code deploys in the first 7 days after each wave launch, summed by wave.
export function attributedByWave(creators) {
  const out = {};
  for (const c of creators) {
    const s = simulateCreator(c);
    if (!s) continue;
    let v = 0;
    for (let d = 0; d < 7; d++) v += s.views30 * viewCurve(d);
    out[c.wave] = (out[c.wave] ?? 0) + Math.round((v / 1000) * s.deploysPer1k);
  }
  return out;
}

export function differenceInDifferences(days, attributedByWave) {
  return WAVES.map((w) => {
    const pre = days.filter((d) => d.day >= w.day - 7 && d.day < w.day);
    const post = days.filter((d) => d.day >= w.day && d.day < w.day + 7);
    const observed = post.length && post.every((d) => d.observed);
    if (!observed) return { wave: w, observed: false };
    const avg = (arr, k) => arr.reduce((s, d) => s + d[k], 0) / arr.length;
    const did = avg(post, "treated") - avg(pre, "treated") - (avg(post, "control") - avg(pre, "control"));
    const incremental7d = Math.round(did * 7);
    const attributed = attributedByWave[w.id] ?? 0;
    return {
      wave: w,
      observed: true,
      didPerDay: did,
      incremental7d,
      attributed7d: attributed,
      haloRatio: attributed ? incremental7d / attributed : null,
    };
  });
}

export function simulateBounty() {
  const r = rng("bounty");
  const entries = 138;
  const flagged = Math.round(entries * between(r, 0.08, 0.12));
  const d7Deploys = 740;
  const firstDeploys = 1100;
  const signups = Math.round(firstDeploys / 0.45);
  const payout = d7Deploys * BOUNTY.perDeploy;
  return {
    entries,
    flagged,
    fraudRate: flagged / entries,
    creators: 97,
    signups,
    firstDeploys,
    d7Deploys,
    payout,
    costPerD7: payout / d7Deploys,
    reasons: [
      { reason: "had stopped running within a week", count: Math.round(flagged * 0.45) },
      { reason: "came from GitHub accounts under 30 days old", count: Math.round(flagged * 0.3) },
      { reason: "came from the same network or device", count: flagged - Math.round(flagged * 0.45) - Math.round(flagged * 0.3) },
    ],
  };
}

export function simulateBrandedSearch() {
  const r = rng("branded");
  const out = [];
  for (let d = 1; d <= SIM_TODAY; d++) {
    const base = 100 + between(r, -4, 4);
    const shipDay = WAVES[0].day;
    const bump = d >= shipDay && d < shipDay + 10 ? 14 * Math.exp(-(d - shipDay) / 5) : 0;
    out.push({ day: d, index: Math.round(base + bump) });
  }
  const pre = out.filter((x) => x.day >= WAVES[0].day - 7 && x.day < WAVES[0].day);
  const post = out.filter((x) => x.day >= WAVES[0].day && x.day < WAVES[0].day + 7);
  const avg = (a) => a.reduce((s, x) => s + x.index, 0) / a.length;
  return { series: out, lift: avg(post) / avg(pre) - 1 };
}

export { CONTROL_CATEGORIES };
