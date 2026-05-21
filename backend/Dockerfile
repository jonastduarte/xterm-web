FROM node:20-slim

# Instalar dependências necessárias para compilação nativa e OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

# Forçar compilação a partir do código-fonte para máxima compatibilidade local
RUN npm install --build-from-source

COPY . .
RUN npm run build && \
    mkdir -p /app/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /app/ssl/server.key -out /app/ssl/server.crt \
    -subj "/C=BR/ST=RJ/L=Rio/O=XtermWeb/OU=IT/CN=xtermweb.local"

RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000 3443
CMD ["npm", "start"]