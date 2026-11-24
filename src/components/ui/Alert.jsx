import { cn } from "../../lib/cn";

export function Alert({ className, variant = "info", role, children, ...props }) {
  const defaultRole = variant === "error" ? "alert" : "status";
  return (
    <div
      role={role || defaultRole}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold",
        variant === "info" && "bg-pais-soft/80 border-pais/25 text-ink",
        variant === "success" && "bg-success-soft border-success/30 text-success-deep",
        variant === "error" && "bg-danger-soft border-danger/30 text-danger",
        variant === "warning" && "bg-warn-soft border-warn/50 text-[#6B4700]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
