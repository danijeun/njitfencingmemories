-- Sprint 1 admins: extend member_role with 'coach'.
-- Must be its own migration; ALTER TYPE ADD VALUE cannot be used in the same
-- transaction as code that references the new value.
alter type public.member_role add value if not exists 'coach';
