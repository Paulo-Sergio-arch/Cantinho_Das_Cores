import { motion } from "motion/react";
import {
  Apple,
  Award,
  Check,
  Cloud,
  MessageCircle,
  Palette,
  Puzzle,
  Shapes,
  Sparkles,
  Star,
  Volume2,
  Waypoints,
} from "lucide-react";
import { falar } from "../utils/voz";
import { EmblemaNuvemSvg, MedalhaoNuvemJogo } from "./EmblemaNuvemSvg";
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
    borda: "#9FBEE8",
    Icon: Palette,
    falaDesbloqueada: "Você conquistou o emblema da Aquarela Mágica no jogo das Cores!",
  },
  {
    id: "encaixe",
    titulo: "Mestre dos Encaixes",
    jogo: "Encaixe as formas",
    habilidade: "Percepção visual e espacial",
    meta: 3,
    cor: "#3B9B7E",
    fundo: "#E8F7F1",
    borda: "#9CD4BE",
    Icon: Puzzle,
    falaDesbloqueada: "Parabéns! Você ganhou o emblema Mestre dos Encaixes!",
  },
  {
    id: "ligar",
    titulo: "Amigo das Palavras",
    jogo: "Ligue ao nome",
    habilidade: "Associação entre imagem e palavra",
    meta: 3,
    cor: "#C88E26",
    fundo: "#FFF7E0",
    borda: "#E5C67D",
    Icon: Waypoints,
    falaDesbloqueada: "Que alegria! Você desbloqueou o emblema Amigo das Palavras!",
  },
  {
    id: "corforma",
    titulo: "Explorador de Formas",
    jogo: "Cor e forma",
    habilidade: "Atenção seletiva a dois atributos",
    meta: 3,
    cor: "#7E64C4",
    fundo: "#F1ECFC",
    borda: "#BCAEE6",
    Icon: Shapes,
    falaDesbloqueada: "Incrível! Você conquistou o emblema Explorador de Formas!",
  },
  {
    id: "falar",
    titulo: "Voz Brilhante",
    jogo: "Vamos falar",
    habilidade: "Expressão oral e consciência silábica",
    meta: 3,
    cor: "#D67456",
    fundo: "#FCEEE9",
    borda: "#E8B09E",
    Icon: MessageCircle,
    falaDesbloqueada: "Muito bem! O emblema Voz Brilhante já está no seu céu!",
  },
  {
    id: "frutas",
    titulo: "Colheita Dourada",
    jogo: "Bloquinho de Frutas",
    habilidade: "Planejamento e raciocínio lógico",
    meta: 3,
    cor: "#B86077",
    fundo: "#FBECEF",
    borda: "#DDA6B5",
    Icon: Apple,
    falaDesbloqueada: "Uau! Você ganhou o emblema Colheita Dourada das frutinhas!",
  },
];

function montarEmblemasNuvem({ totalPartidas, jogosDiferentes, completas }) {
  return [
    {
      id: "nuvem_broto",
      titulo: "Nuvem Sementinha",
      descricao: "Conclua sua 1ª partida em qualquer jogo.",
      atual: Math.min(totalPartidas, 1),
      meta: 1,
      unidade: "partida",
      conquistado: totalPartidas >= 1,
      corFundo: "from-[#F6FCF8] to-[#E6F5EC]",
      corBorda: "border-[#AEDAC0]",
      corBarra: "#4CA373",
      fala: "Essa é a Nuvem Sementinha! Ela nasceu quando você completou sua primeira partida!",
      dica: "Conclua sua primeira partida em qualquer jogo para acordar a Nuvem Sementinha!",
    },
    {
      id: "nuvem_brisa",
      titulo: "Nuvem Brisa Leve",
      descricao: "Experimente 2 jogos diferentes.",
      atual: Math.min(jogosDiferentes, 2),
      meta: 2,
      unidade: "jogos",
      conquistado: jogosDiferentes >= 2,
      corFundo: "from-[#F4FBFD] to-[#E3F3F8]",
      corBorda: "border-[#A8D3E0]",
      corBarra: "#589BB0",
      fala: "Que frescor! A Nuvem Brisa Leve adorou ver você explorando jogos diferentes!",
      dica: "Brinque em 2 jogos diferentes para desbloquear a Nuvem Brisa Leve!",
    },
    {
      id: "nuvem_chuva",
      titulo: "Nuvem Chuva de Cores",
      descricao: "Conclua 3 partidas no total.",
      atual: Math.min(totalPartidas, 3),
      meta: 3,
      unidade: "partidas",
      conquistado: totalPartidas >= 3,
      corFundo: "from-[#F5FAFF] to-[#E4F0FC]",
      corBorda: "border-[#AEC9EE]",
      corBarra: "#5B82BA",
      fala: "Olha quantas gotinhas coloridas! A Nuvem Chuva de Cores comemora suas 3 partidas!",
      dica: "Conclua 3 partidas no total para ganhar a Nuvem Chuva de Cores!",
    },
    {
      id: "nuvem_arcoiris",
      titulo: "Nuvem Arco-Íris",
      descricao: "Explore 4 jogos diferentes do Cantinho.",
      atual: Math.min(jogosDiferentes, 4),
      meta: 4,
      unidade: "jogos",
      conquistado: jogosDiferentes >= 4,
      corFundo: "from-[#FFFDF7] via-[#F6FAFF] to-[#F3EEFB]",
      corBorda: "border-[#C6C0EC]",
      corBarra: "#7E64C4",
      fala: "Uau! A Nuvem Arco-Íris brilhou no céu porque você jogou 4 atividades diferentes!",
      dica: "Explore 4 jogos diferentes para fazer a Nuvem Arco-Íris aparecer!",
    },
    {
      id: "nuvem_estrelada",
      titulo: "Nuvem Estrelada",
      descricao: "Conclua 5 partidas no total.",
      atual: Math.min(totalPartidas, 5),
      meta: 5,
      unidade: "partidas",
      conquistado: totalPartidas >= 5,
      corFundo: "from-[#F9F6FF] to-[#ECE6FA]",
      corBorda: "border-[#C6B8EA]",
      corBarra: "#7B61C9",
      fala: "A Nuvem Estrelada guarda suas 5 partidas concluídas com muito carinho!",
      dica: "Complete 5 partidas para acender as estrelas da Nuvem Estrelada!",
    },
    {
      id: "nuvem_sol",
      titulo: "Nuvem Ensolarada",
      descricao: "Deixe 1 emblema de jogo dourado (3 partidas nele).",
      atual: Math.min(completas, 1),
      meta: 1,
      unidade: "dourado",
      conquistado: completas >= 1,
      corFundo: "from-[#FFFDF5] to-[#FDF2D3]",
      corBorda: "border-[#E9CB7F]",
      corBarra: "#D49B26",
      fala: "Dia lindo de sol! Você deixou um emblema dourado e ganhou a Nuvem Ensolarada!",
      dica: "Complete 3 partidas no mesmo jogo para ganhar a Nuvem Ensolarada!",
    },
    {
      id: "nuvem_algodao",
      titulo: "Nuvem Algodão-Doce",
      descricao: "Brinque em todos os 6 jogos pelo menos 1 vez.",
      atual: Math.min(jogosDiferentes, 6),
      meta: 6,
      unidade: "jogos",
      conquistado: jogosDiferentes >= 6,
      corFundo: "from-[#FFF7FA] to-[#FCE6EE]",
      corBorda: "border-[#E8B6C8]",
      corBarra: "#C76D8D",
      fala: "A Nuvem Algodão-Doce é super fofa! Você já conhece todos os 6 jogos do Cantinho!",
      dica: "Experimente todos os 6 jogos para acordar a Nuvem Algodão-Doce!",
    },
    {
      id: "nuvem_coroa",
      titulo: "Super Nuvem Coroada",
      descricao: "Conclua 12 partidas ou deixe 3 emblemas dourados.",
      atual: completas >= 3 ? 12 : Math.min(totalPartidas, 12),
      meta: 12,
      unidade: "partidas",
      conquistado: totalPartidas >= 12 || completas >= 3,
      corFundo: "from-[#FFFDF3] to-[#FAEDC4]",
      corBorda: "border-[#E3BC5B]",
      corBarra: "#C9931B",
      fala: "Viva! Você conquistou a Super Nuvem Coroada, o maior emblema do céu da Nuvi!",
      dica: "Conclua 12 partidas ou deixe 3 jogos dourados para ganhar a Super Nuvem Coroada!",
    },
  ];
}

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

  const jogosDiferentes = FIGURINHAS_JARDIM.filter(
    (f) => (Number(feitos[f.id]) || 0) >= 1
  ).length;

  const completas = FIGURINHAS_JARDIM.filter(
    (f) => (Number(feitos[f.id]) || 0) >= f.meta
  ).length;

  const emblemasNuvem = montarEmblemasNuvem({
    totalPartidas,
    jogosDiferentes,
    completas,
  });

  const nuvensConquistadas = emblemasNuvem.filter((n) => n.conquistado).length;
  const totalEmblemas = emblemasNuvem.length + FIGURINHAS_JARDIM.length;
  const totalDesbloqueados = nuvensConquistadas + jogosDiferentes;

  return (
    <section
      id="painel-jardim"
      role="tabpanel"
      aria-labelledby="tab-jardim"
      className="flex w-full max-w-5xl flex-col gap-7"
      aria-label="Céu de Conquistas e Emblemas da Nuvi"
    >
      {/* CABEÇALHO ILUSTRADO COM ESTÉTICA DE CÉU E NUVENS */}
      <Card
        tone="calm"
        className="relative overflow-hidden border-[#C2DAF2] bg-gradient-to-br from-[#DDF0FF] via-[#F2F9FF] to-[#E7F6EC] p-5 sm:p-6 shadow-[0_6px_22px_rgba(47,111,214,0.06)]"
      >
        {/* Nuvinhas decorativas sutis no fundo do cabeçalho */}
        <svg
          viewBox="0 0 360 110"
          className="pointer-events-none absolute right-2 top-0 h-28 w-80 opacity-65"
          aria-hidden="true"
        >
          <g fill="#FFFFFF">
            <circle cx="215" cy="38" r="18" />
            <circle cx="236" cy="30" r="22" />
            <circle cx="258" cy="40" r="16" />
            <circle cx="305" cy="68" r="14" />
            <circle cx="322" cy="61" r="18" />
            <circle cx="338" cy="70" r="13" />
          </g>
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-3.5 text-center sm:flex-row sm:text-left">
            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/90 bg-white/90 shadow-xs">
              <NuviMascote size="md" comPes calmo={calmo} />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-0.5 text-xs font-bold text-pais shadow-2xs">
                  <Cloud size={13} aria-hidden="true" />
                  Céu de Emblemas da Nuvi
                </span>
                {completas > 0 && (
                  <Badge variant="success">{completas} dourado(s)</Badge>
                )}
              </div>
              <h1 className="font-display mt-1.5 mb-0 text-2xl font-semibold text-ink">
                {nomeCrianca
                  ? `Emblemas de ${nomeCrianca}`
                  : "Coleção de Nuvens e Emblemas"}
              </h1>
              <p className="mt-1 mb-0 max-w-xl text-sm text-ink-muted">
                Brinque nos jogos para acordar as nuvinhas colecionáveis do céu e conquistar as 3 estrelas de cada atividade!
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/90 bg-white/95 px-4 py-3 shadow-xs">
            <div className="text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Nuvens
              </span>
              <strong className="font-display text-2xl font-semibold text-pais tabular-nums">
                {nuvensConquistadas}/{emblemasNuvem.length}
              </strong>
            </div>
            <div className="h-8 w-px bg-[#E5DFD2]" aria-hidden="true" />
            <div className="text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Total
              </span>
              <strong className="font-display text-2xl font-semibold text-ink tabular-nums">
                {totalDesbloqueados}/{totalEmblemas}
              </strong>
            </div>
            <div className="h-8 w-px bg-[#E5DFD2]" aria-hidden="true" />
            <div className="text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Partidas
              </span>
              <strong className="font-display text-2xl font-semibold text-[#2D8A56] tabular-nums">
                {totalPartidas}
              </strong>
            </div>
          </div>
        </div>
      </Card>

      {/* SEÇÃO 1: COLEÇÃO DE EMBLEMAS DE NUVENS */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E3F1FF] text-pais"
              aria-hidden="true"
            >
              <Cloud size={18} />
            </span>
            <div>
              <h2 className="font-display m-0 text-xl font-semibold text-ink">
                Emblemas das Nuvens
              </h2>
              <p className="m-0 text-xs text-ink-muted">
                Toque em qualquer nuvinha para ouvir a Nuvi contar a história dela!
              </p>
            </div>
          </div>
          <Badge variant="brand">
            {nuvensConquistadas} de {emblemasNuvem.length} acordadas
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {emblemasNuvem.map((nuv) => {
            const pct = Math.min(100, Math.round((nuv.atual / nuv.meta) * 100));
            return (
              <motion.div
                key={nuv.id}
                whileHover={calmo ? undefined : { y: -3 }}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-[28px] border-2 p-4 transition-all",
                  nuv.conquistado
                    ? cn(
                        "bg-gradient-to-b shadow-[0_6px_18px_rgba(47,111,214,0.08)]",
                        nuv.corFundo,
                        nuv.corBorda
                      )
                    : "border-dashed border-[#D6D0C4] bg-[#F7F5EF]/90"
                )}
              >
                {/* Selo de conquistado no canto */}
                {nuv.conquistado ? (
                  <span
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2D8A56] shadow-2xs"
                  >
                    <Sparkles size={11} aria-hidden="true" />
                    Ganha!
                  </span>
                ) : (
                  <span className="absolute right-3 top-3 rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                    zZz
                  </span>
                )}

                <div className="flex flex-col items-center text-center pt-1">
                  <button
                    type="button"
                    onClick={() => falar(nuv.conquistado ? nuv.fala : nuv.dica)}
                    title="Ouvir sobre este emblema de nuvem"
                    aria-label={`Ouvir sobre ${nuv.titulo}`}
                    className="group relative flex items-center justify-center rounded-3xl p-1 transition-transform hover:scale-105 active:scale-95"
                  >
                    <EmblemaNuvemSvg tipo={nuv.id} desbloqueado={nuv.conquistado} />
                    <span
                      className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-pais shadow-xs opacity-85 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <Volume2 size={12} />
                    </span>
                  </button>

                  <h3 className="font-display mt-2 mb-0.5 text-base font-semibold text-ink leading-tight">
                    {nuv.titulo}
                  </h3>
                  <p className="m-0 text-xs text-ink-muted leading-snug">
                    {nuv.descricao}
                  </p>
                </div>

                {/* Barrinha de progresso da nuvinha */}
                <div className="mt-3.5 pt-2.5 border-t border-black/5">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-ink-muted tabular-nums">
                    <span>{nuv.conquistado ? "Conquistada" : "Progresso"}</span>
                    <span>
                      {nuv.atual}/{nuv.meta}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/90 border border-black/5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${nuv.conquistado ? 100 : pct}%`,
                        backgroundColor: nuv.conquistado ? nuv.corBarra : "#B8C4D4",
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 2: EMBLEMAS DOS 6 JOGOS (COM MOLDURA DE NUVEM) */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDF4DB] text-[#BA8C1D]"
              aria-hidden="true"
            >
              <Award size={18} />
            </span>
            <div>
              <h2 className="font-display m-0 text-xl font-semibold text-ink">
                Nuvinhas dos Jogos
              </h2>
              <p className="m-0 text-xs text-ink-muted">
                Complete 3 partidas em cada atividade para deixar o emblema dourado.
              </p>
            </div>
          </div>
          <Badge variant="muted">
            {jogosDiferentes} de {FIGURINHAS_JARDIM.length} jogos
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIGURINHAS_JARDIM.map((fig) => {
            const qtd = Number(feitos[fig.id]) || 0;
            const desbloqueada = qtd >= 1;
            const dourada = qtd >= fig.meta;
            const estrelasAtivas = Math.min(fig.meta, qtd);

            return (
              <motion.div
                key={fig.id}
                whileHover={calmo ? undefined : { y: -2 }}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-[28px] border-2 p-5 transition-all",
                  dourada
                    ? "border-[#E3BE7A] bg-gradient-to-b from-[#FFFDF7] to-[#FFF6E0] shadow-[0_6px_18px_rgba(186,140,29,0.12)]"
                    : desbloqueada
                      ? "border-[#D6E1EE] bg-[#FCFBF8] shadow-[0_4px_14px_rgba(31,45,77,0.05)]"
                      : "border-dashed border-[#D8D1C2] bg-[#F6F4EE]/85"
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
                            : `Brinque em ${fig.jogo} para ganhar o emblema ${fig.titulo}!`
                        )
                      }
                      title="Toque para a Nuvi contar sobre este emblema"
                      className="group relative transition-transform hover:scale-105 active:scale-95"
                    >
                      <MedalhaoNuvemJogo
                        Icone={fig.Icon}
                        cor={fig.cor}
                        fundo={fig.fundo}
                        borda={fig.borda}
                        desbloqueada={desbloqueada}
                        dourada={dourada}
                      />
                      {dourada && (
                        <span
                          className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#E8B638] text-white shadow-2xs"
                          aria-hidden="true"
                        >
                          <Award size={14} />
                        </span>
                      )}
                      {!dourada && desbloqueada && (
                        <span
                          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D8A56] text-white shadow-2xs"
                          aria-hidden="true"
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>

                    {/* 3 Estrelinhas de evolução do emblema */}
                    <div
                      className="flex items-center gap-1 rounded-full border border-[#E5DFD2] bg-white px-2.5 py-1"
                      aria-label={`${estrelasAtivas} de ${fig.meta} estrelas neste emblema`}
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

                  <h3 className="font-display mt-3 mb-0.5 text-lg font-semibold text-ink">
                    {fig.titulo}
                  </h3>
                  <p className="m-0 text-xs font-bold text-pais">{fig.jogo}</p>
                  <p className="mt-1 mb-0 text-xs text-ink-muted leading-relaxed">
                    {fig.habilidade}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EAE4D7] pt-3">
                  <span className="text-xs font-bold text-ink-muted">
                    {qtd === 0
                      ? "Ainda não conquistado"
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
      </div>
    </section>
  );
}
