create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  topic text not null default 'AI Trust',
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  current_phase text not null default 'aspects' check (current_phase in ('aspects', 'concepts', 'presentations', 'voting', 'finished')),
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  team_name text not null
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  primary key (team_id, participant_id)
);

create table if not exists public.team_cards (
  team_id uuid not null references public.teams(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  primary key (team_id, card_id)
);

create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  description text not null,
  image_url text,
  created_at timestamptz not null default now(),
  unique (team_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  stars integer not null check (stars between 1 and 3),
  unique (participant_id, concept_id)
);

alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.cards enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_cards enable row level security;
alter table public.concepts enable row level security;
alter table public.votes enable row level security;

create policy "public read sessions" on public.sessions for select to anon using (true);
create policy "public write sessions" on public.sessions for all to anon using (true) with check (true);
create policy "public read participants" on public.participants for select to anon using (true);
create policy "public write participants" on public.participants for all to anon using (true) with check (true);
create policy "public read cards" on public.cards for select to anon using (true);
create policy "public write cards" on public.cards for all to anon using (true) with check (true);
create policy "public read teams" on public.teams for select to anon using (true);
create policy "public write teams" on public.teams for all to anon using (true) with check (true);
create policy "public read team_members" on public.team_members for select to anon using (true);
create policy "public write team_members" on public.team_members for all to anon using (true) with check (true);
create policy "public read team_cards" on public.team_cards for select to anon using (true);
create policy "public write team_cards" on public.team_cards for all to anon using (true) with check (true);
create policy "public read concepts" on public.concepts for select to anon using (true);
create policy "public write concepts" on public.concepts for all to anon using (true) with check (true);
create policy "public read votes" on public.votes for select to anon using (true);
create policy "public write votes" on public.votes for all to anon using (true) with check (true);

alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.team_members;
alter publication supabase_realtime add table public.team_cards;
alter publication supabase_realtime add table public.concepts;
alter publication supabase_realtime add table public.votes;
