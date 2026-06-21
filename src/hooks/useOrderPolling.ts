"use client";

import { useEffect, useRef, useState } from "react";
import type { Order } from "@/types/database";

interface UseOrderPollingOptions {
  orderId: string;
  intervalMs?: number;
  onSettled?: (status: Order["status"]) => void;
}

const SETTLED_STATUSES: Order["status"][] = [
  "completed",
  "expired",
  "cancelled",
  "refunded",
];

/**
 * Polling status order setiap beberapa detik selama menunggu OTP.
 * Berhenti otomatis begitu status final (completed/expired/cancelled/refunded).
 */
export function useOrderPolling({
  orderId,
  intervalMs = 4000,
  onSettled,
}: UseOrderPollingOptions) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (!active) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Gagal mengambil status pesanan");
          return;
        }

        const body = await res.json();
        setOrder(body.order);

        if (!SETTLED_STATUSES.includes(body.order.status)) {
          timeoutId = setTimeout(poll, intervalMs);
        } else {
          onSettledRef.current?.(body.order.status);
        }
      } catch {
        if (active) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      }
    }

    poll();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [orderId, intervalMs]);

  return { order, error };
}
