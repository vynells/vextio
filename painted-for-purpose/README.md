# Painted For Purpose (P4P) website

Next.js 15 · React 19 · Tailwind 3 · TypeScript. A standalone app inside this repo. Nothing here touches the Vextio site at the repo root.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + type check
```

## Where things live

| Path | What |
| --- | --- |
| `lib/site.ts` | **Every link, number and placeholder.** Edit this first. |
| `PLAN.md` | The plan of action. All site copy is sourced from it. |
| `app/` | Pages: `/`, `/about`, `/impact`, `/shop`, `/join`, plus 404, OG image, favicon, sitemap, robots. |
| `components/` | Nav, footer, the P4P mark, the drawn T-shirts (`Tee`), the swing-tag calculator, the projection chart, the shop grid. |

## Placeholders to fill in before launch (all in `lib/site.ts`)

1. `site.url`: the production domain (canonical URLs, sitemap, OG).
2. `site.instagramHandle`: drives the Instagram link and the "Buy via Instagram DM" buttons (`ig.me/m/<handle>`).
3. `site.applyForm`: the Google Form link for artist applications.
4. `site.email`: the contact email (also used for "order by email").
5. `charities`: the names and links of the two flood relief charities.
6. `nextSession.date` / `applicationsOpen`: when Session 1 runs, whether applications are open.
7. `orderFlow.payment` / `orderFlow.delivery`: how buyers pay and receive shirts.
8. `founders`: names to sign the letter on the About page.
9. `shirts`: every shirt is a drawn stand-in ("Sample design A–F", "Session 1 artist", PKR 1,600, which is the plan's PKR 32,000 ÷ ~20 shirts). Replace with real titles, artists, sizes, prices and `sold` flags. To use photos, swap `<Tee>` for `next/image` in `components/ShopGrid.tsx` and `app/page.tsx`.

## Deploy to Vercel

1. vercel.com → **Add New… → Project** → import `vynells/vextio`.
2. **Root Directory** → *Edit* → choose `painted-for-purpose`. Framework preset: **Next.js** (auto-detected). Leave build/output commands at their defaults.
3. Deploy. No environment variables are needed.
4. Add the custom domain under **Settings → Domains**, then set `site.url` in `lib/site.ts` to match.

Because the repo root is a different site, keep the Vextio project and this one as two separate Vercel projects. Optionally, set **Settings → Git → Ignored Build Step** to `git diff --quiet HEAD^ HEAD -- .` on this project so it only rebuilds when `painted-for-purpose/` changes.
