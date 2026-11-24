import { useCallback, useEffect, useState } from "react";
import { enviarRelatorio, excluirRelatorio, gerarRelatorio, listarRelatorios } from "../services/relatorios";
import { IconCopiar, IconEnviar, IconImprimir, IconLixeira } from "../components/IconesUI";

function hoje(deslocamentoDias = 0) {
  const d = new Date(Date.now() + deslocamentoDias * 86400000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const dataHora = (iso) =>
  new Date(/(Z|[+-]\d\d:\d\d)$/.test(iso) ? iso : `${iso}Z`).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
const soData = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");

export default function Relatorios({ criancaId, nomeCrianca }) {
  const [inicio, setInicio] = useState(() => hoje(-6));
  const [fim, setFim] = useState(() => hoje());
  const [destinatario, setDestinatario] = useState("");
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [gerando, setGerando] = useState(false);
  const [enviandoId, setEnviandoId] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);
  const [aberto, setAberto] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setLista(await listarRelatorios(criancaId));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [criancaId]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- busca de dados ao montar/trocar filtro; o loading faz parte do fluxo
    setAberto(null);
    setMsg("");
    carregar();
  }, [carregar]);

  const gerar = async (ev) => {
    ev.preventDefault();
    if (gerando) return;
    setMsg("");
    if (!inicio || !fim) return setErro("Informe as duas datas.");
    if (fim < inicio) return setErro("A data final deve ser igual ou posterior à inicial.");
    setErro("");
    setGerando(true);
    try {
      const novo = await gerarRelatorio(criancaId, inicio, fim);
      setLista((l) => [novo, ...l]);
      setAberto(novo.id);
      setMsg("Relatório gerado com sucesso.");
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  };

  const enviar = async (relatorio) => {
    if (enviandoId) return;
    setErro("");
    setMsg("");
    const destinoLimpo = destinatario.trim();
    if (destinoLimpo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(destinoLimpo)) {
      return setErro("Digite um e-mail de destino válido ou deixe vazio para usar o e-mail da sua conta.");
    }
    setEnviandoId(relatorio.id);
    try {
      const atualizado = await enviarRelatorio(relatorio.id, {
        recipient: destinoLimpo || null,
        resend: Boolean(relatorio.sent),
      });
      setLista((l) => l.map((r) => (r.id === relatorio.id ? atualizado : r)));
      setMsg(
        atualizado.delivery_recipient
          ? `Relatório enviado para ${atualizado.delivery_recipient}.`
          : "Relatório enviado com sucesso."
      );
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviandoId(null);
    }
  };

  const excluir = async (id) => {
    if (excluindoId) return;
    setErro("");
    setMsg("");
    setExcluindoId(id);
    try {
      await excluirRelatorio(id);
      setLista((l) => l.filter((r) => r.id !== id));
      if (aberto === id) setAberto(null);
      setMsg("Relatório excluído.");
    } catch (e) {
      setErro(e.message);
    } finally {
      setExcluindoId(null);
    }
  };

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setMsg("Texto do relatório copiado.");
    } catch {
      setErro("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="pais-bloco rel-bloco-secao" aria-label="Relatórios pedagógicos">
      <div className="pais-bloco-topo">
        <h2>Relatórios pedagógicos de {nomeCrianca}</h2>
        <span className="pais-legenda">{lista.length} gerado(s)</span>
      </div>

      <form className="rel-form no-print" onSubmit={gerar} noValidate>
        <div className="campo-grupo">
          <label className="campo-rotulo" htmlFor="rel-inicio">
            De
          </label>
          <input
            id="rel-inicio"
            className="campo-input"
            type="date"
            value={inicio}
            max={fim}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>
        <div className="campo-grupo">
          <label className="campo-rotulo" htmlFor="rel-fim">
            Até
          </label>
          <input
            id="rel-fim"
            className="campo-input"
            type="date"
            value={fim}
            min={inicio}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>
        <div className="campo-grupo rel-campo-email">
          <label className="campo-rotulo" htmlFor="rel-dest">
            E-mail para envio (opcional)
          </label>
          <input
            id="rel-dest"
            className="campo-input"
            type="email"
            placeholder="padrão: e-mail da sua conta"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
          />
        </div>
        <button type="submit" className="btn peq rel-btn-gerar" disabled={gerando} aria-busy={gerando}>
          {gerando ? "Gerando…" : "Gerar relatório"}
        </button>
      </form>

      {erro && (
        <p className="erro no-print" role="alert">
          {erro}
        </p>
      )}
      {msg && (
        <div className="aviso-api ok no-print" role="status">
          <span>{msg}</span>
        </div>
      )}
      {carregando && (
        <p className="no-print" role="status">
          Carregando relatórios…
        </p>
      )}
      {!carregando && !erro && lista.length === 0 && (
        <p className="pais-subtitulo no-print">
          Nenhum relatório gerado ainda. Escolha o período e clique em “Gerar relatório”.
        </p>
      )}

      <ul className="perfis-lista">
        {lista.map((r) => (
          <li key={r.id} className={`perfil-item ${aberto === r.id ? "rel-item-aberto" : "no-print"}`}>
            <div className="perfil-nome no-print">
              <strong>
                {soData(r.period_start)} a {soData(r.period_end)}
              </strong>
              <span className="perfil-meta">
                Gerado em {dataHora(r.generated_at)} ·{" "}
                <span className={`status-badge ${r.sent ? "concluida" : "pendente"}`}>
                  {r.sent ? `Enviado em ${dataHora(r.sent_at)}` : "Ainda não enviado"}
                </span>
              </span>
            </div>
            <div className="perfil-acoes no-print">
              <button
                type="button"
                className="btn peq"
                disabled={enviandoId === r.id}
                aria-busy={enviandoId === r.id}
                onClick={() => enviar(r)}
              >
                <IconEnviar size={15} />
                {enviandoId === r.id ? "Enviando…" : r.sent ? "Reenviar" : "Enviar relatório"}
              </button>
              <button
                type="button"
                className="btn neutro peq"
                aria-expanded={aberto === r.id}
                onClick={() => setAberto(aberto === r.id ? null : r.id)}
              >
                {aberto === r.id ? "Ocultar" : "Ver relatório"}
              </button>
              <button
                type="button"
                className="btn neutro peq perigo"
                disabled={excluindoId === r.id}
                aria-busy={excluindoId === r.id}
                onClick={() => excluir(r.id)}
              >
                <IconLixeira size={15} />
                {excluindoId === r.id ? "Excluindo…" : "Excluir"}
              </button>
            </div>
            {aberto === r.id && (
              <div className="rel-documento-wrap">
                <article className="rel-documento">
                  <header className="rel-doc-cabecalho">
                    <div>
                      <span className="rel-doc-marca">Cantinho das Cores · Relatório Pedagógico</span>
                      <h3>{nomeCrianca}</h3>
                    </div>
                    <div className="rel-doc-meta">
                      <span>
                        <strong>Período:</strong> {soData(r.period_start)} a {soData(r.period_end)}
                      </span>
                      <span>
                        <strong>Emitido em:</strong> {dataHora(r.generated_at)}
                      </span>
                    </div>
                  </header>
                  <pre className="rel-texto">{r.text}</pre>
                </article>
                <div className="perfil-acoes no-print">
                  <button type="button" className="btn neutro peq" onClick={() => copiar(r.text)}>
                    <IconCopiar size={15} />
                    Copiar texto
                  </button>
                  <button type="button" className="btn peq" onClick={imprimir}>
                    <IconImprimir size={15} />
                    Imprimir / Salvar PDF
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
