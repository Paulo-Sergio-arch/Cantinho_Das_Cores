import { cn } from "../../lib/cn";

export function Card({ className, tone = "calm", ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl transition-colors",
        tone === "calm" &&
          "bg-surface border border-surface-border shadow-[0_4px_16px_rgba(31,45,77,0.05),0_2px_0_#E5DFD2]",
        tone === "institutional" &&
          "rounded-2xl bg-inst-surface border border-inst-border shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]",
        "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3", className)}
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
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
