import { useState, useEffect, useRef } from "react";
import { ChevronLeft, LogOut, Play, Volume2, VolumeX } from "lucide-react";
import { cancelarFala, falar } from "../utils/voz";
import { tocarVitoria } from "../utils/sons";
import Estrelas from "./Estrelas";
import Nuvi, { NuviMascote } from "./Nuvi";
import Vitoria from "./Vitoria";
import Fim from "./Fim";
import { Button, Dialog } from "./ui";
import { cn } from "../lib/cn";

function SwitchPill({ checked, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className="group flex flex-col items-center gap-1 focus-visible:outline-none"
    >
      <span
        className={cn(
          "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors p-0.5",
          "group-focus-visible:ring-3 group-focus-visible:ring-pais/30",
          checked
            ? "bg-pais border-pais"
            : "bg-[#D9CDB7] border-[#CFC2AA]"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-[#FCFBF8] shadow-xs transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
      <span className="text-[11px] font-semibold text-ink leading-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

export default function Casca({
  titulo,
  estrelas,
  total = 5,
  idade = "8",
  calmo = false,
  som = true,
  onToggleSom,
  onToggleCalmo,
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
    <section className="flex w-full flex-col items-center gap-5 sm:gap-6" aria-label={titulo}>
      <h1 className="sr-only">{titulo}</h1>

      {/* Barra superior simétrica em 3 colunas no desktop ([1fr_auto_1fr]) — estrelas perfeitamente centralizadas */}
      <header className="relative z-20 grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8]/95 px-3.5 py-2.5 shadow-[0_2px_10px_rgba(31,45,77,0.06)] backdrop-blur-xs sm:px-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Coluna 1 (Esquerda): Voltar */}
        <div className="justify-self-start">
          <button
            type="button"
            onClick={solicitarSaida}
            aria-label="Voltar ao menu"
            aria-haspopup={!fim ? "dialog" : undefined}
            aria-expanded={!fim ? confirmandoSaida : undefined}
            className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3.5 py-1.5 text-sm font-bold text-ink transition-colors hover:bg-[#EAE3D5]"
          >
            <ChevronLeft size={17} aria-hidden="true" />
            <span>Voltar</span>
          </button>
        </div>

        {/* Coluna 2 (Centro exato): Cápsula de estrelas + Rodada */}
        <div className="col-span-2 order-3 flex justify-center md:col-span-1 md:order-2 md:justify-self-center">
          <Estrelas n={estrelas} total={total} mostrarLegenda />
        </div>

        {/* Coluna 3 (Direita): Áudio + Modo Calmo */}
        <div className="order-2 flex items-center gap-4 justify-self-end md:order-3">
          {onToggleSom && (
            <button
              type="button"
              onClick={onToggleSom}
              aria-pressed={som}
              aria-label={som ? "Silenciar áudio" : "Ativar áudio"}
              className="flex flex-col items-center gap-1 text-ink transition-opacity hover:opacity-80"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center">
                {som ? <Volume2 size={21} aria-hidden="true" /> : <VolumeX size={21} aria-hidden="true" />}
              </span>
              <span className="text-[11px] font-semibold leading-none">
                {som ? "Áudio" : "Mudo"}
              </span>
            </button>
          )}

          {onToggleCalmo && (
            <SwitchPill checked={calmo} onClick={onToggleCalmo} label="Modo Calmo" />
          )}
        </div>
      </header>

      <Dialog
        open={confirmandoSaida && !fim}
        onClose={() => setConfirmandoSaida(false)}
        title="Sair desta partida?"
        titleId="confirmar-saida-titulo"
        className="max-w-sm"
        footerClassName="justify-stretch sm:justify-end"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outlineInst"
              size="sm"
              onClick={sairConfirmado}
              className="w-full sm:w-auto"
            >
              <LogOut size={15} />
              Sair para o menu
            </Button>
            <Button
              variant="playful"
              size="sm"
              onClick={() => setConfirmandoSaida(false)}
              className="w-full sm:w-auto"
            >
              <Play size={15} />
              Continuar jogando
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-1 text-center">
          <div className="flex h-18 w-22 items-center justify-center rounded-2xl bg-[#EFECE3]">
            <NuviMascote size="sm" calmo={calmo} />
          </div>
          <p className="m-0 text-sm text-ink leading-relaxed">
            Se você voltar para o menu agora, o progresso desta partida será encerrado.
          </p>
        </div>
      </Dialog>

      {vitoria && <Vitoria calmo={calmo} />}

      {fim ? (
        final && (
          <div className="flex w-full max-w-5xl justify-center">
            <Fim
              total={total}
              idade={idade}
              calmo={calmo}
              estatisticas={estatisticas}
              onNovo={onNovo}
              onSair={sairConfirmado}
              onFim={finalizar}
            />
          </div>
        )
      ) : (
        <div className="palco-jogo flex w-full max-w-3xl flex-col items-center gap-5 sm:gap-7 pt-1">
          <Nuvi variant="jogo" calmo={calmo} fala={fala} falaVisual={falaVisual} ouvivel />
          <div className="w-full">{children}</div>
        </div>
      )}
    </section>
  );
}
