import { lazy, Suspense, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  BellOff,
  Box,
  Cloud,
  Contrast,
  Gamepad2,
  Gauge,
  LayoutGrid,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Star,
  Type,
  User,
  Users,
  BarChart3,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  CORES_AUTISMO,
  CORES_AUTISMO_CONTRASTE,
  FAIXAS_ETARIAS,
  obterFaixaEtaria,
} from "../data/jogosData";
import Nuvi from "../components/Nuvi";
import IconeMenu from "../components/IconeMenu";
import { ShapePhysics } from "../components/shape-physics";
import { Alert, Badge, Button, Card, Input, Select } from "../components/ui";
import { cn } from "../lib/cn";
import PerfisCriancas from "./PerfisCriancas";

const PainelPais = lazy(() => import("./PainelPais"));

function MarcaCompacta() {
  return (
    <span className="inline-flex items-center gap-2.5 shrink-0" aria-label="Cantinho das Cores">
      <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden="true">
        <circle cx="8" cy="8" r="5" fill="#D9534F" />
        <circle cx="20" cy="8" r="5" fill="#E8B638" />
        <circle cx="8" cy="20" r="5" fill="#2F6FD6" />
        <circle cx="20" cy="20" r="5" fill="#2D8A56" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Cantinho das Cores
      </span>
    </span>
  );
}

const ABAS = [
  { id: "jogos", rotulo: "Jogos", Icon: Gamepad2 },
  { id: "bloquinhos", rotulo: "Bloquinhos", Icon: LayoutGrid },
  { id: "perfis", rotulo: "Crianças", Icon: Users },
  { id: "pais", rotulo: "Pais e Professores", Icon: BarChart3 },
];

// Paleta calma e dessaturada para o filete e badge de ícone de cada jogo no Menu TEA
const ESTILO_CARD_JOGO = {
  cores: { faixa: "#6B9CE2", badgeBg: "#E6EFFC", barra: "#6B9CE2" },
  encaixe: { faixa: "#72B892", badgeBg: "#E6F4EC", barra: "#72B892" },
  ligar: { faixa: "#E0B962", badgeBg: "#FBF2DC", barra: "#E0B962" },
  corforma: { faixa: "#A690D9", badgeBg: "#EFEAF9", barra: "#A690D9" },
  falar: { faixa: "#DD9378", badgeBg: "#FBECE6", barra: "#DD9378" },
  frutas: { faixa: "#D88996", badgeBg: "#FAEAED", barra: "#D88996" },
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
        "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors",
        active
          ? "border-brand bg-brand text-white shadow-2xs alto-contraste:bg-slate-950 alto-contraste:border-slate-950"
          : "border-surface-border bg-surface text-ink hover:bg-surface-muted/70 alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950",
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
    <main className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-5 px-4 pt-4 pb-12 sm:px-6">
      {/* Barra superior unificada (Design System) */}
      <header className="no-print w-full">
        <Card
          tone={ehInstitucional ? "institutional" : "calm"}
          className="px-3.5 py-2.5 sm:px-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <MarcaCompacta />

              {/* Contexto da criança ou visitante */}
              {visitante ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-warn/45 bg-warn-soft px-3 py-1 text-xs font-bold text-[#7A5200] alto-contraste:bg-white alto-contraste:border-slate-950 alto-contraste:text-slate-950"
                  title="Visitante — partidas não ficam salvas"
                >
                  <User size={14} aria-hidden="true" />
                  <span>Visitante</span>
                  <button
                    type="button"
                    className="ml-1 underline hover:text-ink"
                    onClick={onSair}
                  >
                    Entrar
                  </button>
                </span>
              ) : criancaAtiva ? (
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-muted/70 px-3 py-1 text-xs font-bold text-ink alto-contraste:bg-white alto-contraste:border-slate-950"
                  title={`Responsável: ${resp}`}
                >
                  <Users size={14} className="text-brand" aria-hidden="true" />
                  <span>
                    {criancaAtiva.name} · {criancaAtiva.age} anos
                  </span>
                  <button
                    type="button"
                    className="text-brand underline hover:text-brand-deep"
                    onClick={() => onAlterarAba("perfis")}
                  >
                    Trocar
                  </button>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-muted/70 px-3 py-1 text-xs font-bold text-ink"
                  title={resp}
                >
                  <User size={14} aria-hidden="true" />
                  <span className="max-w-36 truncate">{resp}</span>
                  <button
                    type="button"
                    className="text-brand underline"
                    onClick={() => onAlterarAba("perfis")}
                  >
                    + Perfil
                  </button>
                </span>
              )}
            </div>

            {/* Atalhos rápidos de acessibilidade sensorial e sessão */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={ehInstitucional ? "outlineInst" : "outline"}
                size="sm"
                onClick={onToggleSom}
                aria-pressed={som}
                title={som ? "Desativar voz" : "Ativar voz"}
                className={cn("px-2.5", !som && "opacity-75")}
              >
                {som ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span className="hidden sm:inline">{som ? "Voz" : "Mudo"}</span>
              </Button>

              <Button
                variant={calmo ? "institutional" : ehInstitucional ? "outlineInst" : "outline"}
                size="icon"
                onClick={onToggleCalmo}
                aria-pressed={calmo}
                aria-label={calmo ? "Desativar modo calmo" : "Ativar modo calmo"}
                title={calmo ? "Modo calmo ativo" : "Ativar modo calmo"}
                className="h-10 w-10"
              >
                <Cloud size={17} />
              </Button>

              <Button
                variant={altoContraste ? "institutional" : ehInstitucional ? "outlineInst" : "outline"}
                size="icon"
                onClick={onToggleAltoContraste}
                aria-pressed={altoContraste}
                aria-label={altoContraste ? "Desativar alto contraste" : "Ativar alto contraste"}
                title={altoContraste ? "Alto contraste ativo" : "Ativar alto contraste"}
                className="h-10 w-10"
              >
                <Contrast size={17} />
              </Button>

              <Button
                variant={abrirPrefs ? "institutional" : ehInstitucional ? "outlineInst" : "outline"}
                size="sm"
                onClick={() => setAbrirPrefs((v) => !v)}
                aria-expanded={abrirPrefs}
                aria-controls="painel-acessibilidade"
                aria-label="Acessibilidade e ajustes"
                title="Acessibilidade e ajustes"
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Ajustes</span>
              </Button>

              <Button
                variant={ehInstitucional ? "outlineInst" : "outline"}
                size="sm"
                onClick={onSair}
                title={visitante ? "Voltar para a tela de login" : "Sair da conta"}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>

          {/* Navegação principal em pílulas */}
          <nav
            className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-surface-border/70 pt-3 alto-contraste:border-slate-950"
            aria-label="Navegação principal"
            role="tablist"
          >
            {ABAS.map((item, idx) => {
              const IconeAba = item.Icon;
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
                    "inline-flex flex-1 min-w-[120px] min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all",
                    ativa
                      ? "bg-brand text-white shadow-xs alto-contraste:bg-slate-950 alto-contraste:text-white"
                      : "text-ink-muted hover:bg-surface-muted/70 hover:text-ink alto-contraste:text-slate-950"
                  )}
                  onClick={() => onAlterarAba(item.id)}
                  onKeyDown={(ev) => aoTeclarAba(ev, idx)}
                >
                  <IconeAba size={17} aria-hidden="true" />
                  <span>{item.rotulo}</span>
                </button>
              );
            })}
          </nav>

          {/* Gaveta expansível de acessibilidade e conta LGPD */}
          {abrirPrefs && (
            <div
              id="painel-acessibilidade"
              className="mt-3 space-y-3 border-t border-surface-border pt-3.5"
            >
              <div className="flex flex-wrap gap-2">
                <ChipToggle active={fonteMaior} onClick={onToggleFonteMaior}>
                  <Type size={16} />
                  Fonte A+
                </ChipToggle>
                <ChipToggle active={altoContraste} onClick={onToggleAltoContraste}>
                  <Contrast size={16} />
                  Alto contraste
                </ChipToggle>
                <ChipToggle active={calmo} onClick={onToggleCalmo}>
                  <Cloud size={16} />
                  Modo calmo
                </ChipToggle>
                <ChipToggle active={efeitos} onClick={onToggleEfeitos}>
                  {efeitos ? <Bell size={16} /> : <BellOff size={16} />}
                  {efeitos ? "Efeitos ON" : "Efeitos OFF"}
                </ChipToggle>
                <ChipToggle active={velocidade === "calma"} onClick={onToggleVelocidade}>
                  <Gauge size={16} />
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
                  <Star size={16} />
                  {totalRodadas} rodadas
                </ChipToggle>
              </div>

              {vozes.length > 1 && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="text-sm font-bold text-ink" htmlFor="sel-voz">
                    Voz de leitura:
                  </label>
                  <Select
                    id="sel-voz"
                    value={vozSel}
                    onChange={(e) => onTrocarVoz(e.target.value)}
                    className="max-w-xs"
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
                <div className="border-t border-dashed border-surface-border-strong pt-3">
                  <Button
                    variant="outlineInst"
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
                        className="space-y-2.5 rounded-2xl border border-inst-border bg-inst-subtle/50 p-4"
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
            </div>
          )}
        </Card>
      </header>

      {/* ABA 1: JOGOS (Design Sensorial Calmo TEA) */}
      {aba === "jogos" && (
        <div
          id="painel-jogos"
          role="tabpanel"
          aria-labelledby="tab-jogos"
          className="flex w-full max-w-4xl flex-col gap-5"
        >
          <h1 className="sr-only">Cantinho das Cores — Jogos Educativos</h1>

          {/* Hero da Nuvi + seletor de níveis */}
          <Card tone="calm" className="p-4 sm:p-5">
            <Nuvi
              compacta
              fala={
                criancaAtiva
                  ? `Olá, ${criancaAtiva.name}! Qual jogo vamos brincar hoje?`
                  : "Olá! Escolha o nível e toque em um jogo para começar."
              }
              ouvivel
            />

            <div className="mt-4 flex flex-col gap-3 border-t border-surface-border/80 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                  {idadeTravada ? (
                    <>
                      <Lock size={14} className="text-brand" aria-hidden="true" />
                      Nível de {criancaAtiva?.name} ({faixaAtual.idade})
                    </>
                  ) : (
                    "Idade / Dificuldade"
                  )}
                </span>
                <p className="m-0 text-xs text-ink-muted">
                  {visitante ? "Visitante (partidas não salvas) · " : ""}
                  {faixaAtual.descricao}
                </p>
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Níveis de dificuldade">
                {FAIXAS_ETARIAS.map((f) => {
                  const ativo = String(idade) === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      disabled={idadeTravada}
                      title={
                        idadeTravada
                          ? `Idade definida pelo perfil de ${criancaAtiva?.name}`
                          : undefined
                      }
                      onClick={() => onAlterarIdade(f.id)}
                      aria-pressed={ativo}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-bold transition-all",
                        ativo
                          ? "border-brand bg-brand text-white shadow-xs alto-contraste:bg-slate-950 alto-contraste:border-slate-950"
                          : "border-surface-border bg-surface-muted/60 text-ink hover:bg-surface-muted alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950",
                        idadeTravada && !ativo && "opacity-55 cursor-not-allowed"
                      )}
                    >
                      <span>{f.nivel}</span>
                      <span className={cn("text-xs font-semibold", ativo ? "text-white/85" : "text-ink-muted")}>
                        ({f.idade})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {idadeTravada && criancaAtiva && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted/70 px-3.5 py-2 text-xs text-ink-muted">
                <span>
                  Faixa etária definida pelo perfil de <strong className="text-ink">{criancaAtiva.name}</strong>.
                </span>
                <button
                  type="button"
                  className="font-bold text-brand underline"
                  onClick={() => onAlterarAba("perfis")}
                >
                  Alterar em Crianças
                </button>
              </div>
            )}

            {!visitante && !criancaAtiva && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-soft/70 px-3.5 py-2 text-xs text-ink">
                <span>Cadastre um perfil de criança para salvar partidas e gerar relatórios pedagógicos.</span>
                <button
                  type="button"
                  className="font-bold text-brand underline"
                  onClick={() => onAlterarAba("perfis")}
                >
                  Abrir perfis
                </button>
              </div>
            )}
          </Card>

          {jogosCarregando && (
            <p className="text-center text-sm font-semibold text-ink-muted" role="status">
              Carregando jogos…
            </p>
          )}

          {jogosErro && (
            <Alert variant="error">
              <span>{jogosErro}</span>
              <Button variant="outline" size="sm" onClick={onRecarregarJogos}>
                Tentar de novo
              </Button>
            </Alert>
          )}

          {/* Grid 3x2 de Cards Calmos em Marfim com Badge Pastel (TEA-friendly) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jogos.map((j) => {
              const estilo = ESTILO_CARD_JOGO[j.id] || ESTILO_CARD_JOGO.cores;
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
                    "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-surface-border bg-surface text-left",
                    "shadow-[0_4px_14px_rgba(31,45,77,0.05),0_4px_0_#DDD6C6] transition-shadow hover:border-brand/40 hover:shadow-[0_8px_22px_rgba(31,45,77,0.08),0_4px_0_#CFC7B6]",
                    "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-[0_4px_0_#0F172A]"
                  )}
                >
                  {/* Filete sutil de cor no topo */}
                  <span
                    className="block h-1.5 w-full alto-contraste:bg-slate-950"
                    style={{ backgroundColor: estilo.faixa }}
                    aria-hidden="true"
                  />

                  <div className="flex items-center gap-4 p-5">
                    <span
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-black/5 transition-transform group-hover:scale-105 alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
                      style={{ backgroundColor: estilo.badgeBg }}
                    >
                      <IconeMenu id={j.id} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <span className="block font-display text-xl font-semibold text-ink leading-tight">
                        {j.nome}
                      </span>
                      {j.sub && (
                        <Badge variant="default" className="mt-1.5">
                          {j.sub}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Barra de progresso calma em estrelas */}
                  <div className="flex items-center gap-2.5 border-t border-surface-border/70 bg-surface-muted/35 px-5 py-3 alto-contraste:bg-white alto-contraste:border-slate-950">
                    <Star
                      size={16}
                      className={cn(
                        "shrink-0",
                        concluidas > 0
                          ? "fill-[#E8B638] text-[#BA8C1D]"
                          : "fill-transparent text-[#C0B8A7]"
                      )}
                      aria-hidden="true"
                    />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-border/80 alto-contraste:border alto-contraste:border-slate-950 alto-contraste:bg-white">
                      <div
                        className="h-full rounded-full transition-all duration-300 alto-contraste:bg-slate-950"
                        style={{
                          width: `${concluidas > 0 ? Math.max(18, progressoPct) : 0}%`,
                          backgroundColor: estilo.barra,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold text-ink-muted tabular-nums"
                      aria-label={`${concluidas} partidas concluídas`}
                    >
                      {concluidas > 0 ? `${concluidas}★` : "Novo"}
                    </span>
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
            <div className="overflow-hidden rounded-2xl border border-surface-border">
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
