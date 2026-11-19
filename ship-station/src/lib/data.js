import { getPool, query } from "./db.js";
import { CREATORS } from "./seed.js";
import STATS from "./channel-stats.json";
import { suggestedFee, referralCode } from "./campaign.js";

// Without a database, the app falls back to the roster plus the last committed YouTube sync.
function fromSeed(c) {
  const st = STATS[c.slug] ?? {};
  return {
    slug: c.slug,
    name: c.name,
    handle: c.handle,
    channelId: st.channelId ?? c.channelId ?? null,
    channelTitle: st.channelTitle ?? null,
    group: c.group,
    wave: c.wave,
    series: c.series,
    category: c.category,
    subsEst: c.subsEst,
    subsSource: c.subsSource,
    subsLive: st.subs ?? null,
    medianViews: st.medianViews ?? null,
    viewsSampled: st.sampled ?? null,
    recent: st.recent ?? [],
    avatar: c.avatar ?? null,
    syncedAt: st.syncedAt ?? null,
    sponsors: c.sponsors,
    templateSlug: null,
    status: "shortlisted",
  };
}

function fromRow(r) {
  return {
    slug: r.slug,
    name: r.name,
    // The seed holds the current handle. Older database rows can keep one the creator has since changed.
    handle: CREATORS.find((x) => x.slug === r.slug)?.handle ?? r.handle,
    channelId: r.channel_id,
    channelTitle: r.channel_title,
    group: r.grp,
    wave: r.wave,
    series: r.series,
    category: r.category,
    subsEst: r.subs_est == null ? null : Number(r.subs_est),
    subsSource: r.subs_source,
    subsLive: r.subs_live == null ? null : Number(r.subs_live),
    medianViews: r.median_views == null ? null : Number(r.median_views),
    viewsSampled: r.views_sampled,
    recent: Array.isArray(r.recent) && r.recent.length && r.recent[0].l != null ? r.recent : STATS[r.slug]?.recent ?? [],
    avatar: CREATORS.find((x) => x.slug === r.slug)?.avatar ?? null,
    syncedAt: r.synced_at,
    sponsors: r.sponsors,
    templateSlug: r.template_slug,
    status: r.status,
  };
}

// Fees are fixed at booking. They are priced from the saved November 18 snapshot, so they do not move when the
// daily refresh updates each channel's views.
function enrich(c) {
  const pricedViews = STATS[c.slug]?.medianViews ?? c.medianViews;
  const { fee, basis } = suggestedFee(pricedViews);
  return { ...c, fee, feeBasis: basis, pricedViews, referralCode: referralCode(c.slug) };
}

const ORDER = { paid: 0, reserve: 1, comparison: 2 };

export async function getCreators() {
  let list;
  let source = "seed";
  if (getPool()) {
    try {
      const { rows } = await query("select * from creators");
      if (rows.length) {
        list = rows.map(fromRow);
        source = "db";
      }
    } catch (err) {
      console.error("[data] creators query failed, using seed:", err.message);
    }
  }
  if (!list) list = CREATORS.map(fromSeed);
  list.sort((a, b) => ORDER[a.group] - ORDER[b.group] || (a.wave ?? 9) - (b.wave ?? 9) || a.name.localeCompare(b.name));
  return { creators: list.map(enrich), source };
}

export async function getCreator(slug) {
  const { creators, source } = await getCreators();
  return { creator: creators.find((c) => c.slug === slug) ?? null, source };
}

export async function getBountyEntries(limit = 50) {
  if (!getPool()) return { entries: [], dbReady: false };
  try {
    const { rows } = await query("select * from bounty_entries order by created_at desc limit $1", [limit]);
    return { entries: rows, dbReady: true };
  } catch (err) {
    console.error("[data] bounty query failed:", err.message);
    return { entries: [], dbReady: false };
  }
}

export async function getAgentPanel() {
  if (!getPool()) return { rows: [], runs: [], dbReady: false };
  try {
    const { rows } = await query("select * from agent_panel order by run_at desc, prompt_id asc limit 2000");
    const runs = [...new Map(rows.map((r) => [r.run_id, { runId: r.run_id, runAt: r.run_at }])).values()];
    return { rows, runs, dbReady: true };
  } catch (err) {
    console.error("[data] agent panel query failed:", err.message);
    return { rows: [], runs: [], dbReady: false };
  }
}
