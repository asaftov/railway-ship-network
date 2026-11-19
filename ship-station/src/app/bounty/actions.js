"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getPool, query } from "@/lib/db";
import { BOUNTY } from "@/lib/campaign";

const VIDEO_HOSTS = new Set([
  "youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be",
  "x.com", "twitter.com", "tiktok.com", "www.tiktok.com", "dev.to",
]);

function parseUrl(v) {
  try {
    return new URL(v);
  } catch {
    return null;
  }
}

function youtubeId(u) {
  if (!u) return null;
  if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
  if (!u.hostname.endsWith("youtube.com")) return null;
  if (u.searchParams.get("v")) return u.searchParams.get("v");
  const m = u.pathname.match(/^\/(shorts|live|embed)\/([\w-]{6,})/);
  return m ? m[2] : null;
}

async function githubAccount(handle) {
  const url = `https://api.github.com/users/${encodeURIComponent(handle)}`;
  const base = { "User-Agent": "ship-station", Accept: "application/vnd.github+json" };
  const get = (headers) => fetch(url, { headers, signal: AbortSignal.timeout(5000), cache: "no-store" });
  try {
    let res = await get(process.env.GITHUB_TOKEN ? { ...base, Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : base);
    // A bad or expired token should not block the check, so try again without it.
    if (res.status === 401 && process.env.GITHUB_TOKEN) res = await get(base);
    if (res.status === 404) return { exists: false };
    if (!res.ok) return { error: "GitHub didn't respond. This one gets checked by hand." };
    const j = await res.json();
    const days = Math.floor((Date.now() - new Date(j.created_at).getTime()) / 86_400_000);
    return { exists: true, days };
  } catch {
    return { error: "GitHub didn't respond. This one gets checked by hand." };
  }
}

async function youtubeVideo(id) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { skipped: true };
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,paidProductPlacementDetails&id=${encodeURIComponent(id)}&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) return { error: "YouTube didn't respond. This one gets checked by hand." };
    const j = await res.json();
    const item = j.items?.[0];
    if (!item) return { exists: false };
    const text = `${item.snippet.title}\n${item.snippet.description}`.toLowerCase();
    return {
      exists: true,
      title: item.snippet.title,
      mentionsRailway: text.includes("railway"),
      linksTemplate: /railway\.(com|app)\/(deploy|template|new\/template)\//.test(text),
      paidPlacement: item.paidProductPlacementDetails?.hasPaidProductPlacement ?? null,
    };
  } catch {
    return { error: "YouTube didn't respond. This one gets checked by hand." };
  }
}

export async function submitEntry(_prev, formData) {
  const creator = String(formData.get("creator") || "").trim().slice(0, 120);
  const videoUrl = String(formData.get("videoUrl") || "").trim().slice(0, 500);
  const templateUrl = String(formData.get("templateUrl") || "").trim().slice(0, 500);
  const github = String(formData.get("github") || "").trim().replace(/^@/, "").slice(0, 39);
  const disclosure = formData.get("disclosure") === "on";
  // The form's example entries run every check but are never saved.
  const example = formData.get("example") === "1";

  if (!creator || !videoUrl || !templateUrl || !github) {
    return { error: "Fill in every field." };
  }

  const checks = [];
  const add = (label, state, detail) => checks.push({ label, state, detail });

  const vu = parseUrl(videoUrl);
  add("Video is on YouTube, X, TikTok or dev.to", vu && VIDEO_HOSTS.has(vu.hostname) ? "ok" : "fail", vu ? vu.hostname : "Not a valid link");

  const tu = parseUrl(templateUrl);
  const isTemplate = !!tu && /(^|\.)railway\.(com|app)$/.test(tu.hostname) && /^\/(deploy|template|new\/template)\//.test(tu.pathname);
  add("Link points to a published Railway template", isTemplate ? "ok" : "fail", tu ? `${tu.hostname}${tu.pathname}` : "Not a valid link");
  const referral = tu?.searchParams.get("referralCode") || null;
  add("Template link carries the creator's referral code", referral ? "ok" : "fail", referral ?? "Add ?referralCode= and the creator's code to the link");

  add("Paid relationship disclosed in the video", disclosure ? "ok" : "fail", disclosure ? "Confirmed by the creator" : "Required for every paid video");

  const gh = await githubAccount(github);
  const ghLabel = `GitHub account at least ${BOUNTY.minGithubAgeDays} days old`;
  if (gh.error) add(ghLabel, "pending", gh.error);
  else if (!gh.exists) add(ghLabel, "fail", "No account with that name");
  else add(ghLabel, gh.days >= BOUNTY.minGithubAgeDays ? "ok" : "fail", `Created ${gh.days} days ago`);

  const ytId = youtubeId(vu);
  if (ytId) {
    const yt = await youtubeVideo(ytId);
    if (yt.skipped) add("Video exists, mentions Railway and links the template", "pending", "Runs once a YouTube API key is set");
    else if (yt.error) add("Video exists, mentions Railway and links the template", "pending", yt.error);
    else if (!yt.exists) add("Video exists and is public", "fail", "Not found or private");
    else {
      add("Video mentions Railway", yt.mentionsRailway ? "ok" : "fail", yt.title);
      add("Description links a Railway template", yt.linksTemplate ? "ok" : "fail", yt.linksTemplate ? "Found" : "No template link in the description");
      add("YouTube paid-promotion setting is on", yt.paidPlacement ? "ok" : "fail", yt.paidPlacement == null ? "YouTube didn't say" : (yt.paidPlacement ? "On" : "Off"));
    }
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(`ship-station:${ip}`).digest("hex").slice(0, 16);
  const pool = getPool();
  if (pool) {
    try {
      const { rows } = await query(
        "select count(*)::int as n from bounty_entries where ip_hash = $1 and created_at > now() - interval '1 day'",
        [ipHash],
      );
      add(`No more than ${BOUNTY.maxEntriesPerIpPerDay} entries per network per day`, rows[0].n < BOUNTY.maxEntriesPerIpPerDay ? "ok" : "fail", `${rows[0].n} so far today`);
    } catch {
      // table missing or db down; the insert below will report it
    }
  }

  add("App still running with real traffic a week later", "pending", "Checked against Railway deploy events a week after each deploy");
  add("Deploys come from separate real accounts", "pending", "Checked against Railway signup data before any payout");

  const status = checks.some((c) => c.state === "fail") ? "rejected" : "accepted";

  let stored = false;
  if (pool && !example) {
    try {
      await query(
        `insert into bounty_entries (creator_name, video_url, template_url, referral_code, github_handle, disclosure, ip_hash, status, checks)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [creator, videoUrl, templateUrl, referral, github, disclosure, ipHash, status, JSON.stringify(checks)],
      );
      stored = true;
      revalidatePath("/bounty");
    } catch (err) {
      console.error("[bounty] insert failed:", err.message);
    }
  }

  return { status, checks, stored, example };
}
