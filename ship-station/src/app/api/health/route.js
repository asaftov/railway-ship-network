import { getPool, query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = "not configured";
  if (getPool()) {
    try {
      await query("select 1");
      db = "ok";
    } catch {
      db = "error";
    }
  }
  return Response.json({ ok: true, db });
}
