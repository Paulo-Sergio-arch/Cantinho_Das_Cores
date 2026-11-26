import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { CORES } from "../data/jogosData";
import { emb, pick, rnd } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import { tocarAcerto, tocarErro } from "../utils/sons";
import Casca from "../components/Casca";
import { cn } from "../lib/cn";

const ESTILO_COR = {
  vermelho: { bg: "#D9534F", sombra: "#B03B37", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.62)", forma: "triangulo" },
  azul: { bg: "#2B70D6", sombra: "#1E52A3", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.68)", forma: "quadrado" },
  amarelo: { bg: "#EAB938", sombra: "#C2941D", texto: "#1C2946", iconeFill: "#1C2946", forma: "hexagono" },
  verde: { bg: "#2D8A56", sombra: "#1E663D", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.62)", forma: "losango" },
  rosa: { bg: "#D66696", sombra: "#AC4873", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.68)", forma: "circulo" },
  laranja: { bg: "#DE8035", sombra: "#B3601E", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.68)", forma: "estrela" },
  roxo: { bg: "#7B61C9", sombra: "#5B44A3", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.68)", forma: "pentagono" },
  turquesa: { bg: "#249B92", sombra: "#18766F", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.68)", forma: "trianguloInv" },
  marrom: { bg: "#966544", sombra: "#734B30", texto: "#FFFFFF", iconeFill: "rgba(255,255,255,0.68)", forma: "trapezio" },
};

function FormaAuxiliar({ forma, fill }) {
  return (
    <svg
      viewBox="0 0 36 36"
      aria-hidden="true"
      className="h-6 w-6 shrink-0 sm:h-8 sm:w-8"
    >
      {forma === "triangulo" && <polygon points="18,4 33,31 3,31" fill={fill} />}
      {forma === "trianguloInv" && <polygon points="3,6 33,6 18,32" fill={fill} />}
      {forma === "quadrado" && <rect x="5" y="5" width="26" height="26" rx="3" fill={fill} />}
      {forma === "hexagono" && <polygon points="18,3 31,10.5 31,25.5 18,33 5,25.5 5,10.5" fill={fill} />}
      {forma === "losango" && <polygon points="18,2 34,18 18,34 2,18" fill={fill} />}
      {forma === "circulo" && <circle cx="18" cy="18" r="14" fill={fill} />}
      {forma === "estrela" && (
        <polygon points="18,3 22,13 33,14 25,21 27,32 18,26 9,32 11,21 3,14 14,13" fill={fill} />
      )}
      {forma === "pentagono" && <polygon points="18,3 33,14 27,31 9,31 3,14" fill={fill} />}
      {forma === "trapezio" && <polygon points="9,8 27,8 33,29 3,29" fill={fill} />}
    </svg>
  );
}

function capitalizar(texto = "") {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}

function gerarRodada(idade) {
  const nivel = String(idade);
  const qtd = nivel === "10" ? 5 : 4;
  const alvo = rnd(CORES);

  let outras;
  if (nivel === "10") {
    const parecidas = CORES.filter((c) => c.n !== alvo.n && alvo.evitar?.includes(c.n));
    const restantes = emb(
      CORES.filter((c) => c.n !== alvo.n && !parecidas.some((p) => p.n === c.n))
    );
    outras = [...emb(parecidas), ...restantes].slice(0, qtd - 1);
  } else if (nivel === "9") {
    outras = pick(
      CORES.filter((c) => c.n !== alvo.n),
      qtd - 1
    );
  } else {
    const distintas = CORES.filter((c) => c.n !== alvo.n && !alvo.evitar?.includes(c.n));
    const pool =
      distintas.length >= qtd - 1 ? distintas : CORES.filter((c) => c.n !== alvo.n);
    outras = pick(pool, qtd - 1);
  }

  return { alvo, ops: emb([alvo, ...outras]) };
}

export default function JogoCores(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const calmo = Boolean(p.calmo);
  const [e, setE] = useState(0);
  const [r, setR] = useState(() => gerarRodada(idade));
  const [ok, setOk] = useState(null);
  const [tente, setTente] = useState(null);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [errosRodada, setErrosRodada] = useState(0);
  const timersRef = useRef([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (e < total) {
      falar(`Toque na cor ${r.alvo.n}`);
    }
  }, [r, e, total]);

  const agendar = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  const escolher = (c) => {
    if (ok || !c) return;
    if (c.n === r.alvo.n) {
      setOk(c.n);
      setErrosRodada(0);
      setAcertos((a) => a + 1);
      tocarAcerto();
      falar(`Muito bem! ${c.n}`);
      agendar(() => {
        const proximo = e + 1;
        setE(proximo);
        setOk(null);
        if (proximo < total) setR(gerarRodada(idade));
      }, 1400);
    } else {
      setTente(c.n);
      setErros((x) => x + 1);
      setErrosRodada((er) => er + 1);
      tocarErro();
      falar("Tente de novo");
      agendar(() => setTente(null), 650);
    }
  };

  const nomeAlvo = capitalizar(r.alvo.n);

  return (
    <Casca
      {...p}
      titulo="Cores"
      estrelas={e}
      estatisticas={{ acertos, erros }}
      fala={`Toque na cor ${r.alvo.n}.`}
      falaVisual={
        <>
          Toque na cor <strong>{nomeAlvo}</strong>
        </>
      }
    >
      <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3 sm:gap-5">
        {r.ops.map((c, idx) => {
          const estilo = ESTILO_COR[c.n] || {
            bg: c.h,
            sombra: "rgba(31,45,77,0.28)",
            texto: "#FFFFFF",
            iconeFill: "rgba(255,255,255,0.65)",
            forma: "circulo",
          };
          const acertou = ok === c.n;
          const errou = tente === c.n;
          const dicaAlvo = errosRodada >= 2 && c.n === r.alvo.n && !ok;
          const centralizarUltimo = r.ops.length === 5 && idx === 4;

          return (
            <motion.button
              key={c.n}
              type="button"
              whileHover={calmo ? undefined : { y: -2 }}
              whileTap={calmo ? undefined : { y: 3, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              onClick={() => escolher(c)}
              aria-label={capitalizar(c.n)}
              style={{
                backgroundColor: estilo.bg,
                color: estilo.texto,
                boxShadow: `0 6px 0 ${estilo.sombra}`,
              }}
              className={cn(
                "relative flex min-h-[84px] sm:min-h-[112px] w-full items-center justify-center gap-2.5 sm:gap-4 rounded-[22px] sm:rounded-[28px] px-3 py-4 sm:px-6 sm:py-5 font-display text-lg sm:text-3xl font-semibold tracking-tight transition-[box-shadow,outline,transform,opacity]",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E9CE2] focus-visible:ring-offset-3 focus-visible:ring-offset-[#F5F3EC]",
                acertou && "ring-4 ring-[#6E9CE2] ring-offset-3 ring-offset-[#F5F3EC]",
                dicaAlvo && "ring-4 ring-[#E8B638] ring-offset-3 ring-offset-[#F5F3EC]",
                errosRodada >= 2 && c.n !== r.alvo.n && !ok && "opacity-75",
                errou && !calmo && "animate-[balanca_0.42s_ease]",
                centralizarUltimo && "col-span-2 mx-auto w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.625rem)]"
              )}
            >
              <FormaAuxiliar forma={estilo.forma} fill={estilo.iconeFill} />
              <span className="truncate">{capitalizar(c.n)}</span>

              {acertou && (
                <span
                  className="absolute right-2.5 top-2.5 sm:right-4 sm:top-4 inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-success shadow-xs"
                  aria-hidden="true"
                >
                  <Check size={17} strokeWidth={3} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </Casca>
  );
}
