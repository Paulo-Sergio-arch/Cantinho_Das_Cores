import { cn } from "../lib/cn";

/**
 * Cenário ilustrado da marca (céu, sol suave, nuvens e colinas verdes).
 * - variant="suave": usado no Menu Infantil com saturação calma para não gerar sobrecarga sensorial.
 * - variant="login": usado no painel esquerdo do Login (posicionado localmente dentro do container).
 * - variant="vitoria": usado como recompensa visual gentil no cartão de conclusão de partida.
 */
export default function Fundo({ variant = "suave", className = "" }) {
  const local = variant === "login" || variant === "vitoria";
  const opacidadeCeu = variant === "suave" ? 0.62 : variant === "vitoria" ? 0.72 : 0.92;
  const opacidadeGrama = variant === "suave" ? 0.58 : variant === "vitoria" ? 0.72 : 0.92;

  return (
    <div
      className={cn(
        "fundo",
        local && "fundo-local",
        "alto-contraste:opacity-0",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="fundo-ceu"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMin slice"
        style={{ opacity: opacidadeCeu }}
      >
        <defs>
          <radialGradient id={`halo-sol-${variant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF7D6" stopOpacity="0.92" />
            <stop offset="55%" stopColor="#FCE39C" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="678" cy="86" r="76" fill={`url(#halo-sol-${variant})`} />
        <circle cx="678" cy="86" r="40" fill="#F8D878" />

        <g fill="#FFFFFF" opacity="0.86">
          <ellipse cx="118" cy="118" rx="54" ry="21" />
          <ellipse cx="150" cy="100" rx="34" ry="23" />
          <ellipse cx="90" cy="106" rx="28" ry="17" />

          <ellipse cx="486" cy="182" rx="46" ry="18" />
          <ellipse cx="514" cy="166" rx="30" ry="19" />

          <ellipse cx="176" cy="322" rx="44" ry="16" />
          <ellipse cx="202" cy="308" rx="26" ry="17" />

          <ellipse cx="672" cy="296" rx="48" ry="17" />
          <ellipse cx="646" cy="282" rx="28" ry="18" />
        </g>
      </svg>

      <svg
        className="fundo-grama"
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMax slice"
        style={{ opacity: opacidadeGrama }}
      >
        <path d="M0 78 Q180 18 400 68 T800 42 V200 H0Z" fill="#B6E1B4" />
        <path d="M0 122 Q220 72 460 116 T800 94 V200 H0Z" fill="#8CD29B" />
        <g opacity="0.75">
          {[
            [64, 158, "#E899B8"],
            [176, 140, "#F2CF6B"],
            [310, 162, "#E38B85"],
            [455, 144, "#FFFFFF"],
            [590, 164, "#AE9CE6"],
            [725, 146, "#EDAF74"],
          ].map(([x, y, c], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="6.5" fill={c} />
              <circle cx={x} cy={y} r="2.4" fill="#FFF6CC" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
