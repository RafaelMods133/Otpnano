import { cn } from "@/lib/utils";

interface SignalBarsProps {
  active?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Signature element halaman ini: bar sinyal yang berdenyut seperti
 * indikator kekuatan sinyal HP. Dipakai untuk menandai status "live"
 * (menunggu OTP, callback masuk, dsb) di seluruh aplikasi.
 */
export function SignalBars({ active = true, size = "sm", className }: SignalBarsProps) {
  const heights = size === "sm" ? [4, 7, 10, 13] : [6, 10, 14, 18];
  const widths = size === "sm" ? "w-[3px]" : "w-1";

  return (
    <span className={cn("inline-flex items-end gap-[2px]", className)} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            widths,
            "rounded-full",
            active ? "bg-signal signal-bar" : "bg-text-faint"
          )}
          style={{
            height: `${h}px`,
            animationDelay: active ? `${i * 0.15}s` : undefined,
          }}
        />
      ))}
    </span>
  );
}
