import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import { Wallet, LogOut, History, Radio } from "lucide-react";

export async function Navbar() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let balance: number | null = null;
  let username: string | null = null;

  if (userData?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, balance")
      .eq("id", userData.user.id)
      .single();
    balance = profile?.balance ?? 0;
    username = profile?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised">
            <Radio className="h-4 w-4 text-signal" strokeWidth={2.2} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-signal signal-dot" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-text">
            OTPNANO
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-text-muted md:flex">
          <Link href="/#negara" className="transition hover:text-text">
            Negara
          </Link>
          <Link href="/#layanan" className="transition hover:text-text">
            Layanan
          </Link>
          <Link href="/#cara-kerja" className="transition hover:text-text">
            Cara kerja
          </Link>
        </nav>

        {username ? (
          <div className="flex items-center gap-2">
            <Link
              href="/deposit"
              className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-sm text-text transition hover:border-signal/40 sm:flex"
            >
              <Wallet className="h-3.5 w-3.5 text-signal" />
              {formatRupiah(balance ?? 0)}
            </Link>
            <Link
              href="/riwayat"
              className="rounded-lg p-2 text-text-muted transition hover:bg-surface hover:text-text"
              title="Riwayat"
            >
              <History className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-medium text-text transition hover:border-signal/40"
            >
              {username}
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg p-2 text-text-muted transition hover:bg-surface hover:text-danger"
                title="Keluar"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-muted transition hover:text-text"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-bg-deep transition hover:bg-signal-dim"
            >
              Daftar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
