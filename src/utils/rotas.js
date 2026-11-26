// Roteamento leve via History API com suporte à BASE_URL do Vite (Vercel '/' ou GitHub Pages '/Cantinho_Das_Cores/').

const ABAS_PARA_CAMINHO = {
  jogos: "/jogos",
  jardim: "/jardim",
  bloquinhos: "/bloquinhos",
  perfis: "/criancas",
  pais: "/painel",
};

const CAMINHO_PARA_ABA = {
  "": "jogos",
  "/": "jogos",
  "/jogos": "jogos",
  "/jardim": "jardim",
  "/bloquinhos": "bloquinhos",
  "/criancas": "perfis",
  "/painel": "pais",
};

const JOGOS_VALIDOS = new Set(["cores", "encaixe", "ligar", "corforma", "falar", "frutas"]);

const TITULOS_ABAS = {
  jogos: "Jogos — Cantinho das Cores",
  jardim: "Jardim da Nuvi — Cantinho das Cores",
  bloquinhos: "Bloquinhos Interativos — Cantinho das Cores",
  perfis: "Perfis das Crianças — Cantinho das Cores",
  pais: "Pais e Professores — Cantinho das Cores",
};

function obterBase() {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  return base === "/" ? "" : base;
}

function normalizarRelativo(pathname) {
  const base = obterBase();
  let rel = pathname || "/";
  if (base && rel.startsWith(base)) {
    rel = rel.slice(base.length) || "/";
  }
  if (!rel.startsWith("/")) rel = `/${rel}`;
  if (rel.length > 1 && rel.endsWith("/")) rel = rel.slice(0, -1);
  return rel;
}

export function lerRotaAtual() {
  if (typeof window === "undefined") {
    return { tela: "menu", aba: "jogos" };
  }
  const rel = normalizarRelativo(window.location.pathname);

  if (rel === "/login") {
    return { tela: "login", aba: "jogos" };
  }

  if (rel.startsWith("/jogo/")) {
    const id = rel.slice("/jogo/".length);
    if (JOGOS_VALIDOS.has(id)) {
      return { tela: id, aba: "jogos" };
    }
    return { tela: "menu", aba: "jogos" };
  }

  const aba = CAMINHO_PARA_ABA[rel] || "jogos";
  return { tela: "menu", aba };
}

export function caminhoParaEstado(tela, aba) {
  const base = obterBase();
  let rel = "/jogos";
  if (tela === "login") {
    rel = "/login";
  } else if (tela === "menu") {
    rel = ABAS_PARA_CAMINHO[aba] || "/jogos";
  } else if (JOGOS_VALIDOS.has(tela)) {
    rel = `/jogo/${tela}`;
  }
  return `${base}${rel}`;
}

export function sincronizarUrl(tela, aba, { replace = false } = {}) {
  if (typeof window === "undefined" || tela === "carregando") return;
  const destino = caminhoParaEstado(tela, aba);
  const atual = window.location.pathname;
  if (atual === destino) return;
  try {
    if (replace) window.history.replaceState({ tela, aba }, "", destino);
    else window.history.pushState({ tela, aba }, "", destino);
  } catch {
    // Ignora caso history API esteja restrita
  }
}

export function tituloParaEstado(tela, aba, nomeJogo) {
  if (tela === "login") return "Entrar — Cantinho das Cores";
  if (tela === "carregando") return "Carregando — Cantinho das Cores";
  if (tela === "menu") return TITULOS_ABAS[aba] || "Cantinho das Cores — Jogos Educativos";
  if (nomeJogo) return `${nomeJogo} — Cantinho das Cores`;
  return "Cantinho das Cores — Jogos Educativos";
}
