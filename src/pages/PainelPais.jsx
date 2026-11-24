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
  Check,
  CheckCircle2,
  Clock,
  Download,
  Gamepad2,
  Trophy,
  User,
} from "lucide-react";
import { evolucao, historico, porJogo, resumo } from "../services/dashboard";
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Select } from "../components/ui";
import { cn } from "../lib/cn";
import Relatorios from "./Relatorios";

function formatarDataCurta(iso) {
  try {
    const comFuso = /(Z|[+-]\d\d:\d\d)$/.test(String(iso)) ? iso : `${iso}Z`;
    return new Date(comFuso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function formatarTempo(seg) {
  if (seg === null || seg === undefined) return "—";
  const total = Math.round(seg);
  const m = Math.floor(total / 60);
  return m ? `${m} min ${String(total % 60).padStart(2, "0")} s` : `${total} s`;
}

const pontos = (v) => (v === null || v === undefined ? "—" : `${Math.round(v)}`);

const PERIODOS = [
  { id: "", rotulo: "Todo o período" },
  { id: "7", rotulo: "7 dias" },
  { id: "30", rotulo: "30 dias" },
];

const COR_BARRA_JOGO = {
  cores: "#2F6FD6",
  encaixe: "#2D8A56",
  corforma: "#8C72D1",
  ligar: "#D9A226",
  falar: "#D67A59",
  frutas: "#CC6B7D",
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
      formatarDataCurta(r.played_at),
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
    <div className="rounded-xl border border-inst-border bg-white px-3.5 py-2.5 text-xs shadow-lg">
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
      className="h-64 w-full"
      role="img"
      aria-label="Gráfico de evolução da pontuação média por dia"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serie} margin={{ top: 12, right: 16, left: -12, bottom: 4 }}>
          <defs>
            <linearGradient id="areaPontuacao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2F6FD6" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#2F6FD6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 12, fill: "#526280", fontWeight: 600 }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: "#526280", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<TooltipEvolucao />} />
          <Area
            type="monotone"
            dataKey="taxa"
            stroke="#2F6FD6"
            strokeWidth={3}
            fill="url(#areaPontuacao)"
            dot={{ r: 4.5, fill: "#2F6FD6", stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 6.5, fill: "#1E54AD", stroke: "#FFFFFF", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ label, value, detail, icon: Icon, iconTone }) {
  return (
    <Card tone="institutional" className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-wide text-ink-muted">
            {label}
          </span>
          <strong className="mt-1.5 block font-display text-2xl sm:text-3xl font-semibold text-ink tabular-nums leading-tight">
            {value}
          </strong>
          <span className="mt-1 block text-xs text-ink-muted leading-snug">{detail}</span>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            iconTone,
            "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:text-slate-950"
          )}
          aria-hidden="true"
        >
          <Icon size={20} />
        </span>
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
        historico(idCrianca, jogoFiltro || undefined, 15, 0, d),
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
        15,
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
      {/* Cabeçalho institucional */}
      <Card tone="institutional" className="no-print p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-bold text-ink">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-brand font-display text-xs font-semibold text-white"
                aria-hidden="true"
              >
                {inicialCrianca}
              </span>
              <span>
                {nomeCrianca} · {idadeCrianca} anos
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink m-0">
              Acompanhamento Pedagógico
            </h1>
            <p className="mt-1 mb-0 text-sm text-ink-muted">
              Pontuação, tempo e acertos consideram apenas partidas concluídas. Partidas abandonadas constam nas
              contagens e no histórico.
            </p>
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
              <Download size={16} />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Barra de filtros */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-inst-border pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {criancas.length > 1 && (
              <label className="flex items-center gap-2 text-xs font-bold text-ink-muted" htmlFor="filtro-crianca">
                <span>Criança</span>
                <Select
                  id="filtro-crianca"
                  value={criancaId}
                  onChange={(e) => onSelecionarCrianca(e.target.value)}
                  className="min-h-10 w-auto py-1.5 text-sm"
                >
                  {criancas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.age} anos)
                    </option>
                  ))}
                </Select>
              </label>
            )}
            <label className="flex items-center gap-2 text-xs font-bold text-ink-muted" htmlFor="filtro-jogo">
              <span>Jogo</span>
              <Select
                id="filtro-jogo"
                value={jogoFiltro}
                onChange={(e) => setJogoFiltro(e.target.value)}
                className="min-h-10 w-auto py-1.5 text-sm"
              >
                <option value="">Todos os jogos</option>
                {(dados?.jogos || []).map((j) => (
                  <option key={j.game_id} value={j.game_id}>
                    {j.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div
            className="inline-flex rounded-xl border border-inst-border bg-inst-subtle p-1 alto-contraste:bg-white alto-contraste:border-slate-950"
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
                    "min-h-9 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    ativo
                      ? "bg-white text-ink shadow-2xs alto-contraste:bg-slate-950 alto-contraste:text-white"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {p.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {carregando && !dados && (
        <p className="no-print text-center text-sm font-semibold text-ink-muted" role="status">
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
          {/* 4 Cards de KPI */}
          <div className="no-print grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Partidas"
              value={res.total_matches}
              detail={`${res.completed_matches} concluídas · ${res.abandoned_matches} abandonadas`}
              icon={Gamepad2}
              iconTone="bg-[#EEE9FC] text-[#6B4EC9]"
            />
            <KpiCard
              label="Pontuação média"
              value={res.average_score === null ? "—" : `${pontos(res.average_score)}%`}
              detail={
                res.average_score === null
                  ? "Nenhuma partida concluída"
                  : `${res.total_correct} acertos · ${res.total_errors} ${res.total_errors === 1 ? "erro" : "erros"}`
              }
              icon={Trophy}
              iconTone="bg-brand-soft text-brand"
            />
            <KpiCard
              label="Tempo médio"
              value={formatarTempo(res.average_duration_seconds)}
              detail="por partida concluída"
              icon={Clock}
              iconTone="bg-success-soft text-success"
            />
            <KpiCard
              label="Taxa de conclusão"
              value={`${res.completion_rate}%`}
              detail="das partidas iniciadas"
              icon={CheckCircle2}
              iconTone="bg-[#FCECED] text-[#C94440]"
            />
          </div>

          {/* Bento Grid: Evolução (Recharts) + Desempenho por Jogo */}
          <div className="no-print grid grid-cols-1 gap-5 lg:grid-cols-12">
            <Card tone="institutional" className="lg:col-span-7">
              <CardHeader>
                <CardTitle>Evolução da Pontuação</CardTitle>
                {serie.length > 0 && (
                  <Badge variant="muted">
                    {serie.length === 1
                      ? "1 dia com partidas"
                      : `Últimos ${serie.length} dias`}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {serie.length > 0 ? (
                  <GraficoEvolucao serie={serie} />
                ) : (
                  <p className="py-12 text-center text-sm text-ink-muted">
                    Sem partidas concluídas para montar o gráfico neste filtro.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card tone="institutional" className="lg:col-span-5">
              <CardHeader>
                <CardTitle>Desempenho por Jogo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dados.jogos.map((j) => {
                  const pct = j.average_score === null ? 0 : Math.round(j.average_score);
                  const cor = COR_BARRA_JOGO[j.game_id] || "#2F6FD6";
                  return (
                    <div key={j.game_id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <strong className="font-bold text-ink">{j.name}</strong>
                        <span className="font-bold text-ink tabular-nums">
                          {j.average_score === null ? "—" : `${pct}%`}
                        </span>
                      </div>
                      <div
                        className="h-2.5 w-full overflow-hidden rounded-full bg-inst-subtle alto-contraste:border alto-contraste:border-slate-950 alto-contraste:bg-white"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300 alto-contraste:bg-slate-950"
                          style={{ width: `${pct}%`, backgroundColor: cor }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                        <span>
                          {j.total_matches === 0
                            ? "Ainda não jogou"
                            : `${j.completed_matches}/${j.total_matches} concluídas · ${j.total_errors} ${j.total_errors === 1 ? "erro" : "erros"}`}
                        </span>
                        {j.average_duration_seconds !== null && j.average_duration_seconds !== undefined && (
                          <span>{formatarTempo(j.average_duration_seconds)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Histórico Recente */}
          <Card tone="institutional" className="no-print">
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <Badge variant="muted">
                {dados.hist.items.length} de {dados.hist.total}
              </Badge>
            </CardHeader>
            <CardContent>
              {dados.hist.items.length === 0 ? (
                <p className="m-0 text-sm text-ink-muted">Nenhuma atividade encontrada para este filtro.</p>
              ) : (
                <>
                  {/* Tabela Desktop */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-inst-border text-xs font-bold uppercase tracking-wider text-ink-muted">
                          <th className="py-3 pr-4">Jogo</th>
                          <th className="py-3 px-3">Situação</th>
                          <th className="py-3 px-3">Acertos</th>
                          <th className="py-3 px-3">Erros</th>
                          <th className="py-3 px-3">Pontuação</th>
                          <th className="py-3 px-3">Tempo</th>
                          <th className="py-3 pl-3 text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-inst-border/70">
                        {dados.hist.items.map((r) => (
                          <tr key={r.id} className="hover:bg-inst-subtle/40 transition-colors">
                            <td className="py-3 pr-4 font-bold text-ink">{r.game_name}</td>
                            <td className="py-3 px-3">
                              <Badge variant={r.completed ? "success" : "warning"}>
                                {r.completed && <Check size={12} />}
                                {r.completed ? "Concluída" : "Abandonada"}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 font-bold text-success tabular-nums">{r.correct_answers}</td>
                            <td className="py-3 px-3 text-ink-muted tabular-nums">{r.incorrect_answers}</td>
                            <td className="py-3 px-3 font-bold text-ink tabular-nums">
                              {r.completed ? `${r.score}%` : "—"}
                            </td>
                            <td className="py-3 px-3 text-ink-muted">{formatarTempo(r.duration_seconds)}</td>
                            <td className="py-3 pl-3 text-right text-ink-muted tabular-nums">
                              {formatarDataCurta(r.played_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards Mobile */}
                  <ul className="m-0 list-none space-y-3 p-0 md:hidden" aria-label="Lista de atividades">
                    {dados.hist.items.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-2xl border border-inst-border bg-inst-subtle/40 p-4 alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm font-bold text-ink">{r.game_name}</strong>
                          <Badge variant={r.completed ? "success" : "warning"}>
                            {r.completed && <Check size={12} />}
                            {r.completed ? "Concluída" : "Abandonada"}
                          </Badge>
                        </div>
                        <dl className="mt-3 mb-0 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <dt className="text-ink-muted">Pontuação</dt>
                            <dd className="m-0 font-bold text-ink">{r.completed ? `${r.score}%` : "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-ink-muted">Acertos / Erros</dt>
                            <dd className="m-0 font-bold text-ink">
                              <span className="text-success">{r.correct_answers}</span> / {r.incorrect_answers}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-ink-muted">Tempo</dt>
                            <dd className="m-0 font-semibold text-ink">{formatarTempo(r.duration_seconds)}</dd>
                          </div>
                          <div>
                            <dt className="text-ink-muted">Data</dt>
                            <dd className="m-0 font-semibold text-ink">{formatarDataCurta(r.played_at)}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {mais.erro && (
                <Alert variant="error" className="mt-4">
                  {mais.erro}
                </Alert>
              )}

              {dados.hist.items.length < dados.hist.total && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outlineInst"
                    size="sm"
                    disabled={mais.carregando}
                    aria-busy={mais.carregando}
                    onClick={verMais}
                  >
                    {mais.carregando ? "Carregando…" : "Carregar mais atividades"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Relatorios criancaId={crianca.id} nomeCrianca={crianca.name} />
    </section>
  );
}
