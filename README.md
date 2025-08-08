# HokmWeb

This Next.js app uses the new App Router (introduced in Next.js 13), the root page is at src/app/page.tsx instead of pages/index.tsx.


---

Important:

The next export command does NOT fully support the new App Router yet — it only works reliably with the old pages/ directory.

---

What can you do?

Option 1: Deploy as a server-rendered Next.js app (not static export)

Instead of next export, you:

Build your app: next build

Start the Next.js server: next start


This requires a Node.js server environment (e.g. Vercel, or a server with Node.js).

On GitHub Actions, you can only build and test, but you can’t run a full Next.js server without an external host.


---

Option 2: Use Vercel for deployment (recommended)

Vercel is the official platform for Next.js apps. It supports:

App Router fully

Server-side rendering

API routes


Just connect your GitHub repo to Vercel and deploy. No need for next export or GitHub Pages.


---

Option 3: Use Static Generation with pages directory (fallback)

If you want to use next export and GitHub Pages, you'd need to move to the old pages directory with static pages only (no App Router), which might be a big change.


---
