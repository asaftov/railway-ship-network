// Creates tables and upserts the creator roster. Safe to run on every boot.
import { getPool, SCHEMA } from "../src/lib/db.js";
import fs from "node:fs";
import { CREATORS } from "../src/lib/seed.js";

const STATS = JSON.parse(fs.readFileSync(new URL("../src/lib/channel-stats.json", import.meta.url), "utf8"));

const pool = getPool();
if (!pool) {
  console.log("[migrate] DATABASE_URL not set; skipping. The app will run on seed data.");
  process.exit(0);
}

try {
  await pool.query(SCHEMA);
  for (const c of CREATORS) {
    await pool.query(
      `insert into creators (slug, name, handle, grp, wave, series, category, subs_est, subs_source, sponsors)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (slug) do update set
         name = excluded.name,
         handle = coalesce(creators.handle, excluded.handle),
         grp = excluded.grp,
         wave = excluded.wave,
         series = excluded.series,
         category = excluded.category,
         subs_est = excluded.subs_est,
         subs_source = excluded.subs_source,
         sponsors = excluded.sponsors,
         updated_at = now()`,
      [c.slug, c.name, c.handle, c.group, c.wave, c.series, c.category, c.subsEst, c.subsSource, c.sponsors],
    );
    // Start from the last committed YouTube sync until the daily refresh in the app updates it.
    const st = STATS[c.slug];
    await pool.query(
      `update creators set
         channel_id = coalesce(channel_id, $2),
         channel_title = coalesce(channel_title, $3),
         subs_live = coalesce(subs_live, $4),
         median_views = coalesce(median_views, $5),
         views_sampled = coalesce(views_sampled, $6),
         synced_at = coalesce(synced_at, $7)
       where slug = $1`,
      [c.slug, st?.channelId ?? c.channelId ?? null, st?.channelTitle ?? null, st?.subs ?? null, st?.medianViews ?? null, st?.sampled ?? null, st?.syncedAt ?? null],
    );
  }
  console.log(`[migrate] schema ready, ${CREATORS.length} creators upserted`);
} catch (err) {
  console.error("[migrate] failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
