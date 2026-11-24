import { useCallback, useEffect, useState } from "react";
import { Delete, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { limparPinPais, salvarPinPais, verificarPinPais } from "../utils/pinPais";
import { Alert, Button, Dialog } from "./ui";
import { cn } from "../lib/cn";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

/**
 * Modal de PIN de 4 dígitos para proteger a Área dos Pais e Professores.
 * - modo="criar": responsável cria e confirma o PIN na primeira vez.
 * - modo="verificar": pede o PIN existente para entrar na Área dos Pais.
 * - modo="alterar": valida PIN atual, define novo PIN e confirma.
 */
export default function PinPaisModal({
  open,
  modo = "verificar",
  usuarioId,
  onClose,
  onSucesso,
  onEsqueciPin,
}) {
  const [etapa, setEtapa] = useState("inicial");
  const [digitos, setDigitos] = useState("");
  const [pinTemp, setPinTemp] = useState("");
  const [erro, setErro] = useState("");
  const [confirmandoReset, setConfirmandoReset] = useState(false);
  const [tremendo, setTremendo] = useState(false);

  const resetarEstado = useCallback(() => {
    setEtapa(modo === "criar" ? "novo" : modo === "alterar" ? "atual" : "verificar");
    setDigitos("");
    setPinTemp("");
    setErro("");
    setConfirmandoReset(false);
    setTremendo(false);
  }, [modo]);

  useEffect(() => {
    if (open) {
      // oxlint-disable-next-line react/set-state-in-effect -- reinicializa o fluxo do modal sempre que abre
      resetarEstado();
    }
  }, [open, resetarEstado]);

  const piscarErro = useCallback((mensagem) => {
    setErro(mensagem);
    setDigitos("");
    setTremendo(true);
    setTimeout(() => setTremendo(false), 450);
  }, []);

  const processarPinCompleto = useCallback(
    async (valor) => {
      if (etapa === "verificar") {
        const ok = await verificarPinPais(usuarioId, valor);
        if (ok) {
          onSucesso?.();
        } else {
          piscarErro("PIN incorreto. Tente novamente.");
        }
        return;
      }

      if (etapa === "atual") {
        const ok = await verificarPinPais(usuarioId, valor);
        if (ok) {
          setErro("");
          setDigitos("");
          setEtapa("novo");
        } else {
          piscarErro("PIN atual incorreto.");
        }
        return;
      }

      if (etapa === "novo") {
        setErro("");
        setPinTemp(valor);
        setDigitos("");
        setEtapa("confirmar");
        return;
      }

      if (etapa === "confirmar") {
        if (valor !== pinTemp) {
          setPinTemp("");
          setEtapa("novo");
          piscarErro("Os PINs não coincidem. Digite novamente.");
          return;
        }
        try {
          await salvarPinPais(usuarioId, valor);
          onSucesso?.();
        } catch (e) {
          piscarErro(e.message || "Não foi possível salvar o PIN.");
        }
      }
    },
    [etapa, onSucesso, pinTemp, piscarErro, usuarioId]
  );

  const inserirDigito = useCallback(
    (d) => {
      if (confirmandoReset) return;
      setErro("");
      setDigitos((atual) => {
        if (atual.length >= 4) return atual;
        const proximo = atual + d;
        if (proximo.length === 4) {
          setTimeout(() => {
            processarPinCompleto(proximo);
          }, 90);
        }
        return proximo;
      });
    },
    [confirmandoReset, processarPinCompleto]
  );

  const apagarDigito = useCallback(() => {
    if (confirmandoReset) return;
    setErro("");
    setDigitos((atual) => atual.slice(0, -1));
  }, [confirmandoReset]);

  useEffect(() => {
    if (!open || confirmandoReset) return;
    const onKeyDown = (ev) => {
      if (/^[0-9]$/.test(ev.key)) {
        ev.preventDefault();
        inserirDigito(ev.key);
      } else if (ev.key === "Backspace") {
        ev.preventDefault();
        apagarDigito();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, confirmandoReset, inserirDigito, apagarDigito]);

  const titulos = {
    verificar: {
      titulo: "Área dos Pais e Professores",
      subtitulo: "Digite o PIN de 4 dígitos do responsável para continuar.",
      Icon: Lock,
    },
    atual: {
      titulo: "Alterar PIN dos Pais",
      subtitulo: "Primeiro, confirme o seu PIN atual de 4 dígitos.",
      Icon: KeyRound,
    },
    novo: {
      titulo: modo === "alterar" ? "Defina o novo PIN" : "Crie o PIN da Área dos Pais",
      subtitulo:
        "Escolha 4 números para proteger perfis, relatórios e configurações contra cliques acidentais.",
      Icon: ShieldCheck,
    },
    confirmar: {
      titulo: "Confirme o seu PIN",
      subtitulo: "Digite os mesmos 4 dígitos novamente para finalizar.",
      Icon: ShieldCheck,
    },
  };

  const info = titulos[etapa] || titulos.verificar;
  const IconeCabeca = info.Icon;

  const confirmarResetViaLogin = () => {
    limparPinPais(usuarioId);
    onClose?.();
    onEsqueciPin?.();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={info.titulo}
      subtitle={info.subtitulo}
      titleId="pin-pais-titulo"
      className="max-w-sm"
    >
      {confirmandoReset ? (
        <div className="space-y-4 py-1">
          <Alert variant="warning">
            <span>
              Por segurança da criança, para redefinir um PIN esquecido você precisará sair e entrar
              novamente com o e-mail e a senha da conta de responsável.
            </span>
          </Alert>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outlineInst" size="sm" onClick={() => setConfirmandoReset(false)}>
              Voltar
            </Button>
            <Button variant="institutional" size="sm" onClick={confirmarResetViaLogin}>
              Sair para redefinir PIN
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 py-1">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pais-soft text-pais"
            aria-hidden="true"
          >
            <IconeCabeca size={22} />
          </div>

          {/* 4 quadradinhos de visualização do PIN */}
          <div
            className={cn("flex items-center justify-center gap-3", tremendo && "animate-[balanca_0.42s_ease]")}
            role="status"
            aria-label={`${digitos.length} de 4 dígitos preenchidos`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const preenchido = idx < digitos.length;
              const ativo = idx === digitos.length;
              return (
                <span
                  key={idx}
                  className={cn(
                    "flex h-13 w-12 items-center justify-center rounded-2xl border-2 transition-all",
                    preenchido
                      ? "border-pais bg-pais-soft/60"
                      : ativo
                        ? "border-pais/50 bg-white"
                        : "border-inst-border bg-inst-subtle/40"
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full transition-transform",
                      preenchido
                        ? "scale-100 bg-pais"
                        : "scale-0 bg-transparent"
                    )}
                  />
                </span>
              );
            })}
          </div>

          {erro && (
            <p className="m-0 text-center text-xs font-bold text-danger" role="alert">
              {erro}
            </p>
          )}

          {/* Teclado numérico tátil (ideal para celular, tablet e mouse) */}
          <div className="grid w-full max-w-[260px] grid-cols-3 gap-2.5">
            {TECLAS.map((tecla, i) => {
              if (tecla === "") {
                return <span key={`vazio-${i}`} aria-hidden="true" />;
              }
              if (tecla === "back") {
                return (
                  <button
                    key="back"
                    type="button"
                    onClick={apagarDigito}
                    disabled={digitos.length === 0}
                    aria-label="Apagar último dígito"
                    className="flex h-12 items-center justify-center rounded-2xl border border-inst-border bg-inst-subtle/60 text-ink transition-colors hover:bg-inst-subtle active:scale-95 disabled:opacity-40"
                  >
                    <Delete size={19} aria-hidden="true" />
                  </button>
                );
              }
              return (
                <button
                  key={tecla}
                  type="button"
                  onClick={() => inserirDigito(tecla)}
                  className="flex h-12 items-center justify-center rounded-2xl border border-inst-border bg-white font-display text-xl font-semibold text-ink shadow-2xs transition-all hover:bg-inst-subtle/60 active:scale-95"
                >
                  {tecla}
                </button>
              );
            })}
          </div>

          {etapa === "verificar" && onEsqueciPin && (
            <button
              type="button"
              onClick={() => setConfirmandoReset(true)}
              className="text-xs font-bold text-ink-muted underline hover:text-pais"
            >
              Esqueci meu PIN
            </button>
          )}
        </div>
      )}
    </Dialog>
  );
}
