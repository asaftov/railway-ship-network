# heroku-to-railway

An agent skill that moves a Heroku app to Railway: it reads the Procfile, `app.json` and add-ons, writes a migration plan and a draft `.railway/railway.ts`, and applies nothing until the user confirms.

Install for Claude Code, Cursor, Codex and other agents that read Agent Skills:

```bash
npx skills add asaftov/railway-ship-network
```

Then ask your agent: "Move this app from Heroku to Railway."

Try the planner on the bundled example:

```bash
cd skills/heroku-to-railway/examples/rails-sidekiq
node ../../scripts/plan.mjs --repo acme/rails-app --healthcheck /up
```

In the Ship Network campaign this is the asset behind the single Heroku Takeout episode.
