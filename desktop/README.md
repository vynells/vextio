# Vextio Orders (Windows app)

The team's desktop app for running Vextio: orders, customers, stock and support. It talks to the website's private API (`/api/app/*`), so the website has to be deployed with these changes first.

## First-time setup

1. Deploy the website (push to `main`). The new tables and columns are created automatically the first time the app or checkout uses them.
2. Make sure these are set in Vercel → Settings → Environment Variables (they already are if the web admin works):
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD`: the owner's sign-in
   - `ADMIN_SESSION_SECRET` (or a new `AUTH_SECRET`): signs app logins
   - `RESEND_API_KEY`: for customer emails
   - `ADMIN_NAME` (optional): your name, shown in the app
3. Install `Vextio-Orders-Setup-1.1.0.exe` and sign in with the admin username and password. Add team members under **Settings → Team**.

Windows may show "Windows protected your PC" the first time, because the installer isn't code-signed. Click **More info → Run anyway**.

## What it does

- Orders list with live counts, filters, search (Ctrl F) and keyboard navigation (↑ ↓ Enter Esc)
- Order panel: confirm payments, ship with courier + tracking, deliver, cancel, return, reopen, team notes, edit delivery details, one-click Email / Call / WhatsApp, item photos
- Stock follows orders: COD orders take stock at checkout, paid orders when you confirm payment, and cancelled or returned orders put it back
- Stock screen: every product and size, edit counts with + / − or by typing, low and sold-out filters
- Support screen: read customer messages, reply by email, close and reopen
- Windows notifications for new orders and support messages, a taskbar badge, and a tray icon that keeps watching when the window is closed
- Products screen: add, edit and delete products with photos (resized to JPG automatically), price, badge, description, sizes and stock, size chart, and shop sections
- Ctrl K to jump to any order, customer or screen; Ctrl 1–6 to switch screens; Ctrl S saves a product; F5 to refresh
- Settings: shipping fee (checkout uses it straight away), who gets new-order emails, team access, password, "Start with Windows"
- Your sign-in is stored encrypted with Windows' own protection

## Updates

The app updates itself. It checks GitHub for a new release when it starts and every 4 hours, downloads it quietly, and installs it when you restart (or next time you quit). **Settings → This app** shows the version and has a **Check for updates** button.

To ship a new version:

1. Bump `"version"` in `desktop/package.json` (e.g. `1.1.0` → `1.2.0`) and commit.
2. Push a matching tag: `git tag v1.2.0 && git push origin v1.2.0`.
3. The **Release Vextio Orders** GitHub Action builds the installer and publishes the release. Installed apps pick it up within a few hours, or straight away with **Check for updates**.

## Build it yourself

```bash
cd desktop
npm install
npm start          # run the app
npm run web        # preview the interface in a browser (needs the website running on :3100)
npm run dist       # → release/Vextio-Orders-Setup-<version>.exe
```

The app connects to `https://vextio.vercel.app` by default. Change it on the sign-in screen under **Connection settings**, or set `DEFAULT_SERVER` in `src/main/main.cjs` if the shop moves to its own domain.
