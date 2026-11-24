import { useEffect } from "react";
import { motion } from "motion/react";
import { RotateCcw, Home, Star } from "lucide-react";
import { falar } from "../utils/voz";
import { calcularPontuacaoFrutas } from "../services/partidas";
import Fundo from "./Fundo";
import Nuvi from "./Nuvi";
import { Badge, Button } from "./ui";

export default function Fim({ total = 5, estatisticas, idade, onNovo, onSair, onFim }) {
  useEffect(() => {
    falar("Parabéns! Você conseguiu!");
    onFim?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ehFrutas = estatisticas?.totalMetas !== undefined;
  const acertos = estatisticas?.acertos ?? total;
  const erros = estatisticas?.erros ?? 0;
  const tentativas = acertos + erros;
  const taxa = tentativas > 0 ? Math.round((acertos / tentativas) * 100) : 100;

  const frutasResumo = ehFrutas
    ? calcularPontuacaoFrutas({
        acertos,
        erros,
        concluida: true,
        metasConcluidas: estatisticas.metasConcluidas,
        totalMetas: estatisticas.totalMetas,
        quadradosFechados: estatisticas.quadradosFechados,
        jogadasRestantes: estatisticas.jogadasRestantes,
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="relative w-full overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-b from-[#E7F4FF] via-[#F4F8F4] to-[#E2F3E4] p-6 sm:p-8 shadow-[0_8px_24px_rgba(31,45,77,0.08)]"
    >
      <Fundo variant="vitoria" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <Nuvi fala="Parabéns! Você conseguiu!" ouvivel className="mb-0 max-w-lg" />

        <div className="flex items-center justify-center gap-2 py-2" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 360, damping: 18 }}
            >
              <Star size={40} className="fill-[#E8B638] text-[#BA8C1D] drop-shadow-xs" />
            </motion.span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {idade && <Badge variant="brand">{idade} anos</Badge>}
          {ehFrutas && frutasResumo ? (
            <>
              <Badge variant="success">{frutasResumo.pontuacao}/100 pontos</Badge>
              {estatisticas.quadradosFechados > 0 && (
                <Badge variant="default">
                  {estatisticas.quadradosFechados}{" "}
                  {estatisticas.quadradosFechados === 1 ? "quadrado mágico" : "quadrados mágicos"}
                </Badge>
              )}
              {estatisticas.jogadasRestantes > 0 && (
                <Badge variant="warning">{estatisticas.jogadasRestantes} jogadas sobrando</Badge>
              )}
            </>
          ) : (
            <>
              <Badge variant="success">{acertos} acertos</Badge>
              <Badge variant="default">{taxa}% de precisão</Badge>
            </>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="playful" size="lg" onClick={onNovo}>
            <RotateCcw size={18} />
            Jogar de novo
          </Button>
          <Button variant="secondary" size="lg" onClick={onSair}>
            <Home size={18} />
            Voltar ao menu
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
