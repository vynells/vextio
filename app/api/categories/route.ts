import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === process.env.ADMIN_SESSION_SECRET;
}

export async function GET() {
  const { rows } = await sql`
    SELECT * FROM categories ORDER BY sort_order, name
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, sortOrder } = await req.json();
  if (!id || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await sql`
    INSERT INTO categories (id, name, sort_order)
    VALUES (${id}, ${name}, ${sortOrder || 0})
  `;

  return NextResponse.json({ success: true });
}
