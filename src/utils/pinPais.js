const PREFIXO_PIN = "cc_pin_pais_v1_";

function chavePin(usuarioId) {
  return `${PREFIXO_PIN}${String(usuarioId || "padrao")}`;
}

async function gerarHash(usuarioId, pin) {
  const entrada = `cantinho-das-cores::${usuarioId}::${pin}`;
  if (typeof crypto !== "undefined" && crypto.subtle && typeof TextEncoder !== "undefined") {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(entrada));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback determinístico caso o ambiente não exponha Web Crypto (ex.: HTTP local sem HTTPS)
  let h = 2166136261;
  for (let i = 0; i < entrada.length; i++) {
    h ^= entrada.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv_${(h >>> 0).toString(16)}`;
}

export function temPinPais(usuarioId) {
  if (!usuarioId) return false;
  try {
    return Boolean(localStorage.getItem(chavePin(usuarioId)));
  } catch {
    return false;
  }
}

export async function salvarPinPais(usuarioId, pin) {
  const limpo = String(pin || "").replace(/\D/g, "");
  if (limpo.length !== 4) throw new Error("O PIN precisa ter 4 dígitos.");
  const hash = await gerarHash(usuarioId, limpo);
  try {
    localStorage.setItem(chavePin(usuarioId), hash);
  } catch {
    throw new Error("Não foi possível salvar o PIN neste navegador.");
  }
}

export async function verificarPinPais(usuarioId, pin) {
  const limpo = String(pin || "").replace(/\D/g, "");
  if (limpo.length !== 4) return false;
  try {
    const salvo = localStorage.getItem(chavePin(usuarioId));
    if (!salvo) return false;
    const atual = await gerarHash(usuarioId, limpo);
    return salvo === atual;
  } catch {
    return false;
  }
}

export function limparPinPais(usuarioId) {
  if (!usuarioId) return;
  try {
    localStorage.removeItem(chavePin(usuarioId));
  } catch {
    // Ignora se storage estiver bloqueado
  }
}
