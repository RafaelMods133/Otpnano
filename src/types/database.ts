// Tipe-tipe inti yang dipakai di seluruh aplikasi.
// Disinkronkan manual dengan supabase/schema.sql

export type DepositStatus = "pending" | "paid" | "expired" | "cancelled";

export type OrderStatus =
  | "pending"
  | "waiting_otp"
  | "completed"
  | "expired"
  | "cancelled"
  | "refunded";

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  balance: number;
  role: "user" | "admin";
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  dial_code: string;
  flag_emoji: string;
  is_active: boolean;
  sort_order: number;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  country_id: string;
  service_id: string;
  provider_country_code: string;
  provider_service_code: string;
  price: number;
  provider_price: number;
  stock: number;
  is_best_seller: boolean;
  is_active: boolean;
  updated_at: string;
  // relasi (diisi via join saat fetch)
  country?: Country;
  service?: Service;
}

export interface Deposit {
  id: string;
  user_id: string;
  requested_amount: number;
  unique_code: number;
  total_amount: number;
  status: DepositStatus;
  rrn: string | null;
  payer_name: string | null;
  issuer: string | null;
  paid_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface WalletLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: "deposit" | "purchase" | "refund" | "adjustment";
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  country_id: string;
  service_id: string;
  price: number;
  provider_order_id: string | null;
  phone_number: string | null;
  otp_code: string | null;
  status: OrderStatus;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  // relasi
  country?: Country;
  service?: Service;
}

// Payload callback QRIS sesuai dokumentasi SMP Payment
export interface QrisCallbackPayload {
  us_username: string;
  tr_id: string;
  issuer: string;
  PayerName: string;
  rrn: string;
  amount: {
    value: string;
  };
  saldo_akhir: number;
  timestamp: string;
}

export interface QrisCallbackResponse {
  responseCode: string;
  responseMessage: string;
}
