import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

// The shipping fee set in Vextio Orders, so checkout shows what the order will really cost.
export async function GET() {
  try {
    const { shipping_fee } = await getSettings();
    return NextResponse.json({ fee: Number(shipping_fee) || 0 });
  } catch {
    return NextResponse.json({ fee: 300 });
  }
}
