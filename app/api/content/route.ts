import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === process.env.ADMIN_SESSION_SECRET;
}

export async function GET() {
  const { rows } = await sql`SELECT * FROM site_content ORDER BY section, key`;
  return NextResponse.json(rows);
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, value } = await req.json();
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  await sql`
    UPDATE site_content
    SET value = ${value}, updated_at = NOW()
    WHERE key = ${key}
  `;

  return NextResponse.json({ success: true });
}
