import { useState } from "react";
import { motion } from "motion/react";
import {
  Contrast,
  Eye,
  EyeOff,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { emailOk } from "../utils/validacao";
import { redefinirSenha, solicitarCodigoSenha } from "../services/auth";
import Fundo from "../components/Fundo";
import nuviLoginHero from "../assets/nuvi-login-hero.png";
import { Alert, Button, Dialog, Input, Label } from "../components/ui";
import { cn } from "../lib/cn";

function MarcaLogo({ className = "" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="Cantinho das Cores">
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true" className="shrink-0">
        <circle cx="8" cy="8" r="5" fill="#D9534F" />
        <circle cx="20" cy="8" r="5" fill="#E8B638" />
        <circle cx="8" cy="20" r="5" fill="#2F6FD6" />
        <circle cx="20" cy="20" r="5" fill="#2D8A56" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        Cantinho das Cores
      </span>
    </span>
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
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* Lado Esquerdo: Cenário ilustrado da marca + Nuvi + Selos de confiança */}
      <section
        className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#CBE8FF] via-[#E8F6FE] to-[#D6F0DC] px-6 py-8 sm:px-12 sm:py-10 lg:min-h-screen alto-contraste:bg-none alto-contraste:bg-white alto-contraste:border-b-2 lg:alto-contraste:border-b-0 lg:alto-contraste:border-r-2 alto-contraste:border-slate-950"
        aria-label="Apresentação do Cantinho das Cores"
      >
        <Fundo variant="login" />

        <div className="relative z-10">
          <MarcaLogo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 my-8 flex flex-col items-center text-center lg:my-0"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink max-w-md leading-tight m-0">
            Aprender no seu ritmo, com cores e acolhimento
          </h1>
          <motion.img
            src={nuviLoginHero}
            alt="Mascote Nuvi cercada por formas geométricas coloridas"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="my-5 w-full max-w-[330px] sm:max-w-[360px] h-auto select-none pointer-events-none drop-shadow-[0_10px_18px_rgba(31,45,77,0.08)]"
          />
          <p className="m-0 max-w-md text-sm sm:text-base text-ink/85 leading-relaxed">
            Jogos educativos acessíveis pensados para conforto sensorial (TEA) e painel pedagógico completo para
            famílias e professores.
          </p>
        </motion.div>

        <div className="relative z-10 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/75 px-3.5 py-2.5 text-xs font-bold text-ink shadow-xs backdrop-blur-sm alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950">
            <HeartHandshake size={18} className="shrink-0 text-brand" aria-hidden="true" />
            <span>Inclusivo (TEA)</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/75 px-3.5 py-2.5 text-xs font-bold text-ink shadow-xs backdrop-blur-sm alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950">
            <Contrast size={18} className="shrink-0 text-success" aria-hidden="true" />
            <span>Alto Contraste &amp; Calmo</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/75 px-3.5 py-2.5 text-xs font-bold text-ink shadow-xs backdrop-blur-sm alto-contraste:bg-white alto-contraste:border-2 alto-contraste:border-slate-950">
            <ShieldCheck size={18} className="shrink-0 text-ink" aria-hidden="true" />
            <span>Protegido pela LGPD</span>
          </div>
        </div>
      </section>

      {/* Lado Direito: Formulário institucional limpo (shadcn/ui aesthetic) */}
      <section className="flex flex-col items-center justify-center bg-inst-surface px-5 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <form
            className="rounded-3xl border border-inst-border bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)] alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none"
            onSubmit={enviar}
            noValidate
            aria-describedby={erro || aviso ? "login-erro" : undefined}
          >
            {/* Segmented switcher */}
            <div
              className="mb-6 grid grid-cols-2 rounded-xl bg-inst-subtle p-1 alto-contraste:bg-white alto-contraste:border alto-contraste:border-slate-950"
              role="group"
              aria-label="Modo de acesso"
            >
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-lg px-3 py-2 text-sm font-bold transition-all",
                  modo === "entrar"
                    ? "bg-white text-ink shadow-xs alto-contraste:bg-slate-950 alto-contraste:text-white"
                    : "text-ink-muted hover:text-ink"
                )}
                aria-pressed={modo === "entrar"}
                onClick={() => trocarModo("entrar")}
              >
                Entrar
              </button>
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-lg px-3 py-2 text-sm font-bold transition-all",
                  cadastro
                    ? "bg-white text-ink shadow-xs alto-contraste:bg-slate-950 alto-contraste:text-white"
                    : "text-ink-muted hover:text-ink"
                )}
                aria-pressed={cadastro}
                onClick={() => trocarModo("cadastrar")}
              >
                Criar conta
              </button>
            </div>

            <div className="mb-5">
              <h2 className="font-display text-2xl font-semibold text-ink m-0">
                {recuperando
                  ? "Recuperar senha"
                  : cadastro
                    ? "Crie sua conta de responsável"
                    : "Bem-vindo de volta"}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {recuperando
                  ? codigoEnviado
                    ? "Digite o código recebido por e-mail e escolha uma nova senha."
                    : "Informe seu e-mail cadastrado para receber o código de redefinição."
                  : cadastro
                    ? "Acompanhe perfis infantis, desempenho e relatórios pedagógicos."
                    : "Entre como responsável ou teste todos os jogos como visitante."}
              </p>
            </div>

            <div className="space-y-4">
              {cadastro && (
                <div>
                  <Label htmlFor="nm">Nome do responsável</Label>
                  <Input
                    id="nm"
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    invalid={campoErro === "nome"}
                    aria-invalid={campoErro === "nome"}
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      limpar("nome");
                    }}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="gm">E-mail do responsável</Label>
                <Input
                  id="gm"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@exemplo.com"
                  invalid={campoErro === "email"}
                  aria-invalid={campoErro === "email"}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    limpar("email");
                  }}
                />
              </div>

              {recuperando && codigoEnviado && (
                <div>
                  <Label htmlFor="cd">Código de 6 dígitos</Label>
                  <Input
                    id="cd"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="000000"
                    invalid={campoErro === "codigo"}
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
                <div>
                  <Label htmlFor="sn">{recuperando ? "Nova senha" : "Senha"}</Label>
                  <div className="relative flex items-center">
                    <Input
                      id="sn"
                      type={mostrarSenha ? "text" : "password"}
                      autoComplete={cadastro || recuperando ? "new-password" : "current-password"}
                      placeholder={
                        cadastro || recuperando ? "Mínimo 8 caracteres (letras e números)" : "Sua senha"
                      }
                      invalid={campoErro === "senha"}
                      aria-invalid={campoErro === "senha"}
                      value={senha}
                      className="pr-24"
                      onChange={(e) => {
                        setSenha(e.target.value);
                        limpar("senha");
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-2 inline-flex min-h-8 items-center gap-1 rounded-lg bg-inst-subtle px-2.5 text-xs font-bold text-ink hover:bg-slate-200"
                      onClick={() => setMostrarSenha((v) => !v)}
                      aria-pressed={mostrarSenha}
                      aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                      <span>{mostrarSenha ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>
                </div>
              )}

              {!recuperando && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer" htmlFor="manter-check">
                    <input
                      id="manter-check"
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-brand"
                      checked={manterConectado}
                      onChange={(e) => setManterConectado(e.target.checked)}
                    />
                    <span>Manter conectado</span>
                  </label>
                  {!cadastro && (
                    <button
                      type="button"
                      className="text-sm font-bold text-brand hover:underline"
                      onClick={() => trocarModo("recuperar")}
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
              )}

              {cadastro && (
                <div
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed",
                    campoErro === "aceito"
                      ? "border-danger bg-danger-soft/50 text-danger"
                      : "border-inst-border bg-inst-subtle/50 text-ink"
                  )}
                >
                  <input
                    id="resp-check"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand"
                    checked={aceito}
                    aria-invalid={campoErro === "aceito"}
                    onChange={(e) => {
                      setAceito(e.target.checked);
                      limpar("aceito");
                    }}
                  />
                  <label htmlFor="resp-check" className="cursor-pointer">
                    Sou o responsável pela criança e aceito os{" "}
                    <button
                      type="button"
                      className="font-bold text-brand underline"
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

              {msgOk && <Alert variant="success">{msgOk}</Alert>}

              {(erro || aviso) && (
                <Alert id="login-erro" variant="error">
                  <span>{erro || aviso}</span>
                </Alert>
              )}

              <div className="space-y-3 pt-1">
                <Button
                  type="submit"
                  variant="playful"
                  size="lg"
                  className="w-full"
                  disabled={enviando}
                  aria-busy={enviando}
                >
                  {enviando
                    ? "Aguarde…"
                    : recuperando
                      ? codigoEnviado
                        ? "Redefinir senha"
                        : "Enviar código por e-mail"
                      : cadastro
                        ? "Criar conta"
                        : "Entrar"}
                </Button>

                {recuperando ? (
                  <Button
                    type="button"
                    variant="outlineInst"
                    size="md"
                    className="w-full"
                    onClick={() => trocarModo("entrar")}
                  >
                    Voltar para o login
                  </Button>
                ) : (
                  <>
                    <div className="relative flex items-center py-1" aria-hidden="true">
                      <div className="flex-grow border-t border-inst-border" />
                      <span className="mx-3 text-xs font-bold uppercase tracking-wider text-ink-muted">ou</span>
                      <div className="flex-grow border-t border-inst-border" />
                    </div>

                    <Button
                      type="button"
                      variant="outlineInst"
                      size="md"
                      className="w-full"
                      onClick={visitante}
                      disabled={enviando}
                      aria-busy={enviando}
                    >
                      <Sparkles size={16} className="text-brand" />
                      Testar como visitante (sem cadastro)
                    </Button>
                    <p className="m-0 text-center text-xs text-ink-muted">
                      No modo visitante você testa todos os jogos livremente (partidas não ficam salvas).
                    </p>
                  </>
                )}
              </div>
            </div>
          </form>

          <footer className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-ink-muted">
            <span>Ambiente educativo acessível (TEA / WCAG)</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              className="font-bold text-ink underline hover:text-brand"
              onClick={() => setAbrirTermos(true)}
            >
              Termos e Privacidade (LGPD)
            </button>
          </footer>
        </motion.div>
      </section>

      <Dialog
        open={abrirTermos}
        onClose={() => setAbrirTermos(false)}
        title="Termos de Uso e Privacidade (LGPD)"
        titleId="modal-termos-titulo"
        footer={
          <Button variant="institutional" size="sm" onClick={() => setAbrirTermos(false)}>
            Entendi
          </Button>
        }
      >
        <p>
          O <strong>Cantinho das Cores</strong> é uma plataforma educativa acessível voltada ao apoio pedagógico de
          crianças, incluindo estudantes neurodivergentes (TEA), com acompanhamento por responsáveis e educadores.
        </p>
        <h3 className="font-display text-base font-semibold text-ink pt-1">
          1. Finalidade e coleta mínima de dados
        </h3>
        <p>
          Coletamos apenas os dados estritamente necessários para funcionamento da conta do responsável (nome, e-mail e
          senha protegida por criptografia) e dos perfis das crianças (apelido/nome, faixa etária e resultados das
          atividades educativas).
        </p>
        <h3 className="font-display text-base font-semibold text-ink pt-1">
          2. Proteção de crianças (Art. 14 da LGPD)
        </h3>
        <p>
          O cadastro e a gestão dos perfis infantis são realizados exclusivamente sob consentimento do responsável legal
          ou educador autorizado. O modo <strong>Visitante</strong> permite testar todos os jogos sem gravar dados
          pessoais.
        </p>
        <h3 className="font-display text-base font-semibold text-ink pt-1">3. Controle e exclusão</h3>
        <p>
          Você pode editar ou excluir qualquer perfil de criança ou sua própria conta a qualquer momento; a exclusão
          remove imediatamente os perfis, partidas e relatórios associados.
        </p>
      </Dialog>
    </main>
  );
}
