# XTerm Web

![XTerm Web Login](docs/images/login.png)

Uma aplicação robusta de Web Terminal baseada em Xterm.js e Node.js (ssh2). Essa aplicação espelha funcionalidades "core" de gerenciadores de conexão remota para uso nativo diretamente no seu navegador, de forma segura e responsiva.

## 🌟 Principais Funcionalidades

![Main Interface](docs/images/main.png)

* **Terminal Completo via Web**: Conexões SSH, SFTP e FTP integradas usando WebSockets. O frontend se comunica com um backend em Node.js que gerencia a conexão real.
* **Organização em Pastas**: Crie estruturas de pastas hierárquicas para organizar e agrupar centenas de servidores.
* **Multi-idiomas (i18n)**: Suporte completo para Inglês, Português, Espanhol e Mandarim, aplicados a todas as áreas da aplicação (UI e Alertas).
* **Painel de Transferência de Arquivos (SFTP)**: Acesse, baixe, edite e suba arquivos de forma fácil arrastando e soltando. Permite abrir o FTP/SFTP simultâneo à sessão SSH, ou uma aba isolada apenas para arquivos.
* **Cofre de Senhas (Vault)**: Criptografe e salve suas senhas de conexões em um cofre local utilizando uma Master Password para maior segurança. As senhas nunca trafegam puras sem proteção.
* **Modo Multi-Execução (MultiExec)**: Envie o mesmo comando simultaneamente para múltiplos terminais abertos.
* **Gestão de Usuários e Logs**: Interface de gerenciamento de usuários internos, painel de logs consolidados de tudo que acontece no sistema e controle de acessos (Admin/User).
* **Interface Dinâmica e Customizável**: Temas Dark/Light, controle de fonte, abas estilo IDE, opção para esconder barra lateral, atalhos rápidos e suporte a Macros.

![New Session Dialog](docs/images/session.png)

## 🚀 Tecnologias

- **Frontend:** React, TypeScript, Vite, Xterm.js, Lucide-React
- **Backend:** Node.js, Express, Ws (WebSockets), ssh2, basic-ftp, SQLite
- **Infraestrutura:** Docker, Docker Compose, Nginx, GitHub Actions

## 🐳 Instalação & Execução Local

A maneira mais fácil e recomendada de rodar a aplicação para desenvolvimento ou testes é utilizando o Docker Compose:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/jonastduarte/xterm-web.git
   cd xterm-web
   ```

2. **Copie o arquivo de variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```

3. **Inicie os containers:**
   ```bash
   docker-compose up -d --build
   ```

4. **Acesse a aplicação:**
   * Frontend (UI): `http://localhost`
   * A API e conexões WebSockets estarão expostas na porta `3000` (utilizadas internamente pelo proxy).

5. **Acesso padrão:**
   * Username: `admin`
   * Senha: `password` *(Altere nas configurações de Usuários)*

## 📦 Deploy para Produção (VPS Linux)

Se você tem um servidor Ubuntu ou Debian e quer rodar o XTerm Web na nuvem com certificado SSL automático:

1. Baixe a aplicação para a VPS e conceda permissão de execução ao script:
   ```bash
   chmod +x deploy.sh
   ```
2. Execute o instalador automático:
   ```bash
   sudo ./deploy.sh
   ```

O script fará o setup do Nginx, Docker, clonará o repositório, efetuará o build com `docker-compose` e emitirá um certificado SSL válido através do Certbot para o seu domínio.

**Requisitos para Deploy:**
- Uma VPS (Ubuntu Server)
- Um domínio válido apontando para o IP da VPS (Registros A)
- Permissões de superusuário (Sudo)

## 🔄 Automação CI/CD

Este projeto utiliza **GitHub Actions** e **GHCR** (GitHub Container Registry). 
O build de contêineres e o envio das imagens Docker (push) ocorrem de forma automática a cada novo commit na branch `main`.

---
*Criado com o objetivo de oferecer a melhor experiência em terminais remotos via browser.*
