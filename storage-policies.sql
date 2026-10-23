-- Supabase Storage policies for public homepage and gallery assets.
-- Run after schema.sql. The bucket itself is public for read-only image delivery;
-- writes remain restricted to authenticated admin profiles.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homepage-assets', 'homepage-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-assets', 'gallery-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy homepage_assets_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'homepage-assets');

create policy homepage_assets_admin_insert
on storage.objects for insert
to authenticated
with check (bucket_id = 'homepage-assets' and public.current_role() = 'admin');

create policy homepage_assets_admin_update
on storage.objects for update
to authenticated
using (bucket_id = 'homepage-assets' and public.current_role() = 'admin')
with check (bucket_id = 'homepage-assets' and public.current_role() = 'admin');

create policy homepage_assets_admin_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'homepage-assets' and public.current_role() = 'admin');

create policy gallery_assets_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'gallery-assets');

create policy gallery_assets_admin_insert
on storage.objects for insert
to authenticated
with check (bucket_id = 'gallery-assets' and public.current_role() = 'admin');

create policy gallery_assets_admin_update
on storage.objects for update
to authenticated
using (bucket_id = 'gallery-assets' and public.current_role() = 'admin')
with check (bucket_id = 'gallery-assets' and public.current_role() = 'admin');

create policy gallery_assets_admin_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'gallery-assets' and public.current_role() = 'admin');
