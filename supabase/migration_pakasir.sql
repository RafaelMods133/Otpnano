-- ============================================================
-- MIGRATION: Tambah kolom Pakasir ke tabel deposits
-- Jalankan di Supabase SQL Editor setelah schema awal sudah ada
-- ============================================================

-- Tambah kolom payment method dan data Pakasir
alter table public.deposits
  add column if not exists payment_method text not null default 'qris',
  add column if not exists pakasir_order_id text unique,
  add column if not exists payment_number text,   -- QR string atau nomor VA
  add column if not exists fee bigint not null default 0,
  add column if not exists total_payment bigint not null default 0;

-- Index untuk lookup by pakasir_order_id (dipakai saat webhook masuk)
create index if not exists idx_deposits_pakasir_order_id
  on public.deposits(pakasir_order_id)
  where pakasir_order_id is not null;

-- Update fungsi credit_deposit agar menerima pakasir_order_id sebagai identifier
-- (webhook Pakasir menggunakan order_id, bukan RRN seperti SMP Payment)
create or replace function public.credit_deposit_pakasir(
  p_pakasir_order_id text,
  p_amount bigint
)
returns jsonb language plpgsql security definer as $$
declare
  v_deposit_id uuid;
  v_user_id uuid;
  v_status text;
  v_new_balance bigint;
begin
  select id, user_id, status
    into v_deposit_id, v_user_id, v_status
    from public.deposits
   where pakasir_order_id = p_pakasir_order_id
   for update;

  if v_deposit_id is null then
    return jsonb_build_object('error', 'DEPOSIT_NOT_FOUND');
  end if;

  if v_status <> 'pending' then
    return jsonb_build_object('error', 'DEPOSIT_ALREADY_PROCESSED');
  end if;

  update public.deposits
     set status = 'paid',
         paid_at = now()
   where id = v_deposit_id;

  update public.profiles
     set balance = balance + p_amount
   where id = v_user_id
   returning balance into v_new_balance;

  insert into public.wallet_ledger
    (user_id, amount, balance_after, type, reference_id, description)
  values
    (v_user_id, p_amount, v_new_balance, 'deposit', v_deposit_id,
     'Deposit via Pakasir - order ' || p_pakasir_order_id);

  return jsonb_build_object('success', true, 'balance_after', v_new_balance);
end;
$$;
