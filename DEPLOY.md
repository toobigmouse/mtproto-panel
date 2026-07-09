# Развёртывание MTProto Panel на сервере

Пошаговая инструкция по установке панели управления MTProto прокси.

## Требования к серверу

| Параметр | Минимум |
|----------|---------|
| ОС | Ubuntu 20.04+, Debian 11+, CentOS 8+ |
| RAM | 512 MB |
| Диск | 1 GB |
| Архитектура | x86_64 или aarch64 |
| Порты | 80 (или другой для панели) |

> Windows и macOS не поддерживаются.

## Шаг 1. Подготовка сервера

Подключитесь к серверу по SSH:

```bash
ssh root@ВАШ_IP
```

Установите Docker (если не установлен):

```bash
curl -fsSL https://get.docker.com | sh
```

Установите Docker Compose v2 (если не установлен):

```bash
COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
COMPOSE_VERSION=${COMPOSE_VERSION:-v2.34.0}
ARCH=$(uname -m)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

Установите git:

```bash
# Ubuntu/Debian
apt-get update && apt-get install -y git

# CentOS/RHEL
yum install -y git
```

## Шаг 2. Клонирование репозитория

```bash
git clone --branch master https://github.com/danielVNru/mtproto-panel.git /opt/mtproto-panel
cd /opt/mtproto-panel
```

## Шаг 3. Настройка конфигурации

Создайте файл `.env`:

```bash
cat > .env << EOF
PORT=80
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ВАШ_ПАРОЛЬ
JWT_SECRET=$(openssl rand -hex 32)
DB_NAME=mtproto_panel
DB_USER=mtproto
DB_PASSWORD=$(openssl rand -hex 16)
EOF

chmod 600 .env
```

Замените `ВАШ_ПАРОЛЬ` на надёжный пароль.

### Описание переменных

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт панели (по умолчанию 80) |
| `ADMIN_USERNAME` | Логин администратора |
| `ADMIN_PASSWORD` | Пароль администратора |
| `JWT_SECRET` | Секрет для JWT-токенов (генерируется автоматически) |
| `DB_NAME` | Имя базы данных |
| `DB_USER` | Пользователь БД |
| `DB_PASSWORD` | Пароль БД (генерируется автоматически) |

## Шаг 4. Запуск панели

```bash
export COMPOSE_PROJECT_NAME=mtproto-panel
docker compose up -d
```

Ожидайте 1-2 минуты пока соберутся образы и запустятся контейнеры.

Проверьте статус:

```bash
docker compose ps
```

Все три контейнера должны быть в статусе `Up`:
- `mtproto-panel-frontend`
- `mtproto-panel-backend`
- `mtproto-panel-db`

## Шаг 5. Первый вход

Откройте в браузере:

```
http://ВАШ_IP
```

Войдите с логином и паролем администратора, указанными в `.env`.

## Шаг 6. Настройка SSL (опционально)

### Вариант А: Без SSL

Панель будет доступна по `http://IP:PORT`. Подходит для тестов или если SSL настраивается на обратном прокси.

### Вариант Б: Самоподписанный сертификат

```bash
cd /opt/mtproto-panel
mkdir -p ssl
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/CN=$(hostname -I | awk '{print $1}')"
```

Создайте файл `docker-compose.override.yml`:

```bash
cat > docker-compose.override.yml << EOF
services:
  frontend:
    ports:
      - "443:443"
    volumes:
      - ./ssl/fullchain.pem:/etc/ssl/certs/fullchain.pem:ro
      - ./ssl/privkey.pem:/etc/ssl/private/privkey.pem:ro
EOF
```

Перезапустите:

```bash
docker compose down && docker compose up -d
```

Панель будет доступна по `https://IP`.

### Вариант В: Let's Encrypt

Требуется домен, направленный на IP сервера.

```bash
apt-get install -y certbot
```

Остановите панель (освободит порт 80):

```bash
cd /opt/mtproto-panel
docker compose down
```

Получите сертификат:

```bash
certbot certonly --standalone -d ВАШ_ДОМЕН \
    --agree-tos --non-interactive --register-unsafely-without-email
```

Настройте автопродление:

```bash
(crontab -l 2>/dev/null | grep -v "certbot renew"; \
 echo "0 3 1 */2 * certbot renew --quiet --deploy-hook 'cd /opt/mtproto-panel && docker compose restart frontend'") | crontab -
```

Создайте `docker-compose.override.yml`:

```bash
cat > docker-compose.override.yml << EOF
services:
  frontend:
    ports:
      - "443:443"
    volumes:
      - /etc/letsencrypt/live/ВАШ_ДОМЕН/fullchain.pem:/etc/ssl/certs/fullchain.pem:ro
      - /etc/letsencrypt/live/ВАШ_ДОМЕН/privkey.pem:/etc/ssl/private/privkey.pem:ro
EOF
```

Запустите панель:

```bash
docker compose up -d
```

Панель будет доступна по `https://ВАШ_ДОМЕН`.

## Обновление панели

```bash
cd /opt/mtproto-panel
git pull origin master
docker compose down
docker compose up -d --build
```

## Удаление панели

```bash
cd /opt/mtproto-panel
docker compose down -v --rmi local
cd /
rm -rf /opt/mtproto-panel
```

## Решение проблем

### Контейнер не запускается

```bash
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

### База данных не запускается

Проверьте, занят ли порт 5432:

```bash
ss -tlnp | grep 5432
```

### Порт 80 занят

Проверьте, какой процесс использует порт:

```bash
ss -tlnp | grep :80
```

Остановите конфликтующий сервис или измените порт в `.env`.

### Ошибка «permission denied» при записи

Убедитесь, что `.env` имеет права 600:

```bash
chmod 600 .env
```

### Панель не обновляется

Убедитесь, что `COMPOSE_PROJECT_NAME=mtproto-panel` установлен:

```bash
export COMPOSE_PROJECT_NAME=mtproto-panel
docker compose up -d --build
```
