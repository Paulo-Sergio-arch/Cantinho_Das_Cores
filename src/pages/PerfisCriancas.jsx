import { useState } from "react";
import { Check, Pencil, Plus, Trash2, User } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from "../components/ui";
import { cn } from "../lib/cn";

const IDADES_PERFIL = [
  { valor: "4", rotulo: "4 anos · Nível Fácil" },
  { valor: "5", rotulo: "5 anos · Nível Fácil" },
  { valor: "6", rotulo: "6 anos · Nível Fácil" },
  { valor: "7", rotulo: "7 anos · Nível Fácil" },
  { valor: "8", rotulo: "8 anos · Nível Fácil" },
  { valor: "9", rotulo: "9 anos · Nível Médio" },
  { valor: "10", rotulo: "10 anos · Nível Avançado" },
  { valor: "11", rotulo: "11 anos · Nível Avançado" },
  { valor: "12", rotulo: "12 anos · Nível Avançado" },
  { valor: "13", rotulo: "13 anos · Nível Avançado" },
  { valor: "14", rotulo: "14 anos · Nível Avançado" },
];

const VAZIO = { id: null, nome: "", idade: "8", vozAtiva: true };
const CORES_AVATAR = ["#2F6FD6", "#2D8A56", "#8C72D1", "#D67A59", "#CC6B7D", "#2A8F85"];

function corAvatar(nome = "") {
  let soma = 0;
  for (let i = 0; i < nome.length; i++) soma += nome.charCodeAt(i);
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
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
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

  const salvar = async (ev) => {
    ev.preventDefault();
    if (ocupado) return;
    setMsg("");
    if (form.nome.trim().length < 2) return setErro("Digite o nome ou apelido (mínimo 2 letras).");
    setErro("");
    setOcupado(true);
    try {
      await onSalvar(form);
      setMsg(editando ? "Perfil atualizado com sucesso." : "Perfil criado com sucesso.");
      setForm(VAZIO);
    } catch (e) {
      setErro(e.message);
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
    setErro("");
    setMsg("");
    try {
      await onExcluir(id);
      setMsg("Perfil excluído, junto com as partidas e relatórios dele.");
    } catch (e) {
      setErro(e.message);
    } finally {
      setConfirmarId(null);
      setOcupado(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-5" aria-label="Perfis das crianças">
      <Card tone="institutional" className="p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold text-ink m-0">Perfis das crianças</h1>
        <p className="mt-1 mb-0 text-sm text-ink-muted">
          Escolha quem vai brincar. As partidas, a preferência de voz e os relatórios ficam ligados ao perfil
          selecionado.
        </p>
      </Card>

      <Card tone="institutional">
        <CardHeader>
          <CardTitle>Perfis cadastrados</CardTitle>
          <Badge variant="muted">
            {criancas.length} {criancas.length === 1 ? "criança" : "crianças"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {carregando && (
            <p className="m-0 text-sm font-semibold text-ink-muted" role="status">
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
            <Alert variant="info">
              <span>Nenhum perfil cadastrado ainda. Adicione a primeira criança no formulário abaixo.</span>
            </Alert>
          )}

          {criancas.length > 0 && (
            <ul className="m-0 list-none space-y-3 p-0">
              {criancas.map((c) => {
                const ativo = String(ativaId) === String(c.id);
                const confirmando = confirmarId === c.id;
                const inicial = (c.name || "?").trim().charAt(0).toUpperCase();
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition-colors",
                      ativo
                        ? "border-brand/40 bg-brand-soft/45"
                        : "border-inst-border bg-inst-subtle/30 hover:bg-inst-subtle/60",
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
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-base font-bold text-ink">{c.name}</strong>
                          {ativo && <Badge variant="success">Jogando agora</Badge>}
                        </div>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {c.age} anos · {c.voice_enabled === false ? "Mudo por padrão" : "Voz ativa"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={ativo ? "success" : "institutional"}
                        size="sm"
                        aria-pressed={ativo}
                        onClick={() => onSelecionar(c.id)}
                      >
                        {ativo && <Check size={15} />}
                        {ativo ? "Jogando" : "Escolher"}
                      </Button>
                      <Button
                        variant="outlineInst"
                        size="sm"
                        onClick={() => {
                          setForm({
                            id: c.id,
                            nome: c.name,
                            idade: String(c.age),
                            vozAtiva: c.voice_enabled !== false,
                          });
                          setConfirmarId(null);
                          setErro("");
                          setMsg("");
                        }}
                      >
                        <Pencil size={14} />
                        Editar
                      </Button>
                      <Button
                        variant={confirmando ? "danger" : "dangerSoft"}
                        size="sm"
                        disabled={ocupado}
                        aria-busy={ocupado && confirmando}
                        onClick={() => excluir(c.id)}
                      >
                        <Trash2 size={14} />
                        {confirmando ? "Confirmar exclusão?" : "Excluir"}
                      </Button>
                      {confirmando && (
                        <Button
                          variant="outlineInst"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => setConfirmarId(null)}
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

      <Card tone="institutional">
        <CardHeader>
          <CardTitle>{editando ? "Editar perfil" : "Novo perfil"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={salvar} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pf-nome">Nome ou apelido</Label>
                <Input
                  id="pf-nome"
                  maxLength={80}
                  placeholder="Ex.: Lucas"
                  value={form.nome}
                  invalid={Boolean(erro)}
                  aria-invalid={Boolean(erro)}
                  onChange={(e) => {
                    setForm({ ...form, nome: e.target.value });
                    if (erro) setErro("");
                  }}
                />
              </div>

              <div>
                <Label htmlFor="pf-idade">Idade / Nível</Label>
                <Select
                  id="pf-idade"
                  value={form.idade}
                  onChange={(e) => setForm({ ...form, idade: e.target.value })}
                >
                  {IDADES_PERFIL.map((item) => (
                    <option key={item.valor} value={item.valor}>
                      {item.rotulo}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-ink cursor-pointer" htmlFor="pf-voz">
              <input
                id="pf-voz"
                type="checkbox"
                className="h-4 w-4 rounded accent-brand"
                checked={form.vozAtiva}
                onChange={(e) => setForm({ ...form, vozAtiva: e.target.checked })}
              />
              <span>Iniciar jogos com narração de voz ativa</span>
            </label>

            {erro && <Alert variant="error">{erro}</Alert>}
            {msg && <Alert variant="success">{msg}</Alert>}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button type="submit" variant="institutional" size="md" disabled={ocupado} aria-busy={ocupado}>
                {!editando && <Plus size={16} />}
                {ocupado ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar criança"}
              </Button>
              {editando && (
                <Button
                  variant="outlineInst"
                  size="md"
                  onClick={() => {
                    setForm(VAZIO);
                    setErro("");
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
