import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sql } from "@vercel/postgres";
import { parsePrice, formatPKR } from "@/lib/price";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOrderNumber(): string {
  const datePart = new Date()
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, ""); // YYMMDD
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString(); // 6 random digits
  return `${datePart}${randomPart}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contact,
      firstName,
      lastName,
      address,
      apartment,
      city,
      postalCode,
      phone,
      paymentMethod,
      items,
    } = body;

    const orderNumber = generateOrderNumber();

    const subtotal = items.reduce(
      (sum: number, item: { price: string; qty: number }) =>
        sum + parsePrice(item.price) * item.qty,
      0
    );
    const shipping = items.length > 0 ? 300 : 0;
    const total = subtotal + shipping;

    // --- Save the order to the database ---
    await sql`
      INSERT INTO orders (
        order_number, status, contact, first_name, last_name, address, apartment,
        city, postal_code, phone, payment_method, items, subtotal, shipping, total
      )
      VALUES (
        ${orderNumber}, 'pending', ${contact}, ${firstName}, ${lastName}, ${address}, ${apartment || null},
        ${city}, ${postalCode || null}, ${phone}, ${paymentMethod},
        ${JSON.stringify(items)}::jsonb, ${subtotal}, ${shipping}, ${total}
      )
    `;

    // --- Decrement stock quantity for each sized item ordered ---
    for (const item of items as { id: string; size?: string; qty: number }[]) {
      if (!item.size) continue; // sizeless items don't track per-size stock
      try {
        const { rows } = await sql`SELECT sizes FROM products WHERE id = ${item.id}`;
        if (rows.length === 0) continue;
        const currentSizes: Record<string, number> = rows[0].sizes || {};
        const currentQty = currentSizes[item.size] ?? 0;
        const newQty = Math.max(0, currentQty - (item.qty || 1));
        const updatedSizes = { ...currentSizes, [item.size]: newQty };
        await sql`
          UPDATE products SET sizes = ${JSON.stringify(updatedSizes)}::jsonb WHERE id = ${item.id}
        `;
      } catch (stockErr) {
        console.error(`Failed to update stock for ${item.id} size ${item.size}:`, stockErr);
      }
    }

    const itemsRowsHtml = items
      .map(
        (item: { name: string; price: string; qty: number; imageUrl?: string }) =>
          `<tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;">
              <table cellpadding="0" cellspacing="0"><tr>
                ${
                  item.imageUrl
                    ? `<td style="width:56px;padding-right:12px;">
                        <img src="${item.imageUrl}" width="56" height="56" style="object-fit:cover;border-radius:2px;" />
                      </td>`
                    : ""
                }
                <td>
                  <div style="font-size:14px;color:#2A2420;">${item.name}</div>
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
        (item: { name: string; price: string; qty: number }) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
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
          <p>${contact}</p>
          <h3>Delivery</h3>
          <p>
            ${firstName} ${lastName}<br/>
            ${address}${apartment ? `, ${apartment}` : ""}<br/>
            ${city}${postalCode ? `, ${postalCode}` : ""}<br/>
            Pakistan<br/>
            Phone: ${phone}
          </p>
          <h3>Payment method</h3>
          <p>${paymentMethod}</p>
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
    if (contact && contact.includes("@")) {
      await resend.emails.send({
        from: "Vextio <orders@blackoutmc.xyz>",
        to: contact,
        subject: `Your Vextio order ${orderNumber} is confirmed`,
        html: `
          <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2A2420;">
            <div style="padding: 32px 24px 16px;">
              <p style="font-size:20px;font-weight:700;letter-spacing:0.05em;margin:0 0 24px;">VEXTIO</p>
              <p style="font-size:18px;font-weight:600;margin:0 0 8px;">Thank you for your order, ${firstName}!</p>
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

            <div style="padding: 24px; margin-top: 8px;">
              <p style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#8A7B6C;margin:0 0 12px;">
                Delivery address
              </p>
              <p style="font-size:14px;line-height:1.6;margin:0;">
                ${firstName} ${lastName}<br/>
                ${address}${apartment ? `, ${apartment}` : ""}<br/>
                ${city}${postalCode ? `, ${postalCode}` : ""}<br/>
                Pakistan<br/>
                ${phone}
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

    return NextResponse.json({ success: true, orderNumber });
  } catch (error) {
    console.error("Order email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send order email" },
      { status: 500 }
    );
  }
}