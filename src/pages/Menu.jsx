import { useRef, useState } from "react";
import {
  CORES_AUTISMO,
  CORES_AUTISMO_CONTRASTE,
  FAIXAS_ETARIAS,
  obterFaixaEtaria,
} from "../data/jogosData";
import Nuvi from "../components/Nuvi";
import IconeMenu from "../components/IconeMenu";
import { ShapePhysics } from "../components/shape-physics";
import {
  IconAjustes,
  IconBlocos,
  IconCadeado,
  IconChacoalhar,
  IconContraste,
  IconCriancas,
  IconCubo,
  IconEstrela,
  IconFonte,
  IconGamepad,
  IconGrafico,
  IconMais,
  IconNuvemCalma,
  IconQuadrado,
  IconReiniciar,
  IconSair,
  IconSinoOff,
  IconSinoOn,
  IconUsuario,
  IconVelocidade,
  IconVozOff,
  IconVozOn,
} from "../components/IconesUI";
import PainelPais from "./PainelPais";
import PerfisCriancas from "./PerfisCriancas";

function MarcaCompacta() {
  return (
    <span className="marca-compacta" aria-label="Cantinho das Cores">
      <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden="true">
        <circle cx="8" cy="8" r="5" fill="#F25C54" />
        <circle cx="20" cy="8" r="5" fill="#FFC93C" />
        <circle cx="8" cy="20" r="5" fill="#2D7FF9" />
        <circle cx="20" cy="20" r="5" fill="#24A159" />
      </svg>
      <span className="marca-nome">Cantinho das Cores</span>
    </span>
  );
}

const ABAS = [
  { id: "jogos", rotulo: "Jogos", Icon: IconGamepad },
  { id: "bloquinhos", rotulo: "Bloquinhos", Icon: IconBlocos },
  { id: "perfis", rotulo: "Crianças", Icon: IconCriancas },
  { id: "pais", rotulo: "Pais e Professores", Icon: IconGrafico },
];

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
    <main className="tela">
      <header className="barra no-print">
        <div className="barra-topo">
          <div className="barra-identidade">
            <MarcaCompacta />
            <span className="barra-sep" aria-hidden="true" />
            {visitante ? (
              <span className="barra-contexto barra-contexto-visitante" title="Visitante — partidas não ficam salvas">
                <IconUsuario size={15} />
                <span>Visitante</span>
                <button type="button" className="barra-link-inline" onClick={onSair}>
                  Entrar
                </button>
              </span>
            ) : criancaAtiva ? (
              <span className="barra-contexto" title={`Responsável: ${resp}`}>
                <IconCriancas size={15} />
                <span className="barra-contexto-texto">
                  <strong>{criancaAtiva.name}</strong> ({criancaAtiva.age} anos)
                </span>
                <button type="button" className="barra-link-inline" onClick={() => onAlterarAba("perfis")}>
                  Trocar
                </button>
              </span>
            ) : (
              <span className="barra-contexto" title={resp}>
                <IconUsuario size={15} />
                <span className="barra-contexto-texto">{resp}</span>
                <button type="button" className="barra-link-inline" onClick={() => onAlterarAba("perfis")}>
                  + Perfil
                </button>
              </span>
            )}
          </div>

          <div className="barra-acoes">
            <button
              type="button"
              className={`btn neutro peq ${som ? "" : "barra-mudo"}`}
              onClick={onToggleSom}
              aria-pressed={som}
              title={som ? "Desativar voz" : "Ativar voz"}
            >
              {som ? <IconVozOn size={17} /> : <IconVozOff size={17} />}
              <span>{som ? "Voz" : "Mudo"}</span>
            </button>
            <button
              type="button"
              className={`btn neutro peq ${abrirPrefs ? "ativo" : ""}`}
              onClick={() => setAbrirPrefs((v) => !v)}
              aria-expanded={abrirPrefs}
              aria-controls="painel-acessibilidade"
              aria-label="Acessibilidade e ajustes"
              title="Acessibilidade e ajustes"
            >
              <IconAjustes size={17} />
              <span>Ajustes</span>
            </button>
            <button
              type="button"
              className="btn neutro peq"
              onClick={onSair}
              title={visitante ? "Voltar para a tela de login" : "Sair da conta"}
            >
              <IconSair size={17} />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {abrirPrefs && (
          <div id="painel-acessibilidade" className="prefs-painel">
            <div className="prefs-chips">
              <button
                type="button"
                className={`chip ${fonteMaior ? "on" : ""}`}
                onClick={onToggleFonteMaior}
                aria-pressed={fonteMaior}
              >
                <IconFonte size={16} />
                Fonte A+
              </button>
              <button
                type="button"
                className={`chip ${altoContraste ? "on" : ""}`}
                onClick={onToggleAltoContraste}
                aria-pressed={altoContraste}
              >
                <IconContraste size={16} />
                Alto contraste
              </button>
              <button
                type="button"
                className={`chip ${calmo ? "on" : ""}`}
                onClick={onToggleCalmo}
                aria-pressed={calmo}
              >
                <IconNuvemCalma size={16} />
                Modo calmo
              </button>
              <button
                type="button"
                className={`chip ${efeitos ? "on" : ""}`}
                onClick={onToggleEfeitos}
                aria-pressed={efeitos}
              >
                {efeitos ? <IconSinoOn size={16} /> : <IconSinoOff size={16} />}
                {efeitos ? "Efeitos ON" : "Efeitos OFF"}
              </button>
              <button
                type="button"
                className={`chip ${velocidade === "calma" ? "on" : ""}`}
                onClick={onToggleVelocidade}
                aria-pressed={velocidade === "calma"}
              >
                <IconVelocidade size={16} />
                {velocidade === "calma" ? "Fala calma" : "Fala normal"}
              </button>
              <button
                type="button"
                className="chip"
                disabled={rodadasTravadas}
                title={rodadasTravadas ? "Com um perfil de criança, as partidas têm sempre 5 rodadas" : undefined}
                onClick={() => onAlterarTotal(totalRodadas === 5 ? 3 : 5)}
              >
                <IconEstrela size={16} />
                {totalRodadas} rodadas
              </button>
            </div>
            {vozes.length > 1 && (
              <label className="voz" htmlFor="sel-voz">
                Voz
                <select
                  id="sel-voz"
                  className="campo-select"
                  value={vozSel}
                  onChange={(e) => onTrocarVoz(e.target.value)}
                >
                  {vozes.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!visitante && (onAlterarSenha || onExcluirConta) && (
              <div style={{ borderTop: "1px dashed rgba(43,58,103,0.18)", paddingTop: "8px" }}>
                <button
                  type="button"
                  className="chip"
                  aria-expanded={abrirConta}
                  onClick={() => {
                    setAbrirConta((v) => !v);
                    setErroConta("");
                    setMsgConta("");
                  }}
                >
                  {abrirConta ? "Ocultar dados da conta" : "Minha conta e privacidade (LGPD)"}
                </button>
                {abrirConta && (
                  <div style={{ display: "grid", gap: "12px", marginTop: "10px" }}>
                    <form onSubmit={salvarNovaSenha} style={{ display: "grid", gap: "8px", maxWidth: "400px" }}>
                      <strong>Alterar senha</strong>
                      <input
                        className="campo-input"
                        type="password"
                        placeholder="Senha atual"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                      />
                      <input
                        className="campo-input"
                        type="password"
                        placeholder="Nova senha (mín. 8 caracteres)"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                      />
                      <button type="submit" className="btn peq" disabled={ocupadoConta} aria-busy={ocupadoConta}>
                        Salvar nova senha
                      </button>
                    </form>

                    <form onSubmit={confirmarExclusaoConta} style={{ display: "grid", gap: "8px", maxWidth: "400px" }}>
                      <strong>Excluir minha conta (LGPD)</strong>
                      <small>Remove permanentemente sua conta, perfis das crianças, partidas e relatórios.</small>
                      <input
                        className="campo-input"
                        type="password"
                        placeholder="Confirme sua senha para excluir"
                        value={senhaExclusao}
                        onChange={(e) => setSenhaExclusao(e.target.value)}
                      />
                      <button type="submit" className="btn perigo peq" disabled={ocupadoConta} aria-busy={ocupadoConta}>
                        Excluir conta e todos os dados
                      </button>
                    </form>

                    {erroConta && (
                      <p className="erro" role="alert">
                        {erroConta}
                      </p>
                    )}
                    {msgConta && (
                      <div className="aviso-api ok" role="status">
                        <span>{msgConta}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <nav className="tabs-menu no-print" aria-label="Navegação principal" role="tablist">
        {ABAS.map((item, idx) => {
          const IconeAba = item.Icon;
          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={aba === item.id}
              aria-controls={`painel-${item.id}`}
              className={`tab-btn ${aba === item.id ? "ativa" : ""}`}
              onClick={() => onAlterarAba(item.id)}
              onKeyDown={(ev) => aoTeclarAba(ev, idx)}
            >
              <IconeAba size={18} />
              <span>{item.rotulo}</span>
            </button>
          );
        })}
      </nav>

      {aba === "jogos" && (
        <div id="painel-jogos" role="tabpanel" aria-labelledby="tab-jogos" className="conteudo-infantil">
          <h1 className="sr-only">Cantinho das Cores — Jogos Educativos</h1>

          <section className="jogos-hero" aria-label="Boas-vindas e nível por idade">
            <Nuvi
              compacta
              fala={
                criancaAtiva
                  ? `Oi, ${criancaAtiva.name}! Escolha um jogo para brincar.`
                  : "Oi! Escolha sua idade e um jogo para brincar."
              }
              ouvivel
            />

            <div className="niveis-bloco">
              <div className="niveis-topo">
                <span className="niveis-rotulo">
                  {idadeTravada ? (
                    <>
                      <IconCadeado size={15} />
                      Nível de {criancaAtiva?.name} ({faixaAtual.idade})
                    </>
                  ) : (
                    "Idade / Dificuldade:"
                  )}
                </span>
                <span className="niveis-desc">
                  {visitante
                    ? "Visitante (partidas não salvas) · "
                    : ""}
                  {faixaAtual.descricao}
                </span>
              </div>
              <div className="niveis-opcoes">
                {FAIXAS_ETARIAS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`nivel-chip ${String(idade) === f.id ? "ativo" : ""}`}
                    disabled={idadeTravada}
                    title={idadeTravada ? `Idade definida pelo perfil de ${criancaAtiva?.name}` : undefined}
                    onClick={() => onAlterarIdade(f.id)}
                    aria-pressed={String(idade) === f.id}
                  >
                    <strong>{f.idade}</strong>
                    <span>{f.nivel}</span>
                  </button>
                ))}
              </div>
              {idadeTravada && criancaAtiva && (
                <p className="niveis-travada-nota">
                  <span>
                    Faixa etária definida pelo perfil de <strong>{criancaAtiva.name}</strong>.
                  </span>
                  <button
                    type="button"
                    className="barra-link-inline"
                    onClick={() => onAlterarAba("perfis")}
                  >
                    Alterar em Crianças
                  </button>
                </p>
              )}
              {!visitante && !criancaAtiva && (
                <p className="niveis-travada-nota">
                  <span>Cadastre um perfil de criança para salvar partidas e gerar relatórios.</span>
                  <button
                    type="button"
                    className="barra-link-inline"
                    onClick={() => onAlterarAba("perfis")}
                  >
                    Abrir perfis
                  </button>
                </p>
              )}
            </div>
          </section>

          {jogosCarregando && <p role="status">Carregando jogos…</p>}
          {jogosErro && (
            <div className="aviso-api erro" role="alert">
              <span>{jogosErro}</span>
              <button type="button" className="btn neutro peq" onClick={onRecarregarJogos}>
                Tentar de novo
              </button>
            </div>
          )}

          <div className="menu">
            {jogos.map((j) => (
              <button
                type="button"
                key={j.id}
                className="item"
                style={{ background: j.bg }}
                onClick={() => onSelecionarJogo(j.id)}
              >
                <span className="ico">
                  <IconeMenu id={j.id} />
                </span>
                <span className="nome">{j.nome}</span>
                {j.sub && <span className="sub-jogo">{j.sub}</span>}
                {feitos[j.id] > 0 && (
                  <span
                    className="feitos"
                    aria-label={`${feitos[j.id]} partidas concluídas`}
                  >
                    ★ {feitos[j.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {aba === "bloquinhos" && (
        <section
          id="painel-bloquinhos"
          role="tabpanel"
          aria-labelledby="tab-bloquinhos"
          className="conteudo-infantil bloquinhos-secao"
          aria-label="Bloquinhos interativos"
        >
          <div className="bloquinhos-controles">
            <h1 className="bloquinhos-titulo">Bloquinhos interativos</h1>
            <p className="bloquinhos-aviso">
              Brinque com os bloquinhos nas cores do autismo: arraste, jogue ou toque no espaço vazio.
            </p>

            {calmo && (
              <div className="aviso-api info" role="status">
                <span>O Modo Calmo está ativo e pausou a física dos bloquinhos.</span>
                <button type="button" className="btn neutro peq" onClick={onToggleCalmo}>
                  Desativar Modo Calmo
                </button>
              </div>
            )}

            <div className="bloquinhos-acoes">
              <button
                type="button"
                className="btn peq"
                onClick={() => shapeRef.current?.addShape()}
                disabled={calmo}
              >
                <IconMais size={16} />
                Bloquinho
              </button>
              <button
                type="button"
                className="btn sec peq"
                onClick={() => shapeRef.current?.shake()}
                disabled={calmo}
              >
                <IconChacoalhar size={16} />
                Chacoalhar
              </button>
              <button
                type="button"
                className={`btn neutro peq ${depthFisica === "2d" ? "ativo" : ""}`}
                onClick={onToggleDepthFisica}
              >
                {depthFisica === "3d" ? <IconCubo size={16} /> : <IconQuadrado size={16} />}
                {depthFisica === "3d" ? "Modo 3D" : "Modo 2D"}
              </button>
              <button
                type="button"
                className="btn neutro peq"
                onClick={() => {
                  onReiniciarBloquinhos();
                  shapeRef.current?.replay();
                }}
              >
                <IconReiniciar size={16} />
                Reiniciar
              </button>
            </div>
          </div>

          <div className="bloquinhos-palco">
            <ShapePhysics
              ref={shapeRef}
              height="clamp(360px, 56vh, 520px)"
              depth={depthFisica}
              colors={altoContraste ? CORES_AUTISMO_CONTRASTE : CORES_AUTISMO}
              background={altoContraste ? "#FFFFFF" : "#EAF6FF"}
              count={22}
              size={40}
              paused={calmo}
              followCursor={!calmo}
              seed={seedFisica}
              aria-label="Bloquinhos interativos com as cores do autismo. Arraste um bloquinho ou clique no espaço livre para adicionar."
            />
          </div>
        </section>
      )}

      {aba === "perfis" && (
        <div id="painel-perfis" role="tabpanel" aria-labelledby="tab-perfis" style={{ width: "100%" }}>
          <PerfisCriancas visitante={visitante} onEntrarConta={onSair} {...perfis} />
        </div>
      )}

      {aba === "pais" && (
        <div id="painel-pais" role="tabpanel" aria-labelledby="tab-pais" style={{ width: "100%" }}>
          <PainelPais
            visitante={visitante}
            criancas={perfis.criancas}
            criancaId={perfis.ativaId}
            onSelecionarCrianca={perfis.onSelecionar}
            onIrPerfis={() => onAlterarAba("perfis")}
            onEntrarConta={onSair}
          />
        </div>
      )}
    </main>
  );
}
