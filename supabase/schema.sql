create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_customer_profile();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  price integer not null check (price >= 0),
  promo_price integer check (promo_price is null or (promo_price >= 0 and promo_price < price)),
  image_url text not null default '',
  available boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  active boolean not null default true,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  shop_name text not null default 'Douceurs du Gabon',
  tagline text not null default 'Des gâteaux faits avec amour',
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default true,
  check (pickup_enabled or delivery_enabled),
  airtel_money_phone text not null default '',
  moov_money_phone text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null default '',
  items jsonb not null,
  requested_date date,
  customization text not null default '',
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  delivery_address text not null default '',
  payment_method text not null check (payment_method in ('Airtel Money', 'Moov Money', 'Paiement à la remise')),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

create or replace function public.submit_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_items jsonb,
  p_customization text,
  p_fulfillment text,
  p_delivery_address text,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_item jsonb;
  product_row record;
  item_quantity integer;
  item_date date;
  requested_date date;
  item_price integer;
  subtotal integer := 0;
  delivery_fee integer := 0;
  total integer;
  normalized_items jsonb := '[]'::jsonb;
  pickup_enabled boolean;
  delivery_enabled boolean;
  order_id uuid;
begin
  if nullif(btrim(p_customer_name), '') is null or nullif(btrim(p_customer_phone), '') is null then
    raise exception 'Le nom et le numéro de téléphone sont obligatoires.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'La liste des articles est invalide.';
  end if;
  if jsonb_array_length(p_items) < 1 then
    raise exception 'La commande doit contenir au moins un article.';
  end if;
  if p_fulfillment is null or p_fulfillment not in ('pickup', 'delivery') then
    raise exception 'Mode de réception invalide.';
  end if;
  if p_payment_method is null or p_payment_method not in ('Airtel Money', 'Moov Money', 'Paiement à la remise') then
    raise exception 'Moyen de paiement invalide.';
  end if;
  if p_fulfillment = 'delivery' and nullif(btrim(p_delivery_address), '') is null then
    raise exception 'L’adresse de livraison est obligatoire.';
  end if;

  select s.pickup_enabled, s.delivery_enabled, s.delivery_fee
    into pickup_enabled, delivery_enabled, delivery_fee
    from public.site_settings as s
    where s.id = 1;
  if not found then
    raise exception 'Les informations de la boutique ne sont pas configurées.';
  end if;
  if (p_fulfillment = 'pickup' and not pickup_enabled) or (p_fulfillment = 'delivery' and not delivery_enabled) then
    raise exception 'Ce mode de réception n’est pas disponible.';
  end if;
  if p_fulfillment = 'pickup' then
    delivery_fee := 0;
  end if;

  for order_item in select value from jsonb_array_elements(p_items)
  loop
    item_quantity := nullif(order_item->>'quantity', '')::integer;
    if item_quantity is null or item_quantity < 1 then
      raise exception 'La quantité demandée est invalide.';
    end if;
    select p.id, p.name, p.price, p.promo_price
      into product_row
      from public.products as p
      where p.id = (order_item->>'product_id')::uuid
        and p.published = true
        and p.available = true;
    if not found then
      raise exception 'Un gâteau demandé n’est plus disponible.';
    end if;

    item_price := coalesce(product_row.promo_price, product_row.price);
    subtotal := subtotal + item_price * item_quantity;
    item_date := nullif(order_item->>'requested_date', '')::date;
    if item_date is not null then
      if item_date < current_date then
        raise exception 'La date souhaitée ne peut pas être dans le passé.';
      end if;
      if requested_date is null or item_date < requested_date then
        requested_date := item_date;
      end if;
    end if;
    normalized_items := normalized_items || jsonb_build_array(jsonb_build_object(
      'product_id', product_row.id,
      'name', product_row.name,
      'size', coalesce(nullif(btrim(order_item->>'size'), ''), '6 parts'),
      'quantity', item_quantity,
      'unit_price', item_price,
      'customization', coalesce(order_item->>'customization', ''),
      'requested_date', item_date
    ));
  end loop;

  total := subtotal + delivery_fee;
  insert into public.orders (
    customer_name, customer_phone, customer_email, items, requested_date,
    customization, fulfillment, delivery_address, payment_method,
    subtotal, delivery_fee, total, status
  ) values (
    btrim(p_customer_name), btrim(p_customer_phone), coalesce(btrim(p_customer_email), ''),
    normalized_items, requested_date, coalesce(p_customization, ''),
    p_fulfillment, coalesce(btrim(p_delivery_address), ''), p_payment_method,
    subtotal, delivery_fee, total, 'pending'
  )
  returning id into order_id;

  return jsonb_build_object(
    'id', order_id,
    'items', normalized_items,
    'subtotal', subtotal,
    'delivery_fee', delivery_fee,
    'total', total
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Profiles are visible to their owner or admins" on public.profiles;
create policy "Profiles are visible to their owner or admins"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Categories are public to read and admin managed" on public.categories;
create policy "Categories are public to read and admin managed"
  on public.categories for select to anon, authenticated using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Published products are public" on public.products;
create policy "Published products are public"
  on public.products for select to anon, authenticated
  using (published = true or (select public.is_admin()));
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Active promotions are public" on public.promotions;
create policy "Active promotions are public"
  on public.promotions for select to anon, authenticated
  using (active = true or (select public.is_admin()));
drop policy if exists "Admins manage promotions" on public.promotions;
create policy "Admins manage promotions"
  on public.promotions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Site settings are publicly readable" on public.site_settings;
create policy "Site settings are publicly readable"
  on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Customers can submit pending orders" on public.orders;
drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders"
  on public.orders for select to authenticated
  using ((select public.is_admin()));
drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
  on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins delete orders" on public.orders;
create policy "Admins delete orders"
  on public.orders for delete to authenticated
  using ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cake-photos', 'cake-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Cake photos are publicly viewable" on storage.objects;
create policy "Cake photos are publicly viewable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'cake-photos');
drop policy if exists "Admins upload cake photos" on storage.objects;
create policy "Admins upload cake photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cake-photos' and (select public.is_admin()));
drop policy if exists "Admins update cake photos" on storage.objects;
create policy "Admins update cake photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'cake-photos' and (select public.is_admin()))
  with check (bucket_id = 'cake-photos' and (select public.is_admin()));
drop policy if exists "Admins delete cake photos" on storage.objects;
create policy "Admins delete cake photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cake-photos' and (select public.is_admin()));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.promotions, public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.categories, public.products, public.promotions, public.site_settings to authenticated;
grant select, update, delete on public.orders to authenticated;
revoke insert on public.orders from public, anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on function public.submit_order(text, text, text, jsonb, text, text, text, text) from public;
grant execute on function public.submit_order(text, text, text, jsonb, text, text, text, text) to anon, authenticated;

insert into public.categories (name)
values ('Gâteaux d''anniversaire'), ('Gâteaux de mariage'), ('Pâtisseries'), ('Gâteaux traditionnels')
on conflict (name) do nothing;
