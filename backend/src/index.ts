import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { Client } from 'ssh2';
import multer from 'multer';
import { dbQuery, dbRun } from './db';
import * as ftp from 'basic-ftp';
import { Readable, Writable } from 'stream';
import path from 'path';
import fs from 'fs';
import os from 'os';
import net from 'net';
import { encrypt, decrypt, hashMasterPassword, verifyMasterPassword } from './crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Ensure upload directory exists
const uploadDir = os.tmpdir() + '/moba/uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ===== Authentication Routes =====
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await dbQuery('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (users.length > 0) {
      return res.json({ token: 'fake-jwt-token-123', username: users[0].username });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Folder Management Routes =====
app.get('/api/folders', async (req, res) => {
  try {
    const rows = await dbQuery('SELECT * FROM folders');
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/folders', async (req, res) => {
  try {
    const parentId = req.body.parent_id || null;
    const result = await dbRun('INSERT INTO folders (name, parent_id) VALUES (?, ?)', [req.body.name || 'New Folder', parentId]);
    res.json({ id: result.lastID, name: req.body.name, parent_id: parentId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/folders/:id', async (req, res) => {
  try {
    const { parent_id } = req.body;
    // Prevent a folder from being moved into itself
    if (parseInt(req.params.id) === parent_id) {
      return res.status(400).json({ error: 'Cannot move a folder into itself' });
    }
    await dbRun('UPDATE folders SET parent_id = ? WHERE id = ?', [parent_id !== undefined ? parent_id : null, req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/folders/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM folders WHERE id = ?', [req.params.id]);
    await dbRun('UPDATE sessions SET folder_id = NULL WHERE folder_id = ?', [req.params.id]);
    res.json({ message: 'Folder deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ===== Session Management Routes =====
app.get('/api/sessions', async (req, res) => {
  try {
    const rows = await dbQuery('SELECT id, name, host, port, username, password, folder_id, protocol, auth_type, use_sftp FROM sessions');
    res.json(rows.map(r => ({ ...r, password: r.password ? '***' : '' })));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp, masterPassword } = req.body;
    let finalPassword = password || '';
    if (finalPassword && masterPassword) {
      finalPassword = encrypt(finalPassword, masterPassword);
    }
    const result = await dbRun(
      'INSERT INTO sessions (name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name || host, host, port || 22, username, finalPassword, folder_id || null, protocol || 'ssh', auth_type || 'password', private_key || null, use_sftp !== undefined ? use_sftp : 1]
    );
    res.json({ id: result.lastID, message: 'Session saved' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/sessions/:id', async (req, res) => {
  try {
    const { name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp, masterPassword } = req.body;
    // update folder only if that's the intention
    if (folder_id !== undefined && !host) {
      await dbRun('UPDATE sessions SET folder_id = ? WHERE id = ?', [folder_id, req.params.id]);
    } else {
      // If password is masked ('***'), keep the existing one
      let finalPassword = password;
      if (password === '***' || password === undefined) {
        const existing = await dbQuery('SELECT password FROM sessions WHERE id = ?', [req.params.id]);
        finalPassword = existing[0]?.password || '';
      } else if (finalPassword && masterPassword) {
        finalPassword = encrypt(finalPassword, masterPassword);
      }
      await dbRun(
        'UPDATE sessions SET name=?, host=?, port=?, username=?, password=?, folder_id=?, protocol=?, auth_type=?, private_key=?, use_sftp=? WHERE id=?',
        [name, host, port, username, finalPassword, folder_id, protocol || 'ssh', auth_type || 'password', private_key || null, use_sftp !== undefined ? use_sftp : 1, req.params.id]
      );
    }
    res.json({ message: 'Updated' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM sessions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Get full session details (with password) for connection
app.get('/api/sessions/:id/connect', async (req, res) => {
  try {
    const rows = await dbQuery('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ===== Connection History =====
app.get('/api/history', async (req, res) => {
  try {
    const rows = await dbQuery('SELECT * FROM connection_log ORDER BY connected_at DESC LIMIT 50');
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ===== Password Vault =====

// Check if master password is set
app.get('/api/vault/status', async (req, res) => {
  try {
    const users = await dbQuery('SELECT master_password_hash FROM users WHERE id = 1');
    const hasVault = !!(users[0]?.master_password_hash);
    res.json({ hasVault });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Set master password (first time)
app.post('/api/vault/setup', async (req, res) => {
  try {
    const { masterPassword } = req.body;
    if (!masterPassword || masterPassword.length < 4) {
      return res.status(400).json({ error: 'Master password must be at least 4 characters' });
    }
    const users = await dbQuery('SELECT master_password_hash FROM users WHERE id = 1');
    if (users[0]?.master_password_hash) {
      return res.status(400).json({ error: 'Master password already set. Use change endpoint.' });
    }
    const hash = hashMasterPassword(masterPassword);
    await dbRun('UPDATE users SET master_password_hash = ? WHERE id = 1', [hash]);
    res.json({ message: 'Master password set successfully' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Verify master password
app.post('/api/vault/verify', async (req, res) => {
  try {
    const { masterPassword } = req.body;
    const users = await dbQuery('SELECT master_password_hash FROM users WHERE id = 1');
    if (!users[0]?.master_password_hash) {
      return res.json({ valid: true, noVault: true });
    }
    const valid = verifyMasterPassword(masterPassword, users[0].master_password_hash);
    res.json({ valid });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Get session with decrypted password (requires master password)
app.post('/api/sessions/:id/decrypt', async (req, res) => {
  try {
    const { masterPassword } = req.body;
    const rows = await dbQuery('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = rows[0];
    // Try to decrypt password
    if (session.password && masterPassword) {
      try {
        const decrypted = decrypt(session.password, masterPassword);
        session.password = decrypted || session.password; // fallback if not encrypted
      } catch { /* password may not be encrypted yet */ }
    }
    res.json(session);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ===== Import/Export Sessions =====
app.get('/api/sessions/export/all', async (req, res) => {
  try {
    const sessions = await dbQuery('SELECT id, name, host, port, username, folder_id, protocol, auth_type, use_sftp FROM sessions');
    const folders = await dbQuery('SELECT * FROM folders');
    res.setHeader('Content-Disposition', 'attachment; filename=xterm-web-sessions.json');
    res.json({ version: 1, exportedAt: new Date().toISOString(), folders, sessions });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sessions/import', async (req, res) => {
  try {
    const { folders, sessions } = req.body;
    let imported = 0;
    // Import folders first
    const folderMap: Record<number, number> = {};
    if (folders) {
      for (const f of folders) {
        const result = await dbRun('INSERT INTO folders (name) VALUES (?)', [f.name]);
        folderMap[f.id] = result.lastID as number;
      }
    }
    // Import sessions
    if (sessions) {
      for (const s of sessions) {
        const newFolderId = s.folder_id ? (folderMap[s.folder_id] || null) : null;
        await dbRun(
          'INSERT INTO sessions (name, host, port, username, password, folder_id, protocol, auth_type, use_sftp) VALUES (?,?,?,?,?,?,?,?,?)',
          [s.name, s.host, s.port || 22, s.username || '', '', newFolderId, s.protocol || 'ssh', s.auth_type || 'password', s.use_sftp ?? 1]
        );
        imported++;
      }
    }
    res.json({ message: `Imported ${imported} sessions` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ===== Settings =====
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await dbQuery('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value as string]);
    }
    res.json({ message: 'Settings saved' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ===== SFTP File Upload endpoint =====
app.post('/api/sftp/upload', upload.single('file'), (req, res) => {
  const { file } = req;
  const { host, port, username, password, targetPath } = req.body;
  
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const ssh = new Client();
  ssh.on('ready', () => {
    ssh.sftp((err, sftp) => {
      if (err) {
        ssh.end();
        return res.status(500).json({ error: 'SFTP initialization failed' });
      }
      
      const remoteFile = targetPath.endsWith('/') ? `${targetPath}${file.originalname}` : `${targetPath}/${file.originalname}`;
      sftp.fastPut(file.path, remoteFile, (uploadErr) => {
        ssh.end();
        // Clean up temp file
        try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
        if (uploadErr) return res.status(500).json({ error: uploadErr.message });
        res.json({ message: 'File uploaded successfully', path: remoteFile });
      });
    });
  }).on('error', (err) => {
    res.status(500).json({ error: err.message });
  }).connect({ host, port: Number(port) || 22, username, password });
});

// ===== SFTP File Download Endpoint =====
app.get('/api/sftp/download', (req, res) => {
  const { host, port, username, password, targetPath } = req.query as any;
  if (!targetPath) return res.status(400).json({ error: 'targetPath required' });

  const ssh = new Client();
  ssh.on('ready', () => {
    ssh.sftp((err, sftp) => {
      if (err) {
        ssh.end();
        return res.status(500).json({ error: 'SFTP initialization failed' });
      }
      
      const fileName = targetPath.split('/').pop() || 'download';
      res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-type', 'application/octet-stream');

      const readStream = sftp.createReadStream(targetPath);
      readStream.on('error', (err: any) => {
        if (!res.headersSent) res.status(500).json({ error: err.message });
      });
      readStream.pipe(res).on('finish', () => ssh.end());
    });
  }).on('error', (err: any) => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }).connect({ host, port: Number(port) || 22, username, password });
});

// ===== FTP Endpoints =====

// FTP List Directory
app.post('/api/ftp/list', async (req, res) => {
  const { host, port, username, password, targetPath } = req.body;
  const client = new ftp.Client();
  client.ftp.verbose = false;
  
  try {
    await client.access({
      host,
      port: Number(port) || 21,
      user: username,
      password: password || '',
      secure: false
    });
    
    const list = await client.list(targetPath || '/');
    const simplifiedList = list.map(item => ({
      filename: item.name,
      longname: `${item.type === ftp.FileType.Directory ? 'd' : '-'}${item.permissions?.toString() || 'rwxr-xr-x'} ${item.user || '-'} ${item.group || '-'} ${item.size} ${item.rawModifiedAt || ''} ${item.name}`,
      isDirectory: item.type === ftp.FileType.Directory,
      size: item.size,
      mtime: item.modifiedAt ? Math.floor(item.modifiedAt.getTime() / 1000) : 0
    }));
    
    res.json({ path: targetPath || '/', list: simplifiedList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    client.close();
  }
});

// FTP Upload
app.post('/api/ftp/upload', upload.single('file'), async (req, res) => {
  const { file } = req;
  const { host, port, username, password, targetPath } = req.body;
  
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const client = new ftp.Client();
  try {
    await client.access({
      host,
      port: Number(port) || 21,
      user: username,
      password: password || '',
      secure: false
    });
    
    const remotePath = targetPath.endsWith('/') ? `${targetPath}${file.originalname}` : `${targetPath}/${file.originalname}`;
    await client.uploadFrom(file.path, remotePath);
    // Clean up temp file
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
    res.json({ message: 'File uploaded successfully', path: remotePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    client.close();
  }
});

// FTP Download
app.get('/api/ftp/download', async (req, res) => {
  const { host, port, username, password, targetPath } = req.query as any;
  if (!targetPath) return res.status(400).json({ error: 'targetPath required' });

  const client = new ftp.Client();
  try {
    await client.access({
      host,
      port: Number(port) || 21,
      user: username,
      password: password || '',
      secure: false
    });
    
    const fileName = targetPath.split('/').pop() || 'download';
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/octet-stream');
    
    await client.downloadTo(res as unknown as Writable, targetPath);
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  } finally {
    client.close();
  }
});

// FTP Delete
app.post('/api/ftp/delete', async (req, res) => {
  const { host, port, username, password, targetPath, isDirectory } = req.body;
  const client = new ftp.Client();
  try {
    await client.access({
      host,
      port: Number(port) || 21,
      user: username,
      password: password || '',
      secure: false
    });
    
    if (isDirectory) {
      await client.removeDir(targetPath);
    } else {
      await client.remove(targetPath);
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    client.close();
  }
});

// FTP Mkdir
app.post('/api/ftp/mkdir', async (req, res) => {
  const { host, port, username, password, targetPath } = req.body;
  const client = new ftp.Client();
  try {
    await client.access({
      host,
      port: Number(port) || 21,
      user: username,
      password: password || '',
      secure: false
    });
    await client.ensureDir(targetPath);
    res.json({ message: 'Directory created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    client.close();
  }
});

// FTP Rename
app.post('/api/ftp/rename', async (req, res) => {
  const { host, port, username, password, oldPath, newPath } = req.body;
  const client = new ftp.Client();
  try {
    await client.access({
      host,
      port: Number(port) || 21,
      user: username,
      password: password || '',
      secure: false
    });
    await client.rename(oldPath, newPath);
    res.json({ message: 'Renamed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    client.close();
  }
});

// ===== WebSocket for SSH Terminal =====
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to WebSocket');
  const ssh = new Client();
  let shellStream: any = null;
  let sftpSession: any = null;
  let telnetSocket: net.Socket | null = null;

  ws.on('message', (message: string) => {
    let data: any;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      return;
    }

    if (data.type === 'connect') {
      const { host, port, username, password, protocol } = data.payload;
      
      if (protocol === 'telnet') {
        // Telnet: raw TCP connection
        const telnetPort = port || 23;
        telnetSocket = net.createConnection({ host, port: telnetPort }, () => {
          ws.send(JSON.stringify({ type: 'status', payload: 'Connected' }));
          // Send username if provided (many telnet servers prompt for login)
          if (username) {
            setTimeout(() => telnetSocket?.write(username + '\r\n'), 500);
            if (password) {
              setTimeout(() => telnetSocket?.write(password + '\r\n'), 1500);
            }
          }
        });

        telnetSocket.on('data', (d: Buffer) => {
          ws.send(JSON.stringify({ type: 'data', payload: d.toString('utf-8') }));
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
        // SFTP-only connection (no shell)
        ssh.on('ready', () => {
          ws.send(JSON.stringify({ type: 'status', payload: 'SFTP Connected' }));
          
          ssh.sftp((err, sftp) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'error', payload: 'SFTP initialization failed' }));
              return;
            }
            sftpSession = sftp;
            ws.send(JSON.stringify({ type: 'sftp:ready' }));
          });
        }).on('error', (err: any) => {
          ws.send(JSON.stringify({ type: 'error', payload: err.message || err.level || 'SFTP Connection failed' }));
        }).connect({ host, port: port || 22, username, password });
        
      } else {
        // SSH connection with shell + SFTP
        ssh.on('ready', () => {
          ws.send(JSON.stringify({ type: 'status', payload: 'Connected' }));

          // Initialize SFTP Subsystem
          ssh.sftp((err, sftp) => {
            if (!err) {
              sftpSession = sftp;
              ws.send(JSON.stringify({ type: 'sftp:ready' }));
            }
          });

          ssh.shell({ term: 'xterm-256color' }, (err, stream) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'error', payload: 'Shell error' }));
              return;
            }

            shellStream = stream;

            // Handle shell output
            stream.on('data', (d: any) => {
              ws.send(JSON.stringify({ type: 'data', payload: d.toString('utf-8') }));
            }).on('close', () => {
              ssh.end();
              ws.send(JSON.stringify({ type: 'status', payload: 'Closed' }));
            });
          });
        }).on('error', (err: any) => {
          ws.send(JSON.stringify({ type: 'error', payload: err.message || err.level || 'Connection failed' }));
        }).connect({ host, port: port || 22, username, password });
      }
    }

    // Terminal data (SSH shell or Telnet)
    if (data.type === 'data') {
      if (shellStream) shellStream.write(data.payload);
      else if (telnetSocket) telnetSocket.write(data.payload);
    }

    // Terminal resize
    if (data.type === 'resize' && shellStream) {
      try {
        shellStream.setWindow(data.payload.rows, data.payload.cols, 0, 0);
      } catch (e) { /* ignore */ }
    }

    // ===== SFTP Operations via WebSocket =====
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

    // SFTP Delete
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

    // SFTP Rename
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

    // SFTP Mkdir
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

    // SFTP Stat (for file info)
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
    ssh.end();
    if (telnetSocket) { telnetSocket.destroy(); telnetSocket = null; }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});