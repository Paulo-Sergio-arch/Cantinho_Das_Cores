import { useState, useEffect, useRef } from "react";
import { CORES } from "../data/jogosData";
import { emb, pick, rnd } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import { tocarAcerto, tocarErro } from "../utils/sons";
import Casca from "../components/Casca";
import Arrasta from "../components/Arrasta";
import { IconSetaDireita } from "../components/IconesUI";

function gerarRodada(idade) {
  const nivel = String(idade);
  const qtd = nivel === "10" ? 5 : nivel === "9" ? 4 : 3;
  const alvo = rnd(CORES);

  let outras;
  if (nivel === "10") {
    const parecidas = CORES.filter(
      (c) => c.n !== alvo.n && alvo.evitar?.includes(c.n)
    );
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
    const distintas = CORES.filter(
      (c) => c.n !== alvo.n && !alvo.evitar?.includes(c.n)
    );
    const pool =
      distintas.length >= qtd - 1 ? distintas : CORES.filter((c) => c.n !== alvo.n);
    outras = pick(pool, qtd - 1);
  }

  return { alvo, ops: emb([alvo, ...outras]) };
}

export default function JogoCores(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const mostrarNomes = Boolean(p.altoContraste);
  const [e, setE] = useState(0);
  const [r, setR] = useState(() => gerarRodada(idade));
  const [ok, setOk] = useState(null);
  const [tente, setTente] = useState(null);
  const [sobre, setSobre] = useState(null);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const timersRef = useRef([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (e < total) {
      falar(`Onde está o ${r.alvo.n}?`);
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
      setAcertos((a) => a + 1);
      tocarAcerto();
      falar(`Muito bem! ${c.n}`);
      agendar(() => {
        const proximo = e + 1;
        setE(proximo);
        setOk(null);
        if (proximo < total) setR(gerarRodada(idade));
      }, 1500);
    } else {
      setTente(c.n);
      setErros((x) => x + 1);
      tocarErro();
      falar("Tente de novo");
      agendar(() => setTente(null), 700);
    }
  };

  return (
    <Casca
      {...p}
      titulo="Acerte a cor"
      estrelas={e}
      estatisticas={{ acertos, erros }}
      fala={`Arraste a bolinha até o ${r.alvo.n}.`}
      falaVisual={
        <>
          Arraste a bolinha até o <strong>{r.alvo.n}</strong>.
        </>
      }
    >
      <div className={`cores ${r.ops.length >= 4 ? "cores-muitas" : ""}`}>
        <div className="alvo">
          <span className="anel">
            <Arrasta
              cru
              label={`bolinha ${r.alvo.n}`}
              onToque={() => falar(r.alvo.n)}
              onSolta={(a) => escolher(r.ops.find((c) => c.n === a))}
              onSobre={setSobre}
            >
              <i className="bola" style={{ background: r.alvo.h }} />
            </Arrasta>
          </span>
          {mostrarNomes && <span className="bola-nome">{r.alvo.n}</span>}
          <span className="cores-seta" aria-hidden="true">
            <IconSetaDireita size={24} />
          </span>
        </div>
        <div className="opcoes">
          {r.ops.map((c) => {
            const acertou = ok === c.n;
            return (
              <button
                type="button"
                key={c.n}
                data-alvo={c.n}
                aria-label={c.n}
                className={`ficha ficha-cor ${acertou ? "certo" : ""} ${
                  tente === c.n ? "tente" : ""
                } ${sobre === c.n ? "sobre" : ""}`}
                onClick={() => escolher(c)}
              >
                <i className="bola" style={{ background: c.h }}>
                  {acertou && (
                    <span className="bola-ok" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </i>
                {(acertou || mostrarNomes) && (
                  <span className="bola-nome">{c.n}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Casca>
  );
}
