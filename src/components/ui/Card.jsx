import { cn } from "../../lib/cn";

export function Card({ className, tone = "calm", ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl transition-colors",
        tone === "calm" &&
          "bg-surface border border-surface-border shadow-[0_4px_16px_rgba(31,45,77,0.05),0_2px_0_#E5DFD2]",
        tone === "institutional" &&
          "rounded-2xl bg-inst-surface border border-inst-border shadow-[0_1px_2px_rgba(31,45,77,0.04),0_6px_18px_rgba(31,45,77,0.03)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, as: Tag = "h2", ...props }) {
  return (
    <Tag
      className={cn("font-display font-semibold text-lg text-ink leading-snug m-0", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm text-ink-muted m-0 leading-relaxed", className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}
