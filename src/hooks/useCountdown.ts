"use client";

import { useEffect, useState } from "react";

/**
 * Menghitung mundur sisa waktu sampai targetIso, diperbarui setiap detik.
 * Mengembalikan string terformat "mm:ss" dan boolean apakah sudah habis.
 */
export function useCountdown(targetIso: string) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(new Date(targetIso).getTime() - Date.now(), 0)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(Math.max(new Date(targetIso).getTime() - Date.now(), 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { formatted, isExpired: remainingMs <= 0 };
}
