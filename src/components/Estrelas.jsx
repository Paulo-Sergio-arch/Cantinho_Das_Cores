import { motion } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "../lib/cn";

export default function Estrelas({ n, total = 5, mostrarLegenda = false }) {
  const rodadaAtual = Math.min(n + 1, total);

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-full border border-[#DDD6C7] bg-[#F6F4EE] px-5 py-1.5",
        "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
      )}
      role="img"
      aria-label={`${n} de ${total} estrelas`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => {
          const preenchida = i < n;
          return (
            <motion.span
              key={i}
              initial={false}
              animate={preenchida ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="inline-flex items-center justify-center"
            >
              <Star
                size={21}
                strokeWidth={1.8}
                className={cn(
                  "transition-colors",
                  preenchida
                    ? "fill-[#E8B638] text-[#C9941A] alto-contraste:fill-slate-950 alto-contraste:text-slate-950"
                    : "fill-transparent text-[#C7B382] alto-contraste:text-slate-400"
                )}
                aria-hidden="true"
              />
            </motion.span>
          );
        })}
      </div>
      {mostrarLegenda && (
        <span className="mt-0.5 text-[11px] font-semibold text-ink-muted leading-none">
          Rodada {rodadaAtual} de {total}
        </span>
      )}
    </div>
  );
}
