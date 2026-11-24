import { useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { PAL } from "../data/jogosData";

export default function Vitoria({ calmo = false }) {
  const [conf] = useState(() =>
    Array.from({ length: 22 }, (_, i) => ({
      l: Math.random() * 100,
      c: PAL[i % PAL.length],
      d: Math.random() * 0.45,
      t: 1.3 + Math.random() * 0.7,
    }))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-[2px]"
      role="status"
    >
      {!calmo &&
        conf.map((c, i) => (
          <i
            key={i}
            className="confete-particula"
            style={{
              left: `${c.l}%`,
              background: c.c,
              animationDelay: `${c.d}s`,
              animationDuration: `${c.t}s`,
            }}
          />
        ))}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 24 }}
        className="flex flex-col items-center gap-3 rounded-3xl border border-surface-border bg-surface px-10 py-8 shadow-2xl"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-warn-soft border border-warn/40"
          aria-hidden="true"
        >
          <Star size={44} className="fill-[#E8B638] text-[#BA8C1D]" />
        </div>
        <p className="font-display text-3xl font-semibold text-ink m-0">Parabéns!</p>
      </motion.div>
    </div>
  );
}
