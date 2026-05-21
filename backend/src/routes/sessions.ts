import { Router, Response } from 'express';
import { dbQuery, dbRun } from '../db';
import { encrypt } from '../crypto';
import { AuthenticatedRequest } from '../types';

export const sessionsRouter = Router();

sessionsRouter.get('/sessions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await dbQuery('SELECT id, name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp FROM sessions WHERE user_id = ?', [userId]);
    return res.json(rows.map(r => ({ ...r, password: r.password ? '***' : '' })));
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

sessionsRouter.post('/sessions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp, masterPassword } = req.body;
    let finalPassword = password || '';
    if (finalPassword && masterPassword) {
      finalPassword = encrypt(finalPassword, masterPassword);
    }
    const result = await dbRun(
      'INSERT INTO sessions (name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name || host, 
        host, 
        port || 22, 
        username, 
        finalPassword, 
        folder_id || null, 
        protocol || 'ssh', 
        auth_type || 'password', 
        private_key || null, 
        use_sftp !== undefined ? use_sftp : 1, 
        userId
      ]
    );
    return res.json({ id: result.lastID, message: 'Session saved' });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

sessionsRouter.put('/sessions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp, masterPassword } = req.body;
    
    // update folder only if that's the intention
    if (folder_id !== undefined && !host) {
      await dbRun('UPDATE sessions SET folder_id = ? WHERE id = ? AND user_id = ?', [folder_id, req.params.id, userId]);
    } else {
      // If password is masked ('***'), keep the existing one
      let finalPassword = password;
      if (password === '***' || password === undefined) {
        const existing = await dbQuery('SELECT password FROM sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
        finalPassword = existing[0]?.password || '';
      } else if (finalPassword && masterPassword) {
        finalPassword = encrypt(finalPassword, masterPassword);
      }
      await dbRun(
        'UPDATE sessions SET name=?, host=?, port=?, username=?, password=?, folder_id=?, protocol=?, auth_type=?, private_key=?, use_sftp=? WHERE id=? AND user_id=?',
        [
          name, 
          host, 
          port, 
          username, 
          finalPassword, 
          folder_id, 
          protocol || 'ssh', 
          auth_type || 'password', 
          private_key || null, 
          use_sftp !== undefined ? use_sftp : 1, 
          req.params.id, 
          userId
        ]
      );
    }
    return res.json({ message: 'Updated' });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

sessionsRouter.delete('/sessions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    await dbRun('DELETE FROM sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    return res.json({ message: 'Deleted' });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

sessionsRouter.get('/sessions/export/all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const sessions = await dbQuery('SELECT * FROM sessions WHERE user_id = ?', [userId]);
    const folders = await dbQuery('SELECT * FROM folders WHERE user_id = ?', [userId]);
    return res.json({ sessions, folders });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

sessionsRouter.post('/sessions/import', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessions, folders } = req.body;
    const folderIdMap: Record<number, number> = {};

    if (folders && Array.isArray(folders)) {
      for (const f of folders) {
        const resFolder = await dbRun('INSERT INTO folders (name, user_id) VALUES (?, ?)', [f.name, userId]);
        folderIdMap[f.id] = resFolder.lastID;
      }
      for (const f of folders) {
        if (f.parent_id && folderIdMap[f.parent_id]) {
           await dbRun('UPDATE folders SET parent_id = ? WHERE id = ? AND user_id = ?', [folderIdMap[f.parent_id], folderIdMap[f.id], userId]);
        }
      }
    }

    if (sessions && Array.isArray(sessions)) {
      for (const s of sessions) {
        const newFolderId = s.folder_id ? (folderIdMap[s.folder_id] || null) : null;
        await dbRun(
          'INSERT INTO sessions (name, host, port, username, password, folder_id, protocol, auth_type, private_key, use_sftp, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            s.name, 
            s.host, 
            s.port, 
            s.username, 
            s.password, 
            newFolderId, 
            s.protocol, 
            s.auth_type, 
            s.private_key, 
            s.use_sftp, 
            userId
          ]
        );
      }
    }

    return res.json({ message: 'Import successful' });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

// Get full session details (with password) for connection
sessionsRouter.get('/sessions/:id/connect', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await dbQuery('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    return res.json(rows[0]);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

// Connection History (mantido junto com sessions por contexto de histórico de sessões)
sessionsRouter.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await dbQuery('SELECT * FROM connection_log ORDER BY connected_at DESC LIMIT 50');
    return res.json(rows);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});
