import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

export function Dialog({ open, onClose, title, titleId = "dialog-title", children, footer, className }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (ev) => {
      if (ev.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-inst-border bg-inst-surface shadow-2xl",
          "alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-inst-border px-6 py-4">
          <h2 id={titleId} className="font-display text-lg font-semibold text-ink m-0">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar janela"
            className="h-9 w-9 rounded-lg"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="overflow-y-auto px-6 py-4 text-sm leading-relaxed text-ink space-y-3">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-inst-border bg-inst-subtle/50 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
