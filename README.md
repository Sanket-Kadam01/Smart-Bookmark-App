# 🔖 Smart Bookmark App

A real-time bookmark manager built with **Next.js (App Router)**, **Supabase**, and **Tailwind CSS**. Users sign in with Google OAuth, save bookmarks privately, and see changes sync across browser tabs in real time.

**Live Demo**: https://smart-bookmark-app-eosin-xi.vercel.app/login

---

## ✨ Features

- **Google OAuth Login** — One-click sign in via Supabase Auth
- **Private Bookmarks** — Each user only sees their own data (enforced by Row-Level Security)
- **Add, Delete & update** — Simple CRUD with instant feedback
- **Real-Time Sync** — Open two tabs → changes in one appear in the other instantly
- **Responsive UI** — Clean dark theme with Tailwind CSS

---

## 🏗 Architecture

```
┌─────────────────────────┐
│   Next.js App Router    │
│                         │
│  /login    → Google OAuth
│  /dashboard → CRUD + Realtime
│  middleware → Route protection
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       Supabase          │
│                         │
│  Auth     → Google OAuth provider
│  Postgres → bookmarks table + RLS
│  Realtime → postgres_changes subscription
└─────────────────────────┘
```

**No custom backend server.** Supabase handles authentication, database, and real-time subscriptions. Next.js handles UI and protected routing.

---

## 🔒 How Row-Level Security (RLS) Works

RLS is enabled on the `bookmarks` table with three policies:

| Policy | Rule |
|--------|------|
| **SELECT** | `auth.uid() = user_id` — users only see their own bookmarks |
| **INSERT** | `auth.uid() = user_id` — users can only create bookmarks for themselves |
| **DELETE** | `auth.uid() = user_id` — users can only delete their own bookmarks |

This means even if someone tries to query another user's bookmarks via the API, Supabase will return empty results. Privacy is enforced at the database level.

---

## ⚡ How Realtime Works

The dashboard sets up a Supabase Realtime subscription:

```typescript
supabase
  .channel('bookmarks-realtime')
  .on('postgres_changes', {
    event: '*',               // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'bookmarks',
    filter: `user_id=eq.${user.id}`  // only this user's changes
  }, () => fetchBookmarks())
  .subscribe();
```

When any change occurs on the `bookmarks` table for the logged-in user, the callback re-fetches all bookmarks. This enables:
- **Multi-tab sync**: Add a bookmark in Tab A → it appears in Tab B instantly
- **Cross-device sync**: Changes on one device reflect on another (same user)

**Prerequisite**: Realtime must be enabled for the `bookmarks` table in Supabase (Database → Replication).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google Cloud OAuth credentials ([guide](https://supabase.com/docs/guides/auth/social-login/auth-google))

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers → Google** and add your Google Client ID & Secret
3. Set the redirect URL to: `https://YOUR_DOMAIN/auth/callback`
4. Open the **SQL Editor** and run the contents of [`supabase-setup.sql`](./supabase-setup.sql)
5. Go to **Database → Replication** and ensure `bookmarks` table has Realtime enabled

### 3. Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Find these in **Supabase Dashboard → Settings → API**.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import Project**
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. Update the Google OAuth redirect URL and Supabase site URL to match your Vercel domain

---

## 🧩 Challenges Faced

### 1. Supabase Auth in Next.js App Router
The App Router uses server components by default, which can't access browser cookies directly. I used `@supabase/ssr` to create separate browser and server clients that handle cookies correctly, plus middleware to refresh sessions on every request.

### 2. Realtime Subscription Lifecycle
The Realtime channel must be subscribed when the user is authenticated and cleaned up on unmount to avoid memory leaks. Using `useEffect` with a cleanup function (`supabase.removeChannel`) ensures proper lifecycle management.

### 3. Row-Level Security + Realtime Filter
RLS policies must align with the Realtime filter. The `filter: user_id=eq.${user.id}` ensures the client only receives events for the current user's data, and RLS ensures the database never leaks data even if the filter is bypassed.

### 4. OAuth Redirect Flow
The OAuth flow requires a callback route (`/auth/callback`) that exchanges the authorization code for a session. Getting the redirect URLs right between local development and production (Vercel) requires updating both Google Cloud Console and Supabase settings.

---

## 📁 Project Structure

```
app/
  layout.tsx          — Root layout with Inter font + metadata
  page.tsx            — Redirects to /login or /dashboard
  globals.css         — Tailwind + global styles
  login/page.tsx      — Google OAuth sign-in page
  dashboard/page.tsx  — Main app: bookmarks + realtime
  auth/callback/route.ts — OAuth code exchange
components/
  BookmarkForm.tsx    — Add bookmark form
  BookmarkList.tsx    — Display + delete bookmarks
  Navbar.tsx          — App header + sign out
lib/
  supabaseClient.ts   — Browser Supabase client
  supabaseServer.ts   — Server Supabase client
  types.ts            — TypeScript interfaces
middleware.ts         — Route protection
supabase-setup.sql    — Database setup script
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** (App Router) | Frontend framework, routing, SSR |
| **Supabase** | Auth, PostgreSQL database, Realtime |
| **Tailwind CSS** | Utility-first styling |
| **TypeScript** | Type safety |
| **Vercel** | Deployment |

---

Built Next.js + Supabase
