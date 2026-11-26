import { cn } from "../lib/cn";
import { ICONES_AVATAR_OPCOES, lerEstiloAvatar } from "./avatarCriancaDados";

export function AvatarCrianca({
  criancaId,
  nome = "",
  corForcada = null,
  iconeForcado = null,
  size = "md",
  className = "",
}) {
  const salvo = lerEstiloAvatar(criancaId, nome);
  const cor = corForcada || salvo.cor;
  const iconeId = iconeForcado || salvo.icone;
  const inicial = String(nome || "?").trim().charAt(0).toUpperCase() || "?";
  const opcaoIcone = ICONES_AVATAR_OPCOES.find((o) => o.id === iconeId);
  const IconeComp = opcaoIcone?.Icon || null;

  const tamanhoClasses =
    size === "lg"
      ? "h-14 w-14 rounded-2xl text-2xl"
      : size === "sm"
        ? "h-6 w-6 rounded-full text-xs"
        : "h-11 w-11 rounded-full text-lg";

  const tamanhoIcone = size === "lg" ? 26 : size === "sm" ? 13 : 20;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-semibold text-white transition-colors",
        tamanhoClasses,
        className
      )}
      style={{ backgroundColor: cor }}
      aria-hidden="true"
    >
      {IconeComp ? (
        <IconeComp size={tamanhoIcone} strokeWidth={2.2} />
      ) : (
        inicial
      )}
    </span>
  );
}
