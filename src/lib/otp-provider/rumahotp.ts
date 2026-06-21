/**
 * ADAPTER PROVIDER OTP — "Rumah OTP"
 * ============================================================
 * File ini sengaja dipisah sebagai satu titik integrasi tunggal.
 * Begitu Anda kirim dokumentasi/API key Rumah OTP, hanya file
 * INI yang perlu diisi (lihat TODO di bawah). Seluruh aplikasi
 * (route handler beli nomor, cek status OTP, dst) memanggil
 * fungsi-fungsi di sini, bukan langsung ke provider.
 */

export interface ProviderCountry {
  code: string; // kode negara versi provider, contoh: "id", "us"
  name: string;
}

export interface ProviderService {
  code: string; // kode layanan versi provider, contoh: "wa", "tg"
  name: string;
}

export interface OrderNumberParams {
  countryCode: string; // provider_country_code dari tabel products
  serviceCode: string; // provider_service_code dari tabel products
}

export interface OrderNumberResult {
  success: boolean;
  providerOrderId?: string;
  phoneNumber?: string;
  errorMessage?: string;
}

export type OtpStatus = "waiting" | "received" | "cancelled" | "expired";

export interface CheckOtpResult {
  status: OtpStatus;
  otpCode?: string | null;
  rawMessage?: string | null;
}

export interface CancelOrderResult {
  success: boolean;
  errorMessage?: string;
}

/**
 * Memesan nomor baru dari provider untuk kombinasi negara + layanan tertentu.
 *
 * TODO(integrasi Rumah OTP): ganti isi fungsi ini dengan pemanggilan
 * endpoint resmi mereka, contoh pola umum:
 *
 *   const res = await fetch(`${BASE_URL}/order`, {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${process.env.RUMAHOTP_API_KEY}` },
 *     body: JSON.stringify({ country: countryCode, service: serviceCode }),
 *   });
 *
 * Sesuaikan field response dengan dokumentasi asli mereka.
 */
export async function orderNumber(
  _params: OrderNumberParams
): Promise<OrderNumberResult> {
  if (!process.env.RUMAHOTP_API_KEY || !process.env.RUMAHOTP_BASE_URL) {
    return {
      success: false,
      errorMessage:
        "Provider OTP belum dikonfigurasi. Set RUMAHOTP_API_KEY dan RUMAHOTP_BASE_URL di environment variables.",
    };
  }

  // ---- Placeholder sementara: lempar error supaya jelas belum terhubung ----
  return {
    success: false,
    errorMessage:
      "Integrasi Rumah OTP belum diimplementasikan. Lengkapi src/lib/otp-provider/rumahotp.ts setelah menerima dokumentasi API.",
  };
}

/**
 * Mengecek status OTP dari sebuah order yang sedang berjalan.
 * Dipanggil secara polling oleh frontend (lihat hooks/useOtpPolling.ts)
 * setiap beberapa detik selama order berstatus "waiting_otp".
 */
export async function checkOtpStatus(
  _providerOrderId: string
): Promise<CheckOtpResult> {
  if (!process.env.RUMAHOTP_API_KEY || !process.env.RUMAHOTP_BASE_URL) {
    return { status: "waiting" };
  }

  // ---- Placeholder sementara ----
  return { status: "waiting" };
}

/**
 * Membatalkan order di sisi provider (misal user cancel manual,
 * atau order kadaluwarsa tanpa OTP masuk) supaya stok/slot kembali.
 */
export async function cancelOrder(
  _providerOrderId: string
): Promise<CancelOrderResult> {
  if (!process.env.RUMAHOTP_API_KEY || !process.env.RUMAHOTP_BASE_URL) {
    return { success: true };
  }

  // ---- Placeholder sementara ----
  return { success: true };
}

/**
 * Mengambil daftar negara yang tersedia dari provider.
 * Bisa dipakai sekali untuk sinkronisasi awal tabel `countries`/`products`,
 * tidak perlu dipanggil real-time setiap request.
 */
export async function listAvailableCountries(): Promise<ProviderCountry[]> {
  return [];
}

/**
 * Mengambil daftar layanan/aplikasi yang tersedia dari provider.
 */
export async function listAvailableServices(): Promise<ProviderService[]> {
  return [];
}
