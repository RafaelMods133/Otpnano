import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  tone: "signal" | "copper" | "muted" | "danger";
  pulse?: boolean;
}

const toneClasses: Record<StatusBadgeProps["tone"], string> = {
  signal: "bg-signal/10 text-signal border-signal/30",
  copper: "bg-copper/10 text-copper border-copper/30",
  muted: "bg-white/5 text-text-muted border-border",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function StatusBadge({ label, tone, pulse }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {pulse && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full signal-dot",
            tone === "signal" && "bg-signal",
            tone === "copper" && "bg-copper",
            tone === "danger" && "bg-danger",
            tone === "muted" && "bg-text-muted"
          )}
        />
      )}
      {label}
    </span>
  );
}
