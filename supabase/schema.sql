-- ============================================================
-- FitKeeper — Supabase schema
-- Paste this entire file into the Supabase SQL Editor and Run.
-- ============================================================

-- 1) PROFILES ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  sex text check (sex in ('male','female')),
  birth_date date,
  height_cm numeric,
  weight_kg numeric,
  activity_level text check (activity_level in
    ('sedentary','light','moderate','active','very_active')),
  goal_type text check (goal_type in ('lose','maintain','gain')),
  calorie_target int,
  protein_target int,
  carbs_target int,
  fat_target int,
  water_target_ml int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) WORKOUTS ----------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  muscle_group text not null,
  name text,
  notes text,
  duration_min int,
  created_at timestamptz default now()
);
create index if not exists workouts_user_date_idx on public.workouts(user_id, date desc);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  order_index int default 0,
  created_at timestamptz default now()
);
create index if not exists wex_workout_idx on public.workout_exercises(workout_id);

create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  set_number int not null,
  weight_kg numeric,
  reps int,
  rpe numeric,
  created_at timestamptz default now()
);
create index if not exists sets_exercise_idx on public.exercise_sets(exercise_id);

-- 3) NUTRITION ---------------------------------------------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  grams numeric,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  created_at timestamptz default now()
);
create index if not exists meals_user_date_idx on public.meals(user_id, date desc);

create table if not exists public.water_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount_ml int not null,
  created_at timestamptz default now()
);
create index if not exists water_user_date_idx on public.water_log(user_id, date desc);

create table if not exists public.weight_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric not null,
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.workouts          enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercise_sets     enable row level security;
alter table public.meals             enable row level security;
alter table public.water_log         enable row level security;
alter table public.weight_log        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','workouts','workout_exercises','exercise_sets',
    'meals','water_log','weight_log'
  ] loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);

    if t = 'profiles' then
      execute 'create policy "own_select" on public.profiles for select using (auth.uid() = id);';
      execute 'create policy "own_insert" on public.profiles for insert with check (auth.uid() = id);';
      execute 'create policy "own_update" on public.profiles for update using (auth.uid() = id);';
    else
      execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id);', t);
      execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
      execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id);', t);
      execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', t);
    end if;
  end loop;
end $$;
