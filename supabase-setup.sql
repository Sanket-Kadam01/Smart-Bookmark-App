-- ==============================================
-- Smart Bookmark App — Supabase Setup
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. Create bookmarks table
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  created_at timestamptz default now() not null
);

-- 2. Enable Row Level Security
alter table public.bookmarks enable row level security;

-- 3. Policy: Users can only SELECT their own bookmarks
create policy "Users can view their own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- 4. Policy: Users can only INSERT their own bookmarks
create policy "Users can insert their own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- 5. Policy: Users can only DELETE their own bookmarks
create policy "Users can delete their own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- 6. Policy: Users can only UPDATE their own bookmarks
create policy "Users can update their own bookmarks"
  on public.bookmarks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Create index for faster queries by user
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);

-- 7. Enable Realtime for bookmarks table
alter publication supabase_realtime add table public.bookmarks;

-- 8. Enable Realtime deletion for bookmarks table
alter table public.bookmarks replica identity full;
