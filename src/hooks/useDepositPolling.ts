"use client";

import { useEffect, useRef, useState } from "react";
import type { Deposit } from "@/types/database";

interface UseDepositPollingOptions {
  depositId: string;
  intervalMs?: number;
  onSettled?: (status: Deposit["status"]) => void;
}

/**
 * Polling status deposit setiap beberapa detik selama statusnya masih
 * "pending". Berhenti otomatis begitu status berubah jadi paid/expired/
 * cancelled, supaya tidak terus memukul server setelah selesai.
 */
export function useDepositPolling({
  depositId,
  intervalMs = 3000,
  onSettled,
}: UseDepositPollingOptions) {
  const [deposit, setDeposit] = useState<Deposit | null>(null);
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
        const res = await fetch(`/api/deposit/${depositId}/status`, {
          cache: "no-store",
        });
        if (!active) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Gagal mengambil status deposit");
          return;
        }

        const body = await res.json();
        setDeposit(body.deposit);

        if (body.deposit.status === "pending") {
          timeoutId = setTimeout(poll, intervalMs);
        } else {
          onSettledRef.current?.(body.deposit.status);
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
  }, [depositId, intervalMs]);

  return { deposit, error };
}
