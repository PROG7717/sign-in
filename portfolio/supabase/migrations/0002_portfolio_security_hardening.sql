-- Trigger function should not be callable through the REST RPC surface
revoke execute on function public.portfolio_touch_updated_at() from anon, authenticated;

-- Public bucket objects are served via public URLs; only admins need to
-- list/inspect objects through the storage API.
drop policy if exists "portfolio_bucket_public_read" on storage.objects;
create policy "portfolio_bucket_admin_read" on storage.objects
  for select to authenticated using (bucket_id = 'portfolio' and public.is_portfolio_admin());
