import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { authenticateToken } from './middlewares/auth';
import { initWebSocketServer } from './websocket/socketHandler';

// Importação das rotas modularizadas
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { foldersRouter } from './routes/folders';
import { sessionsRouter } from './routes/sessions';
import { logsRouter } from './routes/logs';
import { settingsRouter } from './routes/settings';
import { filesRouter } from './routes/files';

const app = express();

app.use(cors());
app.use(express.json());

// Middleware de autenticação JWT global
app.use(authenticateToken);

// Registro das rotas modulares sob o prefixo /api
app.use('/api', authRouter);
app.use('/api', usersRouter);
app.use('/api', foldersRouter);
app.use('/api', sessionsRouter);
app.use('/api', logsRouter);
app.use('/api', settingsRouter);
app.use('/api', filesRouter);

// Configuração do Servidor HTTP ou HTTPS nativo (HSTS & Tráfego Seguro)
let server: http.Server | https.Server;

if (fs.existsSync('/app/ssl/server.crt') && fs.existsSync('/app/ssl/server.key')) {
  const sslOptions = {
    cert: fs.readFileSync('/app/ssl/server.crt'),
    key: fs.readFileSync('/app/ssl/server.key')
  };
  server = https.createServer(sslOptions, app);
  console.log('Running with HTTPS support enabled');
} else {
  server = http.createServer(app);
  console.log('Running with HTTP support enabled');
}

// Inicialização do WebSocket Server modularizado
initWebSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  const protocol = fs.existsSync('/app/ssl/server.crt') ? 'HTTPS' : 'HTTP';
  console.log(`Backend listening on port ${PORT} (${protocol})`);
});