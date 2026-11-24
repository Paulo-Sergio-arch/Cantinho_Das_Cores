import { useState, useEffect, useRef } from "react";
import { FALA, FALA_9, FALA_10 } from "../data/jogosData";
import { pick } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import { tocarAcerto } from "../utils/sons";
import Casca from "../components/Casca";
import Pictograma from "../components/Pictograma";
import { IconFala, IconReiniciar, IconVozOn } from "../components/IconesUI";

function gerarListaFala(total, idade) {
  const nivel = String(idade);
  const fonte = nivel === "10" ? FALA_10 : nivel === "9" ? FALA_9 : FALA;
  return pick(fonte, Math.min(fonte.length, total));
}

export default function JogoFalar(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const [lista] = useState(() => gerarListaFala(total, idade));
  const [e, setE] = useState(0);
  const [ativa, setAtiva] = useState(-1);
  const [tocando, setTocando] = useState(false);
  const [ouviu, setOuviu] = useState(false);
  const [bloq, setBloq] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const timersRef = useRef([]);
  const w = lista[Math.min(e, lista.length - 1)];

  const limparTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    return () => limparTimers();
  }, []);

  const ouvir = () => {
    limparTimers();
    setTocando(true);
    w.s.forEach((s, i) => {
      const id = setTimeout(() => {
        setAtiva(i);
        falar(s.toLowerCase());
      }, i * 850);
      timersRef.current.push(id);
    });
    const idFim = setTimeout(() => {
      setAtiva(-1);
      falar(w.w);
      setTocando(false);
      setOuviu(true);
    }, w.s.length * 850 + 200);
    timersRef.current.push(idFim);
  };

  const falarSilaba = (silaba, idx) => {
    if (bloq || tocando) return;
    setAtiva(idx);
    falar(silaba.toLowerCase());
    const id = setTimeout(() => setAtiva(-1), 650);
    timersRef.current.push(id);
  };

  const falei = () => {
    if (bloq) return;
    limparTimers();
    setAtiva(-1);
    setTocando(false);
    setBloq(true);
    setAcertos((a) => a + 1);
    tocarAcerto();
    falar(`Muito bem! Você falou ${w.w}`);
    const id = setTimeout(() => {
      setE((x) => x + 1);
      setOuviu(false);
      setBloq(false);
    }, 1500);
    timersRef.current.push(id);
  };

  const praticarMais = () => {
    if (bloq) return;
    setErros((x) => x + 1);
    ouvir();
  };

  return (
    <Casca
      {...p}
      titulo="Vamos falar"
      estrelas={e}
      estatisticas={{ acertos, erros }}
      fala={
        ouviu
          ? `Agora é você! Fale: ${w.w}`
          : "Toque em ouvir ou clique em cada sílaba."
      }
    >
      <div className="fala-card">
        <div className="fala-ilustracao" aria-hidden="true">
          <Pictograma id={w.w} tam={86} />
        </div>
        <div className="palavra">{w.w}</div>
        <div className="silabas">
          {w.s.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => falarSilaba(s, i)}
              className={`silaba-btn ${i === ativa ? "ativa" : ""}`}
              aria-label={`Ouvir sílaba ${s}`}
            >
              <span>{s}</span>
              <IconVozOn size={15} className="silaba-ico" />
            </button>
          ))}
        </div>
        <p className="frase">“{w.f}”</p>
        <div className="acoes">
          <button
            type="button"
            className={`btn ${!ouviu && !tocando && !p.calmo ? "guia-pulsar" : ""}`}
            onClick={ouvir}
            disabled={bloq}
            aria-busy={tocando}
          >
            <IconVozOn size={20} />
            {tocando ? "Ouvindo..." : "Ouvir"}
          </button>
          <button
            type="button"
            className="btn ok"
            onClick={falei}
            disabled={!ouviu || bloq}
          >
            <IconFala size={20} />
            Eu falei!
          </button>
          {ouviu && !bloq && (
            <button
              type="button"
              className="btn sec"
              onClick={praticarMais}
            >
              <IconReiniciar size={19} />
              Repetir devagar
            </button>
          )}
        </div>
        {!ouviu && (
          <p className="dica-fala">
            Escute primeiro para liberar o botão verde.
          </p>
        )}
      </div>
    </Casca>
  );
}
