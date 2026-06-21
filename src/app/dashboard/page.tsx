import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Wallet, ShoppingBag, ArrowRight } from "lucide-react";
import type { Order } from "@/types/database";

const STATUS_TONE: Record<Order["status"], { label: string; tone: "signal" | "copper" | "muted" | "danger" }> = {
  pending: { label: "Diproses", tone: "copper" },
  waiting_otp: { label: "Menunggu OTP", tone: "copper" },
  completed: { label: "Selesai", tone: "signal" },
  expired: { label: "Kadaluwarsa", tone: "muted" },
  cancelled: { label: "Dibatalkan", tone: "muted" },
  refunded: { label: "Direfund", tone: "muted" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, balance, created_at")
    .eq("id", userData.user.id)
    .single();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, country:countries(*), service:services(*)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<Order[]>();

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <h1 className="font-display text-2xl font-semibold text-text">
            Halo, {profile?.username}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Bergabung sejak {profile?.created_at ? formatDateTime(profile.created_at) : "-"}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-signal/30 bg-signal/5 p-6">
              <div className="flex items-center gap-2 text-signal">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Saldo Anda
                </span>
              </div>
              <p className="mt-3 font-mono text-3xl font-semibold text-text">
                {formatRupiah(profile?.balance ?? 0)}
              </p>
              <Link
                href="/deposit"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-signal hover:underline"
              >
                Isi saldo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 text-copper">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Beli nomor baru
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">
                Pilih dari 10+ negara dan berbagai layanan populer.
              </p>
              <Link
                href="/beli"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-copper hover:underline"
              >
                Lihat katalog <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-text">
                Pesanan terbaru
              </h2>
              <Link href="/riwayat" className="text-sm text-text-muted hover:text-signal">
                Lihat semua
              </Link>
            </div>

            <div className="mt-4 divide-y divide-border-soft rounded-2xl border border-border bg-surface">
              {!recentOrders || recentOrders.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-text-muted">
                  Belum ada transaksi.
                </p>
              ) : (
                recentOrders.map((order) => {
                  const statusInfo = STATUS_TONE[order.status];
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{order.country?.flag_emoji}</span>
                        <div>
                          <p className="font-display text-sm font-medium text-text">
                            {order.service?.name} · {order.country?.name}
                          </p>
                          <p className="text-xs text-text-faint">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-text-muted">
                          {formatRupiah(order.price)}
                        </span>
                        <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
