import { cn } from "../../lib/cn";

export function Alert({ className, variant = "info", role, children, ...props }) {
  const defaultRole = variant === "error" ? "alert" : "status";
  return (
    <div
      role={role || defaultRole}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold",
        variant === "info" && "bg-brand-soft/80 border-brand/25 text-ink",
        variant === "success" && "bg-success-soft border-success/30 text-success-deep",
        variant === "error" && "bg-danger-soft border-danger/30 text-danger",
        variant === "warning" && "bg-warn-soft border-warn/50 text-[#6B4700]",
        "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:text-slate-950",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
