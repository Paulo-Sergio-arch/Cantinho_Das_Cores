import { motion } from "motion/react";
import { Volume2 } from "lucide-react";
import { falar } from "../utils/voz";
import { cn } from "../lib/cn";

export function NuviMascote({ size = "md", comPes = false, className = "" }) {
  const dims =
    size === "lg"
      ? { w: 128, h: comPes ? 104 : 90 }
      : size === "sm"
        ? { w: 80, h: comPes ? 64 : 56 }
        : { w: 108, h: comPes ? 88 : 76 };

  return (
    <motion.svg
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
      className={cn("shrink-0", className)}
      viewBox={comPes ? "0 0 124 98" : "0 0 120 84"}
      width={dims.w}
      height={dims.h}
      aria-hidden="true"
    >
      {comPes && (
        <>
          <ellipse cx="62" cy="92" rx="34" ry="4.5" fill="#DFD9CB" />
          <path
            d="M48 73v11a4 4 0 0 1-8 0v-9"
            fill="#E3ECF5"
            stroke="#84A3C4"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M76 73v11a4 4 0 0 0 8 0v-9"
            fill="#E3ECF5"
            stroke="#84A3C4"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      <g fill="#F8FBFE" stroke="#84A3C4" strokeWidth="3">
        <circle cx="38" cy="48" r="23" />
        <circle cx="62" cy="34" r="27" />
        <circle cx="86" cy="49" r="21" />
        <rect x="30" y="48" width="66" height="23" rx="11.5" stroke="none" />
      </g>
      <path d="M26 67h72" stroke="#DCE9F6" strokeWidth="5" strokeLinecap="round" />
      {/* Olhinhos sorridentes calmos */}
      <path
        d="M46 49q4-5 8 0"
        stroke="#273654"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M70 49q4-5 8 0"
        stroke="#273654"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M57 54q5 5.5 10 0"
        stroke="#273654"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="43" cy="56" rx="5" ry="3.2" fill="#F2B8B5" />
      <ellipse cx="81" cy="56" rx="5" ry="3.2" fill="#F2B8B5" />
    </motion.svg>
  );
}

/**
 * Componente da mascote Nuvi com dois layouts limpos:
 * - variant="menu": mascote solta ao lado do balão branco-marfim + slot opcional abaixo (níveis)
 * - variant="jogo": quadrado bege suave com Nuvi + balão compacto + botão circular de áudio ao lado
 */
export default function Nuvi({
  fala,
  falaVisual,
  ouvivel = false,
  variant = "menu",
  belowBubble = null,
  className = "",
}) {
  if (variant === "jogo") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-3.5",
          className
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl bg-[#EAE5D9] px-4 py-2.5",
            "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
          )}
        >
          <NuviMascote size="sm" />
          <span className="mt-0.5 text-sm font-bold text-ink">Nuvi</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8] px-5 py-3 shadow-[0_2px_6px_rgba(31,45,77,0.04)]",
              "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
            )}
          >
            {/* Pontinha do balão */}
            <span
              className="hidden sm:block absolute -left-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-[#DDD6C7] bg-[#FCFBF8] alto-contraste:border-slate-950"
              aria-hidden="true"
            />
            <p
              className="m-0 text-base sm:text-lg font-semibold text-ink leading-snug"
              aria-live="polite"
            >
              {falaVisual || fala}
            </p>
          </div>

          {ouvivel && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              className={cn(
                "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#779FE0] text-white shadow-[0_3px_0_#5982C4] transition-colors hover:bg-[#6691DA]",
                "alto-contraste:bg-white alto-contraste:text-slate-950 alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
              )}
              onClick={() => falar(fala)}
              aria-label="Ouvir instrução da Nuvi novamente"
              title="Ouvir novamente"
            >
              <Volume2 size={21} aria-hidden="true" />
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:gap-5",
        className
      )}
    >
      <NuviMascote size="md" comPes />

      <div className="flex flex-col items-center gap-3 sm:items-start">
        <div
          className={cn(
            "relative flex items-center gap-3.5 rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8] px-5 py-3 shadow-[0_2px_8px_rgba(31,45,77,0.04)]",
            "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
          )}
        >
          <span
            className="hidden sm:block absolute -left-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-[#DDD6C7] bg-[#FCFBF8] alto-contraste:border-slate-950"
            aria-hidden="true"
          />
          <p
            className="m-0 text-base sm:text-lg font-medium text-ink leading-snug"
            aria-live="polite"
          >
            {falaVisual || fala}
          </p>
          {ouvivel && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B82BA] text-white shadow-[0_2px_0_#43669B] transition-colors hover:bg-[#4F75AE]",
                "alto-contraste:bg-white alto-contraste:text-slate-950 alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
              )}
              onClick={() => falar(fala)}
              aria-label="Ouvir instrução da Nuvi novamente"
              title="Ouvir novamente"
            >
              <Volume2 size={19} aria-hidden="true" />
            </motion.button>
          )}
        </div>

        {belowBubble && <div className="w-full">{belowBubble}</div>}
      </div>
    </div>
  );
}
