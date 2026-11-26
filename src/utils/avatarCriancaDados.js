import {
  Apple,
  Cloud,
  Heart,
  Palette,
  Sparkles,
  Star,
  Sun,
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
  { id: "estrela", nome: "Estrela", Icon: Star },
  { id: "sol", nome: "Sol", Icon: Sun },
  { id: "coracao", nome: "Coração", Icon: Heart },
  { id: "frutinha", nome: "Frutinha", Icon: Apple },
  { id: "cores", nome: "Aquarela", Icon: Palette },
  { id: "brilho", nome: "Brilho", Icon: Sparkles },
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
