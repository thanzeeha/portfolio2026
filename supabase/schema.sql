-- Run once in Supabase SQL Editor AFTER creating your admin user.
-- IMPORTANT: replace the placeholder UUID below with your own Auth user UUID.
-- This default deliberately blocks all writes until you replace the UUID.

create table if not exists public.portfolio_content (
  id bigint primary key check (id = 1),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;
drop policy if exists "Public read portfolio" on public.portfolio_content;
create policy "Public read portfolio" on public.portfolio_content
  for select using (true);
drop policy if exists "Admin insert portfolio" on public.portfolio_content;
create policy "Admin insert portfolio" on public.portfolio_content
  for insert to authenticated
  with check (auth.uid() = 'ac862a87-87f8-4191-8fd7-021a176e56d3'::uuid);
drop policy if exists "Admin update portfolio" on public.portfolio_content;
create policy "Admin update portfolio" on public.portfolio_content
  for update to authenticated
  using (auth.uid() = 'ac862a87-87f8-4191-8fd7-021a176e56d3'::uuid)
  with check (auth.uid() = 'ac862a87-87f8-4191-8fd7-021a176e56d3'::uuid);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 10485760,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "Public view portfolio photos" on storage.objects;
create policy "Public view portfolio photos" on storage.objects
  for select using (bucket_id = 'portfolio-media');
drop policy if exists "Admin upload portfolio media" on storage.objects;
create policy "Admin upload portfolio media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-media' and auth.uid() = 'ac862a87-87f8-4191-8fd7-021a176e56d3'::uuid);
drop policy if exists "Admin update portfolio media" on storage.objects;
create policy "Admin update portfolio media" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-media' and auth.uid() = 'ac862a87-87f8-4191-8fd7-021a176e56d3'::uuid)
  with check (bucket_id = 'portfolio-media' and auth.uid() = 'ac862a87-87f8-4191-8fd7-021a176e56d3'::uuid);
drop policy if exists "Admin delete portfolio media" on storage.objects;
create policy "Admin delete portfolio media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-media' and auth.uid() = 'ac862a87-87f8-4191-8fd7-021a176e56d3'::uuid);
