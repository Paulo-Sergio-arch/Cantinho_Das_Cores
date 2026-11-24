import { useState } from "react";
import { Check, Pencil, Plus, Sparkles, Trash2, User, Volume2, VolumeX } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  Input,
  Label,
} from "../components/ui";
import { cn } from "../lib/cn";

const IDADES = ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"];

function nivelDaIdade(idade) {
  const n = Number(idade) || 8;
  if (n <= 8) {
    return {
      rotulo: "Nível Fácil",
      badge: "success",
      descricao: "Menos distratores, formas básicas e ritmo mais tranquilo.",
    };
  }
  if (n === 9) {
    return {
      rotulo: "Nível Médio",
      badge: "brand",
      descricao: "Mais opções por rodada e novos desafios de atenção.",
    };
  }
  return {
    rotulo: "Nível Avançado",
    badge: "warning",
    descricao: "Cores próximas, palavras maiores e metas mais desafiadoras.",
  };
}

const VAZIO = { id: null, nome: "", idade: "8", vozAtiva: true };
const CORES_AVATAR = ["#2F6FD6", "#2D8A56", "#8C72D1", "#D67A59", "#CC6B7D", "#2A8F85"];

function corAvatar(nome = "") {
  const limpo = nome.trim();
  if (!limpo) return "#5B82BA";
  let soma = 0;
  for (let i = 0; i < limpo.length; i++) soma += limpo.charCodeAt(i);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

export default function PerfisCriancas({
  visitante,
  criancas,
  carregando,
  erroLista,
  ativaId,
  onSelecionar,
  onSalvar,
  onExcluir,
  onRecarregar,
  onEntrarConta,
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erroForm, setErroForm] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmarId, setConfirmarId] = useState(null);

  if (visitante) {
    return (
      <section className="flex w-full flex-col gap-5" aria-label="Perfis das crianças">
        <Card tone="institutional" className="p-6">
          <h1 className="font-display text-2xl font-semibold text-ink m-0">Perfis das crianças</h1>
          <p className="mt-1 mb-4 text-sm text-ink-muted">
            Cadastre cada criança para personalizar a faixa etária e acompanhar o progresso individual.
          </p>
          <Alert variant="info">
            <span>
              No modo visitante você pode testar todos os jogos, mas as partidas não ficam salvas. Entre com uma conta
              de responsável para cadastrar perfis e acompanhar relatórios.
            </span>
            {onEntrarConta && (
              <Button variant="institutional" size="sm" onClick={onEntrarConta}>
                <User size={16} />
                Fazer login ou criar conta
              </Button>
            )}
          </Alert>
        </Card>
      </section>
    );
  }

  const editando = form.id !== null;
  const infoNivelPreview = nivelDaIdade(form.idade);
  const inicialPreview = (form.nome || "").trim().charAt(0).toUpperCase() || "?";

  const abrirNovo = () => {
    setForm(VAZIO);
    setErroForm("");
    setErroAcao("");
    setConfirmarId(null);
    setModalAberto(true);
  };

  const abrirEditar = (c) => {
    setForm({
      id: c.id,
      nome: c.name,
      idade: String(c.age),
      vozAtiva: c.voice_enabled !== false,
    });
    setErroForm("");
    setErroAcao("");
    setConfirmarId(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (ocupado) return;
    setModalAberto(false);
    setErroForm("");
  };

  const salvar = async (ev) => {
    ev.preventDefault();
    if (ocupado) return;
    setMsg("");
    if (form.nome.trim().length < 2) {
      setErroForm("Digite o nome ou apelido (mínimo 2 letras).");
      return;
    }
    setErroForm("");
    setOcupado(true);
    try {
      await onSalvar(form);
      setMsg(editando ? "Perfil atualizado com sucesso." : "Perfil criado com sucesso.");
      setForm(VAZIO);
      setModalAberto(false);
    } catch (e) {
      setErroForm(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const excluir = async (id) => {
    if (ocupado) return;
    if (confirmarId !== id) {
      setConfirmarId(id);
      return;
    }
    setOcupado(true);
    setErroAcao("");
    setMsg("");
    try {
      await onExcluir(id);
      setMsg("Perfil excluído, junto com as partidas e relatórios dele.");
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setConfirmarId(null);
      setOcupado(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-5" aria-label="Perfis das crianças">
      {/* Subcabeçalho limpo direto no fundo (consistente com PainelPais) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink m-0">
            Perfis das crianças
          </h1>
          <p className="mt-0.5 mb-0 text-sm text-ink-muted">
            Escolha quem vai brincar. Partidas, voz e relatórios ficam ligados ao perfil selecionado.
          </p>
        </div>

        <Button variant="institutional" size="sm" onClick={abrirNovo}>
          <Plus size={16} />
          Nova criança
        </Button>
      </div>

      {msg && (
        <Alert variant="success">
          <span>{msg}</span>
        </Alert>
      )}

      {erroAcao && (
        <Alert variant="error">
          <span>{erroAcao}</span>
        </Alert>
      )}

      <Card tone="institutional">
        <CardHeader className="pb-3">
          <CardTitle>Perfis cadastrados</CardTitle>
          <Badge variant="muted">
            {criancas.length} {criancas.length === 1 ? "criança" : "crianças"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          {carregando && (
            <p className="m-0 py-4 text-center text-sm font-semibold text-ink-muted" role="status">
              Carregando perfis…
            </p>
          )}

          {erroLista && (
            <Alert variant="error">
              <span>{erroLista}</span>
              <Button variant="outlineInst" size="sm" onClick={onRecarregar}>
                Tentar de novo
              </Button>
            </Alert>
          )}

          {!carregando && !erroLista && criancas.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-inst-border-strong bg-inst-subtle/35 px-6 py-10 text-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"
                aria-hidden="true"
              >
                <Sparkles size={22} />
              </div>
              <p className="m-0 font-display text-base font-semibold text-ink">
                Nenhuma criança cadastrada ainda
              </p>
              <p className="mt-1 mb-4 max-w-sm text-xs text-ink-muted">
                Adicione o primeiro perfil para personalizar o nível de dificuldade e acompanhar a evolução nos jogos.
              </p>
              <Button variant="institutional" size="sm" onClick={abrirNovo}>
                <Plus size={16} />
                Cadastrar primeira criança
              </Button>
            </div>
          )}

          {criancas.length > 0 && (
            <ul className="m-0 list-none space-y-2.5 p-0">
              {criancas.map((c) => {
                const ativo = String(ativaId) === String(c.id);
                const confirmando = confirmarId === c.id;
                const inicial = (c.name || "?").trim().charAt(0).toUpperCase();
                const infoNivel = nivelDaIdade(c.age);

                return (
                  <li
                    key={c.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
                      ativo
                        ? "border-brand/35 bg-brand-soft/35"
                        : "border-inst-border bg-white hover:bg-inst-subtle/40",
                      "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold text-white"
                        style={{ background: corAvatar(c.name) }}
                        aria-hidden="true"
                      >
                        {inicial}
                      </span>
                      <div className="min-w-0">
                        <strong className="block text-base font-bold text-ink truncate">
                          {c.name}
                        </strong>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {c.age} anos · {infoNivel.rotulo} ·{" "}
                          {c.voice_enabled === false ? "Mudo por padrão" : "Voz ativa"}
                        </span>
                      </div>
                    </div>

                    {/* Botões uniformes (mesma altura e largura consistente entre Escolher e ✓ Jogando) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="institutional"
                        size="sm"
                        aria-pressed={ativo}
                        onClick={() => onSelecionar(c.id)}
                        className={cn(
                          "min-h-9 h-9 min-w-[108px] rounded-xl px-3.5 text-xs font-bold shadow-2xs",
                          ativo
                            ? "bg-success hover:bg-success-deep text-white alto-contraste:bg-slate-950 alto-contraste:text-white"
                            : "bg-brand hover:bg-brand-deep text-white"
                        )}
                      >
                        {ativo && <Check size={14} strokeWidth={2.6} />}
                        <span>{ativo ? "Jogando" : "Escolher"}</span>
                      </Button>

                      <Button
                        variant="outlineInst"
                        size="sm"
                        onClick={() => abrirEditar(c)}
                        className="min-h-9 h-9 rounded-xl px-3 text-xs font-bold"
                      >
                        <Pencil size={13} />
                        Editar
                      </Button>

                      <Button
                        variant={confirmando ? "danger" : "dangerSoft"}
                        size="sm"
                        disabled={ocupado}
                        aria-busy={ocupado && confirmando}
                        onClick={() => excluir(c.id)}
                        className="min-h-9 h-9 rounded-xl px-3 text-xs font-bold shadow-none"
                      >
                        <Trash2 size={13} />
                        {confirmando ? "Confirmar?" : "Excluir"}
                      </Button>

                      {confirmando && (
                        <Button
                          variant="outlineInst"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => setConfirmarId(null)}
                          className="min-h-9 h-9 rounded-xl px-3 text-xs font-bold"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* MODAL CARACTERÍSTICO DE CRIAR / EDITAR CRIANÇA */}
      <Dialog
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? "Editar perfil da criança" : "Nova criança"}
        subtitle={
          editando
            ? "Atualize nome, idade ou preferência de voz deste perfil."
            : "Crie um perfil personalizado para ajustar a dificuldade e acompanhar o progresso."
        }
        titleId="modal-perfil-titulo"
        className="max-w-lg"
        footer={
          <>
            <Button variant="outlineInst" size="sm" onClick={fecharModal} disabled={ocupado}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-perfil-crianca"
              variant="institutional"
              size="sm"
              disabled={ocupado}
              aria-busy={ocupado}
            >
              {!editando && <Plus size={15} />}
              {ocupado ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar criança"}
            </Button>
          </>
        }
      >
        <form id="form-perfil-crianca" className="space-y-5" onSubmit={salvar} noValidate>
          {/* Cartão de prévia ao vivo da criança */}
          <div className="flex items-center gap-4 rounded-2xl border border-[#E5DFD2] bg-[#F6F4EE] p-4 alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-semibold text-white shadow-sm transition-colors"
              style={{ background: corAvatar(form.nome) }}
              aria-hidden="true"
            >
              {inicialPreview}
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block font-display text-lg font-semibold text-ink truncate">
                {form.nome.trim() || "Nome da criança"}
              </strong>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant={infoNivelPreview.badge}>
                  {form.idade} anos · {infoNivelPreview.rotulo}
                </Badge>
                <Badge variant="default">
                  {form.vozAtiva ? <Volume2 size={12} /> : <VolumeX size={12} />}
                  {form.vozAtiva ? "Voz ativa" : "Mudo"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Nome ou apelido */}
          <div>
            <Label htmlFor="pf-nome">Nome ou apelido</Label>
            <Input
              id="pf-nome"
              autoFocus
              maxLength={80}
              placeholder="Ex.: Lucas"
              value={form.nome}
              invalid={Boolean(erroForm)}
              aria-invalid={Boolean(erroForm)}
              onChange={(e) => {
                setForm({ ...form, nome: e.target.value });
                if (erroForm) setErroForm("");
              }}
            />
          </div>

          {/* Grade visual de idades (4 a 14 anos) */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label className="mb-0">Idade da criança</Label>
              <span className="text-xs font-bold text-brand">{infoNivelPreview.rotulo}</span>
            </div>
            <div
              className="grid grid-cols-6 gap-1.5 sm:grid-cols-11"
              role="radiogroup"
              aria-label="Idade da criança em anos"
            >
              {IDADES.map((idadeOp) => {
                const selecionada = String(form.idade) === idadeOp;
                return (
                  <button
                    key={idadeOp}
                    type="button"
                    role="radio"
                    aria-checked={selecionada}
                    onClick={() => setForm({ ...form, idade: idadeOp })}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-xl border text-sm font-bold transition-all",
                      selecionada
                        ? "border-brand bg-brand text-white shadow-2xs alto-contraste:bg-slate-950 alto-contraste:border-slate-950"
                        : "border-inst-border bg-white text-ink hover:border-brand/50 hover:bg-brand-soft/40 alto-contraste:border-2 alto-contraste:border-slate-950"
                    )}
                  >
                    {idadeOp}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 mb-0 text-xs text-ink-muted">{infoNivelPreview.descricao}</p>
          </div>

          {/* Switch tátil de narração de voz */}
          <button
            type="button"
            role="switch"
            aria-checked={form.vozAtiva}
            onClick={() => setForm({ ...form, vozAtiva: !form.vozAtiva })}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-colors",
              form.vozAtiva
                ? "border-brand/40 bg-brand-soft/50"
                : "border-inst-border bg-inst-subtle/40",
              "alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  form.vozAtiva ? "bg-brand text-white" : "bg-white text-ink-muted border border-inst-border"
                )}
                aria-hidden="true"
              >
                {form.vozAtiva ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-ink leading-tight">
                  Narração de voz ao iniciar jogos
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  A Nuvi lê as instruções em voz alta para a criança.
                </span>
              </div>
            </div>
            <span
              aria-hidden="true"
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                form.vozAtiva ? "bg-brand" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform",
                  form.vozAtiva ? "translate-x-5" : "translate-x-0"
                )}
              />
            </span>
          </button>

          {erroForm && <Alert variant="error">{erroForm}</Alert>}
        </form>
      </Dialog>
    </section>
  );
}
