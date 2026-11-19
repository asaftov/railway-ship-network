// Railway Infrastructure as Code for the Ship Network project: one Next.js service and one Postgres database.
// Apply with: railway link && railway config plan && railway config apply
import { defineRailway, github, postgres, preserve, project, service } from "railway/iac";

export default defineRailway(() => {
  const db = postgres("postgres");

  // Secrets are set in the dashboard. preserve() keeps whatever value is already there.
  // The app refreshes YouTube stats itself once a day, so there is no separate cron service.
  const web = service("ship-station", {
    source: github("asaftov/railway-ship-network", { rootDirectory: "ship-station" }),
    start: "npx next start",
    preDeploy: "node scripts/migrate.mjs",
    healthcheck: "/api/health",
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      YOUTUBE_API_KEY: preserve(),
      ADMIN_TOKEN: preserve(),
      TEMPLATE_URL: preserve(),
      REFERRAL_CODE: preserve(),
    },
  });

  return project("ship-network", { resources: [db, web] });
});
