import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  Heart,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { NuviMascote } from "./Nuvi";
import {
  corAvatar,
  corDoJogo,
  formatarDataHora,
  formatarTempoCurto,
  gerarNarrativaNuvi,
} from "../utils/relatorioDados";
import { cn } from "../lib/cn";

function DonutAnimado({ valor, rotulo, corPrincipal, corResto, legenda1, legenda2, semDados = false }) {
  const raio = 36;
  const circunferencia = 2 * Math.PI * raio;
  const pct = semDados ? 0 : Math.max(0, Math.min(100, Number(valor) || 0));
  const dashOffset = circunferencia * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="48"
            cy="48"
            r={raio}
            fill="none"
            stroke={semDados ? "#ECE7DC" : corResto}
            strokeWidth="9.5"
          />
          {!semDados && pct > 0 && (
            <motion.circle
              cx="48"
              cy="48"
              r={raio}
              fill="none"
              stroke={corPrincipal}
              strokeWidth="9.5"
              strokeLinecap={pct >= 99 ? "butt" : "round"}
              strokeDasharray={circunferencia}
              initial={{ strokeDashoffset: circunferencia }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.75, ease: "easeOut" }}
            />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-lg font-semibold leading-none text-ink tabular-nums">
            {semDados ? "—" : `${pct}%`}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-muted">
            {rotulo}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: corPrincipal }} />
          {legenda1}
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: corResto }} />
          {legenda2}
        </span>
      </div>
    </div>
  );
}

function TooltipEvolucaoRel({ active, payload }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-inst-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="m-0 font-bold text-ink">
        {pt.taxa}% · {pt.rotulo}
      </p>
      <p className="mt-0.5 mb-0 text-ink-muted">
        {pt.partidas} {pt.partidas === 1 ? "partida concluída" : "partidas concluídas"}
      </p>
    </div>
  );
}

function TooltipTempoRel({ active, payload }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-inst-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="m-0 font-bold text-ink">{pt.nomeCompleto}</p>
      <p className="mt-0.5 mb-0 text-ink-muted">
        Tempo médio: <strong className="text-ink">{formatarTempoCurto(pt.segundos)}</strong> · Nota:{" "}
        <strong className="text-ink">{pt.nota}%</strong>
      </p>
    </div>
  );
}

export default function RelatorioVisual({
  dados,
  calmo = false,
  carregandoMetricas = false,
  mostrarTexto = false,
}) {
  const narrativa = gerarNarrativaNuvi(dados);
  const { summary, evolution } = dados;
  const inicial = (dados.childName || "C").trim().charAt(0).toUpperCase();
  const jogadosOrdenados = [...narrativa.jogados].sort(
    (a, b) => (b.average_score ?? 0) - (a.average_score ?? 0)
  );

  const usarEvolucao = evolution && evolution.length >= 2;
  const dadosTempo = jogadosOrdenados
    .filter((g) => g.average_duration_seconds !== null)
    .map((g) => ({
      id: g.game_id,
      nome: g.name.split(" ").slice(0, 2).join(" "),
      nomeCompleto: g.name,
      segundos: g.average_duration_seconds || 0,
      nota: g.average_score ?? 0,
      cor: g.color || corDoJogo(g.game_id, g.name),
    }));

  const temTentativas = summary.total_correct + summary.total_errors > 0;

  return (
    <article
      className="rel-documento overflow-hidden rounded-3xl border border-[#D8E5F3] bg-[#FCFBF8] shadow-[0_6px_28px_rgba(31,45,77,0.06)]"
      aria-label={`Relatório pedagógico visual de ${dados.childName}`}
    >
      {/* FAIXA ARCO-ÍRIS DA MARCA NO TOPO */}
      <div className="grid h-2 w-full grid-cols-4" aria-hidden="true">
        <span className="bg-[#5C89C7]" />
        <span className="bg-[#3B9B7E]" />
        <span className="bg-[#E0AE4C]" />
        <span className="bg-[#DE8668]" />
      </div>

      {/* CABEÇALHO ILUSTRADO COM A NUVI */}
      <header className="relative overflow-hidden border-b border-[#DCE7F4] bg-gradient-to-br from-[#DEF0FF] via-[#F1F8FF] to-[#FAF6EC] px-5 py-5 sm:px-7 sm:py-6">
        {/* Formas e estrelinhas decorativas sutis */}
        <svg
          className="pointer-events-none absolute right-2 top-2 h-24 w-44 opacity-50"
          viewBox="0 0 180 96"
          aria-hidden="true"
        >
          <circle cx="38" cy="26" r="14" fill="#FFFFFF" />
          <circle cx="54" cy="22" r="17" fill="#FFFFFF" />
          <circle cx="70" cy="28" r="13" fill="#FFFFFF" />
          <circle cx="152" cy="22" r="6" fill="#F7CF63" />
          <circle cx="164" cy="64" r="5" fill="#B9A7E6" />
          <rect x="132" y="72" width="9" height="9" rx="3" fill="#F5B89E" />
        </svg>

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Identidade da Marca + Criança */}
          <div className="space-y-3.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 28 28" width="22" height="22" aria-hidden="true" className="shrink-0">
                  <circle cx="8" cy="8" r="5" fill="#D9534F" />
                  <circle cx="20" cy="8" r="5" fill="#E8B638" />
                  <circle cx="8" cy="20" r="5" fill="#2F6FD6" />
                  <circle cx="20" cy="20" r="5" fill="#2D8A56" />
                </svg>
                <span className="font-display text-base font-semibold tracking-tight text-ink">
                  Cantinho das Cores
                </span>
              </span>

              <span className="inline-flex items-center rounded-full border border-[#BDD7F3] bg-white/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-pais">
                Relatório Pedagógico
              </span>

              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ backgroundColor: narrativa.selo.fundo, color: narrativa.selo.cor }}
              >
                <Sparkles size={12} aria-hidden="true" />
                {narrativa.selo.titulo}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-semibold text-white shadow-sm"
                style={{ backgroundColor: corAvatar(dados.childName) }}
                aria-hidden="true"
              >
                {inicial}
              </span>
              <div className="min-w-0">
                <h3 className="font-display m-0 text-2xl font-semibold leading-tight text-ink sm:text-[26px]">
                  {dados.childName}
                  {dados.childAge ? (
                    <span className="ml-2 font-sans text-sm font-semibold text-ink-muted">
                      · {dados.childAge} anos
                    </span>
                  ) : null}
                </h3>
                <p className="mt-0.5 mb-0 text-xs font-semibold text-ink-muted sm:text-sm">
                  Período: <span className="text-ink">{dados.periodLabel}</span>
                  {dados.generatedAt ? (
                    <span className="ml-2 text-ink-muted/90">
                      · Emitido em {formatarDataHora(dados.generatedAt)}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>

          {/* Mascote Nuvi + Balão de Fala Personalizado */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex w-full items-center gap-3 self-start lg:w-auto lg:max-w-md lg:self-center"
          >
            <div className="relative min-w-0 flex-1 rounded-2xl border border-[#CADDF2] bg-white/95 px-4 py-3 shadow-[0_3px_12px_rgba(47,111,214,0.08)]">
              <span
                className="hidden sm:block absolute -right-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-[#CADDF2] bg-white"
                aria-hidden="true"
              />
              <span className="block text-[11px] font-bold uppercase tracking-wide text-pais">
                Nuvi diz:
              </span>
              <p className="mt-0.5 mb-0 text-xs leading-relaxed text-ink sm:text-sm">
                {narrativa.fala}
              </p>
            </div>
            <NuviMascote size="sm" comPes calmo={calmo} className="shrink-0 sm:hidden" />
            <NuviMascote size="md" comPes calmo={calmo} className="hidden shrink-0 sm:block" />
          </motion.div>
        </div>
      </header>

      {/* CORPO DO RELATÓRIO */}
      <div className="space-y-5 p-5 sm:p-7">
        {summary.total_matches === 0 ? (
          <div className="rounded-2xl border border-inst-border bg-white px-5 py-8 text-center">
            <p className="font-display m-0 text-lg font-semibold text-ink">
              Ainda não houve partidas registradas neste período
            </p>
            <p className="mx-auto mt-1.5 mb-0 max-w-md text-sm text-ink-muted">
              Assim que {dados.childName} brincar nas atividades do Cantinho das Cores, os gráficos de
              evolução, precisão e conquistas aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <>
            {/* 4 CARTÕES DE KPI ANIMADOS */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  rotulo: "Partidas Concluídas",
                  valor: String(summary.completed_matches),
                  sub:
                    summary.abandoned_matches > 0
                      ? `de ${summary.total_matches} · ${summary.abandoned_matches} abandonada(s)`
                      : `de ${summary.total_matches} jogada(s)`,
                  corTopo: "#9A82D1",
                  iconeCor: "bg-[#EFE9FA] text-[#6F52B8]",
                  Icon: Users,
                },
                {
                  rotulo: "Pontuação Média",
                  valor: summary.average_score === null ? "—" : `${summary.average_score}/100`,
                  estrelas: narrativa.estrelas,
                  corTopo: "#E0AE4C",
                  iconeCor: "bg-[#FDF3DA] text-[#B37E14]",
                  Icon: Trophy,
                },
                {
                  rotulo: "Tempo Médio",
                  valor: formatarTempoCurto(summary.average_duration_seconds),
                  sub: "por partida concluída",
                  corTopo: "#5B82BA",
                  iconeCor: "bg-pais-soft text-pais",
                  Icon: Clock,
                },
                {
                  rotulo: "Taxa de Conclusão",
                  valor: `${summary.completion_rate}%`,
                  sub: `${summary.total_correct} acertos · ${summary.total_errors} erros`,
                  corTopo: "#3B9B7E",
                  iconeCor: "bg-[#E7F6F0] text-[#227557]",
                  Icon: CheckCircle2,
                },
              ].map((item, idx) => {
                const Icon = item.Icon;
                return (
                  <motion.div
                    key={item.rotulo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="relative overflow-hidden rounded-2xl border border-inst-border bg-white p-4 shadow-[0_2px_8px_rgba(31,45,77,0.03)]"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: item.corTopo }}
                      aria-hidden="true"
                    />
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          item.iconeCor
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-ink-muted">
                          {item.rotulo}
                        </span>
                        <strong className="font-display mt-0.5 block text-2xl font-semibold leading-tight text-ink tabular-nums">
                          {item.valor}
                        </strong>
                        {item.estrelas !== undefined ? (
                          <div
                            className="mt-1 flex items-center gap-0.5"
                            aria-label={`${item.estrelas} de 5 estrelas`}
                          >
                            {[0, 1, 2, 3, 4].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                className={
                                  s < item.estrelas
                                    ? "fill-[#F4BC33] text-[#E0A419]"
                                    : "fill-[#ECE6DA] text-[#DFD8CA]"
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="mt-0.5 block text-[11px] font-medium text-ink-muted">
                            {item.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* GRÁFICOS: DONUTS DE PRECISÃO/CONCLUSÃO + EVOLUÇÃO OU TEMPO POR JOGO */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="rounded-2xl border border-inst-border bg-white p-4 sm:p-5 lg:col-span-5">
                <h4 className="font-display m-0 text-base font-semibold text-ink">
                  Precisão e Engajamento
                </h4>
                <p className="mt-0.5 mb-4 text-xs text-ink-muted">
                  Acertos vs. erros e aproveitamento das partidas
                </p>

                <div className="grid grid-cols-2 items-center gap-3 divide-x divide-inst-border/70">
                  <DonutAnimado
                    valor={narrativa.precisao}
                    rotulo="precisão"
                    corPrincipal="#3B9B7E"
                    corResto="#E58A78"
                    legenda1={`${summary.total_correct} acertos`}
                    legenda2={`${summary.total_errors} erros`}
                    semDados={!temTentativas}
                  />
                  <div className="pl-2">
                    <DonutAnimado
                      valor={summary.completion_rate}
                      rotulo="conclusão"
                      corPrincipal="#5B82BA"
                      corResto="#E8B638"
                      legenda1={`${summary.completed_matches} concluídas`}
                      legenda2={`${summary.abandoned_matches} abandonadas`}
                      semDados={summary.total_matches === 0}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-inst-border bg-white p-4 sm:p-5 lg:col-span-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display m-0 text-base font-semibold text-ink">
                      {usarEvolucao ? "Evolução da Pontuação" : "Ritmo Médio por Jogo"}
                    </h4>
                    <p className="mt-0.5 mb-0 text-xs text-ink-muted">
                      {usarEvolucao
                        ? "Pontuação média diária nas partidas concluídas"
                        : "Tempo médio gasto por partida concluída"}
                    </p>
                  </div>
                  {carregandoMetricas && (
                    <span className="text-[11px] font-semibold text-pais">Atualizando gráficos…</span>
                  )}
                </div>

                {usarEvolucao ? (
                  <div className="h-48 w-full" role="img" aria-label="Gráfico de evolução da pontuação no período">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evolution} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="relAreaPontuacao" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5B82BA" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#5B82BA" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 4" stroke="#E8E2D6" />
                        <XAxis
                          dataKey="rotulo"
                          tick={{ fontSize: 11, fill: "#5B6880", fontWeight: 600 }}
                          axisLine={{ stroke: "#DDD5C6" }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tickFormatter={(v) => (v === 100 ? "100%" : `${v}`)}
                          tick={{ fontSize: 11, fill: "#5B6880", fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<TooltipEvolucaoRel />} />
                        <Area
                          type="monotone"
                          dataKey="taxa"
                          stroke="#5B82BA"
                          strokeWidth={3}
                          fill="url(#relAreaPontuacao)"
                          dot={{ r: 4, fill: "#5B82BA", stroke: "#FFFFFF", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#44689E", stroke: "#FFFFFF", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : dadosTempo.length > 0 ? (
                  <div className="h-48 w-full" role="img" aria-label="Gráfico de tempo médio por jogo">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosTempo} margin={{ top: 10, right: 10, left: -18, bottom: 2 }}>
                        <CartesianGrid strokeDasharray="3 4" stroke="#E8E2D6" vertical={false} />
                        <XAxis
                          dataKey="nome"
                          tick={{ fontSize: 11, fill: "#5B6880", fontWeight: 600 }}
                          axisLine={{ stroke: "#DDD5C6" }}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `${v}s`}
                          tick={{ fontSize: 11, fill: "#5B6880", fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<TooltipTempoRel />} />
                        <Bar dataKey="segundos" radius={[8, 8, 2, 2]} maxBarSize={38}>
                          {dadosTempo.map((entry) => (
                            <Cell key={entry.id} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-ink-muted">
                    Conclua partidas para visualizar o gráfico de evolução e ritmo.
                  </p>
                )}
              </div>
            </div>

            {/* DESEMPENHO POR JOGO & HABILIDADES */}
            <div className="rounded-2xl border border-inst-border bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h4 className="font-display m-0 text-base font-semibold text-ink">
                    Desempenho por Jogo e Habilidades
                  </h4>
                  <p className="mt-0.5 mb-0 text-xs text-ink-muted">
                    Pontuação média, partidas concluídas e tempo por atividade
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-ink-muted">
                  Somente partidas concluídas entram nos indicadores
                </span>
              </div>

              {jogadosOrdenados.length === 0 ? (
                <p className="m-0 text-sm text-ink-muted">
                  Nenhuma partida concluída neste período ainda.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {jogadosOrdenados.map((g, idx) => {
                    const pct = Math.max(0, Math.min(100, g.average_score ?? 0));
                    const cor = g.color || corDoJogo(g.game_id, g.name);
                    return (
                      <div key={g.game_id} className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: cor }}
                              aria-hidden="true"
                            />
                            <span className="text-sm font-bold text-ink">{g.name}</span>
                            <span className="hidden text-xs text-ink-muted sm:inline">
                              · {g.skill}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs tabular-nums">
                            <span className="text-ink-muted">
                              {g.completed_matches} {g.completed_matches === 1 ? "partida" : "partidas"} ·{" "}
                              {formatarTempoCurto(g.average_duration_seconds)}
                            </span>
                            <span
                              className="inline-flex min-w-12 justify-center rounded-full px-2 py-0.5 font-display text-xs font-semibold text-white"
                              style={{ backgroundColor: cor }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFEBE2]" aria-hidden="true">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: cor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.65, delay: idx * 0.06, ease: "easeOut" }}
                          />
                        </div>
                        <span className="block text-[11px] text-ink-muted sm:hidden">{g.skill}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {(narrativa.soAbandonados.length > 0 || narrativa.naoJogados.length > 0) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-inst-subtle/60 px-3.5 py-2.5 text-xs text-ink-muted">
                  {narrativa.soAbandonados.length > 0 && (
                    <span>
                      <strong className="text-ink">Em andamento:</strong>{" "}
                      {narrativa.soAbandonados.map((g) => g.name).join(", ")}
                    </span>
                  )}
                  {narrativa.naoJogados.length > 0 && (
                    <span>
                      <strong className="text-ink">Para explorar:</strong>{" "}
                      {narrativa.naoJogados.map((g) => g.name).join(", ")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* DESTAQUES PEDAGÓGICOS DA NUVI + OBSERVAÇÕES */}
            {(narrativa.melhorJogo || narrativa.jogoAtencao) && (
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {narrativa.melhorJogo && (
                  <div className="rounded-2xl border border-[#C3E5D0] bg-[#EEF8F2] p-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#227557]">
                      <Trophy size={13} aria-hidden="true" />
                      Super Destaque do Período
                    </span>
                    <p className="font-display mt-1 mb-0.5 text-lg font-semibold text-ink">
                      {narrativa.melhorJogo.name} · {narrativa.melhorJogo.average_score}/100
                    </p>
                    <p className="m-0 text-xs leading-relaxed text-ink-muted">
                      Habilidade em brilho: <strong className="text-ink">{narrativa.melhorJogo.skill}</strong>.
                    </p>
                  </div>
                )}

                {narrativa.jogoAtencao && (
                  <div className="rounded-2xl border border-[#F1CCBF] bg-[#FBF0EB] p-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#B65336]">
                      <Heart size={13} aria-hidden="true" />
                      Vale Praticar com Carinho
                    </span>
                    <p className="font-display mt-1 mb-0.5 text-lg font-semibold text-ink">
                      {narrativa.jogoAtencao.name}
                      {narrativa.jogoAtencao.average_score !== null
                        ? ` · ${narrativa.jogoAtencao.average_score}/100`
                        : " · em andamento"}
                    </p>
                    <p className="m-0 text-xs leading-relaxed text-ink-muted">
                      Brincar juntinhos com calma ajuda a fortalecer{" "}
                      <strong className="text-ink">{narrativa.jogoAtencao.skill.toLowerCase()}</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {narrativa.observacoes.length > 0 && (
              <div className="rounded-2xl border border-inst-border bg-[#F8F5EE] p-4 sm:p-5">
                <h4 className="font-display m-0 mb-2.5 text-base font-semibold text-ink">
                  Observações Pedagógicas
                </h4>
                <ul className="m-0 list-none space-y-2 p-0 text-sm text-ink">
                  {narrativa.observacoes.map((obs, idx) => {
                    const cores = ["#5B82BA", "#3B9B7E", "#E0AE4C", "#9A82D1", "#DE8668"];
                    return (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <span
                          className="mt-2 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: cores[idx % cores.length] }}
                          aria-hidden="true"
                        />
                        <span>{obs}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}

        {/* TEXTO PLANO OPCIONAL PARA E-MAIL / GMAIL */}
        {mostrarTexto && dados.rawText && (
          <div className="no-print rounded-2xl border border-dashed border-inst-border-strong bg-white p-4">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Versão em texto (enviada por e-mail / Gmail)
            </span>
            <pre className="m-0 whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink">
              {dados.rawText}
            </pre>
          </div>
        )}
      </div>
    </article>
  );
}
