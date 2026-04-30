-- Make the avatars bucket public-read so anon visitors to /memories
-- can render author avatars via getPublicUrl. Writes stay owner-scoped.

update storage.buckets set public = true where id = 'avatars';

drop policy if exists "avatars read authenticated" on storage.objects;

create policy "avatars read public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');
