// Pulls live channel stats for every creator on the roster from the YouTube Data API.
// Median views = median lifetime views of the channel's 10 most recent long-form uploads that are at least 7 days old.
// Used by the daily refresh inside the app (src/instrumentation.js) and by scripts/sync-youtube.mjs.

import { CREATORS } from "./seed.js";

async function api(key, endpoint, params) {
  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${qs}`, { signal: AbortSignal.timeout(15000) });
  const body = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${res.status} ${body?.error?.message ?? ""}`);
  return body;
}

function seconds(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

async function channelFor(key, c, knownId) {
  const part = "snippet,statistics,contentDetails";
  if (knownId) return (await api(key, "channels", { part, id: knownId })).items?.[0];
  if (c.handle) {
    const hit = (await api(key, "channels", { part, forHandle: c.handle })).items?.[0];
    if (hit) return hit;
  }
  const found = (await api(key, "search", { part: "snippet", type: "channel", q: c.name, maxResults: "1" })).items?.[0];
  if (!found) return null;
  log(`[youtube] ${c.name}: matched by name search to "${found.snippet.channelTitle}" (review this match)`);
  return (await api(key, "channels", { part, id: found.snippet.channelId })).items?.[0];
}

async function statsFor(key, channel) {
  const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return { medianViews: null, sampled: 0, recent: [] };
  let ids = [];
  try {
    const items = (await api(key, "playlistItems", { part: "contentDetails", playlistId: uploads, maxResults: "50" })).items ?? [];
    ids = items.map((i) => i.contentDetails.videoId);
  } catch {
    // Some channels' uploads playlists aren't readable; fall back to search (costs more quota).
    const found = (await api(key, "search", { part: "id", channelId: channel.id, order: "date", type: "video", maxResults: "50" })).items ?? [];
    ids = found.map((i) => i.id.videoId).filter(Boolean);
  }
  if (!ids.length) return { medianViews: null, sampled: 0, recent: [] };
  const vids = (await api(key, "videos", { part: "statistics,contentDetails,snippet", id: ids.join(",") })).items ?? [];
  const weekAgo = Date.now() - 7 * 86_400_000;
  const longForm = vids
    .filter((v) => seconds(v.contentDetails.duration) > 180 && new Date(v.snippet.publishedAt).getTime() < weekAgo)
    .sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt))
    .slice(0, 10);
  // Views, likes and comments on each of those videos, oldest first. Used for the chart and the engagement check.
  const recent = [...longForm].reverse().map((v) => ({
    v: Number(v.statistics.viewCount || 0),
    l: Number(v.statistics.likeCount || 0),
    c: Number(v.statistics.commentCount || 0),
    d: v.snippet.publishedAt.slice(0, 10),
  }));
  return { medianViews: median(longForm.map((v) => Number(v.statistics.viewCount || 0))), sampled: longForm.length, recent };
}

export async function syncYouTube({ key, pool, log = console.log }) {
  const known = {};
  if (pool) {
    const { rows } = await pool.query("select slug, channel_id from creators");
    for (const r of rows) known[r.slug] = r.channel_id;
  }
  const out = {};
  let ok = 0;
  for (const c of CREATORS) {
    try {
      const ch = await channelFor(key, c, known[c.slug] || c.channelId);
      if (!ch) {
        log(`[youtube] ${c.name}: channel not found`);
        continue;
      }
      const { medianViews, sampled, recent } = await statsFor(key, ch);
      const subs = ch.statistics?.hiddenSubscriberCount ? null : Number(ch.statistics?.subscriberCount ?? 0) || null;
      out[c.slug] = {
        channelId: ch.id,
        channelTitle: ch.snippet.title,
        subs,
        medianViews,
        sampled,
        recent,
        syncedAt: new Date().toISOString(),
      };
      if (pool) {
        await pool.query(
          `update creators set channel_id=$2, channel_title=$3, subs_live=$4, median_views=$5, views_sampled=$6, recent=$7, synced_at=now(), updated_at=now()
           where slug=$1`,
          [c.slug, ch.id, ch.snippet.title, subs, medianViews, sampled, JSON.stringify(recent)],
        );
      }
      ok++;
      log(`[youtube] ${c.name} matched ${ch.snippet.title}: ${subs ?? "hidden"} subs, median ${medianViews ?? "-"} views (${sampled} videos)`);
    } catch (err) {
      log(`[youtube] ${c.name}: ${err.message}`);
    }
  }
  log(`[youtube] synced ${ok}/${CREATORS.length} creators`);
  return { out, ok, total: CREATORS.length };
}
