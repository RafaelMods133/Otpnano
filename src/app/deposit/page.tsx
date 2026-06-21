import { Navbar } from "@/components/layout/Navbar";
import { DepositFlow } from "@/components/deposit/DepositFlow";
import { ShieldCheck } from "lucide-react";

export default function DepositPage() {
  return (
    <div className="flex min-h-full flex-col bg-bg">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-semibold text-text">
              Isi saldo
            </h1>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-text-muted">
              <ShieldCheck className="h-4 w-4 text-signal" />
              Diproses otomatis lewat QRIS
            </p>
          </div>
          <DepositFlow />
        </div>
      </main>
    </div>
  );
}
