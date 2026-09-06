import { sql } from "@vercel/postgres";

export type SiteContent = Record<string, string>;

export async function getSiteContent(): Promise<SiteContent> {
  const { rows } = await sql`SELECT key, value FROM site_content`;
  const content: SiteContent = {};
  for (const row of rows) {
    content[row.key] = row.value;
  }
  return content;
}
