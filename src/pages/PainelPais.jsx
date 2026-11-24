import { useCallback, useEffect, useState } from "react";
import { evolucao, historico, porJogo, resumo } from "../services/dashboard";
import { IconCheck, IconDownload, IconUsuario } from "../components/IconesUI";
import Relatorios from "./Relatorios";

function formatarDataCurta(iso) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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

function GraficoEvolucao({ serie }) {
  if (!serie.length) return null;

  const largura = 520;
  const altura = 225;
  const padEsq = 50;
  const padDir = 36;
  const padTopo = 32;
  const padBase = 38;
  const utilW = largura - padEsq - padDir;
  const utilH = altura - padTopo - padBase;

  const pontosSerie = serie.map((item, idx) => {
    const x =
      serie.length === 1
        ? padEsq + utilW / 2
        : padEsq + (idx / (serie.length - 1)) * utilW;
    const y = padTopo + ((100 - item.taxa) / 100) * utilH;
    return { ...item, x, y, idx };
  });

  const linha = pontosSerie.map((pt) => `${pt.x},${pt.y}`).join(" ");
  const area =
    pontosSerie.length > 1
      ? `${pontosSerie[0].x},${padTopo + utilH} ${linha} ${pontosSerie[pontosSerie.length - 1].x},${
          padTopo + utilH
        }`
      : "";

  const passoRotulo = serie.length > 8 ? 2 : 1;

  return (
    <div className="pais-grafico-wrap">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="pais-grafico"
        role="img"
        aria-label="Gráfico de evolução da pontuação média por dia"
      >
        {[0, 50, 100].map((v) => {
          const y = padTopo + ((100 - v) / 100) * utilH;
          return (
            <g key={v}>
              <line
                x1={padEsq}
                y1={y}
                x2={largura - padDir}
                y2={y}
                stroke="rgba(43, 58, 103, 0.14)"
                strokeDasharray="4 4"
              />
              <text
                x={padEsq - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="14"
                fontWeight="700"
                fill="#475569"
              >
                {v}%
              </text>
            </g>
          );
        })}

        {area && <polygon points={area} fill="rgba(45, 127, 249, 0.12)" />}

        {pontosSerie.length > 1 && (
          <polyline
            points={linha}
            fill="none"
            stroke="#2D7FF9"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {pontosSerie.map((pt) => {
          const mostrarData = pt.idx % passoRotulo === 0 || pt.idx === pontosSerie.length - 1;
          return (
            <g key={pt.id}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill={pt.taxa >= 80 ? "#24A159" : pt.taxa >= 60 ? "#2D7FF9" : "#E67E22"}
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <title>
                {`${pt.rotulo}: pontuação média ${pt.taxa}% (${pt.partidas} partida(s) no dia)`}
              </title>
              <text
                x={pt.x}
                y={pt.y - 12}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#1E293B"
              >
                {pt.taxa}%
              </text>
              {mostrarData && (
                <text
                  x={pt.x}
                  y={altura - 10}
                  textAnchor="middle"
                  fontSize="13.5"
                  fontWeight="600"
                  fill="#475569"
                >
                  {pt.rotulo}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
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
        historico(idCrianca, jogoFiltro || undefined, 15, 0),
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
      const pagina = await historico(idCrianca, jogoFiltro || undefined, 15, dados.hist.items.length);
      setDados((d) => ({ ...d, hist: { ...pagina, items: [...d.hist.items, ...pagina.items] } }));
      setMais({ carregando: false, erro: "" });
    } catch (e) {
      setMais({ carregando: false, erro: e.message });
    }
  };

  if (visitante) {
    return (
      <section className="pais-painel" aria-label="Painel de acompanhamento para pais e professores">
        <div className="pais-cabecalho">
          <div>
            <h1 className="pais-titulo">Acompanhamento de Desempenho</h1>
            <p className="pais-subtitulo">
              Indicadores pedagógicos, evolução por atividade e relatórios para famílias e escolas.
            </p>
          </div>
        </div>
        <div className="pais-bloco">
          <div className="aviso-api info">
            <span>Entre com uma conta de responsável para acompanhar o desempenho das crianças e gerar relatórios.</span>
            {onEntrarConta && (
              <button type="button" className="btn peq" onClick={onEntrarConta}>
                <IconUsuario size={16} />
                Entrar com conta de responsável
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (!crianca) {
    return (
      <section className="pais-painel" aria-label="Painel de acompanhamento para pais e professores">
        <div className="pais-cabecalho">
          <div>
            <h1 className="pais-titulo">Acompanhamento de Desempenho</h1>
            <p className="pais-subtitulo">
              Cadastre ao menos um perfil de criança para iniciar o acompanhamento pedagógico.
            </p>
          </div>
        </div>
        <div className="pais-bloco">
          <div className="aviso-api info">
            <span>Cadastre um perfil de criança para acompanhar o desempenho e gerar relatórios.</span>
            <button type="button" className="btn peq" onClick={onIrPerfis}>
              Abrir perfis
            </button>
          </div>
        </div>
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
    <section className="pais-painel" aria-label="Painel de acompanhamento para pais e professores">
      <div className="pais-cabecalho no-print">
        <div>
          <div className="pais-aluno-badge">
            <span className="pais-aluno-avatar" aria-hidden="true">
              {inicialCrianca}
            </span>
            <span>
              <strong>{nomeCrianca}</strong> · {idadeCrianca} anos
            </span>
          </div>
          <h1 className="pais-titulo">Acompanhamento de Desempenho</h1>
          <p className="pais-subtitulo">
            Pontuação, tempo e acertos consideram apenas partidas concluídas. Partidas abandonadas constam nas
            contagens e no histórico.
          </p>
        </div>

        {res && res.total_matches > 0 && (
          <div className="pais-cabecalho-acoes">
            <button
              type="button"
              className="btn neutro peq"
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
              <IconDownload size={16} />
              Exportar CSV
            </button>
          </div>
        )}
      </div>

      <div className="pais-filtros no-print">
        <div className="pais-filtros-selects">
          {criancas.length > 1 && (
            <label className="pais-filtro-campo" htmlFor="filtro-crianca">
              <span>Criança</span>
              <select id="filtro-crianca" value={criancaId} onChange={(e) => onSelecionarCrianca(e.target.value)}>
                {criancas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.age} anos)
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="pais-filtro-campo" htmlFor="filtro-jogo">
            <span>Jogo</span>
            <select id="filtro-jogo" value={jogoFiltro} onChange={(e) => setJogoFiltro(e.target.value)}>
              <option value="">Todos os jogos</option>
              {(dados?.jogos || []).map((j) => (
                <option key={j.game_id} value={j.game_id}>
                  {j.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="pais-filtro-idades" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip ${dias === p.id ? "on" : ""}`}
              aria-pressed={dias === p.id}
              onClick={() => setDias(p.id)}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {carregando && !dados && (
        <p className="no-print" role="status">
          Carregando indicadores…
        </p>
      )}
      {erro && (
        <div className="aviso-api erro no-print" role="alert">
          <span>{erro}</span>
          <button type="button" className="btn neutro peq" onClick={carregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {res && res.total_matches === 0 && (
        <div className="aviso-api info no-print">
          <span>
            {crianca.name} ainda não tem partidas {dias ? "neste período" : "registradas"}. Os indicadores aparecem
            assim que ela jogar.
          </span>
        </div>
      )}

      {res && res.total_matches > 0 && (
        <>
          <div className="pais-kpis no-print">
            <article className="pais-kpi">
              <span className="kpi-rotulo">Partidas</span>
              <strong className="kpi-valor">{res.total_matches}</strong>
              <span className="kpi-detalhe">
                {res.completed_matches} concluídas · {res.abandoned_matches} abandonadas
              </span>
            </article>
            <article className="pais-kpi">
              <span className="kpi-rotulo">Taxa de conclusão</span>
              <strong className="kpi-valor">{res.completion_rate}%</strong>
              <span className="kpi-detalhe">das partidas iniciadas</span>
            </article>
            <article className="pais-kpi">
              <span className="kpi-rotulo">Pontuação média</span>
              <strong className="kpi-valor">
                {res.average_score === null ? "—" : `${pontos(res.average_score)}%`}
              </strong>
              <span className="kpi-detalhe">
                {res.average_score === null
                  ? "Nenhuma partida concluída"
                  : `${res.total_correct} acertos · ${res.total_errors} ${res.total_errors === 1 ? "erro" : "erros"}`}
              </span>
            </article>
            <article className="pais-kpi">
              <span className="kpi-rotulo">Tempo médio</span>
              <strong className="kpi-valor kpi-texto">{formatarTempo(res.average_duration_seconds)}</strong>
              <span className="kpi-detalhe">por partida concluída</span>
            </article>
          </div>

          <div className="pais-bloco no-print">
            <div className="pais-bloco-topo">
              <h2>Evolução da pontuação média por dia</h2>
              <span className="pais-legenda">
                {serie.length
                  ? serie.length === 1
                    ? "1 dia com partidas concluídas"
                    : `Últimos ${serie.length} dias com partidas concluídas`
                  : ""}
              </span>
            </div>
            {serie.length > 0 ? (
              <GraficoEvolucao serie={serie} />
            ) : (
              <p className="pais-subtitulo">Sem partidas concluídas para montar o gráfico neste filtro.</p>
            )}
          </div>

          <div className="pais-bloco no-print">
            <div className="pais-bloco-topo">
              <h2>Desempenho por jogo</h2>
            </div>
            <div className="pais-matriz">
              {dados.jogos.map((j) => (
                <div key={j.game_id} className="matriz-card">
                  <div className="matriz-topo">
                    <strong>{j.name}</strong>
                    <span className="kpi-badge">
                      {j.total_matches === 0 ? "Sem partidas" : `${j.completed_matches}/${j.total_matches} concluídas`}
                    </span>
                  </div>
                  <div className="matriz-barra-fundo" aria-hidden="true">
                    <div className="matriz-barra-preench" style={{ width: `${j.average_score ?? 0}%` }} />
                  </div>
                  <div className="matriz-numeros">
                    <span>
                      {j.average_score === null
                        ? j.total_matches === 0
                          ? "Ainda não jogou"
                          : "Nenhuma partida concluída"
                        : `${j.total_errors} ${j.total_errors === 1 ? "erro" : "erros"} · ${formatarTempo(
                            j.average_duration_seconds
                          )}`}
                    </span>
                    <strong>{j.average_score === null ? "—" : `${pontos(j.average_score)}%`}</strong>
                  </div>
                  {j.abandoned_matches > 0 && (
                    <small className="matriz-abandono">{j.abandoned_matches} abandonada(s)</small>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pais-bloco no-print">
            <div className="pais-bloco-topo">
              <h2>Histórico de atividades</h2>
              <span className="pais-legenda">
                {dados.hist.items.length} de {dados.hist.total}
              </span>
            </div>
            {dados.hist.items.length === 0 ? (
              <p className="pais-subtitulo">Nenhuma atividade encontrada para este filtro.</p>
            ) : (
              <>
                <div className="pais-tabela-wrap hist-desktop">
                  <table className="pais-tabela">
                    <thead>
                      <tr>
                        <th>Jogo</th>
                        <th>Situação</th>
                        <th>Acertos</th>
                        <th>Erros</th>
                        <th>Pontuação</th>
                        <th>Tempo</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.hist.items.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.game_name}</strong>
                          </td>
                          <td>
                            <span className={`status-badge ${r.completed ? "concluida" : "abandonada"}`}>
                              {r.completed && <IconCheck size={13} />}
                              {r.completed ? "Concluída" : "Abandonada"}
                            </span>
                          </td>
                          <td className="num-ok">{r.correct_answers}</td>
                          <td>{r.incorrect_answers}</td>
                          <td>{r.completed ? <strong>{r.score}%</strong> : "—"}</td>
                          <td>{formatarTempo(r.duration_seconds)}</td>
                          <td>{formatarDataCurta(r.played_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="hist-cards-mobile" aria-label="Lista de atividades">
                  {dados.hist.items.map((r) => (
                    <li key={r.id} className="hist-card">
                      <div className="hist-card-topo">
                        <strong>{r.game_name}</strong>
                        <span className={`status-badge ${r.completed ? "concluida" : "abandonada"}`}>
                          {r.completed && <IconCheck size={13} />}
                          {r.completed ? "Concluída" : "Abandonada"}
                        </span>
                      </div>
                      <dl className="hist-card-grid">
                        <div>
                          <dt>Pontuação</dt>
                          <dd>{r.completed ? <strong>{r.score}%</strong> : "—"}</dd>
                        </div>
                        <div>
                          <dt>Acertos / Erros</dt>
                          <dd>
                            <span className="num-ok">{r.correct_answers}</span> / {r.incorrect_answers}
                          </dd>
                        </div>
                        <div>
                          <dt>Tempo</dt>
                          <dd>{formatarTempo(r.duration_seconds)}</dd>
                        </div>
                        <div>
                          <dt>Data</dt>
                          <dd>{formatarDataCurta(r.played_at)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {mais.erro && (
              <p className="erro" role="alert">
                {mais.erro}
              </p>
            )}
            {dados.hist.items.length < dados.hist.total && (
              <div className="hist-ver-mais">
                <button
                  type="button"
                  className="btn neutro peq"
                  disabled={mais.carregando}
                  aria-busy={mais.carregando}
                  onClick={verMais}
                >
                  {mais.carregando ? "Carregando…" : "Carregar mais atividades"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <Relatorios criancaId={crianca.id} nomeCrianca={crianca.name} />
    </section>
  );
}
