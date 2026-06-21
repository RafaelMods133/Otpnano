/**
 * Format angka ke Rupiah, contoh: 50000 -> "Rp 50.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke format Indonesia yang ramah dibaca.
 */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/**
 * Menghasilkan kode unik 1-999 untuk ditambahkan ke nominal deposit.
 * Tujuannya agar tiap permintaan deposit punya nominal total yang unik,
 * sehingga callback QRIS statis (yang hanya mengirim amount.value)
 * bisa dicocokkan otomatis ke deposit yang tepat tanpa perlu user
 * memasukkan kode referensi manual.
 */
export function generateUniqueCode(): number {
  return Math.floor(Math.random() * 899) + 100; // 100-998
}

/**
 * Mengubah string "2.00" (format dari payload callback) menjadi integer Rupiah.
 * Payload SMP Payment mengirim amount.value sebagai desimal string,
 * misal "2.00" untuk Rp 2 — fungsi ini membulatkan ke integer terdekat.
 */
export function parseCallbackAmount(value: string): number {
  const parsed = parseFloat(value);
  return Math.round(parsed);
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
