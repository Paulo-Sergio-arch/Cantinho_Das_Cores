import { useState, useEffect, useRef, useCallback } from "react";
import { MotionConfig } from "motion/react";
import {
  cancelarFala,
  definirNomeVoz,
  definirVelocidadeVoz,
  definirVozAtiva,
  falar,
  listarVozes,
  melhorVoz,
  obterNomeVoz,
} from "./utils/voz";
import { definirEfeitosAtivos } from "./utils/sons";
import { lerRotaAtual, sincronizarUrl, tituloParaEstado } from "./utils/rotas";
import { definirAoExpirar, lerExpiracaoToken, lerToken, salvarToken } from "./services/api";
import * as authApi from "./services/auth";
import * as criancasApi from "./services/criancas";
import { listarJogos } from "./services/jogos";
import { montarPayload, registrarPartida } from "./services/partidas";
import { Alert, Button } from "./components/ui";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import JogoCores from "./games/JogoCores";
import JogoEncaixe from "./games/JogoEncaixe";
import JogoLigar from "./games/JogoLigar";
import JogoCorForma from "./games/JogoCorForma";
import JogoFalar from "./games/JogoFalar";
import JogoFrutas from "./games/JogoFrutas";

// Visual e componente de cada jogo, por identificador. Os nomes e a lista de jogos vêm da API (GET /api/games).
const META_JOGOS = {
  cores: { bg: "linear-gradient(160deg,#D2EEFF,#86CCFF)", C: JogoCores },
  encaixe: { bg: "linear-gradient(160deg,#D8F8DF,#86E0A0)", C: JogoEncaixe },
  ligar: { bg: "linear-gradient(160deg,#FFF3C4,#FFD25A)", C: JogoLigar },
  corforma: { bg: "linear-gradient(160deg,#EEE4FF,#BDA2FF)", C: JogoCorForma },
  falar: { bg: "linear-gradient(160deg,#FFE5D6,#FFA784)", C: JogoFalar },
  frutas: { bg: "linear-gradient(160deg,#FFE2E2,#FF9E99)", C: JogoFrutas, sub: "Estilo Dots" },
};

const CHAVE_FILA = "cc_fila_partidas";
const CHAVE_FEITOS_MAPA = "cc_feitos_por_perfil";
const INICIO_PAGINA = Date.now();

function lerFila() {
  return lerStorage(CHAVE_FILA, []);
}

// Mapeia qualquer idade cadastrada (3..18 anos) para um dos 3 níveis pedagógicos do front (8=Fácil, 9=Médio, 10=Avançado).
function idadeDoPerfil(idade) {
  const n = Number(idade) || 8;
  if (n <= 8) return "8";
  if (n === 9) return "9";
  return "10";
}

function lerStorage(chave, fallback) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto !== null ? JSON.parse(bruto) : fallback;
  } catch {
    return fallback;
  }
}

function gravarStorage(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Ignora caso localStorage esteja bloqueado
  }
}

export default function App() {
  const rotaInicialRef = useRef(lerRotaAtual());
  const abandonarJogoRef = useRef(null);
  const [usuario, setUsuario] = useState(null);
  const [tela, setTela] = useState(() => (lerToken() ? "carregando" : "login"));
  const [avisoLogin, setAvisoLogin] = useState("");
  const [avisoApi, setAvisoApi] = useState(null);
  const [catalogo, setCatalogo] = useState({ lista: [], carregando: true, erro: "" });
  const [criancas, setCriancas] = useState([]);
  const [criancasEstado, setCriancasEstado] = useState({ carregando: false, erro: "" });
  const [ativaId, setAtivaId] = useState(() => lerStorage("cc_crianca", ""));
  const enviadasRef = useRef(new Set());
  const enviandoFilaRef = useRef(false);
  const [abaMenu, setAbaMenu] = useState(() => lerRotaAtual().aba || "jogos");
  const [som, setSom] = useState(() => lerStorage("cc_som", true));
  const [efeitos, setEfeitos] = useState(() => lerStorage("cc_efeitos", true));
  const [velocidade, setVelocidade] = useState(() => lerStorage("cc_vel", "calma"));
  const [fonteMaior, setFonteMaior] = useState(() => lerStorage("cc_fonte_maior", false));
  const [altoContraste, setAltoContraste] = useState(() => lerStorage("cc_contraste", false));
  const [calmo, setCalmo] = useState(() => lerStorage("cc_calmo", false));
  const [totalRodadas, setTotalRodadas] = useState(() => lerStorage("cc_total", 5));
  const [idade, setIdade] = useState(() => lerStorage("cc_idade", "8"));
  const [chave, setChave] = useState(0);
  const [feitosMapa, setFeitosMapa] = useState(() => lerStorage(CHAVE_FEITOS_MAPA, {}));
  const [feitosVisitante, setFeitosVisitante] = useState({});
  const [vozes, setVozes] = useState([]);
  const [vozSel, setVozSel] = useState(() => lerStorage("cc_voz", ""));
  const [depthFisica, setDepthFisica] = useState("3d");
  const [seedFisica, setSeedFisica] = useState(52490);

  useEffect(() => {
    definirVozAtiva(som);
    gravarStorage("cc_som", som);
  }, [som]);

  useEffect(() => {
    definirEfeitosAtivos(efeitos);
    gravarStorage("cc_efeitos", efeitos);
  }, [efeitos]);

  useEffect(() => {
    definirVelocidadeVoz(velocidade);
    gravarStorage("cc_vel", velocidade);
  }, [velocidade]);

  useEffect(() => {
    gravarStorage("cc_fonte_maior", fonteMaior);
  }, [fonteMaior]);

  useEffect(() => {
    gravarStorage("cc_contraste", altoContraste);
  }, [altoContraste]);

  useEffect(() => {
    gravarStorage("cc_calmo", calmo);
  }, [calmo]);

  useEffect(() => {
    gravarStorage("cc_total", totalRodadas);
  }, [totalRodadas]);

  useEffect(() => {
    gravarStorage("cc_idade", idade);
  }, [idade]);

  useEffect(() => {
    if (vozSel) {
      definirNomeVoz(vozSel);
      gravarStorage("cc_voz", vozSel);
    }
  }, [vozSel]);

  const avisar = useCallback((texto, tipo = "erro") => setAvisoApi({ texto, tipo }), []);

  const limparSessao = useCallback((aviso = "") => {
    salvarToken("");
    setUsuario(null);
    setCriancas([]);
    setFeitosVisitante({});
    setAvisoLogin(aviso);
    setTela("login");
    sincronizarUrl("login", "jogos", { replace: true });
  }, []);

  useEffect(() => {
    definirAoExpirar(() => limparSessao("Sua sessão expirou. Entre novamente."));
    return () => definirAoExpirar(null);
  }, [limparSessao]);

  // Restaura a sessão a partir do token salvo, confirmando com GET /api/auth/me e preservando a rota (F5).
  useEffect(() => {
    if (!lerToken()) {
      sincronizarUrl("login", "jogos", { replace: true });
      return;
    }
    let ativo = true;
    authApi
      .usuarioAtual()
      .then((u) => {
        if (!ativo) return;
        setUsuario(u);
        const inicial = rotaInicialRef.current;
        const telaDestino = inicial.tela && inicial.tela !== "login" ? inicial.tela : "menu";
        const abaDestino = inicial.aba || "jogos";
        setAbaMenu(abaDestino);
        setTela(telaDestino);
        sincronizarUrl(telaDestino, abaDestino, { replace: true });
      })
      .catch((e) => {
        if (!ativo) return;
        if (e.status === 401) return;
        setAvisoLogin(e.message);
        setTela("login");
        sincronizarUrl("login", "jogos", { replace: true });
      });
    return () => {
      ativo = false;
    };
  }, []);

  // Suporte aos botões Voltar / Avançar do navegador (History API).
  useEffect(() => {
    const aoPopState = () => {
      if (!usuario) {
        setTela("login");
        sincronizarUrl("login", "jogos", { replace: true });
        return;
      }
      const destino = lerRotaAtual();
      const proxTela = destino.tela === "login" ? "menu" : destino.tela;
      const proxAba = destino.aba || "jogos";
      if (tela !== "menu" && tela !== "login" && tela !== "carregando" && proxTela !== tela) {
        abandonarJogoRef.current?.();
      }
      cancelarFala();
      setAbaMenu(proxAba);
      setTela(proxTela);
      if (destino.tela === "login") {
        sincronizarUrl("menu", "jogos", { replace: true });
      }
    };
    window.addEventListener("popstate", aoPopState);
    return () => window.removeEventListener("popstate", aoPopState);
  }, [usuario, tela]);

  // Renova automaticamente a sessão (POST /api/auth/refresh) antes do vencimento do JWT.
  useEffect(() => {
    if (!usuario || !lerToken()) return;
    let timerId = null;
    let cancelado = false;
    const MARGEM_MS = 5 * 60 * 1000;

    const agendar = () => {
      if (cancelado || !lerToken()) return;
      const expMs = lerExpiracaoToken();
      const restante = expMs ? expMs - Date.now() - MARGEM_MS : 50 * 60 * 1000;
      const espera = Math.max(10_000, restante);
      timerId = setTimeout(async () => {
        if (cancelado || !lerToken()) return;
        try {
          const atualizado = await authApi.renovarSessao();
          if (!cancelado && atualizado) setUsuario(atualizado);
          agendar();
        } catch {
          // Em 401 o callback aoExpirar encerra a sessão
        }
      }, espera);
    };

    const aoVoltarFoco = () => {
      if (document.visibilityState !== "visible" || !lerToken()) return;
      const expMs = lerExpiracaoToken();
      if (expMs && expMs - Date.now() <= MARGEM_MS) {
        authApi
          .renovarSessao()
          .then((u) => {
            if (!cancelado && u) setUsuario(u);
          })
          .catch(() => {});
      }
    };

    agendar();
    document.addEventListener("visibilitychange", aoVoltarFoco);
    return () => {
      cancelado = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("visibilitychange", aoVoltarFoco);
    };
  }, [usuario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarJogos = useCallback(async () => {
    setCatalogo((c) => ({ ...c, carregando: true, erro: "" }));
    try {
      const lista = await listarJogos();
      setCatalogo({ lista, carregando: false, erro: "" });
    } catch (e) {
      setCatalogo({ lista: [], carregando: false, erro: e.message });
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- busca de dados ao montar/trocar filtro; o loading faz parte do fluxo
    carregarJogos();
  }, [carregarJogos]);

  const responsavel = usuario && !usuario.is_guest ? usuario : null;

  const carregarCriancas = useCallback(async () => {
    setCriancasEstado({ carregando: true, erro: "" });
    try {
      const lista = await criancasApi.listarCriancas();
      setCriancas(lista);
      setCriancasEstado({ carregando: false, erro: "" });
      setAtivaId((atual) => {
        const valido = lista.some((c) => String(c.id) === String(atual));
        const novo = valido ? atual : lista[0]?.id ?? "";
        gravarStorage("cc_crianca", novo);
        const perfilEscolhido = lista.find((c) => String(c.id) === String(novo));
        if (perfilEscolhido && perfilEscolhido.voice_enabled !== undefined) {
          setSom(Boolean(perfilEscolhido.voice_enabled));
        }
        return novo;
      });
    } catch (e) {
      setCriancasEstado({ carregando: false, erro: e.message });
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- busca de dados ao montar/trocar filtro; o loading faz parte do fluxo
    if (responsavel) carregarCriancas();
  }, [responsavel?.id, carregarCriancas]); // eslint-disable-line react-hooks/exhaustive-deps

  const criancaAtiva = criancas.find((c) => String(c.id) === String(ativaId)) || null;
  const idadeEfetiva = criancaAtiva ? idadeDoPerfil(criancaAtiva.age) : idade;
  const rodadasEfetivas = criancaAtiva ? 5 : totalRodadas;

  const chavePerfilFeitos =
    responsavel && criancaAtiva
      ? `resp:${responsavel.id}:child:${criancaAtiva.id}`
      : responsavel
        ? `resp:${responsavel.id}:sem_perfil`
        : null;

  const feitosAtuais = chavePerfilFeitos ? feitosMapa[chavePerfilFeitos] || {} : feitosVisitante;

  // Fila de partidas pendentes (falha de rede/servidor): fica no navegador e é reenviada depois.
  const enviarFila = useCallback(async () => {
    if (!responsavel || enviandoFilaRef.current) return;
    enviandoFilaRef.current = true;
    try {
      for (const item of lerFila().filter((i) => i.donoId === responsavel.id)) {
        try {
          await registrarPartida(item.payload);
          gravarStorage(CHAVE_FILA, lerFila().filter((i) => i.chave !== item.chave));
          setAvisoApi({ texto: "Partidas pendentes enviadas.", tipo: "ok" });
        } catch (e) {
          if (e.rede || e.status >= 500 || e.status === 401) break;
          gravarStorage(CHAVE_FILA, lerFila().filter((i) => i.chave !== item.chave));
        }
      }
    } finally {
      enviandoFilaRef.current = false;
    }
  }, [responsavel]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- busca de dados ao montar/trocar filtro; o loading faz parte do fluxo
    enviarFila();
    window.addEventListener("online", enviarFila);
    return () => window.removeEventListener("online", enviarFila);
  }, [enviarFila]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const ler = () => {
      const lista = listarVozes();
      setVozes(lista);
      const salva = lerStorage("cc_voz", "");
      if (salva && lista.some((v) => v.name === salva)) {
        definirNomeVoz(salva);
        setVozSel(salva);
      } else if (!obterNomeVoz() && lista.length) {
        const escolhida = melhorVoz(lista);
        if (escolhida) {
          definirNomeVoz(escolhida.name);
          setVozSel(escolhida.name);
        }
      }
    };
    ler();
    window.speechSynthesis.onvoiceschanged = ler;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const aoAutenticar = (u) => {
    setUsuario(u);
    setFeitosVisitante({});
    setAvisoLogin("");
    setAvisoApi(null);
    setAbaMenu("jogos");
    setTela("menu");
    sincronizarUrl("menu", "jogos");
  };

  const fazerLogin = async (dados) => aoAutenticar(await authApi.entrar(dados));
  const fazerCadastro = async (dados) => aoAutenticar(await authApi.cadastrar(dados));
  const entrarVisitante = async () => aoAutenticar(await authApi.entrarComoVisitante());

  const trocarVoz = (nome) => {
    definirNomeVoz(nome);
    setVozSel(nome);
    falar("Oi! Eu vou ajudar você a brincar.");
  };

  const sair = async () => {
    cancelarFala();
    await authApi.sair();
    limparSessao();
  };

  const alterarAba = (novaAba) => {
    cancelarFala();
    setAbaMenu(novaAba);
    setTela("menu");
    sincronizarUrl("menu", novaAba);
  };

  const excluirConta = async (senhaConfirmacao) => {
    cancelarFala();
    await authApi.excluirMinhaConta(senhaConfirmacao);
    limparSessao("Sua conta e todos os dados vinculados foram excluídos com sucesso.");
  };

  const selecionarJogo = (id) => {
    cancelarFala();
    setChave((c) => c + 1);
    setTela(id);
    sincronizarUrl(id, abaMenu);
  };

  const voltarParaMenu = () => {
    cancelarFala();
    setTela("menu");
    sincronizarUrl("menu", abaMenu);
  };

  const gravarSessao = async (id, resumo, incrementarConcluidos, opcoes = {}) => {
    if (incrementarConcluidos) {
      if (chavePerfilFeitos) {
        setFeitosMapa((mapa) => {
          const anterior = mapa[chavePerfilFeitos] || {};
          const atualizado = {
            ...mapa,
            [chavePerfilFeitos]: { ...anterior, [id]: (anterior[id] || 0) + 1 },
          };
          gravarStorage(CHAVE_FEITOS_MAPA, atualizado);
          return atualizado;
        });
      } else {
        setFeitosVisitante((f) => ({ ...f, [id]: (f[id] || 0) + 1 }));
      }
    }
    if (!responsavel || !criancaAtiva) return;

    const chaveSessao = `${responsavel.id}-${criancaAtiva.id}-${id}-${chave}-${INICIO_PAGINA}`;
    if (enviadasRef.current.has(chaveSessao)) return;
    enviadasRef.current.add(chaveSessao);

    const payload = montarPayload(criancaAtiva.id, id, resumo, new Date().toISOString());
    if (opcoes.aoFechar) {
      registrarPartida(payload, { keepalive: true }).catch((e) => {
        if (e.rede || e.status >= 500) {
          gravarStorage(CHAVE_FILA, [...lerFila(), { chave: chaveSessao, donoId: responsavel.id, payload }]);
        }
      });
      return;
    }
    try {
      await registrarPartida(payload);
    } catch (e) {
      if (e.rede || e.status >= 500) {
        gravarStorage(CHAVE_FILA, [...lerFila(), { chave: chaveSessao, donoId: responsavel.id, payload }]);
        avisar("Sem conexão com o servidor. A partida foi guardada e será enviada depois.");
      } else if (e.status !== 401) {
        avisar(`Não foi possível salvar a partida: ${e.message}`);
      }
    }
  };

  const perfis = {
    criancas,
    carregando: criancasEstado.carregando,
    erroLista: criancasEstado.erro,
    ativaId,
    onRecarregar: carregarCriancas,
    onSelecionar: (id) => {
      setAtivaId(id);
      gravarStorage("cc_crianca", id);
      const escolhida = criancas.find((c) => String(c.id) === String(id));
      if (escolhida && escolhida.voice_enabled !== undefined) {
        setSom(Boolean(escolhida.voice_enabled));
      }
    },
    onSalvar: async ({ id, nome, idade: idadeForm, vozAtiva }) => {
      const salva = id
        ? await criancasApi.editarCrianca(id, { nome, idade: idadeForm, vozAtiva })
        : await criancasApi.criarCrianca({ nome, idade: idadeForm, vozAtiva });
      setCriancas((lista) => (id ? lista.map((c) => (c.id === id ? salva : c)) : [...lista, salva]));
      if (!id || String(ativaId) === String(salva.id)) {
        setAtivaId(salva.id);
        gravarStorage("cc_crianca", salva.id);
        if (salva.voice_enabled !== undefined) setSom(Boolean(salva.voice_enabled));
      }
    },
    onExcluir: async (id) => {
      await criancasApi.excluirCrianca(id);
      const restantes = criancas.filter((c) => c.id !== id);
      setCriancas(restantes);
      if (String(ativaId) === String(id)) {
        const novo = restantes[0]?.id ?? "";
        setAtivaId(novo);
        gravarStorage("cc_crianca", novo);
      }
    },
  };

  const jogos = catalogo.lista
    .filter((g) => g.active && META_JOGOS[g.id])
    .map((g) => ({ id: g.id, nome: g.name, ...META_JOGOS[g.id] }));

  const jogo = jogos.find((j) => j.id === tela);
  const JogoAtivo = jogo?.C;
  const nomeJogoAtual = jogo?.nome;

  useEffect(() => {
    document.title = tituloParaEstado(tela, abaMenu, nomeJogoAtual);
  }, [tela, abaMenu, nomeJogoAtual]);

  const ehAreaInstitucional = tela === "menu" && (abaMenu === "perfis" || abaMenu === "pais");
  const ehLogin = tela === "login";
  const ehJogo = Boolean(JogoAtivo);
  const ehMenuCenario = tela === "menu" && !ehAreaInstitucional;

  const classesRaiz = [
    "cc",
    ehLogin ? "area-login" : "",
    ehMenuCenario ? "area-menu-cenario" : "",
    ehJogo ? "area-jogo" : "",
    ehAreaInstitucional ? "area-institucional" : "",
    fonteMaior ? "fonte-maior" : "",
    altoContraste ? "alto-contraste" : "",
    calmo ? "modo-calmo" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <MotionConfig reducedMotion={calmo ? "always" : "user"}>
      <div className={classesRaiz}>
        {avisoApi && (
          <div className="no-print relative z-20 w-full max-w-6xl px-4 pt-3 sm:px-6">
            <Alert variant={avisoApi.tipo === "ok" ? "success" : "error"}>
              <span>{avisoApi.texto}</span>
              <Button variant="outlineInst" size="sm" onClick={() => setAvisoApi(null)}>
                Fechar
              </Button>
            </Alert>
          </div>
        )}

        {tela === "carregando" && (
          <main
            className="flex min-h-screen w-full items-center justify-center p-6 text-base font-bold text-ink-muted"
            role="status"
          >
            Carregando…
          </main>
        )}

        {tela === "login" && (
          <Login
            onLogin={fazerLogin}
            onCadastro={fazerCadastro}
            onVisitante={entrarVisitante}
            aviso={avisoLogin}
          />
        )}

        {tela === "menu" && (
          <Menu
            jogos={jogos}
            jogosCarregando={catalogo.carregando}
            jogosErro={catalogo.erro}
            onRecarregarJogos={carregarJogos}
            usuarioId={usuario?.id ?? usuario?.email ?? ""}
            resp={usuario?.name || usuario?.email || ""}
            visitante={Boolean(usuario?.is_guest)}
            criancaAtiva={criancaAtiva}
            perfis={perfis}
            idadeTravada={Boolean(criancaAtiva)}
            rodadasTravadas={Boolean(criancaAtiva)}
            som={som}
            onToggleSom={() => setSom((s) => !s)}
            efeitos={efeitos}
            onToggleEfeitos={() => setEfeitos((e) => !e)}
            velocidade={velocidade}
            onToggleVelocidade={() =>
              setVelocidade((v) => (v === "calma" ? "normal" : "calma"))
            }
            fonteMaior={fonteMaior}
            onToggleFonteMaior={() => setFonteMaior((f) => !f)}
            altoContraste={altoContraste}
            onToggleAltoContraste={() => setAltoContraste((a) => !a)}
            calmo={calmo}
            onToggleCalmo={() => setCalmo((c) => !c)}
            totalRodadas={rodadasEfetivas}
            onAlterarTotal={(n) => setTotalRodadas(n)}
            idade={idadeEfetiva}
            onAlterarIdade={(novaIdade) => setIdade(novaIdade)}
            aba={abaMenu}
            onAlterarAba={alterarAba}
            depthFisica={depthFisica}
            onToggleDepthFisica={() =>
              setDepthFisica((d) => (d === "3d" ? "2d" : "3d"))
            }
            seedFisica={seedFisica}
            onReiniciarBloquinhos={() => setSeedFisica((s) => s + 1)}
            onSair={sair}
            onAlterarSenha={authApi.alterarSenha}
            onExcluirConta={excluirConta}
            vozes={vozes}
            vozSel={vozSel}
            onTrocarVoz={trocarVoz}
            feitos={feitosAtuais}
            onSelecionarJogo={selecionarJogo}
          />
        )}

        {JogoAtivo && (
          <main className="relative z-10 flex w-full max-w-6xl flex-col items-center px-4 py-4 sm:px-6 sm:py-6">
            <JogoAtivo
              key={`${chave}-${rodadasEfetivas}-${idadeEfetiva}`}
              total={rodadasEfetivas}
              idade={idadeEfetiva}
              calmo={calmo}
              som={som}
              altoContraste={altoContraste}
              onToggleSom={() => setSom((s) => !s)}
              onToggleCalmo={() => setCalmo((c) => !c)}
              onToggleAltoContraste={() => setAltoContraste((a) => !a)}
              onRegistrarAbandonoRef={abandonarJogoRef}
              onSair={voltarParaMenu}
              onNovo={() => {
                cancelarFala();
                setChave((c) => c + 1);
              }}
              onFim={(resumo, opcoes) => gravarSessao(jogo.id, resumo, true, opcoes)}
              onParcial={(resumo, opcoes) => gravarSessao(jogo.id, resumo, false, opcoes)}
            />
          </main>
        )}
      </div>
    </MotionConfig>
  );
}
