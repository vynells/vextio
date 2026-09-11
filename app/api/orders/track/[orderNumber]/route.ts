import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;

  const { rows } = await sql`
    SELECT order_number, status, first_name, city, items, total, created_at, updated_at
    FROM orders
    WHERE order_number = ${orderNumber}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Only return non-sensitive fields — no address, phone, email, or payment details
  const order = rows[0];
  return NextResponse.json({
    orderNumber: order.order_number,
    status: order.status,
    firstName: order.first_name,
    city: order.city,
    items: order.items,
    total: order.total,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  });
}
