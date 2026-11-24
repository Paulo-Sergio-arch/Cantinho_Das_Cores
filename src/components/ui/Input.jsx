import { cn } from "../../lib/cn";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("block text-sm font-bold text-ink mb-1.5", className)}
      {...props}
    />
  );
}

export function Input({ className, invalid = false, ...props }) {
  return (
    <input
      className={cn(
        "w-full min-h-11 rounded-xl border bg-white px-3.5 py-2.5 text-[0.98rem] text-ink placeholder:text-ink-muted/65",
        "transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 focus-visible:border-brand",
        invalid
          ? "border-danger bg-danger-soft/40 focus-visible:border-danger focus-visible:ring-danger/20"
          : "border-inst-border-strong hover:border-slate-400",
        "alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:bg-white alto-contraste:text-slate-950",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }) {
  return (
    <select
      className={cn(
        "w-full min-h-11 rounded-xl border border-inst-border-strong bg-white px-3.5 py-2.5 text-[0.95rem] font-semibold text-ink",
        "transition-colors hover:border-slate-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 focus-visible:border-brand",
        "alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:bg-white alto-contraste:text-slate-950",
        className
      )}
      {...props}
    />
  );
}
