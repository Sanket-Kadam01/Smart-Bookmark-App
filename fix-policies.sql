-- ==============================================
-- FIX RLS POLICIES
-- Run this in Supabase SQL Editor to reset permissions
-- ==============================================

-- 1. Drop all existing policies to ensure a clean slate
drop policy if exists "Users can view their own bookmarks" on public.bookmarks;
drop policy if exists "Users can insert their own bookmarks" on public.bookmarks;
drop policy if exists "Users can update their own bookmarks" on public.bookmarks;
drop policy if exists "Users can delete their own bookmarks" on public.bookmarks;

-- 2. Ensure RLS is enabled
alter table public.bookmarks enable row level security;

-- 3. Re-create SELECT policy
create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

-- 4. Re-create INSERT policy (This was the one failing)
create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

-- 5. Re-create UPDATE policy
create policy "Users can update their own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Re-create DELETE policy
create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
