import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/types/database";

export async function ServiceGrid() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<Service[]>();

  const items = services ?? [];

  return (
    <section id="layanan" className="border-b border-border-soft bg-bg-deep/40">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-signal">
          Aplikasi didukung
        </span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
          Verifikasi aplikasi apa saja
        </h2>

        <div className="mt-8 flex flex-wrap gap-3">
          {items.map((service) => (
            <Link
              key={service.id}
              href={`/beli?layanan=${service.code}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-signal/40 hover:text-signal"
            >
              {service.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
