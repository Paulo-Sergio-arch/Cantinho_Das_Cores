import { useEffect } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  titleId = "dialog-title",
  children,
  footer,
  footerClassName,
  className,
}) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (ev) => {
      if (ev.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className={cn(
          "flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-inst-border bg-inst-surface shadow-2xl sm:max-h-[85vh] sm:rounded-3xl",
          "alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-inst-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-semibold text-ink m-0 leading-snug">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 mb-0 text-xs text-ink-muted">{subtitle}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar janela"
            className="h-9 w-9 shrink-0 rounded-xl"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-4 text-sm leading-relaxed text-ink space-y-4 sm:px-6">
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              "flex flex-wrap items-center justify-end gap-2 border-t border-inst-border bg-inst-subtle/60 px-5 py-3.5 sm:px-6",
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
