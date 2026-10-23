-- 陽光社區棒球隊正式資料模型
-- 執行前請在 Supabase SQL editor 建立；所有時間以 Asia/Taipei 顯示，資料庫以 timestamptz 儲存。

create extension if not exists pgcrypto;

create type public.app_role as enum ('player', 'coach', 'admin');
create type public.attendance_status as enum ('registered', 'attended', 'leave', 'late', 'cancelled');
create type public.duty_status as enum ('draft', 'confirmed', 'completed');
create type public.meal_order_status as enum ('ordered', 'no_meal', 'unconfirmed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  jersey_number text unique,
  display_name text not null,
  role public.app_role not null default 'player',
  parent_name text,
  parent_phone text,
  city text,
  district text,
  school_name text,
  birthday date,
  email text,
  phone text,
  joined_on date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;

create table public.parent_contacts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  relation text not null,
  phone text not null,
  email text not null,
  line_handle text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(player_id, is_primary)
);

create table public.training_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  title text not null,
  event_type text not null default 'training',
  start_time time,
  end_time time,
  location text,
  checkin_open_at timestamptz,
  checkin_close_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 便當流程狀態由教練／管理員維護；停止後 API 層也會拒絕訂餐異動。
alter table public.training_events
  add column if not exists meal_ordering_status text not null default 'draft'
  check (meal_ordering_status in ('draft', 'open', 'stopped'));

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.training_events(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  status public.attendance_status not null,
  note text,
  submitted_at timestamptz not null default now(),
  unique(event_id, player_id)
);

create table public.meal_menus (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.training_events(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.meal_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.training_events(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  menu_id uuid references public.meal_menus(id),
  status public.meal_order_status not null,
  ordered_at timestamptz not null default now(),
  unique(event_id, player_id)
);

create table public.duty_schedules (
  id uuid primary key default gen_random_uuid(),
  duty_date date not null unique,
  duty_player_id uuid not null references public.profiles(id),
  equipment_one_id uuid not null references public.profiles(id),
  equipment_two_id uuid not null references public.profiles(id),
  status public.duty_status not null default 'draft',
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (duty_player_id <> equipment_one_id and duty_player_id <> equipment_two_id and equipment_one_id <> equipment_two_id)
);

create table public.duty_settlements (
  id uuid primary key default gen_random_uuid(),
  duty_schedule_id uuid not null references public.duty_schedules(id) on delete cascade,
  description text not null,
  amount integer not null,
  direction text not null check (direction in ('income', 'expense')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  game_date date not null,
  title text not null,
  location text,
  opponent text,
  result text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.player_game_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  at_bats integer not null default 0,
  hits integer not null default 0,
  rbi integer not null default 0,
  runs integer not null default 0,
  innings_pitched numeric(5,2) not null default 0,
  earned_runs integer not null default 0,
  strikeouts integer not null default 0,
  errors integer not null default 0,
  unique(game_id, player_id),
  check (at_bats >= 0 and hits >= 0 and rbi >= 0 and runs >= 0 and innings_pitched >= 0 and earned_runs >= 0 and strikeouts >= 0 and errors >= 0)
);

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title text not null,
  subtitle text,
  body text,
  image_path text,
  sort_order integer not null,
  visible boolean not null default true,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references public.profiles(id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('meal_reminder', 'attendance_reminder', 'announcement')),
  title text not null,
  body text not null,
  channel text not null default 'in_app' check (channel in ('in_app', 'line', 'email')),
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 名單、輪值與便當畫面只需要最小公開欄位，不直接暴露家長電話、學校等個資。
create or replace view public.player_directory
with (security_invoker = false)
as
select id, jersey_number, display_name
from public.profiles
where active = true;

grant select on public.player_directory to authenticated;

create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.update_my_profile(
  p_birthday date default null,
  p_city text default null,
  p_district text default null,
  p_school_name text default null,
  p_email text default null,
  p_phone text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set birthday = p_birthday,
      city = p_city,
      district = p_district,
      school_name = p_school_name,
      email = p_email,
      phone = p_phone,
      updated_at = now()
  where id = auth.uid();
$$;

grant execute on function public.update_my_profile(date, text, text, text, text, text) to authenticated;
revoke execute on function public.update_my_profile(date, text, text, text, text, text) from public, anon;

create or replace function public.confirm_my_duty_schedule(p_schedule_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.duty_schedules
  set status = 'confirmed', confirmed_at = now(), confirmed_by = auth.uid()
  where id = p_schedule_id
    and status = 'draft'
    and (duty_player_id = auth.uid() or equipment_one_id = auth.uid() or equipment_two_id = auth.uid());
end;
$$;

grant execute on function public.confirm_my_duty_schedule(uuid) to authenticated;
revoke execute on function public.confirm_my_duty_schedule(uuid) from public, anon;

alter table public.profiles enable row level security;
alter table public.training_events enable row level security;
alter table public.attendance enable row level security;
alter table public.meal_menus enable row level security;
alter table public.meal_orders enable row level security;
alter table public.duty_schedules enable row level security;
alter table public.duty_settlements enable row level security;
alter table public.games enable row level security;
alter table public.player_game_stats enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.contact_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.parent_contacts enable row level security;

create policy profiles_read_self_or_staff on public.profiles for select to authenticated using (id = auth.uid() or public.current_role() in ('coach', 'admin'));
create policy profiles_write_staff on public.profiles for all to authenticated using (public.current_role() in ('coach', 'admin')) with check (public.current_role() in ('coach', 'admin'));

create policy parent_contacts_read_self_or_admin on public.parent_contacts for select to authenticated using (player_id = auth.uid() or public.current_role() = 'admin');
create policy parent_contacts_write_self_or_admin on public.parent_contacts for all to authenticated using (player_id = auth.uid() or public.current_role() = 'admin') with check (player_id = auth.uid() or public.current_role() = 'admin');

create policy events_read_authenticated on public.training_events for select to authenticated using (true);
create policy events_write_staff on public.training_events for all to authenticated using (public.current_role() in ('coach', 'admin')) with check (public.current_role() in ('coach', 'admin'));

create policy attendance_read_self_or_staff on public.attendance for select to authenticated using (player_id = auth.uid() or public.current_role() in ('coach', 'admin'));
create policy attendance_write_self_or_staff on public.attendance for insert to authenticated with check (player_id = auth.uid() or public.current_role() in ('coach', 'admin'));
create policy attendance_update_self_or_staff on public.attendance for update to authenticated using (player_id = auth.uid() or public.current_role() in ('coach', 'admin')) with check (player_id = auth.uid() or public.current_role() in ('coach', 'admin'));

create policy menus_read_authenticated on public.meal_menus for select to authenticated using (true);
create policy menus_write_staff on public.meal_menus for all to authenticated using (public.current_role() in ('coach', 'admin')) with check (public.current_role() in ('coach', 'admin'));
create policy orders_read_self_or_staff on public.meal_orders for select to authenticated using (player_id = auth.uid() or public.current_role() in ('coach', 'admin'));

create or replace function public.meal_ordering_open(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.training_events
    where id = p_event_id and meal_ordering_status = 'open'
  )
$$;

revoke execute on function public.meal_ordering_open(uuid) from public, anon;

create policy orders_insert_only_when_open on public.meal_orders for insert to authenticated
  with check ((player_id = auth.uid() or public.current_role() in ('coach', 'admin')) and public.meal_ordering_open(event_id));
create policy orders_update_only_when_open on public.meal_orders for update to authenticated
  using ((player_id = auth.uid() or public.current_role() in ('coach', 'admin')) and public.meal_ordering_open(event_id))
  with check ((player_id = auth.uid() or public.current_role() in ('coach', 'admin')) and public.meal_ordering_open(event_id));
create policy orders_delete_only_when_open on public.meal_orders for delete to authenticated
  using ((player_id = auth.uid() or public.current_role() in ('coach', 'admin')) and public.meal_ordering_open(event_id));

create policy duty_read_authenticated on public.duty_schedules for select to authenticated using (true);
create policy duty_write_admin on public.duty_schedules for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy settlement_read_self_or_staff on public.duty_settlements for select to authenticated using (public.current_role() in ('coach', 'admin'));
create policy settlement_read_assigned on public.duty_settlements for select to authenticated using (exists (select 1 from public.duty_schedules s where s.id = duty_schedule_id and (s.duty_player_id = auth.uid() or s.equipment_one_id = auth.uid() or s.equipment_two_id = auth.uid())));
create or replace function public.duty_schedule_editable(p_schedule_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.duty_schedules
    where id = p_schedule_id and status = 'draft'
  )
$$;

revoke execute on function public.duty_schedule_editable(uuid) from public, anon;

create policy settlement_insert_only_when_draft on public.duty_settlements for insert to authenticated
  with check ((public.current_role() in ('coach', 'admin') or exists (select 1 from public.duty_schedules s where s.id = duty_schedule_id and (s.duty_player_id = auth.uid() or s.equipment_one_id = auth.uid() or s.equipment_two_id = auth.uid()))) and public.duty_schedule_editable(duty_schedule_id) and created_by = auth.uid());
create policy settlement_update_only_when_draft on public.duty_settlements for update to authenticated
  using ((public.current_role() in ('coach', 'admin') or created_by = auth.uid()) and public.duty_schedule_editable(duty_schedule_id))
  with check ((public.current_role() in ('coach', 'admin') or created_by = auth.uid()) and public.duty_schedule_editable(duty_schedule_id) and created_by = auth.uid());
create policy settlement_delete_only_when_draft on public.duty_settlements for delete to authenticated
  using ((public.current_role() in ('coach', 'admin') or created_by = auth.uid()) and public.duty_schedule_editable(duty_schedule_id));

create policy games_read_authenticated on public.games for select to authenticated using (true);
create policy games_write_staff on public.games for all to authenticated using (public.current_role() in ('coach', 'admin')) with check (public.current_role() in ('coach', 'admin'));
create policy stats_read_authenticated on public.player_game_stats for select to authenticated using (true);
create policy stats_write_staff on public.player_game_stats for all to authenticated using (public.current_role() in ('coach', 'admin')) with check (public.current_role() in ('coach', 'admin'));

create policy homepage_read_public on public.homepage_sections for select to anon, authenticated using (visible = true);
create policy homepage_write_admin on public.homepage_sections for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy contact_insert_public on public.contact_messages for insert to anon, authenticated with check (length(name) between 1 and 80 and length(email) between 3 and 254 and length(message) between 1 and 4000);
create policy contact_read_admin on public.contact_messages for select to authenticated using (public.current_role() = 'admin');
create policy contact_update_admin on public.contact_messages for update to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy notifications_read_self on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy notifications_update_self on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy notifications_write_staff on public.notifications for insert to authenticated with check (public.current_role() in ('coach', 'admin'));

create index attendance_event_idx on public.attendance(event_id);
create index meal_orders_event_idx on public.meal_orders(event_id);
create index duty_date_idx on public.duty_schedules(duty_date);
create index games_date_idx on public.games(game_date);
create index stats_player_idx on public.player_game_stats(player_id);
create index notifications_recipient_idx on public.notifications(recipient_id, created_at desc);
