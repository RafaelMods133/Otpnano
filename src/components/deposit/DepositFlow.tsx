"use client";

import { useState } from "react";
import { DepositForm } from "@/components/deposit/DepositForm";
import { DepositQris } from "@/components/deposit/DepositQris";
import type { PakasirMethod } from "@/lib/payment/pakasir";

interface DepositState {
  depositId: string;
  totalPayment: number;
  requestedAmount: number;
  paymentMethod: PakasirMethod;
  paymentNumber: string;
  expiresAt: string;
  fee: number;
}

export function DepositFlow() {
  const [state, setState] = useState<DepositState | null>(null);

  if (state) {
    return (
      <DepositQris
        depositId={state.depositId}
        totalPayment={state.totalPayment}
        requestedAmount={state.requestedAmount}
        paymentMethod={state.paymentMethod}
        paymentNumber={state.paymentNumber}
        expiresAt={state.expiresAt}
        fee={state.fee}
        onCancel={() => setState(null)}
      />
    );
  }

  return <DepositForm onCreated={setState} />;
}
