import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-tight whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-surface-muted text-ink border border-surface-border",
        brand: "bg-pais-soft text-pais-deep border border-pais/20",
        success: "bg-success-soft text-success-deep border border-success/25",
        warning: "bg-warn-soft text-[#7A5200] border border-warn/40",
        danger: "bg-danger-soft text-danger border border-danger/25",
        muted: "bg-inst-subtle text-ink-muted border border-inst-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
