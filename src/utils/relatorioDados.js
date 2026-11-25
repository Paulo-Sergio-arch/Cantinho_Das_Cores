// Normalização, parser de fallback e narrativa pedagógica da Nuvi
// compartilhados entre o relatório interativo (Relatorios.jsx) e o gerador de PDF (pdfRelatorio.js).

export const CORES_AVATAR = ["#5B82BA", "#D67456", "#7E64C4", "#2D8A56", "#C88E26", "#B86077"];

export const COR_JOGO = {
  cores: "#5C89C7",
  encaixe: "#3B9B7E",
  corforma: "#9A82D1",
  ligar: "#E0AE4C",
  falar: "#DE8668",
  frutas: "#D47B8B",
};

const NOME_PARA_GAME_ID = {
  "acerte a cor": "cores",
  "encaixe as formas": "encaixe",
  "cor e forma": "corforma",
  "ligue ao nome": "ligar",
  "vamos falar": "falar",
  "bloquinho de frutas": "frutas",
};

const HABILIDADE_PADRAO = {
  cores: "Discriminação visual e atenção",
  encaixe: "Coordenação motora e percepção espacial",
  corforma: "Atenção dupla e raciocínio lógico",
  ligar: "Associação semântica e alfabetização",
  falar: "Consciência fonológica e estímulo da fala",
  frutas: "Atividade lúdica com frutas e blocos",
};

export function corAvatar(nome = "") {
  const limpo = String(nome || "").trim();
  if (!limpo) return "#5B82BA";
  let soma = 0;
  for (let i = 0; i < limpo.length; i++) soma += limpo.charCodeAt(i);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

export function identificarGameId(gameId, nome = "") {
  if (gameId && COR_JOGO[gameId]) return gameId;
  const normalizado = String(nome || "").trim().toLowerCase();
  return NOME_PARA_GAME_ID[normalizado] || gameId || normalizado.replace(/[^a-z0-9]+/g, "") || "jogo";
}

export function corDoJogo(gameId, nome = "") {
  const id = identificarGameId(gameId, nome);
  return COR_JOGO[id] || "#5B82BA";
}

export function formatarTempoCurto(seg) {
  if (seg === null || seg === undefined || Number.isNaN(Number(seg))) return "—";
  const total = Math.max(0, Math.round(Number(seg)));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export function formatarDataCurta(iso) {
  if (!iso) return "";
  try {
    const bruto = String(iso);
    const data = /^\d{4}-\d{2}-\d{2}$/.test(bruto)
      ? new Date(`${bruto}T00:00:00`)
      : new Date(/(Z|[+-]\d\d:\d\d)$/.test(bruto) ? bruto : `${bruto}Z`);
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export function formatarDataCompleta(iso) {
  if (!iso) return "";
  try {
    const bruto = String(iso);
    const data = /^\d{4}-\d{2}-\d{2}$/.test(bruto)
      ? new Date(`${bruto}T00:00:00`)
      : new Date(/(Z|[+-]\d\d:\d\d)$/.test(bruto) ? bruto : `${bruto}Z`);
    return data.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

export function formatarDataHora(iso) {
  if (!iso) return "";
  try {
    const bruto = String(iso);
    const data = new Date(/(Z|[+-]\d\d:\d\d)$/.test(bruto) ? bruto : `${bruto}Z`);
    return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

function parseTempoTexto(str = "") {
  const minMatch = str.match(/(\d+)\s*min(?:\s*(\d+)\s*s)?/i);
  if (minMatch) return Number(minMatch[1]) * 60 + Number(minMatch[2] || 0);
  const segMatch = str.match(/(\d+)\s*s/i);
  if (segMatch) return Number(segMatch[1]);
  return null;
}

export function analisarTextoRelatorio(relatorio, fallbackNome = "", fallbackIdade = null) {
  const texto = String(relatorio?.text || "");
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const cabMatch = texto.match(/Relatório pedagógico de\s+(.+?)\s*\((\d+)\s*anos?\)/i);
  const childName = relatorio?.child_name || cabMatch?.[1]?.trim() || fallbackNome || "Criança";
  const childAge =
    relatorio?.child_age ??
    (cabMatch ? Number(cabMatch[2]) : fallbackIdade !== "" && fallbackIdade !== null ? Number(fallbackIdade) : null);

  const partidasMatch = texto.match(
    /Partidas jogadas:\s*(\d+)\s*\(concluídas:\s*(\d+),\s*abandonadas:\s*(\d+),\s*taxa de conclusão:\s*(\d+)%\)/i
  );
  const pontMatch = texto.match(
    /Pontuação média:\s*(\d+)\/100\.\s*Tempo médio por partida:\s*([^.\n]+)/i
  );
  const acertosMatch = texto.match(/Acertos:\s*(\d+)\.\s*Erros:\s*(\d+)/i);

  const totalMatches = partidasMatch ? Number(partidasMatch[1]) : 0;
  const completedMatches = partidasMatch ? Number(partidasMatch[2]) : 0;
  const abandonedMatches = partidasMatch ? Number(partidasMatch[3]) : Math.max(0, totalMatches - completedMatches);
  const completionRate = partidasMatch
    ? Number(partidasMatch[4])
    : totalMatches > 0
      ? Math.round((completedMatches / totalMatches) * 100)
      : 0;

  const summary = {
    total_matches: totalMatches,
    completed_matches: completedMatches,
    abandoned_matches: abandonedMatches,
    completion_rate: completionRate,
    average_score: pontMatch ? Number(pontMatch[1]) : null,
    average_duration_seconds: pontMatch ? parseTempoTexto(pontMatch[2]) : null,
    total_correct: acertosMatch ? Number(acertosMatch[1]) : 0,
    total_errors: acertosMatch ? Number(acertosMatch[2]) : 0,
  };

  let secao = "";
  const games = [];
  const unplayed = [];
  const onlyAbandoned = [];
  const observations = [];

  for (const linha of linhas) {
    if (/^Resumo geral$/i.test(linha)) {
      secao = "resumo";
      continue;
    }
    if (/^Desempenho por jogo$/i.test(linha)) {
      secao = "jogos";
      continue;
    }
    if (/^Observações$/i.test(linha)) {
      secao = "obs";
      continue;
    }

    if (secao === "jogos" && linha.startsWith("- ")) {
      const corpo = linha.slice(2).trim();
      const naoJogados = corpo.match(/^Ainda não jogados no período:\s*(.+?)\.?$/i);
      if (naoJogados) {
        unplayed.push(
          ...naoJogados[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        );
        continue;
      }
      const semConcluida = corpo.match(/^Sem partida concluída no período:\s*(.+?)\.?$/i);
      if (semConcluida) {
        onlyAbandoned.push(
          ...semConcluida[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        );
        continue;
      }
      const jogoMatch = corpo.match(
        /^(.+?)\s*\((.+?)\):\s*(\d+)\s*partida\(s\),\s*(\d+)\s*concluída\(s\),\s*pontuação média\s*(\d+),\s*tempo médio\s*(.+?)\.?$/i
      );
      if (jogoMatch) {
        const name = jogoMatch[1].trim();
        const skill = jogoMatch[2].trim();
        const total = Number(jogoMatch[3]);
        const completed = Number(jogoMatch[4]);
        const gameId = identificarGameId(null, name);
        games.push({
          game_id: gameId,
          name,
          skill,
          total_matches: total,
          completed_matches: completed,
          abandoned_matches: Math.max(0, total - completed),
          average_score: Number(jogoMatch[5]),
          average_duration_seconds: parseTempoTexto(jogoMatch[6]),
          total_errors: 0,
        });
      }
    } else if (secao === "obs" && linha.startsWith("- ")) {
      observations.push(linha.slice(2).trim());
    }
  }

  for (const nome of onlyAbandoned) {
    const id = identificarGameId(null, nome);
    if (!games.some((g) => g.game_id === id)) {
      games.push({
        game_id: id,
        name: nome,
        skill: HABILIDADE_PADRAO[id] || "Atividade educativa",
        total_matches: 1,
        completed_matches: 0,
        abandoned_matches: 1,
        average_score: null,
        average_duration_seconds: null,
        total_errors: 0,
      });
    }
  }

  for (const nome of unplayed) {
    const id = identificarGameId(null, nome);
    if (!games.some((g) => g.game_id === id)) {
      games.push({
        game_id: id,
        name: nome,
        skill: HABILIDADE_PADRAO[id] || "Atividade educativa",
        total_matches: 0,
        completed_matches: 0,
        abandoned_matches: 0,
        average_score: null,
        average_duration_seconds: null,
        total_errors: 0,
      });
    }
  }

  return {
    childName,
    childAge,
    periodLabel:
      relatorio?.period_start && relatorio?.period_end
        ? `${formatarDataCompleta(relatorio.period_start)} a ${formatarDataCompleta(relatorio.period_end)}`
        : "Período selecionado",
    periodStart: relatorio?.period_start || null,
    periodEnd: relatorio?.period_end || null,
    generatedAt: relatorio?.generated_at || new Date().toISOString(),
    summary,
    games,
    evolution: [],
    recentMatches: [],
    observations,
    rawText: texto,
  };
}

function normalizarJogos(lista = []) {
  return lista.map((j) => {
    const id = identificarGameId(j.game_id, j.name);
    return {
      game_id: id,
      name: j.name,
      skill: j.skill || HABILIDADE_PADRAO[id] || "Atividade educativa",
      total_matches: Number(j.total_matches || 0),
      completed_matches: Number(j.completed_matches || 0),
      abandoned_matches:
        j.abandoned_matches !== undefined
          ? Number(j.abandoned_matches)
          : Math.max(0, Number(j.total_matches || 0) - Number(j.completed_matches || 0)),
      average_score:
        j.average_score === null || j.average_score === undefined ? null : Math.round(Number(j.average_score)),
      average_duration_seconds:
        j.average_duration_seconds === null || j.average_duration_seconds === undefined
          ? null
          : Math.round(Number(j.average_duration_seconds)),
      total_errors: Number(j.total_errors || 0),
      color: corDoJogo(id, j.name),
    };
  });
}

function normalizarEvolucao(lista = []) {
  return (lista || [])
    .filter((p) => p.average_score !== null && p.average_score !== undefined)
    .slice(-14)
    .map((p) => ({
      date: p.date,
      rotulo: formatarDataCurta(p.date),
      taxa: Math.round(Number(p.average_score)),
      partidas: Number(p.completed_matches || 0),
      abandonadas: Number(p.abandoned_matches || 0),
    }));
}

export function construirDadosRelatorio({ relatorio, metricas = null, nomeCrianca = "", idadeCrianca = null }) {
  const parsed = analisarTextoRelatorio(relatorio, nomeCrianca, idadeCrianca);
  const metricasAlinhadas =
    metricas &&
    metricas.summary &&
    (parsed.summary.total_matches === 0 ||
      metricas.summary.total_matches === parsed.summary.total_matches);

  const summary = metricasAlinhadas
    ? {
        total_matches: Number(metricas.summary.total_matches || 0),
        completed_matches: Number(metricas.summary.completed_matches || 0),
        abandoned_matches: Number(metricas.summary.abandoned_matches || 0),
        completion_rate: Number(metricas.summary.completion_rate || 0),
        average_score:
          metricas.summary.average_score === null || metricas.summary.average_score === undefined
            ? null
            : Math.round(Number(metricas.summary.average_score)),
        average_duration_seconds:
          metricas.summary.average_duration_seconds === null ||
          metricas.summary.average_duration_seconds === undefined
            ? null
            : Math.round(Number(metricas.summary.average_duration_seconds)),
        total_correct: Number(metricas.summary.total_correct || 0),
        total_errors: Number(metricas.summary.total_errors || 0),
      }
    : parsed.summary;

  const games = normalizarJogos(metricasAlinhadas && metricas.games?.length ? metricas.games : parsed.games);
  const evolution = normalizarEvolucao(metricas?.evolution || []);
  const recentMatches = (metricas?.recent_matches || []).slice(0, 12);

  return {
    origem: "relatorio",
    childName: metricas?.child_name || parsed.childName,
    childAge: metricas?.child_age ?? parsed.childAge,
    periodLabel: parsed.periodLabel,
    periodStart: parsed.periodStart,
    periodEnd: parsed.periodEnd,
    generatedAt: parsed.generatedAt,
    summary,
    games,
    evolution,
    recentMatches,
    observations: parsed.observations,
    rawText: parsed.rawText,
  };
}

export function construirDadosPainel({ nomeCrianca, idadeCrianca, dias, res, jogos, evo, itens }) {
  const rotuloPeriodo =
    dias === "7" ? "Últimos 7 dias" : dias === "30" ? "Últimos 30 dias" : "Todo o período";

  const summary = {
    total_matches: Number(res?.total_matches || 0),
    completed_matches: Number(res?.completed_matches || 0),
    abandoned_matches: Number(res?.abandoned_matches || 0),
    completion_rate: Number(res?.completion_rate || 0),
    average_score:
      res?.average_score === null || res?.average_score === undefined
        ? null
        : Math.round(Number(res.average_score)),
    average_duration_seconds:
      res?.average_duration_seconds === null || res?.average_duration_seconds === undefined
        ? null
        : Math.round(Number(res.average_duration_seconds)),
    total_correct: Number(res?.total_correct || 0),
    total_errors: Number(res?.total_errors || 0),
  };

  const jogosNorm = normalizarJogos(jogos || []);
  const evolution = normalizarEvolucao(evo || []);
  const recentMatches = (itens || []).slice(0, 12);

  return {
    origem: "painel",
    childName: nomeCrianca || "Criança",
    childAge: idadeCrianca !== "" && idadeCrianca !== null && idadeCrianca !== undefined ? Number(idadeCrianca) : null,
    periodLabel: rotuloPeriodo,
    periodStart: null,
    periodEnd: null,
    generatedAt: new Date().toISOString(),
    summary,
    games: jogosNorm,
    evolution,
    recentMatches,
    observations: [],
    rawText: "",
  };
}

export function gerarNarrativaNuvi(dados) {
  const { childName, summary, games, observations: obsOriginais = [] } = dados;
  const jogados = games.filter((g) => g.completed_matches > 0 && g.average_score !== null);
  const naoJogados = games.filter((g) => g.total_matches === 0);
  const soAbandonados = games.filter((g) => g.total_matches > 0 && g.completed_matches === 0);

  const ordenados = [...jogados].sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0));
  const melhorJogo = ordenados[0] || null;
  const menorJogo = ordenados.length > 1 ? ordenados[ordenados.length - 1] : null;
  const jogoAtencao =
    menorJogo && melhorJogo && menorJogo.average_score < melhorJogo.average_score
      ? menorJogo
      : soAbandonados[0] || null;

  const totalTentativas = summary.total_correct + summary.total_errors;
  const precisao = totalTentativas > 0 ? Math.round((summary.total_correct / totalTentativas) * 100) : null;

  const estrelas =
    summary.average_score === null || summary.completed_matches === 0
      ? 0
      : Math.max(1, Math.min(5, Math.round(summary.average_score / 20)));

  let selo;
  let fala;

  if (summary.total_matches === 0) {
    selo = {
      titulo: "Pronto para Começar",
      subtitulo: "Nenhuma partida no período",
      cor: "#5B82BA",
      fundo: "#EAF1FC",
    };
    fala = `Oi! Assim que ${childName} brincar nas atividades, eu vou reunir aqui todas as conquistas e gráficos de evolução!`;
  } else if (summary.completed_matches === 0) {
    selo = {
      titulo: "Primeiras Explorações",
      subtitulo: "Incentive a concluir a primeira partida",
      cor: "#C88E26",
      fundo: "#FDF3DA",
    };
    fala = `${childName} já começou a explorar os jogos! Que tal brincar juntinhos hoje para conquistar as 5 estrelinhas da primeira partida?`;
  } else if (summary.average_score >= 85 && summary.completion_rate >= 80) {
    selo = {
      titulo: "Engajamento Brilhante",
      subtitulo: "Excelente foco e aproveitamento",
      cor: "#2D8A56",
      fundo: "#E8F6EE",
    };
    fala = `Uau! ${childName} brilhou neste período com ${summary.average_score}/100 de média e ${summary.completion_rate}% de conclusão! Confira os gráficos abaixo.`;
  } else if (summary.completion_rate >= 70) {
    selo = {
      titulo: "Evolução Consistente",
      subtitulo: "Ótimo ritmo de conclusão",
      cor: "#5B82BA",
      fundo: "#EAF1FC",
    };
    fala = `Que alegria acompanhar ${childName}! ${
      melhorJogo ? `O grande destaque foi ${melhorJogo.name} (${melhorJogo.average_score}%). ` : ""
    }Veja cada conquista nos gráficos abaixo.`;
  } else {
    selo = {
      titulo: "Caminhada em Progresso",
      subtitulo: "Cada passo conta no aprendizado",
      cor: "#9A82D1",
      fundo: "#EFE9FA",
    };
    fala = `${childName} está construindo sua jornada passo a passo! Os gráficos abaixo mostram onde já brilha e onde vale praticar com calma.`;
  }

  const observacoes = [];
  if (obsOriginais.length > 0) {
    observacoes.push(...obsOriginais);
  } else {
    if (summary.total_matches === 0) {
      observacoes.push("Não houve partidas registradas neste período.");
    } else if (!jogados.length) {
      observacoes.push("Incentive a criança a terminar ao menos uma atividade para gerar indicadores de desempenho.");
    } else {
      if (melhorJogo && menorJogo && melhorJogo.average_score !== menorJogo.average_score) {
        observacoes.push(
          `Melhor desempenho em ${melhorJogo.name} (${melhorJogo.average_score}/100). Vale dedicar um tempo extra com calma em ${menorJogo.name} (${menorJogo.average_score}/100).`
        );
      } else if (melhorJogo) {
        observacoes.push(`Desempenho consistente em ${melhorJogo.name}, com média de ${melhorJogo.average_score}/100.`);
      }

      if (summary.completion_rate >= 80) {
        observacoes.push("Alta taxa de conclusão, o que indica ótimo engajamento e interesse nas atividades.");
      } else if (summary.completion_rate < 50) {
        observacoes.push("Menos da metade das partidas foi concluída; acompanhar de perto e celebrar pequenas etapas pode ajudar.");
      }

      if (precisao !== null && precisao >= 85) {
        observacoes.push(`Excelente precisão geral de ${precisao}% (${summary.total_correct} acertos para ${summary.total_errors} erros).`);
      }

      if (naoJogados.length > 0) {
        observacoes.push(`Jogos ainda não explorados neste período: ${naoJogados.map((g) => g.name).join(", ")}.`);
      }
    }
  }

  return {
    fala,
    selo,
    estrelas,
    precisao,
    jogados,
    naoJogados,
    soAbandonados,
    melhorJogo,
    jogoAtencao,
    observacoes,
  };
}
