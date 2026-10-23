import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@vercel/postgres";
import { parsePrice, formatPKR } from "@/lib/price";

const resend = new Resend(process.env.RESEND_API_KEY);

const PAYMENT_METHODS = ["Cash on Delivery", "Card (Debit & Credit)", "Bank transfer", "Easypaisa"];
const MAX_QTY_PER_LINE = 20;
const MAX_LINES = 50;

class OrderError extends Error {}

type OrderLine = {
  id: string;
  size?: string;
  qty: number;
  name: string;
  price: string;
  imageUrl?: string;
};

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function generateOrderNumber(): string {
  const datePart = new Date()
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, ""); // YYMMDD
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString(); // 6 random digits
  return `${datePart}${randomPart}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanString(value: unknown, field: string, maxLen: number, required = true): string {
  if (value == null || value === "") {
    if (required) throw new OrderError(`Missing ${field}`);
    return "";
  }
  if (typeof value !== "string") throw new OrderError(`Invalid ${field}`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new OrderError(`Missing ${field}`);
  if (trimmed.length > maxLen) throw new OrderError(`${field} is too long`);
  return trimmed;
}

function parseOrder(body: Record<string, unknown>) {
  const paymentMethod = cleanString(body.paymentMethod, "payment method", 50);
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw new OrderError("Invalid payment method");

  if (!Array.isArray(body.items) || body.items.length === 0) throw new OrderError("Your cart is empty");
  if (body.items.length > MAX_LINES) throw new OrderError("Too many items in cart");

  // Merge duplicate id+size lines so stock checks see the full quantity
  const merged = new Map<string, { id: string; size?: string; qty: number }>();
  for (const raw of body.items as Record<string, unknown>[]) {
    const id = cleanString(raw?.id, "item id", 200);
    const size = cleanString(raw?.size, "item size", 20, false) || undefined;
    const qty = raw?.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new OrderError("Invalid item quantity");
    }
    const key = `${id}::${size ?? ""}`;
    const existing = merged.get(key);
    if (existing) existing.qty += qty;
    else merged.set(key, { id, size, qty });
  }

  return {
    contact: cleanString(body.contact, "contact", 200),
    firstName: cleanString(body.firstName, "first name", 100),
    lastName: cleanString(body.lastName, "last name", 100),
    address: cleanString(body.address, "address", 300),
    apartment: cleanString(body.apartment, "apartment", 200, false),
    city: cleanString(body.city, "city", 100),
    postalCode: cleanString(body.postalCode, "postal code", 20, false),
    phone: cleanString(body.phone, "phone", 30),
    paymentMethod,
    requested: [...merged.values()],
  };
}

export async function POST(req: NextRequest) {
  let order: ReturnType<typeof parseOrder>;
  try {
    order = parseOrder(await req.json());
  } catch (err) {
    const message = err instanceof OrderError ? err.message : "Invalid request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  const { contact, firstName, lastName, address, apartment, city, postalCode, phone, paymentMethod } = order;
  const orderNumber = generateOrderNumber();
  const initialStatus = paymentMethod === "Cash on Delivery" ? "processing" : "pending";
  const items: OrderLine[] = [];
  let subtotal = 0;
  let shipping = 0;
  let total = 0;

  const client = await db.connect();
  try {
    await client.sql`BEGIN`;

    // Prices, names and stock come from the database, never from the client.
    // FOR UPDATE locks the product rows so concurrent orders can't oversell.
    for (const line of order.requested) {
      const { rows } = await client.sql`
        SELECT id, name, price, image_url, sizes FROM products WHERE id = ${line.id} FOR UPDATE
      `;
      if (rows.length === 0) throw new OrderError("An item in your cart is no longer available");
      const product = rows[0];
      const sizes: Record<string, number> = product.sizes || {};

      if (line.size) {
        if (!(line.size in sizes)) {
          throw new OrderError(`Size ${line.size} isn't available for ${product.name}`);
        }
        if ((sizes[line.size] ?? 0) < line.qty) {
          throw new OrderError(`Not enough stock for ${product.name} (${line.size})`);
        }
      } else if (Object.keys(sizes).length > 0) {
        throw new OrderError(`Please choose a size for ${product.name}`);
      }

      items.push({
        id: product.id,
        size: line.size,
        qty: line.qty,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url || undefined,
      });
    }

    subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * item.qty, 0);
    shipping = items.length > 0 ? 300 : 0;
    total = subtotal + shipping;

    await client.sql`
      INSERT INTO orders (
        order_number, status, contact, first_name, last_name, address, apartment,
        city, postal_code, phone, payment_method, items, subtotal, shipping, total
      )
      VALUES (
        ${orderNumber}, ${initialStatus}, ${contact}, ${firstName}, ${lastName}, ${address}, ${apartment || null},
        ${city}, ${postalCode || null}, ${phone}, ${paymentMethod},
        ${JSON.stringify(items)}::jsonb, ${subtotal}, ${shipping}, ${total}
      )
    `;

    // Only decrement stock immediately for orders that start as "processing" (i.e. COD).
    // Orders awaiting payment confirmation ("pending") only decrement stock once
    // they're moved to "processing" from the ops app.
    if (initialStatus === "processing") {
      for (const item of items) {
        if (!item.size) continue;
        await client.sql`
          UPDATE products
          SET sizes = jsonb_set(sizes, ARRAY[${item.size}::text], to_jsonb((sizes->>${item.size})::int - ${item.qty}))
          WHERE id = ${item.id}
        `;
      }
    }

    await client.sql`COMMIT`;
  } catch (err) {
    await client.sql`ROLLBACK`.catch(() => {});
    if (err instanceof OrderError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 });
    }
    console.error("Order save error:", err);
    return NextResponse.json({ success: false, error: "Failed to place order" }, { status: 500 });
  } finally {
    client.release();
  }

  // Everything customer-supplied is escaped before it goes into email HTML
  const e = {
    contact: escapeHtml(contact),
    firstName: escapeHtml(firstName),
    lastName: escapeHtml(lastName),
    address: escapeHtml(address),
    apartment: escapeHtml(apartment),
    city: escapeHtml(city),
    postalCode: escapeHtml(postalCode),
    phone: escapeHtml(phone),
    paymentMethod: escapeHtml(paymentMethod),
  };
  const itemLabel = (item: OrderLine) => escapeHtml(item.size ? `${item.name} (${item.size})` : item.name);

  // The order is already saved, so an email failure must not tell the customer
  // it failed (they'd retry and place a duplicate order).
  try {
    const itemsRowsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;">
              <table cellpadding="0" cellspacing="0"><tr>
                ${
                  item.imageUrl
                    ? `<td style="width:56px;padding-right:12px;">
                        <img src="${escapeHtml(item.imageUrl)}" width="56" height="56" style="object-fit:cover;border-radius:2px;" />
                      </td>`
                    : ""
                }
                <td>
                  <div style="font-size:14px;color:#2A2420;">${itemLabel(item)}</div>
                  <div style="font-size:12px;color:#8A7B6C;">Qty ${item.qty}</div>
                </td>
              </tr></table>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;color:#2A2420;">
              ${formatPKR(parsePrice(item.price) * item.qty)}
            </td>
          </tr>`
      )
      .join("");

    const itemsRowsPlain = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${itemLabel(item)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.qty}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${formatPKR(parsePrice(item.price) * item.qty)}</td>
          </tr>`
      )
      .join("");

    // --- Email to Vextio (admin) ---
    await resend.emails.send({
      from: "Vextio Orders <orders@blackoutmc.xyz>",
      to: ["vynelia4@gmail.com", "mohsin.rasheed2010@gmail.com"],
      subject: `New order ${orderNumber} from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>New Order Received</h2>
          <p style="font-size:14px;color:#555;"><strong>Order #:</strong> ${orderNumber}</p>
          <h3>Contact</h3>
          <p>${e.contact}</p>
          <h3>Delivery</h3>
          <p>
            ${e.firstName} ${e.lastName}<br/>
            ${e.address}${apartment ? `, ${e.apartment}` : ""}<br/>
            ${e.city}${postalCode ? `, ${e.postalCode}` : ""}<br/>
            Pakistan<br/>
            Phone: ${e.phone}
          </p>
          <h3>Payment method</h3>
          <p>${e.paymentMethod}</p>
          <h3>Items</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #333;">Item</th>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #333;">Qty</th>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #333;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsRowsPlain}</tbody>
          </table>
          <table style="width:100%;margin-top:8px;">
            <tr><td style="padding:4px 12px;color:#555;">Subtotal</td><td style="text-align:right;padding:4px 12px;">${formatPKR(subtotal)}</td></tr>
            <tr><td style="padding:4px 12px;color:#555;">Shipping</td><td style="text-align:right;padding:4px 12px;">${formatPKR(shipping)}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;border-top:1px solid #333;">Total</td><td style="text-align:right;padding:4px 12px;font-weight:bold;border-top:1px solid #333;">${formatPKR(total)}</td></tr>
          </table>
        </div>
      `,
    });

    // --- Email to the customer ---
    if (contact.includes("@")) {
      await resend.emails.send({
        from: "Vextio <orders@blackoutmc.xyz>",
        to: contact,
        subject: `Your Vextio order ${orderNumber} is confirmed`,
        html: `
          <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2A2420;">
            <div style="padding: 32px 24px 16px;">
              <p style="font-size:20px;font-weight:700;letter-spacing:0.05em;margin:0 0 24px;">VEXTIO</p>
              <p style="font-size:18px;font-weight:600;margin:0 0 8px;">Thank you for your order, ${e.firstName}!</p>
              <p style="font-size:14px;color:#8A7B6C;margin:0 0 8px;">
                We're getting your order ready. You'll pay by Cash on Delivery when it arrives.
              </p>
              <p style="font-size:13px;color:#2A2420;background:#F5EFE6;display:inline-block;padding:6px 12px;border-radius:4px;margin:0;">
                Order #<strong>${orderNumber}</strong>
              </p>
            </div>

            <div style="padding: 0 24px;">
              <p style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#8A7B6C;margin:0 0 12px;">
                Order summary
              </p>
              <table style="width:100%;border-collapse:collapse;">
                <tbody>${itemsRowsHtml}</tbody>
              </table>
              <table style="width:100%;margin-top:12px;">
                <tr><td style="padding:4px 0;color:#8A7B6C;font-size:13px;">Subtotal</td><td style="text-align:right;padding:4px 0;font-size:13px;">${formatPKR(subtotal)}</td></tr>
                <tr><td style="padding:4px 0;color:#8A7B6C;font-size:13px;">Shipping</td><td style="text-align:right;padding:4px 0;font-size:13px;">${formatPKR(shipping)}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;border-top:1px solid #eee;">Total</td><td style="text-align:right;padding:8px 0;font-weight:bold;border-top:1px solid #eee;">${formatPKR(total)}</td></tr>
              </table>
            </div>

            <div style="padding: 8px 24px 24px;">
              <a href="${getSiteUrl()}/track/${orderNumber}" style="display:inline-block;background:#8A3418;color:#F5EFE6;text-decoration:none;padding:12px 28px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;border-radius:2px;">
                Track your order
              </a>
            </div>

            <div style="padding: 24px; margin-top: 8px;">
              <p style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#8A7B6C;margin:0 0 12px;">
                Delivery address
              </p>
              <p style="font-size:14px;line-height:1.6;margin:0;">
                ${e.firstName} ${e.lastName}<br/>
                ${e.address}${apartment ? `, ${e.apartment}` : ""}<br/>
                ${e.city}${postalCode ? `, ${e.postalCode}` : ""}<br/>
                Pakistan<br/>
                ${e.phone}
              </p>
            </div>

            <div style="padding: 0 24px 32px;">
              <p style="font-size:12px;color:#8A7B6C;margin:0;">
                Questions about your order? Reply to this email or call us at 03340927688.
              </p>
            </div>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error(`Order ${orderNumber} saved but email failed:`, error);
  }

  return NextResponse.json({ success: true, orderNumber });
}
