"use client";

import { useMemo, useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Search } from "lucide-react";
import type { Country, Product, Service } from "@/types/database";

interface ProductPickerProps {
  countries: Country[];
  services: Service[];
  products: Product[];
  initialCountryCode?: string;
  initialServiceCode?: string;
  balance: number;
  onPick: (product: Product) => void;
}

export function ProductPicker({
  countries,
  services,
  products,
  initialCountryCode,
  initialServiceCode,
  balance,
  onPick,
}: ProductPickerProps) {
  const [countryCode, setCountryCode] = useState(initialCountryCode ?? "ID");
  const [serviceCode, setServiceCode] = useState(initialServiceCode ?? "");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCountry = p.country?.code === countryCode;
      const matchService = serviceCode ? p.service?.code === serviceCode : true;
      const matchSearch = search
        ? p.service?.name.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchCountry && matchService && matchSearch;
    });
  }, [products, countryCode, serviceCode, search]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Sidebar negara */}
      <div className="space-y-1.5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-faint">
          Negara
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {countries.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountryCode(c.code)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition lg:w-full ${
                countryCode === c.code
                  ? "border-signal/40 bg-signal/10 text-signal"
                  : "border-border bg-surface text-text-muted hover:border-signal/20"
              }`}
            >
              <span className="text-base">{c.flag_emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar produk */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari layanan..."
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-faint focus:border-signal/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setServiceCode("")}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                serviceCode === ""
                  ? "border-signal/40 bg-signal/10 text-signal"
                  : "border-border text-text-muted hover:border-signal/20"
              }`}
            >
              Semua
            </button>
            {services.map((s) => (
              <button
                key={s.code}
                onClick={() => setServiceCode(s.code)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  serviceCode === s.code
                    ? "border-signal/40 bg-signal/10 text-signal"
                    : "border-border text-text-muted hover:border-signal/20"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {filteredProducts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-text-muted">
              Tidak ada produk untuk kombinasi ini.
            </div>
          )}

          {filteredProducts.map((p) => {
            const canAfford = balance >= p.price;
            const inStock = p.stock > 0;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 transition hover:border-signal/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised text-lg">
                    {p.country?.flag_emoji}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-text">
                      {p.service?.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {p.country?.name} · {p.country?.dial_code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!inStock ? (
                    <StatusBadge label="Stok habis" tone="muted" />
                  ) : (
                    <span className="font-mono text-sm font-semibold text-copper">
                      {formatRupiah(p.price)}
                    </span>
                  )}
                  <button
                    onClick={() => onPick(p)}
                    disabled={!inStock || !canAfford}
                    className="rounded-lg bg-signal px-3.5 py-2 text-xs font-semibold text-bg-deep transition hover:bg-signal-dim disabled:cursor-not-allowed disabled:bg-border disabled:text-text-faint"
                  >
                    {!inStock ? "Habis" : !canAfford ? "Saldo kurang" : "Beli"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
