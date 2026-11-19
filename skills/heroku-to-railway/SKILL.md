---
name: heroku-to-railway
description: Move a Heroku app to Railway. Use when the user asks to migrate, move or switch an app from Heroku to Railway, or to translate a Procfile, app.json, Heroku add-ons or Heroku Scheduler jobs into Railway services. Plans first, generates a draft .railway/railway.ts, and changes nothing without the user's confirmation.
---

# Heroku to Railway

Move a Heroku app to Railway in four phases: inspect, plan, apply, cut over. Never skip the plan, and never delete or scale down the Heroku app. The user does that after verifying Railway.

## 1. Inspect (read-only)

From the app's repository:

- Read `Procfile`, `app.json`, `heroku.yml` if present, and the runtime manifest (`Gemfile`, `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`).
- If the Heroku CLI is installed and logged in, ask for the app name and run:
  - `heroku apps:info -a <app> --json`
  - `heroku addons -a <app> --json > addons.json`
  - `heroku ps -a <app>` (dyno types and counts)
  - Do **not** print config var values. To count them: `heroku config -a <app> --json | jq 'keys | length'`.
- Heroku Scheduler jobs are not exposed by the CLI. Ask the user to copy each job's command and frequency from the Scheduler dashboard.

## 2. Plan (no changes)

Run the planner bundled with this skill:

```bash
node <skill-dir>/scripts/plan.mjs --dir . --addons addons.json --healthcheck <path-if-known>
```

It prints a migration plan and a draft `.railway/railway.ts` (Railway Infrastructure as Code). Mapping rules:

| Heroku | Railway |
|---|---|
| `web` process | `web` service with a public domain; Railway sets `PORT` |
| other processes (`worker`, `clock`, …) | one service each; Railway runs one process per service |
| `release` process | `preDeploy` command on the web service |
| `heroku-postgresql` | `postgres()` database, `DATABASE_URL` referenced, not copied |
| `heroku-redis`, Redis Cloud | `redis()` database |
| Heroku Scheduler job | its own service with `deploy.cronSchedule` and `restartPolicyType: "NEVER"`; the command must exit |
| Other add-ons | keep the external account, copy its config vars |

Show the user the plan and the draft. Resolve every `REPLACE_WITH_…` placeholder and confirm the GitHub `owner/repo`. Ask before continuing.

## 3. Apply (only after the user confirms)

Check flags with `railway <command> --help` before running anything; the CLI changes often.

1. `railway login`, then `railway init` for a new project or `railway link` for an existing one.
2. Save the draft as `.railway/railway.ts`, add the SDK with `npm i -D railway`, then `railway config plan`. Show the plan output. Run `railway config apply` only after the user agrees.
3. Config vars: have the user run `heroku config --shell -a <app>`, remove `DATABASE_URL` and `REDIS_URL` (Railway provides them), and paste the rest into each service's **Variables**, then **Raw Editor**. Don't echo secrets into the conversation.
4. Watch the first deploy with `railway logs`. Fix build or start errors before touching data.

## 4. Data and cutover (maintenance window, user present)

1. `heroku maintenance:on -a <app>`
2. `heroku pg:backups:capture -a <app>`
3. `curl -o latest.dump "$(heroku pg:backups:url -a <app>)"`
4. `pg_restore --verbose --no-owner --no-acl -d "<Railway Postgres public URL>" latest.dump`
5. Compare row counts for the largest tables between Heroku and Railway.
6. Add the custom domain to the Railway web service, update DNS, and confirm traffic.
7. Leave the Heroku app in maintenance mode, not deleted, until the user signs off.

## Rules

- Dry run first, every time. No `railway config apply`, data restore or DNS change without explicit confirmation.
- Never print secrets.
- If Heroku Connect, Private Spaces or Shield are in use, stop and tell the user these need a manual design: there is no one-step equivalent.
