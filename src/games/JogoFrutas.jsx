import { useState, useEffect, useRef, useMemo } from "react";
import { FRUTAS } from "../data/jogosData";
import { emb, rnd } from "../utils/aleatorio";
import { falar } from "../utils/voz";
import {
  tocarAcerto,
  tocarCombo,
  tocarErro,
  tocarQuadrado,
  tocarSelecao,
} from "../utils/sons";
import Casca from "../components/Casca";
import BloquinhoFruta from "../components/BloquinhoFruta";
import { IconCheck } from "../components/IconesUI";

function obterConfigFrutas(idade, total) {
  const nivel = String(idade);
  if (nivel === "10") {
    return {
      tamanho: 6,
      qtdFrutas: 5,
      qtdMetas: total <= 3 ? 3 : 4,
      metaBase: total <= 3 ? 8 : 9,
      jogadas: 18,
    };
  }
  if (nivel === "9") {
    return {
      tamanho: 6,
      qtdFrutas: 4,
      qtdMetas: 3,
      metaBase: total <= 3 ? 7 : 9,
      jogadas: 16,
    };
  }
  return {
    tamanho: 5,
    qtdFrutas: 4,
    qtdMetas: total <= 3 ? 2 : 3,
    metaBase: total <= 3 ? 6 : 7,
    jogadas: 15,
  };
}

function saoVizinhos(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

function temJogadaPossivel(grid) {
  const n = grid.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const id = grid[r][c]?.frutaId;
      if (!id) continue;
      if (r + 1 < n && grid[r + 1][c]?.frutaId === id) return true;
      if (c + 1 < n && grid[r][c + 1]?.frutaId === id) return true;
    }
  }
  return false;
}

let seqCelula = 1;
const proximaChave = () => seqCelula++;

function criarGridInicial(tamanho, pool) {
  const gerar = () =>
    Array.from({ length: tamanho }, () =>
      Array.from({ length: tamanho }, () => ({
        key: proximaChave(),
        frutaId: rnd(pool).id,
        nova: false,
      }))
    );

  let grid = gerar();
  for (let tentativa = 0; tentativa < 8 && !temJogadaPossivel(grid); tentativa++) {
    grid = gerar();
  }
  if (!temJogadaPossivel(grid) && tamanho >= 2) {
    grid[0][1] = { ...grid[0][1], frutaId: grid[0][0].frutaId };
  }
  return grid;
}

function embaralharGrid(grid) {
  const n = grid.length;
  const ids = emb(grid.flat().map((c) => c.frutaId));
  const novo = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (__, c) => ({
      key: proximaChave(),
      frutaId: ids[r * n + c],
      nova: true,
    }))
  );
  if (!temJogadaPossivel(novo) && n >= 2) {
    novo[0][1] = { ...novo[0][1], frutaId: novo[0][0].frutaId };
  }
  return novo;
}

export default function JogoFrutas(p) {
  const total = p.total ?? 5;
  const idade = p.idade ?? "8";
  const cfg = useMemo(() => obterConfigFrutas(idade, total), [idade, total]);
  const poolFrutas = useMemo(() => FRUTAS.slice(0, cfg.qtdFrutas), [cfg.qtdFrutas]);
  const mapaFrutas = useMemo(
    () => Object.fromEntries(FRUTAS.map((f) => [f.id, f])),
    []
  );

  const [grid, setGrid] = useState(() =>
    criarGridInicial(cfg.tamanho, poolFrutas)
  );
  const [metas] = useState(() => {
    const escolhidas = emb(poolFrutas).slice(0, cfg.qtdMetas);
    return escolhidas.map((f) => ({
      id: f.id,
      nome: f.nome,
      cor: f.cor,
      alvo: cfg.metaBase,
    }));
  });
  const [coletado, setColetado] = useState({});
  const [jogadas, setJogadas] = useState(cfg.jogadas);
  const [cadeia, setCadeia] = useState([]);
  const [pontoFechamento, setPontoFechamento] = useState(null);
  const [quadrado, setQuadrado] = useState(false);
  const [tenteChave, setTenteChave] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [quadradosFechados, setQuadradosFechados] = useState(0);

  const boardRef = useRef(null);
  const draggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const cadeiaRef = useRef([]);
  const quadradoRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    falar("Ligue duas ou mais frutinhas iguais para colher!");
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const sincronizarCadeia = (proxima, quad = false, fechamento = null) => {
    cadeiaRef.current = proxima;
    quadradoRef.current = quad;
    setCadeia(proxima);
    setQuadrado(quad);
    setPontoFechamento(fechamento);
  };

  const progressoTotal = metas.reduce(
    (s, m) => s + Math.min(coletado[m.id] || 0, m.alvo),
    0
  );
  const metaTotal = metas.reduce((s, m) => s + m.alvo, 0);
  const metasConcluidas = metas.filter((m) => (coletado[m.id] || 0) >= m.alvo).length;
  const concluiuTudo = metaTotal > 0 && progressoTotal >= metaTotal;
  const estrelas = concluiuTudo
    ? total
    : Math.min(total - 1, Math.floor((progressoTotal / Math.max(1, metaTotal)) * total));

  const frutaAtivaId = cadeia.length ? grid[cadeia[0].r]?.[cadeia[0].c]?.frutaId : null;
  const frutaAtiva = frutaAtivaId ? mapaFrutas[frutaAtivaId] : null;
  const semJogadas = !concluiuTudo && jogadas <= 0;

  const avisarErroSuave = (texto, chave = null) => {
    setErros((x) => x + 1);
    setMensagem(texto);
    setTenteChave(chave);
    tocarErro();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTenteChave(null);
    }, 650);
  };

  const aplicarColheita = (listaCadeia, foiQuadrado) => {
    if (listaCadeia.length < 2 || concluiuTudo || semJogadas) return;

    const baseId = grid[listaCadeia[0].r][listaCadeia[0].c].frutaId;
    const frutaInfo = mapaFrutas[baseId];
    const removerSet = new Set();

    if (foiQuadrado) {
      for (let r = 0; r < cfg.tamanho; r++) {
        for (let c = 0; c < cfg.tamanho; c++) {
          if (grid[r][c].frutaId === baseId) {
            removerSet.add(`${r}-${c}`);
          }
        }
      }
    } else {
      for (const pos of listaCadeia) {
        removerSet.add(`${pos.r}-${pos.c}`);
      }
    }

    const qtdColhida = removerSet.size;
    const novoGrid = Array.from({ length: cfg.tamanho }, () =>
      Array(cfg.tamanho).fill(null)
    );

    for (let c = 0; c < cfg.tamanho; c++) {
      const sobreviventes = [];
      for (let r = cfg.tamanho - 1; r >= 0; r--) {
        if (!removerSet.has(`${r}-${c}`)) {
          sobreviventes.push({ ...grid[r][c], nova: false });
        }
      }
      let idx = 0;
      for (let r = cfg.tamanho - 1; r >= 0; r--) {
        if (idx < sobreviventes.length) {
          novoGrid[r][c] = sobreviventes[idx++];
        } else {
          novoGrid[r][c] = {
            key: proximaChave(),
            frutaId: rnd(poolFrutas).id,
            nova: true,
          };
        }
      }
    }

    let gridFinal = novoGrid;
    let misturou = false;
    if (!temJogadaPossivel(gridFinal)) {
      gridFinal = embaralharGrid(gridFinal);
      misturou = true;
    }

    setGrid(gridFinal);
    setAcertos((a) => a + 1);
    setJogadas((j) => Math.max(0, j - 1));
    setColetado((prev) => ({
      ...prev,
      [baseId]: (prev[baseId] || 0) + qtdColhida,
    }));
    sincronizarCadeia([], false, null);

    if (foiQuadrado) {
      setQuadradosFechados((q) => q + 1);
      tocarQuadrado();
      const txt = `Quadrado mágico! Colheu ${qtdColhida} de ${frutaInfo.nome}!`;
      setMensagem(txt);
      falar(`Quadrado! Muito bem!`);
    } else {
      tocarAcerto();
      const txt = misturou
        ? `Colheu ${qtdColhida} ${frutaInfo.nome}! Misturando o tabuleiro.`
        : `Boa! Colheu ${qtdColhida} ${frutaInfo.nome}.`;
      setMensagem(txt);
      if (qtdColhida >= 4) {
        falar(`Incrível! ${qtdColhida} ${frutaInfo.nome}`);
      }
    }
  };

  const celulaNoPonteiro = (clientX, clientY) => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const c = Math.min(
      cfg.tamanho - 1,
      Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * cfg.tamanho))
    );
    const r = Math.min(
      cfg.tamanho - 1,
      Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * cfg.tamanho))
    );
    return { r, c };
  };

  const tentarEstenderCadeia = (pos, modoToque = false) => {
    const atual = cadeiaRef.current;
    if (!pos) return;
    const celula = grid[pos.r]?.[pos.c];
    if (!celula) return;

    if (!atual.length) {
      sincronizarCadeia([pos], false, null);
      if (modoToque) tocarSelecao();
      else tocarCombo(0);
      return;
    }

    const primeiro = atual[0];
    const tipoCadeia = grid[primeiro.r]?.[primeiro.c]?.frutaId;
    const ultimo = atual[atual.length - 1];

    // Clicar no último item no modo toque confirma (se >= 2) ou desmarca
    if (pos.r === ultimo.r && pos.c === ultimo.c) {
      if (modoToque) {
        if (atual.length >= 2) {
          aplicarColheita(atual, quadradoRef.current);
        } else {
          sincronizarCadeia([], false, null);
        }
      }
      return;
    }

    // Voltar um passo (desfazer última ligação)
    if (atual.length >= 2) {
      const penultimo = atual[atual.length - 2];
      if (pos.r === penultimo.r && pos.c === penultimo.c) {
        const reduzida = atual.slice(0, -1);
        sincronizarCadeia(reduzida, false, null);
        tocarCombo(Math.max(0, reduzida.length - 1));
        return;
      }
    }

    // Se já fechou quadrado no arraste, não adiciona além do fechamento
    if (quadradoRef.current && !modoToque) return;

    // Verificar se é vizinho ortogonal da mesma fruta
    if (saoVizinhos(ultimo, pos)) {
      if (celula.frutaId === tipoCadeia) {
        const idxExistente = atual.findIndex((p0) => p0.r === pos.r && p0.c === pos.c);
        if (idxExistente !== -1) {
          // Fechou um ciclo de tamanho >= 4 (Quadrado estilo Dots!)
          if (atual.length >= 4 && idxExistente <= atual.length - 3) {
            sincronizarCadeia(atual, true, pos);
            tocarQuadrado();
            setMensagem("Quadrado fechado! Solte para colher todas dessa fruta!");
          }
          return;
        }
        const proxima = [...atual, pos];
        sincronizarCadeia(proxima, false, null);
        tocarCombo(proxima.length - 1);
      } else if (modoToque) {
        avisarErroSuave("Ops! Ligue apenas frutinhas iguais vizinhas.", celula.key);
      }
      return;
    }

    // No modo toque em célula distante, inicia nova seleção na fruta tocada
    if (modoToque) {
      sincronizarCadeia([pos], false, null);
      tocarSelecao();
    }
  };

  const handlePointerDown = (e) => {
    if (concluiuTudo || semJogadas) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const pos = celulaNoPonteiro(e.clientX, e.clientY);
    if (!pos) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignora se o navegador não suportar pointer capture
    }

    draggingRef.current = true;
    dragMovedRef.current = false;

    const atual = cadeiaRef.current;
    // Se já havia seleção por toque, mantém caso esteja continuando; senão começa nova
    if (!atual.length) {
      sincronizarCadeia([pos], false, null);
      tocarCombo(0);
    } else {
      const ultimo = atual[atual.length - 1];
      const tipoCadeia = grid[atual[0].r]?.[atual[0].c]?.frutaId;
      const clicouIgualVizinho =
        saoVizinhos(ultimo, pos) && grid[pos.r]?.[pos.c]?.frutaId === tipoCadeia;
      const clicouUltimo = pos.r === ultimo.r && pos.c === ultimo.c;
      if (!clicouIgualVizinho && !clicouUltimo) {
        // Deixa pointerUp decidir como toque único
        dragMovedRef.current = false;
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const pos = celulaNoPonteiro(e.clientX, e.clientY);
    if (!pos) return;

    const atual = cadeiaRef.current;
    if (!atual.length) return;
    const ultimo = atual[atual.length - 1];
    if (pos.r !== ultimo.r || pos.c !== ultimo.c) {
      dragMovedRef.current = true;
      tentarEstenderCadeia(pos, false);
    }
  };

  const handlePointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const pos = celulaNoPonteiro(e.clientX, e.clientY);

    if (dragMovedRef.current) {
      if (cadeiaRef.current.length >= 2) {
        aplicarColheita(cadeiaRef.current, quadradoRef.current);
      } else {
        sincronizarCadeia([], false, null);
      }
      return;
    }

    // Foi um toque/clique simples na célula
    if (pos) {
      tentarEstenderCadeia(pos, true);
    }
  };

  const handlePointerCancel = () => {
    draggingRef.current = false;
    dragMovedRef.current = false;
  };

  const ativarJogadasExtras = () => {
    setJogadas(5);
    setMensagem("Mais 5 jogadas liberadas! Continue ligando as frutinhas.");
    falar("Mais cinco jogadas para você continuar!");
  };

  const pontosLinha = useMemo(() => {
    if (cadeia.length < 2 && !pontoFechamento) return "";
    const lista = pontoFechamento ? [...cadeia, pontoFechamento] : cadeia;
    return lista.map((pt) => `${pt.c * 100 + 50},${pt.r * 100 + 50}`).join(" ");
  }, [cadeia, pontoFechamento]);

  const falaNuvi = semJogadas
    ? "Acabaram as jogadas! Clique em +5 jogadas para continuar."
    : mensagem ||
      (quadrado
        ? "Quadrado mágico! Solte para colher todas dessa fruta!"
        : cadeia.length >= 2
          ? `${cadeia.length} ${frutaAtiva?.nome} ligados! Solte ou toque em Juntar.`
          : "Arraste ou toque para ligar 2 ou mais frutinhas iguais!");

  return (
    <Casca
      {...p}
      titulo="Bloquinho de Frutas"
      estrelas={estrelas}
      atrasoVitoria={750}
      estatisticas={{
        acertos,
        erros,
        metasConcluidas,
        totalMetas: metas.length,
        quadradosFechados,
        jogadasRestantes: jogadas,
      }}
      fala={falaNuvi}
    >
      <div className="frutas-wrap">
        <div className="frutas-hud">
          <div className="frutas-metas" aria-label="Metas de frutas">
            {metas.map((m) => {
              const feitos = Math.min(coletado[m.id] || 0, m.alvo);
              const concluida = feitos >= m.alvo;
              const frutaObj = mapaFrutas[m.id];
              return (
                <div
                  key={m.id}
                  className={`fruta-meta ${concluida ? "ok" : ""}`}
                  style={{ borderColor: concluida ? "var(--verde)" : m.cor }}
                >
                  <span className="fruta-meta-ico">
                    <BloquinhoFruta fruta={frutaObj} comOlhos={false} tam={30} />
                  </span>
                  <span className="fruta-meta-num">
                    {feitos}/{m.alvo}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            className={`frutas-jogadas ${jogadas <= 3 ? "alerta" : ""}`}
            aria-label={`${jogadas} jogadas restantes`}
          >
            <span className="jogadas-rotulo">Jogadas</span>
            <strong className="jogadas-valor">{jogadas}</strong>
          </div>
        </div>

        <div
          ref={boardRef}
          className={`frutas-tabuleiro ${quadrado ? "quadrado-ativo" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${cfg.tamanho}, 1fr)`,
            borderColor: quadrado && frutaAtiva ? frutaAtiva.cor : "#ffffff",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          role="application"
          aria-label={`Tabuleiro de frutas ${cfg.tamanho} por ${cfg.tamanho}. Arraste ou toque para conectar frutas iguais.`}
        >
          {pontosLinha && frutaAtiva && (
            <svg
              className="frutas-linhas"
              viewBox={`0 0 ${cfg.tamanho * 100} ${cfg.tamanho * 100}`}
              aria-hidden="true"
            >
              <polyline
                points={pontosLinha}
                fill="none"
                stroke="#ffffff"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              <polyline
                points={pontosLinha}
                fill="none"
                stroke={frutaAtiva.cor}
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {grid.map((linha, r) =>
            linha.map((celula, c) => {
              const fruta = mapaFrutas[celula.frutaId];
              const selecionada = cadeia.some((pt) => pt.r === r && pt.c === c);
              const destacadaQuadrado = quadrado && celula.frutaId === frutaAtivaId;
              const ordem = cadeia.findIndex((pt) => pt.r === r && pt.c === c);

              return (
                <button
                  key={celula.key}
                  type="button"
                  aria-label={`${fruta.nome}, linha ${r + 1} coluna ${c + 1}${
                    selecionada ? `, selecionada (${ordem + 1})` : ""
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      tentarEstenderCadeia({ r, c }, true);
                    }
                  }}
                  className={`fruta-peca ${selecionada ? "sel" : ""} ${
                    destacadaQuadrado ? "quadrado-hit" : ""
                  } ${celula.nova ? "caindo" : ""} ${
                    tenteChave === celula.key ? "tente" : ""
                  }`}
                  style={{
                    background: fruta.claro,
                    borderColor: selecionada || destacadaQuadrado ? fruta.cor : "#ffffff",
                    boxShadow: `0 4px 0 ${fruta.sombra}44`,
                  }}
                >
                  <BloquinhoFruta fruta={fruta} />
                </button>
              );
            })
          )}
        </div>

        <div className="frutas-controles">
          {cadeia.length >= 2 && !semJogadas && (
            <button
              type="button"
              className="btn ok peq-acao"
              onClick={() => aplicarColheita(cadeiaRef.current, quadradoRef.current)}
            >
              <IconCheck size={17} />
              Juntar ({cadeia.length})
            </button>
          )}
          {cadeia.length > 0 && !semJogadas && (
            <button
              type="button"
              className="btn sec peq-acao"
              onClick={() => sincronizarCadeia([], false, null)}
            >
              Limpar seleção
            </button>
          )}
          {semJogadas && (
            <>
              <button type="button" className="btn ok" onClick={ativarJogadasExtras}>
                +5 jogadas extras
              </button>
              <button type="button" className="btn sec" onClick={p.onNovo}>
                Reiniciar tabuleiro
              </button>
            </>
          )}
        </div>
      </div>
    </Casca>
  );
}
