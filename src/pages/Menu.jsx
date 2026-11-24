import { lazy, Suspense, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Apple,
  Bell,
  BellOff,
  Box,
  Cloud,
  Contrast,
  Gauge,
  Lock,
  LogOut,
  MessageCircle,
  Moon,
  Palette,
  Plus,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Shapes,
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
import Nuvi from "../components/Nuvi";
import { ShapePhysics } from "../components/shape-physics";
import { Alert, Button, Card, Input, Select } from "../components/ui";
import { cn } from "../lib/cn";
import PerfisCriancas from "./PerfisCriancas";

const PainelPais = lazy(() => import("./PainelPais"));

function MarcaCompacta() {
  return (
    <span className="inline-flex items-center gap-2.5 shrink-0" aria-label="Cantinho das Cores">
      <svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
        <circle cx="8" cy="8" r="5" fill="#7D9CC7" />
        <circle cx="20" cy="8" r="5" fill="#DCA76A" />
        <circle cx="8" cy="20" r="5" fill="#8BB79B" />
        <circle cx="20" cy="20" r="5" fill="#D58E88" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Cantinho das Cores
      </span>
    </span>
  );
}

const ABAS = [
  { id: "jogos", rotulo: "Jogos" },
  { id: "bloquinhos", rotulo: "Bloquinhos" },
  { id: "perfis", rotulo: "Crianças" },
  { id: "pais", rotulo: "Pais e Professores" },
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

function ChipToggle({ active, onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors",
        active
          ? "border-[#5B82BA] bg-[#5B82BA] text-white alto-contraste:bg-slate-950 alto-contraste:border-slate-950"
          : "border-[#DDD6C7] bg-[#FCFBF8] text-ink hover:bg-[#F3EFE6] alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950",
        disabled && "opacity-55 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

export default function Menu({
  jogos,
  jogosCarregando,
  jogosErro,
  onRecarregarJogos,
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
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [msgConta, setMsgConta] = useState("");
  const [erroConta, setErroConta] = useState("");
  const [ocupadoConta, setOcupadoConta] = useState(false);
  const shapeRef = useRef(null);
  const faixaAtual = obterFaixaEtaria(idade);
  const ehInstitucional = aba === "perfis" || aba === "pais";

  const aoTeclarAba = (ev, idx) => {
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft" && ev.key !== "Home" && ev.key !== "End") return;
    ev.preventDefault();
    let proximo = idx;
    if (ev.key === "ArrowRight") proximo = (idx + 1) % ABAS.length;
    if (ev.key === "ArrowLeft") proximo = (idx - 1 + ABAS.length) % ABAS.length;
    if (ev.key === "Home") proximo = 0;
    if (ev.key === "End") proximo = ABAS.length - 1;
    onAlterarAba(ABAS[proximo].id);
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
    <main className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-8 px-4 pt-4 pb-14 sm:px-6">
      {/* BARRA SUPERIOR DE LINHA ÚNICA — limpa e fiel ao protótipo aprovado */}
      <header className="no-print w-full">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-2.5",
            ehInstitucional
              ? "border-inst-border bg-inst-surface shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
              : "border-[#DDD6C7] bg-[#FCFBF8] shadow-[0_2px_10px_rgba(31,45,77,0.04)]",
            "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
          )}
        >
          {/* Esquerda: Marca */}
          <MarcaCompacta />

          {/* Centro: Pílula única com as 4 abas limpas (sem ícones poluindo) */}
          <nav
            className={cn(
              "order-3 flex w-full items-center justify-center gap-1 rounded-full p-1 lg:order-2 lg:w-auto",
              ehInstitucional ? "bg-inst-subtle" : "bg-[#EFECE3]",
              "alto-contraste:bg-white alto-contraste:border alto-contraste:border-slate-950"
            )}
            aria-label="Navegação principal"
            role="tablist"
          >
            {ABAS.map((item, idx) => {
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
                    "min-h-9 flex-1 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-all lg:flex-initial",
                    ativa
                      ? "bg-[#5B82BA] text-white shadow-2xs alto-contraste:bg-slate-950 alto-contraste:text-white"
                      : "text-ink hover:bg-black/5 alto-contraste:text-slate-950"
                  )}
                  onClick={() => onAlterarAba(item.id)}
                  onKeyDown={(ev) => aoTeclarAba(ev, idx)}
                >
                  {item.rotulo}
                </button>
              );
            })}
          </nav>

          {/* Direita: Pílula da criança + 3 atalhos sensoriais compactos + ajustes */}
          <div className="order-2 flex items-center gap-2 lg:order-3">
            {visitante ? (
              <button
                type="button"
                onClick={onSair}
                title="Visitante — toque para entrar com sua conta"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5] alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
              >
                <span>Visitante</span>
                <span className="text-xs font-bold text-[#4F75AE] underline">Entrar</span>
              </button>
            ) : criancaAtiva ? (
              <button
                type="button"
                onClick={() => onAlterarAba("perfis")}
                title={`Trocar perfil · Responsável: ${resp}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5] alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
              >
                <span>
                  {criancaAtiva.name} · {criancaAtiva.age} anos
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAlterarAba("perfis")}
                title={resp}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#DDD6C7] bg-[#F3EFE6] px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-[#EAE3D5]"
              >
                <span>+ Criança</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleSom}
              aria-pressed={som}
              aria-label={som ? "Silenciar voz" : "Ativar voz"}
              title={som ? "Voz ativa" : "Voz desativada"}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DDD6C7] bg-[#F6F4EE] text-ink transition-colors hover:bg-[#EAE3D5]",
                !som && "opacity-60",
                "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
              )}
            >
              {som ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            <button
              type="button"
              onClick={onToggleCalmo}
              aria-pressed={calmo}
              aria-label={calmo ? "Desativar modo calmo" : "Ativar modo calmo"}
              title={calmo ? "Modo calmo ativo" : "Ativar modo calmo"}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                calmo
                  ? "border-[#5B82BA] bg-[#5B82BA] text-white"
                  : "border-[#DDD6C7] bg-[#F6F4EE] text-ink hover:bg-[#EAE3D5]",
                "alto-contraste:border-2 alto-contraste:border-slate-950"
              )}
            >
              <Moon size={17} />
            </button>

            <button
              type="button"
              onClick={onToggleAltoContraste}
              aria-pressed={altoContraste}
              aria-label={altoContraste ? "Desativar alto contraste" : "Ativar alto contraste"}
              title={altoContraste ? "Alto contraste ativo" : "Ativar alto contraste"}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                altoContraste
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-[#DDD6C7] bg-[#F6F4EE] text-ink hover:bg-[#EAE3D5]"
              )}
            >
              <Contrast size={17} />
            </button>

            <button
              type="button"
              onClick={() => setAbrirPrefs((v) => !v)}
              aria-expanded={abrirPrefs}
              aria-controls="painel-acessibilidade"
              aria-label="Mais ajustes e conta"
              title="Mais ajustes e sair"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                abrirPrefs
                  ? "border-[#5B82BA] bg-[#5B82BA] text-white"
                  : "border-[#DDD6C7] bg-[#F6F4EE] text-ink hover:bg-[#EAE3D5]",
                "alto-contraste:border-2 alto-contraste:border-slate-950"
              )}
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </div>

        {/* Gaveta limpa de ajustes extras, acessibilidade e conta */}
        {abrirPrefs && (
          <Card
            tone={ehInstitucional ? "institutional" : "calm"}
            id="painel-acessibilidade"
            className="mt-3 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <ChipToggle active={fonteMaior} onClick={onToggleFonteMaior}>
                  <Type size={15} />
                  Fonte A+
                </ChipToggle>
                <ChipToggle active={altoContraste} onClick={onToggleAltoContraste}>
                  <Contrast size={15} />
                  Alto contraste
                </ChipToggle>
                <ChipToggle active={calmo} onClick={onToggleCalmo}>
                  <Cloud size={15} />
                  Modo calmo
                </ChipToggle>
                <ChipToggle active={efeitos} onClick={onToggleEfeitos}>
                  {efeitos ? <Bell size={15} /> : <BellOff size={15} />}
                  {efeitos ? "Efeitos ON" : "Efeitos OFF"}
                </ChipToggle>
                <ChipToggle active={velocidade === "calma"} onClick={onToggleVelocidade}>
                  <Gauge size={15} />
                  {velocidade === "calma" ? "Fala calma" : "Fala normal"}
                </ChipToggle>
                <ChipToggle
                  active={false}
                  disabled={rodadasTravadas}
                  title={
                    rodadasTravadas
                      ? "Com um perfil de criança, as partidas têm sempre 5 rodadas"
                      : undefined
                  }
                  onClick={() => onAlterarTotal(totalRodadas === 5 ? 3 : 5)}
                >
                  <Star size={15} />
                  {totalRodadas} rodadas
                </ChipToggle>
              </div>

              <Button variant="outline" size="sm" onClick={onSair}>
                <LogOut size={15} />
                {visitante ? "Voltar ao login" : "Sair da conta"}
              </Button>
            </div>

            {vozes.length > 1 && (
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <label className="text-xs font-bold text-ink" htmlFor="sel-voz">
                  Voz:
                </label>
                <Select
                  id="sel-voz"
                  value={vozSel}
                  onChange={(e) => onTrocarVoz(e.target.value)}
                  className="min-h-9 max-w-xs py-1 text-sm"
                >
                  {vozes.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {!visitante && (onAlterarSenha || onExcluirConta) && (
              <div className="border-t border-dashed border-[#DDD6C7] pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  aria-expanded={abrirConta}
                  onClick={() => {
                    setAbrirConta((v) => !v);
                    setErroConta("");
                    setMsgConta("");
                  }}
                >
                  {abrirConta ? "Ocultar dados da conta" : "Minha conta e privacidade (LGPD)"}
                </Button>

                {abrirConta && (
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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

                    {erroConta && (
                      <div className="md:col-span-2">
                        <Alert variant="error">{erroConta}</Alert>
                      </div>
                    )}
                    {msgConta && (
                      <div className="md:col-span-2">
                        <Alert variant="success">{msgConta}</Alert>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </header>

      {/* ABA 1: JOGOS — aberto, respirável e fiel à imagem aprovada */}
      {aba === "jogos" && (
        <div
          id="painel-jogos"
          role="tabpanel"
          aria-labelledby="tab-jogos"
          className="flex w-full max-w-4xl flex-col items-center gap-8"
        >
          <h1 className="sr-only">Cantinho das Cores — Jogos Educativos</h1>

          {/* Nuvi flutuando limpa no fundo + pílulas de Nível logo abaixo */}
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
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  {/* Filete sutil de cor no topo */}
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

                    {/* Progresso minimalista (estrela + trilha fina, sem caixinha extra) */}
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

      {/* ABA 3: PERFIS DAS CRIANÇAS */}
      {aba === "perfis" && (
        <div id="painel-perfis" role="tabpanel" aria-labelledby="tab-perfis" className="w-full">
          <PerfisCriancas visitante={visitante} onEntrarConta={onSair} {...perfis} />
        </div>
      )}

      {/* ABA 4: PAINEL DE PAIS E PROFESSORES */}
      {aba === "pais" && (
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
