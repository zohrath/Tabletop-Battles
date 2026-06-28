create table if not exists accounts (
  id text primary key,
  username text not null unique,
  password_hash text not null,
  password_salt text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists account_sessions (
  token_hash text primary key,
  account_id text not null references accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
