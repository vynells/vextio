import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const itemsHtml = items
      .map(
        (item: { name: string; price: string; qty: number }) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.qty}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.price}</td>
          </tr>`
      )
      .join("");

    await resend.emails.send({
      from: "Vextio Orders <onboarding@resend.dev>",
      to: "mohsin.rasheed2010@gmail.com",
      subject: `New order from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>New Order Received</h2>

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
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send order email" },
      { status: 500 }
    );
  }
}
