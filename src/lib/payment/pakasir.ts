/**
 * ADAPTER PAKASIR PAYMENT GATEWAY
 * Dokumentasi: https://pakasir.com/p/docs
 */

export type PakasirMethod =
  | "qris"
  | "bni_va"
  | "bri_va"
  | "cimb_niaga_va"
  | "sampoerna_va"
  | "bnc_va"
  | "maybank_va"
  | "permata_va"
  | "atm_bersama_va"
  | "artha_graha_va";

export const PAYMENT_METHOD_LABELS: Record<PakasirMethod, string> = {
  qris: "QRIS",
  bni_va: "Virtual Account BNI",
  bri_va: "Virtual Account BRI",
  cimb_niaga_va: "Virtual Account CIMB Niaga",
  sampoerna_va: "Virtual Account Sampoerna",
  bnc_va: "Virtual Account BNC",
  maybank_va: "Virtual Account Maybank",
  permata_va: "Virtual Account Permata",
  atm_bersama_va: "Virtual Account ATM Bersama",
  artha_graha_va: "Virtual Account Artha Graha",
};

// Metode yang ditampilkan ke user (yang paling umum dipakai)
export const FEATURED_METHODS: PakasirMethod[] = [
  "qris",
  "bni_va",
  "bri_va",
  "cimb_niaga_va",
];

export interface CreateTransactionResult {
  success: boolean;
  orderId: string;
  amount: number;
  fee: number;
  totalPayment: number;
  paymentMethod: PakasirMethod;
  paymentNumber: string; // QR string atau nomor VA
  expiredAt: string;
  errorMessage?: string;
}

export interface TransactionDetail {
  amount: number;
  orderId: string;
  project: string;
  status: "pending" | "completed" | "cancelled" | "expired";
  paymentMethod: PakasirMethod;
  completedAt?: string;
}

function getConfig() {
  const project = process.env.PAKASIR_PROJECT_SLUG;
  const apiKey = process.env.PAKASIR_API_KEY;

  if (!project || !apiKey) {
    throw new Error(
      "PAKASIR_PROJECT_SLUG atau PAKASIR_API_KEY belum diset di environment variables."
    );
  }

  return { project, apiKey };
}

/**
 * Membuat transaksi baru di Pakasir.
 * orderId harus unik per transaksi — kita pakai deposit.id dari database.
 */
export async function createTransaction(
  orderId: string,
  amount: number,
  method: PakasirMethod
): Promise<CreateTransactionResult> {
  const { project, apiKey } = getConfig();

  const res = await fetch(
    `https://app.pakasir.com/api/transactioncreate/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project,
        order_id: orderId,
        amount,
        api_key: apiKey,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      success: false,
      orderId,
      amount,
      fee: 0,
      totalPayment: amount,
      paymentMethod: method,
      paymentNumber: "",
      expiredAt: "",
      errorMessage: `Pakasir error ${res.status}: ${text}`,
    };
  }

  const body = await res.json();
  const p = body.payment;

  return {
    success: true,
    orderId: p.order_id,
    amount: p.amount,
    fee: p.fee,
    totalPayment: p.total_payment,
    paymentMethod: p.payment_method,
    paymentNumber: p.payment_number,
    expiredAt: p.expired_at,
  };
}

/**
 * Cek status transaksi — dipakai sebagai fallback dari webhook.
 */
export async function getTransactionDetail(
  orderId: string,
  amount: number
): Promise<TransactionDetail | null> {
  const { project, apiKey } = getConfig();

  const url = new URL("https://app.pakasir.com/api/transactiondetail");
  url.searchParams.set("project", project);
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("amount", String(amount));
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const body = await res.json();
  const t = body.transaction;
  if (!t) return null;

  return {
    amount: t.amount,
    orderId: t.order_id,
    project: t.project,
    status: t.status,
    paymentMethod: t.payment_method,
    completedAt: t.completed_at,
  };
}

/**
 * Membatalkan transaksi yang belum dibayar.
 */
export async function cancelTransaction(
  orderId: string,
  amount: number
): Promise<boolean> {
  const { project, apiKey } = getConfig();

  const res = await fetch("https://app.pakasir.com/api/transactioncancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project,
      order_id: orderId,
      amount,
      api_key: apiKey,
    }),
  });

  return res.ok;
}
