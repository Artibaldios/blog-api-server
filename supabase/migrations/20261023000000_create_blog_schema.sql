create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  username text not null unique,
  email text not null unique,
  img text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  img text,
  title text not null,
  slug text not null unique,
  description text,
  category text not null default 'general',
  content text not null,
  is_featured boolean not null default false,
  visit integer not null default 0 check (visit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  description text not null check (btrim(description) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_posts (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_category_idx on public.posts (category);
create index posts_featured_idx on public.posts (is_featured) where is_featured;
create index posts_visit_idx on public.posts (visit desc);
create index posts_user_id_idx on public.posts (user_id);
create index comments_post_id_created_at_idx on public.comments (post_id, created_at desc);
create index saved_posts_post_id_idx on public.saved_posts (post_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger comments_set_updated_at before update on public.comments for each row execute function public.set_updated_at();

create or replace function public.increment_post_visit(post_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_visit integer;
begin
  update public.posts
  set visit = visit + 1
  where slug = post_slug
  returning visit into updated_visit;
  return updated_visit;
end;
$$;

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.saved_posts enable row level security;

revoke all on function public.increment_post_visit(text) from public;
grant execute on function public.increment_post_visit(text) to service_role;