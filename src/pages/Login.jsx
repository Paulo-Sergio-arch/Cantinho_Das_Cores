import { useEffect, useState } from "react";
import { emailOk } from "../utils/validacao";
import { redefinirSenha, solicitarCodigoSenha } from "../services/auth";
import Nuvi from "../components/Nuvi";
import Titulo from "../components/Titulo";
import {
  IconEscudo,
  IconFechar,
  IconOlhoAberto,
  IconOlhoFechado,
} from "../components/IconesUI";

function ModalTermos({ aoFechar }) {
  useEffect(() => {
    const aoTeclar = (ev) => {
      if (ev.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-termos-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div className="modal-card">
        <div className="modal-topo">
          <h2 id="modal-termos-titulo" className="modal-titulo">
            Termos de Uso e Privacidade (LGPD)
          </h2>
          <button
            type="button"
            className="btn neutro peq modal-fechar"
            onClick={aoFechar}
            aria-label="Fechar termos de uso"
          >
            <IconFechar size={18} />
          </button>
        </div>

        <div className="modal-corpo">
          <p>
            O <strong>Cantinho das Cores</strong> é uma plataforma educativa acessível voltada ao apoio pedagógico de
            crianças, incluindo estudantes neurodivergentes (TEA), com acompanhamento por responsáveis e educadores.
          </p>
          <h3>1. Finalidade e coleta mínima de dados</h3>
          <p>
            Coletamos apenas os dados estritamente necessários para funcionamento da conta do responsável (nome, e-mail
            e senha protegida por criptografia) e dos perfis das crianças (apelido/nome, faixa etária e resultados das
            atividades educativas).
          </p>
          <h3>2. Proteção de crianças (Art. 14 da LGPD)</h3>
          <p>
            O cadastro e a gestão dos perfis infantis são realizados exclusivamente sob consentimento do responsável
            legal ou educador autorizado. O modo <strong>Visitante</strong> permite testar todos os jogos sem gravar
            dados pessoais.
          </p>
          <h3>3. Controle e exclusão</h3>
          <p>
            Você pode editar ou excluir qualquer perfil de criança ou sua própria conta a qualquer momento; a exclusão
            remove imediatamente os perfis, partidas e relatórios associados.
          </p>
        </div>

        <div className="modal-rodape">
          <button type="button" className="btn peq" onClick={aoFechar}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login({ onLogin, onCadastro, onVisitante, aviso }) {
  const [modo, setModo] = useState("entrar"); // entrar | cadastrar | recuperar
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [manterConectado, setManterConectado] = useState(false);
  const [aceito, setAceito] = useState(false);
  const [abrirTermos, setAbrirTermos] = useState(false);
  const [erro, setErro] = useState("");
  const [msgOk, setMsgOk] = useState("");
  const [campoErro, setCampoErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cadastro = modo === "cadastrar";
  const recuperando = modo === "recuperar";

  const falhar = (campo, msg) => {
    setCampoErro(campo);
    setMsgOk("");
    setErro(msg);
  };

  const trocarModo = (novo) => {
    setModo(novo);
    setErro("");
    setMsgOk("");
    setCampoErro("");
    if (novo !== "recuperar") {
      setCodigo("");
      setCodigoEnviado(false);
    }
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    if (enviando) return;

    if (recuperando) {
      if (!emailOk(email)) return falhar("email", "Digite o e-mail cadastrado.");
      setErro("");
      setCampoErro("");
      setEnviando(true);
      try {
        if (!codigoEnviado) {
          const resp = await solicitarCodigoSenha(email);
          setCodigoEnviado(true);
          setMsgOk(resp.message || "Código enviado! Confira seu e-mail.");
        } else {
          if (codigo.trim().length < 6) return falhar("codigo", "Digite o código de 6 dígitos recebido.");
          if (senha.length < 8) return falhar("senha", "A nova senha precisa ter pelo menos 8 caracteres.");
          const resp = await redefinirSenha({ email, codigo, novaSenha: senha });
          setSenha("");
          setCodigo("");
          setCodigoEnviado(false);
          setModo("entrar");
          setMsgOk(resp.message || "Senha redefinida! Entre com a nova senha.");
        }
      } catch (e) {
        setErro(e.message);
      } finally {
        setEnviando(false);
      }
      return;
    }

    if (cadastro && nome.trim().length < 2) return falhar("nome", "Digite seu nome (mínimo 2 letras).");
    if (!emailOk(email)) return falhar("email", "Digite um e-mail válido (ex.: nome@exemplo.com).");
    if (cadastro && senha.length < 8) return falhar("senha", "A senha precisa ter pelo menos 8 caracteres.");
    if (!cadastro && !senha) return falhar("senha", "Digite sua senha.");
    if (cadastro && !aceito) return falhar("aceito", "Aceite os termos de uso e privacidade para criar a conta.");

    setErro("");
    setMsgOk("");
    setCampoErro("");
    setEnviando(true);
    try {
      if (cadastro) {
        await onCadastro({ nome: nome.trim(), email, senha, aceitouTermos: true, manterConectado });
      } else {
        await onLogin({ email, senha, manterConectado });
      }
    } catch (e) {
      const conflito = e.status === 409;
      falhar(conflito ? "email" : "", conflito ? "Este e-mail já tem cadastro. Tente entrar." : e.message);
    } finally {
      setEnviando(false);
    }
  };

  const visitante = async () => {
    if (enviando) return;
    setEnviando(true);
    setErro("");
    try {
      await onVisitante();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const limpar = (campo) => campoErro === campo && setCampoErro("");

  return (
    <main className="tela login">
      <div className="login-header">
        <Titulo t="Cantinho das Cores" />
        <p className="login-tagline">
          Jogos educativos acessíveis para crianças e painel pedagógico para famílias e professores.
        </p>
      </div>

      <Nuvi compacta fala="Oi! Um adulto pode entrar abaixo ou testar direto como visitante." />

      <form
        className="cartao"
        onSubmit={enviar}
        noValidate
        aria-describedby={erro || aviso ? "login-erro" : undefined}
      >
        <div className="login-modos" role="group" aria-label="Modo de acesso">
          <button
            type="button"
            className={`chip ${modo === "entrar" ? "on" : ""}`}
            aria-pressed={modo === "entrar"}
            onClick={() => trocarModo("entrar")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`chip ${cadastro ? "on" : ""}`}
            aria-pressed={cadastro}
            onClick={() => trocarModo("cadastrar")}
          >
            Criar conta
          </button>
          <button
            type="button"
            className={`chip ${recuperando ? "on" : ""}`}
            aria-pressed={recuperando}
            onClick={() => trocarModo("recuperar")}
          >
            Recuperar senha
          </button>
        </div>

        {cadastro && (
          <div className="campo-grupo">
            <label className="campo-rotulo" htmlFor="nm">
              Nome do responsável
            </label>
            <input
              id="nm"
              autoComplete="name"
              placeholder="Seu nome completo"
              className={campoErro === "nome" ? "invalido" : ""}
              aria-invalid={campoErro === "nome"}
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                limpar("nome");
              }}
            />
          </div>
        )}

        <div className="campo-grupo">
          <label className="campo-rotulo" htmlFor="gm">
            E-mail do responsável
          </label>
          <input
            id="gm"
            type="email"
            autoComplete="email"
            placeholder="nome@exemplo.com"
            className={campoErro === "email" ? "invalido" : ""}
            aria-invalid={campoErro === "email"}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              limpar("email");
            }}
          />
        </div>

        {recuperando && codigoEnviado && (
          <div className="campo-grupo">
            <label className="campo-rotulo" htmlFor="cd">
              Código de 6 dígitos
            </label>
            <input
              id="cd"
              inputMode="numeric"
              maxLength={8}
              placeholder="000000"
              className={campoErro === "codigo" ? "invalido" : ""}
              aria-invalid={campoErro === "codigo"}
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value);
                limpar("codigo");
              }}
            />
          </div>
        )}

        {(!recuperando || codigoEnviado) && (
          <div className="campo-grupo">
            <label className="campo-rotulo" htmlFor="sn">
              {recuperando ? "Nova senha" : "Senha"}
            </label>
            <div className="senha-wrap">
              <input
                id="sn"
                type={mostrarSenha ? "text" : "password"}
                autoComplete={cadastro || recuperando ? "new-password" : "current-password"}
                placeholder={cadastro || recuperando ? "Mínimo 8 caracteres (letras e números)" : "Sua senha"}
                className={campoErro === "senha" ? "invalido" : ""}
                aria-invalid={campoErro === "senha"}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  limpar("senha");
                }}
              />
              <button
                type="button"
                className="btn-mostrar-senha"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-pressed={mostrarSenha}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <IconOlhoFechado size={19} /> : <IconOlhoAberto size={19} />}
                <span>{mostrarSenha ? "Ocultar" : "Mostrar"}</span>
              </button>
            </div>
          </div>
        )}

        {!recuperando && (
          <label className="check" htmlFor="manter-check">
            <input
              id="manter-check"
              type="checkbox"
              checked={manterConectado}
              onChange={(e) => setManterConectado(e.target.checked)}
            />
            <span className="check-texto">Manter conectado neste dispositivo</span>
          </label>
        )}

        {cadastro && (
          <div className={`check ${campoErro === "aceito" ? "invalido" : ""}`}>
            <input
              id="resp-check"
              type="checkbox"
              checked={aceito}
              aria-invalid={campoErro === "aceito"}
              onChange={(e) => {
                setAceito(e.target.checked);
                limpar("aceito");
              }}
            />
            <label htmlFor="resp-check" className="check-texto">
              Sou o responsável pela criança e aceito os{" "}
              <button
                type="button"
                className="link-inline"
                onClick={(ev) => {
                  ev.preventDefault();
                  setAbrirTermos(true);
                }}
              >
                Termos de uso e Privacidade (LGPD)
              </button>
              .
            </label>
          </div>
        )}

        {msgOk && (
          <div className="aviso-api ok" role="status">
            <span>{msgOk}</span>
          </div>
        )}

        {(erro || aviso) && (
          <p id="login-erro" className="erro" role="alert">
            {erro || aviso}
          </p>
        )}

        <div className="login-acoes">
          <button type="submit" className="btn" disabled={enviando} aria-busy={enviando}>
            {enviando
              ? "Aguarde…"
              : recuperando
                ? codigoEnviado
                  ? "Redefinir senha"
                  : "Enviar código por e-mail"
                : cadastro
                  ? "Criar conta"
                  : "Entrar"}
          </button>

          {!recuperando && (
            <>
              <div className="login-divisor" aria-hidden="true">
                <span>ou</span>
              </div>

              <button
                type="button"
                className="btn neutro login-btn-visitante"
                onClick={visitante}
                disabled={enviando}
                aria-busy={enviando}
              >
                Entrar como visitante
              </button>
              <p className="login-visitante-nota">
                No modo visitante você testa todos os jogos sem cadastro (as partidas não ficam salvas).
              </p>
            </>
          )}
        </div>
      </form>

      <footer className="login-rodape">
        <span className="login-rodape-item">
          <IconEscudo size={15} />
          Ambiente educativo acessível (TEA / WCAG) · Proteção de dados LGPD
        </span>
        <button type="button" className="link-inline" onClick={() => setAbrirTermos(true)}>
          Termos e Privacidade
        </button>
      </footer>

      {abrirTermos && <ModalTermos aoFechar={() => setAbrirTermos(false)} />}
    </main>
  );
}
