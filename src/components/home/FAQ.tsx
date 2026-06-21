const faqs = [
  {
    q: "Berapa lama saldo masuk setelah transfer?",
    a: "Biasanya dalam hitungan detik setelah QRIS Anda berhasil dipindai oleh sistem pembayaran. Jika lebih dari 5 menit belum masuk, periksa kembali nominal transfer — termasuk tiga digit kode unik di belakangnya.",
  },
  {
    q: "Kenapa nominal transfer harus pakai kode unik?",
    a: "Kode unik membuat setiap permintaan deposit punya nominal yang berbeda, sehingga sistem bisa langsung mengenali transfer Anda secara otomatis tanpa perlu konfirmasi manual.",
  },
  {
    q: "Bagaimana jika OTP tidak kunjung masuk?",
    a: "Setiap nomor punya batas waktu tunggu. Jika OTP tidak masuk sebelum waktu habis, saldo Anda akan dikembalikan secara otomatis ke dompet.",
  },
  {
    q: "Apakah nomor bisa dipakai berulang kali?",
    a: "Tidak. Setiap nomor bersifat sekali pakai untuk satu kali proses verifikasi, sesuai dengan sifat nomor virtual.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border-soft bg-bg-deep/40">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-signal">
          Pertanyaan umum
        </span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
          Yang sering ditanyakan
        </h2>

        <div className="mt-8 divide-y divide-border-soft">
          {faqs.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-sm font-medium text-text">
                {item.q}
                <span className="ml-4 text-text-faint transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
