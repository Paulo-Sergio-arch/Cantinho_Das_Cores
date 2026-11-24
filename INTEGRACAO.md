# Integração Front-End ↔ Back-End (`Cantinho_Das_Cores`)

Documento técnico de integração entre o Front-End React + Vite (`src/`) e a API Python + FastAPI + SQLite (`backend/`).

---

## 1. Configuração de Ambiente

### Front-End (`.env` na raiz do projeto)
Baseado em [`.env.example`](.env.example):
```env
VITE_API_URL=http://127.0.0.1:8000
```
- O cliente HTTP central fica em [`src/services/api.js`](src/services/api.js).
- O token JWT é armazenado em `sessionStorage` (`cc_token`) e enviado automaticamente no cabeçalho `Authorization: Bearer <token>`.
- Quando uma rota protegida responde `401 Unauthorized`, o callback configurado via `definirAoExpirar` limpa a sessão e redireciona para a tela de login com aviso amigável.

### Back-End (`backend/.env`)
Baseado em [`backend/.env.example`](backend/.env.example):
```env
APP_ENV=development
JWT_SECRET=change-this-to-a-long-random-secret-before-deploying
JWT_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5185,http://localhost:5173,https://cantinho-das-cores.vercel.app
DATABASE_PATH=data/cantinho_das_cores.sqlite3
BACKUP_DIR=data/backups
BACKUP_KEEP_COUNT=10
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_SECONDS=60
REPORT_DELIVERY_MODE=console
```

---

## 2. Mapeamento de Módulos e Endpoints

| Módulo | Serviço no Front-End | Rotas da API FastAPI |
|---|---|---|
| **1. Autenticação** | [`src/services/auth.js`](src/services/auth.js) | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/guest`, `GET /api/auth/me`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| **2. Perfis das Crianças** | [`src/services/criancas.js`](src/services/criancas.js) | `GET /api/children`, `POST /api/children`, `GET /api/children/{id}`, `PUT /api/children/{id}`, `DELETE /api/children/{id}` |
| **3. Catálogo de Jogos** | [`src/services/jogos.js`](src/services/jogos.js) | `GET /api/games`, `GET /api/games/{game_id}` |
| **4. Partidas e Resultados** | [`src/services/partidas.js`](src/services/partidas.js) | `POST /api/sessions`, `GET /api/sessions`, `GET /api/sessions/{session_id}` |
| **5. Dashboard Pedagógico** | [`src/services/dashboard.js`](src/services/dashboard.js) | `GET /api/dashboard/summary`, `GET /api/dashboard/games`, `GET /api/dashboard/evolution`, `GET /api/dashboard/history` |
| **6. Relatórios e Envio Real** | [`src/services/relatorios.js`](src/services/relatorios.js) | `POST /api/reports`, `GET /api/reports`, `GET /api/reports/{id}`, `GET /api/reports/{id}/status`, `POST /api/reports/{id}/send`, `POST /api/reports/{id}/sent` |
| **7. Backup e Sistema** | [`backend/app/main.py`](backend/app/main.py) | `GET /health`, `POST /api/system/backup`, `GET /api/system/backups` |

---

## 3. Fluxos Principais de Integração

### 3.1. Autenticação e Sessão
- **Responsável (`register` / `login`):** libera acesso aos perfis das crianças (`👧 Crianças`), gravação de partidas, dashboard pedagógico (`📊 Pais e Professores`) e geração/envio de relatórios.
- **Visitante (`guest`):** permite jogar livremente todos os 6 jogos sem persistir partidas no banco.
- **Logout (`logout`):** revoga o `jti` do token no banco (`tokens_revogados`) e limpa o `sessionStorage` do navegador.

### 3.2. Registro de Partidas e Fila Offline
- Ao concluir uma partida (`onFim`) ou sair antes do término (`onParcial` / `pagehide`), o componente [`Casca.jsx`](src/components/Casca.jsx) envia o resumo para `gravarSessao` em [`App.jsx`](src/App.jsx).
- Para o jogo **Bloquinho de Frutas (`frutas`)**, [`JogoFrutas.jsx`](src/games/JogoFrutas.jsx) e [`partidas.js`](src/services/partidas.js) enviam `estrelas` (0 a 5), `goals_completed`, `total_goals`, `squares_closed` e `moves_remaining`, aplicando a regra definitiva de pontuação no backend.
- Se o servidor estiver temporariamente inacessível (erro de rede ou `5xx`), a partida é salva em `localStorage` (`cc_fila_partidas`) e reenviada automaticamente quando a conexão retorna.

### 3.3. Geração e Envio de Relatórios
- Na aba `📊 Pais e Professores`, o componente [`Relatorios.jsx`](src/pages/Relatorios.jsx) permite escolher o período (`De` / `Até`), gerar o relatório consolidado (`POST /api/reports`) e disparar o envio real (`POST /api/reports/{id}/send`) via SMTP/E-mail, Webhook ou Caixa de saída.
