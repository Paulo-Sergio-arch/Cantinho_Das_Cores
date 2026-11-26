import { motion } from "motion/react";
import {
  Apple,
  Award,
  Check,
  MessageCircle,
  Palette,
  Puzzle,
  Shapes,
  Sparkles,
  Star,
  Waypoints,
} from "lucide-react";
import { falar } from "../utils/voz";
import { NuviMascote } from "./Nuvi";
import { Badge, Button, Card } from "./ui";
import { cn } from "../lib/cn";

const FIGURINHAS_JARDIM = [
  {
    id: "cores",
    titulo: "Aquarela Mágica",
    jogo: "Cores",
    habilidade: "Reconhecimento de cores e formas",
    meta: 3,
    cor: "#5C89C7",
    fundo: "#EAF2FF",
    borda: "#B7D0F2",
    Icon: Palette,
    falaDesbloqueada: "Você conquistou a figurinha da Aquarela Mágica no jogo das Cores!",
  },
  {
    id: "encaixe",
    titulo: "Mestre dos Encaixes",
    jogo: "Encaixe as formas",
    habilidade: "Percepção visual e espacial",
    meta: 3,
    cor: "#3B9B7E",
    fundo: "#E8F7F1",
    borda: "#B5E2D2",
    Icon: Puzzle,
    falaDesbloqueada: "Parabéns! Você ganhou a figurinha Mestre dos Encaixes!",
  },
  {
    id: "ligar",
    titulo: "Amigo das Palavras",
    jogo: "Ligue ao nome",
    habilidade: "Associação entre imagem e palavra",
    meta: 3,
    cor: "#C88E26",
    fundo: "#FFF7E0",
    borda: "#EDD495",
    Icon: Waypoints,
    falaDesbloqueada: "Que alegria! Você desbloqueou a figurinha Amigo das Palavras!",
  },
  {
    id: "corforma",
    titulo: "Explorador de Formas",
    jogo: "Cor e forma",
    habilidade: "Atenção seletiva a dois atributos",
    meta: 3,
    cor: "#7E64C4",
    fundo: "#F1ECFC",
    borda: "#CEC2F0",
    Icon: Shapes,
    falaDesbloqueada: "Incrível! Você conquistou a figurinha Explorador de Formas!",
  },
  {
    id: "falar",
    titulo: "Voz Brilhante",
    jogo: "Vamos falar",
    habilidade: "Expressão oral e consciência silábica",
    meta: 3,
    cor: "#D67456",
    fundo: "#FCEEE9",
    borda: "#F0C3B4",
    Icon: MessageCircle,
    falaDesbloqueada: "Muito bem! A figurinha Voz Brilhante já está no seu jardim!",
  },
  {
    id: "frutas",
    titulo: "Colheita Dourada",
    jogo: "Bloquinho de Frutas",
    habilidade: "Planejamento e raciocínio lógico",
    meta: 3,
    cor: "#B86077",
    fundo: "#FBECEF",
    borda: "#E8BDC8",
    Icon: Apple,
    falaDesbloqueada: "Uau! Você ganhou a figurinha Colheita Dourada das frutinhas!",
  },
];

export default function JardimNuvi({
  feitos = {},
  nomeCrianca = "",
  calmo = false,
  onJogar,
}) {
  const totalPartidas = Object.values(feitos).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0
  );

  const desbloqueadas = FIGURINHAS_JARDIM.filter(
    (f) => (Number(feitos[f.id]) || 0) >= 1
  ).length;

  const completas = FIGURINHAS_JARDIM.filter(
    (f) => (Number(feitos[f.id]) || 0) >= f.meta
  ).length;

  return (
    <section
      id="painel-jardim"
      role="tabpanel"
      aria-labelledby="tab-jardim"
      className="flex w-full max-w-4xl flex-col gap-5"
      aria-label="Jardim de Conquistas da Nuvi"
    >
      {/* CABEÇALHO ILUSTRADO DO JARDIM DA NUVI */}
      <Card
        tone="calm"
        className="relative overflow-hidden border-[#C9DDF2] bg-gradient-to-br from-[#E4F2FF] via-[#F5FAFF] to-[#E8F6EC] p-5 sm:p-6"
      >
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-3.5 text-center sm:flex-row sm:text-left">
            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/80 bg-white/85 shadow-xs">
              <NuviMascote size="md" comPes calmo={calmo} />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-pais shadow-2xs">
                  <Sparkles size={13} aria-hidden="true" />
                  Álbum de Figurinhas
                </span>
                {completas > 0 && (
                  <Badge variant="success">{completas} dourada(s)</Badge>
                )}
              </div>
              <h1 className="font-display mt-1.5 mb-0 text-2xl font-semibold text-ink">
                {nomeCrianca
                  ? `Jardim de Conquistas de ${nomeCrianca}`
                  : "Jardim de Conquistas da Nuvi"}
              </h1>
              <p className="mt-1 mb-0 max-w-xl text-sm text-ink-muted">
                Cada partida concluída acende uma estrelinha na figurinha do jogo. Complete 3 estrelas para deixá-la dourada!
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/90 bg-white/90 px-4 py-3 shadow-xs">
            <div className="text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Figurinhas
              </span>
              <strong className="font-display text-2xl font-semibold text-ink tabular-nums">
                {desbloqueadas}/{FIGURINHAS_JARDIM.length}
              </strong>
            </div>
            <div className="h-8 w-px bg-[#E5DFD2]" aria-hidden="true" />
            <div className="text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Partidas
              </span>
              <strong className="font-display text-2xl font-semibold text-pais tabular-nums">
                {totalPartidas}
              </strong>
            </div>
          </div>
        </div>
      </Card>

      {/* GRADE DE FIGURINHAS COLECIONÁVEIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIGURINHAS_JARDIM.map((fig) => {
          const Icone = fig.Icon;
          const qtd = Number(feitos[fig.id]) || 0;
          const desbloqueada = qtd >= 1;
          const dourada = qtd >= fig.meta;
          const estrelasAtivas = Math.min(fig.meta, qtd);

          return (
            <motion.div
              key={fig.id}
              whileHover={calmo ? undefined : { y: -2 }}
              className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 p-5 transition-all",
                dourada
                  ? "border-[#E3BE7A] bg-gradient-to-b from-[#FFFDF7] to-[#FFF6E0] shadow-[0_6px_18px_rgba(186,140,29,0.12)]"
                  : desbloqueada
                    ? "border-[#DDD6C7] bg-[#FCFBF8] shadow-[0_4px_14px_rgba(31,45,77,0.05)]"
                    : "border-dashed border-[#D8D1C2] bg-[#F6F4EE]/80"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      falar(
                        desbloqueada
                          ? fig.falaDesbloqueada
                          : `Brinque em ${fig.jogo} para ganhar a figurinha ${fig.titulo}!`
                      )
                    }
                    title="Toque para a Nuvi contar sobre esta figurinha"
                    className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 transition-transform hover:scale-105"
                    style={{
                      backgroundColor: desbloqueada ? fig.fundo : "#EFECE3",
                      borderColor: dourada ? "#E3BE7A" : desbloqueada ? fig.borda : "#DDD6C7",
                      color: desbloqueada ? fig.cor : "#8C96A8",
                    }}
                  >
                    <Icone size={30} strokeWidth={1.9} aria-hidden="true" />
                    {dourada && (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#E8B638] text-white shadow-2xs"
                        aria-hidden="true"
                      >
                        <Award size={14} />
                      </span>
                    )}
                    {!dourada && desbloqueada && (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D8A56] text-white shadow-2xs"
                        aria-hidden="true"
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>

                  {/* 3 Estrelinhas de evolução da figurinha */}
                  <div
                    className="flex items-center gap-1 rounded-full border border-[#E5DFD2] bg-white px-2.5 py-1"
                    aria-label={`${estrelasAtivas} de ${fig.meta} estrelas nesta figurinha`}
                  >
                    {Array.from({ length: fig.meta }, (_, idx) => (
                      <Star
                        key={idx}
                        size={15}
                        className={
                          idx < estrelasAtivas
                            ? "fill-[#E8B638] text-[#BA8C1D]"
                            : "fill-[#ECE8DD] text-[#D8D1C2]"
                        }
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>

                <h2 className="font-display mt-3.5 mb-0.5 text-lg font-semibold text-ink">
                  {fig.titulo}
                </h2>
                <p className="m-0 text-xs font-bold text-pais">{fig.jogo}</p>
                <p className="mt-1 mb-0 text-xs text-ink-muted leading-relaxed">
                  {fig.habilidade}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EAE4D7] pt-3">
                <span className="text-xs font-bold text-ink-muted">
                  {qtd === 0
                    ? "Ainda não conquistada"
                    : `${qtd} ${qtd === 1 ? "partida concluída" : "partidas concluídas"}`}
                </span>
                <Button
                  variant={dourada ? "secondary" : "playful"}
                  size="sm"
                  onClick={() => onJogar?.(fig.id)}
                  className="min-h-8 h-8 rounded-xl px-3 text-xs"
                >
                  {qtd === 0 ? "Desbloquear" : "Brincar"}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
