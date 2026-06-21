"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Radio, Loader2, CheckCircle2 } from "lucide-react";

export function RegisterForm() {
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("Username 3-20 karakter, hanya huruf/angka/underscore");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    setLoading(false);

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Email ini sudah terdaftar"
          : error.message
      );
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-signal" />
        <h1 className="mt-4 font-display text-xl font-semibold text-text">
          Cek email Anda
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Kami sudah mengirim tautan konfirmasi ke <strong>{email}</strong>.
          Klik tautan tersebut untuk mengaktifkan akun.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:border-signal/40"
        >
          Ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="flex items-center justify-center gap-2.5">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised">
          <Radio className="h-4.5 w-4.5 text-signal" strokeWidth={2.2} />
        </span>
        <span className="font-display text-xl font-semibold text-text">
          OTPNANO
        </span>
      </Link>

      <h1 className="mt-8 text-center font-display text-2xl font-semibold text-text">
        Buat akun baru
      </h1>
      <p className="mt-2 text-center text-sm text-text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-signal hover:underline">
          Masuk di sini
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-text">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-signal/50"
            placeholder="username_anda"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-signal/50"
            placeholder="nama@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
            Kata sandi
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-signal/50"
            placeholder="Minimal 8 karakter"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-bg-deep transition hover:bg-signal-dim disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Daftar
        </button>
      </form>
    </div>
  );
}
