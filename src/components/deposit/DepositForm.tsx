"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { FEATURED_METHODS, PAYMENT_METHOD_LABELS, type PakasirMethod } from "@/lib/payment/pakasir";
import { Loader2, Wallet, CreditCard } from "lucide-react";

const QUICK_AMOUNTS = [25000, 50000, 100000, 250000, 500000, 1000000];

interface DepositCreatedPayload {
  depositId: string;
  totalPayment: number;
  requestedAmount: number;
  paymentMethod: PakasirMethod;
  paymentNumber: string;
  expiresAt: string;
  fee: number;
}

interface DepositFormProps {
  onCreated: (payload: DepositCreatedPayload) => void;
}

export function DepositForm({ onCreated }: DepositFormProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<PakasirMethod>("qris");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!amount || amount < 10000) {
      setError("Minimal deposit Rp 10.000");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Gagal membuat permintaan deposit");
        setLoading(false);
        return;
      }

      const d = body.deposit;
      onCreated({
        depositId: d.id,
        totalPayment: d.total_payment ?? d.total_amount,
        requestedAmount: d.requested_amount,
        paymentMethod: d.payment_method,
        paymentNumber: d.payment_number,
        expiresAt: d.expires_at,
        fee: d.fee ?? 0,
      });
    } catch {
      setError("Terjadi kesalahan jaringan, silakan coba lagi");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nominal */}
      <div>
        <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-text">
          Nominal deposit
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-text-faint">
            Rp
          </span>
          <input
            id="amount"
            type="number"
            min={10000}
            step={1000}
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value ? parseInt(e.target.value, 10) : "")
            }
            placeholder="50000"
            className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-3.5 font-mono text-base text-text placeholder:text-text-faint focus:border-signal/50"
          />
        </div>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(q)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
              amount === q
                ? "border-signal/50 bg-signal/10 text-signal"
                : "border-border bg-surface text-text-muted hover:border-signal/30"
            }`}
          >
            {formatRupiah(q)}
          </button>
        ))}
      </div>

      {/* Metode pembayaran */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text">
          Metode pembayaran
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FEATURED_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                method === m
                  ? "border-signal/50 bg-signal/10 text-signal"
                  : "border-border bg-surface text-text-muted hover:border-signal/30"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 shrink-0" />
              {PAYMENT_METHOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Info fee */}
      {amount && (
        <div className="rounded-lg border border-border-soft bg-surface/50 px-4 py-3 text-xs text-text-muted">
          Nominal: <span className="font-mono font-medium text-text">{formatRupiah(Number(amount))}</span>
          <span className="mx-2 text-text-faint">+</span>
          biaya layanan (dihitung saat proses)
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-3 text-sm font-semibold text-bg-deep transition hover:bg-signal-dim disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {loading ? "Membuat transaksi…" : "Lanjut pembayaran"}
      </button>
    </form>
  );
}
