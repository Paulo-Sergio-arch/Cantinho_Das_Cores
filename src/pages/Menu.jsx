import { lazy, Suspense, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Apple,
  ArrowLeft,
  Bell,
  BellOff,
  Box,
  ChevronRight,
  Cloud,
  Gauge,
  KeyRound,
  Lock,
  LogOut,
  MessageCircle,
  Palette,
  Plus,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Shapes,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Star,
  Type,
  Volume2,
  VolumeX,
  Waypoints,
} from "lucide-react";
import {
  CORES_AUTISMO,
  FAIXAS_ETARIAS,
  obterFaixaEtaria,
} from "../data/jogosData";
import { temPinPais } from "../utils/pinPais";
import { AvatarCrianca } from "../utils/avatarCrianca";
import JardimNuvi from "../components/JardimNuvi";
import Nuvi from "../components/Nuvi";
import RecadoDaSemana from "../components/RecadoDaSemana";
import useRecadoDaSemana from "../hooks/useRecadoDaSemana";
import PinPaisModal from "../components/PinPaisModal";
import { ShapePhysics } from "../components/shape-physics";
import { Alert, Button, Card, CloudToast, Dialog, Input, Select } from "../components/ui";
import { cn } from "../lib/cn";
import PerfisCriancas from "./PerfisCriancas";

const PainelPais = lazy(() => import("./PainelPais"));

function MarcaCompacta() {
  return (
    <span className="inline-flex items-center gap-2 shrink-0" aria-label="Cantinho das Cores">
      <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden="true" className="shrink-0">
        <circle cx="8" cy="8" r="5" fill="#7D9CC7" />
        <circle cx="20" cy="8" r="5" fill="#DCA76A" />
        <circle cx="8" cy="20" r="5" fill="#8BB79B" />
        <circle cx="20" cy="20" r="5" fill="#D58E88" />
      </svg>
      <span className="font-display text-base sm:text-lg font-semibold tracking-tight text-ink whitespace-nowrap">
        Cantinho das Cores
      </span>
    </span>
  );
}

const ABAS_INFANTIS = [
  { id: "jogos", rotulo: "Jogos" },
  { id: "jardim", rotulo: "Conquistas" },
  { id: "bloquinhos", rotulo: "Bloquinhos" },
];

const ABAS_PAIS = [
  { id: "pais", rotulo: "Desempenho" },
  { id: "perfis", rotulo: "Crianças" },
];

// Paleta calma e dessaturada + ícone limpo de linha para os 6 cards do Menu (TEA)
const ESTILO_CARD_JOGO = {
  cores: {
    faixa: "#92ADD2",
    badgeBg: "#A8C0DF",
    iconeCor: "#3E5B85",
    barra: "#92ADD2",
    Icon: Palette,
  },
  encaixe: {
    faixa: "#9ABBA4",
    badgeBg: "#AFCAB7",
    iconeCor: "#3C634A",
    barra: "#9ABBA4",
    Icon: Puzzle,
  },
  ligar: {
    faixa: "#E3BE7A",
    badgeBg: "#EBC988",
    iconeCor: "#845C1C",
    barra: "#E3BE7A",
    Icon: Waypoints,
  },
  corforma: {
    faixa: "#B5A3CF",
    badgeBg: "#C3B4DA",
    iconeCor: "#58447A",
    barra: "#B5A3CF",
    Icon: Shapes,
  },
  falar: {
    faixa: "#D6947A",
    badgeBg: "#CFA08A",
    iconeCor: "#6E3F2C",
    barra: "#D6947A",
    Icon: MessageCircle,
  },
  frutas: {
    faixa: "#CAA0A6",
    badgeBg: "#CBA3A8",
    iconeCor: "#6E3E45",
    barra: "#CAA0A6",
    Icon: Apple,
  },
};

function SettingRowSwitch({ active, onClick, icon: Icon, iconBg, title, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-inst-subtle/50 first:rounded-t-2xl last:rounded-b-2xl"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            iconBg
          )}
          aria-hidden="true"
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <span className="block text-sm font-bold text-ink leading-tight">{title}</span>
          <span className="mt-0.5 block text-xs text-ink-muted leading-snug">{description}</span>
        </div>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          active ? "bg-pais" : "bg-[#D5CEBE]"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform",
            active ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}

export default function Menu({
  jogos,
  jogosCarregando,
  jogosErro,
  onRecarregarJogos,
  usuarioId,
  resp,
  visitante,
  criancaAtiva,
  perfis,
  som,
  onToggleSom,
  efeitos,
  onToggleEfeitos,
  velocidade,
  onToggleVelocidade,
  fonteMaior,
  onToggleFonteMaior,
  calmo,
  onToggleCalmo,
  totalRodadas,
  onAlterarTotal,
  idade,
  onAlterarIdade,
  aba,
  onAlterarAba,
  depthFisica,
  onToggleDepthFisica,
  seedFisica,
  onReiniciarBloquinhos,
  idadeTravada,
  rodadasTravadas,
  onSair,
  onAlterarSenha,
  onExcluirConta,
  vozes,
  vozSel,
  onTrocarVoz,
  feitos,
  onSelecionarJogo,
}) {
  const [abrirPrefs, setAbrirPrefs] = useState(false);
  const [abrirConta, setAbrirConta] = useState(false);
  const [areaPaisLiberada, setAreaPaisLiberada] = useState(false);
  const [modalPin, setModalPin] = useState({ aberto: false, modo: "verificar", destino: "pais" });
  const [avisoPin, setAvisoPin] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [msgConta, setMsgConta] = useState("");
  const [erroConta, setErroConta] = useState("");
  const [ocupadoConta, setOcupadoConta] = useState(false);
  const shapeRef = useRef(null);

  const faixaAtual = obterFaixaEtaria(idade);
  const ehAreaPais = aba === "perfis" || aba === "pais";
  const bloqueadoPorPin = ehAreaPais && !visitante && !areaPaisLiberada;
  const abasAtuais = ehAreaPais ? ABAS_PAIS : ABAS_INFANTIS;
  const temModoAtivo = calmo || fonteMaior || !som;
  const recadoSemana = useRecadoDaSemana(criancaAtiva?.id, visitante);
  const jogoDesafio = recadoSemana?.desafio?.jogo;

  const solicitarAcessoPais = (destino = "pais") => {
    setAvisoPin("");
    setAbrirPrefs(false);
    if (visitante || areaPaisLiberada) {
      onAlterarAba(destino);
      return;
    }
    const jaTemPin = temPinPais(usuarioId);
    setModalPin({
      aberto: true,
      modo: jaTemPin ? "verificar" : "criar",
      destino,
    });
  };

  const voltarParaJogos = () => {
    setAreaPaisLiberada(false);
    setAbrirConta(false);
    setAvisoPin("");
    onAlterarAba("jogos");
  };

  const abrirAlterarPin = () => {
    setAbrirPrefs(false);
    setAvisoPin("");
    setModalPin({
      aberto: true,
      modo: temPinPais(usuarioId) ? "alterar" : "criar",
      destino: null,
    });
  };

  const aoConfirmarPin = () => {
    const modoAnterior = modalPin.modo;
    const destino = modalPin.destino;
    setModalPin({ aberto: false, modo: "verificar", destino: "pais" });
    setAreaPaisLiberada(true);
    if (modoAnterior === "alterar") {
      setAvisoPin("PIN da Área dos Pais atualizado com sucesso.");
    } else if (destino) {
      onAlterarAba(destino);
    }
  };

  const aoTeclarAba = (ev, idx) => {
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft" && ev.key !== "Home" && ev.key !== "End") return;
    ev.preventDefault();
    let proximo = idx;
    if (ev.key === "ArrowRight") proximo = (idx + 1) % abasAtuais.length;
    if (ev.key === "ArrowLeft") proximo = (idx - 1 + abasAtuais.length) % abasAtuais.length;
    if (ev.key === "Home") proximo = 0;
    if (ev.key === "End") proximo = abasAtuais.length - 1;
    onAlterarAba(abasAtuais[proximo].id);
  };

  const salvarNovaSenha = async (ev) => {
    ev.preventDefault();
    if (ocupadoConta || !onAlterarSenha) return;
    setErroConta("");
    setMsgConta("");
    if (!senhaAtual) return setErroConta("Digite sua senha atual.");
    if (novaSenha.length < 8) return setErroConta("A nova senha precisa ter pelo menos 8 caracteres.");
    setOcupadoConta(true);
    try {
      await onAlterarSenha({ senhaAtual, novaSenha });
      setSenhaAtual("");
      setNovaSenha("");
      setMsgConta("Senha atualizada com sucesso.");
    } catch (e) {
      setErroConta(e.message);
    } finally {
      setOcupadoConta(false);
    }
  };

  const confirmarExclusaoConta = async (ev) => {
    ev.preventDefault();
    if (ocupadoConta || !onExcluirConta) return;
    setErroConta("");
    setMsgConta("");
    if (!senhaExclusao) return setErroConta("Confirme sua senha para excluir a conta e todos os dados.");
    setOcupadoConta(true);
    try {
      await onExcluirConta(senhaExclusao);
    } catch (e) {
      setErroConta(e.message);
      setOcupadoConta(false);
    }
  };

  return (
    <main className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-6 px-3.5 pt-3.5 pb-12 sm:gap-8 sm:px-6 sm:pt-4">
      {/* NAVBAR SIMÉTRICA EM 3 COLUNAS NO DESKTOP ([1fr_auto_1fr]) */}
      <header className="no-print w-full">
        <div
          className={cn(
            "grid grid-cols-[1fr_auto] items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 sm:px-4 md:grid-cols-[1fr_auto_1fr]",
            ehAreaPais
              ? "border-inst-border bg-inst-surface shadow-[0_2px_10px_rgba(31,45,77,0.04)]"
              : "border-[#DDD6C7] bg-[#FCFBF8] shadow-[0_2px_10px_rgba(31,45,77,0.04)]"
          )}
        >
          {/* Esquerda */}
          <div className="justify-self-start">
            {ehAreaPais ? (
              <button
                type="button"
                onClick={voltarParaJogos}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-inst-border bg-inst-subtle px-3.5 py-1.5 text-xs sm:text-sm font-bold text-ink transition-colors hover:bg-[#E5DFD2]"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Voltar aos Jogos</span>
              </button>
            ) : (
              <MarcaCompacta />
            )}
          </div>

          {/* Centro cravado */}
          <nav
            className={cn(
              "col-span-2 order-3 grid w-full gap-1 rounded-full p-1 md:col-span-1 md:order-2 md:flex md:w-auto md:justify-self-center",
              ehAreaPais ? "grid-cols-2 bg-inst-subtle" : "grid-cols-3 bg-[#EFECE3]"
            )}
            aria-label={ehAreaPais ? "Navegação da Área dos Pais" : "Navegação infantil"}
            role="tablist"
          >
            {abasAtuais.map((item, idx) => {
              const ativa = aba === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  aria-controls={`painel-${item.id}`}
                  className={cn(
                    "min-h-9 rounded-full px-3.5 sm:px-5 py-1.5 text-center text-xs sm:text-sm font-semibold whitespace-nowrap transition-all",
                    ativa
                      ? ehAreaPais
                        ? "bg-pais text-white shadow-2xs"
                        : "bg-[#5B82BA] text-white shadow-2xs"
                      : "text-ink-muted hover:text-ink"
                  )}
                  onClick={() => onAlterarAba(item.id)}
                  onKeyDown={(ev) => aoTeclarAba(ev, idx)}
                >
                  {item.rotulo}
                </button>
              );
            })}
          </nav>

          {/* Direita */}
          <div className="order-2 flex items-center gap-2 justify-self-end md:order-3">
            {!ehAreaPais && (
              <>
                {visitante ? (
                  <button
                    type="button"
                    onClick={onSair}
                    title="Modo visitante — toque para entrar ou criar conta"
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3.5 py-1 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5]"
                  >
                    <span>Visitante</span>
                    <span className="hidden sm:inline text-xs font-bold text-pais">· Entrar</span>
                  </button>
                ) : criancaAtiva ? (
                  <button
                    type="button"
                    onClick={() => solicitarAcessoPais("perfis")}
                    title={`Perfil ativo: ${criancaAtiva.name} (${criancaAtiva.age} anos) · Toque para trocar na Área dos Pais`}
                    className="inline-flex min-h-9 max-w-[165px] sm:max-w-none items-center gap-2 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] py-1 pl-1.5 pr-3 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5]"
                  >
                    <AvatarCrianca
                      criancaId={criancaAtiva.id}
                      nome={criancaAtiva.name}
                      size="sm"
                    />
                    <span className="truncate">
                      <strong>{criancaAtiva.name}</strong>
                      <span className="text-ink-muted"> · {criancaAtiva.age} anos</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => solicitarAcessoPais("perfis")}
                    title={`Cadastrar perfil de criança · Responsável: ${resp}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3 py-1 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5]"
                  >
                    <Plus size={14} aria-hidden="true" />
                    <span>Criança</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setAbrirPrefs(true)}
              aria-haspopup="dialog"
              aria-expanded={abrirPrefs}
              aria-label="Abrir ajustes"
              title="Ajustes e Área dos Pais"
              className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                ehAreaPais
                  ? "border-inst-border bg-white text-ink hover:bg-inst-subtle"
                  : "border-[#DDD6C7] bg-[#F6F4EE] text-ink hover:bg-[#EAE3D5]"
              )}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              {temModoAtivo && (
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pais ring-2 ring-white"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      <CloudToast
        message={avisoPin}
        variant="success"
        onClose={() => setAvisoPin("")}
      />

      {/* MODAL DE AJUSTES */}
      <Dialog
        open={abrirPrefs}
        onClose={() => setAbrirPrefs(false)}
        title="Ajustes"
        subtitle={
          ehAreaPais || visitante
            ? "Áudio, conforto sensorial e gerenciamento da conta."
            : "Conforto sensorial, áudio e acesso para responsáveis."
        }
        titleId="modal-ajustes-titulo"
        className="max-w-md"
        footerClassName={ehAreaPais || visitante ? "justify-between" : "justify-end"}
        footer={
          <>
            {(ehAreaPais || visitante) && (
              <Button
                variant="outlineInst"
                size="sm"
                onClick={() => {
                  setAbrirPrefs(false);
                  onSair();
                }}
              >
                <LogOut size={15} />
                {visitante ? "Voltar ao login" : "Sair da conta"}
              </Button>
            )}
            <Button variant="institutional" size="sm" onClick={() => setAbrirPrefs(false)}>
              Pronto
            </Button>
          </>
        }
      >
        {!ehAreaPais && (
          <button
            type="button"
            onClick={() => solicitarAcessoPais("pais")}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-pais/25 bg-pais-soft/75 px-4 py-3.5 text-left transition-colors hover:bg-pais-soft"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pais text-white"
                aria-hidden="true"
              >
                <Lock size={18} />
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-ink leading-tight">
                  Área dos Pais e Professores
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  Desempenho, trocar criança, relatórios e conta
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="shrink-0 text-pais" aria-hidden="true" />
          </button>
        )}

        {/* Grupo 1: Conforto Sensorial (TEA) */}
        <div className="space-y-2">
          <h3 className="m-0 px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Conforto sensorial (TEA)
          </h3>
          <div className="divide-y divide-inst-border rounded-2xl border border-inst-border bg-white">
            <SettingRowSwitch
              active={calmo}
              onClick={onToggleCalmo}
              icon={Cloud}
              iconBg="bg-pais-soft text-pais"
              title="Modo calmo"
              description="Remove animações e suaviza as cores"
            />
            <SettingRowSwitch
              active={fonteMaior}
              onClick={onToggleFonteMaior}
              icon={Type}
              iconBg="bg-[#EEEAF9] text-[#6952A8]"
              title="Fonte ampliada (A+)"
              description="Aumenta a legibilidade dos textos"
            />
          </div>
        </div>

        {/* Grupo 2: Áudio e Narração */}
        <div className="space-y-2">
          <h3 className="m-0 px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Áudio e narração
          </h3>
          <div className="divide-y divide-inst-border rounded-2xl border border-inst-border bg-white">
            <SettingRowSwitch
              active={som}
              onClick={onToggleSom}
              icon={som ? Volume2 : VolumeX}
              iconBg="bg-[#E6F4EC] text-[#2D8A56]"
              title="Voz da Nuvi"
              description={som ? "Leitura das instruções ativa" : "Narração silenciada"}
            />
            <SettingRowSwitch
              active={efeitos}
              onClick={onToggleEfeitos}
              icon={efeitos ? Bell : BellOff}
              iconBg="bg-[#FBF2DC] text-[#A87918]"
              title="Efeitos sonoros"
              description={efeitos ? "Sons suaves de acerto" : "Efeitos desligados"}
            />

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-inst-subtle text-ink-muted"
                  aria-hidden="true"
                >
                  <Gauge size={17} />
                </span>
                <span className="text-sm font-bold text-ink">Ritmo da fala</span>
              </div>
              <div className="inline-flex rounded-xl bg-inst-subtle p-1">
                {[
                  { id: "calma", rotulo: "Calma" },
                  { id: "normal", rotulo: "Normal" },
                ].map((op) => {
                  const ativo = velocidade === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => {
                        if (!ativo) onToggleVelocidade();
                      }}
                      className={cn(
                        "min-h-7 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                        ativo ? "bg-white text-ink shadow-2xs" : "text-ink-muted hover:text-ink"
                      )}
                    >
                      {op.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>

            {vozes.length > 1 && (
              <div className="px-4 py-3 space-y-1.5">
                <label className="block text-xs font-bold text-ink-muted" htmlFor="sel-voz">
                  Voz do dispositivo
                </label>
                <Select
                  id="sel-voz"
                  value={vozSel}
                  onChange={(e) => onTrocarVoz(e.target.value)}
                  className="min-h-9 py-1.5 text-sm"
                >
                  {vozes.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Grupo 3: Partidas */}
        <div className="space-y-2">
          <h3 className="m-0 px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Partidas
          </h3>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-inst-border bg-white px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDF6DF] text-[#BA8C1D]"
                aria-hidden="true"
              >
                <Star size={17} />
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-ink leading-tight">Rodadas</span>
                <span className="block text-xs text-ink-muted">
                  {rodadasTravadas ? "Fixo em 5 com perfil ativo" : "Duração da atividade"}
                </span>
              </div>
            </div>
            <div className="inline-flex rounded-xl bg-inst-subtle p-1">
              {[3, 5].map((qtd) => (
                <button
                  key={qtd}
                  type="button"
                  disabled={rodadasTravadas}
                  onClick={() => onAlterarTotal(qtd)}
                  aria-pressed={totalRodadas === qtd}
                  className={cn(
                    "min-h-7 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                    totalRodadas === qtd
                      ? "bg-white text-ink shadow-2xs"
                      : "text-ink-muted hover:text-ink",
                    rodadasTravadas && "opacity-55 cursor-not-allowed"
                  )}
                >
                  {qtd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grupo 4: Segurança e Conta (apenas na Área dos Pais desbloqueada) */}
        {!visitante && ehAreaPais && areaPaisLiberada && (
          <div className="space-y-2">
            <h3 className="m-0 px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Segurança e conta
            </h3>
            <div className="divide-y divide-inst-border rounded-2xl border border-inst-border bg-white">
              <button
                type="button"
                onClick={abrirAlterarPin}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-inst-subtle/50 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="flex items-center gap-3 text-sm font-bold text-ink">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pais-soft text-pais"
                    aria-hidden="true"
                  >
                    <KeyRound size={17} />
                  </span>
                  Alterar PIN de 4 dígitos
                </span>
                <ChevronRight size={17} className="text-ink-muted" aria-hidden="true" />
              </button>

              {(onAlterarSenha || onExcluirConta) && (
                <div>
                  <button
                    type="button"
                    aria-expanded={abrirConta}
                    onClick={() => {
                      setAbrirConta((v) => !v);
                      setErroConta("");
                      setMsgConta("");
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-inst-subtle/50 rounded-b-2xl"
                  >
                    <span className="flex items-center gap-3 text-sm font-bold text-ink">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracota-soft text-terracota"
                        aria-hidden="true"
                      >
                        <ShieldCheck size={17} />
                      </span>
                      Conta e privacidade (LGPD)
                    </span>
                    <ChevronRight
                      size={17}
                      className={cn("text-ink-muted transition-transform", abrirConta && "rotate-90")}
                      aria-hidden="true"
                    />
                  </button>

                  {abrirConta && (
                    <div className="space-y-3 border-t border-inst-border bg-inst-subtle/35 p-4">
                      <form onSubmit={salvarNovaSenha} className="space-y-2.5">
                        <strong className="block text-xs font-bold uppercase tracking-wide text-ink-muted">
                          Alterar senha
                        </strong>
                        <Input
                          type="password"
                          placeholder="Senha atual"
                          value={senhaAtual}
                          onChange={(e) => setSenhaAtual(e.target.value)}
                        />
                        <Input
                          type="password"
                          placeholder="Nova senha (mín. 8 caracteres)"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                        />
                        <Button
                          type="submit"
                          variant="institutional"
                          size="sm"
                          disabled={ocupadoConta}
                          aria-busy={ocupadoConta}
                        >
                          Salvar nova senha
                        </Button>
                      </form>

                      <form
                        onSubmit={confirmarExclusaoConta}
                        className="space-y-2.5 border-t border-inst-border pt-3"
                      >
                        <strong className="block text-xs font-bold uppercase tracking-wide text-danger">
                          Excluir minha conta (LGPD)
                        </strong>
                        <p className="m-0 text-xs text-ink-muted">
                          Remove permanentemente conta, perfis das crianças, partidas e relatórios.
                        </p>
                        <Input
                          type="password"
                          placeholder="Confirme sua senha para excluir"
                          value={senhaExclusao}
                          onChange={(e) => setSenhaExclusao(e.target.value)}
                        />
                        <Button
                          type="submit"
                          variant="danger"
                          size="sm"
                          disabled={ocupadoConta}
                          aria-busy={ocupadoConta}
                        >
                          Excluir conta e dados
                        </Button>
                      </form>

                      {erroConta && <Alert variant="error">{erroConta}</Alert>}
                      {msgConta && <Alert variant="success">{msgConta}</Alert>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* MODAL DO PIN DE 4 DÍGITOS */}
      <PinPaisModal
        open={modalPin.aberto}
        modo={modalPin.modo}
        usuarioId={usuarioId}
        onClose={() => setModalPin((m) => ({ ...m, aberto: false }))}
        onSucesso={aoConfirmarPin}
        onEsqueciPin={onSair}
      />

      {/* ABA 1: JOGOS */}
      {aba === "jogos" && (
        <div
          id="painel-jogos"
          role="tabpanel"
          aria-labelledby="tab-jogos"
          className="flex w-full max-w-4xl flex-col items-center gap-7 sm:gap-8"
        >
          <h1 className="sr-only">Cantinho das Cores — Jogos Educativos</h1>

          <section className="w-full pt-1" aria-label="Boas-vindas e nível de dificuldade">
            <Nuvi
              variant="menu"
              calmo={calmo}
              fala={
                criancaAtiva
                  ? `Olá, ${criancaAtiva.name}! O que vamos brincar hoje?`
                  : "Olá! O que vamos brincar hoje?"
              }
              falaVisual={
                criancaAtiva ? (
                  <>
                    Olá, <strong>{criancaAtiva.name}</strong>! O que vamos brincar hoje?
                  </>
                ) : (
                  <>
                    Olá! O que vamos <strong>brincar hoje</strong>?
                  </>
                )
              }
              ouvivel
              belowBubble={
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted"
                    title={faixaAtual.descricao}
                  >
                    {idadeTravada && <Lock size={13} aria-hidden="true" />}
                    Nível:
                  </span>
                  {FAIXAS_ETARIAS.map((f) => {
                    const ativo = String(idade) === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        disabled={idadeTravada}
                        title={
                          idadeTravada
                            ? `Definido pelo perfil de ${criancaAtiva?.name} (${f.idade})`
                            : `${f.idade} — ${f.descricao}`
                        }
                        onClick={() => onAlterarIdade(f.id)}
                        aria-pressed={ativo}
                        className={cn(
                          "min-h-8 rounded-full border px-3.5 py-1 text-sm font-semibold transition-all",
                          ativo
                            ? "border-[#5B82BA] bg-[#5B82BA] text-white shadow-2xs"
                            : "border-[#DDD6C7] bg-[#F3EFE6] text-ink hover:bg-[#EAE3D5]",
                          idadeTravada && !ativo && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {f.nivel}
                      </button>
                    );
                  })}
                </div>
              }
            />
          </section>

          <RecadoDaSemana dados={recadoSemana} calmo={calmo} onJogarDesafio={onSelecionarJogo} />

          {jogosCarregando && (
            <p className="text-center text-sm font-semibold text-ink-muted" role="status">
              Carregando jogos…
            </p>
          )}

          {jogosErro && (
            <div className="w-full">
              <Alert variant="error">
                <span>{jogosErro}</span>
                <Button variant="outline" size="sm" onClick={onRecarregarJogos}>
                  Tentar de novo
                </Button>
              </Alert>
            </div>
          )}

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {jogos.map((j) => {
              const estilo = ESTILO_CARD_JOGO[j.id] || ESTILO_CARD_JOGO.cores;
              const IconeCard = estilo.Icon;
              const concluidas = feitos[j.id] || 0;
              const progressoPct = Math.min(100, concluidas * 20);

              return (
                <motion.button
                  key={j.id}
                  type="button"
                  whileHover={calmo ? undefined : { y: -3 }}
                  whileTap={calmo ? undefined : { scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  onClick={() => onSelecionarJogo(j.id)}
                  aria-label={j.id === jogoDesafio ? `${j.nome} (desafio da semana)` : undefined}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8] text-left shadow-[0_3px_0_#DDD6C7,0_6px_16px_rgba(31,45,77,0.04)] transition-shadow hover:border-[#BFC7D6] hover:shadow-[0_4px_0_#CFC7B6,0_10px_22px_rgba(31,45,77,0.06)]",
                    j.id === jogoDesafio && "border-[#E3BE7A] ring-2 ring-[#E3BE7A]/70"
                  )}
                >
                  {j.id === jogoDesafio && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FFF6E3] px-2.5 py-0.5 text-xs font-bold text-[#7A5200]">
                      <Star size={12} className="fill-[#E3BE7A] text-[#B89042]" aria-hidden="true" />
                      Desafio da semana
                    </span>
                  )}
                  <span
                    className="block h-1.5 w-full"
                    style={{ backgroundColor: estilo.faixa }}
                    aria-hidden="true"
                  />

                  <div className="flex flex-col gap-4 px-5 pt-5 pb-4">
                    <div className="flex items-center gap-4">
                      <span
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                        style={{ backgroundColor: estilo.badgeBg, color: estilo.iconeCor }}
                      >
                        <IconeCard size={28} strokeWidth={1.75} aria-hidden="true" />
                      </span>

                      <span className="font-display text-xl font-semibold text-ink leading-tight">
                        {j.nome}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2.5"
                      aria-label={`${concluidas} partidas concluídas`}
                    >
                      <Star
                        size={16}
                        className={cn(
                          "shrink-0",
                          concluidas > 0
                            ? "fill-[#E3BE7A] text-[#B89042]"
                            : "fill-[#DDD6C7] text-[#DDD6C7]"
                        )}
                        aria-hidden="true"
                      />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EFECE3]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${concluidas > 0 ? Math.max(18, progressoPct) : 0}%`,
                            backgroundColor: estilo.barra,
                          }}
                        />
                      </div>
                      {concluidas > 0 && (
                        <span className="text-xs font-bold text-ink-muted tabular-nums">
                          {concluidas}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: JARDIM DE CONQUISTAS DA NUVI (FIGURINHAS) */}
      {aba === "jardim" && (
        <JardimNuvi
          feitos={feitos}
          nomeCrianca={criancaAtiva?.name || ""}
          calmo={calmo}
          onJogar={onSelecionarJogo}
        />
      )}

      {/* ABA 3: BLOQUINHOS INTERATIVOS */}
      {aba === "bloquinhos" && (
        <section
          id="painel-bloquinhos"
          role="tabpanel"
          aria-labelledby="tab-bloquinhos"
          className="flex w-full max-w-4xl flex-col gap-4"
          aria-label="Bloquinhos interativos"
        >
          <Card tone="calm" className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink m-0">
                  Bloquinhos interativos
                </h1>
                <p className="mt-1 mb-0 text-sm text-ink-muted">
                  Brinque com os bloquinhos nas cores do autismo: arraste, jogue ou toque no espaço vazio.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="playful"
                  size="sm"
                  onClick={() => shapeRef.current?.addShape()}
                  disabled={calmo}
                >
                  <Plus size={16} />
                  Bloquinho
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => shapeRef.current?.shake()}
                  disabled={calmo}
                >
                  <RefreshCw size={16} />
                  Chacoalhar
                </Button>
                <Button
                  variant={depthFisica === "2d" ? "institutional" : "outline"}
                  size="sm"
                  onClick={onToggleDepthFisica}
                >
                  {depthFisica === "3d" ? <Box size={16} /> : <Square size={16} />}
                  {depthFisica === "3d" ? "Modo 3D" : "Modo 2D"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReiniciarBloquinhos();
                    shapeRef.current?.replay();
                  }}
                >
                  <RotateCcw size={16} />
                  Reiniciar
                </Button>
              </div>
            </div>

            {calmo && (
              <Alert variant="info" className="mt-4">
                <span>O Modo Calmo está ativo e pausou a física dos bloquinhos.</span>
                <Button variant="outline" size="sm" onClick={onToggleCalmo}>
                  Desativar Modo Calmo
                </Button>
              </Alert>
            )}
          </Card>

          <Card tone="calm" className="overflow-hidden p-2">
            <div className="overflow-hidden rounded-2xl border border-[#DDD6C7]">
              <ShapePhysics
                ref={shapeRef}
                height="clamp(360px, 56vh, 520px)"
                depth={depthFisica}
                colors={CORES_AUTISMO}
                background="#F6F4EE"
                count={22}
                size={40}
                paused={calmo}
                followCursor={!calmo}
                seed={seedFisica}
                aria-label="Bloquinhos interativos com as cores do autismo. Arraste um bloquinho ou clique no espaço livre para adicionar."
              />
            </div>
          </Card>
        </section>
      )}

      {/* ACESSO DISCRETO À ÁREA DOS PAIS NO RODAPÉ */}
      {!ehAreaPais && (
        <footer className="no-print pt-2">
          <button
            type="button"
            onClick={() => solicitarAcessoPais("pais")}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#DDD6C7] bg-[#FCFBF8]/80 px-4 py-1.5 text-xs font-bold text-ink-muted transition-colors hover:bg-[#FCFBF8] hover:text-pais"
          >
            <Lock size={13} aria-hidden="true" />
            <span>Área dos Pais e Professores</span>
          </button>
        </footer>
      )}

      {/* PROTEÇÃO DE ACESSO DIRETO (F5 / URL) NA ÁREA DOS PAIS */}
      {bloqueadoPorPin && (
        <Card tone="institutional" className="w-full max-w-md p-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pais-soft text-pais"
            aria-hidden="true"
          >
            <Lock size={24} />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink m-0">
            Área protegida por PIN
          </h1>
          <p className="mt-2 mb-6 text-sm text-ink-muted leading-relaxed">
            Para proteger perfis das crianças, relatórios e configurações, digite o PIN de 4 dígitos do responsável.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button variant="outlineInst" size="sm" onClick={voltarParaJogos}>
              <ArrowLeft size={15} />
              Voltar aos Jogos
            </Button>
            <Button variant="institutional" size="sm" onClick={() => solicitarAcessoPais(aba)}>
              <Lock size={15} />
              {temPinPais(usuarioId) ? "Digitar PIN" : "Criar PIN"}
            </Button>
          </div>
        </Card>
      )}

      {/* ABA 3: PERFIS DAS CRIANÇAS */}
      {aba === "perfis" && !bloqueadoPorPin && (
        <div id="painel-perfis" role="tabpanel" aria-labelledby="tab-perfis" className="w-full">
          <PerfisCriancas visitante={visitante} onEntrarConta={onSair} {...perfis} />
        </div>
      )}

      {/* ABA 4: PAINEL DE PAIS E PROFESSORES */}
      {aba === "pais" && !bloqueadoPorPin && (
        <div id="painel-pais" role="tabpanel" aria-labelledby="tab-pais" className="w-full">
          <Suspense
            fallback={
              <p className="py-10 text-center text-sm font-semibold text-ink-muted" role="status">
                Carregando painel pedagógico…
              </p>
            }
          >
            <PainelPais
              visitante={visitante}
              criancas={perfis.criancas}
              criancaId={perfis.ativaId}
              calmo={calmo}
              onSelecionarCrianca={perfis.onSelecionar}
              onIrPerfis={() => onAlterarAba("perfis")}
              onEntrarConta={onSair}
            />
          </Suspense>
        </div>
      )}
    </main>
  );
}
