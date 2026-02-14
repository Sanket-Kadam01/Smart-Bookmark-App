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

## 🧩 Challenges Faced & Solutions

### 1. Realtime Deletions with RLS
**Problem**: Deleting a bookmark didn't reflect in real-time for other tabs.
**Root Cause**: Postgres `DELETE` events don't send the old record by default, so RLS policies couldn't verify ownership, blocking the broadcast.
**Solution**: Enabled `REPLICA IDENTITY FULL` on the bookmarks table (`alter table public.bookmarks replica identity full;`). This forces Postgres to send the entire old record during deletions, allowing RLS to verify `user_id` and permit the realtime event.

### 2. Mobile Responsiveness for Inline Editing
**Problem**: The "Edit" form broke the layout on mobile devices, pushing buttons off-screen.
**Solution**: Implemented a responsive Flexbox layout. On desktop (`sm:`), inputs and buttons stay in a single row. On mobile, they stack vertically (Title top, URL bottom) with buttons aligned for easy touch access.

### 3. Supabase Auth in Production
**Problem**: After deploying to Vercel, logging in redirected users back to `localhost`.
**Solution**: Configured dynamic redirect URLs. In development, it uses `localhost`. In production, it uses the Vercel deployment URL. Also updated Supabase Dashboard "Site URL" and "Redirect URLs" to whitelist the production domain.

### 4. Row-Level Security (RLS) policies
**Problem**: Initial updates failed with "new row violates row-level security policy".
**Solution**: The database was missing a specific `UPDATE` policy. I wrote a migration to add:
```sql
create policy "Users can update their own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);
```
This ensures users can only modify their own data.

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
