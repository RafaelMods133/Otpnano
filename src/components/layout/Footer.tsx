import Link from "next/link";
import { Radio } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-soft bg-bg-deep">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-signal" />
              <span className="font-display text-base font-semibold text-text">
                OTPNANO
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Nomor virtual untuk verifikasi OTP, tersedia dari berbagai negara,
              siap pakai dalam hitungan detik.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-text">
              Produk
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/#negara" className="hover:text-text">Negara tersedia</Link></li>
              <li><Link href="/#layanan" className="hover:text-text">Daftar layanan</Link></li>
              <li><Link href="/deposit" className="hover:text-text">Isi saldo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-text">
              Akun
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/riwayat" className="hover:text-text">Riwayat transaksi</Link></li>
              <li><Link href="/dashboard" className="hover:text-text">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-text">
              Bantuan
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/#cara-kerja" className="hover:text-text">Cara kerja</Link></li>
              <li><Link href="/#faq" className="hover:text-text">Pertanyaan umum</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border-soft pt-6 text-xs text-text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} OTPNANO. Seluruh hak cipta dilindungi.</span>
          <span>Pembayaran diproses oleh SMP Payment · QRIS</span>
        </div>
      </div>
    </footer>
  );
}
