import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { verifyResendWebhook } from "@/lib/verify-webhook";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const isValid = verifyResendWebhook(
    rawBody,
    req.headers.get("svix-id"),
    req.headers.get("svix-timestamp"),
    req.headers.get("svix-signature")
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
  }

  // The webhook payload doesn't include the body — fetch full content from Resend's API
  const detailRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });

  if (!detailRes.ok) {
    console.error("Failed to fetch received email detail:", await detailRes.text());
    return NextResponse.json({ error: "Failed to fetch email detail" }, { status: 502 });
  }

  const detail = await detailRes.json();

  const fromHeader: string = detail.from || event.data.from || "";
  const fromEmailMatch = fromHeader.match(/<(.+)>/);
  const fromEmail = fromEmailMatch ? fromEmailMatch[1] : fromHeader;
  const fromName = fromEmailMatch ? fromHeader.replace(/<.+>/, "").trim() : null;

  await sql`
    INSERT INTO support_messages (from_email, from_name, subject, body_text, body_html, status)
    VALUES (
      ${fromEmail},
      ${fromName || null},
      ${detail.subject || event.data.subject || "(no subject)"},
      ${detail.text || null},
      ${detail.html || null},
      'open'
    )
  `;

  return NextResponse.json({ received: true });
}
