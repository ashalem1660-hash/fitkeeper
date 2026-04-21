-- ============================================================
-- FitKeeper — שדרוג אפליקציה (גל 1 + גל 2)
-- הדבק את כל הקובץ ב-SQL Editor של Supabase והרץ
-- בטוח להרצה חוזרת — כל הטבלאות יש להן IF NOT EXISTS
-- ============================================================

-- ========== גל 1: תבניות אימון ==========

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists routines_user_idx on public.routines(user_id, created_at desc);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  order_index int default 0,
  target_sets int default 3,
  target_reps int default 10,
  notes text,
  created_at timestamptz default now()
);
create index if not exists rex_routine_idx on public.routine_exercises(routine_id);

-- ========== גל 2: ארוחות שמורות + אירובי ==========

create table if not exists public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  created_at timestamptz default now()
);
create index if not exists meal_tmpl_user_idx on public.meal_templates(user_id, created_at desc);

create table if not exists public.meal_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.meal_templates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  grams numeric,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric
);
create index if not exists meal_items_tmpl_idx on public.meal_template_items(template_id);

create table if not exists public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  activity text not null,
  duration_min numeric,
  distance_km numeric,
  calories numeric,
  notes text,
  created_at timestamptz default now()
);
create index if not exists cardio_user_date_idx on public.cardio_sessions(user_id, date desc);

-- ========== Row Level Security ==========

alter table public.routines            enable row level security;
alter table public.routine_exercises   enable row level security;
alter table public.meal_templates      enable row level security;
alter table public.meal_template_items enable row level security;
alter table public.cardio_sessions     enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'routines','routine_exercises',
    'meal_templates','meal_template_items',
    'cardio_sessions'
  ] loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);

    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id);', t);
    execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;
