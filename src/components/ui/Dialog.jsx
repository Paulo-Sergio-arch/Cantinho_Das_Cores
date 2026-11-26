import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

const SELETOR_FOCAVEL =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const elementoAnterior = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focarInicial = setTimeout(() => {
      const raiz = containerRef.current;
      if (!raiz) return;
      if (raiz.contains(document.activeElement)) return;
      const primeiro = raiz.querySelector(SELETOR_FOCAVEL);
      primeiro?.focus?.();
    }, 20);

    const onKeyDown = (ev) => {
      if (ev.key === "Escape") {
        onClose?.();
        return;
      }
      if (ev.key === "Tab" && containerRef.current) {
        const focaveis = Array.from(
          containerRef.current.querySelectorAll(SELETOR_FOCAVEL)
        );
        if (!focaveis.length) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (ev.shiftKey && document.activeElement === primeiro) {
          ev.preventDefault();
          ultimo.focus();
        } else if (!ev.shiftKey && document.activeElement === ultimo) {
          ev.preventDefault();
          primeiro.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(focarInicial);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (elementoAnterior && typeof elementoAnterior.focus === "function") {
        elementoAnterior.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className={cn(
          "flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-inst-border bg-inst-surface shadow-2xl",
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
