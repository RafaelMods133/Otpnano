"use client";

import { useState } from "react";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import { SignalBars } from "@/components/ui/SignalBars";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Copy, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { Order } from "@/types/database";

interface ActiveOrderProps {
  initialOrder: Order;
  onClose: () => void;
}

export function ActiveOrder({ initialOrder, onClose }: ActiveOrderProps) {
  const { order } = useOrderPolling({ orderId: initialOrder.id });
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const current = order ?? initialOrder;

  function copy(text: string, which: "number" | "otp") {
    navigator.clipboard.writeText(text);
    if (which === "number") {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 1800);
    } else {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 1800);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    await fetch(`/api/orders/${current.id}/cancel`, { method: "POST" });
    setCancelling(false);
    onClose();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-faint">
            {current.country?.flag_emoji} {current.country?.name} ·{" "}
            {current.service?.name}
          </p>
        </div>
        {current.status === "waiting_otp" && (
          <StatusBadge label="Menunggu OTP" tone="copper" pulse />
        )}
        {current.status === "completed" && (
          <StatusBadge label="OTP diterima" tone="signal" />
        )}
        {(current.status === "expired" || current.status === "cancelled") && (
          <StatusBadge label="Selesai" tone="muted" />
        )}
      </div>

      {/* Nomor telepon */}
      <div className="mt-6">
        <p className="text-xs font-medium text-text-faint">Nomor Anda</p>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-bg-deep px-4 py-3.5">
          <span className="font-mono text-xl font-semibold tracking-wide text-text">
            {current.phone_number ?? "—"}
          </span>
          {current.phone_number && (
            <button
              onClick={() => copy(current.phone_number!, "number")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:border-signal/40"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedNumber ? "Tersalin" : "Salin"}
            </button>
          )}
        </div>
      </div>

      {/* Status OTP */}
      <div className="mt-5">
        <p className="text-xs font-medium text-text-faint">Kode OTP</p>

        {current.status === "completed" && current.otp_code ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-signal/30 bg-signal/5 px-4 py-3.5">
            <span className="font-mono text-2xl font-semibold tracking-widest text-signal">
              {current.otp_code}
            </span>
            <button
              onClick={() => copy(current.otp_code!, "otp")}
              className="flex items-center gap-1.5 rounded-lg border border-signal/30 bg-surface px-3 py-1.5 text-xs font-medium text-signal transition hover:bg-signal/10"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedOtp ? "Tersalin" : "Salin"}
            </button>
          </div>
        ) : current.status === "waiting_otp" || current.status === "pending" ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border-soft bg-bg-deep px-4 py-3.5">
            <SignalBars active size="md" />
            <span className="text-sm text-text-muted">
              Menunggu kode masuk dari operator…
            </span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3.5">
            <XCircle className="h-4 w-4 text-danger" />
            <span className="text-sm text-text-muted">
              Waktu tunggu habis. Saldo Anda sudah dikembalikan.
            </span>
          </div>
        )}
      </div>

      {current.status === "completed" ? (
        <button
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-3 text-sm font-semibold text-bg-deep hover:bg-signal-dim"
        >
          <CheckCircle2 className="h-4 w-4" />
          Selesai
        </button>
      ) : current.status === "waiting_otp" || current.status === "pending" ? (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:border-danger/30 hover:text-danger disabled:opacity-60"
        >
          {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
          Batalkan & kembalikan saldo
        </button>
      ) : (
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text hover:border-signal/40"
        >
          Tutup
        </button>
      )}
    </div>
  );
}
