import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { dbQuery, dbRun } from '../db';
import { generateToken } from '../middlewares/auth';
import { hashMasterPassword, verifyMasterPassword, decrypt } from '../crypto';
import { AuthenticatedRequest } from '../types';

export const authRouter = Router();

// Rota pública de login
authRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await dbQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.json({ 
          token: generateToken({ id: user.id, username: user.username, role: user.role }), 
          username: user.username, 
          role: user.role 
        });
      }
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// A partir daqui, as rotas de vault requerem autenticação (feita pelo middleware global ou local)
authRouter.get('/vault/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const users = await dbQuery('SELECT master_password_hash FROM users WHERE id = ?', [userId]);
    const hasVault = !!(users[0]?.master_password_hash);
    return res.json({ hasVault });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

authRouter.post('/vault/setup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { masterPassword } = req.body;
    const userId = req.user?.id;
    if (!masterPassword || masterPassword.length < 4) {
      return res.status(400).json({ error: 'Master password must be at least 4 characters' });
    }
    const users = await dbQuery('SELECT master_password_hash FROM users WHERE id = ?', [userId]);
    if (users[0]?.master_password_hash) {
      return res.status(400).json({ error: 'Master password already set. Use change endpoint.' });
    }
    const hash = hashMasterPassword(masterPassword);
    await dbRun('UPDATE users SET master_password_hash = ? WHERE id = ?', [hash, userId]);
    return res.json({ message: 'Master password set successfully' });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

authRouter.post('/vault/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { masterPassword } = req.body;
    const userId = req.user?.id;
    const users = await dbQuery('SELECT master_password_hash FROM users WHERE id = ?', [userId]);
    if (!users[0]?.master_password_hash) {
      return res.json({ valid: true, noVault: true });
    }
    const valid = verifyMasterPassword(masterPassword, users[0].master_password_hash);
    return res.json({ valid });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

// Descriptografar senha da sessão (com master password)
authRouter.post('/sessions/:id/decrypt', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { masterPassword } = req.body;
    const rows = await dbQuery('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = rows[0];
    if (session.password && masterPassword) {
      try {
        const decrypted = decrypt(session.password, masterPassword);
        session.password = decrypted || session.password;
      } catch { /* ignore if not encrypted or wrong password */ }
    }
    return res.json(session);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});
