import { useState, useEffect, useRef } from "react";
import { CORES, FORMAS } from "../data/jogosData";
import { emb, pick } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import { tocarAcerto, tocarErro, tocarSelecao } from "../utils/sons";
import Casca from "../components/Casca";
import Arrasta from "../components/Arrasta";
import Forma from "../components/Forma";

function gerarTabuleiroEncaixe(total, idade) {
  const nivel = String(idade);
  const poolFormas = nivel === "8" ? FORMAS.slice(0, 6) : FORMAS;
  const extras = nivel === "10" ? 2 : nivel === "9" ? 1 : 0;
  const formasSelecionadas = pick(poolFormas, Math.min(poolFormas.length, total + extras));
  const coresSelecionadas = pick(CORES, formasSelecionadas.length);

  const pecasAtivas = formasSelecionadas.slice(0, total).map((f, i) => ({
    f,
    cor: coresSelecionadas[i].h,
  }));

  const buracosTodos = formasSelecionadas.map((f, i) => ({
    f,
    cor: nivel === "8" ? coresSelecionadas[i].h : "#4E6396",
    corReal: coresSelecionadas[i].h,
  }));

  return {
    pecas: emb(pecasAtivas),
    buracos: emb(buracosTodos),
    semDicaCor: nivel !== "8",
  };
}

export default function JogoEncaixe(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const [it] = useState(() => gerarTabuleiroEncaixe(total, idade));
  const [sel, setSel] = useState(null);
  const [feito, setFeito] = useState([]);
  const [tente, setTente] = useState(null);
  const [sobre, setSobre] = useState(null);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    falar("Arraste cada peça até o buraco com o mesmo formato.");
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const encaixar = (peca, alvo) => {
    if (!peca || !alvo || feito.includes(alvo)) return;
    if (peca === alvo) {
      setFeito((d) => [...d, alvo]);
      setAcertos((a) => a + 1);
      setSel(null);
      tocarAcerto();
      falar(`Encaixou! ${alvo}`);
    } else {
      setTente(alvo);
      setErros((x) => x + 1);
      tocarErro();
      falar("Tente de novo");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setTente(null), 700);
    }
  };

  return (
    <Casca
      {...p}
      titulo="Encaixe as formas"
      estrelas={feito.length}
      atrasoVitoria={900}
      estatisticas={{ acertos, erros }}
      fala={
        sel
          ? `Agora toque no buraco de ${sel} ou arraste!`
          : it.semDicaCor
            ? "Observe o contorno e encaixe cada forma!"
            : "Arraste cada peça até o buraco com o mesmo formato."
      }
    >
      <div className="encaixe-wrap">
        <div className="encaixe-secao encaixe-pecas">
          <p className="encaixe-rotulo">1. Escolha ou arraste uma peça</p>
          <div className="linha-grid">
            {it.pecas.map(({ f, cor }) => (
              <Arrasta
                key={f.n}
                label={`peça ${f.n}`}
                disabled={feito.includes(f.n)}
                onSobre={setSobre}
                className={`${sel === f.n ? "sel" : ""} ${
                  feito.includes(f.n) ? "feito" : ""
                }`}
                onToque={() => {
                  setSel(f.n);
                  tocarSelecao();
                  falar(f.n);
                }}
                onSolta={(a) => encaixar(f.n, a)}
              >
                <Forma f={f} cor={cor} />
              </Arrasta>
            ))}
          </div>
        </div>
        <div className={`encaixe-secao chao ${sel ? "alvos-ativos" : ""}`}>
          <p className="encaixe-rotulo">2. Encaixe no contorno igual</p>
          <div className="linha-grid">
            {it.buracos.map((b) => {
              const encaixado = feito.includes(b.f.n);
              return (
                <button
                  type="button"
                  key={b.f.n}
                  data-alvo={b.f.n}
                  disabled={encaixado}
                  aria-label={`buraco ${b.f.n}`}
                  className={`ficha buraco ${encaixado ? "certo" : ""} ${
                    tente === b.f.n ? "tente" : ""
                  } ${sobre === b.f.n ? "sobre" : ""}`}
                  onClick={() => encaixar(sel, b.f.n)}
                >
                  <Forma
                    f={b.f}
                    cor={encaixado ? b.corReal : b.cor}
                    oco={!encaixado}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Casca>
  );
}
