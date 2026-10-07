-- Isolated pilot schema; never enable this as a second writer beside SQLite.
create table public.ilaw_cloud_plans (
 id uuid primary key,
 owner_id uuid not null references auth.users(id),
 revision integer not null check (revision > 0),
 payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 350000),
 modified_at timestamptz not null default now()
);
create table public.ilaw_cloud_revisions (
 plan_id uuid not null references public.ilaw_cloud_plans(id) on delete cascade,
 revision integer not null,
 owner_id uuid not null references auth.users(id),
 payload jsonb not null,
 created_at timestamptz not null default now(),
 primary key(plan_id,revision)
);
alter table public.ilaw_cloud_plans enable row level security;
alter table public.ilaw_cloud_revisions enable row level security;
create policy owner_read on public.ilaw_cloud_plans for select to authenticated using ((select auth.uid())=owner_id);
create policy owner_history_read on public.ilaw_cloud_revisions for select to authenticated using ((select auth.uid())=owner_id);
revoke all on public.ilaw_cloud_plans,public.ilaw_cloud_revisions from anon,authenticated;
grant select on public.ilaw_cloud_plans,public.ilaw_cloud_revisions to authenticated;
-- Writes pass through one atomic, owner-checked, optimistic RPC. No direct UPDATE grant.
create function public.ilaw_save_plan(plan_id uuid,expected_revision integer,plan_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); current_revision integer; current_owner uuid; next_revision integer;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if expected_revision is null or expected_revision < 0 or jsonb_typeof(plan_payload) <> 'object' or plan_payload is null or octet_length(plan_payload::text)>350000 then raise exception 'Invalid plan' using errcode='22023'; end if;
 if plan_payload->>'id' is distinct from plan_id::text or (plan_payload->>'schemaVersion') is distinct from '1' then raise exception 'Plan identity/version mismatch' using errcode='22023'; end if;
 -- Serializes simultaneous creation as well as updates, including a missing row.
 perform pg_advisory_xact_lock(hashtextextended(plan_id::text,0));
 select revision,owner_id into current_revision,current_owner from public.ilaw_cloud_plans where id=plan_id for update;
 if found then
  if current_owner <> actor then raise exception 'Plan not found' using errcode='42501'; end if;
  if current_revision <> expected_revision then raise exception 'Revision conflict' using errcode='40001'; end if;
 else
  if expected_revision <> 0 then raise exception 'Revision conflict' using errcode='40001'; end if;
  current_revision := 0;
 end if;
 next_revision := current_revision+1;
 plan_payload := jsonb_set(plan_payload,'{revision}',to_jsonb(next_revision));
 insert into public.ilaw_cloud_plans(id,owner_id,revision,payload) values(plan_id,actor,next_revision,plan_payload)
 on conflict(id) do update set revision=excluded.revision,payload=excluded.payload,modified_at=now();
 insert into public.ilaw_cloud_revisions(plan_id,revision,owner_id,payload) values(plan_id,next_revision,actor,plan_payload);
 return plan_payload;
end $$;
revoke all on function public.ilaw_save_plan(uuid,integer,jsonb) from public,anon;
grant execute on function public.ilaw_save_plan(uuid,integer,jsonb) to authenticated;
