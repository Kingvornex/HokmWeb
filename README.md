
# 🎮 HokmWeb

**HokmWeb** is an online multiplayer **Hokm** card game designed as a **mobile-friendly web app** using [Next.js](https://nextjs.org/).  
It can be played in any modern browser and is optimized for Android devices, offering a smooth and responsive experience.

## 📌 Features
- 🃏 **Classic Hokm gameplay** with realistic rules
- 📱 **Mobile-first design** — works seamlessly on Android browsers
- 🌐 **Online multiplayer** — play with friends or random players
- ⚡ **Fast & responsive UI** powered by Next.js
- 🎨 Clean interface for enjoyable play

## 🚀 Tech Stack
- **Frontend Framework:** Next.js (React)
- **Styling:** Tailwind CSS (or other CSS framework if you change)
- **Realtime:** WebSockets / Socket.IO (for multiplayer)
- **Deployment:** Vercel / Node.js server
- **Platform:** Mobile-friendly, Android-optimized PWA

## 📂 Project Structure
```

HokmWeb/
│── public/          # Static assets (images, icons, manifest)
│── pages/           # Next.js pages and routes
│── components/      # Reusable UI components
│── styles/          # Global styles
│── utils/           # Game logic helpers
│── server/          # Realtime server (WebSocket)
│── package.json     # Dependencies & scripts

````

## 🛠 Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/Kingvornex/HokmWeb.git
cd HokmWeb
````

2. **Install dependencies**

```bash
npm install
```

3. **Run the development server**

```bash
npm run dev
```

4. Open in browser:

```
http://localhost:3000
```

## 📱 Android Support

HokmWeb is fully optimized for **mobile play**:

* Install as a **PWA** for a native-like experience
* Works on all Chromium-based Android browsers

## 📜 License

This project is licensed under the **MIT License** — feel free to use and modify.

---

**👑 Author:** [King Vornex](https://github.com/Kingvornex)

---

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
