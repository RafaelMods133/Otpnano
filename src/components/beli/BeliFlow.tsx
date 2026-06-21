"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductPicker } from "@/components/beli/ProductPicker";
import { ActiveOrder } from "@/components/beli/ActiveOrder";
import { Loader2 } from "lucide-react";
import type { Country, Order, Product, Service } from "@/types/database";

interface BeliFlowProps {
  countries: Country[];
  services: Service[];
  products: Product[];
  initialCountryCode?: string;
  initialServiceCode?: string;
  balance: number;
}

export function BeliFlow({
  countries,
  services,
  products,
  initialCountryCode,
  initialServiceCode,
  balance,
}: BeliFlowProps) {
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(product: Product) {
    setError(null);
    setBuying(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Gagal membuat pesanan");
        setBuying(false);
        return;
      }

      setActiveOrder(body.order);
    } catch {
      setError("Terjadi kesalahan jaringan, silakan coba lagi");
    } finally {
      setBuying(false);
    }
  }

  function handleClose() {
    setActiveOrder(null);
    router.refresh();
  }

  if (buying) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-20">
        <Loader2 className="h-6 w-6 animate-spin text-signal" />
        <p className="mt-3 text-sm text-text-muted">Memesan nomor…</p>
      </div>
    );
  }

  if (activeOrder) {
    return <ActiveOrder initialOrder={activeOrder} onClose={handleClose} />;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <ProductPicker
        countries={countries}
        services={services}
        products={products}
        initialCountryCode={initialCountryCode}
        initialServiceCode={initialServiceCode}
        balance={balance}
        onPick={handlePick}
      />
    </div>
  );
}
