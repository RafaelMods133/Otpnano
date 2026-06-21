import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Country } from "@/types/database";

export async function CountryGrid() {
  const supabase = await createClient();

  const { data: countries } = await supabase
    .from("countries")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<Country[]>();

  const items = countries ?? [];

  return (
    <section id="negara" className="border-b border-border-soft">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-signal">
          Cakupan global
        </span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
          Pilih negara nomor
        </h2>
        <p className="mt-2 max-w-lg text-sm text-text-muted">
          Setiap negara punya stok dan harga berbeda tergantung permintaan
          dan ketersediaan dari operator setempat.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((country) => (
            <Link
              key={country.id}
              href={`/beli?negara=${country.code}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 py-5 text-center transition hover:border-signal/40 hover:bg-surface-raised"
            >
              <span className="text-3xl">{country.flag_emoji}</span>
              <span className="font-display text-sm font-medium text-text">
                {country.name}
              </span>
              <span className="font-mono text-xs text-text-faint">
                {country.dial_code}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
