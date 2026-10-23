import { Resend } from "resend";

export const mailConfigured = Boolean(process.env.RESEND_API_KEY);
export const resend = new Resend(process.env.RESEND_API_KEY);
export const ORDERS_FROM = "Vextio <orders@blackoutmc.xyz>";
export const SUPPORT_FROM = "Vextio Support <help@blackoutmc.xyz>";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

type MailOrder = {
  order_number: string;
  first_name: string;
  contact: string;
  courier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

export type MailKind = "processing" | "shipped" | "delivered" | "cancelled" | "returned" | "note";

/** Subject and body (already HTML-safe) for each email the team can send from the app. */
function content(kind: MailKind, o: MailOrder, message: string) {
  const n = escapeHtml(o.order_number);
  const name = escapeHtml(o.first_name);
  const extra = message ? `<p style="font-size:14px;line-height:1.6;margin:16px 0 0;white-space:pre-line;">${escapeHtml(message)}</p>` : "";
  switch (kind) {
    case "processing":
      return {
        subject: `Payment received for your Vextio order ${o.order_number}`,
        heading: "We’ve got your payment",
        body: `Hi ${name}, your payment for order <strong>#${n}</strong> is confirmed. We’re packing it up now.${extra}`,
      };
    case "shipped": {
      const courier = o.courier ? ` with <strong>${escapeHtml(o.courier)}</strong>` : "";
      const tracking = o.tracking_number ? `<br/>Tracking number: <strong>${escapeHtml(o.tracking_number)}</strong>` : "";
      const link = o.tracking_url && /^https?:\/\//.test(o.tracking_url)
        ? `<br/><a href="${escapeHtml(o.tracking_url)}" style="color:#8A3418;">Track it with the courier</a>`
        : "";
      return {
        subject: `Your Vextio order ${o.order_number} is on its way`,
        heading: "Your order is on its way",
        body: `Hi ${name}, order <strong>#${n}</strong> has shipped${courier}.${tracking}${link}${extra}`,
      };
    }
    case "delivered":
      return {
        subject: `Your Vextio order ${o.order_number} was delivered`,
        heading: "Delivered",
        body: `Hi ${name}, order <strong>#${n}</strong> has been delivered. Thanks for shopping with Vextio.${extra}`,
      };
    case "cancelled":
      return {
        subject: `Your Vextio order ${o.order_number} has been cancelled`,
        heading: "Your order has been cancelled",
        body: `Hi ${name}, your order <strong>#${n}</strong> has been cancelled. If you weren't expecting this or have any questions, reply to this email or call us at 03340927688.${extra}`,
      };
    case "returned":
      return {
        subject: `Your Vextio order ${o.order_number} has been marked as returned`,
        heading: "Your order has been returned",
        body: `Hi ${name}, your order <strong>#${n}</strong> has been marked as returned. If you have any questions about this, reply to this email or call us at 03340927688.${extra}`,
      };
    case "note":
      return {
        subject: `An update on your Vextio order ${o.order_number}`,
        heading: "An update on your order",
        body: `Hi ${name}, here’s an update on order <strong>#${n}</strong>:${extra}`,
      };
  }
}

function html(heading: string, body: string, orderNumber: string) {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2A2420;">
      <div style="padding: 32px 24px;">
        <p style="font-size:20px;font-weight:700;letter-spacing:0.05em;margin:0 0 24px;">VEXTIO</p>
        <p style="font-size:18px;font-weight:600;margin:0 0 12px;">${heading}</p>
        <p style="font-size:14px;color:#2A2420;line-height:1.6;margin:0;">${body}</p>
        <a href="${siteUrl()}/track/${encodeURIComponent(orderNumber)}" style="display:inline-block;margin-top:24px;background:#8A3418;color:#F5EFE6;text-decoration:none;padding:12px 28px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;border-radius:2px;">
          Track your order
        </a>
      </div>
    </div>
  `;
}

/** Emails the customer about their order. Returns false (never throws) when it can't. */
export async function emailCustomer(o: MailOrder, kind: MailKind, message = ""): Promise<boolean> {
  if (!mailConfigured || !o.contact?.includes("@")) return false;
  const c = content(kind, o, message);
  try {
    const { error } = await resend.emails.send({
      from: ORDERS_FROM,
      to: o.contact,
      subject: c.subject,
      html: html(c.heading, c.body, o.order_number),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Email (${kind}) for order ${o.order_number} failed:`, err);
    return false;
  }
}
