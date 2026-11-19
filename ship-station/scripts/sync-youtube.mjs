// Refreshes creator channel stats by hand. The running app also does this once a day (src/instrumentation.js).
// With --write-json it rewrites src/lib/channel-stats.json, which the app uses when no database is connected.

import fs from "node:fs";
import { getPool } from "../src/lib/db.js";
import { syncYouTube } from "../src/lib/youtube.js";

const key = process.env.YOUTUBE_API_KEY;
if (!key) {
  console.log("[youtube] YOUTUBE_API_KEY is not set, so there is nothing to sync.");
  process.exit(0);
}

const pool = getPool();
const { out } = await syncYouTube({ key, pool });

if (process.argv.includes("--write-json")) {
  const file = new URL("../src/lib/channel-stats.json", import.meta.url);
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log(`[youtube] wrote ${file.pathname}`);
}
if (pool) await pool.end();
