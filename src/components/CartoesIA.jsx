import { HeartHandshake, Home, Minus, Pause, Sparkles, TrendingDown, TrendingUp, Users } from "lucide-react";
import Nuvi from "./Nuvi";
import { Badge } from "./ui";
import { cn } from "../lib/cn";

// Cartões do relatório a partir de `destaques` (versão 1), gravados pelo servidor junto com o texto.
// O texto continua sendo o que vai no e-mail, no "Copiar" e no PDF: aqui tudo é `no-print`.

const SELO = {
  ia: { texto: "Escrito pela IA agora", Icone: Sparkles, classe: "bg-pais-soft text-pais-deep border border-pais/20" },
  ia_revisado: {
    texto: "Escrito com IA e revisado",
    Icone: Sparkles,
    classe: "bg-success-soft text-success-deep border border-success/25",
  },
  equipe: { texto: "Escrito pela equipe", Icone: Users, classe: "bg-inst-subtle text-ink-muted border border-inst-border" },
};

const SITUACAO = {
  facil: { texto: "fácil", variant: "success" },
  no_ponto: { texto: "no ponto", variant: "brand" },
  dificil: { texto: "difícil", variant: "warning" },
  nao_jogou: { texto: "sem jogar", variant: "muted" },
};

const TENDENCIA = {
  melhorou: { Icone: TrendingUp, texto: "melhorou", classe: "text-success-deep" },
  piorou: { Icone: TrendingDown, texto: "ficou mais difícil", classe: "text-[#7A5200]" },
  igual: { Icone: Minus, texto: "igual", classe: "text-ink-muted" },
  novo: { Icone: Sparkles, texto: "começou agora", classe: "text-pais-deep" },
  parou: { Icone: Pause, texto: "não jogou agora", classe: "text-ink-muted" },
};

function Selo({ origem }) {
  const s = SELO[origem];
  if (!s) return null;
  const { Icone } = s;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-tight",
        s.classe
      )}
    >
      <Icone size={12} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0">{s.texto}</span>
    </span>
  );
}

function Cartao({ titulo, Icone, origem, children, className }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-inst-border bg-white p-4 sm:p-5", className)}>
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="m-0 flex min-w-0 items-center gap-2 font-display text-base font-semibold text-ink">
          {Icone && <Icone size={18} aria-hidden="true" className="shrink-0 text-pais" />}
          <span className="min-w-0 break-words">{titulo}</span>
        </h4>
        <Selo origem={origem} />
      </header>
      <div className="min-w-0 break-words text-sm leading-relaxed text-ink">{children}</div>
    </section>
  );
}

function Chip({ situacao }) {
  const s = SITUACAO[situacao] || SITUACAO.nao_jogou;
  return <Badge variant={s.variant}>{s.texto}</Badge>;
}

function Trilha({ jogos }) {
  return (
    <ul className="m-0 list-none space-y-2.5 p-0">
      {jogos.map((j) => {
        const t = TENDENCIA[j.tendencia] || TENDENCIA.igual;
        const { Icone } = t;
        return (
          <li key={j.jogo} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 font-semibold text-ink">{j.nome}</span>
            <span className="flex flex-wrap items-center gap-1.5">
              <Chip situacao={j.antes} />
              <span aria-hidden="true" className="text-ink-muted">→</span>
              <Chip situacao={j.agora} />
            </span>
            <span className={cn("inline-flex items-center gap-1 text-xs font-bold", t.classe)}>
              <Icone size={14} aria-hidden="true" />
              {t.texto}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function CartoesIA({ destaques, nomeCrianca }) {
  if (!destaques || destaques.versao !== 1) return null;
  const { titulo, acompanhamento, recado, dicas = [], pratica, jogos = [] } = destaques;
  const temAlgo = titulo || acompanhamento || recado || dicas.length || pratica || jogos.length;
  if (!temAlgo) return null;

  return (
    <div className="no-print min-w-0 space-y-3" aria-label="Resumo do relatório em cartões">
      {(titulo || acompanhamento || jogos.length > 0) && (
        <Cartao
          titulo={titulo?.texto || "Resumo do período"}
          Icone={Sparkles}
          origem={acompanhamento?.origem || titulo?.origem}
          className="border-pais/30 bg-pais-soft/40"
        >
          {acompanhamento && <p className="m-0 mb-3">{acompanhamento.texto}</p>}
          {jogos.length > 0 && (
            <>
              <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                Antes → agora, em cada jogo
              </p>
              <Trilha jogos={jogos} />
            </>
          )}
        </Cartao>
      )}

      {recado && (
        <Cartao titulo={`Recado para ${nomeCrianca}`} origem={recado.origem}>
          <Nuvi fala={recado.texto} ouvivel calmo className="sm:justify-start" />
        </Cartao>
      )}

      {dicas.map((d) => (
        <Cartao key={d.jogo} titulo={`Como ajudar em ${d.nome}`} Icone={HeartHandshake} origem={d.origem}>
          <p className="m-0">{d.texto}</p>
        </Cartao>
      ))}

      {pratica && (
        <Cartao
          titulo={pratica.convite ? "Que tal começar?" : pratica.titulo || "Prática em casa"}
          Icone={Home}
          origem={pratica.origem}
        >
          {pratica.convite ? (
            <p className="m-0">
              Que tal começar por {pratica.jogos.join(" ou ")}? Joguem juntos, com calma.
            </p>
          ) : (
            <>
              {pratica.jogos.length > 0 && (
                <p className="m-0 mb-2 text-ink-muted">Jogos no app: {pratica.jogos.join(" e ")}.</p>
              )}
              <ol className="m-0 list-decimal space-y-1 pl-5 marker:font-bold marker:text-pais">
                {pratica.instrucoes.map((txt, i) => (
                  <li key={i}>{txt}</li>
                ))}
              </ol>
            </>
          )}
        </Cartao>
      )}
    </div>
  );
}
