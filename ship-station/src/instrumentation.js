// Runs once when the server starts. If a YouTube key and a database are set, it refreshes creator
// channel stats when they are more than a day old, then checks again every hour.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.YOUTUBE_API_KEY || !process.env.DATABASE_URL) return;
  if (globalThis.__shipStationSync) return;
  globalThis.__shipStationSync = true;

  const { getPool } = await import("./lib/db.js");
  const { syncYouTube } = await import("./lib/youtube.js");
  const DAY = 24 * 60 * 60 * 1000;
  let running = false;

  async function refreshIfStale() {
    if (running) return;
    running = true;
    try {
      const pool = getPool();
      const { rows } = await pool.query("select max(synced_at) as last from creators");
      const last = rows[0]?.last ? new Date(rows[0].last).getTime() : 0;
      if (Date.now() - last > DAY) await syncYouTube({ key: process.env.YOUTUBE_API_KEY, pool });
    } catch (err) {
      console.error("[youtube] daily refresh failed:", err.message);
    } finally {
      running = false;
    }
  }

  setTimeout(refreshIfStale, 30_000);
  setInterval(refreshIfStale, 60 * 60 * 1000).unref();
}
