import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { evolucao, historico, porJogo, resumo } from "../services/dashboard";
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Select } from "../components/ui";
import { cn } from "../lib/cn";
import Relatorios from "./Relatorios";

const CORES_AVATAR = ["#5B82BA", "#D67456", "#7E64C4", "#2D8A56", "#C88E26", "#B86077"];

function corAvatar(nome = "") {
  const limpo = nome.trim();
  if (!limpo) return "#5B82BA";
  let soma = 0;
  for (let i = 0; i < limpo.length; i++) soma += limpo.charCodeAt(i);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

function formatarDataCurta(iso) {
  try {
    const comFuso = /(Z|[+-]\d\d:\d\d)$/.test(String(iso)) ? iso : `${iso}Z`;
    return new Date(comFuso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function formatarDataCompleta(iso) {
  try {
    const comFuso = /(Z|[+-]\d\d:\d\d)$/.test(String(iso)) ? iso : `${iso}Z`;
    return new Date(comFuso).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

function formatarTempo(seg) {
  if (seg === null || seg === undefined) return "—";
  const total = Math.round(seg);
  const m = Math.floor(total / 60);
  return m ? `${m}m ${String(total % 60).padStart(2, "0")}s` : `${total}s`;
}

const pontos = (v) => (v === null || v === undefined ? "—" : `${Math.round(v)}`);

const PERIODOS = [
  { id: "7", rotulo: "7 dias" },
  { id: "30", rotulo: "30 dias" },
  { id: "", rotulo: "Todo o período" },
];

// Paleta editorial quente e diversa para as barras de Desempenho por Jogo
const COR_BARRA_JOGO = {
  cores: "#5C89C7",
  encaixe: "#3B9B7E",
  corforma: "#9A82D1",
  ligar: "#E0AE4C",
  falar: "#DE8668",
  frutas: "#D47B8B",
};

function escaparCsv(valor) {
  const txt = String(valor ?? "");
  return /[";\n\r]/.test(txt) ? `"${txt.replace(/"/g, '""')}"` : txt;
}

function baixarCsv({ nomeCrianca, idadeCrianca, res, jogos, itens }) {
  const linhas = [
    ["Cantinho das Cores - Relatório de Desempenho"],
    ["Criança", nomeCrianca, "Idade", `${idadeCrianca} anos`],
    [
      "Partidas totais",
      res?.total_matches ?? 0,
      "Concluídas",
      res?.completed_matches ?? 0,
      "Abandonadas",
      res?.abandoned_matches ?? 0,
      "Pontuação média (%)",
      res?.average_score !== null && res?.average_score !== undefined ? Math.round(res.average_score) : "",
    ],
    [],
    ["Desempenho por jogo"],
    ["Jogo", "Concluídas", "Total", "Abandonadas", "Pontuação média (%)", "Erros", "Tempo médio (s)"],
    ...(jogos || []).map((j) => [
      j.name,
      j.completed_matches,
      j.total_matches,
      j.abandoned_matches,
      j.average_score !== null && j.average_score !== undefined ? Math.round(j.average_score) : "",
      j.total_errors,
      j.average_duration_seconds !== null && j.average_duration_seconds !== undefined
        ? Math.round(j.average_duration_seconds)
        : "",
    ]),
    [],
    ["Histórico de atividades"],
    ["Jogo", "Situação", "Acertos", "Erros", "Pontuação (%)", "Tempo (s)", "Data"],
    ...(itens || []).map((r) => [
      r.game_name,
      r.completed ? "Concluída" : "Abandonada",
      r.correct_answers,
      r.incorrect_answers,
      r.completed ? r.score : "",
      r.duration_seconds ?? "",
      formatarDataCompleta(r.played_at),
    ]),
  ];

  const conteudo = "\uFEFF" + linhas.map((l) => l.map(escaparCsv).join(";")).join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nomeArquivo = `desempenho-${(nomeCrianca || "crianca").toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`;
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function TooltipEvolucao({ active, payload }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-inst-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="m-0 font-bold text-ink">
        {pt.taxa}% · {pt.rotulo}
      </p>
      <p className="mt-0.5 mb-0 text-ink-muted">
        {pt.partidas} {pt.partidas === 1 ? "partida concluída" : "partidas concluídas"}
      </p>
    </div>
  );
}

function GraficoEvolucao({ serie }) {
  if (!serie.length) return null;

  return (
    <div
      className="h-72 w-full sm:h-80 lg:h-[360px]"
      role="img"
      aria-label="Gráfico de evolução da pontuação média por dia"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serie} margin={{ top: 14, right: 16, left: -14, bottom: 4 }}>
          <defs>
            <linearGradient id="areaPontuacao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B82BA" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#5B82BA" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 4" stroke="#E4DDD0" />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 12, fill: "#697386", fontWeight: 500 }}
            axisLine={{ stroke: "#D5CEBE" }}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(v) => (v === 100 ? "100%" : `${v}`)}
            tick={{ fontSize: 12, fill: "#697386", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<TooltipEvolucao />} />
          <Area
            type="monotone"
            dataKey="taxa"
            stroke="#5B82BA"
            strokeWidth={3}
            fill="url(#areaPontuacao)"
            dot={{ r: 4, fill: "#5B82BA", stroke: "#FDFCFA", strokeWidth: 2 }}
            activeDot={{ r: 6.5, fill: "#44689E", stroke: "#FDFCFA", strokeWidth: 2.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ label, value, accent, icon: Icon, iconTone, topAccent }) {
  return (
    <Card tone="institutional" className="relative overflow-hidden px-4 py-4 sm:px-5">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: topAccent }}
        aria-hidden="true"
      />
      <div className="flex items-center gap-3.5 pt-0.5">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            iconTone
          )}
          aria-hidden="true"
        >
          <Icon size={21} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-ink-muted leading-snug">
            {label}
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <strong className="font-display text-2xl font-semibold text-ink tabular-nums leading-tight">
              {value}
            </strong>
            {accent && (
              <span className="text-xs font-bold text-pais truncate">{accent}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PainelPais({
  visitante,
  criancas,
  criancaId,
  onSelecionarCrianca,
  onIrPerfis,
  onEntrarConta,
}) {
  const [dias, setDias] = useState("");
  const [jogoFiltro, setJogoFiltro] = useState("");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mais, setMais] = useState({ carregando: false, erro: "" });

  const crianca = criancas.find((c) => String(c.id) === String(criancaId)) || null;
  const idCrianca = crianca ? criancaId : null;
  const nomeCrianca = crianca ? String(crianca.name || "") : "";
  const idadeCrianca = crianca ? crianca.age : "";
  const inicialCrianca = nomeCrianca.trim().charAt(0).toUpperCase() || "?";

  const carregar = useCallback(async () => {
    if (!idCrianca) return;
    setCarregando(true);
    setErro("");
    try {
      const d = dias || undefined;
      const [res, jogos, evo, hist] = await Promise.all([
        resumo(idCrianca, d),
        porJogo(idCrianca, d),
        evolucao(idCrianca, d, jogoFiltro || undefined),
        historico(idCrianca, jogoFiltro || undefined, 8, 0, d),
      ]);
      setDados({ res, jogos, evo, hist });
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [idCrianca, dias, jogoFiltro]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- busca de dados ao montar/trocar filtro; o loading faz parte do fluxo
    setDados(null);
    carregar();
  }, [carregar]);

  const verMais = async () => {
    if (mais.carregando || !dados) return;
    setMais({ carregando: true, erro: "" });
    try {
      const pagina = await historico(
        idCrianca,
        jogoFiltro || undefined,
        10,
        dados.hist.items.length,
        dias || undefined
      );
      setDados((d) => ({ ...d, hist: { ...pagina, items: [...d.hist.items, ...pagina.items] } }));
      setMais({ carregando: false, erro: "" });
    } catch (e) {
      setMais({ carregando: false, erro: e.message });
    }
  };

  if (visitante) {
    return (
      <section className="flex w-full flex-col gap-5" aria-label="Painel de acompanhamento para pais e professores">
        <Card tone="institutional" className="p-6">
          <h1 className="font-display text-2xl font-semibold text-ink m-0">
            Acompanhamento Pedagógico
          </h1>
          <p className="mt-1 mb-4 text-sm text-ink-muted">
            Indicadores pedagógicos, evolução por atividade e relatórios para famílias e escolas.
          </p>
          <Alert variant="info">
            <span>
              Entre com uma conta de responsável para acompanhar o desempenho das crianças e gerar relatórios.
            </span>
            {onEntrarConta && (
              <Button variant="institutional" size="sm" onClick={onEntrarConta}>
                <User size={16} />
                Entrar com conta de responsável
              </Button>
            )}
          </Alert>
        </Card>
      </section>
    );
  }

  if (!crianca) {
    return (
      <section className="flex w-full flex-col gap-5" aria-label="Painel de acompanhamento para pais e professores">
        <Card tone="institutional" className="p-6">
          <h1 className="font-display text-2xl font-semibold text-ink m-0">
            Acompanhamento Pedagógico
          </h1>
          <p className="mt-1 mb-4 text-sm text-ink-muted">
            Cadastre ao menos um perfil de criança para iniciar o acompanhamento pedagógico.
          </p>
          <Alert variant="info">
            <span>Cadastre um perfil de criança para acompanhar o desempenho e gerar relatórios.</span>
            <Button variant="institutional" size="sm" onClick={onIrPerfis}>
              Abrir perfis
            </Button>
          </Alert>
        </Card>
      </section>
    );
  }

  const res = dados?.res;
  const serie = (dados?.evo || [])
    .filter((p) => p.average_score !== null)
    .slice(-14)
    .map((p, i) => ({
      id: p.date,
      indice: i + 1,
      taxa: Math.round(p.average_score),
      rotulo: formatarDataCurta(`${p.date}T00:00:00`),
      partidas: p.completed_matches,
    }));

  return (
    <section className="flex w-full flex-col gap-5" aria-label="Painel de acompanhamento para pais e professores">
      {/* SUBCABEÇALHO EDITORIAL QUENTE */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink m-0">
            Acompanhamento Pedagógico
          </h1>

          {criancas.length > 1 ? (
            <div className="relative inline-flex items-center">
              <span
                className="pointer-events-none absolute left-2 flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-semibold text-white"
                style={{ backgroundColor: corAvatar(nomeCrianca) }}
                aria-hidden="true"
              >
                {inicialCrianca}
              </span>
              <select
                aria-label="Selecionar criança"
                value={criancaId}
                onChange={(e) => onSelecionarCrianca(e.target.value)}
                className="min-h-9 appearance-none rounded-full border border-inst-border bg-inst-surface py-1 pl-10 pr-8 text-sm font-semibold text-ink shadow-2xs transition-colors hover:border-inst-border-strong focus-visible:border-pais focus-visible:outline-none"
              >
                {criancas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.age} anos
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-2.5 text-ink-muted"
                aria-hidden="true"
              />
            </div>
          ) : (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-inst-border bg-inst-surface px-2.5 py-1 pr-3.5 text-sm font-semibold text-ink shadow-2xs">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-semibold text-white"
                style={{ backgroundColor: corAvatar(nomeCrianca) }}
                aria-hidden="true"
              >
                {inicialCrianca}
              </span>
              <span>
                {nomeCrianca} · {idadeCrianca} anos
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex rounded-xl border border-inst-border bg-inst-surface p-1 shadow-2xs"
            role="group"
            aria-label="Período"
          >
            {PERIODOS.map((p) => {
              const ativo = dias === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setDias(p.id)}
                  className={cn(
                    "min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors sm:px-3",
                    ativo
                      ? "bg-pais text-white font-bold shadow-2xs"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {p.rotulo}
                </button>
              );
            })}
          </div>

          {res && res.total_matches > 0 && (
            <Button
              variant="institutional"
              size="sm"
              onClick={() =>
                baixarCsv({
                  nomeCrianca,
                  idadeCrianca,
                  res,
                  jogos: dados.jogos,
                  itens: dados.hist.items,
                })
              }
            >
              <Download size={15} />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {carregando && !dados && (
        <p className="no-print py-8 text-center text-sm font-semibold text-ink-muted" role="status">
          Carregando indicadores…
        </p>
      )}

      {erro && (
        <Alert variant="error" className="no-print">
          <span>{erro}</span>
          <Button variant="outlineInst" size="sm" onClick={carregar}>
            Tentar de novo
          </Button>
        </Alert>
      )}

      {res && res.total_matches === 0 && (
        <Alert variant="info" className="no-print">
          <span>
            {crianca.name} ainda não tem partidas {dias ? "neste período" : "registradas"}. Os indicadores aparecem
            assim que ela jogar.
          </span>
        </Alert>
      )}

      {res && res.total_matches > 0 && (
        <>
          {/* 4 CARDS DE KPI COM PALETA QUENTE DIVERSIFICADA */}
          <div className="no-print grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Partidas Concluídas"
              value={res.completed_matches}
              accent={res.abandoned_matches > 0 ? `de ${res.total_matches}` : undefined}
              icon={Users}
              iconTone="bg-[#EFE9FA] text-[#6F52B8]"
              topAccent="#9A82D1"
            />
            <KpiCard
              label="Pontuação Média"
              value={res.average_score === null ? "—" : `${pontos(res.average_score)}%`}
              icon={Trophy}
              iconTone="bg-[#FDF3DA] text-[#B37E14]"
              topAccent="#E0AE4C"
            />
            <KpiCard
              label="Tempo Médio"
              value={formatarTempo(res.average_duration_seconds)}
              icon={Clock}
              iconTone="bg-pais-soft text-pais"
              topAccent="#5B82BA"
            />
            <KpiCard
              label="Taxa de Conclusão"
              value={`${res.completion_rate}%`}
              icon={CheckCircle2}
              iconTone="bg-terracota-soft text-terracota"
              topAccent="#DE8668"
            />
          </div>

          {/* BENTO GRID ASSIMÉTRICO */}
          <div className="no-print grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <Card tone="institutional" className="lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle>Evolução da Pontuação</CardTitle>
                {(dados?.jogos || []).length > 0 && (
                  <Select
                    aria-label="Filtrar evolução por jogo"
                    value={jogoFiltro}
                    onChange={(e) => setJogoFiltro(e.target.value)}
                    className="min-h-8 w-auto rounded-lg py-1 pl-2.5 pr-7 text-xs font-semibold"
                  >
                    <option value="">Todos os jogos</option>
                    {dados.jogos.map((j) => (
                      <option key={j.game_id} value={j.game_id}>
                        {j.name}
                      </option>
                    ))}
                  </Select>
                )}
              </CardHeader>
              <CardContent className="pt-1">
                {serie.length > 0 ? (
                  <GraficoEvolucao serie={serie} />
                ) : (
                  <p className="py-16 text-center text-sm text-ink-muted">
                    Sem partidas concluídas para montar o gráfico neste filtro.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-5 lg:col-span-6">
              <Card tone="institutional">
                <CardHeader className="pb-2">
                  <CardTitle>Desempenho por Jogo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  {dados.jogos.map((j) => {
                    const pct = j.average_score === null ? 0 : Math.round(j.average_score);
                    const cor = COR_BARRA_JOGO[j.game_id] || "#5B82BA";
                    return (
                      <div
                        key={j.game_id}
                        className="space-y-1.5"
                        title={
                          j.total_matches === 0
                            ? "Ainda não jogou"
                            : `${j.completed_matches}/${j.total_matches} concluídas · ${j.total_errors} erro(s) · ${formatarTempo(j.average_duration_seconds)}`
                        }
                      >
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-semibold text-ink">{j.name}</span>
                          <span className="text-xs font-bold text-ink tabular-nums">
                            {j.average_score === null ? "—" : `(${pct}%)`}
                          </span>
                        </div>
                        <div
                          className="h-2.5 w-full overflow-hidden rounded-full bg-inst-subtle"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: cor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card tone="institutional">
                <CardHeader className="pb-2">
                  <CardTitle>Histórico Recente</CardTitle>
                  <span className="text-xs font-semibold text-ink-muted">
                    {dados.hist.items.length} de {dados.hist.total}
                  </span>
                </CardHeader>
                <CardContent>
                  {dados.hist.items.length === 0 ? (
                    <p className="m-0 text-sm text-ink-muted">Nenhuma atividade para este filtro.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-inst-border text-xs font-semibold text-ink-muted">
                            <th className="py-2 pr-3 font-semibold">Jogo</th>
                            <th className="py-2 px-2 font-semibold">Data</th>
                            <th className="py-2 px-2 font-semibold">Pontuação</th>
                            <th className="py-2 pl-2 text-right font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-inst-border/70">
                          {dados.hist.items.map((r) => (
                            <tr key={r.id} className="hover:bg-inst-subtle/40 transition-colors">
                              <td className="py-2.5 pr-3 font-semibold text-ink">{r.game_name}</td>
                              <td className="py-2.5 px-2 text-xs text-ink-muted tabular-nums whitespace-nowrap">
                                {formatarDataCompleta(r.played_at)}
                              </td>
                              <td className="py-2.5 px-2 font-semibold text-ink tabular-nums">
                                {r.completed ? `${r.score}%` : "—"}
                              </td>
                              <td className="py-2.5 pl-2 text-right">
                                <Badge variant={r.completed ? "success" : "warning"}>
                                  {r.completed ? "Concluída" : "Abandonada"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {mais.erro && (
                    <Alert variant="error" className="mt-3">
                      {mais.erro}
                    </Alert>
                  )}

                  {dados.hist.items.length < dados.hist.total && (
                    <div className="mt-3 flex justify-center">
                      <Button
                        variant="outlineInst"
                        size="sm"
                        disabled={mais.carregando}
                        aria-busy={mais.carregando}
                        onClick={verMais}
                      >
                        {mais.carregando ? "Carregando…" : "Ver mais atividades"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Relatorios criancaId={crianca.id} nomeCrianca={crianca.name} />
    </section>
  );
}
