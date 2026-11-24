import { api, salvarToken } from "./api";

function guardar(resposta, manterConectado = null) {
  salvarToken(resposta.access_token, Number(resposta.expires_in) || 0, manterConectado);
  return resposta.user;
}

export async function cadastrar({ nome, email, senha, aceitouTermos, manterConectado = false }) {
  return guardar(
    await api.post(
      "/api/auth/register",
      { name: nome, email: email.trim().toLowerCase(), password: senha, accepted_terms: aceitouTermos === true },
      { auth: false }
    ),
    manterConectado
  );
}

export async function entrar({ email, senha, manterConectado = false }) {
  return guardar(
    await api.post("/api/auth/login", { email: email.trim().toLowerCase(), password: senha }, { auth: false }),
    manterConectado
  );
}

export async function entrarComoVisitante() {
  return guardar(await api.post("/api/auth/guest", undefined, { auth: false }), false);
}

export const usuarioAtual = () => api.get("/api/auth/me");

export async function renovarSessao() {
  return guardar(await api.post("/api/auth/refresh"));
}

export async function alterarSenha({ senhaAtual, novaSenha }) {
  return api.post("/api/auth/change-password", {
    current_password: senhaAtual,
    new_password: novaSenha,
  });
}

export async function solicitarCodigoSenha(email) {
  return api.post(
    "/api/auth/forgot-password",
    { email: email.trim().toLowerCase() },
    { auth: false }
  );
}

export async function redefinirSenha({ email, codigo, novaSenha }) {
  return api.post(
    "/api/auth/reset-password",
    { email: email.trim().toLowerCase(), code: codigo.trim(), new_password: novaSenha },
    { auth: false }
  );
}

export async function excluirMinhaConta(senha) {
  await api.del("/api/auth/me", { corpo: { password: senha } });
  salvarToken("");
}

export async function sair() {
  try {
    await api.post("/api/auth/logout");
  } catch {
    // O token local é descartado mesmo se houver falha de rede.
  }
  salvarToken("");
}
