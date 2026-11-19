import pg from "pg";

const g = globalThis;

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!g.__shipStationPool) {
    g.__shipStationPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "1" ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return g.__shipStationPool;
}

export async function query(text, params = []) {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set");
  return pool.query(text, params);
}

export const SCHEMA = `
create table if not exists creators (
  slug text primary key,
  name text not null,
  handle text,
  channel_id text,
  channel_title text,
  grp text not null,
  wave int,
  series text,
  category text,
  subs_est bigint,
  subs_source text,
  subs_live bigint,
  median_views bigint,
  views_sampled int,
  synced_at timestamptz,
  sponsors text,
  template_slug text,
  status text not null default 'shortlisted',
  updated_at timestamptz not null default now()
);

alter table creators add column if not exists recent jsonb;

create table if not exists bounty_entries (
  id serial primary key,
  created_at timestamptz not null default now(),
  creator_name text not null,
  video_url text not null,
  template_url text not null,
  referral_code text,
  github_handle text not null,
  disclosure boolean not null,
  ip_hash text,
  status text not null,
  checks jsonb not null
);

create table if not exists agent_panel (
  id serial primary key,
  run_id text not null,
  run_at timestamptz not null default now(),
  agent text not null,
  model text,
  prompt_id text not null,
  stack text,
  prompt text,
  pick text,
  mentions text[],
  raw_excerpt text
);

create index if not exists agent_panel_run_idx on agent_panel (run_id);
`;
