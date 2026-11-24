import { useState } from "react";
import { FAIXAS_ETARIAS } from "../data/jogosData";

const VAZIO = { id: null, nome: "", idade: "8" };

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
}) {
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmarId, setConfirmarId] = useState(null);

  if (visitante) {
    return (
      <section className="pais-painel" aria-label="Perfis das crianças">
        <div className="pais-cabecalho">
          <div>
            <h1 className="pais-titulo">Perfis das crianças</h1>
            <p className="pais-subtitulo">
              Cadastre cada criança para personalizar a idade e acompanhar o progresso individual.
            </p>
          </div>
        </div>
        <div className="aviso-api">
          <span>
            O visitante pode jogar, mas as partidas não ficam salvas. Entre com uma conta de responsável para cadastrar
            perfis e acompanhar o desempenho.
          </span>
        </div>
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
    <section className="pais-painel" aria-label="Perfis das crianças">
      <div className="pais-cabecalho">
        <div>
          <h1 className="pais-titulo">Perfis das crianças</h1>
          <p className="pais-subtitulo">
            Escolha quem vai brincar. As partidas, a faixa etária e os relatórios ficam ligados ao perfil selecionado.
          </p>
        </div>
      </div>

      <div className="pais-bloco">
        <div className="pais-bloco-topo">
          <h2>Perfis cadastrados</h2>
          <span className="pais-legenda">
            {criancas.length} {criancas.length === 1 ? "criança" : "crianças"}
          </span>
        </div>

        {carregando && <p role="status">Carregando perfis…</p>}
        {erroLista && (
          <div className="aviso-api erro" role="alert">
            <span>{erroLista}</span>
            <button type="button" className="btn neutro peq" onClick={onRecarregar}>
              Tentar de novo
            </button>
          </div>
        )}
        {!carregando && !erroLista && criancas.length === 0 && (
          <div className="aviso-api info">
            <span>Nenhum perfil cadastrado ainda. Adicione a primeira criança no formulário abaixo.</span>
          </div>
        )}

        {criancas.length > 0 && (
          <ul className="perfis-lista">
            {criancas.map((c) => {
              const ativo = String(ativaId) === String(c.id);
              const confirmando = confirmarId === c.id;
              return (
                <li key={c.id} className={`perfil-item ${ativo ? "ativo" : ""}`}>
                  <span className="perfil-nome">
                    <strong>{c.name}</strong> · {c.age} anos
                  </span>
                  <div className="perfil-acoes">
                    <button
                      type="button"
                      className={`btn peq ${ativo ? "ok" : ""}`}
                      aria-pressed={ativo}
                      onClick={() => onSelecionar(c.id)}
                    >
                      {ativo ? "Jogando" : "Escolher"}
                    </button>
                    <button
                      type="button"
                      className="btn neutro peq"
                      onClick={() => {
                        setForm({ id: c.id, nome: c.name, idade: String(c.age) });
                        setConfirmarId(null);
                        setErro("");
                        setMsg("");
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`btn peq ${confirmando ? "perigo" : "perigo-suave"}`}
                      disabled={ocupado}
                      aria-busy={ocupado && confirmando}
                      onClick={() => excluir(c.id)}
                    >
                      {confirmando ? "Confirmar exclusão?" : "Excluir"}
                    </button>
                    {confirmando && (
                      <button
                        type="button"
                        className="btn neutro peq"
                        disabled={ocupado}
                        onClick={() => setConfirmarId(null)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pais-bloco">
        <div className="pais-bloco-topo">
          <h2>{editando ? "Editar perfil" : "Novo perfil"}</h2>
        </div>

        <form className="perfil-form" onSubmit={salvar} noValidate>
          <div className="perfil-form-grid">
            <div className="campo-grupo">
              <label className="campo-rotulo" htmlFor="pf-nome">
                Nome ou apelido
              </label>
              <input
                id="pf-nome"
                className={`campo-input ${erro ? "invalido" : ""}`}
                maxLength={80}
                placeholder="Ex.: Lucas"
                value={form.nome}
                aria-invalid={Boolean(erro)}
                onChange={(e) => {
                  setForm({ ...form, nome: e.target.value });
                  if (erro) setErro("");
                }}
              />
            </div>

            <div className="campo-grupo">
              <label className="campo-rotulo" htmlFor="pf-idade">
                Idade / Nível
              </label>
              <select
                id="pf-idade"
                className="campo-select"
                value={form.idade}
                onChange={(e) => setForm({ ...form, idade: e.target.value })}
              >
                {FAIXAS_ETARIAS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}
          {msg && (
            <div className="aviso-api ok" role="status">
              <span>{msg}</span>
            </div>
          )}

          <div className="perfil-form-acoes">
            <button type="submit" className="btn peq" disabled={ocupado} aria-busy={ocupado}>
              {ocupado ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar criança"}
            </button>
            {editando && (
              <button
                type="button"
                className="btn neutro peq"
                onClick={() => {
                  setForm(VAZIO);
                  setErro("");
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
