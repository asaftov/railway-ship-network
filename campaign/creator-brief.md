# Ship Network: creator brief

*A draft for the Ship Network concept. It is not an official Railway document.*

**Build it with AI. Ship it on Railway.**

You record a video of building a real app with an AI coding agent and deploying it on Railway. Viewers get a one-click link to deploy the exact app you built. You get paid up front. You keep earning when people use your template.

## What is fixed

Two things are fixed.

1. The deploy is shown on screen in one take. There is no cut at the deploy step.
2. The video ends on your template link. The link carries your referral code.

We also suggest adding the "Fork this app on Railway" badge to your app's footer. People who find the app later can then deploy their own copy.

Everything else is yours: the idea, the stack, the tone, the script and how you talk about Railway. We review only the deploy segment. We check it only for accuracy.

## Format

- One long-form video of 8 to 20 minutes.
- One 45 to 60 second cut for Shorts, X or TikTok. It ends on the deploy.

Pick a series or pitch your own idea:

| Series | For | Example titles |
|---|---|---|
| Zero to Live | People building with AI who stall at "now put it online" | "I gave Claude Code one prompt and 60 minutes. Here's what's live." or "I built a SaaS on a free VM with no account and no card" |
| Real Stack | Working developers | "FastAPI, Postgres and workers deployed on one canvas" or "Deploying an AI agent with a queue, a cron job and a database" |
| Heroku Takeout | Teams on Heroku | "Moving a real Heroku app with my AI in an afternoon" (uses the `heroku-to-railway` agent skill) |

## How to build and ship it

- **No-setup start:** `ssh railway.new` gives you a free VM with coding agents installed. It needs no account or card. It is limited to three per network per day. Use it for your own build and send viewers to your template link.
- **Local start:** install Railway's agent tools with `railway setup agent`. In Claude Code you can run `/plugin install railway@claude-plugins-official` instead.
- **Deploy:** `railway up`.
- **Publish the template:** use "Generate Template" in your project. You can also run `railway templates create` and then `railway templates publish`. Publish it under your own account so the template kickbacks go to you.
- **Your link:** `https://railway.com/deploy/<your-template>?referralCode=<your code>&utm_source=<you>&utm_medium=video&utm_campaign=ship-network`. Ship Station generates the link and the badge code for you.

## What you earn

| | |
|---|---|
| Flat fee | Priced at about $50 per 1,000 median views on your recent long-form videos |
| Affiliate | 15% of what the customers you refer pay Railway, for 12 months |
| Template kickbacks | A share of usage on your template for as long as it's live. The base rate is 15%. It rises to 25% for open-source templates where you answer questions |

Keep the template live and working for 12 months.

## Disclosure

Say clearly in the video that it's sponsored by Railway. Put it in the description and turn on YouTube's paid-promotion setting. Affiliate and kickback earnings count as a paid relationship too.

## The October security incident

You'll likely get questions in the comments. These facts come from Railway's incident report (blog.railway.com/p/incident-report-october-security-incident):

- An attacker decrypted a subset of customer variables between October 20 and 21, 2026. At most 1.85% of workspaces were affected. That is about 100,000.
- New signups were paused on October 22 and reopened on November 2.
- Every build now runs in its own short-lived virtual machine. Railway also rebuilt its CI and secret storage.

Whether and how you mention it is up to you. We won't script it or ask you to defend Railway. Tell us if you want to cover how variables and secrets are handled on Railway today. We'll get you an engineer to check your segment for accuracy.

We read comments on every campaign video weekly. We'll talk with you before any follow-up video if more than a quarter of them turn on the incident. That isn't a penalty. Your fee doesn't change.

## Timeline

| When | What |
|---|---|
| 3 weeks before Ship Day | Brief, fee and series agreed |
| 1 week before Ship Day | Template published and tested. We check the deploy segment |
| Ship Day at 16:00 UTC | Everyone publishes |
| 1 week after Ship Day | You get your numbers: how many people deployed your app, how many of those apps are still running and what you earned |

## Exclusivity

No sponsored deploy segments for Render, Vercel, Fly.io or Heroku for 4 weeks either side of your Railway video.
