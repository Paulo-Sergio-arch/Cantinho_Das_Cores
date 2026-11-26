import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Cloud, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

/**
 * Silhueta de nuvem fofa da Nuvi usada nos pop-ups e toasts.
 * variant: "success" | "error" | "warning" | "info" | "delete"
 */
export function NuviCloudIcon({ variant = "success", className = "" }) {
  const ehErro = variant === "error" || variant === "warning";
  const ehDelete = variant === "delete";
  const stroke = ehErro ? "#D47B6A" : ehDelete ? "#8F82C4" : "#7A9EC4";
  const bochecha = ehErro ? "#F5C2B8" : "#F2B8B5";

  return (
    <svg
      viewBox="0 0 88 62"
      width="54"
      height="38"
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-[0_3px_6px_rgba(31,45,77,0.08)]", className)}
    >
      <g fill="#FFFFFF" stroke={stroke} strokeWidth="2.6">
        <circle cx="26" cy="36" r="16" />
        <circle cx="44" cy="25" r="20" />
        <circle cx="62" cy="37" r="15" />
        <rect x="21" y="36" width="46" height="17" rx="8.5" stroke="none" />
      </g>
      <path d="M19 50h50" stroke="#E4EEF8" strokeWidth="3.8" strokeLinecap="round" />

      {ehErro ? (
        <>
          <circle cx="35" cy="36" r="2.2" fill="#273654" />
          <circle cx="53" cy="36" r="2.2" fill="#273654" />
          <path
            d="M41 43q3-2.5 6 0"
            stroke="#273654"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M32 36q3-4 6 0"
            stroke="#273654"
            strokeWidth="2.3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 36q3-4 6 0"
            stroke="#273654"
            strokeWidth="2.3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40 41q4 4.2 8 0"
            stroke="#273654"
            strokeWidth="2.3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      <ellipse cx="29" cy="41.5" rx="3.8" ry="2.3" fill={bochecha} />
      <ellipse cx="59" cy="41.5" rx="3.8" ry="2.3" fill={bochecha} />
    </svg>
  );
}

const ESTILOS_NUVEM = {
  success: {
    container:
      "border-[#A9D5B9] bg-gradient-to-b from-[#FFFFFF] via-[#F6FCF8] to-[#E8F6EE] text-[#1D4D33] shadow-[0_14px_32px_rgba(31,104,63,0.14),0_4px_0_#CBE6D5]",
    puffBorder: "#A9D5B9",
    puffBg: "#FFFFFF",
    seloBg: "bg-[#DDF2E5] text-[#1F683F]",
    rotulo: "Tudo certo!",
    Icon: CheckCircle2,
  },
  delete: {
    container:
      "border-[#C8BEE8] bg-gradient-to-b from-[#FFFFFF] via-[#F8F6FD] to-[#EFEBF9] text-[#352A59] shadow-[0_14px_32px_rgba(88,68,122,0.14),0_4px_0_#D8D0F0]",
    puffBorder: "#C8BEE8",
    puffBg: "#FFFFFF",
    seloBg: "bg-[#E7E1F7] text-[#58447A]",
    rotulo: "Prontinho!",
    Icon: Sparkles,
  },
  error: {
    container:
      "border-[#EBB8B0] bg-gradient-to-b from-[#FFFFFF] via-[#FFF8F6] to-[#FDECE9] text-[#6E2623] shadow-[0_14px_32px_rgba(150,43,40,0.14),0_4px_0_#F2CEC8]",
    puffBorder: "#EBB8B0",
    puffBg: "#FFFFFF",
    seloBg: "bg-[#FBDAD6] text-[#962B28]",
    rotulo: "Ops! Vamos conferir",
    Icon: TriangleAlert,
  },
  warning: {
    container:
      "border-[#EAD096] bg-gradient-to-b from-[#FFFFFF] via-[#FFFDF7] to-[#FDF5E1] text-[#6B4700] shadow-[0_14px_32px_rgba(186,140,29,0.14),0_4px_0_#EFE0B9]",
    puffBorder: "#EAD096",
    puffBg: "#FFFFFF",
    seloBg: "bg-[#FBF0CE] text-[#845C1C]",
    rotulo: "Atenção",
    Icon: TriangleAlert,
  },
  info: {
    container:
      "border-[#B6D0EE] bg-gradient-to-b from-[#FFFFFF] via-[#F6FAFF] to-[#E8F2FC] text-[#1F2D4D] shadow-[0_14px_32px_rgba(47,111,214,0.14),0_4px_0_#CFE0F5]",
    puffBorder: "#B6D0EE",
    puffBg: "#FFFFFF",
    seloBg: "bg-[#DCEBFA] text-[#2F6FD6]",
    rotulo: "Recadinho da Nuvi",
    Icon: Cloud,
  },
};

/**
 * Pop-up flutuante fofo em formato de nuvem (Toast) com a estética da Nuvi.
 */
export function CloudToast({
  message,
  title,
  variant = "success",
  onClose,
  duration = 4800,
  action = null,
}) {
  useEffect(() => {
    if (!message || !duration || !onClose) return undefined;
    const t = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  const cfg = ESTILOS_NUVEM[variant] || ESTILOS_NUVEM.success;
  const IconeSelo = cfg.Icon;
  const ehAlerta = variant === "error" || variant === "warning";

  return (
    <AnimatePresence>
      {message && (
        <div
          className="no-print pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6"
          role={ehAlerta ? "alert" : "status"}
          aria-live={ehAlerta ? "assertive" : "polite"}
        >
          <motion.div
            key={String(message)}
            initial={{ opacity: 0, y: -22, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="pointer-events-auto relative max-w-lg w-full pt-4"
          >
            {/* Ondinhas superiores que dão a silhueta orgânica de nuvem */}
            <svg
              viewBox="0 0 260 28"
              className="pointer-events-none absolute -top-0.5 left-8 h-6 w-48 select-none"
              aria-hidden="true"
            >
              <path
                d="M12 28 C14 12, 36 8, 52 18 C64 4, 98 2, 116 17 C130 7, 158 9, 170 22 C184 13, 208 16, 218 28 Z"
                fill={cfg.puffBg}
                stroke={cfg.puffBorder}
                strokeWidth="2.2"
              />
              <rect x="8" y="25" width="214" height="5" fill={cfg.puffBg} />
            </svg>

            {/* Bolhinhas de pensamento de nuvem flutuando ao lado */}
            <span
              className="pointer-events-none absolute -bottom-2.5 left-10 h-3.5 w-3.5 rounded-full border-2 bg-white"
              style={{ borderColor: cfg.puffBorder }}
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -bottom-5 left-6 h-2 w-2 rounded-full border-2 bg-white"
              style={{ borderColor: cfg.puffBorder }}
              aria-hidden="true"
            />

            <div
              className={cn(
                "relative flex items-center gap-3.5 rounded-[30px] border-2 px-4 py-3.5 sm:px-5 sm:py-4",
                cfg.container
              )}
            >
              <NuviCloudIcon variant={variant} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                      cfg.seloBg
                    )}
                  >
                    <IconeSelo size={12} aria-hidden="true" />
                    {title || cfg.rotulo}
                  </span>
                </div>
                <p className="mt-1 mb-0 text-sm sm:text-[15px] font-bold leading-snug break-words">
                  {message}
                </p>
                {action && <div className="mt-2">{action}</div>}
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar aviso em nuvem"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/80 text-ink-muted transition-colors hover:bg-white hover:text-ink"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal de confirmação em formato de nuvem fofa (para exclusão de relatórios ou perfis).
 */
export function CloudConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar exclusão?",
  description,
  confirmLabel = "Sim, excluir",
  cancelLabel = "Cancelar",
  busy = false,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (ev) => {
      if (ev.key === "Escape" && !busy) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) onClose?.();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 390, damping: 28 }}
            className="relative w-full max-w-md pt-6"
          >
            {/* Topo de nuvem escultural */}
            <svg
              viewBox="0 0 320 42"
              className="pointer-events-none absolute -top-0.5 left-1/2 h-9 w-72 -translate-x-1/2 select-none"
              aria-hidden="true"
            >
              <path
                d="M18 42 C22 18, 54 12, 78 26 C96 5, 148 2, 174 23 C196 9, 236 12, 254 30 C272 18, 298 24, 306 42 Z"
                fill="#FFFFFF"
                stroke="#C9D9EC"
                strokeWidth="2.4"
              />
              <rect x="14" y="38" width="294" height="6" fill="#FFFFFF" />
            </svg>

            {/* Bolhinhas inferiores de nuvem */}
            <span
              className="pointer-events-none absolute -bottom-3 right-12 h-4 w-4 rounded-full border-2 border-[#C9D9EC] bg-white"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -bottom-6 right-7 h-2.5 w-2.5 rounded-full border-2 border-[#C9D9EC] bg-white"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-[36px] border-2 border-[#C9D9EC] bg-gradient-to-b from-[#FFFFFF] via-[#F8FBFF] to-[#EEF5FC] p-6 text-center shadow-[0_18px_40px_rgba(31,45,77,0.16),0_5px_0_#D5E3F2]">
              <div className="mx-auto mb-3 flex h-16 w-24 items-center justify-center rounded-3xl border border-[#DCE8F6] bg-white/90 shadow-2xs">
                <NuviCloudIcon variant="delete" className="scale-110" />
              </div>

              <h2
                id="cloud-confirm-title"
                className="font-display m-0 text-xl font-semibold text-ink"
              >
                {title}
              </h2>

              {description && (
                <p className="mt-2 mb-5 text-sm leading-relaxed text-ink-muted">
                  {description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Button
                  variant="outlineInst"
                  size="sm"
                  disabled={busy}
                  onClick={onClose}
                  className="min-w-[116px] rounded-2xl"
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  aria-busy={busy}
                  onClick={onConfirm}
                  className="min-w-[136px] rounded-2xl"
                >
                  <Trash2 size={15} />
                  {busy ? "Excluindo…" : confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
