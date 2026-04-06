#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

REPO_URL="https://github.com/danielVNru/mtproto-panel.git"
INSTALL_DIR="/opt/mtproto-panel"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  MTProto Panel — Установка             ${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check root
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}Ошибка: запустите скрипт от root (sudo).${NC}"
    echo -e "  sudo bash <(wget -qO- ...)"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker не найден. Устанавливаю Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка установки Docker.${NC}"
        exit 1
    fi
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo -e "${YELLOW}Docker Compose не найден. Устанавливаю...${NC}"
    COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    COMPOSE_VERSION=${COMPOSE_VERSION:-v2.34.0}
    ARCH=$(uname -m)
    [ "$ARCH" = "x86_64" ] && ARCH="x86_64"
    [ "$ARCH" = "aarch64" ] && ARCH="aarch64"
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}Не удалось установить Docker Compose.${NC}"
    exit 1
fi

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git не найден. Устанавливаю git...${NC}"
    if command -v apt-get &> /dev/null; then
        apt-get update -qq && apt-get install -y -qq git
    elif command -v yum &> /dev/null; then
        yum install -y -q git
    elif command -v apk &> /dev/null; then
        apk add --no-cache git
    fi
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Не удалось установить git.${NC}"
        exit 1
    fi
fi

# Clone or update repo
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -e "${CYAN}Обновление из репозитория...${NC}"
    cd "$INSTALL_DIR"
    git fetch origin master
    git reset --hard origin/master
else
    echo -e "${CYAN}Скачивание последней версии...${NC}"
    rm -rf "$INSTALL_DIR"
    git clone --branch master "$REPO_URL" "$INSTALL_DIR"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка клонирования репозитория.${NC}"
        exit 1
    fi
fi

cd "$INSTALL_DIR"

# Ask for port
echo ""
read -p "Порт панели [80]: " PORT
PORT=${PORT:-80}

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo -e "${RED}Некорректный номер порта${NC}"
    exit 1
fi

# Ask for SSL
echo ""
echo -e "${CYAN}Настройка SSL:${NC}"
echo -e "  ${YELLOW}1${NC}) Без SSL"
echo -e "  ${YELLOW}2${NC}) Самоподписанный сертификат (для доступа по IP)"
echo -e "  ${YELLOW}3${NC}) Let's Encrypt (требуется домен)"
read -p "Выберите вариант [1]: " SSL_OPTION
SSL_OPTION=${SSL_OPTION:-1}

SSL_DOMAIN=""
if [ "$SSL_OPTION" = "3" ]; then
    read -p "Введите домен: " SSL_DOMAIN
    if [ -z "$SSL_DOMAIN" ]; then
        echo -e "${RED}Домен обязателен для Let's Encrypt${NC}"
        exit 1
    fi
fi

# Ask for admin credentials
read -p "Логин администратора: " ADMIN_USERNAME
if [ -z "$ADMIN_USERNAME" ]; then
    echo -e "${RED}Логин обязателен${NC}"
    exit 1
fi

read -s -p "Пароль администратора: " ADMIN_PASSWORD
echo ""
if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}Пароль обязателен${NC}"
    exit 1
fi

read -s -p "Повторите пароль: " ADMIN_PASSWORD_CONFIRM
echo ""
if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}Пароли не совпадают${NC}"
    exit 1
fi

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

echo ""
echo -e "${GREEN}Конфигурация:${NC}"
echo -e "  Порт:   ${YELLOW}${PORT}${NC}"
if [ "$SSL_OPTION" = "2" ]; then
    echo -e "  SSL:    ${YELLOW}Самоподписанный сертификат${NC}"
elif [ "$SSL_OPTION" = "3" ]; then
    echo -e "  SSL:    ${YELLOW}Let's Encrypt (${SSL_DOMAIN})${NC}"
fi
echo -e "  Логин:  ${YELLOW}${ADMIN_USERNAME}${NC}"
echo ""

# Create .env file
cat > .env << EOF
PORT=${PORT}
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
JWT_SECRET=${JWT_SECRET}
DB_NAME=mtproto_panel
DB_USER=mtproto
DB_PASSWORD=${DB_PASSWORD}
EOF

chmod 600 .env

# Setup SSL
if [ "$SSL_OPTION" = "2" ] || [ "$SSL_OPTION" = "3" ]; then
    # Use a high internal port so host port 80 is never bound (may be occupied by ISPManager etc.)
    SSL_HTTP_PORT=18080

    # Create nginx SSL config
    cat > nginx-ssl.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

    if [ "$SSL_OPTION" = "2" ]; then
        echo -e "${CYAN}Генерация самоподписанного сертификата...${NC}"
        SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
        mkdir -p ssl
        openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
            -keyout ssl/privkey.pem \
            -out ssl/fullchain.pem \
            -subj "/CN=${SERVER_IP}" 2>/dev/null

        CERT_PATH="./ssl/fullchain.pem"
        KEY_PATH="./ssl/privkey.pem"
    fi

    if [ "$SSL_OPTION" = "3" ]; then
        echo -e "${CYAN}Установка certbot...${NC}"
        if command -v apt-get &> /dev/null; then
            apt-get update -qq && apt-get install -y -qq certbot
        elif command -v yum &> /dev/null; then
            yum install -y -q certbot
        fi

        if ! command -v certbot &> /dev/null; then
            echo -e "${RED}Не удалось установить certbot.${NC}"
            exit 1
        fi

        echo -e "${CYAN}Получение сертификата Let's Encrypt для ${SSL_DOMAIN}...${NC}"
        certbot certonly --standalone -d "$SSL_DOMAIN" \
            --agree-tos --non-interactive --register-unsafely-without-email

        if [ $? -ne 0 ]; then
            echo -e "${RED}Ошибка получения сертификата Let's Encrypt.${NC}"
            exit 1
        fi

        CERT_PATH="/etc/letsencrypt/live/${SSL_DOMAIN}/fullchain.pem"
        KEY_PATH="/etc/letsencrypt/live/${SSL_DOMAIN}/privkey.pem"

        # Auto-renewal cron every ~60 days
        (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 1 */2 * certbot renew --quiet --deploy-hook 'cd ${INSTALL_DIR} && docker compose restart frontend'") | crontab -
        echo -e "${GREEN}Автообновление сертификата настроено (каждые ~60 дней)${NC}"
    fi

    # Create docker-compose override for SSL
    cat > docker-compose.override.yml << EOF
version: "3.8"

services:
  frontend:
    ports:
      - "443:443"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
      - ${CERT_PATH}:/etc/ssl/certs/fullchain.pem:ro
      - ${KEY_PATH}:/etc/ssl/private/privkey.pem:ro
EOF

    # Map an unused high port to HTTP inside container — host port 80 is NOT bound
    sed -i "s/^PORT=.*/PORT=${SSL_HTTP_PORT}/" .env
fi

# Build and start
echo -e "${CYAN}Сборка и запуск панели...${NC}"
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при запуске контейнеров.${NC}"
    exit 1
fi

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
SERVER_IP=${SERVER_IP:-"0.0.0.0"}

if [ "$SSL_OPTION" = "2" ] || [ "$SSL_OPTION" = "3" ]; then
    PANEL_URL="https://${SSL_DOMAIN:-${SERVER_IP}}"
else
    if [ "$PORT" = "80" ]; then
        PANEL_URL="http://${SERVER_IP}"
    else
        PANEL_URL="http://${SERVER_IP}:${PORT}"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Панель запущена!                      ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  URL:     ${CYAN}${PANEL_URL}${NC}"
echo -e "  Логин:   ${YELLOW}${ADMIN_USERNAME}${NC}"
echo -e "  Каталог: ${YELLOW}${INSTALL_DIR}${NC}"
echo -e "${GREEN}========================================${NC}"
