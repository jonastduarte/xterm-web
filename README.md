# xterm-web (XTermWeb Web Clone)

Uma aplicação robusta de Web Terminal baseada em Xterm.js e Node.js (ssh2). Essa aplicação espelha funcionalidades "core" do XTermWeb para uso nativo no navegador!

## 🚀 Tecnologias

- **Frontend:** React, TypeScript, Vite, Xterm.js
- **Backend:** Node.js, Express, Ws (WebSockets), ssh2
- **Infraestrutura:** Docker, Docker Compose, Nginx, GitHub Actions

## 🐳 Executando Localmente

Para rodar em ambiente de desenvolvimento com Docker Compose:

1. Clone o repositório.
2. Copie o arquivo de variáveis de ambiente: `cp .env.example .env`
3. Inicie os containers:
   ```bash
   docker-compose up -d --build
   ```
4. Acesse em `http://localhost` (Frontend)
5. A API e WebSockets rodarão internamente na porta `3000`.

## 📦 Deploy para VPS (Ubuntu/Debian)

Use o script de deploy automatizado via SSH no seu servidor:

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

O script fará o setup do Nginx, Docker, clonará o repositório, fará o build com `docker-compose` e gerará seu certificado SSL com Certbot. 

**Requisitos para Deploy:**
- Uma VPS (Ubuntu Server)
- Domínio apontando para o IP da VPS (Registros A)
- Permissões de superusuário (Sudo)

## 🔄 CI/CD Automation

Este projeto utiliza **GitHub Actions** e **GHCR** (GitHub Container Registry). O build e push das imagens ocorrem automaticamente a cada commit na branch `main`, sem necessidade de configuração manual de Secrets.

---
*Escrito para o projeto XTermWeb Web Clone.*
