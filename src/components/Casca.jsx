import { useState, useEffect, useRef } from "react";
import { cancelarFala, falar } from "../utils/voz";
import { tocarVitoria } from "../utils/sons";
import Titulo from "./Titulo";
import Estrelas from "./Estrelas";
import Nuvi from "./Nuvi";
import Vitoria from "./Vitoria";
import Fim from "./Fim";
import { IconCasa, IconVozOff, IconVozOn } from "./IconesUI";

export default function Casca({
  titulo,
  estrelas,
  total = 5,
  idade = "8",
  calmo = false,
  som = true,
  onToggleSom,
  fala,
  falaVisual,
  atrasoVitoria = 0,
  estatisticas,
  onRegistrarAbandonoRef,
  onSair,
  onNovo,
  onFim,
  onParcial,
  children,
}) {
  const fim = estrelas >= total;
  const [vitoria, setVitoria] = useState(false);
  const [final, setFinal] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const inicioRef = useRef(null);
  const registradoRef = useRef(false);

  useEffect(() => {
    inicioRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!fim) return;
    let tFinal;
    const tInicio = setTimeout(() => {
      setConfirmandoSaida(false);
      setVitoria(true);
      tocarVitoria();
      falar("Parabéns!");
      tFinal = setTimeout(() => {
        setVitoria(false);
        setFinal(true);
      }, 1800);
    }, atrasoVitoria);

    return () => {
      clearTimeout(tInicio);
      if (tFinal) clearTimeout(tFinal);
    };
  }, [fim, atrasoVitoria]);

  const montarResumo = (concluida) => {
    const duracaoSeg = inicioRef.current
      ? Math.max(1, Math.round((Date.now() - inicioRef.current) / 1000))
      : 1;
    return {
      ...estatisticas,
      acertos: estatisticas?.acertos ?? estrelas,
      erros: estatisticas?.erros ?? 0,
      estrelas: Math.min(estrelas, total),
      totalEstrelas: total,
      concluida,
      duracaoSeg,
    };
  };

  const finalizar = () => {
    if (registradoRef.current) return;
    registradoRef.current = true;
    onFim?.(montarResumo(true));
  };

  // Partida abandonada: registrada uma única vez, mesmo sem nenhuma resposta (0 acertos e 0 erros).
  const registrarAbandono = (aoFechar = false) => {
    if (registradoRef.current) return;
    registradoRef.current = true;
    // Se as 5 estrelas já foram conquistadas (animação de vitória), a partida conta como concluída.
    if (fim) onFim?.(montarResumo(true), { aoFechar });
    else onParcial?.(montarResumo(false), { aoFechar });
  };

  const abandonoRef = useRef(registrarAbandono);
  useEffect(() => {
    abandonoRef.current = registrarAbandono;
    if (onRegistrarAbandonoRef) {
      onRegistrarAbandonoRef.current = () => abandonoRef.current(false);
    }
    return () => {
      if (onRegistrarAbandonoRef) {
        onRegistrarAbandonoRef.current = null;
      }
    };
  });

  // Fechar a aba ou navegar para outra página também abandona a partida em andamento.
  useEffect(() => {
    const aoFechar = () => abandonoRef.current(true);
    window.addEventListener("pagehide", aoFechar);
    return () => window.removeEventListener("pagehide", aoFechar);
  }, []);

  const sairConfirmado = () => {
    cancelarFala();
    registrarAbandono();
    onSair();
  };

  const solicitarSaida = () => {
    if (fim) {
      sairConfirmado();
      return;
    }
    setConfirmandoSaida((v) => !v);
  };

  return (
    <section className="jogo">
      <header className="topo">
        <button
          type="button"
          className="redondo"
          onClick={solicitarSaida}
          aria-label="Voltar ao menu"
          aria-expanded={!fim ? confirmandoSaida : undefined}
          title="Voltar ao menu"
        >
          <IconCasa size={22} />
        </button>
        <Titulo t={titulo} tag="h1" className="titulo-jogo" />
        {onToggleSom && (
          <button
            type="button"
            className={`redondo redondo-neutro ${som ? "" : "mudo"}`}
            onClick={onToggleSom}
            aria-pressed={som}
            aria-label={som ? "Silenciar voz durante o jogo" : "Ativar voz durante o jogo"}
            title={som ? "Silenciar voz" : "Ativar voz"}
          >
            {som ? <IconVozOn size={20} /> : <IconVozOff size={20} />}
          </button>
        )}
        <span className="nivel-badge" aria-label={`Nível ${idade} anos`}>
          {idade} anos
        </span>
        <Estrelas n={estrelas} total={total} />
      </header>

      {confirmandoSaida && !fim && (
        <div
          className="aviso-api confirmar-saida"
          role="alertdialog"
          aria-labelledby="confirmar-saida-titulo"
        >
          <span id="confirmar-saida-titulo">
            Quer mesmo sair desta partida? O progresso atual será encerrado.
          </span>
          <div className="perfil-acoes">
            <button
              type="button"
              className="btn peq"
              onClick={() => setConfirmandoSaida(false)}
            >
              Continuar jogando
            </button>
            <button
              type="button"
              className="btn neutro peq"
              onClick={sairConfirmado}
            >
              Sair para o menu
            </button>
          </div>
        </div>
      )}

      {vitoria && <Vitoria calmo={calmo} />}
      {fim ? (
        final && (
          <Fim
            total={total}
            idade={idade}
            estatisticas={estatisticas}
            onNovo={onNovo}
            onSair={sairConfirmado}
            onFim={finalizar}
          />
        )
      ) : (
        <>
          <Nuvi fala={fala} falaVisual={falaVisual} ouvivel />
          {children}
        </>
      )}
    </section>
  );
}
