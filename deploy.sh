#!/bin/bash
# Script de deploy automatizado para XTermWeb com Docker, Nginx e Certbot (Let's Encrypt)
# Autor: DevOps Arquiteto / Engenharia Sênior
# Mantém a integridade do código e configurações de rede de alta segurança

set -e

# 1. Garantir execução como Root
if [ "$EUID" -ne 0 ]; then
  echo "❌ ERRO: Este script deve ser executado como root ou com privilégios sudo!"
  echo "Por favor, execute: sudo $0 ou sudo bash $0"
  exit 1
fi

echo "=========================================================="
echo "🚀 Iniciando Implantação de Produção para o XTermWeb..."
echo "=========================================================="

# 2. Obter Domínio e E-mail Pró-ativamente
read -p "👉 Digite o seu domínio de produção (ex.: xterm.seudominio.com): " DOMAIN
read -p "👉 Digite o e-mail de contato para o Let's Encrypt (SSL): " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "❌ ERRO: O domínio e o e-mail são obrigatórios para a configuração de rede e SSL!"
  exit 1
fi

# 3. Detectar a pasta do projeto local
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/opt/xterm-web"

# Se o script está sendo rodado a partir de /opt/xterm-web, manter no local
if [ "$SCRIPT_DIR" = "$PROJECT_DIR" ] || [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    PROJECT_DIR="$SCRIPT_DIR"
    echo "📂 Diretório do projeto detectado localmente em: $PROJECT_DIR"
else
    # Fallback se rodado de fora
    if [ ! -d "$PROJECT_DIR" ]; then
        echo "📥 Clonando repositório do projeto..."
        mkdir -p "/opt"
        git clone https://github.com/jonastduarte/xterm-web.git "$PROJECT_DIR"
    fi
fi

cd "$PROJECT_DIR"

# 4. Atualizar dependências do sistema operacional de forma silenciosa
echo "📦 Instalando e atualizando dependências do sistema..."
apt-get update -qq
apt-get install -y -qq docker.io docker-compose git certbot python3-certbot-nginx nginx

# 5. Configurar arquivo de ambiente .env dinamicamente
# IMPORTANTE: VITE_WS_URL deve conter o domínio real ANTES de buildar o container do frontend
echo "⚙️ Configurando variáveis de ambiente..."
if [ -f ".env" ]; then
    echo "⚠️ Arquivo .env já existe. Criando backup para .env.bak"
    cp .env .env.bak
fi

JWT_SECRET_GEN=$(openssl rand -hex 32)
cat <<EOF > .env
JWT_SECRET=$JWT_SECRET_GEN
VITE_WS_URL=wss://$DOMAIN/ws
DATA_DIR=/app/data
PORT=3030
NODE_ENV=production
EOF

echo "✅ Arquivo .env configurado para o domínio: $DOMAIN"

# 6. Inicializar containers Docker (Build local do Frontend passando VITE_WS_URL)
echo "🐳 Inicializando containers Docker..."
docker-compose down || true
docker-compose up --build -d

# 7. Configuração do Servidor Reverso Nginx
echo "🌐 Configurando arquivos do Nginx..."
cat <<EOF > /etc/nginx/sites-available/xterm-web
server {
    listen 80;
    server_name $DOMAIN;

    # HSTS / Redirecionamento Estrito para HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    # Cabeçalhos globais de segurança recomendados (SecOps)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' wss: https: data: blob:;" always;

    # Proxy para Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Proxy para API REST Backend
    location /api {
        proxy_pass http://localhost:3030;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Proxy para WebSockets Seguros (Auditoria e Terminal SSH)
    location /ws {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s; # Evita desconexões prematuras do terminal por timeout do Nginx
        proxy_send_timeout 86400s;
    }
}
EOF

# Cria link simbólico e recarrega o Nginx
ln -sf /etc/nginx/sites-available/xterm-web /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default || true

# 8. Emissão automatizada de certificado SSL com Let's Encrypt
echo "🔒 Emitindo certificado digital SSL com Let's Encrypt..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

# Reiniciar Nginx para aplicar o SSL e novos cabeçalhos
systemctl restart nginx

echo "=========================================================="
echo "🎉 Implantação concluída com sucesso!"
echo "Acesse a aplicação de forma segura através do link:"
echo "➡️ https://$DOMAIN"
echo "=========================================================="