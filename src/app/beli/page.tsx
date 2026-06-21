import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { BeliFlow } from "@/components/beli/BeliFlow";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import { Wallet } from "lucide-react";
import type { Country, Product, Service } from "@/types/database";

export default async function BeliPage({
  searchParams,
}: {
  searchParams: Promise<{ negara?: string; layanan?: string; produk?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  const [{ data: countries }, { data: services }, { data: products }, profileRes] =
    await Promise.all([
      supabase
        .from("countries")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .returns<Country[]>(),
      supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .returns<Service[]>(),
      supabase
        .from("products")
        .select("*, country:countries(*), service:services(*)")
        .eq("is_active", true)
        .returns<Product[]>(),
      userData?.user
        ? supabase
            .from("profiles")
            .select("balance")
            .eq("id", userData.user.id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

  const balance = profileRes.data?.balance ?? 0;

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-text">
                Beli nomor
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                Pilih negara dan layanan, nomor langsung diterbitkan.
              </p>
            </div>
            <Link
              href="/deposit"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm text-text transition hover:border-signal/40"
            >
              <Wallet className="h-4 w-4 text-signal" />
              Saldo: {formatRupiah(balance)}
            </Link>
          </div>

          <div className="mt-8">
            <BeliFlow
              countries={countries ?? []}
              services={services ?? []}
              products={products ?? []}
              initialCountryCode={params.negara}
              initialServiceCode={params.layanan}
              balance={balance}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
