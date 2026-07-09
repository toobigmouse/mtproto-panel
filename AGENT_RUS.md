# MTProto Panel — Руководство для агента

Веб-панель управления MTProto прокси-серверами. Репозиторий с двумя пакетами: `backend/` (Express API) и `frontend/` (React SPA). Весь интерфейс и документация на русском языке.

## Архитектура

- `backend/` — Express + PostgreSQL + TypeScript. JWT-авторизация, миграции в виде голого SQL (без инструмента миграций), REST API под `/api/`.
- `frontend/` — React 18 + Vite + Gravity UI (библиотека компонентов Яндекса) + TypeScript. Собирается в статические файлы, раздаётся nginx.
- `docker-compose.yml` — Запускает три контейнера: frontend (nginx), backend (node), db (postgres:16-alpine).
- Backend монтирует `/var/run/docker.sock` и корень проекта в `/app/project` для возможности самообновления.
- Путь установки в продакшене: `/opt/mtproto-panel`.

## Команды для разработки

### Backend (`backend/`)
```bash
cd backend
npm install
npm run dev          # ts-node src/index.ts (требует .env с данными для подключения к БД)
npm run build        # tsc → dist/
```

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev          # Dev-сервер Vite, проксирует /api → localhost:3000
npm run build        # tsc && vite build → dist/
```

### Docker (полный стек)
```bash
docker compose up -d --build
```

## Нет скриптов линтинга/тестов/проверки типов

В репозитории **не настроены скрипты линтинга, тестирования или проверки типов**. Нет файлов тестов, нет конфигурации ESLint/Prettier, нет CI-пайплайнов. Скрипт сборки фронтенда (`build`) запускает `tsc && vite build`, что неявно выполняет проверку типов.

## Важные особенности

- **Нет `.env` в репозитории** — `.env` исключён из git, но обязателен для работы. Создайте его на основе переменных из `docker-compose.yml` (PORT, ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, DB_NAME, DB_USER, DB_PASSWORD).
- **Backend Dockerfile устанавливает bash, git, docker-cli** — нужно для эндпоинта самообновления (`POST /api/system/update` запускает `update.sh` внутри контейнера).
- **`COMPOSE_PROJECT_NAME=mtproto-panel`** — задаётся в `install.sh` и `update.sh` для consistentного имени тома `pgdata`. Не меняйте это, иначе сломается том БД.
- **Миграции — голый SQL** — `backend/src/db/migrations.ts` запускает `CREATE TABLE IF NOT EXISTS` при старте. Нет версионирования миграций и отката. Изменения схемы вносятся сюда.
- **Backend читает `package.json` во время выполнения** — `GET /api/system/version` читает `../package.json` относительно `dist/`. Держите поле `version` в `backend/package.json` синхронизированным.

## Структура файлов

```
backend/src/
  index.ts          — Инициализация Express-приложения, регистрация маршрутов
  config.ts         — Конфигурация из переменных окружения (PORT, JWT, DB)
  db/index.ts       — Пул подключений pg
  db/migrations.ts  — Создание схемы + создание пользователя-администратора
  middleware/auth.ts — Middleware проверки JWT
  routes/auth.ts    — Вход / регистрация
  routes/nodes.ts   — CRUD для сервис-нод
  routes/proxies.ts — Управление прокси на ноде
  routes/allProxies.ts — Список прокси по всем нодам

frontend/src/
  App.tsx           — Настройка React Router (вход, ноды, прокси, настройки)
  api/index.ts      — API-клиент (на fetch)
  pages/            — Login, Nodes, NodeDetail, ProxyDetail, Proxies, Settings
  components/       — Layout и общие компоненты
  hooks/            — Пользовательские React-хуки
  utils/            — Утилиты
```

## Процесс развёртывания

1. `install.sh` клонирует репозиторий в `/opt/mtproto-panel`, генерирует `.env`, запускает `docker compose up -d --build`
2. `update.sh` делает `git pull`, `docker compose down`, пересобирает и перезапускает
3. `uninstall.sh` останавливает контейнеры, удаляет тома и каталог установки
4. SSL опциональный (самоподписанный или Let's Encrypt), настраивается при установке через `docker-compose.override.yml`
