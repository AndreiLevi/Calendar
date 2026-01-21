-- User Profiles Table
-- Stores birth data with support for multiple profiles per Google account

create table if not exists profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  profile_name text not null,
  birth_date date not null,
  birth_time time,
  birth_place text,
  birth_lat numeric(10, 6),
  birth_lng numeric(10, 6),
  birth_timezone text,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table profiles enable row level security;

-- Policies: Users can only access their own profiles
create policy "Users can view own profiles"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profiles"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profiles"
  on profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own profiles"
  on profiles for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists profiles_user_id_idx on profiles(user_id);
create index if not exists profiles_active_idx on profiles(user_id, is_active);

-- Action Log Table
-- Tracks all major operations for debugging and audit trail

create table if not exists action_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  profile_id uuid references profiles on delete cascade,
  action_type text not null,
  action_details jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table action_log enable row level security;

-- Policies
create policy "Users can view own logs"
  on action_log for select
  using (auth.uid() = user_id);

create policy "System can insert logs"
  on action_log for insert
  with check (true);

-- Indexes for performance
create index if not exists action_log_user_id_idx on action_log(user_id);
create index if not exists action_log_timestamp_idx on action_log(timestamp desc);
create index if not exists action_log_profile_idx on action_log(profile_id);

-- Trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();
