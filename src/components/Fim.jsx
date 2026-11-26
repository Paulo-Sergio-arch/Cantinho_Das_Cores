import { useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, CheckCircle2, Gauge, Home, RotateCcw, Sparkles, Star } from "lucide-react";
import { falar } from "../utils/voz";
import { calcularPontuacaoFrutas } from "../services/partidas";
import BloquinhoFruta from "./BloquinhoFruta";
import Fundo from "./Fundo";
import { NuviMascote } from "./Nuvi";
import { Button } from "./ui";

function NuvemDecorativa({ className = "", scale = 1 }) {
  return (
    <svg
      viewBox="0 0 140 76"
      width={Math.round(140 * scale)}
      height={Math.round(76 * scale)}
      aria-hidden="true"
      className={className}
    >
      <g fill="#FFFFFF" stroke="#DCE8F5" strokeWidth="2.5">
        <circle cx="40" cy="46" r="22" />
        <circle cx="70" cy="33" r="27" />
        <circle cx="100" cy="47" r="20" />
        <rect x="34" y="45" width="70" height="23" rx="11.5" stroke="none" />
      </g>
    </svg>
  );
}

function FormaComOlhinhos({ tipo, cor, sombra, className = "", size = 72 }) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      {tipo === "quadrado" && (
        <g>
          <rect x="10" y="14" width="60" height="60" rx="16" fill={sombra} />
          <rect
            x="10"
            y="10"
            width="60"
            height="60"
            rx="16"
            fill={cor}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        </g>
      )}
      {tipo === "triangulo" && (
        <g>
          <path
            d="M40 12 L70 64 Q73 70 66 70 L14 70 Q7 70 10 64 Z"
            fill={cor}
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      )}
      {tipo === "estrela" && (
        <g>
          <polygon
            points="40,8 49,28 71,30 54,45 59,67 40,56 21,67 26,45 9,30 31,28"
            fill={cor}
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      )}
      {tipo === "circulo" && (
        <g>
          <circle
            cx="40"
            cy="40"
            r="28"
            fill={cor}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        </g>
      )}

      {/* Olhinhos e sorriso fofo */}
      <circle cx="31" cy="42" r="3.2" fill="#1F2D4D" />
      <circle cx="49" cy="42" r="3.2" fill="#1F2D4D" />
      <path
        d="M35 48 Q40 53 45 48"
        fill="none"
        stroke="#1F2D4D"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <ellipse cx="26" cy="46" rx="3.6" ry="2.2" fill="#F4B4B0" opacity="0.85" />
      <ellipse cx="54" cy="46" rx="3.6" ry="2.2" fill="#F4B4B0" opacity="0.85" />
    </svg>
  );
}

export default function Fim({
  total = 5,
  estatisticas,
  idade,
  calmo = false,
  onNovo,
  onSair,
  onFim,
}) {
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

  const animFlutuar = (delay = 0, amp = 6) =>
    calmo
      ? {}
      : {
          animate: { y: [0, -amp, 0] },
          transition: {
            duration: 3.8 + delay,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          },
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex w-full max-w-5xl items-center justify-center py-2 sm:py-4"
    >
      {/* ARCO-ÍRIS PASTEL E CENÁRIO LATERAL (OPÇÃO A) */}
      <div
        className="pointer-events-none absolute inset-x-0 -inset-y-2 overflow-hidden rounded-[36px]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1100 540"
          preserveAspectRatio="xMidYMax slice"
          className="h-full w-full"
        >
          {/* Arco-íris pastel acolhedor que abraça o card central e preenche as laterais */}
          <g fill="none" strokeLinecap="round" opacity={calmo ? "0.68" : "0.88"}>
            <path
              d="M 50 540 A 500 470 0 0 1 1050 540"
              stroke="#F7C7C5"
              strokeWidth="26"
            />
            <path
              d="M 76 540 A 474 444 0 0 1 1024 540"
              stroke="#FBE0B4"
              strokeWidth="26"
            />
            <path
              d="M 102 540 A 448 418 0 0 1 998 540"
              stroke="#FCF1B8"
              strokeWidth="26"
            />
            <path
              d="M 128 540 A 422 392 0 0 1 972 540"
              stroke="#C8ECCE"
              strokeWidth="26"
            />
            <path
              d="M 154 540 A 396 366 0 0 1 946 540"
              stroke="#C5E2FA"
              strokeWidth="26"
            />
            <path
              d="M 180 540 A 370 340 0 0 1 920 540"
              stroke="#DCD1F6"
              strokeWidth="26"
            />
          </g>

          {/* Bolinhas pastéis suaves decorativas */}
          <circle cx="84" cy="230" r="9" fill="#F2B8B5" opacity="0.8" />
          <circle cx="998" cy="285" r="10" fill="#CFC2F2" opacity="0.85" />
          <circle cx="195" cy="145" r="7" fill="#F7DC8B" opacity="0.8" />
          <circle cx="910" cy="145" r="8" fill="#B5DFC6" opacity="0.85" />
        </svg>
      </div>

      {/* BASTIDOR LATERAL ESQUERDO — Nuvens + Formas e Frutinhas Sorrindo */}
      <div
        className="pointer-events-none hidden md:flex md:w-52 lg:w-64 flex-col items-center justify-between self-stretch py-4 pr-2 relative z-10"
        aria-hidden="true"
      >
        <motion.div {...animFlutuar(0.2, 5)} className="self-start pl-2">
          <NuvemDecorativa scale={0.95} className="drop-shadow-xs" />
        </motion.div>

        <div className="relative flex w-full flex-col items-center gap-3 my-auto">
          <div className="flex items-center justify-center gap-3">
            <motion.div {...animFlutuar(0.4, 7)} className="-rotate-12">
              <FormaComOlhinhos
                tipo="triangulo"
                cor="#E56B67"
                sombra="#C24D49"
                size={68}
              />
            </motion.div>
            <motion.div {...animFlutuar(0.9, 6)} className="rotate-6 mt-4">
              <FormaComOlhinhos
                tipo="estrela"
                cor="#F5CC54"
                sombra="#D1A62C"
                size={66}
              />
            </motion.div>
          </div>

          <NuvemDecorativa scale={0.72} className="opacity-90 -my-2" />

          <div className="flex items-end justify-center gap-3 pt-1">
            <motion.div
              {...animFlutuar(0.1, 6)}
              className="h-20 w-20 -rotate-6 drop-shadow-[0_6px_10px_rgba(31,45,77,0.1)]"
            >
              <BloquinhoFruta fruta={{ id: "morango" }} comOlhos />
            </motion.div>
            <motion.div {...animFlutuar(0.7, 5)} className="rotate-6">
              <FormaComOlhinhos
                tipo="quadrado"
                cor="#4D8FE8"
                sombra="#346FC2"
                size={66}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* CARTÃO CENTRAL DE VITÓRIA (FOCO DA CRIANÇA) */}
      <div className="relative z-20 w-full max-w-xl overflow-hidden rounded-[34px] border-4 border-white bg-gradient-to-b from-[#CEEBFF] via-[#E5F6EE] to-[#BCEAD5] p-6 sm:p-8 shadow-[0_14px_36px_rgba(31,45,77,0.12)]">
        <Fundo variant="vitoria" />

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* Nuvi central com balão redondo de vitória */}
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <NuviMascote size="lg" calmo={calmo} className="drop-shadow-sm" />

            <div className="relative flex flex-col items-center gap-2 rounded-3xl border-2 border-[#A6C8E8] bg-white px-5 py-3.5 text-center shadow-[0_6px_16px_rgba(31,45,77,0.08)]">
              <span
                className="hidden sm:block absolute -left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-[#A6C8E8] bg-white"
                aria-hidden="true"
              />
              <p
                className="font-display m-0 text-lg sm:text-xl font-semibold text-ink leading-tight"
                aria-live="polite"
              >
                Parabéns!
                <span className="block text-base sm:text-lg text-pais-deep">
                  Você conseguiu!
                </span>
              </p>
              <button
                type="button"
                onClick={() => falar("Parabéns! Você conseguiu!")}
                aria-label="Ouvir mensagem de parabéns da Nuvi novamente"
                title="Ouvir novamente"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#4F83CC] text-white shadow-[0_2px_0_#3763A3] transition-transform hover:scale-105 active:scale-95"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5zm4.5 7c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM13 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 5 Estrelas Grandes */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-1" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 360, damping: 18 }}
              >
                <Star
                  size={42}
                  className="fill-[#F3BE3A] text-[#C48E14] drop-shadow-[0_3px_0_rgba(186,140,29,0.28)]"
                />
              </motion.span>
            ))}
          </div>

          {/* 3 Cartõezinhos Brancos Ilustrados de Conquista (estilo Opção A) */}
          <div className="grid w-full grid-cols-3 gap-2.5 sm:gap-3">
            <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white bg-white/95 px-2.5 py-3 text-center shadow-[0_4px_10px_rgba(31,45,77,0.05)]">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDECEC] text-[#D9534F]"
                aria-hidden="true"
              >
                <Calendar size={18} />
              </span>
              <strong className="font-display text-sm sm:text-base font-semibold text-ink leading-tight">
                {idade ? `${idade} anos` : "Livre"}
              </strong>
            </div>

            {ehFrutas && frutasResumo ? (
              <>
                <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white bg-white/95 px-2.5 py-3 text-center shadow-[0_4px_10px_rgba(31,45,77,0.05)]">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E9F6EE] text-[#2D8A56]"
                    aria-hidden="true"
                  >
                    <CheckCircle2 size={18} />
                  </span>
                  <strong className="font-display text-sm sm:text-base font-semibold text-ink leading-tight">
                    {frutasResumo.pontuacao}/100 pts
                  </strong>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white bg-white/95 px-2.5 py-3 text-center shadow-[0_4px_10px_rgba(31,45,77,0.05)]">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDF6DF] text-[#BA8C1D]"
                    aria-hidden="true"
                  >
                    <Sparkles size={18} />
                  </span>
                  <strong className="font-display text-xs sm:text-sm font-semibold text-ink leading-tight">
                    {estatisticas.quadradosFechados > 0
                      ? `${estatisticas.quadradosFechados} quadrado(s)`
                      : `${acertos} colheitas`}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white bg-white/95 px-2.5 py-3 text-center shadow-[0_4px_10px_rgba(31,45,77,0.05)]">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E9F6EE] text-[#2D8A56]"
                    aria-hidden="true"
                  >
                    <CheckCircle2 size={18} />
                  </span>
                  <strong className="font-display text-sm sm:text-base font-semibold text-ink leading-tight">
                    {acertos} acertos
                  </strong>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white bg-white/95 px-2.5 py-3 text-center shadow-[0_4px_10px_rgba(31,45,77,0.05)]">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDF6DF] text-[#BA8C1D]"
                    aria-hidden="true"
                  >
                    <Gauge size={18} />
                  </span>
                  <strong className="font-display text-xs sm:text-sm font-semibold text-ink leading-tight">
                    {taxa}% de precisão
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* Botões Táteis 3D: Azul "Jogar de novo" e Amarelo "Voltar ao menu" */}
          <div className="mt-1 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="playful"
              size="lg"
              onClick={onNovo}
              className="w-full rounded-full text-base"
            >
              <RotateCcw size={18} />
              Jogar de novo
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onSair}
              className="w-full rounded-full text-base"
            >
              <Home size={18} />
              Voltar ao menu
            </Button>
          </div>
        </div>
      </div>

      {/* BASTIDOR LATERAL DIREITO — Nuvens + Formas e Frutinhas Comemorando */}
      <div
        className="pointer-events-none hidden md:flex md:w-52 lg:w-64 flex-col items-center justify-between self-stretch py-4 pl-2 relative z-10"
        aria-hidden="true"
      >
        <motion.div {...animFlutuar(0.5, 5)} className="self-end pr-2">
          <NuvemDecorativa scale={0.95} className="drop-shadow-xs" />
        </motion.div>

        <div className="relative flex w-full flex-col items-center gap-3 my-auto">
          <div className="flex items-center justify-center gap-3">
            <motion.div {...animFlutuar(0.3, 6)} className="rotate-12">
              <FormaComOlhinhos
                tipo="triangulo"
                cor="#E56B67"
                sombra="#C24D49"
                size={62}
              />
            </motion.div>
            <motion.div {...animFlutuar(0.8, 7)} className="-rotate-6 mt-3">
              <FormaComOlhinhos
                tipo="quadrado"
                cor="#4D8FE8"
                sombra="#346FC2"
                size={64}
              />
            </motion.div>
          </div>

          <div className="flex items-center justify-center gap-2 -my-1">
            <NuvemDecorativa scale={0.76} className="opacity-95" />
            <motion.div {...animFlutuar(0.6, 5)}>
              <FormaComOlhinhos
                tipo="circulo"
                cor="#69B88B"
                sombra="#4B986D"
                size={54}
              />
            </motion.div>
          </div>

          <div className="flex items-end justify-center gap-3 pt-1">
            <motion.div
              {...animFlutuar(0.2, 5)}
              className="h-16 w-16 -rotate-6 drop-shadow-[0_5px_8px_rgba(31,45,77,0.08)]"
            >
              <BloquinhoFruta fruta={{ id: "banana" }} comOlhos />
            </motion.div>
            <motion.div
              {...animFlutuar(0.9, 6)}
              className="h-20 w-20 rotate-6 drop-shadow-[0_6px_10px_rgba(31,45,77,0.1)]"
            >
              <BloquinhoFruta fruta={{ id: "maca" }} comOlhos />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
