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
  Contrast,
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
  CORES_AUTISMO_CONTRASTE,
  FAIXAS_ETARIAS,
  obterFaixaEtaria,
} from "../data/jogosData";
import { temPinPais } from "../utils/pinPais";
import Nuvi from "../components/Nuvi";
import PinPaisModal from "../components/PinPaisModal";
import { ShapePhysics } from "../components/shape-physics";
import { Alert, Button, Card, Dialog, Input, Select } from "../components/ui";
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

function ToggleCard({ active, onClick, icon: Icon, title, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all",
        active
          ? "border-brand/45 bg-brand-soft/60 alto-contraste:bg-slate-950 alto-contraste:text-white alto-contraste:border-slate-950"
          : "border-inst-border bg-white hover:bg-inst-subtle/60 alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            active
              ? "bg-brand text-white alto-contraste:bg-white alto-contraste:text-slate-950"
              : "bg-inst-subtle text-ink-muted alto-contraste:bg-white alto-contraste:border alto-contraste:border-slate-950 alto-contraste:text-slate-950"
          )}
          aria-hidden="true"
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <span className="block text-sm font-bold leading-tight">{title}</span>
          <span
            className={cn(
              "mt-0.5 block text-xs leading-snug",
              active ? "text-ink/80 alto-contraste:text-white/85" : "text-ink-muted"
            )}
          >
            {description}
          </span>
        </div>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          active ? "bg-brand" : "bg-slate-300"
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
  altoContraste,
  onToggleAltoContraste,
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
  const temModoAtivo = calmo || altoContraste || fonteMaior || !som;

  const solicitarAcessoPais = (destino = "pais") => {
    setAvisoPin("");
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
    <main className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-6 px-3.5 pt-3.5 pb-14 sm:gap-8 sm:px-6 sm:pt-4">
      {/* NAVBAR SEPARADA POR CONTEXTO: Espaço Infantil (2 abas) vs. Área dos Pais (2 abas + Voltar) */}
      <header className="no-print w-full">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2.5 sm:px-4",
            ehAreaPais
              ? "border-inst-border bg-inst-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              : "border-[#DDD6C7] bg-[#FCFBF8] shadow-[0_2px_10px_rgba(31,45,77,0.04)]",
            "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
          )}
        >
          {/* Esquerda: Marca no Espaço Infantil | Botão Voltar aos Jogos na Área dos Pais */}
          {ehAreaPais ? (
            <button
              type="button"
              onClick={voltarParaJogos}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-inst-border bg-inst-subtle px-3.5 py-1.5 text-xs sm:text-sm font-bold text-ink transition-colors hover:bg-slate-200/75 alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Voltar aos Jogos</span>
            </button>
          ) : (
            <MarcaCompacta />
          )}

          {/* Centro (desktop) / Linha 2 (mobile): apenas 2 abas super limpas */}
          <nav
            className={cn(
              "order-3 grid w-full grid-cols-2 gap-1 rounded-full p-1 md:order-2 md:flex md:w-auto md:items-center",
              ehAreaPais ? "bg-inst-subtle" : "bg-[#EFECE3]",
              "alto-contraste:bg-white alto-contraste:border alto-contraste:border-slate-950"
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
                    "min-h-9 rounded-full px-4 py-1.5 text-center text-sm font-semibold whitespace-nowrap transition-all",
                    ativa
                      ? ehAreaPais
                        ? "bg-brand text-white shadow-2xs alto-contraste:bg-slate-950 alto-contraste:text-white"
                        : "bg-[#5B82BA] text-white shadow-2xs alto-contraste:bg-slate-950 alto-contraste:text-white"
                      : "text-ink-muted hover:text-ink alto-contraste:text-slate-950"
                  )}
                  onClick={() => onAlterarAba(item.id)}
                  onKeyDown={(ev) => aoTeclarAba(ev, idx)}
                >
                  {item.rotulo}
                </button>
              );
            })}
          </nav>

          {/* Direita: Controles enxutos conforme o espaço */}
          <div className="order-2 flex items-center gap-2 md:order-3">
            {!ehAreaPais && (
              <>
                {visitante ? (
                  <button
                    type="button"
                    onClick={onSair}
                    title="Modo visitante — toque para entrar ou criar conta"
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3 py-1 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5] alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
                  >
                    <span>Visitante</span>
                    <span className="hidden sm:inline text-xs font-bold text-[#4F75AE]">· Entrar</span>
                  </button>
                ) : criancaAtiva ? (
                  <button
                    type="button"
                    onClick={() => solicitarAcessoPais("perfis")}
                    title={`Trocar criança (requer PIN) · Responsável: ${resp}`}
                    className="inline-flex min-h-9 max-w-[120px] sm:max-w-none items-center gap-1 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3 py-1 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5] alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
                  >
                    <span className="truncate">{criancaAtiva.name}</span>
                    <span className="hidden sm:inline text-ink-muted">· {criancaAtiva.age} anos</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => solicitarAcessoPais("pais")}
                  title="Entrar na Área dos Pais e Professores (protegida por PIN)"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#DDD6C7] bg-[#F6F4EE] px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold text-ink transition-colors hover:bg-[#EAE3D5] alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
                >
                  <Lock size={14} className="shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="hidden sm:inline">Área dos Pais</span>
                  <span className="sm:hidden">Pais</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setAbrirPrefs(true)}
              aria-haspopup="dialog"
              aria-expanded={abrirPrefs}
              aria-label="Abrir ajustes"
              title={ehAreaPais ? "Ajustes, PIN e conta" : "Ajustes sensoriais e áudio"}
              className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                ehAreaPais
                  ? "border-inst-border bg-white text-ink hover:bg-inst-subtle"
                  : "border-[#DDD6C7] bg-[#F6F4EE] text-ink hover:bg-[#EAE3D5]",
                "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
              )}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              {temModoAtivo && (
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {avisoPin && (
        <div className="no-print w-full">
          <Alert variant="success">
            <span>{avisoPin}</span>
            <Button variant="outlineInst" size="sm" onClick={() => setAvisoPin("")}>
              Fechar
            </Button>
          </Alert>
        </div>
      )}

      {/* MODAL DE AJUSTES (sensorial para todos; PIN, LGPD e Sair apenas na Área dos Pais) */}
      <Dialog
        open={abrirPrefs}
        onClose={() => setAbrirPrefs(false)}
        title="Ajustes e Acessibilidade"
        subtitle={
          ehAreaPais || visitante
            ? "Personalize conforto sensorial, áudio e preferências da conta."
            : "Personalize conforto sensorial e áudio para a brincadeira."
        }
        titleId="modal-ajustes-titulo"
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
              Concluir
            </Button>
          </>
        }
      >
        {/* Seção 1: Conforto Sensorial e Áudio */}
        <div className="space-y-2.5">
          <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-ink-muted">
            Conforto sensorial e áudio
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <ToggleCard
              active={som}
              onClick={onToggleSom}
              icon={som ? Volume2 : VolumeX}
              title="Narração de voz"
              description={som ? "Nuvi lê as instruções" : "Áudio silenciado"}
            />
            <ToggleCard
              active={calmo}
              onClick={onToggleCalmo}
              icon={Cloud}
              title="Modo calmo"
              description="Reduz animações e estímulos"
            />
            <ToggleCard
              active={altoContraste}
              onClick={onToggleAltoContraste}
              icon={Contrast}
              title="Alto contraste"
              description="Leitura reforçada (WCAG AAA)"
            />
            <ToggleCard
              active={fonteMaior}
              onClick={onToggleFonteMaior}
              icon={Type}
              title="Fonte ampliada (A+)"
              description="Aumenta tamanho dos textos"
            />
            <ToggleCard
              active={efeitos}
              onClick={onToggleEfeitos}
              icon={efeitos ? Bell : BellOff}
              title="Efeitos sonoros"
              description={efeitos ? "Sons suaves de acerto" : "Efeitos desligados"}
            />
            <ToggleCard
              active={velocidade === "calma"}
              onClick={onToggleVelocidade}
              icon={Gauge}
              title="Fala calma"
              description={velocidade === "calma" ? "Ritmo pausado" : "Ritmo normal"}
            />
          </div>
        </div>

        {/* Seção 2: Preferências dos Jogos */}
        <div className="space-y-3 border-t border-inst-border pt-4">
          <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-ink-muted">
            Preferências dos jogos
          </h3>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-inst-border bg-inst-subtle/40 px-4 py-3">
            <div>
              <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Star size={15} className="text-warn" aria-hidden="true" />
                Rodadas por partida
              </span>
              <span className="block text-xs text-ink-muted">
                {rodadasTravadas
                  ? "Com perfil cadastrado, cada partida tem sempre 5 rodadas."
                  : "Escolha entre partidas curtas (3) ou padrão (5)."}
              </span>
            </div>
            <div className="inline-flex rounded-xl border border-inst-border bg-white p-1">
              {[3, 5].map((qtd) => (
                <button
                  key={qtd}
                  type="button"
                  disabled={rodadasTravadas}
                  onClick={() => onAlterarTotal(qtd)}
                  aria-pressed={totalRodadas === qtd}
                  className={cn(
                    "min-h-8 rounded-lg px-3 py-1 text-xs font-bold transition-colors",
                    totalRodadas === qtd
                      ? "bg-brand text-white"
                      : "text-ink-muted hover:text-ink",
                    rodadasTravadas && "opacity-55 cursor-not-allowed"
                  )}
                >
                  {qtd} rodadas
                </button>
              ))}
            </div>
          </div>

          {vozes.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink" htmlFor="sel-voz">
                Voz do dispositivo
              </label>
              <Select
                id="sel-voz"
                value={vozSel}
                onChange={(e) => onTrocarVoz(e.target.value)}
                className="min-h-10 text-sm"
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

        {/* Seção 3: Segurança do PIN e Conta LGPD (apenas na Área dos Pais desbloqueada) */}
        {!visitante && ehAreaPais && areaPaisLiberada && (
          <div className="space-y-2.5 border-t border-inst-border pt-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-ink-muted">
              Segurança e conta do responsável
            </h3>

            <button
              type="button"
              onClick={abrirAlterarPin}
              className="flex w-full items-center justify-between rounded-2xl border border-inst-border bg-inst-subtle/40 px-4 py-3 text-left transition-colors hover:bg-inst-subtle"
            >
              <span className="flex items-center gap-2.5 text-sm font-bold text-ink">
                <KeyRound size={17} className="text-brand" aria-hidden="true" />
                Alterar PIN de 4 dígitos da Área dos Pais
              </span>
              <ChevronRight size={17} className="text-ink-muted" aria-hidden="true" />
            </button>

            {(onAlterarSenha || onExcluirConta) && (
              <>
                <button
                  type="button"
                  aria-expanded={abrirConta}
                  onClick={() => {
                    setAbrirConta((v) => !v);
                    setErroConta("");
                    setMsgConta("");
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-inst-border bg-inst-subtle/40 px-4 py-3 text-left transition-colors hover:bg-inst-subtle"
                >
                  <span className="flex items-center gap-2.5 text-sm font-bold text-ink">
                    <ShieldCheck size={17} className="text-brand" aria-hidden="true" />
                    Minha conta e privacidade (LGPD)
                  </span>
                  <ChevronRight
                    size={17}
                    className={cn("text-ink-muted transition-transform", abrirConta && "rotate-90")}
                    aria-hidden="true"
                  />
                </button>

                {abrirConta && (
                  <div className="space-y-3 pt-1">
                    <form
                      onSubmit={salvarNovaSenha}
                      className="space-y-2.5 rounded-2xl border border-inst-border bg-white p-4"
                    >
                      <strong className="block text-sm text-ink">Alterar senha</strong>
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
                      className="space-y-2.5 rounded-2xl border border-red-200 bg-danger-soft/40 p-4"
                    >
                      <strong className="block text-sm text-danger">Excluir minha conta (LGPD)</strong>
                      <p className="m-0 text-xs text-ink-muted">
                        Remove permanentemente sua conta, perfis das crianças, partidas e relatórios.
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
                        Excluir conta e todos os dados
                      </Button>
                    </form>

                    {erroConta && <Alert variant="error">{erroConta}</Alert>}
                    {msgConta && <Alert variant="success">{msgConta}</Alert>}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Dialog>

      {/* MODAL DO PIN DE 4 DÍGITOS (Parental Gate) */}
      <PinPaisModal
        open={modalPin.aberto}
        modo={modalPin.modo}
        usuarioId={usuarioId}
        onClose={() => setModalPin((m) => ({ ...m, aberto: false }))}
        onSucesso={aoConfirmarPin}
        onEsqueciPin={onSair}
      />

      {/* ABA 1: JOGOS — aberto, respirável e fiel à imagem aprovada */}
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
                            ? "border-[#5B82BA] bg-[#5B82BA] text-white shadow-2xs alto-contraste:bg-slate-950 alto-contraste:border-slate-950"
                            : "border-[#DDD6C7] bg-[#F3EFE6] text-ink hover:bg-[#EAE3D5] alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950",
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

          {/* Grid 3x2 limpo de cards uniformes em marfim */}
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
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  onClick={() => onSelecionarJogo(j.id)}
                  className={cn(
                    "group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#DDD6C7] bg-[#FCFBF8] text-left",
                    "shadow-[0_3px_0_#DDD6C7,0_6px_16px_rgba(31,45,77,0.04)] transition-shadow hover:border-[#BFC7D6] hover:shadow-[0_4px_0_#CFC7B6,0_10px_22px_rgba(31,45,77,0.06)]",
                    "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-[0_4px_0_#0F172A]"
                  )}
                >
                  <span
                    className="block h-1.5 w-full alto-contraste:bg-slate-950"
                    style={{ backgroundColor: estilo.faixa }}
                    aria-hidden="true"
                  />

                  <div className="flex flex-col gap-4 px-5 pt-5 pb-4">
                    <div className="flex items-center gap-4">
                      <span
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
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
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EFECE3] alto-contraste:border alto-contraste:border-slate-950 alto-contraste:bg-white">
                        <div
                          className="h-full rounded-full transition-all duration-300 alto-contraste:bg-slate-950"
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

      {/* ABA 2: BLOQUINHOS INTERATIVOS */}
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
                colors={altoContraste ? CORES_AUTISMO_CONTRASTE : CORES_AUTISMO}
                background={altoContraste ? "#FFFFFF" : "#F6F4EE"}
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

      {/* PROTEÇÃO DE ACESSO DIRETO (F5 / URL) NA ÁREA DOS PAIS */}
      {bloqueadoPorPin && (
        <Card tone="institutional" className="w-full max-w-md p-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"
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

      {/* ABA 3: PERFIS DAS CRIANÇAS (dentro da Área dos Pais) */}
      {aba === "perfis" && !bloqueadoPorPin && (
        <div id="painel-perfis" role="tabpanel" aria-labelledby="tab-perfis" className="w-full">
          <PerfisCriancas visitante={visitante} onEntrarConta={onSair} {...perfis} />
        </div>
      )}

      {/* ABA 4: PAINEL DE PAIS E PROFESSORES (dentro da Área dos Pais) */}
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
