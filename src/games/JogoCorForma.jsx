import { useState, useEffect, useRef } from "react";
import { CORES, FORMAS } from "../data/jogosData";
import { emb, rnd } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import { tocarAcerto, tocarErro } from "../utils/sons";
import Casca from "../components/Casca";
import Forma from "../components/Forma";

function gerarRodada(idade) {
  const nivel = String(idade);
  const poolFormas = nivel === "8" ? FORMAS.slice(0, 6) : FORMAS;
  const f = rnd(poolFormas);
  const c = rnd(CORES);

  const outrasFormas = emb(poolFormas.filter((x) => x.n !== f.n));
  const f2 = outrasFormas[0];
  const f3 = outrasFormas[1] || outrasFormas[0];

  const coresDistintas = emb(
    CORES.filter((x) => x.n !== c.n && !c.evitar?.includes(x.n))
  );
  const coresProximas = emb(
    CORES.filter((x) => x.n !== c.n && c.evitar?.includes(x.n))
  );
  const outrasCores =
    nivel === "10"
      ? [...coresProximas, ...coresDistintas]
      : [...coresDistintas, ...coresProximas];

  const c2 = outrasCores[0];
  const c3 = outrasCores[1] || outrasCores[0];

  if (nivel === "8") {
    return {
      f,
      c,
      ops: emb([
        { f, c },
        { f, c: c2 },
        { f: f2, c },
        { f: f3, c: c3 },
      ]),
    };
  }

  if (nivel === "9") {
    const f4 = outrasFormas[2] || f2;
    const c4 = outrasCores[2] || c2;
    return {
      f,
      c,
      ops: emb([
        { f, c },
        { f, c: c2 },
        { f, c: c3 },
        { f: f2, c },
        { f: f3, c: c2 },
        { f: f4, c: c4 },
      ]),
    };
  }

  // Nível 10 anos: todos os distratores compartilham a cor OU a forma do alvo
  const c4 = outrasCores[2] || c2;
  const f4 = outrasFormas[2] || f2;
  return {
    f,
    c,
    ops: emb([
      { f, c },
      { f, c: c2 },
      { f, c: c3 },
      { f: f2, c },
      { f: f3, c },
      { f: f4, c: c4 === c ? c2 : c },
    ]),
  };
}

export default function JogoCorForma(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const [e, setE] = useState(0);
  const [r, setR] = useState(() => gerarRodada(idade));
  const [ok, setOk] = useState(null);
  const [tente, setTente] = useState(null);
  const [dica, setDica] = useState("");
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [errosRodada, setErrosRodada] = useState(0);
  const timersRef = useRef([]);

  const corAlvo = r.f.art === "o" ? r.c.n : r.c.f;
  const frase = `Toque ${r.f.art === "o" ? "no" : "na"} ${r.f.n} ${corAlvo}`;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (e < total) {
      falar(frase);
    }
  }, [frase, e, total]);

  const agendar = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  const escolher = (o) => {
    const k = `${o.f.n}-${o.c.n}`;
    if (ok) return;
    if (o.f.n === r.f.n && o.c.n === r.c.n) {
      setOk(k);
      setDica("");
      setErrosRodada(0);
      setAcertos((a) => a + 1);
      tocarAcerto();
      falar("Muito bem!");
      agendar(() => {
        const proximo = e + 1;
        setE(proximo);
        setOk(null);
        if (proximo < total) setR(gerarRodada(idade));
      }, 1400);
    } else {
      setTente(k);
      setErros((x) => x + 1);
      setErrosRodada((er) => er + 1);
      tocarErro();
      let textoDica = `Quase! Procure ${r.f.art} ${r.f.n} ${corAlvo}.`;
      if (o.f.n === r.f.n) {
        textoDica = `Quase! A forma está certa, mas procure a cor ${r.c.f}.`;
      } else if (o.c.n === r.c.n) {
        textoDica = `Quase! A cor está certa, mas procure ${r.f.art} ${r.f.n}.`;
      }
      setDica(textoDica);
      falar(textoDica);
      agendar(() => setTente(null), 700);
    }
  };

  const falaVisual = dica ? (
    dica
  ) : (
    <>
      Toque {r.f.art === "o" ? "no" : "na"} <strong>{r.f.n}</strong> <strong>{corAlvo}</strong>
    </>
  );

  return (
    <Casca
      {...p}
      titulo="Cor e forma"
      estrelas={e}
      estatisticas={{ acertos, erros }}
      fala={dica || frase}
      falaVisual={falaVisual}
    >
      <div className={`grade2 ${r.ops.length > 4 ? "grade3" : ""}`}>
        {r.ops.map((o) => {
          const k = `${o.f.n}-${o.c.n}`;
          const nomeCor = o.f.art === "o" ? o.c.n : o.c.f;
          const acertou = ok === k;
          const ehAlvo = o.f.n === r.f.n && o.c.n === r.c.n;
          const dicaAlvo = errosRodada >= 2 && ehAlvo && !ok;
          return (
            <button
              type="button"
              key={k}
              aria-label={`${o.f.n} ${nomeCor}`}
              className={`ficha ${acertou ? "certo" : ""} ${
                tente === k ? "tente" : ""
              } ${dicaAlvo && !p.calmo ? "guia-pulsar" : ""} ${
                errosRodada >= 2 && !ehAlvo && !ok ? "opacity-75" : ""
              }`}
              onClick={() => escolher(o)}
            >
              <Forma f={o.f} cor={o.c.h} tam={r.ops.length > 4 ? 80 : 96} />
              {acertou && (
                <span className="selo-ok-card" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Casca>
  );
}
