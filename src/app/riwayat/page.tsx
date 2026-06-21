import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { RiwayatTabs } from "@/components/riwayat/RiwayatTabs";
import type { Deposit, Order } from "@/types/database";

export default async function RiwayatPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login?redirect=/riwayat");
  }

  const [{ data: deposits }, { data: orders }] = await Promise.all([
    supabase
      .from("deposits")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .returns<Deposit[]>(),
    supabase
      .from("orders")
      .select("*, country:countries(*), service:services(*)")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .returns<Order[]>(),
  ]);

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <h1 className="font-display text-2xl font-semibold text-text">
            Riwayat transaksi
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Semua deposit dan pembelian nomor Anda.
          </p>

          <div className="mt-8">
            <RiwayatTabs deposits={deposits ?? []} orders={orders ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}
