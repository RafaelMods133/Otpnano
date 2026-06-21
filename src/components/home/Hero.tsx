import Link from "next/link";
import { SignalBars } from "@/components/ui/SignalBars";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-soft">
      {/* radar grid halus di background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-signal) 1px, transparent 1px), linear-gradient(90deg, var(--color-signal) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-signal/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted">
          <SignalBars size="sm" />
          <span>Live — saldo masuk otomatis lewat QRIS</span>
        </div>

        <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-text sm:text-5xl">
          OTPNANO
          <br />
          <span className="text-signal">OTP menyusul.</span>
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
          Beli nomor virtual dari puluhan negara untuk verifikasi WhatsApp,
          Telegram, dan aplikasi lainnya. Isi saldo lewat QRIS, langsung
          terpakai — tanpa konfirmasi manual, tanpa menunggu admin.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="#negara"
            className="inline-flex items-center gap-2 rounded-lg bg-signal px-5 py-3 text-sm font-semibold text-bg-deep transition hover:bg-signal-dim"
          >
            Pilih nomor
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/deposit"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition hover:border-signal/40"
          >
            Isi saldo
          </Link>
        </div>

        <dl className="mt-14 grid max-w-xl grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-text-faint">
              <Zap className="h-3.5 w-3.5 text-copper" />
              Saldo masuk
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-text">Otomatis</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-text-faint">
              <ShieldCheck className="h-3.5 w-3.5 text-signal" />
              Anti duplikasi
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-text">RRN unik</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="flex items-center gap-1.5 text-xs text-text-faint">
              <SignalBars size="sm" />
              Cakupan negara
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-text">10+ negara</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
