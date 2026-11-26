import { cn } from "../lib/cn";

/**
 * Ilustrações vetoriais exclusivas dos 8 Emblemas de Nuvem da Nuvi.
 * Cada emblema possui uma silhueta contínua de nuvem (sem linhas internas cortando)
 * e elementos lúdicos ligados ao céu (arco-íris, sol, chuva colorida, estrelas, coroa, etc.).
 */
export function EmblemaNuvemSvg({ tipo, desbloqueado = true, className = "" }) {
  const paletas = {
    nuvem_broto: { fill: "#F9FCFF", borda: "#6EA986", sombra: "#E0F2E7" },
    nuvem_brisa: { fill: "#F7FCFB", borda: "#6BA6BA", sombra: "#DFF1F5" },
    nuvem_chuva: { fill: "#F5FAFF", borda: "#6D96CF", sombra: "#DCEBFA" },
    nuvem_arcoiris: { fill: "#FFFFFF", borda: "#84A3C4", sombra: "#E4EEF8" },
    nuvem_estrelada: { fill: "#FAF8FF", borda: "#8D7CC8", sombra: "#EAE4FA" },
    nuvem_sol: { fill: "#FFFDFA", borda: "#D1A245", sombra: "#FAF0D7" },
    nuvem_algodao: { fill: "#FFF7FA", borda: "#CE829B", sombra: "#FBE5EE" },
    nuvem_coroa: { fill: "#FFFEFA", borda: "#D4A12A", sombra: "#FBF1D2" },
  };

  const p = desbloqueado
    ? paletas[tipo] || paletas.nuvem_arcoiris
    : { fill: "#F1F3F6", borda: "#B8C2CF", sombra: "#E2E7EE" };

  return (
    <svg
      viewBox="0 0 128 104"
      width="98"
      height="80"
      aria-hidden="true"
      className={cn(
        "shrink-0 transition-transform duration-200",
        !desbloqueado && "opacity-70 saturate-50",
        className
      )}
    >
      {/* ELEMENTOS ATRÁS DA NUVEM */}
      {tipo === "nuvem_arcoiris" && (
        <g fill="none" strokeLinecap="round" opacity={desbloqueado ? "0.95" : "0.35"}>
          <path d="M 22 62 A 42 40 0 0 1 106 62" stroke="#F08B86" strokeWidth="6" />
          <path d="M 28 62 A 36 34 0 0 1 100 62" stroke="#F5C95D" strokeWidth="6" />
          <path d="M 34 62 A 30 28 0 0 1 94 62" stroke="#78C794" strokeWidth="6" />
          <path d="M 40 62 A 24 22 0 0 1 88 62" stroke="#7DB4EA" strokeWidth="6" />
        </g>
      )}

      {tipo === "nuvem_sol" && (
        <g opacity={desbloqueado ? "1" : "0.4"}>
          <g stroke="#F3BE3A" strokeWidth="3.2" strokeLinecap="round">
            <line x1="94" y1="10" x2="94" y2="17" />
            <line x1="112" y1="18" x2="107" y2="23" />
            <line x1="119" y1="36" x2="112" y2="36" />
            <line x1="76" y1="18" x2="81" y2="23" />
          </g>
          <circle cx="94" cy="34" r="16" fill="#F9D566" stroke="#E0A624" strokeWidth="2.5" />
        </g>
      )}

      {tipo === "nuvem_estrelada" && (
        <g opacity={desbloqueado ? "1" : "0.35"}>
          {/* Lua crescente suave atrás */}
          <path
            d="M97 15 A14 14 0 1 0 108 35 A11 11 0 1 1 97 15 Z"
            fill="#F6D167"
            stroke="#D6A526"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            points="22,18 24.5,24 31,24.5 26,28.5 27.5,35 22,31.5 16.5,35 18,28.5 13,24.5 19.5,24"
            fill="#F6D167"
          />
          <circle cx="110" cy="48" r="3.5" fill="#C2B1EE" />
          <circle cx="18" cy="44" r="2.8" fill="#B5D7F7" />
        </g>
      )}

      {tipo === "nuvem_coroa" && (
        <g opacity={desbloqueado ? "1" : "0.45"}>
          {/* Halo dourado suave */}
          <circle cx="64" cy="48" r="38" fill="#FDF2CA" opacity="0.55" />
          {/* Coroa dourada no topo da nuvem */}
          <path
            d="M46 27 L49 12 L58 20 L64 8 L70 20 L79 12 L82 27 Z"
            fill="#F6C84C"
            stroke="#C48E14"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="64" cy="20" r="3" fill="#E56B67" />
          <circle cx="53" cy="22" r="2" fill="#5B82BA" />
          <circle cx="75" cy="22" r="2" fill="#3B9B7E" />
        </g>
      )}

      {tipo === "nuvem_broto" && (
        <g opacity={desbloqueado ? "1" : "0.4"}>
          <path d="M64 26 V15" stroke="#3B9B7E" strokeWidth="3.2" strokeLinecap="round" />
          <path
            d="M64 19 C54 17 51 9 60 9 C64 9 64 15 64 19 Z"
            fill="#6BCB93"
            stroke="#2D8A56"
            strokeWidth="2"
          />
          <path
            d="M64 17 C74 15 77 7 68 7 C64 7 64 13 64 17 Z"
            fill="#8CE0AE"
            stroke="#2D8A56"
            strokeWidth="2"
          />
        </g>
      )}

      {/* CORPO CONTÍNUO DA NUVEM (DUAS PASSADAS PARA BORDA LIMPA) */}
      <g fill={p.borda} stroke={p.borda} strokeWidth="6" strokeLinejoin="round">
        <circle cx="40" cy="58" r="20" />
        <circle cx="64" cy="44" r="24" />
        <circle cx="88" cy="59" r="19" />
        <rect x="34" y="56" width="60" height="22" rx="11" />
      </g>
      <g fill={p.fill}>
        <circle cx="40" cy="58" r="20" />
        <circle cx="64" cy="44" r="24" />
        <circle cx="88" cy="59" r="19" />
        <rect x="34" y="56" width="60" height="22" rx="11" />
      </g>
      <path d="M30 74h68" stroke={p.sombra} strokeWidth="4.5" strokeLinecap="round" />

      {/* EXPRESSÃO FACIAL DA NUVINHA */}
      {desbloqueado ? (
        <g>
          <path
            d="M50 56q4-4.5 8 0"
            stroke="#273654"
            strokeWidth="2.7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M70 56q4-4.5 8 0"
            stroke="#273654"
            strokeWidth="2.7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M59 61q5 5 10 0"
            stroke="#273654"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="46" cy="62" rx="4.5" ry="2.7" fill="#F4B2B0" />
          <ellipse cx="82" cy="62" rx="4.5" ry="2.7" fill="#F4B2B0" />
        </g>
      ) : (
        /* Nuvinha dormindo esperando ser desbloqueada */
        <g stroke="#7A879B" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M50 58q4 3 8 0" />
          <path d="M70 58q4 3 8 0" />
          <path d="M61 64h6" />
        </g>
      )}

      {/* ELEMENTOS NA FRENTE / ABAIXO DA NUVEM */}
      {tipo === "nuvem_chuva" && (
        <g opacity={desbloqueado ? "1" : "0.35"}>
          {[
            [40, 88, "#E87A76"],
            [52, 92, "#F2C64B"],
            [64, 88, "#58B884"],
            [76, 92, "#5D95E0"],
            [88, 88, "#A78DE0"],
          ].map(([x, y, c], i) => (
            <path
              key={i}
              d={`M${x} ${y - 6} C${x - 4} ${y} ${x - 3.5} ${y + 5} ${x} ${y + 5} C${x + 3.5} ${y + 5} ${x + 4} ${y} ${x} ${y - 6} Z`}
              fill={c}
            />
          ))}
        </g>
      )}

      {tipo === "nuvem_brisa" && (
        <g fill="none" strokeLinecap="round" opacity={desbloqueado ? "1" : "0.35"}>
          <path d="M16 74 Q24 68 30 74 T42 74" stroke="#73B5C9" strokeWidth="3" />
          <path d="M90 36 Q98 30 106 36 T116 32" stroke="#85C79B" strokeWidth="3" />
          <circle cx="24" cy="40" r="4" fill="#F5C95D" />
          <circle cx="108" cy="70" r="3.5" fill="#E89BB4" />
        </g>
      )}

      {tipo === "nuvem_algodao" && (
        <g opacity={desbloqueado ? "1" : "0.35"}>
          <circle cx="23" cy="34" r="4.5" fill="#F5B3CA" />
          <circle cx="105" cy="32" r="5" fill="#D5B8F5" />
          <polygon
            points="102,76 104,80 108,80.5 105,83 106,87 102,84.5 98,87 99,83 96,80.5 100,80"
            fill="#F3BE3A"
          />
          <polygon
            points="26,76 28,80 32,80.5 29,83 30,87 26,84.5 22,87 23,83 20,80.5 24,80"
            fill="#F3BE3A"
          />
        </g>
      )}

      {tipo === "nuvem_coroa" && desbloqueado && (
        <g fill="#F3BE3A">
          <polygon points="18,42 20,46 24,46.5 21,49 22,53 18,50.5 14,53 15,49 12,46.5 16,46" />
          <polygon points="110,42 112,46 116,46.5 113,49 114,53 110,50.5 106,53 107,49 104,46.5 108,46" />
        </g>
      )}
    </svg>
  );
}

/**
 * Moldura fofa em formato de nuvem usada como medalhão nos 6 emblemas de jogos.
 */
export function MedalhaoNuvemJogo({
  Icone,
  cor,
  fundo,
  borda,
  desbloqueada = false,
  dourada = false,
}) {
  const fillNuvem = dourada ? "#FFF8DF" : desbloqueada ? fundo : "#EFECE3";
  const strokeNuvem = dourada ? "#E0B243" : desbloqueada ? borda : "#D5CEC0";

  return (
    <div className="relative flex h-18 w-24 items-center justify-center">
      <svg
        viewBox="0 0 116 80"
        className="absolute inset-0 h-full w-full drop-shadow-[0_3px_6px_rgba(31,45,77,0.06)]"
        aria-hidden="true"
      >
        <g fill={strokeNuvem} stroke={strokeNuvem} strokeWidth="5.5" strokeLinejoin="round">
          <circle cx="35" cy="47" r="19" />
          <circle cx="58" cy="34" r="23" />
          <circle cx="81" cy="48" r="18" />
          <rect x="29" y="45" width="58" height="21" rx="10.5" />
        </g>
        <g fill={fillNuvem}>
          <circle cx="35" cy="47" r="19" />
          <circle cx="58" cy="34" r="23" />
          <circle cx="81" cy="48" r="18" />
          <rect x="29" y="45" width="58" height="21" rx="10.5" />
        </g>
      </svg>

      <span
        className="relative z-10 mt-1.5 flex items-center justify-center"
        style={{ color: desbloqueada ? cor : "#8C96A8" }}
      >
        <Icone size={27} strokeWidth={2} aria-hidden="true" />
      </span>
    </div>
  );
}
