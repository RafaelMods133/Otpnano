import { Wallet, QrCode, MessageSquareText } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Isi saldo",
    desc: "Masukkan nominal, scan QRIS, transfer sesuai jumlah yang tertera — termasuk tiga digit kode unik di belakang.",
  },
  {
    icon: QrCode,
    title: "Saldo masuk otomatis",
    desc: "Sistem mencocokkan nominal transfer dengan kode unik Anda lewat callback, lalu menambah saldo dalam hitungan detik.",
  },
  {
    icon: MessageSquareText,
    title: "Pilih nomor, terima OTP",
    desc: "Pilih negara dan aplikasi, nomor langsung diterbitkan. Kode OTP muncul otomatis begitu masuk dari operator.",
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="border-b border-border-soft">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-signal">
          Alur transaksi
        </span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
          Tiga langkah, tanpa antre admin
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-signal/30 bg-signal/10">
                  <step.icon className="h-4.5 w-4.5 text-signal" />
                </div>
                <span className="font-mono text-xs text-text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
