import { motion } from "motion/react";
import { Mail, Star, Volume2 } from "lucide-react";
import { falar } from "../utils/voz";
import { cn } from "../lib/cn";

export default function RecadoDaSemana({ dados, calmo, onJogarDesafio }) {
  if (!dados) return null;
  const { recado, desafio } = dados;
  return (
    <section
      aria-label="Recado da semana"
      className="w-full rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8] px-4 py-3 shadow-[0_2px_8px_rgba(31,45,77,0.04)] sm:px-5"
    >
      {recado && (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAE5D9] text-[#5B82BA]">
            <Mail size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-ink-muted">Recado da semana</p>
            <p className="m-0 break-words text-base font-semibold leading-snug text-ink sm:text-lg">{recado.texto}</p>
          </div>
          <motion.button
            type="button"
            whileTap={calmo ? undefined : { scale: 0.94 }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B82BA] text-white shadow-[0_2px_0_#43669B] transition-colors hover:bg-[#4F75AE]"
            onClick={() => falar(recado.texto)}
            aria-label="Ouvir o recado"
            title="Ouvir o recado"
          >
            <Volume2 size={19} aria-hidden="true" />
          </motion.button>
        </div>
      )}
      {desafio && (
        <button
          type="button"
          onClick={() => onJogarDesafio?.(desafio.jogo)}
          className={cn(
            "inline-flex max-w-full items-center gap-2 rounded-full border border-[#E3BE7A] bg-[#FFF6E3] px-3.5 py-1.5",
            "text-sm font-bold text-[#7A5200] transition-colors hover:bg-[#FCEBC7]",
            recado && "mt-3"
          )}
        >
          <Star size={16} className="shrink-0 fill-[#E3BE7A] text-[#B89042]" aria-hidden="true" />
          <span className="min-w-0 truncate">Desafio da semana: {desafio.nome}</span>
        </button>
      )}
    </section>
  );
}
