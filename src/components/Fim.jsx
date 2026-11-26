import { useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, CheckCircle2, Gauge, Home, RotateCcw, Sparkles, Star } from "lucide-react";
import { falar } from "../utils/voz";
import { calcularPontuacaoFrutas } from "../services/partidas";
import BloquinhoFruta from "./BloquinhoFruta";
import Fundo from "./Fundo";
import { NuviMascote } from "./Nuvi";
import { Button } from "./ui";

function NuvemDecorativa({ className = "", scale = 1, comRostinho = false, corBorda = "#C8DDF2" }) {
  return (
    <svg
      viewBox="0 0 144 82"
      width={Math.round(144 * scale)}
      height={Math.round(82 * scale)}
      aria-hidden="true"
      className={className}
    >
      {/* Contorno externo contínuo sem linhas internas */}
      <g fill={corBorda} stroke={corBorda} strokeWidth="5.5" strokeLinejoin="round">
        <circle cx="42" cy="48" r="22" />
        <circle cx="72" cy="34" r="27" />
        <circle cx="102" cy="49" r="20" />
        <rect x="36" y="47" width="68" height="23" rx="11.5" />
      </g>
      <g fill="#FFFFFF">
        <circle cx="42" cy="48" r="22" />
        <circle cx="72" cy="34" r="27" />
        <circle cx="102" cy="49" r="20" />
        <rect x="36" y="47" width="68" height="23" rx="11.5" />
      </g>
      <path d="M32 66h80" stroke="#EAF2FA" strokeWidth="4" strokeLinecap="round" />

      {comRostinho && (
        <g>
          <path
            d="M57 47q4-4.5 8 0"
            stroke="#273654"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M79 47q4-4.5 8 0"
            stroke="#273654"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M68 52q4 4.2 8 0"
            stroke="#273654"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="53" cy="53" rx="4.5" ry="2.6" fill="#F4B8B4" opacity="0.9" />
          <ellipse cx="91" cy="53" rx="4.5" ry="2.6" fill="#F4B8B4" opacity="0.9" />
        </g>
      )}
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

  const animFlutuar = (delay = 0, amp = 7) =>
    calmo
      ? {}
      : {
          animate: { y: [0, -amp, 0] },
          transition: {
            duration: 4 + delay,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          },
        };

  return (
    <div className="relative flex w-full items-center justify-center py-3 sm:py-6">
      {/* CENÁRIO DE TELA INTEIRA (FULL-BLEED) — Sem transform em ancestrais para cobrir 100% da tela já no 1º frame */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22 }}
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#D5ECFF] via-[#EDF7FF] to-[#E5F4E8]"
        aria-hidden="true"
      >
        {/* Sol suave e arco-íris panorâmico aterrissando nas colinas */}
        <svg
          viewBox="0 0 1600 840"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <radialGradient id="vitoria-sol-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF7D6" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#FCE39C" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sol acolhedor no canto superior direito */}
          <circle cx="1410" cy="145" r="115" fill="url(#vitoria-sol-halo)" />
          <circle cx="1410" cy="145" r="56" fill="#F9DC7E" />

          {/* Arco-íris pastel amplo que atravessa toda a tela e pousa nas nuvens/colinas */}
          <g fill="none" strokeLinecap="round" opacity={calmo ? "0.62" : "0.86"}>
            <path d="M 60 770 A 740 650 0 0 1 1540 770" stroke="#F7C7C5" strokeWidth="30" />
            <path d="M 90 770 A 710 620 0 0 1 1510 770" stroke="#FBE0B4" strokeWidth="30" />
            <path d="M 120 770 A 680 590 0 0 1 1480 770" stroke="#FCF1B8" strokeWidth="30" />
            <path d="M 150 770 A 650 560 0 0 1 1450 770" stroke="#C8ECCE" strokeWidth="30" />
            <path d="M 180 770 A 620 530 0 0 1 1420 770" stroke="#C5E2FA" strokeWidth="30" />
            <path d="M 210 770 A 590 500 0 0 1 1390 770" stroke="#DCD1F6" strokeWidth="30" />
          </g>

          {/* Pontinhos e estrelinhas sutis no céu aberto */}
          <circle cx="120" cy="215" r="9" fill="#F2B8B5" opacity="0.8" />
          <circle cx="290" cy="150" r="7" fill="#F7DC8B" opacity="0.85" />
          <circle cx="1275" cy="220" r="8" fill="#B5DFC6" opacity="0.85" />
          <circle cx="1490" cy="310" r="10" fill="#CFC2F2" opacity="0.85" />
          <circle cx="205" cy="495" r="7" fill="#9BC8F2" opacity="0.8" />
          <circle cx="1390" cy="485" r="8" fill="#F5C396" opacity="0.8" />
        </svg>

        {/* Colinas verdes e florzinhas cobrindo 100% da base da tela */}
        <svg
          viewBox="0 0 1600 220"
          preserveAspectRatio="none"
          className="absolute bottom-0 inset-x-0 h-[135px] sm:h-[170px] w-full"
        >
          <path d="M0 90 Q360 15 800 80 T1600 48 V220 H0Z" fill="#BDE6BB" />
          <path d="M0 135 Q420 78 880 132 T1600 104 V220 H0Z" fill="#94D7A2" />
          <g opacity="0.85">
            {[
              [95, 175, "#E899B8"],
              [240, 152, "#F5D471"],
              [410, 182, "#FFFFFF"],
              [620, 165, "#E8948E"],
              [980, 170, "#B4A2E8"],
              [1190, 156, "#FFFFFF"],
              [1355, 180, "#F0B47B"],
              [1505, 155, "#E899B8"],
            ].map(([x, y, c], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="7" fill={c} />
                <circle cx={x} cy={y} r="2.6" fill="#FFF7CC" />
              </g>
            ))}
          </g>
        </svg>

        {/* LATERAL ESQUERDA FULL-VIEWPORT (Nuvens fofas + Personagens comemorando da borda ao centro) */}
        <div className="hidden md:block">
          {/* Nuvem superior esquerda */}
          <motion.div
            {...animFlutuar(0.2, 6)}
            className="absolute top-[13%] left-[2%] lg:left-[5%]"
          >
            <NuvemDecorativa scale={1.15} className="drop-shadow-xs" />
          </motion.div>

          {/* Nuvinha fofa sorrindo no canto médio-esquerdo */}
          <motion.div
            {...animFlutuar(0.8, 7)}
            className="hidden lg:block absolute top-[28%] left-[12%] xl:left-[15%]"
          >
            <NuvemDecorativa scale={0.82} comRostinho className="drop-shadow-xs" />
          </motion.div>

          {/* Triângulo e estrela flutuando */}
          <motion.div
            {...animFlutuar(0.4, 8)}
            className="absolute top-[42%] left-[2.5%] lg:left-[5.5%] -rotate-12"
          >
            <FormaComOlhinhos tipo="triangulo" cor="#E56B67" sombra="#C24D49" size={72} />
          </motion.div>

          <motion.div
            {...animFlutuar(1.1, 7)}
            className="hidden lg:block absolute top-[49%] left-[13%] xl:left-[17%] rotate-12"
          >
            <FormaComOlhinhos tipo="estrela" cor="#F5CC54" sombra="#D1A62C" size={68} />
          </motion.div>

          {/* Morango e quadrado comemorando sobre o arco-íris */}
          <motion.div
            {...animFlutuar(0.15, 6)}
            className="absolute bottom-[17%] left-[3%] lg:left-[6.5%] h-22 w-22 -rotate-6 drop-shadow-[0_6px_12px_rgba(31,45,77,0.12)]"
          >
            <BloquinhoFruta fruta={{ id: "morango" }} comOlhos />
          </motion.div>

          <motion.div
            {...animFlutuar(0.7, 6)}
            className="hidden lg:block absolute bottom-[19%] left-[14%] xl:left-[18%] rotate-6"
          >
            <FormaComOlhinhos tipo="quadrado" cor="#4D8FE8" sombra="#346FC2" size={68} />
          </motion.div>

          {/* Banco de nuvens fofinhas na base esquerda (pousando o arco-íris nas colinas) */}
          <div className="absolute bottom-[5%] left-[1%] opacity-95">
            <NuvemDecorativa scale={1.35} />
          </div>
          <div className="hidden lg:block absolute bottom-[2%] left-[10%] opacity-90">
            <NuvemDecorativa scale={1.05} />
          </div>
        </div>

        {/* LATERAL DIREITA FULL-VIEWPORT (Nuvens fofas + Personagens comemorando da borda ao centro) */}
        <div className="hidden md:block">
          {/* Nuvem superior direita */}
          <motion.div
            {...animFlutuar(0.5, 6)}
            className="hidden lg:block absolute top-[15%] right-[11%] xl:right-[14%]"
          >
            <NuvemDecorativa scale={1.05} className="drop-shadow-xs" />
          </motion.div>

          {/* Nuvinha fofa sorrindo na direita */}
          <motion.div
            {...animFlutuar(1.0, 7)}
            className="absolute top-[28%] right-[2%] lg:right-[4.5%]"
          >
            <NuvemDecorativa scale={0.86} comRostinho className="drop-shadow-xs" />
          </motion.div>

          {/* Formas geométricas comemorando na direita */}
          <motion.div
            {...animFlutuar(0.3, 7)}
            className="hidden lg:block absolute top-[43%] right-[13%] xl:right-[17%] rotate-12"
          >
            <FormaComOlhinhos tipo="triangulo" cor="#E56B67" sombra="#C24D49" size={66} />
          </motion.div>

          <motion.div
            {...animFlutuar(0.9, 8)}
            className="absolute top-[47%] right-[2.5%] lg:right-[5.5%] -rotate-6"
          >
            <FormaComOlhinhos tipo="quadrado" cor="#4D8FE8" sombra="#346FC2" size={68} />
          </motion.div>

          <motion.div
            {...animFlutuar(0.6, 5)}
            className="hidden lg:block absolute bottom-[29%] right-[11%] xl:right-[15%]"
          >
            <FormaComOlhinhos tipo="circulo" cor="#69B88B" sombra="#4B986D" size={58} />
          </motion.div>

          {/* Frutinhas fofas na direita */}
          <motion.div
            {...animFlutuar(0.25, 6)}
            className="hidden lg:block absolute bottom-[17%] right-[15%] xl:right-[19%] h-18 w-18 -rotate-6 drop-shadow-[0_6px_10px_rgba(31,45,77,0.1)]"
          >
            <BloquinhoFruta fruta={{ id: "banana" }} comOlhos />
          </motion.div>

          <motion.div
            {...animFlutuar(0.85, 6)}
            className="absolute bottom-[17%] right-[3%] lg:right-[6.5%] h-22 w-22 rotate-6 drop-shadow-[0_6px_12px_rgba(31,45,77,0.12)]"
          >
            <BloquinhoFruta fruta={{ id: "maca" }} comOlhos />
          </motion.div>

          {/* Banco de nuvens fofinhas na base direita */}
          <div className="absolute bottom-[5%] right-[1%] opacity-95">
            <NuvemDecorativa scale={1.35} />
          </div>
          <div className="hidden lg:block absolute bottom-[2%] right-[10%] opacity-90">
            <NuvemDecorativa scale={1.05} />
          </div>
        </div>
      </motion.div>

      {/* CARTÃO CENTRAL DE VITÓRIA (FOCO DA CRIANÇA) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative z-20 w-full max-w-xl overflow-hidden rounded-[34px] border-4 border-white bg-gradient-to-b from-[#CEEBFF] via-[#E5F6EE] to-[#BCEAD5] p-6 sm:p-8 shadow-[0_16px_42px_rgba(31,45,77,0.14)]"
      >
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

          {/* 3 Cartõezinhos Brancos Ilustrados de Conquista */}
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
      </motion.div>
    </div>
  );
}
