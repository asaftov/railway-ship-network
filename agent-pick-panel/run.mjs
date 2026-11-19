#!/usr/bin/env node
// Agent Pick Panel: asks coding agents where to deploy a fixed set of projects and records which host each picks.
//
// Usage:
//   node agent-pick-panel/run.mjs --agents claude,codex [--post https://<ship-station>/api/agent-panel --token $ADMIN_TOKEN]
//
// Each prompt runs in a fresh empty folder, so the agent sees nothing but the prompt. Agents are told not to run
// commands, and Claude Code additionally has its file and shell tools disabled. Results are written to
// agent-pick-panel/results/<run-id>.jsonl and optionally posted to Ship Station.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(here, "../ship-station/src/lib/agent-prompts.json"), "utf8"));

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return acc;
  }, []),
);

const AGENTS = {
  claude: {
    bin: "claude",
    argv: (text) => ["-p", text, "--output-format", "text", "--disallowedTools", "Bash", "Edit", "Write", "WebFetch", "WebSearch"],
  },
  codex: {
    bin: "codex",
    argv: (text) => ["exec", "--sandbox", "read-only", "--skip-git-repo-check", text],
  },
  cursor: {
    bin: "cursor-agent",
    argv: (text) => ["-p", text, "--output-format", "text"],
  },
};

const wanted = String(args.agents || "claude").split(",").map((s) => s.trim()).filter(Boolean);
const only = args.only ? String(args.only).split(",") : null;
const timeoutMs = Number(args.timeout || 240) * 1000;
const runId = args["run-id"] || `run-${new Date().toISOString().slice(0, 10)}`;
const outDir = path.join(here, "results");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${runId}.jsonl`);

function available(bin) {
  return spawnSync(process.platform === "win32" ? "where" : "which", [bin], { encoding: "utf8" }).status === 0;
}

const hostPattern = (h) => new RegExp(`\\b${h.replace(".", "\\.")}\\b`, "i");

function parse(text) {
  const first = /Platform:\s*\**\s*([A-Za-z.\s]+?)\s*(\*|\n|$|\(|,|—|-)/i.exec(text);
  let pick = null;
  if (first) pick = config.hosts.find((h) => first[1].toLowerCase().startsWith(h.toLowerCase())) ?? first[1].trim();
  const mentions = config.hosts
    .map((h) => ({ h, i: text.search(hostPattern(h)) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.h);
  if (!pick) pick = mentions[0] ?? null;
  return { pick, mentions };
}

const results = {};
for (const agentName of wanted) {
  const agent = AGENTS[agentName];
  if (!agent) {
    console.error(`unknown agent "${agentName}" (known: ${Object.keys(AGENTS).join(", ")})`);
    continue;
  }
  if (!available(agent.bin)) {
    console.error(`skipping ${agentName}: "${agent.bin}" not found on PATH`);
    continue;
  }
  results[agentName] = [];
  for (const p of config.prompts) {
    if (only && !only.includes(p.id)) continue;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pick-${p.id}-`));
    const text = `${p.prompt}\n\n${config.instruction}`;
    const started = Date.now();
    const r = spawnSync(agent.bin, agent.argv(text), { cwd: dir, encoding: "utf8", timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 });
    const out = `${r.stdout || ""}`.trim();
    const { pick, mentions } = parse(out);
    const row = {
      runId,
      agent: agentName,
      promptId: p.id,
      stack: p.stack,
      prompt: p.prompt,
      pick,
      mentions,
      excerpt: out.slice(0, 600),
      seconds: Math.round((Date.now() - started) / 1000),
      error: r.error ? r.error.message : r.status ? `exit ${r.status}: ${(r.stderr || "").slice(0, 200)}` : null,
    };
    results[agentName].push(row);
    fs.appendFileSync(outFile, JSON.stringify(row) + "\n");
    console.log(`${agentName.padEnd(7)} ${p.id.padEnd(18)} → ${pick ?? "(no pick)"}${row.error ? `  [${row.error}]` : ""}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const all = Object.values(results).flat();
const tally = {};
for (const r of all) tally[r.pick ?? "none"] = (tally[r.pick ?? "none"] ?? 0) + 1;
console.log("\npick share:", Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h} ${n}/${all.length}`).join(", "));
console.log(`saved ${outFile}`);

if (args.post && all.length) {
  for (const [agent, rows] of Object.entries(results)) {
    if (!rows.length) continue;
    const res = await fetch(args.post, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${args.token || process.env.ADMIN_TOKEN}` },
      body: JSON.stringify({ runId, agent, results: rows }),
    });
    console.log(`posted ${agent}: ${res.status} ${await res.text()}`);
  }
}
