import { getPool, query } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST results from agent-pick-panel/run.mjs.
// Body: { runId, agent, model?, results: [{ promptId, stack, prompt, pick, mentions, excerpt }] }
export async function POST(request) {
  const token = process.env.ADMIN_TOKEN;
  const auth = request.headers.get("authorization") || "";
  if (!token || auth !== `Bearer ${token}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!getPool()) return Response.json({ error: "no database connected" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { runId, agent, model = null, results } = body ?? {};
  if (!runId || !agent || !Array.isArray(results) || !results.length) {
    return Response.json({ error: "runId, agent and results[] are required" }, { status: 400 });
  }

  let inserted = 0;
  for (const r of results.slice(0, 500)) {
    await query(
      `insert into agent_panel (run_id, agent, model, prompt_id, stack, prompt, pick, mentions, raw_excerpt)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        String(runId).slice(0, 64),
        String(agent).slice(0, 40),
        model ? String(model).slice(0, 80) : null,
        String(r.promptId ?? "").slice(0, 64),
        r.stack ? String(r.stack).slice(0, 120) : null,
        r.prompt ? String(r.prompt).slice(0, 1000) : null,
        r.pick ? String(r.pick).slice(0, 40) : null,
        Array.isArray(r.mentions) ? r.mentions.map((m) => String(m).slice(0, 40)).slice(0, 20) : [],
        r.excerpt ? String(r.excerpt).slice(0, 600) : null,
      ],
    );
    inserted++;
  }
  return Response.json({ ok: true, inserted });
}

export async function GET() {
  if (!getPool()) return Response.json({ rows: [] });
  const { rows } = await query(
    "select run_id, agent, prompt_id, stack, pick from agent_panel order by run_at desc limit 500",
  );
  return Response.json({ rows });
}
