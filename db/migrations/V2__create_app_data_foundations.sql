create table if not exists app_users (
  id uuid primary key,
  local_account_id text unique references accounts(id) on delete cascade,
  neon_user_id text unique,
  email text,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (local_account_id is not null or neon_user_id is not null)
);

create table if not exists factions (
  id uuid primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists detachments (
  id uuid primary key,
  faction_id uuid references factions(id) on delete restrict,
  name text not null,
  detachment_rule text not null default '',
  enhancements text not null default '',
  is_builtin boolean not null default false,
  created_by_user_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (faction_id, name)
);

create table if not exists army_lists (
  id uuid primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  faction_id uuid references factions(id) on delete restrict,
  name text not null,
  source_file_name text,
  imported_at timestamptz not null,
  selected_detachment_id uuid references detachments(id) on delete set null,
  selected_army_rule_choice_id text,
  roster_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists army_list_units (
  id uuid primary key,
  army_list_id uuid not null references army_lists(id) on delete cascade,
  source_unit_id text not null,
  name text not null,
  unit_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (army_list_id, source_unit_id)
);

create table if not exists detachment_stratagems (
  id uuid primary key,
  detachment_id uuid not null references detachments(id) on delete cascade,
  name text not null,
  cp_cost integer not null default 0,
  description text not null default '',
  phases jsonb not null,
  timing text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists army_list_unit_overrides (
  id uuid primary key,
  army_list_id uuid not null references army_lists(id) on delete cascade,
  army_list_unit_id uuid not null references army_list_units(id) on delete cascade,
  override_json jsonb not null,
  updated_at timestamptz not null default now(),
  unique (army_list_id, army_list_unit_id)
);

create table if not exists user_preferences (
  user_id uuid primary key references app_users(id) on delete cascade,
  selected_army_list_id uuid references army_lists(id) on delete set null,
  updated_at timestamptz not null default now()
);
