-- TALI database — run once in Supabase → SQL Editor (or `supabase db push`).
-- Every table has an owner_id. Row-level security makes sure each seller can only
-- read and change her own rows, even though all sellers share one database.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Business profile (one per seller)
-- ------------------------------------------------------------------
create table public.businesses (
  owner_id   uuid primary key default auth.uid() references auth.users on delete cascade,
  name       text not null default '',
  goal       numeric(12,2) not null default 1000,
  lang       text not null default 'en' check (lang in ('en','ar')),
  channels   jsonb not null default '{"instagram": true, "website": false, "talabat": false, "careem": false}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Products, customers
-- ------------------------------------------------------------------
create table public.products (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  price      numeric(12,2) not null default 0 check (price >= 0),
  cost       numeric(12,2) not null default 0 check (cost >= 0),
  stock      integer not null default 0,
  alert_at   integer not null default 5,
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  phone      text not null default '',
  area       text not null default '',
  channel    text not null default 'Instagram',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Orders and the items in each order (price + cost are copied at sale time)
-- ------------------------------------------------------------------
create table public.orders (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users on delete cascade,
  number       integer not null,
  customer_id  uuid references public.customers on delete set null,
  channel      text not null default 'Instagram',
  status       text not null default 'New'
               check (status in ('New','Confirmed','Processing','Shipped','Delivered','Cancelled')),
  payment      text not null default 'Paid' check (payment in ('Paid','Unpaid','Cash on delivery')),
  delivery_fee numeric(12,2) not null default 0,
  discount     numeric(12,2) not null default 0,
  delivery_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (owner_id, number)
);

create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users on delete cascade,
  order_id   uuid not null references public.orders on delete cascade,
  product_id uuid references public.products on delete set null,
  qty        integer not null check (qty > 0),
  unit_price numeric(12,2) not null,
  unit_cost  numeric(12,2) not null default 0
);

-- ------------------------------------------------------------------
-- Planner tasks, expenses, WhatsApp message log
-- ------------------------------------------------------------------
create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users on delete cascade,
  title      text not null,
  meta       text not null default '',
  kind       text not null default 'task' check (kind in ('task','reminder','delivery')),
  state      text not null default 'todo' check (state in ('todo','progress','done')),
  due_at     timestamptz not null default now(),
  done_at    timestamptz,
  order_id   uuid references public.orders on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users on delete cascade,
  title      text not null,
  amount     numeric(12,2) not null check (amount >= 0),
  category   text not null default 'products' check (category in ('truck','products','camera')),
  spent_on   date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  customer_id uuid references public.customers on delete cascade,
  order_id    uuid references public.orders on delete set null,
  template    text not null,
  sent_at     timestamptz not null default now()
);

create index on public.products (owner_id);
create index on public.customers (owner_id);
create index on public.orders (owner_id, created_at desc);
create index on public.order_items (order_id);
create index on public.tasks (owner_id, due_at);
create index on public.expenses (owner_id, spent_on desc);
create index on public.messages (owner_id, sent_at desc);

-- ------------------------------------------------------------------
-- Keep updated_at fresh
-- ------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger touch before update on public.businesses for each row execute function public.touch_updated_at();
create trigger touch before update on public.products   for each row execute function public.touch_updated_at();
create trigger touch before update on public.customers  for each row execute function public.touch_updated_at();
create trigger touch before update on public.orders     for each row execute function public.touch_updated_at();
create trigger touch before update on public.tasks      for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------
-- Row-level security: a seller sees and changes only her own rows
-- ------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['businesses','products','customers','orders','order_items','tasks','expenses','messages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated
                    using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t);
  end loop;
end $$;

-- A new account gets an empty business profile straight away
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.businesses (owner_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- Save an order in one step: order + items + stock + delivery task.
-- Runs with the caller's rights, so row-level security still applies.
-- ------------------------------------------------------------------
create or replace function public.create_order(
  p_id uuid,
  p_customer uuid,
  p_channel text,
  p_payment text,
  p_delivery_fee numeric,
  p_discount numeric,
  p_delivery_at timestamptz,
  p_items jsonb,            -- [{"product_id": "...", "qty": 2}, ...]
  p_created_at timestamptz default now(),
  p_status text default 'New'
) returns integer
language plpgsql security invoker set search_path = public as $$
declare
  v_owner uuid := auth.uid();
  v_number integer;
  v_item jsonb;
  v_name text;
  v_area text;
begin
  if v_owner is null then raise exception 'not signed in'; end if;

  -- per-seller order numbers start at 1001; the lock stops two devices taking the same number
  perform pg_advisory_xact_lock(hashtext(v_owner::text));
  select coalesce(max(number), 1000) + 1 into v_number from orders where owner_id = v_owner;

  insert into orders (id, owner_id, number, customer_id, channel, status, payment, delivery_fee, discount, delivery_at, created_at)
  values (p_id, v_owner, v_number, p_customer, p_channel, p_status, p_payment, p_delivery_fee, p_discount, p_delivery_at, p_created_at);

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (owner_id, order_id, product_id, qty, unit_price, unit_cost)
    select v_owner, p_id, p.id, (v_item->>'qty')::int, p.price, p.cost
    from products p where p.id = (v_item->>'product_id')::uuid;

    update products set stock = greatest(0, stock - (v_item->>'qty')::int)
    where id = (v_item->>'product_id')::uuid;
  end loop;

  if p_status not in ('Delivered','Cancelled') then
    select name, area into v_name, v_area from customers where id = p_customer;
    insert into tasks (owner_id, title, meta, kind, due_at, order_id)
    values (v_owner, 'Deliver #TL-' || v_number,
            case when v_name is null then '' else v_name || ' · ' || coalesce(nullif(split_part(v_area, ', ', 2), ''), v_area, '') end,
            'delivery', coalesce(p_delivery_at, now()), p_id);
  end if;

  return v_number;
end $$;

grant execute on function public.create_order to authenticated;

-- ------------------------------------------------------------------
-- Live sync: phone ⇄ laptop
-- ------------------------------------------------------------------
alter publication supabase_realtime add table
  public.businesses, public.products, public.customers, public.orders,
  public.order_items, public.tasks, public.expenses, public.messages;

-- ------------------------------------------------------------------
-- Change an order's status. Cancelling puts the items back in stock;
-- delivering or cancelling closes its delivery task.
-- ------------------------------------------------------------------
create or replace function public.set_order_status(p_id uuid, p_status text) returns void
language plpgsql security invoker set search_path = public as $$
declare v_old text;
begin
  select status into v_old from orders where id = p_id for update;
  if v_old is null or v_old = p_status then return; end if;

  update orders set status = p_status where id = p_id;

  if p_status = 'Cancelled' then
    update products p set stock = p.stock + i.qty
    from order_items i where i.order_id = p_id and i.product_id = p.id;
  elsif v_old = 'Cancelled' then
    update products p set stock = greatest(0, p.stock - i.qty)
    from order_items i where i.order_id = p_id and i.product_id = p.id;
  end if;

  if p_status in ('Delivered','Cancelled') then
    update tasks set state = 'done', done_at = coalesce(done_at, now()) where order_id = p_id and kind = 'delivery';
  end if;
end $$;

grant execute on function public.set_order_status to authenticated;
