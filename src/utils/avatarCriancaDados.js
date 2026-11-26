import {
  Cloud,
  CloudRain,
  CloudSun,
  Moon,
  Rainbow,
  Sparkles,
  Star,
} from "lucide-react";

const PREFIXO_AVATAR = "cc_avatar_perfil_v1_";

export const CORES_AVATAR_OPCOES = [
  { id: "#5B82BA", nome: "Azul Calmo" },
  { id: "#D67456", nome: "Terracota" },
  { id: "#7E64C4", nome: "Lavanda" },
  { id: "#2D8A56", nome: "Verde Folha" },
  { id: "#C88E26", nome: "Amarelo Sol" },
  { id: "#B86077", nome: "Rosa Suave" },
];

export const ICONES_AVATAR_OPCOES = [
  { id: "letra", nome: "Inicial do nome", Icon: null },
  { id: "nuvi", nome: "Nuvem Nuvi", Icon: Cloud },
  { id: "nuvem_sol", nome: "Nuvem e Sol", Icon: CloudSun },
  { id: "nuvem_chuva", nome: "Nuvem Chuvinha", Icon: CloudRain },
  { id: "arcoiris", nome: "Arco-Íris", Icon: Rainbow },
  { id: "estrela", nome: "Estrela", Icon: Star },
  { id: "lua", nome: "Lua", Icon: Moon },
  { id: "brilho", nome: "Brilho do Céu", Icon: Sparkles },
];

export function corAvatarPadrao(nome = "") {
  const limpo = String(nome || "").trim();
  if (!limpo) return "#5B82BA";
  let soma = 0;
  for (let i = 0; i < limpo.length; i++) soma += limpo.charCodeAt(i);
  return CORES_AVATAR_OPCOES[soma % CORES_AVATAR_OPCOES.length].id;
}

export function lerEstiloAvatar(criancaId, nome = "") {
  const padrao = { cor: corAvatarPadrao(nome), icone: "letra" };
  if (!criancaId) return padrao;
  try {
    const bruto = localStorage.getItem(`${PREFIXO_AVATAR}${criancaId}`);
    if (!bruto) return padrao;
    const salvo = JSON.parse(bruto);
    return {
      cor: salvo?.cor || padrao.cor,
      icone: salvo?.icone || padrao.icone,
    };
  } catch {
    return padrao;
  }
}

export function salvarEstiloAvatar(criancaId, { cor, icone }) {
  if (!criancaId) return;
  try {
    localStorage.setItem(
      `${PREFIXO_AVATAR}${criancaId}`,
      JSON.stringify({
        cor: cor || "#5B82BA",
        icone: icone || "letra",
      })
    );
  } catch {
    // Ignora se localStorage estiver bloqueado
  }
}
