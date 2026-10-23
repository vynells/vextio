import { sql } from "@vercel/postgres";

// Tables and columns the Vextio Orders desktop app needs on top of the shop's own.
// Created on first use, so there's nothing to run by hand.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    login TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    key TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS order_events (
    id SERIAL PRIMARY KEY,
    order_number TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT,
    message TEXT NOT NULL DEFAULT '',
    actor TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS order_events_number ON order_events (order_number)`,
  `CREATE TABLE IF NOT EXISTS shop_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT`,
  // Whether this order's items have been taken out of stock, so cancelling puts them back exactly once.
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_taken BOOLEAN`,
  `UPDATE orders SET stock_taken = (status IN ('processing', 'shipped', 'delivered')) WHERE stock_taken IS NULL`,
];

const g = globalThis as unknown as { __vextioSchema?: Promise<void> };

export function ensureSchema() {
  g.__vextioSchema ??= (async () => {
    for (const stmt of SCHEMA) await sql.query(stmt);
  })().catch((err) => {
    g.__vextioSchema = undefined;
    throw err;
  });
  return g.__vextioSchema;
}

/** Runs a parameterised query ($1, $2…) and returns its rows. */
export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const { rows } = await sql.query(text, params as never[]);
  return rows as T[];
}

// ---- Shop settings ----

export type ShopSettings = { shipping_fee: string; notify_emails: string };
const DEFAULTS: ShopSettings = {
  shipping_fee: "300",
  notify_emails: "vynelia4@gmail.com, mohsin.rasheed2010@gmail.com",
};

export async function getSettings(): Promise<ShopSettings> {
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM shop_settings");
  const saved = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...saved };
}

export async function saveSettings(patch: Partial<ShopSettings>) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    await q(
      "INSERT INTO shop_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, value]
    );
  }
}

export const notifyList = (s: ShopSettings) =>
  s.notify_emails.split(/[,\s]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
