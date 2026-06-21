"use client";

import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useDepositPolling } from "@/hooks/useDepositPolling";
import { useCountdown } from "@/hooks/useCountdown";
import { formatRupiah } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PakasirMethod } from "@/lib/payment/pakasir";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SignalBars } from "@/components/ui/SignalBars";
import { CheckCircle2, Copy, XCircle, Timer, CreditCard } from "lucide-react";
import { useState } from "react";

interface DepositQrisProps {
  depositId: string;
  totalPayment: number;
  requestedAmount: number;
  paymentMethod: PakasirMethod;
  paymentNumber: string;
  expiresAt: string;
  fee: number;
  onCancel: () => void;
}

export function DepositQris({
  depositId,
  totalPayment,
  requestedAmount,
  paymentMethod,
  paymentNumber,
  expiresAt,
  fee,
  onCancel,
}: DepositQrisProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Fallback: jika totalPayment 0 (Pakasir belum return fee), pakai requestedAmount
  const displayTotal = totalPayment > 0 ? totalPayment : requestedAmount;
  const displayFee = fee > 0 ? fee : 0;

  const { deposit } = useDepositPolling({
    depositId,
    onSettled: (status) => {
      if (status === "paid") router.refresh();
    },
  });

  const status = deposit?.status ?? "pending";
  const { formatted: timeLeft, isExpired } = useCountdown(
    deposit?.expires_at ?? expiresAt
  );

  const isQris = paymentMethod === "qris";

  function handleCopy() {
    navigator.clipboard.writeText(paymentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (status === "paid") {
    return (
      <div className="rounded-2xl border border-signal/30 bg-signal/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-signal" />
        <h3 className="mt-4 font-display text-xl font-semibold text-text">
          Deposit berhasil!
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          Saldo <span className="font-mono font-semibold text-text">{formatRupiah(requestedAmount)}</span> sudah ditambahkan ke akun Anda.
        </p>
        <button
          onClick={() => router.push("/beli")}
          className="mt-6 rounded-lg bg-signal px-5 py-2.5 text-sm font-semibold text-bg-deep hover:bg-signal-dim"
        >
          Lanjut beli nomor →
        </button>
      </div>
    );
  }

  if (status === "expired" || status === "cancelled") {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-danger" />
        <h3 className="mt-4 font-display text-xl font-semibold text-text">
          {status === "expired" ? "Waktu pembayaran habis" : "Deposit dibatalkan"}
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          Silakan buat permintaan deposit baru.
        </p>
        <button
          onClick={onCancel}
          className="mt-6 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text hover:border-signal/40"
        >
          Buat permintaan baru
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      {/* Header status */}
      <div className="flex items-center justify-between">
        <StatusBadge label="Menunggu pembayaran" tone="copper" pulse />
        <div className="flex items-center gap-3">
          {!isExpired && (
            <span className="flex items-center gap-1.5 font-mono text-xs text-text-faint">
              <Timer className="h-3.5 w-3.5" />
              {timeLeft}
            </span>
          )}
          <SignalBars active size="md" />
        </div>
      </div>

      {/* Metode pembayaran */}
      <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
        <CreditCard className="h-3.5 w-3.5" />
        {PAYMENT_METHOD_LABELS[paymentMethod]}
      </div>

      {/* QR Code atau nomor VA */}
      {isQris ? (
        <div className="mt-6 flex justify-center">
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <QRCodeSVG value={paymentNumber} size={220} />
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-xs text-text-muted">Nomor Virtual Account</p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-bg-deep px-4 py-4">
            <span className="font-mono text-2xl font-semibold tracking-widest text-text">
              {paymentNumber}
            </span>
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:border-signal/40"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Tersalin!" : "Salin"}
            </button>
          </div>
        </div>
      )}

      {/* Rincian nominal */}
      <div className="mt-5 rounded-xl border border-copper/30 bg-copper/5 p-4 space-y-2">
        <div className="flex justify-between text-xs text-text-muted">
          <span>Nominal deposit</span>
          <span className="font-mono">{formatRupiah(requestedAmount)}</span>
        </div>
        {displayFee > 0 && (
          <div className="flex justify-between text-xs text-text-muted">
            <span>Biaya layanan</span>
            <span className="font-mono">{formatRupiah(displayFee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-copper/20 pt-2 text-sm font-semibold">
          <span className="text-text">Total transfer</span>
          <span className="font-mono text-copper">{formatRupiah(displayTotal)}</span>
        </div>
      </div>

      {isQris && (
        <p className="mt-3 text-center text-xs text-text-faint">
          Scan QR di atas menggunakan aplikasi m-banking atau e-wallet apa saja
        </p>
      )}

      <p className="mt-2 text-center text-xs text-text-faint">
        Saldo masuk otomatis setelah pembayaran terverifikasi
      </p>

      <button
        onClick={onCancel}
        className="mt-5 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:border-danger/30 hover:text-danger"
      >
        Batalkan
      </button>
    </div>
  );
}
