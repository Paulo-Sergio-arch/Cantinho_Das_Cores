// Cliente HTTP único do front: URL base, token, cabeçalho Authorization e tratamento de erros.
const BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const CHAVE_TOKEN = "cc_token";
const CHAVE_TOKEN_EXP = "cc_token_exp";

let aoExpirar = null;

export class ApiError extends Error {
  constructor(mensagem, { status = 0, rede = false } = {}) {
    super(mensagem);
    this.status = status;
    this.rede = rede;
  }
}

// O token fica em sessionStorage: some ao fechar a aba e não é compartilhado entre abas.
export function lerToken() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN) || "";
  } catch {
    return "";
  }
}

export function lerExpiracaoToken() {
  try {
    const valor = Number(sessionStorage.getItem(CHAVE_TOKEN_EXP));
    return Number.isFinite(valor) && valor > 0 ? valor : 0;
  } catch {
    return 0;
  }
}

export function salvarToken(token, expiresInSegundos = 0) {
  try {
    if (token) {
      sessionStorage.setItem(CHAVE_TOKEN, token);
      if (expiresInSegundos > 0) {
        sessionStorage.setItem(CHAVE_TOKEN_EXP, String(Date.now() + expiresInSegundos * 1000));
      }
    } else {
      sessionStorage.removeItem(CHAVE_TOKEN);
      sessionStorage.removeItem(CHAVE_TOKEN_EXP);
    }
  } catch {
    // Armazenamento bloqueado: o login vale só até recarregar a página.
  }
}

// Chamado quando uma rota protegida responde 401 (token expirado ou inválido).
export function definirAoExpirar(fn) {
  aoExpirar = fn;
}

function mensagemAmigavel(status, detalhe) {
  if (typeof detalhe === "string" && detalhe && status < 500) return detalhe;
  if (Array.isArray(detalhe) && detalhe.length) {
    const msg = String(detalhe[0]?.msg || "").replace(/^Value error,\s*/i, "");
    if (msg && /[à-ÿ]|senha|nome|período|fuso|dados/i.test(msg)) return msg;
    const campo = detalhe[0]?.loc?.slice(-1)[0];
    return campo ? `Confira o campo "${campo}".` : "Confira os dados informados.";
  }
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403) return "Você não tem permissão para fazer isso.";
  if (status === 404) return "Não encontramos o que você procura.";
  if (status === 422) return "Confira os dados informados.";
  if (status === 429) return "Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.";
  if (status >= 500) return "O servidor teve um problema. Tente de novo em instantes.";
  return "Não foi possível concluir a operação.";
}

export async function requisitar(metodo, caminho, { corpo, params, auth = true, keepalive = false } = {}) {
  const url = new URL(`${BASE}${caminho}`);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const headers = {};
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  const token = lerToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let resp;
  try {
    resp = await fetch(url, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      keepalive,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique a conexão e tente de novo.", { rede: true });
  }

  if (resp.status === 204) return null;
  let dados = null;
  try {
    dados = await resp.json();
  } catch {
    dados = null;
  }
  if (!resp.ok) {
    if (resp.status === 401 && auth && token && aoExpirar) aoExpirar();
    throw new ApiError(mensagemAmigavel(resp.status, dados?.detail), { status: resp.status });
  }
  return dados;
}

export const api = {
  get: (c, params, opts) => requisitar("GET", c, { params, ...opts }),
  post: (c, corpo, opts) => requisitar("POST", c, { corpo, ...opts }),
  put: (c, corpo, opts) => requisitar("PUT", c, { corpo, ...opts }),
  del: (c, opts) => requisitar("DELETE", c, opts),
};
