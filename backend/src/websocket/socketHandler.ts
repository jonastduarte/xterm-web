import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Client } from 'ssh2';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { sessionLogsDir } from '../config';
import { decodeToken } from '../middlewares/auth';
import { decrypt } from '../crypto';

export interface SessionEntry {
  ssh?: Client;
  telnetSocket?: net.Socket | null;
  shellStream?: any;
  logStream?: fs.WriteStream | null;
  sftpSession?: any;
  ws?: WebSocket | null;
  lastActivity: number;
  protocol: string;
  userId: number;
  history: string[];
}

const sessionRegistry = new Map<string, SessionEntry>();

// Session Inactivity Cleanup (30 minutes)
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000;
  for (const [sid, session] of sessionRegistry.entries()) {
    if (!session.ws && (now - session.lastActivity > timeout)) {
      console.log(`Closing abandoned session ${sid}`);
      if (session.ssh) session.ssh.end();
      if (session.telnetSocket) session.telnetSocket.destroy();
      if (session.logStream) session.logStream.end();
      sessionRegistry.delete(sid);
    }
  }
}, 60000);

// Auto-cleanup physical logs older than 30 days
setInterval(() => {
  try {
    const users = fs.readdirSync(sessionLogsDir);
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    for (const u of users) {
      const uDir = path.join(sessionLogsDir, u);
      if (!fs.statSync(uDir).isDirectory()) continue;
      const logs = fs.readdirSync(uDir);
      for (const file of logs) {
        const filePath = path.join(uDir, file);
        if (now - fs.statSync(filePath).mtimeMs > thirtyDays) {
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (err) {
    console.error('Error cleaning up logs:', err);
  }
}, 12 * 60 * 60 * 1000); // Check every 12 hours

function stripAnsi(data: Buffer | string): string {
  const str = typeof data === 'string' ? data : data.toString('utf-8');
  let cleaned = str.replace(/[\x1b\x9b]\[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  cleaned = cleaned.replace(/[\x1b\x9b]\].*?(?:\x07|\x1b\\)/g, '');
  while (/[^\n\r]\x08/.test(cleaned)) {
    cleaned = cleaned.replace(/[^\n\r]\x08/g, '');
  }
  cleaned = cleaned.replace(/\x07|^\x08+/gm, '');
  return cleaned;
}

export function initWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    const ssh = new Client();
    let shellStream: any = null;
    let sftpSession: any = null;
    let telnetSocket: net.Socket | null = null;
    let logStream: fs.WriteStream | null = null;
    let currentPersistenceId: string | null = null;
    let isIntentionalClose = false;

    ws.on('message', (message: string) => {
      let data: any;
      try {
        data = JSON.parse(message.toString());
      } catch (e) {
        return;
      }

      if (data.type === 'connect') {
        const { host, port, username, password, protocol, token, persistenceId, auth_type, private_key, use_sftp } = data.payload;
        console.log('WebSocket connect payload: host=%s, port=%s, username=%s, auth_type=%s', host, port, username, auth_type);
        currentPersistenceId = persistenceId;
        
        const decoded = decodeToken(token || '');
        const userId = decoded ? decoded.id : 1;
        const { masterPassword } = data.payload;

        let finalConnectPassword = password;
        if (password && masterPassword && password !== '***') {
          const decrypted = decrypt(password, masterPassword);
          if (decrypted) finalConnectPassword = decrypted;
        }

        // Check if we are reattaching to an existing session
        if (persistenceId && sessionRegistry.has(persistenceId)) {
          const session = sessionRegistry.get(persistenceId)!;
          console.log(`Reattaching to session ${persistenceId}`);
          session.ws = ws;
          session.lastActivity = Date.now();
          
          ws.send(JSON.stringify({ type: 'status', payload: 'Reconnected' }));
          
          // Replay history
          if (session.history && session.history.length > 0) {
            for (const chunk of session.history) {
              ws.send(JSON.stringify({ type: 'data', payload: chunk }));
            }
          }
          if (session.sftpSession) {
            ws.send(JSON.stringify({ type: 'sftp:ready' }));
          }
          return;
        }
        
        const date = new Date();
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hhmmss = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0') + String(date.getSeconds()).padStart(2, '0');
        
        const logDir = path.join(sessionLogsDir, String(userId));
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        
        const safeHost = host.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const baseFileName = `${safeHost}_${dd}-${mm}-${yyyy}_${hhmmss}`;
        let logFilePath = path.join(logDir, `${baseFileName}.log`);
        
        let index = 1;
        while (fs.existsSync(logFilePath)) {
          logFilePath = path.join(logDir, `${baseFileName}_${index}.log`);
          index++;
        }
        
        logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
        
        const sid = persistenceId || Math.random().toString(36).substring(7);
        const sessionEntry: SessionEntry = {
          userId,
          protocol,
          logStream,
          lastActivity: Date.now(),
          ws: ws,
          history: []
        };
        sessionRegistry.set(sid, sessionEntry);

        if (protocol === 'telnet') {
          const telnetPort = port || 23;
          telnetSocket = net.createConnection({ host, port: telnetPort }, () => {
            ws.send(JSON.stringify({ type: 'status', payload: 'Connected' }));
            if (username) {
              setTimeout(() => telnetSocket?.write(username + '\r\n'), 500);
              if (password) {
                setTimeout(() => telnetSocket?.write(password + '\r\n'), 1500);
              }
            }
          });

          telnetSocket.on('data', (d: Buffer) => {
            const session = sessionRegistry.get(sid);
            if (session) {
              session.lastActivity = Date.now();
              const chunk = d.toString('utf-8');
              session.history.push(chunk);
              if (session.history.length > 1000) session.history.shift();
              if (session.ws) session.ws.send(JSON.stringify({ type: 'data', payload: chunk }));
            }
            if (logStream) logStream.write(stripAnsi(d));
          });

          telnetSocket.on('close', () => {
            ws.send(JSON.stringify({ type: 'status', payload: 'Closed' }));
            telnetSocket = null;
          });

          telnetSocket.on('error', (err: any) => {
            ws.send(JSON.stringify({ type: 'error', payload: err.message || 'Telnet connection failed' }));
            telnetSocket = null;
          });

        } else if (protocol === 'sftp') {
          ssh.on('ready', () => {
            ws.send(JSON.stringify({ type: 'status', payload: 'SFTP Connected' }));
            
            ssh.sftp((err, sftp) => {
              if (err) {
                ws.send(JSON.stringify({ type: 'error', payload: 'SFTP initialization failed' }));
                return;
              }
              sftpSession = sftp;
              const session = sessionRegistry.get(sid);
              if (session) session.sftpSession = sftp;
              ws.send(JSON.stringify({ type: 'sftp:ready' }));
            });
          }).on('error', (err: any) => {
            ws.send(JSON.stringify({ type: 'error', payload: err.message || err.level || 'SFTP Connection failed' }));
          }).connect({ 
            host, 
            port: port || 22, 
            username, 
            password: auth_type === 'password' ? finalConnectPassword : undefined,
            privateKey: auth_type === 'key' ? private_key : undefined,
            passphrase: auth_type === 'key' ? finalConnectPassword : undefined
          });
          
          const session = sessionRegistry.get(sid);
          if (session) session.ssh = ssh;
          
        } else {
          ssh.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
            if (auth_type === 'password' && prompts.length > 0) {
              finish([finalConnectPassword]);
            } else {
              finish([]);
            }
          }).on('ready', () => {
            ws.send(JSON.stringify({ type: 'status', payload: 'Connected' }));

            if (use_sftp === true || use_sftp === 1) {
              ssh.sftp((err, sftp) => {
                if (!err) {
                  sftpSession = sftp;
                  const session = sessionRegistry.get(sid);
                  if (session) session.sftpSession = sftp;
                  ws.send(JSON.stringify({ type: 'sftp:ready' }));
                }
              });
            }

            ssh.shell({ term: 'xterm' }, (err: any, stream: any) => {
              if (err) {
                console.error('SSH Shell Error:', err);
                ws.send(JSON.stringify({ type: 'error', payload: `Shell error: ${err.message || 'Unknown'}` }));
                return;
              }

              shellStream = stream;
              const session = sessionRegistry.get(sid);
              if (session) {
                session.ssh = ssh;
                session.shellStream = stream;
              }

              stream.on('data', (d: any) => {
                const session = sessionRegistry.get(sid);
                if (session) {
                  session.lastActivity = Date.now();
                  const chunk = d.toString('utf-8');
                  session.history.push(chunk);
                  if (session.history.length > 1000) session.history.shift();
                  
                  if (session.logStream) session.logStream.write(stripAnsi(d));
                  if (session.ws) session.ws.send(JSON.stringify({ type: 'data', payload: chunk }));
                }
              }).on('close', () => {
                isIntentionalClose = true;
                shellStream = null;
                ssh.end();
                if (sid) sessionRegistry.delete(sid);
                ws.send(JSON.stringify({ type: 'status', payload: 'Closed' }));
              });
            });
          }).on('error', (err: any) => {
            if (isIntentionalClose && err.message?.includes('closed by SSH Server')) {
               return;
            }
            console.error('SSH Connection Error:', err);
            ws.send(JSON.stringify({ type: 'error', payload: `Connection Error: ${err.message || 'Connection failed'}` }));
          }).connect({ 
            host, 
            port: port || 22, 
            username, 
            password: auth_type === 'password' ? finalConnectPassword : undefined,
            privateKey: auth_type === 'key' ? private_key : undefined,
            passphrase: auth_type === 'key' ? finalConnectPassword : undefined,
            tryKeyboard: true,
            readyTimeout: 60000,
            keepaliveInterval: 10000,
            keepaliveCountMax: 10,
            debug: (msg: string) => console.log('SSH_DEBUG['+host+']:', msg),
            algorithms: {
              kex: ['diffie-hellman-group1-sha1', 'diffie-hellman-group14-sha1', 'diffie-hellman-group-exchange-sha1', 'diffie-hellman-group-exchange-sha256', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521', 'curve25519-sha256', 'curve25519-sha256@libssh.org'],
              cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'aes128-gcm', 'aes128-gcm@openssh.com', 'aes256-gcm', 'aes256-gcm@openssh.com', 'aes256-cbc', 'aes192-cbc', 'aes128-cbc', '3des-cbc'],
              serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'ssh-ed25519', 'rsa-sha2-512', 'rsa-sha2-256'],
              hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1', 'hmac-md5', 'hmac-sha2-256-96', 'hmac-sha2-512-96', 'hmac-ripemd160', 'hmac-sha1-96', 'hmac-md5-96']
            }
          });
        }
      }

      if (data.type === 'data') {
        const session = sessionRegistry.get(data.payload.persistenceId || '');
        if (session) {
          session.lastActivity = Date.now();
          if (session.shellStream) session.shellStream.write(data.payload.data);
          else if (session.telnetSocket) session.telnetSocket.write(data.payload.data);
        } else {
          if (shellStream) shellStream.write(data.payload);
          else if (telnetSocket) telnetSocket.write(data.payload);
        }
      }

      if (data.type === 'resize') {
        const session = sessionRegistry.get(data.payload.persistenceId || '');
        if (session && session.shellStream) {
          try {
            session.shellStream.setWindow(data.payload.rows, data.payload.cols, 0, 0);
          } catch (e) { /* ignore */ }
        }
      }

      if (data.type === 'sftp:list' && sftpSession) {
        const targetPath = data.payload || '.';
        sftpSession.readdir(targetPath, (sftpErr: any, list: any) => {
          if (sftpErr) {
            ws.send(JSON.stringify({ type: 'sftp:error', payload: sftpErr.message }));
          } else {
            const simplifiedList = list.map((item: any) => ({
              filename: item.filename,
              longname: item.longname,
              isDirectory: item.attrs.isDirectory(),
              size: item.attrs.size,
              mtime: item.attrs.mtime
            }));
            ws.send(JSON.stringify({ type: 'sftp:list:result', payload: { path: targetPath, list: simplifiedList } }));
          }
        });
      }

      if (data.type === 'sftp:delete' && sftpSession) {
        const { path: targetPath, isDirectory } = data.payload;
        if (isDirectory) {
          sftpSession.rmdir(targetPath, (err: any) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'sftp:error', payload: err.message }));
            } else {
              ws.send(JSON.stringify({ type: 'sftp:delete:result', payload: { path: targetPath } }));
            }
          });
        } else {
          sftpSession.unlink(targetPath, (err: any) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'sftp:error', payload: err.message }));
            } else {
              ws.send(JSON.stringify({ type: 'sftp:delete:result', payload: { path: targetPath } }));
            }
          });
        }
      }

      if (data.type === 'sftp:rename' && sftpSession) {
        const { oldPath, newPath } = data.payload;
        sftpSession.rename(oldPath, newPath, (err: any) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'sftp:error', payload: err.message }));
          } else {
            ws.send(JSON.stringify({ type: 'sftp:rename:result', payload: { oldPath, newPath } }));
          }
        });
      }

      if (data.type === 'sftp:mkdir' && sftpSession) {
        const targetPath = data.payload;
        sftpSession.mkdir(targetPath, (err: any) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'sftp:error', payload: err.message }));
          } else {
            ws.send(JSON.stringify({ type: 'sftp:mkdir:result', payload: { path: targetPath } }));
          }
        });
      }

      if (data.type === 'sftp:stat' && sftpSession) {
        const targetPath = data.payload;
        sftpSession.stat(targetPath, (err: any, stats: any) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'sftp:error', payload: err.message }));
          } else {
            ws.send(JSON.stringify({ type: 'sftp:stat:result', payload: { path: targetPath, stats: { size: stats.size, mtime: stats.mtime, isDirectory: stats.isDirectory() } } }));
          }
        });
      }
    });

    ws.on('close', () => {
      if (currentPersistenceId && sessionRegistry.has(currentPersistenceId)) {
        const session = sessionRegistry.get(currentPersistenceId)!;
        console.log(`Websocket closed for session ${currentPersistenceId}, keeping session alive`);
        session.ws = null;
        session.lastActivity = Date.now();
      } else {
        console.log('Websocket closed, terminating session');
        ssh.end();
        if (telnetSocket) { telnetSocket.destroy(); telnetSocket = null; }
        if (logStream) { logStream.end(); logStream = null; }
      }
    });
  });
}
