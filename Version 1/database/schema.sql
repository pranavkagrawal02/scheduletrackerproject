create table if not exists users (
  id bigserial primary key,
  name text not null,
  role text not null,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id bigserial primary key,
  name text not null,
  owner_id bigint references users(id) on delete set null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists holidays (
  id bigserial primary key,
  name text not null,
  used integer not null default 0,
  total integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists todos (
  id bigserial primary key,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists meetings (
  id bigserial primary key,
  title text not null,
  meta text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id bigserial primary key,
  range text not null,
  day text not null,
  title text not null,
  note text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table if not exists finances (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  type text not null,
  amount numeric(12, 2) not null,
  status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
