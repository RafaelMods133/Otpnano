"use client";

import { useState } from "react";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Deposit, Order } from "@/types/database";

const ORDER_STATUS_TONE: Record<
  Order["status"],
  { label: string; tone: "signal" | "copper" | "muted" | "danger" }
> = {
  pending: { label: "Diproses", tone: "copper" },
  waiting_otp: { label: "Menunggu OTP", tone: "copper" },
  completed: { label: "Selesai", tone: "signal" },
  expired: { label: "Kadaluwarsa", tone: "muted" },
  cancelled: { label: "Dibatalkan", tone: "muted" },
  refunded: { label: "Direfund", tone: "muted" },
};

const DEPOSIT_STATUS_TONE: Record<
  Deposit["status"],
  { label: string; tone: "signal" | "copper" | "muted" | "danger" }
> = {
  pending: { label: "Menunggu", tone: "copper" },
  paid: { label: "Berhasil", tone: "signal" },
  expired: { label: "Kadaluwarsa", tone: "muted" },
  cancelled: { label: "Dibatalkan", tone: "muted" },
};

interface RiwayatTabsProps {
  deposits: Deposit[];
  orders: Order[];
}

export function RiwayatTabs({ deposits, orders }: RiwayatTabsProps) {
  const [tab, setTab] = useState<"order" | "deposit">("order");

  return (
    <div>
      <div className="flex gap-2 border-b border-border-soft">
        <button
          onClick={() => setTab("order")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            tab === "order"
              ? "border-b-2 border-signal text-text"
              : "text-text-muted hover:text-text"
          }`}
        >
          Pembelian nomor
        </button>
        <button
          onClick={() => setTab("deposit")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            tab === "deposit"
              ? "border-b-2 border-signal text-text"
              : "text-text-muted hover:text-text"
          }`}
        >
          Deposit
        </button>
      </div>

      <div className="mt-4 divide-y divide-border-soft rounded-2xl border border-border bg-surface">
        {tab === "order" ? (
          orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-text-muted">
              Belum ada riwayat pembelian.
            </p>
          ) : (
            orders.map((order) => {
              const info = ORDER_STATUS_TONE[order.status];
              return (
                <div key={order.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{order.country?.flag_emoji}</span>
                    <div>
                      <p className="font-display text-sm font-medium text-text">
                        {order.service?.name} · {order.country?.name}
                      </p>
                      <p className="font-mono text-xs text-text-faint">
                        {order.phone_number ?? "—"}
                      </p>
                      <p className="text-xs text-text-faint">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-mono text-sm text-text-muted">
                      {formatRupiah(order.price)}
                    </span>
                    <StatusBadge label={info.label} tone={info.tone} />
                  </div>
                </div>
              );
            })
          )
        ) : deposits.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-text-muted">
            Belum ada riwayat deposit.
          </p>
        ) : (
          deposits.map((deposit) => {
            const info = DEPOSIT_STATUS_TONE[deposit.status];
            return (
              <div key={deposit.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-mono text-sm font-medium text-text">
                    {formatRupiah(deposit.total_amount)}
                  </p>
                  <p className="text-xs text-text-faint">
                    {deposit.rrn ? `RRN: ${deposit.rrn}` : "Belum dibayar"}
                  </p>
                  <p className="text-xs text-text-faint">
                    {formatDateTime(deposit.created_at)}
                  </p>
                </div>
                <StatusBadge label={info.label} tone={info.tone} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
