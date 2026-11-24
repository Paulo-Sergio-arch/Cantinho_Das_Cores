import { motion } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "../lib/cn";

export default function Estrelas({ n, total = 5 }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-surface-border bg-surface-muted/60 px-3 py-1.5",
        "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
      )}
      role="img"
      aria-label={`${n} de ${total} estrelas`}
    >
      {Array.from({ length: total }, (_, i) => {
        const preenchida = i < n;
        return (
          <motion.span
            key={i}
            initial={false}
            animate={preenchida ? { scale: [1, 1.22, 1] } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            className="inline-flex items-center justify-center"
          >
            <Star
              size={20}
              className={cn(
                "transition-colors",
                preenchida
                  ? "fill-[#E8B638] text-[#C9941A] alto-contraste:fill-slate-950 alto-contraste:text-slate-950"
                  : "fill-transparent text-[#C7BFAE] alto-contraste:text-slate-400"
              )}
              aria-hidden="true"
            />
          </motion.span>
        );
      })}
    </div>
  );
}
