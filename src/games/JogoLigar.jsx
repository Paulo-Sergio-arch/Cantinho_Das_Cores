import { useState, useEffect, useRef } from "react";
import { PALAVRAS, PALAVRAS_9, PALAVRAS_10, PASTEIS } from "../data/jogosData";
import { emb, pick } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import { tocarAcerto, tocarErro, tocarSelecao } from "../utils/sons";
import Casca from "../components/Casca";
import Arrasta from "../components/Arrasta";
import Pictograma from "../components/Pictograma";

function gerarParesPorIdade(total, idade) {
  const nivel = String(idade);
  const fonte =
    nivel === "10" ? PALAVRAS_10 : nivel === "9" ? PALAVRAS_9 : PALAVRAS;
  const extras = nivel === "10" ? 2 : nivel === "9" ? 1 : 0;

  const selecionadas = pick(fonte, Math.min(fonte.length, total + extras)).map((x, i) => ({
    ...x,
    bg: PASTEIS[i % PASTEIS.length],
  }));

  const ativas = selecionadas.slice(0, total);
  return {
    esq: emb(ativas),
    dir: emb(selecionadas),
  };
}

export default function JogoLigar(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const [it] = useState(() => gerarParesPorIdade(total, idade));
  const [sel, setSel] = useState(null);
  const [feito, setFeito] = useState([]);
  const [tente, setTente] = useState(null);
  const [sobre, setSobre] = useState(null);
  const [lida, setLida] = useState(null);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [errosItem, setErrosItem] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    falar("Arraste o desenho até o nome dele.");
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const agendar = (fn, ms) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  };

  const ligar = (desenho, palavra) => {
    if (!palavra || feito.includes(palavra)) return;
    if (!desenho) {
      setTente(null);
      setLida(palavra);
      tocarSelecao();
      falar(palavra);
      agendar(() => setLida(null), 650);
      return;
    }
    if (desenho === palavra) {
      setLida(null);
      setTente(null);
      setErrosItem(0);
      setFeito((d) => [...d, palavra]);
      setAcertos((a) => a + 1);
      setSel(null);
      tocarAcerto();
      falar(`Isso! ${palavra}`);
    } else {
      setLida(null);
      setTente(palavra);
      setErros((x) => x + 1);
      setErrosItem((ei) => ei + 1);
      setSel(desenho);
      tocarErro();
      falar("Tente de novo");
      agendar(() => setTente(null), 700);
    }
  };

  return (
    <Casca
      {...p}
      titulo="Ligue ao nome"
      estrelas={feito.length}
      atrasoVitoria={900}
      estatisticas={{ acertos, erros }}
      fala={
        sel
          ? `Agora toque no nome de "${sel}" ou arraste!`
          : "Arraste o desenho até o nome dele."
      }
    >
      <div className="ligar">
        <div className="col">
          {it.esq.map((x) => {
            const indicePar = feito.indexOf(x.id);
            const pareado = indicePar !== -1;
            return (
              <Arrasta
                key={x.id}
                label={pareado ? `desenho ${x.id}, par ${indicePar + 1} concluído` : `desenho ${x.id}`}
                disabled={pareado}
                onSobre={setSobre}
                className={`${sel === x.id ? "sel" : ""} ${pareado ? "par" : ""}`}
                style={pareado ? { background: x.bg } : undefined}
                onToque={() => {
                  if (sel !== x.id) setErrosItem(0);
                  setSel(x.id);
                  tocarSelecao();
                  falar(x.id);
                }}
                onSolta={(a) => ligar(x.id, a)}
              >
                <Pictograma id={x.id} tam={50} />
                {pareado && (
                  <span className="par-selo" aria-hidden="true">
                    ✓ {indicePar + 1}
                  </span>
                )}
              </Arrasta>
            );
          })}
        </div>
        <div className={`col ${sel ? "alvos-ativos" : ""}`}>
          {it.dir.map((x) => {
            const indicePar = feito.indexOf(x.id);
            const pareado = indicePar !== -1;
            const dicaAlvo = errosItem >= 2 && sel === x.id && !pareado;
            return (
              <button
                type="button"
                key={x.id}
                data-alvo={x.id}
                disabled={pareado}
                aria-label={pareado ? `${x.id}, par ${indicePar + 1} concluído` : `ouvir ou ligar ${x.id}`}
                className={`ficha ${sobre === x.id || dicaAlvo ? "sobre" : ""} ${
                  tente === x.id ? "tente" : ""
                } ${lida === x.id ? "sel" : ""} ${pareado ? "par" : ""} ${
                  errosItem >= 2 && sel && sel !== x.id && !pareado ? "opacity-75" : ""
                }`}
                style={pareado ? { background: x.bg } : undefined}
                onClick={() => ligar(sel, x.id)}
              >
                <span className="pal">{x.id}</span>
                {pareado && (
                  <span className="par-selo" aria-hidden="true">
                    ✓ {indicePar + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Casca>
  );
}
