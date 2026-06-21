-- ============================================================
-- NOKOS APP - SUPABASE SCHEMA
-- Platform pembelian nomor virtual (nokos) + deposit QRIS
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES
-- Diisi otomatis saat user signup lewat Supabase Auth (trigger di bawah)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  balance bigint not null default 0, -- saldo dalam Rupiah (integer, tanpa desimal)
  role text not null default 'user' check (role in ('user', 'admin')),
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on public.profiles(username);

-- ------------------------------------------------------------
-- COUNTRIES
-- Daftar negara yang tersedia untuk nokos
-- ------------------------------------------------------------
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,        -- contoh: 'ID', 'US', 'MY'
  name text not null,               -- contoh: 'Indonesia'
  dial_code text not null,          -- contoh: '+62'
  flag_emoji text not null default '',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SERVICES
-- Daftar layanan/aplikasi (WhatsApp, Telegram, dst)
-- ------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,        -- contoh: 'whatsapp', 'telegram'
  name text not null,               -- contoh: 'WhatsApp'
  icon_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PRODUCTS
-- Kombinasi negara + layanan + harga + stok dari provider Rumah OTP
-- provider_country_id / provider_service_id menyimpan id versi provider
-- agar bisa dipetakan saat request nomor
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  provider_country_code text not null,
  provider_service_code text not null,
  price bigint not null,            -- harga jual ke user (Rupiah)
  provider_price bigint not null default 0, -- harga modal dari provider (untuk margin)
  stock int not null default 0,
  is_best_seller boolean not null default false,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (country_id, service_id)
);

create index if not exists idx_products_country on public.products(country_id);
create index if not exists idx_products_service on public.products(service_id);
create index if not exists idx_products_best_seller on public.products(is_best_seller) where is_best_seller = true;

-- ------------------------------------------------------------
-- DEPOSITS
-- Riwayat permintaan deposit user via QRIS statis.
-- Nominal unik ditambah kode unik kecil agar bisa dicocokkan
-- dengan payload callback (amount.value) secara otomatis.
-- ------------------------------------------------------------
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_amount bigint not null,     -- nominal yang diminta user (sebelum unique code)
  unique_code int not null default 0,   -- kode unik 1-999 ditambahkan ke nominal
  total_amount bigint not null,         -- requested_amount + unique_code, ini yang harus ditransfer
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'cancelled')),
  rrn text unique,                      -- diisi saat callback masuk, mencegah duplikasi
  payer_name text,
  issuer text,
  paid_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists idx_deposits_user on public.deposits(user_id);
create index if not exists idx_deposits_status on public.deposits(status);
create unique index if not exists idx_deposits_pending_amount
  on public.deposits(total_amount)
  where status = 'pending';

-- ------------------------------------------------------------
-- WALLET LEDGER
-- Audit trail tiap perubahan saldo (deposit, pembelian, refund)
-- ------------------------------------------------------------
create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null,           -- positif = kredit, negatif = debit
  balance_after bigint not null,
  type text not null check (type in ('deposit', 'purchase', 'refund', 'adjustment')),
  reference_id uuid,                -- id deposit atau order terkait
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_ledger_user on public.wallet_ledger(user_id);

-- ------------------------------------------------------------
-- ORDERS
-- Transaksi pembelian nokos
-- ------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id),
  country_id uuid not null references public.countries(id),
  service_id uuid not null references public.services(id),
  price bigint not null,
  provider_order_id text,           -- id order dari Rumah OTP
  phone_number text,
  otp_code text,
  status text not null default 'pending' check (
    status in ('pending', 'waiting_otp', 'completed', 'expired', 'cancelled', 'refunded')
  ),
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Auto-create profile saat user baru signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- RPC: kredit saldo user secara atomic + catat ledger
-- Dipanggil oleh API callback (service role) setelah deposit lunas
-- ------------------------------------------------------------
create or replace function public.credit_deposit(
  p_deposit_id uuid,
  p_rrn text,
  p_payer_name text,
  p_issuer text
)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid;
  v_amount bigint;
  v_status text;
  v_new_balance bigint;
begin
  select user_id, total_amount, status
    into v_user_id, v_amount, v_status
    from public.deposits
   where id = p_deposit_id
   for update;

  if v_status is null then
    raise exception 'DEPOSIT_NOT_FOUND';
  end if;

  if v_status <> 'pending' then
    raise exception 'DEPOSIT_ALREADY_PROCESSED';
  end if;

  update public.deposits
     set status = 'paid',
         rrn = p_rrn,
         payer_name = p_payer_name,
         issuer = p_issuer,
         paid_at = now()
   where id = p_deposit_id;

  update public.profiles
     set balance = balance + v_amount
   where id = v_user_id
   returning balance into v_new_balance;

  insert into public.wallet_ledger (user_id, amount, balance_after, type, reference_id, description)
  values (v_user_id, v_amount, v_new_balance, 'deposit', p_deposit_id, 'Deposit QRIS - RRN ' || p_rrn);
end;
$$;

-- ------------------------------------------------------------
-- RPC: debit saldo user untuk pembelian nokos (atomic, anti saldo negatif)
-- ------------------------------------------------------------
create or replace function public.debit_for_purchase(
  p_user_id uuid,
  p_amount bigint,
  p_order_id uuid,
  p_description text
)
returns void language plpgsql security definer as $$
declare
  v_balance bigint;
  v_new_balance bigint;
begin
  select balance into v_balance
    from public.profiles
   where id = p_user_id
   for update;

  if v_balance is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  if v_balance < p_amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.profiles
     set balance = balance - p_amount
   where id = p_user_id
   returning balance into v_new_balance;

  insert into public.wallet_ledger (user_id, amount, balance_after, type, reference_id, description)
  values (p_user_id, -p_amount, v_new_balance, 'purchase', p_order_id, p_description);
end;
$$;

-- ------------------------------------------------------------
-- RPC: refund (saat order expired/cancelled tanpa OTP)
-- ------------------------------------------------------------
create or replace function public.refund_order(
  p_order_id uuid
)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid;
  v_amount bigint;
  v_status text;
  v_new_balance bigint;
begin
  select user_id, price, status into v_user_id, v_amount, v_status
    from public.orders
   where id = p_order_id
   for update;

  if v_status is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_status in ('completed', 'refunded') then
    raise exception 'ORDER_NOT_REFUNDABLE';
  end if;

  update public.orders set status = 'refunded' where id = p_order_id;

  update public.profiles
     set balance = balance + v_amount
   where id = v_user_id
   returning balance into v_new_balance;

  insert into public.wallet_ledger (user_id, amount, balance_after, type, reference_id, description)
  values (v_user_id, v_amount, v_new_balance, 'refund', p_order_id, 'Refund order nokos');
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.countries enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.deposits enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.orders enable row level security;

-- Profiles: user hanya bisa lihat & update profil sendiri
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and balance = (select balance from public.profiles where id = auth.uid()));
  -- balance tidak boleh diubah langsung oleh user, hanya lewat RPC (security definer)

-- Countries & Services & Products: publik bisa baca, hanya yang aktif
drop policy if exists "countries_public_read" on public.countries;
create policy "countries_public_read" on public.countries
  for select using (is_active = true);

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services
  for select using (is_active = true);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (is_active = true);

-- Deposits: user hanya bisa lihat & insert miliknya sendiri
drop policy if exists "deposits_select_own" on public.deposits;
create policy "deposits_select_own" on public.deposits
  for select using (auth.uid() = user_id);

drop policy if exists "deposits_insert_own" on public.deposits;
create policy "deposits_insert_own" on public.deposits
  for insert with check (auth.uid() = user_id);

-- Wallet ledger: read-only milik sendiri
drop policy if exists "ledger_select_own" on public.wallet_ledger;
create policy "ledger_select_own" on public.wallet_ledger
  for select using (auth.uid() = user_id);

-- Orders: user hanya bisa lihat & insert miliknya sendiri
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- SEED DATA AWAL
-- ============================================================
insert into public.countries (code, name, dial_code, flag_emoji, sort_order) values
  ('ID', 'Indonesia', '+62', '🇮🇩', 1),
  ('MY', 'Malaysia', '+60', '🇲🇾', 2),
  ('SG', 'Singapura', '+65', '🇸🇬', 3),
  ('US', 'Amerika Serikat', '+1', '🇺🇸', 4),
  ('GB', 'Inggris', '+44', '🇬🇧', 5),
  ('IN', 'India', '+91', '🇮🇳', 6),
  ('VN', 'Vietnam', '+84', '🇻🇳', 7),
  ('PH', 'Filipina', '+63', '🇵🇭', 8),
  ('TH', 'Thailand', '+66', '🇹🇭', 9),
  ('RU', 'Rusia', '+7', '🇷🇺', 10)
on conflict (code) do nothing;

insert into public.services (code, name, sort_order) values
  ('whatsapp', 'WhatsApp', 1),
  ('telegram', 'Telegram', 2),
  ('facebook', 'Facebook', 3),
  ('instagram', 'Instagram', 4),
  ('google', 'Google', 5),
  ('tiktok', 'TikTok', 6),
  ('discord', 'Discord', 7),
  ('shopee', 'Shopee', 8)
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- Contoh produk awal (silakan sesuaikan harga, stok, dan kode
-- provider_country_code / provider_service_code setelah integrasi
-- Rumah OTP berjalan). Indonesia + WhatsApp ditandai best seller
-- sesuai kebutuhan tampilan homepage.
-- ------------------------------------------------------------
insert into public.products (
  country_id, service_id, provider_country_code, provider_service_code,
  price, provider_price, stock, is_best_seller
)
select
  c.id, s.id, lower(c.code), s.code, v.price, v.provider_price, v.stock, v.is_best_seller
from (
  values
    ('ID', 'whatsapp', 2500, 1800, 50, true),
    ('ID', 'telegram', 2000, 1400, 50, true),
    ('ID', 'google', 3000, 2200, 30, false),
    ('ID', 'facebook', 2200, 1600, 30, false),
    ('MY', 'whatsapp', 4500, 3500, 20, false),
    ('SG', 'whatsapp', 5500, 4200, 20, false),
    ('US', 'whatsapp', 6000, 4500, 20, false),
    ('US', 'telegram', 5500, 4000, 20, false)
) as v(country_code, service_code, price, provider_price, stock, is_best_seller)
join public.countries c on c.code = v.country_code
join public.services s on s.code = v.service_code
on conflict (country_id, service_id) do nothing;
