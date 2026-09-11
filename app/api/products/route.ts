import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

function toPgTextArray(arr: string[]): string {
  const escaped = arr.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === process.env.ADMIN_SESSION_SECRET;
}

export async function GET() {
  const { rows } = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    id,
    name,
    detail,
    price,
    badge,
    imageUrl,
    backImageUrl,
    extraImageUrls,
    categoryId,
    subcategoryId,
  } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const extraImages: string[] =
    Array.isArray(extraImageUrls) && extraImageUrls.length > 0 ? extraImageUrls : [];
  const extraImagesLiteral = toPgTextArray(extraImages);

  await sql`
    INSERT INTO products (
      id, name, detail, price, badge, image_url, back_image_url, extra_image_urls,
      category_id, subcategory_id
    )
    VALUES (
      ${id},
      ${name},
      ${detail || "—"},
      ${price || "—"},
      ${badge || null},
      ${imageUrl || "https://placehold.co/400x500/1C1917/9B9188?text=No+image"},
      ${backImageUrl || null},
      ${extraImagesLiteral}::text[],
      ${categoryId || null},
      ${subcategoryId || null}
    )
  `;

  return NextResponse.json({ success: true });
}
