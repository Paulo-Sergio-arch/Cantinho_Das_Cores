import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2 } from "lucide-react";
import { PALAVRAS, PALAVRAS_9, PALAVRAS_10, PASTEIS } from "../data/jogosData";
import { emb, pick } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import { tocarAcerto, tocarErro, tocarSelecao } from "../utils/sons";
import Casca from "../components/Casca";
import Arrasta from "../components/Arrasta";
import Pictograma from "../components/Pictograma";

const CORES_FIOS = ["#2F6FD6", "#2D8A56", "#D67456", "#7E64C4", "#C88E26"];

function gerarParesPorIdade(total, idade) {
  const nivel = String(idade);
  const fonte =
    nivel === "10" ? PALAVRAS_10 : nivel === "9" ? PALAVRAS_9 : PALAVRAS;
  const extras = nivel === "10" ? 2 : nivel === "9" ? 1 : 0;

  const selecionadas = pick(fonte, Math.min(fonte.length, total + extras)).map(
    (x, i) => ({
      ...x,
      bg: PASTEIS[i % PASTEIS.length],
      corFio: CORES_FIOS[i % CORES_FIOS.length],
    })
  );

  const ativas = selecionadas.slice(0, total);
  return {
    esq: emb(ativas),
    dir: emb(selecionadas),
  };
}

function criarCurvaConexao(x1, y1, x2, y2) {
  const dx = Math.max(24, Math.abs(x2 - x1) * 0.42);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function JogoLigar(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const [it] = useState(() => gerarParesPorIdade(total, idade));
  const [selEsq, setSelEsq] = useState(null);
  const [selDir, setSelDir] = useState(null);
  const [feito, setFeito] = useState([]);
  const [tenteEsq, setTenteEsq] = useState(null);
  const [tenteDir, setTenteDir] = useState(null);
  const [sobre, setSobre] = useState(null);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [errosItem, setErrosItem] = useState(0);
  const [linhasPares, setLinhasPares] = useState([]);
  const [fioAtivo, setFioAtivo] = useState(null);

  const palcoRef = useRef(null);
  const origemEsqRefs = useRef({});
  const destinoDirRefs = useRef({});
  const timerRef = useRef(null);

  useEffect(() => {
    falar("Toque ou arraste para ligar cada desenho ao nome dele.");
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const agendar = (fn, ms) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  };

  // Calcula as coordenadas relativas ao palco para desenhar as linhas SVG dos pares já conectados
  const recalcularLinhas = useCallback(() => {
    const palco = palcoRef.current;
    if (!palco) return;
    const rectPalco = palco.getBoundingClientRect();
    const novas = [];

    feito.forEach((id, idx) => {
      const elEsq = origemEsqRefs.current[id];
      const elDir = destinoDirRefs.current[id];
      if (!elEsq || !elDir) return;
      const rE = elEsq.getBoundingClientRect();
      const rD = elDir.getBoundingClientRect();
      const itemInfo = it.esq.find((x) => x.id === id);

      novas.push({
        id,
        ordem: idx + 1,
        cor: itemInfo?.corFio || "#2D8A56",
        x1: rE.left + rE.width / 2 - rectPalco.left,
        y1: rE.top + rE.height / 2 - rectPalco.top,
        x2: rD.left + rD.width / 2 - rectPalco.left,
        y2: rD.top + rD.height / 2 - rectPalco.top,
      });
    });

    setLinhasPares(novas);
  }, [feito, it.esq]);

  useEffect(() => {
    recalcularLinhas();
    window.addEventListener("resize", recalcularLinhas);
    return () => window.removeEventListener("resize", recalcularLinhas);
  }, [recalcularLinhas]);

  const confirmarPar = (desenhoId, palavraId) => {
    if (!desenhoId || !palavraId) return;
    if (feito.includes(desenhoId) || feito.includes(palavraId)) return;

    if (desenhoId === palavraId) {
      setTenteEsq(null);
      setTenteDir(null);
      setErrosItem(0);
      setSelEsq(null);
      setSelDir(null);
      setFioAtivo(null);
      setFeito((d) => [...d, palavraId]);
      setAcertos((a) => a + 1);
      tocarAcerto();
      falar(`Isso! ${palavraId}`);
    } else {
      setTenteEsq(desenhoId);
      setTenteDir(palavraId);
      setErros((x) => x + 1);
      setErrosItem((ei) => ei + 1);
      setFioAtivo(null);
      tocarErro();
      falar("Tente de novo");
      agendar(() => {
        setTenteEsq(null);
        setTenteDir(null);
      }, 650);
    }
  };

  const tocarDesenho = (id) => {
    if (feito.includes(id)) return;
    setTenteEsq(null);
    setTenteDir(null);

    // Se já havia uma palavra selecionada na direita, tenta ligar imediatamente!
    if (selDir) {
      confirmarPar(id, selDir);
      return;
    }

    // Se clicou no mesmo desenho já selecionado, desmarca
    if (selEsq === id) {
      setSelEsq(null);
      return;
    }

    if (selEsq !== id) setErrosItem(0);
    setSelEsq(id);
    tocarSelecao();
    falar(id);
  };

  const tocarPalavra = (id) => {
    if (feito.includes(id)) return;
    setTenteEsq(null);
    setTenteDir(null);

    // Se já havia um desenho selecionado na esquerda, tenta ligar imediatamente!
    if (selEsq) {
      confirmarPar(selEsq, id);
      return;
    }

    // Caso contrário, seleciona a palavra na direita (permite ligar da direita para a esquerda também!)
    if (selDir === id) {
      setSelDir(null);
      falar(id);
      return;
    }

    setSelDir(id);
    tocarSelecao();
    falar(id);
  };

  const atualizarFioArraste = (idEsq, coords) => {
    if (!coords || !palcoRef.current) {
      setFioAtivo(null);
      return;
    }
    const elEsq = origemEsqRefs.current[idEsq];
    if (!elEsq) return;
    const rectPalco = palcoRef.current.getBoundingClientRect();
    const rE = elEsq.getBoundingClientRect();
    setFioAtivo({
      x1: rE.left + rE.width / 2 - rectPalco.left,
      y1: rE.top + rE.height / 2 - rectPalco.top,
      x2: coords.clientX - rectPalco.left,
      y2: coords.clientY - rectPalco.top,
    });
  };

  const falaAtual = selEsq
    ? `Agora toque no nome de "${selEsq}" ou arraste até ele!`
    : selDir
      ? `Agora toque no desenho de "${selDir}"!`
      : "Toque ou arraste para ligar cada desenho ao nome dele.";

  return (
    <Casca
      {...p}
      titulo="Ligue ao nome"
      estrelas={feito.length}
      atrasoVitoria={900}
      estatisticas={{ acertos, erros }}
      palcoClassName="max-w-4xl"
      fala={falaAtual}
    >
      {/* PALCO SOLTO E SEM CAIXA EXTERNA — Blocos flutuam direto no cenário sem precisar de scroll */}
      <div
        ref={palcoRef}
        className="ligar-palco-solto"
        aria-label="Área interativa de ligar desenhos aos nomes"
      >
        {/* CAMADA SVG DE FIOS DE CONEXÃO (Pares conectados + fio elástico ao arrastar) */}
        <svg className="ligar-fios-svg" aria-hidden="true">
          {linhasPares.map((l) => (
            <g key={l.id}>
              <path
                d={criarCurvaConexao(l.x1, l.y1, l.x2, l.y2)}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d={criarCurvaConexao(l.x1, l.y1, l.x2, l.y2)}
                fill="none"
                stroke={l.cor}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx={l.x1} cy={l.y1} r="5.5" fill={l.cor} stroke="#FFFFFF" strokeWidth="2" />
              <circle cx={l.x2} cy={l.y2} r="5.5" fill={l.cor} stroke="#FFFFFF" strokeWidth="2" />
            </g>
          ))}

          {fioAtivo && (
            <g>
              <path
                d={criarCurvaConexao(fioAtivo.x1, fioAtivo.y1, fioAtivo.x2, fioAtivo.y2)}
                fill="none"
                stroke="#2F6FD6"
                strokeWidth="3.5"
                strokeDasharray="7 6"
                strokeLinecap="round"
              />
              <circle cx={fioAtivo.x1} cy={fioAtivo.y1} r="5" fill="#2F6FD6" />
              <circle cx={fioAtivo.x2} cy={fioAtivo.y2} r="6" fill="#2F6FD6" opacity="0.7" />
            </g>
          )}
        </svg>

        {/* COLUNA ESQUERDA: BLOCOS DE DESENHOS SOLTOS */}
        <div className={`ligar-coluna ${selDir ? "alvos-ativos" : ""}`}>
          {it.esq.map((x) => {
            const indicePar = feito.indexOf(x.id);
            const pareado = indicePar !== -1;
            const selecionado = selEsq === x.id;
            const errou = tenteEsq === x.id;
            const dicaAlvo = errosItem >= 2 && selDir === x.id && !pareado;

            return (
              <div key={x.id} className="ligar-item-wrap">
                <Arrasta
                  dataEsq={x.id}
                  label={
                    pareado
                      ? `desenho ${x.id}, par ${indicePar + 1} concluído`
                      : `desenho ${x.id}`
                  }
                  disabled={pareado}
                  onSobre={setSobre}
                  onMovimento={(coords) => atualizarFioArraste(x.id, coords)}
                  className={`ligar-bloco ligar-bloco-esq ${
                    selecionado ? "sel" : ""
                  } ${errou ? "tente" : ""} ${dicaAlvo ? "sobre" : ""} ${
                    pareado ? "par" : ""
                  }`}
                  style={
                    pareado
                      ? { background: x.bg, borderColor: x.corFio }
                      : undefined
                  }
                  onToque={() => tocarDesenho(x.id)}
                  onSolta={(alvo) => {
                    setFioAtivo(null);
                    if (alvo) confirmarPar(x.id, alvo);
                  }}
                >
                  <Pictograma id={x.id} tam={40} />
                  {pareado && (
                    <span
                      className="par-selo"
                      style={{ backgroundColor: x.corFio }}
                      aria-hidden="true"
                    >
                      ✓ {indicePar + 1}
                    </span>
                  )}
                </Arrasta>

                {/* Pino conector direito do bloco de desenho */}
                <span
                  ref={(el) => {
                    origemEsqRefs.current[x.id] = el;
                  }}
                  className={`ligar-pino ligar-pino-dir ${
                    selecionado ? "ativo" : ""
                  } ${pareado ? "conectado" : ""}`}
                  style={
                    pareado
                      ? { backgroundColor: x.corFio, borderColor: "#FFFFFF" }
                      : undefined
                  }
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>

        {/* COLUNA DIREITA: BLOCOS DE PALAVRAS SOLTOS */}
        <div className={`ligar-coluna ${selEsq ? "alvos-ativos" : ""}`}>
          {it.dir.map((x) => {
            const indicePar = feito.indexOf(x.id);
            const pareado = indicePar !== -1;
            const selecionado = selDir === x.id;
            const errou = tenteDir === x.id;
            const dicaAlvo = errosItem >= 2 && selEsq === x.id && !pareado;

            return (
              <div key={x.id} className="ligar-item-wrap">
                {/* Pino conector esquerdo do bloco de palavra */}
                <span
                  ref={(el) => {
                    destinoDirRefs.current[x.id] = el;
                  }}
                  className={`ligar-pino ligar-pino-esq ${
                    selecionado || sobre === x.id ? "ativo" : ""
                  } ${pareado ? "conectado" : ""}`}
                  style={
                    pareado
                      ? { backgroundColor: x.corFio, borderColor: "#FFFFFF" }
                      : undefined
                  }
                  aria-hidden="true"
                />

                <button
                  type="button"
                  data-alvo={x.id}
                  disabled={pareado}
                  aria-label={
                    pareado
                      ? `${x.id}, par ${indicePar + 1} concluído`
                      : `ligar ou ouvir ${x.id}`
                  }
                  className={`ficha ligar-bloco ligar-bloco-dir ${
                    sobre === x.id || dicaAlvo ? "sobre" : ""
                  } ${errou ? "tente" : ""} ${selecionado ? "sel" : ""} ${
                    pareado ? "par" : ""
                  } ${
                    errosItem >= 2 && selEsq && selEsq !== x.id && !pareado
                      ? "opacity-75"
                      : ""
                  }`}
                  style={
                    pareado
                      ? { background: x.bg, borderColor: x.corFio }
                      : undefined
                  }
                  onClick={() => tocarPalavra(x.id)}
                >
                  <span className="pal">{x.id}</span>

                  {!pareado && (
                    <span
                      role="button"
                      tabIndex={-1}
                      aria-label={`Ouvir palavra ${x.id}`}
                      title="Ouvir palavra"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        tocarSelecao();
                        falar(x.id);
                      }}
                      className="ligar-audio-chip"
                    >
                      <Volume2 size={14} aria-hidden="true" />
                    </span>
                  )}

                  {pareado && (
                    <span
                      className="par-selo"
                      style={{ backgroundColor: x.corFio }}
                      aria-hidden="true"
                    >
                      ✓ {indicePar + 1}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Casca>
  );
}
