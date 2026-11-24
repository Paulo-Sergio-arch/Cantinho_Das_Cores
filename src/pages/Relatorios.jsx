import { useCallback, useEffect, useState } from "react";
import { Copy, FileText, Printer, Send, Trash2 } from "lucide-react";
import { enviarRelatorio, excluirRelatorio, gerarRelatorio, listarRelatorios } from "../services/relatorios";
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
} from "../components/ui";
import { cn } from "../lib/cn";

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
    <Card tone="institutional" aria-label="Relatórios pedagógicos">
      <CardHeader className="no-print">
        <CardTitle>Relatórios pedagógicos de {nomeCrianca}</CardTitle>
        <Badge variant="muted">{lista.length} gerado(s)</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          className="no-print grid grid-cols-1 items-end gap-3 rounded-2xl border border-inst-border bg-inst-subtle/40 p-4 sm:grid-cols-2 lg:grid-cols-12"
          onSubmit={gerar}
          noValidate
        >
          <div className="lg:col-span-3">
            <Label htmlFor="rel-inicio">De</Label>
            <Input
              id="rel-inicio"
              type="date"
              value={inicio}
              max={fim}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <Label htmlFor="rel-fim">Até</Label>
            <Input
              id="rel-fim"
              type="date"
              value={fim}
              min={inicio}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Label htmlFor="rel-dest">E-mail para envio (opcional)</Label>
            <Input
              id="rel-dest"
              type="email"
              placeholder="padrão: e-mail da sua conta"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Button
              type="submit"
              variant="institutional"
              size="md"
              className="w-full"
              disabled={gerando}
              aria-busy={gerando}
            >
              <FileText size={16} />
              {gerando ? "Gerando…" : "Gerar"}
            </Button>
          </div>
        </form>

        {erro && (
          <Alert variant="error" className="no-print">
            {erro}
          </Alert>
        )}
        {msg && (
          <Alert variant="success" className="no-print">
            {msg}
          </Alert>
        )}
        {carregando && (
          <p className="no-print m-0 text-sm font-semibold text-ink-muted" role="status">
            Carregando relatórios…
          </p>
        )}
        {!carregando && !erro && lista.length === 0 && (
          <p className="no-print m-0 text-sm text-ink-muted">
            Nenhum relatório gerado ainda. Escolha o período e clique em “Gerar”.
          </p>
        )}

        <ul className="m-0 list-none space-y-3 p-0">
          {lista.map((r) => (
            <li
              key={r.id}
              className={cn(
                "rounded-2xl border border-inst-border bg-white p-4",
                aberto !== r.id && "no-print"
              )}
            >
              <div className="no-print flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong className="block text-sm font-bold text-ink">
                    {soData(r.period_start)} a {soData(r.period_end)}
                  </strong>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>Gerado em {dataHora(r.generated_at)}</span>
                    <Badge variant={r.sent ? "success" : "muted"}>
                      {r.sent ? `Enviado em ${dataHora(r.sent_at)}` : "Ainda não enviado"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="institutional"
                    size="sm"
                    disabled={enviandoId === r.id}
                    aria-busy={enviandoId === r.id}
                    onClick={() => enviar(r)}
                  >
                    <Send size={14} />
                    {enviandoId === r.id ? "Enviando…" : r.sent ? "Reenviar" : "Enviar"}
                  </Button>
                  <Button
                    variant="outlineInst"
                    size="sm"
                    aria-expanded={aberto === r.id}
                    onClick={() => setAberto(aberto === r.id ? null : r.id)}
                  >
                    {aberto === r.id ? "Ocultar" : "Ver relatório"}
                  </Button>
                  <Button
                    variant="dangerSoft"
                    size="sm"
                    disabled={excluindoId === r.id}
                    aria-busy={excluindoId === r.id}
                    onClick={() => excluir(r.id)}
                  >
                    <Trash2 size={14} />
                    {excluindoId === r.id ? "Excluindo…" : "Excluir"}
                  </Button>
                </div>
              </div>

              {aberto === r.id && (
                <div className="mt-4 space-y-3 border-t border-inst-border pt-4">
                  <article className="rel-documento rounded-2xl border border-inst-border bg-inst-subtle/40 p-5 sm:p-6">
                    <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-inst-border pb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-pais">
                          Cantinho das Cores · Relatório Pedagógico
                        </span>
                        <h3 className="font-display text-xl font-semibold text-ink mt-0.5 mb-0">
                          {nomeCrianca}
                        </h3>
                      </div>
                      <div className="flex flex-col text-xs text-ink-muted sm:text-right">
                        <span>
                          <strong>Período:</strong> {soData(r.period_start)} a {soData(r.period_end)}
                        </span>
                        <span>
                          <strong>Emitido em:</strong> {dataHora(r.generated_at)}
                        </span>
                      </div>
                    </header>
                    <pre className="m-0 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
                      {r.text}
                    </pre>
                  </article>

                  <div className="no-print flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outlineInst" size="sm" onClick={() => copiar(r.text)}>
                      <Copy size={14} />
                      Copiar texto
                    </Button>
                    <Button variant="institutional" size="sm" onClick={imprimir}>
                      <Printer size={14} />
                      Imprimir / Salvar PDF
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
