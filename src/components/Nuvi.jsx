import { motion } from "motion/react";
import { Volume2 } from "lucide-react";
import { falar } from "../utils/voz";
import { cn } from "../lib/cn";

export function NuviMascote({ size = "md", className = "" }) {
  const dims =
    size === "lg"
      ? { w: 124, h: 88 }
      : size === "sm"
        ? { w: 72, h: 52 }
        : { w: 88, h: 64 };

  return (
    <motion.svg
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      className={cn("shrink-0 drop-shadow-[0_4px_8px_rgba(47,111,214,0.12)]", className)}
      viewBox="0 0 120 84"
      width={dims.w}
      height={dims.h}
      aria-hidden="true"
    >
      <g fill="#FFFFFF" stroke="#9CC4E4" strokeWidth="3">
        <circle cx="38" cy="48" r="24" />
        <circle cx="64" cy="36" r="28" />
        <circle cx="88" cy="50" r="22" />
        <rect x="30" y="50" width="68" height="22" rx="11" stroke="none" />
      </g>
      <circle cx="52" cy="50" r="3.5" fill="#1F2D4D" />
      <circle cx="76" cy="50" r="3.5" fill="#1F2D4D" />
      <path
        d="M54 59q10 8.5 20 0"
        stroke="#1F2D4D"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="44" cy="58" r="4.5" fill="#F5B5B5" />
      <circle cx="84" cy="58" r="4.5" fill="#F5B5B5" />
    </motion.svg>
  );
}

export default function Nuvi({ fala, falaVisual, ouvivel = false, compacta = false, className = "" }) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3.5",
        compacta ? "mb-0" : "mb-4",
        className
      )}
    >
      <NuviMascote size={compacta ? "sm" : "md"} />
      <div
        className={cn(
          "relative flex flex-1 items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface px-4 py-3 shadow-[0_2px_8px_rgba(31,45,77,0.05)]",
          "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
        )}
      >
        <p
          className="m-0 text-[1rem] sm:text-[1.06rem] font-semibold leading-snug text-ink"
          aria-live="polite"
        >
          {falaVisual || fala}
        </p>
        {ouvivel && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_3px_0_#1E54AD] transition-colors hover:bg-[#2863C4]",
              "alto-contraste:bg-white alto-contraste:text-slate-950 alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
            )}
            onClick={() => falar(fala)}
            aria-label="Ouvir instrução da Nuvi novamente"
            title="Ouvir novamente"
          >
            <Volume2 size={20} aria-hidden="true" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
