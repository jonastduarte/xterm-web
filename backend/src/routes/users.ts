import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { dbQuery, dbRun } from '../db';
import { requireAdmin } from '../middlewares/auth';
import { AuthenticatedRequest } from '../types';

export const usersRouter = Router();

// Todas as rotas de gerenciamento de usuários exigem autenticação prévia
// E a maioria exige requireAdmin, exceto o PUT para alteração do próprio usuário.

usersRouter.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await dbQuery('SELECT id, username, role FROM users');
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

usersRouter.post('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, passwordHash, role || 'user']);
    return res.json({ id: result.lastID, message: 'User created' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

usersRouter.put('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user;
  if (!reqUser) return res.status(401).json({ error: 'Unauthorized' });

  const targetId = parseInt(req.params.id);
  // Permite apenas se for admin ou o próprio usuário alterando a si mesmo
  if (reqUser.role !== 'admin' && reqUser.id !== targetId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { username, password, role } = req.body;
    const updateRole = reqUser.role === 'admin' && role ? role : undefined;
    
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      if (updateRole) {
        await dbRun('UPDATE users SET username=?, password=?, role=? WHERE id=?', [username, passwordHash, updateRole, targetId]);
      } else {
        await dbRun('UPDATE users SET username=?, password=? WHERE id=?', [username, passwordHash, targetId]);
      }
    } else {
       if (updateRole) {
         await dbRun('UPDATE users SET username=?, role=? WHERE id=?', [username, updateRole, targetId]);
       } else {
         await dbRun('UPDATE users SET username=? WHERE id=?', [username, targetId]);
       }
    }
    return res.json({ message: 'User updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

usersRouter.delete('/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetId = parseInt(req.params.id);
  if (targetId === 1) return res.status(400).json({ error: 'Cannot delete admin' });

  try {
    await dbRun('DELETE FROM users WHERE id = ?', [targetId]);
    await dbRun('DELETE FROM sessions WHERE user_id = ?', [targetId]);
    await dbRun('DELETE FROM folders WHERE user_id = ?', [targetId]);
    return res.json({ message: 'User deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
