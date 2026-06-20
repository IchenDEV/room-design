-- 栖居设计 · 账号 / 云端项目 / 协作 数据库 Schema
-- 在 Supabase 后台 SQL Editor 中整体执行。重复执行前建议先 DROP 旧对象。

-- ============ 扩展 ============
create extension if not exists "pgcrypto";

-- ============ profiles：用户档案 ============
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null default '',
  username    text,
  display_name text not null default '',
  avatar_url  text,
  color       text not null default '#4f8cff',  -- 协作光标颜色
  created_at  timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null and username <> '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_username_format
      check (username is null or username ~ '^[A-Za-z0-9_]{3,24}$');
  end if;
end $$;

alter table public.profiles enable row level security;
grant select, update on public.profiles to authenticated;
drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles
  for update using (auth.uid() = id);

-- 注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_username text := nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '');
begin
  insert into public.profiles (id, email, username, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    v_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), v_username, '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 用户名登录辅助：前端用用户名解析出 Supabase Auth 所需 email，再进行密码登录。
create or replace function public.normalize_username(p_username text)
returns text language sql immutable set search_path = '' as $$
  select nullif(lower(trim(p_username)), '');
$$;

create or replace function public.is_username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.normalize_username(p_username) ~ '^[a-z0-9_]{3,24}$', false)
    and not exists (
      select 1 from public.profiles p
      where lower(p.username) = public.normalize_username(p_username)
    );
$$;

create or replace function public.email_for_username(p_username text)
returns text language sql stable security definer set search_path = '' as $$
  select p.email
  from public.profiles p
  where lower(p.username) = public.normalize_username(p_username)
  limit 1;
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- ============ projects：云端方案（Yjs 文档存储） ============
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null default '未命名方案',
  ydoc        bytea,                               -- Y.encodeStateAsUpdate
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 自动更新
create or replace function public.touch_project_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke all on function public.touch_project_updated_at() from public, anon, authenticated;
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_project_updated_at();

-- ============ project_members：协作成员 ============
create table if not exists public.project_members (
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'editor' check (role in ('owner','editor','viewer')),
  joined_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists project_members_user_id_project_id_idx on public.project_members(user_id, project_id);

create or replace function public.create_project(p_name text, p_ydoc_base64 text default null)
returns table(id uuid, name text, owner_id uuid, updated_at timestamptz, role text)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_project public.projects%rowtype;
begin
  if v_user is null then raise exception '请先登录后创建方案'; end if;

  insert into public.projects (owner_id, name, ydoc)
  values (
    v_user,
    coalesce(nullif(trim(p_name), ''), '未命名方案'),
    case
      when p_ydoc_base64 is null or p_ydoc_base64 = '' then null
      else decode(p_ydoc_base64, 'base64')
    end
  )
  returning * into v_project;

  insert into public.project_members (project_id, user_id, role)
  values (v_project.id, v_user, 'owner')
  on conflict (project_id, user_id) do update set role = 'owner';

  id := v_project.id;
  name := v_project.name;
  owner_id := v_project.owner_id;
  updated_at := v_project.updated_at;
  role := 'owner';
  return next;
end; $$;
revoke all on function public.create_project(text, text) from public, anon, authenticated;
grant execute on function public.create_project(text, text) to authenticated;

-- RLS helper functions live outside exposed API schemas. They are SECURITY DEFINER
-- so project/member policies can check membership without recursively applying RLS.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.project_role(p_project_id uuid, p_user_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when p_user_id is null then null
    when exists (
      select 1
      from public.projects p
      where p.id = p_project_id and p.owner_id = p_user_id
    ) then 'owner'
    else (
      select m.role
      from public.project_members m
      where m.project_id = p_project_id and m.user_id = p_user_id
      limit 1
    )
  end;
$$;

create or replace function private.can_access_project(p_project_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.project_role(p_project_id, p_user_id) is not null;
$$;

create or replace function private.can_edit_project(p_project_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.project_role(p_project_id, p_user_id) in ('owner', 'editor');
$$;

create or replace function private.is_project_owner(p_project_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.project_role(p_project_id, p_user_id) = 'owner';
$$;

revoke all on function private.project_role(uuid, uuid) from public;
revoke all on function private.can_access_project(uuid, uuid) from public;
revoke all on function private.can_edit_project(uuid, uuid) from public;
revoke all on function private.is_project_owner(uuid, uuid) from public;
grant execute on function private.project_role(uuid, uuid) to authenticated;
grant execute on function private.can_access_project(uuid, uuid) to authenticated;
grant execute on function private.can_edit_project(uuid, uuid) to authenticated;
grant execute on function private.is_project_owner(uuid, uuid) to authenticated;

create or replace function public.save_project(p_project_id uuid, p_name text, p_ydoc_base64 text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception '请先登录后保存方案'; end if;
  if not private.can_edit_project(p_project_id, v_user) then
    raise exception '无权限保存方案';
  end if;

  update public.projects as p
  set
    name = coalesce(nullif(trim(p_name), ''), '未命名方案'),
    ydoc = case
      when p_ydoc_base64 is null or p_ydoc_base64 = '' then null
      else decode(p_ydoc_base64, 'base64')
    end,
    updated_at = now()
  where p.id = p_project_id;

  if not found then raise exception '方案不存在'; end if;
end; $$;
revoke all on function public.save_project(uuid, text, text) from public, anon, authenticated;
grant execute on function public.save_project(uuid, text, text) to authenticated;

alter table public.projects enable row level security;
drop policy if exists "project select member" on public.projects;
create policy "project select member" on public.projects
  for select to authenticated
  using (private.can_access_project(id, (select auth.uid())));
drop policy if exists "project insert owner" on public.projects;
create policy "project insert owner" on public.projects
  for insert to authenticated
  with check (owner_id = (select auth.uid()));
drop policy if exists "project update member" on public.projects;
create policy "project update member" on public.projects
  for update to authenticated
  using (private.can_edit_project(id, (select auth.uid())));
drop policy if exists "project delete owner" on public.projects;
create policy "project delete owner" on public.projects
  for delete to authenticated
  using (private.is_project_owner(id, (select auth.uid())));
grant select, insert, update, delete on public.projects to authenticated;

alter table public.project_members enable row level security;
grant select, insert, update, delete on public.project_members to authenticated;
drop policy if exists "member select project access" on public.project_members;
create policy "member select project access" on public.project_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_project_owner(project_id, (select auth.uid())));
drop policy if exists "member insert owner" on public.project_members;
create policy "member insert owner" on public.project_members
  for insert to authenticated
  with check (private.is_project_owner(project_id, (select auth.uid())));
drop policy if exists "member update owner" on public.project_members;
create policy "member update owner" on public.project_members
  for update to authenticated
  using (private.is_project_owner(project_id, (select auth.uid())));
drop policy if exists "member delete owner or self" on public.project_members;
create policy "member delete owner or self" on public.project_members
  for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_project_owner(project_id, (select auth.uid())));

-- ============ project_invites：邀请链接 ============
create table if not exists public.project_invites (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  token       text not null unique default rtrim(translate(encode(gen_random_bytes(9), 'base64'), '+/', '-_'), '='),
  role        text not null default 'editor' check (role in ('editor','viewer')),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  uses        int not null default 0,
  max_uses    int  -- null = 无限
);
alter table public.project_invites
  alter column token set default rtrim(translate(encode(gen_random_bytes(9), 'base64'), '+/', '-_'), '=');

alter table public.project_invites enable row level security;
grant select, insert, delete on public.project_invites to authenticated;
drop policy if exists "invite select project access" on public.project_invites;
create policy "invite select project access" on public.project_invites
  for select to authenticated
  using (created_by = (select auth.uid()) or private.is_project_owner(project_id, (select auth.uid())));
drop policy if exists "invite insert owner" on public.project_invites;
create policy "invite insert owner" on public.project_invites
  for insert to authenticated
  with check (private.is_project_owner(project_id, (select auth.uid())));
drop policy if exists "invite delete owner" on public.project_invites;
create policy "invite delete owner" on public.project_invites
  for delete to authenticated
  using (private.is_project_owner(project_id, (select auth.uid())));

-- 通过邀请链接加入项目（security definer，前端校验前无法读取 invite）
create or replace function public.redeem_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv record; v_pid uuid;
begin
  if auth.uid() is null then raise exception '请先登录后加入协作'; end if;
  select * into v_inv from public.project_invites where token = p_token for update;
  if not found then raise exception '邀请链接无效'; end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception '邀请链接已过期';
  end if;
  if v_inv.max_uses is not null and v_inv.uses >= v_inv.max_uses then
    raise exception '邀请链接使用次数已达上限';
  end if;
  insert into public.project_members (project_id, user_id, role)
    values (v_inv.project_id, auth.uid(), v_inv.role)
    on conflict (project_id, user_id) do update set role = excluded.role;
  update public.project_invites set uses = uses + 1 where token = p_token;
  v_pid := v_inv.project_id;
  return v_pid;
end; $$;
revoke all on function public.redeem_invite(text) from public, anon, authenticated;
grant execute on function public.redeem_invite(text) to authenticated;

-- ============ project_snapshots：版本历史（可选） ============
create table if not exists public.project_snapshots (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null default '',
  ydoc        bytea not null,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.project_snapshots enable row level security;
grant select, insert, delete on public.project_snapshots to authenticated;
drop policy if exists "snapshot select member" on public.project_snapshots;
create policy "snapshot select member" on public.project_snapshots
  for select to authenticated
  using (private.can_access_project(project_id, (select auth.uid())));
drop policy if exists "snapshot insert editor" on public.project_snapshots;
create policy "snapshot insert editor" on public.project_snapshots
  for insert to authenticated
  with check (private.can_edit_project(project_id, (select auth.uid())));
drop policy if exists "snapshot delete owner" on public.project_snapshots;
create policy "snapshot delete owner" on public.project_snapshots
  for delete to authenticated
  using (private.is_project_owner(project_id, (select auth.uid())));

-- ============ Realtime：广播 yjs 更新需要成员可订阅频道 ============
-- Supabase Realtime Authorization 通过 realtime.messages 的 RLS 生效；
-- 客户端频道必须使用 config.private = true。
do $$
begin
  if to_regclass('realtime.messages') is null or to_regproc('realtime.topic') is null then
    raise notice 'Skipping Realtime Authorization policies because realtime.messages or realtime.topic() is not available yet. Re-run this schema after enabling Realtime private channel authorization.';
  else
    alter table realtime.messages enable row level security;

    drop policy if exists "yjs project members can read realtime" on realtime.messages;
    drop policy if exists "yjs project editors can send broadcasts" on realtime.messages;
    drop policy if exists "yjs project members can track presence" on realtime.messages;

    drop function if exists public.can_access_realtime_project();
    drop function if exists public.can_edit_realtime_project();
    drop function if exists public.realtime_yjs_project_id();

    execute $sql$
      create or replace function private.realtime_yjs_project_id()
      returns uuid language sql stable set search_path = '' as $fn$
        select case
          when (select realtime.topic()) ~ '^yjs:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then substring((select realtime.topic()) from 5)::uuid
          else null
        end;
      $fn$;
    $sql$;

    execute $sql$
      create or replace function private.can_access_realtime_project()
      returns boolean language sql stable security definer set search_path = '' as $fn$
        select private.can_access_project(private.realtime_yjs_project_id(), (select auth.uid()));
      $fn$;
    $sql$;

    execute $sql$
      create or replace function private.can_edit_realtime_project()
      returns boolean language sql stable security definer set search_path = '' as $fn$
        select private.can_edit_project(private.realtime_yjs_project_id(), (select auth.uid()));
      $fn$;
    $sql$;

    revoke all on function private.realtime_yjs_project_id() from public;
    revoke all on function private.can_access_realtime_project() from public;
    revoke all on function private.can_edit_realtime_project() from public;
    grant execute on function private.realtime_yjs_project_id() to authenticated;
    grant execute on function private.can_access_realtime_project() to authenticated;
    grant execute on function private.can_edit_realtime_project() to authenticated;

    create policy "yjs project members can read realtime" on realtime.messages
      for select to authenticated using (
        realtime.messages.extension in ('broadcast', 'presence')
        and (select private.can_access_realtime_project())
      );

    create policy "yjs project editors can send broadcasts" on realtime.messages
      for insert to authenticated with check (
        realtime.messages.extension = 'broadcast'
        and (select private.can_edit_realtime_project())
      );

    create policy "yjs project members can track presence" on realtime.messages
      for insert to authenticated with check (
        realtime.messages.extension = 'presence'
        and (select private.can_access_realtime_project())
      );
  end if;
end $$;
