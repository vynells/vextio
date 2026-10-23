// The API behind the Vextio Orders desktop app. Every route except login needs the app's token.
import { put } from "@vercel/blob";
import { db } from "@vercel/postgres";
import { getSettings, notifyList, q, saveSettings, type ShopSettings } from "@/lib/db";
import { emailCustomer, mailConfigured, resend, siteUrl, SUPPORT_FROM, type MailKind } from "@/lib/order-mail";
import {
  appToken, bootstrapOwner, clientIp, hashPassword, passwordProblem, rateLimit, staffFromRequest, verifyPassword, type Staff,
} from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error: string, status = 400, fields?: Record<string, string>) => json({ error, fields }, status);
const s = (b: Body, k: string, max = 500) => String(b[k] ?? "").trim().slice(0, max);
const who = (m: Staff) => m.name || m.login;

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"] as const;
type Status = (typeof STATUSES)[number];
const isStatus = (v: string): v is Status => (STATUSES as readonly string[]).includes(v);
// Orders in these statuses have their items taken out of stock.
const TAKES_STOCK: Status[] = ["processing", "shipped", "delivered"];
const NEEDS_ACTION = "status IN ('pending', 'processing')";

type Item = { id: string; name: string; price: string; qty: number; size?: string; imageUrl?: string };
type OrderRow = {
  id: number; order_number: string; status: Status; contact: string; first_name: string; last_name: string;
  address: string; apartment: string | null; city: string; postal_code: string | null; phone: string;
  payment_method: string; items: Item[]; subtotal: string | number; shipping: string | number; total: string | number;
  courier: string | null; tracking_number: string | null; tracking_url: string | null; stock_taken: boolean | null;
  created_at: string; updated_at: string | null;
};

/** The shape the app works with. */
function toOrder(o: OrderRow) {
  const items = Array.isArray(o.items) ? o.items : [];
  return {
    number: o.order_number,
    name: `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim(),
    first_name: o.first_name, last_name: o.last_name,
    email: o.contact?.includes("@") ? o.contact : "",
    contact: o.contact,
    phone: o.phone, city: o.city, address: o.address, apartment: o.apartment ?? "", postal_code: o.postal_code ?? "",
    payment: o.payment_method,
    items: items.map((i) => ({ ...i, qty: Number(i.qty) || 1 })),
    summary: items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""}${Number(i.qty) > 1 ? ` ×${i.qty}` : ""}`).join(", "),
    subtotal: Number(o.subtotal) || 0, shipping: Number(o.shipping) || 0, total: Number(o.total) || 0,
    status: o.status,
    courier: o.courier ?? "", tracking_number: o.tracking_number ?? "", tracking_url: o.tracking_url ?? "",
    created_at: o.created_at, updated_at: o.updated_at ?? o.created_at,
  };
}

const getOrder = async (number: string) =>
  (await q<OrderRow>("SELECT * FROM orders WHERE order_number = $1", [number]))[0];

const addEvent = (number: string, e: { kind: string; status?: string | null; message?: string; actor: string }) =>
  q("INSERT INTO order_events (order_number, kind, status, message, actor) VALUES ($1, $2, $3, $4, $5)",
    [number, e.kind, e.status ?? null, e.message ?? "", e.actor]);

/** Moves an order to a new status, taking items out of stock or putting them back as needed. */
async function setStatus(o: OrderRow, status: Status, patch?: { courier: string; tracking_number: string; tracking_url: string }) {
  const take = TAKES_STOCK.includes(status) && !o.stock_taken;
  const giveBack = !TAKES_STOCK.includes(status) && !!o.stock_taken;
  const short: string[] = [];

  const client = await db.connect();
  try {
    await client.sql`BEGIN`;
    if (take || giveBack) {
      for (const item of o.items ?? []) {
        if (!item.size) continue;
        const qty = Number(item.qty) || 1;
        const { rows } = await client.sql`SELECT sizes FROM products WHERE id = ${item.id} FOR UPDATE`;
        if (rows.length === 0) continue;
        const sizes: Record<string, number> = rows[0].sizes || {};
        const have = Number(sizes[item.size] ?? 0);
        if (take && have < qty) short.push(`${item.name} (${item.size})`);
        const next = take ? Math.max(0, have - qty) : have + qty;
        await client.sql`UPDATE products SET sizes = ${JSON.stringify({ ...sizes, [item.size]: next })}::jsonb WHERE id = ${item.id}`;
      }
    }
    const stockTaken = take ? true : giveBack ? false : o.stock_taken;
    if (patch) {
      await client.sql`
        UPDATE orders SET status = ${status}, stock_taken = ${stockTaken}, courier = ${patch.courier || null},
          tracking_number = ${patch.tracking_number || null}, tracking_url = ${patch.tracking_url || null}, updated_at = NOW()
        WHERE id = ${o.id}`;
    } else {
      await client.sql`UPDATE orders SET status = ${status}, stock_taken = ${stockTaken}, updated_at = NOW() WHERE id = ${o.id}`;
    }
    await client.sql`COMMIT`;
  } catch (err) {
    await client.sql`ROLLBACK`.catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  return { short, restocked: giveBack };
}

const slugify = (text: string) => text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 100);

const httpsUrl = (v: unknown) => {
  const u = String(v ?? "").trim();
  return /^https:\/\/\S+$/.test(u) && u.length < 1000 ? u : "";
};

/** Checks and tidies a product sent from the app. Returns an error message when something's wrong. */
function productFields(body: Body) {
  const name = s(body, "name", 120);
  if (!name) return "Give the product a name.";
  const sizes: Record<string, number> = {};
  if (body.sizes && typeof body.sizes === "object") {
    for (const [k, n] of Object.entries(body.sizes as Record<string, unknown>)) {
      const size = k.trim().toUpperCase().slice(0, 12);
      const qty = Math.round(Number(n));
      if (size && Number.isFinite(qty) && qty >= 0) sizes[size] = Math.min(qty, 100000);
    }
  }
  const extras = Array.isArray(body.extra_image_urls) ? body.extra_image_urls.map(httpsUrl).filter(Boolean).slice(0, 12) : [];
  return {
    name,
    detail: s(body, "detail", 200) || "—",
    price: s(body, "price", 40) || "—",
    badge: s(body, "badge", 30) || null,
    image_url: httpsUrl(body.image_url) || "https://placehold.co/400x500/1C1917/9B9188?text=No+image",
    back_image_url: httpsUrl(body.back_image_url) || null,
    extra_image_urls: extras,
    description: s(body, "description", 4000) || null,
    sizes,
    size_chart_url: httpsUrl(body.size_chart_url) || null,
    category_id: s(body, "category_id", 120) || null,
    subcategory_id: s(body, "subcategory_id", 120) || null,
  };
}

async function supportReady() {
  const [r] = await q<{ ok: boolean }>("SELECT to_regclass('public.support_messages') IS NOT NULL AS ok");
  return r.ok;
}

async function handle(req: Request, path: string[]) {
  const method = req.method;
  const body: Body = method === "POST" ? await req.json().catch(() => ({})) : {};
  const [a, b, c] = path;

  // ---- Sign in ----
  if (method === "POST" && a === "login") {
    const login = s(body, "login", 200).toLowerCase(), password = String(body.password ?? "");
    if (!login || !password) return fail("Enter your username and password.");
    if (!(await rateLimit(`app:${clientIp(req)}`, 10, 15))) return fail("Too many attempts. Wait 15 minutes and try again.", 429);
    let [row] = await q<{ id: number; password_hash: string }>("SELECT id, password_hash FROM staff WHERE login = $1", [login]);
    if (row && !(await verifyPassword(password, row.password_hash))) row = undefined as never;
    if (!row) row = (await bootstrapOwner(login, password)) as typeof row;
    if (!row) return fail("That username and password don’t match.", 401);
    await q("UPDATE staff SET last_login_at = NOW() WHERE id = $1", [row.id]);
    const [me] = await q<Staff>("SELECT id, login, name, role FROM staff WHERE id = $1", [row.id]);
    return json({ token: appToken(row), me });
  }

  const me = await staffFromRequest(req);
  if (!me) return fail("Please sign in again.", 401);

  if (method === "GET" && a === "me") return json({ me, mail: mailConfigured });

  // ---- Lightweight check for new activity (polled every 20 s) ----
  if (method === "GET" && a === "pulse") {
    const recent = await q<{ order_number: string; first_name: string; last_name: string; status: string; total: string; items: Item[] }>(
      "SELECT order_number, first_name, last_name, status, total, items FROM orders WHERE COALESCE(updated_at, created_at) > NOW() - interval '3 days' ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 30");
    const [{ n }] = await q<{ n: number }>(`SELECT COUNT(*)::int AS n FROM orders WHERE ${NEEDS_ACTION}`);
    let support: { id: number; from_name: string; from_email: string; subject: string }[] = [];
    let openSupport = 0;
    if (await supportReady()) {
      support = await q("SELECT id, from_name, from_email, subject FROM support_messages WHERE status = 'open' ORDER BY created_at DESC LIMIT 20");
      openSupport = (await q<{ n: number }>("SELECT COUNT(*)::int AS n FROM support_messages WHERE status = 'open'"))[0].n;
    }
    return json({
      action: n,
      support: openSupport,
      recent: recent.map((o) => ({
        number: o.order_number, name: `${o.first_name} ${o.last_name}`.trim(), status: o.status, total: Number(o.total) || 0,
        items: (o.items ?? []).map((i) => i.name).join(", "),
      })),
      messages: support,
    });
  }

  // ---- Orders ----
  if (method === "GET" && a === "orders" && !b) {
    const rows = await q<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC LIMIT 2000");
    return json({ orders: rows.map(toOrder) });
  }

  if (a === "orders" && b) {
    const number = decodeURIComponent(b).replace(/^#/, "").trim();
    const o = await getOrder(number);
    if (!o) return fail("Order not found.", 404);

    if (method === "GET" && !c) {
      const [events, [{ n: previous }]] = await Promise.all([
        q("SELECT id, kind, status, message, actor, created_at FROM order_events WHERE order_number = $1 ORDER BY created_at", [number]),
        q<{ n: number }>("SELECT COUNT(*)::int AS n FROM orders WHERE LOWER(contact) = LOWER($1) AND id <> $2", [o.contact, o.id]),
      ]);
      const placed = { id: 0, kind: "status", status: o.payment_method === "Cash on Delivery" ? "processing" : "pending",
        message: `Order placed · ${o.payment_method}`, actor: "Customer", created_at: o.created_at };
      return json({ order: toOrder(o), events: [placed, ...events], previous, trackingPage: `${siteUrl()}/track/${o.order_number}`, mail: mailConfigured });
    }

    if (method === "POST" && c === "status") {
      const status = s(body, "status", 30);
      if (!isStatus(status)) return fail("Unknown status.");
      if (status === o.status) return fail("The order is already in that status.");
      const patch = status === "shipped"
        ? { courier: s(body, "courier", 80), tracking_number: s(body, "tracking_number", 80), tracking_url: s(body, "tracking_url", 400) }
        : undefined;
      if (patch?.tracking_url && !/^https?:\/\//.test(patch.tracking_url)) return fail("Check the tracking link.", 400, { tracking_url: "Tracking links start with https://" });
      const message = s(body, "message", 1000);
      const { short, restocked } = await setStatus(o, status, patch);
      await addEvent(number, { kind: "status", status, message, actor: who(me) });

      let emailed = false;
      if (body.notify === true && status !== "pending") {
        emailed = await emailCustomer({ ...o, ...patch }, status as MailKind, message);
        if (emailed) await addEvent(number, { kind: "email", message: "Emailed the customer.", actor: who(me) });
      }
      const parts = [emailed ? "Updated and emailed the customer." : "Updated."];
      if (restocked) parts.push("Items are back in stock.");
      if (short.length) parts.push(`Heads up: not enough stock for ${short.join(", ")}. Stock is now 0.`);
      return json({ ok: parts.join(" ") });
    }

    if (method === "POST" && c === "note") {
      const message = s(body, "message", 2000);
      if (message.length < 2) return fail("Write a note first.", 400, { message: "Write a note first." });
      await addEvent(number, { kind: "note", message, actor: who(me) });
      const emailed = body.notify === true ? await emailCustomer(o, "note", message) : false;
      if (emailed) await addEvent(number, { kind: "email", message: "Emailed the note to the customer.", actor: who(me) });
      return json({ ok: emailed ? "Note added and emailed to the customer." : "Note added. Only the team can see it." });
    }

    if (method === "POST" && c === "details") {
      const v = {
        first_name: s(body, "first_name", 100), last_name: s(body, "last_name", 100), phone: s(body, "phone", 30),
        address: s(body, "address", 300), apartment: s(body, "apartment", 200), city: s(body, "city", 100), postal_code: s(body, "postal_code", 20),
      };
      if (!v.first_name || v.address.length < 4 || v.city.length < 2) return fail("Name, address and city are needed.");
      await q(
        "UPDATE orders SET first_name = $2, last_name = $3, phone = $4, address = $5, apartment = $6, city = $7, postal_code = $8, updated_at = NOW() WHERE id = $1",
        [o.id, v.first_name, v.last_name, v.phone, v.address, v.apartment || null, v.city, v.postal_code || null]
      );
      await addEvent(number, { kind: "note", message: "Delivery details edited.", actor: who(me) });
      return json({ ok: "Details saved." });
    }
  }

  // ---- Customers ----
  if (method === "GET" && a === "customers") {
    const customers = await q(`
      SELECT LOWER(contact) AS contact,
        (ARRAY_AGG(first_name || ' ' || last_name ORDER BY created_at DESC))[1] AS name,
        (ARRAY_AGG(phone ORDER BY created_at DESC))[1] AS phone,
        (ARRAY_AGG(city ORDER BY created_at DESC))[1] AS city,
        COUNT(*)::int AS orders,
        COALESCE(SUM(total) FILTER (WHERE status IN ('processing', 'shipped', 'delivered')), 0)::int AS spent,
        MAX(created_at) AS last
      FROM orders GROUP BY LOWER(contact) ORDER BY MAX(created_at) DESC LIMIT 1000`);
    return json({ customers });
  }

  // ---- Stock ----
  if (method === "GET" && a === "stock") {
    const products = await q("SELECT id, name, image_url, price, sizes FROM products ORDER BY name ASC");
    return json({ products });
  }
  if (method === "POST" && a === "stock") {
    const productId = s(body, "productId", 200), size = s(body, "size", 20), qty = Math.round(Number(body.qty));
    if (!productId || !size || !Number.isFinite(qty) || qty < 0 || qty > 100000) return fail("Enter a stock number of 0 or more.");
    const client = await db.connect();
    try {
      await client.sql`BEGIN`;
      const { rows } = await client.sql`SELECT name, sizes FROM products WHERE id = ${productId} FOR UPDATE`;
      if (rows.length === 0) { await client.sql`ROLLBACK`; return fail("Product not found.", 404); }
      const sizes = { ...(rows[0].sizes || {}), [size]: qty };
      await client.sql`UPDATE products SET sizes = ${JSON.stringify(sizes)}::jsonb WHERE id = ${productId}`;
      await client.sql`COMMIT`;
      return json({ ok: `${rows[0].name} (${size}) set to ${qty}.`, sizes });
    } catch (err) {
      await client.sql`ROLLBACK`.catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  // ---- Products ----
  if (method === "GET" && a === "products") {
    const [products, categories, subcategories] = await Promise.all([
      q("SELECT * FROM products ORDER BY created_at DESC"),
      q("SELECT id, name, sort_order FROM categories ORDER BY sort_order, name"),
      q("SELECT id, category_id, name, sort_order FROM subcategories ORDER BY sort_order, name"),
    ]);
    return json({ products, categories, subcategories });
  }
  if (method === "POST" && a === "products") {
    const id = b ? decodeURIComponent(b) : slugify(s(body, "id", 120) || s(body, "name", 120));
    if (b && c === "delete") {
      const [p] = await q<{ name: string }>("DELETE FROM products WHERE id = $1 RETURNING name", [id]);
      return p ? json({ ok: `${p.name} deleted.` }) : fail("Product not found.", 404);
    }
    const v = productFields(body);
    if (typeof v === "string") return fail(v, 400, { name: v });
    if (!b) {
      if (!id) return fail("Give the product a name.", 400, { name: "Give the product a name." });
      const [taken] = await q("SELECT id FROM products WHERE id = $1", [id]);
      if (taken) return fail("A product with that ID already exists.", 400, { id: "Pick a different ID." });
      await q(
        `INSERT INTO products (id, name, detail, price, badge, image_url, back_image_url, extra_image_urls, description, sizes, size_chart_url, category_id, subcategory_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10::jsonb, $11, $12, $13)`,
        [id, v.name, v.detail, v.price, v.badge, v.image_url, v.back_image_url, v.extra_image_urls, v.description, JSON.stringify(v.sizes), v.size_chart_url, v.category_id, v.subcategory_id]
      );
      return json({ ok: `${v.name} added to the shop.`, id });
    }
    const [p] = await q(
      `UPDATE products SET name = $2, detail = $3, price = $4, badge = $5, image_url = $6, back_image_url = $7,
         extra_image_urls = $8::text[], description = $9, sizes = $10::jsonb, size_chart_url = $11, category_id = $12, subcategory_id = $13
       WHERE id = $1 RETURNING id`,
      [id, v.name, v.detail, v.price, v.badge, v.image_url, v.back_image_url, v.extra_image_urls, v.description, JSON.stringify(v.sizes), v.size_chart_url, v.category_id, v.subcategory_id]
    );
    return p ? json({ ok: "Product saved.", id }) : fail("Product not found.", 404);
  }

  // ---- Shop sections (categories and subcategories) ----
  if (method === "POST" && a === "categories") {
    if (b && c === "delete") {
      await q("DELETE FROM subcategories WHERE category_id = $1", [decodeURIComponent(b)]);
      await q("DELETE FROM categories WHERE id = $1", [decodeURIComponent(b)]);
      return json({ ok: "Section removed. Its products are kept." });
    }
    const name = s(body, "name", 80);
    if (!name) return fail("Name the section.", 400, { name: "Name the section." });
    const [{ n }] = await q<{ n: number }>("SELECT COALESCE(MAX(sort_order), 0)::int + 1 AS n FROM categories");
    await q("INSERT INTO categories (id, name, sort_order) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING", [slugify(name), name, n]);
    return json({ ok: `${name} added.` });
  }
  if (method === "POST" && a === "subcategories") {
    if (b && c === "delete") {
      await q("DELETE FROM subcategories WHERE id = $1", [decodeURIComponent(b)]);
      return json({ ok: "Removed. Its products are kept." });
    }
    const name = s(body, "name", 80), categoryId = s(body, "categoryId", 120);
    if (!name || !categoryId) return fail("Pick a section and a name.");
    const [{ n }] = await q<{ n: number }>("SELECT COALESCE(MAX(sort_order), 0)::int + 1 AS n FROM subcategories WHERE category_id = $1", [categoryId]);
    await q("INSERT INTO subcategories (id, category_id, name, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
      [`${categoryId}-${slugify(name)}`, categoryId, name, n]);
    return json({ ok: `${name} added.` });
  }

  // ---- Photo upload (the app sends a resized JPEG as base64) ----
  if (method === "POST" && a === "upload") {
    const data = String(body.data ?? "");
    const type = s(body, "type", 40) || "image/jpeg";
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return fail("Only JPG, PNG or WebP photos.");
    const bytes = Buffer.from(data, "base64");
    if (bytes.length < 100 || bytes.length > 4_000_000) return fail("That photo is too big. Try a smaller one.");
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const name = slugify(s(body, "name", 80).replace(/\.[a-z0-9]+$/i, "")) || "photo";
    const blob = await put(`products/${Date.now()}-${name}.${ext}`, bytes, { access: "public", contentType: type });
    return json({ url: blob.url });
  }

  // ---- Support ----
  if (a === "support") {
    if (!(await supportReady())) {
      return method === "GET" && !b ? json({ messages: [], available: false }) : fail("Support messages aren’t set up on this shop.", 404);
    }
    if (method === "GET" && !b) {
      const messages = await q("SELECT id, from_name, from_email, subject, body_text, status, created_at, replied_at FROM support_messages ORDER BY created_at DESC LIMIT 500");
      return json({ messages, available: true });
    }
    const id = Number(b);
    const [m] = await q<{ id: number; from_email: string; subject: string | null }>("SELECT id, from_email, subject FROM support_messages WHERE id = $1", [id]);
    if (!m) return fail("Message not found.", 404);
    if (method === "POST" && c === "reply") {
      const text = s(body, "text", 10000);
      if (text.length < 2) return fail("Write a reply first.", 400, { text: "Write a reply first." });
      if (!mailConfigured) return fail("Email isn’t set up (RESEND_API_KEY is missing).", 503);
      const { error } = await resend.emails.send({ from: SUPPORT_FROM, to: m.from_email, subject: `Re: ${m.subject || "Your message to Vextio"}`, text });
      if (error) { console.error("Support reply failed:", error); return fail("Couldn’t send the reply. Try again.", 502); }
      await q("UPDATE support_messages SET status = 'replied', replied_at = NOW() WHERE id = $1", [id]);
      return json({ ok: `Reply sent to ${m.from_email}.` });
    }
    if (method === "POST" && c === "status") {
      const status = s(body, "status", 20);
      if (!["open", "replied", "closed"].includes(status)) return fail("Unknown status.");
      await q("UPDATE support_messages SET status = $2 WHERE id = $1", [id, status]);
      return json({ ok: status === "closed" ? "Closed." : status === "open" ? "Reopened." : "Updated." });
    }
  }

  // ---- Settings and team ----
  if (method === "GET" && a === "settings") {
    const [settings, team] = await Promise.all([
      getSettings(),
      q("SELECT id, login, name, role, last_login_at FROM staff ORDER BY role DESC, created_at"),
    ]);
    return json({ settings, team, me, mail: { on: mailConfigured, provider: "Resend" }, site: siteUrl() });
  }
  if (method === "POST" && a === "settings") {
    const fee = Math.round(Number(body.shipping_fee));
    const patch: Partial<ShopSettings> = {
      shipping_fee: String(Number.isFinite(fee) ? Math.min(100000, Math.max(0, fee)) : 300),
      notify_emails: s(body, "notify_emails", 500),
    };
    if (notifyList({ shipping_fee: "", notify_emails: patch.notify_emails! }).length === 0) {
      return fail("Check the emails.", 400, { notify_emails: "Enter at least one email." });
    }
    await saveSettings(patch);
    return json({ ok: "Settings saved." });
  }
  if (method === "POST" && a === "team" && !b) {
    if (me.role !== "owner") return fail("Only the owner can add team members.", 403);
    const login = s(body, "login", 200).toLowerCase(), name = s(body, "name", 120), password = String(body.password ?? "");
    if (!/^[a-z0-9._@+-]{3,}$/.test(login)) return fail("Check the username.", 400, { login: "3+ letters or numbers, or an email." });
    if (passwordProblem(password)) return fail("Check the password.", 400, { password: passwordProblem(password) });
    const [taken] = await q("SELECT id FROM staff WHERE login = $1", [login]);
    if (taken) return fail("Already on the team.", 400, { login: "This person already has access." });
    await q("INSERT INTO staff (login, name, password_hash, role) VALUES ($1, $2, $3, 'staff')", [login, name, await hashPassword(password)]);
    return json({ ok: `${name || login} can now sign in. Share the password with them privately.` });
  }
  if (method === "POST" && a === "team" && b === "remove") {
    const id = Number(body.id);
    if (me.role !== "owner" || id === me.id) return fail("You can’t remove this person.", 403);
    await q("DELETE FROM staff WHERE id = $1 AND role <> 'owner'", [id]);
    return json({ ok: "Removed." });
  }
  if (method === "POST" && a === "password") {
    const [row] = await q<{ password_hash: string }>("SELECT password_hash FROM staff WHERE id = $1", [me.id]);
    if (!(await verifyPassword(String(body.current ?? ""), row.password_hash))) return fail("Check your current password.", 400, { current: "That’s not your current password." });
    const next = String(body.password ?? "");
    if (passwordProblem(next)) return fail("Check the new password.", 400, { password: passwordProblem(next) });
    const [u] = await q<{ id: number; password_hash: string }>("UPDATE staff SET password_hash = $2 WHERE id = $1 RETURNING id, password_hash", [me.id, await hashPassword(next)]);
    return json({ ok: "Password changed. Other devices have been signed out.", token: appToken(u) });
  }

  return fail("Not found.", 404);
}

const route = async (req: Request, ctx: { params: Promise<{ path: string[] }> }) => {
  try {
    return await handle(req, (await ctx.params).path);
  } catch (e) {
    console.error("[app api]", e);
    return fail("Something went wrong on the server.", 500);
  }
};
export { route as GET, route as POST };
