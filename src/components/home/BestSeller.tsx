import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Flame } from "lucide-react";
import type { Product } from "@/types/database";

export async function BestSeller() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, country:countries(*), service:services(*)")
    .eq("is_best_seller", true)
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(4)
    .returns<Product[]>();

  const items = products ?? [];

  return (
    <section className="border-b border-border-soft bg-bg-deep/40">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-copper" />
          <span className="text-xs font-semibold uppercase tracking-wider text-copper">
            Paling sering dibeli
          </span>
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
          Indonesia · WhatsApp
        </h2>
        <p className="mt-2 max-w-lg text-sm text-text-muted">
          Kombinasi paling diminati untuk daftar akun baru atau pulihkan akun
          yang kena banned.
        </p>

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-text-muted">
            Produk best seller belum diatur. Tambahkan lewat tabel{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-copper">
              products
            </code>{" "}
            dengan <code className="font-mono text-xs">is_best_seller = true</code>.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((product) => (
              <Link
                key={product.id}
                href={`/beli?produk=${product.id}`}
                className="group rounded-xl border border-border bg-surface p-5 transition hover:border-copper/40 hover:bg-surface-raised"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{product.country?.flag_emoji}</span>
                  {product.stock > 0 ? (
                    <StatusBadge label="Tersedia" tone="signal" pulse />
                  ) : (
                    <StatusBadge label="Habis" tone="muted" />
                  )}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-text">
                  {product.service?.name}
                </h3>
                <p className="text-sm text-text-muted">{product.country?.name}</p>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-semibold text-copper">
                    {formatRupiah(product.price)}
                  </span>
                  <span className="text-xs text-text-faint transition group-hover:text-signal">
                    Beli →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
