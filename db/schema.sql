-- 栖居设计 · 账号 / 云端项目 / 协作 数据库 Schema
-- 在 Supabase 后台 SQL Editor 中整体执行。重复执行前建议先 DROP 旧对象。

-- ============ 扩展 ============
create extension if not exists "pgcrypto";

-- ============ profiles：用户档案 ============
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null default '',
  display_name text not null default '',
  avatar_url  text,
  color       text not null default '#4f8cff',  -- 协作光标颜色
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles
  for update using (auth.uid() = id);

-- 注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), '')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ projects：云端方案（Yjs 文档存储） ============
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null default '未命名方案',
  ydoc        bytea,                               -- Y.encodeStateAsUpdate
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.projects enable row level security;
drop policy if exists "project select member" on public.projects;
create policy "project select member" on public.projects
  for select using (
    owner_id = auth.uid() or exists (
      select 1 from public.project_members m
      where m.project_id = projects.id and m.user_id = auth.uid()
    )
  );
drop policy if exists "project insert owner" on public.projects;
create policy "project insert owner" on public.projects
  for insert with check (owner_id = auth.uid());
drop policy if exists "project update member" on public.projects;
create policy "project update member" on public.projects
  for update using (
    owner_id = auth.uid() or exists (
      select 1 from public.project_members m
      where m.project_id = projects.id and m.user_id = auth.uid() and m.role in ('owner','editor')
    )
  );
drop policy if exists "project delete owner" on public.projects;
create policy "project delete owner" on public.projects
  for delete using (owner_id = auth.uid());

-- updated_at 自动更新
create or replace function public.touch_project_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
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

alter table public.project_members enable row level security;
drop policy if exists "member select project access" on public.project_members;
create policy "member select project access" on public.project_members
  for select using (
    user_id = auth.uid() or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );
drop policy if exists "member insert owner" on public.project_members;
create policy "member insert owner" on public.project_members
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
drop policy if exists "member update owner" on public.project_members;
create policy "member update owner" on public.project_members
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
drop policy if exists "member delete owner or self" on public.project_members;
create policy "member delete owner or self" on public.project_members
  for delete using (
    user_id = auth.uid() or exists (
      select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- ============ project_invites：邀请链接 ============
create table if not exists public.project_invites (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  role        text not null default 'editor' check (role in ('editor','viewer')),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  uses        int not null default 0,
  max_uses    int  -- null = 无限
);

alter table public.project_invites enable row level security;
drop policy if exists "invite select project access" on public.project_invites;
create policy "invite select project access" on public.project_invites
  for select using (
    created_by = auth.uid() or exists (
      select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()
    )
  );
drop policy if exists "invite insert owner" on public.project_invites;
create policy "invite insert owner" on public.project_invites
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
drop policy if exists "invite delete owner" on public.project_invites;
create policy "invite delete owner" on public.project_invites
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- 通过邀请链接加入项目（security definer，前端校验前无法读取 invite）
create or replace function public.redeem_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv record; v_pid uuid;
begin
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
drop policy if exists "snapshot select member" on public.project_snapshots;
create policy "snapshot select member" on public.project_snapshots
  for select using (
    exists (select 1 from public.projects p
            where p.id = project_id and (p.owner_id = auth.uid()
              or exists (select 1 from public.project_members m
                         where m.project_id = p.id and m.user_id = auth.uid())))
  );
drop policy if exists "snapshot insert editor" on public.project_snapshots;
create policy "snapshot insert editor" on public.project_snapshots
  for insert with check (
    exists (select 1 from public.projects p
            where p.id = project_id and (p.owner_id = auth.uid()
              or exists (select 1 from public.project_members m
                         where m.project_id = p.id and m.user_id = auth.uid() and m.role <> 'viewer')))
  );
drop policy if exists "snapshot delete owner" on public.project_snapshots;
create policy "snapshot delete owner" on public.project_snapshots
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ============ Realtime：广播 yjs 更新需要成员可订阅频道 ============
-- 通过 Realtime Authorization（Supabase 后台 > Realtime > Authorization）
-- 配置 policy: channel yjs:* 允许 project_members 订阅/广播。详见 db/README.md
