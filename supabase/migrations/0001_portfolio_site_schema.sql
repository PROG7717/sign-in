-- ============================================================
-- Portfolio website schema (namespaced portfolio_* to coexist
-- with other apps sharing this Supabase project).
-- Already applied to project sgrouzjfpdwoxknkoqaq via MCP as
-- migration "portfolio_site_schema"; kept here for reference /
-- reproducibility on a fresh Supabase project.
-- ============================================================

-- ---------- Admins ----------
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.portfolio_admins enable row level security;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portfolio_admins where user_id = auth.uid()
  );
$$;

drop policy if exists "portfolio_admins_select_self" on public.portfolio_admins;
create policy "portfolio_admins_select_self" on public.portfolio_admins
  for select using (user_id = auth.uid());

-- ---------- Projects ----------
create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_ar text not null default '',
  tagline_en text not null default '',
  tagline_ar text not null default '',
  description_en text not null default '',
  description_ar text not null default '',
  category text not null default 'web',
  tags text[] not null default '{}',
  cover_url text,
  gallery text[] not null default '{}',
  live_url text,
  year int,
  featured boolean not null default false,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_projects enable row level security;

drop policy if exists "portfolio_projects_public_read" on public.portfolio_projects;
create policy "portfolio_projects_public_read" on public.portfolio_projects
  for select using (published = true or public.is_portfolio_admin());

drop policy if exists "portfolio_projects_admin_insert" on public.portfolio_projects;
create policy "portfolio_projects_admin_insert" on public.portfolio_projects
  for insert to authenticated with check (public.is_portfolio_admin());

drop policy if exists "portfolio_projects_admin_update" on public.portfolio_projects;
create policy "portfolio_projects_admin_update" on public.portfolio_projects
  for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

drop policy if exists "portfolio_projects_admin_delete" on public.portfolio_projects;
create policy "portfolio_projects_admin_delete" on public.portfolio_projects
  for delete to authenticated using (public.is_portfolio_admin());

-- ---------- Reviews ----------
create table if not exists public.portfolio_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.portfolio_projects(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 80),
  author_role text not null default '' check (char_length(author_role) <= 120),
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 2000),
  locale text not null default 'en' check (locale in ('en','ar')),
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now()
);
alter table public.portfolio_reviews enable row level security;

drop policy if exists "portfolio_reviews_public_read" on public.portfolio_reviews;
create policy "portfolio_reviews_public_read" on public.portfolio_reviews
  for select using (status = 'approved' or public.is_portfolio_admin());

-- anyone can submit a review, but it always lands as 'pending'
drop policy if exists "portfolio_reviews_public_insert" on public.portfolio_reviews;
create policy "portfolio_reviews_public_insert" on public.portfolio_reviews
  for insert to anon, authenticated with check (status = 'pending');

drop policy if exists "portfolio_reviews_admin_update" on public.portfolio_reviews;
create policy "portfolio_reviews_admin_update" on public.portfolio_reviews
  for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

drop policy if exists "portfolio_reviews_admin_delete" on public.portfolio_reviews;
create policy "portfolio_reviews_admin_delete" on public.portfolio_reviews
  for delete to authenticated using (public.is_portfolio_admin());

-- ---------- Site settings (singleton) ----------
create table if not exists public.portfolio_settings (
  id int primary key default 1 check (id = 1),
  primary_color text not null default '#8b5cf6',
  secondary_color text not null default '#22d3ee',
  accent_color text not null default '#fb7185',
  site_name_en text not null default 'NOVA Studio',
  site_name_ar text not null default 'استوديو نوفا',
  updated_at timestamptz not null default now()
);
alter table public.portfolio_settings enable row level security;

drop policy if exists "portfolio_settings_public_read" on public.portfolio_settings;
create policy "portfolio_settings_public_read" on public.portfolio_settings
  for select using (true);

drop policy if exists "portfolio_settings_admin_update" on public.portfolio_settings;
create policy "portfolio_settings_admin_update" on public.portfolio_settings
  for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

insert into public.portfolio_settings (id) values (1) on conflict (id) do nothing;

-- ---------- updated_at triggers ----------
create or replace function public.portfolio_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_portfolio_projects_touch on public.portfolio_projects;
create trigger trg_portfolio_projects_touch
  before update on public.portfolio_projects
  for each row execute function public.portfolio_touch_updated_at();

drop trigger if exists trg_portfolio_settings_touch on public.portfolio_settings;
create trigger trg_portfolio_settings_touch
  before update on public.portfolio_settings
  for each row execute function public.portfolio_touch_updated_at();

-- ---------- Realtime for live theme sync ----------
do $$
begin
  alter publication supabase_realtime add table public.portfolio_settings;
exception when duplicate_object then
  null;
end;
$$;

-- ---------- Storage bucket for project images ----------
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "portfolio_bucket_public_read" on storage.objects;
create policy "portfolio_bucket_public_read" on storage.objects
  for select using (bucket_id = 'portfolio');

drop policy if exists "portfolio_bucket_admin_insert" on storage.objects;
create policy "portfolio_bucket_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_portfolio_admin());

drop policy if exists "portfolio_bucket_admin_update" on storage.objects;
create policy "portfolio_bucket_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_portfolio_admin());

drop policy if exists "portfolio_bucket_admin_delete" on storage.objects;
create policy "portfolio_bucket_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_portfolio_admin());

-- ---------- Grant admin rights to the site owner ----------
-- Replace the email if you deploy against a different Supabase project.
insert into public.portfolio_admins (user_id)
select id from auth.users where email = 'ibr5ab2i@gmail.com'
on conflict (user_id) do nothing;
