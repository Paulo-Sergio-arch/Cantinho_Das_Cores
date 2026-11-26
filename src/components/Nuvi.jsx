import { motion } from "motion/react";
import { Volume2 } from "lucide-react";
import { falar } from "../utils/voz";
import { cn } from "../lib/cn";

export function NuviMascote({ size = "md", comPes = false, calmo = false, className = "" }) {
  const dims =
    size === "lg"
      ? { w: 128, h: comPes ? 104 : 90 }
      : size === "sm"
        ? { w: 72, h: comPes ? 58 : 50 }
        : { w: 104, h: comPes ? 84 : 72 };

  return (
    <motion.svg
      animate={calmo ? { y: 0 } : { y: [0, -3, 0] }}
      transition={calmo ? { duration: 0 } : { duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
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
      <g fill="#84A3C4" stroke="#84A3C4" strokeWidth="6" strokeLinejoin="round">
        <circle cx="38" cy="48" r="23" />
        <circle cx="62" cy="34" r="27" />
        <circle cx="86" cy="49" r="21" />
        <rect x="30" y="48" width="62" height="23" rx="11.5" />
      </g>
      <g fill="#F8FBFE">
        <circle cx="38" cy="48" r="23" />
        <circle cx="62" cy="34" r="27" />
        <circle cx="86" cy="49" r="21" />
        <rect x="30" y="48" width="62" height="23" rx="11.5" />
      </g>
      <path d="M26 67h72" stroke="#DCE9F6" strokeWidth="5" strokeLinecap="round" />
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

export default function Nuvi({
  fala,
  falaVisual,
  ouvivel = false,
  calmo = false,
  variant = "menu",
  belowBubble = null,
  className = "",
}) {
  if (variant === "jogo") {
    return (
      <div
        className={cn(
          "flex w-full max-w-xl items-center justify-center gap-2.5 sm:gap-3.5",
          className
        )}
      >
        <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-[#EAE5D9] px-3 py-2 sm:px-4 sm:py-2.5">
          <NuviMascote size="sm" calmo={calmo} />
          <span className="mt-0.5 text-xs sm:text-sm font-bold text-ink">Nuvi</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:gap-3">
          <div className="relative min-w-0 flex-1 rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8] px-3.5 py-2.5 shadow-[0_2px_6px_rgba(31,45,77,0.04)] sm:flex-initial sm:px-5 sm:py-3">
            <span
              className="hidden sm:block absolute -left-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-[#DDD6C7] bg-[#FCFBF8]"
              aria-hidden="true"
            />
            <p
              className="m-0 text-sm sm:text-lg font-semibold text-ink leading-snug"
              aria-live="polite"
            >
              {falaVisual || fala}
            </p>
          </div>

          {ouvivel && (
            <motion.button
              type="button"
              whileTap={calmo ? undefined : { scale: 0.94 }}
              className="inline-flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#6B93D6] text-white shadow-[0_3px_0_#4E76B8] transition-colors hover:bg-[#5E86CA]"
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

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:gap-5",
        className
      )}
    >
      <NuviMascote size="md" comPes calmo={calmo} />

      <div className="flex flex-col items-center gap-3 sm:items-start">
        <div className="relative flex items-center gap-3 rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8] px-4 py-3 shadow-[0_2px_8px_rgba(31,45,77,0.04)] sm:gap-3.5 sm:px-5">
          <span
            className="hidden sm:block absolute -left-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-[#DDD6C7] bg-[#FCFBF8]"
            aria-hidden="true"
          />
          <p
            className="m-0 text-sm sm:text-lg font-medium text-ink leading-snug"
            aria-live="polite"
          >
            {falaVisual || fala}
          </p>
          {ouvivel && (
            <motion.button
              type="button"
              whileTap={calmo ? undefined : { scale: 0.94 }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B82BA] text-white shadow-[0_2px_0_#43669B] transition-colors hover:bg-[#4F75AE]"
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
