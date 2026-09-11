import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === process.env.ADMIN_SESSION_SECRET;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
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

  const extraImages: string[] =
    Array.isArray(extraImageUrls) && extraImageUrls.length > 0 ? extraImageUrls : [];

  await sql`
    UPDATE products
    SET name = ${name}, detail = ${detail}, price = ${price},
        badge = ${badge || null}, image_url = ${imageUrl},
        back_image_url = ${backImageUrl || null},
        extra_image_urls = ${JSON.stringify(extraImages)}::jsonb,
        category_id = ${categoryId || null},
        subcategory_id = ${subcategoryId || null}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await sql`DELETE FROM products WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
