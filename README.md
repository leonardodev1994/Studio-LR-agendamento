# Studio LR - Agendamento Online

Sistema de agendamento do Studio LR / Leticia Rodrigues Nail Designer.

O projeto foi preparado para rodar em dois modos:

- Desenvolvimento local: servidor Python + SQLite local.
- Producao: Railway para o servidor Python + PostgreSQL/Supabase via `DATABASE_URL`.

## Estrutura

- `public/index.html`: pagina publica leve com vitrine, servicos, galeria, avaliacoes e agendamento.
- `public/app.js`: logica publica; consome apenas rotas publicas.
- `public/admin.html`: area administrativa.
- `public/admin.js`: modulos do admin; carrega dados completos somente apos login.
- `server.py`: servidor HTTP, APIs, sessao admin e camada de banco.
- `requirements.txt`: dependencias de producao, incluindo driver PostgreSQL.
- `Procfile`: comando web para Railway/Heroku-like hosts.
- `railway.json`: start command e health check para Railway.

## Variaveis de ambiente

Crie um arquivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Exemplo local:

```text
APP_ENV=development
HOST=127.0.0.1
PORT=8000
ADMIN_PASSWORD=studioLR2026
LETICIA_WHATSAPP=5521972803611
INSTAGRAM_URL=https://www.instagram.com/leticiar_naildesigner
DATABASE_URL=
SECRET_KEY=trocar_em_producao
```

Variaveis:

- `APP_ENV`: use `development` localmente e `production` no Railway.
- `HOST`: use `127.0.0.1` localmente ou `0.0.0.0` para testar em outro celular na mesma rede.
- `PORT`: porta do servidor. No Railway ela e definida automaticamente.
- `ADMIN_PASSWORD`: senha de acesso ao admin.
- `LETICIA_WHATSAPP`: numero oficial no formato internacional, sem simbolos.
- `INSTAGRAM_URL`: URL oficial do Instagram.
- `DATABASE_URL`: URL PostgreSQL/Supabase. Vazio usa SQLite local.
- `SECRET_KEY`: segredo para assinar sessao admin. Em producao, use valor longo e aleatorio.

## Rodar local

1. Instale as dependencias:

```bash
python3 -m pip install -r requirements.txt
```

2. Crie e edite `.env`:

```bash
cp .env.example .env
```

3. Rode o servidor:

```bash
python3 server.py
```

4. Acesse:

- Site publico: <http://127.0.0.1:8000>
- Admin: <http://127.0.0.1:8000/admin>

Em desenvolvimento, deixe `DATABASE_URL` vazio. O sistema cria e usa `studio_lr.sqlite3`.

Em producao, configure sempre `DATABASE_URL` com Supabase/PostgreSQL. O Render usa disco temporario; se o app rodar com SQLite em producao, clientes e agendamentos podem sumir em deploys/restarts. Com `APP_ENV=production`, o servidor agora exige `DATABASE_URL` para proteger esses dados.

## Banco de dados

Quando `DATABASE_URL` esta vazio, o servidor usa SQLite local somente para desenvolvimento.

Quando `DATABASE_URL` esta preenchido com uma URL `postgres://` ou `postgresql://`, o servidor usa PostgreSQL/Supabase.

Ao iniciar, o servidor cria automaticamente as tabelas se elas nao existirem:

- `services`
- `clients`
- `appointments`
- `weekly_hours`
- `blocked_days`
- `extra_slots`
- `settings`
- `reschedule_requests`

O status do agendamento fica protegido por `CHECK` na tabela `appointments`:

- `Pendente`
- `Confirmado`
- `Cancelado`
- `Concluído`

## Deploy Railway + Supabase

1. Crie um projeto no Supabase ou um banco PostgreSQL no Railway.

2. Copie a connection string PostgreSQL e configure no Railway como:

```text
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```

3. Crie um projeto no Railway apontando para este repositorio.

4. Configure as variaveis no Railway:

```text
APP_ENV=production
ADMIN_PASSWORD=sua_senha_forte
LETICIA_WHATSAPP=5521972803611
INSTAGRAM_URL=https://www.instagram.com/leticiar_naildesigner
DATABASE_URL=postgresql://...
SECRET_KEY=um_valor_longo_e_aleatorio
```

5. Railway pode usar o `Procfile` automaticamente:

```bash
web: python server.py
```

Se precisar configurar manualmente, use o start command:

```bash
python server.py
```

O projeto tambem inclui `railway.json` com:

- Start command: `python server.py`
- Health check: `/api/health`

6. Depois do deploy, teste:

- Site publico abre.
- Admin abre.
- Login admin funciona.
- Agendamento salva.
- Horario some depois de agendar.
- WhatsApp abre para `5521972803611`.
- Instagram abre em `https://www.instagram.com/leticiar_naildesigner`.

## Midias e uploads em producao

As fotos e videos atuais ficam em `public/assets` e sobem junto com o projeto.

No admin, a troca de foto dos servicos funciona assim:

- Local/SQLite: salva a imagem em `public/assets/servicos`.
- Producao/PostgreSQL: salva a imagem no banco dentro de `settings`, para nao perder em redeploy do Railway.

Observacao: a troca de fotos da galeria ainda usa arquivos locais. Para uma proxima etapa mais robusta, o ideal e mover a galeria editavel para Supabase Storage.

## Separacao de APIs

Rotas publicas usadas pela pagina leve:

- `GET /api/health`
- `GET /api/public/config`
- `GET /api/public/catalog`
- `GET /api/public/services`
- `GET /api/public/availability`
- `POST /api/public/appointments`
- `GET /api/public/client-appointments`
- `POST /api/public/reschedule-requests`
- `GET /api/public/gallery`
- `GET /api/public/reviews`

Rotas administrativas protegidas por login:

- `GET /api/admin/dashboard`
- `GET /api/admin/appointments`
- `GET /api/admin/services`
- `GET /api/admin/catalog`
- `GET /api/admin/clients`
- `GET /api/admin/finance`
- `GET /api/admin/settings`
- `GET /api/admin/gallery`
- `GET /api/admin/config`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `POST /api/admin/catalog/photo/:key`
- `POST /api/admin/gallery`
- `POST /api/admin/blocked-days`
- `POST /api/admin/extra-slots`
- `PATCH /api/admin/catalog/:key`
- `PATCH /api/admin/appointments/:id`
- `DELETE /api/admin/blocked-days/:id`
- `DELETE /api/admin/extra-slots/:id`

As rotas antigas `/api/services`, `/api/availability` e `/api/appointments` continuam disponiveis por compatibilidade, mas o frontend publico usa `/api/public/...`.

## Performance publica

- A pagina publica nao carrega dados administrativos.
- Imagens abaixo da dobra usam lazy loading.
- Videos usam `autoplay`, `muted`, `loop` e `playsinline`.
- Galeria e Instagram usam assets locais.
- Videos de transformacoes usam `preload="metadata"` e controles nativos.
- Admin so carrega dados completos depois do login.

## Seguranca basica

- A senha admin vem de `ADMIN_PASSWORD`.
- `SECRET_KEY` assina a sessao admin.
- `.env`, banco SQLite e caches ficam no `.gitignore`.
- `DATABASE_URL` e `SECRET_KEY` nao sao enviados ao frontend.
- Rotas admin exigem cookie de sessao assinado.
- Mensagens de erro para clientes sao amigaveis.

## Checklist antes de publicar

- Trocar `ADMIN_PASSWORD` por uma senha forte.
- Trocar `SECRET_KEY` por um valor longo e aleatorio.
- Definir `APP_ENV=production`.
- Definir `DATABASE_URL` de Supabase/PostgreSQL.
- Confirmar que `.env` nao sera commitado.
- Testar agendamento real e WhatsApp depois do deploy.
- Testar login admin e edicao de servico depois do deploy.
- Testar `/api/health` no dominio publicado.

## Proximas melhorias planejadas

- Historico completo da cliente.
- Controle financeiro real com despesas e pagamentos.
- Galeria editavel com Supabase Storage.
- Lembretes automaticos por WhatsApp.
- Lista de espera.
- Integracao Google Agenda.
