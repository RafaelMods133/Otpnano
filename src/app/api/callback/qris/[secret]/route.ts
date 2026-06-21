import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCallbackAmount } from "@/lib/utils";
import type { QrisCallbackPayload, QrisCallbackResponse } from "@/types/database";

/**
 * CALLBACK QRIS DARI SMP PAYMENT
 * ============================================================
 * URL endpoint ini: https://domainanda.com/api/callback/qris/{secret}
 * Daftarkan URL tersebut di dashboard SMP Payment (Pengaturan QRIS).
 *
 * Alur sesuai dokumentasi:
 * 1. Validasi key rahasia di path URL -> 401 jika tidak valid.
 * 2. Validasi us_username sesuai akun merchant kita -> 4015200 jika tidak valid.
 * 3. Cek RRN belum pernah diproses -> 2005201 jika sudah ("RRN already processed").
 * 4. Cocokkan amount.value dengan deposit "pending" yang nominalnya sama
 *    (sistem unique code) -> kredit saldo user via RPC atomic.
 * 5. Balas 2005200 "Request has been processed" jika sukses.
 */

function jsonResponse(body: QrisCallbackResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  // ---- 1. Validasi key rahasia di URL ----
  const expectedSecret = process.env.QRIS_CALLBACK_SECRET;
  if (!expectedSecret) {
    console.error("QRIS_CALLBACK_SECRET belum diset di environment variables.");
    return jsonResponse(
      { responseCode: "5005200", responseMessage: "Server misconfigured" },
      500
    );
  }

  if (secret !== expectedSecret) {
    return jsonResponse(
      { responseCode: "4015200", responseMessage: "Unauthorized" },
      401
    );
  }

  // ---- Parse payload ----
  let payload: QrisCallbackPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { responseCode: "4005200", responseMessage: "Invalid payload" },
      400
    );
  }

  const { us_username, rrn, amount, PayerName, issuer } = payload;

  if (!us_username || !rrn || !amount?.value) {
    return jsonResponse(
      { responseCode: "4005200", responseMessage: "Missing required fields" },
      400
    );
  }

  // ---- 2. Validasi username merchant ----
  const expectedUsername = process.env.QRIS_MERCHANT_USERNAME;
  if (!expectedUsername || us_username !== expectedUsername) {
    return jsonResponse(
      { responseCode: "4015200", responseMessage: "Username invalid" },
      200
    );
  }

  const supabase = createAdminClient();

  // ---- 3. Cek RRN sudah pernah diproses (anti duplikasi) ----
  const { data: existingDeposit } = await supabase
    .from("deposits")
    .select("id, status")
    .eq("rrn", rrn)
    .maybeSingle();

  if (existingDeposit) {
    return jsonResponse(
      { responseCode: "2005201", responseMessage: "RRN already processed" },
      200
    );
  }

  // ---- 4. Cocokkan nominal dengan deposit pending ----
  const totalAmount = parseCallbackAmount(amount.value);

  const { data: matchedDeposit, error: matchError } = await supabase
    .from("deposits")
    .select("id, total_amount, status, expires_at")
    .eq("total_amount", totalAmount)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (matchError) {
    console.error("Error mencari deposit pending:", matchError);
    return jsonResponse(
      { responseCode: "5005200", responseMessage: "Internal error" },
      500
    );
  }

  if (!matchedDeposit) {
    // Tidak ada deposit pending dengan nominal ini — tetap balas 200
    // supaya QRIS provider tidak retry terus-menerus, tapi catat di log
    // untuk pengecekan manual oleh admin.
    console.warn(
      `Callback QRIS diterima tanpa deposit pending yang cocok. RRN: ${rrn}, amount: ${totalAmount}`
    );
    return jsonResponse(
      {
        responseCode: "4045200",
        responseMessage: "No matching pending deposit found",
      },
      200
    );
  }

  // ---- 5. Kredit saldo secara atomic via RPC ----
  const { error: creditError } = await supabase.rpc("credit_deposit", {
    p_deposit_id: matchedDeposit.id,
    p_rrn: rrn,
    p_payer_name: PayerName ?? null,
    p_issuer: issuer ?? null,
  });

  if (creditError) {
    if (creditError.message?.includes("DEPOSIT_ALREADY_PROCESSED")) {
      return jsonResponse(
        { responseCode: "2005201", responseMessage: "RRN already processed" },
        200
      );
    }
    console.error("Error saat kredit deposit:", creditError);
    return jsonResponse(
      { responseCode: "5005200", responseMessage: "Internal error" },
      500
    );
  }

  return jsonResponse(
    { responseCode: "2005200", responseMessage: "Request has been processed" },
    200
  );
}
