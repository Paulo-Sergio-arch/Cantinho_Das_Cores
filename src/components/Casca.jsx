import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { cancelarFala, falar } from "../utils/voz";
import { tocarVitoria } from "../utils/sons";
import Estrelas from "./Estrelas";
import Nuvi from "./Nuvi";
import Vitoria from "./Vitoria";
import Fim from "./Fim";
import { Alert, Badge, Button } from "./ui";
import { cn } from "../lib/cn";

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

  // Partida abandonada: ignora entradas acidentais sem nenhuma interação (< 10s e 0 tentativas).
  const registrarAbandono = (aoFechar = false) => {
    if (registradoRef.current) return;
    const resumo = montarResumo(Boolean(fim));
    if (!fim && resumo.acertos === 0 && resumo.erros === 0 && resumo.duracaoSeg < 10) {
      registradoRef.current = true;
      return;
    }
    registradoRef.current = true;
    // Se as 5 estrelas já foram conquistadas (animação de vitória), a partida conta como concluída.
    if (fim) onFim?.(resumo, { aoFechar });
    else onParcial?.(resumo, { aoFechar });
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
    <section className="flex w-full flex-col gap-4">
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface px-3.5 py-2.5 shadow-[0_2px_10px_rgba(31,45,77,0.05)]",
          "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={solicitarSaida}
            aria-label="Voltar ao menu"
            aria-expanded={!fim ? confirmandoSaida : undefined}
            title="Voltar ao menu"
            className="rounded-xl px-3"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Voltar</span>
          </Button>

          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-semibold text-ink truncate m-0 leading-tight">
              {titulo}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Estrelas n={estrelas} total={total} />
          <Badge variant="brand" aria-label={`Nível ${idade} anos`}>
            {idade} anos
          </Badge>
          {onToggleSom && (
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSom}
              aria-pressed={som}
              aria-label={som ? "Silenciar voz durante o jogo" : "Ativar voz durante o jogo"}
              title={som ? "Silenciar voz" : "Ativar voz"}
              className={cn("h-10 w-10 rounded-xl", !som && "opacity-75")}
            >
              {som ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>
          )}
        </div>
      </header>

      {confirmandoSaida && !fim && (
        <Alert variant="warning" role="alertdialog" aria-labelledby="confirmar-saida-titulo">
          <span id="confirmar-saida-titulo">
            Quer mesmo sair desta partida? O progresso atual será encerrado.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="playful" size="sm" onClick={() => setConfirmandoSaida(false)}>
              Continuar jogando
            </Button>
            <Button variant="outline" size="sm" onClick={sairConfirmado}>
              Sair para o menu
            </Button>
          </div>
        </Alert>
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
          <Nuvi fala={fala} falaVisual={falaVisual} ouvivel className="mb-1" />
          {children}
        </>
      )}
    </section>
  );
}
