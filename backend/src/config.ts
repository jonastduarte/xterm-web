import path from 'path';
import os from 'os';
import fs from 'fs';

export const dataDir = process.env.DATA_DIR || path.join(os.tmpdir(), 'xtermweb');
export const uploadDir = path.join(dataDir, 'uploads');
export const sessionLogsDir = path.join(dataDir, 'session_logs');

// Garante a existência dos diretórios
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(sessionLogsDir)) {
  fs.mkdirSync(sessionLogsDir, { recursive: true });
}
