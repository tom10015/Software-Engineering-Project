-- Run once in Supabase SQL Editor on a NEW project.
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, role text not null default 'student' check(role in('student','admin')));
create table public.rooms (id uuid primary key default gen_random_uuid(), name text unique not null, capacity int not null check(capacity>0), active boolean not null default true);
create table public.events (id uuid primary key default gen_random_uuid(), organizer_id uuid not null references auth.users(id), room_id uuid not null references public.rooms(id), title text not null check(length(trim(title)) between 1 and 100), description text not null default '', event_date date not null, start_time time not null, end_time time not null, attendees integer not null check(attendees>0), status text not null default 'pending' check(status in('pending','approved','rejected')), created_at timestamptz not null default now(), check(end_time>start_time));
create index on public.events(room_id,event_date,status);
create or replace function public.new_profile() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.profiles(id) values(new.id);return new;end$$;
create trigger user_profile after insert on auth.users for each row execute function public.new_profile();
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin')$$;
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.events enable row level security;
create policy "own profile" on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy "public rooms" on public.rooms for select to anon,authenticated using(active);
create policy "approved own or admin" on public.events for select to anon,authenticated using(status='approved' or organizer_id=(select auth.uid()) or (select public.is_admin()));
create policy "submit pending" on public.events for insert to authenticated with check(organizer_id=(select auth.uid()) and status='pending');
create or replace function public.validate_request() returns trigger language plpgsql security definer set search_path='' as $$
declare cap integer;
begin
select capacity into cap from public.rooms where id=new.room_id and active;
if cap is null then raise exception 'Room not available';end if;
if new.attendees>cap then raise exception 'Room capacity exceeded';end if;
if new.event_date<current_date then raise exception 'Date is in the past';end if;
return new;
end$$;
create trigger validate_request before insert on public.events for each row execute function public.validate_request();
create or replace function public.review_event(event_id uuid,new_status text) returns void language plpgsql security definer set search_path='' as $$
declare target public.events%rowtype;
begin
if not public.is_admin() then raise exception 'Admin access required';end if;
if new_status not in('approved','rejected') then raise exception 'Invalid status';end if;
select * into target from public.events where id=event_id;
if not found or target.status<>'pending' then raise exception 'Pending request not found';end if;
perform 1 from public.rooms where id=target.room_id for update;
if new_status='approved' and exists(select 1 from public.events e where e.room_id=target.room_id and e.event_date=target.event_date and e.status='approved' and e.start_time<target.end_time and target.start_time<e.end_time) then raise exception 'Room already booked at this time';end if;
update public.events set status=new_status where id=event_id;
end$$;
revoke all on function public.review_event(uuid,text) from public,anon;
grant execute on function public.review_event(uuid,text) to authenticated;
insert into public.rooms(name,capacity) values('Student Center A',50),('Library Meeting Room',20),('Auditorium',150),('Tapia 208',35);
-- After signing up, assign yourself admin separately:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL@example.com');