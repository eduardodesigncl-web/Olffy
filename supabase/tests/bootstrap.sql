create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;

create table auth.users (
  id uuid primary key,
  email text
);

create or replace function auth.uid()
returns uuid
language sql
stable
as 'select null::uuid';

create schema supabase_migrations;

create table supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
