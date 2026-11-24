# Cantinho das Cores — Back-End (FastAPI + SQLite)

API Python + FastAPI com autenticação, perfis, catálogo, partidas, dashboard e relatórios persistidos em **SQLite**, usando o `schema.sql` fornecido pela equipe.

## Requisitos
- Python 3.11 ou superior
- SQLite (já incluído na biblioteca padrão do Python)

## Instalação — Windows / PowerShell
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```
Configure `JWT_SECRET` em `.env` com um segredo aleatório e privado (veja "Configuração e variáveis de ambiente"). Opcionalmente, configure `DATABASE_PATH` para indicar outro caminho para o arquivo SQLite.

## Executar
```powershell
uvicorn app.main:app --reload --port 8000
```
- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- Saúde: http://127.0.0.1:8000/health

Na primeira inicialização, a API cria `data/cantinho_das_cores.sqlite3`, executa o `schema.sql` e insere o jogo `frutas`, que existe no Front-End mas não estava na lista inicial de INSERTs entregue pela equipe. A inicialização é idempotente.

## Módulo 1 — Autenticação e Privacidade (LGPD)
- `POST /api/auth/register` — recebe `name`, `email`, `password` e `accepted_terms` (obrigatório `true`) e persiste o nome do responsável via migração idempotente em `init_db()`.
- `POST /api/auth/login` — e-mail e senha (case-insensitive) com proteção contra força bruta.
- `POST /api/auth/guest` — token temporário de visitante.
- `GET /api/auth/me` — usuário atual.
- `POST /api/auth/change-password` — altera a senha do responsável autenticado mediante confirmação da senha atual.
- `POST /api/auth/forgot-password` e `POST /api/auth/reset-password` — fluxo de recuperação de senha por código temporário de uso único (15 min).
- `DELETE /api/auth/me` — exclui a conta do responsável e todos os dados vinculados em cascata (Direito à Eliminação — LGPD Art. 18, VI).
- `POST /api/auth/logout` — revoga o `jti` do token no banco (`tokens_revogados`) e encerra a sessão.

Senhas são armazenadas exclusivamente como hash Argon2. O token JWT contém o ID numérico do responsável do SQLite.

## Módulo 2 — Perfis das crianças
- `POST /api/children`
- `GET /api/children`
- `GET /api/children/{child_id}`
- `PUT /api/children/{child_id}`
- `DELETE /api/children/{child_id}`

Os campos são mapeados para `apelido`, `idade` e `id_responsavel`. A idade segue a restrição do SQL (3 a 18 anos). O ID do responsável vem exclusivamente do token. O SQLite aplica `ON DELETE CASCADE`.

## Módulo 3 — Catálogo de jogos
- `GET /api/games`
- `GET /api/games/{game_id}`

A listagem consulta a tabela `jogos`. A inicialização acrescenta `frutas` para compatibilidade com os seis jogos do Front-End.

## Módulo 4 — Partidas e resultados
- `POST /api/sessions` — registra partidas concluídas ou abandonadas.
- `GET /api/sessions` — lista somente partidas concluídas (para relatórios); filtros `child_id` e `game_id` são opcionais.
- `GET /api/sessions/{session_id}` — consulta partida concluída pertencente ao responsável.

O payload de criação usa `child_id`, `game_id`, `correct_answers`, `incorrect_answers`, `completed`, `duration_seconds` e `played_at` opcional. A pontuação é calculada como `acertos / (acertos + erros) * 100`; quando o total de tentativas é zero, a pontuação é zero. Partida concluída exige exatamente cinco acertos. Partidas abandonadas (`completed=false`) são gravadas, mas não aparecem nas consultas usadas pelos relatórios. A duração zero é permitida pelo SQL.

## Regras de banco e segurança
- `aceito_termo=1` é gravado somente quando o responsável envia `accepted_terms=true`.
- `email` tem unicidade `COLLATE NOCASE` no SQLite.
- Constraints e conflitos são convertidos em mensagens HTTP amigáveis (409 para conflito/duplicidade e 422 para dados inválidos/relações inválidas).
- Toda consulta de crianças e partidas é limitada ao responsável autenticado. Visitantes não gerenciam perfis nem consultam partidas.
- O schema da equipe não possui tabela de usuários separada: `responsaveis` é a identidade de autenticação.

## Observações sobre o schema recebido
- O Modelo Lógico mostra `relatorios.texto` como `INT`, mas o `schema.sql` define `TEXT`; a implementação considera o SQL executável como fonte do tipo.
- O SQL inicial insere cinco jogos, enquanto o Front-End possui seis; a inicialização inclui `frutas` sem modificar as outras definições do schema.
- O schema não tem coluna para nome do responsável. Não armazenamos esse dado em coluna improvisada.
- O banco local é SQLite. Para uso compartilhado/produção, será necessário definir hospedagem e estratégia de backup/concorrência do arquivo ou migração para banco servidor.

## Testes
```powershell
pytest -q
```

## Módulo 5 — Dashboard pedagógico
Rotas somente leitura, protegidas por Bearer JWT (apenas responsáveis). Todas aceitam `child_id` opcional (sem ele, agrega todos os perfis do responsável).

- `GET /api/dashboard/summary` — total de partidas, concluídas, taxa de conclusão, pontuação média, tempo médio, acertos e erros, última partida. Aceita `days`.
- `GET /api/dashboard/games` — desempenho por jogo (os seis, mesmo sem partidas). Aceita `days`.
- `GET /api/dashboard/evolution` — série diária (partidas, concluídas, pontuação e tempo médios). Aceita `game_id` e `days`.
- `GET /api/dashboard/history` — histórico paginado (`limit` até 100, `offset`), inclui partidas abandonadas.

Pontuação, tempo, acertos e erros consideram só partidas concluídas (veja "Regra dos indicadores").

## Módulo 6 — Relatórios pedagógicos
Rotas protegidas por Bearer JWT (apenas responsáveis). Os relatórios ficam na tabela `relatorios` e são apagados junto com o perfil da criança.

- `POST /api/reports` — gera e armazena o relatório de uma criança (`child_id`, `period_start`, `period_end`; período máximo de 366 dias). O texto é montado por regras fixas a partir das partidas do período.
- `GET /api/reports` — relatórios anteriores, mais recentes primeiro; filtros `child_id` e `sent` (`true` enviados, `false` pendentes).
- `GET /api/reports/{id}` — relatório completo.
- `GET /api/reports/{id}/status` — status de envio (`sent`, `sent_at`, `generated_at`).
- `POST /api/reports/{id}/send` e `POST /api/reports/{id}/sent` — despacham o relatório pelo canal configurado (`smtp`/`email`, `webhook` ou `console` em desenvolvimento) e preenchem `enviado_em`; retornam `409` se já estiver enviado. Em `APP_ENV=production`, exige transporte real (`SMTP_HOST` ou `REPORT_WEBHOOK_URL`) configurado.

## Regra dos indicadores (módulos 5 e 6)
Contagens de partidas (total, concluídas, abandonadas, taxa de conclusão) usam todas as partidas. Pontuação, tempo, acertos e erros dos dashboards e dos relatórios usam somente partidas concluídas; abandonadas aparecem nas contagens e no histórico.

Para o **Bloquinho de Frutas (`frutas`)**, a regra definitiva normaliza `acertos` em `0..5` (respeitando as constraints do `schema.sql`), pondera precisão (`70%`) + progresso de metas (`30%`) e soma bônus por **Quadrados Mágicos** fechados (`+5` pts cada, máx. `+15`) e **jogadas restantes** ao concluir (`+2` pts cada, máx. `+10`), limitada a `0..100`.

## Configuração e variáveis de ambiente (`backend/.env`, modelo em `.env.example`)
| Variável | Padrão | Observação |
|---|---|---|
| `APP_ENV` | `development` | `production` ativa travas de segurança (JWT, CORS e canal real de relatório). |
| `JWT_SECRET` | segredo de desenvolvimento | **Obrigatório em produção**: ≥ 32 caracteres aleatórios. Gere com `python -c "import secrets; print(secrets.token_urlsafe(48))"`. |
| `ADMIN_API_KEY` | vazio | Chave administrativa (`X-Admin-Key`) exigida em `POST /api/system/backup` e `GET /api/system/backups`. |
| `JWT_EXPIRE_MINUTES` | `60` | Validade do token (renovado automaticamente via `POST /api/auth/refresh`). |
| `CORS_ORIGINS` | `http://localhost:5185,http://localhost:5173,https://cantinho-das-cores.vercel.app` | Origens do front separadas por vírgula. Em produção, só os domínios reais (ex.: URL da Vercel); `*` é recusado. |
| `DATABASE_PATH` | `backend/data/cantinho_das_cores.sqlite3` | Caminho do SQLite em modo `WAL`. |
| `BACKUP_DIR` / `BACKUP_KEEP_COUNT` | `backend/data/backups` / `10` | Diretório e rotação automática de backups online. |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` / `WINDOW_SECONDS` | `5` / `60` | Proteção contra força bruta no login persistida no SQLite (`HTTP 429`). |
| `REPORT_DELIVERY_MODE` / `SMTP_*` / `REPORT_WEBHOOK_URL` | `console` | Canal de envio de relatórios (`smtp`, `webhook` ou `console` somente em dev). |

## Testes
```bash
cd backend
pytest -q
```
A suíte usa um **banco SQLite temporário** (`tests/conftest.py` define `DATABASE_PATH` antes de importar a aplicação e apaga a pasta ao final); ela não lê nem altera `backend/data/`.

## Segurança — o que está implementado
- Senhas só como hash Argon2; JWT HS256 com expiração (`exp`), `jti` e verificação de assinatura.
- **Revogação server-side no logout (`tokens_revogados`)** com limpeza automática de tokens expirados, além de **rotação de sessão** em `POST /api/auth/refresh`.
- **Rate limiting persistido em SQLite (`tentativas_login`)** no login, retornando `429 Too Many Requests` com `Retry-After`.
- **Validação de responsável ativo** em todas as rotas privadas (tokens de contas excluídas são recusados imediatamente com `401`).
- Toda rota privada filtra por responsável (`id_responsavel` do token); recurso de outro responsável responde `404`. Visitante recebe `403` nas rotas restritas.
- Rotas administrativas de backup (`/api/system/backup` e `/api/system/backups`) exigem `X-Admin-Key` e nunca expõem caminhos absolutos do servidor.
- Cabeçalhos de segurança (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Strict-Transport-Security` em HTTPS/produção).

## Implantação, backup e persistência do SQLite
- O SQLite roda em modo `WAL` (`Write-Ahead Logging`) com `busy_timeout = 15000`. Guarde o arquivo em volume/disco persistente.
- Backup online sem parar a API: via `POST /api/system/backup` (com header `X-Admin-Key`) ou CLI `python -m scripts.backup_db create|list|restore`.
- Deploy recomendado em SQLite puro: Front-End na **Vercel** (`vercel.json`) + Back-End FastAPI no **Render** (`render.yaml`), **Railway** ou **Fly.io** (`backend/Dockerfile`) com volume persistente montado em `/var/data` ou `/srv/backend/data`.

## Evoluções implementadas além do schema base
- `init_db()` aplica migração automática e idempotente (`ALTER TABLE responsaveis ADD COLUMN nome TEXT` e tabela `tokens_recuperacao_senha`), preservando o `schema.sql` original intacto.
- Preferência individual de voz por criança (`criancas.voz_ativa` ↔ `voice_enabled`), recuperação/alteração de senha e exclusão completa de conta conforme a LGPD (`DELETE /api/auth/me`).


